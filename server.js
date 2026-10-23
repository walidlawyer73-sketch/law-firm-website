// ============================================================================
// server.js — Walid Abo Al-Ela Law Firm
// Complete, production-ready server (works on Vercel + local)
// ============================================================================

require('dotenv').config();

// ─── Core Imports ────────────────────────────────────────────────────────────
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');
const nodemailer = require('nodemailer');
const { marked } = require('marked');
const rateLimit = require('express-rate-limit');

// ─── Custom Modules ──────────────────────────────────────────────────────────
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { requireAuth } = require('./middleware/auth');
const { upload } = require('./config/multer');
try { require('./config/cloudinary'); } catch (e) { console.warn('Cloudinary init skipped:', e.message); }

// ─── Models ──────────────────────────────────────────────────────────────────
const Page = require('./models/Page');
const BlogPost = require('./models/BlogPost');
const Testimonial = require('./models/Testimonial');
const ContactInfo = require('./models/ContactInfo');
const Contact = require('./models/Contact');
const User = require('./models/User');
const Service = require('./models/Service');
const TeamMember = require('./models/TeamMember');
const FAQ = require('./models/FAQ');
const Media = require('./models/Media');

// ─── Admin Routes ────────────────────────────────────────────────────────────
const adminRoutes = require('./routes/admin');

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 3000;
app.set('trust proxy', 1);

// ─── Marked Config ───────────────────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true });

// ─── Email Setup (non-fatal) ─────────────────────────────────────────────────
let emailReady = false;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false }
    });
    transporter.verify((err) => {
      if (err) console.error('Email verify error:', err.message);
      else { emailReady = true; console.log('Email ready to send'); }
    });
  } catch (err) {
    console.error('Email setup failed:', err.message);
  }
}

// ─── MongoDB Connection (lazy, non-blocking) ──────────────────────────────
let dbConnectPromise = null;

function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.error('[DB] MONGODB_URI is not defined — DB operations will fail');
    return Promise.reject(new Error('MONGODB_URI is not defined'));
  }
  if (!dbConnectPromise) {
    dbConnectPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // فشل سريع بدلاً من التعليق
      bufferCommands: false           // لا تخزين مؤقت للأوامر قبل الاتصال
    }).then(() => {
      console.log('DB Connected');
    }).catch((err) => {
      console.error('DB Error:', err.message);
      dbConnectPromise = null; // السماح بإعادة المحاولة في الطلب التالي
      throw err;
    });
  }
  return dbConnectPromise;
}

// الاتصال الأولي (اختياري، للمساعدة في تسخين الدالة)
if (process.env.MONGODB_URI) {
  connectDB().catch(() => {});
}

