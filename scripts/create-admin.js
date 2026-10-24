// ============================================================================
// scripts/create-admin.js — إنشاء/تحديث حساب الأدمن بشكل تفاعلي آمن
// التشغيل: node scripts/create-admin.js
// ============================================================================
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI missing in .env');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise(r => rl.question(q, a => r(a.trim())));
}

function askPassword(q) {
  return new Promise(resolve => {
    process.stdout.write(q);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let pwd = '';
    const onData = (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(pwd);
      } else if (ch === '\u0003') {
        process.exit();
      } else if (ch === '\u007f' || ch === '\b') {
        if (pwd.length > 0) { pwd = pwd.slice(0, -1); process.stdout.write('\b \b'); }
      } else {
        pwd += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

(async () => {
  try {
    console.log('\n========================================');
    console.log('  Setup Admin Account');
    console.log('========================================\n');

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('DB Connected\n');

    const username = (await ask('Username (default: admin): ')) || 'admin';
    console.log('');

    let password = '';
    while (password.length < 8) {
      password = await askPassword('Password (min 8 chars): ');
      if (password.length < 8) console.log('Too short, try again\n');
    }

    const confirm = await askPassword('Confirm password: ');
    if (password !== confirm) {
      console.log('\nPasswords do not match');
      process.exit(1);
    }

    rl.close();

    let user = await User.findOne({ username });
    if (user) {
      user.password = password;
      user.role = 'admin';
      user.isActive = true;
      await user.save();
      console.log('\nAdmin UPDATED:', username);
    } else {
      user = new User({ username, password, role: 'admin', isActive: true });
      await user.save();
      console.log('\nAdmin CREATED:', username);
    }

    console.log('\n========================================');
    console.log('Login at:');
    console.log('  Local:  http://localhost:3000/admin/login');
    console.log('  Vercel: https://law-arb-ip-walid.vercel.app/admin/login');
    console.log('========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\nError:', err.message);
    if (rl) rl.close();
    process.exit(1);
  }
})();
