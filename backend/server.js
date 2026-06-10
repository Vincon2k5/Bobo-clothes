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
const siteRoutes = require('./routes/siteRoutes');

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
// CORS: cho phép một hoặc nhiều origin (CLIENT_URL hoặc CLIENT_URLS)
const clientUrl = process.env.CLIENT_URL || '';
const clientUrlsRaw = (process.env.CLIENT_URLS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Build allow list; entries may be full origins (https://...) or plain host suffixes like 'vercel.app'
const allowedExactOrigins = new Set();
const allowedHostSuffixes = new Set();

if (clientUrl) {
  allowedExactOrigins.add(clientUrl);
}
for (const entry of clientUrlsRaw) {
  if (/^https?:\/\//i.test(entry)) allowedExactOrigins.add(entry);
  else allowedHostSuffixes.add(entry.replace(/^\./, ''));
}

// Always allow localhost dev origins
allowedExactOrigins.add('http://localhost:5173');
allowedExactOrigins.add('http://localhost:4173');

const allowAllCors = process.env.ALLOW_ALL_CORS === 'true';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g., server-to-server, curl) with no origin
      if (!origin) return callback(null, true);
      if (allowAllCors) return callback(null, true);
      if (allowedExactOrigins.has(origin)) return callback(null, true);

      // Check host suffixes (e.g., any preview on vercel.app)
      try {
        const url = new URL(origin);
        const host = url.host; // includes hostname and port
        for (const suffix of allowedHostSuffixes) {
          if (host === suffix || host.endsWith(`.${suffix}`)) return callback(null, true);
        }
      } catch (err) {
        // ignore parse errors
      }

      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
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

// Prevent CDN/proxy from caching API responses that vary by Origin.
// Some CDNs may cache responses (including CORS headers) and return
// the wrong `Access-Control-Allow-Origin` for subsequent requests.
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

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
app.use('/api/site', siteRoutes);
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
