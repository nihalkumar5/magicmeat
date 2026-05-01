const API_BASE = "api.php";

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
  eta: 31,
  previousView: "home"
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
  heroSlider: $("#heroSlider"),
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
  searchResults: $("#searchResults"),
  homeContent: $("#homeContent"),
  offersRail: $("#offersRail"),
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
  logoutBtn: $("#logoutBtn"),
  pdBackBtn: $("#pdBackBtn"),
  pdContent: $("#productDetailContent"),
  
  // Side Cart Drawer
  cartDrawer: $("#cartDrawer"),
  cartDrawerOverlay: $("#cartDrawerOverlay"),
  cartDrawerClose: $("#cartDrawerClose"),
  drawerCartItems: $("#drawerCartItems"),
  drawerCartCount: $("#drawerCartCount"),
  drawerSubtotal: $("#drawerSubtotal"),
  drawerDeliveryFee: $("#drawerDeliveryFee"),
  drawerTotal: $("#drawerTotal"),
  drawerCheckoutBtn: $("#drawerCheckoutBtn"),
  seeAllCats: $("#seeAllCats"),
  offersViewRail: $("#offersViewRail"),
  specialOffersGrid: $("#specialOffersGrid")
};


async function saveSetting(key, inputId) {
  const val = document.getElementById(inputId).value;
  try {
    const res = await fetch(`${API_BASE}?path=admin/settings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` 
      },
      body: JSON.stringify({ k: key, v: val })
    });
    const data = await res.json();
    if (data.success) {
      toast("Setting updated successfully!");
    } else {
      toast("Error updating setting");
    }
  } catch (e) {
    toast("Network error");
  }
}

const categoryMeta = {
  all: { label: "All", icon: "🛒", color: "#0A0A0A", bg: "#F2F2F7" },
  chicken: { label: "Chicken", icon: "🍗", color: "#C62828", bg: "#FFE5E5" },
  mutton: { label: "Mutton", icon: "🥩", color: "#8B1E1E", bg: "#FCE8E8" },
  fish: { label: "Fish", icon: "🐟", color: "#1976D2", bg: "#E3F2FD" },
  eggs: { label: "Eggs", icon: "🥚", color: "#B7791F", bg: "#FFF9C4" },
  grocery: { label: "Grocery", icon: "🥦", color: "#2E7D32", bg: "#E8F5E9" },
  fruits: { label: "Fruits", icon: "🍎", color: "#D97706", bg: "#FFF3E0" },
  veggies: { label: "Vegetables", icon: "🥬", color: "#2E7D32", bg: "#E8F5E9" },
  masala: { label: "Masala", icon: "🌶️", color: "#B91C1C", bg: "#FEE2E2" },
  frozen: { label: "Frozen", icon: "❄️", color: "#2563EB", bg: "#DBEAFE" },
  dairy: { label: "Dairy", icon: "🧈", color: "#CA8A04", bg: "#FEF3C7" }
};

function renderMarquee() {
  const bar = document.querySelector('.marquee-content');
  if (!bar) return;
  const rawText = state.settings?.marquee_text || "✨ Flash Sale: Get 60% OFF on your first order! Use code: FRESH60\n🚚 FREE Delivery on orders above ₹499!";
  
  // Replace newlines with a nice separator
  const formattedText = rawText.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => escapeHtml(line.trim()))
    .join(' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✦ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ');
  
  // Use a separator and repeat for seamless loop
  const content = `<span>${formattedText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✦ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span>${formattedText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✦ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
  bar.innerHTML = content;
}

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

function openCartDrawer() {
  if (dom.cartDrawer) dom.cartDrawer.classList.add("show");
  if (dom.cartDrawerOverlay) dom.cartDrawerOverlay.classList.add("show");
}

function closeCartDrawer() {
  if (dom.cartDrawer) dom.cartDrawer.classList.remove("show");
  if (dom.cartDrawerOverlay) dom.cartDrawerOverlay.classList.remove("show");
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
  const sunIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD93D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:text-bottom; margin-left:8px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y1="4.22"></line></svg>`;
  const moonIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:text-bottom; margin-left:8px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const cloudSunIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD93D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:text-bottom; margin-left:8px;"><path d="M17 18a5 5 0 0 0-10 0"></path><path d="M12 2v1"></path><path x1="4.93" y1="4.93" x2="5.64" y2="5.64"></path><path x1="19.07" y1="4.93" x2="18.36" y2="5.64"></path><path d="M2 12h1"></path><path d="M22 12h1"></path><path x1="4.93" y1="19.07" x2="5.64" y2="18.36"></path><path x1="19.07" y1="19.07" x2="18.36" y2="18.36"></path></svg>`;

  if (hour >= 5 && hour < 12) return `Good morning ${sunIcon}`;
  if (hour >= 12 && hour < 17) return `Good afternoon ${cloudSunIcon}`;
  if (hour >= 17 && hour < 22) return `Good evening ${moonIcon}`;
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

