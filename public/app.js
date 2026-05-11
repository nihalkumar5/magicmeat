const API_BASE = "/api";
const adminToken = localStorage.getItem("magicmeat_admin_token") || "magicmeat-admin-token";
console.log("MagicMeat v3.0 loaded");

const state = {
  currentView: "home",
  grocerySub: "all",
  query: "",
  cart: new Map(),
  appliedPromo: null,
  discount: 0,
  products: [],
  categories: [],
  featuredOffers: [],
  orders: [],
  customer: JSON.parse(localStorage.getItem("magicmeat_customer") || "{}"),
  token: localStorage.getItem("magicmeat_token") || null,
  user: JSON.parse(localStorage.getItem("magicmeat_user") || "null"),
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
  customerHouse: $("#customerHouse"),
  customerStreet: $("#customerStreet"),
  customerLandmark: $("#customerLandmark"),
  customerPincode: $("#customerPincode"),
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
  specialOffersGrid: $("#specialOffersGrid"),
  
  // Auth DOM
  authModal: $("#authModal"),
  authClose: $("#authClose"),
  loginForm: $("#loginForm"),
  signupForm: $("#signupForm"),
  authLoginPhone: $("#authLoginPhone"),
  authLoginPassword: $("#authLoginPassword"),
  authSignupName: $("#authSignupName"),
  authSignupPhone: $("#authSignupPhone"),
  authSignupPassword: $("#authSignupPassword"),
  showSignupBtn: $("#showSignupBtn"),
  showLoginBtn: $("#showLoginBtn"),
  guestCheckoutBtn: $("#guestCheckoutBtn"),

  // Promo Code DOM
  promoInput: $("#promoInput"),
  applyPromoBtn: $("#applyPromoBtn"),
  promoMsg: $("#promoMsg"),
  discountRow: $("#discountRow"),
  discountAmount: $("#discountAmount"),
  drawerPromoInput: $("#drawerPromoInput"),
  applyDrawerPromoBtn: $("#applyDrawerPromoBtn"),
  drawerPromoMsg: $("#drawerPromoMsg"),
  drawerDiscountRow: $("#drawerDiscountRow"),
  drawerDiscountAmount: $("#drawerDiscountAmount")
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
  all: { label: "All", icon: "ALL", color: "#1F2933", bg: "#F5F2EC" },
  chicken: { label: "Chicken", icon: "CHK", color: "#8F3E38", bg: "#F7ECE8" },
  mutton: { label: "Mutton", icon: "MTN", color: "#7B3833", bg: "#F4E9E6" },
  fish: { label: "Fish", icon: "FSH", color: "#2F6473", bg: "#E8F1F2" },
  eggs: { label: "Eggs", icon: "EGG", color: "#8A6C2C", bg: "#F8F0D8" },
  grocery: { label: "Grocery", icon: "GRY", color: "#496D4B", bg: "#EEF3EA" },
  fruits: { label: "Fruits", icon: "FRT", color: "#9A6040", bg: "#F7EDE4" },
  veggies: { label: "Vegetables", icon: "VEG", color: "#496D4B", bg: "#EEF3EA" },
  masala: { label: "Masala", icon: "MSL", color: "#8F3E38", bg: "#F7ECE8" },
  frozen: { label: "Frozen", icon: "FRZ", color: "#486276", bg: "#E8EEF2" },
  dairy: { label: "Dairy", icon: "DRY", color: "#8A6C2C", bg: "#F8F0D8" }
};

