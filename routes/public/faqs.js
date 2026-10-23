const express = require('express');
const router = express.Router();
const FAQ = require('../../models/FAQ');

router.get('/', async (req, res) => {
  try {
    const category = req.query.category;
    const filter = { published: true };
    if (category) filter.category = category;
    const faqs = await FAQ.find(filter).sort({ category: 1, order: 1 }).lean();
    res.json({ success: true, count: faqs.length, faqs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
