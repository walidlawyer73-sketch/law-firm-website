// ============================================================================
// models/Media.js — مكتبة الوسائط (صور مرفوعة إلى Cloudinary)
// ============================================================================
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    filename: { type: String, required: true },          // الاسم في Cloudinary
    originalName: { type: String, default: '' },         // الاسم الأصلي
    url: { type: String, required: true },               // Cloudinary secure_url
    publicId: { type: String, required: true, unique: true },

    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },                   // bytes
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },

    folder: { type: String, default: 'law-firm/general' },// law-firm/blog, law-firm/team...
    altEn: { type: String, default: '' },
    altAr: { type: String, default: '' },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

mediaSchema.index({ folder: 1, createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);