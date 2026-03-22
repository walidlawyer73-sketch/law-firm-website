require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const methodOverride = require('method-override');

// Import Models
const Page = require('./models/Page');
const BlogPost = require('./models/BlogPost');
const Testimonial = require('./models/Testimonial');
const ContactInfo = require('./models/ContactInfo');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch((err) => console.log(err));

// Middleware
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Session for authentication
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Set view engine to EJS for admin panel
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// Language middleware for admin panel
app.use('/admin', (req, res, next) => {
    // Check if lang parameter exists in query or session
    if (req.query.lang) {
        req.session.adminLang = req.query.lang;
    }
    res.locals.lang = req.session.adminLang || 'en'; // Default to English
    next();
});

// ==================== STATIC HTML ROUTES ====================

// English pages
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/about', (req, res) => res.sendFile(__dirname + '/public/about.html'));
app.get('/services', (req, res) => res.sendFile(__dirname + '/public/services.html'));
app.get('/arbitration', (req, res) => res.sendFile(__dirname + '/public/arbitration.html'));
app.get('/trademark', (req, res) => res.sendFile(__dirname + '/public/trademark.html'));
app.get('/patent', (req, res) => res.sendFile(__dirname + '/public/patent.html'));
app.get('/copyright', (req, res) => res.sendFile(__dirname + '/public/copyright.html'));
app.get('/litigation', (req, res) => res.sendFile(__dirname + '/public/litigation.html'));
app.get('/licensing', (req, res) => res.sendFile(__dirname + '/public/licensing.html'));
app.get('/lawyers', (req, res) => res.sendFile(__dirname + '/public/lawyers.html'));
app.get('/blog', (req, res) => res.sendFile(__dirname + '/public/blog.html'));
app.get('/contact', (req, res) => res.sendFile(__dirname + '/public/contact.html'));
app.get('/client-portal', (req, res) => res.sendFile(__dirname + '/public/client-portal.html'));
app.get('/consultation', (req, res) => res.sendFile(__dirname + '/public/consultation.html'));
app.get('/success', (req, res) => res.sendFile(__dirname + '/public/success.html'));
app.get('/cancel', (req, res) => res.sendFile(__dirname + '/public/cancel.html'));

// Arabic pages
app.get('/ar', (req, res) => res.sendFile(__dirname + '/public/ar/index.html'));
app.get('/ar/about', (req, res) => res.sendFile(__dirname + '/public/ar/about.html'));
app.get('/ar/services', (req, res) => res.sendFile(__dirname + '/public/ar/services.html'));
app.get('/ar/arbitration', (req, res) => res.sendFile(__dirname + '/public/ar/arbitration.html'));
app.get('/ar/trademark', (req, res) => res.sendFile(__dirname + '/public/ar/trademark.html'));
app.get('/ar/patent', (req, res) => res.sendFile(__dirname + '/public/ar/patent.html'));
app.get('/ar/copyright', (req, res) => res.sendFile(__dirname + '/public/ar/copyright.html'));
app.get('/ar/litigation', (req, res) => res.sendFile(__dirname + '/public/ar/litigation.html'));
app.get('/ar/licensing', (req, res) => res.sendFile(__dirname + '/public/ar/licensing.html'));
app.get('/ar/lawyers', (req, res) => res.sendFile(__dirname + '/public/ar/lawyers.html'));
app.get('/ar/blog', (req, res) => res.sendFile(__dirname + '/public/ar/blog.html'));
app.get('/ar/contact', (req, res) => res.sendFile(__dirname + '/public/ar/contact.html'));
app.get('/ar/client-portal', (req, res) => res.sendFile(__dirname + '/public/ar/client-portal.html'));
app.get('/ar/consultation', (req, res) => res.sendFile(__dirname + '/public/ar/consultation.html'));
app.get('/ar/success', (req, res) => res.sendFile(__dirname + '/public/ar/success.html'));
app.get('/ar/cancel', (req, res) => res.sendFile(__dirname + '/public/ar/cancel.html'));

// ==================== DYNAMIC PAGE ROUTES ====================

