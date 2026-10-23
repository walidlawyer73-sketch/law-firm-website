(function () {
  'use strict';
  const isAr = (document.documentElement.lang || '').toLowerCase().startsWith('ar');
  const base = isAr ? '/ar' : '';

  function pick(o, en, ar) {
    if (!o) return '';
    return isAr ? (o[ar] || o[en] || '') : (o[en] || o[ar] || '');
  }

  // ─── استبدال كل نصوص "Founder" القديمة في الصفحة (شامل) ───;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var txt = node.nodeValue;
      var changed = false;
      for (var k in replacements) {
        if (txt.indexOf(k) !== -1) {
          txt = txt.split(k).join(replacements[k]);
          changed = true;
        }
      }
      if (changed) node.nodeValue = txt;
    }
  }

  // ─── تطبيق الإعدادات ───
  async function applySettings() {
    try {
      const r = await fetch('/api/settings', { cache: 'no-store' });
      const d = await r.json();
      if (!d.success) return;
      const s = d.settings;
      const siteName = pick(s, 'siteNameEn', 'siteNameAr');
      const tagline = pick(s, 'taglineEn', 'taglineAr');
      if (siteName) {
        document.querySelectorAll('.firm-name, [data-settings="siteName"]').forEach(e => e.textContent = siteName);
      }
      if (tagline) {
        document.querySelectorAll('.firm-sub, [data-settings="tagline"]').forEach(e => e.textContent = tagline);
      }
      if (s.logo) document.querySelectorAll('.navbar-brand img, .footer-logo').forEach(i => i.src = s.logo);
      document.querySelectorAll('.footer-contact li').forEach(li => {
        const ic = li.querySelector('i'); if (!ic) return;
        const c = ic.className;
        if (c.indexOf('fa-map-marker') !== -1) { const v = pick(s, 'addressEn', 'addressAr'); if (v) li.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + v; }
        else if (c.indexOf('fa-envelope') !== -1 && s.contactEmail) li.innerHTML = '<i class="fas fa-envelope"></i> <a href="mailto:' + s.contactEmail + '" style="color:inherit;text-decoration:none;">' + s.contactEmail + '</a>';
        else if (c.indexOf('fa-clock') !== -1) { const v = pick(s, 'workingHoursEn', 'workingHoursAr'); if (v) li.innerHTML = '<i class="fas fa-clock"></i> ' + v; }
      });
    } catch (e) { }
  }

  // ─── عرض الفريق (يستبدل الحاوية بالكامل) ───
  async function renderTeam() {
    const grid = document.getElementById('dynamic-team-grid');
    if (!grid) return;
    try {
      const r = await fetch('/api/team', { cache: 'no-store' });
      const d = await r.json();
      if (!d.success) return;
      const team = d.team || [];
      if (!team.length) { grid.innerHTML = ''; return; }
      let html = '';
      team.forEach(m => {
        const name = pick(m, 'nameEn', 'nameAr');
        const role = pick(m, 'roleEn', 'roleAr');
        const bio = pick(m, 'bioEn', 'bioAr');
        const specs = isAr ? (m.specialtiesAr || []) : (m.specialtiesEn || []);
        const photo = m.image || '/images/logo arb ip.png';
        let soc = '';
        if (m.social) {
          if (m.social.linkedin) soc += '<a href="' + m.social.linkedin + '" target="_blank" rel="noopener" style="width:34px;height:34px;border-radius:50%;background:#f1f3f5;display:inline-flex;align-items:center;justify-content:center;color:#000;text-decoration:none;"><i class="fab fa-linkedin"></i></a>';
          if (m.social.twitter) soc += '<a href="' + m.social.twitter + '" target="_blank" rel="noopener" style="width:34px;height:34px;border-radius:50%;background:#f1f3f5;display:inline-flex;align-items:center;justify-content:center;color:#000;text-decoration:none;"><i class="fab fa-twitter"></i></a>';
          if (m.social.facebook) soc += '<a href="' + m.social.facebook + '" target="_blank" rel="noopener" style="width:34px;height:34px;border-radius:50%;background:#f1f3f5;display:inline-flex;align-items:center;justify-content:center;color:#000;text-decoration:none;"><i class="fab fa-facebook"></i></a>';
          if (m.social.whatsapp) soc += '<a href="' + m.social.whatsapp + '" target="_blank" rel="noopener" style="width:34px;height:34px;border-radius:50%;background:#f1f3f5;display:inline-flex;align-items:center;justify-content:center;color:#000;text-decoration:none;"><i class="fab fa-whatsapp"></i></a>';
        }
        const specsHtml = specs.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;">' + specs.map(s => '<span style="font-size:0.72rem;padding:4px 10px;background:rgba(201,169,97,0.12);color:#A88947;border-radius:999px;font-weight:600;">' + s + '</span>').join('') + '</div>' : '';
        html += '<div class="col-lg-6 col-md-12" style="margin-bottom:30px;">' +
          '<div style="background:#fff;border:1px solid #E9ECEF;border-radius:16px;padding:24px;display:flex;gap:20px;height:100%;">' +
          '<div style="flex-shrink:0;width:120px;height:120px;border-radius:50%;overflow:hidden;border:3px solid #C9A961;"><img src="' + photo + '" alt="' + name + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.src=\'/images/logo arb ip.png\'"></div>' +
          '<div style="flex:1;min-width:0;">' +
          (role ? '<span style="display:inline-block;font-size:0.72rem;color:#A88947;font-weight:700;text-transform:uppercase;margin-bottom:6px;">' + role + '</span>' : '') +
          '<h3 style="font-family:\'Playfair Display\',serif;font-size:1.2rem;font-weight:800;color:#212529;margin:0 0 8px;">' + name + '</h3>' +
          specsHtml +
          (bio ? '<p style="font-size:0.86rem;color:#6C757D;line-height:1.7;margin:8px 0 0;">' + bio.substring(0, 240) + (bio.length > 240 ? '...' : '') + '</p>' : '') +
          (soc ? '<div style="display:flex;gap:8px;margin-top:12px;">' + soc + '</div>' : '') +
          '</div></div></div>';
      });
      grid.innerHTML = '<div class="row g-4">' + html + '</div>';
    } catch (e) { }
  }

  // ─── عرض الأسئلة ───
  async function renderFAQs() {
    const grid = document.getElementById('dynamic-faq-grid');
    if (!grid) return;
    try {
      const r = await fetch('/api/faqs', { cache: 'no-store' });
      const d = await r.json();
      if (!d.success) return;
      const faqs = d.faqs || [];
      if (!faqs.length) { grid.innerHTML = ''; return; }
      const g = {};
      faqs.forEach(f => { if (!g[f.category]) g[f.category] = []; g[f.category].push(f); });
      const labels = {
        general: isAr ? 'أسئلة عامة' : 'General',
        ip: isAr ? 'الملكية الفكرية' : 'Intellectual Property',
        arbitration: isAr ? 'التحكيم' : 'Arbitration',
        corporate: isAr ? 'الشركات' : 'Corporate',
        contracts: isAr ? 'العقود' : 'Contracts'
      };
      let html = ''; let idx = 0;
      Object.keys(g).forEach(cat => {
        html += '<h3 style="font-family:\'Playfair Display\',serif;font-size:1.4rem;font-weight:800;color:#212529;margin-top:30px;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #C9A961;">' + (labels[cat] || cat) + '</h3>';
        html += '<div class="accordion"><div>';
        g[cat].forEach(f => {
          const q = pick(f, 'questionEn', 'questionAr');
          const a = pick(f, 'answerEn', 'answerAr');
          const id = 'faq_' + (idx++);
          html += '<div style="border:1px solid #E9ECEF;border-radius:10px;margin-bottom:8px;overflow:hidden;"><div style="padding:14px 18px;background:#fff;font-weight:700;cursor:pointer;" onclick="var el=document.getElementById(\'' + id + '\');el.style.display=el.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'i\').className=el.style.display===\'none\'?\'fas fa-chevron-down\':\'fas fa-chevron-up\';"><div style="display:flex;justify-content:space-between;align-items:center;"><span>' + q + '</span><i class="fas fa-chevron-down" style="font-size:0.8rem;color:#A88947;"></i></div></div><div id="' + id + '" style="display:none;padding:0 18px 14px;color:#495057;line-height:1.8;font-size:0.92rem;">' + a + '</div></div>';
        });
        html += '</div></div>';
      });
      grid.innerHTML = html;
    } catch (e) { }
  }

  // ─── تشغيل كل شيء ───
  function init() {
    
    
    
    applySettings();
    renderTeam();
    renderFAQs();
    
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
