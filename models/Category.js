// ============================================================================
// models/Category.js — تصنيفات المدونة
// ============================================================================
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    nameEn: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    descriptionEn: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },

    icon: { type: String, default: 'fa-folder' },
    color: { type: String, default: '#C9A961' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ published: 1, order: 1 });

categorySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Category', categorySchema);