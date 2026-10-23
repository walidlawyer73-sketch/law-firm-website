// routes/public/robots.js
const express = require('express');
const router = express.Router();

const BASE_URL = process.env.SITE_URL || 'https://law-arb-ip-walid.vercel.app';

router.get('/robots.txt', (req, res) => {
  const txt = [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /uploads/',
    '',
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    ''
  ].join('\n');
  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  res.send(txt);
});

module.exports = router;
