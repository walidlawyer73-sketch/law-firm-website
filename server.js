// ============================================================================
// server.js — مكتب وليد أبو العلا للمحاماة
// الخادم الرئيسي — يعمل محلياً وعلى Vercel
// الإصدار: 2.1 (مفروض — مع تعليقات عربية)
// ============================================================================

// ─── تحميل المتغيرات البيئية من .env ─────────────────────────────────────
require('dotenv').config();

// ─── الاستيرادات الأساسية ────────────────────────────────────────────────
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const methodOverride = require('method-override');
const nodemailer = require('nodemailer');
const { marked } = require('marked');
const rateLimit = require('express-rate-limit');

// ─── الاستيرادات المخصصة (Middleware & Config) ───────────────────────────
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { requireAuth } = require('./middleware/auth');
const { upload } = require('./config/multer');

// ─── تهيئة Cloudinary (اختياري — لا يوقف السيرفر عند الفشل) ──────────────
try {
  require('./config/cloudinary');
} catch (e) {
  console.warn('⚠️  تخطي تهيئة Cloudinary:', e.message);
}

// ─── استيراد نماذج قاعدة البيانات (Models) ───────────────────────────────
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

// ─── مسارات لوحة التحكم ──────────────────────────────────────────────────
const adminRoutes = require('./routes/admin');

// ─── تهيئة تطبيق Express ─────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 3000;
app.set('trust proxy', 1); // ضروري على Vercel للحصول على IP الصحيح

// ─── إعداد محول Markdown إلى HTML ────────────────────────────────────────
marked.setOptions({
  breaks: true,  // تحويل السطور الجديدة إلى <br>
  gfm: true      // تفعيل GitHub Flavored Markdown
});

// ============================================================================
// قسم 1: الاتصال بقاعدة البيانات MongoDB
// ============================================================================
// ملاحظة: نحتفظ بمتغير cachedConnection لإعادة استخدام الاتصال
// على Vercel (Serverless) يتم استدعاء الدالة عند كل cold start
// ============================================================================

let cachedConnection = null;

// ─── دالة تنظيف رابط الاتصال من علامات الاقتباس والمسافات ────────────────
// السبب: عند نسخ الرابط من .env إلى Vercel، قد تُلصق علامات اقتباس خطأ
function getMongoUri() {
  const raw = process.env.MONGODB_URI || '';
  const cleaned = raw.trim().replace(/^["'`]+|["'`]+$/g, '').trim();
  if (!/^mongodb(\+srv)?:\/\//.test(cleaned)) {
    console.error('[DB] رابط MONGODB_URI غير صالح. يبدأ بـ:', JSON.stringify(cleaned.substring(0, 20)));
    return null;
  }
  console.log('[DB] الرابط صالح، الطول:', cleaned.length);
  return cleaned;
}

// ─── دالة الاتصال بقاعدة البيانات (تدعم إعادة الاستخدام) ─────────────────
async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  const uri = getMongoUri();
  if (!uri) {
    throw new Error('MONGODB_URI مفقود أو غير صالح');
  }
  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // فشل سريع بدلاً من التعليق
      socketTimeoutMS: 45000,
      maxPoolSize: 10 // لا نخزن أوامر قبل الاتصال
    });
    console.log('✅ تم الاتصال بقاعدة البيانات');
    return cachedConnection;
  } catch (err) {
    cachedConnection = null;
    global.__dbLastError = err.message + ' | code: ' + (err.code || 'no-code');
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', global.__dbLastError);
    throw err;
  }
}

// ============================================================================
// قسم 2: إعداد البريد الإلكتروني (اختياري — لا يوقف السيرفر)
// ============================================================================

let emailReady = false;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });
    transporter.verify((err) => {
      if (err) {
        console.error('خطأ في التحقق من البريد:', err.message);
      } else {
        emailReady = true;
        console.log('✅ البريد جاهز للإرسال');
      }
    });
  } catch (err) {
    console.error('فشل إعداد البريد:', err.message);
  }
}

