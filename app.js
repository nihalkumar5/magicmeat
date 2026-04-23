/* MagicMeat — Premium Fresh Delivery App with Supabase Backend */

// ─── SUPABASE CONFIG ───
const SB_URL = "https://cchrlbgffpqauwgzszia.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHJsYmdmZnBxYXV3Z3pzemlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjIwNzgsImV4cCI6MjA5MjUzODA3OH0.UQAQohGU9VQ6R6z9rRMZFLuZxt2KFVAusOaU5GydlXA";
const supabase = window.supabase.createClient(SB_URL, SB_KEY);

// ─── STATE ───
const state = { 
  currentView: "home", 
  grocerySub: "all", 
  query: "", 
  cart: new Map(), 
  address: "", 
  eta: 31,
  products: [],
  categories: [],
  settings: { freeDelivery: 499, deliveryFee: 49 },
  user: null,
  authMode: "login"
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
  saveAddrBtn: $("#saveAddressBtn"), requestTab: $("#requestTab"),
  authScreen: $("#authScreen"), authEmail: $("#authEmail"), authPass: $("#authPass"),
  authPrimaryBtn: $("#authPrimaryBtn"), authSubtitle: $("#authSubtitle"),
  toggleAuthMode: $("#toggleAuthMode"), loginGoogle: $("#loginGoogle"),
  loginFacebook: $("#loginFacebook"), skipAuth: $("#skipAuth"),
};

// ─── UTILS ───
const fmt = v => `₹${v.toLocaleString("en-IN")}`;
let tt; function toast(m) { dom.toast.textContent=m; dom.toast.classList.add("visible"); clearTimeout(tt); tt=setTimeout(()=>dom.toast.classList.remove("visible"),2200); }
function greeting() { const h=new Date().getHours(); return h<12?"Good morning ☀️":h<17?"Good afternoon 🌤️":h<21?"Good evening 🌙":"Late night cravings? 🌃"; }
function cartCount() { return [...state.cart.values()].reduce((s,q)=>s+q,0); }
function cartTotal() { let t=0; state.cart.forEach((q,id)=>{const p=state.products.find(x=>x.id===id);if(p)t+=p.price*q}); return t; }

// ─── SUPABASE DATA FETCH ───
async function fetchData() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) state.user = session.user;
    else if (!sessionStorage.getItem("auth_skipped")) dom.authScreen.classList.add("show");

    const { data: cats } = await supabase.from('categories').select('*').order('id');
    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const { data: sets } = await supabase.from('settings').select('*');
    
    if (cats) state.categories = cats;
    if (prods) state.products = prods;
    if (sets) {
      sets.forEach(s => {
        if (s.key === 'store_settings') state.settings = s.value;
      });
    }
    
    renderAll();
  } catch (err) {
    console.error("Supabase error:", err);
    toast("Error loading data from server");
  }
}

// ─── AUTH ACTIONS ───
async function handleAuth() {
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
  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if(error) toast(error.message);
}

function toggleAuth() {
  state.authMode = state.authMode === "login" ? "signup" : "login";
  dom.authSubtitle.textContent = state.authMode === "login" ? "Experience premium fresh delivery" : "Join the MagicMeat community";
  dom.authPrimaryBtn.textContent = state.authMode === "login" ? "Sign In" : "Sign Up";
  dom.toggleAuthMode.textContent = state.authMode === "login" ? "Sign Up" : "Sign In";
  $(".auth-toggle").innerHTML = state.authMode === "login" ? `Don't have an account? <a href="#" id="toggleAuthMode">Sign Up</a>` : `Already have an account? <a href="#" id="toggleAuthMode">Sign In</a>`;
  // Re-bind because we replaced HTML
  $("#toggleAuthMode").onclick = (e) => { e.preventDefault(); toggleAuth(); };
}

// ─── NAV ───
function switchView(id) {
  state.currentView=id;
  dom.views.forEach(v=>{v.classList.remove("active");if(v.id===id)v.classList.add("active")});
  dom.tabs.forEach(t=>t.classList.toggle("active",t.dataset.view===id));
  window.scrollTo({top:0,behavior:"instant"});
}

// ─── PRODUCT CARD ───
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

// ─── RENDER ───
function renderPromo() {
  if (!dom.promoCarousel) return;
  const n=dom.promoCarousel.children.length;
  dom.promoDots.innerHTML=Array.from({length:n},(_,i)=>`<span class="${i===0?'active':''}"></span>`).join("");
  dom.promoCarousel.addEventListener("scroll",()=>{
    const idx=Math.round(dom.promoCarousel.scrollLeft/dom.promoCarousel.offsetWidth);
    dom.promoDots.querySelectorAll("span").forEach((d,i)=>d.classList.toggle("active",i===idx));
  });
}

