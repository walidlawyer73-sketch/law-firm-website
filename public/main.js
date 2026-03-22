// @ts-nocheck
/**
 * main.js - الإصدار النهائي المتكامل
 */

// ================================================
// 1. شريط تجريبي (يضاف تلقائياً)
// ================================================
(function createTrialBanner() {
    if (document.getElementById('trial-banner')) return;

    const isArabic = document.documentElement.lang === 'ar';
    const bannerText = isArabic
        ? 'هذا إصدار تجريبي للموقع - جاري التطوير والتحديث'
        : 'This is a trial version - site under development and updates';

    const banner = document.createElement('div');
    banner.id = 'trial-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 9999;
        background-color: #ffc107;
        color: #000;
        text-align: center;
        padding: 10px;
        font-weight: bold;
        border-bottom: 2px solid #000;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        box-sizing: border-box;
    `;

    const iconLeft = document.createElement('i');
    iconLeft.className = 'fas fa-tools';
    const iconRight = document.createElement('i');
    iconRight.className = 'fas fa-tools';
    const textSpan = document.createElement('span');
    textSpan.className = 'banner-text';
    textSpan.textContent = bannerText;

    banner.appendChild(iconLeft);
    banner.appendChild(textSpan);
    banner.appendChild(iconRight);

    document.body.insertBefore(banner, document.body.firstChild);

    function adjustPadding() {
        const height = banner.offsetHeight;
        document.body.style.paddingTop = height + 'px';
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.marginTop = '0';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', adjustPadding);
    } else {
        adjustPadding();
    }
    window.addEventListener('resize', adjustPadding);
})();

// ================================================
// 2. أزرار اللغة (توجيه ذكي إلى نفس الصفحة)
// ================================================
function fixLanguageButtons() {
    const langButtons = document.querySelectorAll('.language-switcher .lang-btn');
    if (!langButtons.length) return;

    langButtons.forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.preventDefault();

            const currentPath = window.location.pathname;
            const currentLang = document.documentElement.lang; // 'ar' أو 'en'
            let newPath = '/';

            if (currentLang === 'ar') {
                // من العربية إلى الإنجليزية
                if (currentPath === '/ar/' || currentPath === '/ar/index.html') {
                    newPath = '/';
                } else if (currentPath.startsWith('/ar/')) {
                    newPath = currentPath.replace('/ar', '') || '/';
                    if (newPath === '' || newPath === '/index.html') newPath = '/';
                }
            } else {
                // من الإنجليزية إلى العربية
                if (currentPath === '/' || currentPath === '/index.html') {
                    newPath = '/ar/';
                } else {
                    newPath = '/ar' + currentPath;
                }
            }

            window.location.href = newPath;
        });
    });
}

// ================================================
// 3. إصلاح صورة المحامي
// ================================================
function fixLawyerImages() {
    const correctPath = '/images/team/walid-profile.jpg';
    const images = document.querySelectorAll(
        'img[alt*="وليد أبو العلا"], img[alt*="Walid Abo Al-Ela"], .team-card img, img[src*="walid"]'
    );
    if (!images.length) return;

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
}

// ================================================
// 4. إصلاح روابط السياسات (جعلها مطلقة)
// ================================================
function fixPolicyLinks() {
    const policyLinks = document.querySelectorAll(
        'footer a[href*="privacy"], footer a[href*="terms"], footer a[href*="cookie"]'
    );
    if (!policyLinks.length) return;

    policyLinks.forEach(link => {
        let href = link.getAttribute('href');
        if (href && !href.startsWith('/')) {
            link.setAttribute('href', '/' + href);
        }
    });
}

// ================================================
// 5. تشغيل الإصلاحات بعد تحميل الصفحة
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    fixLanguageButtons();
    fixLawyerImages();
    fixPolicyLinks();
});