// ============================================================================
// قسم 3: خدمة الملفات الثابتة (يجب أن تكون قبل Middleware قاعدة البيانات)
// ============================================================================
// لماذا قبل؟ حتى لا تنتظر الصور وCSS وJS اتصال قاعدة البيانات
// ============================================================================

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// ============================================================================
// قسم 4: فحص صحة السيرفر (Health Check)
// ============================================================================
// هذا المسار لا يعتمد على قاعدة البيانات — يعرض حالة الاتصال فقط
// مفيد جداً لتشخيص مشاكل Vercel
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState,
    dbStateLabel: ['disconnected','connected','connecting','disconnecting'][mongoose.connection.readyState] || 'unknown',
    dbError: global.__dbLastError || null, // 0=غير متصل، 1=متصل، 2=يتصل، 3=ينفصل
    env: {
      nodeEnv: process.env.NODE_ENV || 'undefined',
      vercel: process.env.VERCEL === '1',
      mongodb: !!process.env.MONGODB_URI,
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
      sessionSecret: !!process.env.SESSION_SECRET,
      email: !!process.env.EMAIL_USER
    }
  });
});

// ============================================================================
// قسم 5: تحليل أجسام الطلبات (Body Parsers)
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // لاستخدام PUT/DELETE من نماذج HTML

// ============================================================================
// قسم 6: إعداد الجلسات (Sessions)
// ============================================================================
// نستخدم MemoryStore للبساطة (لن تُحفظ الجلسات بين عمليات إعادة النشر)
// في الإنتاج يمكن استبدالها بـ connect-mongo أو redis
// ============================================================================

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: getMongoUri(),
    ttl: 24 * 60 * 60,
    autoRemove: 'native',
    touchAfter: 24 * 3600
  }),
  cookie: {
    secure: process.env.VERCEL === '1',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// ============================================================================
// قسم 7: Middleware الاتصال بقاعدة البيانات (يستثني الملفات الثابتة)
// ============================================================================
// كل طلب يحتاج قاعدة بيانات يجب أن ينتظر الاتصال (أو إعادة استخدامه)
// ============================================================================

app.use(async (req, res, next) => {
  // تخطي مسار الصحة والملفات الثابتة
  if (req.path === '/health') return next();
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|map)$/)) return next();

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB Middleware]', err.message);
    return res.status(503).json({
      error: 'قاعدة البيانات غير متاحة',
      details: err.message
    });
  }
});

// ============================================================================
// قسم 8: إعداد محرك القوالب (EJS)
// ============================================================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================================================
// قسم 9: الحد من محاولات تسجيل الدخول (Rate Limiting)
// ============================================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 20,                    // 20 محاولة
  message: 'محاولات دخول كثيرة. حاول بعد 15 دقيقة.',
  skip: (req) => process.env.NODE_ENV !== 'production' // معطل محلياً
});
app.use('/admin/login', loginLimiter);

// ============================================================================
// قسم 10: Middleware اللغة في لوحة التحكم
// ============================================================================

app.use('/admin', (req, res, next) => {
  if (req.query.lang) req.session.adminLang = req.query.lang;
  res.locals.lang = req.session.adminLang || 'en';
  next();
});

// ============================================================================
// قسم 11: دوال عرض HTML للصفحات الديناميكية
// ============================================================================

// ─── 11.1: عرض صفحة عادية (Page) ─────────────────────────────────────────
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.metaTitle || page.title}</title>
  <meta name="description" content="${page.metaDescription || ''}">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <!-- زر تبديل اللغة -->
  <div class="language-switcher">
    <a href="${switchUrl}" class="lang-btn">
      <i class="fas fa-globe"></i> ${switchLang}
    </a>
  </div>

  <!-- شريط التنقل -->
  <nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">
    <div class="container">
      <a class="navbar-brand" href="${base || '/'}">
        <img src="/images/logo arb ip.png" alt="${brandName}" style="height:45px;">
      </a>
    </div>
  </nav>

  <!-- رأس الصفحة -->
  <header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:60px 0;text-align:center;">
    <div class="container">
      <h1>${page.title}</h1>
    </div>
  </header>

  <!-- محتوى الصفحة -->
  <section style="padding:60px 0;">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          ${htmlContent}
        </div>
      </div>
    </div>
  </section>

  <!-- التذييل -->
  <footer style="background:#000;color:#fff;padding:40px 0;text-align:center;">
    <p>&copy; ${new Date().getFullYear()} ${brandName}</p>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

