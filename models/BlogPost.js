// ============================================================================
// models/BlogPost.js — مقالات المدونة (مُوسَّع)
// ============================================================================
const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },           // Markdown

    excerpt: { type: String, default: '' },
    image: { type: String, default: '' },                // Cloudinary URL
    imagePublicId: { type: String, default: '' },

    author: { type: String, default: 'Walid Abo Al-Ela' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    category: { type: String, default: '' },             // سيُربط بـ Category لاحقاً
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [{ type: String }],

    language: { type: String, enum: ['en', 'ar'], default: 'en' },
    published: { type: Boolean, default: true },
    publishDate: { type: Date, default: Date.now },

    views: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 },           // دقائق

    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

blogPostSchema.index({ slug: 1, language: 1 }, { unique: true });
blogPostSchema.index({ published: 1, publishDate: -1 });
blogPostSchema.index({ categoryId: 1 });
blogPostSchema.index({ views: -1 });

blogPostSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// حساب وقت القراءة تلقائياً (~200 كلمة/دقيقة)
blogPostSchema.pre('save', function(next) {
    if (this.isModified('content') && this.content) {
        const wordCount = this.content.trim().split(/\s+/).length;
        this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }
    next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);