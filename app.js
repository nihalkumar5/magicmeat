/* MagicMeat — Premium Fresh Delivery App */

// ─── DATA (synced with admin via localStorage) ───
const LS_get = (k, def) => { try { return JSON.parse(localStorage.getItem(`mm_${k}`)) ?? def; } catch { return def; } };
const LS_set = (k, v) => localStorage.setItem(`mm_${k}`, JSON.stringify(v));

const DEFAULT_CATEGORIES = [
  { id: "meat",    label: "Meat & Chicken", icon: "🥩", color: "#C62828", bg: "#FFEBEE" },
  { id: "fish",    label: "Fish & Seafood", icon: "🐟", color: "#1565C0", bg: "#E3F2FD" },
  { id: "grocery", label: "Grocery",        icon: "🥚", color: "#2E7D32", bg: "#E8F5E9" },
  { id: "frozen",  label: "Frozen",         icon: "❄️", color: "#6B7280", bg: "#F3F4F6" },
  { id: "masala",  label: "Masala & Spice", icon: "🌶️", color: "#D84315", bg: "#FBE9E7" },
  { id: "dairy",   label: "Dairy & Eggs",   icon: "🧈", color: "#F9A825", bg: "#FFFDE7" },
];
const categories = LS_get("categories", DEFAULT_CATEGORIES);

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