function renderMarquee() {
  const bar = document.querySelector('.marquee-content');
  if (!bar) return;
  const rawText = stripPictographs(state.settings?.marquee_text) || "First order gets 60% off with FRESH60\nFree delivery above ₹499";
  
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
    emoji: "CHK",
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
    emoji: "FSH",
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
    emoji: "DRY",
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
    emoji: "VEG",
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
    emoji: "CHK",
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
    emoji: "JCE",
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
const stripPictographs = (value) =>
  String(value ?? "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s{2,}/g, " ").trim();

function renderProductMark(value, label = "MagicMeat") {
  const safeValue = String(value || "MM");
  if (safeValue.includes(".png") || safeValue.includes(".jpg") || safeValue.startsWith("http") || safeValue.startsWith("api/")) {
    return `<img src="${escapeHtml(safeValue)}" alt="${escapeHtml(label)}" loading="lazy">`;
  }
  return `<span class="mark-text">${escapeHtml(safeValue.slice(0, 4).toUpperCase())}</span>`;
}

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
  // Morning: 5 AM - 12 PM
  // Afternoon: 12 PM - 5 PM
  // Evening: 5 PM - 9 PM
  // Night: 9 PM - 5 AM
  
  const sunIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD93D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:text-bottom; margin-left:8px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y1="4.22"></line></svg>`;
  const moonIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:text-bottom; margin-left:8px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  const cloudSunIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD93D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:text-bottom; margin-left:8px;"><path d="M17 18a5 5 0 0 0-10 0"></path><path d="M12 2v1"></path><path x1="4.93" y1="4.93" x2="5.64" y2="5.64"></path><path x1="19.07" y1="4.93" x2="18.36" y2="5.64"></path><path d="M2 12h1"></path><path d="M22 12h1"></path><path x1="4.93" y1="19.07" x2="5.64" y2="18.36"></path><path x1="19.07" y1="19.07" x2="18.36" y2="18.36"></path></svg>`;
  const starIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFD93D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:text-bottom; margin-left:8px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

  if (hour >= 5 && hour < 12) return `Good morning ${sunIcon}`;
  if (hour >= 12 && hour < 17) return `Good afternoon ${cloudSunIcon}`;
  if (hour >= 17 && hour < 21) return `Good evening ${moonIcon}`;
  return `Late night cravings? ${starIcon}`;
}

function updateTimeAesthetic() {
  const hour = new Date().getHours();
  const root = document.documentElement;
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  
  let theme = {
    ink: "#0F3D2E",
    inkSoft: "#145A3F",
    surfaceWarm: "#FFFDF0",
    accent: "#FFD93D",
    bodyBg: "#E5E1D8",
    headerBg: "#FFD93D",
    paper: "#FFFFFF",
    muted: "#6B8C7E",
    glass: "rgba(255, 255, 255, 0.8)"
  };



  root.style.setProperty("--ink", theme.ink);
  root.style.setProperty("--ink-soft", theme.inkSoft);
  root.style.setProperty("--surface-warm", theme.surfaceWarm);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--paper", theme.paper);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--ink-inverse", theme.surfaceWarm);
  
  document.body.style.background = theme.bodyBg;
  const header = document.querySelector(".glass-header");
  if (header) {
    header.style.background = theme.headerBg;
    header.style.backdropFilter = "blur(12px)";
    header.style.webkitBackdropFilter = "blur(12px)";
  }
  
  if (themeColorMeta) themeColorMeta.setAttribute("content", theme.headerBg);
  
  if (dom.greetText) dom.greetText.innerHTML = greeting();
  
  // Update marquee if exists
  const marquee = document.querySelector(".marquee-bar");
  if (marquee) marquee.style.background = theme.headerBg;
}

function categoryFor(id) {
  const apiCategory = state.categories.find((category) => category.id === id);
  const meta = categoryMeta[id] || categoryMeta["grocery"];
  return {
    ...meta,
    id,
    label: apiCategory?.name || meta.label || id,
    icon: apiCategory?.icon || meta.icon || "ALL"
  };
}

function cleanMark(value, fallback = "MM") {
  const mark = String(value || "").trim();
  if (!mark) return fallback;
  if (mark.startsWith("http") || mark.startsWith("api/") || /\.(png|jpe?g|svg|webp)$/i.test(mark)) return mark;
  return /[^\x00-\x7F]/.test(mark) ? fallback : mark.slice(0, 4).toUpperCase();
}

