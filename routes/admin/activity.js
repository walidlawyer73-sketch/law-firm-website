const express = require('express');
const router = express.Router();
const ActivityLog = require('../../models/ActivityLog');
const { requireAuth, requireRole } = require('../../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments()
    ]);

    res.render('admin/activity/index', {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      lang: req.session.adminLang || 'en'
    });
  } catch (err) {
    console.error('Activity error:', err);
    res.status(500).send('Error loading activity: ' + err.message);
  }
});

module.exports = router;
