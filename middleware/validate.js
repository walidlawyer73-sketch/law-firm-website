// ============================================================================
// middleware/validate.js — التحقق من المدخلات باستخدام Zod
// ============================================================================
const { z } = require('zod');

/**
 * Middleware factory — يتحقق من req.body باستخدام schema
 * @param {z.ZodSchema} schema
 */
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            const msg = err.errors
                .map(e => e.path.join('.') + ': ' + e.message)
                .join(' | ');
            return res.status(400).send('Validation error: ' + msg);
        }
        next(err);
    }
};

module.exports = { validate };