function normalizeProduct(product) {
  const meta = categoryFor(product.category);
  const mark = cleanMark(product.emoji, meta.icon || "MM");
  return {
    ...product,
    id: String(product.id),
    price: Number(product.price || 0),
    mrp: Number(product.mrp || product.price || 0),
    color: product.color || meta.color || "#0A0A0A",
    bg: product.bg || meta.bg || "#F2F2F7",
    emoji: mark,
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
  const freeAbove = Number(state.settings.free_delivery_threshold || 499);
  const fee = Number(state.settings.delivery_fee || 29);
  return subtotal >= freeAbove ? 0 : fee;
}

function calculateTotal() {
  const subtotal = cartSubtotal();
  const fee = deliveryFeeFor(subtotal);
  return Math.max(0, subtotal + fee - (state.discount || 0));
}

function applyPromoCode(code) {
  if (!code) return;
  const promo = state.featuredOffers.find(o => o.code.toUpperCase() === code.toUpperCase());
  const subtotal = cartSubtotal();

  if (!promo) {
    showPromoMsg("Invalid promo code", "error");
    state.appliedPromo = null;
    state.discount = 0;
  } else if (subtotal < (promo.min_order_amount || 0)) {
    showPromoMsg(`Min. order ₹${promo.min_order_amount} required`, "error");
    state.appliedPromo = null;
    state.discount = 0;
  } else {
    state.appliedPromo = promo;
    if (promo.discount_type === 'percent') {
      state.discount = Math.round((subtotal * promo.discount_value) / 100);
    } else {
      state.discount = Number(promo.discount_value || 0);
    }
    showPromoMsg(`Promo applied: -₹${state.discount}`, "success");
  }
  renderCart();
}

function showPromoMsg(msg, type) {
  const color = type === "success" ? "#145A3F" : "#D64545";
  const drawerColor = type === "success" ? "var(--accent)" : "#FF6B6B";
  
  if (dom.promoMsg) {
    dom.promoMsg.textContent = msg;
    dom.promoMsg.style.color = color;
    dom.promoMsg.style.display = "block";
  }
  if (dom.drawerPromoMsg) {
    dom.drawerPromoMsg.textContent = msg;
    dom.drawerPromoMsg.style.color = drawerColor;
    dom.drawerPromoMsg.style.display = "block";
  }
}

function updateCartUI() {
  renderCart();
  renderFeatured();
  renderGroceryGrid();
  closeCartDrawer();
}

async function api(path, options = {}) {
  const cleanPath = path.replace(/^\/api\//, '').replace(/^\//, '');
  const url = `/api/${cleanPath}`;
  
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
    const res = await fetch(`/api/store?_=${Date.now()}`);
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
      const heroCallBtn = document.getElementById('heroCallBtn');
      if (heroCallBtn) heroCallBtn.href = `tel:${state.settings.phone_number}`;
    }
    
    const waNumber = state.settings.whatsapp_number || state.settings.phone_number;
    if (waNumber) {
      const waBtn = document.getElementById('whatsappBtn');
      if (waBtn) waBtn.href = `https://wa.me/${waNumber.replace(/\+/g, '')}`;
      const heroWaBtn = document.getElementById('heroWaBtn');
      if (heroWaBtn) heroWaBtn.href = `https://wa.me/${waNumber.replace(/\+/g, '')}`;
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
          <div class="empty-mark" style="margin-bottom:16px;">ORD</div>
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
        <div class="hero-illustration">${renderProductMark(meta.icon, meta.label)}</div>
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
  toast(`Code ${code} copied`);
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
    emoji: 'BOX'
  }));
  
  dom.bundlesGrid.innerHTML = bundles.length
    ? bundles.map((product, index) => cardHTML(product, index * 35)).join("")
    : `<div class="grid-empty"><h3>Coming soon</h3></div>`;
}

