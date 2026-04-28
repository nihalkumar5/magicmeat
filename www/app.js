const state = {
  currentView: "home",
  grocerySub: "all",
  query: "",
  cart: new Map(),
  products: [],
  categories: [],
  featuredOffers: [],
  orders: [],
  customer: JSON.parse(localStorage.getItem("magicmeat_customer") || "{}"),
  settings: { freeDelivery: 299, deliveryFee: 29 },
  eta: 31
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const dom = {
  views: $$(".view"),
  tabs: $$(".tab-item"),
  locAddress: $("#locationAddress"),
  locBtn: $("#locationBtn"),
  etaText: $("#etaText"),
  greetText: $("#greetingText"),
  searchInput: $("#searchInput"),
  filterTags: $$(".f-tag"),
  heroBanner: $("#heroBanner"),
  quickCats: $("#quickCategories"),
  featuredGrid: $("#featuredGrid"),
  bundlesGrid: $("#bundlesGrid"),
  grocerySubcats: $("#grocerySubcats"),
  groceryGrid: $("#groceryGrid"),
  cartItems: $("#cartItems"),
  cartSub: $("#cartSubtitle"),
  subtotal: $("#subtotal"),
  deliveryFee: $("#deliveryFee"),
  cartTotal: $("#cartTotal"),
  cartBadge: $("#cartBadge"),
  cartSummary: $("#cartSummaryBlock"),
  checkoutBtn: $("#checkoutButton"),
  toast: $("#toast"),
  orderModal: $("#orderModal"),
  modalEta: $("#modalEta"),
  modalOrderId: $("#modalOrderId"),
  modalClose: $("#modalClose"),
  locModal: $("#locationModal"),
  detectBtn: $("#detectLocationBtn"),
  manualAddr: $("#manualAddress"),
  saveAddrBtn: $("#saveAddressBtn"),
  checkoutModal: $("#checkoutModal"),
  checkoutClose: $("#checkoutClose"),
  checkoutForm: $("#checkoutForm"),
  customerName: $("#customerName"),
  customerPhone: $("#customerPhone"),
  customerAddress: $("#customerAddress"),
  customerPayment: $("#customerPayment"),
  profilePhone: $("#profilePhone"),
  trackOrdersBtn: $("#trackOrdersBtn"),
  profileEmail: $("#profileEmail"),
  activeOrders: $("#activeOrders"),
  orderHistory: $("#orderHistory"),
  logoutBtn: $("#logoutBtn")
};

const categoryMeta = {
  all: { label: "All", icon: "🛒", color: "#0A0A0A", bg: "#F2F2F7" },
  chicken: { label: "Chicken", icon: "🍗", color: "#C62828", bg: "#FFE5E5" },
  mutton: { label: "Mutton", icon: "🥩", color: "#8B1E1E", bg: "#FCE8E8" },
  fish: { label: "Fish", icon: "🐟", color: "#1976D2", bg: "#E3F2FD" },
  eggs: { label: "Eggs", icon: "🥚", color: "#B7791F", bg: "#FFF9C4" },
  grocery: { label: "Grocery", icon: "🥬", color: "#2E7D32", bg: "#E8F5E9" },
  fruits: { label: "Fruits", icon: "🍎", color: "#D97706", bg: "#FFF3E0" },
  veggies: { label: "Vegetables", icon: "🥬", color: "#2E7D32", bg: "#E8F5E9" },
  masala: { label: "Masala", icon: "🌶️", color: "#B91C1C", bg: "#FEE2E2" },
  frozen: { label: "Frozen", icon: "❄️", color: "#2563EB", bg: "#DBEAFE" },
  dairy: { label: "Dairy", icon: "🧈", color: "#CA8A04", bg: "#FEF3C7" }
};

const fallbackProducts = [
  {
    id: "fallback-chicken",
    name: "Chicken Curry Cut",
    category: "chicken",
    price: 189,
    unit: "500g",
    emoji: "🍗",
    rating: 4.8,
    freshness: 98,
    eta: 31,
    description: "Fresh cleaned curry cut chicken packed cold.",
    stock: 12
  }
];

const fmt = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

let toastTimer;
function toast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove("visible"), 2400);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Late night cravings?";
}

function categoryFor(id) {
  const apiCategory = state.categories.find((category) => category.id === id);
  return {
    ...categoryMeta[id],
    id,
    label: apiCategory?.label || apiCategory?.name || categoryMeta[id]?.label || id
  };
}

