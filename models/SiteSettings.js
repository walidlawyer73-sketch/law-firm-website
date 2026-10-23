// ============================================================================
// models/SiteSettings.js — إعدادات الموقع (document واحد فقط)
// ============================================================================
const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
    // الهوية
    siteNameEn: { type: String, default: 'Walid Abo Al-Ela Law Firm' },
    siteNameAr: { type: String, default: 'وليد أبوالعلا للمحاماة' },
    taglineEn: { type: String, default: 'Corporate, Arbitration, IP & Technology Legal Solutions' },
    taglineAr: { type: String, default: 'حلول قانونية للشركات والتحكيم والملكية الفكرية والتقنية' },

    // الشعار والأيقونة
    logo: { type: String, default: '' },
    logoPublicId: { type: String, default: '' },
    favicon: { type: String, default: '' },
    faviconPublicId: { type: String, default: '' },

    // الألوان
    primaryColor: { type: String, default: '#000000' },
    accentColor: { type: String, default: '#C9A961' },

    // SEO الافتراضي
    defaultMetaTitleEn: { type: String, default: 'Walid Abo Al-Ela Law Firm | Arbitration & IP' },
    defaultMetaTitleAr: { type: String, default: 'وليد أبوالعلا للمحاماة | التحكيم والملكية الفكرية' },
    defaultMetaDescEn: { type: String, default: 'Law · Arbitration · Intellectual Property. Serving clients with dedication since 2016.' },
    defaultMetaDescAr: { type: String, default: 'قانون · تحكيم · ملكية فكرية. نخدم عملاءنا بإخلاص منذ 2016.' },

    googleAnalyticsId: { type: String, default: '' },

    // التواصل
    contactEmail: { type: String, default: 'walidlegal.ippro@gmail.com' },
    contactPhone1: { type: String, default: '+20 111257219' },
    contactPhone2: { type: String, default: '+20 1018437396' },
    addressEn: { type: String, default: '10th of Ramadan, Cairo, Egypt' },
    addressAr: { type: String, default: 'العاشر من رمضان، القاهرة، مصر' },
    workingHoursEn: { type: String, default: 'Sat - Thu: 9am - 8pm' },
    workingHoursAr: { type: String, default: 'السبت - الخميس: 9 صباحاً - 8 مساءً' },

    // سوشيال ميديا
    social: {
        facebook: { type: String, default: 'https://www.facebook.com/profile.php?id=100066712755475' },
        linkedin: { type: String, default: 'https://www.linkedin.com/in/وليد-ابوالعلا-a23062128/' },
        twitter:  { type: String, default: '' },
        youtube:  { type: String, default: '' },
        instagram:{ type: String, default: '' },
        whatsapp: { type: String, default: 'https://wa.me/20111257219' },
        telegram: { type: String, default: 'https://t.me/+20111257219' }
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
});

// نمط Singleton — نحصل دائماً على نفس الوثيقة
siteSettingsSchema.statics.getSingleton = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);