function getCatSvg(id) {
  const svgs = {
    chicken: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m20.5 14.5-6-6"/><path d="M12.5 11.5c-1.5 1.5-4.5 1.5-6 0s-1.5-4.5 0-6s4.5-1.5 6 0s1.5 4.5 0 6Z"/><path d="m12.5 11.5 4 4c1 1 2.5 1 3.5 0v0c1-1 1-2.5 0-3.5l-4-4"/></svg>`,
    dairy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8"/><path d="M9 2v4.2c0 .8-.5 1.6-1.3 1.9l-2.4 1A4 4 0 0 0 3 12.8V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.2a4 4 0 0 0-2.3-3.7l-2.4-1A2 2 0 0 1 15 6.2V2"/></svg>`,
    eggs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5 0 9-4.5 9-10S17 2 12 2 3 7.5 3 12s4 10 9 10Z"/></svg>`,
    fish: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12c-3.6-4.5-8.5-5.6-11.8-5.5-3.3.1-6.1 1.6-8.2 4.1L2 12l.6 1.8c2.4 7.2 9 8.2 13 8.2 4.1 0 7.4-4 8.4-6L22 12Z"/><path d="M22 12c-2.3 0-4-1.8-4-4"/><path d="M22 12c-2.3 0-4 1.8-4 4"/><circle cx="8" cy="11" r="1"/></svg>`,
    frozen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 20-2-2 2-2"/><path d="m14 20 2-2-2-2"/><path d="m10 4-2 2 2 2"/><path d="m14 4 2 2-2 2"/><path d="m20 10-2 2 2 2"/><path d="m4 10 2 2-2 2"/><path d="m20 14-2-2 2-2"/><path d="m4 14 2-2-2-2"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>`,
    mutton: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V8"/><path d="M11 16V8"/><path d="M15 16V8"/><path d="M3 8c0-3 2-5 5-5h8c3 0 5 2 5 5v8c0 3-2 5-5 5H8c-3 0-5-2-5-5V8Z"/></svg>`,
    veggies: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 22 12 12"/></svg>`,
    grocery: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`
  };
  return svgs[id.toLowerCase()] || svgs.default;
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
          ${meta.icon && (meta.icon.includes('.') || meta.icon.startsWith('http') || meta.icon.startsWith('api/'))
            ? `<div style="width:32px; height:32px; background-color: var(--ink); -webkit-mask: url('${escapeHtml(meta.icon)}') no-repeat center; mask: url('${escapeHtml(meta.icon)}') no-repeat center; -webkit-mask-size: contain; mask-size: contain;"></div>`
            : getCatSvg(category.id)
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
          ? `<img src="${escapeHtml(product.image)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
          : ''
        }
        <span class="product-emoji" style="${product.image ? 'display:none;' : 'display:flex;'}">${escapeHtml(product.emoji || "MM")}</span>
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
            <div class="empty-mark" style="margin-bottom:16px;">SRCH</div>
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
      : `<span class="se">${escapeHtml(meta.icon || "ALL")}</span>`;
      
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

  const freeAbove = Number(state.settings.free_delivery_threshold || 499);
  const goalMsg = fee > 0 
    ? `<div class="cart-goal-msg"><span class="goal-icon">DEL</span>Add ${fmt(freeAbove - subtotal)} more for <strong>free delivery</strong></div>`
    : `<div class="cart-goal-msg is-unlocked"><span class="goal-icon">OK</span>Free delivery unlocked</div>`;

  if (!items.length) {
    dom.cartItems.innerHTML = `<div class="cart-empty"><h3>Your basket is empty</h3><p>Add fresh picks from the menu.</p></div>`;
    dom.cartSummary.style.display = "none";
    state.appliedPromo = null;
    state.discount = 0;
    if (dom.promoMsg) dom.promoMsg.style.display = "none";
    if (dom.drawerPromoMsg) dom.drawerPromoMsg.style.display = "none";
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
  dom.cartTotal.textContent = fmt(calculateTotal());
  dom.checkoutBtn.disabled = count === 0;

  // Handle Discount UI
  if (state.discount > 0) {
    if (dom.discountRow) dom.discountRow.style.display = "flex";
    if (dom.discountAmount) dom.discountAmount.textContent = `-₹${state.discount}`;
    if (dom.drawerDiscountRow) dom.drawerDiscountRow.style.display = "flex";
    if (dom.drawerDiscountAmount) dom.drawerDiscountAmount.textContent = `-₹${state.discount}`;
  } else {
    if (dom.discountRow) dom.discountRow.style.display = "none";
    if (dom.drawerDiscountRow) dom.drawerDiscountRow.style.display = "none";
  }

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
      dom.drawerTotal.textContent = fmt(calculateTotal());
    }
  }

  // Update Sticky Cart Bar (Legacy - Keep hidden)
  if (dom.stickyCartBar) {
    dom.stickyCartBar.classList.remove("show");
  }
}

