/* Nb.CA Academy — settings shared by the member portal and the admin console. */
window.NBCA_CFG = {
    FC_CAPACITY: 10,                                        // seats per fixed-class session
    FC_OPEN_DAYS: [0, 1, 2, 3, 4],                          // Sunday – Thursday
    FC_SESSIONS: ['10:00 AM – 12:00 PM', '2:00 PM – 4:00 PM'],
    FC_HOLD_MINUTES: 30,                                    // unpaid bookings hold a seat this long
    SHIPPING: 8,                                            // flat shipping fee (RM)

    // ── Phase 1 / Phase 2 feature flags ───────────────────────────────────────
    // Set a flag to true to enable that feature. Shells, pages and index.html all
    // read NBCA_CFG.FEATURES to decide what to show.
    FEATURES: {
        consultation: true,   // Phase 1: consultation request & approval
        shop:         false,  // Phase 2: beans, merch, basket, orders
        workshops:    false,  // Phase 2: workshop enrollments
        rewards:      false   // Phase 2: membership points, tiers, vouchers
    },

    // ── Named classes ─────────────────────────────────────────────────────────
    CLASSES: [
        { id: 'bev-foundation', label: 'Beverage Foundation', desc: 'Core brewing theory and practice for beginners. Master espresso, pour-over and milk fundamentals.', open: true  },
        { id: 'barista-basic',  label: 'Barista Basic',       desc: 'Hands-on barista workflow: grind, extraction, steaming and latte art foundations.', open: true  },
        { id: 'sca-classes',    label: 'SCA Classes',          desc: 'Specialty Coffee Association certified programmes — coming soon to Nb.CA Academy.', open: false, comingSoon: 'Launching soon' }
    ],

    // ── Consultation types ────────────────────────────────────────────────────
    CONSULT_TYPES: [
        { id: 'cafe-setup',        label: 'Cafe / Business Setup',          desc: 'Concept, layout, equipment, workflow and cost planning for a new coffee business.', duration: '60 min' },
        { id: 'menu-dev',          label: 'Menu & Beverage Development',    desc: 'Design or refine your drink menu to match your brand and target customers.',           duration: '60 min' },
        { id: 'barista-training',  label: 'Barista Team Training Plan',     desc: 'Customised training roadmap for your team — from basics to advanced skills.',          duration: '90 min' },
        { id: 'general-coffee',    label: 'General Coffee Consultation',    desc: 'Open session: sourcing, brewing equipment, troubleshooting or anything coffee.',       duration: '45 min' }
    ],

    // ── Preferred consultation times ──────────────────────────────────────────
    CONSULT_TIMES: ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM']
};
