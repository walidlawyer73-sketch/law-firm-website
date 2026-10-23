// ============================================================================
// models/ActivityLog.js — سجل التغييرات (حذف تلقائي بعد 90 يوم)
// ============================================================================
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },          // نسخة للسرعة

    action: {
        type: String,
        enum: ['create', 'update', 'delete', 'login', 'logout', 'upload'],
        required: true
    },

    model: { type: String, required: true },             // 'BlogPost', 'Service'...
    modelId: { type: mongoose.Schema.Types.ObjectId },
    modelLabel: { type: String, default: '' },           // العنوان مثلاً

    changes: { type: mongoose.Schema.Types.Mixed },      // { before, after }
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    createdAt: { type: Date, default: Date.now }
});

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL 90 يوم

module.exports = mongoose.model('ActivityLog', activityLogSchema);