function renderOrderTracking() {
  if (!dom.activeOrders || !dom.orderHistory) return;
  
  // Auto-fill phone from saved customer data (guest checkout)
  const savedPhone = state.customer ? state.customer.phone : '';
  if (dom.profilePhone && !dom.profilePhone.value && savedPhone) {
    dom.profilePhone.value = savedPhone;
  }
  
  // Auto-load orders if we have a phone but no orders loaded yet
  const currentPhone = dom.profilePhone ? dom.profilePhone.value : savedPhone;
  if (currentPhone && state.orders.length === 0) {
    loadOrders(currentPhone);
    return; // loadOrders will call renderOrderTracking again via renderOrders
  }
  
  const activeStatuses = new Set(["placed", "packing", "out_for_delivery"]);
  const active = state.orders.filter((order) => activeStatuses.has(order.status));
  const past = state.orders.filter((order) => !activeStatuses.has(order.status));

  dom.profileEmail.textContent = currentPhone ? `Tracking ${currentPhone}` : "Track by phone";
  dom.activeOrders.innerHTML = active.length
    ? active.map(orderCard).join("")
    : `<div class="cart-empty compact"><h3>No active orders</h3><p>Your current order status will show here.</p></div>`;
  dom.orderHistory.innerHTML = past.length
    ? past.map(orderCard).join("")
    : `<div class="cart-empty compact"><h3>No past orders</h3></div>`;
}

