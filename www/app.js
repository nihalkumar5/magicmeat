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
  trendingRail: $("#trendingRail"),
  heroBanner: $("#heroBanner"),
  quickCats: $("#quickCategories"),
  featuredGrid: $("#featuredGrid"),
  seafoodGrid: $("#seafoodGrid"),
  dairyGrid: $("#dairyGrid"),
  veggiesGrid: $("#veggiesGrid"),
  bundlesGrid: $("#bundlesGrid"),
  frozenGrid: $("#frozenGrid"),
  drinksGrid: $("#drinksGrid"),
  pantryGrid: $("#pantryGrid"),
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
  },
  {
    id: "fallback-fish",
    name: "Fresh Rohu Fish",
    category: "fish",
    price: 349,
    unit: "1kg",
    emoji: "🐟",
    rating: 4.9,
    freshness: 99,
    eta: 35,
    description: "River fresh Rohu, cleaned and sliced.",
    stock: 8
  },
  {
    id: "fallback-dairy",
    name: "Premium Buffalo Milk",
    category: "dairy",
    price: 78,
    unit: "1L",
    emoji: "🥛",
    rating: 4.8,
    freshness: 100,
    eta: 25,
    description: "Fresh farm milk delivered within 4 hours.",
    stock: 50
  },
  {
    id: "fallback-veggies",
    name: "Fresh Spinach (Palak)",
    category: "veggies",
    price: 29,
    unit: "250g",
    emoji: "🥬",
    rating: 4.7,
    freshness: 95,
    eta: 31,
    description: "Organic hydroponic spinach.",
    stock: 20
  },
  {
    id: "fallback-frozen",
    name: "Chicken Nuggets",
    category: "frozen",
    price: 199,
    unit: "500g",
    emoji: "🍗",
    rating: 4.8,
    freshness: 98,
    eta: 30,
    description: "Crispy golden chicken nuggets.",
    stock: 15
  },
  {
    id: "fallback-drinks",
    name: "Fresh Orange Juice",
    category: "drinks",
    price: 99,
    unit: "1L",
    emoji: "🍹",
    rating: 4.9,
    freshness: 99,
    eta: 25,
    description: "100% natural cold-pressed orange juice.",
    stock: 20
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

function getDeliveryTime(extraMins = 31) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + extraMins);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
  if (hour >= 5 && hour < 12) return "Good morning ☀️";
  if (hour >= 12 && hour < 17) return "Good afternoon 🌤️";
  if (hour >= 17 && hour < 22) return "Good evening 🌙";
  return "Late night cravings? 🍗";
}

