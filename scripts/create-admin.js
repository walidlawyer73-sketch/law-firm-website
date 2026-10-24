// ============================================================================
// scripts/create-admin.js — إنشاء/تحديث حساب الأدمن بشكل آمن
// التشغيل: node scripts/create-admin.js
// ============================================================================
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const User = require('../models/User');

// التحقق من تطابق متغيرات البيئة أولاً
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI غير موجود في .env');
  process.exit(1);
}

// إعداد readline للأسئلة التفاعلية
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function askPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    const onData = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        stdout.write('\n');
        resolve(password);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
      } else {
        password += char;
        stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  try {
    console.log('\n════════════════════════════════════════');
    console.log('   إنشاء / تحديث حساب الأدمن');
    console.log('════════════════════════════════════════\n');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ اتصل بقاعدة البيانات\n');
    
    const username = await ask('اسم المستخدم (افتراضي: admin): ') || 'admin';
    console.log('');
    
    let password = '';
    while (password.length < 8) {
      password = await askPassword('كلمة المرور (8 أحرف على الأقل): ');
      if (password.length < 8) {
        console.log('❌ كلمة المرور قصيرة جداً — حاول مرة أخرى\n');
      }
    }
    
    const confirm = await askPassword('تأكيد كلمة المرور: ');
    if (password !== confirm) {
      console.log('\n❌ كلمتا المرور غير متطابقتين');
      process.exit(1);
    }
    
    rl.close();
    
    // البحث عن المستخدم أو إنشاؤه
    let user = await User.findOne({ username });
    
    if (user) {
      user.password = password;
      user.role = 'admin';
      user.isActive = true;
      await user.save();
      console.log('\n✅ تم تحديث حساب الأدمن:', username);
    } else {
      user = new User({
        username,
        password,
        role: 'admin',
        isActive: true
      });
      await user.save();
      console.log('\n✅ تم إنشاء حساب أدمن جديد:', username);
    }
    
    console.log('\n════════════════════════════════════════');
    console.log('   بيانات الدخول:');
    console.log('   Username:', username);
    console.log('   Password: ******** (التي أدخلتها)');
    console.log('════════════════════════════════════════');
    console.log('\n📌 استخدم هذه البيانات في:');
    console.log('   محلياً:  http://localhost:3000/admin/login');
    console.log('   Vercel:  https://law-arb-ip-walid.vercel.app/admin/login');
    console.log('\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    if (rl) rl.close();
    process.exit(1);
  }
}

main();
