// ============================================================================
// routes/admin/faqs.js — إدارة الأسئلة الشائعة
// ============================================================================
const express = require('express');
const router = express.Router();
const FAQ = require('../../models/FAQ');
const { requireAuth } = require('../../middleware/auth');
const { logActivity } = require('../../middleware/activityLogger');
const { toInt, toBool } = require('./_helpers');

router.get('/', requireAuth, async (req, res) => {
    const faqs = await FAQ.find().sort({ category: 1, order: 1 }).lean();
    res.render('admin/faqs/index', { faqs, lang: req.session.adminLang || 'en' });
});

router.get('/new', requireAuth, (req, res) => {
    res.render('admin/faqs/new', { faq: null, lang: req.session.adminLang || 'en' });
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const faq = await FAQ.create({
            questionEn: (req.body.questionEn || '').trim(),
            questionAr: (req.body.questionAr || '').trim(),
            answerEn: req.body.answerEn || '',
            answerAr: req.body.answerAr || '',
            category: req.body.category || 'general',
            order: toInt(req.body.order, 0),
            published: toBool(req.body.published)
        });

        await logActivity(req, {
            action: 'create',
            model: 'FAQ',
            modelId: faq._id,
            modelLabel: faq.questionEn
        });

        res.redirect('/admin/faqs');
    } catch (err) {
        console.error('FAQ create error:', err);
        res.status(400).send('Create error: ' + err.message);
    }
});

router.get('/:id/edit', requireAuth, async (req, res) => {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).send('FAQ not found');
    res.render('admin/faqs/edit', { faq, lang: req.session.adminLang || 'en' });
});

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const faq = await FAQ.findById(req.params.id);
        if (!faq) return res.status(404).send('FAQ not found');

        const before = { questionEn: faq.questionEn, published: faq.published };

        ['questionEn', 'questionAr', 'answerEn', 'answerAr', 'category'].forEach(f => {
            if (req.body[f] !== undefined) faq[f] = req.body[f];
        });
        faq.order = toInt(req.body.order, faq.order);
        faq.published = toBool(req.body.published);

        await faq.save();

        await logActivity(req, {
            action: 'update',
            model: 'FAQ',
            modelId: faq._id,
            modelLabel: faq.questionEn,
            changes: { before, after: { questionEn: faq.questionEn, published: faq.published } }
        });

        res.redirect('/admin/faqs');
    } catch (err) {
        console.error('FAQ update error:', err);
        res.status(400).send('Update error: ' + err.message);
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const faq = await FAQ.findById(req.params.id);
        if (!faq) return res.status(404).send('FAQ not found');

        await FAQ.findByIdAndDelete(req.params.id);

        await logActivity(req, {
            action: 'delete',
            model: 'FAQ',
            modelId: faq._id,
            modelLabel: faq.questionEn
        });

        res.redirect('/admin/faqs');
    } catch (err) {
        console.error('FAQ delete error:', err);
        res.status(400).send('Delete error: ' + err.message);
    }
});

module.exports = router;