// ─── Static Files ────────────────────────────────────────────────────────────
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// ─── Health Check (for debugging) ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'undefined',
      vercel: !!process.env.VERCEL,
      mongodb: !!process.env.MONGODB_URI,
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
      sessionSecret: !!process.env.SESSION_SECRET,
      email: !!process.env.EMAIL_USER
    },
    dbState: mongoose.connection.readyState // 0=disconnected, 1=connected
  });
});

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// ─── Contact Form Handlers ───────────────────────────────────────────────────
const handleContact = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGODB_URI) {
        return res.status(503).json({ error: 'Database not configured' });
      }
      await mongoose.connect(process.env.MONGODB_URI);
    }
    const { name, email, phone, service, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const contact = await Contact.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      service: service || 'general',
      message: String(message)
    });

    // Optional email notification (non-blocking)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        transporter.sendMail({
          from: `"Website" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
          replyTo: contact.email,
          subject: `New message from ${contact.name}`,
          html: `<h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
            <p><strong>Service:</strong> ${contact.service}</p>
            <hr><p>${contact.message.replace(/\n/g, '<br>')}</p>`
        }).catch((e) => console.error('Email send error:', e.message));
      } catch (e) { /* ignore */ }
    }

    res.json({ success: true, id: contact._id });
  } catch (err) {
    console.error('Contact handler error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

app.post('/data/contact', handleContact);
app.post('/api/contact', handleContact); // backward compatibility

// ─── Public APIs (/data/*) ───────────────────────────────────────────────────
try { app.use('/data/services', require('./routes/public/services')); } catch (e) { console.warn('services route skipped:', e.message); }
try { app.use('/data/team', require('./routes/public/team')); } catch (e) { console.warn('team route skipped:', e.message); }
try { app.use('/data/faqs', require('./routes/public/faqs')); } catch (e) { console.warn('faqs route skipped:', e.message); }
try { app.use('/data/settings', require('./routes/public/settings')); } catch (e) { console.warn('settings route skipped:', e.message); }

// ─── Sitemap & Robots ────────────────────────────────────────────────────────
try { app.use('/', require('./routes/public/sitemap')); } catch (e) { console.warn('sitemap skipped:', e.message); }
try { app.use('/', require('./routes/public/robots')); } catch (e) { console.warn('robots skipped:', e.message); }

// ─── Session (guarded) ───────────────────────────────────────────────────────
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
};
if (process.env.MONGODB_URI) {
  try {
  } catch (err) {
    console.warn('[SESSION] Using MemoryStore — sessions will not persist');
  }
} else {
  console.warn('[SESSION] No MONGODB_URI — using MemoryStore');
}
app.use(session(sessionConfig));

// ─── View Engine ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Rate Limiter (login only) ───────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Try again in 15 minutes.',
  skip: (req) => process.env.NODE_ENV !== 'production' // disabled locally
});
app.use('/admin/login', loginLimiter);

// ─── Admin Language Middleware ───────────────────────────────────────────────
app.use('/admin', (req, res, next) => {
  if (req.query.lang) req.session.adminLang = req.query.lang;
  res.locals.lang = req.session.adminLang || 'en';
  next();
});

// ─── Render Helpers ──────────────────────────────────────────────────────────
function renderPageHTML(page, htmlContent, lang) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const base = isAr ? '/ar' : '';
  const slug = page.slug.replace(/-ar$/, '');
  const switchUrl = isAr ? '/' + slug : '/ar/' + slug;
  const switchLang = isAr ? 'English' : 'العربية';
  const brandName = isAr ? 'وليد أبوالعلا للمحاماة' : 'Walid Abo Al-Ela Law Firm';
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.metaTitle || page.title}</title>
<meta name="description" content="${page.metaDescription || ''}">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div class="language-switcher"><a href="${switchUrl}" class="lang-btn"><i class="fas fa-globe"></i> ${switchLang}</a></div>
<nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">
<div class="container"><a class="navbar-brand" href="${base || '/'}"><img src="/images/logo arb ip.png" alt="${brandName}" style="height:45px;"></a></div>
</nav>
<header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:60px 0;text-align:center;">
<div class="container"><h1>${page.title}</h1></div>
</header>
<section style="padding:60px 0;"><div class="container"><div class="row"><div class="col-lg-8 mx-auto">${htmlContent}</div></div></div></section>
<footer style="background:#000;color:#fff;padding:40px 0;text-align:center;"><p>&copy; ${new Date().getFullYear()} ${brandName}</p></footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/main.js"></script>
</body></html>`;
}

function renderBlogHTML(post, htmlContent, lang) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const base = isAr ? '/ar' : '';
  const slug = post.slug.replace(/-ar$/, '');
  const switchUrl = isAr ? '/blog/' + slug : '/ar/blog/' + slug;
  const switchLang = isAr ? 'English' : 'العربية';
  const brandName = isAr ? 'وليد أبوالعلا للمحاماة' : 'Walid Abo Al-Ela Law Firm';
  const dateLocale = isAr ? 'ar-EG' : 'en-US';
  const formattedDate = new Date(post.createdAt).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${post.title} - ${brandName}</title>
