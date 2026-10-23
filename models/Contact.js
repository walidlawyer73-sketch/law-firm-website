// ============================================================================
// models/Contact.js — رسائل الاتصال (مُوسَّع)
// ============================================================================
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    text: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emailSent: { type: Boolean, default: false }
}, { _id: true });

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    message: { type: String, required: true },
    service: { type: String, default: 'general' },

    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },

    emailSent: { type: Boolean, default: false },
    attachmentName: { type: String, default: '' },

    // 🆕 ردود
    replies: [replySchema],
    notes: { type: String, default: '' },                     // ملاحظات داخلية
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

contactSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Contact', contactSchema);