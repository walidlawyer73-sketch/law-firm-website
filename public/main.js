// @ts-nocheck
/**
 * main.js - النسخة النهائية المتكاملة
 */

// ================================================
// 1. إنشاء شريط التجريبي وضبط المسافات
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
        font-family: inherit;
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

    function adjustPositions() {
        const bannerHeight = banner.offsetHeight;
        document.body.style.paddingTop = bannerHeight + 'px';
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.top = bannerHeight + 'px';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', adjustPositions);
    } else {
        adjustPositions();
    }
    window.addEventListener('resize', adjustPositions);
})();

// ================================================
// 2. إصلاح أزرار اللغة (توجيه ذكي إلى نفس الصفحة)
// ================================================
(function fixLanguageButtons() {
    const langLink = document.getElementById('langSwitch');
    if (!langLink) return;

    // إزالة أي رابط ثابت وضبطه ديناميكيًا
    langLink.removeAttribute('href');
    langLink.style.cursor = 'pointer';

    langLink.addEventListener('click', function(e) {
        e.preventDefault();
        const currentPath = window.location.pathname;
        const isArabic = document.documentElement.lang === 'ar' || currentPath.startsWith('/ar/');
        let newPath = '/';

        if (isArabic) {
            // من العربية إلى الإنجليزية
            let englishPath = currentPath.replace('/ar', '');
            if (englishPath === '' || englishPath === '/index.html' || englishPath === '/') {
                englishPath = '/';
            }
            newPath = englishPath;
        } else {
            // من الإنجليزية إلى العربية
            if (currentPath === '/' || currentPath === '/index.html' || currentPath === '') {
                newPath = '/ar/';
            } else {
                newPath = '/ar' + currentPath;
            }
        }
        window.location.href = newPath;
    });

    // تحديث النص المعروض حسب اللغة الحالية
    const updateButtonText = () => {
        const isArabic = document.documentElement.lang === 'ar';
        langLink.innerHTML = isArabic
            ? '<i class="fas fa-globe"></i> English'
            : '<i class="fas fa-globe"></i> العربية';
    };
    updateButtonText();
})();

// ================================================
// 3. إصلاح جميع الروابط الداخلية (الخدمات، الفوتر، إلخ)
// ================================================
(function fixAllInternalLinks() {
    // قائمة الروابط التي قد تكون بدون .html أو مسار مطلق
    const allLinks = document.querySelectorAll('a[href]');
    allLinks.forEach(link => {
        let href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        // تصحيح الروابط التي تنتهي بدون .html وتحتوي على /ar/ أو لا تحتوي
        if (!href.includes('.html') && !href.endsWith('/')) {
            // إضافة .html فقط إذا كان الرابط يشير إلى صفحة داخلية (لا يحتوي على علامة استفهام أو علامات خاصة)
            if (!href.includes('?') && !href.includes('#')) {
                link.setAttribute('href', href + '.html');
            }
        }

        // التأكد من أن الروابط المطلقة تبدأ بـ /
        if (!href.startsWith('/') && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            link.setAttribute('href', '/' + href);
        }
    });
})();

// ================================================
// 4. إصلاح صورة المحامي الرئيسي (مسار مطلق)
// ================================================
(function fixLawyerImages() {
    const correctPath = '/images/team/walid-profile.jpg';
    const images = document.querySelectorAll(
        'img[alt*="وليد أبو العلا"], img[alt*="Walid Abo Al-Ela"], .team-card img, img[src*="walid"]'
    );

    images.forEach(img => {
        img.onerror = function() {
            this.onerror = null;
            this.src = correctPath;
        };
        if (img.complete && img.naturalWidth === 0) {
            img.src = correctPath;
        }
    });
})();

// ================================================
// 5. إصلاح روابط السياسات
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

// ================================================
// 6. Navbar scroll effect + smooth scroll + animations
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    // Navbar scroll effect
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Smooth scroll للروابط الداخلية
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Animations للبطاقات عند الظهور
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    document.querySelectorAll('.feature-card, .team-card, .testimonial-card, .blog-card').forEach(el => {
        observer.observe(el);
    });
});

// ================================================
// 7. إضافة style ديناميكي للأنيميشن
// ================================================
if (!document.querySelector('#dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fadeInUp { animation: fadeInUp 0.6s ease forwards; }
    `;
    document.head.appendChild(style);
}

// ================================================
// 8. زر العودة للأعلى
// ================================================
(function addBackToTopButton() {
    if (document.getElementById('backToTop')) return;

    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.id = 'backToTop';
    backToTopButton.title = 'العودة إلى الأعلى';
    backToTopButton.style.cssText = `
        position: fixed; bottom: 30px; right: 30px;
        width: 50px; height: 50px; border-radius: 50%;
        background: #FFD700; color: #000; border: none;
        cursor: pointer; display: none; z-index: 999;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        transition: all 0.3s; font-size: 20px;
        display: flex; align-items: center; justify-content: center;
    `;
    
    backToTopButton.onmouseover = () => {
        backToTopButton.style.transform = 'scale(1.1)';
        backToTopButton.style.background = '#000';
        backToTopButton.style.color = '#FFD700';
    };
    backToTopButton.onmouseout = () => {
        backToTopButton.style.transform = 'scale(1)';
        backToTopButton.style.background = '#FFD700';
        backToTopButton.style.color = '#000';
    };

    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backToTopButton.style.display = 'flex';
        else backToTopButton.style.display = 'none';
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ================================================
// 9. منع أي عناصر شفافة من منع النقر
// ================================================
(function fixPointerEvents() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.style.pointerEvents === 'none' && el !== document.getElementById('trial-banner')) {
            el.style.pointerEvents = 'auto';
        }
    });
})();