function categoryFor(catId) {
  return categoryMeta[catId] || categoryMeta.all;
}

function normalizeProduct(product) {
  const meta = categoryFor(product.category);
  return {
    ...product,
    id: String(product.id),
    price: Number(product.price || 0),
    mrp: Number(product.mrp || product.price || 0),
    color: product.color || meta.color || "#0A0A0A",
    bg: product.bg || meta.bg || "#F2F2F7",
    emoji: product.emoji || meta.icon || "🥩",
    stock: Number(product.stock || 50),
    rating: Number(product.rating || 5)
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
    const res = await fetch(`${API_BASE}?path=store`);
    const store = await res.json();
    
    state.categories = store.categories || [];
    state.featuredOffers = store.featuredOffers || [];
    state.testimonials = store.testimonials || [];
    state.settings = store.settings || {};
    
    const apiProducts = (store.products || []).map(normalizeProduct);
    if (apiProducts.length > 0) {
      state.products = apiProducts;
    } else {
      state.products = fallbackProducts.map(normalizeProduct);
    }
    
    // Final check - never allow empty products on home
    if (!state.products || state.products.length === 0) {
      state.products = fallbackProducts.map(normalizeProduct);
    }

    renderAll();
    renderMarquee();
    
    // Update dynamic links from settings
    if (state.settings.phone_number) {
      const callBtn = document.getElementById('footerCallBtn');
      if (callBtn) callBtn.href = `tel:${state.settings.phone_number}`;
      const waBtn = document.getElementById('whatsappBtn');
      if (waBtn) waBtn.href = `https://wa.me/${state.settings.phone_number.replace(/\+/g, '')}`;
    }
    
    if (state.customer.phone) {
      loadOrders(state.customer.phone);
    }
  } catch (error) {
    console.error("Store load failed:", error);
    state.products = fallbackProducts.map(normalizeProduct);
    renderFeatured();
    renderHero();
    renderMarquee();
  }
}

async function loadOrders(phone) {
  const p = phone || (state.customer ? state.customer.phone : null);
  if (!p) {
    if (dom.ordersList) {
      dom.ordersList.innerHTML = `
        <div style="text-align:center; padding:60px 20px; opacity:0.5;">
          <div style="font-size:48px; margin-bottom:16px;">📦</div>
          <p>Login with your phone number to see your orders.</p>
          <button class="checkout-btn" style="margin-top:20px;" onclick="switchView('profile')">Login in Profile</button>
        </div>
      `;
    }
    return;
  }
  try {
    const data = await api(`/api/orders?phone=${p}`);
    state.orders = data;
    renderOrders();
  } catch (error) {
    console.error("Orders load failed", error);
  }
  }
}