function categoryFor(id) {
  const apiCategory = state.categories.find((category) => category.id === id);
  const meta = categoryMeta[id] || categoryMeta["grocery"];
  return {
    ...meta,
    id,
    label: apiCategory?.name || meta.label || id,
    icon: apiCategory?.icon || meta.icon || "🛒"
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
  // Route through PHP api
  const cleanPath = path.replace(/^\/api\//, '');
  const url = `api.php?path=${cleanPath}`;
  
  const response = await fetch(url, {
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
    const apiProducts = (store.products || []).map(normalizeProduct);
    // Combine API products with fallback ones to ensure grids are never empty
    state.products = [...apiProducts, ...fallbackProducts.map(normalizeProduct)];
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
  // Show all categories in the horizontal rail
  const cats = state.categories.filter((category) => category.id !== "all");
  dom.quickCats.innerHTML = cats.map((category) => {
    const meta = categoryFor(category.id);
    return `
      <div class="qcat-card" data-catview="${escapeHtml(category.id)}" data-cat="${escapeHtml(category.id)}">
        <div class="qcat-icon">
          ${meta.icon.startsWith('http') || meta.icon.startsWith('api/') 
            ? `<img src="${escapeHtml(meta.icon)}" style="width:32px; height:32px; object-fit:contain;">` 
            : `<span>${meta.icon || "🥩"}</span>`
          }
        </div>
        <span class="cat-title">${escapeHtml(meta.label)}</span>
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
  if (state.grocerySub && state.grocerySub !== "all") {
    list = list.filter((product) => product.category === state.grocerySub);
  }
  if (query) {
    list = list.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.note.toLowerCase().includes(query)
    );
  }
  return limitFeatured && !query ? list.slice(0, 10) : list;
}

function renderGrid(list) {
  if (!list || list.length === 0) return "";
  return list.map((product, index) => cardHTML(product, index * 35)).join("");
}

function renderFeatured() {
  const query = state.query.trim().toLowerCase();
  let trendingList = state.products;
  if (query) {
    trendingList = trendingList.filter(p => 
      p.category.toLowerCase().includes(query) || 
      p.name.toLowerCase().includes(query)
    );
  } else {
    // If no specific query (Bestsellers), show top rated
    trendingList = trendingList.filter(p => p.rating >= 4.8);
  }

  if (dom.trendingRail) dom.trendingRail.innerHTML = renderGrid(trendingList.slice(0, 8));
  if (dom.featuredGrid) dom.featuredGrid.innerHTML = renderGrid(filteredProducts(true).slice(0, 4));
  if (dom.seafoodGrid) dom.seafoodGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "fish").slice(0, 4));
  if (dom.dairyGrid) dom.dairyGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "dairy" || p.category === "eggs").slice(0, 4));
  if (dom.veggiesGrid) dom.veggiesGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "veggies" || p.category === "fruits").slice(0, 4));
  if (dom.bundlesGrid) dom.bundlesGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "masala").slice(0, 4));
  if (dom.frozenGrid) dom.frozenGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "frozen").slice(0, 4));
  if (dom.drinksGrid) dom.drinksGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "drinks").slice(0, 4));
  if (dom.pantryGrid) dom.pantryGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "masala" || p.category === "pantry").slice(0, 4));
}

function renderGrocerySubcats() {
  if (!dom.grocerySubcats) return;
  const cats = [{ id: "all", name: "All" }, ...state.categories];
  dom.grocerySubcats.innerHTML = cats.map((category) => {
    const meta = categoryFor(category.id);
    const iconHtml = meta.icon.startsWith('http') || meta.icon.startsWith('api/')
      ? `<img src="${escapeHtml(meta.icon)}" style="width:16px; height:16px; object-fit:contain; margin-right:8px;">`
      : `<span class="se">${meta.icon || "🛒"}</span>`;
      
    return `
      <button class="subcat-pill ${state.grocerySub === category.id ? "active" : ""}" data-subcat="${escapeHtml(category.id)}">
        ${iconHtml}${escapeHtml(meta.label)}
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
    dom.modalEta.textContent = `${state.eta} min (By ${getDeliveryTime(state.eta)})`;
    dom.orderModal.classList.add("show");
    await loadStore();
    await loadOrders(customer.phone);
  } catch (error) {
    toast(error.message);
  }
}

function saveAddress() {
  console.log("Saving address...");
  if (!dom.manualAddr) return;
  const address = dom.manualAddr.value.trim();
  if (!address) {
    toast("Please enter your full address");
    return;
  }
  
  state.customer = state.customer || {};
  state.customer.address = address;
  localStorage.setItem("magicmeat_customer", JSON.stringify(state.customer));
  
  if (dom.locAddress) dom.locAddress.textContent = address;
  if (dom.locModal) dom.locModal.classList.remove("show");
  
  toast("✅ Address updated successfully");
  console.log("Address saved:", address);
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
    
    const filter = tag.textContent.trim();
    if (filter === "Bestsellers") state.query = "";
    else if (filter === "Premium Meats") state.query = "chicken"; // or meat
    else if (filter === "Fresh Produce") state.query = "veggies";
    else if (filter === "Daily Groceries") state.query = "dairy";
    
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

  const seeAll = event.target.closest("#seeAllCats");
  if (seeAll) {
    state.grocerySub = "all";
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
if (dom.etaText) dom.etaText.textContent = `${state.eta} min • By ${getDeliveryTime(state.eta)}`;
if (dom.profilePhone) dom.profilePhone.value = state.customer.phone || "";

// Auto-slide for Offers Rail
function initAutoSlider() {
  const rail = $("#offersRail");
  if (!rail) return;
  let scrollIdx = 0;
  setInterval(() => {
    const cards = rail.querySelectorAll(".offer-card");
    if (cards.length === 0) return;
    scrollIdx = (scrollIdx + 1) % cards.length;
    const cardWidth = cards[0].offsetWidth + 16; // width + gap
    rail.scrollTo({ left: scrollIdx * cardWidth, behavior: "smooth" });
  }, 4000);
}
initAutoSlider();

// Auto detect location if not set
if (!state.customer.address) {
  setTimeout(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const realAddress = data.address.suburb || data.address.town || data.address.city || "Hazaribagh";
          const stateName = data.address.state || "";
          const fullAddr = `${realAddress}${stateName ? ', ' + stateName : ''}`;
          
          state.customer.address = fullAddr;
          if (dom.locAddress) dom.locAddress.textContent = fullAddr;
          if (dom.manualAddr) dom.manualAddr.value = fullAddr;
          toast(`📍 Located: ${realAddress}`);
        } catch (e) {
          const fallback = "Hazaribagh, Jharkhand";
          state.customer.address = fallback;
          if (dom.locAddress) dom.locAddress.textContent = fallback;
        }
        dom.locModal.classList.add("show");
      }, () => {
        dom.locModal.classList.add("show");
      });
    } else {
      dom.locModal.classList.add("show");
    }
  }, 1500);
}

loadStore();
