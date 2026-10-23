require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');
const nodemailer = require('nodemailer');
const { marked } = require('marked');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');

const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { requireAuth } = require('./middleware/auth');
const { upload } = require('./config/multer');
require('./config/cloudinary');

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

const adminRoutes = require('./routes/admin');
const contactHandler = require('./api/contact');

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', 1);
marked.setOptions({ breaks: true, gfm: true });

let emailReady = false;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
  });
  transporter.verify((error) => {
    if (error) console.error('Email config error:', error.message);
    else { emailReady = true; console.log('Email ready to send'); }
  });
}

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('DB Connected'))
    .catch((err) => console.error('DB Error:', err.message));
} else {
  console.error('[DB] MONGODB_URI is not defined — database operations will fail');
}


// ═══════════════════════════════════════════════════════════════════════════
// Dynamic main.js — الميجا منيو من DB (bulletproof)
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
app.get('/js/main.js', async (req, res, next) => {
  try {
    const services = await Service.find({
      published: true,
      showInMegaMenu: true
    }).sort({ category: 1, order: 1 }).lean();

    const grouped = { ip: [], disputes: [], corporate: [], contracts: [] };
    services.forEach(s => { if (grouped[s.category]) grouped[s.category].push(s); });

    const labelsMap = {
      ip:        { en: 'Intellectual Property', ar: 'الملكية الفكرية', icon: 'fa-trademark' },
      disputes:  { en: 'Litigation & Arbitration', ar: 'التقاضي والتحكيم', icon: 'fa-scale-balanced' },
      corporate: { en: 'Corporate Services', ar: 'خدمات الشركات', icon: 'fa-building' },
      contracts: { en: 'Contracts & Agreements', ar: 'العقود والاتفاقيات', icon: 'fa-file-signature' }
    };

    const categoriesData = ['ip', 'disputes', 'corporate', 'contracts']
      .filter(k => grouped[k].length > 0)
      .map(k => ({
        id: k,
        labelEn: labelsMap[k].en,
        labelAr: labelsMap[k].ar,
        icon: labelsMap[k].icon,
        services: grouped[k].map(s => ({
          nameEn: s.titleEn,
          nameAr: s.titleAr || s.titleEn,
          slug: s.slug,
          icon: s.icon || 'fa-circle'
        }))
      }));

    const jsPath = require('path').join(__dirname, 'public', 'js', 'main.js');
    let js = fs.readFileSync(jsPath, 'utf8');

    const dynamicCode = 'const categories = ' + JSON.stringify(categoriesData) + '.map(function(cat) {\n' +
      '      return {\n' +
      '        id: cat.id,\n' +
      '        label: isAr ? cat.labelAr : cat.labelEn,\n' +
      '        icon: cat.icon,\n' +
      '        services: cat.services.map(function(s) {\n' +
      '          return { name: isAr ? s.nameAr : s.nameEn, href: (isAr ? "/ar/" : "/") + s.slug, icon: s.icon };\n' +
      '        })\n' +
      '      };\n' +
      '    });';

    const before = js.length;
    js = js.replace(/const categories = \[[\s\S]*?\n\s*\];/, dynamicCode);

    res.type('application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    console.log('[mega] Served /js/main.js with ' + services.length + ' services (' + before + '->' + js.length + ' bytes)');
    res.send(js);
  } catch (err) {
    console.error('[mega] Dynamic main.js error:', err.message);
    next();
  }
});
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.post('/data/contact', contactHandler);

app.use('/data/services', require('./routes/public/services'));
app.use('/data/team', require('./routes/public/team'));
app.use('/data/faqs', require('./routes/public/faqs'));
app.use('/data/settings', require('./routes/public/settings'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// ✅ نسخة دفاعية: تعمل حتى لو المتغيرات مفقودة (للتشخيص)
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
    sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI, ttl: 24 * 60 * 60 });
    console.log('[SESSION] MongoStore initialized');
  } catch (err) {
    console.error('[SESSION] MongoStore failed:', err.message);
    console.warn('[SESSION] Falling back to MemoryStore — sessions will NOT persist');
  }
} else {
  console.warn('[SESSION] MONGODB_URI not set — using MemoryStore');
}
app.use(session(sessionConfig));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts.' });
app.use('/admin/login', loginLimiter);

app.use('/admin', (req, res, next) => {
  if (req.query.lang) req.session.adminLang = req.query.lang;
  res.locals.lang = req.session.adminLang || 'en';
  next();
});

