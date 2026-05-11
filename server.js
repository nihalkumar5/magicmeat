const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const mysql = require("mysql2/promise");
const formidable = require("formidable");
require("dotenv").config();

const root = __dirname;
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

const defaultCategories = [
  { id: "chicken", name: "Chicken", icon: "CHK" },
  { id: "mutton", name: "Mutton", icon: "MTN" },
  { id: "fish", name: "Fish", icon: "FSH" },
  { id: "eggs", name: "Eggs", icon: "EGG" },
  { id: "grocery", name: "Grocery", icon: "GRY" },
  { id: "veggies", name: "Vegetables", icon: "VEG" },
  { id: "dairy", name: "Dairy", icon: "DRY" },
  { id: "frozen", name: "Frozen", icon: "FRZ" }
];

async function ensureAuxTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100),
      icon VARCHAR(100)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS offers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tag VARCHAR(50),
      title VARCHAR(100),
      subtext VARCHAR(255),
      code VARCHAR(50),
      color VARCHAR(20),
      emoji VARCHAR(10),
      image VARCHAR(255)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      text TEXT,
      rating INT DEFAULT 5
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      k VARCHAR(50) PRIMARY KEY,
      v TEXT
    )
  `);
  await pool.query(
    "INSERT IGNORE INTO settings (k, v) VALUES (?, ?), (?, ?), (?, ?), (?, ?)",
    [
      "phone_number", "+919876543210",
      "marquee_text", "Flat ₹100 off above ₹599\nFresh delivery in 25-31 minutes\nCold-packed meat and essentials at your doorstep",
      "free_delivery_threshold", "499",
      "delivery_fee", "29"
    ]
  );
  // Ensure orders table has required columns
  try { await pool.query("ALTER TABLE orders ADD COLUMN paymentMethod VARCHAR(50) DEFAULT 'COD'"); } catch(e) {}
  try { await pool.query("ALTER TABLE orders ADD COLUMN paymentId VARCHAR(100) DEFAULT ''"); } catch(e) {}
}

async function readSettings() {
  await ensureAuxTables();
  const [rows] = await pool.query("SELECT * FROM settings");
  return rows.reduce((acc, row) => {
    acc[row.k] = row.v;
    return acc;
  }, {});
}

async function readCategories() {
  await ensureAuxTables();
  const [rows] = await pool.query("SELECT * FROM categories");
  return rows.length ? rows : defaultCategories;
}

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
  res.writeHead(status, { 
    "Content-Type": type,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  });
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
    console.log("Upload request received");
    if (!isAdmin(req)) {
      console.log("Upload failed: Unauthorized");
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    
    const uploadDir = path.join(root, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024 // 10MB
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable error:", err);
        return sendJson(res, 400, { error: "Upload failed: " + err.message });
      }
      
      const file = files.image && Array.isArray(files.image) ? files.image[0] : files.image;
      if (!file) {
        console.log("Upload failed: No file in 'image' field");
        console.log("Fields received:", Object.keys(fields));
        console.log("Files received:", Object.keys(files));
        return sendJson(res, 400, { error: "No file uploaded" });
      }
      
      const fileName = path.basename(file.filepath);
      console.log("File uploaded successfully:", fileName);
      sendJson(res, 200, { url: `/uploads/${fileName}` });
    });
    return true;
  }

  // PUBLIC: GET STORE DATA
  if (req.method === "GET" && pathname === "/api/store") {
    try {
      await ensureAuxTables();
      const [products] = await pool.query("SELECT * FROM products");
      const categories = await readCategories();
      const [featuredOffers] = await pool.query("SELECT * FROM offers");
      const [testimonials] = await pool.query("SELECT * FROM testimonials");
      const settings = await readSettings();
      sendJson(res, 200, { categories, products, featuredOffers, testimonials, settings });
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
      const [orders] = await pool.query("SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC", [phone]);
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

        const pm = payload.paymentMethod || 'COD';
        const pid = payload.paymentId || '';
        const promoCode = payload.promoCode || null;
        const discount = Number(payload.discount) || 0;
        const adjustedTotal = Math.max(0, finalTotal - discount);

        await conn.query(
          "INSERT INTO orders (id, customerName, phone, address, total, items, status, paymentMethod, paymentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [orderId, payload.customerName, payload.phone, payload.address, adjustedTotal, JSON.stringify(items), 'placed', pm, pid]
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
      await ensureAuxTables();
      const [orders] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
      const [products] = await pool.query("SELECT * FROM products");
      const categories = await readCategories();
      const [offers] = await pool.query("SELECT * FROM offers");
      const [testimonials] = await pool.query("SELECT * FROM testimonials");
      const [revenueRow] = await pool.query("SELECT SUM(total) as rev FROM orders WHERE status = 'delivered'");
      
      sendJson(res, 200, {
        stats: { orders: orders.length, products: products.length, revenue: revenueRow[0].rev || 0 },
        categories,
        products,
        orders,
        offers,
        testimonials
      });
    } catch (e) {
      sendJson(res, 500, { error: "Database error" });
    }
    return true;
  }

  // ADMIN: SETTINGS
  if (req.method === "GET" && pathname === "/api/admin/settings") {
    try {
      sendJson(res, 200, await readSettings());
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "POST" && pathname === "/api/admin/settings") {
    try {
      await ensureAuxTables();
      const payload = await parseBody(req);
      for (const [key, value] of Object.entries(payload)) {
        await pool.query(
          "INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)",
          [key, String(value ?? "")]
        );
      }
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  // ADMIN: CATEGORY CRUD
  if (req.method === "POST" && pathname === "/api/admin/categories") {
    try {
      await ensureAuxTables();
      const payload = await parseBody(req);
      const id = String(payload.name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (!id) return sendJson(res, 400, { error: "Category name is required" });
      await pool.query(
        "INSERT INTO categories (id, name, icon) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon)",
        [id, payload.name, payload.icon || ""]
      );
      sendJson(res, 201, { id });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/admin/categories/")) {
    try {
      const id = decodeURIComponent(pathname.split("/").pop());
      await pool.query("DELETE FROM categories WHERE id=?", [id]);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  // ADMIN: OFFERS CRUD
  if (req.method === "POST" && pathname === "/api/admin/offers") {
    try {
      await ensureAuxTables();
      const offer = await parseBody(req);
      await pool.query(
        "INSERT INTO offers (tag, title, subtext, code, color, emoji, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [offer.tag, offer.title, offer.subtext, offer.code, offer.color, offer.emoji || "", offer.image || ""]
      );
      sendJson(res, 201, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "PUT" && pathname.startsWith("/api/admin/offers/")) {
    try {
      const id = pathname.split("/").pop();
      const offer = await parseBody(req);
      await pool.query(
        "UPDATE offers SET tag=?, title=?, subtext=?, code=?, color=?, emoji=?, image=? WHERE id=?",
        [offer.tag, offer.title, offer.subtext, offer.code, offer.color, offer.emoji || "", offer.image || "", id]
      );
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/admin/offers/")) {
    try {
      const id = pathname.split("/").pop();
      await pool.query("DELETE FROM offers WHERE id=?", [id]);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  // ADMIN: TESTIMONIALS CRUD
  if (req.method === "POST" && pathname === "/api/admin/testimonials") {
    try {
      await ensureAuxTables();
      const payload = await parseBody(req);
      await pool.query(
        "INSERT INTO testimonials (name, text, rating) VALUES (?, ?, ?)",
        [payload.name, payload.text, Number(payload.rating || 5)]
      );
      sendJson(res, 201, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/admin/testimonials/")) {
    try {
      const id = pathname.split("/").pop();
      await pool.query("DELETE FROM testimonials WHERE id=?", [id]);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  // ADMIN: PRODUCT CRUD
  if (req.method === "POST" && pathname === "/api/admin/products") {
    try {
      const p = await parseBody(req);
      const id = `p-${randomUUID()}`;
      const mrp = p.mrp || p.price;
      console.log("Adding product:", p.name);
      await pool.query(
        "INSERT INTO products (id, name, category, price, mrp, unit, emoji, image, stock, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, p.name, p.category, p.price, mrp, p.unit, p.emoji, p.image, p.stock, p.description, p.rating || 4.7]
      );
      sendJson(res, 201, { id, ...p });
    } catch (e) {
      console.error("Product creation error:", e);
      sendJson(res, 500, { error: e.message });
    }
    return true;
  }

  if (req.method === "PUT" && pathname.startsWith("/api/admin/products/")) {
    try {
      const id = decodeURIComponent(pathname.split("/").pop());
      const p = await parseBody(req);
      const mrp = p.mrp || p.price;
      console.log("Updating product:", id, p.name);
      await pool.query(
        "UPDATE products SET name=?, category=?, price=?, mrp=?, unit=?, emoji=?, image=?, stock=?, description=?, rating=? WHERE id=?",
        [p.name, p.category, p.price, mrp, p.unit, p.emoji, p.image, p.stock, p.description, p.rating, id]
      );
      sendJson(res, 200, { ok: true });
    } catch (e) {
      console.error("Product update error:", e);
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

  // API routes
  if (await routeApi(req, res, url)) return;

  // Static files from /public/
  let requestedPath = url.pathname;
  if (requestedPath === "/") requestedPath = "/index.html";
  if (requestedPath === "/admin") requestedPath = "/admin.html";
  
  // Try /public/ first, then root directory
  const publicPath = path.join(root, "public", requestedPath);
  const rootPath = path.join(root, requestedPath);

  fs.readFile(publicPath, (err, content) => {
    if (!err) return send(res, 200, content, types[path.extname(publicPath)] || "application/octet-stream");
    // Fallback to root
    fs.readFile(rootPath, (err2, content2) => {
      if (err2) return send(res, 404, "Not found");
      send(res, 200, content2, types[path.extname(rootPath)] || "application/octet-stream");
    });
  });
});

server.listen(port, () => console.log(`MagicMeat v3.0 running at http://localhost:${port}`));
