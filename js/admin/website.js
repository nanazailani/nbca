/* Admin: what the public homepage shows, where to change it, contact/social settings, and demo tools. */
(function () {
    const S = AdminShell, D = NBCA_DATA, esc = S.esc, $ = id => document.getElementById(id);
    let tab = UI.param('tab') || 'overview';
    const TABS = [['overview', 'Homepage map', 'fa-map'], ['content', 'Contact & highlights', 'fa-pen-to-square'], ['demo', 'Demo data', 'fa-flask']];
    const preview = h => 'index.html?preview=1' + (h || '');

    function overview() {
        const team = D.instructors.publicList().length, extras = D.slots.extras().length, posts = (() => { try { return JSON.parse(localStorage.getItem('rp_blog_posts') || '[]').length; } catch (e) { return 0; } })();
        const fx = (() => { try { return JSON.parse(localStorage.getItem('rp_fixed_class_settings') || 'null'); } catch (e) { return null; } })();
        const cards = [
            { icon: 'fa-star', title: 'Hero highlights', desc: 'The three figures under the main headline (e.g. "500+ Students Trained").', href: 'admin-website.html?tab=content', label: 'Website > Contact & highlights', anchor: '', ok: true },
            { icon: 'fa-user-tie', title: 'Meet the team', desc: 'Instructors with photos, title and bio.', meta: team ? team + ' instructor' + (team > 1 ? 's' : '') + ' shown' : 'None shown yet, so sample profiles appear', href: 'admin-schedule.html?tab=instructors', label: 'Class Schedule > Instructors', anchor: '#team', ok: true },
            { icon: 'fa-calendar-days', title: 'Daily class card', desc: 'Name, photo, description, fee and deposit of the daily class.', meta: fx ? 'RM ' + Number(fx.fee).toFixed(0) + ' · ' + fx.depositPct + '% deposit' : 'Using defaults', href: 'admin-manage.html?tab=fixed', label: 'Fixed Class Settings', anchor: '#fixed-classes', ok: true },
            { icon: 'fa-chalkboard-user', title: 'Workshops & sessions', desc: 'Sessions you add appear on the workshop cards straight away.', meta: extras + ' session' + (extras === 1 ? '' : 's') + ' added by you', href: 'admin-schedule.html?tab=workshops', label: 'Class Schedule > Workshops', anchor: '#classes', ok: true },
            { icon: 'fa-bullhorn', title: 'Announcements', desc: 'News and updates shown in the announcements section.', meta: posts ? posts + ' post' + (posts > 1 ? 's' : '') : 'Default posts', href: 'admin-manage.html?tab=blog', label: 'Announcements', anchor: '#blog', ok: true },
            { icon: 'fa-location-dot', title: 'Contact & social', desc: 'WhatsApp number, address, map and TikTok.', href: 'admin-website.html?tab=content', label: 'Website > Contact & highlights', anchor: '#location', ok: true },
            { icon: 'fa-mug-hot', title: 'Coffee beans & merchandise', desc: 'Products, prices and photos are still set in the code. Ask the developer to change them.', href: '', anchor: '#coffee-beans', ok: false },
            { icon: 'fa-circle-info', title: 'About us text', desc: 'The story, vision and mission copy is set in the code.', href: '', anchor: '#about', ok: false }
        ];
        return '<div class="rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs p-4 flex gap-3"><i class="fa-solid fa-circle-info mt-0.5"></i><span>This is every section of the public homepage and where to change it. <strong>Preview</strong> opens the live homepage in a new tab, even while you are signed in.</span></div>' +
            '<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">' + cards.map(c => '<article class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3 flex flex-col"><div class="flex items-start gap-3"><span class="w-11 h-11 rounded-xl bg-blue-50 text-amberGold flex items-center justify-center shrink-0"><i class="fa-solid ' + c.icon + '"></i></span><div class="min-w-0 flex-1"><div class="flex items-center gap-2 flex-wrap"><h3 class="font-serif font-bold text-slate-900">' + c.title + '</h3>' + UI.pill(c.ok ? 'Editable' : 'Fixed in code', c.ok ? 'good' : 'muted') + '</div><p class="text-[11px] text-slate-500 mt-1 leading-relaxed">' + c.desc + '</p></div></div>' +
                (c.meta ? '<p class="text-xs font-semibold text-slate-700 bg-slate-50 rounded-xl px-3 py-2">' + esc(c.meta) + '</p>' : '') +
                '<div class="flex items-center gap-2 pt-3 mt-auto border-t border-slate-100">' + (c.href ? '<a href="' + c.href + '" class="px-3.5 py-2 rounded-xl text-[11px] font-bold bg-amberGold hover:bg-royalBlue text-white shadow-sm transition-all">Manage</a><span class="text-[10px] text-slate-400 truncate">' + esc(c.label) + '</span>' : '') + '<a href="' + preview(c.anchor) + '" target="_blank" rel="noopener" class="ml-auto px-3.5 py-2 rounded-xl text-[11px] font-bold bg-white border border-slate-200 text-slate-700 hover:border-amberGold transition-all"><i class="fa-solid fa-arrow-up-right-from-square mr-1.5 text-[9px] text-amberGold"></i>Preview</a></div></article>').join('') + '</div>';
    }

    function content() {
        const s = D.site.get(), inp = (id, label, val, extra, hint) => '<div><label class="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">' + label + '</label><input id="' + id + '" value="' + esc(val) + '" ' + (extra || '') + ' class="' + UI.INPUT + '">' + (hint ? '<p class="text-[10px] text-slate-500 mt-1">' + hint + '</p>' : '') + '</div>';
        const stats = [0, 1, 2].map(i => { const t = s.stats[i] || { value: '', label: '' }; return '<div class="grid grid-cols-3 gap-3">' + inp('st-v' + i, 'Figure ' + (i + 1), t.value, 'placeholder="500+"') + '<div class="col-span-2">' + inp('st-l' + i, 'Label', t.label, 'placeholder="Students Trained"') + '</div></div>'; }).join('');
        return '<form onsubmit="Website.saveContent(event)" class="grid lg:grid-cols-2 gap-6"><section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4"><h3 class="font-serif text-lg font-bold text-slate-900"><i class="fa-solid fa-location-dot text-amberGold mr-2"></i>Contact & social</h3>' +
            inp('wa', 'WhatsApp number', s.whatsapp, 'inputmode="tel"', 'With country code, digits only (e.g. 60123456789). Used by every WhatsApp button on the homepage.') + inp('addr', 'Address', s.address, '', 'Also updates the map on the homepage.') + inp('tt', 'TikTok link', s.tiktok, 'type="url"') + inp('hd', 'Social handle', s.handle, '', 'Shown in the footer.') + '</section>' +
            '<section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4"><h3 class="font-serif text-lg font-bold text-slate-900"><i class="fa-solid fa-star text-amberGold mr-2"></i>Hero highlights</h3><p class="text-[11px] text-slate-500">Up to three figures under the main headline. Leave a row empty to hide it.</p>' + stats + '</section>' +
            '<div class="lg:col-span-2 flex flex-wrap gap-3"><button class="px-6 py-3 bg-amberGold hover:bg-royalBlue text-white font-bold rounded-xl text-xs shadow transition-all">Save changes</button><a href="' + preview('') + '" target="_blank" rel="noopener" class="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:border-amberGold transition-all">Preview homepage</a>' + UI.btn('Reset to defaults', 'Website.resetContent()', 'ghost') + '</div></form>';
    }

    function demo() {
        const seeded = window.NBCA_DEMO && NBCA_DEMO.seeded(), rows = NBCA_DEMO.credentials.map(c => '<tr class="border-t border-slate-100"><td class="py-3 pr-3">' + UI.pill(c.role, c.role === 'Admin' ? 'info' : c.role.includes('suspended') ? 'bad' : 'good') + '</td><td class="py-3 pr-3 text-xs text-slate-700">' + esc(c.name) + '</td><td class="py-3 pr-3 font-mono text-xs">' + esc(c.email) + '</td><td class="py-3 pr-3 font-mono text-xs">' + esc(c.password) + '</td><td class="py-3 text-right"><a href="' + c.where + '" target="_blank" rel="noopener" class="text-[11px] font-bold text-amberGold hover:underline">Open login</a></td></tr>').join('');
        return '<div class="rounded-2xl ' + (seeded ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800') + ' border text-xs p-4 flex gap-3"><i class="fa-solid ' + (seeded ? 'fa-circle-check' : 'fa-triangle-exclamation') + ' mt-0.5"></i><span>' + (seeded ? '<strong>Sample data is loaded.</strong> Every admin and member screen has something to show.' : '<strong>No sample data yet.</strong> Load it to walk a client through every screen.') + '</span></div>' +
            '<div class="grid lg:grid-cols-3 gap-6"><section class="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6"><h3 class="font-serif text-lg font-bold text-slate-900 mb-3"><i class="fa-solid fa-key text-amberGold mr-2"></i>Test accounts</h3><div class="overflow-x-auto"><table class="w-full text-left"><thead><tr class="text-[10px] uppercase tracking-wider text-slate-500"><th class="pb-2">Role</th><th class="pb-2">Name</th><th class="pb-2">Email</th><th class="pb-2">Password</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="text-[11px] text-slate-500 mt-3">The member accounts exist only after you load the sample data.</p></section>' +
            '<section class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-3"><h3 class="font-serif text-lg font-bold text-slate-900"><i class="fa-solid fa-flask text-amberGold mr-2"></i>Demo tools</h3><p class="text-[11px] text-slate-500 leading-relaxed">Sample data: 10 members, bookings in every status, orders through the whole flow, workshop enrollments, instructors and rewards. Announcements and settings are not touched.</p>' +
            '<button type="button" onclick="Website.seed()" class="w-full py-3 bg-amberGold hover:bg-royalBlue text-white font-bold rounded-xl text-xs shadow transition-all"><i class="fa-solid fa-wand-magic-sparkles mr-1.5"></i>Load sample data</button><button type="button" onclick="Website.clear()" class="w-full py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl text-xs transition-all"><i class="fa-solid fa-trash mr-1.5"></i>Clear all data</button>' +
            '<div class="pt-3 border-t border-slate-100 space-y-2"><a href="index.html?preview=1" target="_blank" rel="noopener" class="block text-xs font-bold text-amberGold hover:underline">Open the public homepage</a><a href="auth.html" target="_blank" rel="noopener" class="block text-xs font-bold text-amberGold hover:underline">Open the member login</a></div></section></div>';
    }

    function render() {
        $('tabs').innerHTML = UI.tabs(TABS, tab, 'Website.setTab');
        $('body').innerHTML = '<div class="space-y-6">' + ({ content, demo }[tab] || overview)() + '</div>';
    }
    const digits = v => { let d = String(v).replace(/\D/g, ''); if (d.startsWith('0')) d = '6' + d; return d; };

    window.Website = {
        render, setTab(t) { tab = t; render(); },
        saveContent(e) {
            e.preventDefault();
            const v = id => $(id).value.trim(), wa = digits(v('wa')), tt = v('tt');
            if (wa.length < 10 || wa.length > 14) { S.toast('Enter a valid WhatsApp number with country code.'); return; }
            if (!v('addr')) { S.toast('The address cannot be empty.'); return; }
            if (tt && !/^https?:\/\//i.test(tt)) { S.toast('The TikTok link must start with https://'); return; }
            const stats = [0, 1, 2].map(i => ({ value: v('st-v' + i), label: v('st-l' + i) })).filter(x => x.value || x.label);
            if (stats.some(x => !x.value || !x.label)) { S.toast('Each highlight needs both a figure and a label.'); return; }
            D.site.save({ whatsapp: wa, address: v('addr'), tiktok: tt || D.site.defaults.tiktok, handle: v('hd'), stats });
            S.toast('Saved. The homepage now shows the new details.'); render();
        },
        async resetContent() { if (await UI.confirm({ title: 'Reset to the original details?', message: 'WhatsApp, address, social and highlights go back to the defaults.', ok: 'Reset' })) { localStorage.removeItem(D.K.site); S.toast('Reset to defaults.'); render(); } },
        async seed() {
            if (await UI.confirm({ title: 'Load sample data?', message: 'This replaces the current members, bookings, orders, enrollments, instructors and points with a sample set. Announcements and settings are kept.', ok: 'Load sample data' })) { const r = NBCA_DEMO.seed(); S.toast('Loaded ' + r.members + ' members, ' + r.bookings + ' bookings and ' + r.orders + ' orders.'); setTimeout(() => location.reload(), 900); }
        },
        async clear() {
            if (await UI.confirm({ title: 'Clear all data?', message: 'This deletes every member account, booking, order, enrollment, instructor and points record in this browser. Settings and announcements are kept. This cannot be undone.', ok: 'Clear everything', danger: true })) { NBCA_DEMO.clear(); S.toast('All data cleared.'); setTimeout(() => location.reload(), 900); }
        }
    };
    window.addEventListener('admin-ready', render);
})();
