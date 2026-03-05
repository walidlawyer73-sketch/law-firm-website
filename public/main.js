// @ts-nocheck
/**
 * main.js - الوظائف العامة للموقع
 * آخر تحديث: إصلاح مشكلة تكرار onload والأقواس
 */

// ================================================
// حل مشكلة أزرار اللغة - التوجيه الذكي
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixLanguageButtons, 100);
});

function fixLanguageButtons() {
    const langButtons = document.querySelectorAll('.language-switcher .lang-btn');
    
    langButtons.forEach(function(btn) {
        btn.removeAttribute('href'); // إزالة الرابط الثابت
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            switchLanguage();
        });
    });
}

function switchLanguage() {
    const currentPath = window.location.pathname;
    const currentLang = document.documentElement.lang; // 'ar' أو 'en'
    let newPath;
    
    if (currentLang === 'ar') {
        // من العربية إلى الإنجليزية
        if (currentPath === '/ar/' || currentPath === '/ar/index.html' || currentPath === '/ar') {
            newPath = '/'; // الصفحة الرئيسية الإنجليزية
        } else if (currentPath.startsWith('/ar/')) {
            // إزالة /ar/ من البداية
            newPath = currentPath.substring(3);
            if (newPath === '' || newPath === 'index.html') {
                newPath = '/';
            }
        } else {
            newPath = '/';
        }
    } else {
        // من الإنجليزية إلى العربية
        if (currentPath === '/' || currentPath === '/index.html') {
            newPath = '/ar/'; // الصفحة الرئيسية العربية
        } else {
            newPath = '/ar' + currentPath;
        }
    }
    
    window.location.href = newPath;
}

// ================================================
// حل مشكلة صورة المحامي الرئيسي
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixLawyerImage, 200);
});

function fixLawyerImage() {
    // البحث عن جميع الصور التي قد تكون للمحامي
    const possibleImages = document.querySelectorAll(
        'img[alt*="وليد أبو العلا"], ' +
        'img[alt*="Walid Abo Al-Ela"], ' +
        '.team-card img, ' +
        'img[src*="walid"]'
    );
    
    // قائمة المسارات المحتملة للصورة (عدلها حسب موقعك)
    const possiblePaths = [
        '/images/team/walid-profile.jpg',
        '/images/team/walid-abouelela.jpg',
        '/images/walid-profile.jpg',
        '/ar/images/team/walid-profile.jpg',
        '/images/lawyers/walid.jpg'
    ];
    
    possibleImages.forEach(function(img) {
        // تجاهل الصور الصغيرة جداً (أيقونات)
        if (img.width && img.width < 50) return;
        
        // بدء محاولة تحميل الصورة من المسارات
        tryLoadImage(img, possiblePaths, 0);
    });
}

function tryLoadImage(imgElement, pathsArray, index) {
    if (index >= pathsArray.length) {
        console.log('لم يتم العثور على الصورة في أي مسار');
        return;
    }
    
    var testImg = new Image();
    testImg.src = pathsArray[index];
    
    testImg.onload = function() {
        // تم العثور على الصورة
        imgElement.src = pathsArray[index];
        imgElement.onerror = null;
        console.log('✅ تم تحميل الصورة من: ' + pathsArray[index]);
    };
    
    testImg.onerror = function() {
        // جرب المسار التالي
        tryLoadImage(imgElement, pathsArray, index + 1);
    };
}
    // ========== 1. تغيير لون النافبار إلى الأسود (إذا كان أزرق) ==========
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.backgroundColor = '#000000'; // أسود خالص
        
        // إضافة تأثير التمرير (اختياري)
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ========== 2. إصلاح روابط السياسات (توجيه الصفحات العربية إلى النسخ العربية) ==========
    document.querySelectorAll('footer a[href*="privacy-policy.html"], footer a[href*="terms-of-service.html"], footer a[href*="cookie-policy.html"]').forEach(link => {
        // التحقق من أن الصفحة الحالية هي عربية (تحتوي على /ar/ في المسار)
        if (window.location.pathname.includes('/ar/')) {
            // تعديل الرابط ليصبح عربياً
            if (link.getAttribute('href').includes('privacy-policy.html')) {
                link.href = '/ar/privacy-policy.html';
            } else if (link.getAttribute('href').includes('terms-of-service.html')) {
                link.href = '/ar/terms-of-service.html';
            } else if (link.getAttribute('href').includes('cookie-policy.html')) {
                link.href = '/ar/cookie-policy.html';
            }
        }
    });

    // ========== 3. إصلاح زر اللغة ليعمل في كل الصفحات ==========
   /**
 * ================================================
 * حل نهائي لمشكلة أزرار اللغة
 * ================================================
 */
/**
 * main.js - الوظائف العامة للموقع
 * آخر تحديث: إصلاح مشاكل الأقواس والتنسيق
 */

// ================================================
// حل مشكلة أزرار اللغة - التوجيه الذكي
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixLanguageButtons, 100);
});

function fixLanguageButtons() {
    const langButtons = document.querySelectorAll('.language-switcher .lang-btn');
    
    langButtons.forEach(function(btn) {
        btn.removeAttribute('href'); // إزالة الرابط الثابت
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            switchLanguage();
        });
    });
}