function switchView(id) {
  if (id !== "productDetail") {
    state.previousView = state.currentView !== "productDetail" ? state.currentView : state.previousView;
  }
  state.currentView = id;
  dom.views.forEach((view) => view.classList.toggle("active", view.id === id));
  // Don't highlight productDetail in tab bar
  const tabId = id === "productDetail" ? state.previousView : id;
  dom.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === tabId));
  // Hide tab bar & call button on product detail page
  const tabBar = $(".tab-bar");
  const callBtn = $("#callToOrder");
  if (tabBar) tabBar.style.display = id === "productDetail" ? "none" : "";
  if (callBtn) callBtn.style.display = id === "productDetail" ? "none" : "";
  window.scrollTo({ top: 0, behavior: "instant" });
  
  if (id === "home") renderFeatured();
  if (id === "grocery") renderGroceryGrid();
  if (id === "offers") renderOffersView();
  if (id === "profile") renderOrderTracking();
  if (id === "cart") renderCart();
}

function renderHeroSlider() {
  if (!dom.heroSlider) return;
  const categories = state.categories || [];
  if (categories.length === 0) return;

  const cards = categories.map(cat => {
    const meta = categoryFor(cat.id);
    const color = meta.color || 'var(--ink)';
    return `
      <div class="hero-banner">
        <h2 style="color: var(--ink)">${cat.name}</h2>
        <p>Premium quality ${cat.name.toLowerCase()} delivered fresh to your doorstep.</p>
        <button class="hero-btn">
          Shop ${cat.name} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="hero-illustration">${meta.icon}</div>
      </div>
    `;
  }).join("");

  dom.heroSlider.innerHTML = cards;
  
  const dotsContainer = document.getElementById("heroDots");
  if (dotsContainer) {
    dotsContainer.innerHTML = categories.map((_, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join("");
    
    // Make dots clickable
    const dots = dotsContainer.querySelectorAll('.hero-dot');
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        dom.heroSlider.scrollTo({ left: dom.heroSlider.offsetWidth * i, behavior: 'smooth' });
      });
    });

    // Sync dots on scroll
    dom.heroSlider.addEventListener('scroll', () => {
      const index = Math.round(dom.heroSlider.scrollLeft / dom.heroSlider.offsetWidth);
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    });
  }
}

function renderOffersView() {
  if (!dom.offersViewRail || !dom.specialOffersGrid) return;
  
  // Use state featured offers or fallback
  const promos = (state.featuredOffers && state.featuredOffers.length) ? state.featuredOffers : [
    { title: "FLASH SALE", desc: "Flat ₹100 OFF on orders > ₹599", code: "MAGIC100", color: "#0F3D2E" },
    { title: "NEW USER", desc: "FREE Delivery on 1st order", code: "FREESHIP", color: "#E37D56" },
    { title: "WEEKEND MEAT", desc: "Extra 10% OFF on Chicken", code: "CHICKEN10", color: "#407BA7" }
  ];
  
  dom.offersViewRail.innerHTML = promos.map(p => `
    <div class="offer-card" onclick="copyCode('${escapeHtml(p.code)}')">
      <div class="offer-content">
        <span class="offer-get">Get</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.subtext || p.desc)}</p>
      </div>
      <img src="${escapeHtml(p.image || 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png')}" class="offer-img-bottom">
    </div>
  `).join("");

  // Populate seasonal specials with featured products
  const specials = state.products.filter(p => p.featured || p.rating > 4.5).slice(0, 6);
  dom.specialOffersGrid.innerHTML = specials.map((p, i) => cardHTML(p, i * 50)).join("");
}

function copyCode(code) {
  navigator.clipboard.writeText(code);
  toast(`📋 Code ${code} copied!`);
}

