const express = require('express');
const router = express.Router();
const Media = require('../../models/Media');
const { requireAuth } = require('../../middleware/auth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../../config/multer');
const { logActivity } = require('../../middleware/activityLogger');

// ─── قائمة ───
router.get('/', requireAuth, async (req, res) => {
  const folder = req.query.folder || '';
  const filter = folder ? { folder } : {};
  const media = await Media.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  const folders = await Media.distinct('folder');
  res.render('admin/media/index', {
    media,
    folders,
    currentFolder: folder,
    lang: req.session.adminLang || 'en'
  });
});

// ─── رفع متعدد ───
router.post('/upload', requireAuth, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files uploaded');
    }
    const folder = req.body.folder || 'law-firm/general';
    const uploaded = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, {
        folder: folder,
        transformation: [{ quality: 'auto:good', fetch_format: 'auto' }]
      });
      const media = await Media.create({
        filename: result.public_id.split('/').pop(),
        originalName: file.originalname,
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: file.mimetype,
        size: file.size,
        width: result.width,
        height: result.height,
        folder: folder,
        uploadedBy: req.session.userId
      });
      uploaded.push(media);
    }
    await logActivity(req, {
      action: 'upload',
      model: 'Media',
      modelLabel: uploaded.length + ' file(s) uploaded'
    });
    res.redirect('/admin/media?folder=' + encodeURIComponent(folder));
  } catch (err) {
    console.error('Media upload error:', err);
    res.status(400).send('Upload error: ' + err.message);
  }
});

// ─── حذف ───
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).send('Media not found');
    await deleteFromCloudinary(media.publicId);
    await Media.findByIdAndDelete(req.params.id);
    await logActivity(req, {
      action: 'delete',
      model: 'Media',
      modelId: media._id,
      modelLabel: media.originalName || media.filename
    });
    res.redirect('/admin/media');
  } catch (err) {
    console.error('Media delete error:', err);
    res.status(400).send('Delete error: ' + err.message);
  }
});

module.exports = router;
