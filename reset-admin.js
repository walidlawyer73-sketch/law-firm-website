// reset-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const username = 'admin'; // اسم المستخدم
    const newPassword = 'MyNewStrongPass123!'; // كلمة المرور الجديدة
    const hashed = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { username },
      { password: hashed, role: 'admin', isActive: true },
      { new: true }
    );

    if (user) {
      console.log('✅ Password reset for:', user.username);
      console.log('🔑 New password:', newPassword);
    } else {
      console.log('⚠️ User not found. Creating...');
      await User.create({ username, password: hashed, role: 'admin' });
      console.log('✅ Admin created:', username);
      console.log('🔑 Password:', newPassword);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();