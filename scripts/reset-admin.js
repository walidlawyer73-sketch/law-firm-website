require('dotenv').config();
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const USERNAME = (process.argv[2] || 'admin').trim();
const PASSWORD = (process.argv[3] || 'Admin@2026!').trim();

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db();
  const users = db.collection('users');

  const hash = bcrypt.hashSync(PASSWORD, 10);

  // ابحث case-insensitively
  const existing = await users.findOne({
    username: { $regex: `^${USERNAME}$`, $options: 'i' }
  });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      { $set: { username: USERNAME, password: hash, role: 'admin', updatedAt: new Date() } }
    );
    console.log(`✅ حُدّث الحساب: ${existing.username} → ${USERNAME}`);
  } else {
    await users.insertOne({
      username: USERNAME,
      password: hash,
      role: 'admin',
      email: 'walidlegal.ippro@gmail.com',
      createdAt: new Date()
    });
    console.log(`✅ أُنشئ حساب جديد: ${USERNAME}`);
  }

  console.log(`\n📋 بيانات الدخول:\n   Username: ${USERNAME}\n   Password: ${PASSWORD}`);
  await c.close();
})();