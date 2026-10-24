// scripts/create-admin.js — إصدار بسيط بدون setRawMode
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI missing in .env');
  process.exit(0);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  try {
    console.log('\n========================================');
    console.log('  Setup Admin Account');
    console.log('========================================\n');

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('DB Connected\n');

    const username = await new Promise(r => rl.question('Username (default: admin): ', a => r(a.trim() || 'admin')));
    const password = await new Promise(r => rl.question('Password (min 8 chars, visible): ', a => r(a.trim())));

    if (password.length < 8) {
      console.log('Password too short');
      rl.close();
      await mongoose.connection.close();
      return;
    }

    const exists = await User.findOne({ username });
    if (exists) {
      exists.password = password;
      exists.role = 'admin';
      exists.isActive = true;
      await exists.save();
      console.log('\n✅ Admin UPDATED:', username);
    } else {
      const admin = new User({ username, password, role: 'admin', isActive: true });
      await admin.save();
      console.log('\n✅ Admin CREATED:', username);
    }

    console.log('\n════════════════════════════════════════');
    console.log('  Login at:');
    console.log('  Local:  http://localhost:3000/admin/login');
    console.log('  Vercel: https://law-arb-ip-walid.vercel.app/admin/login');
    console.log('════════════════════════════════════════\n');

    rl.close();
    await mongoose.connection.close();
    // لا نستخدم process.exit — يترك الترمنال مفتوحاً
  } catch (err) {
    console.error('\nError:', err.message);
    if (rl) rl.close();
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
  }
})();