function renderPageHTML(page, htmlContent, lang) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const base = isAr ? '/ar' : '';
  const slug = page.slug.replace(/-ar$/, '');
  const switchUrl = isAr ? '/' + slug : '/ar/' + slug;
  const switchLang = isAr ? 'English' : 'العربية';
  const brandName = isAr ? 'وليد أبوالعلا للمحاماة' : 'Walid Abo Al-Ela Law Firm';
  return '<!DOCTYPE html>\n<html lang="' + lang + '" dir="' + dir + '">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + (page.metaTitle || page.title) + '</title>\n' +
    '<meta name="description" content="' + (page.metaDescription || '') + '">\n' +
    '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">\n' +
    '<link rel="stylesheet" href="/css/style.css">\n' +
    '</head>\n<body>\n' +
    '<div class="language-switcher"><a href="' + switchUrl + '" class="lang-btn"><i class="fas fa-globe"></i> ' + switchLang + '</a></div>\n' +
    '<nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">\n' +
    '<div class="container"><a class="navbar-brand" href="' + (base || '/') + '"><img src="/images/logo arb ip.png" alt="' + brandName + '" style="height:45px;"></a></div>\n' +
    '</nav>\n' +
    '<header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:60px 0;text-align:center;">\n' +
    '<div class="container"><h1>' + page.title + '</h1></div>\n' +
    '</header>\n' +
    '<section style="padding:60px 0;"><div class="container"><div class="row"><div class="col-lg-8 mx-auto">' +
    htmlContent + '</div></div></div></section>\n' +
    '<footer style="background:#000;color:#fff;padding:40px 0;text-align:center;"><p>&copy; ' + new Date().getFullYear() + ' ' + brandName + '</p></footer>\n' +
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>\n' +
    '<script src="/js/main.js"></script>\n</body>\n</html>';
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
  return '<!DOCTYPE html>\n<html lang="' + lang + '" dir="' + dir + '">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + post.title + ' - ' + brandName + '</title>\n' +
    '<meta name="description" content="' + (post.excerpt || '') + '">\n' +
    '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">\n' +
    '<link rel="stylesheet" href="/css/style.css">\n</head>\n<body>\n' +
    '<div class="language-switcher"><a href="' + switchUrl + '" class="lang-btn"><i class="fas fa-globe"></i> ' + switchLang + '</a></div>\n' +
    '<nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">\n' +
    '<div class="container"><a class="navbar-brand" href="' + (base || '/') + '"><img src="/images/logo arb ip.png" alt="' + brandName + '" style="height:45px;"></a></div>\n' +
    '</nav>\n' +
    '<header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:60px 0;text-align:center;">\n' +
    '<div class="container"><h1>' + post.title + '</h1><p>' + formattedDate + '</p></div>\n' +
    '</header>\n' +
    '<section style="padding:60px 0;"><div class="container"><div class="row"><div class="col-lg-8 mx-auto">' +
    htmlContent +
    '<hr style="margin:40px 0;"><a href="' + base + '/blog.html">&larr; Back to Blog</a>' +
    '</div></div></div></section>\n' +
    '<footer style="background:#000;color:#fff;padding:40px 0;text-align:center;"><p>&copy; ' + new Date().getFullYear() + ' ' + brandName + '</p></footer>\n' +
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>\n' +
    '<script src="/js/main.js"></script>\n</body>\n</html>';
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
  return '<!DOCTYPE html>\n<html lang="' + lang + '" dir="' + dir + '">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + title + ' - ' + brandName + '</title>\n' +
    '<meta name="description" content="' + (shortDesc || '') + '">\n' +
    '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">\n' +
    '<link rel="stylesheet" href="/css/style.css">\n</head>\n<body>\n' +
    '<div class="language-switcher"><a href="' + switchUrl + '" class="lang-btn"><i class="fas fa-globe"></i> ' + switchLang + '</a></div>\n' +
    '<nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">\n' +
    '<div class="container"><a class="navbar-brand" href="' + (base || '/') + '"><img src="/images/logo arb ip.png" alt="' + brandName + '" style="height:45px;"></a></div>\n' +
    '</nav>\n' +
    '<header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:80px 0;text-align:center;">\n' +
    '<div class="container">\n' +
    '<div style="width:80px;height:80px;background:linear-gradient(135deg,#C9A961,#A88947);color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 25px;"><i class="fas ' + iconClass + '"></i></div>\n' +
    '<h1>' + title + '</h1>\n' +
    (shortDesc ? '<p style="color:rgba(255,255,255,0.85);font-size:1.1rem;max-width:650px;margin:15px auto 0;">' + shortDesc + '</p>\n' : '') +
    '</div>\n</header>\n' +
    '<section style="padding:60px 0;"><div class="container"><div class="row"><div class="col-lg-8 mx-auto">\n' +
    (service.image ? '<img src="' + service.image + '" alt="' + title + '" style="max-width:100%;border-radius:12px;margin-bottom:30px;">\n' : '') +
    (htmlContent || '<p>' + (isAr ? 'المحتوى قيد الإعداد.' : 'Content coming soon.') + '</p>') +
    '<hr style="margin:40px 0;"><a href="' + base + '/services.html">&larr; Back to Services</a>\n' +
    '</div></div></div></section>\n' +
    '<footer style="background:#000;color:#fff;padding:40px 0;text-align:center;"><p>&copy; ' + new Date().getFullYear() + ' ' + brandName + '</p></footer>\n' +
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>\n' +
    '<script src="/js/main.js"></script>\n</body>\n</html>';
}

