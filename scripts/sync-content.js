// scripts/sync-content.js
// يستورد الخدمات والمقالات من HTML إلى DB
// آمن: لا يحذف، لا يستبدل، فقط يضيف الناقص
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
require('dotenv').config();
const mongoose = require('mongoose');

const Service = require('../models/Service');
const BlogPost = require('../models/BlogPost');

const SERVICE_FILES = [
  'trademark.html', 'patent.html', 'copyright.html', 'arbitration.html',
  'litigation.html', 'licensing.html', 'corporate-formation.html',
  'criminal-litigation.html', 'civil-litigation.html', 'state-council-cases.html',
  'economic-cases.html', 'industrial-designs.html', 'integrated-circuits.html',
  'utility-models.html', 'geographical-indications.html', 'plant-varieties.html',
  'family-law.html', 'commercial-contracts.html', 'investment-contracts.html',
  'ndas-confidentiality.html', 'other-contracts.html', 'operating-licenses.html',
  'corporate-governance.html', 'ma-mergers-acquisitions.html'
];

const SERVICE_CATEGORIES = {
  'trademark': 'ip', 'patent': 'ip', 'copyright': 'ip',
  'industrial-designs': 'ip', 'integrated-circuits': 'ip', 'utility-models': 'ip',
  'geographical-indications': 'ip', 'plant-varieties': 'ip',
  'arbitration': 'disputes', 'litigation': 'disputes', 'civil-litigation': 'disputes',
  'criminal-litigation': 'disputes', 'state-council-cases': 'disputes',
  'economic-cases': 'disputes', 'family-law': 'disputes',
  'corporate-formation': 'corporate', 'operating-licenses': 'corporate',
  'corporate-governance': 'corporate', 'ma-mergers-acquisitions': 'corporate',
  'licensing': 'contracts', 'commercial-contracts': 'contracts',
  'investment-contracts': 'contracts', 'ndas-confidentiality': 'contracts',
  'other-contracts': 'contracts'
};

const SERVICE_ICONS = {
  'trademark': 'fa-trademark', 'patent': 'fa-microchip', 'copyright': 'fa-copyright',
  'industrial-designs': 'fa-palette', 'integrated-circuits': 'fa-memory',
  'utility-models': 'fa-lightbulb', 'geographical-indications': 'fa-map-marked-alt',
  'plant-varieties': 'fa-seedling', 'arbitration': 'fa-gavel',
  'litigation': 'fa-shield-halved', 'civil-litigation': 'fa-balance-scale',
  'criminal-litigation': 'fa-user-shield', 'state-council-cases': 'fa-landmark',
  'economic-cases': 'fa-chart-line', 'family-law': 'fa-home',
  'corporate-formation': 'fa-building', 'operating-licenses': 'fa-id-card',
  'corporate-governance': 'fa-sitemap', 'ma-mergers-acquisitions': 'fa-handshake',
  'licensing': 'fa-file-signature', 'commercial-contracts': 'fa-file-contract',
  'investment-contracts': 'fa-chart-pie', 'ndas-confidentiality': 'fa-user-secret',
  'other-contracts': 'fa-question-circle'
};

function extractContent($) {
  // جرب .article-content أولاً (للمقالات)
  let html = $('.article-content').html();
  if (html) return html.trim();
  // ثم .dynamic-content
  html = $('.dynamic-content').html();
  if (html) return html.trim();
  // ثم أي <article>
  html = $('article').html();
  if (html) return html.trim();
  // ثم main content
  html = $('main .container').html() || $('main').html();
  if (html) return html.trim();
  return '';
}

function extractTitle($) {
  return ($('h1').first().text() || $('title').text().split('|')[0]).trim();
}

function extractExcerpt($) {
  return ($('meta[name="description"]').attr('content') || '').trim();
}

function extractDate($) {
  const meta = $('meta[property="article:published_time"]').attr('content');
  if (meta) return new Date(meta);
  const text = $('.article-hero-meta').text();
  const yearMatch = text.match(/\b(20\d{2})\b/);
  if (yearMatch) return new Date(yearMatch[1] + '-01-01');
  return new Date();
}

