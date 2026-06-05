const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

/**
 * Middleware: Xác thực JWT token - bắt buộc đăng nhập
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ Authorization header hoặc cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Vui lòng đăng nhập để tiếp tục', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra user vẫn tồn tại trong DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return next(new AppError('Tài khoản không tồn tại hoặc đã bị khóa', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Xác thực tùy chọn - không bắt buộc đăng nhập
 * Dùng cho các route hỗ trợ cả guest và user đã đăng nhập
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user?.isActive) req.user = user;
    }
    next();
  } catch {
    // Bỏ qua lỗi token - tiếp tục như guest
    next();
  }
};

/**
 * Middleware: Kiểm tra quyền admin
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
  }
  next();
};

/**
 * Utility: Tạo JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = { protect, optionalAuth, adminOnly, generateToken };
