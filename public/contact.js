const formidable = require('formidable');
const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');

// تعطيل bodyParser لـ Vercel للسماح لـ formidable بمعالجة الملفات
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // إعداد معالج النموذج
  const form = new formidable.IncomingForm();
  form.uploadDir = '/tmp'; // مجلد مؤقت في Vercel (قابل للكتابة)
  form.keepExtensions = true;
  form.maxFileSize = 5 * 1024 * 1024; // 5 ميجابايت كحد أقصى للملف

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    const { name, email, phone, message } = fields;
    const attachment = files.attachment ? files.attachment[0] : null;

    // التحقق من الحقول المطلوبة
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    try {
      // تكوين ناقل البريد الإلكتروني (استخدم SMTP الخاص بمزود الخدمة)
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // مثال: Gmail (يمكنك استخدام أي SMTP)
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER, // ضع بريدك الإلكتروني في ملف .env
          pass: process.env.EMAIL_PASS, // كلمة مرور التطبيق
        },
      });

      // إعداد خيارات البريد
      const mailOptions = {
        from: `"موقع المحاماة" <${process.env.EMAIL_USER}>`,
        to: 'walidlegal.ippro@gmail.com', // بريدك المستلم
        subject: `رسالة جديدة من ${name}`,
        text: `
          الاسم: ${name}
          البريد الإلكتروني: ${email}
          رقم الهاتف: ${phone || 'غير مذكور'}
          الرسالة: ${message}
        `,
        attachments: [],
      };

      // إرفاق الملف إذا وجد
      if (attachment) {
        const fileBuffer = await fs.readFile(attachment.filepath);
        mailOptions.attachments.push({
          filename: attachment.originalFilename,
          content: fileBuffer,
        });
        // تنظيف الملف المؤقت
        await fs.unlink(attachment.filepath);
      }

      // إرسال البريد
      await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: 'تم إرسال الرسالة بنجاح' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });
}