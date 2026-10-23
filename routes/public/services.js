// routes/public/services.js — API عام للخدمات
const express = require('express');
const router = express.Router();
const Service = require('../../models/Service');

// GET /api/services — قائمة كل الخدمات المنشورة
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ published: true })
      .sort({ category: 1, order: 1 })
      .select('titleEn titleAr slug shortDescEn shortDescAr icon category image order')
      .lean();
    res.json({ success: true, count: services.length, services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/services/:slug — خدمة واحدة
router.get('/:slug', async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug, published: true }).lean();
    if (!service) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
