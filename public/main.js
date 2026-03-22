// @ts-nocheck
/**
 * main.js - الوظائف العامة للموقع
 * الإصدار: 4.0
 */

// انتظار تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // إصلاح أزرار اللغة
    fixLanguageButtons();
    
    // إصلاح صور المحامين
    fixLawyerImages();
    
    // إصلاح روابط السياسات
    fixPolicyLinks();
});

// ================================================
// حل مشكلة أزرار اللغة - التوجيه الذكي
// ================================================
function fixLanguageButtons() {
    const langButtons = document.querySelectorAll('.language-switcher .lang-btn');
    
    langButtons.forEach(btn => {
        btn.removeAttribute('href');
        btn.style.cursor = 'pointer';
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
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
// حل مشكلة صورة المحامي الرئيسي
// ================================================
function fixLawyerImages() {
    const possibleImages = document.querySelectorAll(
        'img[alt*="وليد أبو العلا"], ' +
        'img[alt*="Walid Abo Al-Ela"], ' +
        '.team-card img, ' +
        'img[src*="walid"]'
    );
    
    const correctPath = '/images/team/walid-profile.jpg';
    
    possibleImages.forEach(img => {
        // إذا كانت الصورة فشلت في التحميل، نستخدم المسار الصحيح
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
// إصلاح روابط السياسات
// ================================================
function fixPolicyLinks() {
    const policyLinks = document.querySelectorAll(
        'footer a[href*="privacy"], ' +
        'footer a[href*="terms"], ' +
        'footer a[href*="cookie"]'
    );
    
    policyLinks.forEach(link => {
        let href = link.getAttribute('href');
        if (href && !href.startsWith('/')) {
            link.setAttribute('href', '/' + href);
        }
    });
}
function updateTrialBanner() {
    const bannerSpan = document.getElementById('banner-text');
    if (!bannerSpan) return;
    const isArabic = document.documentElement.lang === 'ar';
    bannerSpan.innerText = isArabic 
        ? 'هذا إصدار تجريبي للموقع - جاري التطوير والتحديث'
        : 'This is a trial version - site under development and updates';
}

document.addEventListener('DOMContentLoaded', updateTrialBanner);
// ضبط المسافة أعلى الصفحة حسب ارتفاع شريط التجريبي
function adjustForBanner() {
    const banner = document.getElementById('trial-banner');
    if (banner) {
        const bannerHeight = banner.offsetHeight;
        document.body.style.paddingTop = bannerHeight + 'px';
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.marginTop = '0';
    }
}

// تحديث نص الشريط حسب اللغة
function updateBannerText() {
    const bannerSpan = document.querySelector('#trial-banner .banner-text');
    if (!bannerSpan) return;
    const isArabic = document.documentElement.lang === 'ar';
    bannerSpan.innerText = isArabic 
        ? 'هذا إصدار تجريبي للموقع - جاري التطوير والتحديث'
        : 'This is a trial version - site under development and updates';
}

// تشغيل الوظائف عند تحميل الصفحة وعند تغيير حجم النافذة
document.addEventListener('DOMContentLoaded', function() {
    adjustForBanner();
    updateBannerText();
});
window.addEventListener('resize', adjustForBanner);