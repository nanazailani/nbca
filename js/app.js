/* =========================================================================
   KOPIKITA PROTOTYPE — full client-side app (single file)
   Data persistence: localStorage. No backend. All values simulated.
   ========================================================================= */

/* ---------- helpers ---------- */
const $ = (s,ctx=document)=>ctx.querySelector(s);
const $$ = (s,ctx=document)=>[...ctx.querySelectorAll(s)];
const fmt = n => 'RM' + Number(n).toFixed(2);
const uid = p => p+'_'+Math.random().toString(36).slice(2,9);
const store = {
  get(k,d){ try{ const v = localStorage.getItem('nbca_'+k); return v? JSON.parse(v): d; }catch(e){ return d; } },
  set(k,v){ localStorage.setItem('nbca_'+k, JSON.stringify(v)); }
};
function toast(msg, type='success'){
  const icons = {success:'circle-check', error:'circle-xmark', info:'circle-info'};
  const el = document.createElement('div');
  el.className = 'toast '+type;
  el.innerHTML = `<i class="fa-solid fa-${icons[type]}"></i> ${msg}`;
  $('#toastWrap').appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='.3s'; setTimeout(()=>el.remove(),300); }, 2800);
}
function stars(rating, editableId){
  let h = '<span class="stars">';
  for(let i=1;i<=5;i++){ h += `<i class="fa-solid fa-star" style="opacity:${i<=Math.round(rating)?1:.25}"></i>`; }
  return h + `</span>`;
}
function roastMeter(level, max=5, label=''){ // used for products (roast) and courses (intensity)
  let h = '<div class="roast-meter">';
  for(let i=1;i<=max;i++){ h += `<span class="dot ${i<=level?'on':''}"></span>`; }
  if(label) h += `<span class="label">${label}</span>`;
  return h + '</div>';
}

/* =================== DATA SEEDING =================== */
/* BRANDS — replaces coffee-origin categories. Each brand NBCA officially carries/distributes. */
const CATEGORIES = [
  {id:'rocket', name:'Rocket Espresso', icon:'fa-gauge-high', desc:'Mesin espresso premium — Itali', country:'Itali', type:'Espresso Machine'},
  {id:'mahlkonig', name:'Mahlkönig', icon:'fa-compact-disc', desc:'Grinder profesional — Jerman', country:'Jerman', type:'Grinder'},
  {id:'9bcoffee', name:'9B Coffee Beans', icon:'fa-seedling', desc:'Biji kopi rumah — panggang sendiri', country:'Malaysia', type:'Coffee Beans'},
  {id:'acaia', name:'Acaia', icon:'fa-weight-scale', desc:'Penimbang presisi — Taiwan', country:'Taiwan', type:'Scale'},
  {id:'fellow', name:'Fellow', icon:'fa-mug-saucer', desc:'Alatan brewing — USA', country:'USA', type:'Brewing Gear'},
  {id:'rancilio', name:'Rancilio', icon:'fa-industry', desc:'Mesin komersial — Itali', country:'Itali', type:'Commercial Machine'}
];
const INSTRUCTOR_NAMES = [
  {name:'Ahmad Fikri', exp:'12 tahun', bio:'Q-Grader bertauliah & Juara Kebangsaan Barista 2019.'},
  {name:'Siti Nadia', exp:'8 tahun', bio:'Pakar sensory & roasting, bekerjasama dengan ladang serantau.'},
  {name:'Marcus Tan', exp:'15 tahun', bio:'Perunding kedai kopi & jurulatih SCA antarabangsa.'},
  {name:'Farah Aleya', exp:'6 tahun', bio:'Barista champion & spesialis latte art.'},
  {name:'Jason Wong', exp:'10 tahun', bio:'Pengasas mikro-roastery & jurulatih perniagaan kopi.'}
];
function seedProducts(){
  // Product line-up organised by brand (client requirement: browse by brand, see products under each brand)
  const lineup = [
    // Rocket Espresso
    {brand:'rocket', n:'Rocket Appartamento', price:8900, desc:'Mesin espresso 2-group semi-auto untuk kafe butik.'},
    {brand:'rocket', n:'Rocket Mozzafiato Cronometro', price:12400, desc:'Mesin espresso dengan PID timer untuk kawalan tepat.'},
    {brand:'rocket', n:'Rocket R58', price:15900, desc:'Dual boiler flagship untuk penggunaan komersial ringan.'},
    // Mahlkönig
    {brand:'mahlkonig', n:'Mahlkönig E65S GbW', price:9200, desc:'Grinder on-demand dengan sistem timbang automatik.'},
    {brand:'mahlkonig', n:'Mahlkönig X54', price:4300, desc:'Grinder padat untuk kafe bersaiz kecil-sederhana.'},
    {brand:'mahlkonig', n:'Mahlkönig Peak', price:6800, desc:'Grinder single-dose untuk filter & espresso.'},
    // 9B Coffee Beans (house brand under parent company)
    {brand:'9bcoffee', n:'9B House Blend', price:38, desc:'Blend signature 9B Coffee — seimbang & mudah didekati.'},
    {brand:'9bcoffee', n:'9B Single Origin Ethiopia', price:52, desc:'Biji Ethiopia dipanggang segar oleh pasukan 9B Coffee.'},
    {brand:'9bcoffee', n:'9B Dark Roast Espresso', price:44, desc:'Roast gelap untuk espresso shot yang kuat & bold.'},
    {brand:'9bcoffee', n:'9B Decaf Swiss Water', price:48, desc:'Bebas kafein tanpa mengorbankan rasa.'},
    // Acaia
    {brand:'acaia', n:'Acaia Pearl S', price:890, desc:'Penimbang espresso presisi dengan Bluetooth.'},
    {brand:'acaia', n:'Acaia Lunar', price:1150, desc:'Penimbang tahan air untuk espresso bar sibuk.'},
    {brand:'acaia', n:'Acaia Pyxis', price:420, desc:'Penimbang kompak untuk pour-over di rumah.'},
    // Fellow
    {brand:'fellow', n:'Fellow Stagg EKG Kettle', price:680, desc:'Cerek leher angsa dengan kawalan suhu digital.'},
    {brand:'fellow', n:'Fellow Ode Gen 2', price:1450, desc:'Grinder flat burr untuk filter coffee di rumah.'},
    {brand:'fellow', n:'Fellow Carter Everywhere Mug', price:145, desc:'Mug travel vacuum-insulated premium.'},
    // Rancilio
    {brand:'rancilio', n:'Rancilio Classe 5', price:26500, desc:'Mesin espresso komersial 2-group high-volume.'},
    {brand:'rancilio', n:'Rancilio Silvia Pro X', price:6200, desc:'Mesin prosumer untuk kafe rumah/mikro-kafe.'},
    {brand:'rancilio', n:'Rancilio RR45', price:5100, desc:'Grinder komersial untuk trafik tinggi.'},
    {brand:'rancilio', n:'Rancilio Water Filter System', price:980, desc:'Sistem penapis air untuk lindungi mesin komersial.'}
  ];
  const products = lineup.map((it,i)=>{
    const brandInfo = CATEGORIES.find(c=>c.id===it.brand);
    const hasDiscount = i%5===0;
    const isEquipment = it.brand!=='9bcoffee';
    return {
      id:'p'+(i+1), name:it.n, category:it.brand, brandName:brandInfo.name, productType:brandInfo.type,
      desc:it.desc,
      price:it.price, oldPrice: hasDiscount? +(it.price*1.18).toFixed(2): null,
      image:`https://picsum.photos/seed/nbca${i+7}/500/380`,
      rating:+(4.0+Math.random()*.9).toFixed(1), reviewsCount: Math.floor(8+Math.random()*90),
      stock: i%9===0? 0 : Math.floor(Math.random()*(isEquipment?12:40))+2,
      roast: isEquipment? null : ['Light','Medium','Medium-Dark','Dark'][i%4],
      roastLevel: isEquipment? null : (i%4)+2,
      origin: brandInfo.country,
      weights: isEquipment? ['Unit Tunggal'] : ['250g','500g','1kg'],
      warranty: isEquipment? (i%3===0?'2 Tahun':'1 Tahun') : null,
      badge: hasDiscount?'Jimat':(i%6===0?'Baharu':(i%9===0?'Terlaris':null))
    };
  });
  store.set('products', products);
}
function seedInstructors(){
  const list = INSTRUCTOR_NAMES.map((it,i)=>({id:'ins'+(i+1), ...it, rating:+(4.4+Math.random()*.5).toFixed(1), coursesCount: 2+i}));
  store.set('instructors', list);
}
function seedCourses(){
  const defs = [
    {t:'Barista Beginner Class', level:'Beginner', type:'In-Person', dur:'2 Hari', days:2, price:499, ins:0, badge:'Popular'},
    {t:'Coffee Roasting Masterclass', level:'Advanced', type:'Hybrid', dur:'1 Minggu', days:7, price:1299, ins:2, badge:'Best Seller'},
    {t:'Latte Art Workshop', level:'Intermediate', type:'In-Person', dur:'1 Hari', days:1, price:350, ins:3, badge:null},
    {t:'Coffee Brewing Science', level:'Intermediate', type:'Online', dur:'3 Hari', days:3, price:599, ins:1, badge:null},
    {t:'Espresso Perfection', level:'Advanced', type:'In-Person', dur:'2 Hari', days:2, price:799, ins:0, badge:'Limited'},
    {t:'Coffee Tasting & Cupping', level:'Beginner', type:'Online', dur:'1 Hari', days:1, price:299, ins:1, badge:'New'},
    {t:'Coffee Business Management', level:'Professional', type:'Hybrid', dur:'1 Bulan', days:30, price:2499, ins:4, badge:null},
    {t:'Sustainable Coffee Farming', level:'Intermediate', type:'Online', dur:'5 Hari', days:5, price:899, ins:2, badge:null},
    {t:'Coffee Sensory Skills', level:'Advanced', type:'In-Person', dur:'2 Hari', days:2, price:699, ins:1, badge:null},
    {t:'Home Brewing Mastery', level:'Beginner', type:'Online', dur:'1 Hari', days:1, price:199, ins:3, badge:'New'}
  ];
  const instructors = store.get('instructors',[]);
  const levelMap = {Beginner:1,Intermediate:2,Advanced:3,Professional:4};
  const courses = defs.map((d,i)=>{
    const seatsTotal = 10+Math.floor(Math.random()*20);
    const seatsTaken = Math.floor(Math.random()*seatsTotal*0.7);
    const schedules = [0,1,2].map(k=>{
      const dt = new Date(); dt.setDate(dt.getDate()+ (10+i*4+k*15));
      return {id:'sch'+i+'_'+k, date: dt.toISOString().slice(0,10), time:'10:00 AM - 6:00 PM', venue: d.type==='Online'?'Zoom Online':'DC Studio, Seri Kembangan'};
    });
    return {
      id:'c'+(i+1), title:d.t, instructorId: instructors[d.ins].id,
      level:d.level, type:d.type, duration:d.dur, price:d.price,
      lang: i%3===0?'Bahasa Melayu':(i%3===1?'English':'Mandarin'),
      image:`https://picsum.photos/seed/course${i+3}/600/400`,
      badge:d.badge, intensity: levelMap[d.level],
      seatsTotal, seatsTaken,
      rating:+(4.2+Math.random()*.7).toFixed(1), reviewsCount: 8+Math.floor(Math.random()*40),
      prerequisites: d.level==='Beginner'? 'Tiada keperluan asas.' : `Disyorkan telah selesai kursus ${d.level==='Advanced'?'Intermediate':'Foundation'}.`,
      outcomes: [
        'Memahami asas dan teknik utama topik kursus',
        'Kemahiran praktikal hands-on dengan peralatan profesional',
        'Keupayaan menilai kualiti & rasa kopi secara konsisten',
        'Persediaan untuk peperiksaan/sijil berkaitan'
      ],
      curriculum: Array.from({length: Math.min(6,2+Math.floor(d.days/2)+2)}, (_,k)=>({
        id:'cur'+i+'_'+k, title:`Minggu/Sesi ${k+1}: ${['Pengenalan','Teknik Asas','Amali Praktikal','Penilaian Rasa','Kajian Kes','Sesi Penilaian'][k%6]}`,
        desc:'Sesi interaktif dengan gabungan teori ringkas dan latihan hands-on bersama instruktor.'
      })),
      materials:['Nota kursus (PDF)','Video rujukan','Peralatan amali disediakan','Sijil digital selepas tamat'],
      schedules,
      reviews: Array.from({length: Math.min(5,3+i%3)}, (_,k)=>({
        id:'rev'+i+'_'+k, name:['Aisyah','Ben','Chong','Dewi','Faiz'][k%5], rating: 4+Math.round(Math.random()),
        text:'Kelas sangat berbaloi, instruktor mudah faham dan amali sangat membantu.', date:'2026-0'+((k%6)+1)+'-1'+k
      }))
    };
  });
  store.set('courses', courses);
}
function seedCustomers(){
  const names = ['Danial Rahman','Aina Batrisyia','Chen Wei Ming','Elaine Tan','Farid Iskandar','Grace Wong','Hafiz Azmi','Iris Lau','Johan Kamal','Aisyah Rosli'];
  const arr = names.map((n,i)=>({
    id:'cust'+(i+1), name:n, email: i===0? 'user@nbca.com' : `cust${i+1}@mail.com`,
    phone:'01'+(2+i%8)+'-'+(2000000+i*13579).toString().slice(0,7),
    address: i===0? 'No 12, Jalan Kopi 5, Seri Kembangan, Selangor' : `No ${i+1}, Jalan Contoh ${i+1}, ${['Petaling Jaya','Shah Alam','Subang Jaya','Cheras','Klang'][i%5]}, Selangor`,
    avatarInitial:n[0], loyaltyPoints: 200+i*180,
    joined:'2025-0'+((i%9)+1)+'-10'
  }));
  store.set('customers', arr);
}
const ORDER_STEPS = [
  {key:'pending_payment', label:'Menunggu Pengesahan Bayaran', icon:'fa-hourglass-half'},
  {key:'processing', label:'Diproses', icon:'fa-box-open'},
  {key:'shipped', label:'Dihantar', icon:'fa-truck-fast'},
  {key:'completed', label:'Selesai', icon:'fa-circle-check'}
];
function seedOrders(){
  const products = store.get('products',[]);
  const customers = store.get('customers',[]);
  const couriers = ['J&T Express','Pos Laju','City-Link','DHL eCommerce'];
  const orders = Array.from({length:40},(_,i)=>{
    const p = products[Math.floor(Math.random()*products.length)];
    const qty = 1+Math.floor(Math.random()*3);
    const cust = customers[Math.floor(Math.random()*customers.length)];
    const d = new Date(); d.setDate(d.getDate()-Math.floor(Math.random()*60));
    const total = +(p.price*qty).toFixed(2);
    const roll = Math.random();
    let orderStatus, paymentStatus, trackingNumber=null, courier=null;
    if(roll<0.12){ orderStatus='pending_payment'; paymentStatus='pending'; }
    else if(roll<0.22){ orderStatus='cancelled'; paymentStatus='failed'; }
    else if(roll<0.42){ orderStatus='processing'; paymentStatus='verified'; }
    else if(roll<0.72){ orderStatus='shipped'; paymentStatus='verified'; courier=couriers[i%4]; trackingNumber=courier==='J&T Express'? 'JT'+(600000000+i*37):'TRK'+(100000+i*91); }
    else { orderStatus='completed'; paymentStatus='verified'; courier=couriers[i%4]; trackingNumber=courier==='J&T Express'? 'JT'+(600000000+i*37):'TRK'+(100000+i*91); }
    const history = buildHistorySeed(orderStatus, paymentStatus, d, trackingNumber, courier);
    return {
      id:'ORD'+(1000+i), receiptId:'RCPT-'+(9000+i),
      customerId:cust.id, customerName:cust.name, customerEmail:cust.email,
      items:[{productId:p.id, name:p.name, qty, price:p.price}],
      subtotal:total, shipping: total>150?0:12, total: total + (total>150?0:12),
      paymentMethodName: ['FPX Online Banking','Kad Kredit/Debit','DuitNow QR'][i%3],
      paymentStatus, paymentProof:null,
      orderStatus, trackingNumber, courier,
      date: d.toISOString().slice(0,10), history
    };
  });
  store.set('orders', orders);
}
function buildHistorySeed(orderStatus, paymentStatus, baseDate, trackingNumber, courier){
  const h = [{status:'pending_payment', label:'Pesanan dibuat & menunggu bayaran', date:baseDate.toISOString().slice(0,10)}];
  if(paymentStatus==='verified') h.push({status:'payment_verified', label:'Pembayaran disahkan oleh admin', date:baseDate.toISOString().slice(0,10)});
  if(paymentStatus==='failed') h.push({status:'cancelled', label:'Pesanan dibatalkan', date:baseDate.toISOString().slice(0,10)});
  if(orderStatus==='processing'||orderStatus==='shipped'||orderStatus==='completed') h.push({status:'processing', label:'Pesanan diterima & sedang diproses', date:baseDate.toISOString().slice(0,10)});
  if(orderStatus==='shipped'||orderStatus==='completed') h.push({status:'shipped', label:`Dihantar via ${courier} — No. Tracking: ${trackingNumber}`, date:baseDate.toISOString().slice(0,10)});
  if(orderStatus==='completed') h.push({status:'completed', label:'Pesanan selesai diterima pelanggan', date:baseDate.toISOString().slice(0,10)});
  return h;
}
function seedRegistrations(){
  const courses = store.get('courses',[]);
  const customers = store.get('customers',[]);
  const statuses = ['pending','confirmed','completed','cancelled'];
  const regs = Array.from({length:30},(_,i)=>{
    const c = courses[Math.floor(Math.random()*courses.length)];
    const cust = customers[Math.floor(Math.random()*customers.length)];
    const status = statuses[Math.floor(Math.random()*statuses.length)];
    return {id:'REG'+(500+i), courseId:c.id, courseName:c.title, customer:cust.name, customerId:cust.id, status, progress: status==='completed'?100: status==='confirmed'? Math.floor(Math.random()*80):0, scheduleId: c.schedules[0]?.id};
  });
  store.set('registrations', regs);
}
function seedPaymentMethods(){
  const methods = [
    {id:'pm_fpx', type:'fpx', name:'FPX Online Banking', icon:'fa-building-columns', active:true,
      banks:['Maybank2u','CIMB Clicks','Public Bank','RHB Now','Bank Islam','Hong Leong Connect']},
    {id:'pm_card', type:'card', name:'Kad Kredit/Debit', icon:'fa-credit-card', active:true,
      gateway:'Stripe (Simulasi)', merchantId:'NBCA-MY-00219', acceptedCards:['Visa','Mastercard','AMEX']},
    {id:'pm_qr', type:'qr', name:'DuitNow QR', icon:'fa-qrcode', active:true,
      qrImage:'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=NBCA-DuitNow-Merchant-00219', walletName:'NBCA Sdn Bhd'},
    {id:'pm_tng', type:'ewallet', name:'Touch n Go eWallet', icon:'fa-wallet', active:true, walletName:'NBCA Sdn Bhd'},
    {id:'pm_grab', type:'ewallet', name:'GrabPay', icon:'fa-wallet', active:true, walletName:'NBCA Sdn Bhd'},
    {id:'pm_boost', type:'ewallet', name:'Boost', icon:'fa-wallet', active:false, walletName:'NBCA Sdn Bhd'}
  ];
  store.set('paymentMethods', methods);
}
function seedHomePosts(){
  const defs = [
    {title:'Sesi Barista Foundation Julai Berjaya Diadakan', text:'Terima kasih kepada semua peserta yang menyertai kelas Barista Skills Foundation bulan ini. Sesi Ogos kini dibuka untuk pendaftaran!', img:'post1'},
    {title:'NBCA x Rocket Espresso — Demo Mesin Terbaru', text:'Kami dengan bangganya memperkenalkan Rocket Mozzafiato Cronometro — kini tersedia untuk tempahan konsultasi kafe anda.', img:'post2'},
    {title:'Bengkel Sensory: Kopi & Grinder', text:'Satu sesi santai meneroka bagaimana grinder mempengaruhi rasa kopi anda. Tempat terhad, daftar awal!', img:'post3'}
  ];
  const posts = defs.map((d,i)=>{
    const dt = new Date(); dt.setDate(dt.getDate()-(i*9+3));
    return {id:'post'+(i+1), title:d.title, text:d.text, image:`https://picsum.photos/seed/${d.img}/600/400`, date:dt.toISOString().slice(0,10)};
  });
  store.set('homePosts', posts);
}
function seedIfEmpty(){
  if(!store.get('products')) seedProducts();
  if(!store.get('instructors')) seedInstructors();
  if(!store.get('courses')) seedCourses();
  if(!store.get('customers')) seedCustomers();
  if(!store.get('orders')) seedOrders();
  if(!store.get('registrations')) seedRegistrations();
  if(!store.get('paymentMethods')) seedPaymentMethods();
  if(!store.get('homePosts')) seedHomePosts();
  if(!store.get('cart')) store.set('cart', []);
  if(!store.get('wishlist')) store.set('wishlist', []);
  if(!store.get('myEnrollments')) store.set('myEnrollments', []); // for logged-in demo user
}
seedIfEmpty();

