// @ts-nocheck
/**
 * main.js - الإصدار النهائي
 */

// ================================================
// 1. ضبط المسافة بسبب الشريط العلوي
// ================================================
function adjustForBanner() {
    const banner = document.getElementById('trial-banner');
    if (banner) {
        const height = banner.offsetHeight;
        document.body.style.paddingTop = height + 'px';
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.top = height + 'px';
    }
}
document.addEventListener('DOMContentLoaded', adjustForBanner);
window.addEventListener('resize', adjustForBanner);

// ================================================
// 2. أزرار اللغة (توجيه ذكي مع الحفاظ على الصفحة)
// ================================================
(function fixLanguage() {
    const btn = document.querySelector('.language-switcher .lang-btn');
    if (!btn) return;

    const currentPath = window.location.pathname;
    const isArabic = currentPath.startsWith('/ar/');

    if (isArabic) {
        // من العربية إلى الإنجليزية
        let englishPath = currentPath.replace('/ar', '');
        if (englishPath === '' || englishPath === '/index.html' || englishPath === '/') {
            englishPath = '/';
        }
        btn.href = englishPath;
        btn.innerHTML = '<i class="fas fa-globe"></i> English';
    } else {
        // من الإنجليزية إلى العربية
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
// 3. إصلاح صورة المحامي الرئيسي
// ================================================
(function fixLawyerImages() {
    const correctPath = '/images/team/walid-profile.jpg';
    const images = document.querySelectorAll(
        'img[alt*="وليد أبو العلا"], img[alt*="Walid Abo Al-Ela"], .team-card img, img[src*="walid"]'
    );
    images.forEach(img => {
        if (img.complete && img.naturalWidth === 0) {
            img.src = correctPath;
        } else {
            img.onerror = function() {
                this.src = correctPath;
                this.onerror = null;
            };
        }
    });
})();

// ================================================
// 4. إصلاح روابط السياسات (جعلها مطلقة)
// ================================================
(function fixPolicyLinks() {
    const links = document.querySelectorAll(
        'footer a[href*="privacy"], footer a[href*="terms"], footer a[href*="cookie"]'
    );
    links.forEach(link => {
        let href = link.getAttribute('href');
        if (href && !href.startsWith('/')) {
            link.setAttribute('href', '/' + href);
        }
    });
})();