const staticPageSlugs = [
  'about', 'services', 'arbitration', 'trademark', 'patent', 'copyright',
  'litigation', 'licensing', 'lawyers', 'blog', 'contact', 'client-portal',
  'consultation', 'success', 'cancel', 'admin', 'ar', 'images', 'css', 'js',
  'uploads', 'api', 'favicon.ico', 'robots.txt', 'sitemap.xml'
];

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, 'public', 'services.html')));
app.get('/arbitration', (req, res) => res.sendFile(path.join(__dirname, 'public', 'arbitration.html')));
app.get('/trademark', (req, res) => res.sendFile(path.join(__dirname, 'public', 'trademark.html')));
app.get('/patent', (req, res) => res.sendFile(path.join(__dirname, 'public', 'patent.html')));
app.get('/copyright', (req, res) => res.sendFile(path.join(__dirname, 'public', 'copyright.html')));
app.get('/litigation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'litigation.html')));
app.get('/licensing', (req, res) => res.sendFile(path.join(__dirname, 'public', 'licensing.html')));
app.get('/lawyers', (req, res) => res.sendFile(path.join(__dirname, 'public', 'lawyers.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'blog.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/client-portal', (req, res) => res.sendFile(path.join(__dirname, 'public', 'client-portal.html')));
app.get('/consultation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'consultation.html')));
app.get('/success', (req, res) => res.sendFile(path.join(__dirname, 'public', 'success.html')));
app.get('/cancel', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cancel.html')));

app.get('/ar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'index.html')));
app.get('/ar/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'about.html')));
app.get('/ar/services', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'services.html')));
app.get('/ar/arbitration', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'arbitration.html')));
app.get('/ar/trademark', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'trademark.html')));
app.get('/ar/patent', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'patent.html')));
app.get('/ar/copyright', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'copyright.html')));
app.get('/ar/litigation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'litigation.html')));
app.get('/ar/licensing', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'licensing.html')));
app.get('/ar/lawyers', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'lawyers.html')));
app.get('/ar/blog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'blog.html')));
app.get('/ar/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'contact.html')));
app.get('/ar/client-portal', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'client-portal.html')));
app.get('/ar/consultation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'consultation.html')));
app.get('/ar/success', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'success.html')));
app.get('/ar/cancel', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'cancel.html')));

