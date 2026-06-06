/**
 * Tạo tài khoản admin mặc định
 * Chạy: node utils/createAdmin.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const createAdmin = async () => {
  await connectDB();
  try {
    console.log(`ℹ️  Target MongoDB: ${process.env.MONGO_URI?.replace(/:\/\/.*@/, '://***:***@') || 'undefined'}`);
    const existing = await User.findOne({ email: 'admin@bobo.vn' });
    if (existing) {
      existing.fullName = 'BoBo Admin';
      existing.role = 'admin';
      existing.isActive = true;
      existing.password = 'Admin@123';
      await existing.save();

      console.log('✅ Admin đã tồn tại và đã được reset mật khẩu: admin@bobo.vn');
      console.log('   Password: Admin@123');
      process.exit(0);
    }

    await User.create({
      fullName: 'BoBo Admin',
      email: 'admin@bobo.vn',
      password: 'Admin@123',
      role: 'admin',
    });

    console.log('✅ Tạo admin thành công!');
    console.log('   Email:    admin@bobo.vn');
    console.log('   Password: Admin@123');
    console.log('   ⚠️  Hãy đổi mật khẩu sau khi đăng nhập!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
};

createAdmin();
