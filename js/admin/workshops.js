/* Admin: workshop enrollments. */
(function () {
    const S = AdminShell, D = NBCA_DATA, esc = S.esc, money = S.money, $ = id => document.getElementById(id);
    let statusF = UI.param('status') || 'all';
    const STATUS = { 'Pending Payment': ['Pending payment', 'warn'], Confirmed: ['Confirmed', 'good'], Cancelled: ['Cancelled', 'muted'] };
    const find = id => S.enrolls().find(w => w.id === id);
    const upd = (id, p) => { S.update(D.K.enrolls, id, p); render(); };

    function filtered() {
        const q = ($('q').value || '').toLowerCase().trim(), ws = $('ws').value;
        return S.enrolls().filter(w => (statusF === 'all' || w.status === statusF) && (!ws || w.title === ws) && (!q || [w.name, w.email, w.ref, w.title].some(v => (v || '').toLowerCase().includes(q)))).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    function render() {
        const all = S.enrolls(), confirmed = all.filter(w => w.status === 'Confirmed');
        $('summary').innerHTML = [
            { icon: 'fa-ticket', tone: 'blue', value: all.length, label: 'Total enrollments' }, { icon: 'fa-circle-check', tone: 'emerald', value: confirmed.length, label: 'Confirmed' },
            { icon: 'fa-hourglass-half', tone: 'amber', value: all.filter(w => w.status === 'Pending Payment').length, label: 'Awaiting payment' }, { icon: 'fa-wallet', tone: 'violet', value: money(confirmed.reduce((a, w) => a + Number(w.price), 0)), label: 'Confirmed revenue' }
        ].map(UI.kpi).join('');
        $('chips').innerHTML = UI.chip('All', all.length, statusF === 'all', "Workshops.status('all')") + Object.keys(STATUS).map(k => UI.chip(STATUS[k][0], all.filter(w => w.status === k).length, statusF === k, "Workshops.status('" + k + "')")).join('');
        const sel = $('ws'), cur = sel.value;
        sel.innerHTML = '<option value="">All workshops</option>' + [...new Set(all.map(w => w.title))].map(t => '<option ' + (t === cur ? 'selected' : '') + '>' + esc(t) + '</option>').join('');
        const rows = filtered();
        $('list').innerHTML = rows.length ? rows.map(card).join('') : UI.empty('fa-chalkboard-user', all.length ? 'No enrollments match' : 'No enrollments yet', all.length ? 'Try a different status, workshop or search.' : 'Enrollments appear here when members sign up for a workshop.');
    }
    function card(w) {
        const l = STATUS[w.status] || [w.status, 'muted'], ins = D.assign.get(D.assign.wsKey(w.workshopId, w.slot)), actions = [];
        if (w.status === 'Pending Payment') actions.push(UI.btn('<i class="fa-solid fa-check mr-1.5"></i>Mark paid &amp; confirm', "Workshops.confirmPaid('" + w.id + "')", 'good'));
        if (w.status !== 'Cancelled') actions.push(UI.btn('Cancel', "Workshops.cancel('" + w.id + "')", 'danger')); else actions.push(UI.btn('Reopen', "Workshops.reopen('" + w.id + "')", 'ghost'));
        return '<article class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all"><div class="flex flex-col lg:flex-row lg:items-start gap-5">' +
            '<div class="flex items-start gap-4 flex-1 min-w-0">' + UI.avatar(w.name) + '<div class="min-w-0 space-y-1.5"><div class="flex flex-wrap items-center gap-2"><strong class="text-slate-900 text-base">' + esc(w.name) + '</strong>' + UI.pill(l[0], l[1]) + (w.voucher ? UI.pill('Voucher ' + w.voucher.code, 'info') : '') + '</div><p class="text-[11px] text-slate-500"><i class="fa-solid fa-envelope mr-1.5 text-slate-400"></i>' + esc(w.email) + ' &middot; Ref <span class="font-mono font-bold text-slate-700">' + esc(w.ref) + '</span></p></div></div>' +
            '<div class="lg:w-80 shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1 text-xs"><div class="font-bold text-slate-900">' + esc(w.title) + '</div><div class="text-slate-600"><i class="fa-solid fa-calendar-day text-amberGold mr-1.5"></i>' + esc(w.slot) + '</div><div class="text-slate-600"><i class="fa-solid fa-location-dot text-slate-400 mr-1.5"></i>' + esc(w.modeLabel) + '</div>' +
            '<div class="text-slate-600"><i class="fa-solid fa-user-tie text-slate-400 mr-1.5"></i>' + (ins ? esc(ins.name) : '<a href="admin-schedule.html" class="text-amber-600 font-semibold hover:underline">No instructor assigned</a>') + '</div><div class="pt-1 mt-2 border-t border-slate-200 font-bold text-amberGold">' + money(w.price) + (w.discount ? ' <span class="font-normal text-slate-400 line-through">' + money(w.listPrice) + '</span>' : '') + '</div></div></div>' +
            '<div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">' + actions.join('') + '</div></article>';
    }
    window.Workshops = {
        render, status(k) { statusF = k; render(); },
        async confirmPaid(id) { const w = find(id); if (await UI.confirm({ title: 'Mark as paid and confirm?', message: 'Use this only if ' + w.name + ' paid ' + money(w.price) + ' outside the gateway. Their e-ticket becomes available.', ok: 'Confirm' })) { upd(id, { status: 'Confirmed', paymentStatus: 'Paid', paidAt: new Date().toISOString() }); S.toast('Enrollment confirmed.'); } },
        async cancel(id) { const w = find(id); if (await UI.confirm({ title: 'Cancel this enrollment?', message: w.name + ' will lose their ticket for ' + w.title + '. Any refund must be handled separately.' + (w.voucher ? ' The voucher ' + w.voucher.code + ' will be returned.' : ''), ok: 'Cancel enrollment', danger: true })) { if (w.voucher) D.loyalty.restore(w.voucher.code); upd(id, { status: 'Cancelled' }); S.toast('Enrollment cancelled.'); } },
        reopen(id) { const w = find(id); upd(id, { status: w.paymentStatus === 'Paid' ? 'Confirmed' : 'Pending Payment' }); S.toast('Enrollment reopened.'); },
        exportCsv() { const rows = filtered(); if (!rows.length) { S.toast('Nothing to export.'); return; } S.downloadCsv('workshop-enrollments.csv', [['Name', 'Email', 'Workshop', 'Slot', 'Mode', 'Instructor', 'Price', 'Status', 'Ref']].concat(rows.map(w => [w.name, w.email, w.title, w.slot, w.modeLabel, (D.assign.get(D.assign.wsKey(w.workshopId, w.slot)) || {}).name || '', w.price, w.status, w.ref]))); }
    };
    window.addEventListener('admin-ready', render);
})();
