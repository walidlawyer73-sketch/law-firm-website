// @ts-nocheck
/**
 * main.js - الحل النهائي لجميع مشاكل الموقع
 * الإصدار: 3.0
 */

// ================================================
// بداية: حل مشكلة أزرار اللغة
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // إصلاح أزرار اللغة
    fixLanguageButtons();
    
    // إصلاح صور المحامين
    fixLawyerImages();
});

function fixLanguageButtons() {
    const buttons = document.querySelectorAll('.language-switcher .lang-btn');
    
    buttons.forEach(btn => {
        // إزالة أي رابط قديم
        btn.removeAttribute('href');
        btn.style.cursor = 'pointer';
        
        // إضافة حدث النقر
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const currentPath = window.location.pathname;
            const isArabic = document.documentElement.lang === 'ar';
            
            let newPath = '/';
            
            if (isArabic) {
                // من العربية للإنجليزية
                if (currentPath === '/ar/' || currentPath === '/ar/index.html') {
                    newPath = '/';
                } else if (currentPath.startsWith('/ar/')) {
                    newPath = currentPath.replace('/ar', '');
                    if (newPath === '' || newPath === '/index.html') {
                        newPath = '/';
                    }
                }
            } else {
                // من الإنجليزية للعربية
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
// حل مشكلة صور المحامين
// ================================================
function fixLawyerImages() {
    // البحث عن جميع الصور التي تحمل صفات المحامي
    const selectors = [
        'img[alt*="وليد أبو العلا"]',
        'img[alt*="Walid Abo Al-Ela"]',
        '.team-card img',
        'img[src*="walid"]',
        'img[src*="team"]'
    ];
    
    const images = document.querySelectorAll(selectors.join(','));
    
    // المسار الصحيح للصورة (تأكد من وجود الصورة في هذا المسار)
    const correctPath = '/images/team/walid-profile.jpg';
    
    images.forEach(img => {
        // تجاهل الصور التالفة أو الصغيرة
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
// إصلاح روابط السياسات (تضمن عملها في كل الصفحات)
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    const policyLinks = document.querySelectorAll('footer a[href*="privacy"], footer a[href*="terms"], footer a[href*="cookie"]');
    
    policyLinks.forEach(link => {
        let href = link.getAttribute('href');
        if (href && !href.startsWith('/')) {
            link.setAttribute('href', '/' + href);
        }
    });
});