/* Admin: consultation requests — review, accept, propose alternative, decline, complete. */
(function () {
    const S = AdminShell, D = NBCA_DATA, CFG = S.CFG, esc = S.esc, $ = id => document.getElementById(id);
    const TYPES = (CFG.CONSULT_TYPES || []);
    const TIMES = (CFG.CONSULT_TIMES || []);

    let statusF = UI.param('status') || 'all';

    const STATUS = {
        'Requested':            ['Requested',             'info'],
        'Accepted':             ['Confirmed',             'good'],
        'Alternative Proposed': ['Alt. time proposed',   'warn'],
        'Declined':             ['Declined',              'bad'],
        'Completed':            ['Completed',             'muted'],
        'Cancelled':            ['Cancelled',             'muted']
    };

    // Populate topic filter on first load
    function initTypeFilter() {
        const sel = $('type-filter');
        if (!sel || sel.options.length > 1) return;
        TYPES.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.label; sel.appendChild(o); });
    }

    function all() { return D.consults.list(); }

    function filtered() {
        const q = ($('q').value || '').toLowerCase().trim();
        const typeF = ($('type-filter').value || '').toLowerCase();
        const sort = $('sort').value;
        return all().filter(c => {
            if (statusF !== 'all' && c.status !== statusF) return false;
            if (typeF && c.typeId !== typeF) return false;
            return !q || [c.name, c.email, c.phone, c.business, c.ref].some(v => (v || '').toLowerCase().includes(q));
        }).sort((a, b) => sort === 'soonest'
            ? a.preferredDate.localeCompare(b.preferredDate)
            : b.createdAt.localeCompare(a.createdAt));
    }

    function renderKpis() {
        const list = all();
        const cnt = s => list.filter(c => c.status === s).length;
        $('kpis').innerHTML = [
            { icon: 'fa-inbox', tone: 'blue',    value: cnt('Requested'),            label: 'Pending',          sub: 'Awaiting your response' },
            { icon: 'fa-calendar-check', tone: 'emerald', value: cnt('Accepted'),   label: 'Confirmed',         sub: 'Slot locked in' },
            { icon: 'fa-calendar-pen', tone: 'amber', value: cnt('Alternative Proposed'), label: 'Awaiting client', sub: 'Alt. time sent' },
            { icon: 'fa-star', tone: 'violet',   value: cnt('Completed'),            label: 'Completed',         sub: 'Sessions done' }
        ].map(o => UI.kpi(o)).join('');
    }

    function renderChips() {
        const list = all();
        const statuses = ['Requested', 'Accepted', 'Alternative Proposed', 'Declined', 'Completed', 'Cancelled'];
        $('chips').innerHTML = UI.chip('All', list.length, statusF === 'all', "Consultations.filter('all')") +
            statuses.map(s => UI.chip(STATUS[s][0], list.filter(c => c.status === s).length, statusF === s, "Consultations.filter('" + s + "')")).join('');
    }

    // Check if there's another consultation on the same preferred date (double-booking warning)
    function doubleBookWarning(c) {
        const conflicts = all().filter(x =>
            x.id !== c.id &&
            x.status === 'Accepted' &&
            x.preferredDate === c.preferredDate &&
            x.preferredTime === c.preferredTime
        );
        if (!conflicts.length) return '';
        return '<div class="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">' +
            '<i class="fa-solid fa-triangle-exclamation shrink-0 mt-0.5 text-amber-500"></i>' +
            '<span><strong>Double-booking risk:</strong> ' + esc(conflicts.map(x => x.name).join(', ')) + ' also accepted on this date &amp; time.</span></div>';
    }

    function card(c) {
        const s = c.status, st = STATUS[s] || [s, 'muted'];
        const actions = [];
        const wa = S.waLink(c.phone, 'Hi ' + c.name + ', regarding your consultation request ' + c.ref + ' (' + c.typeLabel + ') with Nb.CA Academy. ');

        if (s === 'Requested') {
            actions.push(UI.btn('<i class="fa-solid fa-check mr-1.5"></i>Accept', "Consultations.accept('" + c.id + "')", 'good'));
            actions.push(UI.btn('<i class="fa-solid fa-calendar-pen mr-1.5"></i>Propose alt. time', "Consultations.propose('" + c.id + "')", 'primary'));
            actions.push(UI.btn('Decline', "Consultations.decline('" + c.id + "')", 'danger'));
        }
        if (s === 'Accepted') {
            actions.push(UI.btn('<i class="fa-solid fa-circle-check mr-1.5"></i>Mark completed', "Consultations.complete('" + c.id + "')", 'good'));
            actions.push(UI.btn('Decline', "Consultations.decline('" + c.id + "')", 'danger'));
        }
        if (s === 'Alternative Proposed') {
            actions.push(UI.btn('Withdraw &amp; decline', "Consultations.decline('" + c.id + "')", 'danger'));
        }
        if (!['Completed', 'Cancelled', 'Declined'].includes(s)) {
            actions.push(UI.btn('<i class="fa-solid fa-note-sticky mr-1.5"></i>Add note', "Consultations.addNote('" + c.id + "')", 'ghost'));
        }

        const altProposed = s === 'Alternative Proposed' && c.altDate
            ? '<div class="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">' +
              '<p class="font-bold text-amber-800 mb-1"><i class="fa-solid fa-calendar-pen mr-1.5"></i>Alternative time you proposed</p>' +
              '<p class="text-amber-700">' + esc(c.altDate) + ' at ' + esc(c.altTime) + '</p>' +
              (c.adminNote ? '<p class="text-amber-600 italic mt-0.5">"' + esc(c.adminNote) + '"</p>' : '') +
              '</div>'
            : '';

        const confirmedSlot = s === 'Accepted'
            ? '<p class="text-[11px] text-slate-500 mt-1"><i class="fa-solid fa-calendar-check text-emerald-500 mr-1.5"></i>Confirmed: ' +
              esc(c.confirmedDate || c.preferredDate) + ' at ' + esc(c.confirmedTime || c.preferredTime) + '</p>'
            : '';

        const adminNoteEl = c.adminNote && !['Alternative Proposed'].includes(s)
            ? '<p class="text-[11px] italic text-slate-500 mt-1"><i class="fa-solid fa-comment-dots mr-1.5 text-slate-400"></i>' + esc(c.adminNote) + '</p>'
            : '';

        return '<article class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all">' +
            '<div class="flex flex-col lg:flex-row lg:items-start gap-5">' +
                '<div class="flex items-start gap-4 flex-1 min-w-0">' +
                    UI.avatar(c.name) +
                    '<div class="min-w-0 space-y-1.5 flex-1">' +
                        '<div class="flex flex-wrap items-center gap-2">' +
                            '<strong class="text-slate-900 text-base">' + esc(c.name) + '</strong>' +
                            UI.pill(st[0], st[1]) +
                            '<span class="text-[10px] font-mono text-slate-400">' + esc(c.ref) + '</span>' +
                        '</div>' +
                        '<div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">' +
                            '<span><i class="fa-solid fa-phone mr-1.5 text-slate-400"></i>' + esc(c.phone || '-') + '</span>' +
                            '<span><i class="fa-solid fa-envelope mr-1.5 text-slate-400"></i>' + esc(c.email) + '</span>' +
                            (c.business ? '<span><i class="fa-solid fa-store mr-1.5 text-slate-400"></i>' + esc(c.business) + '</span>' : '') +
                        '</div>' +
                        '<p class="text-[11px] font-bold text-amberGold"><i class="fa-solid fa-tag mr-1.5"></i>' + esc(c.typeLabel) + ' — ' + esc(c.duration) + '</p>' +
                        '<p class="text-[11px] text-slate-600"><i class="fa-solid fa-' + (c.mode === 'In person' ? 'location-dot' : 'video') + ' mr-1.5 text-slate-400"></i>' + esc(c.mode) + '</p>' +
                        confirmedSlot + adminNoteEl +
                        (c.notes ? '<p class="text-[11px] text-slate-500 mt-1 italic">' + esc(c.notes) + '</p>' : '') +
                    '</div>' +
                '</div>' +
                '<div class="lg:w-56 shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5 text-xs">' +
                    '<p class="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Preferred slot</p>' +
                    '<div class="flex items-center gap-1.5 font-semibold text-slate-900"><i class="fa-regular fa-calendar text-amberGold text-xs"></i>' + esc(c.preferredDate) + '</div>' +
                    '<div class="text-slate-600"><i class="fa-regular fa-clock text-slate-400 mr-1.5"></i>' + esc(c.preferredTime) + '</div>' +
                    (c.altDate && s !== 'Alternative Proposed'
                        ? '<div class="pt-1 mt-1 border-t border-slate-200 text-slate-500"><p class="text-[10px] font-bold uppercase tracking-wide mb-0.5">Backup slot</p><p>' + esc(c.altDate) + ' · ' + esc(c.altTime) + '</p></div>'
                        : '') +
                    '<div class="pt-1 mt-1 border-t border-slate-200 text-slate-400 text-[10px]">Requested ' + S.fmtDate(c.createdAt.split('T')[0], { day: 'numeric', month: 'short' }) + '</div>' +
                '</div>' +
            '</div>' +
            altProposed +
            doubleBookWarning(c) +
            (actions.length
                ? '<div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">' + actions.join('') +
                  (wa ? '<a href="' + wa + '" target="_blank" rel="noopener" class="ml-auto px-3.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"><i class="fa-brands fa-whatsapp mr-1.5"></i>WhatsApp</a>' : '') +
                  '</div>'
                : (wa ? '<div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100"><a href="' + wa + '" target="_blank" rel="noopener" class="px-3.5 py-2 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"><i class="fa-brands fa-whatsapp mr-1.5"></i>WhatsApp</a></div>' : '')) +
            '</article>';
    }

    function render() {
        initTypeFilter();
        renderKpis();
        renderChips();
        const rows = filtered();
        $('list').innerHTML = rows.length
            ? rows.map(card).join('')
            : UI.empty('fa-comments', all().length ? 'No consultations match' : 'No consultation requests yet', all().length ? 'Try another status or search term.' : 'Consultation requests from members will appear here.');
    }

    window.Consultations = {
        render,
        filter(s) { statusF = s; render(); },

        async accept(id) {
            const c = D.consults.get(id);
            if (!c) return;
            const warning = all().filter(x => x.id !== id && x.status === 'Accepted' && x.preferredDate === c.preferredDate && x.preferredTime === c.preferredTime).length;
            const ok = await UI.confirm({
                title: 'Accept consultation?',
                message: (warning ? 'Note: there is already a confirmed consultation at this time.\n\n' : '') +
                    'Confirm ' + c.name + '\'s request for ' + c.preferredDate + ' at ' + c.preferredTime + ' (' + c.typeLabel + ').',
                ok: 'Accept'
            });
            if (!ok) return;
            D.consults.accept(id);
            S.toast(c.name + '\'s consultation confirmed.');
            render();
        },

        async propose(id) {
            const c = D.consults.get(id);
            if (!c) return;
            const timeOpts = [{ value: '', label: 'Select time' }].concat(TIMES.map(t => ({ value: t, label: t })));
            const vals = await UI.form({
                title: 'Propose an alternative time',
                submit: 'Send proposal',
                fields: [
                    { id: 'altDate', label: 'Alternative date', type: 'date', required: true, half: true },
                    { id: 'altTime', label: 'Alternative time', type: 'select', options: timeOpts, required: true, half: true },
                    { id: 'adminNote', label: 'Message to client (optional)', type: 'textarea', value: '', placeholder: 'e.g. Your preferred time is not available — does this slot work?', rows: 2 }
                ],
                validate(v) {
                    if (!v.altDate) return 'Please select a date.';
                    if (!v.altTime) return 'Please select a time.';
                    const today = new Date(); today.setHours(0,0,0,0);
                    if (new Date(v.altDate) <= today) return 'Alternative date must be in the future.';
                }
            });
            if (!vals) return;
            D.consults.propose(id, { altDate: vals.altDate, altTime: vals.altTime, adminNote: vals.adminNote });
            S.toast('Alternative time proposed to ' + c.name + '.');
            render();
        },

        async decline(id) {
            const c = D.consults.get(id);
            if (!c) return;
            const vals = await UI.form({
                title: 'Decline consultation',
                submit: 'Decline',
                fields: [{ id: 'adminNote', label: 'Reason (shown to member)', type: 'textarea', placeholder: 'e.g. No availability in the requested period.', rows: 2 }]
            });
            if (!vals) return;
            D.consults.decline(id, vals.adminNote || '');
            S.toast(c.name + '\'s request declined.');
            render();
        },

        async complete(id) {
            const c = D.consults.get(id);
            if (!c) return;
            const ok = await UI.confirm({ title: 'Mark as completed?', message: 'Record that the session with ' + c.name + ' has taken place.', ok: 'Mark completed' });
            if (!ok) return;
            D.consults.complete(id);
            S.toast('Session with ' + c.name + ' marked as completed.');
            render();
        },

        async addNote(id) {
            const c = D.consults.get(id);
            if (!c) return;
            const vals = await UI.form({
                title: 'Add admin note',
                submit: 'Save note',
                fields: [{ id: 'adminNote', label: 'Internal note (visible to member)', type: 'textarea', value: c.adminNote || '', rows: 3 }]
            });
            if (!vals) return;
            const list = D.consults.list();
            const idx = list.findIndex(x => x.id === id);
            if (idx < 0) return;
            list[idx].adminNote = vals.adminNote;
            list[idx].updatedAt = new Date().toISOString();
            localStorage.setItem('rp_consultations', JSON.stringify(list));
            S.toast('Note saved.');
            render();
        },

        exportCsv() {
            const rows = filtered();
            if (!rows.length) { S.toast('No consultations to export.'); return; }
            const h = ['Ref', 'Name', 'Email', 'Phone', 'Business', 'Topic', 'Duration', 'Mode', 'Preferred Date', 'Preferred Time', 'Alt Date', 'Alt Time', 'Status', 'Admin Note', 'Requested At'];
            const csv = [h, ...rows.map(c => [c.ref, c.name, c.email, c.phone || '', c.business || '', c.typeLabel, c.duration, c.mode, c.preferredDate, c.preferredTime, c.altDate || '', c.altTime || '', c.status, c.adminNote || '', c.createdAt])].map(r => r.map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(',')).join('\n');
            const a = document.createElement('a');
            a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + csv);
            a.download = 'consultations-' + D.dayOf() + '.csv';
            a.click();
        }
    };

    document.addEventListener('DOMContentLoaded', render);
})();
