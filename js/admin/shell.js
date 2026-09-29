/* Nb.CA Academy — admin console shell.
 * Injects the sidebar, mobile drawer, topbar, bottom nav and toast, and exposes AdminShell (data helpers + small utilities).
 * Business data comes from NBCA_DATA (js/nbca-data.js); component helpers live in js/admin/ui.js.
 * Page markup needs: <body data-page="..." data-title="..." data-sub="...">, #a-sidebar, #a-overlay, #a-topbar, #a-bottomnav. */
(function () {
    const D = window.NBCA_DATA, CFG = window.NBCA_CFG;

    // ---- session guard (also inline in <head> to avoid a flash) ----
    const admin = () => { try { return JSON.parse(localStorage.getItem('rp_admin') || 'null'); } catch (e) { return null; } };
    if (!admin()) { window.location.replace('admin-login.html'); return; }

    const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const money = n => 'RM ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const initials = n => (n || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const ymd = d => D.dayOf(d);

    // ---- records the portal writes ----
    const regs = () => D.read(D.K.regs, []);
    const orders = () => D.read(D.K.orders, []);
    const enrolls = () => D.read(D.K.enrolls, []);
    const save = key => v => D.write(key, v);
    const update = (key, id, patch) => D.write(key, D.read(key, []).map(r => r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r));

    // A booking holds a seat unless it was cancelled/rescheduled, or it is unpaid and past the hold window.
    function holdsSeat(r) {
        if (['Reschedule', 'Cancelled'].includes(r.classStatus)) return false;
        if (r.classStatus === 'Awaiting Payment') return Date.now() - new Date(r.createdAt).getTime() <= CFG.FC_HOLD_MINUTES * 60000;
        return true;
    }
    const seatsUsed = (date, session) => regs().filter(r => r.preferredDate === date && r.session === session && holdsSeat(r)).length;
    const workshopSeats = (workshopId, slot) => enrolls().filter(w => w.workshopId === workshopId && w.slot === slot && w.status !== 'Cancelled').length;

    // Next n open class days from today.
    function openDays(n, from) {
        const out = [], d = from ? new Date(from) : new Date(); d.setHours(0, 0, 0, 0);
        for (let i = 0; i < 90 && out.length < n; i++, d.setDate(d.getDate() + 1)) if (CFG.FC_OPEN_DAYS.includes(d.getDay())) out.push(new Date(d));
        return out;
    }
    const instructorOf = (date, session) => D.assign.get(D.assign.fixedKey(date, session));

    // Members = registered accounts, enriched with what they have booked, bought and earned.
    function members() {
        const P = D.read(D.K.profiles, {}), R = regs(), E = enrolls(), O = orders();
        return D.accounts.list().map(a => {
            const bookings = R.filter(r => (r.email || '').toLowerCase() === a.email), workshops = E.filter(w => (w.email || '').toLowerCase() === a.email), ords = O.filter(o => (o.email || '').toLowerCase() === a.email);
            const last = bookings[bookings.length - 1] || {};
            const profile = P[a.email] || {};
            const times = [a.lastSeen, ...bookings.map(x => x.createdAt), ...workshops.map(x => x.createdAt), ...ords.map(x => x.createdAt)].filter(Boolean).sort();
            const t = D.loyalty.tier(a.email);
            return {
                ...a, phone: a.phone || profile.phone || last.phone || '', ic: last.ic || '', cafe: last.cafe || '', from: last.from || '', addresses: profile.addresses || [],
                bookings, workshops, orders: ords,
                spend: bookings.filter(x => x.depositStatus === 'Paid').reduce((s, x) => s + Number(x.deposit || 0), 0) + workshops.filter(x => x.paymentStatus === 'Paid').reduce((s, x) => s + Number(x.price || 0), 0) + ords.filter(x => x.paymentStatus === 'Paid').reduce((s, x) => s + Number(x.total || 0), 0),
                points: D.loyalty.balance(a.email), tier: t.name, redemptions: D.loyalty.redemptionsOf(a.email), last: times[times.length - 1] || a.createdAt
            };
        }).sort((x, y) => (y.last || '').localeCompare(x.last || ''));
    }

    // Sessions in the next 7 days (and confirmed workshop slots) that have students but nobody teaching.
    function unassignedSessions() {
        const out = [];
        openDays(7).forEach(d => CFG.FC_SESSIONS.forEach(s => { const date = ymd(d); if (seatsUsed(date, s) > 0 && !instructorOf(date, s)) out.push({ kind: 'fixed', date, session: s }); }));
        const seen = new Set();
        enrolls().filter(w => w.status !== 'Cancelled').forEach(w => { const k = D.assign.wsKey(w.workshopId, w.slot); if (!seen.has(k) && !D.assign.get(k)) { seen.add(k); out.push({ kind: 'workshop', title: w.title, slot: w.slot }); } });
        return out;
    }

    function counts() {
        return {
            admit: regs().filter(r => r.depositStatus === 'Paid' && r.classStatus === 'Pending Confirmation').length,
            reschedule: regs().filter(r => r.classStatus === 'Reschedule').length,
            ship: orders().filter(o => o.status === 'Processing').length,
            unpaidOrders: orders().filter(o => o.status === 'Pending Payment').length,
            unassigned: unassignedSessions().length
        };
    }

    // ---- navigation ----
    const NAV = [
        { group: 'Operations', items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', href: 'admin-dashboard.html' },
            { id: 'bookings', label: 'Class Bookings', icon: 'fa-calendar-check', href: 'admin-bookings.html', badge: 'admit' },
            { id: 'workshops', label: 'Workshop Enrollments', icon: 'fa-chalkboard-user', href: 'admin-workshops.html' },
            { id: 'orders', label: 'Orders', icon: 'fa-bag-shopping', href: 'admin-orders.html', badge: 'ship' }
        ]},
        { group: 'Programs', items: [
            { id: 'schedule', label: 'Class Schedule', icon: 'fa-user-tie', href: 'admin-schedule.html', badge: 'unassigned' },
            { id: 'rewards', label: 'Membership & Rewards', icon: 'fa-gift', href: 'admin-rewards.html' }
        ]},
        { group: 'People', items: [
            { id: 'members', label: 'Members', icon: 'fa-users', href: 'admin-members.html' },
            { id: 'm-admins', label: 'Admin Accounts', icon: 'fa-user-shield', href: 'admin-manage.html?tab=admins' }
        ]},
        { group: 'Content', items: [
            { id: 'm-fixed', label: 'Fixed Class Settings', icon: 'fa-sliders', href: 'admin-manage.html?tab=fixed' },
            { id: 'm-inventory', label: 'Inventory', icon: 'fa-boxes-stacked', href: 'admin-manage.html?tab=inventory' },
            { id: 'm-blog', label: 'Announcements', icon: 'fa-bullhorn', href: 'admin-manage.html?tab=blog' },
            { id: 'website', label: 'Website & Demo', icon: 'fa-globe', href: 'admin-website.html' }
        ]}
    ];
    const page = document.body.dataset.page || '';
    const me = admin();

    const navItem = (it, c) => {
        const active = it.id === page, n = it.badge ? c[it.badge] : 0;
        return '<a href="' + it.href + '" class="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ' + (active ? 'bg-amberGold text-white shadow-lg shadow-blue-900/40' : 'text-slate-300 hover:bg-white/10 hover:text-white') + '">' +
            '<span class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ' + (active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10') + '"><i class="fa-solid ' + it.icon + '"></i></span><span class="truncate">' + it.label + '</span>' +
            (n ? '<span class="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold flex items-center justify-center">' + n + '</span>' : '') + '</a>';
    };

    function buildSidebar(c) {
        const el = document.getElementById('a-sidebar');
        el.className = 'fixed inset-y-0 left-0 w-64 z-40 bg-slate-900 flex flex-col -translate-x-full lg:translate-x-0 transition-transform duration-300';
        el.innerHTML =
            '<div class="h-20 px-5 flex items-center justify-between border-b border-white/10 shrink-0"><a href="admin-dashboard.html" class="flex items-center gap-3"><span class="w-10 h-10 rounded-xl bg-white flex items-center justify-center"><img src="images/logo.png" alt="" class="w-8 h-8 object-contain"></span>' +
            '<span class="leading-tight"><span class="block font-serif text-base font-extrabold tracking-wide text-white uppercase">Nb.CA</span><span class="block text-[10px] tracking-[0.2em] text-blue-300 uppercase font-bold">Admin Console</span></span></a>' +
            '<button onclick="AdminShell.closeMenu()" class="lg:hidden w-9 h-9 rounded-full hover:bg-white/10 text-slate-300" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button></div>' +
            '<nav class="flex-1 overflow-y-auto px-3 py-5 space-y-5" aria-label="Admin navigation">' +
            NAV.map(g => '<div class="space-y-1"><p class="px-3.5 mb-2 text-[10px] font-extrabold tracking-[0.18em] uppercase text-slate-500">' + g.group + '</p>' + g.items.map(i => navItem(i, c)).join('') + '</div>').join('') + '</nav>' +
            '<div class="p-4 border-t border-white/10 space-y-2 shrink-0"><a href="admin-manage.html?tab=admins" class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-all"><span class="w-10 h-10 rounded-full bg-amberGold text-white font-bold text-sm flex items-center justify-center shrink-0">' + esc(initials(me.name)) + '</span>' +
            '<span class="min-w-0"><strong class="block text-[13px] text-white truncate">' + esc(me.name || 'Admin') + '</strong><span class="block text-[11px] text-slate-400 truncate">' + esc(me.email || '') + '</span></span></a>' +
            '<button onclick="AdminShell.logout()" class="w-full py-2 rounded-xl text-[11px] font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-all"><i class="fa-solid fa-right-from-bracket mr-1.5"></i> Logout</button></div>';
    }

    function buildTopbar(c) {
        const el = document.getElementById('a-topbar'), attention = c.admit + c.reschedule + c.ship + c.unassigned;
        el.className = 'sticky top-0 z-30 h-16 lg:h-20 bg-slate-50/85 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3';
        el.innerHTML =
            '<div class="flex items-center gap-3 min-w-0"><button onclick="AdminShell.openMenu()" class="lg:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center shadow-sm" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>' +
            '<div class="min-w-0"><h1 class="font-serif text-lg lg:text-2xl font-extrabold text-slate-900 truncate">' + esc(document.body.dataset.title || '') + '</h1><p class="hidden sm:block text-[11px] text-slate-500 truncate">' + esc(document.body.dataset.sub || '') + '</p></div></div>' +
            '<div class="flex items-center gap-2 sm:gap-3 shrink-0"><span class="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700" title="Members active in the last 5 minutes"><span class="w-2 h-2 rounded-full ' + (D.activity.onlineNow(5) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300') + '"></span>' + D.activity.onlineNow(5) + ' online</span>' +
            '<a href="index.html?preview=1" target="_blank" rel="noopener" class="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-amberGold transition-all"><i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-amberGold"></i> View site</a>' +
            '<a href="admin-dashboard.html" class="relative w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-amberGold flex items-center justify-center" aria-label="Needs attention"><i class="fa-solid fa-bell text-sm"></i>' +
            (attention ? '<span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold flex items-center justify-center">' + attention + '</span>' : '') + '</a></div>';
    }

    function buildBottomNav(c) {
        const el = document.getElementById('a-bottomnav');
        el.className = 'lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 flex items-stretch justify-around shadow-[0_-8px_24px_rgba(15,23,42,0.08)]';
        el.style.paddingBottom = 'env(safe-area-inset-bottom)';
        const tabs = [['dashboard', 'Home', 'fa-chart-pie', 'admin-dashboard.html', 0], ['bookings', 'Bookings', 'fa-calendar-check', 'admin-bookings.html', c.admit], ['orders', 'Orders', 'fa-bag-shopping', 'admin-orders.html', c.ship], ['members', 'Members', 'fa-users', 'admin-members.html', 0]];
        el.innerHTML = tabs.map(t => '<a href="' + t[3] + '" class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 ' + (t[0] === page ? 'text-amberGold' : 'text-slate-500') + '"><span class="relative"><i class="fa-solid ' + t[2] + ' text-base"></i>' + (t[4] ? '<span class="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-slate-900 text-[9px] font-extrabold flex items-center justify-center">' + t[4] + '</span>' : '') + '</span><span class="text-[10px] font-bold">' + t[1] + '</span></a>').join('') +
            '<button onclick="AdminShell.openMenu()" class="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-slate-500"><i class="fa-solid fa-ellipsis text-base"></i><span class="text-[10px] font-bold">More</span></button>';
    }

    window.AdminShell = {
        CFG, admin, esc, money, initials, ymd, regs, orders, enrolls, update, members, counts, holdsSeat, seatsUsed, workshopSeats, openDays, instructorOf, unassignedSessions,
        saveRegs: save(D.K.regs), saveOrders: save(D.K.orders), saveEnrolls: save(D.K.enrolls),
        openMenu() { document.getElementById('a-sidebar').classList.remove('-translate-x-full'); document.getElementById('a-overlay').classList.remove('hidden'); },
        closeMenu() { document.getElementById('a-sidebar').classList.add('-translate-x-full'); document.getElementById('a-overlay').classList.add('hidden'); },
        logout() { localStorage.removeItem('rp_admin'); window.location.href = 'admin-login.html'; },
        toast(msg) {
            let t = document.getElementById('a-toast');
            if (!t) {
                t = document.createElement('div'); t.id = 'a-toast'; t.className = 'fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[80] transform translate-y-24 opacity-0 transition-all duration-300 pointer-events-none';
                t.innerHTML = '<div class="bg-white border border-amberGold/40 text-slate-900 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-amberGold text-white flex items-center justify-center shrink-0"><i class="fa-solid fa-check text-xs"></i></div><p id="a-toast-msg" class="text-xs font-semibold"></p></div>';
                document.body.appendChild(t);
            }
            document.getElementById('a-toast-msg').innerText = msg;
            t.classList.remove('translate-y-24', 'opacity-0'); t.classList.add('translate-y-0', 'opacity-100');
            clearTimeout(this._t);
            this._t = setTimeout(() => { t.classList.remove('translate-y-0', 'opacity-100'); t.classList.add('translate-y-24', 'opacity-0'); }, 2600);
        },
        downloadCsv(filename, rows) {
            const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
            const url = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
            const l = document.createElement('a'); l.href = url; l.download = filename; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        waLink(phone, msg) { const p = String(phone || '').replace(/[^0-9]/g, '').replace(/^0/, '60'); return p ? 'https://wa.me/' + p + '?text=' + encodeURIComponent(msg || '') : ''; },
        fmtDate(d, opts) { if (!d) return '-'; return new Date(String(d).length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' }); },
        fmtDateTime(d) { return d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'; },
        ago(t) { if (!t) return 'never'; const m = Math.round((Date.now() - new Date(t)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : window.AdminShell.fmtDate(t, { day: 'numeric', month: 'short' }); }
    };

    const c = counts();
    buildSidebar(c); buildTopbar(c); buildBottomNav(c);
    const ov = document.getElementById('a-overlay');
    ov.className = 'hidden lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30'; ov.onclick = AdminShell.closeMenu;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') AdminShell.closeMenu(); });
    const fire = () => window.dispatchEvent(new Event('admin-ready'));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fire); else fire();
})();