<meta name="description" content="${post.excerpt || ''}">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div class="language-switcher"><a href="${switchUrl}" class="lang-btn"><i class="fas fa-globe"></i> ${switchLang}</a></div>
<nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">
<div class="container"><a class="navbar-brand" href="${base || '/'}"><img src="/images/logo arb ip.png" alt="${brandName}" style="height:45px;"></a></div>
</nav>
<header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:60px 0;text-align:center;">
<div class="container"><h1>${post.title}</h1><p>${formattedDate}</p></div>
</header>
<section style="padding:60px 0;"><div class="container"><div class="row"><div class="col-lg-8 mx-auto">${htmlContent}
<hr style="margin:40px 0;"><a href="${base}/blog.html">&larr; Back to Blog</a>
</div></div></div></section>
<footer style="background:#000;color:#fff;padding:40px 0;text-align:center;"><p>&copy; ${new Date().getFullYear()} ${brandName}</p></footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/main.js"></script>
</body></html>`;
}

function renderServiceHTML(service, lang) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const base = isAr ? '/ar' : '';
  const title = isAr ? (service.titleAr || service.titleEn) : (service.titleEn || service.titleAr);
  const shortDesc = isAr ? (service.shortDescAr || service.shortDescEn) : (service.shortDescEn || service.shortDescAr);
  const content = isAr ? (service.contentAr || service.contentEn) : (service.contentEn || service.contentAr);
  const htmlContent = marked.parse(content || '');
  const switchUrl = isAr ? '/' + service.slug : '/ar/' + service.slug;
  const switchLang = isAr ? 'English' : 'العربية';
  const brandName = isAr ? 'وليد أبوالعلا للمحاماة' : 'Walid Abo Al-Ela Law Firm';
  const iconClass = service.icon || 'fa-scale-balanced';
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - ${brandName}</title>
<meta name="description" content="${shortDesc || ''}">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div class="language-switcher"><a href="${switchUrl}" class="lang-btn"><i class="fas fa-globe"></i> ${switchLang}</a></div>
<nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">
<div class="container"><a class="navbar-brand" href="${base || '/'}"><img src="/images/logo arb ip.png" alt="${brandName}" style="height:45px;"></a></div>
</nav>
<header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:80px 0;text-align:center;">
<div class="container">
<div style="width:80px;height:80px;background:linear-gradient(135deg,#C9A961,#A88947);color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 25px;"><i class="fas ${iconClass}"></i></div>
<h1>${title}</h1>
${shortDesc ? `<p style="color:rgba(255,255,255,0.85);max-width:650px;margin:15px auto 0;">${shortDesc}</p>` : ''}
</div>
</header>
<section style="padding:60px 0;"><div class="container"><div class="row"><div class="col-lg-8 mx-auto">
${service.image ? `<img src="${service.image}" alt="${title}" style="max-width:100%;border-radius:12px;margin-bottom:30px;">` : ''}
${htmlContent || '<p>Content coming soon.</p>'}
<hr style="margin:40px 0;"><a href="${base}/services.html">&larr; Back to Services</a>
</div></div></div></section>
<footer style="background:#000;color:#fff;padding:40px 0;text-align:center;"><p>&copy; ${new Date().getFullYear()} ${brandName}</p></footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/main.js"></script>
</body></html>`;
}

// ─── Static Page Slugs (bypass dynamic routing) ──────────────────────────────
const staticPageSlugs = [
  'about', 'services', 'arbitration', 'trademark', 'patent', 'copyright',
  'litigation', 'licensing', 'lawyers', 'blog', 'contact', 'client-portal',
  'consultation', 'success', 'cancel', 'admin', 'ar', 'images', 'css', 'js',
  'uploads', 'api', 'data', 'health', 'favicon.ico', 'robots.txt', 'sitemap.xml',
  'privacy-policy', 'terms-of-service', 'cookie-policy'
];