function normalizeProduct(product) {
  const meta = categoryFor(product.category);
  return {
    ...product,
    color: product.color || meta.color || "#C62828",
    bg: product.bg || meta.bg || "#FFE5E5",
    note: product.note || product.description || "Freshly packed for your order",
    emoji: product.emoji || meta.icon || "🥩",
    image: product.image || "",
    stock: Number(product.stock || 0)
  };
}

function cartCount() {
  return [...state.cart.values()].reduce((sum, quantity) => sum + quantity, 0);
}

function cartSubtotal() {
  let total = 0;
  state.cart.forEach((quantity, id) => {
    const product = state.products.find((entry) => entry.id === id);
    if (product) total += product.price * quantity;
  });
  return total;
}

function deliveryFeeFor(subtotal) {
  return subtotal >= state.settings.freeDelivery ? 0 : state.settings.deliveryFee;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function loadStore() {
  try {
    const store = await api("/api/store");
    state.categories = store.categories || [];
    state.featuredOffers = store.featuredOffers || [];
    state.products = (store.products || []).map(normalizeProduct);
  } catch (error) {
    state.categories = [
      { id: "chicken", name: "Chicken" },
      { id: "mutton", name: "Mutton" },
      { id: "fish", name: "Fish" },
      { id: "eggs", name: "Eggs" },
      { id: "grocery", name: "Grocery" }
    ];
    state.products = fallbackProducts.map(normalizeProduct);
    toast("Using offline menu");
  }

  renderAll();
  if (state.customer.phone) {
    loadOrders(state.customer.phone);
  }
}

async function loadOrders(phone) {
  const cleanPhone = String(phone || "").trim();
  if (!cleanPhone) {
    toast("Enter a phone number to track orders");
    return;
  }

  try {
    state.orders = await api(`/api/orders?phone=${encodeURIComponent(cleanPhone)}`);
    state.customer.phone = cleanPhone;
    localStorage.setItem("magicmeat_customer", JSON.stringify(state.customer));
    renderOrderTracking();
  } catch (error) {
    toast(error.message);
  }
}

function switchView(id) {
  state.currentView = id;
  dom.views.forEach((view) => view.classList.toggle("active", view.id === id));
  dom.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === id));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderPromo() {
  // Hero banner is static in HTML, but we could update it dynamically here if needed
}

function renderBundles() {
  if (!dom.bundlesGrid) return;
  // For demonstration, take some products and fake them as bundles
  const bundles = state.products.slice(0, 2).map(p => ({
    ...p,
    id: p.id + '_bundle',
    name: p.name + ' Bundle',
    price: p.price * 2.5,
    unit: 'Combo Pack',
    note: 'Perfect for family dinners',
    emoji: '🍱'
  }));
  
  dom.bundlesGrid.innerHTML = bundles.length
    ? bundles.map((product, index) => cardHTML(product, index * 35)).join("")
    : `<div class="grid-empty"><h3>Coming soon</h3></div>`;
}

function renderQuickCats() {
  if (!dom.quickCats) return;
  // Show only top 4 for the 2x2 grid
  const cats = state.categories.filter((category) => category.id !== "all").slice(0, 4);
  dom.quickCats.innerHTML = cats.map((category) => {
    const meta = categoryFor(category.id);
    return `
      <div class="qcat-card" data-catview="${escapeHtml(category.id)}" data-cat="${escapeHtml(category.id)}">
        <div class="qcat-icon">
          <span>${meta.icon || "🥩"}</span>
        </div>
        <div class="qcat-text-wrap">
          <span class="cat-title">${escapeHtml(meta.label)}</span>
          <span class="cat-count">${Math.floor(Math.random() * 50 + 10)} Products</span>
        </div>
      </div>
    `;
  }).join("");
}