function switchLanguage() {
    const currentPath = window.location.pathname;
    const currentLang = document.documentElement.lang; // 'ar' أو 'en'
    let newPath;
    
    if (currentLang === 'ar') {
        // من العربية إلى الإنجليزية
        if (currentPath === '/ar/' || currentPath === '/ar/index.html' || currentPath === '/ar') {
            newPath = '/'; // الصفحة الرئيسية الإنجليزية
        } else if (currentPath.startsWith('/ar/')) {
            // إزالة /ar/ من البداية
            newPath = currentPath.substring(3);
            if (newPath === '' || newPath === 'index.html') {
                newPath = '/';
            }
        } else {
            newPath = '/';
        }
    } else {
        // من الإنجليزية إلى العربية
        if (currentPath === '/' || currentPath === '/index.html') {
            newPath = '/ar/'; // الصفحة الرئيسية العربية
        } else {
            newPath = '/ar' + currentPath;
        }
    }
    
    window.location.href = newPath;
}

// ================================================
// حل مشكلة صورة المحامي الرئيسي
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixLawyerImage, 200);
});

function fixLawyerImage() {
    // البحث عن جميع الصور التي قد تكون للمحامي
    const possibleImages = document.querySelectorAll(
        'img[alt*="وليد أبو العلا"], ' +
        'img[alt*="Walid Abo Al-Ela"], ' +
        '.team-card img, ' +
        'img[src*="walid"]'
    );
    
    // قائمة المسارات المحتملة للصورة (عدلها حسب موقعك)
    const possiblePaths = [
        '/images/team/walid-profile.jpg',
        '/images/team/walid-abouelela.jpg',
        '/images/walid-profile.jpg',
        '/ar/images/team/walid-profile.jpg',
        '/images/lawyers/walid.jpg'
    ];
    
    possibleImages.forEach(function(img) {
        // تجاهل الصور الصغيرة جداً (أيقونات)
        if (img.width && img.width < 50) return;
        
        // بدء محاولة تحميل الصورة من المسارات
        tryLoadImage(img, possiblePaths, 0);
    });
}

function tryLoadImage(imgElement, pathsArray, index) {
    if (index >= pathsArray.length) {
        console.log('لم يتم العثور على الصورة في أي مسار');
        return;
    }
    
    var testImg = new Image();
    testImg.src = pathsArray[index];
    
    testImg.onload = function() {
        // تم العثور على الصورة
        imgElement.src = pathsArray[index];
        imgElement.onerror = null;
        console.log('✅ تم تحميل الصورة من: ' + pathsArray[index]);
    };
    
    testImg.onerror = function() {
        // جرب المسار التالي
        tryLoadImage(imgElement, pathsArray, index + 1);
    };
}
// ========== حل مشكلة الاسكرول ==========
// هذا الكود يضمن أن خاصية التمرير تعمل بشكل طبيعي
document.documentElement.style.overflow = 'auto';
document.body.style.overflow = 'auto';

    // ========== 4. إصلاح روابط القائمة المنسدلة للخدمات (إذا لزم الأمر) ==========
    // تأكد من أن جميع روابط الخدمات تعمل بشكل صحيح (يمكن إضافة منطق هنا إذا كانت هناك مشاكل)

    // ========== 5. تحسينات إضافية ==========
    
    // زر العودة إلى الأعلى (موجود مسبقاً في main.js، تأكد من وجوده)
    if (!document.getElementById('backToTop')) {
        const backToTopButton = document.createElement('button');
        backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        backToTopButton.setAttribute('id', 'backToTop');
        backToTopButton.setAttribute('title', 'العودة إلى الأعلى');
        backToTopButton.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #FFD700;
            color: #000000;
            border: none;
            cursor: pointer;
            display: none;
            z-index: 999;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            transition: all 0.3s;
        `;
        backToTopButton.onmouseover = () => { backToTopButton.style.transform = 'scale(1.1)'; };
        backToTopButton.onmouseout = () => { backToTopButton.style.transform = 'scale(1)'; };
        
        document.body.appendChild(backToTopButton);
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.style.display = 'block';
            } else {
                backToTopButton.style.display = 'none';
            }
        });
        
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ========== 6. تغيير لون الروابط النشطة في القائمة (اختياري) ==========
    // إضافة كلاس active للرابط الحالي
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-nav a').forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref && linkHref.includes(currentPage)) {
            link.classList.add('active');
        } else if (currentPage === '' && linkHref === 'index.html') {
            link.classList.add('active');
        }
    });

// ========== 7. إصلاح مشكلة النافبار الأزرق عبر CSS إضافي ==========
// إضافة CSS ديناميكي لفرض اللون الأسود
const style = document.createElement('style');
style.textContent = `
    .navbar {
        background-color: #000000 !important;
    }
    .navbar-brand {
        color: #FFD700 !important;
    }
    .navbar-brand img {
        height: 45px !important;
        width: auto !important;
    }
    /* تنسيقات إضافية للعربية */
    [dir="rtl"] .navbar-brand img {
        margin-left: 10px;
        margin-right: 0;
    }
`;
document.head.appendChild(style);