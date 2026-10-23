// ============================================================================
// routes/admin/team.js — إدارة فريق العمل
// ============================================================================
const express = require('express');
const router = express.Router();
const TeamMember = require('../../models/TeamMember');
const { requireAuth } = require('../../middleware/auth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../../config/multer');
const { logActivity } = require('../../middleware/activityLogger');
const { slugify, toInt, toBool } = require('./_helpers');

router.get('/', requireAuth, async (req, res) => {
    const team = await TeamMember.find().sort({ order: 1, createdAt: -1 }).lean();
    res.render('admin/team/index', { team, lang: req.session.adminLang || 'en' });
});

router.get('/new', requireAuth, (req, res) => {
    res.render('admin/team/new', { member: null, lang: req.session.adminLang || 'en' });
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const data = {
            nameEn: (req.body.nameEn || '').trim(),
            nameAr: (req.body.nameAr || '').trim(),
            slug: (req.body.slug || '').trim() || slugify(req.body.nameEn),
            roleEn: req.body.roleEn || '',
            roleAr: req.body.roleAr || '',
            bioEn: req.body.bioEn || '',
            bioAr: req.body.bioAr || '',
            email: req.body.email || '',
            phone: req.body.phone || '',
            specialtiesEn: (req.body.specialtiesEn || '').split(',').map(s => s.trim()).filter(Boolean),
            specialtiesAr: (req.body.specialtiesAr || '').split(',').map(s => s.trim()).filter(Boolean),
            social: {
                linkedin: req.body.social_linkedin || '',
                twitter: req.body.social_twitter || '',
                facebook: req.body.social_facebook || '',
                whatsapp: req.body.social_whatsapp || '',
                telegram: req.body.social_telegram || ''
            },
            order: toInt(req.body.order, 0),
            isFeatured: toBool(req.body.isFeatured),
            isActive: toBool(req.body.isActive)
        };

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: 'law-firm/team',
                transformation: [{ width: 800, height: 800, crop: 'fill', gravity: 'face', quality: 'auto:good' }]
            });
            data.image = result.secure_url;
            data.imagePublicId = result.public_id;
        }

        const member = await TeamMember.create(data);

        await logActivity(req, {
            action: 'create',
            model: 'TeamMember',
            modelId: member._id,
            modelLabel: member.nameEn
        });

        res.redirect('/admin/team');
    } catch (err) {
        console.error('Team create error:', err);
        res.status(400).send('Create error: ' + err.message);
    }
});

router.get('/:id/edit', requireAuth, async (req, res) => {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).send('Team member not found');
    res.render('admin/team/edit', { member, lang: req.session.adminLang || 'en' });
});

router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const member = await TeamMember.findById(req.params.id);
        if (!member) return res.status(404).send('Team member not found');

        const before = { nameEn: member.nameEn, isActive: member.isActive };

        const fields = ['nameEn', 'nameAr', 'slug', 'roleEn', 'roleAr', 'bioEn', 'bioAr', 'email', 'phone'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) member[f] = req.body[f];
        });

        if (req.body.specialtiesEn !== undefined) {
            member.specialtiesEn = String(req.body.specialtiesEn).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (req.body.specialtiesAr !== undefined) {
            member.specialtiesAr = String(req.body.specialtiesAr).split(',').map(s => s.trim()).filter(Boolean);
        }

        ['linkedin', 'twitter', 'facebook', 'whatsapp', 'telegram'].forEach(key => {
            if (req.body['social_' + key] !== undefined) {
                member.social[key] = req.body['social_' + key];
            }
        });

        member.order = toInt(req.body.order, member.order);
        member.isFeatured = toBool(req.body.isFeatured);
        member.isActive = toBool(req.body.isActive);

        if (req.file) {
            if (member.imagePublicId) await deleteFromCloudinary(member.imagePublicId);
            const result = await uploadToCloudinary(req.file.buffer, {
                folder: 'law-firm/team',
                transformation: [{ width: 800, height: 800, crop: 'fill', gravity: 'face', quality: 'auto:good' }]
            });
            member.image = result.secure_url;
            member.imagePublicId = result.public_id;
        }

        await member.save();

        await logActivity(req, {
            action: 'update',
            model: 'TeamMember',
            modelId: member._id,
            modelLabel: member.nameEn,
            changes: { before, after: { nameEn: member.nameEn, isActive: member.isActive } }
        });

        res.redirect('/admin/team');
    } catch (err) {
        console.error('Team update error:', err);
        res.status(400).send('Update error: ' + err.message);
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const member = await TeamMember.findById(req.params.id);
        if (!member) return res.status(404).send('Team member not found');

        if (member.imagePublicId) await deleteFromCloudinary(member.imagePublicId);
        await TeamMember.findByIdAndDelete(req.params.id);

        await logActivity(req, {
            action: 'delete',
            model: 'TeamMember',
            modelId: member._id,
            modelLabel: member.nameEn
        });

        res.redirect('/admin/team');
    } catch (err) {
        console.error('Team delete error:', err);
        res.status(400).send('Delete error: ' + err.message);
    }
});

module.exports = router;