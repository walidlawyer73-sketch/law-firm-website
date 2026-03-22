document.addEventListener('DOMContentLoaded', function() {
    // زر العودة للأعلى
    var btn = document.createElement('button');
    btn.innerHTML = '↑';
    btn.id = 'backToTop';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:40px;height:40px;background:#FFD700;color:#000;border:none;border-radius:50%;cursor:pointer;display:none;z-index:999';
    document.body.appendChild(btn);
    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    };
    btn.onclick = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
});