/* Admin dashboard: KPIs, charts, attention queue, upcoming sessions and activity, all from real data. */
(function () {
    const S = AdminShell, D = NBCA_DATA, CFG = S.CFG, esc = S.esc, money = S.money;
    const $ = id => document.getElementById(id);
    const DAY = 86400000;
    let period = 'month', custom = { from: '', to: '' };
    const charts = {};
    const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const monthStart = (y, m) => new Date(y, m, 1);
    const SRC = ['Orders', 'Class deposits', 'Workshops'], SRC_COLOR = ['#2563EB', '#10B981', '#8B5CF6'];

    // ---- period -> {start, end, buckets[], prev:{start,end}} (end is exclusive) ----
    function buildRange() {
        const now = new Date(), today = sod(now);
        let start, end, unit;
        if (period === 'day') { start = today; end = new Date(+today + DAY); unit = 'hour'; }
        else if (period === 'week') { start = new Date(+today - 6 * DAY); end = new Date(+today + DAY); unit = 'day'; }
        else if (period === 'year') { start = monthStart(now.getFullYear(), now.getMonth() - 11); end = monthStart(now.getFullYear(), now.getMonth() + 1); unit = 'month'; }
        else if (period === 'custom' && custom.from && custom.to) {
            start = sod(custom.from); end = new Date(+sod(custom.to) + DAY);
            if (end <= start) end = new Date(+start + DAY);
            unit = (end - start) / DAY > 92 ? 'month' : 'day';
        } else { start = new Date(+today - 29 * DAY); end = new Date(+today + DAY); unit = 'day'; }
        const buckets = [];
        if (unit === 'hour') for (let h = 0; h < 24; h++) buckets.push({ start: new Date(+start + h * 3600000), end: new Date(+start + (h + 1) * 3600000), label: String(h).padStart(2, '0') + ':00' });
        else if (unit === 'day') for (let t = +start; t < +end; t += DAY) buckets.push({ start: new Date(t), end: new Date(t + DAY), label: new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
        else { let d = monthStart(start.getFullYear(), start.getMonth()); while (d < end) { const n = monthStart(d.getFullYear(), d.getMonth() + 1); buckets.push({ start: d, end: n, label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) }); d = n; } }
        const len = end - start;
        return { start, end, unit, buckets, prev: { start: new Date(+start - len), end: start } };
    }
    const within = (t, a, b) => { if (!t) return false; const x = +new Date(t); return x >= +a && x < +b; };

    // ---- data ----
    function paidEvents() {
        const ev = [];
        S.orders().forEach(o => { if (o.paymentStatus === 'Paid') ev.push({ t: o.paidAt || o.createdAt, amt: Number(o.total), src: 'Orders' }); });
        S.regs().forEach(r => { if (r.depositStatus === 'Paid' && r.classStatus !== 'Cancelled') ev.push({ t: r.paidAt || r.createdAt, amt: Number(r.deposit), src: 'Class deposits' }); });
        S.enrolls().forEach(w => { if (w.paymentStatus === 'Paid' && w.status !== 'Cancelled') ev.push({ t: w.paidAt || w.createdAt, amt: Number(w.price), src: 'Workshops' }); });
        return ev;
    }
    const activeIn = (a, b) => { const from = D.dayOf(a), to = D.dayOf(new Date(+b - 1)); return new Set(D.activity.log().filter(r => r.day >= from && r.day <= to).map(r => r.email)); };

    function kpiDelta(cur, prev, isMoney) {
        if (!cur && !prev) return { text: 'No data yet', tone: 'text-slate-400' };
        if (!prev) return { text: 'New activity', tone: 'text-emerald-600' };
        const pct = Math.round((cur - prev) / prev * 100);
        return { text: (pct >= 0 ? '▲ ' : '▼ ') + Math.abs(pct) + '% vs previous', tone: pct >= 0 ? 'text-emerald-600' : 'text-red-500' };
    }

    function renderKpis(r) {
        const ev = paidEvents(), orders = S.orders(), regs = S.regs().filter(x => x.classStatus !== 'Cancelled'), enr = S.enrolls().filter(x => x.status !== 'Cancelled'), accs = D.accounts.list();
        const sum = (a, b) => ev.filter(e => within(e.t, a, b)).reduce((s, e) => s + e.amt, 0);
        const cnt = (arr, key, a, b) => arr.filter(x => within(x[key], a, b)).length;
        const rev = sum(r.start, r.end), revP = sum(r.prev.start, r.prev.end);
        const ord = cnt(orders, 'createdAt', r.start, r.end), ordP = cnt(orders, 'createdAt', r.prev.start, r.prev.end);
        const bk = cnt(regs, 'createdAt', r.start, r.end) + cnt(enr, 'createdAt', r.start, r.end), bkP = cnt(regs, 'createdAt', r.prev.start, r.prev.end) + cnt(enr, 'createdAt', r.prev.start, r.prev.end);
        const nm = cnt(accs, 'createdAt', r.start, r.end), nmP = cnt(accs, 'createdAt', r.prev.start, r.prev.end);
        const act = activeIn(r.start, r.end).size, actP = activeIn(r.prev.start, r.prev.end).size;
        const paidOrders = orders.filter(o => o.paymentStatus === 'Paid' && within(o.paidAt || o.createdAt, r.start, r.end));
        const aov = paidOrders.length ? paidOrders.reduce((s, o) => s + Number(o.total), 0) / paidOrders.length : 0;
        const d = (c, p) => { const x = kpiDelta(c, p); return { sub: x.text, subTone: x.tone }; };
        $('kpis').innerHTML = [
            { icon: 'fa-wallet', tone: 'emerald', value: money(rev), label: 'Revenue (paid)', ...d(rev, revP), href: 'admin-orders.html' },
            { icon: 'fa-bag-shopping', tone: 'blue', value: ord, label: 'Orders placed', ...d(ord, ordP), href: 'admin-orders.html' },
            { icon: 'fa-calendar-check', tone: 'amber', value: bk, label: 'Class & workshop bookings', ...d(bk, bkP), href: 'admin-bookings.html' },
            { icon: 'fa-user-plus', tone: 'violet', value: nm, label: 'New sign-ups', ...d(nm, nmP), href: 'admin-members.html' },
            { icon: 'fa-bolt', tone: 'rose', value: act, label: 'Active members', sub: D.activity.onlineNow(5) + ' online now', subTone: 'text-emerald-600', href: 'admin-members.html' },
            { icon: 'fa-receipt', tone: 'blue', value: money(aov), label: 'Avg. order value', sub: paidOrders.length + ' paid order' + (paidOrders.length === 1 ? '' : 's') }
        ].map(UI.kpi).join('');
        $('period-label').innerText = r.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' – ' + new Date(+r.end - 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // ---- chart helpers ----
    function draw(id, config, isEmpty) {
        const canvas = $(id), wrap = canvas.parentElement, note = wrap.querySelector('[data-empty]');
        if (charts[id]) { charts[id].destroy(); delete charts[id]; }
        if (note) note.classList.toggle('hidden', !isEmpty);
        canvas.classList.toggle('invisible', !!isEmpty);
        if (isEmpty) return;
        charts[id] = new Chart(canvas, config);
    }
    const GRID = { color: '#E2E8F0' }, TICK = { font: { size: 10 }, color: '#64748B' };
    const bucketSum = (r, items, valueFn, timeFn) => r.buckets.map(b => items.filter(x => within(timeFn(x), b.start, b.end)).reduce((s, x) => s + valueFn(x), 0));

    function renderCharts(r) {
        const ev = paidEvents(), accs = D.accounts.list();
        // revenue trend
        const rev = bucketSum(r, ev, e => e.amt, e => e.t);
        draw('c-revenue', { type: 'line', data: { labels: r.buckets.map(b => b.label), datasets: [{ label: 'Revenue', data: rev, borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,.12)', fill: true, tension: .35, borderWidth: 3, pointRadius: rev.length > 40 ? 0 : 3, pointBackgroundColor: '#2563EB' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' RM ' + c.parsed.y.toFixed(2) } } }, scales: { x: { grid: { display: false }, ticks: { ...TICK, maxTicksLimit: 10 } }, y: { beginAtZero: true, grid: GRID, ticks: { ...TICK, callback: v => 'RM ' + v } } } } }, !rev.some(v => v));
        // sales mix
        const mix = SRC.map(s => ev.filter(e => e.src === s && within(e.t, r.start, r.end)).reduce((a, e) => a + e.amt, 0));
        draw('c-mix', { type: 'doughnut', data: { labels: SRC, datasets: [{ data: mix, backgroundColor: SRC_COLOR, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }, tooltip: { callbacks: { label: c => ' ' + c.label + ': RM ' + c.parsed.toFixed(2) } } } } }, !mix.some(v => v));
        // sign-ups + active users use daily buckets even for "Day" (there is no hourly activity data)
        const dr = period === 'day' ? (() => { const t = sod(new Date()); const b = []; for (let i = 6; i >= 0; i--) { const s = new Date(+t - i * DAY); b.push({ start: s, end: new Date(+s + DAY), label: s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }); } return { buckets: b, start: b[0].start, end: b[6].end }; })() : r;
        $('signup-cap').innerText = period === 'day' ? 'Last 7 days' : (r.unit === 'month' ? 'Per month' : 'Per day');
        const signups = dr.buckets.map(b => accs.filter(a => within(a.createdAt, b.start, b.end)).length);
        draw('c-signups', { type: 'bar', data: { labels: dr.buckets.map(b => b.label), datasets: [{ label: 'New sign-ups', data: signups, backgroundColor: '#2563EB', borderRadius: 6, maxBarThickness: 28 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { ...TICK, maxTicksLimit: 10 } }, y: { beginAtZero: true, grid: GRID, ticks: { ...TICK, precision: 0 } } } } }, !signups.some(v => v));
        const activeSeries = dr.buckets.map(b => activeIn(b.start, b.end).size);
        draw('c-active', { type: 'line', data: { labels: dr.buckets.map(b => b.label), datasets: [{ label: 'Active members', data: activeSeries, borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,.12)', fill: true, tension: .35, borderWidth: 3, pointRadius: activeSeries.length > 40 ? 0 : 3, pointBackgroundColor: '#8B5CF6' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { ...TICK, maxTicksLimit: 10 } }, y: { beginAtZero: true, grid: GRID, ticks: { ...TICK, precision: 0 } } } } }, !activeSeries.some(v => v));
        // order status (all time)
        const ST = ['Pending Payment', 'Processing', 'Shipped', 'Completed', 'Cancelled'], stc = ST.map(s => S.orders().filter(o => o.status === s).length);
        draw('c-status', { type: 'bar', data: { labels: ST, datasets: [{ data: stc, backgroundColor: ['#F59E0B', '#2563EB', '#8B5CF6', '#10B981', '#94A3B8'], borderRadius: 6, maxBarThickness: 22 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: GRID, ticks: { ...TICK, precision: 0 } }, y: { grid: { display: false }, ticks: TICK } } } }, !stc.some(v => v));
        // top products in period (by units of paid orders)
        const units = {}; S.orders().filter(o => o.paymentStatus === 'Paid' && within(o.paidAt || o.createdAt, r.start, r.end)).forEach(o => (o.items || []).forEach(i => { units[i.name] = (units[i.name] || 0) + i.qty; }));
        const top = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 5);
        draw('c-products', { type: 'bar', data: { labels: top.map(t => t[0].length > 26 ? t[0].slice(0, 25) + '…' : t[0]), datasets: [{ data: top.map(t => t[1]), backgroundColor: '#2563EB', borderRadius: 6, maxBarThickness: 22 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + c.parsed.x + ' sold' } } }, scales: { x: { beginAtZero: true, grid: GRID, ticks: { ...TICK, precision: 0 } }, y: { grid: { display: false }, ticks: TICK } } } }, !top.length);
        // member tiers
        const tiers = D.loyalty.settings().tiers.map(t => t.name), ms = S.members(), tc = tiers.map(t => ms.filter(m => m.tier === t).length);
        draw('c-tiers', { type: 'doughnut', data: { labels: tiers, datasets: [{ data: tc, backgroundColor: ['#CBD5E1', '#94A3B8', '#F59E0B', '#8B5CF6', '#10B981', '#2563EB'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } } }, !tc.some(v => v));
    }

    // ---- lists ----
    const barTone = u => u >= CFG.FC_CAPACITY ? 'bg-red-500' : u >= CFG.FC_CAPACITY * 0.7 ? 'bg-amber-400' : 'bg-emerald-500';
    function renderSessions() {
        $('sessions').innerHTML = S.openDays(4).map(d => {
            const ds = S.ymd(d);
            return '<div class="space-y-2"><p class="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">' + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + '</p>' +
                CFG.FC_SESSIONS.map(s => {
                    const used = S.seatsUsed(ds, s), ins = S.instructorOf(ds, s);
                    return '<a href="admin-schedule.html" class="block group"><div class="flex items-center justify-between text-[11px] text-slate-600 mb-1"><span>' + esc(s.split(' – ')[0]) + ' &middot; ' + (ins ? '<strong class="text-slate-800">' + esc(ins.name) + '</strong>' : '<span class="text-amber-600 font-semibold">' + (used ? 'No instructor' : 'Unassigned') + '</span>') + '</span><strong class="text-slate-900">' + used + '/' + CFG.FC_CAPACITY + '</strong></div>' +
                        '<div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full ' + barTone(used) + '" style="width:' + Math.min(100, used / CFG.FC_CAPACITY * 100) + '%"></div></div></a>';
                }).join('') + '</div>';
        }).join('');
    }

    function renderAttention() {
        const c = S.counts(), now = Date.now();
        const dayOld = S.orders().filter(o => o.status === 'Pending Payment' && now - new Date(o.createdAt) > DAY).length;
        const items = [];
        if (c.admit) items.push(['fa-circle-check', 'bg-emerald-100 text-emerald-600', c.admit + ' paid deposit' + (c.admit > 1 ? 's' : '') + ' waiting for confirmation', 'Admit the student so they get a confirmed seat.', 'admin-bookings.html?status=confirm', 'Review']);
        if (c.unassigned) items.push(['fa-user-tie', 'bg-violet-100 text-violet-600', c.unassigned + ' session' + (c.unassigned > 1 ? 's' : '') + ' without an instructor', 'Students are booked but nobody is assigned to teach.', 'admin-schedule.html', 'Assign']);
        if (c.reschedule) items.push(['fa-rotate', 'bg-red-100 text-red-600', c.reschedule + ' booking' + (c.reschedule > 1 ? 's' : '') + ' flagged for reschedule', 'Contact the member to agree a new date.', 'admin-bookings.html?status=reschedule', 'Open']);
        if (c.ship) items.push(['fa-truck-fast', 'bg-blue-100 text-amberGold', c.ship + ' order' + (c.ship > 1 ? 's' : '') + ' ready to ship', 'Paid orders waiting for a tracking number.', 'admin-orders.html?status=Processing', 'Ship']);
        if (dayOld) items.push(['fa-hourglass-half', 'bg-amber-100 text-amber-600', dayOld + ' unpaid order' + (dayOld > 1 ? 's' : '') + ' older than a day', 'Follow up or cancel to keep the queue tidy.', 'admin-orders.html?status=Pending Payment', 'Check']);
        S.openDays(7).forEach(d => CFG.FC_SESSIONS.forEach(s => { if (S.seatsUsed(S.ymd(d), s) >= CFG.FC_CAPACITY) items.push(['fa-users-slash', 'bg-slate-100 text-slate-600', 'Session full: ' + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + s.split(' – ')[0], 'No seats left for this session.', 'admin-bookings.html?date=' + S.ymd(d) + '&session=' + encodeURIComponent(s), 'View']); }));
        $('attn-count').innerText = items.length ? items.length + ' item' + (items.length > 1 ? 's' : '') : '';
        $('attention').innerHTML = items.length ? items.slice(0, 6).map(i => '<a href="' + i[4] + '" class="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-200 hover:border-amberGold hover:bg-blue-50/40 transition-all"><span class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ' + i[1] + '"><i class="fa-solid ' + i[0] + '"></i></span><span class="flex-1 min-w-0"><strong class="block text-sm text-slate-900">' + i[2] + '</strong><span class="block text-[11px] text-slate-500">' + i[3] + '</span></span><span class="text-[11px] font-bold text-amberGold whitespace-nowrap">' + i[5] + ' <i class="fa-solid fa-arrow-right text-[9px]"></i></span></a>').join('')
            : '<div class="text-center py-10 space-y-2"><div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl"><i class="fa-solid fa-check"></i></div><p class="text-sm font-bold text-slate-900">All caught up</p><p class="text-xs text-slate-500">Nothing needs your action right now.</p></div>';
    }

    function renderActivity() {
        const ev = [];
        D.accounts.list().forEach(a => ev.push({ t: a.createdAt, icon: 'fa-user-plus', tone: 'bg-violet-100 text-violet-600', text: '<strong>' + esc(a.name) + '</strong> joined' }));
        S.regs().forEach(r => ev.push({ t: r.createdAt, icon: 'fa-calendar-plus', tone: 'bg-blue-100 text-amberGold', text: '<strong>' + esc(r.name) + '</strong> booked ' + S.fmtDate(r.preferredDate, { day: 'numeric', month: 'short' }) + ' (' + esc(r.session.split(' – ')[0]) + ')' }));
        S.enrolls().forEach(w => ev.push({ t: w.createdAt, icon: 'fa-chalkboard-user', tone: 'bg-violet-100 text-violet-600', text: '<strong>' + esc(w.name) + '</strong> enrolled in ' + esc(w.title) }));
        S.orders().forEach(o => ev.push({ t: o.createdAt, icon: 'fa-bag-shopping', tone: 'bg-amber-100 text-amber-600', text: '<strong>' + esc(o.name) + '</strong> placed order ' + esc(o.id) + ' (' + money(o.total) + ')' }));
        paidEvents().forEach(p => ev.push({ t: p.t, icon: 'fa-circle-check', tone: 'bg-emerald-100 text-emerald-600', text: 'Payment received: ' + money(p.amt) + ' <span class="text-slate-400">&middot; ' + esc(p.src) + '</span>' }));
        ev.sort((a, b) => (b.t || '').localeCompare(a.t || ''));
        $('activity').innerHTML = ev.length ? ev.slice(0, 8).map(e => '<div class="flex items-start gap-3"><span class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs ' + e.tone + '"><i class="fa-solid ' + e.icon + '"></i></span><div class="min-w-0"><p class="text-xs text-slate-700 leading-snug">' + e.text + '</p><p class="text-[10px] text-slate-400 mt-0.5">' + S.ago(e.t) + '</p></div></div>').join('')
            : '<p class="text-xs text-slate-500 py-6 text-center">Nothing yet. Activity shows up as members join, book, order and pay.</p>';
    }

    // ---- period controls ----
    function paintPeriod() {
        $('period-pills').innerHTML = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year'], ['custom', 'Custom']].map(p => '<button type="button" onclick="Dash.setPeriod(\'' + p[0] + '\')" class="px-4 py-2 rounded-full text-xs font-bold transition-all ' + (period === p[0] ? 'bg-amberGold text-white shadow' : 'text-slate-600 hover:text-amberGold') + '">' + p[1] + '</button>').join('');
        $('custom-range').classList.toggle('hidden', period !== 'custom');
    }
    function render() { const r = buildRange(); paintPeriod(); renderKpis(r); renderCharts(r); }
    window.Dash = {
        setPeriod(p) { period = p; if (p === 'custom' && !custom.from) { custom.to = D.dayOf(); custom.from = D.dayOf(new Date(Date.now() - 13 * DAY)); $('d-from').value = custom.from; $('d-to').value = custom.to; } render(); },
        applyCustom() { custom.from = $('d-from').value; custom.to = $('d-to').value; if (!custom.from || !custom.to) { S.toast('Choose both dates.'); return; } if (custom.to < custom.from) { S.toast('End date must be after the start date.'); return; } render(); }
    };

    window.addEventListener('admin-ready', () => {
        const a = S.admin() || {}, h = new Date().getHours();
        $('today').innerText = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        $('greet').innerText = (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening') + ', ' + (a.name || 'Admin');
        render(); renderAttention(); renderSessions(); renderActivity();
    });
})();
