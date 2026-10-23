// ============================================================================
// config/cloudinary.js — تهيئة Cloudinary
// ============================================================================
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// التحقق عند بدء التشغيل
if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️  CLOUDINARY_CLOUD_NAME not set — image uploads will fail');
} else {
    console.log('✅ Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);
}

module.exports = cloudinary;