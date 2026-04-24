console.log("MagicMeat App Loading...");

// ─── SUPABASE CONFIG ───
const SB_URL = "https://cchrlbgffpqauwgzszia.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHJsYmdmZnBxYXV3Z3pzemlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjIwNzgsImV4cCI6MjA5MjUzODA3OH0.UQAQohGU9VQ6R6z9rRMZFLuZxt2KFVAusOaU5GydlXA";
const supabase = window.supabase.createClient(SB_URL, SB_KEY);

const state = { 
  currentView: "home", 
  grocerySub: "all", 
  query: "", 
  cart: new Map(), 
  address: "", 
  eta: 31,
  products: [
    { id: 'demo1', name: 'Premium Chicken Cut', price: 299, unit: '500g', category: 'meat', note: 'Fresh & antibiotic free', color: '#C62828', bg: '#FFE5E5', image_url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400' },
    { id: 'demo2', name: 'Fresh Salmon Fillet', price: 899, unit: '250g', category: 'fish', note: 'Rich in Omega-3', color: '#1976D2', bg: '#E3F2FD', image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400' },
    { id: 'demo3', name: 'Organic Broccoli', price: 99, unit: '250g', category: 'veggies', note: 'Farm fresh green', color: '#2E7D32', bg: '#E8F5E9', image_url: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400' }
  ],
  categories: [
    { id: 'meat', label: 'Meat', icon: '🥩', color: '#C62828', bg: '#FFE5E5' },
    { id: 'fish', label: 'Fish', icon: '🐟', color: '#1976D2', bg: '#E3F2FD' },
    { id: 'veggies', label: 'Veggies', icon: '🥬', color: '#2E7D32', bg: '#E8F5E9' }
  ],
  settings: { freeDelivery: 499, deliveryFee: 49 },
  user: null,
  authMode: "login",
  orders: [],
  promos: []
};

const grocerySubcats = [
  { id: "all",       label: "All",         emoji: "🛒" },
  { id: "meat",      label: "Meat",        emoji: "🥩" },
  { id: "fish",      label: "Fish",        emoji: "🐟" },
  { id: "grocery",   label: "Grocery",     emoji: "🥚" },
  { id: "fruits",    label: "Fruits",      emoji: "🍎" },
  { id: "veggies",   label: "Vegetables",  emoji: "🥬" },
  { id: "masala",    label: "Masala",      emoji: "🌶️" },
  { id: "frozen",    label: "Frozen",      emoji: "❄️" },
  { id: "icecream",  label: "Ice Cream",   emoji: "🍦" },
  { id: "dairy",     label: "Dairy",       emoji: "🧈" },
];

// ─── DOM REFS ───
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const dom = {
  views: $$(".view"), tabs: $$(".tab-item"),
  locAddress: $("#locationAddress"), locBtn: $("#locationBtn"), etaText: $("#etaText"),
  greetText: $("#greetingText"), searchInput: $("#searchInput"),
  promoCarousel: $("#promoCarousel"), promoDots: $("#promoDots"),
  quickCats: $("#quickCategories"), featuredGrid: $("#featuredGrid"),
  grocerySubcats: $("#grocerySubcats"), groceryGrid: $("#groceryGrid"),
  cartItems: $("#cartItems"), cartSub: $("#cartSubtitle"),
  subtotal: $("#subtotal"), deliveryFee: $("#deliveryFee"),
  cartTotal: $("#cartTotal"), cartBadge: $("#cartBadge"),
  cartSummary: $("#cartSummaryBlock"), checkoutBtn: $("#checkoutButton"),
  toast: $("#toast"), orderModal: $("#orderModal"), modalEta: $("#modalEta"),
  modalClose: $("#modalClose"), locModal: $("#locationModal"),
  detectBtn: $("#detectLocationBtn"), manualAddr: $("#manualAddress"),
  saveAddrBtn: $("#saveAddressBtn"),
  authScreen: $("#authScreen"), authEmail: $("#authEmail"), authPass: $("#authPass"),
  authPrimaryBtn: $("#authPrimaryBtn"), authSubtitle: $("#authSubtitle"),
  toggleAuthMode: $("#toggleAuthMode"), loginGoogle: $("#loginGoogle"),
  loginFacebook: $("#loginFacebook"), skipAuth: $("#skipAuth"),
  profileEmail: $("#profileEmail"), activeOrders: $("#activeOrders"),
  orderHistory: $("#orderHistory"), logoutBtn: $("#logoutBtn")
};

// ─── UTILS ───
const fmt = v => `₹${v.toLocaleString("en-IN")}`;
let tt; function toast(m) { dom.toast.textContent=m; dom.toast.classList.add("visible"); clearTimeout(tt); tt=setTimeout(()=>dom.toast.classList.remove("visible"),2200); }
function greeting() { const h=new Date().getHours(); return h<12?"Good morning ☀️":h<17?"Good afternoon 🌤️":h<21?"Good evening 🌙":"Late night cravings? 🌃"; }
function cartCount() { return [...state.cart.values()].reduce((s,q)=>s+q,0); }
function cartTotal() { let t=0; state.cart.forEach((q,id)=>{const p=state.products.find(x=>x.id===id);if(p)t+=p.price*q}); return t; }

// Haptic feedback (Capacitor)
function haptic() {
  if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
    window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
  }
}

// ─── SUPABASE DATA FETCH ───
async function fetchData() {
  console.log("Starting fetchData...");
  
  // 1. Fetch Categories
  try {
    const { data: cats, error } = await supabase.from('categories').select('*').order('id');
    if (error) throw error;
    if (cats && cats.length > 0) {
      state.categories = cats;
      console.log("Categories loaded from Supabase:", state.categories.length);
      renderQuickCats();
    } else {
      console.log("No categories in Supabase, keeping demo data.");
    }
  } catch (e) { console.error("Cats fetch error:", e); }

  // 2. Fetch Products
  try {
    const { data: prods, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (prods && prods.length > 0) {
      state.products = prods;
      console.log("Products loaded from Supabase:", state.products.length);
      renderFeatured();
      renderGroceryGrid();
    } else {
      console.log("No products in Supabase, keeping demo data.");
    }
  } catch (e) { console.error("Prods fetch error:", e); }

  // 3. Fetch Promos
  try {
    const { data: prms, error } = await supabase.from('promos').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (error) throw error;
    state.promos = prms || [];
    console.log("Promos loaded:", state.promos.length);
    renderPromo();
  } catch (e) { console.error("Promos fetch error:", e); }

  // 4. Fetch Settings
  try {
    const { data: sets } = await supabase.from('settings').select('*');
    if (sets) {
      sets.forEach(s => {
        if (s.key === 'store_settings') state.settings = s.value;
      });
    }
  } catch (e) {}

  // 5. Auth Check (Background)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      state.user = session.user;
      dom.profileEmail.textContent = state.user.email;
      fetchOrders();
      subscribeOrders();
    } else if (!sessionStorage.getItem("auth_skipped")) {
      dom.authScreen.classList.add("show");
    }
  } catch (e) { console.warn("Auth check failed, continuing as guest"); }
}

async function fetchOrders() {
  if(!state.user) return;
  const { data } = await supabase.from('orders').select('*').eq('user_email', state.user.email).order('created_at', { ascending: false });
  if(data) {
    state.orders = data;
    renderOrderTracking();
  }
}

function subscribeOrders() {
  if(!state.user) return;
  supabase.channel('order-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_email=eq.${state.user.email}` }, () => {
      fetchOrders();
    })
    .subscribe();
}

