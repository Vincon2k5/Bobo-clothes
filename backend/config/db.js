const mongoose = require('mongoose');

/**
 * Kết nối tới MongoDB
 * Sử dụng mongoose với các options tối ưu cho production
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ không cần các options deprecated nữa
      // nhưng giữ lại để tương thích
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Lắng nghe các sự kiện kết nối
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Thoát process nếu không kết nối được DB
  }
};

module.exports = connectDB;
