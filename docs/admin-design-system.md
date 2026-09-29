# Nb.CA Academy — Admin console conventions

The admin is a set of static pages that share one shell, one UI kit and one data layer. Keep new work inside these
conventions so screens stay consistent and easy to change.

## File map

| File | Responsibility |
| --- | --- |
| `js/nbca-config.js` | Business constants shared with the member portal (seat capacity, sessions, hold time, shipping). |
| `js/nbca-data.js` | **Domain layer.** Accounts, sessions, activity log, instructors + assignments, workshop slots, loyalty ledger / vouchers. The only place that knows storage keys and business rules. |
| `js/admin/shell.js` | Chrome: sidebar, mobile drawer, top bar, bottom nav, toast. Also `AdminShell` helpers (records, members, counts, CSV, WhatsApp link, date formatting). |
| `js/admin/ui.js` | UI kit (`UI.*`): pills, buttons, chips, KPI tiles, empty states, tabs, `UI.confirm()` and `UI.form()`. |
| `js/admin/<page>.js` | One controller per page. Exposes a single global (`Bookings`, `Members`, ...) used by `onclick` handlers. |
| `admin-<page>.html` | Thin page: head, containers with ids, script tags. No business logic. |
| `admin-manage.html` | Older catalog screens (fixed class settings, inventory, announcements) plus admin accounts. |

Script order on every page: `nbca-config` → `nbca-data` → `catalog` → `admin/shell` → `admin/ui` → `admin/<page>`.

## Page anatomy

1. **Header**: eyebrow (uppercase, blue) + serif title on the left, actions on the right.
2. **Summary**: 4 KPI tiles (`UI.kpi`) when the page is about a collection.
3. **Filter bar**: status chips (`UI.chip`, each with a count) → search input → optional select.
4. **Content**: list of cards, or a grid. Every list has an empty state (`UI.empty`) that says what will appear and, where possible, offers the next action.
5. **Actions live on the card**, primary action first, destructive last in red.

## Components and when to use them

* **Pill** (`UI.pill(text, tone)`): status only. Tones: `good` done/paid, `warn` waiting on someone, `info` in progress, `bad` needs action/failed, `muted` inactive.
* **Button kinds**: `primary` one per card at most; `good` confirms a positive outcome (Admit, Mark paid); `ghost` neutral; `danger` cancel/delete.
* **`UI.confirm`**: every destructive or money-related action. Say what happens to the person and to their data.
* **`UI.form`**: any create/edit that needs input. Declare `fields`, add `validate(values)` for cross-field rules; it resolves `null` on cancel.
* **Toast** (`AdminShell.toast`): confirm the result of every action in one short sentence.

## Data rules

* Read/write business data through `NBCA_DATA` (or the `AdminShell` record helpers). Do not add new raw `localStorage` keys in pages.
* Points are a **ledger** (`rp_points_ledger`): rows are created idempotently by `loyalty.sync()` and never edited. A change to the earn rate applies to future points only.
* A booking holds a seat unless it is cancelled / flagged for reschedule, or unpaid past the hold window (`AdminShell.holdsSeat`).
* Suspending or deleting an account signs the member out on their next portal page load (`session.account()` returns `null`).
* Cancelling an order, booking or enrollment that used a voucher gives the voucher back (`loyalty.restore`).

## Accessibility and responsive

* Icon-only buttons need `aria-label` (`UI.iconBtn` does this). Dialogs close on `Esc`.
* Layout is mobile first: cards stack, the sidebar becomes a drawer, primary areas are reachable from the bottom nav.
* Colour is never the only signal: statuses always carry text.

## Known limits (demo build)

* Data is stored in the browser (`localStorage`), so admin and members only see each other's data in the same browser. A backend is required before launch.
* Passwords are plain text and payments use a simulated Billplz page (`pay.html`). Both must move server-side.
