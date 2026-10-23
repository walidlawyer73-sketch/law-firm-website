// ============================================================================
// models/Service.js — الخدمات (ثنائية اللغة)
// ============================================================================
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    titleEn: { type: String, required: true, trim: true },
    titleAr: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    shortDescEn: { type: String, default: '' },
    shortDescAr: { type: String, default: '' },
    contentEn: { type: String, default: '' },     // Markdown - صفحة الخدمة
    contentAr: { type: String, default: '' },

    icon: { type: String, default: 'fa-scale-balanced' },     // FontAwesome class
    image: { type: String, default: '' },                     // Cloudinary URL
    imagePublicId: { type: String, default: '' },             // للحذف

    category: {
        type: String,
        enum: ['ip', 'disputes', 'corporate', 'contracts'],
        required: true
    },

    order: { type: Number, default: 0 },
    showInMegaMenu: { type: Boolean, default: true },
    showInHomepage: { type: Boolean, default: true },
    published: { type: Boolean, default: true },

    metaTitleEn: { type: String, default: '' },
    metaTitleAr: { type: String, default: '' },
    metaDescriptionEn: { type: String, default: '' },
    metaDescriptionAr: { type: String, default: '' },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

serviceSchema.index({ slug: 1 }, { unique: true });
serviceSchema.index({ category: 1, order: 1 });
serviceSchema.index({ published: 1, showInHomepage: 1 });

serviceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Service', serviceSchema);