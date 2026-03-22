// @ts-nocheck
/**
 * main.js - الوظائف العامة للموقع
 * الإصدار: 5.0 - شريط تجريبي ثنائي اللغة + الإصلاحات
 */

// ================================================
// 1. إنشاء وإدارة شريط التجريبي (يتم أولاً)
// ================================================
(function() {
    // تجنب التكرار إذا كان الشريط موجوداً مسبقاً
    if (document.getElementById('trial-banner')) return;

    // إنشاء عناصر الشريط
    const banner = document.createElement('div');
    banner.id = 'trial-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 10000;
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

    banner.appendChild(iconLeft);
    banner.appendChild(textSpan);
    banner.appendChild(iconRight);

    // تحديد النص حسب لغة الصفحة (من <html lang>)
    const isArabic = document.documentElement.lang === 'ar';
    textSpan.innerText = isArabic 
        ? 'هذا إصدار تجريبي للموقع - جاري التطوير والتحديث'
        : 'This is a trial version - site under development and updates';

    // إضافة الشريط إلى بداية body
    document.body.insertBefore(banner, document.body.firstChild);

    // دالة ضبط padding-top للـ body
    function adjustBodyPadding() {
        const bannerHeight = banner.offsetHeight;
        document.body.style.paddingTop = bannerHeight + 'px';
        // تأكيد أن النافبار ليس له مسافة إضافية
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.marginTop = '0';
    }

    // تنفيذ الضبط فوراً وبعد تحميل الصفحة وبعد تغيير الحجم
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', adjustBodyPadding);
    } else {
        adjustBodyPadding();
    }
    window.addEventListener('resize', adjustBodyPadding);
})();

// ================================================
// 2. حل مشكلة أزرار اللغة - التوجيه الذكي
// ================================================
function fixLanguageButtons() {
    const langButtons = document.querySelectorAll('.language-switcher .lang-btn');
    langButtons.forEach(btn => {
        btn.removeAttribute('href');
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const currentPath = window.location.pathname;
            const currentLang = document.documentElement.lang;
            let newPath = '/';
            if (currentLang === 'ar') {
                if (currentPath === '/ar/' || currentPath === '/ar/index.html') {
                    newPath = '/';
                } else if (currentPath.startsWith('/ar/')) {
                    newPath = currentPath.replace('/ar', '') || '/';
                    if (newPath === '' || newPath === '/index.html') newPath = '/';
                }
            } else {
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
// 3. حل مشكلة صورة المحامي الرئيسي
// ================================================
function fixLawyerImages() {
    const possibleImages = document.querySelectorAll(
        'img[alt*="وليد أبو العلا"], img[alt*="Walid Abo Al-Ela"], .team-card img, img[src*="walid"]'
    );
    const correctPath = '/images/team/walid-profile.jpg';
    possibleImages.forEach(img => {
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
// 4. إصلاح روابط السياسات (تضمن أنها مطلقة)
// ================================================
function fixPolicyLinks() {
    const policyLinks = document.querySelectorAll(
        'footer a[href*="privacy"], footer a[href*="terms"], footer a[href*="cookie"]'
    );
    policyLinks.forEach(link => {
        let href = link.getAttribute('href');
        if (href && !href.startsWith('/')) {
            link.setAttribute('href', '/' + href);
        }
    });
}

// ================================================
// 5. تشغيل جميع الإصلاحات عند تحميل الصفحة
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    fixLanguageButtons();
    fixLawyerImages();
    fixPolicyLinks();
});