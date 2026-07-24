const User = require('../models/User');
const Cart = require('../models/Cart');
const { AppError } = require('../middleware/errorHandler');
const { generateToken } = require('../middleware/auth');

const mergeGuestCart = async (userId, sessionId) => {
  if (!sessionId) return;

  const guestCart = await Cart.findOne({ sessionId });
  if (!guestCart?.items?.length) return;

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    guestCart.user = userId;
    guestCart.sessionId = undefined;
    await guestCart.save();
    return;
  }

  guestCart.items.forEach((guestItem) => {
    const existingItem = userCart.items.find(
      (item) =>
        item.product.toString() === guestItem.product.toString() &&
        item.variant.size === guestItem.variant.size &&
        item.variant.color.toLowerCase() === guestItem.variant.color.toLowerCase()
    );

    if (existingItem) {
      existingItem.quantity += guestItem.quantity;
    } else {
      userCart.items.push(guestItem.toObject());
    }
  });

  await userCart.save();
  await guestCart.deleteOne();
};

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
    await mergeGuestCart(user._id, req.headers['x-session-id']);
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

    await mergeGuestCart(user._id, req.headers['x-session-id']);
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
