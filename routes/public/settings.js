const express = require('express');
const router = express.Router();
const SiteSettings = require('../../models/SiteSettings');

router.get('/', async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