// ─── 11.2: عرض مقال مدونة (Blog Post) ────────────────────────────────────
function renderBlogHTML(post, htmlContent, lang) {
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const base = isAr ? '/ar' : '';
  const slug = post.slug.replace(/-ar$/, '');
  const switchUrl = isAr ? '/blog/' + slug : '/ar/blog/' + slug;
  const switchLang = isAr ? 'English' : 'العربية';
  const brandName = isAr ? 'وليد أبوالعلا للمحاماة' : 'Walid Abo Al-Ela Law Firm';
  const dateLocale = isAr ? 'ar-EG' : 'en-US';
  const formattedDate = new Date(post.createdAt).toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} - ${brandName}</title>
  <meta name="description" content="${post.excerpt || ''}">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <!-- زر تبديل اللغة -->
  <div class="language-switcher">
    <a href="${switchUrl}" class="lang-btn">
      <i class="fas fa-globe"></i> ${switchLang}
    </a>
  </div>

  <!-- شريط التنقل -->
  <nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">
    <div class="container">
      <a class="navbar-brand" href="${base || '/'}">
        <img src="/images/logo arb ip.png" alt="${brandName}" style="height:45px;">
      </a>
    </div>
  </nav>

  <!-- رأس المقال -->
  <header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:60px 0;text-align:center;">
    <div class="container">
      <h1>${post.title}</h1>
      <p>${formattedDate}</p>
    </div>
  </header>

  <!-- محتوى المقال -->
  <section style="padding:60px 0;">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          ${htmlContent}
          <hr style="margin:40px 0;">
          <a href="${base}/blog.html">&larr; العودة إلى المدونة</a>
        </div>
      </div>
    </div>
  </section>

  <!-- التذييل -->
  <footer style="background:#000;color:#fff;padding:40px 0;text-align:center;">
    <p>&copy; ${new Date().getFullYear()} ${brandName}</p>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

// ─── 11.3: عرض خدمة (Service) ────────────────────────────────────────────
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
  const backText = isAr ? 'العودة إلى الخدمات' : 'Back to Services';

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${brandName}</title>
  <meta name="description" content="${shortDesc || ''}">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <!-- زر تبديل اللغة -->
  <div class="language-switcher">
    <a href="${switchUrl}" class="lang-btn">
      <i class="fas fa-globe"></i> ${switchLang}
    </a>
  </div>

  <!-- شريط التنقل -->
  <nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background:#000;">
    <div class="container">
      <a class="navbar-brand" href="${base || '/'}">
        <img src="/images/logo arb ip.png" alt="${brandName}" style="height:45px;">
      </a>
    </div>
  </nav>

  <!-- رأس الخدمة -->
  <header style="margin-top:78px;background:linear-gradient(135deg,#000,#1a1a1a);color:#fff;padding:80px 0;text-align:center;">
    <div class="container">
      <div style="width:80px;height:80px;background:linear-gradient(135deg,#C9A961,#A88947);color:#000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 25px;">
        <i class="fas ${iconClass}"></i>
      </div>
      <h1>${title}</h1>
      ${shortDesc ? `<p style="color:rgba(255,255,255,0.85);max-width:650px;margin:15px auto 0;">${shortDesc}</p>` : ''}
    </div>
  </header>

  <!-- محتوى الخدمة -->
  <section style="padding:60px 0;">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          ${service.image ? `<img src="${service.image}" alt="${title}" style="max-width:100%;border-radius:12px;margin-bottom:30px;">` : ''}
          ${htmlContent || '<p>المحتوى قيد الإعداد.</p>'}
          <hr style="margin:40px 0;">
          <a href="${base}/services.html">&larr; ${backText}</a>
        </div>
      </div>
    </div>
  </section>

  <!-- التذييل -->
  <footer style="background:#000;color:#fff;padding:40px 0;text-align:center;">
    <p>&copy; ${new Date().getFullYear()} ${brandName}</p>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

// ============================================================================
// قسم 12: نموذج التواصل (POST /data/contact)
// ============================================================================

const handleContact = async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    // التحقق من الحقول المطلوبة
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'الاسم والبريد والرسالة مطلوبة'
      });
    }

    // حفظ الرسالة في قاعدة البيانات
    const contact = await Contact.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      service: service || 'general',
      message: String(message)
    });

    res.json({ success: true, id: contact._id });
  } catch (err) {
    console.error('خطأ في نموذج التواصل:', err.message);
    res.status(500).json({ error: 'خطأ في السيرفر: ' + err.message });
  }
};

// مساران: واحد جديد (/data) وآخر للتوافق (/api)
app.post('/data/contact', handleContact);
app.post('/api/contact', handleContact);

// ============================================================================
// قسم 13: واجهات API العامة
// ============================================================================

try { app.use('/data/services', require('./routes/public/services')); } catch (e) { console.warn('تخطي مسار services:', e.message); }
try { app.use('/data/team', require('./routes/public/team')); } catch (e) { console.warn('تخطي مسار team:', e.message); }
try { app.use('/data/faqs', require('./routes/public/faqs')); } catch (e) { console.warn('تخطي مسار faqs:', e.message); }
try { app.use('/data/settings', require('./routes/public/settings')); } catch (e) { console.warn('تخطي مسار settings:', e.message); }
try { app.use('/', require('./routes/public/sitemap')); } catch (e) { console.warn('تخطي sitemap:', e.message); }
try { app.use('/', require('./routes/public/robots')); } catch (e) { console.warn('تخطي robots:', e.message); }