function orderCard(order) {
  const statusConfig = {
    placed: { label: "Order Placed", icon: "📋", color: "#F97316", bg: "#FFF7ED" },
    packing: { label: "Packing", icon: "📦", color: "#3B82F6", bg: "#EFF6FF" },
    out_for_delivery: { label: "Out for Delivery", icon: "🛵", color: "#8B5CF6", bg: "#F5F3FF" },
    delivered: { label: "Delivered", icon: "✅", color: "#059669", bg: "#ECFDF5" },
    cancelled: { label: "Cancelled", icon: "❌", color: "#DC2626", bg: "#FEF2F2" }
  };
  const config = statusConfig[order.status] || statusConfig.placed;
  
  const items = Array.isArray(order.items)
    ? order.items
    : (() => { try { return JSON.parse(order.items || "[]"); } catch { return []; } })();

  // Resolve product names from state
  const resolvedItems = items.map(item => {
    const product = state.products.find(p => p.id === item.productId);
    const name = item.name || (product ? product.name : item.productId);
    const price = item.unitPrice || (product ? product.price : 0);
    return { ...item, name, unitPrice: price };
  });

  const steps = ["placed", "packing", "out_for_delivery", "delivered"];
  const currentStep = steps.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isActive = !isCancelled && order.status !== "delivered";

  // ETA calculation
  const orderDate = new Date(order.createdAt);
  const etaDate = new Date(orderDate.getTime() + 31 * 60000);
  const now = new Date();
  const minsLeft = Math.max(0, Math.round((etaDate - now) / 60000));
  const etaText = isActive ? (minsLeft > 0 ? `~${minsLeft} min` : "Arriving soon!") : "";

  // Format date
  const dateStr = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const timeline = isCancelled ? '' : `
    <div class="ot-timeline">
      ${steps.map((step, i) => {
        const done = i <= currentStep;
        const active = i === currentStep && isActive;
        const label = statusConfig[step].label.split(' ').pop();
        return `
          <div class="ot-step ${done ? 'done' : ''} ${active ? 'current' : ''}">
            <div class="ot-dot">${done ? (active ? statusConfig[step].icon : '✓') : ''}</div>
            ${i < steps.length - 1 ? `<div class="ot-line ${done && i < currentStep ? 'filled' : ''}"></div>` : ''}
          </div>`;
      }).join('')}
      <div class="ot-labels">
        ${steps.map(s => `<span>${statusConfig[s].label.split(' ').pop()}</span>`).join('')}
      </div>
    </div>`;

  return `
    <div class="order-card ${isActive ? 'order-active' : ''}">
      <div class="order-header">
        <div class="order-id-wrap">
          <span class="order-id">#${escapeHtml(order.id.slice(-8))}</span>
          <span class="order-date">${dateStr}, ${timeStr}</span>
        </div>
        <span class="order-status-pill" style="background:${config.bg};color:${config.color}">
          ${config.icon} ${escapeHtml(config.label)}
        </span>
      </div>
      ${isActive && etaText ? `
        <div class="order-eta-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Estimated: <strong>${etaText}</strong></span>
        </div>` : ''}
      ${timeline}
      <div class="order-items-list">
        ${resolvedItems.map(item => `
          <div class="ot-item">
            <div class="ot-item-qty">${item.quantity}×</div>
            <div class="ot-item-name">${escapeHtml(item.name)}</div>
            <div class="ot-item-price">${fmt(item.quantity * item.unitPrice)}</div>
          </div>
        `).join("")}
      </div>
      <div class="order-footer-v2">
        <div class="order-meta">
          <span class="order-payment">${escapeHtml(order.paymentMethod || 'COD')}</span>
          ${order.address ? `<span class="order-addr">📍 ${escapeHtml((order.address || '').slice(0, 40))}${(order.address || '').length > 40 ? '...' : ''}</span>` : ''}
        </div>
        <div class="order-total-v2">₹${Number(order.total).toFixed(0)}</div>
      </div>
      ${order.status === 'delivered' ? `
        <button class="reorder-btn" onclick="reorderItems('${escapeHtml(order.id)}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          Reorder
        </button>` : ''}
    </div>`;
}

function reorderItems(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  const items = Array.isArray(order.items) ? order.items : (() => { try { return JSON.parse(order.items || "[]"); } catch { return []; } })();
  items.forEach(item => {
    const product = state.products.find(p => p.id === item.productId);
    if (product && product.stock > 0) {
      const existing = state.cart.find(c => c.id === item.productId);
      if (existing) {
        existing.qty = Math.min(existing.qty + item.quantity, product.stock);
      } else {
        state.cart.push({ id: item.productId, qty: item.quantity });
      }
    }
  });
  saveCart();
  renderCart();
  renderCartBadge();
  toast("Items added to cart!");
  switchView("cart");
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
        <span class="pd-freshness">${Number(product.freshness || 96)}% fresh</span>
      </div>

      <p class="pd-description">${escapeHtml(product.note || product.description || 'Premium quality product, freshly sourced and hygienically packed for your convenience.')}</p>

      <div class="pd-highlights">
        <div class="pd-hl-item">
          <div class="pd-hl-icon">ETA</div>
          <div class="pd-hl-text">
            <strong>Express Delivery</strong>
            <span>Within ${product.eta || state.eta} mins</span>
          </div>
        </div>
        <div class="pd-hl-item">
          <div class="pd-hl-icon">0-4</div>
          <div class="pd-hl-text">
            <strong>Cold Chain</strong>
            <span>Temperature controlled</span>
          </div>
        </div>
        <div class="pd-hl-item">
          <div class="pd-hl-icon">QA</div>
          <div class="pd-hl-text">
            <strong>Quality Assured</strong>
            <span>100% hygiene certified</span>
          </div>
        </div>
        <div class="pd-hl-item">
          <div class="pd-hl-icon">RET</div>
          <div class="pd-hl-text">
            <strong>Easy Returns</strong>
            <span>No questions asked</span>
          </div>
        </div>
      </div>

      ${product.stock > 0 && product.stock <= 5 ? `<div class="pd-low-stock">Only ${product.stock} left in stock. Order soon.</div>` : ''}
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
  if (dom.customerStreet) dom.customerStreet.value = addr;
  
  dom.checkoutModal.classList.add("show");
}

