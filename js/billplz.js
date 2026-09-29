/* Nb.CA Academy — Billplz payment integration (DEMO mode).
 *
 * Mirrors the Billplz flow: create a bill -> send the customer to the bill's hosted page -> Billplz calls back
 * and redirects the customer to redirect_url with billplz[id] / billplz[paid].
 *
 * Demo mode (no apiKey): bills are kept in localStorage and the "hosted page" is pay.html, which simulates
 * a successful or failed payment. No real money moves.
 *
 * Going live: set apiKey + collectionId (or better, move createBill and the callback to a server). The API
 * key must NEVER ship in browser code, and Billplz does not allow browser (CORS) calls, so a small backend
 * endpoint that creates the bill and receives the callback is required for production.
 */
(function () {
    const CONFIG = {
        apiKey: '',            // demo mode while empty
        collectionId: '',
        isSandbox: true
    };

    const KEY = 'rp_billplz_bills';
    const read = k => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } };
    const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    const rid = () => Math.random().toString(36).slice(2, 10);

    function absolute(page) {
        return new URL(page, window.location.href).href;
    }

    /** opts: {type:'order'|'fixed'|'workshop', refId, amount (RM), description, name, email, phone, returnTo} */
    function createBill(opts) {
        const bill = {
            id: rid(),
            collection_id: CONFIG.collectionId || 'demo_collection',
            type: opts.type,
            refId: opts.refId,
            email: opts.email,
            mobile: opts.phone,
            name: opts.name,
            amount: Math.round(opts.amount * 100),          // Billplz amounts are in cents
            description: opts.description,
            redirect_url: absolute(opts.returnTo),
            state: 'due',
            paid: false,
            created_at: new Date().toISOString()
        };
        const bills = read(KEY);
        bills.push(bill);
        write(KEY, bills);
        return bill;
    }

    function getBill(id) { return read(KEY).find(b => b.id === id); }

    /** Send the customer to the bill page. Demo: pay.html. */
    function checkout(opts) {
        const bill = createBill(opts);
        window.location.href = absolute('pay.html') + '?bill=' + encodeURIComponent(bill.id);
        return bill;
    }

    // Applies a payment result to the record that the bill belongs to (this is the "callback").
    function settle(id, paid) {
        const bills = read(KEY);
        const bill = bills.find(b => b.id === id);
        if (!bill) return null;
        bill.paid = !!paid;
        bill.state = paid ? 'paid' : 'due';
        bill.paid_at = paid ? new Date().toISOString() : null;
        write(KEY, bills);
        if (!paid) return bill;

        const patch = (storeKey, fn) => write(storeKey, read(storeKey).map(r => r.id === bill.refId ? fn(r) : r));
        if (bill.type === 'order') patch('rp_member_orders', r => ({ ...r, status: 'Processing', paymentStatus: 'Paid', billId: bill.id, paidAt: bill.paid_at }));
        if (bill.type === 'fixed') patch('rp_fixed_class_students', r => ({ ...r, depositStatus: 'Paid', classStatus: 'Pending Confirmation', billId: bill.id, paidAt: bill.paid_at }));
        if (bill.type === 'workshop') patch('rp_workshop_enrollments', r => ({ ...r, status: 'Confirmed', paymentStatus: 'Paid', billId: bill.id, paidAt: bill.paid_at }));
        return bill;
    }

    // Redirect back the way Billplz does: ?billplz[id]=...&billplz[paid]=true|false
    function redirectBack(bill) {
        const u = new URL(bill.redirect_url);
        u.searchParams.set('billplz[id]', bill.id);
        u.searchParams.set('billplz[paid]', bill.paid ? 'true' : 'false');
        if (bill.paid_at) u.searchParams.set('billplz[paid_at]', bill.paid_at);
        window.location.href = u.href;
    }

    /** Read the result on the page the customer returns to. Returns {paid, bill} once, then cleans the URL. */
    function readReturn() {
        const p = new URLSearchParams(window.location.search);
        const id = p.get('billplz[id]');
        if (!id) return null;
        const paid = p.get('billplz[paid]') === 'true';
        ['billplz[id]', 'billplz[paid]', 'billplz[paid_at]'].forEach(k => p.delete(k));
        const qs = p.toString();
        history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
        return { paid, bill: getBill(id) };
    }

    window.NBCA_PAY = { CONFIG, createBill, getBill, checkout, settle, redirectBack, readReturn };
})();
