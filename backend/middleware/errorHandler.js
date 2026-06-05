/**
 * Middleware xử lý lỗi tập trung
 * Tất cả lỗi đều được chuyển qua đây trước khi trả về client
 */

// Custom Error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Lỗi có thể dự đoán được (không phải bug)
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware xử lý lỗi Express (4 tham số)
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Xử lý lỗi Mongoose: Document không tìm thấy
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Không tìm thấy tài nguyên';
  }

  // Xử lý lỗi Mongoose: Duplicate key (ví dụ: email đã tồn tại)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} đã tồn tại trong hệ thống`;
  }

  // Xử lý lỗi Mongoose Validation
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Xử lý lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn, vui lòng đăng nhập lại';
  }

  // Log lỗi (chỉ log detail ở môi trường dev)
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Chỉ trả về stack trace ở môi trường development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { AppError, errorHandler };
