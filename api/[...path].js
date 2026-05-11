const { getPool } = require('../lib/db');
const crypto = require('crypto');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'magicmeat-admin-token';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache'
};

function isAdmin(req) {
  const auth = req.headers.authorization || '';
  return auth === `Bearer ${ADMIN_TOKEN}`;
}

async function ensureTables(pool) {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS categories (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), icon VARCHAR(100))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, name VARCHAR(255), category VARCHAR(50), price DECIMAL(10,2), mrp DECIMAL(10,2), unit VARCHAR(50), emoji VARCHAR(10), image VARCHAR(255), stock INT DEFAULT 0, description TEXT, rating DECIMAL(3,1) DEFAULT 4.7, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS orders (id VARCHAR(50) PRIMARY KEY, customerName VARCHAR(255), phone VARCHAR(20), address TEXT, total DECIMAL(10,2), items TEXT, status VARCHAR(50) DEFAULT 'placed', paymentMethod VARCHAR(50) DEFAULT 'COD', paymentId VARCHAR(100), createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS offers (id INT AUTO_INCREMENT PRIMARY KEY, tag VARCHAR(50), title VARCHAR(100), subtext VARCHAR(255), code VARCHAR(50), discount_type ENUM('fixed','percent') DEFAULT 'fixed', discount_value DECIMAL(10,2) DEFAULT 0, min_order_amount DECIMAL(10,2) DEFAULT 0, color VARCHAR(20), emoji VARCHAR(10), image VARCHAR(255))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS testimonials (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), text TEXT, rating INT DEFAULT 5)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS settings (k VARCHAR(50) PRIMARY KEY, v TEXT)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), phone VARCHAR(20) UNIQUE, password_hash VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    
    // Seed basic settings
    await pool.query(`INSERT IGNORE INTO settings (k, v) VALUES ('phone_number', '+919876543210'), ('free_delivery_threshold', '499'), ('delivery_fee', '29')`);
    
    // Seed categories
    await pool.query(`INSERT IGNORE INTO categories (id, name, icon) VALUES 
      ('chicken', 'Chicken', '🍗'),
      ('mutton', 'Mutton', '🥩'),
      ('fish', 'Fish', '🐟'),
      ('eggs', 'Eggs', '🥚'),
      ('veggies', 'Vegetables', '🥬'),
      ('dairy', 'Dairy', '🧈')`);
  } catch (err) {
    console.error('ensureTables failed:', err.message);
    throw err;
  }
}

async function readSettings(pool) {
  const [rows] = await pool.query('SELECT * FROM settings');
  const settings = {};
  for (const r of rows) settings[r.k] = r.v;
  return settings;
}

async function readCategories(pool) {
  const [rows] = await pool.query('SELECT * FROM categories');
  if (rows.length) return rows;
  return [
    { id: 'chicken', name: 'Chicken', icon: '' },
    { id: 'mutton', name: 'Mutton', icon: '' },
    { id: 'fish', name: 'Fish', icon: '' },
    { id: 'eggs', name: 'Eggs', icon: '' }
  ];
}

