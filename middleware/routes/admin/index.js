// ============================================================================
// routes/admin/index.js — يجمع كل مسارات اللوحة
// ============================================================================
const express = require('express');
const router = express.Router();

// مسارات جديدة (Sprint 3 Part 1)
router.use('/services', require('./services'));
router.use('/team',     require('./team'));
router.use('/faqs',     require('./faqs'));
router.use('/site',     require('./site'));

// مسارات Sprint 3 Part 2 (تُضاف لاحقاً):
// router.use('/media',        require('./media'));
// router.use('/users',        require('./users'));
// router.use('/activity',     require('./activity'));
// router.use('/pages',        require('./pages'));
// router.use('/posts',        require('./posts'));
// router.use('/testimonials', require('./testimonials'));
// router.use('/messages',     require('./messages'));

module.exports = router;