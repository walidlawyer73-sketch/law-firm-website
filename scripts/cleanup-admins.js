// scripts/cleanup-admins.js — حذف كل الحسابات ما عدا الحساب المحدد
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const KEEP = 'walidlawyerippro'; // الحساب الذي تريد الاحتفاظ به

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ DB Connected\n');

    // حذف كل الحسابات ما عدا KEEP
    const result = await User.deleteMany({
      username: { $ne: KEEP }
    });

    console.log(`✅ حُذف ${result.deletedCount} حساب قديم\n`);

    const remaining = await User.find({}, 'username role isActive').lean();
    console.log('الحسابات المتبقية:');
    remaining.forEach(u => {
      console.log(`  - ${u.username} (${u.role}, active: ${u.isActive})`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
})();
