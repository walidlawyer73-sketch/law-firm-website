// @ts-nocheck
document.addEventListener('DOMContentLoaded', function () {
    createTrialBanner();
    setupNavbarScroll();
    setupSmoothScroll();
    setupScrollAnimations();
    setupBackToTopButton();
});

function createTrialBanner() {
    if (document.getElementById('trial-banner')) return;

    const isArabic = document.documentElement.lang === 'ar';
    const bannerText = isArabic
        ? 'هذا إصدار تجريبي للموقع - جاري التطوير والتحديث'
        : 'This is a trial version - site under development and updates';

    const banner = document.createElement('div');
    banner.id = 'trial-banner';
    banner.innerHTML = `
        <i class="fas fa-tools"></i>
        <span class="banner-text">${bannerText}</span>
        <i class="fas fa-tools"></i>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    const setBannerHeight = () => {
        const height = banner.offsetHeight || 50;
        document.documentElement.style.setProperty('--trial-banner-height', `${height}px`);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setBannerHeight);
    } else {
        setBannerHeight();
    }

    window.addEventListener('load', setBannerHeight);
    window.addEventListener('resize', setBannerHeight);
}

function setupNavbarScroll() {
    const navbar = document.getElementById('mainNav');
    if (!navbar) return;

    const onScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', onScroll);
    onScroll();
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId) return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function setupScrollAnimations() {
    const cards = document.querySelectorAll('.feature-card, .team-card, .testimonial-card, .blog-card');
    if (!cards.length || !('IntersectionObserver' in window)) return;

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

    cards.forEach(card => observer.observe(card));

    if (!document.getElementById('dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .fadeInUp {
                animation: fadeInUp 0.6s ease forwards;
            }
        `;
        document.head.appendChild(style);
    }
}

function setupBackToTopButton() {
    if (document.getElementById('backToTop')) return;

    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.id = 'backToTop';
    backToTopButton.title = 'العودة إلى الأعلى';
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
        font-size: 20px;
        align-items: center;
        justify-content: center;
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

    const toggleButton = () => {
        backToTopButton.style.display = window.scrollY > 300 ? 'flex' : 'none';
    };

    window.addEventListener('scroll', toggleButton);
    toggleButton();

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}