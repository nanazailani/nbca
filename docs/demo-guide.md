# Client demo guide

This build runs entirely in the browser (data lives in `localStorage`), so open **admin and member in the same browser**
(use two tabs, or a normal and an incognito window per role only if you do not need to see each other's data).

## Before the demo

1. Open `admin-login.html` and sign in with the admin account below.
2. Go to **Website & Demo → Demo data** and press **Load sample data**. This creates 10 members, bookings in every status,
   orders through the whole flow, workshop enrollments, instructors and rewards. Press it again any time to reset.
3. Open the public homepage (`index.html`) in another tab.

## Test accounts

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin | `admin@nbca.academy` | `123456` | Owner account |
| Member | `member@nbca.academy` | `123456` | Nana Zailani: has classes, orders, a workshop and 630 points |
| Member | `zaki@demo.my` | `demo1234` | Has an unused RM10 voucher and a saved address |
| Member | `siti@demo.my` | `demo1234` | Has an unpaid order and an unpaid workshop (test "Pay now") |
| Member (suspended) | `hafiz@demo.my` | `demo1234` | Login is refused with a clear message |

The login pages show a yellow "Demo" box with a **Fill in** button. Payments use the demo Billplz page (`pay.html`), where
you choose whether the payment succeeds or fails.

## Suggested walkthrough (about 15 minutes)

**1. Public homepage** – announcements, team (instructors from the admin), the daily class card, workshops. Everything
except products and the About text can be changed by the admin (see *Website & Demo → Homepage map*).

**2. Member journey** (`zaki@demo.my`)
1. Sign in → dashboard shows next class, points, promotions.
2. *Fixed Classes* → book a date and session → pay the deposit on the demo Billplz page (try a failed payment first, then retry from *My Classes*).
3. *Workshops* → enroll (full sessions are disabled) → apply a voucher.
4. *Coffee Beans* → basket → checkout with the saved address and the voucher → pay.
5. *Membership* → redeem a reward, see the code, tier progress and history.
6. *My Profile* → edit details, change password (eye button), add an address and set a default.

**3. Admin journey** (`admin@nbca.academy`)
1. *Dashboard* → switch Day / Week / Month / Year / Custom; note sign-ups per day and active members.
2. *Class Bookings* → admit the booking you just made, try reschedule (opens WhatsApp), export the certificate list (name + IC).
3. *Class Schedule* → assign an instructor to that session; add a workshop session and see it appear on the homepage.
4. *Orders* → ship the order with a tracking number → the member sees the tracking on *My Orders*.
5. *Members* → suspend a member (they are signed out on their next page), reset a password, adjust points.
6. *Membership & Rewards* → change the earn rate, tiers and vouchers.
7. *Website & Demo → Contact & highlights* → change the WhatsApp number or the hero figures and refresh the homepage.

## Known limits to mention

* Data is per browser, so this is a front-end demo. Real use needs a backend (database, hashed passwords, real Billplz callbacks).
* Products, prices and the About text are still set in the code; the Inventory tab is a sample list, not connected to the shop.
* Daily-class sessions and open days are fixed in `js/nbca-config.js`.

## Before going live (checklist)

* Remove `js/demo-data.js`, the *Demo data* tab in `js/admin/website.js`, and the yellow demo hints in `auth.html` / `admin-login.html` (marked `DEMO ONLY`).
* Replace the built-in admin credentials in `admin-login.html`.
* Move accounts, payments and storage to a server.
