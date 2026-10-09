// ==================== fix-logo.js ====================
// Script to fix logo references in all HTML files
// Run: node fix-logo.js

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');

// Old reference (with spaces) → New reference (with dashes)
const REPLACEMENTS = [
    { from: /\/images\/logo arb ip\.png/g, to: '/images/logo-arb-ip.png' },
    { from: /\/images\/logo%20arb%20ip\.png/g, to: '/images/logo-arb-ip.png' },
    { from: /logo arb ip\.png/g, to: 'logo-arb-ip.png' }
];

let filesUpdated = 0;
let totalReplacements = 0;

function processDirectory(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            processDirectory(fullPath);
        } else if (item.name.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let fileReplacements = 0;
            let newContent = content;

            for (const { from, to } of REPLACEMENTS) {
                const matches = newContent.match(from);
                if (matches) {
                    fileReplacements += matches.length;
                    newContent = newContent.replace(from, to);
                }
            }

            if (fileReplacements > 0) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                const relPath = path.relative(PUBLIC_DIR, fullPath);
                console.log(`✅ ${relPath} → ${fileReplacements} replacement(s)`);
                filesUpdated++;
                totalReplacements += fileReplacements;
            }
        }
    }
}

console.log('\n🔧 Fixing logo references...\n');
console.log('='.repeat(60));

processDirectory(PUBLIC_DIR);

console.log('='.repeat(60));
console.log(`\n✅ Files updated: ${filesUpdated}`);
console.log(`✅ Total replacements: ${totalReplacements}\n`);
console.log('Done! Now redeploy to Vercel.\n');