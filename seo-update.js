const fs = require('fs');
const path = require('path');

// قائمة الصفحات مع البيانات المخصصة لكل منها
const pages = [
    // الصفحات الرئيسية
    { file: 'index.html', title: 'Walid Abo Al-Ela Law Firm - Arbitration & IP', description: 'Expert law firm specializing in international arbitration and intellectual property protection. Trademark registration, patents, copyright, and litigation since 2016.' },
    { file: 'about.html', title: 'About Us - Walid Abo Al-Ela Law Firm', description: 'Learn about Walid Abo Al-Ela Law Firm, founded in 2016. Dedicated to protecting innovation and providing exceptional legal services in arbitration and IP.' },
    { file: 'services.html', title: 'Our Legal Services - Walid Abo Al-Ela Law Firm', description: 'Comprehensive legal services including arbitration, trademark, patent, copyright, litigation, corporate formation, and more.' },
    { file: 'lawyers.html', title: 'Our Team - Walid Abo Al-Ela Law Firm', description: 'Meet Walid Abo Al-Ela, founder and lead attorney with expertise in arbitration and intellectual property law since 2016.' },
    { file: 'blog.html', title: 'Legal Blog - Walid Abo Al-Ela Law Firm', description: 'Stay updated with the latest insights and news in intellectual property and arbitration.' },
    { file: 'contact.html', title: 'Contact Us - Walid Abo Al-Ela Law Firm', description: 'Get in touch with our legal team. We respond within 24 hours.' },
    { file: 'consultation.html', title: 'Paid Legal Consultation - Walid Abo Al-Ela Law Firm', description: 'Book a personalized legal consultation with expert attorneys. Choose from standard, premium, or specialized IP consultations.' },
    { file: 'client-portal.html', title: 'Client Portal - Walid Abo Al-Ela Law Firm', description: 'Secure access to your case information and documents.' },

    // صفحات الخدمات (الإنجليزية)
    { file: 'arbitration.html', title: 'International Arbitration Services - Walid Abo Al-Ela Law Firm', description: 'Expert international arbitration representation under ICC, LCIA, UNCITRAL rules. Cross-border commercial dispute resolution.' },
    { file: 'trademark.html', title: 'Trademark Registration Services - Walid Abo Al-Ela Law Firm', description: 'Full-service trademark protection in Egypt and internationally via Madrid Protocol. Search, filing, and portfolio management.' },
    { file: 'patent.html', title: 'Patent Protection Services - Walid Abo Al-Ela Law Firm', description: 'Comprehensive patent services including prosecution, prior art searches, and portfolio strategy in Egypt and abroad.' },
    { file: 'copyright.html', title: 'Author\'s Rights & Neighboring Rights - Walid Abo Al-Ela Law Firm', description: 'Protection for authors, performers, and producers. Copyright registration, licensing, and enforcement.' },
    { file: 'litigation.html', title: 'Intellectual Property Litigation - Walid Abo Al-Ela Law Firm', description: 'Specialized IP litigation services including patent, trademark, and copyright infringement cases before Egyptian courts.' },
    { file: 'licensing.html', title: 'Licensing & Contracts - Walid Abo Al-Ela Law Firm', description: 'Drafting and negotiation of IP licensing agreements, technology transfer, and commercial contracts.' },
    { file: 'corporate-formation', title: 'Corporate Formation Services - Walid Abo Al-Ela Law Firm', description: 'Expert guidance in establishing your company in Egypt. Legal structure advisory, registration, and compliance.' },
    { file: 'criminal-litigation', title: 'Criminal Litigation - Walid Abo Al-Ela Law Firm', description: 'Vigorous defense representation in criminal cases at all court levels.' },
    { file: 'civil-litigation', title: 'Civil Litigation - Walid Abo Al-Ela Law Firm', description: 'Comprehensive representation in civil disputes including contracts, property, and torts.' },
    { file: 'state-council-cases', title: 'State Council Cases - Walid Abo Al-Ela Law Firm', description: 'Expert representation before the Egyptian State Council in administrative disputes.' },
    { file: 'family-law', title: 'Family Law - Walid Abo Al-Ela Law Firm', description: 'Compassionate legal support for divorce, custody, child support, and family matters.' },
    { file: 'economic-cases', title: 'Economic Cases - Walid Abo Al-Ela Law Firm', description: 'Specialized litigation before Economic Courts for commercial and financial disputes.' },
    { file: 'industrial-designs', title: 'Industrial Design Registration - Walid Abo Al-Ela Law Firm', description: 'Protect the ornamental aspect of your products. Registration in Egypt and internationally via Hague System.' },
    { file: 'integrated-circuits', title: 'Integrated Circuit Layout-Designs - Walid Abo Al-Ela Law Firm', description: 'Protection for layout-designs of integrated circuits as a distinct IP category.' },
    { file: 'utility-models', title: 'Utility Model Registration - Walid Abo Al-Ela Law Firm', description: 'Cost-effective protection for minor innovations with faster grant.' },
    { file: 'geographical-indications', title: 'Geographical Indications - Walid Abo Al-Ela Law Firm', description: 'Protect products with specific geographical origin and qualities.' },
    { file: 'plant-varieties', title: 'Plant Variety Protection - Walid Abo Al-Ela Law Firm', description: 'Protection for new, distinct, uniform, and stable plant varieties.' },

    // النسخ العربية (نفس الترتيب مع إضافة /ar/ في المسار)
    { file: 'ar/index.html', title: 'وليد أبو العلا للمحاماة - التحكيم والملكية الفكرية', description: 'مكتب محاماة متخصص في التحكيم الدولي وحماية الملكية الفكرية. تسجيل العلامات التجارية، براءات الاختراع، حقوق المؤلف، والتقاضي منذ 2016.' },
    { file: 'ar/about.html', title: 'من نحن - وليد أبو العلا للمحاماة', description: 'تعرف على مكتب وليد أبو العلا للمحاماة، تأسس عام 2016. نكرس أنفسنا لحماية الابتكار وتقديم خدمات قانونية متميزة في التحكيم والملكية الفكرية.' },
    { file: 'ar/services.html', title: 'خدماتنا القانونية - وليد أبو العلا للمحاماة', description: 'خدمات قانونية شاملة تشمل التحكيم، العلامات التجارية، براءات الاختراع، حقوق المؤلف، التقاضي، تأسيس الشركات، والمزيد.' },
    { file: 'ar/lawyers.html', title: 'فريق العمل - وليد أبو العلا للمحاماة', description: 'تعرف على وليد أبو العلا، المؤسس والمحامي الرئيسي، بخبرة منذ 2016 في التحكيم وقانون الملكية الفكرية.' },
    { file: 'ar/blog.html', title: 'المدونة القانونية - وليد أبو العلا للمحاماة', description: 'أحدث المقالات والتحليلات في مجال الملكية الفكرية والتحكيم.' },
    { file: 'ar/contact.html', title: 'اتصل بنا - وليد أبو العلا للمحاماة', description: 'تواصل مع فريقنا القانوني. سنرد عليك خلال 24 ساعة.' },
    { file: 'ar/consultation.html', title: 'استشارة قانونية مدفوعة - وليد أبو العلا للمحاماة', description: 'احجز استشارة قانونية شخصية مع محامٍ خبير. اختر من الاستشارة العادية، الممتازة، أو المتخصصة.' },
    { file: 'ar/client-portal.html', title: 'بوابة العميل - وليد أبو العلا للمحاماة', description: 'دخول آمن إلى معلومات قضيتك ومستنداتك.' },

    { file: 'ar/arbitration.html', title: 'التحكيم الدولي - وليد أبو العلا للمحاماة', description: 'خدمات تحكيم دولي متخصصة تحت قواعد ICC و LCIA و UNCITRAL. حل النزاعات التجارية عبر الحدود.' },
    { file: 'ar/trademark.html', title: 'تسجيل العلامات التجارية - وليد أبو العلا للمحاماة', description: 'خدمات تسجيل وحماية العلامات التجارية في مصر ودولياً عبر بروتوكول مدريد.' },
    { file: 'ar/patent.html', title: 'براءات الاختراع - وليد أبو العلا للمحاماة', description: 'خدمات متكاملة لبراءات الاختراع تشمل البحث، صياغة الطلبات، وإدارة المحافظ.' },
    { file: 'ar/copyright.html', title: 'حقوق المؤلف والحقوق المجاورة - وليد أبو العلا للمحاماة', description: 'حماية حقوق المؤلفين والفنانين والمنتجين. تسجيل وإنفاذ.' },
    { file: 'ar/litigation.html', title: 'قضايا الملكية الفكرية - وليد أبو العلا للمحاماة', description: 'تقاضي متخصص في قضايا انتهاك براءات الاختراع والعلامات التجارية وحقوق النشر.' },
    { file: 'ar/licensing.html', title: 'الترخيص والعقود - وليد أبو العلا للمحاماة', description: 'صياغة والتفاوض على اتفاقيات ترخيص الملكية الفكرية ونقل التكنولوجيا.' },
    { file: 'ar/corporate-formation', title: 'تأسيس الشركات - وليد أبو العلا للمحاماة', description: 'إرشادات خبراء لتأسيس شركتك في مصر مع الامتثال القانوني الكامل.' },
    { file: 'ar/criminal-litigation', title: 'القضايا الجنائية - وليد أبو العلا للمحاماة', description: 'دفاع قوي في القضايا الجنائية أمام جميع المحاكم.' },
    { file: 'ar/civil-litigation', title: 'القضايا المدنية - وليد أبو العلا للمحاماة', description: 'تمثيل شامل في النزاعات المدنية (عقود، ملكية، مسؤولية تقصيرية).' },
    { file: 'ar/state-council-cases', title: 'قضايا مجلس الدولة - وليد أبو العلا للمحاماة', description: 'تمثيل متخصص أمام مجلس الدولة في المنازعات الإدارية.' },
    { file: 'ar/family-law', title: 'قضايا الأسرة - وليد أبو العلا للمحاماة', description: 'دعم قانوني في قضايا الطلاق والحضانة والنفقة ومسائل الأسرة.' },
    { file: 'ar/economic-cases', title: 'القضايا الاقتصادية - وليد أبو العلا للمحاماة', description: 'تقاضي متخصص أمام المحاكم الاقتصادية.' },
    { file: 'ar/industrial-designs', title: 'التصميمات الصناعية - وليد أبو العلا للمحاماة', description: 'حماية الجوانب الزخرفية للمنتجات عبر التسجيل محلياً ودولياً.' },
    { file: 'ar/integrated-circuits', title: 'مخططات الدوائر المتكاملة - وليد أبو العلا للمحاماة', description: 'حماية مخططات التصميمات للدوائر المتكاملة كفئة مستقلة.' },
    { file: 'ar/utility-models', title: 'نماذج المنفعة - وليد أبو العلا للمحاماة', description: 'حماية فعالة للابتكارات البسيطة.' },
    { file: 'ar/geographical-indications', title: 'المؤشرات الجغرافية - وليد أبو العلا للمحاماة', description: 'حماية المنتجات ذات المنشأ الجغرافي.' },
    { file: 'ar/plant-varieties', title: 'الأصناف النباتية - وليد أبو العلا للمحاماة', description: 'حماية الأصناف النباتية الجديدة.' },
];

