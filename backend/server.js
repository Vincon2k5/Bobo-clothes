require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ==============================
// Khởi tạo Express app
// ==============================
const app = express();

// ==============================
// Kết nối Database
// ==============================
connectDB();

// ==============================
// Security Middlewares
// ==============================

// Helmet: Thiết lập các HTTP security headers
app.use(helmet());

// CORS: Chỉ cho phép frontend BoBo gọi API
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// Rate Limiting: Chống DDoS và brute-force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200,                  // Tối đa 200 requests/IP/15 phút
  message: {
    success: false,
    message: 'Quá nhiều request, vui lòng thử lại sau 15 phút',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Rate limit nghiêm hơn cho checkout (chống spam đơn hàng)
const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10,                   // Tối đa 10 đơn/IP/giờ
  message: { success: false, message: 'Bạn đã đặt quá nhiều đơn hàng, vui lòng thử lại sau' },
});

// ==============================
// Request Parsing Middlewares
// ==============================
app.use(express.json({ limit: '10kb' })); // Giới hạn payload 10KB
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ==============================
// QUAN TRỌNG: Chống NoSQL Injection
// express-mongo-sanitize loại bỏ $ và . khỏi req.body, req.query, req.params
// Ngăn chặn các attack như: { "email": { "$gt": "" } }
// ==============================
app.use(mongoSanitize({
  replaceWith: '_',       // Thay thế ký tự nguy hiểm bằng _
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  NoSQL Injection attempt detected - Key: ${key} - IP: ${req.ip}`);
  },
}));

// ==============================
// Logging (chỉ ở môi trường dev)
// ==============================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==============================
// API Routes
// ==============================
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders/checkout', checkoutLimiter); // Rate limit checkout endpoint

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🛍️ BoBo API is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ==============================
// 404 Handler
// ==============================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
  });
});

// ==============================
// Global Error Handler (PHẢI để cuối cùng)
// ==============================
app.use(errorHandler);

// ==============================
// Khởi động Server
// ==============================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 BoBo API Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}/api\n`);
});

// Xử lý unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