// ─── Static Routes (EN) ──────────────────────────────────────────────────────
const staticPagesEN = ['about', 'services', 'arbitration', 'trademark', 'patent', 'copyright',
  'litigation', 'licensing', 'lawyers', 'blog', 'contact', 'client-portal',
  'consultation', 'success', 'cancel', 'privacy-policy', 'terms-of-service', 'cookie-policy'];
staticPagesEN.forEach((slug) => {
  app.get('/' + slug, (req, res, next) => {
    const fp = path.join(__dirname, 'public', slug + '.html');
    res.sendFile(fp, (err) => { if (err) next(); });
  });
});

// ─── Static Routes (AR) ──────────────────────────────────────────────────────
staticPagesEN.forEach((slug) => {
  app.get('/ar/' + slug, (req, res, next) => {
    const fp = path.join(__dirname, 'public', 'ar', slug + '.html');
    res.sendFile(fp, (err) => { if (err) next(); });
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/ar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'index.html')));

// ─── Dynamic Service/Page Route (EN) ─────────────────────────────────────────
app.get('/:page', async (req, res, next) => {
  if (staticPageSlugs.includes(req.params.page)) return next();
  try {
    const service = await Service.findOne({ slug: req.params.page, published: true });
    if (service) return res.send(renderServiceHTML(service, 'en'));
    const page = await Page.findOne({ slug: req.params.page, language: 'en', published: true });
    if (page) {
      const htmlContent = marked.parse(page.content || '');
      return res.send(renderPageHTML(page, htmlContent, 'en'));
    }
    next();
  } catch (err) {
    console.error('Dynamic page error:', err.message);
    next();
  }
});

// ─── Dynamic Service/Page Route (AR) ─────────────────────────────────────────
app.get('/ar/:page', async (req, res, next) => {
  if (staticPageSlugs.includes(req.params.page)) return next();
  try {
    const service = await Service.findOne({ slug: req.params.page, published: true });
    if (service) return res.send(renderServiceHTML(service, 'ar'));
    const page = await Page.findOne({ slug: req.params.page + '-ar', language: 'ar', published: true });
    if (page) {
      const htmlContent = marked.parse(page.content || '');
      return res.send(renderPageHTML(page, htmlContent, 'ar'));
    }
    next();
  } catch (err) {
    console.error('Dynamic AR page error:', err.message);
    next();
  }
});

// ─── Blog Routes ─────────────────────────────────────────────────────────────
app.get('/blog/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, language: 'en', published: true });
    if (!post) return next();
    post.views = (post.views || 0) + 1;
    await post.save();
    const htmlContent = marked.parse(post.content || '');
    res.send(renderBlogHTML(post, htmlContent, 'en'));
  } catch (err) {
    console.error('Blog error:', err.message);
    next();
  }
});

app.get('/ar/blog/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug + '-ar', language: 'ar', published: true });
    if (!post) return next();
    post.views = (post.views || 0) + 1;
    await post.save();
    const htmlContent = marked.parse(post.content || '');
    res.send(renderBlogHTML(post, htmlContent, 'ar'));
  } catch (err) {
    console.error('Blog AR error:', err.message);
    next();
  }
});

