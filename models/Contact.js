// ============================================================================
// models/Contact.js - Contact Form Model
// نموذج رسالة الاتصال - قاعدة البيانات
// ============================================================================

const mongoose = require('mongoose');

// ============================================================================
// هيكل رسالة الاتصال
// Contact message schema
// ============================================================================
const contactSchema = new mongoose.Schema({
    // اسم المرسل | Sender name
    name: {
        type: String,
        required: true,
        trim: true
    },
    
    // البريد الإلكتروني | Email address
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    
    // رقم الهاتف (اختياري) | Phone number (optional)
    phone: {
        type: String,
        trim: true
    },
    
    // نص الرسالة | Message body
    message: {
        type: String,
        required: true
    },
    
    // نوع الخدمة المطلوبة | Requested service type
    service: {
        type: String,
        default: 'general'
    },
    
    // حالة الرسالة | Message status
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },
    
    // هل تم إرسال إيميل تأكيد للعميل؟ | Was confirmation email sent?
    emailSent: {
        type: Boolean,
        default: false
    },
    
    // اسم الملف المرفق (إن وجد) | Attachment filename (if any)
    attachmentName: {
        type: String
    },
    
    // تاريخ الإنشاء | Creation date
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ============================================================================
// تصدير النموذج
// Export the model
// ============================================================================
module.exports = mongoose.model('Contact', contactSchema);