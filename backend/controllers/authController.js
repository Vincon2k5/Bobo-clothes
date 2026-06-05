const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { generateToken } = require('../middleware/auth');

/**
 * @desc  Đăng ký tài khoản
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return next(new AppError('Email đã được sử dụng', 409));

    const user = await User.create({ fullName, email, password, phone });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Đăng nhập
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError('Vui lòng nhập email và mật khẩu', 400));

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) return next(new AppError('Email hoặc mật khẩu không đúng', 401));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new AppError('Email hoặc mật khẩu không đúng', 401));

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Lấy thông tin user hiện tại
 * @route GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { register, login, getMe };
