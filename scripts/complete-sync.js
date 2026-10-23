require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Service = require('../models/Service');
const Page = require('../models/Page');

const PENDING = [
  { file: 'criminal-litigation', category: 'disputes', icon: 'fa-user-shield' },
  { file: 'state-council-cases', category: 'disputes', icon: 'fa-landmark' },
  { file: 'economic-cases', category: 'disputes', icon: 'fa-chart-line' },
  { file: 'family-law', category: 'disputes', icon: 'fa-home' },
  { file: 'integrated-circuits', category: 'ip', icon: 'fa-memory' },
  { file: 'utility-models', category: 'ip', icon: 'fa-lightbulb' },
  { file: 'geographical-indications', category: 'ip', icon: 'fa-map-marked-alt' },
  { file: 'plant-varieties', category: 'ip', icon: 'fa-seedling' },
  { file: 'investment-contracts', category: 'contracts', icon: 'fa-chart-pie' },
  { file: 'other-contracts', category: 'contracts', icon: 'fa-question-circle' },
  { file: 'operating-licenses', category: 'corporate', icon: 'fa-id-card', title: 'Operating Licenses' },
  { file: 'ma-mergers-acquisitions', category: 'corporate', icon: 'fa-handshake', title: 'Mergers & Acquisitions' }
];

function extractTitle($) {
  return ($('h1').first().text().trim() ||
          $('meta[property="og:title"]').attr('content') ||
          $('title').text().split('|')[0].trim() || '');
}

function extractContent($) {
  const sels = ['.article-content','.dynamic-content','.service-content','.svc-body','.content-body','.page-content','article','.article-wrap','main .container','main','.container section','section.content'];
  for (const s of sels) {
    const h = $(s).first().html();
    if (h && h.trim().length > 200) return h.trim();
  }
  const $b = $('body').clone();
  $b.find('nav,header,footer,script,style,.navbar,.footer-rich,#trial-banner,.language-switcher').remove();
  return ($b.html() || '').trim();
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  let added = 0, existing = 0, failed = 0;
  for (const item of PENDING) {
    if (await Service.findOne({ slug: item.file })) { console.log(`  ⏭️  ${item.file} exists`); existing++; continue; }
    const fp = path.join('public', item.file + '.html');
    let title = item.title || '', content = '';
    if (fs.existsSync(fp)) {
      try {
        const $ = cheerio.load(fs.readFileSync(fp, 'utf8'));
        title = extractTitle($) || title;
        content = extractContent($);
      } catch (e) { console.log(`  ❌ ${item.file}: ${e.message}`); failed++; continue; }
    }
    if (!title) title = item.file.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (!content) content = `## ${title}\n\nContent coming soon.`;
    try {
      await Service.create({ titleEn: title, titleAr: title, slug: item.file,
        shortDescEn: '', shortDescAr: '', contentEn: content, contentAr: content,
        icon: item.icon, category: item.category, published: true,
        showInMegaMenu: true, showInHomepage: true });
      console.log(`  ✅ ${item.file} (${content.length}c)`);
      added++;
    } catch (e) { console.log(`  ❌ ${item.file}: ${e.message}`); failed++; }
  }
  console.log(`\n📦 Services: ${added} added, ${existing} skipped, ${failed} failed`);

  console.log('\n🧹 Deleting duplicate Pages...');
  const slugs = (await Service.find({}, 'slug').lean()).map(s => s.slug);
  const dupes = await Page.find({ $or: [
    { slug: { $in: slugs } },
    { slug: { $in: slugs.map(s => s + '-ar') } }
  ]}, '_id slug language').lean();
  if (dupes.length) {
    await Page.deleteMany({ _id: { $in: dupes.map(d => d._id) } });
    console.log(`  🗑️  Deleted ${dupes.length} duplicate Pages`);
  } else console.log('  ✅ No duplicates');

  console.log('\n════════════════════════════════════════');
  console.log('📊 FINAL COUNTS:');
  console.log('   Services:', await Service.countDocuments());
  console.log('   Pages:   ', await Page.countDocuments());
  console.log('   Posts:   ', await require('../models/BlogPost').countDocuments());
  console.log('════════════════════════════════════════');
  process.exit(0);
})();
