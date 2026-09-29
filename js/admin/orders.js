/* Admin: shop orders (pack, ship, track). */
(function () {
    const S = AdminShell, D = NBCA_DATA, esc = S.esc, money = S.money, $ = id => document.getElementById(id);
    let statusF = UI.param('status') || 'all', shipId = null;
    const STATUS = { 'Pending Payment': 'warn', Processing: 'info', Shipped: 'info', Completed: 'good', Cancelled: 'muted' };
    const find = id => S.orders().find(o => o.id === id);
    const upd = (id, p) => { S.update(D.K.orders, id, p); render(); };

    function filtered() {
        const q = ($('q').value || '').toLowerCase().trim();
        return S.orders().filter(o => (statusF === 'all' || o.status === statusF) && (!q || [o.id, o.name, o.phone, o.email].some(v => (v || '').toLowerCase().includes(q)))).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    function render() {
        const all = S.orders(), paid = all.filter(o => o.paymentStatus === 'Paid' && o.status !== 'Cancelled');
        $('summary').innerHTML = [
            { icon: 'fa-bag-shopping', tone: 'blue', value: all.length, label: 'Total orders' }, { icon: 'fa-box', tone: 'amber', value: all.filter(o => o.status === 'Processing').length, label: 'To ship' },
            { icon: 'fa-truck', tone: 'violet', value: all.filter(o => o.status === 'Shipped').length, label: 'In transit' }, { icon: 'fa-wallet', tone: 'emerald', value: money(paid.reduce((a, o) => a + Number(o.total), 0)), label: 'Paid revenue' }
        ].map(UI.kpi).join('');
        $('chips').innerHTML = UI.chip('All', all.length, statusF === 'all', "Orders.status('all')") + Object.keys(STATUS).map(k => UI.chip(k, all.filter(o => o.status === k).length, statusF === k, "Orders.status('" + k + "')")).join('');
        const rows = filtered();
        $('list').innerHTML = rows.length ? rows.map(card).join('') : UI.empty('fa-bag-shopping', all.length ? 'No orders match' : 'No orders yet', all.length ? 'Try another status or search.' : 'Orders show up here when members check out from the shop.');
    }
    function card(o) {
        const paid = o.paymentStatus === 'Paid', actions = [];
        if (o.status === 'Pending Payment') { actions.push(UI.btn('<i class="fa-solid fa-check mr-1.5"></i>Mark as paid', "Orders.markPaid('" + o.id + "')", 'good')); actions.push(UI.btn('Cancel order', "Orders.cancel('" + o.id + "')", 'danger')); }
        if (o.status === 'Processing') { actions.push(UI.btn('<i class="fa-solid fa-truck-fast mr-1.5"></i>Add tracking &amp; ship', "Orders.openShip('" + o.id + "')", 'primary')); actions.push(UI.btn('Cancel order', "Orders.cancel('" + o.id + "')", 'danger')); }
        if (o.status === 'Shipped') actions.push(UI.btn('<i class="fa-solid fa-flag-checkered mr-1.5"></i>Mark completed', "Orders.complete('" + o.id + "')", 'good'));
        const wa = S.waLink(o.phone, 'Hi ' + o.name + ', regarding your Nb.CA Academy order ' + o.id + '. ');
        const items = (o.items || []).map(i => '<div class="flex items-center gap-3"><img src="' + esc(i.image) + '" alt="" class="w-11 h-11 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"><span class="flex-1 min-w-0 text-xs text-slate-700 truncate">' + esc(i.name) + '</span><span class="text-xs text-slate-500">x' + i.qty + '</span><span class="text-xs font-bold text-slate-900 w-20 text-right">' + money(i.price * i.qty) + '</span></div>').join('');
        return '<article class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all space-y-4"><div class="flex flex-wrap items-center gap-2"><strong class="font-serif text-lg text-slate-900">' + esc(o.id) + '</strong>' + UI.pill(o.status, STATUS[o.status] || 'muted') + UI.pill(paid ? 'Paid' : 'Unpaid', paid ? 'good' : 'warn') + (o.voucher ? UI.pill('Voucher ' + o.voucher.code, 'info') : '') + '<span class="ml-auto text-[11px] text-slate-500">' + S.fmtDate(o.createdAt) + '</span></div>' +
            '<div class="grid lg:grid-cols-5 gap-5"><div class="lg:col-span-3 space-y-2">' + items + '<div class="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100"><span>Shipping</span><span>' + money(o.shipping) + '</span></div>' + (o.discount ? '<div class="flex justify-between text-[11px] text-emerald-600 font-semibold"><span>Voucher ' + esc(o.voucher ? o.voucher.code : '') + '</span><span>&minus;' + money(o.discount) + '</span></div>' : '') + '<div class="flex justify-between text-sm font-bold text-slate-900"><span>Total</span><span class="text-amberGold">' + money(o.total) + '</span></div></div>' +
            '<div class="lg:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5 text-xs"><div class="font-bold text-slate-900">' + esc(o.name) + '</div><div class="text-slate-600"><i class="fa-solid fa-phone text-slate-400 mr-1.5"></i>' + esc(o.phone) + '</div><div class="text-slate-600 leading-relaxed"><i class="fa-solid fa-location-dot text-slate-400 mr-1.5"></i>' + esc(o.address) + '</div>' + (o.tracking ? '<div class="pt-2 mt-2 border-t border-slate-200 text-slate-700"><i class="fa-solid fa-truck text-amberGold mr-1.5"></i>' + esc(o.tracking.courier) + ': <strong class="font-mono">' + esc(o.tracking.number) + '</strong></div>' : '') + '</div></div>' +
            '<div class="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">' + actions.join('') + '<span class="ml-auto flex flex-wrap gap-2">' + UI.btn('<i class="fa-solid fa-copy mr-1.5"></i>Copy address', "Orders.copyAddr('" + o.id + "')", 'ghost') + UI.btn('<i class="fa-solid fa-print mr-1.5"></i>Print', 'window.print()', 'ghost') + (wa ? '<a href="' + wa + '" target="_blank" rel="noopener" class="px-3.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"><i class="fa-brands fa-whatsapp mr-1.5"></i>WhatsApp</a>' : '') + '</span></div></article>';
    }
    window.Orders = {
        render, status(k) { statusF = k; render(); },
        async markPaid(id) { const o = find(id); if (await UI.confirm({ title: 'Mark order as paid?', message: 'Use this only if you received ' + money(o.total) + ' from ' + o.name + ' outside the gateway. The order moves to Processing.', ok: 'Mark as paid' })) { upd(id, { paymentStatus: 'Paid', status: 'Processing', paidAt: new Date().toISOString() }); S.toast('Order marked as paid.'); } },
        async cancel(id) { const o = find(id); if (await UI.confirm({ title: 'Cancel order ' + id + '?', message: 'This cancels the order for ' + o.name + '. If it was paid, refund it separately.' + (o.voucher ? ' The voucher ' + o.voucher.code + ' will be returned.' : ''), ok: 'Cancel order', danger: true })) { if (o.voucher) D.loyalty.restore(o.voucher.code); upd(id, { status: 'Cancelled' }); S.toast('Order cancelled.'); } },
        async openShip(id) {
            shipId = id;
            const v = await UI.form({ title: 'Ship order ' + id, submit: 'Mark as shipped', fields: [{ id: 'courier', label: 'Courier', type: 'select', options: ['Pos Laju', 'J&T Express', 'Ninja Van', 'DHL eCommerce', 'GDex', 'City-Link'] }, { id: 'number', label: 'Tracking number', required: true, placeholder: 'e.g. EP123456789MY' }] });
            if (v) { upd(id, { status: 'Shipped', tracking: { courier: v.courier, number: v.number }, shippedAt: new Date().toISOString() }); S.toast('Order marked as shipped.'); }
        },
        complete(id) { upd(id, { status: 'Completed', completedAt: new Date().toISOString() }); S.toast('Order completed.'); },
        copyAddr(id) { const o = find(id), txt = o.name + '\n' + o.phone + '\n' + o.address; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => S.toast('Address copied.'), () => window.prompt('Copy this:', txt)); },
        exportCsv() { const rows = filtered(); if (!rows.length) { S.toast('Nothing to export.'); return; } S.downloadCsv('orders.csv', [['Order', 'Date', 'Customer', 'Phone', 'Email', 'Address', 'Items', 'Discount', 'Total', 'Payment', 'Status', 'Courier', 'Tracking']].concat(rows.map(o => [o.id, o.createdAt, o.name, o.phone, o.email, o.address, (o.items || []).map(i => i.qty + 'x ' + i.name).join('; '), o.discount || 0, o.total, o.paymentStatus, o.status, o.tracking ? o.tracking.courier : '', o.tracking ? o.tracking.number : ''])) ); }
    };
    window.addEventListener('admin-ready', render);
})();
