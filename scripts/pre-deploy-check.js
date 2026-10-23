// scripts/pre-deploy-check.js
// التشغيل: node scripts/pre-deploy-check.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const checks = [];
function check(name, condition, detail) {
  checks.push({ name, pass: !!condition, detail: detail || '' });
}

// ─── 1) .env موجود؟ ───
check('.env file exists', fs.existsSync('.env'), fs.existsSync('.env') ? '' : '❌ أنشئ .env');

// ─── 2) .env في .gitignore؟ ───
if (fs.existsSync('.gitignore')) {
  const gi = fs.readFileSync('.gitignore', 'utf8');
  check('.env is gitignored', gi.includes('.env'), gi.includes('.env') ? '' : '❌ أضف .env إلى .gitignore');
} else {
  check('.gitignore exists', false, '❌ أنشئ .gitignore');
}

// ─── 3) المتغيرات الحرجة ───
const required = ['MONGODB_URI', 'SESSION_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
required.forEach(v => {
  const val = process.env[v];
  check('ENV: ' + v, val && val !== 'undefined', val ? '' : '❌ مفقود');
});

// ─── 4) SESSION_SECRET قوي؟ ───
const ss = process.env.SESSION_SECRET || '';
check('SESSION_SECRET length >= 32', ss.length >= 32, ss.length >= 32 ? '' : '❌ قصير — استخدم 64 حرفاً');

// ─── 5) ADMIN_PASSWORD قوي؟ ───
const ap = process.env.ADMIN_PASSWORD || '';
check('ADMIN_PASSWORD length >= 12', ap.length >= 12, ap.length >= 12 ? '' : '❌ قصير جداً');

// ─── 6) Cloudinary ───
check('CLOUDINARY_CLOUD_NAME', !!process.env.CLOUDINARY_CLOUD_NAME);
check('CLOUDINARY_API_KEY', !!process.env.CLOUDINARY_API_KEY);
check('CLOUDINARY_API_SECRET', !!process.env.CLOUDINARY_API_SECRET);

// ─── 7) MongoDB URI صالح ───
const uri = process.env.MONGODB_URI || '';
check('MONGODB_URI starts with mongodb', uri.startsWith('mongodb'), '❌ رابط غير صالح');
check('MONGODB_URI has credentials', uri.includes('@'), '❌ لا يحتوي على user:pass@');

// ─── 8) الملفات الحرجة موجودة ───
const criticalFiles = ['server.js', 'package.json', 'vercel.json'];
criticalFiles.forEach(f => {
  check('File: ' + f, fs.existsSync(f), fs.existsSync(f) ? '' : '❌ مفقود');
});

// ─── 9) Server.js سليم ───
const { execSync } = require('child_process');
try {
  execSync('node --check server.js', { stdio: 'pipe' });
  check('server.js syntax', true);
} catch (e) {
  check('server.js syntax', false, '❌ خطأ في الصياغة');
}

// ─── 10) package.json engines ───
try {
  const pkg = require('./package.json');
  check('package.json has engines', !!pkg.engines, pkg.engines ? '' : '⚠️ يفضل إضافة engines.node');
  check('package.json main = server.js', pkg.main === 'server.js', 'main: ' + pkg.main);
} catch (e) {
  check('package.json readable', false, e.message);
}

// ─── الطباعة ───
console.log('\n════════════════════════════════════════');
console.log('   PRE-DEPLOYMENT CHECK');
console.log('════════════════════════════════════════\n');

let passCount = 0, failCount = 0;
checks.forEach(c => {
  if (c.pass) { console.log('✅ ' + c.name + (c.detail ? ' — ' + c.detail : '')); passCount++; }
  else { console.log('❌ ' + c.name + (c.detail ? ' — ' + c.detail : '')); failCount++; }
});

console.log('\n════════════════════════════════════════');
console.log('Result: ' + passCount + ' passed, ' + failCount + ' failed');
console.log('════════════════════════════════════════\n');

process.exit(failCount > 0 ? 1 : 0);
