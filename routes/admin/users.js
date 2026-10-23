const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { logActivity } = require('../../middleware/activityLogger');

router.use(requireAuth, requireRole('admin'));

// ─── قائمة ───
router.get('/', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.render('admin/users/index', {
    users,
    currentUserId: req.session.userId.toString(),
    success: req.query.success || null,
    error: req.query.error || null,
    lang: req.session.adminLang || 'en'
  });
});

// ─── نموذج إضافة ───
router.get('/new', (req, res) => {
  res.render('admin/users/new', { user: null, lang: req.session.adminLang || 'en' });
});

// ─── إنشاء ───
router.post('/', async (req, res) => {
  try {
    const { username, password, role, email, displayName } = req.body;
    if (!username || !password) return res.status(400).send('Username and password are required');
    if (password.length < 8) return res.status(400).send('Password must be at least 8 characters');
    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists) return res.status(400).send('Username already exists');
    const user = new User({
      username: username.toLowerCase().trim(),
      password: password,
      role: role || 'editor',
      email: email || '',
      displayName: displayName || ''
    });
    await user.save();
    await logActivity(req, { action: 'create', model: 'User', modelId: user._id, modelLabel: user.username });
    res.redirect('/admin/users?success=' + encodeURIComponent('User created: ' + user.username));
  } catch (err) {
    console.error('User create error:', err);
    res.status(400).send('Create error: ' + err.message);
  }
});

// ─── نموذج تعديل ───
router.get('/:id/edit', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send('User not found');
  const isSelf = user._id.toString() === req.session.userId.toString();
  res.render('admin/users/edit', {
    user,
    isSelf,
    lang: req.session.adminLang || 'en'
  });
});

// ─── تحديث ───
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');
    const isSelf = user._id.toString() === req.session.userId.toString();
    const { role, email, displayName, password, isActive } = req.body;

    if (isSelf && role && role !== user.role) {
      return res.status(400).send('You cannot change your own role');
    }
    if (user.role === 'admin' && role && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) return res.status(400).send('Cannot demote the last admin');
    }
    if (role) user.role = role;
    if (email !== undefined) user.email = email;
    if (displayName !== undefined) user.displayName = displayName;
    if (isActive !== undefined) {
      if (isSelf && !isActive) return res.status(400).send('You cannot deactivate your own account');
      user.isActive = !!isActive;
    }
    if (password && password.length >= 8) {
      user.password = password;
    } else if (password && password.length > 0) {
      return res.status(400).send('Password must be at least 8 characters');
    }
    await user.save();
    await logActivity(req, { action: 'update', model: 'User', modelId: user._id, modelLabel: user.username });
    res.redirect('/admin/users?success=' + encodeURIComponent('User updated: ' + user.username));
  } catch (err) {
    console.error('User update error:', err);
    res.status(400).send('Update error: ' + err.message);
  }
});

// ─── حذف ───
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');
    if (user._id.toString() === req.session.userId.toString()) {
      return res.status(400).send('You cannot delete your own account');
    }
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) return res.status(400).send('Cannot delete the last admin');
    }
    await User.findByIdAndDelete(req.params.id);
    await logActivity(req, { action: 'delete', model: 'User', modelId: user._id, modelLabel: user.username });
    res.redirect('/admin/users?success=' + encodeURIComponent('User deleted: ' + user.username));
  } catch (err) {
    console.error('User delete error:', err);
    res.status(400).send('Delete error: ' + err.message);
  }
});

module.exports = router;
