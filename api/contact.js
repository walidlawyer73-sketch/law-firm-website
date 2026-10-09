// ============================================================================
// api/contact.js - Contact Form Handler (Bilingual: AR/EN)
// معالج نموذج الاتصال - يدعم العربية والإنجليزية
// Uses: Nodemailer (Gmail) + MongoDB + formidable v3
// ============================================================================

const { formidable } = require('formidable');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const fs = require('fs');

// ============================================================================
// الاتصال بقاعدة البيانات (مع cache)
// DB Connection (cached)
// ============================================================================
let cachedConnection = null;

async function connectDB() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }
    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
    });
    return cachedConnection;
}

// ============================================================================
// نموذج رسالة الاتصال
// Contact model
// ============================================================================
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    message: { type: String, required: true },
    service: { type: String, default: 'general' },
    language: { type: String, enum: ['ar', 'en'], default: 'ar' },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },
    emailSent: { type: Boolean, default: false },
    attachmentName: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// ============================================================================
// الترجمات - Translations
// ============================================================================
const translations = {
    ar: {
        successMessage: 'تم استلام رسالتك بنجاح. سنرد عليك في أقرب وقت ممكن.',
        errorMissingFields: 'الاسم والبريد الإلكتروني والرسالة مطلوبون.',
        errorInvalidEmail: 'صيغة البريد الإلكتروني غير صحيحة.',
        errorGeneral: 'حدث خطأ في إرسال الرسالة. حاول مرة أخرى.',

        adminSubject: (name, service) => `📩 رسالة جديدة من ${name} - ${service}`,
        adminTitle: '📩 رسالة جديدة من موقعك',
        adminSubtitle: 'مكتب وليد أبوالعلا للمحاماة',
        adminLabelName: 'الاسم',
        adminLabelEmail: 'البريد',
        adminLabelPhone: 'الهاتف',
        adminLabelService: 'الخدمة',
        adminLabelMessage: 'الرسالة',
        adminLabelAttachment: 'مرفق',
        adminNotProvided: 'غير مذكور',
        adminReceivedAt: 'تم استلام الرسالة',

        clientSubject: '✅ تم استلام رسالتك - مكتب وليد أبوالعلا للمحاماة',
        clientBrand: 'وليد أبوالعلا للمحاماة',
        clientBrandSub: 'والتحكيم والملكية الفكرية',
        clientGreeting: (name) => `مرحباً ${name}،`,
        clientThankYou: 'شكراً لتواصلك معنا. تم استلام رسالتك بنجاح وسيقوم فريقنا بالرد عليك في أقرب وقت ممكن.',
        clientSummaryTitle: 'ملخص رسالتك:',
        clientUrgentContact: 'للتواصل العاجل:',
        clientPhone: 'هاتف',
        clientEmail: 'بريد',
        clientCopyright: 'وليد أبوالعلا للمحاماة'
    },
    en: {
        successMessage: 'Thank you for contacting us. We will respond as soon as possible.',
        errorMissingFields: 'Name, email, and message are required.',
        errorInvalidEmail: 'Invalid email format.',
        errorGeneral: 'An error occurred while sending your message. Please try again.',

        adminSubject: (name, service) => `📩 New message from ${name} - ${service}`,
        adminTitle: '📩 New Message from Your Website',
        adminSubtitle: 'Walid Abo Al-Ela Law Firm',
        adminLabelName: 'Name',
        adminLabelEmail: 'Email',
        adminLabelPhone: 'Phone',
        adminLabelService: 'Service',
        adminLabelMessage: 'Message',
        adminLabelAttachment: 'Attachment',
        adminNotProvided: 'Not provided',
        adminReceivedAt: 'Received at',

        clientSubject: '✅ Your message has been received - Walid Abo Al-Ela Law Firm',
        clientBrand: 'Walid Abo Al-Ela Law Firm',
        clientBrandSub: 'Arbitration & Intellectual Property',
        clientGreeting: (name) => `Hello ${name},`,
        clientThankYou: 'Thank you for contacting us. Your message has been received successfully and our team will respond as soon as possible.',
        clientSummaryTitle: 'Your message summary:',
        clientUrgentContact: 'For urgent contact:',
        clientPhone: 'Phone',
        clientEmail: 'Email',
        clientCopyright: 'Walid Abo Al-Ela Law Firm'
    }
};

