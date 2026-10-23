// ============================================================================
// models/Page.js — الصفحات الديناميكية (مُوسَّع)
// ============================================================================
const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema({
    title: String,
    content: String,
    editedAt: { type: Date, default: Date.now },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const pageSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    content: { type: String, required: true },           // Markdown

    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },

    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },

    language: { type: String, enum: ['en', 'ar'], default: 'en' },
    published: { type: Boolean, default: true },

    order: { type: Number, default: 0 },
    showInNavbar: { type: Boolean, default: false },
    navbarLabel: { type: String, default: '' },

    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // نسخ احتياطية (آخر 10 تعديلات)
    revisions: [revisionSchema],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

pageSchema.index({ slug: 1, language: 1 }, { unique: true });
pageSchema.index({ showInNavbar: 1, order: 1 });

pageSchema.pre('save', function(next) {
    // إضافة revision قبل كل تعديل
    if (!this.isNew && this.isModified('content')) {
        this.revisions.push({
            title: this.title,
            content: this.content,
            editedAt: new Date(),
            editedBy: this.updatedBy
        });
        // نُبقي آخر 10 فقط
        if (this.revisions.length > 10) {
            this.revisions = this.revisions.slice(-10);
        }
    }
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Page', pageSchema);