// ============================================================================
// قسم 14: المسارات الثابتة للصفحات (EN + AR)
// ============================================================================

const staticPagesEN = [
  'about', 'services', 'arbitration', 'trademark', 'patent', 'copyright',
  'litigation', 'licensing', 'lawyers', 'blog', 'contact', 'client-portal',
  'consultation', 'success', 'cancel', 'privacy-policy', 'terms-of-service', 'cookie-policy'
];

staticPagesEN.forEach((slug) => {
  // النسخة الإنجليزية
  app.get('/' + slug, (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', slug + '.html'), (err) => {
      if (err) next();
    });
  });

  // النسخة العربية
  app.get('/ar/' + slug, (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', 'ar', slug + '.html'), (err) => {
      if (err) next();
    });
  });
});

// الصفحة الرئيسية
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/ar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ar', 'index.html')));

// ============================================================================
// قسم 15: المسارات الديناميكية (Services & Pages)
// ============================================================================

const staticPageSlugs = [
  'about', 'services', 'arbitration', 'trademark', 'patent', 'copyright',
  'litigation', 'licensing', 'lawyers', 'blog', 'contact', 'client-portal',
  'consultation', 'success', 'cancel', 'admin', 'ar', 'images', 'css', 'js',
  'uploads', 'api', 'data', 'health', 'favicon.ico', 'robots.txt', 'sitemap.xml',
  'privacy-policy', 'terms-of-service', 'cookie-policy'
];

// ─── 15.1: صفحة ديناميكية إنجليزية ──────────────────────────────────────
app.get('/:page', async (req, res, next) => {
  if (staticPageSlugs.includes(req.params.page)) return next();

  try {
    // البحث في الخدمات أولاً
    const service = await Service.findOne({ slug: req.params.page, published: true });
    if (service) return res.send(renderServiceHTML(service, 'en'));

    // ثم في الصفحات
    const page = await Page.findOne({ slug: req.params.page, language: 'en', published: true });
    if (page) return res.send(renderPageHTML(page, marked.parse(page.content || ''), 'en'));

    next();
  } catch (err) {
    console.error('خطأ في الصفحة الديناميكية:', err.message);
    next();
  }
});

// ─── 15.2: صفحة ديناميكية عربية ─────────────────────────────────────────
app.get('/ar/:page', async (req, res, next) => {
  if (staticPageSlugs.includes(req.params.page)) return next();

  try {
    const service = await Service.findOne({ slug: req.params.page, published: true });
    if (service) return res.send(renderServiceHTML(service, 'ar'));

    const page = await Page.findOne({
      slug: req.params.page + '-ar',
      language: 'ar',
      published: true
    });
    if (page) return res.send(renderPageHTML(page, marked.parse(page.content || ''), 'ar'));

    next();
  } catch (err) {
    console.error('خطأ في الصفحة العربية الديناميكية:', err.message);
    next();
  }
});

// ============================================================================
// قسم 16: مسارات المدونة
// ============================================================================

// ─── 16.1: مقال إنجليزي ─────────────────────────────────────────────────
app.get('/blog/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      language: 'en',
      published: true
    });
    if (!post) return next();

    // زيادة عدد المشاهدات
    post.views = (post.views || 0) + 1;
    await post.save();

    res.send(renderBlogHTML(post, marked.parse(post.content || ''), 'en'));
  } catch (err) {
    console.error('خطأ في مقال المدونة:', err.message);
    next();
  }
});

// ─── 16.2: مقال عربي ────────────────────────────────────────────────────
app.get('/ar/blog/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug + '-ar',
      language: 'ar',
      published: true
    });
    if (!post) return next();

    post.views = (post.views || 0) + 1;
    await post.save();

    res.send(renderBlogHTML(post, marked.parse(post.content || ''), 'ar'));
  } catch (err) {
    console.error('خطأ في المقال العربي:', err.message);
    next();
  }
});

// ============================================================================
// قسم 17: لوحة التحكم — تسجيل الدخول والخروج
// ============================================================================

