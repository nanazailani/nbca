/* Nb.CA Academy — shared member portal shell.
 * Injects the sidebar, mobile drawer, topbar, bottom nav, basket/checkout drawer and toast into every member page.
 * Page markup needs: <body data-page="dashboard" data-title="..." data-sub="...">, #m-sidebar, #m-overlay, #m-topbar, #m-bottomnav.
 * Session = localStorage.rp_logged_user, account record = rp_user (see auth.html). */
(function () {
    const SAMPLE_POINTS = 350;          // placeholder until points are stored per member
    const SAMPLE_TIER = 'Gold';

    const NAV = [
        { group: 'Member', items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-house', href: 'dashboard.html' },
            { id: 'classes', label: 'My Classes', icon: 'fa-graduation-cap', href: 'classes.html', badge: 'classes' },
            { id: 'orders', label: 'My Orders', icon: 'fa-box-open', href: 'orders.html' },
            { id: 'membership', label: 'Membership', icon: 'fa-crown', href: 'membership.html', pill: SAMPLE_POINTS + ' pts' },
            { id: 'profile', label: 'My Profile', icon: 'fa-user', href: 'profile.html' }
        ]},
        { group: 'Discover', items: [
            { id: 'fixed', label: 'Fixed Classes', icon: 'fa-calendar-days', href: 'book-class.html' },
            { id: 'workshops', label: 'Workshops', icon: 'fa-chalkboard-user', href: 'workshops.html' },
            { id: 'beans', label: 'Coffee Beans', icon: 'fa-mug-hot', href: 'shop.html?tab=beans' },
            { id: 'merch', label: 'Merchandise', icon: 'fa-shirt', href: 'shop.html?tab=merch' }
        ]}
    ];

    const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function user() {
        try { return JSON.parse(localStorage.getItem('rp_logged_user') || 'null'); } catch (e) { return null; }
    }

    // Guard: members only. (Also done inline in <head> to avoid a flash of content.)
    if (!user()) {
        window.location.replace('auth.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html'));
        return;
    }

    function registrations() {
        const email = ((user() || {}).email || '').toLowerCase();
        let all = [];
        try { all = JSON.parse(localStorage.getItem('rp_fixed_class_students') || '[]'); } catch (e) {}
        return all.filter(r => (r.email || '').toLowerCase() === email);
    }

    function initials(name) {
        return (name || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    }

    const page = document.body.dataset.page || '';
    const u = user();

    function navItem(it) {
        const active = it.id === page;
        let extra = '';
        if (it.badge === 'classes') {
            const n = registrations().filter(r => r.classStatus === 'Reschedule').length;
            if (n) extra = '<span class="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">' + n + '</span>';
        }
        if (it.pill) extra = '<span class="ml-auto whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full ' + (active ? 'bg-white text-amberGold' : 'bg-amberGold/10 text-amberGold') + '">' + it.pill + '</span>';
        return '<a href="' + it.href + '" class="group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ' +
            (active ? 'bg-amberGold text-white shadow-md shadow-blue-600/25' : 'text-roast-700 hover:bg-roast-100 hover:text-roast-950') + '">' +
            '<span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ' + (active ? 'bg-white/20' : 'bg-roast-100 group-hover:bg-white text-amberGold') + '"><i class="fa-solid ' + it.icon + '"></i></span>' +
            '<span>' + it.label + '</span>' + extra +
            '</a>';
    }

    function buildSidebar() {
        const el = document.getElementById('m-sidebar');
        if (!el) return;
        el.className = 'fixed inset-y-0 left-0 w-72 z-40 bg-white border-r border-roast-200 flex flex-col -translate-x-full lg:translate-x-0 transition-transform duration-300';
        el.innerHTML =
            '<div class="h-20 px-5 flex items-center justify-between border-b border-roast-100 shrink-0">' +
                '<a href="dashboard.html" class="flex items-center gap-3">' +
                    '<img src="images/logo.png" alt="Nb.CA Academy" class="w-11 h-11 object-contain">' +
                    '<div class="leading-tight"><span class="block font-serif text-base font-extrabold tracking-wider text-roast-950 uppercase">Nb.CA Academy</span>' +
                    '<span class="block text-[10px] tracking-widest text-amberGold uppercase font-bold">Member Portal</span></div>' +
                '</a>' +
                '<button onclick="MemberShell.closeMenu()" class="lg:hidden w-9 h-9 rounded-full hover:bg-roast-100 text-roast-600" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<nav class="flex-1 overflow-y-auto px-4 py-5 space-y-6" aria-label="Member navigation">' +
                NAV.map(g => '<div class="space-y-1"><p class="px-3.5 mb-2 text-[10px] font-extrabold tracking-[0.18em] uppercase text-roast-400">' + g.group + '</p>' + g.items.map(navItem).join('') + '</div>').join('') +
                '<a href="book-class.html" class="block rounded-2xl p-4 bg-gradient-to-br from-roast-950 to-royalBlue text-white shadow-lg relative overflow-hidden">' +
                    '<i class="fa-solid fa-mug-hot absolute -right-3 -bottom-3 text-6xl text-white/10"></i>' +
                    '<span class="text-[10px] font-bold uppercase tracking-widest text-blue-200">Now open</span>' +
                    '<p class="font-serif text-base font-bold mt-1 leading-snug">Reserve your seat in the daily class</p>' +
                    '<span class="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold bg-white text-amberGold px-3 py-1.5 rounded-full">Book now <i class="fa-solid fa-arrow-right text-[9px]"></i></span>' +
                '</a>' +
            '</nav>' +
            '<div class="p-4 border-t border-roast-100 space-y-2 shrink-0">' +
                '<button onclick="openProfileModal()" class="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-roast-100 transition-all text-left">' +
                    '<span class="w-10 h-10 rounded-full bg-amberGold text-white font-bold text-sm flex items-center justify-center shrink-0">' + esc(initials(u.name)) + '</span>' +
                    '<span class="min-w-0 flex-1"><strong class="block text-[13px] text-roast-950 truncate">' + esc(u.name || 'Member') + '</strong><span class="block text-[11px] text-roast-500 truncate">' + esc(u.email || '') + '</span></span>' +
                    '<i class="fa-solid fa-gear text-roast-400 text-xs"></i>' +
                '</button>' +
                '<div class="flex gap-2">' +
                    '<button onclick="logoutUser()" class="flex-1 py-2 rounded-xl text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all"><i class="fa-solid fa-right-from-bracket mr-1"></i> Logout</button>' +
                '</div>' +
            '</div>';
    }

    function buildTopbar() {
        const el = document.getElementById('m-topbar');
        if (!el) return;
        el.className = 'sticky top-0 z-30 h-16 lg:h-20 bg-roast-50/85 backdrop-blur-md border-b border-roast-200 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3';
        el.innerHTML =
            '<div class="flex items-center gap-3 min-w-0">' +
                '<button onclick="MemberShell.openMenu()" class="lg:hidden w-10 h-10 rounded-xl bg-white border border-roast-200 text-roast-800 flex items-center justify-center shadow-sm" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>' +
                '<div class="min-w-0"><h1 class="font-serif text-lg lg:text-2xl font-extrabold text-roast-950 truncate">' + esc(document.body.dataset.title || '') + '</h1>' +
                '<p class="hidden sm:block text-[11px] text-roast-500 truncate">' + esc(document.body.dataset.sub || '') + '</p></div>' +
            '</div>' +
            '<div class="flex items-center gap-2 sm:gap-3 shrink-0">' +
                '<a href="membership.html" class="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-roast-200 text-xs font-bold text-roast-800 hover:border-amberGold transition-all"><i class="fa-solid fa-coins text-amberGold"></i> ' + SAMPLE_POINTS + ' pts</a>' +
                '<a href="book-class.html" class="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amberGold hover:bg-royalBlue text-white text-xs font-bold shadow-md transition-all"><i class="fa-solid fa-user-pen text-[11px]"></i> <span class="hidden xs:inline sm:inline">Book a Class</span></a>' +
                '<button onclick="openCart()" class="relative w-10 h-10 rounded-full bg-white border border-roast-200 text-roast-800 hover:border-amberGold flex items-center justify-center" aria-label="Cart"><i class="fa-solid fa-bag-shopping text-sm"></i><span id="cart-badge" class="hidden absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amberGold text-white text-[10px] font-bold items-center justify-center">0</span></button>' +
                '<button onclick="openProfileModal()" class="w-10 h-10 rounded-full bg-amberGold text-white font-bold text-xs flex items-center justify-center shadow-md" aria-label="Profile">' + esc(initials(u.name)) + '</button>' +
            '</div>';
    }

    function buildBottomNav() {
        const el = document.getElementById('m-bottomnav');
        if (!el) return;
        el.className = 'lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-roast-200 flex items-stretch justify-around shadow-[0_-8px_24px_rgba(15,23,42,0.08)]';
        el.style.paddingBottom = 'env(safe-area-inset-bottom)';
        const tabs = [
            ['dashboard', 'Home', 'fa-house', 'dashboard.html'],
            ['classes', 'Classes', 'fa-graduation-cap', 'classes.html'],
            ['orders', 'Orders', 'fa-box-open', 'orders.html'],
            ['membership', 'Rewards', 'fa-crown', 'membership.html']
        ];
        el.innerHTML = tabs.map(t => {
            const on = t[0] === page;
            return '<a href="' + t[3] + '" class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 ' + (on ? 'text-amberGold' : 'text-roast-500') + '">' +
                '<i class="fa-solid ' + t[2] + ' text-base"></i><span class="text-[10px] font-bold">' + t[1] + '</span>' +
                (on ? '<span class="absolute top-0 w-8 h-0.5 rounded-full bg-amberGold"></span>' : '') + '</a>';
        }).join('') +
        '<a href="profile.html" class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 ' + (page === 'profile' ? 'text-amberGold' : 'text-roast-500') + '"><i class="fa-solid fa-user text-base"></i><span class="text-[10px] font-bold">Profile</span></a>';
    }

    function injectOverlays() {
        const wrap = document.createElement('div');
        wrap.innerHTML =
            '<div id="cart-drawer" class="fixed inset-0 z-50 hidden">' +
                '<div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeCart()"></div>' +
                '<div class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col">' +
                    '<div class="h-16 px-5 flex items-center justify-between border-b border-roast-100 shrink-0"><h3 class="font-serif text-lg font-bold text-roast-950"><i class="fa-solid fa-bag-shopping text-amberGold mr-2"></i>Your Basket</h3><button onclick="closeCart()" class="w-9 h-9 rounded-full hover:bg-roast-100 text-roast-600" aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>' +
                    '<div id="cart-body" class="flex-1 overflow-y-auto p-5 space-y-3"></div>' +
                    '<div id="cart-foot" class="border-t border-roast-100 p-5 space-y-3 shrink-0"></div>' +
                '</div>' +
            '</div>' +
            '<div id="app-toast" class="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[60] transform translate-y-24 opacity-0 transition-all duration-300 pointer-events-none">' +
                '<div class="bg-white border border-amberGold/40 text-roast-950 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">' +
                    '<div class="w-8 h-8 rounded-full bg-amberGold text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-check text-xs"></i></div>' +
                    '<p id="toast-msg" class="text-xs font-semibold"></p>' +
                '</div>' +
            '</div>';
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    }

    // ---- public helpers (used by inline handlers + page scripts) ----
    window.MemberShell = {
        user, registrations, esc, initials,
        openMenu() {
            document.getElementById('m-sidebar').classList.remove('-translate-x-full');
            const o = document.getElementById('m-overlay');
            o.classList.remove('hidden');
        },
        closeMenu() {
            document.getElementById('m-sidebar').classList.add('-translate-x-full');
            document.getElementById('m-overlay').classList.add('hidden');
        }
    };

    window.logoutUser = function () {
        localStorage.removeItem('rp_logged_user');   // keep rp_user: that's the account itself
        window.location.href = 'index.html';
    };

    // profile lives on its own page now
    window.openProfileModal = function () { window.location.href = 'profile.html'; };
    window.closeProfileModal = function () {};

    window.showToast = function (message) {
        const toast = document.getElementById('app-toast');
        document.getElementById('toast-msg').innerText = message;
        toast.classList.remove('translate-y-24', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-24', 'opacity-0');
        }, 2500);
    };

    // ---- shopping basket (stored per browser; checkout creates a member order) ----
    const SHIPPING = (window.NBCA_CFG || {}).SHIPPING || 8;
    const money = n => 'RM ' + Number(n).toFixed(2);
    function getCart() { try { return JSON.parse(localStorage.getItem('rp_portal_cart') || '[]'); } catch (e) { return []; } }
    function setCart(c) { localStorage.setItem('rp_portal_cart', JSON.stringify(c)); refreshCartBadge(); }
    function refreshCartBadge() {
        const b = document.getElementById('cart-badge');
        if (!b) return;
        const n = getCart().reduce((a, i) => a + i.qty, 0);
        b.innerText = n;
        b.classList.toggle('hidden', !n);
        b.classList.toggle('flex', !!n);
    }
    function myOrders() {
        const email = ((user() || {}).email || '').toLowerCase();
        let all = [];
        try { all = JSON.parse(localStorage.getItem('rp_member_orders') || '[]'); } catch (e) {}
        return all.filter(o => (o.email || '').toLowerCase() === email);
    }
    function myWorkshops() {
        const email = ((user() || {}).email || '').toLowerCase();
        let all = [];
        try { all = JSON.parse(localStorage.getItem('rp_workshop_enrollments') || '[]'); } catch (e) {}
        return all.filter(w => (w.email || '').toLowerCase() === email);
    }
    Object.assign(MemberShell, { getCart, myOrders, myWorkshops, money });

    window.addToCart = function (item) {
        const cart = getCart();
        const hit = cart.find(i => i.id === item.id);
        if (hit) hit.qty += 1; else cart.push({ id: item.id, name: item.name, price: item.price, image: item.image, qty: 1 });
        setCart(cart);
        showToast('Added "' + item.name + '" to your basket.');
    };
    window.changeQty = function (id, d) {
        let cart = getCart().map(i => i.id === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0);
        setCart(cart); renderCart();
    };
    window.openCart = function () { renderCart(); document.getElementById('cart-drawer').classList.remove('hidden'); };
    window.closeCart = function () { document.getElementById('cart-drawer').classList.add('hidden'); };

    // ---- profile + address book (stored per member email, Shopee-style default address) ----
    const STATES = ['Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya'];
    function allProfiles() { try { return JSON.parse(localStorage.getItem('rp_member_profiles') || '{}'); } catch (e) { return {}; } }
    function profileKey() { return ((user() || {}).email || '').toLowerCase(); }
    function getProfile() {
        const p = allProfiles()[profileKey()] || {};
        return { phone: p.phone || '', addresses: Array.isArray(p.addresses) ? p.addresses : [] };
    }
    function saveProfile(p) {
        const all = allProfiles();
        all[profileKey()] = p;
        localStorage.setItem('rp_member_profiles', JSON.stringify(all));
    }
    function fmtAddress(a) {
        return [a.line1, a.line2, (a.postcode + ' ' + a.city).trim(), a.state].filter(Boolean).join(', ');
    }

    // shared address form (used in the profile page and in checkout); p = id prefix
    function addressFormHtml(p, a) {
        a = a || {};
        const inp = (id, label, val, extra) => '<div><label class="block font-semibold text-roast-600 uppercase mb-1">' + label + '</label><input id="' + p + '-' + id + '" value="' + esc(val || '') + '" ' + (extra || '') + ' class="w-full bg-roast-50 border border-roast-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amberGold"></div>';
        return '<div class="space-y-3 text-xs">' +
            '<div class="grid sm:grid-cols-2 gap-3">' + inp('name', 'Full name *', a.name || (user() || {}).name) + inp('phone', 'Phone *', a.phone || getProfile().phone, 'type="tel"') + '</div>' +
            inp('line1', 'Address line 1 *', a.line1, 'placeholder="Unit / house no., street"') +
            inp('line2', 'Address line 2 <span class="normal-case font-normal text-roast-400">(optional)</span>', a.line2, 'placeholder="Taman, building"') +
            '<div class="grid grid-cols-3 gap-3">' + inp('postcode', 'Postcode *', a.postcode, 'inputmode="numeric" maxlength="5"') + '<div class="col-span-2">' + inp('city', 'City *', a.city) + '</div></div>' +
            '<div class="grid sm:grid-cols-2 gap-3"><div><label class="block font-semibold text-roast-600 uppercase mb-1">State *</label><select id="' + p + '-state" class="w-full bg-roast-50 border border-roast-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amberGold"><option value="">Select state</option>' +
            STATES.map(s => '<option ' + (a.state === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></div>' +
            '<div><label class="block font-semibold text-roast-600 uppercase mb-1">Label</label><select id="' + p + '-label" class="w-full bg-roast-50 border border-roast-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amberGold">' +
            ['Home', 'Work', 'Other'].map(s => '<option ' + (a.label === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></div></div>' +
            '</div>';
    }
    function readAddressForm(p) {
        const v = id => (document.getElementById(p + '-' + id).value || '').trim();
        const d = { name: v('name'), phone: v('phone'), line1: v('line1'), line2: v('line2'), postcode: v('postcode'), city: v('city'), state: v('state'), label: v('label') || 'Home' };
        if (!d.name || !d.phone || !d.line1 || !d.city || !d.state) return { ok: false, error: 'Please complete all required address fields.' };
        if (!/^\d{5}$/.test(d.postcode)) return { ok: false, error: 'Postcode must be 5 digits.' };
        if (!/^[+\d][\d\s-]{7,}$/.test(d.phone)) return { ok: false, error: 'Please enter a valid phone number.' };
        return { ok: true, data: d };
    }
    Object.assign(MemberShell, { getProfile, saveProfile, fmtAddress, addressFormHtml, readAddressForm, STATES });

    // ---- basket + checkout ----
    let coAddrId = null, coNew = false;
    window.coPick = function (id) { coAddrId = id; coNew = false; renderCart('checkout'); };
    window.coToggleNew = function (on) { coNew = on; renderCart('checkout'); };

    function renderCart(step) {
        const cart = getCart();
        const body = document.getElementById('cart-body'), foot = document.getElementById('cart-foot');
        if (!cart.length) {
            body.innerHTML = '<div class="text-center py-16 space-y-3"><div class="w-14 h-14 rounded-2xl bg-blue-50 text-amberGold flex items-center justify-center mx-auto text-2xl"><i class="fa-solid fa-bag-shopping"></i></div><p class="text-sm font-bold text-roast-950">Your basket is empty</p><a href="shop.html" class="inline-block px-5 py-2.5 bg-amberGold text-white text-xs font-bold rounded-full">Browse the shop</a></div>';
            foot.innerHTML = ''; return;
        }
        const sub = cart.reduce((a, i) => a + i.price * i.qty, 0);
        body.innerHTML = cart.map(i =>
            '<div class="flex gap-3 items-center bg-roast-50 rounded-2xl p-3 border border-roast-200"><img src="' + esc(i.image) + '" alt="" class="w-16 h-16 rounded-xl object-cover shrink-0">' +
            '<div class="flex-1 min-w-0"><p class="text-xs font-bold text-roast-950 leading-snug">' + esc(i.name) + '</p><p class="text-xs text-amberGold font-bold mt-0.5">' + money(i.price) + '</p></div>' +
            '<div class="flex items-center gap-2"><button onclick="changeQty(\'' + i.id + '\', -1)" class="w-7 h-7 rounded-full bg-white border border-roast-200 text-roast-700" aria-label="Less">&minus;</button><span class="text-xs font-bold w-4 text-center">' + i.qty + '</span><button onclick="changeQty(\'' + i.id + '\', 1)" class="w-7 h-7 rounded-full bg-white border border-roast-200 text-roast-700" aria-label="More">+</button></div></div>').join('');

        if (step === 'checkout') {
            const addrs = getProfile().addresses;
            if (!addrs.some(a => a.id === coAddrId)) { const d = addrs.find(a => a.isDefault) || addrs[0]; coAddrId = d ? d.id : null; }
            const showForm = !addrs.length || coNew;
            body.innerHTML += '<div class="pt-3 space-y-3 text-xs"><p class="font-bold text-roast-950 uppercase tracking-wider text-[11px]"><i class="fa-solid fa-location-dot text-amberGold mr-1.5"></i>Delivery address</p>' +
                (showForm ? '' : addrs.map(a =>
                    '<button type="button" onclick="coPick(\'' + a.id + '\')" class="w-full text-left rounded-2xl border p-3.5 space-y-1 transition-all ' + (a.id === coAddrId ? 'border-amberGold bg-blue-50 ring-2 ring-blue-100' : 'border-roast-200 bg-white hover:border-amberGold') + '">' +
                    '<div class="flex items-center gap-2"><strong class="text-roast-950">' + esc(a.name) + '</strong><span class="text-roast-500">' + esc(a.phone) + '</span>' + (a.isDefault ? '<span class="ml-auto px-2 py-0.5 rounded-full bg-amberGold text-white text-[9px] font-bold">Default</span>' : '') + '</div>' +
                    '<p class="text-roast-600 leading-relaxed">' + esc(fmtAddress(a)) + '</p><span class="inline-block px-2 py-0.5 rounded-full bg-roast-100 text-roast-600 text-[9px] font-bold">' + esc(a.label || 'Home') + '</span></button>').join('')) +
                (!showForm ? '<button type="button" onclick="coToggleNew(true)" class="w-full py-2.5 rounded-xl border border-dashed border-roast-300 text-amberGold font-bold hover:border-amberGold">+ Add a new address</button>' : '') +
                (showForm ? '<div class="rounded-2xl border border-roast-200 p-4 space-y-3 bg-roast-50">' + addressFormHtml('co') +
                    '<label class="flex items-center gap-2 text-roast-700"><input id="co-default" type="checkbox" ' + (addrs.length ? '' : 'checked disabled') + ' class="accent-blue-600"> Set as default address</label>' +
                    (addrs.length ? '<button type="button" onclick="coToggleNew(false)" class="text-roast-500 hover:text-roast-950">Cancel</button>' : '') + '</div>' : '') +
                '<div class="rounded-xl border border-amberGold bg-blue-50 p-3.5"><p class="font-bold text-roast-950 flex items-center gap-1.5"><i class="fa-solid fa-credit-card text-amberGold"></i> Billplz Payment Gateway</p><p class="text-[10px] text-roast-600 mt-0.5">Online banking (FPX), e-wallet or card. You will be redirected to complete payment.</p></div></div>';
        }
        foot.innerHTML = '<div class="space-y-1 text-xs"><div class="flex justify-between text-roast-600"><span>Subtotal</span><span>' + money(sub) + '</span></div><div class="flex justify-between text-roast-600"><span>Shipping</span><span>' + money(SHIPPING) + '</span></div><div class="flex justify-between text-sm font-bold text-roast-950 pt-1"><span>Total</span><span class="text-amberGold">' + money(sub + SHIPPING) + '</span></div></div>' +
            (step === 'checkout'
                ? '<button onclick="placeOrder()" class="w-full py-3.5 bg-amberGold hover:bg-royalBlue text-white font-bold rounded-xl text-sm shadow-lg"><i class="fa-solid fa-lock text-xs mr-1.5"></i>Pay ' + money(sub + SHIPPING) + ' with Billplz</button><button onclick="renderCartStep()" class="w-full text-xs text-roast-500 hover:text-roast-950">Back to basket</button>'
                : '<button onclick="renderCartStep(\'checkout\')" class="w-full py-3.5 bg-amberGold hover:bg-royalBlue text-white font-bold rounded-xl text-sm shadow-lg">Checkout</button>');
    }
    window.renderCartStep = renderCart;

    // Creates the order as "Pending Payment", then sends the member to the Billplz bill. Paid = Processing.
    window.placeOrder = function () {
        const cart = getCart();
        if (!cart.length) return;
        const prof = getProfile();
        let addr;
        if (!prof.addresses.length || coNew) {
            const r = readAddressForm('co');
            if (!r.ok) { showToast(r.error); return; }
            const first = !prof.addresses.length;
            const makeDefault = first || document.getElementById('co-default').checked;
            if (makeDefault) prof.addresses.forEach(a => { a.isDefault = false; });
            addr = { ...r.data, id: 'A' + Date.now(), isDefault: makeDefault };
            prof.addresses.push(addr);
            if (!prof.phone) prof.phone = addr.phone;
            saveProfile(prof);
            coNew = false;
        } else {
            addr = prof.addresses.find(a => a.id === coAddrId);
        }
        if (!addr) { showToast('Please choose a delivery address.'); return; }

        const sub = cart.reduce((a, i) => a + i.price * i.qty, 0);
        const orders = (() => { try { return JSON.parse(localStorage.getItem('rp_member_orders') || '[]'); } catch (x) { return []; } })();
        const order = {
            id: 'ORD' + String(Date.now()).slice(-6),
            email: (user() || {}).email,
            name: addr.name, phone: addr.phone, address: fmtAddress(addr),
            items: cart, subtotal: sub, shipping: SHIPPING, total: sub + SHIPPING,
            status: 'Pending Payment', paymentStatus: 'Unpaid',
            createdAt: new Date().toISOString()
        };
        orders.push(order);
        localStorage.setItem('rp_member_orders', JSON.stringify(orders));
        setCart([]);
        NBCA_PAY.checkout({ type: 'order', refId: order.id, amount: order.total, description: 'Order ' + order.id + ' - Nb.CA Academy', name: order.name, email: order.email, phone: order.phone, returnTo: 'orders.html' });
    };

    buildSidebar();
    buildTopbar();
    buildBottomNav();
    injectOverlays();
    refreshCartBadge();
    const payReturn = window.NBCA_PAY && NBCA_PAY.readReturn();
    if (payReturn) setTimeout(() => showToast(payReturn.paid ? 'Payment successful. Thank you!' : 'Payment was not completed. You can retry from the page.'), 400);
    const overlay = document.getElementById('m-overlay');
    if (overlay) {
        overlay.className = 'hidden lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30';
        overlay.onclick = MemberShell.closeMenu;
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { MemberShell.closeMenu(); closeProfileModal(); closeCart(); } });
    // after the page's own scripts have registered their listeners
    const fireReady = () => window.dispatchEvent(new Event('member-ready'));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fireReady); else fireReady();
})();
