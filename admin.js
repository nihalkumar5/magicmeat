/* MagicMeat Admin Panel — Fully Functional */

// ─── DEFAULT DATA ───
const DEFAULT_CATEGORIES = [
  { id:"meat", label:"Meat & Chicken", icon:"🥩", color:"#C62828", bg:"#FFEBEE" },
  { id:"fish", label:"Fish & Seafood", icon:"🐟", color:"#1565C0", bg:"#E3F2FD" },
  { id:"grocery", label:"Grocery", icon:"🥚", color:"#2E7D32", bg:"#E8F5E9" },
  { id:"fruits", label:"Fruits", icon:"🍎", color:"#c62828", bg:"#ffebee" },
  { id:"veggies", label:"Vegetables", icon:"🥬", color:"#2e7d32", bg:"#e8f5e9" },
  { id:"masala", label:"Masala & Spice", icon:"🌶️", color:"#D84315", bg:"#FBE9E7" },
  { id:"frozen", label:"Frozen", icon:"❄️", color:"#6B7280", bg:"#F3F4F6" },
  { id:"icecream", label:"Ice Cream", icon:"🍦", color:"#e91e63", bg:"#fce4ec" },
  { id:"dairy", label:"Dairy & Eggs", icon:"🧈", color:"#F9A825", bg:"#FFFDE7" },
];

const DEFAULT_PRODUCTS = [
  { id:"mutton-curry", name:"Mutton Curry Cut", category:"meat", note:"Bone-in shoulder & rib.", price:529, unit:"500g", color:"#ad3b2f", stock:true },
  { id:"lean-mince", name:"Lean Meat Mince", category:"meat", note:"Fine ground for kebabs.", price:389, unit:"450g", color:"#9c342b", stock:true },
  { id:"chicken-breast", name:"Clean Chicken Breast", category:"meat", note:"Skinless fillets.", price:279, unit:"450g", color:"#f1c07f", stock:true },
  { id:"chicken-thigh", name:"Boneless Thigh Pack", category:"meat", note:"Juicy thigh for biryani.", price:319, unit:"500g", color:"#d89344", stock:true },
  { id:"chicken-wings", name:"Party Wings", category:"meat", note:"Pre-cut for air-fryer.", price:249, unit:"500g", color:"#e8a39a", stock:true },
  { id:"mutton-keema", name:"Mutton Keema", category:"meat", note:"Double-ground goat.", price:479, unit:"400g", color:"#8d2f27", stock:true },
  { id:"salmon-steak", name:"River Cut Salmon", category:"fish", note:"Center-cut steaks.", price:699, unit:"300g", color:"#eb7f61", stock:true },
  { id:"prawns", name:"Cleaned Prawns", category:"fish", note:"Deveined, iced.", price:449, unit:"250g", color:"#6a8ea0", stock:true },
  { id:"pomfret", name:"Silver Pomfret", category:"fish", note:"Whole cleaned.", price:599, unit:"1 pc", color:"#94a3b8", stock:true },
  { id:"surmai", name:"Surmai Steaks", category:"fish", note:"King mackerel steaks.", price:549, unit:"500g", color:"#5b8fa8", stock:true },
  { id:"farm-eggs", name:"Brown Farm Eggs", category:"grocery", note:"Dozen free-range.", price:129, unit:"12 pcs", color:"#b9935d", stock:true },
  { id:"basmati", name:"Aged Basmati Rice", category:"grocery", note:"Long-grain aged.", price:299, unit:"1 kg", color:"#d4a574", stock:true },
  { id:"onion-tomato", name:"Onion Tomato Pack", category:"grocery", note:"Fresh sorted.", price:89, unit:"1 kg", color:"#e25c3e", stock:true },
  { id:"apple-shimla", name:"Shimla Apples", category:"fruits", note:"Crisp Himachal apples.", price:189, unit:"1 kg", color:"#c62828", stock:true },
  { id:"banana", name:"Fresh Bananas", category:"fruits", note:"Ripe yellow.", price:49, unit:"6 pcs", color:"#f9a825", stock:true },
  { id:"mango", name:"Alphonso Mango", category:"fruits", note:"Premium Ratnagiri.", price:499, unit:"6 pcs", color:"#ff8f00", stock:true },
  { id:"palak", name:"Fresh Palak", category:"veggies", note:"Clean washed spinach.", price:39, unit:"250g", color:"#2e7d32", stock:true },
  { id:"capsicum", name:"Capsicum Mix", category:"veggies", note:"Red, yellow, green.", price:99, unit:"500g", color:"#43a047", stock:true },
  { id:"aloo", name:"Baby Potatoes", category:"veggies", note:"Small sorted for dum.", price:49, unit:"1 kg", color:"#8d6e63", stock:true },
  { id:"biryani-masala", name:"Biryani Masala", category:"masala", note:"Aromatic blend.", price:149, unit:"100g", color:"#bf360c", stock:true },
  { id:"garam-masala", name:"Whole Garam Masala", category:"masala", note:"Cardamom, cloves.", price:199, unit:"100g", color:"#6d4c41", stock:true },
  { id:"seekh-kabab", name:"Frozen Seekh Kabab", category:"frozen", note:"Ready-to-sear.", price:349, unit:"400g", color:"#865445", stock:true },
  { id:"frozen-paratha", name:"Layered Paratha", category:"frozen", note:"Flaky heat-and-serve.", price:189, unit:"6 pcs", color:"#d4a95d", stock:true },
  { id:"nuggets", name:"Chicken Nuggets", category:"frozen", note:"Golden coated.", price:269, unit:"400g", color:"#c9963a", stock:true },
  { id:"vanilla-tub", name:"Vanilla Bean Tub", category:"icecream", note:"Madagascar vanilla.", price:299, unit:"500ml", color:"#fff9c4", stock:true },
  { id:"choco-bar", name:"Dark Choco Bars", category:"icecream", note:"Belgian chocolate.", price:199, unit:"4 pcs", color:"#4e342e", stock:true },
  { id:"mango-kulfi", name:"Mango Kulfi Sticks", category:"icecream", note:"Traditional malai.", price:169, unit:"6 pcs", color:"#ff8f00", stock:true },
  { id:"paneer", name:"Fresh Paneer Block", category:"dairy", note:"Soft morning batch.", price:179, unit:"200g", color:"#fff9c4", stock:true },
  { id:"curd", name:"Homestyle Thick Curd", category:"dairy", note:"Full-cream set curd.", price:69, unit:"400g", color:"#f5f5f5", stock:true },
];

