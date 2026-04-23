/* MagicMeat Admin Panel — Fully Functional with Supabase Backend */

// ─── SUPABASE CONFIG ───
const SB_URL = "https://cchrlbgffpqauwgzszia.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHJsYmdmZnBxYXV3Z3pzemlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjIwNzgsImV4cCI6MjA5MjUzODA3OH0.UQAQohGU9VQ6R6z9rRMZFLuZxt2KFVAusOaU5GydlXA";
const supabase = window.supabase.createClient(SB_URL, SB_KEY);

// ─── STATE ───
let products = [];
let categories = [];
let orders = [];
let settings = { storeName: "MagicMeat", waNumber: "+919999999999", freeDelivery: 499, deliveryFee: 49, password: "admin123" };

// ─── DOM ───
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Toast
const toastEl = document.createElement("div");
toastEl.className = "admin-toast";
document.body.appendChild(toastEl);
let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2500); }

// ─── FETCH DATA ───
async function fetchAll() {
  try {
    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data: cats } = await supabase.from('categories').select('*').order('id');
    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: sets } = await supabase.from('settings').select('*');

    if (prods) products = prods;
    if (cats) categories = cats;
    if (ords) orders = ords;
    if (sets) {
      sets.forEach(s => {
        if (s.key === 'store_settings') settings = { ...settings, ...s.value };
      });
    }

    renderAll();
  } catch (err) {
    console.error("Fetch error:", err);
    toast("Error syncing with cloud");
  }
}

// ─── AUTH ───
function checkAuth() {
  const authed = sessionStorage.getItem("mm_auth");
  if (authed) { $("#loginScreen").classList.add("hidden"); $("#adminShell").classList.remove("hidden"); fetchAll(); }
}
checkAuth();

$("#loginBtn").addEventListener("click", () => {
  const pass = $("#loginPass").value;
  if (pass === settings.password) {
    sessionStorage.setItem("mm_auth", "1");
    $("#loginScreen").classList.add("hidden");
    $("#adminShell").classList.remove("hidden");
    fetchAll();
  } else { toast("Wrong password"); $("#loginPass").value = ""; }
});
$("#logoutBtn").addEventListener("click", () => { sessionStorage.removeItem("mm_auth"); location.reload(); });

// ─── NAVIGATION ───
$$(".nav-item[data-page]").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    $$(".page").forEach(p => p.classList.remove("active"));
    $(`#pg-${btn.dataset.page}`).classList.add("active");
    $("#pageTitle").textContent = btn.textContent.trim();
    $(".sidebar").classList.remove("open");
  });
});
$("#menuToggle").addEventListener("click", () => $(".sidebar").classList.toggle("open"));