function cardHTML(product, delay = 0) {
  const quantity = state.cart.get(product.id) || 0;
  const disabled = product.stock <= 0;
  const stepper = disabled
    ? `<div class="sold-out">Sold out</div>`
    : quantity === 0
      ? `<div class="card-stepper single" data-pid="${escapeHtml(product.id)}"><button data-cadd="${escapeHtml(product.id)}">+</button></div>`
      : `<div class="card-stepper expanded" data-pid="${escapeHtml(product.id)}">
           <button data-cminus="${escapeHtml(product.id)}">-</button>
           <span class="qty-num">${quantity}</span>
           <button data-cadd="${escapeHtml(product.id)}">+</button>
         </div>`;

  return `
    <div class="product-card" style="animation-delay:${delay}ms" data-product-id="${escapeHtml(product.id)}">
      <div class="product-image" style="--card-bg:${product.bg};--card-accent:${product.color}">
        ${product.image 
          ? `<img src="${escapeHtml(product.image)}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">` 
          : `<span class="product-emoji">${escapeHtml(product.emoji)}</span>`
        }
        <span class="unit-tag">${escapeHtml(product.unit)}</span>
      </div>
      <h3>${escapeHtml(product.name)}</h3>
      <p class="product-note">${escapeHtml(product.note)}</p>
      <div class="product-meta">
        <span>${Number(product.rating || 4.7).toFixed(1)} rated</span>
        <span>${Number(product.freshness || 96)}% fresh</span>
      </div>
      <div class="product-footer">
        <span class="product-price">${fmt(product.price)}</span>
        ${stepper}
      </div>
    </div>
  `;
}

function filteredProducts(limitFeatured) {
  const query = state.query.trim().toLowerCase();
  let list = state.products;
  if (state.grocerySub !== "all") list = list.filter((product) => product.category === state.grocerySub);
  if (query) {
    list = list.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.note.toLowerCase().includes(query)
    );
  }
  return limitFeatured && !query ? list.slice(0, 10) : list;
}

function renderFeatured() {
  if (!dom.featuredGrid) return;
  const list = filteredProducts(true);
  dom.featuredGrid.innerHTML = list.length
    ? list.map((product, index) => cardHTML(product, index * 35)).join("")
    : `<div class="grid-empty"><h3>No products found</h3><p>Try another search.</p></div>`;
}

function renderGrocerySubcats() {
  if (!dom.grocerySubcats) return;
  const cats = [{ id: "all", name: "All" }, ...state.categories.filter((category) => category.id !== "all")];
  dom.grocerySubcats.innerHTML = cats.map((category) => {
    const meta = categoryFor(category.id);
    return `
      <button class="subcat-pill ${state.grocerySub === category.id ? "active" : ""}" data-subcat="${escapeHtml(category.id)}">
        <span class="se">${meta.icon || "🛒"}</span>${escapeHtml(meta.label)}
      </button>
    `;
  }).join("");
}

function renderGroceryGrid() {
  if (!dom.groceryGrid) return;
  const list = filteredProducts(false);
  dom.groceryGrid.innerHTML = list.length
    ? list.map((product, index) => cardHTML(product, index * 35)).join("")
    : `<div class="grid-empty"><h3>Nothing here yet</h3><p>Check another category.</p></div>`;
}

function renderCart() {
  if (!dom.cartBadge || !dom.cartItems || !dom.cartSummary) return;
  const items = [];
  state.cart.forEach((quantity, id) => {
    const product = state.products.find((entry) => entry.id === id);
    if (product) items.push({ ...product, quantity });
  });

  const count = cartCount();
  const subtotal = cartSubtotal();
  const fee = deliveryFeeFor(subtotal);

  dom.cartBadge.textContent = count;
  dom.cartBadge.classList.toggle("show", count > 0);
  dom.cartSub.textContent = `${count} item${count === 1 ? "" : "s"}`;

  if (!items.length) {
    dom.cartItems.innerHTML = `<div class="cart-empty"><h3>Your basket is empty</h3><p>Add fresh picks from the menu.</p></div>`;
    dom.cartSummary.style.display = "none";
    return;
  }

  dom.cartSummary.style.display = "";
  dom.cartItems.innerHTML = items.map((item) => `
    <div class="cart-item">
      <div class="cart-item-img" style="--item-bg:${item.bg}">
        ${item.image 
          ? `<img src="${escapeHtml(item.image)}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">` 
          : `<span>${escapeHtml(item.emoji)}</span>`
        }
      </div>
      <div class="cart-item-info">
        <div class="cart-item-title">${escapeHtml(item.name)}</div>
        <div class="cart-item-meta">${escapeHtml(item.unit)} · ${escapeHtml(categoryFor(item.category).label)}</div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-price">${fmt(item.price * item.quantity)}</div>
        <div class="qty-control">
          <button class="qty-btn remove" data-minus="${escapeHtml(item.id)}">${item.quantity === 1 ? "x" : "-"}</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" data-plus="${escapeHtml(item.id)}">+</button>
        </div>
      </div>
    </div>
  `).join("");

  dom.subtotal.textContent = fmt(subtotal);
  dom.deliveryFee.textContent = fee === 0 ? "FREE" : fmt(fee);
  dom.cartTotal.textContent = fmt(subtotal + fee);
  dom.checkoutBtn.disabled = count === 0;
}

