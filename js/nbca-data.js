/* Nb.CA Academy — shared domain layer (member portal + admin console).
 *
 * Everything that touches localStorage business data goes through here so the portal and the admin agree on
 * the shape of the data. Swap the bodies of read()/write() for API calls when a backend exists.
 *
 *   accounts     member accounts (status, last seen) + authentication
 *   activity     one row per member per day they were active (drives "active users")
 *   instructors  who teaches, plus assignments of instructors to class sessions
 *   slots        extra workshop sessions added by the admin on top of the built-in catalog
 *   loyalty      points ledger, tiers, vouchers and redemptions
 *
 * DEMO NOTE: passwords are stored in plain text because there is no server. Hash + verify server-side in production.
 */
(function () {
    const K = {
        accounts: 'rp_accounts', session: 'rp_logged_user', legacyUser: 'rp_user',
        activity: 'rp_activity_log',
        instructors: 'rp_instructors', assignments: 'rp_assignments', slots: 'rp_workshop_slots_extra',
        ledger: 'rp_points_ledger', loyalty: 'rp_loyalty_settings', vouchers: 'rp_vouchers', redemptions: 'rp_redemptions',
        regs: 'rp_fixed_class_students', orders: 'rp_member_orders', enrolls: 'rp_workshop_enrollments', profiles: 'rp_member_profiles'
    };
    const read = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; } catch (e) { return fallback; } };
    const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const norm = e => String(e || '').trim().toLowerCase();
    const nowIso = () => new Date().toISOString();
    const dayOf = d => { const x = d ? new Date(d) : new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

    // ============================ ACCOUNTS ============================
    const accounts = {
        list() { return read(K.accounts, []); },
        get(email) { const e = norm(email); return accounts.list().find(a => a.email === e) || null; },
        create({ name, email, password, phone }) {
            const e = norm(email);
            if (!name || !e || !password) return { ok: false, error: 'missing' };
            if (accounts.get(e)) return { ok: false, error: 'exists' };
            const a = { id: uid('U'), name: String(name).trim(), email: e, password, phone: phone || '', status: 'active', createdAt: nowIso(), lastLogin: null, lastSeen: null };
            const all = accounts.list(); all.push(a); write(K.accounts, all);
            return { ok: true, account: a };
        },
        update(email, patch) {
            const e = norm(email); let out = null;
            write(K.accounts, accounts.list().map(a => a.email === e ? (out = { ...a, ...patch, email: a.email, id: a.id }) : a));
            return out;
        },
        remove(email) { const e = norm(email); write(K.accounts, accounts.list().filter(a => a.email !== e)); },
        // Returns {ok:true, account} | {ok:false, error:'invalid'|'suspended'}
        authenticate(email, password) {
            const e = norm(email);
            let a = accounts.get(e);
            if (!a && e === 'member@nbca.academy' && password === '123456') a = accounts.create({ name: 'Nana Zailani', email: e, password: '123456' }).account;   // demo member
            if (!a || a.password !== password) return { ok: false, error: 'invalid' };
            if (a.status === 'suspended') return { ok: false, error: 'suspended' };
            a = accounts.update(e, { lastLogin: nowIso(), lastSeen: nowIso() });
            activity.touch(e, true);
            return { ok: true, account: a };
        },
        setPassword(email, pw) { return accounts.update(email, { password: pw }); },
        changePassword(email, current, next) {
            const a = accounts.get(email);
            if (!a) return { ok: false, error: 'missing' };
            if (a.password && a.password !== current) return { ok: false, error: 'wrong' };
            accounts.update(email, { password: next });
            return { ok: true };
        },
        // Old versions kept a single account under rp_user; import it once.
        migrate() {
            const legacy = read(K.legacyUser, null);
            if (legacy && legacy.email && !accounts.get(legacy.email) && legacy.password) accounts.create({ name: legacy.name, email: legacy.email, password: legacy.password });
        }
    };

    const session = {
        get() { return read(K.session, null); },
        start(account) { write(K.session, { id: account.id, name: account.name, email: account.email }); },
        end() { localStorage.removeItem(K.session); },
        // The signed-in account, or null if the session is stale / the account was suspended or deleted.
        account() { const s = session.get(); const a = s && accounts.get(s.email); return a && a.status === 'active' ? a : null; }
    };

    // ============================ ACTIVITY (active users) ============================
    const activity = {
        // Called on every portal page load; cheap and throttled.
        touch(email, force) {
            const e = norm(email); if (!e) return;
            const a = accounts.get(e);
            if (a && (force || !a.lastSeen || Date.now() - new Date(a.lastSeen).getTime() > 60000)) accounts.update(e, { lastSeen: nowIso() });
            const today = dayOf(), log = read(K.activity, []);
            if (!log.some(r => r.day === today && r.email === e)) { log.push({ email: e, day: today }); write(K.activity, log.slice(-20000)); }
        },
        log() { return read(K.activity, []); },
        // map day -> unique active members
        dailyActive() { const m = {}; activity.log().forEach(r => { (m[r.day] = m[r.day] || new Set()).add(r.email); }); return Object.fromEntries(Object.entries(m).map(([d, s]) => [d, s.size])); },
        onlineNow(minutes) { const cut = Date.now() - (minutes || 5) * 60000; return accounts.list().filter(a => a.lastSeen && new Date(a.lastSeen).getTime() >= cut).length; },
        activeWithin(days) { const cut = dayOf(new Date(Date.now() - (days - 1) * 86400000)); return new Set(activity.log().filter(r => r.day >= cut).map(r => r.email)).size; }
    };

    // ============================ INSTRUCTORS + ASSIGNMENTS ============================
    const instructors = {
        list() { return read(K.instructors, []); },
        active() { return instructors.list().filter(i => i.status !== 'inactive'); },
        get(id) { return instructors.list().find(i => i.id === id) || null; },
        create(p) { const i = { id: uid('I'), name: p.name.trim(), phone: p.phone || '', email: p.email || '', specialty: p.specialty || '', status: 'active', createdAt: nowIso() }; write(K.instructors, instructors.list().concat(i)); return i; },
        update(id, patch) { write(K.instructors, instructors.list().map(i => i.id === id ? { ...i, ...patch, id } : i)); },
        remove(id) { write(K.instructors, instructors.list().filter(i => i.id !== id)); const a = read(K.assignments, {}); Object.keys(a).forEach(k => { if (a[k] === id) delete a[k]; }); write(K.assignments, a); },
        assignedCount(id) { return Object.values(read(K.assignments, {})).filter(v => v === id).length; }
    };
    const assign = {
        fixedKey: (date, session) => 'fixed|' + date + '|' + session,
        wsKey: (workshopId, slot) => 'ws|' + workshopId + '|' + slot,
        all() { return read(K.assignments, {}); },
        get(key) { const id = read(K.assignments, {})[key]; return id ? instructors.get(id) : null; },
        set(key, id) { const a = read(K.assignments, {}); if (id) a[key] = id; else delete a[key]; write(K.assignments, a); }
    };

    // ============================ WORKSHOP SLOTS ============================
    const slots = {
        catalog() { return (window.NBCA_CATALOG && window.NBCA_CATALOG.workshops) || []; },
        extras() { return read(K.slots, []); },
        // seats per session, parsed from the catalog subtitle ("Duration: 2.5 Hours • Max 8 Pax")
        capacity(w) { const m = /Max\s+(\d+)/i.exec((w && w.subtitle) || ''); return m ? Number(m[1]) : 10; },
        // {mode: [slot,...]} = built-in slots plus admin-added ones
        forWorkshop(w) {
            const out = {}; Object.keys(w.modes).forEach(m => { out[m] = (w.slots[m] || []).slice(); });
            slots.extras().filter(x => x.workshopId === w.id).forEach(x => { (out[x.mode] = out[x.mode] || []).push(x.slot); });
            return out;
        },
        add(workshopId, mode, slot) { const id = uid('S'); write(K.slots, slots.extras().concat({ id, workshopId, mode, slot })); return id; },
        removeExtra(id) { write(K.slots, slots.extras().filter(x => x.id !== id)); }
    };

    // ============================ LOYALTY ============================
    const DEFAULT_LOYALTY = { earnPerRM: 1, welcomeBonus: 50, tiers: [{ name: 'Bronze', min: 0 }, { name: 'Silver', min: 300 }, { name: 'Gold', min: 1000 }, { name: 'Platinum', min: 2500 }] };
    const DEFAULT_VOUCHERS = [
        { id: 'V-BEANS10', title: 'RM 10 off coffee beans', description: 'RM10 off your next shop order.', type: 'amount', value: 10, cost: 150, scope: 'shop', active: true, stock: null },
        { id: 'V-SHIP', title: 'Free delivery', description: 'Shipping on us for one shop order.', type: 'shipping', value: 0, cost: 200, scope: 'shop', active: true, stock: null },
        { id: 'V-CLASS50', title: '50% off a class', description: 'Half price on one workshop or the daily class.', type: 'percent', value: 50, cost: 500, scope: 'class', active: true, stock: null }
    ];
    const loyalty = {
        settings() { return { ...DEFAULT_LOYALTY, ...read(K.loyalty, {}) }; },
        saveSettings(s) { write(K.loyalty, s); },
        vouchers() { const v = read(K.vouchers, null); return v || DEFAULT_VOUCHERS.map(x => ({ ...x })); },
        saveVouchers(v) { write(K.vouchers, v); },
        voucher(id) { return loyalty.vouchers().find(v => v.id === id) || null; },
        ledgerAll() { return read(K.ledger, []); },

        // Idempotently turns paid activity into ledger rows. Rates are frozen at the time a row is first written.
        sync() {
            const S = loyalty.settings(), led = loyalty.ledgerAll(), has = new Set(led.map(r => r.id));
            const add = (id, email, points, type, reason, at) => { if (!has.has(id) && points) { has.add(id); led.push({ id, email: norm(email), points, type, reason, at: at || nowIso() }); } };
            const earn = amt => Math.floor(Number(amt || 0) * S.earnPerRM);
            accounts.list().forEach(a => add('welcome:' + a.email, a.email, S.welcomeBonus, 'welcome', 'Welcome bonus', a.createdAt));
            read(K.orders, []).forEach(o => {
                if (o.paymentStatus === 'Paid') add('earn:order:' + o.id, o.email, earn(Number(o.subtotal) - Number(o.discount || 0)), 'earn', 'Order ' + o.id, o.paidAt || o.createdAt);
                if (o.status === 'Cancelled' && has.has('earn:order:' + o.id)) { const e = led.find(r => r.id === 'earn:order:' + o.id); add('rev:order:' + o.id, o.email, -e.points, 'reversal', 'Order ' + o.id + ' cancelled'); }
            });
            read(K.regs, []).forEach(r => {
                if (r.depositStatus === 'Paid') add('earn:fixed:' + r.id, r.email, earn(r.deposit), 'earn', 'Class deposit ' + r.preferredDate, r.paidAt || r.createdAt);
                if (r.classStatus === 'Cancelled' && has.has('earn:fixed:' + r.id)) { const e = led.find(x => x.id === 'earn:fixed:' + r.id); add('rev:fixed:' + r.id, r.email, -e.points, 'reversal', 'Class booking cancelled'); }
            });
            read(K.enrolls, []).forEach(w => {
                if (w.paymentStatus === 'Paid') add('earn:ws:' + w.id, w.email, earn(w.price), 'earn', w.title, w.paidAt || w.createdAt);
                if (w.status === 'Cancelled' && has.has('earn:ws:' + w.id)) { const e = led.find(x => x.id === 'earn:ws:' + w.id); add('rev:ws:' + w.id, w.email, -e.points, 'reversal', w.title + ' cancelled'); }
            });
            if (led.length !== loyalty.ledgerAll().length) write(K.ledger, led);
            return led;
        },
        ledger(email) { const e = norm(email); return loyalty.sync().filter(r => r.email === e).sort((a, b) => (b.at || '').localeCompare(a.at || '')); },
        balance(email) { return loyalty.ledger(email).reduce((a, r) => a + r.points, 0); },
        // lifetime points decide the tier (spending points on vouchers never lowers it)
        lifetime(email) { return loyalty.ledger(email).filter(r => ['earn', 'welcome', 'adjust'].includes(r.type) && r.points > 0).reduce((a, r) => a + r.points, 0); },
        tier(email) {
            const life = loyalty.lifetime(email), tiers = loyalty.settings().tiers.slice().sort((a, b) => a.min - b.min);
            let cur = tiers[0], next = null;
            tiers.forEach(t => { if (life >= t.min) cur = t; });
            next = tiers.find(t => t.min > life) || null;
            return { name: cur.name, lifetime: life, next, toNext: next ? next.min - life : 0, progress: next ? Math.max(0, Math.min(100, Math.round((life - cur.min) / (next.min - cur.min) * 100))) : 100 };
        },
        adjust(email, points, reason, by) {
            const led = loyalty.sync(); const id = uid('adj');
            led.push({ id: 'adjust:' + id, email: norm(email), points: Number(points), type: 'adjust', reason: reason || 'Manual adjustment', at: nowIso(), by: by || 'admin' });
            write(K.ledger, led);
        },

        redemptions() { return read(K.redemptions, []); },
        redemptionsOf(email) { const e = norm(email); return loyalty.redemptions().filter(r => r.email === e).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); },
        redeemedCount(voucherId) { return loyalty.redemptions().filter(r => r.voucherId === voucherId && r.status !== 'Cancelled').length; },
        remaining(v) { return v.stock == null ? Infinity : Math.max(0, v.stock - loyalty.redeemedCount(v.id)); },
        redeem(email, voucherId) {
            const v = loyalty.voucher(voucherId);
            if (!v || !v.active) return { ok: false, error: 'This reward is not available.' };
            if (loyalty.remaining(v) <= 0) return { ok: false, error: 'This reward is out of stock.' };
            if (loyalty.balance(email) < v.cost) return { ok: false, error: 'Not enough points.' };
            const r = { id: uid('R'), email: norm(email), voucherId: v.id, title: v.title, type: v.type, value: v.value, scope: v.scope, cost: v.cost, code: 'NB-' + Math.random().toString(36).slice(2, 8).toUpperCase(), status: 'Available', createdAt: nowIso() };
            write(K.redemptions, loyalty.redemptions().concat(r));
            const led = loyalty.sync(); led.push({ id: 'redeem:' + r.id, email: r.email, points: -v.cost, type: 'redeem', reason: 'Redeemed: ' + v.title, at: r.createdAt }); write(K.ledger, led);
            return { ok: true, redemption: r };
        },
        available(email, scope) { return loyalty.redemptionsOf(email).filter(r => r.status === 'Available' && (!scope || r.scope === scope)); },
        use(code, ref) { write(K.redemptions, loyalty.redemptions().map(r => r.code === code ? { ...r, status: 'Used', usedAt: nowIso(), usedOn: ref } : r)); },
        restore(code) { write(K.redemptions, loyalty.redemptions().map(r => r.code === code && r.status === 'Used' ? { ...r, status: 'Available', usedAt: null, usedOn: null } : r)); },
        cancelRedemption(id) {
            const r = loyalty.redemptions().find(x => x.id === id); if (!r || r.status === 'Cancelled') return;
            write(K.redemptions, loyalty.redemptions().map(x => x.id === id ? { ...x, status: 'Cancelled' } : x));
            const led = loyalty.sync(); led.push({ id: 'refund:' + id, email: r.email, points: r.cost, type: 'refund', reason: 'Refund: ' + r.title, at: nowIso() }); write(K.ledger, led);
        },
        // amount off for a voucher applied to {subtotal, shipping}
        discount(r, { subtotal, shipping }) {
            if (!r) return 0;
            if (r.type === 'amount') return Math.min(Number(r.value), subtotal);
            if (r.type === 'shipping') return Number(shipping || 0);
            if (r.type === 'percent') return Math.round(subtotal * Number(r.value)) / 100;
            return 0;
        }
    };

    accounts.migrate();
    window.NBCA_DATA = { K, read, write, uid, norm, dayOf, accounts, session, activity, instructors, assign, slots, loyalty };
})();