// ─── Admin: Login ────────────────────────────────────────────────────────────
app.get('/admin/login', (req, res) => {
  res.render('login', { error: null, lang: req.query.lang || 'en' });
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && await user.comparePassword(password)) {
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.role = user.role || 'admin';
      user.lastLoginAt = new Date();
      await user.save();
      return res.redirect('/admin/dashboard');
    }
    res.render('login', { error: 'Invalid credentials', lang: req.body.lang || 'en' });
  } catch (err) {
    res.render('login', { error: 'Login error: ' + err.message, lang: req.body.lang || 'en' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ─── Admin: Dashboard ────────────────────────────────────────────────────────
app.get('/admin/dashboard', requireAuth, async (req, res) => {
  try {
    const results = await Promise.all([
      Page.countDocuments(),
      BlogPost.countDocuments(),
      Testimonial.countDocuments(),
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Service.countDocuments(),
      TeamMember.countDocuments(),
      FAQ.countDocuments(),
      Media.countDocuments(),
      User.countDocuments()
    ]);
    res.render('dashboard', {
      pages: results[0], posts: results[1], testimonials: results[2],
      messages: results[3], newMessages: results[4],
      services: results[5], team: results[6], faqs: results[7],
      media: results[8], users: results[9],
      user: req.session.username,
      lang: req.session.adminLang || 'en'
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).send('Dashboard error: ' + err.message);
  }
});

// ─── Admin: Messages ─────────────────────────────────────────────────────────
app.get('/admin/messages', requireAuth, async (req, res) => {
  const messages = await Contact.find().sort('-createdAt');
  res.render('messages/index', { messages, lang: req.session.adminLang || 'en' });
});

app.get('/admin/messages/:id', requireAuth, async (req, res) => {
  const message = await Contact.findById(req.params.id);
  if (!message) return res.status(404).send('Message not found');
  if (message.status === 'new') { message.status = 'read'; await message.save(); }
  res.render('messages/show', { message, lang: req.session.adminLang || 'en' });
});

app.delete('/admin/messages/:id', requireAuth, async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.redirect('/admin/messages');
});

// ─── Admin: Pages CRUD ───────────────────────────────────────────────────────
app.get('/admin/pages', requireAuth, async (req, res) => {
  const pages = await Page.find().sort('-createdAt');
  res.render('pages/index', { pages, lang: req.session.adminLang || 'en' });
});

app.get('/admin/pages/new', requireAuth, (req, res) => {
  res.render('pages/new', { page: null, lang: req.session.adminLang || 'en' });
});

app.post('/admin/pages', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const page = new Page(req.body);
    await page.save();
    res.redirect('/admin/pages');
  } catch (err) { res.status(400).send(err.message); }
});

app.get('/admin/pages/:id/edit', requireAuth, async (req, res) => {
  const page = await Page.findById(req.params.id);
  res.render('pages/edit', { page, lang: req.session.adminLang || 'en' });
});

app.put('/admin/pages/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/pages');
  } catch (err) { res.status(400).send(err.message); }
});

app.delete('/admin/pages/:id', requireAuth, async (req, res) => {
  await Page.findByIdAndDelete(req.params.id);
  res.redirect('/admin/pages');
});

// ─── Admin: Posts CRUD ───────────────────────────────────────────────────────
app.get('/admin/posts', requireAuth, async (req, res) => {
  const posts = await BlogPost.find().sort('-createdAt');
  res.render('posts/index', { posts, lang: req.session.adminLang || 'en' });
});

app.get('/admin/posts/new', requireAuth, (req, res) => {
  res.render('posts/new', { post: null, lang: req.session.adminLang || 'en' });
});

app.post('/admin/posts', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const post = new BlogPost(req.body);
    await post.save();
    res.redirect('/admin/posts');
  } catch (err) { res.status(400).send(err.message); }
});

app.get('/admin/posts/:id/edit', requireAuth, async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  res.render('posts/edit', { post, lang: req.session.adminLang || 'en' });
});

app.put('/admin/posts/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/posts');
  } catch (err) { res.status(400).send(err.message); }
});

app.delete('/admin/posts/:id', requireAuth, async (req, res) => {
  await BlogPost.findByIdAndDelete(req.params.id);
  res.redirect('/admin/posts');
});

// ─── Admin: Testimonials CRUD ────────────────────────────────────────────────
app.get('/admin/testimonials', requireAuth, async (req, res) => {
  const testimonials = await Testimonial.find().sort('-createdAt');
  res.render('testimonials/index', { testimonials, lang: req.session.adminLang || 'en' });
});

app.get('/admin/testimonials/new', requireAuth, (req, res) => {
  res.render('testimonials/new', { testimonial: null, lang: req.session.adminLang || 'en' });
});

app.post('/admin/testimonials', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const t = new Testimonial(req.body);
    await t.save();
    res.redirect('/admin/testimonials');
  } catch (err) { res.status(400).send(err.message); }
});

