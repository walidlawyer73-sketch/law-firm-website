// routes/public/sitemap.js — Sitemap ديناميكي من DB
const express = require('express');
const router = express.Router();
const Page = require('../../models/Page');
const BlogPost = require('../../models/BlogPost');
const Service = require('../../models/Service');

const BASE_URL = process.env.SITE_URL || 'https://law-arb-ip-walid.vercel.app';

router.get('/sitemap.xml', async (req, res) => {
  try {
    const [pages, posts, services] = await Promise.all([
      Page.find({ published: true }, 'slug language updatedAt').lean(),
      BlogPost.find({ published: true }, 'slug language updatedAt').lean(),
      Service.find({ published: true }, 'slug updatedAt').lean()
    ]);

    const staticRoutes = [
      { loc: '/', priority: '1.0', changefreq: 'weekly' },
      { loc: '/about.html', priority: '0.8', changefreq: 'monthly' },
      { loc: '/services.html', priority: '0.9', changefreq: 'weekly' },
      { loc: '/lawyers.html', priority: '0.7', changefreq: 'monthly' },
      { loc: '/blog.html', priority: '0.9', changefreq: 'weekly' },
      { loc: '/contact.html', priority: '0.6', changefreq: 'yearly' },
      { loc: '/consultation.html', priority: '0.8', changefreq: 'monthly' },
      { loc: '/ar/', priority: '1.0', changefreq: 'weekly' },
      { loc: '/ar/about.html', priority: '0.8', changefreq: 'monthly' },
      { loc: '/ar/services.html', priority: '0.9', changefreq: 'weekly' },
      { loc: '/ar/lawyers.html', priority: '0.7', changefreq: 'monthly' },
      { loc: '/ar/blog.html', priority: '0.9', changefreq: 'weekly' },
      { loc: '/ar/contact.html', priority: '0.6', changefreq: 'yearly' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    staticRoutes.forEach(r => {
      xml += `  <url>\n    <loc>${BASE_URL}${r.loc}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
    });

    // Services (EN + AR share slug)
    services.forEach(s => {
      const lastmod = s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : '';
      xml += `  <url>\n    <loc>${BASE_URL}/${s.slug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${BASE_URL}/ar/${s.slug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Blog posts
    posts.forEach(p => {
      const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : '';
      const baseSlug = p.slug.replace(/-ar$/, '');
      const prefix = p.language === 'ar' ? '/ar/blog/' : '/blog/';
      xml += `  <url>\n    <loc>${BASE_URL}${prefix}${baseSlug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    // Dynamic pages (excluding static routes)
    const staticSlugs = ['about','services','arbitration','trademark','patent','copyright','litigation','licensing','lawyers','blog','contact','client-portal','consultation','success','cancel'];
    pages.forEach(p => {
      const cleanSlug = p.slug.replace(/-ar$/, '');
      if (staticSlugs.includes(cleanSlug)) return;
      const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : '';
      const prefix = p.language === 'ar' ? '/ar/' : '/';
      xml += `  <url>\n    <loc>${BASE_URL}${prefix}${cleanSlug}</loc>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Sitemap generation failed');
  }
});

module.exports = router;
