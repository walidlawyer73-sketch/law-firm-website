// config/multer.js
const multer = require('multer');
const cloudinary = require('./cloudinary');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const extOk = allowed.test(file.originalname.toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error('Only image files are allowed'));
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

function uploadToCloudinary(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'law-firm/general',
                resource_type: 'auto',
                transformation: options.transformation || [
                    { quality: 'auto:good', fetch_format: 'auto' }
                ],
                ...options
            },
            (error, result) => error ? reject(error) : resolve(result)
        );
        stream.end(buffer);
    });
}

async function deleteFromCloudinary(publicId) {
    if (!publicId) return;
    try { await cloudinary.uploader.destroy(publicId); }
    catch (err) { console.error('Cloudinary delete error:', err.message); }
}

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
