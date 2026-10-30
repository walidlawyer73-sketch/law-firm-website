require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const users = mongoose.connection.db.collection('users');
  const count = await users.countDocuments();
  const admin = await users.findOne({ username: 'admin' });

  console.log('=== Vercel DB state ===');
  console.log('cluster  :', process.env.MONGODB_URI.match(/@([^/]+)/)?.[1]);
  console.log('database :', mongoose.connection.db.databaseName);
  console.log('users    :', count);
  console.log('admin    :', admin ? {
    username: admin.username,
    email: admin.email,
    hashPrefix: admin.password?.slice(0, 15),
    hashLen: admin.password?.length,
    updatedAt: admin.updatedAt
  } : 'NOT FOUND');

  // اختبار مقارنة فوري
  if (admin) {
    const bcrypt = require('bcryptjs');
    const ok = await bcrypt.compare('Admin@2026!', admin.password);
    console.log('bcrypt   : Admin@2026! ->', ok ? '✅ MATCH' : '❌ NO MATCH');
  }

  await mongoose.disconnect();
})();