// ─── AUTH ACTIONS ───
async function handleAuth() {
  haptic();
  const email = dom.authEmail.value;
  const password = dom.authPass.value;
  if(!email || !password) { toast("Fill all fields"); return; }
  
  dom.authPrimaryBtn.disabled = true;
  dom.authPrimaryBtn.textContent = "Loading...";

  try {
    if(state.authMode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if(error) throw error;
      state.user = data.user;
      dom.profileEmail.textContent = state.user.email;
      fetchOrders();
      subscribeOrders();
      toast(`Welcome back!`);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if(error) throw error;
      toast("Check your email for confirmation!");
    }
    dom.authScreen.classList.remove("show");
  } catch(err) {
    toast(err.message);
  } finally {
    dom.authPrimaryBtn.disabled = false;
    dom.authPrimaryBtn.textContent = state.authMode === "login" ? "Sign In" : "Sign Up";
  }
}

async function socialLogin(provider) {
  haptic();
  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if(error) toast(error.message);
}

function toggleAuth() {
  haptic();
  state.authMode = state.authMode === "login" ? "signup" : "login";
  dom.authSubtitle.textContent = state.authMode === "login" ? "Experience premium fresh delivery" : "Join the MagicMeat community";
  dom.authPrimaryBtn.textContent = state.authMode === "login" ? "Sign In" : "Sign Up";
  dom.toggleAuthMode.textContent = state.authMode === "login" ? "Sign Up" : "Sign In";
  $(".auth-toggle").innerHTML = state.authMode === "login" ? `Don't have an account? <a href="#" id="toggleAuthMode">Sign Up</a>` : `Already have an account? <a href="#" id="toggleAuthMode">Sign In</a>`;
  $("#toggleAuthMode").onclick = (e) => { e.preventDefault(); toggleAuth(); };
}