app.get('/admin/testimonials/:id/edit', requireAuth, async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  res.render('testimonials/edit', { testimonial, lang: req.session.adminLang || 'en' });
});

app.put('/admin/testimonials/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/testimonials');
  } catch (err) { res.status(400).send(err.message); }
});

app.delete('/admin/testimonials/:id', requireAuth, async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.redirect('/admin/testimonials');
});

// ─── Admin: Contact Info ─────────────────────────────────────────────────────
app.get('/admin/contact', requireAuth, async (req, res) => {
  let contactEn = await ContactInfo.findOne({ language: 'en' });
  let contactAr = await ContactInfo.findOne({ language: 'ar' });
  if (!contactEn) contactEn = new ContactInfo({ language: 'en' });
  if (!contactAr) contactAr = new ContactInfo({ language: 'ar' });
  res.render('contact', { contactEn, contactAr, lang: req.session.adminLang || 'en' });
});

app.post('/admin/contact', requireAuth, async (req, res) => {
  try {
    await ContactInfo.findOneAndUpdate({ language: 'en' }, req.body.en, { upsert: true, new: true });
    await ContactInfo.findOneAndUpdate({ language: 'ar' }, req.body.ar, { upsert: true, new: true });
    res.redirect('/admin/contact');
  } catch (err) { res.status(400).send(err.message); }
});

// ─── Admin: Change Password ──────────────────────────────────────────────────
app.get('/admin/settings', requireAuth, (req, res) => {
  res.render('settings', { error: null, success: null, lang: req.session.adminLang || 'en' });
});

app.post('/admin/settings', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!await user.comparePassword(currentPassword)) {
      return res.render('settings', { error: 'Current password is incorrect', success: null, lang: req.session.adminLang || 'en' });
    }
    if (newPassword !== confirmPassword) {
      return res.render('settings', { error: 'New passwords do not match', success: null, lang: req.session.adminLang || 'en' });
    }
    user.password = newPassword;
    await user.save();
    res.render('settings', { success: 'Password updated', error: null, lang: req.session.adminLang || 'en' });
  } catch (err) { res.status(400).send(err.message); }
});

// ─── Admin Router (services, team, faqs, site, media, users, activity) ───────
try {
  app.use('/admin', adminRoutes);
} catch (err) {
  console.error('Admin router error:', err.message);
}

// ─── Create Default Admin ────────────────────────────────────────────────────
async function createDefaultAdmin() {
  try {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      console.warn('ADMIN_USERNAME/PASSWORD not set — skipping admin creation');
      return;
    }
    const exists = await User.findOne({ username: process.env.ADMIN_USERNAME });
    if (!exists) {
      const admin = new User({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin created:', process.env.ADMIN_USERNAME);
    }
  } catch (err) {
    console.error('Error creating admin:', err.message);
  }
}

// ─── 404 + Error Handlers ────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.message, err.stack);
  globalErrorHandler(err, req, res, next);
});

// ─── Start Server (only locally, not on Vercel) ──────────────────────────────
const IS_VERCEL = !!process.env.VERCEL;
if (!IS_VERCEL && process.env.NODE_ENV !== 'production') {
  app.listen(port, async () => {
    await createDefaultAdmin();
    console.log('');
    console.log('========================================');
    console.log('Server:      http://localhost:' + port);
    console.log('Admin:       http://localhost:' + port + '/admin/login');
    console.log('Health:      http://localhost:' + port + '/health');
    console.log('Email:       ' + (emailReady ? 'Ready' : 'Not configured'));
    console.log('Cloudinary:  ' + (process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'));
    console.log('========================================');
  });
} else {
  console.log('[STARTUP] Serverless mode (Vercel) — app exported, no listen');
  // Fire-and-forget admin creation (runs on first cold start)
  createDefaultAdmin().catch(console.error);
}

// ─── Export for Vercel ───────────────────────────────────────────────────────
module.exports = app;