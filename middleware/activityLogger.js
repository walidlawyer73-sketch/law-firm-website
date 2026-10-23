// ============================================================================
// middleware/activityLogger.js — تسجيل كل تغيير في قاعدة البيانات
// ============================================================================
const ActivityLog = require('../models/ActivityLog');

/**
 * تسجيل نشاط في قاعدة البيانات
 * @param {Request} req - طلب Express (يحمل session)
 * @param {Object} data - { action, model, modelId, modelLabel, changes }
 */
async function logActivity(req, data) {
    try {
        if (!req.session || !req.session.userId) return;

        await ActivityLog.create({
            userId: req.session.userId,
            username: req.session.username || 'unknown',
            action: data.action,
            model: data.model,
            modelId: data.modelId || null,
            modelLabel: data.modelLabel || '',
            changes: data.changes || null,
            ip: (req.ip || req.connection?.remoteAddress || '').replace('::ffff:', ''),
            userAgent: (req.get && req.get('user-agent')) || ''
        });
    } catch (err) {
        // لا نُفشل الطلب بسبب فشل التسجيل
        console.error('Activity log error:', err.message);
    }
}

module.exports = { logActivity };