function renderPromo() {
  const rail = $("#offersRail");
  if (!rail) return;
  
  const promos = (state.featuredOffers && state.featuredOffers.length) ? state.featuredOffers : [
    { title: "60% OFF", subtext: "On First Order", code: "FRESH60", image: "https://cdn-icons-png.flaticon.com/512/3081/3081840.png" },
    { title: "40% OFF", subtext: "On Epigama", code: "EPIGAMA40", image: "https://cdn-icons-png.flaticon.com/512/372/372951.png" },
    { title: "20% OFF", subtext: "Steal this deal", code: "STEAL20", image: "https://cdn-icons-png.flaticon.com/512/2331/2331970.png" },
    { title: "50% OFF", subtext: "Weekly Special", code: "WEEK50", image: "https://cdn-icons-png.flaticon.com/512/1261/1261163.png" }
  ];

  rail.innerHTML = promos.map(p => `
    <div class="offer-card" onclick="copyCode('${escapeHtml(p.code)}')">
      <div class="offer-content">
        <span class="offer-get">Get</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.subtext || p.desc || '')}</p>
      </div>
      <img src="${escapeHtml(p.image || 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png')}" class="offer-img-bottom">
    </div>
  `).join("");
}

function renderTestimonials() {
  const rail = $("#testimonialsRail");
  if (!rail || !state.testimonials || state.testimonials.length === 0) return;
  
  rail.innerHTML = state.testimonials.map(t => `
    <div class="testi-card">
      <p>"${t.text}"</p>
      <div class="testi-user">- ${t.name}</div>
    </div>
  `).join("");
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
          ${meta.icon.includes('.png') || meta.icon.includes('.jpg') || meta.icon.startsWith('http') || meta.icon.startsWith('api/') 
            ? `<img src="${escapeHtml(meta.icon)}" style="width:32px; height:32px; object-fit:contain;">` 
            : `<span>${meta.icon || "🥩"}</span>`
          }
        </div>
        <span class="cat-title">${escapeHtml(meta.label)}</span>
      </div>
    `;
  }).join("");
}

function cardHTML(product, delay = 0, extraClass = "") {
  const quantity = state.cart.get(product.id) || 0;
  
  // Truncate note to ~5 words
  const words = (product.note || 'Freshly packed for your order').split(' ');
  const shortNote = words.length > 5 ? words.slice(0, 5).join(' ') + '...' : words.join(' ');

  return `
    <div class="product-card ${extraClass}" style="animation-delay:${delay}ms" data-product-id="${escapeHtml(product.id)}">
      <div class="product-image">
        ${product.image 
          ? `<img src="${escapeHtml(product.image)}" loading="lazy">` 
          : `<span class="product-emoji">${escapeHtml(product.emoji || "🥩")}</span>`
        }
        <span class="unit-tag">${escapeHtml(product.unit)}</span>
      </div>
      <div class="product-content">
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-note">${escapeHtml(shortNote)}</p>
        <div class="product-meta">
          <span>${Number(product.rating || 4.7).toFixed(1)}</span>
          <span>${Number(product.freshness || 96)}% Fresh</span>
        </div>
        <div class="product-footer">
          <div class="price-stack">
            <span class="price-curr">₹</span>
            <span class="price-val">${product.price}</span>
          </div>
          <div class="add-btn-wrap">
            ${quantity === 0 
              ? `<button class="p-add-circle" data-cadd="${escapeHtml(product.id)}">+</button>`
              : `<div class="p-stepper">
                  <button data-cminus="${escapeHtml(product.id)}">-</button>
                  <span>${quantity}</span>
                  <button data-cadd="${escapeHtml(product.id)}">+</button>
                 </div>`
            }
          </div>
        </div>
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

function renderGrid(list, extraClass = "") {
  if (!list || list.length === 0) return "";
  return list.map((product, index) => cardHTML(product, index * 35, extraClass)).join("");
}

function renderFeatured() {
  const query = state.query.trim().toLowerCase();
  
  if (query) {
    // Search mode
    if (dom.homeContent) dom.homeContent.style.display = "none";
    if (dom.searchResults) {
      dom.searchResults.style.display = "grid";
      const results = state.products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
      
      dom.searchResults.innerHTML = results.length > 0
        ? results.map((p, i) => cardHTML(p, i * 50)).join("")
        : `<div style="grid-column: 1/-1; text-align:center; padding:40px; opacity:0.6;">
            <div style="font-size:48px; margin-bottom:16px;">🔍</div>
            <p>No products found for "${state.query}"</p>
           </div>`;
    }
    // Still render trending rail if visible
    const trendingList = state.products.filter(p => p.name.toLowerCase().includes(query)).slice(0, 8);
    if (dom.trendingRail) dom.trendingRail.innerHTML = renderGrid(trendingList, "trending");
  } else {
    // Home mode
    if (dom.homeContent) dom.homeContent.style.display = "block";
    if (dom.searchResults) dom.searchResults.style.display = "none";
    
    // Filter logic for home page categories
    let featuredList = (state.products && state.products.length > 0) ? state.products : fallbackProducts.map(normalizeProduct);
    const filter = state.homeFilter || "Bestsellers";
    
    if (filter === "Premium Meats") {
      featuredList = featuredList.filter(p => ["chicken", "mutton", "fish"].includes(p.category.toLowerCase()));
    } else if (filter === "Fresh Produce") {
      featuredList = featuredList.filter(p => ["veggies", "grocery"].includes(p.category.toLowerCase()));
    } else if (filter === "Daily Groceries") {
      featuredList = featuredList.filter(p => ["dairy", "eggs"].includes(p.category.toLowerCase()));
    } else {
      // Bestsellers
      featuredList = featuredList.filter(p => p.rating >= 4.0);
    }
    
    // Fallback if filter returns empty
    if (featuredList.length === 0) featuredList = (state.products.length > 0 ? state.products : fallbackProducts.map(normalizeProduct)).slice(0, 8);
    
    const trendingList = (state.products.length > 0 ? state.products : fallbackProducts.map(normalizeProduct)).slice(0, 8);
    if (dom.trendingRail) dom.trendingRail.innerHTML = renderGrid(trendingList, "trending");
    
    if (dom.featuredGrid) dom.featuredGrid.innerHTML = renderGrid(featuredList.slice(0, 8));
    
    if (dom.seafoodGrid) dom.seafoodGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "fish").slice(0, 4));
    if (dom.dairyGrid) dom.dairyGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "dairy" || p.category === "eggs").slice(0, 4));
    if (dom.veggiesGrid) dom.veggiesGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "veggies" || p.category === "fruits").slice(0, 4));
    if (dom.bundlesGrid) dom.bundlesGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "masala").slice(0, 4));
    if (dom.frozenGrid) dom.frozenGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "frozen").slice(0, 4));
    if (dom.drinksGrid) dom.drinksGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "drinks").slice(0, 4));
    if (dom.pantryGrid) dom.pantryGrid.innerHTML = renderGrid(state.products.filter(p => p.category === "masala" || p.category === "pantry").slice(0, 4));
  }
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

  // Decision Psychology: Pulse the cart icon for micro-feedback
  const navCart = document.getElementById('navCartIcon');
  if (navCart && count > 0) {
    navCart.classList.remove('cart-pulse');
    void navCart.offsetWidth; // trigger reflow
    navCart.classList.add('cart-pulse');
  }

  const goalMsg = fee > 0 
    ? `<div class="cart-goal-msg"><span class="goal-icon">🚚</span>Add ${fmt(state.settings.freeDelivery - subtotal)} more for <strong>FREE Delivery</strong></div>`
    : `<div class="cart-goal-msg" style="background:#ECFDF5; color:#059669; border-color:rgba(5,150,105,0.2)"><span class="goal-icon">🎉</span>You've unlocked <strong>FREE Delivery!</strong></div>`;

  if (!items.length) {
    dom.cartItems.innerHTML = `<div class="cart-empty"><h3>Your basket is empty</h3><p>Add fresh picks from the menu.</p></div>`;
    dom.cartSummary.style.display = "none";
    return;
  }

  dom.cartSummary.style.display = "";
  dom.cartItems.innerHTML = goalMsg + items.map((item) => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image 
          ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` 
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

  // Update Drawer
  if (dom.drawerCartItems) {
    if (!items.length) {
      dom.drawerCartItems.innerHTML = `<div class="cart-empty"><h3>Your basket is empty</h3><p>Add fresh picks from the menu.</p></div>`;
      dom.drawerCartCount.textContent = "0 items";
    } else {
      dom.drawerCartCount.textContent = `${count} item${count === 1 ? "" : "s"}`;
      dom.drawerCartItems.innerHTML = goalMsg + items.map((item) => `
        <div class="cart-item">
          <div class="cart-item-img">
            ${item.image 
              ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` 
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
      
      dom.drawerSubtotal.textContent = fmt(subtotal);
      dom.drawerDeliveryFee.textContent = fee === 0 ? "FREE" : fmt(fee);
      dom.drawerTotal.textContent = fmt(subtotal + fee);
    }
  }

  // Update Sticky Cart Bar (Legacy - Keep hidden)
  if (dom.stickyCartBar) {
    dom.stickyCartBar.classList.remove("show");
  }
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
  renderHeroSlider();
  renderPromo();
  renderQuickCats();
  renderFeatured();
  renderBundles();
  renderGrocerySubcats();
  renderGroceryGrid();
  renderTestimonials();
  renderCart();
  renderOrderTracking();
}

function openProductDetail(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  renderProductDetail(product);
  switchView("productDetail");
}

function renderProductDetail(product) {
  if (!dom.pdContent) return;
  const quantity = state.cart.get(product.id) || 0;
  const disabled = product.stock <= 0;
  const hasDiscount = product.mrp && product.mrp > product.price;
  const savings = hasDiscount ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const meta = categoryFor(product.category);

  // Build related products (same category, different id)
  const related = state.products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  dom.pdContent.innerHTML = `
    <div class="pd-hero" style="--pd-bg:${product.bg};--pd-accent:${product.color}">
      ${product.image
        ? `<img src="${escapeHtml(product.image)}" class="pd-hero-img" alt="${escapeHtml(product.name)}">`
        : `<span class="pd-hero-emoji">${escapeHtml(product.emoji)}</span>`
      }
      ${hasDiscount ? `<span class="pd-discount-badge">${savings}% OFF</span>` : ''}
      <span class="pd-unit-badge">${escapeHtml(product.unit)}</span>
    </div>

    <div class="pd-body">
      <div class="pd-category-tag">
        <span class="pd-cat-icon">${escapeHtml(meta.icon)}</span>
        ${escapeHtml(meta.label)}
      </div>

      <h1 class="pd-title">${escapeHtml(product.name)}</h1>

      <div class="pd-rating-row">
        <div class="pd-stars">
          ${'★'.repeat(Math.floor(product.rating || 4.7))}${'☆'.repeat(5 - Math.floor(product.rating || 4.7))}
        </div>
        <span class="pd-rating-num">${Number(product.rating || 4.7).toFixed(1)}</span>
        <span class="pd-freshness">🌿 ${Number(product.freshness || 96)}% Fresh</span>
      </div>

      <p class="pd-description">${escapeHtml(product.note || product.description || 'Premium quality product, freshly sourced and hygienically packed for your convenience.')}</p>

      <div class="pd-highlights">
        <div class="pd-hl-item">
          <div class="pd-hl-icon">⚡</div>
          <div class="pd-hl-text">
            <strong>Express Delivery</strong>
            <span>Within ${product.eta || state.eta} mins</span>
          </div>
        </div>
        <div class="pd-hl-item">
          <div class="pd-hl-icon">🧊</div>
          <div class="pd-hl-text">
            <strong>Cold Chain</strong>
            <span>Temperature controlled</span>
          </div>
        </div>
        <div class="pd-hl-item">
          <div class="pd-hl-icon">🛡️</div>
          <div class="pd-hl-text">
            <strong>Quality Assured</strong>
            <span>100% hygiene certified</span>
          </div>
        </div>
        <div class="pd-hl-item">
          <div class="pd-hl-icon">🔄</div>
          <div class="pd-hl-text">
            <strong>Easy Returns</strong>
            <span>No questions asked</span>
          </div>
        </div>
      </div>

      ${product.stock > 0 && product.stock <= 5 ? `<div class="pd-low-stock">🔥 Only ${product.stock} left in stock — order soon!</div>` : ''}
      ${product.stock <= 0 ? `<div class="pd-out-of-stock">Currently out of stock</div>` : ''}

      ${related.length > 0 ? `
        <div class="pd-related">
          <div class="section-label" style="padding:0 0 12px;">You May Also Like</div>
          <div class="pd-related-rail">
            ${related.map((p, i) => cardHTML(p, i * 35)).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <div class="pd-sticky-bar">
      <div class="pd-price-col">
        <span class="pd-price">${fmt(product.price)}</span>
        ${hasDiscount ? `<span class="pd-mrp">${fmt(product.mrp)}</span>` : ''}
        ${hasDiscount ? `<span class="pd-save-tag">Save ${fmt(product.mrp - product.price)}</span>` : ''}
      </div>
      ${disabled
        ? `<div class="pd-sold-out">Sold Out</div>`
        : quantity === 0
          ? `<button class="pd-add-btn" data-cadd="${escapeHtml(product.id)}">Add to Cart</button>`
          : `<div class="pd-qty-stepper">
               <button data-cminus="${escapeHtml(product.id)}">−</button>
               <span>${quantity}</span>
               <button data-cadd="${escapeHtml(product.id)}">+</button>
             </div>`
      }
    </div>
  `;
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
  openCartDrawer();
  renderFeatured();
  renderGroceryGrid();
  // Re-render product detail if currently viewing it
  if (state.currentView === 'productDetail') {
    const product = state.products.find(p => p.id === productId);
    if (product) renderProductDetail(product);
  }
}

function minusFromCart(productId) {
  const current = state.cart.get(productId) || 0;
  if (current <= 1) state.cart.delete(productId);
  else state.cart.set(productId, current - 1);
  renderCart();
  renderFeatured();
  renderGroceryGrid();
  // Re-render product detail if currently viewing it
  if (state.currentView === 'productDetail') {
    const product = state.products.find(p => p.id === productId);
    if (product) renderProductDetail(product);
  }
}

function openCheckout() {
  if (!cartCount()) return;
  const saved = state.customer || {};
  if (dom.customerName) dom.customerName.value = saved.name || "";
  if (dom.customerPhone) dom.customerPhone.value = saved.phone || "";
  
  // Structured address
  const addr = saved.address || "";
  if (dom.customerAddress) dom.customerAddress.value = addr;
  
  dom.checkoutModal.classList.add("show");
}

async function placeOrder(event) {
  event.preventDefault();
  
  const name = $("#customerName").value.trim();
  const phone = $("#customerPhone").value.trim();
  const house = $("#customerHouse").value.trim();
  const street = $("#customerStreet").value.trim();
  const landmark = $("#customerLandmark").value.trim();
  const pincode = $("#customerPincode").value.trim();
  const paymentMethod = $("#customerPayment").value;
  
  if (!name || !phone || !house || !street || !pincode) {
    toast("Please fill all required fields");
    return;
  }

  const fullAddress = `${house}, ${street}${landmark ? ', ' + landmark : ''}, ${pincode}`;
  const total = calculateTotal().toFixed(2);
  const items = [];
  state.cart.forEach((quantity, productId) => items.push({ productId, quantity }));

  const orderPayload = {
    customerName: name,
    phone: phone,
    address: fullAddress,
    paymentMethod: paymentMethod,
    total: total,
    items: items
  };

  // Persistent login
  state.customer = { name, phone, address: fullAddress };
  localStorage.setItem("magicmeat_customer", JSON.stringify(state.customer));

  if (paymentMethod === "Razorpay") {
    const options = {
      key: "rzp_test_YOUR_KEY_HERE", // User to replace with actual key
      amount: Math.round(total * 100),
      currency: "INR",
      name: "MagicMeat",
      description: "Order Payment",
      handler: async function (response) {
        orderPayload.paymentId = response.razorpay_payment_id;
        submitOrder(orderPayload);
      },
      prefill: { name, contact: phone },
      theme: { color: "#0F3D2E" }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  } else {
    submitOrder(orderPayload);
  }
}

async function submitOrder(payload) {
  try {
    const order = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    
    state.cart.clear();
    updateCartUI();
    dom.checkoutModal.classList.remove("show");
    dom.modalOrderId.textContent = `Order #${order.id.slice(-8)}`;
    dom.modalEta.textContent = `${state.eta} min (By ${getDeliveryTime(state.eta)})`;
    dom.orderModal.classList.add("show");
    
    await loadStore();
    await loadOrders(payload.phone);
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

dom.tabs.forEach((tab) => tab.addEventListener("click", () => {
  switchView(tab.dataset.view);
  closeCartDrawer();
}));
if (dom.cartDrawerClose) dom.cartDrawerClose.addEventListener("click", closeCartDrawer);
if (dom.cartDrawerOverlay) dom.cartDrawerOverlay.addEventListener("click", closeCartDrawer);
if (dom.drawerCheckoutBtn) dom.drawerCheckoutBtn.addEventListener("click", () => {
  closeCartDrawer();
  openCheckout();
});

if (dom.checkoutBtn) dom.checkoutBtn.addEventListener("click", openCheckout);
if (dom.checkoutClose) dom.checkoutClose.addEventListener("click", () => dom.checkoutModal.classList.remove("show"));
if (dom.checkoutForm) dom.checkoutForm.addEventListener("submit", placeOrder);

// Tab navigation handled via dom.tabs loop above
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
    
    state.homeFilter = tag.textContent.trim();
    state.query = ""; // Reset search query when clicking home filters
    if (dom.searchInp) dom.searchInp.value = "";
    
    renderFeatured();
    // Scroll home to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
if (dom.seeAllCats) dom.seeAllCats.addEventListener("click", () => switchView("grocery"));
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

  const heroBtn = event.target.closest(".hero-btn");
  if (heroBtn) {
    state.grocerySub = "all";
    switchView("grocery");
    renderGrocerySubcats();
    renderGroceryGrid();
    return;
  }

  const shuffleTrending = event.target.closest("#shuffleTrending");
  if (shuffleTrending) {
    // 1. Play Click Sound
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, context.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.1);
    } catch(e) {}

    // 2. Haptic Feedback
    if (navigator.vibrate) navigator.vibrate(10);

    // 3. Shuffle logic
    const rail = dom.trendingRail;
    if (rail) {
      rail.style.transition = "all 0.3s var(--ease)";
      rail.style.opacity = "0.3";
      rail.style.transform = "translateX(20px)";
      
      setTimeout(() => {
        const items = Array.from(rail.children);
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          rail.appendChild(items[j]);
        }
        rail.style.opacity = "1";
        rail.style.transform = "translateX(0)";
      }, 300);
    }
    return;
  }

  const seeAllCats = event.target.closest("#seeAllCats");
  if (seeAllCats) {
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
    return;
  }

  // Product card click → open product detail page
  const card = event.target.closest(".product-card");
  if (card && !event.target.closest("[data-cadd], [data-cminus], [data-plus], [data-minus], .card-stepper button")) {
    const pid = card.dataset.productId;
    if (pid) {
      openProductDetail(pid);
      return;
    }
  }
});

if (dom.greetText) dom.greetText.innerHTML = greeting();
if (dom.locAddress) dom.locAddress.textContent = state.customer.address || "Set delivery address";
if (dom.etaText) dom.etaText.textContent = `${state.eta} min • By ${getDeliveryTime(state.eta)}`;
if (dom.profilePhone) dom.profilePhone.value = state.customer.phone || "";

// Product detail back button
if (dom.pdBackBtn) dom.pdBackBtn.addEventListener("click", () => {
  switchView(state.previousView || "home");
});

// Auto-slide logic removed as per user request
function initAutoSlider() {
  // Disabled
}

function initHeroAutoSlider() {
  // Disabled
}
initAutoSlider();
initHeroAutoSlider();

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
