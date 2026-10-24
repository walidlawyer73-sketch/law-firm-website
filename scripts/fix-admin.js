require('dotenv').config();
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

(async () => {
  const c = new MongoClient(process.env.MONGODB_URI);
  await c.connect();
  const db = c.db();
  const users = db.collection('users');

  const PASSWORD = 'Admin@2026!';
  const hash = bcrypt.hashSync(PASSWORD, 10);

  // شيل أي حساب بنفس الاسم (case-insensitive) وأعد إنشاءه
  await users.deleteMany({ username: { $regex: '^admin$', $options: 'i' } });

  await users.insertOne({
    username: 'admin',
    email: 'walidlegal.ippro@gmail.com',
    password: hash,
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // تأكد إن كل الحسابات التانية عندها email (لصفحة "نسيت كلمة السر")
  await users.updateMany(
    { $or: [{ email: { $exists: false } }, { email: null }, { email: '' }] },
    { $set: { email: 'walidlegal.ippro@gmail.com' } }
  );

  console.log('✅ admin ready');
  console.log('   username: admin');
  console.log('   password:', PASSWORD);
  console.log('   email   : walidlegal.ippro@gmail.com');

  // تحقق فوري
  const check = await users.findOne({ username: 'admin' });
  console.log('   bcrypt verify:', await bcrypt.compare(PASSWORD, check.password) ? '✅' : '❌');
  await c.close();
})();