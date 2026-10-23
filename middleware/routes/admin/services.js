// ============================================================================
// routes/admin/services.js — إدارة الخدمات
// ============================================================================
const express = require('express');
const router = express.Router();
const Service = require('../../models/Service');
const { requireAuth } = require('../../middleware/auth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../../config/multer');
const { logActivity } = require('../../middleware/activityLogger');
const { slugify, toInt, toBool } = require('./_helpers');

// ─── قائمة ───
router.get('/', requireAuth, async (req, res) => {
    const services = await Service.find().sort({ category: 1, order: 1 }).lean();
    res.render('admin/services/index', {
        services,
        lang: req.session.adminLang || 'en'
    });
});

// ─── نموذج إضافة ───
router.get('/new', requireAuth, (req, res) => {
    res.render('admin/services/new', {
        service: null,
        lang: req.session.adminLang || 'en'
    });
});

// ─── إنشاء ───
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const data = {
            titleEn: (req.body.titleEn || '').trim(),
            titleAr: (req.body.titleAr || '').trim(),
            slug: (req.body.slug || '').trim() || slugify(req.body.titleEn),
            shortDescEn: req.body.shortDescEn || '',
            shortDescAr: req.body.shortDescAr || '',
            contentEn: req.body.contentEn || '',
            contentAr: req.body.contentAr || '',
            icon: req.body.icon || 'fa-scale-balanced',
            category: req.body.category || 'ip',
            order: toInt(req.body.order, 0),
            showInMegaMenu: toBool(req.body.showInMegaMenu),
            showInHomepage: toBool(req.body.showInHomepage),
            published: toBool(req.body.published),
            metaTitleEn: req.body.metaTitleEn || '',
            metaTitleAr: req.body.metaTitleAr || '',
            metaDescriptionEn: req.body.metaDescriptionEn || '',
            metaDescriptionAr: req.body.metaDescriptionAr || '',
            updatedBy: req.session.userId
        };

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: 'law-firm/services',
                transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }]
            });
            data.image = result.secure_url;
            data.imagePublicId = result.public_id;
        }

        const service = await Service.create(data);

        await logActivity(req, {
            action: 'create',
            model: 'Service',
            modelId: service._id,
            modelLabel: service.titleEn
        });

        res.redirect('/admin/services');
    } catch (err) {
        console.error('Service create error:', err);
        res.status(400).send('Create error: ' + err.message);
    }
});

// ─── نموذج تعديل ───
router.get('/:id/edit', requireAuth, async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).send('Service not found');
    res.render('admin/services/edit', {
        service,
        lang: req.session.adminLang || 'en'
    });
});

// ─── تحديث ───
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).send('Service not found');

        const before = { titleEn: service.titleEn, published: service.published };

        const fields = [
            'titleEn', 'titleAr', 'slug', 'shortDescEn', 'shortDescAr',
            'contentEn', 'contentAr', 'icon', 'category',
            'metaTitleEn', 'metaTitleAr', 'metaDescriptionEn', 'metaDescriptionAr'
        ];
        fields.forEach(f => {
            if (req.body[f] !== undefined) service[f] = req.body[f];
        });

        service.order = toInt(req.body.order, service.order);
        service.showInMegaMenu = toBool(req.body.showInMegaMenu);
        service.showInHomepage = toBool(req.body.showInHomepage);
        service.published = toBool(req.body.published);
        service.updatedBy = req.session.userId;

        if (req.file) {
            if (service.imagePublicId) await deleteFromCloudinary(service.imagePublicId);
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: 'law-firm/services',
                transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }]
            });
            service.image = result.secure_url;
            service.imagePublicId = result.public_id;
        }

        await service.save();

        await logActivity(req, {
            action: 'update',
            model: 'Service',
            modelId: service._id,
            modelLabel: service.titleEn,
            changes: { before, after: { titleEn: service.titleEn, published: service.published } }
        });

        res.redirect('/admin/services');
    } catch (err) {
        console.error('Service update error:', err);
        res.status(400).send('Update error: ' + err.message);
    }
});

// ─── حذف ───
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).send('Service not found');

        if (service.imagePublicId) await deleteFromCloudinary(service.imagePublicId);
        await Service.findByIdAndDelete(req.params.id);

        await logActivity(req, {
            action: 'delete',
            model: 'Service',
            modelId: service._id,
            modelLabel: service.titleEn
        });

        res.redirect('/admin/services');
    } catch (err) {
        console.error('Service delete error:', err);
        res.status(400).send('Delete error: ' + err.message);
    }
});

module.exports = router;