module.exports = async (req, res) => {
  // Set CORS
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pool = getPool();
  
  // Non-blocking table setup — don't let migrations kill the API
  try { await ensureTables(pool); } catch(e) { console.error('ensureTables warning:', e.message); }

  // Build route - parse from URL directly (most reliable on Vercel)
  const parsedUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  // Remove /api/ prefix to get the route
  const route = pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  const method = req.method;
  const body = req.body || {};
  
  console.log(`[API] ${method} ${pathname} → route: "${route}"`);

  try {
    // ═══════════════════════════════════════
    // PUBLIC ROUTES
    // ═══════════════════════════════════════

    // GET /api/store
    if (method === 'GET' && route === 'store') {
      const [products] = await pool.query('SELECT * FROM products');
      const categories = await readCategories(pool);
      const [offers] = await pool.query('SELECT * FROM offers');
      const [testimonials] = await pool.query('SELECT * FROM testimonials');
      const settings = await readSettings(pool);
      return res.json({ categories, products, featuredOffers: offers, testimonials, settings });
    }

    // GET /api/init (Initialize tables)
    if (method === 'GET' && route === 'init') {
      await ensureTables(pool);
      return res.json({ ok: true, message: 'Database initialized' });
    }

    // GET /api/test (Connection test)
    if (method === 'GET' && route === 'test') {
      try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        return res.json({ ok: true, message: 'Connection successful', result: rows[0].result });
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message, stack: err.stack });
      }
    }

    // GET /api/orders?phone=xxx
    if (method === 'GET' && route === 'orders') {
      const phone = parsedUrl.searchParams.get('phone') || req.query?.phone || '';
      if (!phone) return res.json([]);
      try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE phone = ? ORDER BY createdAt DESC', [phone]);
        return res.json(orders);
      } catch (e) {
        console.error('Orders query error:', e.message);
        // Fallback: try without ORDER BY in case column name differs
        try {
          const [orders] = await pool.query('SELECT * FROM orders WHERE phone = ?', [phone]);
          return res.json(orders);
        } catch (e2) {
          return res.status(500).json({ error: e2.message });
        }
      }
    }

    // POST /api/orders
    if (method === 'POST' && route === 'orders') {
      const conn = await pool.getConnection();
      await conn.beginTransaction();
      try {
        const orderId = `ord-${Date.now()}`;
        const items = body.items || [];
        let total = 0;

        for (const item of items) {
          const [rows] = await conn.query('SELECT price, stock, name FROM products WHERE id = ?', [item.productId]);
          if (!rows.length) throw new Error(`Product ${item.productId} not found`);
          const p = rows[0];
          if (p.stock < item.quantity) throw new Error(`${p.name} out of stock`);
          total += Number(p.price) * item.quantity;
          await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
        }

        const settings = await readSettings(pool);
        const freeAbove = Number(settings.free_delivery_threshold || 499);
        const delFee = Number(settings.delivery_fee || 29);
        const fee = total >= freeAbove ? 0 : delFee;
        const discount = Number(body.discount) || 0;
        const finalTotal = Math.max(0, total + fee - discount);

        const pm = body.paymentMethod || 'COD';
        const pid = body.paymentId || '';

        await conn.query(
          'INSERT INTO orders (id, customerName, phone, address, total, items, status, paymentMethod, paymentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [orderId, body.customerName, body.phone, body.address, finalTotal, JSON.stringify(items), 'placed', pm, pid]
        );

        await conn.commit();
        return res.status(201).json({ id: orderId, total: finalTotal });
      } catch (e) {
        await conn.rollback();
        return res.status(400).json({ error: e.message });
      } finally {
        conn.release();
      }
    }

    // POST /api/auth/register
    if (method === 'POST' && route === 'auth/register') {
      const { name, phone, password } = body;
      if (!name || !phone || !password) return res.status(400).json({ error: 'Missing fields' });
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(password, 10);
      try {
        const [result] = await pool.query('INSERT INTO users (name, phone, password_hash) VALUES (?, ?, ?)', [name, phone, hash]);
        const token = Buffer.from(`${result.insertId}:${Date.now()}`).toString('base64');
        return res.json({ token, user: { id: result.insertId, name, phone } });
      } catch (e) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    // POST /api/auth/login
    if (method === 'POST' && route === 'auth/login') {
      const { phone, password } = body;
      const [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
      if (!users.length) return res.status(401).json({ error: 'Invalid phone or password' });
      const bcrypt = require('bcryptjs');
      const valid = await bcrypt.compare(password, users[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid phone or password' });
      const user = users[0];
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      return res.json({ token, user: { id: user.id, name: user.name, phone: user.phone } });
    }

    // ═══════════════════════════════════════
    // ADMIN ROUTES
    // ═══════════════════════════════════════

    // POST /api/admin/login
    if (method === 'POST' && route === 'admin/login') {
      if (body.username === ADMIN_USER && body.password === ADMIN_PASS) {
        return res.json({ token: ADMIN_TOKEN });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Auth check for all other admin routes
    if (route.startsWith('admin/') && !isAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET /api/admin/dashboard
    if (method === 'GET' && route === 'admin/dashboard') {
      const [orders] = await pool.query('SELECT * FROM orders ORDER BY createdAt DESC');
      const [products] = await pool.query('SELECT * FROM products');
      const categories = await readCategories(pool);
      const [offers] = await pool.query('SELECT * FROM offers');
      const [testimonials] = await pool.query('SELECT * FROM testimonials');
      const [rev] = await pool.query("SELECT SUM(total) as rev FROM orders WHERE status='delivered'");
      return res.json({
        stats: { orders: orders.length, products: products.length, revenue: rev[0].rev || 0 },
        categories, products, orders, offers, testimonials
      });
    }

    // GET /api/admin/settings
    if (method === 'GET' && route === 'admin/settings') {
      return res.json(await readSettings(pool));
    }

    // POST /api/admin/settings
    if (method === 'POST' && route === 'admin/settings') {
      for (const [key, value] of Object.entries(body)) {
        await pool.query('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [key, String(value ?? '')]);
      }
      return res.json({ ok: true });
    }

    // POST /api/admin/categories
    if (method === 'POST' && route === 'admin/categories') {
      const id = String(body.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await pool.query('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon)', [id, body.name, body.icon || '']);
      return res.status(201).json({ id });
    }

    // DELETE /api/admin/categories/:id
    if (method === 'DELETE' && route.startsWith('admin/categories/')) {
      const id = route.split('/').pop();
      await pool.query('DELETE FROM categories WHERE id=?', [id]);
      return res.json({ ok: true });
    }

    // POST /api/admin/offers
    if (method === 'POST' && route === 'admin/offers') {
      await pool.query(
        'INSERT INTO offers (tag, title, subtext, code, discount_type, discount_value, min_order_amount, color, emoji, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [body.tag, body.title, body.subtext, body.code, body.discount_type || 'fixed', body.discount_value || 0, body.min_order_amount || 0, body.color, body.emoji || '', body.image || '']
      );
      return res.status(201).json({ ok: true });
    }

    // PUT /api/admin/offers/:id
    if (method === 'PUT' && route.startsWith('admin/offers/')) {
      const id = route.split('/').pop();
      await pool.query(
        'UPDATE offers SET tag=?, title=?, subtext=?, code=?, discount_type=?, discount_value=?, min_order_amount=?, color=?, emoji=?, image=? WHERE id=?',
        [body.tag, body.title, body.subtext, body.code, body.discount_type || 'fixed', body.discount_value || 0, body.min_order_amount || 0, body.color, body.emoji || '', body.image || '', id]
      );
      return res.json({ ok: true });
    }

    // DELETE /api/admin/offers/:id
    if (method === 'DELETE' && route.startsWith('admin/offers/')) {
      const id = route.split('/').pop();
      await pool.query('DELETE FROM offers WHERE id=?', [id]);
      return res.json({ ok: true });
    }

    // POST /api/admin/testimonials
    if (method === 'POST' && route === 'admin/testimonials') {
      await pool.query('INSERT INTO testimonials (name, text, rating) VALUES (?, ?, ?)', [body.name, body.text, Number(body.rating || 5)]);
      return res.status(201).json({ ok: true });
    }

    // DELETE /api/admin/testimonials/:id
    if (method === 'DELETE' && route.startsWith('admin/testimonials/')) {
      const id = route.split('/').pop();
      await pool.query('DELETE FROM testimonials WHERE id=?', [id]);
      return res.json({ ok: true });
    }

    // POST /api/admin/products
    if (method === 'POST' && route === 'admin/products') {
      const id = `p-${crypto.randomUUID()}`;
      const mrp = body.mrp || body.price;
      await pool.query(
        'INSERT INTO products (id, name, category, price, mrp, unit, emoji, image, stock, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, body.name, body.category, body.price, mrp, body.unit, body.emoji, body.image, body.stock, body.description, body.rating || 4.7]
      );
      return res.status(201).json({ id });
    }

    // PUT /api/admin/products/:id
    if (method === 'PUT' && route.startsWith('admin/products/')) {
      const id = route.split('/').pop();
      const mrp = body.mrp || body.price;
      await pool.query(
        'UPDATE products SET name=?, category=?, price=?, mrp=?, unit=?, emoji=?, image=?, stock=?, description=?, rating=? WHERE id=?',
        [body.name, body.category, body.price, mrp, body.unit, body.emoji, body.image, body.stock, body.description, body.rating, id]
      );
      return res.json({ ok: true });
    }

    // PATCH /api/admin/products/:id
    if (method === 'PATCH' && route.startsWith('admin/products/')) {
      const id = route.split('/').pop();
      const fields = Object.keys(body).map(k => `${k}=?`).join(', ');
      const values = [...Object.values(body), id];
      await pool.query(`UPDATE products SET ${fields} WHERE id=?`, values);
      return res.json({ ok: true });
    }

    // DELETE /api/admin/products/:id
    if (method === 'DELETE' && route.startsWith('admin/products/')) {
      const id = route.split('/').pop();
      await pool.query('DELETE FROM products WHERE id=?', [id]);
      return res.json({ ok: true });
    }

    // PATCH /api/admin/orders/:id
    if (method === 'PATCH' && route.startsWith('admin/orders/')) {
      const id = route.split('/').pop();
      await pool.query('UPDATE orders SET status=? WHERE id=?', [body.status, id]);
      return res.json({ ok: true });
    }

    // 404
    return res.status(404).json({ error: 'Route not found', route });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
