(function () {
  'use strict';
  const isAr = (document.documentElement.lang || '').toLowerCase().startsWith('ar');
  const base = isAr ? '/ar' : '';

  function getTitle(s) { return isAr ? (s.titleAr || s.titleEn) : (s.titleEn || s.titleAr); }
  function getDesc(s) { return isAr ? (s.shortDescAr || s.shortDescEn) : (s.shortDescEn || s.shortDescAr); }

  function updateMegaMenu(services) {
    const megaMenu = document.querySelector('.mega-menu');
    if (!megaMenu) return;
    const labels = {
      ip:        { en: 'Intellectual Property', ar: 'الملكية الفكرية', icon: 'fa-trademark' },
      disputes:  { en: 'Litigation & Arbitration', ar: 'التقاضي والتحكيم', icon: 'fa-scale-balanced' },
      corporate: { en: 'Corporate Services', ar: 'خدمات الشركات', icon: 'fa-building' },
      contracts: { en: 'Contracts & Agreements', ar: 'العقود والاتفاقيات', icon: 'fa-file-signature' }
    };
    const grouped = { ip: [], disputes: [], corporate: [], contracts: [] };
    services.forEach(s => { if (grouped[s.category]) grouped[s.category].push(s); });
    let html = '';
    ['ip', 'disputes', 'corporate', 'contracts'].forEach(key => {
      if (!grouped[key].length) return;
      const lab = labels[key][isAr ? 'ar' : 'en'];
      let list = '';
      grouped[key].forEach(s => {
        list += '<li><a href="' + base + '/' + s.slug + '"><i class="fas ' + (s.icon || 'fa-circle') + '"></i><span>' + getTitle(s) + '</span></a></li>';
      });
      html += '<div class="mega-col"><div class="mega-col-title"><i class="fas ' + labels[key].icon + '"></i><span>' + lab + '</span></div><ul class="mega-list">' + list + '</ul></div>';
    });
    const inner = megaMenu.querySelector('.mega-menu-inner');
    if (inner) inner.innerHTML = html;
    const ft = megaMenu.querySelector('.mega-footer-text');
    if (ft) ft.innerHTML = '<i class="fas fa-star" style="color: var(--accent-color); margin-inline-end: 6px;"></i>' + (isAr ? services.length + ' خدمة · خبرة 10+ سنوات' : services.length + ' Services · 10+ Years');
  }

  function updateHomepageGrid(services) {
    const grid = document.querySelector('.services-grid-modern');
    if (!grid) return;
    let html = '';
    services.slice(0, 12).forEach(s => {
      const desc = getDesc(s) || (isAr ? 'خدمة متخصصة' : 'Specialized service');
      html += '<a href="' + base + '/' + s.slug + '" class="svc-modern-item"><div class="svc-modern-icon"><i class="fas ' + (s.icon || 'fa-circle') + '"></i></div><div class="svc-modern-content"><h6>' + getTitle(s) + '</h6><small>' + desc.substring(0, 40) + '</small></div><i class="fas fa-arrow-' + (isAr ? 'left' : 'right') + ' svc-modern-arrow"></i></a>';
    });
    grid.innerHTML = html;
  }

  function buildServicesPage(services) {
    const container = document.getElementById('services-dynamic-grid');
    if (!container) return;
    const labels = {
      ip: isAr ? 'الملكية الفكرية' : 'Intellectual Property',
      disputes: isAr ? 'التقاضي والتحكيم' : 'Litigation & Arbitration',
      corporate: isAr ? 'خدمات الشركات' : 'Corporate Services',
      contracts: isAr ? 'العقود والاتفاقيات' : 'Contracts & Agreements'
    };
    const grouped = { ip: [], disputes: [], corporate: [], contracts: [] };
    services.forEach(s => { if (grouped[s.category]) grouped[s.category].push(s); });
    let html = '';
    ['ip', 'disputes', 'corporate', 'contracts'].forEach(key => {
      if (!grouped[key].length) return;
      html += '<div style="margin-bottom:50px"><h2 style="font-size:1.8rem;font-weight:800;color:#212529;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #C9A961">' + labels[key] + '</h2><div class="row g-4">';
      grouped[key].forEach(s => {
        html += '<div class="col-md-6 col-lg-4"><a href="' + base + '/' + s.slug + '" style="display:block;text-decoration:none;color:inherit;padding:26px 22px;border:1px solid #E9ECEF;border-radius:16px;background:#fff;height:100%"><div style="width:60px;height:60px;background:linear-gradient(135deg,#000,#1a1a1a);color:#C9A961;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px"><i class="fas ' + (s.icon || 'fa-circle') + '"></i></div><h4 style="font-size:1.1rem;font-weight:700;color:#212529;margin-bottom:10px">' + getTitle(s) + '</h4><p style="font-size:0.9rem;color:#6C757D;line-height:1.6;margin:0">' + (getDesc(s) || '') + '</p></a></div>';
      });
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  async function refresh() {
    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.services)) return;
      updateMegaMenu(data.services);
      updateHomepageGrid(data.services);
      buildServicesPage(data.services);
    } catch (err) {
      console.warn('[Services API] fallback:', err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(refresh, 300); });
  } else {
    setTimeout(refresh, 300);
  }
})();
Set-Content -Path "public\js\services-api.js" -Encoding UTF8