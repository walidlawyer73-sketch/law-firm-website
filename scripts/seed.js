require('dotenv').config();
const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
const Category = require('../models/Category');
const Service = require('../models/Service');
const FAQ = require('../models/FAQ');
const TeamMember = require('../models/TeamMember');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');

    const s1 = await SiteSettings.findOne();
    if (!s1) { await SiteSettings.create({}); console.log('SiteSettings: created'); }
    else console.log('SiteSettings: exists');

    const cats = [
      { nameEn: 'Intellectual Property', nameAr: 'الملكية الفكرية', slug: 'intellectual-property', icon: 'fa-trademark', order: 1 },
      { nameEn: 'Arbitration', nameAr: 'التحكيم', slug: 'arbitration', icon: 'fa-gavel', order: 2 },
      { nameEn: 'Corporate Law', nameAr: 'قانون الشركات', slug: 'corporate-law', icon: 'fa-building', order: 3 },
      { nameEn: 'Contracts', nameAr: 'العقود', slug: 'contracts', icon: 'fa-file-contract', order: 4 }
    ];
    let a = 0;
    for (const c of cats) { if (!await Category.findOne({ slug: c.slug })) { await Category.create(c); a++; } }
    console.log('Categories added: ' + a);

    const services = [
      { titleEn: 'Trademark Registration', titleAr: 'تسجيل العلامات التجارية', slug: 'trademark', category: 'ip', icon: 'fa-trademark', order: 1 },
      { titleEn: 'Patent Protection', titleAr: 'براءات الاختراع', slug: 'patent', category: 'ip', icon: 'fa-microchip', order: 2 },
      { titleEn: 'Copyright', titleAr: 'حقوق المؤلف', slug: 'copyright', category: 'ip', icon: 'fa-copyright', order: 3 },
      { titleEn: 'Industrial Designs', titleAr: 'التصميمات الصناعية', slug: 'industrial-designs', category: 'ip', icon: 'fa-palette', order: 4 },
      { titleEn: 'International Arbitration', titleAr: 'التحكيم الدولي', slug: 'arbitration', category: 'disputes', icon: 'fa-gavel', order: 1 },
      { titleEn: 'IP Litigation', titleAr: 'قضايا الملكية الفكرية', slug: 'litigation', category: 'disputes', icon: 'fa-shield-halved', order: 2 },
      { titleEn: 'Civil Litigation', titleAr: 'القضايا المدنية', slug: 'civil-litigation', category: 'disputes', icon: 'fa-balance-scale', order: 3 },
      { titleEn: 'Corporate Formation', titleAr: 'تأسيس الشركات', slug: 'corporate-formation', category: 'corporate', icon: 'fa-building', order: 1 },
      { titleEn: 'Corporate Governance', titleAr: 'حوكمة الشركات', slug: 'corporate-governance', category: 'corporate', icon: 'fa-sitemap', order: 2 },
      { titleEn: 'Licensing', titleAr: 'الترخيص', slug: 'licensing', category: 'contracts', icon: 'fa-file-signature', order: 1 },
      { titleEn: 'Commercial Contracts', titleAr: 'العقود التجارية', slug: 'commercial-contracts', category: 'contracts', icon: 'fa-file-contract', order: 2 },
      { titleEn: 'NDAs', titleAr: 'اتفاقيات السرية', slug: 'ndas-confidentiality', category: 'contracts', icon: 'fa-user-secret', order: 3 }
    ];
    a = 0;
    for (const s of services) { if (!await Service.findOne({ slug: s.slug })) { await Service.create(s); a++; } }
    console.log('Services added: ' + a);

    const faqs = [
      { questionEn: 'What areas of law?', questionAr: 'ما مجالات القانون؟', answerEn: 'IP, arbitration, corporate, contracts', answerAr: 'ملكية فكرية، تحكيم، شركات، عقود', category: 'general', order: 1 },
      { questionEn: 'How to book a consultation?', questionAr: 'كيف أحجز استشارة؟', answerEn: 'Through our contact page.', answerAr: 'عبر صفحة اتصل بنا.', category: 'general', order: 2 }
    ];
    a = 0;
    for (const f of faqs) { if (!await FAQ.findOne({ questionEn: f.questionEn })) { await FAQ.create(f); a++; } }
    console.log('FAQs added: ' + a);

    const w = await TeamMember.findOne({ slug: 'walid' });
    if (!w) {
      await TeamMember.create({ nameEn: 'Walid Mohamed Abu Al-Ela', nameAr: 'وليد محمد أبوالعلا', slug: 'walid', roleEn: 'Founder & Lead Attorney', roleAr: 'المؤسس والمحامي الرئيسي', isFeatured: true, isActive: true });
      console.log('Team: created');
    } else console.log('Team: exists');

    await mongoose.connection.close();
    console.log('Done');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}
seed();