// ============================================================================
// الدالة الرئيسية
// Main handler
// ============================================================================
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // ==================== Parse Form ====================
    let fields, files;
    try {
        const form = formidable({
            multiples: false,
            maxFileSize: 4 * 1024 * 1024,
            maxFiles: 1,
        });
        [fields, files] = await form.parse(req);
    } catch (parseError) {
        console.error('❌ Form parse error:', parseError);
        return res.status(400).json({
            success: false,
            error: 'حدث خطأ في قراءة البيانات. تأكد من حجم الملف (أقصى 4MB).'
        });
    }

    const getVal = (v) => Array.isArray(v) ? (v[0] || '') : (v || '');

    const name = getVal(fields.name).trim();
    const email = getVal(fields.email).trim().toLowerCase();
    const phone = getVal(fields.phone).trim();
    const message = getVal(fields.message).trim();
    const service = getVal(fields.service).trim() || 'general';
    const language = getVal(fields.language).trim() === 'en' ? 'en' : 'ar';
    const attachment = files.attachment && files.attachment[0];

    const t = translations[language];

    // ==================== Validation ====================
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            error: t.errorMissingFields
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: t.errorInvalidEmail
        });
    }

    // ==================== Save to DB ====================
    let savedContact;
    let dbError = null;
    try {
        await connectDB();
        savedContact = new Contact({
            name, email, phone, message, service, language,
            attachmentName: attachment ? attachment.originalFilename : undefined
        });
        await savedContact.save();
        console.log('✅ Contact saved to DB:', savedContact._id.toString(), `[${language}]`);
    } catch (error) {
        dbError = error.message;
        console.error('❌ DB save error:', error.message);
    }

    // ==================== Send Emails ====================
    let emailSent = false;
    let emailError = null;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        emailError = 'Email not configured';
        console.warn('⚠️', emailError);
    } else {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: Number(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                tls: { rejectUnauthorized: false }
            });

            const attachments = [];
            if (attachment) {
                try {
                    const fileBuffer = fs.readFileSync(attachment.filepath);
                    attachments.push({
                        filename: attachment.originalFilename || 'attachment',
                        content: fileBuffer,
                    });
                } catch (fileError) {
                    console.warn('⚠️ Attachment error:', fileError.message);
                }
            }

            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            const dateStr = new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');

            // ================================================================
            // 1) إيميل الإدارة - بالعربية دايماً (لأن وليد هو اللي بيقرأه)
            // Admin email - ALWAYS in Arabic
            // ================================================================
            const adminT = translations.ar;

            await transporter.sendMail({
                from: `"نموذج الاتصال" <${process.env.EMAIL_USER}>`,
                to: adminEmail,
                replyTo: email,
                subject: adminT.adminSubject(name, service) + (language === 'en' ? ' 🇬🇧' : ' 🇪🇬'),
                attachments,
                html: `
                <div style="font-family: Tahoma, Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; direction: rtl;">
                    <div style="background: #0d6efd; color: #fff; padding: 22px; text-align: center;">
                        <h2 style="margin: 0; font-size: 22px;">${adminT.adminTitle}</h2>
                        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 13px;">${adminT.adminSubtitle} ${language === 'en' ? '🇬🇧 (English Visitor)' : '🇪🇬'}</p>
                    </div>
                    <div style="padding: 25px; background: #fff;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                            <tr>
                                <td style="padding: 10px; background: #f8f9fa; font-weight: bold; width: 30%; border-bottom: 1px solid #eee;">${adminT.adminLabelName}:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; background: #f8f9fa; font-weight: bold; border-bottom: 1px solid #eee;">${adminT.adminLabelEmail}:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; background: #f8f9fa; font-weight: bold; border-bottom: 1px solid #eee;">${adminT.adminLabelPhone}:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(phone) || adminT.adminNotProvided}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; background: #f8f9fa; font-weight: bold; border-bottom: 1px solid #eee;">${adminT.adminLabelService}:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(service)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; background: #f8f9fa; font-weight: bold; vertical-align: top;">${adminT.adminLabelMessage}:</td>
                                <td style="padding: 10px; white-space: pre-wrap;">${escapeHtml(message)}</td>
                            </tr>
                            ${attachment ? `<tr><td style="padding: 10px; background: #f8f9fa; font-weight: bold;">${adminT.adminLabelAttachment}:</td><td style="padding: 10px;">📎 ${escapeHtml(attachment.originalFilename || 'ملف')}</td></tr>` : ''}
                        </table>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        ${adminT.adminReceivedAt}: ${dateStr}
                    </div>
                </div>
                `
            });

            console.log('✅ Admin email sent');

            // ================================================================
            // 2) إيميل التأكيد للعميل - بنفس لغة الصفحة
            // Client confirmation email - same language as page
            // ================================================================
            const dir = language === 'ar' ? 'rtl' : 'ltr';
            const borderSide = language === 'ar' ? 'right' : 'left';

            await transporter.sendMail({
                from: `"${t.clientBrand}" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: t.clientSubject,
                html: `
                <div style="font-family: Tahoma, Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; direction: ${dir};">
                    <div style="background: #000; color: #FFD700; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 26px;">${t.clientBrand}</h1>
                        <p style="margin: 10px 0 0; font-size: 14px;">${t.clientBrandSub}</p>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h3 style="color: #000; margin-top: 0;">${t.clientGreeting(escapeHtml(name))}</h3>
                        <p style="line-height: 1.8; color: #333;">${t.clientThankYou}</p>
                        <p style="background: #f8f9fa; padding: 15px; border-${borderSide}: 4px solid #FFD700; line-height: 1.7; color: #333;">
                            <strong>${t.clientSummaryTitle}</strong><br>
                            ${escapeHtml(message).substring(0, 500)}
                        </p>
                        <p style="line-height: 1.8; color: #333;">${t.clientUrgentContact}</p>
                        <ul style="line-height: 2; color: #333;">
                            <li>📞 ${t.clientPhone}: <a href="tel:+20111257219">+20 111257219</a></li>
                            <li>📧 ${t.clientEmail}: <a href="mailto:walidlegal.ippro@gmail.com">walidlegal.ippro@gmail.com</a></li>
                        </ul>
                    </div>
                    <div style="background: #000; color: #fff; padding: 15px; text-align: center; font-size: 12px;">
                        © ${new Date().getFullYear()} ${t.clientCopyright}
                    </div>
                </div>
                `
            });

            console.log('✅ Client email sent');

            emailSent = true;

            if (savedContact) {
                savedContact.emailSent = true;
                await savedContact.save();
            }
        } catch (error) {
            emailError = error.message;
            console.error('❌ Email error:', error.message);
        }
    }

    // ==================== Response ====================
    if (emailSent) {
        return res.status(200).json({
            success: true,
            message: t.successMessage
        });
    }

    if (savedContact && !emailSent) {
        return res.status(200).json({
            success: true,
            message: t.successMessage,
            warning: 'Email sending failed but message saved'
        });
    }

    return res.status(500).json({
        success: false,
        error: t.errorGeneral,
        debug: { dbError, emailError }
    });
};

// ============================================================================
// Helper: Escape HTML
// ============================================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}