const DEFAULT_PRODUCTS = [
  // Meat & Chicken
  { id: "mutton-curry",   name: "Mutton Curry Cut",      category: "meat",   note: "Bone-in shoulder & rib, slow masala cooking.", price: 529, unit: "500g", color: "#ad3b2f", bg: "linear-gradient(135deg,#f5ddd7,#fff7ed)" },
  { id: "lean-mince",     name: "Lean Meat Mince",       category: "meat",   note: "Fine ground, low-fat mince for kebabs.", price: 389, unit: "450g", color: "#9c342b", bg: "linear-gradient(135deg,#f8ebe7,#efe2d7)" },
  { id: "chicken-breast", name: "Clean Chicken Breast",  category: "meat",   note: "Skinless fillets, two portions.", price: 279, unit: "450g", color: "#f1c07f", bg: "linear-gradient(135deg,#fff0dc,#f7dfbc)" },
  { id: "chicken-thigh",  name: "Boneless Thigh Pack",   category: "meat",   note: "Juicy thigh pieces for biryani.", price: 319, unit: "500g", color: "#d89344", bg: "linear-gradient(135deg,#f7e4c9,#fffaf0)" },
  { id: "chicken-wings",  name: "Party Wings",           category: "meat",   note: "Pre-cut wings for air-fryer.", price: 249, unit: "500g", color: "#e8a39a", bg: "linear-gradient(135deg,#fff0ec,#fce4de)" },
  { id: "mutton-keema",   name: "Mutton Keema",          category: "meat",   note: "Double-ground goat for keema pav.", price: 479, unit: "400g", color: "#8d2f27", bg: "linear-gradient(135deg,#f0d4cf,#fde8e4)" },
  // Fish
  { id: "salmon-steak",   name: "River Cut Salmon",      category: "fish",   note: "Center-cut steaks, skin crispable.", price: 699, unit: "300g", color: "#eb7f61", bg: "linear-gradient(135deg,#fde8e0,#fff5ef)" },
  { id: "prawns",         name: "Cleaned Prawns",        category: "fish",   note: "Deveined, iced, ready for pan.", price: 449, unit: "250g", color: "#6a8ea0", bg: "linear-gradient(135deg,#dfecee,#f4fbfb)" },
  { id: "pomfret",        name: "Silver Pomfret",        category: "fish",   note: "Whole cleaned, ideal for tawa fry.", price: 599, unit: "1 pc", color: "#94a3b8", bg: "linear-gradient(135deg,#e8edf2,#f8fafb)" },
  { id: "surmai",         name: "Surmai Steaks",         category: "fish",   note: "King mackerel, bone-in, for curry.", price: 549, unit: "500g", color: "#5b8fa8", bg: "linear-gradient(135deg,#dceaf0,#eef6fa)" },
  // Grocery
  { id: "farm-eggs",      name: "Brown Farm Eggs",       category: "grocery", note: "Dozen clean-shell free-range eggs.", price: 129, unit: "12 pcs", color: "#b9935d", bg: "linear-gradient(135deg,#eef4e8,#fffdf3)" },
  { id: "lemon-herb",     name: "Lemon Herb Kit",        category: "grocery", note: "Lemons, dill, garlic for fish.", price: 159, unit: "1 kit", color: "#4b765d", bg: "linear-gradient(135deg,#eef7e9,#fff9dc)" },
  { id: "basmati",        name: "Aged Basmati Rice",     category: "grocery", note: "Long-grain aged for biryani.", price: 299, unit: "1 kg", color: "#d4a574", bg: "linear-gradient(135deg,#fdf6ed,#fff8ee)" },
  { id: "onion-tomato",   name: "Onion Tomato Pack",     category: "grocery", note: "Fresh sorted for everyday curry.", price: 89,  unit: "1 kg", color: "#e25c3e", bg: "linear-gradient(135deg,#fdeae5,#fff4ef)" },
  // Fruits
  { id: "apple-shimla",   name: "Shimla Apples",         category: "fruits",  note: "Crisp red apples from Himachal.", price: 189, unit: "1 kg", color: "#c62828", bg: "linear-gradient(135deg,#ffebee,#fff5f5)" },
  { id: "banana",         name: "Fresh Bananas",         category: "fruits",  note: "Ripe yellow, perfect for smoothies.", price: 49,  unit: "6 pcs", color: "#f9a825", bg: "linear-gradient(135deg,#fffde7,#fff9c4)" },
  { id: "mango",          name: "Alphonso Mango",        category: "fruits",  note: "Premium Ratnagiri Alphonso.", price: 499, unit: "6 pcs", color: "#ff8f00", bg: "linear-gradient(135deg,#fff3e0,#ffe0b2)" },
  // Vegetables
  { id: "palak",          name: "Fresh Palak",           category: "veggies", note: "Clean washed spinach leaves.", price: 39,  unit: "250g", color: "#2e7d32", bg: "linear-gradient(135deg,#e8f5e9,#c8e6c9)" },
  { id: "shimla-mirch",   name: "Capsicum Mix",          category: "veggies", note: "Red, yellow, green bell peppers.", price: 99,  unit: "500g", color: "#43a047", bg: "linear-gradient(135deg,#e8f5e9,#dcedc8)" },
  { id: "aloo",           name: "Baby Potatoes",         category: "veggies", note: "Small sorted potatoes for dum.", price: 49,  unit: "1 kg", color: "#8d6e63", bg: "linear-gradient(135deg,#efebe9,#d7ccc8)" },
  // Masala
  { id: "biryani-masala", name: "Biryani Masala",        category: "masala",  note: "Aromatic blend for dum biryani.", price: 149, unit: "100g", color: "#bf360c", bg: "linear-gradient(135deg,#fbe9e7,#fff3e0)" },
  { id: "garam-masala",   name: "Whole Garam Masala",    category: "masala",  note: "Cardamom, cloves, cinnamon kit.", price: 199, unit: "100g", color: "#6d4c41", bg: "linear-gradient(135deg,#efebe9,#faf7f5)" },
  // Frozen
  { id: "seekh-kabab",    name: "Frozen Seekh Kabab",    category: "frozen",  note: "Ready-to-sear skewers.", price: 349, unit: "400g", color: "#865445", bg: "linear-gradient(135deg,#eef2f6,#fff)" },
  { id: "frozen-paratha", name: "Layered Frozen Paratha", category: "frozen", note: "Flaky heat-and-serve parathas.", price: 189, unit: "6 pcs", color: "#d4a95d", bg: "linear-gradient(135deg,#f2f5f7,#fff8ec)" },
  { id: "nuggets",        name: "Crispy Chicken Nuggets", category: "frozen", note: "Golden nuggets for kids' tiffin.", price: 269, unit: "400g", color: "#c9963a", bg: "linear-gradient(135deg,#fef6e4,#fff9eb)" },
  { id: "momos",          name: "Frozen Momos",          category: "frozen",  note: "Chicken momos with chutney.", price: 229, unit: "12 pcs", color: "#e8ddd0", bg: "linear-gradient(135deg,#f5f0ea,#fefcf8)" },
  // Ice Cream
  { id: "vanilla-tub",    name: "Vanilla Bean Tub",      category: "icecream", note: "Creamy Madagascar vanilla.", price: 299, unit: "500ml", color: "#fff9c4", bg: "linear-gradient(135deg,#fffde7,#fff)" },
  { id: "choco-bar",      name: "Dark Choco Bars",       category: "icecream", note: "Belgian chocolate dipped bars.", price: 199, unit: "4 pcs", color: "#4e342e", bg: "linear-gradient(135deg,#efebe9,#d7ccc8)" },
  { id: "mango-kulfi",    name: "Mango Kulfi Sticks",    category: "icecream", note: "Traditional malai kulfi.", price: 169, unit: "6 pcs", color: "#ff8f00", bg: "linear-gradient(135deg,#fff3e0,#ffe0b2)" },
  // Dairy
  { id: "paneer",         name: "Fresh Paneer Block",    category: "dairy",   note: "Soft milky paneer, morning batch.", price: 179, unit: "200g", color: "#fff9c4", bg: "linear-gradient(135deg,#fffde7,#fff)" },
  { id: "curd",           name: "Homestyle Thick Curd",  category: "dairy",   note: "Full-cream set curd for raita.", price: 69,  unit: "400g", color: "#f5f5f5", bg: "linear-gradient(135deg,#fafafa,#fff)" },
];
const products = LS_get("products", DEFAULT_PRODUCTS);

// ─── STATE ───
const state = { currentView: "home", grocerySub: "all", query: "", cart: new Map(), address: "", eta: 31 };