// ─── STATE ───
const LS = {
  get(k, def) { try { return JSON.parse(localStorage.getItem(`mm_${k}`)) ?? def; } catch { return def; } },
  set(k, v) { localStorage.setItem(`mm_${k}`, JSON.stringify(v)); },
};

let products = LS.get("products", DEFAULT_PRODUCTS);
let categories = LS.get("categories", DEFAULT_CATEGORIES);
let orders = LS.get("orders", []);
let settings = LS.get("settings", { storeName: "MagicMeat", waNumber: "+919999999999", freeDelivery: 499, deliveryFee: 49, password: "admin123" });

function save() {
  LS.set("products", products);
  LS.set("categories", categories);
  LS.set("orders", orders);
  LS.set("settings", settings);
}

// ─── DOM ───
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Toast
const toastEl = document.createElement("div");
toastEl.className = "admin-toast";
document.body.appendChild(toastEl);
let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2500); }

// ─── AUTH ───
function checkAuth() {
  const authed = sessionStorage.getItem("mm_auth");
  if (authed) { $("#loginScreen").classList.add("hidden"); $("#adminShell").classList.remove("hidden"); }
}
checkAuth();

$("#loginBtn").addEventListener("click", () => {
  const pass = $("#loginPass").value;
  if (pass === settings.password) {
    sessionStorage.setItem("mm_auth", "1");
    $("#loginScreen").classList.add("hidden");
    $("#adminShell").classList.remove("hidden");
    renderAll();
  } else { toast("Wrong password"); $("#loginPass").value = ""; }
});
$("#loginPass").addEventListener("keydown", e => { if (e.key === "Enter") $("#loginBtn").click(); });
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
  const rev = orders.reduce((s, o) => s + (o.total || 0), 0);
  $("#statRevenue").textContent = `₹${rev.toLocaleString("en-IN")}`;
  $("#statCats").textContent = categories.length;

  // Recent orders
  if (!orders.length) {
    $("#recentOrders").innerHTML = `<div class="table-empty">No orders yet.</div>`;
    return;
  }
  const recent = orders.slice(-10).reverse();
  $("#recentOrders").innerHTML = `<table><thead><tr><th>#</th><th>Items</th><th>Total</th><th>Address</th><th>Time</th><th>Status</th></tr></thead><tbody>${
    recent.map((o, i) => `<tr>
      <td>${o.id || i + 1}</td>
      <td>${o.items?.map(it => it.name).join(", ") || "—"}</td>
      <td>₹${(o.total || 0).toLocaleString("en-IN")}</td>
      <td>${o.address || "—"}</td>
      <td>${o.time || "—"}</td>
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
      <td><span class="product-color" style="background:${p.color}"></span></td>
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