// ─── NAV ───
function switchView(id) {
  haptic();
  state.currentView=id;
  dom.views.forEach(v=>{v.classList.remove("active");if(v.id===id)v.classList.add("active")});
  dom.tabs.forEach(t=>t.classList.toggle("active",t.dataset.view===id));
  window.scrollTo({top:0,behavior:"instant"});
}

// ─── RENDERS ───
function renderOrderTracking() {
  const active = state.orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const past = state.orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  dom.activeOrders.innerHTML = active.length ? active.map(o => `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">#${o.id.toString().slice(-6)}</span>
        <span class="order-status ${o.status}">${o.status}</span>
      </div>
      <div class="order-body">
        ${o.items.map(it => `<div class="order-item-row"><span>${it.qty}x ${it.name}</span><span>${fmt(it.price * it.qty)}</span></div>`).join("")}
      </div>
      <div class="order-timeline">
        <div class="t-dot active"></div>
        <div class="t-dot ${['confirmed','delivered'].includes(o.status)?'active':''}"></div>
        <div class="t-dot ${o.status==='delivered'?'active':''}"></div>
      </div>
      <div class="order-footer">
        <span class="order-time">${new Date(o.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        <span class="order-total">${fmt(o.total)}</span>
      </div>
    </div>`).join("") : `<div class="cart-empty" style="padding:20px">No active orders</div>`;

  dom.orderHistory.innerHTML = past.map(o => `
    <div class="order-card" style="opacity:0.7">
      <div class="order-header">
        <span class="order-id">#${o.id.toString().slice(-6)}</span>
        <span class="order-status delivered">${o.status}</span>
      </div>
      <div class="order-footer">
        <span class="order-time">${new Date(o.created_at).toLocaleDateString()}</span>
        <span class="order-total">${fmt(o.total)}</span>
      </div>
    </div>`).join("");
}

