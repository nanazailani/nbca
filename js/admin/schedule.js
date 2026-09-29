/* Admin: class schedule + instructors (who teaches which session). */
(function () {
    const S = AdminShell, D = NBCA_DATA, CFG = S.CFG, esc = S.esc, $ = id => document.getElementById(id);
    let tab = UI.param('tab') || 'fixed', onlyBooked = false;
    const TABS = [['fixed', 'Daily class', 'fa-calendar-days'], ['workshops', 'Workshops', 'fa-chalkboard-user'], ['instructors', 'Instructors', 'fa-user-tie']];

    // <select> of instructors; keeps an inactive assignee visible so nothing silently disappears.
    function instructorSelect(current, onchange, label) {
        const list = D.instructors.list(), cur = current ? current.id : '';
        const opts = list.filter(i => i.status !== 'inactive' || i.id === cur).map(i => '<option value="' + i.id + '"' + (i.id === cur ? ' selected' : '') + '>' + esc(i.name) + (i.status === 'inactive' ? ' (inactive)' : '') + '</option>').join('');
        return '<select aria-label="' + esc(label) + '" onchange="' + onchange + '" class="' + UI.INPUT + ' !py-2 !text-xs min-w-[10rem]"><option value="">' + (list.length ? 'Unassigned' : 'Add an instructor first') + '</option>' + opts + '</select>';
    }
    const upcomingWorkload = id => {
        let n = 0; const a = D.assign.all();
        Object.keys(a).forEach(k => { if (a[k] !== id) return; const p = k.split('|'); if (p[0] === 'fixed' ? p[1] >= D.dayOf() : true) n++; });
        return n;
    };

    // ---------- tabs ----------
    function renderFixed() {
        const days = S.openDays(21), unassignedBooked = S.unassignedSessions().filter(u => u.kind === 'fixed').length;
        const active = D.instructors.active();
        let html = '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4"><label class="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"><input type="checkbox" ' + (onlyBooked ? 'checked' : '') + ' onchange="Schedule.toggleBooked(this.checked)" class="w-4 h-4 accent-blue-600"> Show only sessions with bookings</label>' +
            (active.length ? '<div class="flex flex-wrap items-center gap-2 text-xs"><span class="font-semibold text-slate-600">Assign all unassigned sessions to</span><select id="bulk-ins" class="' + UI.INPUT + ' !py-2 !text-xs !w-auto">' + active.map(i => '<option value="' + i.id + '">' + esc(i.name) + '</option>').join('') + '</select>' + UI.btn('Apply', 'Schedule.bulkAssign()', 'primary') + '</div>' : '') + '</div>';
        if (unassignedBooked) html += '<div class="rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 flex items-center gap-2"><i class="fa-solid fa-triangle-exclamation"></i><span><strong>' + unassignedBooked + ' upcoming session' + (unassignedBooked > 1 ? 's have' : ' has') + '</strong> students booked but no instructor.</span></div>';
        const rows = days.map(d => {
            const ds = S.ymd(d);
            const sess = CFG.FC_SESSIONS.map(s => {
                const used = S.seatsUsed(ds, s), ins = S.instructorOf(ds, s);
                if (onlyBooked && !used) return '';
                const tone = used >= CFG.FC_CAPACITY ? 'bg-red-500' : used >= CFG.FC_CAPACITY * 0.7 ? 'bg-amber-400' : 'bg-emerald-500';
                return '<div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 py-3.5 border-t border-slate-100 first:border-0"><div class="lg:w-52"><p class="text-sm font-bold text-slate-900">' + esc(s) + '</p><p class="text-[11px] text-slate-500">Daily class</p></div>' +
                    '<div class="flex-1 min-w-0"><div class="flex items-center justify-between text-[11px] mb-1"><a href="admin-bookings.html?date=' + ds + '&session=' + encodeURIComponent(s) + '" class="font-semibold text-amberGold hover:underline">' + used + ' student' + (used === 1 ? '' : 's') + '</a><span class="text-slate-500">' + used + '/' + CFG.FC_CAPACITY + ' seats</span></div><div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full ' + tone + '" style="width:' + Math.min(100, used / CFG.FC_CAPACITY * 100) + '%"></div></div></div>' +
                    '<div class="flex items-center gap-2 lg:w-72">' + instructorSelect(ins, "Schedule.assignFixed('" + ds + "', '" + s + "', this.value)", 'Instructor for ' + ds + ' ' + s) + (!ins && used ? '<span title="Students are booked but nobody is assigned" class="text-amber-500"><i class="fa-solid fa-triangle-exclamation"></i></span>' : '') + '</div></div>';
            }).join('');
            return sess ? '<div class="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 pt-4 pb-1"><p class="text-xs font-extrabold text-slate-900 uppercase tracking-wide">' + d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '</p>' + sess + '</div>' : '';
        }).join('');
        return html + (rows.trim() ? '<div class="space-y-3">' + rows + '</div>' : UI.empty('fa-calendar-xmark', 'No sessions to show', 'Untick the filter to see every open day.'));
    }

    function renderWorkshops() {
        const cats = D.slots.catalog();
        if (!cats.length) return UI.empty('fa-chalkboard-user', 'No workshops found', 'The workshop catalog did not load.');
        return '<div class="space-y-5">' + cats.map(w => {
            const cap = D.slots.capacity(w), extras = D.slots.extras().filter(x => x.workshopId === w.id), all = D.slots.forWorkshop(w);
            const rows = Object.keys(all).map(mode => all[mode].map(slot => {
                const extra = extras.find(x => x.mode === mode && x.slot === slot), used = S.workshopSeats(w.id, slot), ins = D.assign.get(D.assign.wsKey(w.id, slot));
                return '<div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 py-3.5 border-t border-slate-100 first:border-0"><div class="lg:w-72 min-w-0"><p class="text-sm font-bold text-slate-900">' + esc(slot) + '</p><p class="text-[11px] text-slate-500">' + esc(w.modes[mode] ? w.modes[mode].label : mode) + (extra ? ' &middot; added by admin' : '') + '</p></div>' +
                    '<div class="flex-1"><p class="text-[11px] text-slate-500 mb-1">' + used + '/' + cap + ' seats</p><div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full ' + (used >= cap ? 'bg-red-500' : used >= cap * 0.7 ? 'bg-amber-400' : 'bg-emerald-500') + '" style="width:' + Math.min(100, used / cap * 100) + '%"></div></div></div>' +
                    '<div class="flex items-center gap-2 lg:w-72">' + instructorSelect(ins, "Schedule.assignWs('" + w.id + "', '" + esc(slot).replace(/'/g, '&#39;') + "', this.value)", 'Instructor for ' + w.title + ' ' + slot) + (extra ? UI.iconBtn('fa-trash', 'Remove slot', "Schedule.removeSlot('" + extra.id + "')", true) : '') + '</div></div>';
            }).join('')).join('');
            return '<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><div class="flex flex-wrap items-center justify-between gap-3 mb-2"><div><h3 class="font-serif text-lg font-bold text-slate-900">' + esc(w.title) + '</h3><p class="text-[11px] text-slate-500">' + esc(w.subtitle) + '</p></div>' + UI.btn('<i class="fa-solid fa-plus mr-1.5"></i>Add slot', "Schedule.addSlot('" + w.id + "')", 'ghost') + '</div>' + (rows || '<p class="text-xs text-slate-500 py-3">No sessions yet.</p>') + '</div>';
        }).join('') + '</div>';
    }

    function renderInstructors() {
        const list = D.instructors.list();
        const add = UI.btn('<i class="fa-solid fa-plus mr-1.5"></i>Add instructor', 'Schedule.addInstructor()', 'primary');
        if (!list.length) return UI.empty('fa-user-tie', 'No instructors yet', 'Add the people who teach so you can assign them to each class and see who is responsible.', add);
        return '<div class="flex justify-end">' + add + '</div><div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">' + list.map(i => {
            const inactive = i.status === 'inactive', n = D.instructors.assignedCount(i.id);
            return '<article class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 ' + (inactive ? 'opacity-70' : '') + '"><div class="flex items-start gap-3">' + UI.avatar(i.name) + '<div class="min-w-0 flex-1"><div class="flex items-center gap-2 flex-wrap"><strong class="text-slate-900">' + esc(i.name) + '</strong>' + UI.pill(inactive ? 'Inactive' : 'Active', inactive ? 'muted' : 'good') + '</div><span class="block text-[11px] text-slate-500">' + esc(i.specialty || 'No specialty set') + '</span></div></div>' +
                '<div class="text-[11px] text-slate-600 space-y-1"><div><i class="fa-solid fa-phone w-4 text-slate-400"></i> ' + esc(i.phone || '-') + '</div><div class="truncate"><i class="fa-solid fa-envelope w-4 text-slate-400"></i> ' + esc(i.email || '-') + '</div></div>' +
                '<div class="rounded-xl bg-slate-50 p-3 flex items-center justify-between text-xs"><span class="text-slate-500">Sessions assigned</span><strong class="text-slate-900">' + n + ' <span class="font-normal text-slate-400">(' + upcomingWorkload(i.id) + ' upcoming)</span></strong></div>' +
                '<div class="flex items-center gap-2 pt-3 border-t border-slate-100"><span class="flex gap-1.5 ml-auto">' + UI.iconBtn('fa-pen', 'Edit', "Schedule.editInstructor('" + i.id + "')") + UI.iconBtn(inactive ? 'fa-toggle-off' : 'fa-toggle-on', inactive ? 'Activate' : 'Deactivate', "Schedule.toggleInstructor('" + i.id + "')") + UI.iconBtn('fa-trash', 'Delete', "Schedule.removeInstructor('" + i.id + "')", true) + '</span></div></article>';
        }).join('') + '</div>';
    }

    function render() {
        $('tabs').innerHTML = UI.tabs(TABS, tab, 'Schedule.setTab');
        $('body').innerHTML = tab === 'workshops' ? renderWorkshops() : tab === 'instructors' ? renderInstructors() : renderFixed();
    }

    const instructorFields = i => [{ id: 'name', label: 'Full name', required: true, value: i && i.name }, { id: 'specialty', label: 'Specialty', value: i && i.specialty, placeholder: 'e.g. Espresso, latte art' }, { id: 'phone', label: 'Phone', type: 'tel', half: true, value: i && i.phone }, { id: 'email', label: 'Email', type: 'email', half: true, value: i && i.email }];

    window.Schedule = {
        render, setTab(t) { tab = t; render(); }, toggleBooked(v) { onlyBooked = v; render(); },
        assignFixed(date, session, id) { D.assign.set(D.assign.fixedKey(date, session), id); const i = D.instructors.get(id); S.toast(id ? i.name + ' assigned.' : 'Instructor removed.'); render(); },
        assignWs(wid, slot, id) { D.assign.set(D.assign.wsKey(wid, slot), id); const i = D.instructors.get(id); S.toast(id ? i.name + ' assigned.' : 'Instructor removed.'); render(); },
        async bulkAssign() {
            const id = $('bulk-ins').value, i = D.instructors.get(id);
            const targets = []; S.openDays(21).forEach(d => CFG.FC_SESSIONS.forEach(s => { if (!S.instructorOf(S.ymd(d), s)) targets.push([S.ymd(d), s]); }));
            if (!targets.length) { S.toast('Every session already has an instructor.'); return; }
            if (await UI.confirm({ title: 'Assign ' + i.name + ' to ' + targets.length + ' sessions?', message: 'Only sessions with no instructor are changed. You can still adjust each one afterwards.', ok: 'Assign' })) { targets.forEach(t => D.assign.set(D.assign.fixedKey(t[0], t[1]), id)); S.toast(i.name + ' assigned to ' + targets.length + ' sessions.'); render(); }
        },
        async addSlot(workshopId) {
            const w = D.slots.catalog().find(x => x.id === workshopId);
            const v = await UI.form({ title: 'Add a session for ' + w.title, description: 'Members can enroll in it straight away. Use the same format as the others.', submit: 'Add session', fields: [{ id: 'mode', label: 'Mode', type: 'select', options: Object.keys(w.modes).map(k => ({ value: k, label: w.modes[k].label })) }, { id: 'slot', label: 'Date & time', required: true, placeholder: 'Sat, 15 Nov 2026 — 10:00 AM' }] });
            if (!v) return;
            if (D.slots.forWorkshop(w)[v.mode].includes(v.slot)) { S.toast('That session already exists.'); return; }
            D.slots.add(workshopId, v.mode, v.slot); S.toast('Session added.'); render();
        },
        async removeSlot(id) {
            const x = D.slots.extras().find(s => s.id === id);
            if (S.workshopSeats(x.workshopId, x.slot) > 0) { S.toast('People are enrolled in this session. Cancel their enrollments first.'); return; }
            if (await UI.confirm({ title: 'Remove this session?', message: x.slot, ok: 'Remove', danger: true })) { D.assign.set(D.assign.wsKey(x.workshopId, x.slot), ''); D.slots.removeExtra(id); S.toast('Session removed.'); render(); }
        },
        async addInstructor() { const v = await UI.form({ title: 'Add an instructor', submit: 'Add instructor', fields: instructorFields() }); if (!v) return; D.instructors.create(v); S.toast(v.name + ' added.'); render(); },
        async editInstructor(id) { const v = await UI.form({ title: 'Edit instructor', submit: 'Save changes', fields: instructorFields(D.instructors.get(id)) }); if (!v) return; D.instructors.update(id, v); S.toast('Instructor updated.'); render(); },
        toggleInstructor(id) { const i = D.instructors.get(id), next = i.status === 'inactive' ? 'active' : 'inactive'; D.instructors.update(id, { status: next }); S.toast(i.name + (next === 'active' ? ' activated.' : ' deactivated. Existing assignments stay.')); render(); },
        async removeInstructor(id) {
            const i = D.instructors.get(id), n = D.instructors.assignedCount(id);
            if (await UI.confirm({ title: 'Delete ' + i.name + '?', message: n ? 'They are assigned to ' + n + ' session' + (n > 1 ? 's' : '') + '. Those will become unassigned.' : 'This cannot be undone.', ok: 'Delete instructor', danger: true })) { D.instructors.remove(id); S.toast('Instructor deleted.'); render(); }
        }
    };
    window.addEventListener('admin-ready', render);
})();