function extractCategory($) {
  const meta = $('meta[property="article:section"]').attr('content');
  if (meta) return meta;
  return 'General';
}

async function syncServices() {
  console.log('\n📦 Syncing Services...');
  let added = 0, skipped = 0, failed = 0;

  for (const file of SERVICE_FILES) {
    const filePath = path.join(__dirname, '..', 'public', file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⏭️  ${file} — file not found`);
      continue;
    }
    const slug = file.replace('.html', '');
    const exists = await Service.findOne({ slug });
    if (exists) { skipped++; continue; }

    try {
      const html = fs.readFileSync(filePath, 'utf8');
      const $ = cheerio.load(html);
      const titleEn = extractTitle($);
      const content = extractContent($);
      const excerpt = extractExcerpt($);

      if (!titleEn || !content) {
        console.log(`  ⚠️  ${file} — missing title/content`);
        failed++;
        continue;
      }

      await Service.create({
        titleEn: titleEn,
        titleAr: titleEn, // سيُترجم يدوياً لاحقاً
        slug: slug,
        shortDescEn: excerpt,
        shortDescAr: excerpt,
        contentEn: content,
        contentAr: content,
        icon: SERVICE_ICONS[slug] || 'fa-scale-balanced',
        category: SERVICE_CATEGORIES[slug] || 'ip',
        published: true,
        showInMegaMenu: true,
        showInHomepage: true,
        order: 0
      });
      added++;
      console.log(`  ✅ ${slug} — "${titleEn.substring(0, 40)}"`);
    } catch (err) {
      console.log(`  ❌ ${slug} — ${err.message}`);
      failed++;
    }
  }
  console.log(`\n📦 Services: ${added} added, ${skipped} skipped, ${failed} failed`);
  return { added, skipped, failed };
}

async function syncBlogPosts() {
  console.log('\n📝 Syncing Blog Posts...');
  let added = 0, skipped = 0, failed = 0;

  const sources = [
    { dir: 'public/blog', lang: 'en', suffix: '' },
    { dir: 'public/ar/blog', lang: 'ar', suffix: '-ar' }
  ];

  for (const source of sources) {
    const dirPath = path.join(__dirname, '..', source.dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`  ⏭️  ${source.dir} — folder not found`);
      continue;
    }
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));
    console.log(`\n  📁 ${source.dir} (${files.length} files)`);

    for (const file of files) {
      const baseSlug = file.replace('.html', '');
      const finalSlug = baseSlug + source.suffix;

      const exists = await BlogPost.findOne({ slug: finalSlug, language: source.lang });
      if (exists) { skipped++; continue; }

      try {
        const html = fs.readFileSync(path.join(dirPath, file), 'utf8');
        const $ = cheerio.load(html);
        const title = extractTitle($);
        const content = extractContent($);
        const excerpt = extractExcerpt($);
        const date = extractDate($);
        const category = extractCategory($);

        if (!title || !content) {
          console.log(`    ⚠️  ${file} — missing title/content`);
          failed++;
          continue;
        }

        await BlogPost.create({
          title: title,
          slug: finalSlug,
          excerpt: excerpt,
          content: content,
          language: source.lang,
          category: category,
          published: true,
          publishDate: date,
          author: 'Walid Abo Al-Ela'
        });
        added++;
        console.log(`    ✅ ${finalSlug}`);
      } catch (err) {
        console.log(`    ❌ ${file} — ${err.message}`);
        failed++;
      }
    }
  }
  console.log(`\n📝 Blog Posts: ${added} added, ${skipped} skipped, ${failed} failed`);
  return { added, skipped, failed };
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const svcResult = await syncServices();
    const blogResult = await syncBlogPosts();

    console.log('\n════════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   Services: ${svcResult.added} added`);
    console.log(`   Blog Posts: ${blogResult.added} added`);
    console.log('════════════════════════════════════════');

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

main();
