// ============================================================================
// routes/admin/site.js — إعدادات الموقع العامة (SiteSettings)
// ملاحظة: /admin/settings محجوز لتغيير كلمة المرور
// ============================================================================
const express = require('express');
const router = express.Router();
const SiteSettings = require('../../models/SiteSettings');
const { requireAuth } = require('../../middleware/auth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../../config/multer');
const { logActivity } = require('../../middleware/activityLogger');

// ─── عرض ───
router.get('/', requireAuth, async (req, res) => {
    const settings = await SiteSettings.getSingleton();
    res.render('admin/site/index', {
        settings,
        success: req.query.success || null,
        error: null,
        lang: req.session.adminLang || 'en'
    });
});

// ─── تحديث (مع دعم رفع الشعار والأيقونة) ───
router.post('/', requireAuth, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]), async (req, res) => {
    try {
        const settings = await SiteSettings.getSingleton();
        const before = { siteNameEn: settings.siteNameEn };

        // نص عادي (كل الحقول ما عدا الملفات)
        const textFields = [
            'siteNameEn', 'siteNameAr', 'taglineEn', 'taglineAr',
            'primaryColor', 'accentColor',
            'defaultMetaTitleEn', 'defaultMetaTitleAr',
            'defaultMetaDescEn', 'defaultMetaDescAr',
            'googleAnalyticsId',
            'contactEmail', 'contactPhone1', 'contactPhone2',
            'addressEn', 'addressAr',
            'workingHoursEn', 'workingHoursAr'
        ];
        textFields.forEach(f => {
            if (req.body[f] !== undefined) settings[f] = req.body[f];
        });

        // سوشيال (nested)
        const socialKeys = ['facebook', 'linkedin', 'twitter', 'youtube', 'instagram', 'whatsapp', 'telegram'];
        socialKeys.forEach(k => {
            if (req.body['social_' + k] !== undefined) {
                if (!settings.social) settings.social = {};
                settings.social[k] = req.body['social_' + k];
            }
        });

        // رفع الشعار
        if (req.files && req.files.logo && req.files.logo[0]) {
            if (settings.logoPublicId) await deleteFromCloudinary(settings.logoPublicId);
            const result = await uploadToCloudinary(req.files.logo[0].buffer, {
                folder: 'law-firm/settings',
                transformation: [{ width: 400, crop: 'limit', quality: 'auto:good' }]
            });
            settings.logo = result.secure_url;
            settings.logoPublicId = result.public_id;
        }

        // رفع الأيقونة
        if (req.files && req.files.favicon && req.files.favicon[0]) {
            if (settings.faviconPublicId) await deleteFromCloudinary(settings.faviconPublicId);
            const result = await uploadToCloudinary(req.files.favicon[0].buffer, {
                folder: 'law-firm/settings',
                transformation: [{ width: 64, height: 64, crop: 'fill' }]
            });
            settings.favicon = result.secure_url;
            settings.faviconPublicId = result.public_id;
        }

        settings.updatedBy = req.session.userId;
        await settings.save();

        await logActivity(req, {
            action: 'update',
            model: 'SiteSettings',
            modelId: settings._id,
            modelLabel: 'Site Settings',
            changes: { before, after: { siteNameEn: settings.siteNameEn } }
        });

        res.redirect('/admin/site?success=1');
    } catch (err) {
        console.error('Site settings error:', err);
        res.status(400).send('Update error: ' + err.message);
    }
});

module.exports = router;