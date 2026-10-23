// middleware/auth.js
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) return next();
    if (req.accepts('json')) return res.status(401).json({ error: 'Authentication required' });
    res.redirect('/admin/login');
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.session || !req.session.userId) return res.redirect('/admin/login');
    if (!roles.includes(req.session.role)) return res.status(403).send('Access denied');
    next();
};

const redirectIfAuth = (req, res, next) => {
    if (req.session && req.session.userId) return res.redirect('/admin/dashboard');
    next();
};

module.exports = { requireAuth, requireRole, redirectIfAuth };