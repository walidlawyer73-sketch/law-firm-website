// routes/admin/_helpers.js
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function extractPublicId(url) {
  if (!url || typeof url !== 'string') return '';
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return m ? m[1] : '';
}

function toInt(value, fallback) {
  if (fallback === undefined) fallback = 0;
  const n = parseInt(value, 10);
  return isNaN(n) ? fallback : n;
}

function toBool(value) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

module.exports = { slugify, extractPublicId, toInt, toBool };