/* =================== THEME =================== */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  store.set('theme', t);
}
(function initTheme(){ applyTheme(store.get('theme','light')); })();
function toggleTheme(){ applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'); }
$('#themeToggleLanding').onclick = toggleTheme;
$('#themeToggleApp').onclick = toggleTheme;
function toggleMobileNav(){
  const panel = $('#mobileNavPanel');
  const isOpen = panel.classList.toggle('show');
  $('#mobileNavToggle').setAttribute('aria-expanded', isOpen);
  $('#mobileNavToggle').innerHTML = isOpen? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
}
function closeMobileNav(){
  $('#mobileNavPanel').classList.remove('show');
  $('#mobileNavToggle').setAttribute('aria-expanded', false);
  $('#mobileNavToggle').innerHTML = '<i class="fa-solid fa-bars"></i>';
}
$('#mobileNavToggle').onclick = toggleMobileNav;

/* =================== PWA: service worker registration =================== */
let deferredInstallPrompt = null;
let swRegistration = null;

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js')
      .then(reg=>{
        swRegistration = reg;
        // A new SW version is already waiting (e.g. user had the app open during a deploy).
        if(reg.waiting) showUpdateBanner();
        // Watch for a new version being found while the app is open.
        reg.addEventListener('updatefound', ()=>{
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', ()=>{
            if(newWorker.state==='installed' && navigator.serviceWorker.controller) showUpdateBanner();
          });
        });
      })
      .catch(err=>console.warn('[PWA] Service worker registration failed:', err));
    // Reload once the new SW takes control, so the update actually applies.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{
      if(refreshing) return; refreshing = true; window.location.reload();
    });
  });
}