app.get('/:page', async (req, res, next) => {
  if (staticPageSlugs.indexOf(req.params.page) !== -1) return next();
  try {
    const service = await Service.findOne({ slug: req.params.page, published: true });
    if (service) return res.send(renderServiceHTML(service, 'en'));
    const page = await Page.findOne({ slug: req.params.page, language: 'en', published: true });
    if (page) {
      const htmlContent = marked.parse(page.content || '');
      return res.send(renderPageHTML(page, htmlContent, 'en'));
    }
    next();
  } catch (error) {
    console.error('Dynamic page error:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/ar/:page', async (req, res, next) => {
  if (staticPageSlugs.indexOf(req.params.page) !== -1) return next();
  try {
    const service = await Service.findOne({ slug: req.params.page, published: true });
    if (service) return res.send(renderServiceHTML(service, 'ar'));
    const page = await Page.findOne({ slug: req.params.page + '-ar', language: 'ar', published: true });
    if (page) {
      const htmlContent = marked.parse(page.content || '');
      return res.send(renderPageHTML(page, htmlContent, 'ar'));
    }
    next();
  } catch (error) {
    console.error('Dynamic Arabic page error:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/blog/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, language: 'en', published: true });
    if (post) {
      post.views = (post.views || 0) + 1;
      await post.save();
      const htmlContent = marked.parse(post.content || '');
      return res.send(renderBlogHTML(post, htmlContent, 'en'));
    }
    next();
  } catch (error) {
    console.error('Blog error:', error);
    res.status(500).send('Server Error');
  }
});

app.get('/ar/blog/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug + '-ar', language: 'ar', published: true });
    if (post) {
      post.views = (post.views || 0) + 1;
      await post.save();
      const htmlContent = marked.parse(post.content || '');
      return res.send(renderBlogHTML(post, htmlContent, 'ar'));
    }
    next();
  } catch (error) {
    console.error('Blog error:', error);
    res.status(500).send('Server Error');
  }
});

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
  } catch (error) {
    res.render('login', { error: 'Login error: ' + error.message, lang: req.body.lang || 'en' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

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
      pages: results[0],
      posts: results[1],
      testimonials: results[2],
      messages: results[3],
      newMessages: results[4],
      services: results[5],
      team: results[6],
      faqs: results[7],
      media: results[8],
      users: results[9],
      user: req.session.username,
      lang: req.session.adminLang || 'en'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Dashboard error: ' + error.message);
  }
});

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
  } catch (error) { res.status(400).send(error.message); }
});

app.get('/admin/pages/:id/edit', requireAuth, async (req, res) => {
  const page = await Page.findById(req.params.id);
  res.render('pages/edit', { page, lang: req.session.adminLang || 'en' });
});

app.put('/admin/pages/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/pages');
  } catch (error) { res.status(400).send(error.message); }
});

app.delete('/admin/pages/:id', requireAuth, async (req, res) => {
  await Page.findByIdAndDelete(req.params.id);
  res.redirect('/admin/pages');
});

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
  } catch (error) { res.status(400).send(error.message); }
});

app.get('/admin/posts/:id/edit', requireAuth, async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  res.render('posts/edit', { post, lang: req.session.adminLang || 'en' });
});

app.put('/admin/posts/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/posts');
  } catch (error) { res.status(400).send(error.message); }
});

app.delete('/admin/posts/:id', requireAuth, async (req, res) => {
  await BlogPost.findByIdAndDelete(req.params.id);
  res.redirect('/admin/posts');
});

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
  } catch (error) { res.status(400).send(error.message); }
});

app.get('/admin/testimonials/:id/edit', requireAuth, async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  res.render('testimonials/edit', { testimonial, lang: req.session.adminLang || 'en' });
});

app.put('/admin/testimonials/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/testimonials');
  } catch (error) { res.status(400).send(error.message); }
});

app.delete('/admin/testimonials/:id', requireAuth, async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.redirect('/admin/testimonials');
});

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
  } catch (error) { res.status(400).send(error.message); }
});

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
    res.render('settings', { success: 'Password updated successfully', error: null, lang: req.session.adminLang || 'en' });
  } catch (error) { res.status(400).send(error.message); }
});

app.use('/admin', adminRoutes);

async function createDefaultAdmin() {
  try {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) return;
    const exists = await User.findOne({ username: process.env.ADMIN_USERNAME });
    if (!exists) {
      const admin = new User({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin created:', process.env.ADMIN_USERNAME);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin:', error.message);
  }
}

app.use(notFoundHandler);
app.use(globalErrorHandler);

// ✅ لا تستدعِ app.listen على Vercel (VERCEL env var موجود تلقائياً هناك)
const IS_VERCEL = !!process.env.VERCEL;
if (!IS_VERCEL && process.env.NODE_ENV !== 'production') {
  app.listen(port, async () => {
    await createDefaultAdmin();
    console.log('');
    console.log('========================================');
    console.log('Server:      http://localhost:' + port);
    console.log('Admin:       http://localhost:' + port + '/admin/login');
    console.log('Email:       ' + (emailReady ? 'Ready' : 'Not configured'));
    console.log('Cloudinary:  ' + (process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'));
    console.log('========================================');
  });
} else {
  console.log('[STARTUP] Running on Vercel (serverless) — skipping app.listen');
  createDefaultAdmin().catch(console.error);
}

module.exports = app;
