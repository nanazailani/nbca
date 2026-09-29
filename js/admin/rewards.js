/* Admin: membership & rewards (earn rules, tiers, vouchers, redemptions, manual point adjustments). */
(function () {
    const S = AdminShell, D = NBCA_DATA, L = D.loyalty, esc = S.esc, $ = id => document.getElementById(id);
    let tab = UI.param('tab') || 'program', q = '';
    const TABS = [['program', 'Program', 'fa-sliders'], ['vouchers', 'Vouchers', 'fa-ticket'], ['redemptions', 'Redemptions', 'fa-receipt'], ['points', 'Points ledger', 'fa-star']];
    const TYPE = { amount: 'RM off', shipping: 'Free delivery', percent: '% off' };
    const label = v => v.type === 'amount' ? 'RM ' + v.value + ' off' : v.type === 'shipping' ? 'Free delivery' : v.value + '% off';
    const SCOPE = { shop: 'Shop orders', class: 'Classes & workshops' };
    const nameOf = email => (D.accounts.get(email) || {}).name || email;
    const fmt = n => Number(n).toLocaleString('en-MY');

    // ---------- Program ----------
    function programHtml() {
        const S0 = L.settings(), led = L.sync(), members = S.members();
        const issued = led.filter(r => r.points > 0 && ['earn', 'welcome', 'adjust'].includes(r.type)).reduce((a, r) => a + r.points, 0);
        const spent = -led.filter(r => r.type === 'redeem').reduce((a, r) => a + r.points, 0) + led.filter(r => r.type === 'refund').reduce((a, r) => a + r.points, 0);
        const outstanding = members.reduce((a, m) => a + m.points, 0);
        const kpis = [
            { icon: 'fa-coins', tone: 'amber', value: fmt(issued), label: 'Points issued' }, { icon: 'fa-gift', tone: 'violet', value: fmt(spent), label: 'Points redeemed' },
            { icon: 'fa-wallet', tone: 'blue', value: fmt(outstanding), label: 'Outstanding balance', sub: 'Owed to members as rewards' }, { icon: 'fa-ticket', tone: 'emerald', value: L.redemptions().filter(r => r.status !== 'Cancelled').length, label: 'Vouchers redeemed' }
        ].map(UI.kpi).join('');
        const tierRows = S0.tiers.slice().sort((a, b) => a.min - b.min).map((t, i) => '<div class="flex items-center justify-between gap-3 py-3 ' + (i ? 'border-t border-slate-100' : '') + '"><div class="flex items-center gap-3"><span class="w-9 h-9 rounded-full bg-blue-100 text-amberGold font-extrabold text-xs flex items-center justify-center">' + (i + 1) + '</span><div><p class="text-sm font-bold text-slate-900">' + esc(t.name) + '</p><p class="text-[11px] text-slate-500">' + (t.min === 0 ? 'Starting tier' : fmt(t.min) + ' lifetime points') + '</p></div></div><span class="text-xs font-bold text-slate-600">' + members.filter(m => m.tier === t.name).length + ' member' + (members.filter(m => m.tier === t.name).length === 1 ? '' : 's') + '</span></div>').join('');
        return '<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">' + kpis + '</div>' +
            '<div class="grid lg:grid-cols-2 gap-6"><section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4"><div class="flex items-center justify-between"><h3 class="font-serif text-lg font-bold text-slate-900">Earning rules</h3>' + UI.btn('<i class="fa-solid fa-pen mr-1.5"></i>Edit', 'Rewards.editRules()', 'ghost') + '</div>' +
            '<div class="grid grid-cols-2 gap-3"><div class="rounded-2xl bg-slate-50 border border-slate-200 p-4"><p class="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Earn rate</p><p class="text-2xl font-serif font-extrabold text-amberGold mt-1">' + S0.earnPerRM + '<span class="text-xs font-sans font-semibold text-slate-500"> pt per RM1</span></p></div><div class="rounded-2xl bg-slate-50 border border-slate-200 p-4"><p class="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Welcome bonus</p><p class="text-2xl font-serif font-extrabold text-amberGold mt-1">' + fmt(S0.welcomeBonus) + '<span class="text-xs font-sans font-semibold text-slate-500"> pts</span></p></div></div>' +
            '<p class="text-[11px] text-slate-500 leading-relaxed">Members earn on what they actually pay for classes, workshops and shop orders (after vouchers, excluding shipping). Changing a rule only affects points earned from now on; existing points keep their value.</p></section>' +
            '<section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6"><div class="flex items-center justify-between mb-2"><h3 class="font-serif text-lg font-bold text-slate-900">Tiers</h3>' + UI.btn('<i class="fa-solid fa-pen mr-1.5"></i>Edit', 'Rewards.editTiers()', 'ghost') + '</div><p class="text-[11px] text-slate-500 mb-1">Tiers are based on lifetime points, so spending points never lowers a member\'s tier.</p>' + tierRows + '</section></div>';
    }

    // ---------- Vouchers ----------
    function vouchersHtml() {
        const list = L.vouchers();
        const head = '<div class="flex justify-end">' + UI.btn('<i class="fa-solid fa-plus mr-1.5"></i>New voucher', 'Rewards.editVoucher()', 'primary') + '</div>';
        if (!list.length) return head + UI.empty('fa-ticket', 'No vouchers yet', 'Create rewards that members can redeem with their points.');
        return head + '<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">' + list.map(v => {
            const used = L.redeemedCount(v.id), left = L.remaining(v);
            return '<article class="bg-white rounded-3xl border ' + (v.active ? 'border-slate-200' : 'border-slate-200 opacity-70') + ' shadow-sm p-5 space-y-4"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><div class="flex items-center gap-2 flex-wrap mb-1">' + UI.pill(label(v), 'info') + UI.pill(v.active ? 'Active' : 'Hidden', v.active ? 'good' : 'muted') + '</div><h4 class="font-serif font-bold text-slate-900">' + esc(v.title) + '</h4><p class="text-[11px] text-slate-500 mt-1">' + esc(v.description || '') + '</p></div></div>' +
                '<div class="grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-slate-50 py-2"><p class="text-sm font-extrabold text-amberGold">' + fmt(v.cost) + '</p><p class="text-[10px] text-slate-500 font-semibold">Points</p></div><div class="rounded-xl bg-slate-50 py-2"><p class="text-sm font-extrabold text-slate-900">' + used + '</p><p class="text-[10px] text-slate-500 font-semibold">Redeemed</p></div><div class="rounded-xl bg-slate-50 py-2"><p class="text-sm font-extrabold text-slate-900">' + (left === Infinity ? '∞' : left) + '</p><p class="text-[10px] text-slate-500 font-semibold">Left</p></div></div>' +
                '<p class="text-[11px] text-slate-500"><i class="fa-solid fa-circle-info mr-1"></i>For ' + SCOPE[v.scope] + '</p>' +
                '<div class="flex items-center gap-2 pt-3 border-t border-slate-100"><span class="flex gap-1.5 ml-auto">' + UI.iconBtn('fa-pen', 'Edit', "Rewards.editVoucher('" + v.id + "')") + UI.iconBtn(v.active ? 'fa-eye-slash' : 'fa-eye', v.active ? 'Hide from members' : 'Show to members', "Rewards.toggleVoucher('" + v.id + "')") + UI.iconBtn('fa-trash', 'Delete', "Rewards.deleteVoucher('" + v.id + "')", true) + '</span></div></article>';
        }).join('') + '</div>';
    }

    // ---------- Redemptions ----------
    function redemptionsHtml() {
        const all = L.redemptions().slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        const rows = all.filter(r => !q || [r.code, r.email, r.title, nameOf(r.email)].some(v => (v || '').toLowerCase().includes(q.toLowerCase())));
        const search = '<div class="relative"><i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i><input value="' + esc(q) + '" oninput="Rewards.search(this.value)" placeholder="Search code, member or voucher" class="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-amberGold"></div>';
        if (!all.length) return UI.empty('fa-receipt', 'No redemptions yet', 'When members redeem a reward it shows up here with its code.');
        return search + '<div class="space-y-3">' + (rows.length ? rows.map(r => {
            const tone = { Available: 'good', Used: 'muted', Cancelled: 'bad' }[r.status];
            const acts = r.status === 'Available' ? UI.btn('Mark used', "Rewards.markUsed('" + r.code + "')", 'ghost') + UI.btn('Cancel &amp; refund', "Rewards.cancelRedemption('" + r.id + "')", 'danger') : '';
            return '<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><span class="font-mono font-bold text-slate-900">' + esc(r.code) + '</span>' + UI.pill(r.status, tone) + '</div><p class="text-xs text-slate-600 mt-1"><strong>' + esc(r.title) + '</strong> &middot; ' + esc(nameOf(r.email)) + ' &middot; ' + fmt(r.cost) + ' pts</p><p class="text-[11px] text-slate-400">Redeemed ' + S.fmtDateTime(r.createdAt) + (r.usedOn ? ' &middot; used on ' + esc(r.usedOn) : '') + '</p></div><div class="flex gap-2">' + acts + '</div></div>';
        }).join('') : '<p class="text-xs text-slate-500 text-center py-6">No matches.</p>') + '</div>';
    }

    // ---------- Ledger ----------
    function pointsHtml() {
        const led = L.sync().slice().sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 60);
        const TONES = { earn: 'good', welcome: 'info', adjust: 'warn', redeem: 'bad', refund: 'info', reversal: 'muted' };
        return '<div class="flex justify-end">' + UI.btn('<i class="fa-solid fa-star mr-1.5"></i>Adjust a member\'s points', 'Rewards.adjust()', 'primary') + '</div>' +
            (led.length ? '<div class="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100">' + led.map(r => '<div class="flex items-center gap-3 px-5 py-3.5"><div class="min-w-0 flex-1"><p class="text-sm font-bold text-slate-900 truncate">' + esc(nameOf(r.email)) + ' <span class="font-normal text-slate-500">&middot; ' + esc(r.reason) + '</span></p><p class="text-[11px] text-slate-400">' + S.fmtDateTime(r.at) + (r.by ? ' &middot; by ' + esc(r.by) : '') + '</p></div>' + UI.pill(r.type, TONES[r.type] || 'muted') + '<span class="w-20 text-right font-extrabold text-sm ' + (r.points >= 0 ? 'text-emerald-600' : 'text-red-500') + '">' + (r.points >= 0 ? '+' : '') + fmt(r.points) + '</span></div>').join('') + '</div>' : UI.empty('fa-star', 'No points activity yet', 'Points appear here as members pay for classes, workshops and orders.'));
    }

    function render() {
        $('tabs').innerHTML = UI.tabs(TABS, tab, 'Rewards.setTab');
        $('body').innerHTML = '<div class="space-y-6">' + ({ vouchers: vouchersHtml, redemptions: redemptionsHtml, points: pointsHtml }[tab] || programHtml)() + '</div>';
    }

    const voucherFields = v => [
        { id: 'title', label: 'Title', required: true, value: v && v.title, placeholder: 'e.g. RM 10 off coffee beans' },
        { id: 'description', label: 'Description', type: 'textarea', value: v && v.description, rows: 2 },
        { id: 'type', label: 'Type', type: 'select', half: true, value: v ? v.type : 'amount', options: [{ value: 'amount', label: 'Amount off (RM)' }, { value: 'percent', label: 'Percent off (%)' }, { value: 'shipping', label: 'Free delivery' }] },
        { id: 'value', label: 'Value', type: 'number', half: true, min: 0, step: '0.01', value: v ? v.value : 10, hint: 'RM or % (ignored for free delivery).' },
        { id: 'cost', label: 'Cost in points', type: 'number', half: true, min: 1, required: true, value: v && v.cost },
        { id: 'scope', label: 'Applies to', type: 'select', half: true, value: v ? v.scope : 'shop', options: [{ value: 'shop', label: 'Shop orders' }, { value: 'class', label: 'Classes & workshops' }] },
        { id: 'stock', label: 'Stock (optional)', type: 'number', half: true, min: 0, value: v && v.stock != null ? v.stock : '', hint: 'Leave empty for unlimited.' },
        { id: 'active', label: 'Visible to members', type: 'checkbox', half: true, value: v ? v.active : true }
    ];
    const voucherValid = v => {
        if (v.cost < 1 || !Number.isInteger(v.cost)) return 'Cost must be a whole number of points.';
        if (v.type === 'percent' && (v.value <= 0 || v.value > 100)) return 'Percent must be between 1 and 100.';
        if (v.type === 'amount' && v.value <= 0) return 'Amount must be greater than 0.';
        if (v.type === 'percent' && v.scope === 'shop') return 'Percent vouchers apply to classes and workshops. Choose "Classes & workshops".';
        if (v.type === 'shipping' && v.scope !== 'shop') return 'Free delivery only applies to shop orders.';
        return '';
    };

    window.Rewards = {
        render, setTab(t) { tab = t; q = ''; render(); }, search(v) { q = v; const pos = document.activeElement; render(); const i = document.querySelector('#body input'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } },
        async editRules() {
            const s = L.settings();
            const v = await UI.form({ title: 'Earning rules', submit: 'Save rules', fields: [{ id: 'earnPerRM', label: 'Points per RM1 paid', type: 'number', min: 0, step: '0.1', required: true, value: s.earnPerRM, half: true }, { id: 'welcomeBonus', label: 'Welcome bonus (points)', type: 'number', min: 0, required: true, value: s.welcomeBonus, half: true }], validate: v => v.earnPerRM < 0 || v.welcomeBonus < 0 ? 'Values cannot be negative.' : '' });
            if (!v) return; L.saveSettings({ ...s, earnPerRM: v.earnPerRM, welcomeBonus: Math.round(v.welcomeBonus) }); S.toast('Earning rules saved.'); render();
        },
        async editTiers() {
            const s = L.settings(), tiers = s.tiers.slice().sort((a, b) => a.min - b.min);
            const fields = [];
            for (let i = 0; i < 5; i++) { const t = tiers[i]; fields.push({ id: 'n' + i, label: 'Tier ' + (i + 1) + ' name', value: t ? t.name : '', half: true, required: i < 2 }, { id: 'm' + i, label: 'Lifetime points needed', type: 'number', min: 0, value: t ? t.min : '', half: true, required: i < 2 }); }
            const v = await UI.form({ title: 'Tiers', description: 'Two to five tiers. The first must start at 0 points. Leave a row empty to remove it.', submit: 'Save tiers', wide: true, fields,
                validate: v => { const rows = []; for (let i = 0; i < 5; i++) if (v['n' + i]) { if (v['m' + i] === '') return 'Enter the points needed for ' + v['n' + i] + '.'; rows.push({ name: v['n' + i], min: Number(v['m' + i]) }); } if (rows.length < 2) return 'Keep at least two tiers.'; if (Math.min(...rows.map(r => r.min)) !== 0) return 'The first tier must start at 0 points.'; if (new Set(rows.map(r => r.min)).size !== rows.length) return 'Each tier needs a different points value.'; if (new Set(rows.map(r => r.name.toLowerCase())).size !== rows.length) return 'Tier names must be different.'; return ''; } });
            if (!v) return; const out = []; for (let i = 0; i < 5; i++) if (v['n' + i]) out.push({ name: v['n' + i], min: Number(v['m' + i]) });
            L.saveSettings({ ...s, tiers: out.sort((a, b) => a.min - b.min) }); S.toast('Tiers saved.'); render();
        },
        async editVoucher(id) {
            const cur = id ? L.voucher(id) : null;
            const v = await UI.form({ title: cur ? 'Edit voucher' : 'New voucher', submit: cur ? 'Save voucher' : 'Create voucher', wide: true, fields: voucherFields(cur), validate: voucherValid });
            if (!v) return;
            const rec = { id: cur ? cur.id : 'V-' + Date.now().toString(36).toUpperCase(), title: v.title, description: v.description, type: v.type, value: v.type === 'shipping' ? 0 : v.value, cost: Math.round(v.cost), scope: v.scope, stock: v.stock === '' ? null : Math.round(v.stock), active: v.active };
            const all = L.vouchers(); L.saveVouchers(cur ? all.map(x => x.id === cur.id ? rec : x) : all.concat(rec)); S.toast(cur ? 'Voucher updated.' : 'Voucher created.'); render();
        },
        toggleVoucher(id) { const all = L.vouchers().map(x => x.id === id ? { ...x, active: !x.active } : x); L.saveVouchers(all); S.toast(L.voucher(id).active ? 'Voucher is visible to members.' : 'Voucher hidden from members.'); render(); },
        async deleteVoucher(id) {
            const v = L.voucher(id), n = L.redeemedCount(id);
            if (n) { if (await UI.confirm({ title: 'This voucher has been redeemed ' + n + ' time' + (n > 1 ? 's' : ''), message: 'Deleting would lose its history. Hide it from members instead? Existing codes keep working.', ok: 'Hide it' })) { L.saveVouchers(L.vouchers().map(x => x.id === id ? { ...x, active: false } : x)); S.toast('Voucher hidden.'); render(); } return; }
            if (await UI.confirm({ title: 'Delete ' + v.title + '?', message: 'Nobody has redeemed it yet. This cannot be undone.', ok: 'Delete voucher', danger: true })) { L.saveVouchers(L.vouchers().filter(x => x.id !== id)); S.toast('Voucher deleted.'); render(); }
        },
        markUsed(code) { L.use(code, 'admin'); S.toast('Marked as used.'); render(); },
        async cancelRedemption(id) { const r = L.redemptions().find(x => x.id === id); if (await UI.confirm({ title: 'Cancel ' + r.code + '?', message: r.cost + ' points are refunded to ' + nameOf(r.email) + ' and the code stops working.', ok: 'Cancel & refund', danger: true })) { L.cancelRedemption(id); S.toast('Redemption cancelled and points refunded.'); render(); } },
        async adjust() {
            const accs = D.accounts.list();
            if (!accs.length) { S.toast('There are no members yet.'); return; }
            const v = await UI.form({ title: 'Adjust points', description: 'Adds or removes points from one member. It is recorded in the ledger with your name.', submit: 'Apply adjustment', fields: [{ id: 'email', label: 'Member', type: 'select', options: accs.map(a => ({ value: a.email, label: a.name + ' (' + a.email + ') – ' + fmt(L.balance(a.email)) + ' pts' })) }, { id: 'points', label: 'Points (+ or -)', type: 'number', required: true, half: true }, { id: 'reason', label: 'Reason', required: true, half: true, placeholder: 'e.g. Event bonus' }],
                validate: v => !Number.isInteger(v.points) || v.points === 0 ? 'Enter a whole number other than 0.' : (L.balance(v.email) + v.points < 0 ? 'That would take the balance below 0.' : '') });
            if (!v) return; L.adjust(v.email, v.points, v.reason, (S.admin() || {}).email); S.toast((v.points > 0 ? '+' : '') + v.points + ' points applied.'); render();
        }
    };
    window.addEventListener('admin-ready', render);
})();