function renderQuickCats() {
  dom.quickCats.innerHTML = state.categories.slice(0,6).map(c=>`
    <div class="qcat-card" data-catview="${c.id}" style="--qcat-bg:${c.bg};--qcat-border:${c.color}22;--qcat-shadow:${c.color}18">
      <div class="qcat-icon" style="background:${c.color}18"><span style="font-size:28px">${c.icon}</span></div>
      <span>${c.label.split(" ")[0]}</span>
    </div>`).join("");
}

function renderFeatured() {
  const q=state.query.trim().toLowerCase();
  let list=state.products;
  if(q) list=state.products.filter(p=>p.name.toLowerCase().includes(q)||p.note.toLowerCase().includes(q)||p.category.includes(q));
  if(!list.length){dom.featuredGrid.innerHTML=`<div class="grid-empty"><h3>No results</h3><p>Try "chicken", "paratha", or "paneer"</p></div>`;return}
  dom.featuredGrid.innerHTML=list.slice(0,6).map((p,i)=>cardHTML(p,i*50)).join("");
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
  if(!list.length){dom.groceryGrid.innerHTML=`<div class="grid-empty"><h3>Coming soon</h3><p>More items on the way.</p></div>`;return}
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
    dom.cartItems.innerHTML=`<div class="cart-empty"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><h3>Your basket is empty</h3><p>Add items to get started.</p></div>`;
    dom.cartSummary.style.display="none"; return;
  }
  
  dom.cartSummary.style.display="";
  dom.cartItems.innerHTML=items.map(i=>`<div class="cart-item">
    <div class="cart-item-img" style="--item-bg:${i.bg};--item-color:${i.color}"></div>
    <div class="cart-item-info"><div class="cart-item-title">${i.name}</div><div class="cart-item-meta">${i.unit} · ${i.category}</div></div>
    <div class="cart-item-right"><div class="cart-item-price">${fmt(i.price*i.qty)}</div>
      <div class="qty-control"><button class="qty-btn ${i.qty===1?'remove':''}" data-minus="${i.id}">${i.qty===1?'✕':'−'}</button><span class="qty-val">${i.qty}</span><button class="qty-btn" data-plus="${i.id}">+</button></div>
    </div></div>`).join("");
    
  dom.subtotal.textContent=fmt(tp); dom.deliveryFee.textContent=df===0?"FREE":fmt(df); dom.deliveryFee.className=df===0?"free-tag":"";
  dom.cartTotal.textContent=fmt(gt); dom.checkoutBtn.disabled=tq===0;
}

function renderAll() {
  renderQuickCats(); renderFeatured(); renderGrocerySubcats(); renderGroceryGrid(); renderCart();
}

// ─── Update stepper in-place ───
function updateStepper(pid) {
  const qty = state.cart.get(pid)||0;
  document.querySelectorAll(`[data-pid="${pid}"]`).forEach(el => {
    if(qty===0) {
      el.className="card-stepper single";
      el.innerHTML=`<button data-cadd="${pid}">+</button>`;
    } else {
      el.className="card-stepper expanded";
      el.innerHTML=`<button data-cminus="${pid}">−</button><span class="qty-num">${qty}</span><button data-cadd="${pid}">+</button>`;
    }
  });
}

function animateCard(pid) {
  document.querySelectorAll(`[data-product-id="${pid}"]`).forEach(c=>{
    c.classList.remove("bounce"); void c.offsetWidth; c.classList.add("bounce");
  });
  dom.cartBadge.classList.remove("pop"); void dom.cartBadge.offsetWidth; dom.cartBadge.classList.add("pop");
}

// ─── CART ACTIONS ───
function addToCart(pid) {
  const q=state.cart.get(pid)||0; state.cart.set(pid,q+1);
  const p=state.products.find(x=>x.id===pid);
  renderCart(); updateStepper(pid); animateCard(pid);
  toast(`${p.name} added`);
}
function minusFromCart(pid) {
  const q=state.cart.get(pid)||0;
  if(q<=1) state.cart.delete(pid); else state.cart.set(pid,q-1);
  renderCart(); updateStepper(pid);
}

