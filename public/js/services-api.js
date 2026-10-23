// services-api.js — BULLDOZER MODE
(function () {
  console.log('🚀 [bulldozer] STARTED — checking every 2s forever');
  
  var done = { mega: false, home: false, svc: false };
  var isAr = (document.documentElement.lang || '').toLowerCase().startsWith('ar');
  var base = isAr ? '/ar' : '';
  var cached = null;

  async function getServices() {
    if (cached) return cached;
    try {
      var r = await fetch('/data/services?v=' + Date.now());
      var d = await r.json();
      if (d.success) {
        cached = d.services;
        console.log('🚀 [bulldozer] Got', d.services.length, 'services');
        return cached;
      }
    } catch(e) {
      console.error('🚀 [bulldozer] fetch error:', e.message);
    }
    return null;
  }

  function buildMegaHTML(services) {
    var labels = {
      ip:        { en: 'Intellectual Property', ar: 'الملكية الفكرية', icon: 'fa-trademark' },
      disputes:  { en: 'Litigation & Arbitration', ar: 'التقاضي والتحكيم', icon: 'fa-scale-balanced' },
      corporate: { en: 'Corporate Services', ar: 'خدمات الشركات', icon: 'fa-building' },
      contracts: { en: 'Contracts & Agreements', ar: 'العقود والاتفاقيات', icon: 'fa-file-signature' }
    };
    var grouped = { ip: [], disputes: [], corporate: [], contracts: [] };
    services.forEach(function(s) { if (grouped[s.category]) grouped[s.category].push(s); });
    var html = '';
    ['ip', 'disputes', 'corporate', 'contracts'].forEach(function(key) {
      if (!grouped[key].length) return;
      var lab = labels[key][isAr ? 'ar' : 'en'];
      var list = '';
      grouped[key].forEach(function(s) {
        var name = isAr ? (s.titleAr || s.titleEn) : (s.titleEn || s.titleAr);
        list += '<li><a href="' + base + '/' + s.slug + '"><i class="fas ' + (s.icon || 'fa-circle') + '"></i><span>' + name + '</span></a></li>';
      });
      html += '<div class="mega-col"><div class="mega-col-title"><i class="fas ' + labels[key].icon + '"></i><span>' + lab + '</span></div><ul class="mega-list">' + list + '</ul></div>';
    });
    return html;
  }

  async function tryMega() {
    if (done.mega) return true;
    // حاول بأي شكل من الأشكال
    var selectors = ['.navbar .mega-menu', '.mega-menu', '.navbar-nav .mega-menu'];
    var mega = null;
    for (var i = 0; i < selectors.length; i++) {
      mega = document.querySelector(selectors[i]);
      if (mega) break;
    }
    if (!mega) return false;
    var inner = mega.querySelector('.mega-menu-inner');
    if (!inner) return false;
    var services = await getServices();
    if (!services) return false;
    inner.innerHTML = buildMegaHTML(services);
    done.mega = true;
    console.log('✅ [bulldozer] MEGA REPLACED with', services.length, 'services');
    var ft = mega.querySelector('.mega-footer-text');
    if (ft) ft.innerHTML = '<i class="fas fa-star" style="color:var(--accent-color);margin-inline-end:6px;"></i>' + (isAr ? services.length + ' خدمة' : services.length + ' Services');
    return true;
  }

  async function tryHome() {
    if (done.home) return true;
    var grid = document.querySelector('.services-grid-modern');
    if (!grid) return false;
    var services = await getServices();
    if (!services) return false;
    var html = '';
    services.slice(0, 12).forEach(function(s) {
      var name = isAr ? (s.titleAr || s.titleEn) : (s.titleEn || s.titleAr);
      var desc = isAr ? (s.shortDescAr || s.shortDescEn) : (s.shortDescEn || s.shortDescAr);
      html += '<a href="' + base + '/' + s.slug + '" class="svc-modern-item"><div class="svc-modern-icon"><i class="fas ' + (s.icon || 'fa-circle') + '"></i></div><div class="svc-modern-content"><h6>' + name + '</h6><small>' + (desc || '').substring(0, 40) + '</small></div><i class="fas fa-arrow-' + (isAr ? 'left' : 'right') + ' svc-modern-arrow"></i></a>';
    });
    grid.innerHTML = html;
    done.home = true;
    console.log('✅ [bulldozer] HOME GRID REPLACED');
    return true;
  }

  async function trySvcPage() {
    if (done.svc) return true;
    var container = document.getElementById('services-dynamic-grid');
    if (!container) return false;
    var services = await getServices();
    if (!services) return false;
    var labels = { ip: isAr ? 'الملكية الفكرية' : 'Intellectual Property', disputes: isAr ? 'التقاضي والتحكيم' : 'Litigation & Arbitration', corporate: isAr ? 'خدمات الشركات' : 'Corporate Services', contracts: isAr ? 'العقود والاتفاقيات' : 'Contracts & Agreements' };
    var grouped = { ip: [], disputes: [], corporate: [], contracts: [] };
    services.forEach(function(s) { if (grouped[s.category]) grouped[s.category].push(s); });
    var html = '';
    ['ip', 'disputes', 'corporate', 'contracts'].forEach(function(key) {
      if (!grouped[key].length) return;
      html += '<div style="margin-bottom:50px"><h2 style="font-size:1.8rem;font-weight:800;color:#212529;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #C9A961">' + labels[key] + '</h2><div class="row g-4">';
      grouped[key].forEach(function(s) {
        var name = isAr ? (s.titleAr || s.titleEn) : (s.titleEn || s.titleAr);
        var desc = isAr ? (s.shortDescAr || s.shortDescEn) : (s.shortDescEn || s.shortDescAr) || '';
        html += '<div class="col-md-6 col-lg-4"><a href="' + base + '/' + s.slug + '" style="display:block;text-decoration:none;color:inherit;padding:26px 22px;border:1px solid #E9ECEF;border-radius:16px;background:#fff;height:100%"><div style="width:60px;height:60px;background:linear-gradient(135deg,#000,#1a1a1a);color:#C9A961;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px"><i class="fas ' + (s.icon || 'fa-circle') + '"></i></div><h4 style="font-size:1.1rem;font-weight:700;color:#212529;margin-bottom:10px">' + name + '</h4><p style="font-size:0.9rem;color:#6C757D;line-height:1.6;margin:0">' + desc + '</p></a></div>';
      });
      html += '</div></div>';
    });
    container.innerHTML = html;
    done.svc = true;
    console.log('✅ [bulldozer] SERVICES PAGE REPLACED');
    return true;
  }

  setInterval(async function() {
    await tryMega();
    await tryHome();
    await trySvcPage();
  }, 2000);

  // محاولة فورية
  (async function() {
    await tryMega();
    await tryHome();
    await trySvcPage();
  })();
})();
