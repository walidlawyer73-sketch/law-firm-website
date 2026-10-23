// ============================================================================
// models/TeamMember.js — أعضاء الفريق
// ============================================================================
const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    nameEn: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },

    roleEn: { type: String, default: '' },
    roleAr: { type: String, default: '' },
    bioEn: { type: String, default: '' },           // Markdown
    bioAr: { type: String, default: '' },

    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },

    email: { type: String, default: '', lowercase: true },
    phone: { type: String, default: '' },

    specialtiesEn: [{ type: String }],
    specialtiesAr: [{ type: String }],

    social: {
        linkedin: { type: String, default: '' },
        twitter:  { type: String, default: '' },
        facebook: { type: String, default: '' },
        whatsapp: { type: String, default: '' },
        telegram: { type: String, default: '' }
    },

    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },   // يظهر في الصفحة الرئيسية
    isActive: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

teamMemberSchema.index({ slug: 1 }, { unique: true });
teamMemberSchema.index({ isActive: 1, order: 1 });

teamMemberSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('TeamMember', teamMemberSchema);