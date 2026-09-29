/* Admin: daily class bookings (list + capacity calendar). */
(function () {
    const S = AdminShell, D = NBCA_DATA, CFG = S.CFG, esc = S.esc, money = S.money, $ = id => document.getElementById(id);
    let statusF = UI.param('status') || 'all', view = UI.param('view') === 'capacity' ? 'capacity' : 'list';
    let slot = UI.param('date') ? { date: UI.param('date'), session: UI.param('session') || '' } : null;

    const STATUS = { awaiting: ['Awaiting payment', 'warn'], confirm: ['Needs confirmation', 'info'], admitted: ['Admitted', 'good'], reschedule: ['Reschedule', 'bad'], cancelled: ['Cancelled', 'muted'] };
    const statusOf = r => r.classStatus === 'Cancelled' ? 'cancelled' : r.classStatus === 'Reschedule' ? 'reschedule' : r.classStatus === 'Admitted' ? 'admitted' : r.depositStatus === 'Paid' ? 'confirm' : 'awaiting';
    const todayStr = D.dayOf();
    const find = id => S.regs().find(r => r.id === id);
    const upd = (id, patch) => { S.update(D.K.regs, id, patch); render(); };

    function filtered() {
        const q = ($('q').value || '').toLowerCase().trim(), scope = $('scope').value;
        return S.regs().filter(r => {
            if (statusF !== 'all' && statusOf(r) !== statusF) return false;
            if (slot) { if (r.preferredDate !== slot.date || (slot.session && r.session !== slot.session)) return false; }
            else if (scope === 'upcoming' && r.preferredDate < todayStr) return false;
            else if (scope === 'past' && r.preferredDate >= todayStr) return false;
            return !q || [r.name, r.ic, r.phone, r.email, r.cafe, r.from].some(v => (v || '').toLowerCase().includes(q));
        }).sort((a, b) => $('scope').value === 'past' ? b.preferredDate.localeCompare(a.preferredDate) : a.preferredDate.localeCompare(b.preferredDate) || a.session.localeCompare(b.session));
    }

    function renderChips() {
        const all = S.regs(), cnt = k => all.filter(r => statusOf(r) === k).length;
        $('chips').innerHTML = UI.chip('All', all.length, statusF === 'all', "Bookings.status('all')") + Object.keys(STATUS).map(k => UI.chip(STATUS[k][0], cnt(k), statusF === k, "Bookings.status('" + k + "')")).join('');
        $('view-switch').innerHTML = [['list', 'fa-list', 'List'], ['capacity', 'fa-table-cells', 'Capacity']].map(v => '<button type="button" onclick="Bookings.setView(\'' + v[0] + '\')" class="px-4 py-2 rounded-full transition-all ' + (view === v[0] ? 'bg-amberGold text-white shadow' : 'text-slate-600 hover:text-amberGold') + '"><i class="fa-solid ' + v[1] + ' mr-1.5"></i>' + v[2] + '</button>').join('');
        const a = $('active-slot');
        if (slot) { a.classList.remove('hidden'); a.innerHTML = '<span class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-amberGold"><i class="fa-solid fa-filter"></i>' + S.fmtDate(slot.date, { weekday: 'short', day: 'numeric', month: 'short' }) + (slot.session ? ' &middot; ' + esc(slot.session) : '') + '<button type="button" onclick="Bookings.clearSlot()" class="ml-1 text-slate-500 hover:text-red-600" aria-label="Clear filter"><i class="fa-solid fa-xmark"></i></button></span>'; }
        else a.classList.add('hidden');
    }

    function card(r) {
        const st = statusOf(r), paid = r.depositStatus === 'Paid', ins = S.instructorOf(r.preferredDate, r.session);
        const wa = S.waLink(r.phone, 'Hi ' + r.name + ', regarding your Nb.CA Academy class on ' + r.preferredDate + ' (' + r.session + '). ');
        const actions = [];
        if (st === 'confirm') actions.push(UI.btn('<i class="fa-solid fa-check mr-1.5"></i>Admit', "Bookings.admit('" + r.id + "')", 'good'));
        if (!paid && st !== 'cancelled') actions.push(UI.btn('Mark deposit paid', "Bookings.markPaid('" + r.id + "')", 'primary'));
        if (st !== 'cancelled' && st !== 'reschedule') actions.push(UI.btn('Reschedule', "Bookings.reschedule('" + r.id + "')", 'ghost'));
        if (st === 'reschedule' || st === 'cancelled') actions.push(UI.btn('Reopen', "Bookings.reopen('" + r.id + "')", 'ghost'));
        if (st !== 'cancelled') actions.push(UI.btn('Cancel', "Bookings.cancel('" + r.id + "')", 'danger'));
        return '<article class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all"><div class="flex flex-col lg:flex-row lg:items-start gap-5">' +
            '<div class="flex items-start gap-4 flex-1 min-w-0">' + UI.avatar(r.name) + '<div class="min-w-0 space-y-1.5"><div class="flex flex-wrap items-center gap-2"><strong class="text-slate-900 text-base">' + esc(r.name) + '</strong>' + UI.pill(STATUS[st][0], STATUS[st][1]) + UI.pill(paid ? 'Deposit paid' : 'Deposit unpaid', paid ? 'good' : 'warn') + (r.voucher ? UI.pill('Voucher ' + r.voucher.code, 'info') : '') + '</div>' +
            '<div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span><i class="fa-solid fa-id-card mr-1.5 text-slate-400"></i>' + esc(r.ic || '-') + '</span><span><i class="fa-solid fa-phone mr-1.5 text-slate-400"></i>' + esc(r.phone || '-') + '</span><span><i class="fa-solid fa-envelope mr-1.5 text-slate-400"></i>' + esc(r.email) + '</span>' + (r.from ? '<span><i class="fa-solid fa-location-dot mr-1.5 text-slate-400"></i>' + esc(r.from) + '</span>' : '') + (r.cafe ? '<span><i class="fa-solid fa-mug-hot mr-1.5 text-slate-400"></i>' + esc(r.cafe) + '</span>' : '') + '</div></div></div>' +
            '<div class="lg:w-72 shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1 text-xs"><div class="flex items-center gap-2 font-bold text-slate-900"><i class="fa-solid fa-calendar-day text-amberGold"></i>' + S.fmtDate(r.preferredDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + '</div><div class="text-slate-600"><i class="fa-solid fa-clock text-slate-400 mr-1.5"></i>' + esc(r.session) + '</div>' +
            '<div class="text-slate-600"><i class="fa-solid fa-user-tie text-slate-400 mr-1.5"></i>' + (ins ? esc(ins.name) : '<a href="admin-schedule.html" class="text-amber-600 font-semibold hover:underline">No instructor assigned</a>') + '</div>' +
            '<div class="text-slate-500 pt-1 border-t border-slate-200 mt-2">Deposit ' + money(r.deposit) + ' of ' + money(r.classFee) + '</div></div></div>' +
            '<div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">' + actions.join('') + '<span class="ml-auto flex flex-wrap gap-2">' + UI.btn('<i class="fa-solid fa-copy mr-1.5"></i>Copy name &amp; IC', "Bookings.copyId('" + r.id + "')", 'ghost') + (wa ? '<a href="' + wa + '" target="_blank" rel="noopener" class="px-3.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"><i class="fa-brands fa-whatsapp mr-1.5"></i>WhatsApp</a>' : '') + '</span></div></article>';
    }

    function renderCapacity() {
        const days = S.openDays(15);
        const tone = u => u >= CFG.FC_CAPACITY ? 'bg-red-50 border-red-300 text-red-700' : u >= CFG.FC_CAPACITY * 0.7 ? 'bg-amber-50 border-amber-300 text-amber-700' : u > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-500';
        $('capacity').innerHTML = '<div class="flex flex-wrap gap-4 text-[11px] text-slate-600"><span><span class="inline-block w-3 h-3 rounded bg-emerald-500 mr-1.5 align-middle"></span>Seats available</span><span><span class="inline-block w-3 h-3 rounded bg-amber-400 mr-1.5 align-middle"></span>Filling up</span><span><span class="inline-block w-3 h-3 rounded bg-red-500 mr-1.5 align-middle"></span>Full (' + CFG.FC_CAPACITY + ' seats)</span><span class="text-slate-400">Tap a cell to see its students.</span></div>' +
            '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">' + days.map(x => { const ds = S.ymd(x); return '<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"><p class="text-xs font-extrabold text-slate-900 uppercase tracking-wide">' + x.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) + '</p><div class="grid grid-cols-2 gap-2">' +
                CFG.FC_SESSIONS.map(s => { const u = S.seatsUsed(ds, s), ins = S.instructorOf(ds, s); return '<button type="button" onclick="Bookings.openSlot(\'' + ds + '\', \'' + s + '\')" class="rounded-xl border p-3 text-left hover:shadow-md transition-all ' + tone(u) + '"><span class="block text-[10px] font-bold uppercase opacity-80">' + esc(s.split(' – ')[0]) + '</span><strong class="block text-lg font-serif">' + u + '<span class="text-xs font-sans opacity-60">/' + CFG.FC_CAPACITY + '</span></strong><span class="block text-[10px] mt-0.5 truncate ' + (ins ? 'opacity-80' : 'text-amber-600 font-semibold') + '"><i class="fa-solid fa-user-tie mr-1"></i>' + (ins ? esc(ins.name) : (u ? 'No instructor' : '—')) + '</span></button>'; }).join('') + '</div></div>'; }).join('') + '</div>';
    }

    function render() {
        renderChips();
        $('search-row').classList.toggle('hidden', view === 'capacity');
        $('list').classList.toggle('hidden', view !== 'list'); $('capacity').classList.toggle('hidden', view !== 'capacity');
        if (view === 'capacity') { renderCapacity(); return; }
        const rows = filtered();
        $('list').innerHTML = rows.length ? rows.map(card).join('') : UI.empty('fa-calendar-xmark', S.regs().length ? 'No bookings match' : 'No bookings yet', S.regs().length ? 'Try another status, date range or search.' : 'Bookings appear here as soon as a member registers for the daily class.');
    }

    window.Bookings = {
        render, status(k) { statusF = k; render(); }, setView(v) { view = v; render(); }, clearSlot() { slot = null; render(); },
        openSlot(date, session) { slot = { date, session }; statusF = 'all'; view = 'list'; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        admit(id) { const r = find(id); if (r.depositStatus !== 'Paid') { S.toast('Deposit is not paid yet.'); return; } upd(id, { classStatus: 'Admitted', admittedAt: new Date().toISOString() }); S.toast(r.name + ' admitted.'); },
        async markPaid(id) {
            const r = find(id);
            if (await UI.confirm({ title: 'Mark deposit as paid?', message: 'Use this only if you received ' + money(r.deposit) + ' from ' + r.name + ' outside the gateway (e.g. bank transfer).', ok: 'Mark as paid' })) { upd(id, { depositStatus: 'Paid', paidAt: new Date().toISOString(), classStatus: r.classStatus === 'Awaiting Payment' ? 'Pending Confirmation' : r.classStatus }); S.toast('Deposit marked as paid.'); }
        },
        async reschedule(id) {
            const r = find(id);
            if (await UI.confirm({ title: 'Ask ' + r.name + ' to reschedule?', message: 'The seat is released for this session and WhatsApp opens so you can agree a new date.', ok: 'Reschedule' })) {
                upd(id, { classStatus: 'Reschedule' });
                const wa = S.waLink(r.phone, 'Hi ' + r.name + ', regarding your Nb.CA Academy class on ' + r.preferredDate + ' (' + r.session + '): we need to reschedule. Which other date works for you?');
                if (wa) window.open(wa, '_blank', 'noopener');
                S.toast('Marked for reschedule.');
            }
        },
        reopen(id) { const r = find(id); upd(id, { classStatus: r.depositStatus === 'Paid' ? 'Pending Confirmation' : 'Awaiting Payment', createdAt: r.depositStatus === 'Paid' ? r.createdAt : new Date().toISOString() }); S.toast('Booking reopened.'); },
        async cancel(id) {
            const r = find(id);
            if (await UI.confirm({ title: 'Cancel this booking?', message: r.name + "'s booking on " + r.preferredDate + ' will be cancelled and the seat released. Any refund must be handled separately.' + (r.voucher ? ' The voucher ' + r.voucher.code + ' will be returned to the member.' : ''), ok: 'Cancel booking', danger: true })) {
                if (r.voucher) D.loyalty.restore(r.voucher.code);
                upd(id, { classStatus: 'Cancelled' }); S.toast('Booking cancelled.');
            }
        },
        copyId(id) { const r = find(id), txt = r.name + ' - ' + (r.ic || ''); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => S.toast('Copied: ' + txt), () => window.prompt('Copy this:', txt)); },
        exportCsv(certificates) {
            if (certificates) {
                const rows = S.regs().filter(r => r.classStatus === 'Admitted').sort((a, b) => a.preferredDate.localeCompare(b.preferredDate));
                if (!rows.length) { S.toast('No admitted students to export yet.'); return; }
                S.downloadCsv('certificate-list.csv', [['Name', 'IC / Passport', 'Class date', 'Session', 'Instructor']].concat(rows.map(r => [r.name, r.ic, r.preferredDate, r.session, (S.instructorOf(r.preferredDate, r.session) || {}).name || ''])));
            } else {
                const rows = filtered(); if (!rows.length) { S.toast('Nothing to export for this filter.'); return; }
                S.downloadCsv('class-bookings.csv', [['Name', 'IC / Passport', 'Phone', 'Email', 'Cafe', 'From', 'Date', 'Session', 'Instructor', 'Deposit', 'Deposit status', 'Status']].concat(rows.map(r => [r.name, r.ic, r.phone, r.email, r.cafe, r.from, r.preferredDate, r.session, (S.instructorOf(r.preferredDate, r.session) || {}).name || '', r.deposit, r.depositStatus, STATUS[statusOf(r)][0]])));
            }
        }
    };
    window.addEventListener('admin-ready', () => { if (slot) $('scope').value = 'all'; render(); });
})();