function renderOrderTracking() {
  if (!dom.activeOrders || !dom.orderHistory) return;
  const activeStatuses = new Set(["placed", "packing", "out_for_delivery"]);
  const active = state.orders.filter((order) => activeStatuses.has(order.status));
  const past = state.orders.filter((order) => !activeStatuses.has(order.status));

  dom.profileEmail.textContent = state.customer.phone ? `Tracking ${state.customer.phone}` : "Track by phone";
  dom.activeOrders.innerHTML = active.length
    ? active.map(orderCard).join("")
    : `<div class="cart-empty compact"><h3>No active orders</h3><p>Your current order status will show here.</p></div>`;
  dom.orderHistory.innerHTML = past.length
    ? past.map(orderCard).join("")
    : `<div class="cart-empty compact"><h3>No past orders</h3></div>`;
}

function orderCard(order) {
  const statusLabels = {
    placed: "Placed",
    packing: "Packing",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };
  const timeline = order.timeline || [];
  return `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">#${escapeHtml(order.id.slice(-8))}</span>
        <span class="order-status ${escapeHtml(order.status)}">${escapeHtml(statusLabels[order.status] || order.status)}</span>
      </div>
      <div class="order-body">
        ${(order.items || []).map((item) => `
          <div class="order-item-row">
            <span>${item.quantity}x ${escapeHtml(item.name)}</span>
            <span>${fmt(item.quantity * item.unitPrice)}</span>
          </div>
        `).join("")}
      </div>
      <div class="order-timeline">
        ${["placed", "packing", "out_for_delivery", "delivered"].map((step) => `
          <div class="t-dot ${timeline.length && order.status !== "cancelled" && timelineForStatus(order.status).includes(step) ? "active" : ""}"></div>
        `).join("")}
      </div>
      <div class="order-footer">
        <span class="order-time">${new Date(order.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
        <span class="order-total">${fmt(order.total)}</span>
      </div>
    </div>
  `;
}

function timelineForStatus(status) {
  const map = {
    placed: ["placed"],
    packing: ["placed", "packing"],
    out_for_delivery: ["placed", "packing", "out_for_delivery"],
    delivered: ["placed", "packing", "out_for_delivery", "delivered"],
    cancelled: ["placed"]
  };
  return map[status] || map.placed;
}

function renderAll() {
  renderPromo();
  renderQuickCats();
  renderFeatured();
  renderBundles();
  renderGrocerySubcats();
  renderGroceryGrid();
  renderCart();
  renderOrderTracking();
}

function addToCart(productId) {
  const product = state.products.find((entry) => entry.id === productId);
  if (!product || product.stock <= 0) {
    toast("That item is out of stock");
    return;
  }
  const current = state.cart.get(productId) || 0;
  if (current >= product.stock) {
    toast(`Only ${product.stock} available`);
    return;
  }
  state.cart.set(productId, current + 1);
  renderCart();
  renderFeatured();
  renderGroceryGrid();
}

function minusFromCart(productId) {
  const current = state.cart.get(productId) || 0;
  if (current <= 1) state.cart.delete(productId);
  else state.cart.set(productId, current - 1);
  renderCart();
  renderFeatured();
  renderGroceryGrid();
}

function openCheckout() {
  if (!cartCount()) return;
  const saved = state.customer || {};
  dom.customerName.value = saved.name || "";
  dom.customerPhone.value = saved.phone || "";
  dom.customerAddress.value = saved.address || state.address || "";
  dom.checkoutModal.classList.add("show");
}

