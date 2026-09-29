/* Admin: member accounts (view, edit, suspend, reset password, adjust points, delete). */
(function () {
    const S = AdminShell, D = NBCA_DATA, L = D.loyalty, esc = S.esc, money = S.money, $ = id => document.getElementById(id);
    let filter = 'all', list = [];
    const byEmail = e => S.members().find(m => m.email === e);

    function matches(m) {
        const q = ($('q').value || '').toLowerCase().trim();
        if (filter === 'active' && m.status !== 'active') return false;
        if (filter === 'suspended' && m.status !== 'suspended') return false;
        return !q || [m.name, m.email, m.phone, m.ic].some(v => (v || '').toLowerCase().includes(q));
    }
    const SORTS = {
        recent: (a, b) => (b.last || '').localeCompare(a.last || ''), newest: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
        points: (a, b) => b.points - a.points, spend: (a, b) => b.spend - a.spend, name: (a, b) => a.name.localeCompare(b.name)
    };

    function render() {
        const all = S.members(), monthAgo = D.dayOf(new Date(Date.now() - 30 * 86400000));
        $('summary').innerHTML = [
            { icon: 'fa-users', tone: 'blue', value: all.length, label: 'Registered members' },
            { icon: 'fa-bolt', tone: 'emerald', value: D.activity.activeWithin(7), label: 'Active in 7 days', sub: D.activity.onlineNow(5) + ' online now', subTone: 'text-emerald-600' },
            { icon: 'fa-user-plus', tone: 'violet', value: all.filter(m => (m.createdAt || '') >= monthAgo).length, label: 'Joined in 30 days' },
            { icon: 'fa-user-lock', tone: 'rose', value: all.filter(m => m.status === 'suspended').length, label: 'Suspended' }
        ].map(UI.kpi).join('');
        $('chips').innerHTML = UI.chip('All', all.length, filter === 'all', "Members.setFilter('all')") + UI.chip('Active', all.filter(m => m.status === 'active').length, filter === 'active', "Members.setFilter('active')") + UI.chip('Suspended', all.filter(m => m.status === 'suspended').length, filter === 'suspended', "Members.setFilter('suspended')");
        list = all.filter(matches).sort(SORTS[$('sort').value] || SORTS.recent);
        $('list').innerHTML = list.length ? list.map(card).join('') : '<div class="md:col-span-2 xl:col-span-3">' + UI.empty('fa-users', all.length ? 'No members match' : 'No members yet', all.length ? 'Try a different filter or search.' : 'Members appear here as soon as they create an account. You can also add one yourself.', all.length ? '' : UI.btn('<i class="fa-solid fa-plus mr-1.5"></i>Add member', 'Members.add()', 'primary')) + '</div>';
    }

    function card(m, i) {
        const sus = m.status === 'suspended';
        return '<article class="bg-white rounded-3xl border ' + (sus ? 'border-red-200' : 'border-slate-200') + ' shadow-sm p-5 space-y-4 hover:shadow-md transition-all">' +
            '<div class="flex items-start gap-3">' + UI.avatar(m.name) + '<div class="min-w-0 flex-1"><div class="flex items-center gap-2 flex-wrap"><strong class="text-slate-900 truncate">' + esc(m.name) + '</strong>' + (sus ? UI.pill('Suspended', 'bad') : '') + '</div><span class="block text-[11px] text-slate-500 truncate">' + esc(m.email) + '</span><span class="block text-[11px] text-slate-400">' + esc(m.phone || 'No phone') + '</span></div>' + UI.pill(m.tier, 'info') + '</div>' +
            '<div class="grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-slate-50 py-2"><p class="text-base font-extrabold text-slate-900">' + (m.bookings.length + m.workshops.length) + '</p><p class="text-[10px] text-slate-500 font-semibold">Bookings</p></div><div class="rounded-xl bg-slate-50 py-2"><p class="text-base font-extrabold text-slate-900">' + m.orders.length + '</p><p class="text-[10px] text-slate-500 font-semibold">Orders</p></div><div class="rounded-xl bg-slate-50 py-2"><p class="text-base font-extrabold text-amberGold">' + m.points.toLocaleString('en-MY') + '</p><p class="text-[10px] text-slate-500 font-semibold">Points</p></div></div>' +
            '<div class="flex items-center justify-between text-[11px] text-slate-500"><span>Joined ' + S.fmtDate(m.createdAt, { day: 'numeric', month: 'short', year: '2-digit' }) + '</span><span>Active ' + S.ago(m.lastSeen) + '</span></div>' +
            '<div class="flex items-center gap-2 pt-3 border-t border-slate-100">' + UI.btn('View details', 'Members.view(' + i + ')', 'primary') + '<span class="ml-auto flex gap-1.5">' +
            UI.iconBtn('fa-pen', 'Edit', "Members.edit('" + m.email + "')") + UI.iconBtn('fa-key', 'Reset password', "Members.resetPw('" + m.email + "')") + UI.iconBtn('fa-star', 'Adjust points', "Members.adjust('" + m.email + "')") + UI.iconBtn(sus ? 'fa-lock-open' : 'fa-user-lock', sus ? 'Reactivate' : 'Suspend', "Members.toggle('" + m.email + "')") + UI.iconBtn('fa-trash', 'Delete account', "Members.remove('" + m.email + "')", true) + '</span></div></article>';
    }

    function drawerHtml(m) {
        const wa = S.waLink(m.phone, 'Hi ' + m.name + ', ');
        const row = (l, r, s) => '<div class="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0"><div class="min-w-0"><p class="text-xs font-bold text-slate-900 truncate">' + l + '</p><p class="text-[11px] text-slate-500 truncate">' + r + '</p></div>' + s + '</div>';
        const stPill = s => UI.pill(s, { Admitted: 'good', Confirmed: 'good', Completed: 'good', 'Pending Confirmation': 'info', Processing: 'info', Shipped: 'info', Reschedule: 'bad', Cancelled: 'muted' }[s] || 'warn');
        const cell = (l, v) => '<div><span class="block text-[10px] uppercase text-slate-500">' + l + '</span><strong class="text-xs">' + v + '</strong></div>';
        const t = L.tier(m.email);
        const h = txt => '<h5 class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">' + txt + '</h5>';
        return '<div class="flex items-center gap-4">' + UI.avatar(m.name, 'lg') + '<div class="min-w-0"><h4 class="font-serif text-xl font-bold text-slate-900 truncate">' + esc(m.name) + '</h4><p class="text-xs text-slate-500 truncate">' + esc(m.email) + '</p><div class="flex gap-1.5 mt-1.5">' + UI.pill(m.status === 'active' ? 'Active' : 'Suspended', m.status === 'active' ? 'good' : 'bad') + UI.pill(t.name + ' tier', 'info') + '</div></div></div>' +
            '<div class="flex flex-wrap gap-2">' + UI.btn('<i class="fa-solid fa-pen mr-1.5"></i>Edit', "Members.edit('" + m.email + "')", 'ghost') + UI.btn('<i class="fa-solid fa-key mr-1.5"></i>Reset password', "Members.resetPw('" + m.email + "')", 'ghost') + UI.btn('<i class="fa-solid fa-star mr-1.5"></i>Adjust points', "Members.adjust('" + m.email + "')", 'ghost') + (wa ? '<a href="' + wa + '" target="_blank" rel="noopener" class="px-3.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><i class="fa-brands fa-whatsapp mr-1.5"></i>WhatsApp</a>' : '') + '</div>' +
            '<div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-2 gap-3">' + cell('Phone', esc(m.phone || '-')) + cell('IC / Passport', esc(m.ic || '-')) + cell('From', esc(m.from || '-')) + cell('Cafe', esc(m.cafe || '-')) + cell('Joined', S.fmtDate(m.createdAt)) + cell('Last login', S.fmtDateTime(m.lastLogin)) + cell('Last active', S.ago(m.lastSeen)) + cell('Total paid', money(m.spend)) + '</div>' +
            '<div class="rounded-2xl border border-slate-200 p-4 space-y-2"><div class="flex items-center justify-between"><span class="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Points</span><strong class="text-lg font-serif text-amberGold">' + m.points.toLocaleString('en-MY') + '</strong></div>' + (t.next ? '<div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-amberGold rounded-full" style="width:' + t.progress + '%"></div></div><p class="text-[11px] text-slate-500">' + t.toNext.toLocaleString('en-MY') + ' pts to ' + esc(t.next.name) + ' (lifetime ' + t.lifetime.toLocaleString('en-MY') + ')</p>' : '<p class="text-[11px] text-slate-500">Top tier reached (lifetime ' + t.lifetime.toLocaleString('en-MY') + ')</p>') + '</div>' +
            '<div>' + h('Vouchers (' + m.redemptions.length + ')') + (m.redemptions.length ? m.redemptions.map(r => row(esc(r.title), '<span class="font-mono">' + esc(r.code) + '</span>', UI.pill(r.status, r.status === 'Available' ? 'good' : 'muted'))).join('') : '<p class="text-xs text-slate-500">None.</p>') + '</div>' +
            '<div>' + h('Addresses (' + m.addresses.length + ')') + (m.addresses.length ? m.addresses.map(a => '<div class="rounded-xl border ' + (a.isDefault ? 'border-amberGold bg-blue-50/50' : 'border-slate-200') + ' p-3 mb-2 text-xs"><div class="flex items-center gap-2"><strong class="text-slate-900">' + esc(a.name) + '</strong><span class="text-slate-500">' + esc(a.phone) + '</span>' + (a.isDefault ? '<span class="ml-auto px-2 py-0.5 rounded-full bg-amberGold text-white text-[9px] font-bold">Default</span>' : '') + '</div><p class="text-slate-600 mt-1">' + esc([a.line1, a.line2, a.postcode + ' ' + a.city, a.state].filter(Boolean).join(', ')) + '</p></div>').join('') : '<p class="text-xs text-slate-500">No saved addresses.</p>') + '</div>' +
            '<div>' + h('Class bookings (' + m.bookings.length + ')') + (m.bookings.length ? m.bookings.map(r => row(S.fmtDate(r.preferredDate, { weekday: 'short', day: 'numeric', month: 'short' }), esc(r.session), stPill(r.classStatus || 'Pending Confirmation'))).join('') : '<p class="text-xs text-slate-500">None.</p>') + '</div>' +
            '<div>' + h('Workshops (' + m.workshops.length + ')') + (m.workshops.length ? m.workshops.map(w => row(esc(w.title), esc(w.slot), stPill(w.status))).join('') : '<p class="text-xs text-slate-500">None.</p>') + '</div>' +
            '<div>' + h('Orders (' + m.orders.length + ')') + (m.orders.length ? m.orders.map(o => row(esc(o.id) + ' &middot; ' + money(o.total), S.fmtDate(o.createdAt), stPill(o.status))).join('') : '<p class="text-xs text-slate-500">None.</p>') + '</div>' +
            '<div class="pt-2 border-t border-slate-100 flex flex-wrap gap-2">' + UI.btn(m.status === 'active' ? '<i class="fa-solid fa-user-lock mr-1.5"></i>Suspend account' : '<i class="fa-solid fa-lock-open mr-1.5"></i>Reactivate account', "Members.toggle('" + m.email + "')", 'ghost') + UI.btn('<i class="fa-solid fa-trash mr-1.5"></i>Delete account', "Members.remove('" + m.email + "')", 'danger') + '</div>';
    }
    let openEmail = null;
    function refreshDrawer() { if (openEmail && !$('drawer').classList.contains('hidden')) { const m = byEmail(openEmail); if (m) $('drawer-body').innerHTML = drawerHtml(m); else closeDrawer(); } }
    const closeDrawer = () => { $('drawer').classList.add('hidden'); openEmail = null; };
    const changed = () => { render(); refreshDrawer(); };

    window.Members = {
        render, setFilter(f) { filter = f; render(); }, closeDrawer,
        view(i) { const m = list[i]; openEmail = m.email; $('drawer-body').innerHTML = drawerHtml(m); $('drawer').classList.remove('hidden'); },
        async add() {
            const v = await UI.form({ title: 'Add a member', description: 'Creates an account the member can sign in with straight away.', submit: 'Create account', fields: [{ id: 'name', label: 'Full name', required: true }, { id: 'email', label: 'Email', type: 'email', required: true, half: true }, { id: 'phone', label: 'Phone', type: 'tel', half: true }, { id: 'password', label: 'Temporary password', type: 'password', required: true, hint: 'At least 6 characters. Share it securely and ask the member to change it.' }], validate: v => v.password.length < 6 ? 'Password must be at least 6 characters.' : '' });
            if (!v) return;
            const res = D.accounts.create(v);
            if (!res.ok) { S.toast(res.error === 'exists' ? 'That email already has an account.' : 'Please fill in all fields.'); return; }
            S.toast(v.name + ' added.'); changed();
        },
        async edit(email) {
            const m = byEmail(email);
            const v = await UI.form({ title: 'Edit member', description: 'The email cannot be changed because bookings and orders are linked to it.', submit: 'Save changes', fields: [{ id: 'name', label: 'Full name', value: m.name, required: true }, { id: 'phone', label: 'Phone', type: 'tel', value: m.phone }] });
            if (!v) return;
            D.accounts.update(email, { name: v.name, phone: v.phone }); S.toast('Member updated.'); changed();
        },
        async resetPw(email) {
            const m = byEmail(email);
            const v = await UI.form({ title: 'Reset password for ' + m.name, description: 'Set a new password. The member is signed out of nothing, but must use this password next time.', submit: 'Reset password', fields: [{ id: 'password', label: 'New password', type: 'password', required: true, hint: 'At least 6 characters.' }], validate: v => v.password.length < 6 ? 'Password must be at least 6 characters.' : '' });
            if (!v) return;
            D.accounts.setPassword(email, v.password); S.toast('Password reset. Share it with ' + m.name + ' securely.'); changed();
        },
        async adjust(email) {
            const m = byEmail(email);
            const v = await UI.form({ title: 'Adjust points for ' + m.name, description: 'Current balance: ' + m.points.toLocaleString('en-MY') + ' points. Use a negative number to deduct.', submit: 'Apply adjustment', fields: [{ id: 'points', label: 'Points (+ or -)', type: 'number', required: true, half: true }, { id: 'reason', label: 'Reason', required: true, half: true, placeholder: 'e.g. Event bonus' }], validate: v => !Number.isInteger(v.points) || v.points === 0 ? 'Enter a whole number other than 0.' : (m.points + v.points < 0 ? 'That would take the balance below 0.' : '') });
            if (!v) return;
            L.adjust(email, v.points, v.reason, (S.admin() || {}).email); S.toast((v.points > 0 ? '+' : '') + v.points + ' points applied.'); changed();
        },
        async toggle(email) {
            const m = byEmail(email), sus = m.status === 'active';
            if (await UI.confirm({ title: (sus ? 'Suspend ' : 'Reactivate ') + m.name + '?', message: sus ? 'They will be signed out on their next page load and cannot log in until you reactivate the account. Their data is kept.' : 'They will be able to log in again.', ok: sus ? 'Suspend' : 'Reactivate', danger: sus })) { D.accounts.update(email, { status: sus ? 'suspended' : 'active' }); S.toast(sus ? 'Account suspended.' : 'Account reactivated.'); changed(); }
        },
        async remove(email) {
            const m = byEmail(email);
            if (await UI.confirm({ title: 'Delete ' + m.name + "'s account?", message: 'They can no longer log in. Their bookings, orders and points history are kept for your records. This cannot be undone.', ok: 'Delete account', danger: true })) { D.accounts.remove(email); S.toast('Account deleted.'); closeDrawer(); render(); }
        },
        exportCsv() {
            const rows = S.members().filter(matches); if (!rows.length) { S.toast('Nothing to export.'); return; }
            S.downloadCsv('members.csv', [['Name', 'Email', 'Phone', 'Status', 'Tier', 'Points', 'Joined', 'Last active', 'Bookings', 'Workshops', 'Orders', 'Paid (RM)']].concat(rows.map(m => [m.name, m.email, m.phone, m.status, m.tier, m.points, m.createdAt, m.lastSeen || '', m.bookings.length, m.workshops.length, m.orders.length, m.spend.toFixed(2)])));
        }
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
    window.addEventListener('admin-ready', render);
})();