async function placeOrder(event) {
  event.preventDefault();
  console.log("placeOrder called");
  
  try {
    const name = $("#customerName").value.trim();
    const phone = $("#customerPhone").value.trim();
    const house = $("#customerHouse").value.trim();
    const street = $("#customerStreet").value.trim();
    const landmark = $("#customerLandmark").value.trim();
    const pincode = $("#customerPincode").value.trim();
    const paymentMethod = $("#customerPayment").value;
    
    console.log("Fields:", { name, phone, house, street, pincode, paymentMethod });
    
    if (!name || !phone || !house || !street || !pincode) {
      toast("Please fill all required fields");
      return;
    }

    const fullAddress = `${house}, ${street}${landmark ? ', ' + landmark : ''}, ${pincode}`;
    const total = calculateTotal().toFixed(2);
    const items = [];
    state.cart.forEach((quantity, productId) => items.push({ productId, quantity }));
    
    console.log("Order total:", total, "Items:", items);

    const orderPayload = {
      customerName: name,
      phone: phone,
      address: fullAddress,
      paymentMethod: paymentMethod,
      total: total,
      promoCode: state.appliedPromo ? state.appliedPromo.code : null,
      discount: state.discount,
      items: items
    };

    // Persistent login
    state.customer = { name, phone, address: fullAddress };
    localStorage.setItem("magicmeat_customer", JSON.stringify(state.customer));

    if (paymentMethod === "Razorpay") {
      try {
        const rzpOrder = await api("payment/create-order", {
          method: "POST",
          body: JSON.stringify({ amount: Math.round(total * 100) })
        });
        
        if (!rzpOrder || !rzpOrder.order_id) {
          toast("Razorpay configuration missing on server.");
          return;
        }

        const options = {
          key: rzpOrder.key,
          amount: Math.round(total * 100),
          currency: "INR",
          name: "MagicMeat",
          description: "Order Payment",
          order_id: rzpOrder.order_id,
          handler: async function (response) {
            try {
              const verify = await api("payment/verify", {
                method: "POST",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              if (verify && verify.success) {
                orderPayload.paymentId = response.razorpay_payment_id;
                submitOrder(orderPayload);
              } else {
                toast("Payment verification failed.");
              }
            } catch(err) {
              toast("Error verifying payment.");
            }
          },
          prefill: { name, contact: phone },
          theme: { color: "#4A1F24" }
        };
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){
          toast("Payment Failed: " + response.error.description);
        });
        rzp.open();
      } catch (e) {
        console.error("Razorpay error:", e);
        toast("Error initializing payment: " + e.message);
      }
    } else {
      console.log("Submitting COD order...");
      await submitOrder(orderPayload);
    }
  } catch (err) {
    console.error("placeOrder error:", err);
    toast("Order failed: " + err.message);
  }
}

