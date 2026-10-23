const express = require('express');
const router = express.Router();

router.use('/services', require('./services'));
router.use('/team',     require('./team'));
router.use('/faqs',     require('./faqs'));
router.use('/site',     require('./site'));
router.use('/media',    require('./media'));
router.use('/users',    require('./users'));
router.use('/activity', require('./activity'));

module.exports = router;
