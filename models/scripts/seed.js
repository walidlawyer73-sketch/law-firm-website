// ============================================================================
// scripts/seed.js — يملأ البيانات الأولية
// التشغيل:  node scripts/seed.js
// ============================================================================
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
        console.log('✅ Connected');

        // ─── 1) SiteSettings ───
        const existing = await SiteSettings.findOne();
        if (!existing) {
            await SiteSettings.create({});
            console.log('✅ SiteSettings created');
        } else {
            console.log('ℹ️  SiteSettings already exists');
        }

        // ─── 2) Categories ───
        const categories = [
            { nameEn: 'Intellectual Property', nameAr: 'الملكية الفكرية', slug: 'intellectual-property', icon: 'fa-trademark', order: 1 },
            { nameEn: 'Arbitration', nameAr: 'التحكيم', slug: 'arbitration', icon: 'fa-gavel', order: 2 },
            { nameEn: 'Corporate Law', nameAr: 'قانون الشركات', slug: 'corporate-law', icon: 'fa-building', order: 3 },
            { nameEn: 'Contracts', nameAr: 'العقود', slug: 'contracts', icon: 'fa-file-contract', order: 4 }
        ];
        for (const cat of categories) {
            const exists = await Category.findOne({ slug: cat.slug });
            if (!exists) {
                await Category.create(cat);
                console.log('✅ Category:', cat.slug);
            }
        }

        // ─── 3) Services (23 خدمة) ───
        const services = [
            // IP (8)
            { titleEn: 'Trademark Registration', titleAr: 'تسجيل العلامات التجارية', slug: 'trademark', category: 'ip', icon: 'fa-trademark', order: 1 },
            { titleEn: 'Patent Protection', titleAr: 'براءات الاختراع', slug: 'patent', category: 'ip', icon: 'fa-microchip', order: 2 },
            { titleEn: 'Copyright', titleAr: 'حقوق المؤلف', slug: 'copyright', category: 'ip', icon: 'fa-copyright', order: 3 },
            { titleEn: 'Industrial Designs', titleAr: 'التصميمات الصناعية', slug: 'industrial-designs', category: 'ip', icon: 'fa-palette', order: 4 },
            { titleEn: 'Integrated Circuits', titleAr: 'مخططات الدوائر المتكاملة', slug: 'integrated-circuits', category: 'ip', icon: 'fa-memory', order: 5 },
            { titleEn: 'Utility Models', titleAr: 'نماذج المنفعة', slug: 'utility-models', category: 'ip', icon: 'fa-lightbulb', order: 6 },
            { titleEn: 'Geographical Indications', titleAr: 'المؤشرات الجغرافية', slug: 'geographical-indications', category: 'ip', icon: 'fa-map-marked-alt', order: 7 },
            { titleEn: 'Plant Varieties', titleAr: 'الأصناف النباتية', slug: 'plant-varieties', category: 'ip', icon: 'fa-seedling', order: 8 },

            // Disputes (6)
            { titleEn: 'International Arbitration', titleAr: 'التحكيم الدولي', slug: 'arbitration', category: 'disputes', icon: 'fa-gavel', order: 1 },
            { titleEn: 'IP Litigation', titleAr: 'قضايا الملكية الفكرية', slug: 'litigation', category: 'disputes', icon: 'fa-shield-halved', order: 2 },
            { titleEn: 'Civil Litigation', titleAr: 'القضايا المدنية', slug: 'civil-litigation', category: 'disputes', icon: 'fa-balance-scale', order: 3 },
            { titleEn: 'Criminal Litigation', titleAr: 'القضايا الجنائية', slug: 'criminal-litigation', category: 'disputes', icon: 'fa-user-shield', order: 4 },
            { titleEn: 'State Council Cases', titleAr: 'قضايا مجلس الدولة', slug: 'state-council-cases', category: 'disputes', icon: 'fa-landmark', order: 5 },
            { titleEn: 'Economic Cases', titleAr: 'القضايا الاقتصادية', slug: 'economic-cases', category: 'disputes', icon: 'fa-chart-line', order: 6 },

            // Corporate (4)
            { titleEn: 'Corporate Formation', titleAr: 'تأسيس الشركات', slug: 'corporate-formation', category: 'corporate', icon: 'fa-building', order: 1 },
            { titleEn: 'Operating Licenses', titleAr: 'تراخيص التشغيل', slug: 'operating-licenses', category: 'corporate', icon: 'fa-id-card', order: 2 },
            { titleEn: 'Corporate Governance', titleAr: 'حوكمة الشركات', slug: 'corporate-governance', category: 'corporate', icon: 'fa-sitemap', order: 3 },
            { titleEn: 'Mergers & Acquisitions', titleAr: 'الاندماج والاستحواذ', slug: 'ma-mergers-acquisitions', category: 'corporate', icon: 'fa-handshake', order: 4 },

            // Contracts (5)
            { titleEn: 'IP Licensing & Tech Transfer', titleAr: 'ترخيص الملكية الفكرية', slug: 'licensing', category: 'contracts', icon: 'fa-file-signature', order: 1 },
            { titleEn: 'Commercial Contracts', titleAr: 'العقود التجارية', slug: 'commercial-contracts', category: 'contracts', icon: 'fa-file-contract', order: 2 },
            { titleEn: 'Investment Contracts', titleAr: 'العقود الاستثمارية', slug: 'investment-contracts', category: 'contracts', icon: 'fa-chart-pie', order: 3 },
            { titleEn: 'NDAs & Confidentiality', titleAr: 'اتفاقيات السرية', slug: 'ndas-confidentiality', category: 'contracts', icon: 'fa-user-secret', order: 4 },
            { titleEn: 'Other Contracts', titleAr: 'عقود أخرى', slug: 'other-contracts', category: 'contracts', icon: 'fa-question-circle', order: 5 }
        ];
        for (const svc of services) {
            const exists = await Service.findOne({ slug: svc.slug });
            if (!exists) {
                await Service.create(svc);
            }
        }
        console.log(`✅ Services seeded: ${services.length}`);

        // ─── 4) FAQs ───
        const faqs = [
            {
                questionEn: 'What areas of law do you specialize in?',
                questionAr: 'ما هي مجالات القانون التي تتخصصون فيها؟',
                answerEn: 'We specialize in **intellectual property**, **international arbitration**, **corporate law**, and **contracts**.',
                answerAr: 'نتخصص في **الملكية الفكرية**، **التحكيم الدولي**، **قانون الشركات**، و**العقود**.',
                category: 'general', order: 1
            },
            {
                questionEn: 'How can I book a consultation?',
                questionAr: 'كيف يمكنني حجز استشارة؟',
                answerEn: 'You can book a consultation through our **Contact** page or call us directly.',
                answerAr: 'يمكنك حجز استشارة عبر صفحة **اتصل بنا** أو الاتصال بنا مباشرة.',
                category: 'general', order: 2
            },
            {
                questionEn: 'Do you handle cases outside Egypt?',
                questionAr: 'هل تتعاملون مع قضايا خارج مصر؟',
                answerEn: 'Yes — through international arbitration and cross-border legal services.',
                answerAr: 'نعم — من خلال التحكيم الدولي والخدمات القانونية العابرة للحدود.',
                category: 'arbitration', order: 1
            }
        ];
        for (const faq of faqs) {
            const exists = await FAQ.findOne({ questionEn: faq.questionEn });
            if (!exists) await FAQ.create(faq);
        }
        console.log('✅ FAQs seeded');

        // ─── 5) Team Member (وليد) ───
        const walidExists = await TeamMember.findOne({ slug: 'walid-mohamed-abu-al-ela' });
        if (!walidExists) {
            await TeamMember.create({
                nameEn: 'Walid Mohamed Abu Al-Ela',
                nameAr: 'وليد محمد أبوالعلا',
                slug: 'walid-mohamed-abu-al-ela',
                roleEn: 'Founder & Lead Attorney',
                roleAr: 'المؤسس والمحامي الرئيسي',
                bioEn: 'Accredited IP Arbitrator (2025), Registered Arbitrator since 2013, and a registered Master\'s researcher in Intellectual Property at the National Institute of Intellectual Property.',
                bioAr: 'محكم معتمد في الملكية الفكرية (2025)، محكم مسجل منذ 2013، وباحث ماجستير مسجل في الملكية الفكرية بالمعهد القومي للملكية الفكرية.',
                email: 'walidlegal.ippro@gmail.com',
                phone: '+20 111257219',
                specialtiesEn: ['Intellectual Property', 'International Arbitration', 'Corporate Law'],
                specialtiesAr: ['الملكية الفكرية', 'التحكيم الدولي', 'قانون الشركات'],
                social: {
                    linkedin: 'https://www.linkedin.com/in/وليد-ابوالعلا-a23062128/',
                    facebook: 'https://www.facebook.com/profile.php?id=100066712755475',
                    whatsapp: 'https://wa.me/20111257219',
                    telegram: 'https://t.me/+20111257219'
                },
                isFeatured: true,
                isActive: true,
                order: 1
            });
            console.log('✅ Team member seeded: Walid');
        }

        console.log('\n🎉 Seed complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();