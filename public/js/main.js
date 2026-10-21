// ============================================================================
// ============================================================================
// main.js - Walid Abu AlEla Law Firm
// ملف JavaScript الموحد - كل الأكواد في مكان واحد
// Unified JavaScript - All code in one place
//
// VERSION / الإصدار: v7.0 (Language Switcher Fixed)
// ============================================================================
// ============================================================================


(function() {
    'use strict';

    // ========================================================================
    // 1. الشريط التجريبي - Trial Banner
    // ========================================================================
    function createTrialBanner() {
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
            background: linear-gradient(90deg, #FFC107 0%, #FFB300 100%);
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
            font-size: 0.9rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;

        const iconLeft = document.createElement('i');
        iconLeft.className = 'fas fa-tools';
        const iconRight = document.createElement('i');
        iconRight.className = 'fas fa-tools';
        const textSpan = document.createElement('span');
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
    }


    // ========================================================================
    // 2. LANGUAGE SWITCHER — v7.0 BULLETPROOF
    //    حقن زر اللغة — نسخة v7.0 مضمونة 100%
    // ========================================================================
    // STRATEGY / الاستراتيجية:
    //   • Uses a dedicated class `lang-nav-btn` (NOT the floating `.lang-btn`)
    //   • Injects its OWN CSS to guarantee visibility regardless of page
    //   • Simple 3-tier injection into `.navbar-nav` — no complex conditions
    //   • Runs on ALL pages automatically
    //
    //   • يستخدم كلاس مخصص `lang-nav-btn` (وليس الزر العائم)
    //   • يحقن CSS خاص به لضمان الظهور في كل الصفحات
    //   • حقن مبسّط بثلاث طبقات في `.navbar-nav`
    //   • يعمل على كل الصفحات تلقائياً
    // ========================================================================
    function injectLanguageSwitcher() {

        // ─── STEP 1: If already injected, cleanup & exit ───────────────
        if (document.querySelector('.navbar .lang-nav-item')) {
            // Remove any stray floating switchers
            document.querySelectorAll('body > .language-switcher').forEach(el => el.remove());
            return;
        }

        // ─── STEP 2: Remove any old floating switchers ────────────────
        document.querySelectorAll('body > .language-switcher').forEach(el => el.remove());

        // ─── STEP 3: Inject dedicated CSS (once) ──────────────────────
        if (!document.getElementById('injected-lang-styles')) {
            const style = document.createElement('style');
            style.id = 'injected-lang-styles';
            style.textContent = `
                /* Language button inside navbar */
                .navbar .lang-nav-item {
                    list-style: none !important;
                    margin-inline-start: 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    padding: 0 !important;
                }
                .navbar .lang-nav-item .lang-nav-btn {
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    padding: 8px 16px !important;
                    background: linear-gradient(135deg, #C9A961, #A88947) !important;
                    color: #000 !important;
                    border: 2px solid #C9A961 !important;
                    border-radius: 999px !important;
                    text-decoration: none !important;
                    font-weight: 700 !important;
                    font-size: 0.82rem !important;
                    box-shadow: 0 4px 12px rgba(201,169,97,0.3) !important;
                    transition: all 0.3s ease !important;
                    white-space: nowrap !important;
                    line-height: 1 !important;
                    position: static !important;
                    top: auto !important;
                    right: auto !important;
                    left: auto !important;
                    bottom: auto !important;
                    height: auto !important;
                    width: auto !important;
                    font-family: inherit !important;
                    cursor: pointer !important;
                }
                .navbar .lang-nav-item .lang-nav-btn i {
                    font-size: 0.85rem !important;
                    color: #000 !important;
                    transition: color 0.3s ease !important;
                }
                .navbar .lang-nav-item .lang-nav-btn span {
                    color: #000 !important;
                }
                .navbar .lang-nav-item .lang-nav-btn:hover {
                    background: transparent !important;
                    color: #C9A961 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 20px rgba(201,169,97,0.4) !important;
                }
                .navbar .lang-nav-item .lang-nav-btn:hover i,
                .navbar .lang-nav-item .lang-nav-btn:hover span {
                    color: #C9A961 !important;
                }
                /* On scrolled navbar (dark background) */
                .navbar.scrolled .lang-nav-item .lang-nav-btn {
                    background: linear-gradient(135deg, #C9A961, #A88947) !important;
                    color: #000 !important;
                }
                /* Mobile */
                @media (max-width: 991px) {
                    .navbar .lang-nav-item {
                        margin-inline-start: 0 !important;
                        margin-top: 10px !important;
                        width: 100% !important;
                    }
                    .navbar .lang-nav-item .lang-nav-btn {
                        display: flex !important;
                        justify-content: center !important;
                        width: 100% !important;
                        padding: 10px 16px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // ─── STEP 4: Detect current language ──────────────────────────
        const isArabic = (document.documentElement.lang || '').toLowerCase().startsWith('ar');

        // ─── STEP 5: Build target URL ─────────────────────────────────
        const currentPath = window.location.pathname || '/';
        let targetHref;

        if (isArabic) {
            // From AR → EN : remove /ar prefix
            if (currentPath === '/ar/' || currentPath === '/ar' || currentPath === '/ar/index.html') {
                targetHref = '/';
            } else {
                targetHref = currentPath.replace(/^\/ar(?=\/|$)/i, '') || '/';
            }
        } else {
            // From EN → AR : add /ar prefix
            if (currentPath === '/' || currentPath === '/index.html') {
                targetHref = '/ar/';
            } else {
                targetHref = '/ar' + currentPath;
            }
        }

        const label = isArabic ? 'English' : 'العربية';
        const targetLang = isArabic ? 'en' : 'ar';

        // ─── STEP 6: Create <li> element ─────────────────────────────
        const langItem = document.createElement('li');
        langItem.className = 'nav-item lang-nav-item';

        const langBtn = document.createElement('a');
        langBtn.href = targetHref;
        langBtn.className = 'lang-nav-btn';
        langBtn.setAttribute('hreflang', targetLang);
        langBtn.setAttribute('aria-label', label);
        langBtn.innerHTML = '<i class="fas fa-globe" aria-hidden="true"></i><span>' + label + '</span>';

        langItem.appendChild(langBtn);

        // ─── STEP 7: Find the navbar ─────────────────────────────────
        const navbar = document.querySelector('nav.navbar, .navbar');
        if (!navbar) {
            console.log('[LANG] Navbar not found yet — will retry');
            return;
        }

        // ─── STEP 8: Find or create <ul class="navbar-nav"> ──────────
        let navbarNav = navbar.querySelector('ul.navbar-nav');

        // Fallback: find any ul inside .navbar-collapse
        if (!navbarNav) {
            const collapse = navbar.querySelector('.navbar-collapse');
            if (collapse) {
                navbarNav = collapse.querySelector('ul');
                if (!navbarNav) {
                    navbarNav = document.createElement('ul');
                    navbarNav.className = 'navbar-nav ms-auto';
                    collapse.appendChild(navbarNav);
                }
            }
        }

        // Fallback: create a new ul inside .navbar-collapse or navbar
        if (!navbarNav) {
            const target = navbar.querySelector('.navbar-collapse, .container, .container-fluid') || navbar;
            navbarNav = document.createElement('ul');
            navbarNav.className = 'navbar-nav ms-auto';
            navbarNav.style.cssText = 'display:flex;flex-direction:row;align-items:center;list-style:none;margin:0;padding:0;margin-inline-start:auto;gap:8px;';
            target.appendChild(navbarNav);
        }

        // ─── STEP 9: Insert the button ──────────────────────────────
        navbarNav.appendChild(langItem);

        // Verify
        setTimeout(function() {
            if (document.querySelector('.navbar .lang-nav-item')) {
                console.log('[LANG] ✓✓✓ Language button injected successfully');
            } else {
                console.warn('[LANG] ✗ Injection failed — will retry');
            }
        }, 100);
    }


    // ========================================================================
    // 3. إصلاح صورة المحامي - Lawyer Profile Image Fix
    // ========================================================================
    function fixLawyerImage() {
        const correctPath = '/images/team/walid-profile.jpg';
        const imgSelectors = [
            'img[alt*="وليد"]',
            'img[alt*="Walid"]',
            '.team-card img',
            'img[src*="walid"]'
        ];

        const imgElement = document.querySelector(imgSelectors.join(','));
        if (!imgElement) return;

        imgElement.onerror = null;

        const testImg = new Image();
        testImg.src = correctPath;
        testImg.onload = function() {
            if (imgElement.src !== correctPath) {
                imgElement.src = correctPath;
            }
        };
    }


    // ========================================================================
    // 4. الرابط النشط - Active Link Highlight
    // ========================================================================
    function highlightActiveLink() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.navbar-nav .nav-link, .dropdown-item');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath) {
                link.classList.add('active');
            }
        });
    }


    // ========================================================================
    // 5. تأثير التمرير على النافبار - Navbar Scroll Effect
    // ========================================================================
    function setupNavbarScroll() {
        const navbar = document.getElementById('mainNav') || document.querySelector('.navbar');
        if (!navbar) return;

        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }


    // ========================================================================
    // 6. التمرير السلس - Smooth Scroll
    // ========================================================================
    function setupSmoothScroll() {
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
    }


    // ========================================================================
    // 7. أنيميشن البطاقات - Card Animations
    // ========================================================================
    function setupCardAnimations() {
        if (!document.querySelector('#dynamic-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'dynamic-animation-styles';
            style.textContent = `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeInUp { animation: fadeInUp 0.6s ease forwards; }
            `;
            document.head.appendChild(style);
        }

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

        document.querySelectorAll(
            '.feature-card, .team-card, .testimonial-card, .blog-card, .service-card, ' +
            '.bento-card, .svc-modern-item, .testimonial-modern-card, .cred-card, ' +
            '.svc-feature-card, .pa-card, .related-card, .post-card'
        ).forEach(el => {
            observer.observe(el);
        });
    }


    // ========================================================================
    // 8. زر العودة للأعلى - Back to Top Button
    // ========================================================================
    function setupBackToTop() {
        if (document.getElementById('backToTop')) {
            const btn = document.getElementById('backToTop');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    btn.style.display = 'flex';
                } else {
                    btn.style.display = 'none';
                }
            });
            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            return;
        }

        const btn = document.createElement('button');
        btn.id = 'backToTop';
        btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        btn.title = document.documentElement.lang === 'ar' ? 'العودة إلى الأعلى' : 'Back to Top';
        btn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #C9A961, #A88947);
            color: #000;
            border: none;
            cursor: pointer;
            display: none;
            z-index: 999;
            box-shadow: 0 10px 25px rgba(201,169,97,0.4);
            transition: all 0.3s;
            font-size: 20px;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(btn);

        window.addEventListener('scroll', () => {
            btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // ========================================================================
    // 9. إضافة اللوجو إلى الفوتر تلقائياً - Auto-add footer logo
    // ========================================================================
    function addFooterLogo() {
        const footers = document.querySelectorAll('.footer-section, .footer-rich');

        footers.forEach(footer => {
            if (footer.querySelector('img[src*="logo"]')) return;

            const isArabic = document.documentElement.lang === 'ar';
            const firstH5 = footer.querySelector('h5');
            if (!firstH5) return;

            const oldIcon = firstH5.querySelector(
                'i.fa-balance-scale, i.fas.fa-balance-scale, ' +
                'i.fa-scale-balanced, i.fas.fa-scale-balanced, ' +
                'i.fas.fa-gavel, i.fa-gavel'
            );

            if (oldIcon) {
                const logoImg = document.createElement('img');
                logoImg.src = '/images/logo arb ip.png';
                logoImg.alt = isArabic ? 'وليد أبو العلا للمحاماة' : 'Walid Abu Al-Ela Law Firm';
                logoImg.style.cssText = `
                    height: 45px;
                    width: auto;
                    max-width: 200px;
                    object-fit: contain;
                    vertical-align: middle;
                    margin-${isArabic ? 'left' : 'right'}: 10px;
                    display: inline-block;
                    filter: drop-shadow(0 2px 4px rgba(201,169,97,0.3));
                `;
                oldIcon.replaceWith(logoImg);
            } else {
                const logoImg = document.createElement('img');
                logoImg.src = '/images/logo arb ip.png';
                logoImg.alt = isArabic ? 'وليد أبو العلا للمحاماة' : 'Walid Abu Al-Ela Law Firm';
                logoImg.className = 'footer-logo';
                logoImg.style.cssText = `
                    height: 55px;
                    width: auto;
                    max-width: 220px;
                    object-fit: contain;
                    display: block;
                    margin-bottom: 15px;
                    filter: drop-shadow(0 2px 6px rgba(201,169,97,0.3));
                `;
                firstH5.parentNode.insertBefore(logoImg, firstH5);
            }
        });
    }


    // ========================================================================
    // 10. إصلاح حجم لوجو النافبار - Fix navbar logo size (fallback)
    // ========================================================================
    function fixNavbarLogoSize() {
        const logos = document.querySelectorAll('.navbar-brand img');

        logos.forEach(img => {
            img.style.removeProperty('height');
            img.style.removeProperty('width');

            if (!img.style.height && !img.style.maxWidth) {
                img.style.cssText += `
                    height: 50px;
                    width: auto;
                    max-width: 200px;
                    object-fit: contain;
                    object-position: center;
                    margin-${document.documentElement.lang === 'ar' ? 'left' : 'right'}: 12px;
                    flex-shrink: 0;
                `;
            }
        });
    }


    // ========================================================================
    // 11. تهيئة كل الأكواد - Initialize all modules
    // ========================================================================
    function init() {
        createTrialBanner();

        // ⚡ Inject language button — retry multiple times for slow pages
        injectLanguageSwitcher();
        setTimeout(injectLanguageSwitcher, 100);
        setTimeout(injectLanguageSwitcher, 300);
        setTimeout(injectLanguageSwitcher, 800);
        setTimeout(injectLanguageSwitcher, 1500);
        setTimeout(injectLanguageSwitcher, 2500);

        fixLawyerImage();
        highlightActiveLink();
        setupNavbarScroll();
        setupSmoothScroll();
        setupCardAnimations();
        setupBackToTop();
        addFooterLogo();
        fixNavbarLogoSize();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ⚡ Re-try injection when window resizes
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (!document.querySelector('.navbar .lang-nav-item')) {
                console.log('[LANG] Re-injecting after resize...');
                injectLanguageSwitcher();
            }
        }, 400);
    });

    // ⚡ Re-try injection when DOM changes
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            const navbarChanged = mutations.some(m =>
                m.target.closest && m.target.closest('.navbar')
            );
            if (navbarChanged && !document.querySelector('.navbar .lang-nav-item')) {
                injectLanguageSwitcher();
            }
        });

        setTimeout(function() {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                observer.observe(navbar, { childList: true, subtree: true });
            }
        }, 1000);
    }


    // ============================================================================
    // ============================================================================
    // MEGA MENU - Dynamic Navbar Upgrade
    // قائمة ضخمة - ترقية تلقائية للنافبار
    // ============================================================================
    // ============================================================================
    (function buildMegaMenu() {
        'use strict';

        const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
        const isAr = lang === 'ar';

        /* ---------- DATA ---------- */
        const categories = [
            {
                id: 'ip',
                label: isAr ? 'الملكية الفكرية' : 'Intellectual Property',
                icon: 'fa-trademark',
                services: [
                    { name: isAr ? 'تسجيل العلامات التجارية' : 'Trademark Registration', href: isAr ? '/ar/trademark.html' : '/trademark.html', icon: 'fa-trademark' },
                    { name: isAr ? 'براءات الاختراع' : 'Patent Protection', href: isAr ? '/ar/patent.html' : '/patent.html', icon: 'fa-microchip' },
                    { name: isAr ? 'حقوق المؤلف' : 'Copyright', href: isAr ? '/ar/copyright.html' : '/copyright.html', icon: 'fa-copyright' },
                    { name: isAr ? 'التصميمات الصناعية' : 'Industrial Designs', href: isAr ? '/ar/industrial-designs.html' : '/industrial-designs.html', icon: 'fa-palette' },
                    { name: isAr ? 'مخططات الدوائر المتكاملة' : 'Integrated Circuits', href: isAr ? '/ar/integrated-circuits.html' : '/integrated-circuits.html', icon: 'fa-memory' },
                    { name: isAr ? 'نماذج المنفعة' : 'Utility Models', href: isAr ? '/ar/utility-models.html' : '/utility-models.html', icon: 'fa-lightbulb' },
                    { name: isAr ? 'المؤشرات الجغرافية' : 'Geographical Indications', href: isAr ? '/ar/geographical-indications.html' : '/geographical-indications.html', icon: 'fa-map-marked-alt' },
                    { name: isAr ? 'الأصناف النباتية' : 'Plant Varieties', href: isAr ? '/ar/plant-varieties.html' : '/plant-varieties.html', icon: 'fa-seedling' }
                ]
            },
            {
                id: 'disputes',
                label: isAr ? 'التقاضي والتحكيم' : 'Litigation & Arbitration',
                icon: 'fa-scale-balanced',
                services: [
                    { name: isAr ? 'التحكيم الدولي' : 'International Arbitration', href: isAr ? '/ar/arbitration.html' : '/arbitration.html', icon: 'fa-gavel' },
                    { name: isAr ? 'قضايا الملكية الفكرية' : 'IP Litigation', href: isAr ? '/ar/litigation.html' : '/litigation.html', icon: 'fa-shield-halved' },
                    { name: isAr ? 'القضايا المدنية' : 'Civil Litigation', href: isAr ? '/ar/civil-litigation.html' : '/civil-litigation.html', icon: 'fa-balance-scale' },
                    { name: isAr ? 'القضايا الجنائية' : 'Criminal Litigation', href: isAr ? '/ar/criminal-litigation.html' : '/criminal-litigation.html', icon: 'fa-user-shield' },
                    { name: isAr ? 'قضايا مجلس الدولة' : 'State Council Cases', href: isAr ? '/ar/state-council-cases.html' : '/state-council-cases.html', icon: 'fa-landmark' },
                    { name: isAr ? 'القضايا الاقتصادية' : 'Economic Cases', href: isAr ? '/ar/economic-cases.html' : '/economic-cases.html', icon: 'fa-chart-line' }
                ]
            },
            {
                id: 'corporate',
                label: isAr ? 'خدمات الشركات' : 'Corporate Services',
                icon: 'fa-building',
                services: [
                    { name: isAr ? 'تأسيس الشركات' : 'Corporate Formation', href: isAr ? '/ar/corporate-formation.html' : '/corporate-formation.html', icon: 'fa-building' },
                    { name: isAr ? 'تراخيص التشغيل' : 'Operating Licenses', href: isAr ? '/ar/operating-licenses.html' : '/operating-licenses.html', icon: 'fa-id-card' },
                    { name: isAr ? 'حوكمة الشركات' : 'Corporate Governance', href: isAr ? '/ar/corporate-governance.html' : '/corporate-governance.html', icon: 'fa-sitemap' },
                    { name: isAr ? 'الاندماج والاستحواذ' : 'Mergers & Acquisitions', href: isAr ? '/ar/ma-mergers-acquisitions.html' : '/ma-mergers-acquisitions.html', icon: 'fa-handshake' }
                ]
            },
            {
                id: 'contracts',
                label: isAr ? 'العقود والاتفاقيات' : 'Contracts & Agreements',
                icon: 'fa-file-signature',
                services: [
                    { name: isAr ? 'ترخيص الملكية الفكرية' : 'IP Licensing & Tech Transfer', href: isAr ? '/ar/licensing.html' : '/licensing.html', icon: 'fa-file-signature' },
                    { name: isAr ? 'العقود التجارية' : 'Commercial Contracts', href: isAr ? '/ar/commercial-contracts.html' : '/commercial-contracts.html', icon: 'fa-file-contract' },
                    { name: isAr ? 'العقود الاستثمارية' : 'Investment Contracts', href: isAr ? '/ar/investment-contracts.html' : '/investment-contracts.html', icon: 'fa-chart-pie' },
                    { name: isAr ? 'اتفاقيات السرية' : 'NDAs & Confidentiality', href: isAr ? '/ar/ndas-confidentiality.html' : '/ndas-confidentiality.html', icon: 'fa-user-secret' },
                    { name: isAr ? 'عقود أخرى' : 'Other Contracts', href: isAr ? '/ar/other-contracts.html' : '/other-contracts.html', icon: 'fa-question-circle' }
                ]
            }
        ];

        /* ---------- INJECT CSS ---------- */
        function injectCSS() {
            if (document.getElementById('mega-menu-styles')) return;
            const style = document.createElement('style');
            style.id = 'mega-menu-styles';
            style.textContent = `
                .navbar-nav .nav-item.mega-menu-item {
                    position: static !important;
                }

                .mega-menu {
                    position: absolute !important;
                    top: 100% !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100% !important;
                    max-width: 1200px !important;
                    margin: 8px auto 0 !important;
                    padding: 0 !important;
                    background: #fff !important;
                    border: 1px solid #E9ECEF !important;
                    border-radius: 20px !important;
                    box-shadow: 0 30px 60px -20px rgba(0,0,0,0.18) !important;
                    overflow: hidden !important;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-8px);
                    transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
                    z-index: 1050;
                    display: block !important;
                    direction: ${isAr ? 'rtl' : 'ltr'};
                }

                .nav-item.mega-menu-item:hover > .mega-menu,
                .nav-item.mega-menu-item.show > .mega-menu {
                    opacity: 1 !important;
                    visibility: visible !important;
                    transform: translateY(0) !important;
                }

                .nav-item.mega-menu-item > .dropdown-menu {
                    display: none !important;
                }

                .mega-menu-inner {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0;
                    padding: 30px 24px 20px;
                }

                .mega-col {
                    padding: 0 18px;
                    border-inline-end: 1px solid #F1F3F5;
                }
                .mega-col:last-child {
                    border-inline-end: none;
                }

                .mega-col-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid rgba(201,169,97,0.25);
                }
                .mega-col-title i {
                    width: 34px;
                    height: 34px;
                    background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
                    color: var(--primary-color);
                    border-radius: 9px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 10px rgba(201,169,97,0.3);
                }
                .mega-col-title span {
                    font-family: ${isAr ? "'Cairo', sans-serif" : "'Playfair Display', serif"};
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: var(--dark-text);
                    letter-spacing: -0.01em;
                }

                .mega-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .mega-list li { margin-bottom: 2px; }
                .mega-list a {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    color: #495057;
                    font-size: 0.87rem;
                    font-weight: 500;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.22s ease;
                    line-height: 1.4;
                }
                .mega-list a i {
                    color: var(--accent-dark);
                    font-size: 0.85rem;
                    width: 18px;
                    text-align: center;
                    transition: all 0.22s ease;
                    flex-shrink: 0;
                }
                .mega-list a:hover {
                    background: rgba(201,169,97,0.1);
                    color: var(--primary-color);
                    padding-inline-start: ${isAr ? '12px' : '18px'};
                    padding-inline-end: ${isAr ? '18px' : '12px'};
                }
                .mega-list a:hover i {
                    color: var(--accent-color);
                    transform: scale(1.15);
                }
                .mega-list a.active {
                    background: rgba(201,169,97,0.15);
                    color: var(--primary-color);
                    font-weight: 700;
                }
                .mega-list a.active i { color: var(--accent-color); }

                .mega-footer {
                    background: linear-gradient(90deg, #F8F9FA 0%, #fff 50%, #F8F9FA 100%);
                    border-top: 1px solid #F1F3F5;
                    padding: 14px 30px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .mega-footer-text {
                    font-size: 0.82rem;
                    color: #6C757D;
                    font-weight: 500;
                }
                .mega-footer-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
                    color: var(--primary-color);
                    padding: 8px 18px;
                    border-radius: 999px;
                    font-weight: 700;
                    font-size: 0.82rem;
                    text-decoration: none;
                    box-shadow: 0 6px 15px rgba(201,169,97,0.3);
                    transition: all 0.25s ease;
                }
                .mega-footer-link:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 22px rgba(201,169,97,0.45);
                    color: var(--primary-color);
                }
                .mega-footer-link i { transition: transform 0.25s ease; }
                .mega-footer-link:hover i {
                    transform: translateX(${isAr ? '-4px' : '4px'});
                }

                @media (max-width: 991px) {
                    .mega-menu {
                        position: static !important;
                        max-width: 100% !important;
                        margin: 4px 0 0 !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                        transform: none !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 12px !important;
                        background: rgba(255,255,255,0.03) !important;
                        display: none;
                    }
                    .nav-item.mega-menu-item.open > .mega-menu {
                        display: block !important;
                    }
                    .mega-menu-inner {
                        grid-template-columns: 1fr;
                        padding: 12px 6px;
                        gap: 8px;
                    }
                    .mega-col {
                        padding: 10px 12px;
                        border-inline-end: none;
                        border-bottom: 1px solid rgba(255,255,255,0.08);
                    }
                    .mega-col:last-child { border-bottom: none; }
                    .mega-col-title {
                        border-bottom-color: rgba(201,169,97,0.35);
                    }
                    .mega-col-title span { color: #fff; }
                    .mega-list a { color: rgba(255,255,255,0.85); }
                    .mega-list a:hover {
                        background: rgba(201,169,97,0.2);
                        color: #fff;
                    }
                    .mega-footer {
                        background: rgba(0,0,0,0.2);
                        border-top-color: rgba(255,255,255,0.1);
                        padding: 12px 16px;
                    }
                    .mega-footer-text { color: rgba(255,255,255,0.6); }
                }
            `;
            document.head.appendChild(style);
        }

        /* ---------- BUILD MEGA MENU ---------- */
        function buildMegaMenu() {
            const navItems = document.querySelectorAll('.navbar-nav .nav-item.dropdown');
            let servicesItem = null;

            navItems.forEach(item => {
                const toggle = item.querySelector('.dropdown-toggle');
                if (!toggle) return;
                const text = toggle.textContent.trim();
                if (/Services|الخدمات/.test(text)) {
                    servicesItem = item;
                }
            });

            if (!servicesItem) return;

            const oldMenu = servicesItem.querySelector('.dropdown-menu');
            if (oldMenu) oldMenu.remove();

            servicesItem.classList.add('mega-menu-item');

            let columnsHTML = '';
            categories.forEach(cat => {
                let listHTML = '';
                cat.services.forEach(svc => {
                    listHTML += `
                        <li>
                            <a href="${svc.href}">
                                <i class="fas ${svc.icon}"></i>
                                <span>${svc.name}</span>
                            </a>
                        </li>
                    `;
                });

                columnsHTML += `
                    <div class="mega-col">
                        <div class="mega-col-title">
                            <i class="fas ${cat.icon}"></i>
                            <span>${cat.label}</span>
                        </div>
                        <ul class="mega-list">
                            ${listHTML}
                        </ul>
                    </div>
                `;
            });

            const megaMenu = document.createElement('div');
            megaMenu.className = 'mega-menu';
            megaMenu.innerHTML = `
                <div class="mega-menu-inner">
                    ${columnsHTML}
                </div>
                <div class="mega-footer">
                    <span class="mega-footer-text">
                        <i class="fas fa-star" style="color: var(--accent-color); margin-inline-end: 6px;"></i>
                        ${isAr ? '23 مجال ممارسة · أكثر من 10 سنوات خبرة' : '23 Practice Areas · 10+ Years Experience'}
                    </span>
                    <a href="${isAr ? '/ar/services.html' : '/services.html'}" class="mega-footer-link">
                        <span>${isAr ? 'جميع الخدمات' : 'View All Services'}</span>
                        <i class="fas fa-arrow-${isAr ? 'left' : 'right'}"></i>
                    </a>
                </div>
            `;

            const toggle = servicesItem.querySelector('.dropdown-toggle');
            if (toggle) {
                toggle.removeAttribute('data-bs-toggle');
                toggle.setAttribute('aria-haspopup', 'true');
                toggle.setAttribute('aria-expanded', 'false');
            }

            servicesItem.appendChild(megaMenu);

            const currentPath = window.location.pathname.replace(/\/$/, '');
            const allLinks = megaMenu.querySelectorAll('.mega-list a');
            allLinks.forEach(link => {
                const linkPath = (link.getAttribute('href') || '').replace(/\/$/, '');
                if (linkPath && (currentPath === linkPath || currentPath.endsWith(linkPath.split('/').pop()))) {
                    link.classList.add('active');
                }
            });

            document.addEventListener('click', function(e) {
                if (window.innerWidth <= 991 && !servicesItem.contains(e.target)) {
                    servicesItem.classList.remove('open');
                    if (toggle) toggle.setAttribute('aria-expanded', 'false');
                }
            });

            window.addEventListener('resize', function() {
                if (window.innerWidth > 991) {
                    servicesItem.classList.remove('open');
                }
            });
        }

        /* ---------- INIT ---------- */
        function init() {
            injectCSS();
            buildMegaMenu();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    })();

})();
/* ============================================================================
   🚀 FINAL BULLETPROOF MOBILE MENU TOGGLE
   ============================================================================ */
document.addEventListener("DOMContentLoaded", function() {
    // نمسك بكل أزرار القوائم المنسدلة
    const dropdownToggles = document.querySelectorAll('.navbar-nav .dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        // بننسخ الزرار ونستبدله عشان نمسح أي أحداث قديمة مرتبطة بيه (زي البوتستراب)
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        // نضيف الحدث الجديد بتاعنا
        newToggle.addEventListener('click', function(e) {
            // نطبق ده على الموبايل بس
            if (window.innerWidth <= 991.98) {
                e.preventDefault(); // نمنع أي سلوك افتراضي
                e.stopPropagation(); // نمنع البوتستراب من التدخل
                
                const parentItem = this.closest('.nav-item');
                const menu = parentItem.querySelector('.dropdown-menu, .mega-menu');
                
                // نقفل أي قوائم تانية مفتوحة
                document.querySelectorAll('.navbar-nav .nav-item').forEach(item => {
                    if (item !== parentItem) {
                        item.classList.remove('open', 'show');
                        const m = item.querySelector('.dropdown-menu, .mega-menu');
                        if (m) m.classList.remove('show');
                    }
                });
                
                // نفتح أو نقفل القائمة الحالية
                if (parentItem.classList.contains('open')) {
                    parentItem.classList.remove('open', 'show');
                    if (menu) menu.classList.remove('show');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    parentItem.classList.add('open', 'show');
                    if (menu) menu.classList.add('show');
                    this.setAttribute('aria-expanded', 'true');
                }
            }
        });
    });
});