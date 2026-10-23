const fs = require('fs');
const cheerio = require('cheerio');
require('dotenv').config();
const mongoose = require('mongoose');
const Page = require('../models/Page');

const PAGES = [
  { slug: 'privacy-policy', file: 'privacy-policy.html', lang: 'en', title: 'Privacy Policy' },
  { slug: 'terms-of-service', file: 'terms-of-service.html', lang: 'en', title: 'Terms of Service' },
  { slug: 'cookie-policy', file: 'cookie-policy.html', lang: 'en', title: 'Cookie Policy' },
  { slug: 'client-portal', file: 'client-portal.html', lang: 'en', title: 'Client Portal' },
  { slug: 'consultation', file: 'consultation.html', lang: 'en', title: 'Consultation' },
  { slug: 'about', file: 'about.html', lang: 'en', title: 'About' },
  { slug: 'services', file: 'services.html', lang: 'en', title: 'Services' },
  { slug: 'contact', file: 'contact.html', lang: 'en', title: 'Contact' },
  { slug: 'lawyers', file: 'lawyers.html', lang: 'en', title: 'Our Team' },
  { slug: 'blog', file: 'blog.html', lang: 'en', title: 'Blog' },
  { slug: 'about-ar', file: 'ar/about.html', lang: 'ar', title: 'من نحن' },
  { slug: 'services-ar', file: 'ar/services.html', lang: 'ar', title: 'الخدمات' },
  { slug: 'contact-ar', file: 'ar/contact.html', lang: 'ar', title: 'اتصل بنا' },
  { slug: 'lawyers-ar', file: 'ar/lawyers.html', lang: 'ar', title: 'فريق العمل' },
  { slug: 'blog-ar', file: 'ar/blog.html', lang: 'ar', title: 'المدونة' },
  { slug: 'consultation-ar', file: 'ar/consultation.html', lang: 'ar', title: 'الاستشارات' }
];

function extractContent($, title) {
  // جرّب كل selectors معروفة
  for (const s of ['.article-content', '.dynamic-content', '.legal-wrap', '.container main', 'article', 'main', '.page-header + section', 'section.py-5']) {
    const h = $(s).first().html();
    if (h && h.trim().length > 100) return h.trim();
  }
  // fallback: body بدون nav/footer/scripts
  const $b = $('body').clone();
  $b.find('nav, header, footer, script, style, .navbar, .footer-rich, .footer-section, #trial-banner, .language-switcher, .breadcrumb-bar').remove();
  const bodyHtml = $b.html() || '';
  if (bodyHtml.trim().length > 100) return bodyHtml.trim();
  // آخر حل: placeholder
  return '<p>' + title + '</p><p>هذه الصفحة قيد الإعداد.</p>';
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  let added = 0, skipped = 0, missing = 0;
  for (const p of PAGES) {
    const filePath = 'public/' + p.file;
    if (!fs.existsSync(filePath)) { console.log('  ⏭️  ' + p.file + ' — file missing'); missing++; continue; }
    if (await Page.findOne({ slug: p.slug, language: p.lang })) { skipped++; continue; }
    try {
      const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'));
      const title = $('h1').first().text().trim() || p.title;
      const content = extractContent($, title);
      await Page.create({ title, slug: p.slug, content, language: p.lang, published: true });
      console.log('  ✅ ' + p.slug + ' (' + content.length + 'c)');
      added++;
    } catch (err) {
      console.log('  ❌ ' + p.slug + ': ' + err.message);
    }
  }
  console.log('\n📄 Pages: ' + added + ' added, ' + skipped + ' skipped, ' + missing + ' missing');
  console.log('\n════════════════════════════════════════');
  console.log('📊 FINAL COUNTS:');
  console.log('   Services: ' + await require('../models/Service').countDocuments());
  console.log('   Pages:    ' + await Page.countDocuments());
  console.log('   Posts:    ' + await require('../models/BlogPost').countDocuments());
  console.log('════════════════════════════════════════');
  process.exit(0);
})();
