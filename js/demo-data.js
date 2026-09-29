/* Nb.CA Academy — demo data for client walkthroughs.
 *
 * NBCA_DEMO.seed()   replaces the business data with a realistic sample (members, bookings, orders, enrollments,
 *                    instructors, vouchers) so every admin and member screen has something to show.
 * NBCA_DEMO.clear()  empties that data again (settings, announcements and the admin session are kept).
 *
 * DEMO ONLY: remove this file, the "Website & Demo" tab and the demo hints on the login pages before launch. */
(function () {
    const D = window.NBCA_DATA, CFG = window.NBCA_CFG, K = D.K;
    const DAY = 86400000, now = () => Date.now();
    const ago = days => new Date(now() - days * DAY).toISOString();
    const ymd = d => D.dayOf(d);
    const S1 = CFG.FC_SESSIONS[0], S2 = CFG.FC_SESSIONS[1];

    // n-th open class day counted from today (n may be negative for past days)
    function openDay(n) {
        const d = new Date(); d.setHours(12, 0, 0, 0); let c = 0; const step = n < 0 ? -1 : 1;
        if (n === 0) { while (!CFG.FC_OPEN_DAYS.includes(d.getDay())) d.setDate(d.getDate() + 1); return ymd(d); }
        while (c < Math.abs(n)) { d.setDate(d.getDate() + step); if (CFG.FC_OPEN_DAYS.includes(d.getDay())) c++; }
        return ymd(d);
    }

    const MEMBERS = [
        ['Nana Zailani', 'member@nbca.academy', '0123456789', '990101-01-1234', 'Kopi Kita, Alor Setar', 'Sungai Petani', 40, '123456'],
        ['Ahmad Zaki', 'zaki@demo.my', '0139876543', '950505-02-5555', '', 'Pulau Pinang', 34],
        ['Siti Aminah', 'siti@demo.my', '0111222333', '000909-03-8888', 'Warung Siti', 'Kuala Lumpur', 28],
        ['Lee Wei Jian', 'lee@demo.my', '0165554444', '880808-07-1111', 'Brew Lab Ipoh', 'Ipoh', 21],
        ['Farid Hakim', 'farid@demo.my', '0172223344', '970312-02-4321', '', 'Alor Setar', 15],
        ['Nurul Huda', 'huda@demo.my', '0183334455', '010715-05-6780', 'Huda Coffee Corner', 'Kulim', 10],
        ['Kumar Raj', 'kumar@demo.my', '0194445566', '920820-10-1122', '', 'Butterworth', 6],
        ['Aisyah Rahman', 'aisyah@demo.my', '0125556677', '030228-14-9900', '', 'Shah Alam', 3],
        ['Tan Mei Ling', 'meiling@demo.my', '0136667788', '911111-07-3344', 'Ling Roasters', 'Penang', 1],
        ['Hafiz Ismail', 'hafiz@demo.my', '0147778899', '940606-08-5566', '', 'Sungai Petani', 25, 'demo1234', 'suspended']
    ];

    const PHOTOS = {
        amin: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=700&q=80'],
        farah: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=80', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=80'],
        danish: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=700&q=80']
    };

    function catalogItems(ids) {
        const C = window.NBCA_CATALOG || { beans: [], merch: [] }, all = [].concat(C.beans, C.merch);
        return ids.map(([id, qty]) => { const p = all.find(x => x.id === id) || all[0]; return { id: p.id, name: p.title, price: p.price, image: p.image, qty }; });
    }

    function seed() {
        clear(true);
        const pw = m => m[7] || 'demo1234';
        // ---- accounts + activity ----
        const accounts = MEMBERS.map((m, i) => ({ id: 'U-DEMO' + i, name: m[0], email: m[1], password: pw(m), phone: m[2], status: m[8] || 'active', createdAt: ago(m[6]), lastLogin: ago(i === 0 ? 0.05 : i * 0.7), lastSeen: ago(i === 0 ? 0.01 : i * 0.9) }));
        D.write(K.accounts, accounts);
        const log = [];
        accounts.forEach((a, i) => { for (let d = 0; d < 30; d++) { if (d === 0 ? i < 6 : (i * 7 + d * 3) % 5 < 2 && d < Math.max(2, Math.round((now() - new Date(a.createdAt)) / DAY))) log.push({ email: a.email, day: ymd(new Date(now() - d * DAY)) }); } });
        D.write(K.activity, log);

        // ---- instructors + assignments ----
        D.write(K.instructors, [
            { id: 'I-DEMO1', name: 'Chef Amin', roleTitle: 'Head Instructor', specialty: 'Espresso & brewing', bio: 'A certified barista trainer with 10 years behind the bar. Amin teaches the fundamentals: extraction, milk and workflow.', photos: PHOTOS.amin, phone: '0125551111', email: 'amin@nbca.academy', showOnWebsite: true, status: 'active' },
            { id: 'I-DEMO2', name: 'Farah Latte', roleTitle: 'Latte Art Coach', specialty: 'Latte art', bio: 'Multiple-time latte art champion. Farah breaks pouring down into simple, repeatable steps anyone can learn.', photos: PHOTOS.farah, phone: '0125552222', email: 'farah@nbca.academy', showOnWebsite: true, status: 'active' },
            { id: 'I-DEMO3', name: 'Danish Roast', roleTitle: 'Roasting & Cupping Specialist', specialty: 'Roasting, cupping', bio: 'Q-grader and roaster. Danish guides you from green bean to cup, and how to taste like a professional.', photos: PHOTOS.danish, phone: '0125553333', email: 'danish@nbca.academy', showOnWebsite: true, status: 'active' }
        ]);
        const asg = {};
        for (let n = 0; n < 8; n++) { asg[D.assign.fixedKey(openDay(n), S1)] = n % 2 ? 'I-DEMO2' : 'I-DEMO1'; if (n % 3 !== 2) asg[D.assign.fixedKey(openDay(n), S2)] = n % 2 ? 'I-DEMO1' : 'I-DEMO3'; }
        (D.slots.catalog()).forEach((w, wi) => Object.keys(w.slots).forEach(mode => (w.slots[mode] || []).forEach((slot, si) => { if ((wi + si) % 2 === 0) asg[D.assign.wsKey(w.id, slot)] = ['I-DEMO2', 'I-DEMO1', 'I-DEMO3'][wi % 3]; })));
        D.write(K.assignments, asg);

        // ---- daily class bookings ----
        const person = i => MEMBERS[i];
        const reg = (id, i, dayN, session, deposit, klass, created, extra) => Object.assign({ id, name: person(i)[0], email: person(i)[1], phone: person(i)[2], ic: person(i)[3], cafe: person(i)[4], from: person(i)[5], preferredDate: openDay(dayN), session, classFee: 150, deposit: 75, depositStatus: deposit, classStatus: klass, createdAt: ago(created), paidAt: deposit === 'Paid' ? ago(created) : undefined }, extra || {});
        const regs = [
            reg('FC-D01', 0, 1, S1, 'Paid', 'Admitted', 3), reg('FC-D02', 1, 1, S1, 'Paid', 'Pending Confirmation', 2), reg('FC-D03', 2, 1, S2, 'Paid', 'Pending Confirmation', 1.5),
            reg('FC-D04', 4, 2, S1, 'Paid', 'Admitted', 4), reg('FC-D05', 5, 2, S1, 'Paid', 'Pending Confirmation', 2.5), reg('FC-D06', 6, 3, S2, 'Paid', 'Reschedule', 5),
            reg('FC-D07', 7, 3, S1, 'Pending', 'Awaiting Payment', 0.1, { paidAt: undefined }), reg('FC-D08', 8, 4, S1, 'Paid', 'Pending Confirmation', 0.6),
            reg('FC-D09', 3, -2, S1, 'Paid', 'Admitted', 9), reg('FC-D10', 1, -4, S2, 'Paid', 'Admitted', 12), reg('FC-D11', 2, -6, S1, 'Paid', 'Admitted', 14), reg('FC-D12', 0, -8, S1, 'Paid', 'Admitted', 16)
        ];
        // a nearly-full session so the colour states are visible
        for (let k = 0; k < 8; k++) regs.push({ id: 'FC-DF' + k, name: 'Walk-in ' + (k + 1), email: 'walkin' + k + '@demo.my', phone: '0100000000', ic: '90010' + k + '-01-0000', cafe: '', from: 'Sungai Petani', preferredDate: openDay(5), session: S1, classFee: 150, deposit: 75, depositStatus: 'Paid', classStatus: k < 5 ? 'Admitted' : 'Pending Confirmation', createdAt: ago(8 + k), paidAt: ago(8 + k) });
        D.write(K.regs, regs);

        // ---- orders ----
        const addr = i => ['12 Jalan Bunga, Taman Indah, 08000 Sungai Petani, Kedah', '8 Lorong Aman, 11900 Bayan Lepas, Pulau Pinang', 'Unit 5, Jalan Ampang, 50450 Kuala Lumpur', '3 Jalan Kong, 30300 Ipoh, Perak', '21 Lorong Kenanga, 05000 Alor Setar, Kedah', '9 Jalan Mutiara, 09000 Kulim, Kedah'][i] || person(i)[5];
        const order = (id, i, items, status, created, extra) => {
            const its = catalogItems(items), sub = its.reduce((a, x) => a + x.price * x.qty, 0), paid = status !== 'Pending Payment' && status !== 'Cancelled';
            return Object.assign({ id, email: person(i)[1], name: person(i)[0], phone: person(i)[2], address: addr(i), items: its, subtotal: sub, shipping: CFG.SHIPPING, discount: 0, total: sub + CFG.SHIPPING, status, paymentStatus: paid ? 'Paid' : 'Unpaid', createdAt: ago(created), paidAt: paid ? ago(created) : undefined }, extra || {});
        };
        D.write(K.orders, [
            order('ORD240101', 0, [['hitam-manis', 2], ['tshirt', 1]], 'Processing', 0.3), order('ORD240102', 1, [['sunrise', 3]], 'Shipped', 2, { tracking: { courier: 'Pos Laju', number: 'EP123456789MY' } }),
            order('ORD240103', 2, [['sticker-pack', 2]], 'Pending Payment', 1.4), order('ORD240104', 3, [['black-stone', 1], ['hitam-manis', 4]], 'Completed', 12, { tracking: { courier: 'J&T Express', number: 'JT0011223344' } }),
            order('ORD240105', 4, [['cream-beans', 2]], 'Processing', 0.8), order('ORD240106', 5, [['tshirt', 2]], 'Cancelled', 6), order('ORD240107', 0, [['cream-beans', 1]], 'Completed', 20, { tracking: { courier: 'Pos Laju', number: 'EP998877665MY' } })
        ]);

        // ---- workshop enrollments ----
        const ws = (id, i, wid, modeIdx, slotIdx, status, created) => {
            const w = D.slots.catalog().find(x => x.id === wid), mode = Object.keys(w.modes)[modeIdx], slot = (w.slots[mode] || [])[slotIdx] || '';
            return { id, ref: 'RP-WS-' + id.slice(-4) + '01', email: person(i)[1], name: person(i)[0], workshopId: wid, title: w.title, mode, modeLabel: w.modes[mode].label, location: w.modes[mode].location, slot, price: w.price, listPrice: w.price, discount: 0, status, paymentStatus: status === 'Pending Payment' ? 'Unpaid' : 'Paid', createdAt: ago(created), paidAt: status === 'Pending Payment' ? undefined : ago(created) };
        };
        D.write(K.enrolls, [ws('WS-D001', 0, 'latte-art', 0, 0, 'Confirmed', 5), ws('WS-D002', 2, 'latte-art', 0, 0, 'Pending Payment', 1), ws('WS-D003', 3, 'brewing-masterclass', 0, 1, 'Confirmed', 7), ws('WS-D004', 5, 'cupping-experience', 1, 0, 'Confirmed', 4), ws('WS-D005', 8, 'brewing-masterclass', 1, 0, 'Confirmed', 2)]);

        // ---- profiles, points activity ----
        D.write(K.profiles, {
            'member@nbca.academy': { phone: '0123456789', addresses: [{ id: 'A-D1', label: 'Home', name: 'Nana Zailani', phone: '0123456789', line1: '12 Jalan Bunga', line2: 'Taman Indah', postcode: '08000', city: 'Sungai Petani', state: 'Kedah', isDefault: true }, { id: 'A-D2', label: 'Work', name: 'Nana Zailani', phone: '0123456789', line1: 'Kopi Kita, 4 Jalan Sultanah', line2: '', postcode: '05000', city: 'Alor Setar', state: 'Kedah', isDefault: false }] },
            'zaki@demo.my': { phone: '0139876543', addresses: [{ id: 'A-D3', label: 'Home', name: 'Ahmad Zaki', phone: '0139876543', line1: '8 Lorong Aman', line2: '', postcode: '11900', city: 'Bayan Lepas', state: 'Pulau Pinang', isDefault: true }] }
        });
        D.write(K.ledger, []);           // rebuilt from the data above by loyalty.sync()
        D.loyalty.sync();
        D.loyalty.adjust('member@nbca.academy', 100, 'Welcome event bonus', 'demo');
        const r = D.loyalty.redeem('zaki@demo.my', 'V-BEANS10');
        if (!r.ok) { D.loyalty.adjust('zaki@demo.my', 200, 'Demo top-up', 'demo'); D.loyalty.redeem('zaki@demo.my', 'V-BEANS10'); }
        localStorage.setItem('rp_demo_seeded', String(now()));
        return { members: accounts.length, bookings: regs.length, orders: 7 };
    }

    // Empties business data. keepSettings=true here means "we are about to re-seed".
    function clear(quiet) {
        [K.accounts, K.activity, K.instructors, K.assignments, K.slots, K.ledger, K.redemptions, K.regs, K.orders, K.enrolls, K.profiles, 'rp_portal_cart', 'rp_billplz_bills', 'rp_demo_seeded', K.session].forEach(k => localStorage.removeItem(k));
        return true;
    }

    window.NBCA_DEMO = {
        seed, clear,
        seeded: () => !!localStorage.getItem('rp_demo_seeded'),
        credentials: [
            { role: 'Admin', name: 'Super Admin', email: 'admin@nbca.academy', password: '123456', where: 'admin-login.html' },
            { role: 'Member', name: 'Nana Zailani (rich sample data)', email: 'member@nbca.academy', password: '123456', where: 'auth.html' },
            { role: 'Member', name: 'Ahmad Zaki', email: 'zaki@demo.my', password: 'demo1234', where: 'auth.html' },
            { role: 'Member', name: 'Siti Aminah', email: 'siti@demo.my', password: 'demo1234', where: 'auth.html' },
            { role: 'Member (suspended)', name: 'Hafiz Ismail', email: 'hafiz@demo.my', password: 'demo1234', where: 'auth.html' }
        ]
    };
})();