// ─── RENDER DASHBOARD ───
function renderDashboard() {
  $("#statProducts").textContent = products.length;
  $("#statOrders").textContent = orders.length;
  const rev = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
  $("#statRevenue").textContent = `₹${rev.toLocaleString("en-IN")}`;
  $("#statCats").textContent = categories.length;

  if (!orders.length) {
    $("#recentOrders").innerHTML = `<div class="table-empty">No orders yet.</div>`;
    return;
  }
  const recent = orders.slice(0, 10);
  $("#recentOrders").innerHTML = `<table><thead><tr><th>#</th><th>Items</th><th>Total</th><th>Address</th><th>Time</th><th>Status</th></tr></thead><tbody>${
    recent.map(o => `<tr>
      <td>${o.id}</td>
      <td>${o.items?.map(it => it.name).join(", ") || "—"}</td>
      <td>₹${(parseFloat(o.total) || 0).toLocaleString("en-IN")}</td>
      <td>${o.address || "—"}</td>
      <td>${new Date(o.created_at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</td>
      <td><span class="status-badge ${o.status || 'pending'}">${o.status || "pending"}</span></td>
    </tr>`).join("")
  }</tbody></table>`;
}

// ─── RENDER PRODUCTS ───
let editingProduct = null;
function renderProducts() {
  $("#prodCount").textContent = `All Products (${products.length})`;
  if (!products.length) {
    $("#productsTable").innerHTML = `<div class="table-empty">No products. Click "+ Add Product" to start.</div>`;
    return;
  }
  $("#productsTable").innerHTML = `<table><thead><tr><th>Color</th><th>Name</th><th>Category</th><th>Price</th><th>Unit</th><th>Stock</th><th>Actions</th></tr></thead><tbody>${
    products.map((p, i) => `<tr>
      <td><div class="admin-thumb" style="background:${p.color}22">${p.image_url ? `<img src="${p.image_url}"/>` : `<span class="product-color" style="background:${p.color}"></span>`}</div></td>
      <td><strong>${p.name}</strong><br><span style="color:var(--muted);font-size:12px">${p.note || ""}</span></td>
      <td>${p.category}</td>
      <td>₹${p.price}</td>
      <td>${p.unit}</td>
      <td><span class="status-badge ${p.stock !== false ? 'active' : 'out'}">${p.stock !== false ? 'In Stock' : 'Out'}</span></td>
      <td>
        <button class="icon-btn" title="Edit" data-edit-p="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="icon-btn" title="Delete" data-del-p="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </td>
    </tr>`).join("")
  }</tbody></table>`;
}

function openProductModal(idx) {
  editingProduct = idx;
  const p = idx !== null ? products[idx] : null;
  $("#modalTitle").textContent = p ? "Edit Product" : "Add Product";
  $("#pCategory").innerHTML = categories.map(c => `<option value="${c.id}" ${p && p.category === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join("");
  $("#pName").value = p ? p.name : "";
  $("#pImage").value = p ? (p.image_url || "") : "";
  $("#pPrice").value = p ? p.price : "";
  $("#pUnit").value = p ? p.unit : "";
  $("#pNote").value = p ? p.note : "";
  $("#pColor").value = p ? p.color : "#C62828";
  $("#pStock").value = p ? (p.stock !== false ? "1" : "0") : "1";
  $("#productModal").classList.add("show");
}

async function saveProduct() {
  const name = $("#pName").value.trim();
  const image_url = $("#pImage").value.trim();
  const price = parseFloat($("#pPrice").value);
  const unit = $("#pUnit").value.trim();
  const category = $("#pCategory").value;
  const note = $("#pNote").value.trim();
  const color = $("#pColor").value;
  const stock = $("#pStock").value === "1";

  if (!name || isNaN(price) || !unit) { toast("Fill name, price, and unit"); return; }
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const payload = { id: slug, name, price, unit, category, note, color, stock, image_url, bg: `linear-gradient(135deg,${color}15,#fff)` };

  try {
    if (editingProduct !== null) {
      const oldId = products[editingProduct].id;
      const { error } = await supabase.from('products').update(payload).eq('id', oldId);
      if (error) throw error;
      toast("Product updated");
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) throw error;
      toast("Product added");
    }
    fetchAll();
    $("#productModal").classList.remove("show");
  } catch (err) { toast("Error saving product"); }
}

$("#addProductBtn").addEventListener("click", () => openProductModal(null));
$("#closeProductModal").addEventListener("click", () => $("#productModal").classList.remove("show"));
$("#saveProduct").addEventListener("click", saveProduct);

// ─── RENDER ORDERS ───
function renderOrders() {
  $("#orderCount").textContent = `All Orders (${orders.length})`;
  if (!orders.length) {
    $("#ordersTable").innerHTML = `<div class="table-empty">No orders yet.</div>`;
    return;
  }
  $("#ordersTable").innerHTML = `<table><thead><tr><th>#</th><th>Items</th><th>Qty</th><th>Total</th><th>Payment ID</th><th>Address</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>${
    orders.map((o, i) => `<tr>
      <td>${o.id}</td>
      <td>${o.items?.map(it => it.name).join(", ") || "—"}</td>
      <td>${o.items?.reduce((s, it) => s + it.qty, 0) || 0}</td>
      <td>₹${(parseFloat(o.total) || 0).toLocaleString("en-IN")}</td>
      <td><span style="font-size:11px;color:var(--muted)">${o.payment_id || "COD/Manual"}</span></td>
      <td>${o.address || "—"}</td>
      <td>${new Date(o.created_at).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</td>
      <td>
        <select class="status-select" data-order-status="${o.id}">
          <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
          <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmed</option>
          <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
          <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
        </select>
      </td>
      <td><button class="icon-btn" data-del-o="${o.id}"><svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
    </tr>`).join("")
  }</tbody></table>`;
}

// ─── RENDER CATEGORIES ───
let editingCat = null;
function renderCategories() {
  if (!categories.length) { $("#catGrid").innerHTML = `<div class="table-empty" style="grid-column:1/-1">No categories.</div>`; return; }
  $("#catGrid").innerHTML = categories.map((c, i) => `
    <div class="cat-card">
      <div class="cat-thumb">${c.image_url ? `<img src="${c.image_url}"/>` : `<span class="cat-emoji">${c.icon}</span>`}</div>
      <div class="cat-info"><strong>${c.label}</strong><span>${c.id}</span></div>
      <div class="cat-actions">
        <button class="icon-btn" data-edit-c="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="icon-btn" data-del-c="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
    </div>`).join("");
}

async function saveCat() {
  const label = $("#cLabel").value.trim();
  const image_url = $("#cImage").value.trim();
  const id = $("#cId").value.trim().toLowerCase().replace(/\s+/g,"-");
  const icon = $("#cEmoji").value.trim();
  const color = $("#cColor").value;
  const bg = $("#cBg").value;
  if (!label || !id) { toast("Fill label and ID"); return; }
  
  const payload = { id, label, icon, color, bg, image_url };
  try {
    if (editingCat !== null) {
      const oldId = categories[editingCat].id;
      const { error } = await supabase.from('categories').update(payload).eq('id', oldId);
      if (error) throw error;
      toast("Category updated");
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) throw error;
      toast("Category added");
    }
    fetchAll();
    $("#catModal").classList.remove("show");
  } catch (err) { toast("Error saving category"); }
}

$("#addCatBtn").addEventListener("click", () => { editingCat=null; $("#catModal").classList.add("show"); });
$("#saveCat").addEventListener("click", saveCat);

// ─── SETTINGS ───
function loadSettings() {
  $("#storeName").value = settings.storeName || "";
  $("#waNumber").value = settings.waNumber || "";
  $("#freeDelivery").value = settings.freeDelivery || 499;
  $("#deliveryFee").value = settings.deliveryFee || 49;
}
$("#saveSettingsBtn").addEventListener("click", async () => {
  const newSets = {
    storeName: $("#storeName").value.trim(),
    waNumber: $("#waNumber").value.trim(),
    freeDelivery: parseInt($("#freeDelivery").value) || 499,
    deliveryFee: parseInt($("#deliveryFee").value) || 49,
    password: $("#newPass").value.trim() || settings.password
  };
  
  try {
    const { error } = await supabase.from('settings').upsert({ key: 'store_settings', value: newSets });
    if (error) throw error;
    toast("Settings saved");
    fetchAll();
    $("#newPass").value = "";
  } catch (err) { toast("Error saving settings"); }
});

// ─── DELEGATED ACTIONS ───
document.addEventListener("click", async e => {
  const ep = e.target.closest("[data-edit-p]");
  if (ep) { openProductModal(parseInt(ep.dataset.editP)); return; }
  
  const dp = e.target.closest("[data-del-p]");
  if (dp) {
    const i = parseInt(dp.dataset.delP);
    if (confirm(`Delete "${products[i].name}"?`)) {
      await supabase.from('products').delete().eq('id', products[i].id);
      fetchAll();
    }
    return;
  }
  
  const ec = e.target.closest("[data-edit-c]");
  if (ec) { editingCat=parseInt(ec.dataset.editC); const c=categories[editingCat]; $("#cLabel").value=c.label; $("#cId").value=c.id; $("#cEmoji").value=c.icon; $("#cColor").value=c.color; $("#cBg").value=c.bg; $("#catModal").classList.add("show"); return; }
  
  const dc = e.target.closest("[data-del-c]");
  if (dc) {
    const i = parseInt(dc.dataset.delC);
    if (confirm(`Delete "${categories[i].label}"?`)) {
      await supabase.from('categories').delete().eq('id', categories[i].id);
      fetchAll();
    }
    return;
  }
  
  const dor = e.target.closest("[data-del-o]");
  if (dor) {
    const id = dor.dataset.delO;
    if (confirm("Delete this order?")) {
      await supabase.from('orders').delete().eq('id', id);
      fetchAll();
    }
    return;
  }
});

document.addEventListener("change", async e => {
  const os = e.target.closest("[data-order-status]");
  if (os) {
    const id = os.dataset.orderStatus;
    await supabase.from('orders').update({ status: os.value }).eq('id', id);
    toast("Status updated");
    fetchAll();
  }
});

function renderAll() { renderDashboard(); renderProducts(); renderOrders(); renderCategories(); loadSettings(); }