// English dynamic pages
app.get('/:page', async (req, res, next) => {
    // List of static files to ignore (don't treat as dynamic pages)
    const staticFiles = ['about', 'services', 'arbitration', 'trademark', 'patent', 'copyright', 'litigation', 'licensing', 'lawyers', 'blog', 'contact', 'client-portal', 'consultation', 'success', 'cancel', 'admin', 'ar', 'images', 'css', 'js', 'uploads'];
    
    if (staticFiles.includes(req.params.page)) {
        return next();
    }
    
    try {
        const page = await Page.findOne({ slug: req.params.page, language: 'en', published: true });
        if (page) {
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
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
                    <div class="language-switcher">
                        <a href="/ar/${req.params.page}" class="lang-btn arabic"><i class="fas fa-globe"></i> العربية</a>
                    </div>
                    
                    <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
                        <div class="container">
                            <a class="navbar-brand" href="/">
                                <img src="/images/logo arb ip.png" alt="Walid Abo Al-Ela Law Firm" style="height:20px; width:auto; margin-right:8px;">
                                <span class="fw-bold">Walid Abo Al-Ela Law Firm</span>
                                <small class="d-block" style="font-size:12px; opacity:0.8;">Arbitration & IP</small>
                            </a>
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <div class="collapse navbar-collapse" id="navbarNav">
                                <ul class="navbar-nav ms-auto">
                                    <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/about">About</a></li>
                                    <li class="nav-item dropdown">
                                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Services</a>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="/arbitration">Arbitration</a></li>
                                            <li><a class="dropdown-item" href="/trademark">Trademark</a></li>
                                            <li><a class="dropdown-item" href="/patent">Patent</a></li>
                                            <li><a class="dropdown-item" href="/copyright">Copyright</a></li>
                                            <li><a class="dropdown-item" href="/litigation">Litigation</a></li>
                                            <li><a class="dropdown-item" href="/licensing">Licensing & Contracts</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item" href="/services">All Services</a></li>
                                        </ul>
                                    </li>
                                    <li class="nav-item"><a class="nav-link" href="/lawyers">Our Team</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/blog">Blog</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/contact">Contact</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/consultation">Paid Consultation</a></li>
                                    <li class="nav-item ms-lg-3">
                                        <a class="btn btn-outline-light btn-sm" href="/client-portal"><i class="fas fa-lock me-1"></i>Client Portal</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                    
                    <header class="page-header">
                        <div class="container text-white text-center">
                            <h1 class="display-4">${page.title}</h1>
                        </div>
                    </header>
                    
                    <section class="py-5">
                        <div class="container">
                            <div class="row">
                                <div class="col-lg-8 mx-auto">
                                    ${page.content.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <footer class="footer-section py-5 bg-dark text-white">
                        <div class="container">
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="small text-white-50 mb-0">© 2025 Walid Abo Al-Ela Law Firm. All rights reserved.</p>
                                </div>
                                <div class="col-md-6 text-md-end">
                                    <ul class="list-unstyled">
                                        <li><i class="fas fa-map-marker-alt me-2"></i> العاشر من رمضان، القاهرة، مصر</li>
                                        <li><i class="fas fa-phone me-2"></i> 01111257219</li>
                                        <li><i class="fas fa-envelope me-2"></i> walidlegal.ippro@gmail.com</li>
                                        <li><i class="fas fa-clock me-2"></i> Sat - Thu: 9am - 8pm</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </footer>
                    
                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
                    <script src="/js/main.js"></script>
                </body>
                </html>
            `);
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Arabic dynamic pages
app.get('/ar/:page', async (req, res, next) => {
    const staticFiles = ['about', 'services', 'arbitration', 'trademark', 'patent', 'copyright', 'litigation', 'licensing', 'lawyers', 'blog', 'contact', 'client-portal', 'consultation', 'success', 'cancel'];
    
    if (staticFiles.includes(req.params.page)) {
        return next();
    }
    
    try {
        const page = await Page.findOne({ slug: req.params.page + '-ar', language: 'ar', published: true });
        if (page) {
            res.send(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
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
                    <div class="language-switcher">
                        <a href="/${req.params.page}" class="lang-btn"><i class="fas fa-globe"></i> English</a>
                    </div>
                    
                    <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
                        <div class="container">
                            <a class="navbar-brand" href="/ar">
                                <img src="/images/logo arb ip.png" alt="وليد أبو العلا" style="height:20px; margin-left:8px;">
                                <span class="fw-bold">وليد أبو العلا للمحاماة</span>
                                <small class="d-block" style="font-size:12px; opacity:0.8;">تحكيم وملكية فكرية</small>
                            </a>
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <div class="collapse navbar-collapse" id="navbarNav">
                                <ul class="navbar-nav ms-auto">
                                    <li class="nav-item"><a class="nav-link" href="/ar">الرئيسية</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/about">من نحن</a></li>
                                    <li class="nav-item dropdown">
                                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">الخدمات</a>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="/ar/arbitration">التحكيم</a></li>
                                            <li><a class="dropdown-item" href="/ar/trademark">العلامات التجارية</a></li>
                                            <li><a class="dropdown-item" href="/ar/patent">براءات الاختراع</a></li>
                                            <li><a class="dropdown-item" href="/ar/copyright">حقوق النشر</a></li>
                                            <li><a class="dropdown-item" href="/ar/litigation">القضايا</a></li>
                                            <li><a class="dropdown-item" href="/ar/licensing">الترخيص والعقود</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item" href="/ar/services">جميع الخدمات</a></li>
                                        </ul>
                                    </li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/lawyers">فريق العمل</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/blog">المدونة</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/contact">اتصل بنا</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/consultation">استشارة مدفوعة</a></li>
                                    <li class="nav-item ms-lg-3">
                                        <a class="btn btn-outline-light btn-sm" href="/ar/client-portal"><i class="fas fa-lock me-1"></i>بوابة العميل</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                    
                    <header class="page-header">
                        <div class="container text-white text-center">
                            <h1 class="display-4">${page.title}</h1>
                        </div>
                    </header>
                    
                    <section class="py-5">
                        <div class="container">
                            <div class="row">
                                <div class="col-lg-8 mx-auto">
                                    ${page.content.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <footer class="footer-section py-5 bg-dark text-white">
                        <div class="container">
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="small text-white-50 mb-0">© 2025 وليد أبو العلا للمحاماة. جميع الحقوق محفوظة.</p>
                                </div>
                                <div class="col-md-6 text-md-start">
                                    <ul class="list-unstyled">
                                        <li><i class="fas fa-map-marker-alt me-2"></i> العاشر من رمضان، القاهرة، مصر</li>
                                        <li><i class="fas fa-phone me-2"></i> 01111257219</li>
                                        <li><i class="fas fa-envelope me-2"></i> walidlegal.ippro@gmail.com</li>
                                        <li><i class="fas fa-clock me-2"></i> السبت - الخميس: 9 صباحاً - 8 مساءً</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </footer>
                    
                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
                    <script src="/js/main.js"></script>
                </body>
                </html>
            `);
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// ==================== BLOG DYNAMIC ROUTES ====================

// English blog posts
app.get('/blog/:slug', async (req, res, next) => {
    try {
        const post = await BlogPost.findOne({ slug: req.params.slug, language: 'en', published: true });
        if (post) {
            // Increment view count
            post.views += 1;
            await post.save();
            
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${post.title} - Walid Abo Al-Ela Law Firm</title>
                    <meta name="description" content="${post.excerpt || ''}">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>
                    <div class="language-switcher">
                        <a href="/ar/blog/${req.params.slug}" class="lang-btn arabic"><i class="fas fa-globe"></i> العربية</a>
                    </div>
                    
                    <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
                        <div class="container">
                            <a class="navbar-brand" href="/">
                                <img src="/images/logo arb ip.png" alt="Walid Abo Al-Ela Law Firm" style="height:20px; width:auto; margin-right:8px;">
                                <span class="fw-bold">Walid Abo Al-Ela Law Firm</span>
                                <small class="d-block" style="font-size:12px; opacity:0.8;">Arbitration & IP</small>
                            </a>
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <div class="collapse navbar-collapse" id="navbarNav">
                                <ul class="navbar-nav ms-auto">
                                    <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/about">About</a></li>
                                    <li class="nav-item dropdown">
                                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Services</a>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="/arbitration">Arbitration</a></li>
                                            <li><a class="dropdown-item" href="/trademark">Trademark</a></li>
                                            <li><a class="dropdown-item" href="/patent">Patent</a></li>
                                            <li><a class="dropdown-item" href="/copyright">Copyright</a></li>
                                            <li><a class="dropdown-item" href="/litigation">Litigation</a></li>
                                            <li><a class="dropdown-item" href="/licensing">Licensing & Contracts</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item" href="/services">All Services</a></li>
                                        </ul>
                                    </li>
                                    <li class="nav-item"><a class="nav-link" href="/lawyers">Our Team</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/blog">Blog</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/contact">Contact</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/consultation">Paid Consultation</a></li>
                                    <li class="nav-item ms-lg-3">
                                        <a class="btn btn-outline-light btn-sm" href="/client-portal"><i class="fas fa-lock me-1"></i>Client Portal</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                    
                    <header class="page-header">
                        <div class="container text-white text-center">
                            <h1 class="display-4">${post.title}</h1>
                            <p class="lead">${new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | by ${post.author}</p>
                        </div>
                    </header>
                    
                    <section class="py-5">
                        <div class="container">
                            <div class="row">
                                <div class="col-lg-8 mx-auto">
                                    ${post.content.replace(/\n/g, '<br>')}
                                    
                                    <hr class="my-5">
                                    
                                    <div class="d-flex justify-content-between">
                                        <a href="/blog" class="btn btn-outline-primary"><i class="fas fa-arrow-left me-2"></i>Back to Blog</a>
                                        <div>
                                            <span class="text-muted">Category: ${post.category || 'Uncategorized'}</span>
                                            <span class="text-muted ms-3"><i class="far fa-eye me-1"></i> ${post.views || 0} views</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <footer class="footer-section py-5 bg-dark text-white">
                        <div class="container">
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="small text-white-50 mb-0">© 2025 Walid Abo Al-Ela Law Firm. All rights reserved.</p>
                                </div>
                                <div class="col-md-6 text-md-end">
                                    <ul class="list-unstyled">
                                        <li><i class="fas fa-map-marker-alt me-2"></i> العاشر من رمضان، القاهرة، مصر</li>
                                        <li><i class="fas fa-phone me-2"></i> 01111257219</li>
                                        <li><i class="fas fa-envelope me-2"></i> walidlegal.ippro@gmail.com</li>
                                        <li><i class="fas fa-clock me-2"></i> Sat - Thu: 9am - 8pm</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </footer>
                    
                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
                    <script src="/js/main.js"></script>
                </body>
                </html>
            `);
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Arabic blog posts
app.get('/ar/blog/:slug', async (req, res, next) => {
    try {
        const post = await BlogPost.findOne({ slug: req.params.slug + '-ar', language: 'ar', published: true });
        if (post) {
            // Increment view count
            post.views += 1;
            await post.save();
            
            res.send(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${post.title} - وليد أبو العلا للمحاماة</title>
                    <meta name="description" content="${post.excerpt || ''}">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>
                    <div class="language-switcher">
                        <a href="/blog/${req.params.slug}" class="lang-btn"><i class="fas fa-globe"></i> English</a>
                    </div>
                    
                    <nav class="navbar navbar-expand-lg navbar-dark fixed-top">
                        <div class="container">
                            <a class="navbar-brand" href="/ar">
                                <img src="/images/logo arb ip.png" alt="وليد أبو العلا" style="height:20px; margin-left:8px;">
                                <span class="fw-bold">وليد أبو العلا للمحاماة</span>
                                <small class="d-block" style="font-size:12px; opacity:0.8;">تحكيم وملكية فكرية</small>
                            </a>
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <div class="collapse navbar-collapse" id="navbarNav">
                                <ul class="navbar-nav ms-auto">
                                    <li class="nav-item"><a class="nav-link" href="/ar">الرئيسية</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/about">من نحن</a></li>
                                    <li class="nav-item dropdown">
                                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">الخدمات</a>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="/ar/arbitration">التحكيم</a></li>
                                            <li><a class="dropdown-item" href="/ar/trademark">العلامات التجارية</a></li>
                                            <li><a class="dropdown-item" href="/ar/patent">براءات الاختراع</a></li>
                                            <li><a class="dropdown-item" href="/ar/copyright">حقوق النشر</a></li>
                                            <li><a class="dropdown-item" href="/ar/litigation">القضايا</a></li>
                                            <li><a class="dropdown-item" href="/ar/licensing">الترخيص والعقود</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item" href="/ar/services">جميع الخدمات</a></li>
                                        </ul>
                                    </li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/lawyers">فريق العمل</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/blog">المدونة</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/contact">اتصل بنا</a></li>
                                    <li class="nav-item"><a class="nav-link" href="/ar/consultation">استشارة مدفوعة</a></li>
                                    <li class="nav-item ms-lg-3">
                                        <a class="btn btn-outline-light btn-sm" href="/ar/client-portal"><i class="fas fa-lock me-1"></i>بوابة العميل</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                    
                    <header class="page-header">
                        <div class="container text-white text-center">
                            <h1 class="display-4">${post.title}</h1>
                            <p class="lead">${new Date(post.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })} | بقلم ${post.author}</p>
                        </div>
                    </header>
                    
                    <section class="py-5">
                        <div class="container">
                            <div class="row">
                                <div class="col-lg-8 mx-auto">
                                    ${post.content.replace(/\n/g, '<br>')}
                                    
                                    <hr class="my-5">
                                    
                                    <div class="d-flex justify-content-between">
                                        <a href="/ar/blog" class="btn btn-outline-primary"><i class="fas fa-arrow-left me-2"></i>العودة إلى المدونة</a>
                                        <div>
                                            <span class="text-muted">التصنيف: ${post.category || 'غير مصنف'}</span>
                                            <span class="text-muted ms-3"><i class="far fa-eye me-1"></i> ${post.views || 0} مشاهدة</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <footer class="footer-section py-5 bg-dark text-white">
                        <div class="container">
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="small text-white-50 mb-0">© 2025 وليد أبو العلا للمحاماة. جميع الحقوق محفوظة.</p>
                                </div>
                                <div class="col-md-6 text-md-start">
                                    <ul class="list-unstyled">
                                        <li><i class="fas fa-map-marker-alt me-2"></i> العاشر من رمضان، القاهرة، مصر</li>
                                        <li><i class="fas fa-phone me-2"></i> 01111257219</li>
                                        <li><i class="fas fa-envelope me-2"></i> walidlegal.ippro@gmail.com</li>
                                        <li><i class="fas fa-clock me-2"></i> السبت - الخميس: 9 صباحاً - 8 مساءً</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </footer>
                    
                    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
                    <script src="/js/main.js"></script>
                </body>
                </html>
            `);
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// ==================== ADMIN PANEL ROUTES ====================

// Login page
app.get('/admin/login', (req, res) => {
    res.render('login', { 
        error: null,
        lang: req.query.lang || 'en'
    });
});

// Login POST
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (user && await user.comparePassword(password)) {
        req.session.userId = user._id;
        req.session.username = user.username;
        res.redirect('/admin/dashboard');
    } else {
        res.render('login', { 
            error: 'Invalid credentials',
            lang: req.body.lang || 'en'
        });
    }
});

// Logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard
app.get('/admin/dashboard', requireAuth, async (req, res) => {
    const pages = await Page.countDocuments();
    const posts = await BlogPost.countDocuments();
    const testimonials = await Testimonial.countDocuments();
    res.render('dashboard', { 
        pages, 
        posts, 
        testimonials, 
        user: req.session.username,
        lang: req.session.adminLang || 'en'
    });
});

// ==================== PAGES MANAGEMENT ====================

// List pages
app.get('/admin/pages', requireAuth, async (req, res) => {
    const pages = await Page.find().sort('-createdAt');
    res.render('pages/index', { 
        pages,
        lang: req.session.adminLang || 'en'
    });
});

// New page form
app.get('/admin/pages/new', requireAuth, (req, res) => {
    res.render('pages/new', { 
        page: null,
        lang: req.session.adminLang || 'en'
    });
});

// Create page
app.post('/admin/pages', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const page = new Page(req.body);
        await page.save();
        res.redirect('/admin/pages');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Edit page form
app.get('/admin/pages/:id/edit', requireAuth, async (req, res) => {
    const page = await Page.findById(req.params.id);
    res.render('pages/edit', { 
        page,
        lang: req.session.adminLang || 'en'
    });
});

// Update page
app.put('/admin/pages/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.redirect('/admin/pages');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Delete page
app.delete('/admin/pages/:id', requireAuth, async (req, res) => {
    await Page.findByIdAndDelete(req.params.id);
    res.redirect('/admin/pages');
});

// ==================== BLOG MANAGEMENT ====================

// List posts
app.get('/admin/posts', requireAuth, async (req, res) => {
    const posts = await BlogPost.find().sort('-createdAt');
    res.render('posts/index', { 
        posts,
        lang: req.session.adminLang || 'en'
    });
});

// New post form
app.get('/admin/posts/new', requireAuth, (req, res) => {
    res.render('posts/new', { 
        post: null,
        lang: req.session.adminLang || 'en'
    });
});

// Create post
app.post('/admin/posts', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const post = new BlogPost(req.body);
        if (req.file) post.image = '/uploads/' + req.file.filename;
        await post.save();
        res.redirect('/admin/posts');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Edit post form
app.get('/admin/posts/:id/edit', requireAuth, async (req, res) => {
    const post = await BlogPost.findById(req.params.id);
    res.render('posts/edit', { 
        post,
        lang: req.session.adminLang || 'en'
    });
});

// Update post
app.put('/admin/posts/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (req.file) {
            post.image = '/uploads/' + req.file.filename;
            await post.save();
        }
        res.redirect('/admin/posts');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Delete post
app.delete('/admin/posts/:id', requireAuth, async (req, res) => {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.redirect('/admin/posts');
});

// ==================== TESTIMONIALS MANAGEMENT ====================

// List testimonials
app.get('/admin/testimonials', requireAuth, async (req, res) => {
    const testimonials = await Testimonial.find().sort('-createdAt');
    res.render('testimonials/index', { 
        testimonials,
        lang: req.session.adminLang || 'en'
    });
});

// New testimonial form
app.get('/admin/testimonials/new', requireAuth, (req, res) => {
    res.render('testimonials/new', { 
        testimonial: null,
        lang: req.session.adminLang || 'en'
    });
});

// Create testimonial
app.post('/admin/testimonials', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const testimonial = new Testimonial(req.body);
        if (req.file) testimonial.image = '/uploads/' + req.file.filename;
        await testimonial.save();
        res.redirect('/admin/testimonials');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Edit testimonial form
app.get('/admin/testimonials/:id/edit', requireAuth, async (req, res) => {
    const testimonial = await Testimonial.findById(req.params.id);
    res.render('testimonials/edit', { 
        testimonial,
        lang: req.session.adminLang || 'en'
    });
});

// Update testimonial
app.put('/admin/testimonials/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.redirect('/admin/testimonials');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Delete testimonial
app.delete('/admin/testimonials/:id', requireAuth, async (req, res) => {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.redirect('/admin/testimonials');
});

// ==================== CONTACT INFO MANAGEMENT ====================

// Edit contact info
app.get('/admin/contact', requireAuth, async (req, res) => {
    let contactEn = await ContactInfo.findOne({ language: 'en' });
    let contactAr = await ContactInfo.findOne({ language: 'ar' });
    if (!contactEn) contactEn = new ContactInfo({ language: 'en' });
    if (!contactAr) contactAr = new ContactInfo({ language: 'ar' });
    res.render('contact', { 
        contactEn, 
        contactAr,
        lang: req.session.adminLang || 'en'
    });
});

// Update contact info
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
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// ==================== SETTINGS ====================

// Change password
app.get('/admin/settings', requireAuth, (req, res) => {
    res.render('settings', { 
        error: null, 
        success: null,
        lang: req.session.adminLang || 'en'
    });
});

app.post('/admin/settings', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (await user.comparePassword(currentPassword)) {
            if (newPassword === confirmPassword) {
                user.password = newPassword;
                await user.save();
                res.render('settings', { 
                    success: 'Password updated successfully', 
                    error: null,
                    lang: req.session.adminLang || 'en'
                });
            } else {
                res.render('settings', { 
                    error: 'New passwords do not match', 
                    success: null,
                    lang: req.session.adminLang || 'en'
                });
            }
        } else {
            res.render('settings', { 
                error: 'Current password is incorrect', 
                success: null,
                lang: req.session.adminLang || 'en'
            });
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// ==================== CREATE DEFAULT ADMIN ====================
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME });
        if (!adminExists) {
            const admin = new User({
                username: process.env.ADMIN_USERNAME,
                password: process.env.ADMIN_PASSWORD
            });
            await admin.save();
            console.log('✅ Default admin created');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// ==================== START SERVER ====================
app.listen(port, async () => {
    await createDefaultAdmin();
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`🔐 Admin panel: http://localhost:${port}/admin/login`);
});