const fs = require('fs');
const cheerio = require('cheerio');
require('dotenv').config();
const mongoose = require('mongoose');
const Page = require('../models/Page');

const PAGES = [
  { slug: 'about', file: 'about.html', lang: 'en', title: 'About' },
  { slug: 'services', file: 'services.html', lang: 'en', title: 'Services' },
  { slug: 'contact', file: 'contact.html', lang: 'en', title: 'Contact' },
  { slug: 'blog', file: 'blog.html', lang: 'en', title: 'Blog' },
  { slug: 'lawyers', file: 'lawyers.html', lang: 'en', title: 'Our Team' },
  { slug: 'consultation', file: 'consultation.html', lang: 'en', title: 'Consultation' },
  { slug: 'privacy-policy', file: 'privacy-policy.html', lang: 'en', title: 'Privacy Policy' },
  { slug: 'terms-of-service', file: 'terms-of-service.html', lang: 'en', title: 'Terms of Service' },
  { slug: 'cookie-policy', file: 'cookie-policy.html', lang: 'en', title: 'Cookie Policy' },
  { slug: 'client-portal', file: 'client-portal.html', lang: 'en', title: 'Client Portal' },
  { slug: 'about-ar', file: 'ar/about.html', lang: 'ar', title: 'من نحن' },
  { slug: 'services-ar', file: 'ar/services.html', lang: 'ar', title: 'الخدمات' },
  { slug: 'contact-ar', file: 'ar/contact.html', lang: 'ar', title: 'اتصل بنا' },
  { slug: 'lawyers-ar', file: 'ar/lawyers.html', lang: 'ar', title: 'فريق العمل' },
  { slug: 'blog-ar', file: 'ar/blog.html', lang: 'ar', title: 'المدونة' },
  { slug: 'consultation-ar', file: 'ar/consultation.html', lang: 'ar', title: 'الاستشارات' }
];

function extractContent($, title) {
  for (const s of ['.article-content', '.dynamic-content', '.legal-wrap', 'main .container', 'article', 'main', 'section.py-5']) {
    const h = $(s).first().html();
    if (h && h.trim().length > 100) return h.trim();
  }
  const $b = $('body').clone();
  $b.find('nav, header, footer, script, style, .navbar, .footer-rich, .footer-section, #trial-banner, .language-switcher, .breadcrumb-bar').remove();
  const bodyHtml = $b.html() || '';
  if (bodyHtml.trim().length > 100) return bodyHtml.trim();
  return '<p>' + title + '</p>';
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  let added = 0, skipped = 0;
  for (const p of PAGES) {
    const fp = 'public/' + p.file;
    if (!fs.existsSync(fp)) { console.log('  ⏭️  ' + p.file); continue; }
    if (await Page.findOne({ slug: p.slug, language: p.lang })) { skipped++; continue; }
    try {
      const $ = cheerio.load(fs.readFileSync(fp, 'utf8'));
      const title = $('h1').first().text().trim() || p.title;
      const content = extractContent($, title);
      await Page.create({ title, slug: p.slug, content, language: p.lang, published: true });
      console.log('  ✅ ' + p.slug + ' (' + content.length + 'c)');
      added++;
    } catch (e) { console.log('  ❌ ' + p.slug + ': ' + e.message); }
  }
  console.log('\n📄 ' + added + ' added, ' + skipped + ' skipped');
  console.log('📊 FINAL: Services=' + await require('../models/Service').countDocuments() + ' | Pages=' + await Page.countDocuments() + ' | Posts=' + await require('../models/BlogPost').countDocuments());
  process.exit(0);
})();