// Product modal
function openProductModal(idx) {
  editingProduct = idx;
  const p = idx !== null ? products[idx] : null;
  $("#modalTitle").textContent = p ? "Edit Product" : "Add Product";

  // Populate category select
  $("#pCategory").innerHTML = categories.map(c => `<option value="${c.id}" ${p && p.category === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join("");

  $("#pName").value = p ? p.name : "";
  $("#pPrice").value = p ? p.price : "";
  $("#pUnit").value = p ? p.unit : "";
  $("#pNote").value = p ? p.note : "";
  $("#pColor").value = p ? p.color : "#C62828";
  $("#pStock").value = p ? (p.stock !== false ? "1" : "0") : "1";
  $("#productModal").classList.add("show");
}

function closeProductModal() { $("#productModal").classList.remove("show"); editingProduct = null; }

function saveProduct() {
  const name = $("#pName").value.trim();
  const price = parseInt($("#pPrice").value);
  const unit = $("#pUnit").value.trim();
  const category = $("#pCategory").value;
  const note = $("#pNote").value.trim();
  const color = $("#pColor").value;
  const stock = $("#pStock").value === "1";

  if (!name || !price || !unit) { toast("Fill name, price, and unit"); return; }

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  if (editingProduct !== null) {
    products[editingProduct] = { ...products[editingProduct], name, price, unit, category, note, color, stock };
    toast("Product updated");
  } else {
    products.push({ id: slug, name, price, unit, category, note, color, stock, bg: `linear-gradient(135deg,${color}15,#fff)` });
    toast("Product added");
  }
  save();
  closeProductModal();
  renderProducts();
  renderDashboard();
}

$("#addProductBtn").addEventListener("click", () => openProductModal(null));
$("#closeProductModal").addEventListener("click", closeProductModal);
$("#cancelProduct").addEventListener("click", closeProductModal);
$("#saveProduct").addEventListener("click", saveProduct);

// ─── RENDER ORDERS ───
function renderOrders() {
  $("#orderCount").textContent = `All Orders (${orders.length})`;
  if (!orders.length) {
    $("#ordersTable").innerHTML = `<div class="table-empty">No orders yet.</div>`;
    return;
  }
  $("#ordersTable").innerHTML = `<table><thead><tr><th>#</th><th>Items</th><th>Qty</th><th>Total</th><th>Address</th><th>Time</th><th>Status</th><th>Action</th></tr></thead><tbody>${
    orders.map((o, i) => `<tr>
      <td>${o.id || i + 1}</td>
      <td>${o.items?.map(it => `${it.name}`).join(", ") || "—"}</td>
      <td>${o.items?.reduce((s, it) => s + it.qty, 0) || 0}</td>
      <td>₹${(o.total || 0).toLocaleString("en-IN")}</td>
      <td>${o.address || "—"}</td>
      <td>${o.time || "—"}</td>
      <td>
        <select class="status-select" data-order-status="${i}" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600">
          <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
          <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmed</option>
          <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
          <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
        </select>
      </td>
      <td><button class="icon-btn" title="Delete" data-del-o="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>
    </tr>`).join("")
  }</tbody></table>`;
}

// ─── RENDER CATEGORIES ───
let editingCat = null;

function renderCategories() {
  if (!categories.length) { $("#catGrid").innerHTML = `<div class="table-empty" style="grid-column:1/-1">No categories.</div>`; return; }
  $("#catGrid").innerHTML = categories.map((c, i) => `
    <div class="cat-card">
      <span class="cat-emoji">${c.icon}</span>
      <div class="cat-info"><strong>${c.label}</strong><span>${c.id} · ${products.filter(p => p.category === c.id).length} items</span></div>
      <div class="cat-actions">
        <button class="icon-btn" data-edit-c="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="icon-btn" data-del-c="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
    </div>`).join("");
}

function openCatModal(idx) {
  editingCat = idx;
  const c = idx !== null ? categories[idx] : null;
  $("#catModalTitle").textContent = c ? "Edit Category" : "Add Category";
  $("#cLabel").value = c ? c.label : "";
  $("#cId").value = c ? c.id : "";
  $("#cEmoji").value = c ? c.icon : "";
  $("#cColor").value = c ? c.color : "#2E7D32";
  $("#cBg").value = c ? c.bg : "#E8F5E9";
  $("#catModal").classList.add("show");
}
function closeCatModal() { $("#catModal").classList.remove("show"); editingCat = null; }

function saveCat() {
  const label = $("#cLabel").value.trim();
  const id = $("#cId").value.trim().toLowerCase().replace(/\s+/g,"-");
  const icon = $("#cEmoji").value.trim();
  const color = $("#cColor").value;
  const bg = $("#cBg").value;
  if (!label || !id) { toast("Fill label and ID"); return; }
  if (editingCat !== null) {
    categories[editingCat] = { ...categories[editingCat], label, id, icon, color, bg };
    toast("Category updated");
  } else {
    categories.push({ id, label, icon, color, bg });
    toast("Category added");
  }
  save(); closeCatModal(); renderCategories(); renderDashboard();
}

$("#addCatBtn").addEventListener("click", () => openCatModal(null));
$("#closeCatModal").addEventListener("click", closeCatModal);
$("#cancelCat").addEventListener("click", closeCatModal);
$("#saveCat").addEventListener("click", saveCat);

// ─── SETTINGS ───
function loadSettings() {
  $("#storeName").value = settings.storeName || "";
  $("#waNumber").value = settings.waNumber || "";
  $("#freeDelivery").value = settings.freeDelivery || 499;
  $("#deliveryFee").value = settings.deliveryFee || 49;
}
$("#saveSettingsBtn").addEventListener("click", () => {
  settings.storeName = $("#storeName").value.trim();
  settings.waNumber = $("#waNumber").value.trim();
  settings.freeDelivery = parseInt($("#freeDelivery").value) || 499;
  settings.deliveryFee = parseInt($("#deliveryFee").value) || 49;
  const np = $("#newPass").value.trim();
  if (np) settings.password = np;
  save();
  toast("Settings saved");
  $("#newPass").value = "";
});

// ─── DELETE CONFIRM ───
let deleteAction = null;
function openDelete(msg, fn) {
  $("#deleteMsg").textContent = msg;
  deleteAction = fn;
  $("#deleteModal").classList.add("show");
}
function closeDelete() { $("#deleteModal").classList.remove("show"); deleteAction = null; }
$("#cancelDelete").addEventListener("click", closeDelete);
$("#confirmDelete").addEventListener("click", () => { if (deleteAction) deleteAction(); closeDelete(); });

// ─── DELEGATED CLICKS ───
document.addEventListener("click", e => {
  // Edit product
  const ep = e.target.closest("[data-edit-p]");
  if (ep) { openProductModal(parseInt(ep.dataset.editP)); return; }
  // Delete product
  const dp = e.target.closest("[data-del-p]");
  if (dp) { const i = parseInt(dp.dataset.delP); openDelete(`Delete "${products[i]?.name}"?`, () => { products.splice(i, 1); save(); renderProducts(); renderDashboard(); toast("Product deleted"); }); return; }
  // Edit category
  const ec = e.target.closest("[data-edit-c]");
  if (ec) { openCatModal(parseInt(ec.dataset.editC)); return; }
  // Delete category
  const dc = e.target.closest("[data-del-c]");
  if (dc) { const i = parseInt(dc.dataset.delC); openDelete(`Delete "${categories[i]?.label}"?`, () => { categories.splice(i, 1); save(); renderCategories(); renderDashboard(); toast("Category deleted"); }); return; }
  // Delete order
  const dor = e.target.closest("[data-del-o]");
  if (dor) { const i = parseInt(dor.dataset.delO); openDelete("Delete this order?", () => { orders.splice(i, 1); save(); renderOrders(); renderDashboard(); toast("Order deleted"); }); return; }
});

// Order status change
document.addEventListener("change", e => {
  const os = e.target.closest("[data-order-status]");
  if (os) {
    const i = parseInt(os.dataset.orderStatus);
    orders[i].status = os.value;
    save();
    renderOrders();
    toast("Status updated");
  }
});

// Clear orders
$("#clearOrdersBtn").addEventListener("click", () => {
  if (!orders.length) { toast("No orders to clear"); return; }
  openDelete("Clear ALL orders?", () => { orders = []; save(); renderOrders(); renderDashboard(); toast("Orders cleared"); });
});

// ─── RENDER ALL ───
function renderAll() { renderDashboard(); renderProducts(); renderOrders(); renderCategories(); loadSettings(); }
renderAll();