async function submitOrder(payload) {
  console.log("submitOrder called, payload:", JSON.stringify(payload).slice(0, 200));
  try {
    const order = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    console.log("Order response:", order);
    
    state.cart.clear();
    state.appliedPromo = null;
    state.discount = 0;
    updateCartUI();
    dom.checkoutModal.classList.remove("show");
    if (dom.modalOrderId) dom.modalOrderId.textContent = `Order #${(order.id || '').slice(-8)}`;
    if (dom.modalEta) dom.modalEta.textContent = `${state.eta} min (By ${getDeliveryTime(state.eta)})`;
    if (dom.orderModal) dom.orderModal.classList.add("show");
    
    await loadStore();
    await loadOrders(payload.phone);
  } catch (error) {
    console.error("submitOrder error:", error);
    toast("Order failed: " + error.message);
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
  
  toast("Address updated");
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
  if (!state.token) {
    dom.authModal.classList.add("show");
  } else {
    openCheckout();
  }
});

if (dom.checkoutBtn) dom.checkoutBtn.addEventListener("click", () => {
  if (!state.token) {
    // Show auth modal before checkout
    dom.authModal.classList.add("show");
  } else {
    openCheckout();
  }
});
if (dom.checkoutClose) dom.checkoutClose.addEventListener("click", () => dom.checkoutModal.classList.remove("show"));
if (dom.checkoutForm) dom.checkoutForm.addEventListener("submit", placeOrder);

// Auth Event Listeners
if (dom.authClose) dom.authClose.addEventListener("click", () => dom.authModal.classList.remove("show"));
if (dom.showSignupBtn) dom.showSignupBtn.addEventListener("click", (e) => {
  e.preventDefault();
  dom.loginForm.style.display = "none";
  dom.signupForm.style.display = "block";
  dom.authModal.querySelector("#authModalTitle").textContent = "Create Account";
  dom.authModal.querySelector("#authModalDesc").textContent = "Join MagicMeat for faster checkout.";
});
if (dom.showLoginBtn) dom.showLoginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  dom.signupForm.style.display = "none";
  dom.loginForm.style.display = "block";
  dom.authModal.querySelector("#authModalTitle").textContent = "Login / Sign Up";
  dom.authModal.querySelector("#authModalDesc").textContent = "Enter your details to manage orders and checkout faster.";
});

if (dom.guestCheckoutBtn) dom.guestCheckoutBtn.addEventListener("click", () => {
  dom.authModal.classList.remove("show");
  openCheckout();
});

if (dom.applyPromoBtn) dom.applyPromoBtn.addEventListener("click", () => applyPromoCode(dom.promoInput.value));
if (dom.applyDrawerPromoBtn) dom.applyDrawerPromoBtn.addEventListener("click", () => applyPromoCode(dom.drawerPromoInput.value));

if (dom.loginForm) dom.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await api("auth/login", {
      method: "POST",
      body: JSON.stringify({ phone: dom.authLoginPhone.value, password: dom.authLoginPassword.value })
    });
    if (res.token) {
      state.token = res.token;
      state.user = res.user;
      localStorage.setItem("magicmeat_token", res.token);
      localStorage.setItem("magicmeat_user", JSON.stringify(res.user));
      dom.authModal.classList.remove("show");
      toast("Logged in successfully!");
      if (state.cart.size > 0) openCheckout(); // Continue checkout if cart has items
    }
  } catch(err) {
    toast(err.message || "Login failed");
  }
});

if (dom.signupForm) dom.signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await api("auth/register", {
      method: "POST",
      body: JSON.stringify({ name: dom.authSignupName.value, phone: dom.authSignupPhone.value, password: dom.authSignupPassword.value })
    });
    if (res.token) {
      state.token = res.token;
      state.user = res.user;
      localStorage.setItem("magicmeat_token", res.token);
      localStorage.setItem("magicmeat_user", JSON.stringify(res.user));
      dom.authModal.classList.remove("show");
      toast("Account created successfully!");
      if (state.cart.size > 0) openCheckout();
    }
  } catch(err) {
    toast(err.message || "Signup failed");
  }
});

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
    if (dom.searchInput) dom.searchInput.value = "";
    
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

// Auto-update time aesthetic
updateTimeAesthetic();
setInterval(updateTimeAesthetic, 60000);
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
          toast(`Located: ${realAddress}`);
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
