/* Nb.CA Academy — admin UI kit.
 * One place for the building blocks every admin page uses, so pages stay consistent:
 *   UI.pill / btn / chip / kpi / empty / avatar / header     small presentational pieces (return HTML strings)
 *   UI.confirm({title, message, ok, danger})                 -> Promise<boolean>
 *   UI.form({title, fields, submit, validate})               -> Promise<values | null>
 * See docs/admin-design-system.md for when to use which. */
(function () {
    const S = window.AdminShell, esc = S.esc;

    const TONE = { good: 'bg-emerald-100 text-emerald-700', warn: 'bg-amber-100 text-amber-700', info: 'bg-blue-100 text-blue-700', bad: 'bg-red-100 text-red-700', muted: 'bg-slate-100 text-slate-600' };
    const INPUT = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amberGold focus:ring-2 focus:ring-blue-100 transition-all';

    const pill = (text, tone) => '<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap ' + TONE[tone || 'muted'] + '">' + esc(text) + '</span>';
    const KINDS = {
        primary: 'bg-amberGold hover:bg-royalBlue text-white shadow-sm', good: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
        danger: 'bg-white hover:bg-red-50 text-red-600 border border-red-200', ghost: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
    };
    const btn = (label, onclick, kind) => '<button type="button" onclick="' + onclick + '" class="px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ' + KINDS[kind || 'ghost'] + '">' + label + '</button>';
    const chip = (label, count, active, onclick) => '<button type="button" onclick="' + onclick + '" class="px-4 py-2 rounded-full text-xs font-bold border transition-all ' + (active ? 'bg-amberGold text-white border-amberGold shadow' : 'bg-white text-slate-700 border-slate-200 hover:border-amberGold') + '">' + label + (count == null ? '' : ' <span class="ml-1 opacity-70">' + count + '</span>') + '</button>';
    const avatar = (name, size) => '<span class="' + (size === 'lg' ? 'w-16 h-16 text-lg' : 'w-11 h-11 text-sm') + ' rounded-full bg-blue-100 text-amberGold font-bold flex items-center justify-center shrink-0">' + esc(S.initials(name)) + '</span>';
    const empty = (icon, title, text, action) => '<div class="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center space-y-3"><div class="w-14 h-14 rounded-2xl bg-blue-50 text-amberGold flex items-center justify-center mx-auto text-2xl"><i class="fa-solid ' + icon + '"></i></div><h3 class="font-serif text-lg font-bold text-slate-900">' + title + '</h3><p class="text-xs text-slate-500 max-w-sm mx-auto">' + text + '</p>' + (action || '') + '</div>';
    // KPI tile. opts: {icon, tone: 'emerald'|'amber'|'blue'|'violet'|'rose', value, label, sub, href}
    const KPI_TONE = { emerald: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600', blue: 'bg-blue-100 text-amberGold', violet: 'bg-violet-100 text-violet-600', rose: 'bg-rose-100 text-rose-600' };
    const kpi = o => {
        const inner = '<div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 ' + KPI_TONE[o.tone || 'blue'] + '"><i class="fa-solid ' + o.icon + '"></i></div><p class="text-xl xl:text-[1.35rem] font-extrabold text-slate-900 font-serif leading-tight whitespace-nowrap">' + o.value + '</p><p class="text-xs font-bold text-slate-700 mt-0.5">' + o.label + '</p>' + (o.sub ? '<p class="text-[11px] mt-0.5 ' + (o.subTone || 'text-slate-500') + '">' + o.sub + '</p>' : '');
        const cls = 'block bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm' + (o.href ? ' hover:shadow-lg hover:-translate-y-0.5 transition-all' : '');
        return o.href ? '<a href="' + o.href + '" class="' + cls + '">' + inner + '</a>' : '<div class="' + cls + '">' + inner + '</div>';
    };
    // Page header: eyebrow + title on the left, action buttons on the right.
    const header = (eyebrow, title, actions) => '<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3"><div><span class="text-[11px] font-extrabold tracking-[0.18em] text-amberGold uppercase">' + eyebrow + '</span><h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">' + title + '</h2></div>' + (actions ? '<div class="flex flex-wrap gap-2 self-start">' + actions + '</div>' : '') + '</div>';
    const tabs = (items, active, onclickFn) => '<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex gap-1 overflow-x-auto" role="tablist">' + items.map(t => '<button type="button" role="tab" aria-selected="' + (t[0] === active) + '" onclick="' + onclickFn + "('" + t[0] + "')" + '" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ' + (t[0] === active ? 'bg-amberGold text-white shadow' : 'text-slate-600 hover:bg-slate-100') + '">' + (t[2] ? '<i class="fa-solid ' + t[2] + '"></i>' : '') + t[1] + '</button>').join('') + '</div>';
    const iconBtn = (icon, title, onclick, danger) => '<button type="button" onclick="' + onclick + '" title="' + title + '" aria-label="' + title + '" class="w-9 h-9 rounded-xl border flex items-center justify-center transition-all ' + (danger ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:border-amberGold hover:text-amberGold bg-white') + '"><i class="fa-solid ' + icon + ' text-xs"></i></button>';

    // ---- dialogs (created on demand, one instance each) ----
    function dialogShell(id, inner, maxW) {
        let box = document.getElementById(id);
        if (!box) { box = document.createElement('div'); box.id = id; box.className = 'fixed inset-0 z-[70] hidden flex items-center justify-center p-4'; document.body.appendChild(box); }
        box.innerHTML = '<div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-close></div><div class="relative bg-white rounded-3xl ' + (maxW || 'max-w-sm') + ' w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl">' + inner + '</div>';
        return box;
    }
    const confirmDialog = o => new Promise(res => {
        const box = dialogShell('ui-confirm', '<div class="space-y-4"><h3 class="font-serif text-lg font-bold text-slate-900"></h3><p class="text-xs text-slate-600 leading-relaxed"></p><div class="flex gap-3 pt-1"><button data-ok class="flex-1 py-3 text-white font-bold rounded-xl text-xs shadow"></button><button data-close class="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Cancel</button></div></div>');
        box.querySelector('h3').innerText = o.title || 'Are you sure?';
        box.querySelector('p').innerText = o.message || '';
        const ok = box.querySelector('[data-ok]'); ok.innerText = o.ok || 'Confirm';
        ok.className = 'flex-1 py-3 text-white font-bold rounded-xl text-xs shadow ' + (o.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amberGold hover:bg-royalBlue');
        const done = v => { box.classList.add('hidden'); res(v); };
        ok.onclick = () => done(true); box.querySelectorAll('[data-close]').forEach(b => b.onclick = () => done(false));
        box.classList.remove('hidden'); ok.focus();
    });

    // field spec: {id, label, type: text|email|tel|number|password|date|select|textarea|checkbox, value, options, required, placeholder, hint, min, step, half}
    function fieldHtml(f) {
        const id = 'uf-' + f.id, val = f.value == null ? '' : f.value, req = f.required ? ' required' : '';
        const label = f.type === 'checkbox' ? '' : '<label for="' + id + '" class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">' + esc(f.label) + (f.required ? ' *' : '') + '</label>';
        let control;
        if (f.type === 'select') control = '<select id="' + id + '" class="' + INPUT + '"' + req + '>' + (f.options || []).map(o => { const v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o; return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
        else if (f.type === 'textarea') control = '<textarea id="' + id + '" rows="' + (f.rows || 3) + '" class="' + INPUT + '" placeholder="' + esc(f.placeholder || '') + '"' + req + '>' + esc(val) + '</textarea>';
        else if (f.type === 'checkbox') control = '<label class="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"><input id="' + id + '" type="checkbox" class="w-4 h-4 accent-blue-600"' + (val ? ' checked' : '') + '> ' + esc(f.label) + '</label>';
        else if (f.type === 'password') control = '<div class="relative"><input id="' + id + '" type="password" autocomplete="new-password" class="' + INPUT + ' pr-11" placeholder="' + esc(f.placeholder || '') + '" value="' + esc(val) + '"' + req + '><button type="button" onclick="UI.togglePw(\'' + id + '\', this)" class="absolute inset-y-0 right-0 px-3.5 text-slate-500 hover:text-amberGold" aria-label="Show password"><i class="fa-solid fa-eye"></i></button></div>';
        else control = '<input id="' + id + '" type="' + (f.type || 'text') + '" class="' + INPUT + '" placeholder="' + esc(f.placeholder || '') + '" value="' + esc(val) + '"' + req + (f.min != null ? ' min="' + f.min + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + '>';
        return '<div class="' + (f.half ? '' : 'sm:col-span-2') + '">' + label + control + (f.hint ? '<p class="text-[10px] text-slate-500 mt-1">' + f.hint + '</p>' : '') + '</div>';
    }
    const formDialog = o => new Promise(res => {
        const box = dialogShell('ui-form', '<form novalidate class="space-y-5"><div><h3 class="font-serif text-xl font-bold text-slate-900"></h3><p data-desc class="text-xs text-slate-500 mt-1 hidden"></p></div><div data-fields class="grid sm:grid-cols-2 gap-4"></div><p data-error class="hidden text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"></p><div class="flex gap-3"><button type="submit" class="flex-1 py-3 bg-amberGold hover:bg-royalBlue text-white font-bold rounded-xl text-xs shadow"></button><button type="button" data-close class="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Cancel</button></div></form>', o.wide ? 'max-w-xl' : 'max-w-md');
        box.querySelector('h3').innerText = o.title;
        if (o.description) { const d = box.querySelector('[data-desc]'); d.innerText = o.description; d.classList.remove('hidden'); }
        box.querySelector('[data-fields]').innerHTML = o.fields.map(fieldHtml).join('');
        box.querySelector('[type=submit]').innerText = o.submit || 'Save';
        const err = box.querySelector('[data-error]'), form = box.querySelector('form');
        const close = v => { box.classList.add('hidden'); res(v); };
        box.querySelectorAll('[data-close]').forEach(b => b.onclick = () => close(null));
        form.onsubmit = e => {
            e.preventDefault();
            const values = {};
            for (const f of o.fields) {
                const el = document.getElementById('uf-' + f.id);
                let v = f.type === 'checkbox' ? el.checked : el.value.trim();
                if (f.type === 'password') v = el.value;
                if (f.required && f.type !== 'checkbox' && v === '') { err.innerText = f.label + ' is required.'; err.classList.remove('hidden'); el.focus(); return; }
                if (f.type === 'number' && v !== '') { v = Number(v); if (isNaN(v)) { err.innerText = f.label + ' must be a number.'; err.classList.remove('hidden'); return; } }
                values[f.id] = v;
            }
            const problem = o.validate && o.validate(values);
            if (problem) { err.innerText = problem; err.classList.remove('hidden'); return; }
            close(values);
        };
        err.classList.add('hidden');
        box.classList.remove('hidden');
        const first = box.querySelector('input:not([type=checkbox]), select, textarea'); if (first) first.focus();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') ['ui-confirm', 'ui-form'].forEach(id => { const b = document.getElementById(id); if (b && !b.classList.contains('hidden')) b.querySelector('[data-close]').click(); }); });

    function togglePw(id, btn) {
        const i = document.getElementById(id), show = i.type === 'password';
        i.type = show ? 'text' : 'password';
        btn.innerHTML = '<i class="fa-solid ' + (show ? 'fa-eye-slash' : 'fa-eye') + '"></i>';
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }

    window.UI = { TONE, INPUT, pill, btn, iconBtn, chip, avatar, empty, kpi, header, tabs, confirm: confirmDialog, form: formDialog, togglePw, param: k => new URLSearchParams(location.search).get(k) };
})();
