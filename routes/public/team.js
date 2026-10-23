const express = require('express');
const router = express.Router();
const TeamMember = require('../../models/TeamMember');

router.get('/', async (req, res) => {
  try {
    const team = await TeamMember.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, count: team.length, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const member = await TeamMember.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!member) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, member });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
