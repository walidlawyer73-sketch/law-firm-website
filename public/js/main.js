// @ts-nocheck
/**
 * main.js - الإصدار النظيف
 */

// ================================================
// 1. ضبط المسافة بسبب الشريط
// ================================================
function adjustForBanner() {
    const banner = document.getElementById('trial-banner');
    if (!banner) return;
    const height = banner.offsetHeight;
    document.body.style.paddingTop = height + 'px';
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.top = height + 'px';
}
document.addEventListener('DOMContentLoaded', adjustForBanner);
window.addEventListener('resize', adjustForBanner);

// ================================================
// 2. أزرار اللغة
// ================================================
(function fixLanguage() {
    const btn = document.querySelector('.language-switcher .lang-btn');
    if (!btn) return;

    const currentPath = window.location.pathname;
    const isArabic = currentPath.startsWith('/ar/');

    if (isArabic) {
        let englishPath = currentPath.replace('/ar', '');
        if (englishPath === '' || englishPath === '/index.html' || englishPath === '/') {
            englishPath = '/';
        }
        btn.href = englishPath;
        btn.innerHTML = '<i class="fas fa-globe"></i> English';
    } else {
        let arabicPath;
        if (currentPath === '/' || currentPath === '/index.html' || currentPath === '') {
            arabicPath = '/ar/';
        } else {
            arabicPath = '/ar' + currentPath;
        }
        btn.href = arabicPath;
        btn.innerHTML = '<i class="fas fa-globe"></i> العربية';
    }
})();

// ================================================
// 3. إصلاح صورة المحامي
// ================================================
(function fixImages() {
    const correct = '/images/team/walid-profile.jpg';
    const imgs = document.querySelectorAll('img[alt*="وليد"], img[alt*="Walid"], .team-card img, img[src*="walid"]');
    imgs.forEach(img => {
        if (img.complete && img.naturalWidth === 0) {
            img.src = correct;
        } else {
            img.onerror = function() { this.src = correct; };
        }
    });
})();

// ================================================
// 4. إصلاح روابط السياسات
// ================================================
(function fixLinks() {
    const links = document.querySelectorAll('footer a[href*="privacy"], footer a[href*="terms"], footer a[href*="cookie"]');
    links.forEach(link => {
        let href = link.getAttribute('href');
        if (href && !href.startsWith('/')) {
            link.setAttribute('href', '/' + href);
        }
    });
})();