// ─── 17.1: صفحة تسجيل الدخول ────────────────────────────────────────────
// ─── توليد كلمة مرور عشوائية ───
function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '!A1'; // نضيف لاحقة لضمان التعقيد
}
// ─── صفحة نسيت كلمة المرور ───
app.get('/admin/forgot-password', (req, res) => {
  res.render('forgot-password', { error: null, success: null });
});
// ─── معالجة نسيت كلمة المرور ───
app.post('/admin/forgot-password', async (req, res) => {
  const { identifier } = req.body;

  try {
    if (!identifier) {
      return res.render('forgot-password', { 
        error: 'أدخل اسم المستخدم أو البريد الإلكتروني', 
        success: null 
      });
    }

    // البحث بالـ username أو email
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.render('forgot-password', { 
        error: 'لا يوجد حساب بهذه البيانات', 
        success: null 
      });
    }

    if (!user.email) {
      return res.render('forgot-password', { 
        error: 'لا يوجد بريد إلكتروني مسجل لهذا الحساب. راجع المسؤول', 
        success: null 
      });
    }

    // التحقق من إعدادات البريد
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.render('forgot-password', { 
        error: 'البريد الإلكتروني غير مضبوط على السيرفر', 
        success: null 
      });
    }

    // توليد كلمة مرور جديدة
    const newPassword = generateRandomPassword();

    // تحديث كلمة المرور في قاعدة البيانات
    user.password = newPassword;
    await user.save();

    // إرسال البريد
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"مكتب وليد أبو العلا" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'بيانات الدخول الجديدة - لوحة التحكم',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #C9A961;">بيانات الدخول الجديدة</h2>
          <p>تم إعادة تعيين كلمة المرور الخاصة بحسابك.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px;"><strong>اسم المستخدم:</strong></p>
            <p style="margin: 0; font-size: 18px; color: #C9A961;">${user.username}</p>
            <p style="margin: 20px 0 10px;"><strong>كلمة المرور الجديدة:</strong></p>
            <p style="margin: 0; font-size: 18px; font-family: monospace; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">${newPassword}</p>
          </div>
          <p style="color: #dc3545;"><strong>⚠️ غيّر كلمة المرور بعد الدخول مباشرة من:</strong></p>
          <p><a href="https://law-arb-ip-walid.vercel.app/admin/settings" style="color: #C9A961;">صفحة الإعدادات</a></p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p><a href="https://law-arb-ip-walid.vercel.app/admin/login" style="display: inline-block; background: #C9A961; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">تسجيل الدخول الآن</a></p>
        </div>
      `
    });

    return res.render('forgot-password', { 
      error: null,
      success: `✅ تم إرسال كلمة المرور الجديدة إلى ${user.email}. افحص صندوق الوارد والبريد المزعج (Spam).`
    });

  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.render('forgot-password', { 
      error: 'حدث خطأ: ' + err.message, 
      success: null 
    });
  }
});

app.get('/admin/login', (req, res) => {
  res.render('login', { error: null, lang: req.query.lang || 'en' });
});

// ─── 17.2: معالجة تسجيل الدخول ──────────────────────────────────────────
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && await user.comparePassword(password)) {
      // حفظ بيانات المستخدم في الجلسة
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.role = user.role || 'admin';

      // تحديث وقت آخر دخول
      user.lastLoginAt = new Date();
      await user.save();

      return res.redirect('/admin/dashboard');
    }

    res.render('login', {
      error: 'بيانات الدخول غير صحيحة',
      lang: req.body.lang || 'en'
    });
  } catch (err) {
    res.render('login', {
      error: 'خطأ في تسجيل الدخول: ' + err.message,
      lang: req.body.lang || 'en'
    });
  }
});

// ─── 17.3: تسجيل الخروج ─────────────────────────────────────────────────
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ============================================================================
// قسم 18: لوحة التحكم — الصفحة الرئيسية (Dashboard)
// ============================================================================

app.get('/admin/dashboard', requireAuth, async (req, res) => {
  try {
    // جلب الإحصائيات بالتوازي (أسرع)
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
  } catch (err) {
    console.error('خطأ في الداشبورد:', err.message);
    res.status(500).send('خطأ في الداشبورد: ' + err.message);
  }
});

// ============================================================================
// قسم 19: لوحة التحكم — إدارة الرسائل
// ============================================================================

// ─── 19.1: قائمة الرسائل ────────────────────────────────────────────────
app.get('/admin/messages', requireAuth, async (req, res) => {
  const messages = await Contact.find().sort('-createdAt');
  res.render('messages/index', { messages, lang: req.session.adminLang || 'en' });
});

// ─── 19.2: عرض رسالة واحدة ──────────────────────────────────────────────
app.get('/admin/messages/:id', requireAuth, async (req, res) => {
  const message = await Contact.findById(req.params.id);
  if (!message) return res.status(404).send('الرسالة غير موجودة');

  // تحويل الحالة إلى "مقروءة"
  if (message.status === 'new') {
    message.status = 'read';
    await message.save();
  }

  res.render('messages/show', { message, lang: req.session.adminLang || 'en' });
});

// ─── 19.3: حذف رسالة ────────────────────────────────────────────────────
app.delete('/admin/messages/:id', requireAuth, async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.redirect('/admin/messages');
});

// ============================================================================
// قسم 20: لوحة التحكم — إدارة الصفحات (CRUD)
// ============================================================================

// ─── 20.1: قائمة الصفحات ────────────────────────────────────────────────
app.get('/admin/pages', requireAuth, async (req, res) => {
  const pages = await Page.find().sort('-createdAt');
  res.render('pages/index', { pages, lang: req.session.adminLang || 'en' });
});

// ─── 20.2: صفحة إضافة جديدة ─────────────────────────────────────────────
app.get('/admin/pages/new', requireAuth, (req, res) => {
  res.render('pages/new', { page: null, lang: req.session.adminLang || 'en' });
});

// ─── 20.3: إنشاء صفحة جديدة ─────────────────────────────────────────────
app.post('/admin/pages', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const page = new Page(req.body);
    await page.save();
    res.redirect('/admin/pages');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// ─── 20.4: صفحة تعديل ───────────────────────────────────────────────────
app.get('/admin/pages/:id/edit', requireAuth, async (req, res) => {
  const page = await Page.findById(req.params.id);
  res.render('pages/edit', { page, lang: req.session.adminLang || 'en' });
});

// ─── 20.5: تحديث صفحة ───────────────────────────────────────────────────
app.put('/admin/pages/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/pages');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// ─── 20.6: حذف صفحة ─────────────────────────────────────────────────────
app.delete('/admin/pages/:id', requireAuth, async (req, res) => {
  await Page.findByIdAndDelete(req.params.id);
  res.redirect('/admin/pages');
});

// ============================================================================
// قسم 21: لوحة التحكم — إدارة المقالات (CRUD)
// ============================================================================

// ─── 21.1: قائمة المقالات ───────────────────────────────────────────────
app.get('/admin/posts', requireAuth, async (req, res) => {
  const posts = await BlogPost.find().sort('-createdAt');
  res.render('posts/index', { posts, lang: req.session.adminLang || 'en' });
});

// ─── 21.2: صفحة إضافة جديدة ─────────────────────────────────────────────
app.get('/admin/posts/new', requireAuth, (req, res) => {
  res.render('posts/new', { post: null, lang: req.session.adminLang || 'en' });
});

// ─── 21.3: إنشاء مقال جديد ──────────────────────────────────────────────
app.post('/admin/posts', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const post = new BlogPost(req.body);
    await post.save();
    res.redirect('/admin/posts');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// ─── 21.4: صفحة تعديل ───────────────────────────────────────────────────
app.get('/admin/posts/:id/edit', requireAuth, async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  res.render('posts/edit', { post, lang: req.session.adminLang || 'en' });
});

// ─── 21.5: تحديث مقال ───────────────────────────────────────────────────
app.put('/admin/posts/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/posts');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// ─── 21.6: حذف مقال ─────────────────────────────────────────────────────
app.delete('/admin/posts/:id', requireAuth, async (req, res) => {
  await BlogPost.findByIdAndDelete(req.params.id);
  res.redirect('/admin/posts');
});

// ============================================================================
// قسم 22: لوحة التحكم — إدارة آراء العملاء (Testimonials)
// ============================================================================

// ─── 22.1: قائمة الآراء ─────────────────────────────────────────────────
app.get('/admin/testimonials', requireAuth, async (req, res) => {
  const testimonials = await Testimonial.find().sort('-createdAt');
  res.render('testimonials/index', { testimonials, lang: req.session.adminLang || 'en' });
});

// ─── 22.2: صفحة إضافة جديدة ─────────────────────────────────────────────
app.get('/admin/testimonials/new', requireAuth, (req, res) => {
  res.render('testimonials/new', { testimonial: null, lang: req.session.adminLang || 'en' });
});

// ─── 22.3: إنشاء رأي جديد ───────────────────────────────────────────────
app.post('/admin/testimonials', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const t = new Testimonial(req.body);
    await t.save();
    res.redirect('/admin/testimonials');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// ─── 22.4: صفحة تعديل ───────────────────────────────────────────────────
app.get('/admin/testimonials/:id/edit', requireAuth, async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  res.render('testimonials/edit', { testimonial, lang: req.session.adminLang || 'en' });
});

// ─── 22.5: تحديث رأي ────────────────────────────────────────────────────
app.put('/admin/testimonials/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/admin/testimonials');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// ─── 22.6: حذف رأي ──────────────────────────────────────────────────────
app.delete('/admin/testimonials/:id', requireAuth, async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.redirect('/admin/testimonials');
});

// ============================================================================
// قسم 23: لوحة التحكم — معلومات الاتصال
// ============================================================================

// ─── 23.1: عرض معلومات الاتصال ──────────────────────────────────────────
app.get('/admin/contact', requireAuth, async (req, res) => {
  let contactEn = await ContactInfo.findOne({ language: 'en' }) || new ContactInfo({ language: 'en' });
  let contactAr = await ContactInfo.findOne({ language: 'ar' }) || new ContactInfo({ language: 'ar' });
  res.render('contact', { contactEn, contactAr, lang: req.session.adminLang || 'en' });
});

// ─── 23.2: تحديث معلومات الاتصال ────────────────────────────────────────
app.post('/admin/contact', requireAuth, async (req, res) => {
  try {
    await ContactInfo.findOneAndUpdate(
      { language: 'en' },
      req.body.en,
      { upsert: true, new: true }
    );
    await ContactInfo.findOneAndUpdate(
      { language: 'ar' },
      req.body.ar,
      { upsert: true, new: true }
    );
    res.redirect('/admin/contact');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// ============================================================================
// قسم 24: لوحة التحكم — تغيير كلمة المرور
// ============================================================================

// ─── 24.1: صفحة تغيير كلمة المرور ───────────────────────────────────────
app.get('/admin/settings', requireAuth, (req, res) => {
  res.render('settings', { error: null, success: null, lang: req.session.adminLang || 'en' });
});

// ─── 24.2: معالجة تغيير كلمة المرور ─────────────────────────────────────
app.post('/admin/settings', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // التحقق من كلمة المرور الحالية
    if (!await user.comparePassword(currentPassword)) {
      return res.render('settings', {
        error: 'كلمة المرور الحالية غير صحيحة',
        success: null,
        lang: req.session.adminLang || 'en'
      });
    }

    // التحقق من تطابق كلمتي المرور الجديدتين
    if (newPassword !== confirmPassword) {
      return res.render('settings', {
        error: 'كلمتا المرور الجديدتان غير متطابقتين',
        success: null,
        lang: req.session.adminLang || 'en'
      });
    }

    user.password = newPassword;
    await user.save();

    res.render('settings', {
      success: 'تم تحديث كلمة المرور بنجاح',
      error: null,
      lang: req.session.adminLang || 'en'
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// ============================================================================
// قسم 25: راوتر لوحة التحكم (الخدمات، الفريق، FAQ، الإعدادات، الوسائط، المستخدمين)
// ============================================================================

try {
  app.use('/admin', adminRoutes);
} catch (err) {
  console.error('خطأ في راوتر الأدمن:', err.message);
}

// ============================================================================
// قسم 24.5: نسيت بيانات الدخول — إرسال كلمة مرور جديدة عبر البريد
// ============================================================================

// ─── 24.5.1: صفحة "نسيت البيانات" ─────────────────────────────────────────
app.get('/admin/forgot-password', (req, res) => {
  res.render('forgot-password', { error: null, success: null, info: null });
});

// ─── 24.5.2: معالجة الطلب — إنشاء كلمة مرور جديدة وإرسالها ───────────────
app.post('/admin/forgot-password', async (req, res) => {
  const { username } = req.body;
  
  try {
    if (!username) {
      return res.render('forgot-password', {
        error: 'يرجى إدخال اسم المستخدم',
        success: null, info: null
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ username: String(username).trim() });
    
    // لأسباب أمنية: لا نكشف إن كان المستخدم موجوداً أم لا
    // نُظهر نفس الرسالة في كل الحالات
    if (!user) {
      return res.render('forgot-password', {
        success: 'إذا كان اسم المستخدم موجوداً، سيتم إرسال كلمة مرور جديدة إلى بريد المكتب.',
        error: null, info: null
      });
    }

    // التحقق من إعدادات البريد
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.render('forgot-password', {
        error: 'إعدادات البريد غير مكتملة. تواصل مع المسؤول.',
        success: null, info: null
      });
    }

    // توليد كلمة مرور عشوائية آمنة
    const crypto = require('crypto');
    const newPassword = crypto.randomBytes(8).toString('hex') + 'Aa1!';
    // مثال: "3f8a2b1cAa1!" — 15 حرفاً، يحتوي أحرفاً وأرقاماً ورموزاً

    // تحديث كلمة المرور
    user.password = newPassword;
    user.isActive = true;
    await user.save();

    // إرسال البريد
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const siteUrl = process.env.SITE_URL || 'https://law-arb-ip-walid.vercel.app';

    await transporter.sendMail({
      from: `"Walid Law Firm Admin" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: '🔐 بيانات الدخول الجديدة للوحة التحكم',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #000, #1a1a1a); color: #C9A961; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">🔐 بيانات دخول جديدة</h1>
          </div>
          <div style="background: #fff; border: 1px solid #E9ECEF; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="color: #212529; font-size: 15px;">مرحباً،</p>
            <p style="color: #212529; font-size: 15px;">
              تم طلب كلمة مرور جديدة لحسابك في لوحة التحكم. هذه هي بيانات الدخول:
            </p>
            <div style="background: #F8F9FA; border-left: 4px solid #C9A961; padding: 16px 20px; margin: 20px 0; border-radius: 6px;">
              <p style="margin: 0 0 8px 0; color: #495057; font-size: 13px;">اسم المستخدم:</p>
              <p style="margin: 0 0 16px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #000;">${user.username}</p>
              <p style="margin: 0 0 8px 0; color: #495057; font-size: 13px;">كلمة المرور الجديدة:</p>
              <p style="margin: 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #000;">${newPassword}</p>
            </div>
            <p style="color: #DC3545; font-size: 14px; font-weight: bold;">
              ⚠️ يجب تغيير كلمة المرور فوراً بعد الدخول من صفحة الإعدادات.
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${siteUrl}/admin/login" style="background: linear-gradient(135deg, #C9A961, #A88947); color: #000; padding: 12px 30px; border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">
                الدخول إلى لوحة التحكم
              </a>
            </div>
            <p style="color: #6C757D; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #E9ECEF; padding-top: 15px;">
              إذا لم تطلب هذه التغييرات، تواصل مع المسؤول فوراً.
            </p>
          </div>
        </div>
      `
    });

    console.log('[FORGOT] New password sent to:', adminEmail, 'for user:', user.username);

    res.render('forgot-password', {
      success: '✅ تم إرسال كلمة مرور جديدة إلى بريد المكتب. تحقق من بريدك الإلكتروني.',
      error: null, info: null
    });

  } catch (err) {
    console.error('خطأ في استعادة كلمة المرور:', err.message);
    res.render('forgot-password', {
      error: 'حدث خطأ: ' + err.message,
      success: null, info: null
    });
  }
});
// ============================================================================
// قسم 26: إنشاء حساب الأدمن الافتراضي
// ============================================================================

// تمت إزالة createDefaultAdmin — يديرها السكربت المحلي scripts/create-admin.js

// ============================================================================
// قسم 27: معالجات 404 والأخطاء
// ============================================================================

app.use(notFoundHandler);

app.use((err, req, res, next) => {
  console.error('❌ خطأ عام:', err.message);
  globalErrorHandler(err, req, res, next);
});

// ============================================================================
// قسم 28: بدء التشغيل
// ============================================================================
// نتحقق من Vercel عبر متغيرات البيئة الرسمية
// (VERCEL=1 مضبوط تلقائياً على Vercel فقط)
// ============================================================================

const IS_VERCEL = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;

// محاولة تسخين الاتصال بقاعدة البيانات (غير حاجزة)
connectDB()
  
  .catch((err) => console.error('[بدء التشغيل] فشل تسخين الاتصال:', err.message));

if (IS_VERCEL) {
  console.log('[بدء التشغيل] وضع Vercel Serverless');
  // على Vercel، نُصدّر التطبيق فقط ولا نستدعي app.listen
} else {
  const server = app.listen(port, () => {
    console.log('');
    console.log('========================================');
    console.log('السيرفر:    http://localhost:' + port);
    console.log('الأدمن:     http://localhost:' + port + '/admin/login');
    console.log('الصحة:      http://localhost:' + port + '/health');
    console.log('البريد:     ' + (emailReady ? 'جاهز' : 'غير مضبوط'));
    console.log('Cloudinary: ' + (process.env.CLOUDINARY_CLOUD_NAME ? 'مضبوط' : 'غير مضبوط'));
    console.log('========================================');
    console.log('');
  });
  server.on('error', (err) => console.error('[السيرفر] خطأ:', err.message));
}

// تصدير التطبيق لـ Vercel
module.exports = app;
