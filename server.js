const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const mysql = require("mysql2/promise");
const formidable = require("formidable");
require("dotenv").config();

const root = path.join(__dirname, "www");
const port = process.env.PORT || 3000;
const adminToken = process.env.ADMIN_TOKEN || "magicmeat-admin-token";

// Database Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), "application/json; charset=utf-8");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function isAdmin(req) {
  return req.headers.authorization === `Bearer ${adminToken}`;
}

async function routeApi(req, res, url) {
  const pathname = url.pathname;

  // ADMIN: IMAGE UPLOAD
  if (req.method === "POST" && pathname === "/api/admin/upload") {
    if (!isAdmin(req)) return sendJson(res, 401, { error: "Unauthorized" });
    
    const uploadDir = path.join(root, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024 // 5MB
    });

    form.parse(req, (err, fields, files) => {
      if (err) return sendJson(res, 400, { error: "Upload failed" });
      const file = files.image && files.image[0] ? files.image[0] : files.image;
      if (!file) return sendJson(res, 400, { error: "No file uploaded" });
      
      const fileName = path.basename(file.filepath);
      sendJson(res, 200, { url: `/uploads/${fileName}` });
    });
    return true;
  }

  // PUBLIC: GET STORE DATA
  if (req.method === "GET" && pathname === "/api/store") {
    try {
      const [products] = await pool.query("SELECT * FROM products");
      // Hardcoded categories if table doesn't exist, otherwise fetch from categories table
      const categories = [
        { id: "chicken", name: "Chicken" },
        { id: "mutton", name: "Mutton" },
        { id: "fish", name: "Fish" },
        { id: "eggs", name: "Eggs" },
        { id: "grocery", name: "Grocery" },
        { id: "veggies", name: "Vegetables" }
      ];
      sendJson(res, 200, { categories, products, featuredOffers: [] });
    } catch (e) {
      console.error(e);
      sendJson(res, 500, { error: "Database error" });
    }
    return true;
  }

  // PUBLIC: GET USER ORDERS
  if (req.method === "GET" && pathname === "/api/orders") {
    const phone = url.searchParams.get("phone");
    if (!phone) return sendJson(res, 200, []);
    try {
      const [orders] = await pool.query("SELECT * FROM orders WHERE phone = ? ORDER BY createdAt DESC", [phone]);
      sendJson(res, 200, orders);
    } catch (e) {
      sendJson(res, 500, { error: "Database error" });
    }
    return true;
  }

  // PUBLIC: PLACE ORDER
  if (req.method === "POST" && pathname === "/api/orders") {
    try {
      const payload = await parseBody(req);
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        const orderId = `ord-${Date.now()}`;
        const items = payload.items || [];
        
        // Calculate Total and Validate Stock
        let total = 0;
        for (const item of items) {
          const [rows] = await conn.query("SELECT price, stock, name FROM products WHERE id = ?", [item.productId]);
          if (!rows.length) throw new Error(`Product ${item.productId} not found`);
          const p = rows[0];
          if (p.stock < item.quantity) throw new Error(`${p.name} out of stock`);
          
          total += p.price * item.quantity;
          // Decrement Stock
          await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.productId]);
        }
        
        const deliveryFee = total >= 299 ? 0 : 29;
        const finalTotal = total + deliveryFee;

        await conn.query(
          "INSERT INTO orders (id, customerName, phone, address, total, items, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [orderId, payload.customerName, payload.phone, payload.address, finalTotal, JSON.stringify(items), 'placed']
        );

        await conn.commit();
        sendJson(res, 201, { id: orderId, total: finalTotal });
      } catch (e) {
        await conn.rollback();
        sendJson(res, 400, { error: e.message });
      } finally {
        conn.release();
      }
    } catch (e) {
      sendJson(res, 500, { error: "Transaction failed" });
    }
    return true;
  }

  // ADMIN: LOGIN
  if (req.method === "POST" && pathname === "/api/admin/login") {
    try {
      const payload = await parseBody(req);
      if (payload.username === process.env.ADMIN_USER && payload.password === process.env.ADMIN_PASS) {
        return sendJson(res, 200, { token: adminToken });
      }
      sendJson(res, 401, { error: "Invalid credentials" });
    } catch (e) {
      sendJson(res, 400, { error: "Invalid payload" });
    }
    return true;
  }

  // AUTH CHECK FOR ADMIN ROUTES
  if (pathname.startsWith("/api/admin/") && !isAdmin(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return true;
  }

  // ADMIN: DASHBOARD
  if (req.method === "GET" && pathname === "/api/admin/dashboard") {
    try {
      const [orders] = await pool.query("SELECT * FROM orders ORDER BY createdAt DESC");
      const [products] = await pool.query("SELECT * FROM products");
      const [revenueRow] = await pool.query("SELECT SUM(total) as rev FROM orders WHERE status = 'delivered'");
      
      sendJson(res, 200, {
        stats: { orders: orders.length, products: products.length, revenue: revenueRow[0].rev || 0 },
        categories: [{ id: "chicken", name: "Chicken" }, { id: "mutton", name: "Mutton" }, { id: "fish", name: "Fish" }, { id: "eggs", name: "Eggs" }, { id: "grocery", name: "Grocery" }],
        products,
        orders
      });
    } catch (e) {
      sendJson(res, 500, { error: "Database error" });
    }
    return true;
  }

  // ADMIN: PRODUCT CRUD
  if (req.method === "POST" && pathname === "/api/admin/products") {
    try {
      const p = await parseBody(req);
      const id = `p-${randomUUID()}`;
      await pool.query(
        "INSERT INTO products (id, name, category, price, unit, emoji, image, stock, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, p.name, p.category, p.price, p.unit, p.emoji, p.image, p.stock, p.description, p.rating || 4.7]
      );
      sendJson(res, 201, { id, ...p });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "PUT" && pathname.startsWith("/api/admin/products/")) {
    try {
      const id = pathname.split("/").pop();
      const p = await parseBody(req);
      await pool.query(
        "UPDATE products SET name=?, category=?, price=?, unit=?, emoji=?, image=?, stock=?, description=?, rating=? WHERE id=?",
        [p.name, p.category, p.price, p.unit, p.emoji, p.image, p.stock, p.description, p.rating, id]
      );
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "PATCH" && pathname.startsWith("/api/admin/products/")) {
    try {
      const id = pathname.split("/").pop();
      const p = await parseBody(req);
      const fields = Object.keys(p).map(k => `${k}=?`).join(", ");
      const values = [...Object.values(p), id];
      await pool.query(`UPDATE products SET ${fields} WHERE id=?`, values);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/admin/products/")) {
    try {
      const id = pathname.split("/").pop();
      await pool.query("DELETE FROM products WHERE id=?", [id]);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  // ADMIN: ORDER STATUS
  if (req.method === "PATCH" && pathname.startsWith("/api/admin/orders/")) {
    try {
      const id = pathname.split("/").pop();
      const p = await parseBody(req);
      await pool.query("UPDATE orders SET status = ? WHERE id = ?", [p.status, id]);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // Support for PHP-style routing api.php?path=...
  if (url.pathname === "/api.php") {
    const phpPath = url.searchParams.get("path");
    if (phpPath) {
      // Mock the pathname for routeApi
      const mockUrl = new URL(url.href);
      mockUrl.pathname = "/api/" + phpPath;
      if (await routeApi(req, res, mockUrl)) return;
    }
  }

  if (await routeApi(req, res, url)) return;

  const requestedPath = url.pathname === "/" ? "/index.html" : (url.pathname === "/admin" ? "/admin.html" : url.pathname);
  const filePath = path.join(root, requestedPath);

  fs.readFile(filePath, (err, content) => {
    if (err) return send(res, 404, "Not found");
    send(res, 200, content, types[path.extname(filePath)] || "application/octet-stream");
  });
});

server.listen(port, () => console.log(`MagicMeat (MySQL) running at http://localhost:${port}`));
