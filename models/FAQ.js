// ============================================================================
// models/FAQ.js — الأسئلة الشائعة
// ============================================================================
const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    questionEn: { type: String, required: true, trim: true },
    questionAr: { type: String, required: true, trim: true },
    answerEn: { type: String, required: true },       // Markdown
    answerAr: { type: String, required: true },

    category: {
        type: String,
        enum: ['general', 'ip', 'arbitration', 'corporate', 'contracts'],
        default: 'general'
    },

    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ published: 1 });

faqSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('FAQ', faqSchema);