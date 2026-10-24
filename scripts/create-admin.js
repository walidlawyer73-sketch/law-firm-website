// ============================================================================
// scripts/create-admin.js
// ✏️ عدّل القيم في الأسطر 12-14 ثم شغّل السكربت
// التشغيل: node scripts/create-admin.js
// ============================================================================

// ═══════════════════════════════════════════════════════════════
// ✏️✏️✏️  عَدِّلْ هَذِهِ الْقِيَمَ  ✏️✏️✏️
// ═══════════════════════════════════════════════════════════════
const ADMIN_USERNAME = 'Walidlawyerip';                      // ← اسم المستخدم
const ADMIN_PASSWORD = 'Walidiplawyer2026@';           // ← كلمة المرور (8 أحرف على الأقل)
const ADMIN_EMAIL    = 'walidlegal.ippro@gmail.com'; // ← البريد (لإرسال نسيت البيانات)
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in .env');
  process.exit(1);
}

(async () => {
  try {
    console.log('\n════════════════════════════════════════');
    console.log('  إنشاء / تحديث حساب الأدمن');
    console.log('════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ تم الاتصال بقاعدة البيانات\n');

    console.log('📋 البيانات التي ستُستخدم:');
    console.log('   Username:', ADMIN_USERNAME);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   Email:   ', ADMIN_EMAIL);
    console.log('');

    // البحث عن المستخدم
    let user = await User.findOne({ username: ADMIN_USERNAME });

    if (user) {
      user.password = ADMIN_PASSWORD;
      user.email = ADMIN_EMAIL;
      user.role = 'admin';
      user.isActive = true;
      await user.save();
      console.log('✅ تم تحديث حساب الأدمن:', ADMIN_USERNAME);
    } else {
      user = new User({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        email: ADMIN_EMAIL,
        role: 'admin',
        isActive: true
      });
      await user.save();
      console.log('✅ تم إنشاء حساب أدمن جديد:', ADMIN_USERNAME);
    }

    console.log('\n════════════════════════════════════════');
    console.log('  بيانات الدخول:');
    console.log('  Username: ' + ADMIN_USERNAME);
    console.log('  Password: ' + ADMIN_PASSWORD);
    console.log('════════════════════════════════════════');
    console.log('\n📌 اختبر الدخول الآن:');
    console.log('   Vercel:  https://law-arb-ip-walid.vercel.app/admin/login');
    console.log('   Local:   http://localhost:3000/admin/login');
    console.log('\n');

    await mongoose.connection.close();
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    process.exit(1);
  }
})();
