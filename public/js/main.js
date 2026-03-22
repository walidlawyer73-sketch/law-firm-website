// Main JavaScript File
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

    // Smooth scroll for anchor links (تجنب استخدام '#')
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
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

    // Scroll animations
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

// إضافة فقرة style ديناميكية بشكل آمن (مرة واحدة فقط)
if (!document.querySelector('#dynamic-styles')) {
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

// زر العودة إلى الأعلى
(function addBackToTopButton() {
    // التأكد من عدم وجود الزر مسبقاً
    if (document.getElementById('backToTop')) return;

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
        font-size: 20px;
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
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'flex';
            backToTopButton.style.alignItems = 'center';
            backToTopButton.style.justifyContent = 'center';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();