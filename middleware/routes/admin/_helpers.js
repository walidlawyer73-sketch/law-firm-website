// ============================================================================
// routes/admin/_helpers.js — دوال مساعدة مشتركة
// ============================================================================

/**
 * توليد slug من نص
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s\u0600-\u06FF-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

/**
 * استخراج public_id من Cloudinary URL
 * @param {string} url
 * @returns {string}
 */
function extractPublicId(url) {
    if (!url || typeof url !== 'string') return '';
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : '';
}

/**
 * parse الأرقام بأمان
 */
function toInt(value, fallback = 0) {
    const n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
}

/**
 * parse booleans من نماذج HTML
 */
function toBool(value) {
    return value === true || value === 'true' || value === 'on' || value === '1';
}

module.exports = { slugify, extractPublicId, toInt, toBool };