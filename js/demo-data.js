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
        // A stand-in bank receipt image so the admin's payment-verification flow (UC-300) has something to review.
        const RECEIPT = 'data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400'><rect width='300' height='400' fill='#f8fafc'/><rect x='20' y='20' width='260' height='56' rx='8' fill='#2563EB'/><text x='150' y='55' font-family='sans-serif' font-size='18' fill='white' text-anchor='middle'>DuitNow Transfer</text><text x='40' y='120' font-family='sans-serif' font-size='14' fill='#334155'>Amount: RM 75.00</text><text x='40' y='150' font-family='sans-serif' font-size='14' fill='#334155'>To: NB.CA Academy Sdn Bhd</text><text x='40' y='180' font-family='sans-serif' font-size='14' fill='#334155'>Ref: DN24010012345</text><text x='40' y='212' font-family='sans-serif' font-size='13' fill='#16a34a'>Status: Successful</text><line x1='40' y1='240' x2='260' y2='240' stroke='#e2e8f0'/><text x='40' y='280' font-family='sans-serif' font-size='12' fill='#64748b'>Maybank2u e-Receipt</text></svg>");
        const person = i => MEMBERS[i];
        const reg = (id, i, dayN, session, deposit, klass, created, extra) => Object.assign({ id, name: person(i)[0], email: person(i)[1], phone: person(i)[2], ic: person(i)[3], cafe: person(i)[4], from: person(i)[5], preferredDate: openDay(dayN), session, classFee: 150, deposit: 75, depositStatus: deposit, classStatus: klass, createdAt: ago(created), paidAt: deposit === 'Paid' ? ago(created) : undefined }, extra || {});
        const regs = [
            reg('FC-D01', 0, 1, S1, 'Paid', 'Admitted', 3), reg('FC-D02', 1, 1, S1, 'Paid', 'Pending Confirmation', 2), reg('FC-D03', 2, 1, S2, 'Paid', 'Pending Confirmation', 1.5),
            reg('FC-D04', 4, 2, S1, 'Paid', 'Admitted', 4), reg('FC-D05', 5, 2, S1, 'Paid', 'Pending Confirmation', 2.5), reg('FC-D06', 6, 3, S2, 'Paid', 'Reschedule', 5),
            reg('FC-D07', 7, 3, S1, 'Pending', 'Awaiting Payment', 0.1, { paidAt: undefined }), reg('FC-D08', 8, 4, S1, 'Paid', 'Pending Confirmation', 0.6),
            // UC-300: receipts uploaded by members, waiting for the admin to verify / reject.
            // FC-DV1 and FC-DV3 belong to the demo member (index 0) so the member portal shows both states.
            reg('FC-DV1', 0, 2, S2, 'Pending', 'Awaiting Payment', 0.3, { proofImage: RECEIPT, paymentStatus: 'Submitted', proofUploadedAt: ago(0.2) }),
            reg('FC-DV2', 3, 3, S1, 'Pending', 'Awaiting Payment', 0.5, { proofImage: RECEIPT, paymentStatus: 'Submitted', proofUploadedAt: ago(0.4) }),
            reg('FC-DV3', 0, 4, S2, 'Pending', 'Awaiting Payment', 1, { proofImage: RECEIPT, paymentStatus: 'Rejected', paymentRejectReason: 'The transfer shows RM50 but the deposit is RM75. Please pay the balance and upload again.', proofUploadedAt: ago(0.9) }),
            reg('FC-D09', 3, -2, S1, 'Paid', 'Admitted', 9), reg('FC-D10', 1, -4, S2, 'Paid', 'Admitted', 12), reg('FC-D11', 2, -6, S1, 'Paid', 'Admitted', 14), reg('FC-D12', 0, -8, S1, 'Paid', 'Admitted', 16)
        ];
        // a nearly-full session so the colour states are visible
        for (let k = 0; k < 8; k++) regs.push({ id: 'FC-DF' + k, name: 'Walk-in ' + (k + 1), email: 'walkin' + k + '@demo.my', phone: '0100000000', ic: '90010' + k + '-01-0000', cafe: '', from: 'Sungai Petani', preferredDate: openDay(5), session: S1, classFee: 150, deposit: 75, depositStatus: 'Paid', classStatus: k < 5 ? 'Admitted' : 'Pending Confirmation', createdAt: ago(8 + k), paidAt: ago(8 + k) });
        D.write(K.regs, regs);

        // ---- manual payment settings (UC-300): only set if the admin has not configured their own ----
        if (!D.payment.configured()) {
            const QR = 'data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='white'/><g fill='#0f172a'><rect x='20' y='20' width='50' height='50'/><rect x='30' y='30' width='30' height='30' fill='white'/><rect x='38' y='38' width='14' height='14' fill='#0f172a'/><rect x='130' y='20' width='50' height='50'/><rect x='140' y='30' width='30' height='30' fill='white'/><rect x='148' y='38' width='14' height='14' fill='#0f172a'/><rect x='20' y='130' width='50' height='50'/><rect x='30' y='140' width='30' height='30' fill='white'/><rect x='38' y='148' width='14' height='14' fill='#0f172a'/><rect x='90' y='30' width='12' height='12'/><rect x='90' y='60' width='12' height='12'/><rect x='110' y='90' width='12' height='12'/><rect x='90' y='110' width='12' height='12'/><rect x='140' y='110' width='12' height='12'/><rect x='160' y='130' width='12' height='12'/><rect x='130' y='150' width='12' height='12'/><rect x='150' y='160' width='12' height='12'/><rect x='90' y='150' width='12' height='12'/></g><text x='100' y='195' font-family='sans-serif' font-size='10' fill='#2563EB' text-anchor='middle'>DuitNow QR (demo)</text></svg>");
            D.payment.save({ qrImage: QR, bankName: 'Maybank', accountName: 'NB.CA Academy Sdn Bhd', accountNumber: '5567 1234 5678' });
        }

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
        const ws = (id, i, wid, modeIdx, slotIdx, status, created, extra) => {
            const w = D.slots.catalog().find(x => x.id === wid), mode = Object.keys(w.modes)[modeIdx], slot = (w.slots[mode] || [])[slotIdx] || '';
            return Object.assign({ id, ref: 'RP-WS-' + id.slice(-4) + '01', email: person(i)[1], name: person(i)[0], workshopId: wid, title: w.title, mode, modeLabel: w.modes[mode].label, location: w.modes[mode].location, slot, price: w.price, listPrice: w.price, discount: 0, status, paymentStatus: status === 'Pending Payment' ? 'Unpaid' : 'Paid', createdAt: ago(created), paidAt: status === 'Pending Payment' ? undefined : ago(created) }, extra || {});
        };
        D.write(K.enrolls, [ws('WS-D001', 0, 'latte-art', 0, 0, 'Confirmed', 5), ws('WS-D002', 2, 'latte-art', 0, 0, 'Pending Payment', 1),
            // UC-300: uploaded receipts waiting for the admin to verify (WS-DV1 belongs to the demo member).
            ws('WS-DV1', 0, 'cupping-experience', 0, 0, 'Pending Payment', 0.4, { paymentStatus: 'Submitted', proofImage: RECEIPT, proofUploadedAt: ago(0.3) }),
            ws('WS-DV2', 6, 'brewing-masterclass', 1, 0, 'Pending Payment', 0.6, { paymentStatus: 'Submitted', proofImage: RECEIPT, proofUploadedAt: ago(0.5) }),
            ws('WS-D003', 3, 'brewing-masterclass', 0, 1, 'Confirmed', 7), ws('WS-D004', 5, 'cupping-experience', 1, 0, 'Confirmed', 4), ws('WS-D005', 8, 'brewing-masterclass', 1, 0, 'Confirmed', 2)]);

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
        // ---- consultation requests ----
        D.write(K.consultations, [
            { id: 'CON-D001', name: 'Nana Zailani', email: 'member@nbca.academy', phone: '0123456789', business: 'Kopi Kita, Alor Setar', type: 'Cafe Setup & Planning', preferredDate: openDay(3), preferredTime: '10:00 AM', backupDate: openDay(4), backupTime: '2:00 PM', meetingMode: 'At the academy', requirements: 'Looking to open a second outlet in Sungai Petani. Need help with layout planning, equipment list and workflow design for a 600 sqft space.', status: 'Pending', adminNote: '', history: [{ at: ago(2), by: 'customer', action: 'Requested' }], createdAt: ago(2) },
            { id: 'CON-D002', name: 'Lee Wei Jian', email: 'lee@demo.my', phone: '0165554444', business: 'Brew Lab Ipoh', type: 'Staff Training', preferredDate: openDay(5), preferredTime: '2:00 PM', backupDate: '', backupTime: '', meetingMode: 'On-site (your cafe)', requirements: 'We have 4 new baristas who need basic espresso and milk steaming training. Preferably on-site at our cafe in Ipoh.', status: 'Accepted', adminNote: 'Confirmed — Chef Amin will conduct the session at your cafe.', history: [{ at: ago(5), by: 'customer', action: 'Requested' }, { at: ago(4.6), by: 'admin', action: 'Accepted — Chef Amin will conduct the session at your cafe.' }], createdAt: ago(5) },
            { id: 'CON-D003', name: 'Siti Aminah', email: 'siti@demo.my', phone: '0111222333', business: 'Warung Siti', type: 'Menu & Quality Audit', preferredDate: openDay(2), preferredTime: '11:00 AM', backupDate: openDay(4), backupTime: '3:00 PM', meetingMode: 'Online (video call)', requirements: 'Our coffee quality has been inconsistent. Want a professional audit of our brewing process, grinder settings, and menu structure.', status: 'Proposed', proposedDate: openDay(4), proposedTime: '3:00 PM', adminNote: 'We are fully booked on your preferred date. Would this alternative work?', history: [{ at: ago(3), by: 'customer', action: 'Requested' }, { at: ago(2.7), by: 'admin', action: 'Proposed ' + openDay(4) + ' 3:00 PM — fully booked on your preferred date.' }], createdAt: ago(3) },
            { id: 'CON-D004', name: 'Farid Hakim', email: 'farid@demo.my', phone: '0172223344', business: '', type: 'Cafe Setup & Planning', preferredDate: openDay(-1), preferredTime: '9:00 AM', backupDate: '', backupTime: '', meetingMode: 'At the academy', requirements: 'Planning to start a small kiosk-style coffee bar. Need advice on minimal equipment and startup costs.', status: 'Declined', adminNote: 'We are unable to take on new cafe setup consultations until next month. Please resubmit after 1 Nov.', history: [{ at: ago(8), by: 'customer', action: 'Requested' }, { at: ago(7.5), by: 'admin', action: 'Declined — unable to take new cafe setup consultations until next month.' }], createdAt: ago(8) },
            { id: 'CON-D005', name: 'Nurul Huda', email: 'huda@demo.my', phone: '0183334455', business: 'Huda Coffee Corner', type: 'Other', preferredDate: openDay(6), preferredTime: '4:00 PM', backupDate: openDay(7), backupTime: '5:00 PM', meetingMode: 'At the academy', requirements: 'Interested in private cupping session for my staff to better understand flavour profiles and origin differences.', status: 'Pending', adminNote: '', history: [{ at: ago(0.5), by: 'customer', action: 'Requested' }], createdAt: ago(0.5) },
            { id: 'CON-D006', name: 'Tan Mei Ling', email: 'meiling@demo.my', phone: '0194445566', business: 'Mei Coffee Bar', type: 'Menu & Quality Audit', preferredDate: openDay(-3), preferredTime: '10:00 AM', backupDate: '', backupTime: '', meetingMode: 'On-site (your cafe)', requirements: 'Wanted a second opinion on our espresso recipe and milk texturing before relaunching the menu.', status: 'Completed', adminNote: 'Session done — adjusted dose to 18g and milk steaming technique.', history: [{ at: ago(10), by: 'customer', action: 'Requested' }, { at: ago(9.5), by: 'admin', action: 'Accepted' }, { at: ago(3), by: 'admin', action: 'Marked completed — adjusted dose and milk steaming.' }], createdAt: ago(10) }
        ]);

        localStorage.setItem('rp_demo_seeded', String(now()));
        return { members: accounts.length, bookings: regs.length, orders: 7 };
    }

    // Empties business data. keepSettings=true here means "we are about to re-seed".
    function clear(quiet) {
        [K.accounts, K.activity, K.instructors, K.assignments, K.slots, K.ledger, K.redemptions, K.regs, K.orders, K.enrolls, K.profiles, K.consultations, 'rp_portal_cart', 'rp_billplz_bills', 'rp_demo_seeded', K.session].forEach(k => localStorage.removeItem(k));
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