// الصورة الافتراضية للموقع (يجب أن ترفع صورة لمجلد images)
const defaultImage = 'https://yourdomain.com/images/og-image.jpg'; // استبدل برابط الصورة بعد النشر

pages.forEach(page => {
    const filePath = path.join(__dirname, 'public', page.file);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  الملف غير موجود: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // استبدال أو إضافة وصف meta
    const metaDescRegex = /<meta name="description" content=".*?"\s*\/?>/i;
    const newMetaDesc = `<meta name="description" content="${page.description}">`;
    if (metaDescRegex.test(content)) {
        content = content.replace(metaDescRegex, newMetaDesc);
    } else {
        // إضافته بعد <title>
        content = content.replace('</title>', `</title>\n    ${newMetaDesc}`);
    }

    // إضافة Open Graph tags
    const ogTags = `
    <meta property="og:title" content="${page.title}">
    <meta property="og:description" content="${page.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://yourdomain.com/${page.file.replace(/^ar\//, 'ar/')}">
    <meta property="og:image" content="${defaultImage}">`;

    // إضافة Twitter Cards
    const twitterTags = `
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${page.title}">
    <meta name="twitter:description" content="${page.description}">
    <meta name="twitter:image" content="${defaultImage}">`;

    // البحث عن مكان إضافة الـ tags (بعد <title> عادة)
    // نتأكد من عدم وجودها مسبقاً (للبساطة سنضيفها مرة واحدة فقط)
    if (!content.includes('og:title')) {
        content = content.replace('</title>', `</title>${ogTags}${twitterTags}`);
    }

    // تحسين عنوان الصفحة
    const titleRegex = /<title>.*?<\/title>/i;
    const newTitle = `<title>${page.title}</title>`;
    content = content.replace(titleRegex, newTitle);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ تم تحديث: ${page.file}`);
});

console.log('🎉 تم تحسين SEO لجميع الصفحات!');