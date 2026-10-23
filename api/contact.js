// ============================================================================
// api/contact.js — معالج نموذج الاتصال
// ============================================================================
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { z } = require('zod');

// Schema للتحقق
const contactSchema = z.object({
    name: z.string().min(2, 'Name too short').max(100),
    email: z.string().email('Invalid email'),
    phone: z.string().optional().nullable(),
    service: z.string().optional().default('general'),
    message: z.string().min(10, 'Message too short').max(5000)
});

module.exports = async function contactHandler(req, res) {
    try {
        // اتصال DB (Vercel serverless)
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // قراءة البيانات (body أو JSON)
        const data = req.body || {};
        const parsed = contactSchema.safeParse(data);

        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: parsed.error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
        }

        const Contact = require('../models/Contact');

        const contact = await Contact.create({
            name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone || '',
            service: parsed.data.service,
            message: parsed.data.message,
            status: 'new'
        });

        // إرسال الإيميل (اختياري — إن كانت الإعدادات موجودة)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                    port: Number(process.env.EMAIL_PORT) || 587,
                    secure: process.env.EMAIL_SECURE === 'true',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                // إيميل للمكتب
                await transporter.sendMail({
                    from: `"Website Contact" <${process.env.EMAIL_USER}>`,
                    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                    replyTo: contact.email,
                    subject: `New Contact Message from ${contact.name}`,
                    html: `
                        <h2>New Contact Message</h2>
                        <p><strong>Name:</strong> ${contact.name}</p>
                        <p><strong>Email:</strong> ${contact.email}</p>
                        <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
                        <p><strong>Service:</strong> ${contact.service}</p>
                        <hr>
                        <p>${contact.message.replace(/\n/g, '<br>')}</p>
                    `
                });

                // إيميل تأكيد للعميل
                await transporter.sendMail({
                    from: `"Walid Abo Al-Ela Law Firm" <${process.env.EMAIL_USER}>`,
                    to: contact.email,
                    subject: 'We received your message',
                    html: `
                        <h2>Thank you, ${contact.name}</h2>
                        <p>We received your message and will reply as soon as possible.</p>
                        <hr>
                        <p style="color:#888;font-size:12px">Your message:</p>
                        <blockquote>${contact.message.replace(/\n/g, '<br>')}</blockquote>
                    `
                });

                contact.emailSent = true;
                await contact.save();
            } catch (mailErr) {
                console.error('Email send failed:', mailErr.message);
                // لا نوقف العملية — الرسالة محفوظة
            }
        }

        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            id: contact._id
        });

    } catch (err) {
        console.error('Contact handler error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};