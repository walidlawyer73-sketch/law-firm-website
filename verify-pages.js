// ==================== verify-pages.js ====================
// Script to verify all pages are Mega Menu compatible
// Run: node verify-pages.js

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');

const REQUIRED_CHECKS = [
    { name: 'main.js loaded', test: (c) => c.includes('/js/main.js') },
    { name: 'style.css loaded', test: (c) => c.includes('/css/style.css') },
    { name: 'Navbar present', test: (c) => c.includes('class="navbar') },
    { name: 'Services dropdown', test: (c) => /dropdown-toggle[^>]*>\s*(Services|الخدمات)/.test(c) },
    { name: 'Trial banner', test: (c) => c.includes('id="trial-banner"') },
    { name: 'Language switcher', test: (c) => c.includes('language-switcher') }
];

function scanDirectory(dir, results = []) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            scanDirectory(fullPath, results);
        } else if (item.name.endsWith('.html')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const relPath = path.relative(PUBLIC_DIR, fullPath);
            const issues = [];

            for (const check of REQUIRED_CHECKS) {
                if (!check.test(content)) {
                    issues.push(check.name);
                }
            }

            results.push({
                file: relPath,
                status: issues.length === 0 ? '✅' : '⚠️',
                issues
            });
        }
    }

    return results;
}

console.log('\n🔍 Scanning all HTML pages...\n');
console.log('='.repeat(70));

const results = scanDirectory(PUBLIC_DIR);

const ok = results.filter(r => r.status === '✅');
const warn = results.filter(r => r.status === '⚠️');

console.log(`\n✅ Fully compatible: ${ok.length}`);
console.log(`⚠️  Need attention: ${warn.length}`);
console.log(`📊 Total: ${results.length}\n`);
console.log('='.repeat(70));

if (warn.length > 0) {
    console.log('\n⚠️  Pages that need updates:\n');
    warn.forEach(r => {
        console.log(`\n📄 ${r.file}`);
        r.issues.forEach(issue => console.log(`   ❌ Missing: ${issue}`));
    });
}

console.log('\n' + '='.repeat(70));
console.log('Done.\n');