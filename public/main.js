// Main JavaScript File - تحكم موحد في كل الصفحات

document.addEventListener('DOMContentLoaded', function() {
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
    // ========== حل مشكلة تبديل اللغة ==========
document.addEventListener('DOMContentLoaded', function() {
    // نختار جميع أزرار اللغة
    const langSwitcher = document.querySelector('.language-switcher');
    if (!langSwitcher) return;

    const langLinks = langSwitcher.querySelectorAll('a');
    
    langLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // نمنع السلوك الافتراضي للرابط
            
            const currentPath = window.location.pathname;
            const isArabicPage = currentPath.startsWith('/ar/');
            const targetLang = this.classList.contains('arabic') ? 'ar' : 'en';
            
            let newPath;
            if (targetLang === 'ar') {
                // إذا كنا نريد العربية
                if (isArabicPage) return; // نحن بالفعل في العربية
                // نحول المسار الحالي إلى العربية
                newPath = '/ar' + currentPath;
            } else {
                // إذا كنا نريد الإنجليزية
                if (!isArabicPage) return; // نحن بالفعل في الإنجليزية
                // نزيل /ar من المسار
                newPath = currentPath.replace('/ar', '') || '/';
            }
            
            // ننقل المستخدم إلى الصفحة الجديدة (هذا سيحدث إعادة تحميل طبيعية)
            window.location.href = newPath;
        });
    });
});

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