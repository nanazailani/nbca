# Client demo guide — Phase 1

This build runs entirely in the browser (data lives in `localStorage`), so open **admin and member in the same browser**
(use two tabs, or a normal and an incognito window per role only if you do not need to see each other's data).

## Phase 1 scope

| Feature | Status |
| --- | --- |
| Public homepage with class lineup and consulting section | ✅ Live |
| Class booking — Beverage Foundation & Barista Basic | ✅ Live |
| Billplz demo payment (deposit or full pay per class) | ✅ Live |
| Consultation request & approval flow | ✅ Live |
| Member accounts, auth, profile | ✅ Live |
| Admin dashboard, bookings, members, class schedule | ✅ Live |
| Admin consultations management | ✅ Live |
| Online Shop (beans, merch, basket, orders) | 🔒 Phase 2 — hidden |
| Workshops / masterclasses | 🔒 Phase 2 — hidden |
| Membership & rewards (points, tiers, vouchers) | 🔒 Phase 2 — hidden |

To enable Phase 2 features, set the relevant flags to `true` in `js/nbca-config.js`:

```js
FEATURES: {
    consultation: true,   // Phase 1 ✅
    shop:         false,  // Phase 2 — change to true
    workshops:    false,  // Phase 2 — change to true
    rewards:      false   // Phase 2 — change to true
}
```

---

## Before the demo

1. Open `admin-login.html` and sign in with the admin account below.
2. Go to **Website & Demo → Demo data** and press **Load sample data**. This creates members, bookings across
   Beverage Foundation & Barista Basic in every status, 6 consultations in all statuses, and instructors.
   Press it again any time to reset.
3. Open the public homepage (`index.html`) in another tab.

## Test accounts

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin | `admin@nbca.academy` | `123456` | Owner account |
| Member | `member@nbca.academy` | `123456` | Nana Zailani: Barista Basic booking, Accepted consultation |
| Member | `zaki@demo.my` | `demo1234` | Has a Beverage Foundation booking and 2 consultations (Requested + Alternative Proposed) |
| Member | `siti@demo.my` | `demo1234` | Has a Completed consultation |
| Member (suspended) | `hafiz@demo.my` | `demo1234` | Login is refused with a clear message |

The login pages show a yellow "Demo" box with a **Fill in** button. Payments use the demo Billplz page (`pay.html`),
where you choose whether the payment succeeds or fails.

---

## Suggested walkthrough — about 20 minutes

### 1. Public homepage (`index.html`)

- Class lineup: Beverage Foundation and Barista Basic cards with "Register Now"; SCA Classes "Coming Soon".
- Consulting section: 4 consultation types, 3-step how-it-works, "Request a Consultation" CTA.
- Announcements section (content managed by admin).
- Everything except products and the About text can be changed by the admin (see **Website & Demo → Homepage map**).

### 2. Member: class booking (`zaki@demo.my`)

1. Sign in → dashboard shows next class, stats and the Consulting promo card.
2. Click **Register Now** on the Beverage Foundation card (or go to *Book a Class*).
3. Pick a class → choose a date and session → fill in details.
4. Step 3 shows the deposit amount and balance due. Pay the deposit on the demo Billplz page (try a failed payment
   first, then retry from *My Classes*).
5. *My Classes* → view booking status, mark deposit paid (admin), reschedule (WhatsApp link).

### 3. Member: consultation request (`zaki@demo.my`)

1. Go to *My Consultations* (nav or dashboard card).
2. Submit a new consultation request: pick a type, preferred date/time, meeting mode.
3. Notice the "No payment required for now" banner (Phase 1 — no consultation fee).
4. Existing consultations: zaki has one "Alternative Proposed" (accept or reject the proposed time) and
   one "Requested" (can cancel).
5. Accepted consultations show a WhatsApp link to the academy.

### 4. Admin: manage consultations (`admin@nbca.academy`)

1. *Consultations* → KPI tiles (requested, accepted, completed, declined).
2. Filter by status chip; search by name or topic.
3. On a "Requested" card: **Accept** (shows a double-booking warning if needed), **Propose alternative** (enter
   a different date/time and a note), or **Decline** (enter a reason).
4. On an "Alternative Proposed" card: the member has seen the proposal and accepted or rejected it.
5. **Mark completed** after the session happens.
6. **Add note** at any point.
7. Export CSV for records.

### 5. Admin: class bookings

1. *Class Bookings* → filter by class (Beverage Foundation / Barista Basic), status chips.
2. Cards show: class name pill, payment mode (deposit/full), paid/unpaid status, balance due.
3. Admit → mark deposit paid → export certificate list (name + IC).

### 6. Admin: member detail drawer

1. *Members* → click **View details** on any member.
2. Drawer shows: class bookings, consultations with status pills and a "Manage →" link, profile info.
3. Suspend / reactivate / reset password / delete from the drawer.

### 7. Admin: schedule & settings

1. *Class Schedule* → assign instructors to sessions; manage per-class fee and payment mode
   (Beverage Foundation and Barista Basic can have different fees and deposit %).
2. *Manage → Fixed Class Settings* → per-class tabs: set fee, payment mode (deposit / full pay), deposit %.

### 8. Admin: website & demo

1. *Website & Demo → Homepage map* → every section listed with an "Editable/Fixed in code" badge.
2. Consulting section shows pending request count.
3. *Contact & highlights* → edit WhatsApp, address, TikTok and the three hero figures.

---

## Known limits to mention

* Data is per browser — this is a front-end demo. Real use needs a backend (database, hashed passwords, real Billplz callbacks).
* Class type cards, consultation types and the About text are set in the code.
* Daily-class sessions and open days are configured in `js/nbca-config.js`.

## Before going live (checklist)

* Remove `js/demo-data.js`, the *Demo data* tab in `js/admin/website.js`, and the yellow demo hints in `auth.html` /
  `admin-login.html` (marked `DEMO ONLY`).
* Replace the built-in admin credentials in `admin-login.html`.
* Move accounts, payments and storage to a server.
* Decide Phase 2 launch date and flip the feature flags in `js/nbca-config.js`.
