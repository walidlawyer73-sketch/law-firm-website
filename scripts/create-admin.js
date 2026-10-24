// ============================================================================
// scripts/create-admin.js
// ⚠️  عدّل البيانات في السطور 9-10، ثم شغّل: node scripts/create-admin.js
// ============================================================================
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════════════════════════
// 🔴🔴🔴 عدّل هنا — اسم المستخدم وكلمة المرور 🔴🔴🔴
// ═══════════════════════════════════════════════════════════════════════════
const ADMIN_USERNAME = 'admin';              // ← غيّر اسم المستخدم هنا
const ADMIN_PASSWORD = 'Admin@2026!Strong';  // ← غيّر كلمة المرور هنا (8+ أحرف)
// ═══════════════════════════════════════════════════════════════════════════

// ─── التحقق من المتطلبات ──────────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI مفقود في .env');
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error('❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  process.exit(1);
}

// ─── التنفيذ ──────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('\n════════════════════════════════════════');
    console.log('  إنشاء / تحديث حساب الأدمن');
    console.log('════════════════════════════════════════\n');

    console.log('📌 البيانات التي ستُحفظ:');
    console.log('   Username:', ADMIN_USERNAME);
    console.log('   Password:', '*'.repeat(ADMIN_PASSWORD.length), `(${ADMIN_PASSWORD.length} أحرف)`);
    console.log('');

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000
    });
    console.log('✅ متصل بقاعدة البيانات\n');

    let user = await User.findOne({ username: ADMIN_USERNAME });

    if (user) {
      user.password = ADMIN_PASSWORD;
      user.role = 'admin';
      user.isActive = true;
      await user.save();
      console.log('✅ تم تحديث حساب الأدمن:', ADMIN_USERNAME);
    } else {
      user = new User({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        role: 'admin',
        isActive: true
      });
      await user.save();
      console.log('✅ تم إنشاء حساب أدمن جديد:', ADMIN_USERNAME);
    }

    console.log('\n════════════════════════════════════════');
    console.log('🎉 جاهز للدخول:');
    console.log('   محلياً:  http://localhost:3000/admin/login');
    console.log('   Vercel: https://law-arb-ip-walid.vercel.app/admin/login');
    console.log('   Username:', ADMIN_USERNAME);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('════════════════════════════════════════\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
})();