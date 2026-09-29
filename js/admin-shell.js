/* Nb.CA Academy — shared admin console shell.
 * Injects sidebar, mobile drawer, topbar, bottom nav, toast and a confirm dialog on every admin page, and exposes
 * data helpers (AdminShell) for the member data the portal writes to localStorage.
 * Page markup needs: <body data-page="..." data-title="..." data-sub="...">, #a-sidebar, #a-overlay, #a-topbar, #a-bottomnav. */
(function () {
    const CFG = window.NBCA_CFG || { FC_CAPACITY: 10, FC_OPEN_DAYS: [0, 1, 2, 3, 4], FC_SESSIONS: [], FC_HOLD_MINUTES: 30 };

    // ---- session guard (also inline in <head> to avoid a flash) ----
    function admin() { try { return JSON.parse(localStorage.getItem('rp_admin') || 'null'); } catch (e) { return null; } }
    if (!admin()) { window.location.replace('admin-login.html'); return; }

    const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const money = n => 'RM ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const initials = n => (n || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const read = k => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } };
    const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

    // ---- data (written by the member portal) ----
    const regs = () => read('rp_fixed_class_students');
    const orders = () => read('rp_member_orders');
    const enrolls = () => read('rp_workshop_enrollments');
    const saveRegs = v => write('rp_fixed_class_students', v);
    const saveOrders = v => write('rp_member_orders', v);
    const saveEnrolls = v => write('rp_workshop_enrollments', v);
    const profiles = () => { try { return JSON.parse(localStorage.getItem('rp_member_profiles') || '{}'); } catch (e) { return {}; } };

    function update(key, id, patch) {
        const all = read(key).map(r => r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r);
        write(key, all);
    }

    // Bookings that hold a seat right now (unpaid ones expire after the hold window).
    function holdsSeat(r) {
        if (['Reschedule', 'Cancelled'].includes(r.classStatus)) return false;
        if (r.classStatus === 'Awaiting Payment') return Date.now() - new Date(r.createdAt).getTime() <= CFG.FC_HOLD_MINUTES * 60000;
        return true;
    }
    const seatsUsed = (date, session) => regs().filter(r => r.preferredDate === date && r.session === session && holdsSeat(r)).length;

    // Derives the member list from everything members have created (there is no separate member table yet).
    function members() {
        const map = {};
        const get = (email, name) => {
            const k = (email || '').toLowerCase();
            if (!k) return null;
            return map[k] || (map[k] = { email: k, name: name || '', phone: '', ic: '', cafe: '', from: '', addresses: [], bookings: [], workshops: [], orders: [], spend: 0, last: '' });
        };
        const touch = (m, t) => { if (t && t > m.last) m.last = t; };
        regs().forEach(r => { const m = get(r.email, r.name); if (!m) return; m.name = m.name || r.name; m.phone = r.phone || m.phone; m.ic = r.ic || m.ic; m.cafe = r.cafe || m.cafe; m.from = r.from || m.from; m.bookings.push(r); if (r.depositStatus === 'Paid') m.spend += Number(r.deposit || 0); touch(m, r.createdAt); });
        enrolls().forEach(w => { const m = get(w.email, w.name); if (!m) return; m.name = m.name || w.name; m.workshops.push(w); if (w.paymentStatus === 'Paid') m.spend += Number(w.price || 0); touch(m, w.createdAt); });
        orders().forEach(o => { const m = get(o.email, o.name); if (!m) return; m.name = m.name || o.name; m.phone = m.phone || o.phone; m.orders.push(o); if (o.paymentStatus === 'Paid') m.spend += Number(o.total || 0); touch(m, o.createdAt); });
        const P = profiles();
        Object.keys(P).forEach(email => { const m = get(email); if (!m) return; m.phone = P[email].phone || m.phone; m.addresses = P[email].addresses || []; });
        try { const u = JSON.parse(localStorage.getItem('rp_user') || 'null'); if (u && u.email) { const m = get(u.email, u.name); if (m && !m.name) m.name = u.name; } } catch (e) {}
        return Object.values(map).sort((a, b) => (b.last || '').localeCompare(a.last || ''));
    }

    // ---- counts for sidebar badges / dashboard ----
    function counts() {
        return {
            admit: regs().filter(r => r.depositStatus === 'Paid' && r.classStatus === 'Pending Confirmation').length,
            reschedule: regs().filter(r => r.classStatus === 'Reschedule').length,
            ship: orders().filter(o => o.status === 'Processing').length,
            unpaidOrders: orders().filter(o => o.status === 'Pending Payment').length,
            unpaidWorkshops: enrolls().filter(w => w.status === 'Pending Payment').length
        };
    }

    // ---- nav ----
    const NAV = [
        { group: 'Operations', items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', href: 'admin-dashboard.html' },
            { id: 'bookings', label: 'Class Bookings', icon: 'fa-calendar-check', href: 'admin-bookings.html', badge: 'admit' },
            { id: 'workshops', label: 'Workshop Enrollments', icon: 'fa-chalkboard-user', href: 'admin-workshops.html' },
            { id: 'orders', label: 'Orders', icon: 'fa-bag-shopping', href: 'admin-orders.html', badge: 'ship' },
            { id: 'members', label: 'Members', icon: 'fa-users', href: 'admin-members.html' }
        ]},
        { group: 'Manage', items: [
            { id: 'm-fixed', label: 'Fixed Class Settings', icon: 'fa-sliders', href: 'admin-manage.html?tab=fixed' },
            { id: 'm-slots', label: 'Workshop Slots', icon: 'fa-clock', href: 'admin-manage.html?tab=slots' },
            { id: 'm-inventory', label: 'Inventory', icon: 'fa-boxes-stacked', href: 'admin-manage.html?tab=inventory' },
            { id: 'm-blog', label: 'Announcements', icon: 'fa-bullhorn', href: 'admin-manage.html?tab=blog' },
            { id: 'm-admins', label: 'Admin Accounts', icon: 'fa-user-shield', href: 'admin-manage.html?tab=admins' }
        ]}
    ];

    const page = document.body.dataset.page || '';
    const a = admin();

    function navItem(it) {
        const active = it.id === page;
        const c = counts();
        const n = it.badge ? c[it.badge] : 0;
        return '<a href="' + it.href + '" class="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ' +
            (active ? 'bg-amberGold text-white shadow-lg shadow-blue-900/40' : 'text-slate-300 hover:bg-white/10 hover:text-white') + '">' +
            '<span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ' + (active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10') + '"><i class="fa-solid ' + it.icon + '"></i></span>' +
            '<span class="truncate">' + it.label + '</span>' +
            (n ? '<span class="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold flex items-center justify-center">' + n + '</span>' : '') + '</a>';
    }

    function buildSidebar() {
        const el = document.getElementById('a-sidebar');
        el.className = 'fixed inset-y-0 left-0 w-64 z-40 bg-slate-900 flex flex-col -translate-x-full lg:translate-x-0 transition-transform duration-300';
        el.innerHTML =
            '<div class="h-20 px-5 flex items-center justify-between border-b border-white/10 shrink-0">' +
                '<a href="admin-dashboard.html" class="flex items-center gap-3"><span class="w-10 h-10 rounded-xl bg-white flex items-center justify-center"><img src="images/logo.png" alt="" class="w-8 h-8 object-contain"></span>' +
                '<span class="leading-tight"><span class="block font-serif text-base font-extrabold tracking-wide text-white uppercase">Nb.CA</span><span class="block text-[10px] tracking-[0.2em] text-blue-300 uppercase font-bold">Admin Console</span></span></a>' +
                '<button onclick="AdminShell.closeMenu()" class="lg:hidden w-9 h-9 rounded-full hover:bg-white/10 text-slate-300" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<nav class="flex-1 overflow-y-auto px-3 py-5 space-y-6" aria-label="Admin navigation">' +
                NAV.map(g => '<div class="space-y-1"><p class="px-3.5 mb-2 text-[10px] font-extrabold tracking-[0.18em] uppercase text-slate-500">' + g.group + '</p>' + g.items.map(navItem).join('') + '</div>').join('') +
            '</nav>' +
            '<div class="p-4 border-t border-white/10 space-y-2 shrink-0">' +
                '<a href="admin-manage.html?tab=admins" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-all"><span class="w-10 h-10 rounded-full bg-amberGold text-white font-bold text-sm flex items-center justify-center shrink-0">' + esc(initials(a.name)) + '</span>' +
                '<span class="min-w-0"><strong class="block text-[13px] text-white truncate">' + esc(a.name || 'Admin') + '</strong><span class="block text-[11px] text-slate-400 truncate">' + esc(a.email || '') + '</span></span></a>' +
                '<button onclick="AdminShell.logout()" class="w-full py-2 rounded-xl text-[11px] font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-all"><i class="fa-solid fa-right-from-bracket mr-1.5"></i> Logout</button>' +
            '</div>';
    }

    function buildTopbar() {
        const el = document.getElementById('a-topbar');
        const c = counts();
        const attention = c.admit + c.reschedule + c.ship;
        el.className = 'sticky top-0 z-30 h-16 lg:h-20 bg-slate-50/85 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3';
        el.innerHTML =
            '<div class="flex items-center gap-3 min-w-0">' +
                '<button onclick="AdminShell.openMenu()" class="lg:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center shadow-sm" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>' +
                '<div class="min-w-0"><h1 class="font-serif text-lg lg:text-2xl font-extrabold text-slate-900 truncate">' + esc(document.body.dataset.title || '') + '</h1>' +
                '<p class="hidden sm:block text-[11px] text-slate-500 truncate">' + esc(document.body.dataset.sub || '') + '</p></div>' +
            '</div>' +
            '<div class="flex items-center gap-2 sm:gap-3 shrink-0">' +
                '<a href="index.html" target="_blank" rel="noopener" class="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-amberGold transition-all"><i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-amberGold"></i> View site</a>' +
                '<a href="admin-dashboard.html" class="relative w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-amberGold flex items-center justify-center" aria-label="Needs attention"><i class="fa-solid fa-bell text-sm"></i>' +
                (attention ? '<span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold flex items-center justify-center">' + attention + '</span>' : '') + '</a>' +
            '</div>';
    }

    function buildBottomNav() {
        const el = document.getElementById('a-bottomnav');
        el.className = 'lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 flex items-stretch justify-around shadow-[0_-8px_24px_rgba(15,23,42,0.08)]';
        el.style.paddingBottom = 'env(safe-area-inset-bottom)';
        const c = counts();
        const tabs = [['dashboard', 'Home', 'fa-chart-pie', 'admin-dashboard.html', 0], ['bookings', 'Bookings', 'fa-calendar-check', 'admin-bookings.html', c.admit], ['orders', 'Orders', 'fa-bag-shopping', 'admin-orders.html', c.ship], ['members', 'Members', 'fa-users', 'admin-members.html', 0]];
        el.innerHTML = tabs.map(t => '<a href="' + t[3] + '" class="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 ' + (t[0] === page ? 'text-amberGold' : 'text-slate-500') + '"><span class="relative"><i class="fa-solid ' + t[2] + ' text-base"></i>' + (t[4] ? '<span class="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-slate-900 text-[9px] font-extrabold flex items-center justify-center">' + t[4] + '</span>' : '') + '</span><span class="text-[10px] font-bold">' + t[1] + '</span></a>').join('') +
            '<button onclick="AdminShell.openMenu()" class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-slate-500"><i class="fa-solid fa-ellipsis text-base"></i><span class="text-[10px] font-bold">More</span></button>';
    }

    function injectOverlays() {
        const wrap = document.createElement('div');
        wrap.innerHTML =
            '<div id="a-toast" class="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[70] transform translate-y-24 opacity-0 transition-all duration-300 pointer-events-none"><div class="bg-white border border-amberGold/40 text-slate-900 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-amberGold text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-check text-xs"></i></div><p id="a-toast-msg" class="text-xs font-semibold"></p></div></div>' +
            '<div id="a-confirm" class="fixed inset-0 z-[60] hidden flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-close></div>' +
                '<div class="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"><h3 id="a-confirm-title" class="font-serif text-lg font-bold text-slate-900"></h3><p id="a-confirm-msg" class="text-xs text-slate-600 leading-relaxed"></p>' +
                '<div class="flex gap-3 pt-1"><button id="a-confirm-ok" class="flex-1 py-3 bg-amberGold hover:bg-royalBlue text-white font-bold rounded-xl text-xs shadow"></button><button data-close class="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Cancel</button></div></div></div>';
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    }

    window.AdminShell = {
        CFG, admin, esc, money, initials, read, write, regs, orders, enrolls, saveRegs, saveOrders, saveEnrolls, update, members, counts, holdsSeat, seatsUsed,
        openMenu() { document.getElementById('a-sidebar').classList.remove('-translate-x-full'); document.getElementById('a-overlay').classList.remove('hidden'); },
        closeMenu() { document.getElementById('a-sidebar').classList.add('-translate-x-full'); document.getElementById('a-overlay').classList.add('hidden'); },
        logout() { localStorage.removeItem('rp_admin'); window.location.href = 'admin-login.html'; },
        toast(msg) {
            const t = document.getElementById('a-toast');
            document.getElementById('a-toast-msg').innerText = msg;
            t.classList.remove('translate-y-24', 'opacity-0'); t.classList.add('translate-y-0', 'opacity-100');
            clearTimeout(this._t);
            this._t = setTimeout(() => { t.classList.remove('translate-y-0', 'opacity-100'); t.classList.add('translate-y-24', 'opacity-0'); }, 2600);
        },
        // Promise-based confirm dialog. opts: {title, message, ok}
        confirm(opts) {
            return new Promise(res => {
                const box = document.getElementById('a-confirm');
                document.getElementById('a-confirm-title').innerText = opts.title || 'Are you sure?';
                document.getElementById('a-confirm-msg').innerText = opts.message || '';
                const ok = document.getElementById('a-confirm-ok');
                ok.innerText = opts.ok || 'Confirm';
                const done = v => { box.classList.add('hidden'); res(v); };
                ok.onclick = () => done(true);
                box.querySelectorAll('[data-close]').forEach(b => b.onclick = () => done(false));
                box.classList.remove('hidden');
            });
        },
        downloadCsv(filename, rows) {
            const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
            const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const l = document.createElement('a'); l.href = url; l.download = filename; document.body.appendChild(l); l.click(); l.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        waLink(phone, msg) {
            const p = String(phone || '').replace(/[^0-9]/g, '').replace(/^0/, '60');
            return p ? 'https://wa.me/' + p + '?text=' + encodeURIComponent(msg || '') : '';
        },
        fmtDate(d, opts) { return new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' }); }
    };

    buildSidebar(); buildTopbar(); buildBottomNav(); injectOverlays();
    const ov = document.getElementById('a-overlay');
    ov.className = 'hidden lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30';
    ov.onclick = AdminShell.closeMenu;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') AdminShell.closeMenu(); });
    const fire = () => window.dispatchEvent(new Event('admin-ready'));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fire); else fire();
})();