async function placeOrder(event) {
  event.preventDefault();
  const customer = {
    name: dom.customerName.value.trim(),
    phone: dom.customerPhone.value.trim(),
    address: dom.customerAddress.value.trim()
  };
  const paymentMethod = dom.customerPayment.value;

  const items = [];
  state.cart.forEach((quantity, productId) => items.push({ productId, quantity }));

  try {
    const order = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: customer.name,
        phone: customer.phone,
        address: customer.address,
        paymentMethod,
        items
      })
    });
    state.customer = customer;
    localStorage.setItem("magicmeat_customer", JSON.stringify(state.customer));
    state.cart.clear();
    dom.checkoutModal.classList.remove("show");
    dom.modalOrderId.textContent = `Order #${order.id.slice(-8)}`;
    dom.modalEta.textContent = `${state.eta} min`;
    dom.orderModal.classList.add("show");
    await loadStore();
    await loadOrders(customer.phone);
  } catch (error) {
    toast(error.message);
  }
}

function saveAddress() {
  const address = dom.manualAddr.value.trim();
  if (!address) {
    toast("Enter your delivery address");
    return;
  }
  state.customer.address = address;
  state.address = address;
  localStorage.setItem("magicmeat_customer", JSON.stringify(state.customer));
  dom.locAddress.textContent = address;
  dom.locModal.classList.remove("show");
  toast("Address saved");
}

dom.tabs.forEach((tab) => tab.addEventListener("click", () => switchView(tab.dataset.view)));
if (dom.checkoutBtn) dom.checkoutBtn.addEventListener("click", openCheckout);
if (dom.checkoutClose) dom.checkoutClose.addEventListener("click", () => dom.checkoutModal.classList.remove("show"));
if (dom.checkoutForm) dom.checkoutForm.addEventListener("submit", placeOrder);
if (dom.modalClose) dom.modalClose.addEventListener("click", () => {
  dom.orderModal.classList.remove("show");
  switchView("profile");
});
if (dom.searchInput) dom.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderFeatured();
});
if (dom.filterTags) dom.filterTags.forEach(tag => {
  tag.addEventListener("click", () => {
    dom.filterTags.forEach(t => t.classList.remove("active"));
    tag.classList.add("active");
    // Simple mock filter
    if (tag.textContent === "Bestsellers") state.query = "a"; 
    else if (tag.textContent === "Premium Meats") state.query = "meat";
    else if (tag.textContent === "Fresh Produce") state.query = "fresh";
    else state.query = "";
    renderFeatured();
  });
});
if (dom.locBtn) dom.locBtn.addEventListener("click", () => {
  dom.manualAddr.value = state.customer.address || "";
  dom.locModal.classList.add("show");
});
if (dom.detectBtn) dom.detectBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    toast("Location detection is not available");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    () => {
      state.eta = 29;
      dom.etaText.textContent = "29 min delivery";
      toast("Location detected. Add flat and street details.");
    },
    () => toast("Could not detect location")
  );
});
if (dom.saveAddrBtn) dom.saveAddrBtn.addEventListener("click", saveAddress);
if (dom.trackOrdersBtn) dom.trackOrdersBtn.addEventListener("click", () => loadOrders(dom.profilePhone.value));
if (dom.logoutBtn) dom.logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("magicmeat_customer");
  state.customer = {};
  state.orders = [];
  if (dom.profilePhone) dom.profilePhone.value = "";
  renderOrderTracking();
  toast("Tracking details cleared");
});

document.addEventListener("click", (event) => {
  const qcat = event.target.closest("[data-catview]");
  if (qcat) {
    state.grocerySub = qcat.dataset.catview;
    switchView("grocery");
    renderGrocerySubcats();
    renderGroceryGrid();
    return;
  }

  const add = event.target.closest("[data-cadd]");
  if (add) {
    addToCart(add.dataset.cadd);
    return;
  }

  const minus = event.target.closest("[data-cminus], [data-minus]");
  if (minus) {
    minusFromCart(minus.dataset.cminus || minus.dataset.minus);
    return;
  }

  const plus = event.target.closest("[data-plus]");
  if (plus) {
    addToCart(plus.dataset.plus);
    return;
  }

  const subcat = event.target.closest("[data-subcat]");
  if (subcat) {
    state.grocerySub = subcat.dataset.subcat;
    renderGrocerySubcats();
    renderGroceryGrid();
  }
});

if (dom.greetText) dom.greetText.textContent = greeting();
if (dom.locAddress) dom.locAddress.textContent = state.customer.address || "Set delivery address";
if (dom.profilePhone) dom.profilePhone.value = state.customer.phone || "";
loadStore();