function cardHTML(p, delay=0) {
  const qty = state.cart.get(p.id)||0;
  const stepper = qty === 0
    ? `<div class="card-stepper single" data-pid="${p.id}"><button data-cadd="${p.id}">+</button></div>`
    : `<div class="card-stepper expanded" data-pid="${p.id}">
         <button data-cminus="${p.id}">−</button>
         <span class="qty-num">${qty}</span>
         <button data-cadd="${p.id}">+</button>
       </div>`;
  return `<div class="product-card" style="animation-delay:${delay}ms" data-product-id="${p.id}">
    <div class="product-image" style="--card-bg:${p.bg};--card-accent:${p.color}">
      ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy">` : ''}
      <span class="unit-tag">${p.unit}</span>
    </div>
    <h3>${p.name}</h3><p class="product-note">${p.note}</p>
    <div class="product-footer"><span class="product-price">${fmt(p.price)}</span>${stepper}</div>
  </div>`;
}

function renderPromo() {
  if (!dom.promoCarousel || !state.promos.length) return;
  
  dom.promoCarousel.innerHTML = state.promos.map(p => `
    <div class="promo-card" style="background:${p.bg_color};color:${p.text_color}">
      ${p.badge_text ? `<div class="promo-badge">${p.badge_text}</div>` : ''}
      <h2>${p.title}</h2>
      <p>${p.subtitle || ''}</p>
      ${p.image_url ? `<img src="${p.image_url}" class="promo-side-img" alt="promo">` : ''}
    </div>`).join("");

  const n=state.promos.length;
  dom.promoDots.innerHTML=Array.from({length:n},(_,i)=>`<span class="${i===0?'active':''}"></span>`).join("");
  dom.promoCarousel.onscroll = () => {
    const idx=Math.round(dom.promoCarousel.scrollLeft/dom.promoCarousel.offsetWidth);
    dom.promoDots.querySelectorAll("span").forEach((d,i)=>d.classList.toggle("active",i===idx));
  };
}

function renderQuickCats() {
  dom.quickCats.innerHTML = state.categories.map(c=>`
    <div class="qcat-card" data-catview="${c.id}" data-cat="${c.id}">
      <div class="qcat-icon" style="background:${c.bg || ''}; border-color:${c.color ? c.color+'22' : ''}">
        <span>${c.icon}</span>
      </div>
      <span>${c.label}</span>
    </div>`).join("");
}

function renderFeatured() {
  const q = state.query.trim().toLowerCase();
  let list = state.products;
  
  if (q) {
    list = state.products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.note && p.note.toLowerCase().includes(q)) || 
      p.category.toLowerCase().includes(q)
    );
  } else {
    list = state.products.slice(0, 10);
  }

  if (!list.length && state.products.length > 0) {
    dom.featuredGrid.innerHTML = `<div class="grid-empty"><h3>No results found</h3></div>`;
    return;
  }
  
  if (!list.length) {
    dom.featuredGrid.innerHTML = `<div class="grid-empty"><h3>Loading products...</h3></div>`;
    return;
  }

  dom.featuredGrid.innerHTML = list.map((p, i) => cardHTML(p, i * 40)).join("");
}

function renderGrocerySubcats() {
  dom.grocerySubcats.innerHTML = grocerySubcats.map(s=>`
    <button class="subcat-pill ${state.grocerySub===s.id?'active':''}" data-subcat="${s.id}">
      <span class="se">${s.emoji}</span>${s.label}
    </button>`).join("");
}

function renderGroceryGrid() {
  let list = state.products;
  if(state.grocerySub!=="all") list=list.filter(p=>p.category===state.grocerySub);
  if(!list.length){dom.groceryGrid.innerHTML=`<div class="grid-empty"><h3>Coming soon</h3></div>`;return}
  dom.groceryGrid.innerHTML=list.map((p,i)=>cardHTML(p,i*40)).join("");
}

function renderCart() {
  const items=[]; state.cart.forEach((q,id)=>{const p=state.products.find(x=>x.id===id);if(p)items.push({...p,qty:q})});
  const tq=cartCount(), tp=cartTotal();
  const freeThreshold = state.settings.freeDelivery || 499;
  const dfFee = state.settings.deliveryFee || 49;
  const df = tp >= freeThreshold ? 0 : dfFee;
  const gt = tp + df;
  
  dom.cartBadge.textContent=tq; dom.cartBadge.classList.toggle("show",tq>0);
  dom.cartSub.textContent=`${tq} item${tq!==1?'s':''}`;
  
  if(!items.length){
    dom.cartItems.innerHTML=`<div class="cart-empty"><h3>Your basket is empty</h3></div>`;
    dom.cartSummary.style.display="none"; return;
  }
  
  dom.cartSummary.style.display="";
  dom.cartItems.innerHTML=items.map(i=>`<div class="cart-item">
    <div class="cart-item-img" style="--item-bg:${i.bg};--item-color:${i.color}">${i.image_url?`<img src="${i.image_url}"/>`:''}</div>
    <div class="cart-item-info"><div class="cart-item-title">${i.name}</div><div class="cart-item-meta">${i.unit}</div></div>
    <div class="cart-item-right"><div class="cart-item-price">${fmt(i.price*i.qty)}</div>
      <div class="qty-control"><button class="qty-btn" data-minus="${i.id}">${i.qty===1?'✕':'−'}</button><span class="qty-val">${i.qty}</span><button class="qty-btn" data-plus="${i.id}">+</button></div>
    </div></div>`).join("");
    
  dom.subtotal.textContent=fmt(tp); dom.deliveryFee.textContent=df===0?"FREE":fmt(df);
  dom.cartTotal.textContent=fmt(gt); dom.checkoutBtn.disabled=tq===0;
}

function renderAll() {
  renderPromo();
  renderQuickCats();
  renderFeatured();
  renderGrocerySubcats();
  renderGroceryGrid();
  renderCart();
}

// ─── CART ACTIONS ───
function addToCart(pid) {
  haptic();
  const q=state.cart.get(pid)||0; state.cart.set(pid,q+1);
  renderCart();
  animateCard(pid);
}
function minusFromCart(pid) {
  haptic();
  const q=state.cart.get(pid)||0;
  if(q<=1) state.cart.delete(pid); else state.cart.set(pid,q-1);
  renderCart();
}

// ─── RAZORPAY & CHECKOUT ───
function processCheckout() {
  haptic();
  const total = cartTotal();
  const df = total >= (state.settings.freeDelivery || 499) ? 0 : (state.settings.deliveryFee || 49);
  const finalAmount = (total + df) * 100; // in paisa

  const options = {
    key: "rzp_test_yourkeyhere", // Replace with real key
    amount: finalAmount,
    currency: "INR",
    name: "MagicMeat",
    description: "Premium Fresh Delivery",
    handler: async function (response) {
      saveOrder(response.razorpay_payment_id);
    },
    prefill: {
      email: state.user ? state.user.email : "",
      contact: ""
    },
    theme: { color: "#0A0A0A" }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

async function saveOrder(paymentId = "GUEST_COD") {
  const orderItems=[];
  state.cart.forEach((qty,id)=>{const p=state.products.find(x=>x.id===id);if(p)orderItems.push({name:p.name,qty,price:p.price})});
  const total=cartTotal();
  const df = total >= (state.settings.freeDelivery || 499) ? 0 : (state.settings.deliveryFee || 49);

  try {
    const { error } = await supabase.from('orders').insert({
      items: orderItems,
      total: total + df,
      address: state.address || "Not set",
      status: "pending",
      user_email: state.user ? state.user.email : "Guest User",
      payment_id: paymentId
    });
    if (error) throw error;
    
    dom.modalEta.textContent=`${state.eta} min`;
    dom.orderModal.classList.add("show");
    state.cart.clear(); renderCart(); renderFeatured(); renderGroceryGrid();
    if(state.user) fetchOrders();
  } catch (err) { toast("Order failed!"); }
}

// ─── EVENTS ───
dom.tabs.forEach(t=>t.addEventListener("click",()=>{if(t.dataset.view)switchView(t.dataset.view)}));
dom.authPrimaryBtn.onclick = handleAuth;
dom.toggleAuthMode.onclick = (e) => { e.preventDefault(); toggleAuth(); };
dom.loginGoogle.onclick = () => socialLogin('google');
dom.loginFacebook.onclick = () => socialLogin('facebook');
dom.skipAuth.onclick = () => { haptic(); sessionStorage.setItem("auth_skipped", "1"); dom.authScreen.classList.remove("show"); };
dom.logoutBtn.onclick = async () => { haptic(); await supabase.auth.signOut(); location.reload(); };

document.addEventListener("click",e=>{
  const qcat=e.target.closest("[data-catview]");
  if(qcat){switchView("grocery");state.grocerySub=qcat.dataset.catview;renderGrocerySubcats();renderGroceryGrid();return}
  const add=e.target.closest("[data-cadd]"); if(add){addToCart(add.dataset.cadd);return}
  const minus=e.target.closest("[data-cminus]"); if(minus){minusFromCart(minus.dataset.cminus);return}
  const sub=e.target.closest("[data-subcat]"); if(sub){state.grocerySub=sub.dataset.subcat;renderGrocerySubcats();renderGroceryGrid();return}
  const mBtn=e.target.closest("[data-minus]"); if(mBtn){minusFromCart(mBtn.dataset.minus);return}
  const pBtn=e.target.closest("[data-plus]"); if(pBtn){addToCart(pBtn.dataset.plus);return}
});

dom.checkoutBtn.onclick = processCheckout;
dom.modalClose.onclick = () => { dom.orderModal.classList.remove("show"); switchView("home"); };
dom.searchInput.oninput = e => { state.query=e.target.value; renderFeatured(); };
dom.locBtn.onclick = () => dom.locModal.classList.add("show");
dom.detectBtn.onclick = () => { haptic(); /* detect logic... */ };
dom.saveAddrBtn.onclick = () => {
  haptic();
  const a = dom.manualAddr.value.trim();
  if(a){state.address=a; dom.locAddress.textContent=a; dom.locModal.classList.remove("show"); toast("Address saved");}
};

// ─── INIT ───
try {
  dom.greetText.textContent = greeting();
  renderAll(); // Initial render with demo data
  fetchData(); // Then try to fetch from Supabase
} catch (e) {
  console.error("Initialization error:", e);
}
