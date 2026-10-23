// ============================================================================
// middleware/errorHandler.js — معالج الأخطاء الموحّد
// ============================================================================

// 404
function notFoundHandler(req, res) {
    if (req.accepts('html')) {
        return res.status(404).send(`
            <!DOCTYPE html>
            <html><head><title>404 Not Found</title>
            <style>body{font-family:system-ui;text-align:center;padding:80px 20px;background:#f8f9fa}
            h1{color:#C9A961;font-size:4rem;margin:0}p{color:#666;margin:20px 0}
            a{color:#A88947;text-decoration:none;font-weight:600}</style></head>
            <body><h1>404</h1><p>The page you're looking for doesn't exist.</p>
            <a href="/">← Back to Home</a></body></html>
        `);
    }
    res.status(404).json({ error: 'Not Found' });
}

// 500
function globalErrorHandler(err, req, res, next) {
    console.error('🔥 Error:', err.message);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);

    if (req.accepts('json')) {
        return res.status(err.status || 500).json({
            error: err.message || 'Internal Server Error'
        });
    }

    res.status(err.status || 500).send(`
        <!DOCTYPE html>
        <html><head><title>Error</title>
        <style>body{font-family:system-ui;text-align:center;padding:80px 20px;background:#f8f9fa}
        h1{color:#dc3545}p{color:#666}a{color:#A88947}</style></head>
        <body><h1>Something went wrong</h1><p>${err.message || 'Please try again later'}</p>
        <a href="/">← Back to Home</a></body></html>
    `);
}

module.exports = { notFoundHandler, globalErrorHandler };