// ─── DOM ───
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
};

// ─── UTILS ───
const fmt = v => `₹${v.toLocaleString("en-IN")}`;
let tt; function toast(m) { dom.toast.textContent=m; dom.toast.classList.add("visible"); clearTimeout(tt); tt=setTimeout(()=>dom.toast.classList.remove("visible"),2200); }
function greeting() { const h=new Date().getHours(); return h<12?"Good morning ☀️":h<17?"Good afternoon 🌤️":h<21?"Good evening 🌙":"Late night cravings? 🌃"; }
function cartCount() { return [...state.cart.values()].reduce((s,q)=>s+q,0); }
function cartTotal() { let t=0; state.cart.forEach((q,id)=>{const p=products.find(x=>x.id===id);if(p)t+=p.price*q}); return t; }

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
    <div class="product-image" style="--card-bg:${p.bg};--card-accent:${p.color}"><span class="unit-tag">${p.unit}</span></div>
    <h3>${p.name}</h3><p class="product-note">${p.note}</p>
    <div class="product-footer"><span class="product-price">${fmt(p.price)}</span>${stepper}</div>
  </div>`;
}

// ─── RENDER ───
function renderPromo() {
  const n=dom.promoCarousel.children.length;
  dom.promoDots.innerHTML=Array.from({length:n},(_,i)=>`<span class="${i===0?'active':''}"></span>`).join("");
  dom.promoCarousel.addEventListener("scroll",()=>{
    const idx=Math.round(dom.promoCarousel.scrollLeft/dom.promoCarousel.offsetWidth);
    dom.promoDots.querySelectorAll("span").forEach((d,i)=>d.classList.toggle("active",i===idx));
  });
}

function renderQuickCats() {
  dom.quickCats.innerHTML = categories.map(c=>`
    <div class="qcat-card" data-catview="${c.id}" style="--qcat-bg:${c.bg};--qcat-border:${c.color}22;--qcat-shadow:${c.color}18">
      <div class="qcat-icon" style="background:${c.color}18"><span style="font-size:28px">${c.icon}</span></div>
      <span>${c.label.split(" ")[0]}</span>
    </div>`).join("");
}

function renderFeatured() {
  const q=state.query.trim().toLowerCase();
  let list=products;
  if(q) list=products.filter(p=>p.name.toLowerCase().includes(q)||p.note.toLowerCase().includes(q)||p.category.includes(q));
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
  let list = products;
  if(state.grocerySub!=="all") list=list.filter(p=>p.category===state.grocerySub);
  if(!list.length){dom.groceryGrid.innerHTML=`<div class="grid-empty"><h3>Coming soon</h3><p>More items on the way.</p></div>`;return}
  dom.groceryGrid.innerHTML=list.map((p,i)=>cardHTML(p,i*40)).join("");
}

function renderCart() {
  const items=[]; state.cart.forEach((q,id)=>{const p=products.find(x=>x.id===id);if(p)items.push({...p,qty:q})});
  const tq=cartCount(), tp=cartTotal(), df=tp>=499?0:49, gt=tp+df;
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

// ─── Update stepper in-place (no full re-render) ───
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
  // Badge bounce
  dom.cartBadge.classList.remove("pop"); void dom.cartBadge.offsetWidth; dom.cartBadge.classList.add("pop");
}

// ─── CART ACTIONS ───
function addToCart(pid) {
  const q=state.cart.get(pid)||0; state.cart.set(pid,q+1);
  const p=products.find(x=>x.id===pid);
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
  window.open("https://wa.me/919999999999?text=Hi%20MagicMeat!%20I%20want%20to%20place%20a%20custom%20order.","_blank");
});

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
dom.checkoutBtn.addEventListener("click",()=>{
  if(!cartCount()){toast("Add items first");return}
  // Build order for admin
  const orderItems=[];
  state.cart.forEach((qty,id)=>{const p=products.find(x=>x.id===id);if(p)orderItems.push({name:p.name,qty,price:p.price})});
  const total=cartTotal();const df=total>=499?0:49;
  const existingOrders=LS_get("orders",[]);
  existingOrders.push({
    id:existingOrders.length+1,
    items:orderItems,
    total:total+df,
    address:state.address||"Not set",
    time:new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}),
    status:"pending"
  });
  LS_set("orders",existingOrders);
  dom.modalEta.textContent=`${state.eta} min`;dom.orderModal.classList.add("show");
  state.cart.clear();renderCart();renderFeatured();renderGroceryGrid();
});
dom.modalClose.addEventListener("click",()=>{dom.orderModal.classList.remove("show");switchView("home")});
dom.orderModal.addEventListener("click",e=>{if(e.target===dom.orderModal)dom.orderModal.classList.remove("show")});

// ─── INIT ───
dom.greetText.textContent=greeting();
renderPromo(); renderQuickCats(); renderFeatured();
renderGrocerySubcats(); renderGroceryGrid(); renderCart();
detectLoc();
