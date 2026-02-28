// ============================================================
// js/shared.js
// Common UI utilities used across index, collection, student pages.
// Eliminates ~200 lines of duplicated code.
// ============================================================

// ── Toast Notification System ─────────────────────────────────
// Usage: showToast("Payment saved!", "success")
// Types: "success" | "error" | "info"
export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3200);
}

// ── Header Text Fit ────────────────────────────────────────────
// Shrinks long institution names to fit the header area
export function fitText(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const parent = el.parentElement;
    el.style.fontSize = '';
    let fontSize = parseInt(window.getComputedStyle(el).fontSize);
    el.style.whiteSpace = 'nowrap';
    while (el.scrollWidth > parent.clientWidth && fontSize > 10) {
        fontSize--;
        el.style.fontSize = fontSize + 'px';
    }
}
window.addEventListener('resize', () => fitText('header-title'));

// ── Hamburger Menu ─────────────────────────────────────────────
// Initialises the animated hamburger toggle for .nav-menu
export function initHamburger() {
    const btn  = document.getElementById('mobile-menu-btn');
    const menu = document.querySelector('.nav-menu');
    if (!btn || !menu) return;

    const close = () => {
        menu.classList.remove('active');
        btn.classList.remove('active-toggle');
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
        btn.classList.toggle('active-toggle');
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    });

    // Close when any nav-link is clicked
    menu.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', close));

    return close; // caller can use this to close programmatically
}

// ── Tab Switcher ───────────────────────────────────────────────
// Manages .tab-link [data-target] → .page-content sections
export function initTabs(onSwitch) {
    const links = document.querySelectorAll('.tab-link');
    const pages = document.querySelectorAll('.page-content');
    const closeMenu = initHamburger();

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (!targetId) return;

            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            pages.forEach(p => p.classList.add('hidden'));

            const target = document.getElementById(targetId);
            if (target) target.classList.remove('hidden');

            if (closeMenu) closeMenu();
            window.scrollTo(0, 0);

            if (typeof onSwitch === 'function') onSwitch(targetId);
        });
    });
}

// ── Header Loader ──────────────────────────────────────────────
// Populates header title, subtitle, logo from Firestore config doc
export function loadHeader(configData) {
    const titleEl    = document.getElementById('header-title');
    const logoEl     = document.getElementById('header-logo');
    const regnoEl    = document.getElementById('header-regno');
    const placeEl    = document.getElementById('header-place');
    const sepEl      = document.getElementById('header-sep');
    const subtitleEl = document.getElementById('header-subtitle');

    if (titleEl) {
        titleEl.textContent = configData.appName || 'Institution Portal';
        setTimeout(() => fitText('header-title'), 50);
    }

    if (logoEl && configData.logoUrl) {
        logoEl.src = configData.logoUrl;
        logoEl.style.opacity = '1';
    }

    if (regnoEl) regnoEl.textContent = configData.regNo ? `Reg: ${configData.regNo}` : '';
    if (placeEl) placeEl.textContent = configData.place || '';

    if (subtitleEl) {
        if (configData.regNo || configData.place) {
            subtitleEl.classList.remove('hidden');
            if (sepEl) {
                if (configData.regNo && configData.place) sepEl.classList.remove('hidden');
                else sepEl.classList.add('hidden');
            }
        } else {
            subtitleEl.classList.add('hidden');
        }
    }
}

// ── Footer Loader ──────────────────────────────────────────────
// Populates footer social links, phone, email, inst name from config
export function loadFooter(configData) {
    const nameEl      = document.getElementById('footer-inst-name');
    const phoneEl     = document.getElementById('footer-phone');
    const phoneLinkEl = document.getElementById('footer-phone-link');
    const emailEl     = document.getElementById('footer-email');
    const emailLinkEl = document.getElementById('footer-email-link');

    if (nameEl)      nameEl.textContent      = configData.appName      || 'Institution';
    if (phoneEl)     phoneEl.textContent     = configData.contactPhone || 'Not Available';
    if (emailEl)     emailEl.textContent     = configData.contactEmail || 'Not Available';
    if (phoneLinkEl && configData.contactPhone) phoneLinkEl.href = `tel:${configData.contactPhone}`;
    if (emailLinkEl && configData.contactEmail) emailLinkEl.href = `mailto:${configData.contactEmail}`;

    const socialMap = {
        youtube:   configData.socialYouTube,
        telegram:  configData.socialTelegram,
        instagram: configData.socialInstagram,
        whatsapp:  configData.socialWhatsapp,
        facebook:  configData.socialFacebook
    };

    Object.entries(socialMap).forEach(([key, url]) => {
        const el = document.getElementById(`link-${key}`);
        if (!el) return;
        if (url) { el.href = url; el.classList.remove('hidden'); }
        else     { el.classList.add('hidden'); }
    });
}

// ── Confirm Dialog ─────────────────────────────────────────────
// Replaces native confirm() with a styled modal.
// Returns a Promise<boolean>
export function showConfirm(title, message) {
    return new Promise((resolve) => {
        // Reuse existing confirm popup if present (collection.html)
        const popup   = document.getElementById('confirm-popup');
        const titleEl = document.getElementById('confirm-title');
        const msgEl   = document.getElementById('confirm-message');
        const okBtn   = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');

        if (!popup) { resolve(window.confirm(`${title}\n${message}`)); return; }

        titleEl.textContent   = title;
        msgEl.innerHTML       = `<p class="font-medium text-gray-800">${message}</p>`;
        popup.classList.remove('hidden');
        popup.classList.add('flex');

        const cleanup = () => { popup.classList.add('hidden'); popup.classList.remove('flex'); };

        okBtn.onclick = () => { cleanup(); resolve(true); };
        cancelBtn.onclick = () => { cleanup(); resolve(false); };
    });
}

// ── Currency Formatter ─────────────────────────────────────────
export function formatCurrency(amount) {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

// ── Date Formatter ─────────────────────────────────────────────
export function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB');
}