// ─── LOCATION ───
function setAddr(a){state.address=a;dom.locAddress.textContent=a||"Add address";state.eta=25+Math.floor(Math.random()*15);dom.etaText.textContent=`${state.eta} min delivery`}
function detectLoc(){
  if(!navigator.geolocation){toast("Geolocation not supported");return}
  dom.locAddress.textContent="Detecting…";
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);const d=await r.json();const a=d.address;setAddr([a.suburb||a.neighbourhood||a.town,a.city||a.state_district].filter(Boolean).join(", ")||"Location detected")}catch{setAddr("Location detected")}
    dom.locModal.classList.remove("show"); toast("Address updated");
  },()=>{setAddr("Mumbai, Maharashtra");dom.locModal.classList.remove("show");toast("Using default")},{enableHighAccuracy:true,timeout:8000});
}

// ─── EVENTS ───
dom.tabs.forEach(t=>t.addEventListener("click",()=>{if(t.dataset.view)switchView(t.dataset.view)}));
dom.requestTab.addEventListener("click",()=>{
  if(!state.user) {
    dom.authScreen.classList.add("show");
    return;
  }
  const msg = `User: ${state.user.email}\nI want to place a custom order.`;
  window.open(`https://wa.me/919999999999?text=${encodeURIComponent(msg)}`,"_blank");
});

dom.authPrimaryBtn.onclick = handleAuth;
dom.toggleAuthMode.onclick = (e) => { e.preventDefault(); toggleAuth(); };
dom.loginGoogle.onclick = () => socialLogin('google');
dom.loginFacebook.onclick = () => socialLogin('facebook');
dom.skipAuth.onclick = () => {
  sessionStorage.setItem("auth_skipped", "1");
  dom.authScreen.classList.remove("show");
};

document.addEventListener("click",e=>{
  const qcat=e.target.closest("[data-catview]");
  if(qcat){switchView("grocery");state.grocerySub=qcat.dataset.catview;renderGrocerySubcats();renderGroceryGrid();return}
  const add=e.target.closest("[data-cadd]");
  if(add){addToCart(add.dataset.cadd);return}
  const minus=e.target.closest("[data-cminus]");
  if(minus){minusFromCart(minus.dataset.cminus);return}
  const sub=e.target.closest("[data-subcat]");
  if(sub){state.grocerySub=sub.dataset.subcat;renderGrocerySubcats();renderGroceryGrid();return}
  const mBtn=e.target.closest("[data-minus]");if(mBtn){minusFromCart(mBtn.dataset.minus);return}
  const pBtn=e.target.closest("[data-plus]");if(pBtn){addToCart(pBtn.dataset.plus);return}
});

dom.searchInput.addEventListener("input",e=>{state.query=e.target.value;renderFeatured()});
dom.locBtn.addEventListener("click",()=>dom.locModal.classList.add("show"));
dom.detectBtn.addEventListener("click",detectLoc);
dom.saveAddrBtn.addEventListener("click",()=>{const a=dom.manualAddr.value.trim();if(a){setAddr(a);dom.locModal.classList.remove("show");dom.manualAddr.value="";toast("Address saved")}else toast("Enter an address")});
dom.locModal.addEventListener("click",e=>{if(e.target===dom.locModal)dom.locModal.classList.remove("show")});

dom.checkoutBtn.addEventListener("click", async ()=>{
  if(!cartCount()){toast("Add items first");return}
  
  const orderItems=[];
  state.cart.forEach((qty,id)=>{const p=state.products.find(x=>x.id===id);if(p)orderItems.push({name:p.name,qty,price:p.price})});
  const total=cartTotal();
  const freeThreshold = state.settings.freeDelivery || 499;
  const dfFee = state.settings.deliveryFee || 49;
  const df = total >= freeThreshold ? 0 : dfFee;
  
  try {
    const { error } = await supabase.from('orders').insert({
      items: orderItems,
      total: total + df,
      address: state.address || "Not set",
      status: "pending",
      user_email: state.user ? state.user.email : "Guest User"
    });
    
    if (error) throw error;
    
    dom.modalEta.textContent=`${state.eta} min`;dom.orderModal.classList.add("show");
    state.cart.clear();renderCart();renderFeatured();renderGroceryGrid();
  } catch (err) {
    console.error("Order error:", err);
    toast("Checkout failed. Please try again.");
  }
});

dom.modalClose.addEventListener("click",()=>{dom.orderModal.classList.remove("show");switchView("home")});
dom.orderModal.addEventListener("click",e=>{if(e.target===dom.orderModal)dom.orderModal.classList.remove("show")});

// ─── INIT ───
dom.greetText.textContent=greeting();
renderPromo();
fetchData();
detectLoc();