/* ---- Custom "Add to Home Screen" prompt (Chrome/Edge/Android) ---- */
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});
window.addEventListener('appinstalled', ()=>{
  deferredInstallPrompt = null;
  hideInstallBanner();
  toast('NBCA berjaya dipasang! Buka dari skrin utama anda.','success');
});
function showInstallBanner(){
  if(store.get('installDismissed')) return; // respect a previous "no thanks"
  if(window.matchMedia('(display-mode: standalone)').matches) return; // already installed
  $('#pwaInstallBanner').classList.add('show');
}
function hideInstallBanner(){ $('#pwaInstallBanner').classList.remove('show'); }
function dismissInstallBanner(){ hideInstallBanner(); store.set('installDismissed', true); }
async function triggerInstall(){
  if(!deferredInstallPrompt){
    // iOS Safari has no beforeinstallprompt — show manual instructions instead.
    openIosInstallHelp();
    return;
  }
  deferredInstallPrompt.prompt();
  const {outcome} = await deferredInstallPrompt.choice;
  deferredInstallPrompt = null;
  hideInstallBanner();
  if(outcome!=='accepted') toast('Pemasangan dibatalkan.','info');
}
function openIosInstallHelp(){
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad" style="text-align:center;">
    <div style="width:56px;height:56px;border-radius:16px;background:var(--primary);color:var(--primary-ink);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;"><i class="fa-solid fa-mug-hot"></i></div>
    <h3 style="margin-bottom:14px;">Pasang NBCA di iPhone/iPad</h3>
    <div style="text-align:left;display:inline-block;">
      <p style="font-size:14px;margin-bottom:10px;">1. Ketik butang <b>Share</b> <i class="fa-solid fa-arrow-up-from-bracket"></i> di Safari</p>
      <p style="font-size:14px;margin-bottom:10px;">2. Skrol dan pilih <b>"Add to Home Screen"</b></p>
      <p style="font-size:14px;">3. Ketik <b>"Add"</b> di penjuru atas kanan</p>
    </div>
  </div>`;
  $('#genericModalBack').classList.add('show');
}
/* ---- Update-available banner ---- */
function showUpdateBanner(){ $('#pwaUpdateBanner').classList.add('show'); }
function applyUpdate(){
  if(swRegistration?.waiting) swRegistration.waiting.postMessage('SKIP_WAITING');
  $('#pwaUpdateBanner').classList.remove('show');
}
/* ---- Online/offline status ---- */
function updateOnlineStatus(){
  const banner = $('#pwaOfflineBanner');
  if(navigator.onLine){ banner.classList.remove('show'); }
  else{ banner.classList.add('show'); }
}
window.addEventListener('online', ()=>{ updateOnlineStatus(); toast('Sambungan internet kembali.','success'); });
window.addEventListener('offline', ()=>{ updateOnlineStatus(); toast('Anda kini offline. Sesetengah ciri mungkin terhad.','info'); });
updateOnlineStatus();

/* =================== LANDING: render dynamic sections =================== */
function renderLanding(){
  const products = store.get('products',[]);
  const courses = store.get('courses',[]);
  const instructors = store.get('instructors',[]);

  $('#catStrip').innerHTML = CATEGORIES.map(c=>`
    <div class="cat-pill" onclick="openLogin('customer')">
      <div class="ic"><i class="fa-solid ${c.icon}"></i></div>
      <b>${c.name}</b><span>${c.desc}</span>
    </div>`).join('');

  $('#featuredProducts').innerHTML = products.slice(0,6).map(p=>`
    <div class="card">
      <div class="card-media">
        ${p.badge?`<span class="card-badge">${p.badge}</span>`:''}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="card-body">
        <span class="card-cat"><i class="fa-solid fa-award" style="color:var(--secondary)"></i> ${p.brandName}</span>
        <h3 class="card-title">${p.name}</h3>
        <div class="card-rating">${stars(p.rating)} ${p.rating} (${p.reviewsCount})</div>
        ${p.roastLevel? roastMeter(p.roastLevel,5,p.roast) : `<span class="chip">${p.productType}</span>`}
        <div class="card-foot">
          <span class="price">${fmt(p.price)}${p.oldPrice?`<span class="old">${fmt(p.oldPrice)}</span>`:''}</span>
          <button class="btn btn-primary btn-sm" onclick="openLogin('customer')">Beli</button>
        </div>
      </div>
    </div>`).join('');

  $('#featuredCourses').innerHTML = courses.slice(0,4).map(c=>{
    const ins = instructors.find(i=>i.id===c.instructorId);
    const pct = Math.round((c.seatsTaken/c.seatsTotal)*100);
    return `
    <div class="card">
      <div class="card-media">
        ${c.badge?`<span class="card-badge alt">${c.badge}</span>`:''}
        <img src="${c.image}" alt="${c.title}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="course-meta-row"><span class="chip">${c.level}</span><span class="chip">${c.type}</span><span class="chip">${c.duration}</span></div>
        <h3 class="card-title">${c.title}</h3>
        <div class="instructor-mini"><span class="avatar">${ins.name[0]}</span><span style="font-size:12.5px;color:var(--ink-soft)">${ins.name}</span></div>
        <div class="card-rating">${stars(c.rating)} ${c.rating} (${c.reviewsCount} ulasan)</div>
        <div class="seats-bar"><i style="width:${pct}%"></i></div>
        <div class="card-foot">
          <span class="price">${fmt(c.price)}</span>
          <button class="btn btn-accent btn-sm" onclick="openLogin('customer')">Daftar</button>
        </div>
      </div>
    </div>`;
  }).join('');

  const posts = store.get('homePosts',[]);
  $('#homePostsGrid').innerHTML = posts.length? posts.map(p=>`
    <div class="post-card">
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <div class="pbody">
        <span class="post-date"><i class="fa-regular fa-calendar"></i> ${p.date}</span>
        <h3>${p.title}</h3>
        <p>${p.text}</p>
      </div>
    </div>`).join('') : `<p style="color:var(--muted);grid-column:1/-1;">Tiada post lagi.</p>`;

  const testis = [
    {name:'Nurul Iman', role:'Pemilik Kafe', text:'Kopi mereka konsisten sedap dan kelas roasting sangat membantu bisnes saya!'},
    {name:'Kevin Lim', role:'Barista Freelance', text:'Instruktor sangat berpengalaman, amali betul-betul hands-on.'},
    {name:'Puteri Aina', role:'Peminat Kopi', text:'Sistem order senang guna dan penghantaran cepat. Akan beli lagi!'}
  ];
  $('#testimonialGrid').innerHTML = testis.map(t=>`
    <div class="testi-card">
      ${stars(5)}
      <p>"${t.text}"</p>
      <div class="testi-who"><span class="avatar">${t.name[0]}</span><div><b>${t.name}</b><span>${t.role}</span></div></div>
    </div>`).join('');
}
renderLanding();

function subscribeNewsletter(e){ e.preventDefault(); toast('Terima kasih! Anda telah melanggan surat berita kami.'); e.target.reset(); }

/* =================== LOGIN / AUTH =================== */
let loginRole = 'customer';
function openLogin(role){
  if(role) switchLoginTab(role);
  $('#loginModalBack').classList.add('show');
}
function switchLoginTab(role){
  loginRole = role;
  $('#tabCustomer').classList.toggle('active', role==='customer');
  $('#tabAdmin').classList.toggle('active', role==='admin');
  $('#demoCreds').innerHTML = role==='customer'
    ? 'Demo Customer → email: <b>user@nbca.com</b> · password: <b>user123</b>'
    : 'Demo Admin → email: <b>admin@nbca.com</b> · password: <b>admin123</b>';
}
function quickRegister(e){ e.preventDefault(); toast('Pendaftaran demo: guna terus akaun demo customer untuk cuba platform ini.','info'); }
function doLogin(e){
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const pass = $('#loginPassword').value.trim();
  const validCustomer = email==='user@nbca.com' && pass==='user123';
  const validAdmin = email==='admin@nbca.com' && pass==='admin123';
  if(loginRole==='customer' && validCustomer){ session('customer'); }
  else if(loginRole==='admin' && validAdmin){ session('admin'); }
  else { toast('Emel atau kata laluan salah. Guna kredensial demo di bawah.','error'); return; }
  closeModal('loginModalBack');
}
function session(role){
  store.set('session', {role, name: role==='admin'?'Admin NBCA':'Danial Rahman', email: role==='admin'?'admin@nbca.com':'user@nbca.com', customerId: role==='admin'?null:'cust1'});
  document.getElementById('landingView').style.display='none';
  document.getElementById('appShell').classList.add('show');
  buildSidebar(role);
  navigateTo(role==='admin'?'admin-dashboard':'home-app');
  toast(`Selamat kembali, ${role==='admin'?'Admin':'Danial'}!`);
}
function doLogout(){
  store.set('session', null);
  document.getElementById('appShell').classList.remove('show');
  document.getElementById('landingView').style.display='block';
  toast('Anda telah log keluar.','info');
}
function closeModal(id){ document.getElementById(id).classList.remove('show'); }
function toggleAccountMenu(){ const s = store.get('session'); toast(`Log masuk sebagai ${s? s.name : 'guest'}`,'info'); }

/* =================== SIDEBAR / NAV per role =================== */
const CUSTOMER_NAV = [
  {group:'', items:[{id:'home-app', label:'Utama', icon:'fa-house'}]},
  {group:'Module 1 — Courses', items:[
    {id:'courses', label:'Browse Courses', icon:'fa-graduation-cap'},
    {id:'my-courses', label:'Kelas Saya', icon:'fa-chalkboard-user'},
  ]},
  {group:'Module 2 — Products', items:[
    {id:'brands', label:'Brand Kami', icon:'fa-award'},
    {id:'shop', label:'Semua Produk', icon:'fa-mug-hot'},
    {id:'wishlist', label:'Wishlist', icon:'fa-heart'},
    {id:'my-orders', label:'Pesanan Saya', icon:'fa-box'},
  ]},
  {group:'Akaun Saya', items:[
    {id:'profile', label:'Profil', icon:'fa-id-card'},
  ]}
];
const ADMIN_NAV = [
  {group:'Overview', items:[{id:'admin-dashboard', label:'Dashboard', icon:'fa-gauge-high'}]},
  {group:'Kandungan Laman Utama', items:[
    {id:'admin-posts', label:'Post & Aktiviti', icon:'fa-newspaper'},
  ]},
  {group:'E-Commerce', items:[
    {id:'admin-products', label:'Produk', icon:'fa-mug-hot'},
    {id:'admin-orders', label:'Pesanan', icon:'fa-box'},
    {id:'admin-payments', label:'Pembayaran', icon:'fa-credit-card'},
    {id:'admin-users', label:'Pengguna', icon:'fa-users'},
  ]},
  {group:'Kelas Kopi', items:[
    {id:'admin-courses', label:'Kursus', icon:'fa-graduation-cap'},
    {id:'admin-students', label:'Pelajar', icon:'fa-user-graduate'},
    {id:'admin-instructors', label:'Instruktor', icon:'fa-chalkboard-user'},
    {id:'admin-schedule', label:'Jadual', icon:'fa-calendar-days'},
    {id:'admin-certificates', label:'Sijil', icon:'fa-certificate'},
  ]},
  {group:'Laporan', items:[{id:'admin-reports', label:'Laporan', icon:'fa-chart-line'}]}
];
function buildSidebar(role){
  const nav = role==='admin'? ADMIN_NAV : CUSTOMER_NAV;
  $('#sidebar').innerHTML = nav.map(g=>`
    <div class="side-label">${g.group}</div>
    ${g.items.map(it=>`<a href="#" data-nav="${it.id}" onclick="navigateTo('${it.id}');return false;"><i class="fa-solid ${it.icon}"></i>${it.label}</a>`).join('')}
  `).join('') + `<div class="side-label">Akaun</div><a href="#" onclick="doLogout();return false;"><i class="fa-solid fa-right-from-bracket"></i>Log Keluar</a>`;
  $('#wishBtnTop').style.display = role==='admin'?'none':'flex';
  $('#cartBtnTop').style.display = role==='admin'?'none':'flex';
  $('#moduleSwitcher').style.display = role==='admin'?'none':'flex';
  $('#bottomNavCustomer').style.display = role==='admin'?'none':'';
  $('#bottomNavAdmin').style.display = role==='admin'?'':'none';
}
const COURSES_MODULE_VIEWS = ['courses','my-courses'];
const PRODUCTS_MODULE_VIEWS = ['brands','shop','wishlist','my-orders'];
let currentView = null;
function navigateTo(view){
  currentView = view;
  $$('#sidebar a').forEach(a=>a.classList.toggle('active', a.dataset.nav===view));
  $$('.bottom-nav a').forEach(a=>a.classList.toggle('active', a.dataset.bnav===view));
  if($('#modBtnCourses')){
    $('#modBtnCourses').classList.toggle('active', COURSES_MODULE_VIEWS.includes(view));
    $('#modBtnProducts').classList.toggle('active', PRODUCTS_MODULE_VIEWS.includes(view));
  }
  const renderMap = {
    'home-app': renderCustomerHome, 'shop': renderShop, 'brands': renderBrands, 'courses': renderCoursesList,
    'wishlist': renderWishlist, 'my-orders': renderMyOrders, 'my-courses': renderMyCourses, 'profile': renderProfile,
    'admin-dashboard': renderAdminDashboard, 'admin-posts': renderAdminPosts, 'admin-products': renderAdminProducts, 'admin-orders': renderAdminOrders,
    'admin-payments': renderAdminPayments, 'admin-users': renderAdminUsers, 'admin-courses': renderAdminCourses,
    'admin-students': renderAdminStudents, 'admin-instructors': renderAdminInstructors, 'admin-schedule': renderAdminSchedule,
    'admin-certificates': renderAdminCertificates, 'admin-reports': renderAdminReports
  };
  ($('#appMain').scrollTop = 0);
  (renderMap[view] || renderCustomerHome)();
  updateBadges();
  if(window.innerWidth<=900) $('#sidebar').classList.remove('show');
}
$('#sidebarToggle').onclick = ()=> $('#sidebar').classList.toggle('show');

function crumb(items){
  return `<div class="crumb">${items.map((it,i)=> i<items.length-1 ? `<a href="#" onclick="navigateTo('${it.nav}');return false;">${it.label}</a><i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>` : `<span style="color:var(--ink)">${it.label}</span>`).join('')}</div>`;
}

/* =================== CART & WISHLIST logic =================== */
function getCart(){ return store.get('cart',[]); }
function updateBadges(){
  const cart = getCart(); const wish = store.get('wishlist',[]);
  const cc = cart.reduce((s,i)=>s+i.qty,0);
  $('#cartCount').textContent = cc; $('#cartCount').classList.toggle('hidden', cc===0);
  $('#wishCount').textContent = wish.length; $('#wishCount').classList.toggle('hidden', wish.length===0);
  const bnavCC = $('#bnavCartCount');
  if(bnavCC){ bnavCC.textContent = cc; bnavCC.classList.toggle('hidden', cc===0); }
}
function addToCart(productId, qty=1){
  const cart = getCart();
  const existing = cart.find(i=>i.id===productId);
  if(existing) existing.qty += qty; else cart.push({id:productId, qty});
  store.set('cart', cart);
  updateBadges();
  toast('Ditambah ke troli!');
}
function changeCartQty(productId, delta){
  const cart = getCart();
  const item = cart.find(i=>i.id===productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0){ store.set('cart', cart.filter(i=>i.id!==productId)); }
  else store.set('cart', cart);
  renderCartDrawer();
  updateBadges();
}
function removeFromCart(productId){
  store.set('cart', getCart().filter(i=>i.id!==productId));
  renderCartDrawer(); updateBadges(); toast('Item dibuang dari troli.','info');
}
function toggleWishlist(productId){
  let wish = store.get('wishlist',[]);
  if(wish.includes(productId)){ wish = wish.filter(id=>id!==productId); toast('Dibuang dari wishlist.','info'); }
  else { wish.push(productId); toast('Ditambah ke wishlist! ❤'); }
  store.set('wishlist', wish);
  updateBadges();
  if(currentView==='shop') renderShop();
  if(currentView==='wishlist') renderWishlist();
}
function openCart(){
  renderCartDrawer();
  $('#cartOverlay').classList.add('show');
  $('#cartDrawer').classList.add('show');
}
function closeCart(){ $('#cartOverlay').classList.remove('show'); $('#cartDrawer').classList.remove('show'); }
function renderCartDrawer(){
  const products = store.get('products',[]);
  const cart = getCart();
  if(cart.length===0){
    $('#cartBody').innerHTML = `<div class="empty-state"><i class="fa-solid fa-bag-shopping"></i><p>Troli anda kosong.<br>Jom cari kopi kegemaran anda!</p></div>`;
    $('#cartFoot').innerHTML = `<button class="btn btn-outline btn-block" onclick="closeCart();navigateTo('shop')">Lihat Produk</button>`;
    return;
  }
  let subtotal = 0;
  $('#cartBody').innerHTML = cart.map(ci=>{
    const p = products.find(x=>x.id===ci.id);
    if(!p) return '';
    subtotal += p.price*ci.qty;
    return `<div class="cart-item">
      <img src="${p.image}" alt="${p.name}">
      <div class="ci-body">
        <div class="ci-top"><b style="font-size:14px;">${p.name}</b><span class="remove-x" onclick="removeFromCart('${p.id}')" style="cursor:pointer">Buang</span></div>
        <span style="font-size:12px;color:var(--muted)">${fmt(p.price)} / unit</span>
        <div class="qty-stepper" style="width:fit-content;"><button onclick="changeCartQty('${p.id}',-1)">−</button><span>${ci.qty}</span><button onclick="changeCartQty('${p.id}',1)">+</button></div>
      </div>
    </div>`;
  }).join('');
  const shipping = subtotal>150? 0: 12;
  const total = subtotal+shipping;
  $('#cartFoot').innerHTML = `
    <div class="sum-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    <div class="sum-row"><span>Penghantaran</span><span>${shipping===0?'Percuma':fmt(shipping)}</span></div>
    <div class="sum-row total"><span>Jumlah</span><span>${fmt(total)}</span></div>
    <button class="btn btn-accent btn-block" style="margin-top:14px;" onclick="closeCart();navigateTo('checkout');renderCheckout();">Checkout <i class="fa-solid fa-arrow-right"></i></button>
  `;
}

/* =================== CUSTOMER: HOME =================== */
function renderCustomerHome(){
  const products = store.get('products',[]);
  const courses = store.get('courses',[]);
  const cust = getMyProfile();
  $('#appMain').innerHTML = `
    ${crumb([{label:'Utama'}])}
    <h2 style="margin-bottom:6px;">Selamat kembali, ${cust?.name?.split(' ')[0]||'Danial'} 👋</h2>
    <p style="color:var(--ink-soft);margin-bottom:28px;">Ini rekomendasi khas untuk anda hari ini.</p>
    <div class="panel-head"><h3>Produk disyorkan</h3><button class="btn btn-ghost btn-sm" onclick="navigateTo('shop')">Lihat semua</button></div>
    <div class="grid grid-4" style="margin-bottom:40px;">${products.slice(0,4).map(productCardHtml).join('')}</div>
    <div class="panel-head"><h3>Kelas disyorkan</h3><button class="btn btn-ghost btn-sm" onclick="navigateTo('courses')">Lihat semua</button></div>
    <div class="grid grid-3">${courses.slice(0,3).map(courseCardHtml).join('')}</div>
  `;
}

/* =================== CUSTOMER: SHOP =================== */
let shopState = {q:'', brand:'all', sort:'popular', minR:0};
function productCardHtml(p){
  const wish = store.get('wishlist',[]).includes(p.id);
  const isEquip = p.category!=='9bcoffee';
  return `<div class="card">
    <div class="card-media">
      ${p.badge?`<span class="card-badge">${p.badge}</span>`:''}
      <button class="wish-btn ${wish?'active':''}" onclick="toggleWishlist('${p.id}')"><i class="fa-solid fa-heart"></i></button>
      <img src="${p.image}" alt="${p.name}" loading="lazy" onclick="openProductQuickView('${p.id}')" style="cursor:pointer">
    </div>
    <div class="card-body">
      <span class="card-cat" style="cursor:pointer" onclick="shopState.brand='${p.category}';navigateTo('shop');renderShopGrid()"><i class="fa-solid fa-award" style="color:var(--secondary)"></i> ${p.brandName} · ${p.productType}</span>
      <h3 class="card-title"><a href="#" onclick="openProductQuickView('${p.id}');return false;">${p.name}</a></h3>
      <div class="card-rating">${stars(p.rating)} ${p.rating} (${p.reviewsCount})</div>
      ${isEquip? `<span class="chip">Waranti ${p.warranty}</span>` : roastMeter(p.roastLevel,5,p.roast)}
      <span class="stock-tag ${p.stock===0?'out':p.stock<10?'low':'ok'}">${p.stock===0?'Kehabisan Stok':p.stock<10?`Baki ${p.stock} unit`:'Stok Tersedia'}</span>
      <div class="card-foot">
        <span class="price">${fmt(p.price)}${p.oldPrice?`<span class="old">${fmt(p.oldPrice)}</span>`:''}</span>
        <button class="btn btn-primary btn-sm" ${p.stock===0?'disabled':''} onclick="addToCart('${p.id}')"><i class="fa-solid fa-cart-plus"></i></button>
      </div>
    </div>
  </div>`;
}
function renderShop(){
  $('#appMain').innerHTML = `
    ${crumb([{label:'Utama',nav:'home-app'},{label:'Products'}])}
    <div class="panel-head"><h2>Katalog Produk</h2><button class="btn btn-outline btn-sm" onclick="navigateTo('brands')"><i class="fa-solid fa-award"></i> Lihat Semua Brand</button></div>
    <div class="filter-bar">
      <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="shopSearch" placeholder="Cari produk... (cth: Rocket, Grinder)" value="${shopState.q}" oninput="shopState.q=this.value; renderShopGrid();"></div>
      <select class="fsel" onchange="shopState.brand=this.value; renderShopGrid();">
        <option value="all">Semua Brand</option>
        ${CATEGORIES.map(c=>`<option value="${c.id}" ${shopState.brand===c.id?'selected':''}>${c.name}</option>`).join('')}
      </select>
      <select class="fsel" onchange="shopState.sort=this.value; renderShopGrid();">
        <option value="popular">Popular</option>
        <option value="price-asc">Harga: Rendah-Tinggi</option>
        <option value="price-desc">Harga: Tinggi-Rendah</option>
        <option value="newest">Terbaru</option>
        <option value="rating">Rating Tertinggi</option>
      </select>
      <select class="fsel" onchange="shopState.minR=Number(this.value); renderShopGrid();">
        <option value="0">Semua Rating</option>
        <option value="4">4★ ke atas</option>
        <option value="4.5">4.5★ ke atas</option>
      </select>
    </div>
    <div class="grid grid-4" id="shopGrid"></div>
  `;
  renderShopGrid();
}
function renderShopGrid(){
  let list = store.get('products',[]).filter(p=>{
    if(shopState.brand!=='all' && p.category!==shopState.brand) return false;
    if(shopState.q && !(p.name.toLowerCase().includes(shopState.q.toLowerCase()) || p.brandName.toLowerCase().includes(shopState.q.toLowerCase()))) return false;
    if(p.rating<shopState.minR) return false;
    return true;
  });
  if(shopState.sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if(shopState.sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else if(shopState.sort==='rating') list.sort((a,b)=>b.rating-a.rating);
  else if(shopState.sort==='newest') list = [...list].reverse();
  else list.sort((a,b)=>b.reviewsCount-a.reviewsCount);
  $('#shopGrid').innerHTML = list.length? list.map(productCardHtml).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-mug-hot"></i><p>Tiada produk ditemui. Cuba tapisan lain.</p></div>`;
}
/* ---- Brand Showcase page (Module 2 landing inside app) ---- */
function renderBrands(){
  const products = store.get('products',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Utama',nav:'home-app'},{label:'Products'}])}
  <h2 style="margin-bottom:6px;">Brand Yang Kami Bawa</h2>
  <p style="color:var(--ink-soft);margin-bottom:24px;">NBCA adalah pembekal rasmi/consultant untuk brand-brand berikut. Klik brand untuk lihat produk.</p>
  <div class="grid grid-3">
    ${CATEGORIES.map(c=>{
      const count = products.filter(p=>p.category===c.id).length;
      return `<div class="card" style="cursor:pointer;" onclick="shopState.brand='${c.id}';navigateTo('shop')">
        <div class="card-body" style="align-items:flex-start;">
          <div style="width:56px;height:56px;border-radius:14px;background:var(--primary);color:var(--primary-ink);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:6px;"><i class="fa-solid ${c.icon}"></i></div>
          <h3 class="card-title">${c.name}</h3>
          <span style="font-size:12.5px;color:var(--muted);">${c.type} · ${c.country}</span>
          <p style="font-size:13.5px;color:var(--ink-soft);margin:6px 0 10px;">${c.desc}</p>
          <span class="chip">${count} produk tersedia</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function openProductQuickView(id){
  const p = store.get('products',[]).find(x=>x.id===id);
  const isEquip = p.category!=='9bcoffee';
  const reviews = [{n:'Chef Aiman',r:5,t:'Prestasi konsisten, servis after-sales NBCA sangat responsif.'},{n:'Kafe Rina',r:4,t:'Kualiti bagus, tapi harga agak premium.'}];
  $('#genericModal').innerHTML = `
    <button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
    <div style="display:grid;grid-template-columns:1fr 1fr;">
      <img src="${p.image}" style="width:100%;height:100%;object-fit:cover;min-height:320px;">
      <div class="modal-pad">
        <span class="card-cat"><i class="fa-solid fa-award" style="color:var(--secondary)"></i> ${p.brandName} · ${p.productType}</span>
        <h2 style="margin:8px 0;">${p.name}</h2>
        <div class="card-rating">${stars(p.rating)} ${p.rating} · ${p.reviewsCount} ulasan</div>
        ${isEquip? `<div class="course-meta-row" style="margin:8px 0;"><span class="chip">Asal: ${p.origin}</span><span class="chip">Waranti ${p.warranty}</span></div>` : roastMeter(p.roastLevel,5,'Roast: '+p.roast)}
        <p style="color:var(--ink-soft);font-size:14px;margin:14px 0;">${p.desc}</p>
        <div class="price" style="font-size:24px;margin-bottom:14px;">${fmt(p.price)}</div>
        <div class="field"><label>${isEquip?'Unit':'Berat'}</label><select class="fsel" style="width:100%;">${p.weights.map(w=>`<option>${w}</option>`).join('')}</select></div>
        <button class="btn btn-primary btn-block" ${p.stock===0?'disabled':''} onclick="addToCart('${p.id}');closeModal('genericModalBack')">Tambah ke Troli — ${fmt(p.price)}</button>
        <div style="margin-top:20px;">
          <h4 style="font-size:14px;margin-bottom:10px;">Ulasan Pelanggan</h4>
          ${reviews.map(r=>`<div class="review-card"><div class="review-top"><b>${r.n}</b>${stars(r.r)}</div><p style="font-size:13px;color:var(--ink-soft);margin-top:6px;">${r.t}</p></div>`).join('')}
        </div>
      </div>
    </div>`;
  $('#genericModalBack').classList.add('show');
}

/* =================== CUSTOMER: WISHLIST =================== */
function renderWishlist(){
  const wish = store.get('wishlist',[]);
  const products = store.get('products',[]).filter(p=>wish.includes(p.id));
  $('#appMain').innerHTML = `${crumb([{label:'Utama',nav:'home-app'},{label:'Wishlist'}])}<h2 style="margin-bottom:20px;">Wishlist Saya</h2>
  <div class="grid grid-4" id="wishGrid">${products.length? products.map(productCardHtml).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-heart"></i><p>Wishlist masih kosong.</p></div>`}</div>`;
}

/* =================== CUSTOMER: CHECKOUT =================== */
let checkoutStep = 1;
let checkoutPaymentMethodId = null;
let checkoutProofImage = null;
function renderCheckout(){
  checkoutStep = 1; checkoutProofImage = null;
  const pms = store.get('paymentMethods',[]).filter(p=>p.active);
  checkoutPaymentMethodId = pms[0]?.id || null;
  const cart = getCart();
  if(cart.length===0){ navigateTo('shop'); toast('Troli kosong.','error'); return; }
  $('#appMain').innerHTML = `${crumb([{label:'Utama',nav:'home-app'},{label:'Checkout'}])}
  <h2 style="margin-bottom:24px;">Checkout</h2>
  <div class="step-track" id="stepTrack"></div>
  <div id="checkoutBody" style="max-width:640px;"></div>`;
  renderCheckoutStep();
}
function stepTrackHtml(){
  const steps = ['Maklumat Penghantaran','Pembayaran','Pengesahan'];
  return steps.map((s,i)=>{
    const n=i+1; const cls = n<checkoutStep?'done':n===checkoutStep?'current':'';
    return `<div class="step ${cls}"><div class="num">${n<checkoutStep?'<i class=\"fa-solid fa-check\"></i>':n}</div><span class="txt">${s}</span></div>${i<2?'<div class="connector"></div>':''}`;
  }).join('');
}
function renderCheckoutStep(){
  $('#stepTrack').innerHTML = stepTrackHtml();
  const body = $('#checkoutBody');
  const cust = getMyProfile();
  if(checkoutStep===1){
    body.innerHTML = `<div class="panel">
      <h3 style="margin-bottom:16px;">Maklumat Penghantaran</h3>
      <div class="field"><label>Nama Penuh</label><input id="shipName" value="${cust?.name||''}"></div>
      <div class="field"><label>No. Telefon</label><input id="shipPhone" value="${cust?.phone||''}"></div>
      <div class="field"><label>Alamat</label><textarea rows="3" id="shipAddr">${cust?.address||''}</textarea></div>
      <button class="btn btn-primary btn-block" onclick="checkoutStep=2;renderCheckoutStep()">Seterusnya <i class="fa-solid fa-arrow-right"></i></button>
    </div>`;
  } else if(checkoutStep===2){
    const pms = store.get('paymentMethods',[]).filter(p=>p.active);
    const selected = pms.find(p=>p.id===checkoutPaymentMethodId) || pms[0];
    body.innerHTML = `<div class="panel">
      <h3 style="margin-bottom:16px;">Kaedah Pembayaran</h3>
      ${pms.map(m=>`
        <label style="display:flex;align-items:center;gap:12px;padding:14px;border:1.5px solid ${checkoutPaymentMethodId===m.id?'var(--accent)':'var(--line)'};border-radius:var(--radius-s);margin-bottom:10px;cursor:pointer;" onclick="checkoutPaymentMethodId='${m.id}';renderCheckoutStep()">
          <input type="radio" name="payM" ${checkoutPaymentMethodId===m.id?'checked':''} readonly><i class="fa-solid ${m.icon}" style="color:var(--secondary);width:18px;"></i><span>${m.name}</span>
        </label>`).join('')}
      ${selected? paymentMethodDetailHtml(selected) : ''}
      <div style="display:flex;gap:10px;margin-top:14px;">
        <button class="btn btn-outline btn-block" onclick="checkoutStep=1;renderCheckoutStep()">Kembali</button>
        <button class="btn btn-primary btn-block" onclick="checkoutStep=3;finalizeOrder();renderCheckoutStep()">Sahkan & Hantar Pesanan</button>
      </div>
    </div>`;
  } else {
    const order = store.get('orders',[])[0];
    body.innerHTML = `<div class="panel" style="text-align:center;">
      <div style="width:70px;height:70px;border-radius:50%;background:var(--good);color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 18px;"><i class="fa-solid fa-check"></i></div>
      <h3>Pesanan Berjaya Dihantar!</h3>
      <p style="color:var(--ink-soft);margin:10px 0 6px;">No. Pesanan: <b>${order.id}</b> · No. Resit: <b>${order.receiptId}</b></p>
      <p style="color:var(--ink-soft);font-size:13px;margin-bottom:20px;">Pesanan anda kini <b>menunggu pengesahan pembayaran</b> oleh admin. Anda boleh jejak status di "Pesanan Saya".</p>
      <button class="btn btn-primary" onclick="navigateTo('my-orders')">Lihat Pesanan Saya</button>
    </div>`;
  }
}
function paymentMethodDetailHtml(m){
  if(m.type==='fpx'){
    return `<div class="field"><label>Pilih Bank</label><select class="fsel" style="width:100%;">${m.banks.map(b=>`<option>${b}</option>`).join('')}</select></div>
    <div class="mt-note">Anda akan dibawa ke portal bank untuk melengkapkan bayaran (simulasi).</div>`;
  }
  if(m.type==='qr'){
    return `<div style="text-align:center;padding:16px 0;"><img src="${m.qrImage}" style="width:180px;height:180px;border-radius:var(--radius-s);border:1px solid var(--line);"><p class="mt-note">Imbas kod QR guna app e-wallet/banking anda, kemudian muat naik bukti bayaran di bawah.</p></div>
    ${proofUploadHtml()}`;
  }
  if(m.type==='card'){
    return `<div class="grid grid-2">
      <div class="field" style="grid-column:1/-1;"><label>Nombor Kad</label><input placeholder="4242 4242 4242 4242"></div>
      <div class="field"><label>Tarikh Luput</label><input placeholder="MM/YY"></div>
      <div class="field"><label>CVC</label><input placeholder="123"></div>
    </div><div class="mt-note">Digerakkan oleh ${m.gateway} · Menerima ${m.acceptedCards.join(', ')}</div>`;
  }
  // ewallet
  return `<div class="mt-note">Anda akan diarah ke app ${m.name} untuk pengesahan bayaran (simulasi).</div>${proofUploadHtml()}`;
}
function proofUploadHtml(){
  return `<div class="field"><label>Muat Naik Bukti Pembayaran (opsyenal)</label>
    <img id="proofPreview" class="upload-preview" src="${checkoutProofImage||''}" style="${checkoutProofImage?'display:block;':''}">
    <label class="upload-box" for="proofInput"><i class="fa-solid fa-cloud-arrow-up"></i><b style="font-size:13px;">Klik untuk muat naik resit/slip</b></label>
    <input type="file" id="proofInput" accept="image/*" style="display:none;" onchange="handleProofUpload(event)">
  </div>`;
}
function handleProofUpload(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{ checkoutProofImage = ev.target.result; const pv=$('#proofPreview'); if(pv){ pv.src=checkoutProofImage; pv.style.display='block'; } toast('Bukti bayaran dimuat naik.','info'); };
  reader.readAsDataURL(file);
}
function getMyProfile(){
  const s = store.get('session'); if(!s || !s.customerId) return null;
  return store.get('customers',[]).find(c=>c.id===s.customerId);
}
function finalizeOrder(){
  const products = store.get('products',[]);
  const cart = getCart();
  const cust = getMyProfile();
  const pm = store.get('paymentMethods',[]).find(p=>p.id===checkoutPaymentMethodId);
  const items = cart.map(ci=>{ const p = products.find(x=>x.id===ci.id); return {productId:p.id, name:p.name, qty:ci.qty, price:p.price}; });
  const subtotal = items.reduce((s,it)=>s+it.price*it.qty,0);
  const shipping = subtotal>150?0:12;
  const orders = store.get('orders',[]);
  const newOrder = {
    id:'ORD'+Math.floor(1000+Math.random()*9000), receiptId:'RCPT-'+Math.floor(1000+Math.random()*9000),
    customerId: cust?.id||'guest', customerName: cust?.name||'Guest', customerEmail: cust?.email||'',
    items, subtotal:+subtotal.toFixed(2), shipping, total:+(subtotal+shipping).toFixed(2),
    paymentMethodName: pm?.name||'Tidak diketahui', paymentStatus:'pending', paymentProof: checkoutProofImage,
    orderStatus:'pending_payment', trackingNumber:null, courier:null,
    date:new Date().toISOString().slice(0,10),
    history:[{status:'pending_payment', label:'Pesanan dibuat & menunggu pengesahan bayaran', date:new Date().toISOString().slice(0,10)}]
  };
  orders.unshift(newOrder);
  store.set('orders', orders);
  store.set('cart', []);
  updateBadges();
}

/* =================== CUSTOMER: MY ORDERS (with progress tracker + receipt) =================== */
function renderMyOrders(){
  const s = store.get('session');
  const orders = store.get('orders',[]).filter(o=>o.customerId===s?.customerId);
  $('#appMain').innerHTML = `${crumb([{label:'Utama',nav:'home-app'},{label:'Pesanan Saya'}])}<h2 style="margin-bottom:20px;">Pesanan Saya</h2>
  ${orders.length===0? `<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>Tiada pesanan lagi. <a href="#" style="color:var(--accent)" onclick="navigateTo('shop');return false;">Mula membeli-belah!</a></p></div>` : ''}
  ${orders.map(o=>orderCardHtml(o)).join('')}`;
}
function orderCardHtml(o){
  if(o.orderStatus==='cancelled'){
    return `<div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;">
      <div><b>${o.id}</b> · <span style="font-size:12.5px;color:var(--muted)">${o.date}</span></div>
      <span class="pill-status cancelled">Dibatalkan</span>
    </div><p style="font-size:13px;color:var(--ink-soft);margin-top:8px;">${o.items.map(it=>it.name+' ×'+it.qty).join(', ')} — ${fmt(o.total)}</p></div>`;
  }
  const stepIdx = ORDER_STEPS.findIndex(s=>s.key===o.orderStatus);
  return `<div class="panel">
    <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px;margin-bottom:18px;">
      <div><b style="font-size:15px;">${o.id}</b><br><span style="font-size:12.5px;color:var(--muted)">${o.date} · ${o.items.reduce((s,it)=>s+it.qty,0)} item · ${fmt(o.total)}</span></div>
      <button class="btn btn-outline btn-sm" onclick="viewReceipt('${o.id}')"><i class="fa-solid fa-receipt"></i> Lihat Resit</button>
    </div>
    <div style="display:flex;align-items:center;overflow-x:auto;padding-bottom:6px;">
      ${ORDER_STEPS.map((st,i)=>`
        <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:90px;">
          <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;
            background:${i<=stepIdx?'var(--accent)':'var(--surface-2)'};color:${i<=stepIdx?'#fff':'var(--muted)'};border:2px solid ${i<=stepIdx?'var(--accent)':'var(--line)'};">
            <i class="fa-solid ${st.icon}"></i>
          </div>
          <span style="font-size:10.5px;text-align:center;margin-top:6px;font-weight:700;color:${i<=stepIdx?'var(--ink)':'var(--muted)'};">${st.label}</span>
        </div>
        ${i<ORDER_STEPS.length-1?`<div style="flex:0 0 30px;height:2px;background:${i<stepIdx?'var(--accent)':'var(--line)'};margin-bottom:20px;"></div>`:''}
      `).join('')}
    </div>
    ${o.trackingNumber?`<div class="chip" style="margin-top:14px;"><i class="fa-solid fa-truck-fast"></i> ${o.courier} — No. Tracking: <b>${o.trackingNumber}</b></div>`:''}
    ${o.paymentStatus==='pending'?`<div class="chip" style="margin-top:10px;background:#FCEFC7;color:#8A6D1F;"><i class="fa-solid fa-clock"></i> Pembayaran belum disahkan admin</div>`:''}
    <details style="margin-top:14px;"><summary style="cursor:pointer;font-size:12.5px;color:var(--accent);font-weight:700;">Sejarah Status</summary>
      <div style="margin-top:10px;">${o.history.map(h=>`<div style="font-size:12.5px;color:var(--ink-soft);padding:6px 0;border-bottom:1px solid var(--line);">${h.date} — ${h.label}</div>`).join('')}</div>
    </details>
  </div>`;
}
function viewReceipt(orderId){
  const o = store.get('orders',[]).find(x=>x.id===orderId);
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad">
    <div style="text-align:center;margin-bottom:20px;">
      <span class="eyebrow"><i class="fa-solid fa-receipt"></i> Resit Rasmi</span>
      <h2 style="margin-top:6px;">NBCA Sdn Bhd</h2>
      <span class="mt-note">No. Resit: ${o.receiptId} · No. Pesanan: ${o.id}</span>
    </div>
    <div class="panel">
      <div class="sum-row"><span>Pelanggan</span><span>${o.customerName}</span></div>
      <div class="sum-row"><span>Tarikh</span><span>${o.date}</span></div>
      <div class="sum-row"><span>Kaedah Bayaran</span><span>${o.paymentMethodName}</span></div>
      <div class="sum-row"><span>Status Bayaran</span><span class="pill-status ${o.paymentStatus==='verified'?'confirmed':o.paymentStatus==='failed'?'cancelled':'pending'}">${o.paymentStatus}</span></div>
      <hr style="border:none;border-top:1px dashed var(--line);margin:12px 0;">
      ${o.items.map(it=>`<div class="sum-row"><span>${it.name} ×${it.qty}</span><span>${fmt(it.price*it.qty)}</span></div>`).join('')}
      <div class="sum-row"><span>Penghantaran</span><span>${o.shipping===0?'Percuma':fmt(o.shipping)}</span></div>
      <div class="sum-row total"><span>Jumlah</span><span>${fmt(o.total)}</span></div>
    </div>
    ${o.paymentProof?`<div style="margin-top:14px;"><label style="font-size:13px;font-weight:700;">Bukti Pembayaran</label><img src="${o.paymentProof}" style="width:100%;border-radius:var(--radius-s);margin-top:8px;border:1px solid var(--line);"></div>`:''}
    <button class="btn btn-outline btn-block" style="margin-top:16px;" onclick="toast('Resit dimuat turun (simulasi PDF).','info')"><i class="fa-solid fa-download"></i> Muat Turun PDF</button>
  </div>`;
  $('#genericModalBack').classList.add('show');
}

/* =================== CUSTOMER: COURSES LIST =================== */
let courseState = {q:'', level:'all', type:'all', sort:'popular'};
function courseCardHtml(c){
  const instructors = store.get('instructors',[]);
  const ins = instructors.find(i=>i.id===c.instructorId);
  const pct = Math.round((c.seatsTaken/c.seatsTotal)*100);
  return `<div class="card">
    <div class="card-media">
      ${c.badge?`<span class="card-badge alt">${c.badge}</span>`:''}
      <img src="${c.image}" alt="${c.title}" loading="lazy" style="cursor:pointer" onclick="openCourseDetail('${c.id}')">
    </div>
    <div class="card-body">
      <div class="course-meta-row"><span class="chip">${c.level}</span><span class="chip">${c.type}</span><span class="chip">${c.duration}</span><span class="chip">${c.lang}</span></div>
      <h3 class="card-title"><a href="#" onclick="openCourseDetail('${c.id}');return false;">${c.title}</a></h3>
      <div class="instructor-mini"><span class="avatar">${ins.name[0]}</span><span style="font-size:12.5px;color:var(--ink-soft)">${ins.name} · ${ins.exp}</span></div>
      <div class="card-rating">${stars(c.rating)} ${c.rating} (${c.reviewsCount})</div>
      <div class="seats-bar" title="${c.seatsTotal-c.seatsTaken} tempat tinggal"><i style="width:${pct}%"></i></div>
      <span style="font-size:11.5px;color:var(--muted)">${c.seatsTotal-c.seatsTaken} tempat tinggal</span>
      <div class="card-foot">
        <span class="price">${fmt(c.price)}</span>
        <button class="btn btn-accent btn-sm" onclick="openCourseDetail('${c.id}')">Lihat</button>
      </div>
    </div>
  </div>`;
}
function renderCoursesList(){
  $('#appMain').innerHTML = `${crumb([{label:'Utama',nav:'home-app'},{label:'Kelas Kopi'}])}<h2 style="margin-bottom:20px;">Katalog Kelas Kopi</h2>
  <div class="filter-bar">
    <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input placeholder="Cari kelas atau instruktor..." oninput="courseState.q=this.value;renderCoursesGrid();"></div>
    <select class="fsel" onchange="courseState.level=this.value;renderCoursesGrid();">
      <option value="all">Semua Tahap</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Professional</option>
    </select>
    <select class="fsel" onchange="courseState.type=this.value;renderCoursesGrid();">
      <option value="all">Semua Jenis</option><option>Online</option><option>In-Person</option><option>Hybrid</option>
    </select>
    <select class="fsel" onchange="courseState.sort=this.value;renderCoursesGrid();">
      <option value="popular">Popular</option><option value="price-asc">Harga Rendah-Tinggi</option><option value="price-desc">Harga Tinggi-Rendah</option><option value="rating">Rating Tertinggi</option><option value="newest">Terbaru</option>
    </select>
  </div>
  <div class="grid grid-4" id="courseGrid"></div>`;
  renderCoursesGrid();
}
function renderCoursesGrid(){
  let list = store.get('courses',[]).filter(c=>{
    if(courseState.level!=='all' && c.level!==courseState.level) return false;
    if(courseState.type!=='all' && c.type!==courseState.type) return false;
    if(courseState.q && !c.title.toLowerCase().includes(courseState.q.toLowerCase())) return false;
    return true;
  });
  if(courseState.sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if(courseState.sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else if(courseState.sort==='rating') list.sort((a,b)=>b.rating-a.rating);
  else if(courseState.sort==='newest') list=[...list].reverse();
  else list.sort((a,b)=>b.reviewsCount-a.reviewsCount);
  $('#courseGrid').innerHTML = list.length? list.map(courseCardHtml).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-graduation-cap"></i><p>Tiada kelas ditemui.</p></div>`;
}

/* =================== COURSE DETAIL MODAL =================== */
function openCourseDetail(id){
  const c = store.get('courses',[]).find(x=>x.id===id);
  const instructors = store.get('instructors',[]);
  const ins = instructors.find(i=>i.id===c.instructorId);
  const related = store.get('courses',[]).filter(x=>x.id!==id && x.level===c.level).slice(0,2);
  $('#genericModal').innerHTML = `
    <button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
    <div class="modal-pad">
      <img src="${c.image}" style="width:100%;height:220px;object-fit:cover;border-radius:var(--radius-m);margin-bottom:18px;">
      <div class="course-meta-row" style="margin-bottom:10px;"><span class="chip">${c.level}</span><span class="chip">${c.type}</span><span class="chip">${c.duration}</span><span class="chip">${c.lang}</span></div>
      <h2>${c.title}</h2>
      <div class="card-rating" style="margin:8px 0;">${stars(c.rating)} ${c.rating} · ${c.reviewsCount} ulasan · ${c.seatsTotal-c.seatsTaken} tempat tinggal</div>
      <div class="instructor-mini" style="margin-bottom:16px;"><span class="avatar" style="width:38px;height:38px;font-size:15px;">${ins.name[0]}</span><div><b style="display:block;font-size:14px;">${ins.name}</b><span style="font-size:12px;color:var(--muted)">${ins.exp} pengalaman · ${ins.bio}</span></div></div>

      <h4 style="font-size:14px;margin-bottom:8px;">Apa Anda Akan Pelajari</h4>
      <ul style="margin:0 0 18px 18px; font-size:13.5px; color:var(--ink-soft); line-height:1.9;">${c.outcomes.map(o=>`<li>${o}</li>`).join('')}</ul>

      <h4 style="font-size:14px;margin-bottom:8px;">Silibus Kursus</h4>
      <div style="margin-bottom:18px;">${c.curriculum.map((cur,i)=>`
        <div class="accordion-item" id="acc-${cur.id}">
          <div class="accordion-head" onclick="document.getElementById('acc-${cur.id}').classList.toggle('open')">${cur.title}<i class="fa-solid fa-chevron-down"></i></div>
          <div class="accordion-body"><div class="inner">${cur.desc}</div></div>
        </div>`).join('')}</div>

      <h4 style="font-size:14px;margin-bottom:8px;">Prasyarat</h4>
      <p style="font-size:13.5px;color:var(--ink-soft);margin-bottom:18px;">${c.prerequisites}</p>

      <h4 style="font-size:14px;margin-bottom:8px;">Bahan Disediakan</h4>
      <div class="course-meta-row" style="margin-bottom:18px;">${c.materials.map(m=>`<span class="chip"><i class="fa-solid fa-check" style="color:var(--good);margin-right:4px;"></i>${m}</span>`).join('')}</div>

      <h4 style="font-size:14px;margin-bottom:8px;">Ulasan Pelajar</h4>
      <div style="margin-bottom:20px;">${c.reviews.map(r=>`<div class="review-card"><div class="review-top"><b>${r.name}</b>${stars(r.rating)}</div><p style="font-size:13px;color:var(--ink-soft);margin-top:6px;">${r.text}</p></div>`).join('')}</div>

      ${related.length?`<h4 style="font-size:14px;margin-bottom:8px;">Kelas Berkaitan</h4>
      <div class="grid grid-2" style="margin-bottom:20px;">${related.map(r=>`<div class="chip" style="cursor:pointer;padding:10px 14px;" onclick="openCourseDetail('${r.id}')"><b>${r.title}</b></div>`).join('')}</div>`:''}

      <div style="position:sticky;bottom:0;background:var(--bg);padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;">
        <span class="price" style="font-size:22px;">${fmt(c.price)}</span>
        <button class="btn btn-accent" onclick="closeModal('genericModalBack');openCourseRegistration('${c.id}')">Daftar Kelas <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </div>`;
  $('#genericModalBack').classList.add('show');
}

/* =================== COURSE REGISTRATION FLOW =================== */
let regState = {step:1, courseId:null, scheduleId:null};
function openCourseRegistration(courseId){
  regState = {step:1, courseId, scheduleId:null};
  renderRegModal();
  $('#genericModalBack').classList.add('show');
}
function renderRegModal(){
  const c = store.get('courses',[]).find(x=>x.id===regState.courseId);
  let inner = '';
  if(regState.step===1){
    inner = `<h3 style="margin-bottom:16px;">Pilih Tarikh/Sesi</h3>
    ${c.schedules.map(s=>`
      <label style="display:flex;justify-content:space-between;align-items:center;padding:16px;border:1.5px solid ${regState.scheduleId===s.id?'var(--accent)':'var(--line)'};border-radius:var(--radius-s);margin-bottom:10px;cursor:pointer;" onclick="regState.scheduleId='${s.id}';renderRegModal()">
        <div><b style="display:block;font-size:14px;">${s.date}</b><span style="font-size:12.5px;color:var(--muted)">${s.time} · ${s.venue}</span></div>
        <input type="radio" name="sch" ${regState.scheduleId===s.id?'checked':''} readonly>
      </label>`).join('')}
    <button class="btn btn-primary btn-block" ${!regState.scheduleId?'disabled':''} onclick="regState.step=2;renderRegModal()" style="margin-top:10px;">Seterusnya</button>`;
  } else if(regState.step===2){
    inner = `<h3 style="margin-bottom:16px;">Maklumat Pendaftaran</h3>
    <div class="field"><label>Nama Penuh</label><input id="regName" value="Danial Rahman"></div>
    <div class="field"><label>Emel</label><input id="regEmail" value="user@nbca.com"></div>
    <div class="field"><label>No. Telefon</label><input id="regPhone" value="012-3456789"></div>
    <div class="field"><label>Tahap Pengalaman</label><select class="fsel" style="width:100%;" id="regExp"><option>Tiada pengalaman</option><option>Pernah cuba sendiri</option><option>Sudah bekerja dalam industri</option></select></div>
    <div class="field"><label>Permintaan Khas (jika ada)</label><textarea rows="2" id="regNote" placeholder="cth: alahan makanan, keperluan khas..."></textarea></div>
    <div style="display:flex;gap:10px;"><button class="btn btn-outline btn-block" onclick="regState.step=1;renderRegModal()">Kembali</button><button class="btn btn-primary btn-block" onclick="regState.step=3;renderRegModal()">Seterusnya</button></div>`;
  } else if(regState.step===3){
    inner = `<h3 style="margin-bottom:16px;">Pembayaran</h3>
    <div class="panel" style="margin-bottom:16px;">
      <div class="sum-row"><span>${c.title}</span><span>${fmt(c.price)}</span></div>
      <div class="sum-row total"><span>Jumlah</span><span>${fmt(c.price)}</span></div>
    </div>
    ${['FPX Online Banking','Kad Kredit/Debit','Touch n Go eWallet'].map((m,i)=>`
      <label style="display:flex;align-items:center;gap:12px;padding:14px;border:1.5px solid var(--line);border-radius:var(--radius-s);margin-bottom:10px;">
        <input type="radio" name="regPay" ${i===0?'checked':''}><span>${m}</span>
      </label>`).join('')}
    <div style="display:flex;gap:10px;margin-top:10px;"><button class="btn btn-outline btn-block" onclick="regState.step=2;renderRegModal()">Kembali</button><button class="btn btn-accent btn-block" onclick="confirmCourseRegistration()">Bayar & Sahkan</button></div>`;
  } else {
    inner = `<div style="text-align:center;">
      <div style="width:70px;height:70px;border-radius:50%;background:var(--good);color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 18px;"><i class="fa-solid fa-check"></i></div>
      <h3>Pendaftaran Disahkan!</h3>
      <p style="color:var(--ink-soft);margin:10px 0 20px;">Anda telah berjaya mendaftar untuk <b>${c.title}</b>. E-mel pengesahan telah dihantar (simulasi).</p>
      <div class="cert-preview" style="margin-bottom:20px;">
        <span style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Pratonton Sijil</span>
        <h2>Sijil Pendaftaran</h2>
        <div class="name">Danial Rahman</div>
        <p style="font-size:13px;">telah berjaya mendaftar kursus<br><b>${c.title}</b></p>
      </div>
      <button class="btn btn-primary" onclick="closeModal('genericModalBack');navigateTo('my-courses')">Lihat Kelas Saya</button>
    </div>`;
  }
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button><div class="modal-pad">
    ${regState.step<=3?`<div class="step-track">${['Sesi','Maklumat','Bayaran'].map((s,i)=>{const n=i+1;const cls=n<regState.step?'done':n===regState.step?'current':'';return `<div class="step ${cls}"><div class="num">${n<regState.step?'<i class=\"fa-solid fa-check\"></i>':n}</div><span class="txt">${s}</span></div>${i<2?'<div class="connector"></div>':''}`;}).join('')}</div>`:''}
    ${inner}
  </div>`;
}
function confirmCourseRegistration(){
  const c = store.get('courses',[]).find(x=>x.id===regState.courseId);
  const enrollments = store.get('myEnrollments',[]);
  enrollments.unshift({id:uid('enr'), courseId:c.id, courseTitle:c.title, scheduleId:regState.scheduleId, status:'confirmed', progress:0, enrolledDate:new Date().toISOString().slice(0,10)});
  store.set('myEnrollments', enrollments);
  const courses = store.get('courses',[]);
  const idx = courses.findIndex(x=>x.id===c.id);
  courses[idx].seatsTaken = Math.min(courses[idx].seatsTotal, courses[idx].seatsTaken+1);
  store.set('courses', courses);
  regState.step=4;
  renderRegModal();
  toast('Pendaftaran kelas berjaya!');
}

/* =================== CUSTOMER: MY COURSES DASHBOARD =================== */
function renderMyCourses(){
  const enrollments = store.get('myEnrollments',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Utama',nav:'home-app'},{label:'Kelas Saya'}])}<h2 style="margin-bottom:20px;">Kelas Saya</h2>
  ${enrollments.length===0?`<div class="empty-state"><i class="fa-solid fa-chalkboard-user"></i><p>Anda belum mendaftar sebarang kelas.<br><a href="#" style="color:var(--accent)" onclick="navigateTo('courses');return false;">Terokai kelas sekarang</a></p></div>`:''}
  <div class="grid grid-2">
    ${enrollments.map(e=>{
      const c = store.get('courses',[]).find(x=>x.id===e.courseId);
      const sch = c?.schedules.find(s=>s.id===e.scheduleId);
      return `<div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div><h3 style="font-size:17px;">${e.courseTitle}</h3><span style="font-size:12.5px;color:var(--muted)">Didaftar: ${e.enrolledDate}</span></div>
          <span class="pill-status ${e.status}">${e.status}</span>
        </div>
        ${sch?`<p style="font-size:13px;color:var(--ink-soft);margin:10px 0;"><i class="fa-solid fa-calendar"></i> ${sch.date} · ${sch.venue}</p>`:''}
        <div style="margin:14px 0;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;"><span>Kemajuan</span><span>${e.progress}%</span></div>
          <div class="progress-bar"><i style="width:${e.progress}%"></i></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="simulateProgress('${e.id}')"><i class="fa-solid fa-play"></i> Teruskan Belajar</button>
          <button class="btn btn-outline btn-sm" onclick="openCourseMaterials('${e.id}')"><i class="fa-solid fa-file-lines"></i> Bahan Kursus</button>
          ${e.progress>=100?`<button class="btn btn-accent btn-sm" onclick="downloadCertificate('${e.id}')"><i class="fa-solid fa-certificate"></i> Muat Turun Sijil</button>`:''}
          ${e.status!=='cancelled' && e.progress<100?`<button class="btn btn-ghost btn-sm" style="color:var(--bad)" onclick="cancelEnrollment('${e.id}')">Batal</button>`:''}
        </div>
      </div>`;
    }).join('')}
  </div>
  <div class="panel" style="margin-top:10px;">
    <h3 style="margin-bottom:14px;">Lencana Pencapaian</h3>
    <div class="badge-set">
      ${['Pemula','Sesi Pertama','Suka Kopi','Master Roaster','Barista Bersijil'].map((b,i)=>`
        <div class="earned-badge ${enrollments.length>i?'':'locked'}"><div class="ic"><i class="fa-solid fa-award"></i></div><span>${b}</span></div>`).join('')}
    </div>
  </div>`;
}
function simulateProgress(enrId){
  const enrollments = store.get('myEnrollments',[]);
  const e = enrollments.find(x=>x.id===enrId);
  e.progress = Math.min(100, e.progress+25);
  if(e.progress>=100) e.status='completed';
  store.set('myEnrollments', enrollments);
  renderMyCourses();
  toast(e.progress>=100? 'Tahniah! Kursus selesai 🎉' : 'Kemajuan dikemaskini!');
}
function cancelEnrollment(enrId){
  const enrollments = store.get('myEnrollments',[]);
  const e = enrollments.find(x=>x.id===enrId);
  e.status='cancelled';
  store.set('myEnrollments', enrollments);
  renderMyCourses();
  toast('Pendaftaran dibatalkan mengikut dasar refund.','info');
}
function openCourseMaterials(enrId){
  const e = store.get('myEnrollments',[]).find(x=>x.id===enrId);
  const c = store.get('courses',[]).find(x=>x.id===e.courseId);
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad"><h3 style="margin-bottom:16px;">Bahan Kursus — ${c.title}</h3>
  ${c.materials.map(m=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);"><i class="fa-solid fa-file-lines" style="color:var(--accent)"></i><span style="flex:1;font-size:14px;">${m}</span><button class="btn btn-ghost btn-sm" onclick="toast('Muat turun disimulasikan.','info')">Muat Turun</button></div>`).join('')}
  <div style="margin-top:18px;"><h4 style="font-size:14px;margin-bottom:10px;">Kuiz Ringkas</h4><p style="font-size:13px;color:var(--ink-soft);margin-bottom:10px;">Jawab kuiz untuk uji kefahaman anda.</p><button class="btn btn-outline btn-sm" onclick="toast('Kuiz disimulasikan — markah: 8/10','success')">Mula Kuiz</button></div>
  </div>`;
  $('#genericModalBack').classList.add('show');
}
function downloadCertificate(enrId){
  const e = store.get('myEnrollments',[]).find(x=>x.id===enrId);
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad">
    <div class="cert-preview">
      <span style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;"><i class="fa-solid fa-certificate"></i> Sijil Penyempurnaan</span>
      <h2>NBCA Academy</h2>
      <div class="name">Danial Rahman</div>
      <p style="font-size:13px;">telah berjaya menamatkan kursus<br><b>${e.courseTitle}</b><br>dengan jayanya.</p>
      <p style="font-size:11px;margin-top:16px;color:var(--muted)"><i class="fa-solid fa-qrcode"></i> Kod Pengesahan: ${e.id.toUpperCase()} — Imbas untuk sahkan keaslian</p>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="toast('Muat turun PDF disimulasikan.','info')">Muat Turun PDF</button>
  </div>`;
  $('#genericModalBack').classList.add('show');
}

/* =================== CUSTOMER: PROFILE =================== */
function renderProfile(){
  const cust = getMyProfile() || {};
  $('#appMain').innerHTML = `${crumb([{label:'Utama',nav:'home-app'},{label:'Profil'}])}<h2 style="margin-bottom:20px;">Profil Saya</h2>
  <div class="panel" style="max-width:520px;">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
      <span class="avatar" style="width:52px;height:52px;font-size:20px;">${cust.avatarInitial||cust.name?.[0]||'?'}</span>
      <div><b style="display:block;">${cust.name||'-'}</b><span style="font-size:12.5px;color:var(--muted);">Ahli sejak ${cust.joined||'-'}</span></div>
    </div>
    <div class="field"><label>Nama</label><input id="profName" value="${cust.name||''}"></div>
    <div class="field"><label>Emel</label><input value="${cust.email||''}" disabled></div>
    <div class="field"><label>No. Telefon</label><input id="profPhone" value="${cust.phone||''}"></div>
    <div class="field"><label>Alamat Penghantaran</label><textarea rows="3" id="profAddr">${cust.address||''}</textarea></div>
    <button class="btn btn-primary" onclick="saveMyProfile()">Simpan Perubahan</button>
  </div>
  <div class="panel" style="max-width:520px;">
    <h3 style="font-size:15px;margin-bottom:10px;">Program Kesetiaan</h3>
    <p style="font-size:13px;color:var(--ink-soft);margin-bottom:10px;">Anda mempunyai <b style="color:var(--accent)">${(cust.loyaltyPoints||0).toLocaleString()} mata</b> — tukar untuk diskaun!</p>
    <div class="progress-bar"><i style="width:${Math.min(100,((cust.loyaltyPoints||0)%1500)/15)}%"></i></div>
    <p class="mt-note">${1500-((cust.loyaltyPoints||0)%1500)} mata lagi untuk naik ke Peringkat Gold.</p>
  </div>`;
}
function saveMyProfile(){
  const s = store.get('session');
  const customers = store.get('customers',[]);
  const cust = customers.find(c=>c.id===s.customerId);
  if(!cust) return;
  cust.name = $('#profName').value.trim();
  cust.phone = $('#profPhone').value.trim();
  cust.address = $('#profAddr').value.trim();
  store.set('customers', customers);
  toast('Profil dikemaskini!');
  renderProfile();
}

/* =========================================================================
   ADMIN VIEWS
   ========================================================================= */
function renderAdminDashboard(){
  const orders = store.get('orders',[]);
  const products = store.get('products',[]);
  const customers = store.get('customers',[]);
  const registrations = store.get('registrations',[]);
  const courses = store.get('courses',[]);
  const totalSales = orders.filter(o=>o.orderStatus!=='cancelled').reduce((s,o)=>s+o.total,0);
  const courseRevenue = registrations.filter(r=>r.status!=='cancelled').reduce((s,r)=>{ const c=courses.find(x=>x.id===r.courseId); return s+(c?c.price:0); },0);
  const lowStock = products.filter(p=>p.stock>0 && p.stock<10);

  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Dashboard'}])}
  <h2 style="margin-bottom:6px;">Dashboard Admin</h2>
  <p style="color:var(--ink-soft);margin-bottom:24px;">Gambaran keseluruhan prestasi platform.</p>
  <div class="kpi-grid">
    ${kpi('fa-sack-dollar','Jumlah Jualan',fmt(totalSales),'+12.4%','up','#DBF0DF','#2C6B39')}
    ${kpi('fa-box','Jumlah Pesanan',orders.length,'+8.1%','up','#E1EAF9','#2C57A5')}
    ${kpi('fa-mug-hot','Jumlah Produk',products.length,'Stabil','up','#FCEFC7','#8A6D1F')}
    ${kpi('fa-users','Jumlah Pelanggan',customers.length,'+3','up','#F3E1F5','#7A3D82')}
  </div>
  <div class="kpi-grid">
    ${kpi('fa-graduation-cap','Jumlah Kursus',courses.length,'Stabil','up','#FBDEDA','#A5342A')}
    ${kpi('fa-user-graduate','Pelajar Berdaftar',registrations.length,'+5','up','#DBF0DF','#2C6B39')}
    ${kpi('fa-chalkboard-user','Instruktor Aktif',store.get('instructors',[]).length,'Stabil','up','#E1EAF9','#2C57A5')}
    ${kpi('fa-coins','Hasil Kursus',fmt(courseRevenue),'+9.7%','up','#FCEFC7','#8A6D1F')}
  </div>

  <div class="panel">
    <div class="panel-head"><h3>Trend Jualan (30 Hari)</h3></div>
    <div class="chart-wrap"><canvas id="salesChart"></canvas></div>
  </div>

  <div class="grid grid-2">
    <div class="panel">
      <div class="panel-head"><h3>Pesanan Terkini</h3><button class="btn btn-ghost btn-sm" onclick="navigateTo('admin-orders')">Lihat Semua</button></div>
      <table><thead><tr><th>ID</th><th>Pelanggan</th><th>Jumlah</th><th>Status</th></tr></thead><tbody>
      ${orders.slice(0,6).map(o=>`<tr><td>${o.id}</td><td>${o.customerName}</td><td>${fmt(o.total)}</td><td><span class="pill-status ${o.orderStatus==='pending_payment'?'pending':o.orderStatus}">${o.orderStatus.replace('_',' ')}</span></td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Amaran Stok Rendah</h3></div>
      ${lowStock.length? lowStock.slice(0,6).map(p=>`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);"><span style="font-size:13.5px;">${p.name}</span><span class="stock-tag low">${p.stock} unit</span></div>`).join('') : `<p style="font-size:13px;color:var(--muted)">Tiada amaran stok buat masa ini.</p>`}
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>Kursus Popular</h3></div>
    <table><thead><tr><th>Kursus</th><th>Tahap</th><th>Pendaftaran</th><th>Kadar Isi</th></tr></thead><tbody>
    ${[...courses].sort((a,b)=>b.seatsTaken-a.seatsTaken).slice(0,5).map(c=>`<tr><td>${c.title}</td><td>${c.level}</td><td>${c.seatsTaken}/${c.seatsTotal}</td><td>${Math.round(c.seatsTaken/c.seatsTotal*100)}%</td></tr>`).join('')}
    </tbody></table>
  </div>`;
  drawSalesChart();
}
function kpi(icon,label,val,trendTxt,trendDir,bg,fg){
  return `<div class="kpi-card"><div class="ic" style="background:${bg};color:${fg}"><i class="fa-solid ${icon}"></i></div><b>${val}</b><span>${label}</span><span class="trend ${trendDir}">${trendDir==='up'?'▲':'▼'} ${trendTxt}</span></div>`;
}
function drawSalesChart(){
  const canvas = document.getElementById('salesChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth;
  const h = canvas.height = 220;
  const data = Array.from({length:30},()=>800+Math.random()*2200);
  const max = Math.max(...data);
  ctx.clearRect(0,0,w,h);
  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue('--accent').trim() || '#E85D2C';
  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0, primary+'55'); grad.addColorStop(1, primary+'00');
  ctx.beginPath();
  data.forEach((v,i)=>{ const x=(i/(data.length-1))*w; const y=h-20-(v/max)*(h-40); i===0? ctx.moveTo(x,y): ctx.lineTo(x,y); });
  ctx.strokeStyle = primary; ctx.lineWidth=2.5; ctx.stroke();
  ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
}

/* ---- Admin: Homepage Posts (image + text CMS for home page) ---- */
function renderAdminPosts(){
  const posts = store.get('homePosts',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Post & Aktiviti'}])}
  <div class="panel-head"><h2>Post & Aktiviti (Laman Utama)</h2><button class="btn btn-primary" onclick="openPostForm()"><i class="fa-solid fa-plus"></i> Tambah Post</button></div>
  <p style="color:var(--ink-soft);font-size:13.5px;margin-bottom:20px;">Post di sini akan terus dipaparkan di seksyen "Info Terkini" pada laman utama (public).</p>
  <div class="grid grid-3" id="adminPostsGrid">
    ${posts.length? posts.map(p=>`
    <div class="post-card">
      <img src="${p.image}" alt="${p.title}">
      <div class="pbody">
        <span class="post-date">${p.date}</span>
        <h3 style="font-size:15px;">${p.title}</h3>
        <p style="font-size:13px;">${p.text.length>90? p.text.slice(0,90)+'…':p.text}</p>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-outline btn-sm btn-block" onclick="openPostForm('${p.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="mini-btn" onclick="deletePost('${p.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-newspaper"></i><p>Tiada post lagi.</p></div>`}
  </div>`;
}
let postFormImage = null; // holds base64 data URL of newly uploaded image (session-only until saved)
function openPostForm(id){
  const posts = store.get('homePosts',[]);
  const p = id? posts.find(x=>x.id===id) : {title:'', text:'', image:''};
  postFormImage = p.image || null;
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad">
    <h3 style="margin-bottom:16px;">${id?'Kemaskini':'Tambah'} Post Laman Utama</h3>

    <div class="field"><label>Gambar</label>
      <img id="postImgPreview" class="upload-preview" src="${p.image||''}" style="${p.image?'display:block;':''}">
      <label class="upload-box" for="postImgInput">
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <b style="font-size:13.5px;">Klik untuk muat naik gambar</b>
        <div class="mt-note">PNG/JPG, disyorkan nisbah 16:10</div>
      </label>
      <input type="file" id="postImgInput" accept="image/*" style="display:none;" onchange="handlePostImageUpload(event)">
      <div class="field-hint">Atau tampal URL gambar terus:</div>
      <input id="postImgUrl" placeholder="https://..." value="${(p.image&&p.image.startsWith('http'))?p.image:''}" oninput="postFormImage=this.value; document.getElementById('postImgPreview').src=this.value; document.getElementById('postImgPreview').style.display='block';">
    </div>

    <div class="field"><label>Tajuk Post</label><input id="postTitle" value="${p.title}" placeholder="cth: Kelas Barista Ogos Kini Dibuka"></div>
    <div class="field"><label>Ayat / Caption</label><textarea rows="4" id="postText" placeholder="Tulis update atau pengumuman di sini...">${p.text}</textarea></div>

    <button class="btn btn-primary btn-block" onclick="savePost('${id||''}')">${id?'Simpan Perubahan':'Terbitkan Post'}</button>
  </div>`;
  $('#genericModalBack').classList.add('show');
}
function handlePostImageUpload(e){
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 4*1024*1024){ toast('Saiz gambar terlalu besar (maks 4MB).','error'); return; }
  const reader = new FileReader();
  reader.onload = ev=>{
    postFormImage = ev.target.result; // base64 data URL — real upload, stored client-side
    const prev = $('#postImgPreview');
    prev.src = postFormImage; prev.style.display='block';
    $('#postImgUrl').value=''; // clear URL field since file takes priority
    toast('Gambar dimuat naik. Klik simpan untuk terbitkan.','info');
  };
  reader.readAsDataURL(file);
}
function savePost(id){
  const title = $('#postTitle').value.trim();
  const text = $('#postText').value.trim();
  const image = postFormImage || 'https://picsum.photos/seed/'+uid('post')+'/600/400';
  if(!title || !text){ toast('Sila lengkapkan tajuk dan ayat post.','error'); return; }
  const posts = store.get('homePosts',[]);
  if(id){
    const p = posts.find(x=>x.id===id);
    Object.assign(p, {title, text, image});
    toast('Post dikemaskini!');
  } else {
    posts.unshift({id:uid('post'), title, text, image, date:new Date().toISOString().slice(0,10)});
    toast('Post baharu diterbitkan ke laman utama!');
  }
  store.set('homePosts', posts);
  closeModal('genericModalBack');
  renderAdminPosts();
}
function deletePost(id){
  if(!confirm('Padam post ini dari laman utama?')) return;
  store.set('homePosts', store.get('homePosts',[]).filter(p=>p.id!==id));
  renderAdminPosts();
  toast('Post dipadam.','info');
}

/* ---- Admin: Products CRUD ---- */
function renderAdminProducts(){
  const products = store.get('products',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Produk'}])}
  <div class="panel-head"><h2>Pengurusan Produk</h2><button class="btn btn-primary" onclick="openProductForm()"><i class="fa-solid fa-plus"></i> Tambah Produk</button></div>
  <div class="panel">
    <table><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Rating</th><th>Tindakan</th></tr></thead><tbody id="prodTableBody">
    ${products.map(p=>`<tr>
      <td style="display:flex;align-items:center;gap:10px;"><img src="${p.image}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;">${p.name}</td>
      <td>${p.category}</td><td>${fmt(p.price)}</td>
      <td><span class="stock-tag ${p.stock===0?'out':p.stock<10?'low':'ok'}">${p.stock}</span></td>
      <td>${p.rating} ★</td>
      <td class="table-actions"><button class="mini-btn" onclick="openProductForm('${p.id}')"><i class="fa-solid fa-pen"></i></button><button class="mini-btn" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`).join('')}
    </tbody></table>
  </div>`;
}
function openProductForm(id){
  const products = store.get('products',[]);
  const p = id? products.find(x=>x.id===id) : {id:'', name:'',category:'arabica',price:0,stock:0,desc:'',roast:'Medium',roastLevel:3,origin:'',image:'https://picsum.photos/seed/newcoffee/500/380',weights:['250g','500g']};
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad">
    <h3 style="margin-bottom:16px;">${id?'Kemaskini':'Tambah'} Produk</h3>
    <div class="field"><label>Nama Produk</label><input id="pfName" value="${p.name}"></div>
    <div class="grid grid-2">
      <div class="field"><label>Kategori</label><select class="fsel" style="width:100%" id="pfCat">${CATEGORIES.map(c=>`<option value="${c.id}" ${p.category===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
      <div class="field"><label>Harga (RM)</label><input type="number" id="pfPrice" value="${p.price}"></div>
      <div class="field"><label>Stok</label><input type="number" id="pfStock" value="${p.stock}"></div>
      <div class="field"><label>Asal (Origin)</label><input id="pfOrigin" value="${p.origin}"></div>
    </div>
    <div class="field"><label>Deskripsi</label><textarea rows="3" id="pfDesc">${p.desc}</textarea></div>
    <button class="btn btn-primary btn-block" onclick="saveProduct('${id||''}')">${id?'Simpan Perubahan':'Tambah Produk'}</button>
  </div>`;
  $('#genericModalBack').classList.add('show');
}
function saveProduct(id){
  const products = store.get('products',[]);
  const data = {name:$('#pfName').value, category:$('#pfCat').value, price:+$('#pfPrice').value, stock:+$('#pfStock').value, origin:$('#pfOrigin').value, desc:$('#pfDesc').value};
  if(id){ Object.assign(products.find(x=>x.id===id), data); toast('Produk dikemaskini!'); }
  else{ products.push({id:'p'+uid(''), rating:4.5, reviewsCount:0, roast:'Medium', roastLevel:3, image:'https://picsum.photos/seed/'+uid('c')+'/500/380', weights:['250g','500g'], badge:'Baharu', ...data}); toast('Produk baharu ditambah!'); }
  store.set('products', products);
  closeModal('genericModalBack');
  renderAdminProducts();
}
function deleteProduct(id){
  if(!confirm('Padam produk ini?')) return;
  store.set('products', store.get('products',[]).filter(p=>p.id!==id));
  renderAdminProducts();
  toast('Produk dipadam.','info');
}

/* ---- Admin: Orders (full lifecycle: verify payment -> accept -> tracking -> shipped -> completed) ---- */
function renderAdminOrders(){
  const orders = store.get('orders',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Pesanan'}])}<h2 style="margin-bottom:20px;">Pengurusan Pesanan</h2>
  <div class="filter-bar">
    <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input placeholder="Cari No. Pesanan / pelanggan..." oninput="adminOrderFilter.q=this.value;renderAdminOrdersTable();"></div>
    <select class="fsel" onchange="adminOrderFilter.status=this.value;renderAdminOrdersTable();">
      <option value="all">Semua Status</option>
      ${ORDER_STEPS.map(s=>`<option value="${s.key}">${s.label}</option>`).join('')}
      <option value="cancelled">Dibatalkan</option>
    </select>
  </div>
  <div class="panel"><table><thead><tr><th>ID</th><th>Pelanggan</th><th>Jumlah</th><th>Bayaran</th><th>Status Pesanan</th><th>Tarikh</th><th>Tindakan</th></tr></thead><tbody id="adminOrdersTbody"></tbody></table></div>`;
  renderAdminOrdersTable();
}
let adminOrderFilter = {q:'', status:'all'};
function renderAdminOrdersTable(){
  let orders = store.get('orders',[]);
  orders = orders.filter(o=>{
    if(adminOrderFilter.status!=='all' && o.orderStatus!==adminOrderFilter.status) return false;
    if(adminOrderFilter.q && !(o.id.toLowerCase().includes(adminOrderFilter.q.toLowerCase()) || o.customerName.toLowerCase().includes(adminOrderFilter.q.toLowerCase()))) return false;
    return true;
  });
  $('#adminOrdersTbody').innerHTML = orders.map(o=>`<tr>
    <td>${o.id}</td><td>${o.customerName}</td><td>${fmt(o.total)}</td>
    <td><span class="pill-status ${o.paymentStatus==='verified'?'confirmed':o.paymentStatus==='failed'?'cancelled':'pending'}">${o.paymentStatus}</span></td>
    <td><span class="pill-status ${o.orderStatus==='pending_payment'?'pending':o.orderStatus}">${o.orderStatus.replace('_',' ')}</span></td>
    <td>${o.date}</td>
    <td class="table-actions"><button class="mini-btn" onclick="openOrderDetail('${o.id}')"><i class="fa-solid fa-eye"></i></button></td>
  </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px;">Tiada pesanan sepadan.</td></tr>`;
}
function openOrderDetail(id){
  const o = store.get('orders',[]).find(x=>x.id===id);
  const stepIdx = ORDER_STEPS.findIndex(s=>s.key===o.orderStatus);
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad">
    <div class="panel-head"><h3>Pesanan ${o.id}</h3><span class="pill-status ${o.orderStatus==='cancelled'?'cancelled':(o.orderStatus==='pending_payment'?'pending':o.orderStatus)}">${o.orderStatus.replace('_',' ')}</span></div>

    <div class="panel">
      <div class="sum-row"><span>Pelanggan</span><span>${o.customerName} (${o.customerEmail})</span></div>
      <div class="sum-row"><span>No. Resit</span><span>${o.receiptId}</span></div>
      <div class="sum-row"><span>Tarikh</span><span>${o.date}</span></div>
      <div class="sum-row"><span>Kaedah Bayaran</span><span>${o.paymentMethodName}</span></div>
      <hr style="border:none;border-top:1px dashed var(--line);margin:10px 0;">
      ${o.items.map(it=>`<div class="sum-row"><span>${it.name} ×${it.qty}</span><span>${fmt(it.price*it.qty)}</span></div>`).join('')}
      <div class="sum-row total"><span>Jumlah</span><span>${fmt(o.total)}</span></div>
    </div>

    ${o.paymentProof? `<div style="margin-bottom:16px;"><label style="font-size:13px;font-weight:700;">Bukti Pembayaran Pelanggan</label><img src="${o.paymentProof}" style="width:100%;border-radius:var(--radius-s);margin-top:8px;border:1px solid var(--line);max-height:260px;object-fit:contain;background:var(--surface-2);"></div>` : `<p class="mt-note" style="margin-bottom:16px;">Tiada bukti bayaran dimuat naik oleh pelanggan (FPX/kad automatik).</p>`}

    <h4 style="font-size:14px;margin-bottom:10px;">Sejarah Status</h4>
    <div style="margin-bottom:20px;">${o.history.map(h=>`<div style="font-size:12.5px;color:var(--ink-soft);padding:8px 0;border-bottom:1px solid var(--line);"><b style="color:var(--ink)">${h.date}</b> — ${h.label}</div>`).join('')}</div>

    ${o.orderStatus==='cancelled' ? `<div class="chip" style="background:#FBDEDA;color:#A5342A;">Pesanan ini telah dibatalkan.</div>` : `
    <div class="panel" style="background:var(--surface-2);">
      <h4 style="font-size:14px;margin-bottom:12px;">Tindakan Admin</h4>
      ${o.paymentStatus==='pending' ? `
        <p class="mt-note" style="margin-bottom:10px;">Sahkan pembayaran selepas semak bukti bayaran/rekod bank.</p>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-block" onclick="verifyOrderPayment('${o.id}')"><i class="fa-solid fa-check"></i> Sahkan Pembayaran</button>
          <button class="btn btn-outline btn-block" style="color:var(--bad);" onclick="cancelOrderAdmin('${o.id}')">Batalkan Pesanan</button>
        </div>` : ''}

      ${o.paymentStatus==='verified' && o.orderStatus==='pending_payment' ? `
        <p class="mt-note" style="margin-bottom:10px;">Pembayaran disahkan. Terima pesanan untuk mula diproses.</p>
        <button class="btn btn-primary btn-block" onclick="acceptOrderAdmin('${o.id}')"><i class="fa-solid fa-box-open"></i> Terima & Proses Pesanan</button>` : ''}

      ${o.orderStatus==='processing' ? `
        <div class="field"><label>Kurier</label><select class="fsel" style="width:100%;" id="courierSelect">
          <option>J&T Express</option><option>Pos Laju</option><option>City-Link</option><option>DHL eCommerce</option>
        </select></div>
        <div class="field"><label>No. Tracking</label><div style="display:flex;gap:8px;">
          <input id="trackingInput" placeholder="cth: JT600123456" style="flex:1;">
          <button class="btn btn-outline btn-sm" onclick="autoGenerateTracking()">Auto-Jana</button>
        </div></div>
        <button class="btn btn-primary btn-block" onclick="shipOrderAdmin('${o.id}')"><i class="fa-solid fa-truck-fast"></i> Hantar ke Kurier</button>` : ''}

      ${o.orderStatus==='shipped' ? `
        <div class="chip" style="margin-bottom:12px;"><i class="fa-solid fa-truck-fast"></i> ${o.courier} — ${o.trackingNumber}</div>
        <div style="display:flex;gap:8px;">
          ${o.courier==='J&T Express'? `<button class="btn btn-outline btn-block" onclick="syncCourierApi('${o.id}')"><i class="fa-solid fa-rotate"></i> Sync Status (J&T API)</button>`:''}
          <button class="btn btn-primary btn-block" onclick="completeOrderAdmin('${o.id}')"><i class="fa-solid fa-circle-check"></i> Tandakan Selesai</button>
        </div>` : ''}
    </div>`}
  </div>`;
  $('#genericModalBack').classList.add('show');
}
function pushOrderHistory(o, status, label){
  o.history.push({status, label, date:new Date().toISOString().slice(0,10)});
}
function verifyOrderPayment(id){
  const orders = store.get('orders',[]); const o = orders.find(x=>x.id===id);
  o.paymentStatus='verified'; pushOrderHistory(o,'payment_verified','Pembayaran disahkan oleh admin');
  store.set('orders', orders); toast('Pembayaran disahkan!'); openOrderDetail(id); renderAdminOrdersTable();
}
function cancelOrderAdmin(id){
  if(!confirm('Batalkan pesanan ini?')) return;
  const orders = store.get('orders',[]); const o = orders.find(x=>x.id===id);
  o.orderStatus='cancelled'; o.paymentStatus='failed'; pushOrderHistory(o,'cancelled','Pesanan dibatalkan oleh admin');
  store.set('orders', orders); toast('Pesanan dibatalkan.','info'); closeModal('genericModalBack'); renderAdminOrdersTable();
}
function acceptOrderAdmin(id){
  const orders = store.get('orders',[]); const o = orders.find(x=>x.id===id);
  o.orderStatus='processing'; pushOrderHistory(o,'processing','Pesanan diterima & sedang diproses');
  store.set('orders', orders); toast('Pesanan diterima untuk diproses!'); openOrderDetail(id); renderAdminOrdersTable();
}
function autoGenerateTracking(){
  const courier = $('#courierSelect').value;
  const code = courier==='J&T Express'? 'JT'+Math.floor(600000000+Math.random()*90000000) : 'TRK'+Math.floor(100000+Math.random()*900000);
  $('#trackingInput').value = code;
}
function shipOrderAdmin(id){
  const tracking = $('#trackingInput').value.trim();
  const courier = $('#courierSelect').value;
  if(!tracking){ toast('Sila isi/jana No. Tracking dahulu.','error'); return; }
  const orders = store.get('orders',[]); const o = orders.find(x=>x.id===id);
  o.orderStatus='shipped'; o.trackingNumber=tracking; o.courier=courier;
  pushOrderHistory(o,'shipped',`Dihantar via ${courier} — No. Tracking: ${tracking}`);
  store.set('orders', orders); toast('Pesanan dihantar ke kurier!'); openOrderDetail(id); renderAdminOrdersTable();
}
function syncCourierApi(id){
  toast('Menghubungi J&T Tracking API...','info');
  setTimeout(()=>{
    const orders = store.get('orders',[]); const o = orders.find(x=>x.id===id);
    const fakeStatuses = ['Dalam perjalanan ke hab seterusnya','Tiba di hab tempatan','Keluar untuk penghantaran'];
    pushOrderHistory(o,'shipped','[J&T API] '+fakeStatuses[Math.floor(Math.random()*fakeStatuses.length)]);
    store.set('orders', orders);
    toast('Status kurier disegerak!','success');
    openOrderDetail(id);
  }, 900);
}
function completeOrderAdmin(id){
  const orders = store.get('orders',[]); const o = orders.find(x=>x.id===id);
  o.orderStatus='completed'; pushOrderHistory(o,'completed','Pesanan selesai diterima pelanggan');
  store.set('orders', orders); toast('Pesanan ditandakan selesai!'); closeModal('genericModalBack'); renderAdminOrdersTable();
}

/* ---- Admin: Payments — full CRUD (FPX banks, QR upload, Card gateway, eWallet) ---- */
function renderAdminPayments(){
  const methods = store.get('paymentMethods',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Pembayaran'}])}
  <div class="panel-head"><h2>Pengurusan Kaedah Pembayaran</h2><button class="btn btn-primary" onclick="openPaymentMethodForm()"><i class="fa-solid fa-plus"></i> Tambah Kaedah</button></div>
  <p style="color:var(--ink-soft);font-size:13.5px;margin-bottom:20px;">Kaedah yang <b>aktif</b> sahaja akan dipaparkan kepada pelanggan semasa checkout.</p>
  <div class="grid grid-3" id="paymentMethodsGrid">
    ${methods.map(m=>`<div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:10px;"><div style="width:38px;height:38px;border-radius:10px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;color:var(--accent);"><i class="fa-solid ${m.icon}"></i></div><b>${m.name}</b></div>
        <label class="theme-switch" style="width:44px;height:24px;" title="Aktif/Tidak"><span class="knob" style="width:18px;height:18px;transform:${m.active?'translateX(20px)':'translateX(0)'};background:${m.active?'var(--good)':'var(--muted)'};"></span></label>
      </div>
      <span class="chip">${m.type.toUpperCase()}</span>
      ${m.type==='qr'?`<img src="${m.qrImage}" style="width:100%;margin-top:10px;border-radius:var(--radius-s);border:1px solid var(--line);">`:''}
      ${m.type==='fpx'?`<p class="mt-note">${m.banks.length} bank tersedia</p>`:''}
      ${m.type==='card'?`<p class="mt-note">${m.gateway} · ${m.acceptedCards.join(', ')}</p>`:''}
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="btn btn-outline btn-sm btn-block" onclick="openPaymentMethodForm('${m.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="mini-btn" onclick="togglePaymentMethod('${m.id}')" title="${m.active?'Nyahaktif':'Aktifkan'}"><i class="fa-solid ${m.active?'fa-toggle-on':'fa-toggle-off'}"></i></button>
        <button class="mini-btn" onclick="deletePaymentMethod('${m.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('')}
  </div>`;
}
let pmFormQrImage = null;
function openPaymentMethodForm(id){
  const methods = store.get('paymentMethods',[]);
  const m = id? methods.find(x=>x.id===id) : {type:'ewallet', name:'', icon:'fa-wallet', active:true, banks:[], gateway:'', merchantId:'', acceptedCards:[], qrImage:'', walletName:'NBCA Sdn Bhd'};
  pmFormQrImage = m.qrImage||null;
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad">
    <h3 style="margin-bottom:16px;">${id?'Kemaskini':'Tambah'} Kaedah Pembayaran</h3>
    <div class="field"><label>Jenis</label><select class="fsel" style="width:100%;" id="pmType" onchange="renderPmTypeFields(this.value)">
      <option value="fpx" ${m.type==='fpx'?'selected':''}>FPX Online Banking</option>
      <option value="card" ${m.type==='card'?'selected':''}>Kad Kredit/Debit</option>
      <option value="qr" ${m.type==='qr'?'selected':''}>QR Code (DuitNow/e-wallet)</option>
      <option value="ewallet" ${m.type==='ewallet'?'selected':''}>e-Wallet (TnG/GrabPay/dll)</option>
    </select></div>
    <div class="field"><label>Nama Paparan</label><input id="pmName" value="${m.name}" placeholder="cth: FPX Online Banking"></div>
    <div id="pmTypeFields"></div>
    <button class="btn btn-primary btn-block" style="margin-top:6px;" onclick="savePaymentMethod('${id||''}')">${id?'Simpan Perubahan':'Tambah Kaedah'}</button>
  </div>`;
  $('#genericModalBack').classList.add('show');
  renderPmTypeFields(m.type, m);
}
function renderPmTypeFields(type, m){
  m = m || {};
  const box = $('#pmTypeFields');
  if(type==='fpx'){
    box.innerHTML = `<div class="field"><label>Senarai Bank (asingkan dengan koma)</label><textarea rows="2" id="pmBanks">${(m.banks||['Maybank2u','CIMB Clicks','Public Bank']).join(', ')}</textarea></div>`;
  } else if(type==='card'){
    box.innerHTML = `<div class="grid grid-2">
      <div class="field"><label>Gateway</label><input id="pmGateway" value="${m.gateway||'Stripe'}"></div>
      <div class="field"><label>Merchant ID</label><input id="pmMerchant" value="${m.merchantId||''}"></div>
      <div class="field" style="grid-column:1/-1;"><label>Kad Diterima (koma)</label><input id="pmCards" value="${(m.acceptedCards||['Visa','Mastercard']).join(', ')}"></div>
    </div>`;
  } else if(type==='qr'){
    box.innerHTML = `<div class="field"><label>Gambar QR Code</label>
      <img id="pmQrPreview" class="upload-preview" src="${pmFormQrImage||''}" style="${pmFormQrImage?'display:block;':''}">
      <label class="upload-box" for="pmQrInput"><i class="fa-solid fa-cloud-arrow-up"></i><b style="font-size:13px;">Klik untuk muat naik kod QR</b></label>
      <input type="file" id="pmQrInput" accept="image/*" style="display:none;" onchange="handlePmQrUpload(event)">
    </div>
    <div class="field"><label>Nama Merchant (pada QR)</label><input id="pmWalletName" value="${m.walletName||'NBCA Sdn Bhd'}"></div>`;
  } else {
    box.innerHTML = `<div class="field"><label>Nama Merchant</label><input id="pmWalletName" value="${m.walletName||'NBCA Sdn Bhd'}"></div>
    <div class="mt-note">Pelanggan akan diarah ke app e-wallet berkaitan untuk pengesahan.</div>`;
  }
}
function handlePmQrUpload(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{ pmFormQrImage = ev.target.result; const pv=$('#pmQrPreview'); pv.src=pmFormQrImage; pv.style.display='block'; toast('QR dimuat naik.','info'); };
  reader.readAsDataURL(file);
}
function savePaymentMethod(id){
  const type = $('#pmType').value;
  const name = $('#pmName').value.trim();
  if(!name){ toast('Sila isi nama kaedah bayaran.','error'); return; }
  const iconMap = {fpx:'fa-building-columns', card:'fa-credit-card', qr:'fa-qrcode', ewallet:'fa-wallet'};
  const data = {type, name, icon:iconMap[type]};
  if(type==='fpx') data.banks = $('#pmBanks').value.split(',').map(s=>s.trim()).filter(Boolean);
  if(type==='card'){ data.gateway=$('#pmGateway').value; data.merchantId=$('#pmMerchant').value; data.acceptedCards=$('#pmCards').value.split(',').map(s=>s.trim()).filter(Boolean); }
  if(type==='qr'){ data.qrImage = pmFormQrImage || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=NBCA-QR'; data.walletName=$('#pmWalletName').value; }
  if(type==='ewallet') data.walletName=$('#pmWalletName').value;

  const methods = store.get('paymentMethods',[]);
  if(id){ Object.assign(methods.find(x=>x.id===id), data); toast('Kaedah pembayaran dikemaskini!'); }
  else{ methods.push({id:'pm_'+uid(''), active:true, ...data}); toast('Kaedah pembayaran baharu ditambah!'); }
  store.set('paymentMethods', methods);
  closeModal('genericModalBack');
  renderAdminPayments();
}
function togglePaymentMethod(id){
  const methods = store.get('paymentMethods',[]);
  const m = methods.find(x=>x.id===id); m.active = !m.active;
  store.set('paymentMethods', methods);
  renderAdminPayments();
  toast(m.active? 'Kaedah diaktifkan.' : 'Kaedah dinyahaktifkan.', 'info');
}
function deletePaymentMethod(id){
  if(!confirm('Padam kaedah pembayaran ini?')) return;
  store.set('paymentMethods', store.get('paymentMethods',[]).filter(m=>m.id!==id));
  renderAdminPayments();
  toast('Kaedah pembayaran dipadam.','info');
}

/* ---- Admin: Users (view + edit profile) ---- */
function renderAdminUsers(){
  const customers = store.get('customers',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Pengguna'}])}
  <div class="panel-head"><h2>Pengurusan Pengguna</h2></div>
  <div class="panel"><table><thead><tr><th>Nama</th><th>Emel</th><th>Telefon</th><th>Mata Kesetiaan</th><th>Tarikh Sertai</th><th>Tindakan</th></tr></thead><tbody>
  ${customers.map(c=>`<tr><td style="display:flex;align-items:center;gap:10px;"><span class="avatar">${c.avatarInitial}</span>${c.name}</td><td>${c.email}</td><td>${c.phone}</td><td>${c.loyaltyPoints.toLocaleString()}</td><td>${c.joined}</td>
  <td class="table-actions"><button class="mini-btn" onclick="openUserEditForm('${c.id}')"><i class="fa-solid fa-pen"></i></button><button class="mini-btn" onclick="toast('Pengguna disekat (simulasi)','info')"><i class="fa-solid fa-ban"></i></button></td></tr>`).join('')}
  </tbody></table></div>`;
}
function openUserEditForm(id){
  const customers = store.get('customers',[]);
  const c = customers.find(x=>x.id===id);
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad">
    <h3 style="margin-bottom:16px;">Edit Profil Pengguna</h3>
    <div class="field"><label>Nama</label><input id="ufName" value="${c.name}"></div>
    <div class="field"><label>Emel</label><input value="${c.email}" disabled></div>
    <div class="field"><label>Telefon</label><input id="ufPhone" value="${c.phone}"></div>
    <div class="field"><label>Alamat</label><textarea rows="2" id="ufAddr">${c.address}</textarea></div>
    <div class="field"><label>Mata Kesetiaan</label><input type="number" id="ufPoints" value="${c.loyaltyPoints}"></div>
    <button class="btn btn-primary btn-block" onclick="saveUserEdit('${id}')">Simpan Perubahan</button>
  </div>`;
  $('#genericModalBack').classList.add('show');
}
function saveUserEdit(id){
  const customers = store.get('customers',[]);
  const c = customers.find(x=>x.id===id);
  c.name = $('#ufName').value.trim(); c.phone = $('#ufPhone').value.trim(); c.address = $('#ufAddr').value.trim(); c.loyaltyPoints = +$('#ufPoints').value;
  store.set('customers', customers);
  closeModal('genericModalBack');
  renderAdminUsers();
  toast('Profil pengguna dikemaskini!');
}

/* ---- Admin: Courses CRUD ---- */
function renderAdminCourses(){
  const courses = store.get('courses',[]);
  const instructors = store.get('instructors',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Kursus'}])}
  <div class="panel-head"><h2>Pengurusan Kursus</h2><button class="btn btn-primary" onclick="openCourseForm()"><i class="fa-solid fa-plus"></i> Tambah Kursus</button></div>
  <div class="panel"><table><thead><tr><th>Kursus</th><th>Instruktor</th><th>Tahap</th><th>Jenis</th><th>Harga</th><th>Isi Tempat</th><th>Tindakan</th></tr></thead><tbody>
  ${courses.map(c=>{ const ins = instructors.find(i=>i.id===c.instructorId); return `<tr>
    <td>${c.title}</td><td>${ins.name}</td><td>${c.level}</td><td>${c.type}</td><td>${fmt(c.price)}</td>
    <td>${c.seatsTaken}/${c.seatsTotal}</td>
    <td class="table-actions"><button class="mini-btn" onclick="openCourseForm('${c.id}')"><i class="fa-solid fa-pen"></i></button><button class="mini-btn" onclick="deleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i></button></td>
  </tr>`; }).join('')}
  </tbody></table></div>`;
}
function openCourseForm(id){
  const courses = store.get('courses',[]);
  const instructors = store.get('instructors',[]);
  const c = id? courses.find(x=>x.id===id) : {title:'',level:'Beginner',type:'Online',duration:'1 Hari',price:0,instructorId:instructors[0].id,seatsTotal:15,seatsTaken:0};
  $('#genericModal').innerHTML = `<button class="modal-close" onclick="closeModal('genericModalBack')"><i class="fa-solid fa-xmark"></i></button>
  <div class="modal-pad">
    <h3 style="margin-bottom:16px;">${id?'Kemaskini':'Tambah'} Kursus</h3>
    <div class="field"><label>Tajuk Kursus</label><input id="cfTitle" value="${c.title}"></div>
    <div class="grid grid-2">
      <div class="field"><label>Instruktor</label><select class="fsel" style="width:100%" id="cfIns">${instructors.map(i=>`<option value="${i.id}" ${c.instructorId===i.id?'selected':''}>${i.name}</option>`).join('')}</select></div>
      <div class="field"><label>Tahap</label><select class="fsel" style="width:100%" id="cfLevel">${['Beginner','Intermediate','Advanced','Professional'].map(l=>`<option ${c.level===l?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Jenis</label><select class="fsel" style="width:100%" id="cfType">${['Online','In-Person','Hybrid'].map(t=>`<option ${c.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Tempoh</label><input id="cfDur" value="${c.duration}"></div>
      <div class="field"><label>Harga (RM)</label><input type="number" id="cfPrice" value="${c.price}"></div>
      <div class="field"><label>Kapasiti Maksimum</label><input type="number" id="cfSeats" value="${c.seatsTotal}"></div>
    </div>
    <button class="btn btn-primary btn-block" onclick="saveCourse('${id||''}')">${id?'Simpan Perubahan':'Tambah Kursus'}</button>
  </div>`;
  $('#genericModalBack').classList.add('show');
}
function saveCourse(id){
  const courses = store.get('courses',[]);
  const data = {title:$('#cfTitle').value, instructorId:$('#cfIns').value, level:$('#cfLevel').value, type:$('#cfType').value, duration:$('#cfDur').value, price:+$('#cfPrice').value, seatsTotal:+$('#cfSeats').value};
  if(id){ Object.assign(courses.find(x=>x.id===id), data); toast('Kursus dikemaskini!'); }
  else{
    courses.push({id:'c'+uid(''), seatsTaken:0, rating:4.5, reviewsCount:0, lang:'Bahasa Melayu', image:'https://picsum.photos/seed/'+uid('crs')+'/600/400', intensity:2, outcomes:['Kemahiran asas kursus ini'], curriculum:[{id:uid('cur'),title:'Sesi 1: Pengenalan',desc:'Sesi pengenalan kepada topik kursus.'}], materials:['Nota kursus'], prerequisites:'Tiada', schedules:[{id:uid('sch'),date:new Date().toISOString().slice(0,10),time:'10:00 AM - 6:00 PM',venue:'DC Studio'}], reviews:[], badge:'Baharu', ...data});
    toast('Kursus baharu ditambah!');
  }
  store.set('courses', courses);
  closeModal('genericModalBack');
  renderAdminCourses();
}
function deleteCourse(id){
  if(!confirm('Padam kursus ini?')) return;
  store.set('courses', store.get('courses',[]).filter(c=>c.id!==id));
  renderAdminCourses();
  toast('Kursus dipadam.','info');
}

/* ---- Admin: Students ---- */
function renderAdminStudents(){
  const registrations = store.get('registrations',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Pelajar'}])}
  <div class="panel-head"><h2>Pengurusan Pelajar</h2>
    <select class="fsel" onchange="filterStudents(this.value)"><option value="all">Semua Kursus</option>${[...new Set(registrations.map(r=>r.courseName))].map(c=>`<option>${c}</option>`).join('')}</select>
  </div>
  <div class="panel"><table><thead><tr><th>Pelajar</th><th>Kursus</th><th>Status</th><th>Kemajuan</th><th>Tindakan</th></tr></thead><tbody id="studentsTbody">
  ${registrations.map(r=>studentRow(r)).join('')}
  </tbody></table></div>`;
}
function studentRow(r){
  return `<tr data-course="${r.courseName}"><td>${r.customer}</td><td>${r.courseName}</td>
  <td><span class="pill-status ${r.status}">${r.status}</span></td>
  <td style="width:140px;"><div class="progress-bar"><i style="width:${r.progress}%"></i></div></td>
  <td class="table-actions"><button class="mini-btn" onclick="toast('Sijil dikeluarkan untuk ${r.customer}','success')"><i class="fa-solid fa-certificate"></i></button><button class="mini-btn" onclick="toast('Notifikasi dihantar kepada ${r.customer}','info')"><i class="fa-solid fa-bell"></i></button><button class="mini-btn" onclick="toast('Senarai pelajar dieksport (CSV simulasi)','info')"><i class="fa-solid fa-download"></i></button></td></tr>`;
}
function filterStudents(course){
  $$('#studentsTbody tr').forEach(tr=>{ tr.style.display = (course==='all'||tr.dataset.course===course)?'':'none'; });
}

/* ---- Admin: Instructors ---- */
function renderAdminInstructors(){
  const instructors = store.get('instructors',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Instruktor'}])}
  <div class="panel-head"><h2>Pengurusan Instruktor</h2><button class="btn btn-primary" onclick="toast('Borang tambah instruktor disimulasikan.','info')"><i class="fa-solid fa-plus"></i> Tambah Instruktor</button></div>
  <div class="grid grid-3">
  ${instructors.map(i=>`<div class="panel"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span class="avatar" style="width:44px;height:44px;font-size:17px;">${i.name[0]}</span><div><b style="display:block;">${i.name}</b><span style="font-size:12px;color:var(--muted)">${i.exp} pengalaman</span></div></div>
  <p style="font-size:13px;color:var(--ink-soft);margin-bottom:10px;">${i.bio}</p>
  <div style="display:flex;justify-content:space-between;font-size:13px;"><span>${stars(i.rating)} ${i.rating}</span><span>${i.coursesCount} kursus</span></div>
  <div style="display:flex;gap:8px;margin-top:14px;"><button class="btn btn-outline btn-sm btn-block" onclick="toast('Edit profil disimulasikan','info')">Edit</button><button class="btn btn-ghost btn-sm" onclick="toast('Prestasi: 94% kepuasan pelajar','info')"><i class="fa-solid fa-chart-simple"></i></button></div>
  </div>`).join('')}
  </div>`;
}

/* ---- Admin: Schedule ---- */
function renderAdminSchedule(){
  const courses = store.get('courses',[]);
  const allSchedules = courses.flatMap(c=>c.schedules.map(s=>({...s, courseTitle:c.title, courseId:c.id})));
  allSchedules.sort((a,b)=>a.date.localeCompare(b.date));
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Jadual'}])}
  <div class="panel-head"><h2>Pengurusan Jadual</h2><button class="btn btn-primary" onclick="toast('Borang tambah sesi disimulasikan.','info')"><i class="fa-solid fa-plus"></i> Tambah Sesi</button></div>
  <div class="panel"><table><thead><tr><th>Kursus</th><th>Tarikh</th><th>Masa</th><th>Tempat/Zoom</th><th>Tindakan</th></tr></thead><tbody>
  ${allSchedules.map(s=>`<tr><td>${s.courseTitle}</td><td>${s.date}</td><td>${s.time}</td><td>${s.venue}</td>
  <td class="table-actions"><button class="mini-btn" onclick="toast('Peringatan dihantar kepada semua pelajar sesi ini.','info')"><i class="fa-solid fa-bell"></i></button><button class="mini-btn" onclick="toast('Senarai tunggu diurus (simulasi)','info')"><i class="fa-solid fa-list-ol"></i></button></td></tr>`).join('')}
  </tbody></table></div>`;
}

/* ---- Admin: Certificates ---- */
function renderAdminCertificates(){
  const registrations = store.get('registrations',[]).filter(r=>r.status==='completed');
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Sijil'}])}<h2 style="margin-bottom:20px;">Pengurusan Sijil</h2>
  <div class="panel">
    <div class="panel-head"><h3>Templat Sijil</h3><button class="btn btn-outline btn-sm" onclick="toast('Templat disimpan.','success')"><i class="fa-solid fa-palette"></i> Sesuaikan Templat</button></div>
    <div class="cert-preview" style="max-width:480px;">
      <span style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Pratonton Templat</span>
      <h2>NBCA Academy</h2>
      <div class="name">[Nama Pelajar]</div>
      <p style="font-size:13px;">telah berjaya menamatkan kursus<br><b>[Nama Kursus]</b></p>
    </div>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Pelajar Layak Sijil</h3></div>
    ${registrations.length? `<table><thead><tr><th>Pelajar</th><th>Kursus</th><th>Status Sijil</th><th>Tindakan</th></tr></thead><tbody>
    ${registrations.map(r=>`<tr><td>${r.customer}</td><td>${r.courseName}</td><td><span class="pill-status completed">Sedia Dikeluarkan</span></td>
    <td class="table-actions"><button class="mini-btn" onclick="toast('Sijil dihantar ke emel ${r.customer} dengan QR pengesahan.','success')"><i class="fa-solid fa-paper-plane"></i></button></td></tr>`).join('')}
    </tbody></table>` : `<p style="font-size:13px;color:var(--muted)">Tiada pelajar yang layak buat masa ini.</p>`}
  </div>`;
}

/* ---- Admin: Reports ---- */
function renderAdminReports(){
  const courses = store.get('courses',[]);
  const registrations = store.get('registrations',[]);
  $('#appMain').innerHTML = `${crumb([{label:'Admin'},{label:'Laporan'}])}
  <div class="panel-head"><h2>Laporan</h2></div>
  <div class="tabbar" id="reportTabs">
    <button class="active" onclick="switchReportTab('enroll',this)">Pendaftaran</button>
    <button onclick="switchReportTab('revenue',this)">Hasil per Kursus</button>
    <button onclick="switchReportTab('instructor',this)">Prestasi Instruktor</button>
    <button onclick="switchReportTab('completion',this)">Kadar Penyempurnaan</button>
  </div>
  <div id="reportBody"></div>`;
  switchReportTab('enroll');
}
function switchReportTab(tab, btn){
  if(btn) $$('#reportTabs button').forEach(b=>b.classList.remove('active')), btn.classList.add('active');
  const courses = store.get('courses',[]);
  const registrations = store.get('registrations',[]);
  const instructors = store.get('instructors',[]);
  let html = '';
  if(tab==='enroll'){
    html = `<div class="panel"><div class="panel-head"><h3>Laporan Pendaftaran</h3><button class="btn btn-outline btn-sm" onclick="toast('Dieksport ke CSV (simulasi)','info')"><i class="fa-solid fa-file-csv"></i> Eksport CSV</button></div>
    <table><thead><tr><th>Kursus</th><th>Jumlah Pendaftaran</th><th>Disahkan</th><th>Selesai</th><th>Dibatalkan</th></tr></thead><tbody>
    ${courses.map(c=>{ const rs = registrations.filter(r=>r.courseId===c.id); return `<tr><td>${c.title}</td><td>${rs.length}</td><td>${rs.filter(r=>r.status==='confirmed').length}</td><td>${rs.filter(r=>r.status==='completed').length}</td><td>${rs.filter(r=>r.status==='cancelled').length}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  } else if(tab==='revenue'){
    html = `<div class="panel"><div class="panel-head"><h3>Hasil per Kursus</h3><button class="btn btn-outline btn-sm" onclick="toast('Dieksport ke PDF (simulasi)','info')"><i class="fa-solid fa-file-pdf"></i> Eksport PDF</button></div>
    <table><thead><tr><th>Kursus</th><th>Harga</th><th>Pendaftaran Aktif</th><th>Anggaran Hasil</th></tr></thead><tbody>
    ${courses.map(c=>{ const rs = registrations.filter(r=>r.courseId===c.id && r.status!=='cancelled'); return `<tr><td>${c.title}</td><td>${fmt(c.price)}</td><td>${rs.length}</td><td>${fmt(c.price*rs.length)}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  } else if(tab==='instructor'){
    html = `<div class="panel"><div class="panel-head"><h3>Prestasi Instruktor</h3></div>
    <table><thead><tr><th>Instruktor</th><th>Kursus Dikendali</th><th>Rating</th><th>Jumlah Pelajar</th></tr></thead><tbody>
    ${instructors.map(i=>{ const myC = courses.filter(c=>c.instructorId===i.id); const students = myC.reduce((s,c)=>s+c.seatsTaken,0); return `<tr><td>${i.name}</td><td>${myC.length}</td><td>${i.rating} ★</td><td>${students}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  } else {
    html = `<div class="panel"><div class="panel-head"><h3>Kadar Penyempurnaan</h3></div>
    <table><thead><tr><th>Kursus</th><th>Jumlah Pelajar</th><th>Selesai</th><th>Kadar</th></tr></thead><tbody>
    ${courses.map(c=>{ const rs = registrations.filter(r=>r.courseId===c.id); const comp = rs.filter(r=>r.status==='completed').length; const rate = rs.length? Math.round(comp/rs.length*100):0; return `<tr><td>${c.title}</td><td>${rs.length}</td><td>${comp}</td><td>${rate}%</td></tr>`; }).join('')}
    </tbody></table></div>`;
  }
  $('#reportBody').innerHTML = html;
}

/* =================== INIT: restore session on load =================== */
(function restoreSession(){
  const s = store.get('session');
  if(s){
    document.getElementById('landingView').style.display='none';
    document.getElementById('appShell').classList.add('show');
    buildSidebar(s.role);
    navigateTo(s.role==='admin'?'admin-dashboard':'home-app');
  }
})();
updateBadges();

/* Close modals on escape / overlay click */
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeModal('loginModalBack'); closeModal('genericModalBack'); closeCart(); } });
$('#genericModalBack').addEventListener('click', e=>{ if(e.target.id==='genericModalBack') closeModal('genericModalBack'); });
$('#loginModalBack').addEventListener('click', e=>{ if(e.target.id==='loginModalBack') closeModal('loginModalBack'); });