const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// ==============================
// DASHBOARD
// ==============================

/**
 * @desc  Thống kê tổng quan dashboard
 * @route GET /api/admin/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const chartStart = new Date(today);
    chartStart.setDate(chartStart.getDate() - 6);

    const [
      totalOrders,
      todayOrders,
      monthRevenue,
      totalProducts,
      lowStockProducts,
      recentOrders,
      pendingOrders,
      salesByDayRaw,
      orderStatusRaw,
      topProducts,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonthStart }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.countDocuments({ isActive: true }),
      // Sản phẩm sắp hết hàng (tổng stock < 10)
      Product.find({ isActive: true })
        .select('name variants')
        .lean()
        .then((products) =>
          products.filter((p) => p.variants.reduce((s, v) => s + v.stock, 0) < 10)
        ),
      Order.find().sort('-createdAt').limit(5)
        .select('orderCode status total createdAt guestInfo user')
        .populate('user', 'fullName email')
        .lean(),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: chartStart },
            status: { $nin: ['cancelled', 'refunded'] },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'Asia/Ho_Chi_Minh',
              },
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: { product: '$items.product', name: '$items.name' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.totalPrice' },
          },
        },
        { $sort: { quantity: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const salesMap = new Map(salesByDayRaw.map((item) => [item._id, item]));
    const salesByDay = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
      const value = salesMap.get(key);
      return {
        date: key,
        label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: value?.revenue || 0,
        orders: value?.orders || 0,
      };
    });

    const statusKeys = [
      'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
    ];
    const statusMap = new Map(orderStatusRaw.map((item) => [item._id, item.count]));
    const ordersByStatus = statusKeys.map((status) => ({
      status,
      count: statusMap.get(status) || 0,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          todayOrders,
          monthRevenue: monthRevenue[0]?.total || 0,
          totalProducts,
          pendingOrders,
          lowStockCount: lowStockProducts.length,
        },
        lowStockProducts: lowStockProducts.slice(0, 5),
        recentOrders,
        charts: {
          salesByDay,
          ordersByStatus,
          topProducts: topProducts.map((item) => ({
            productId: item._id.product,
            name: item._id.name,
            quantity: item.quantity,
            revenue: item.revenue,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// PRODUCT MANAGEMENT
// ==============================

/**
 * @desc  Lấy tất cả sản phẩm (admin - bao gồm inactive)
 * @route GET /api/admin/products
 */
const adminGetProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category, isActive } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name slug category basePrice salePrice isActive isFeatured variants soldCount createdAt')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    // Tính tổng stock cho mỗi sản phẩm
    const productsWithStock = products.map((p) => ({
      ...p,
      totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
    }));

    res.json({
      success: true,
      data: productsWithStock,
      pagination: { page: Number(page), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Tạo sản phẩm mới
 * @route POST /api/admin/products
 */
const createProduct = async (req, res, next) => {
  try {
    // Tự tạo slug từ tên nếu không có
    if (!req.body.slug && req.body.name) {
      req.body.slug = req.body.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    }

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Cập nhật sản phẩm
 * @route PUT /api/admin/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return next(new AppError('Không tìm thấy sản phẩm', 404));
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Xóa mềm sản phẩm (set isActive = false)
 * @route DELETE /api/admin/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return next(new AppError('Không tìm thấy sản phẩm', 404));
    res.json({ success: true, message: 'Đã ẩn sản phẩm' });
  } catch (error) {
    next(error);
  }
};

// ==============================
// ORDER MANAGEMENT
// ==============================

/**
 * @desc  Lấy tất cả đơn hàng
 * @route GET /api/admin/orders
 */
const adminGetOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { 'guestInfo.email': { $regex: search, $options: 'i' } },
        { 'guestInfo.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('orderCode status paymentMethod paymentStatus total createdAt guestInfo user shippingAddress')
        .populate('user', 'fullName email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: Number(page), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Lấy chi tiết đơn hàng
 * @route GET /api/admin/orders/:id
 */
const adminGetOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .lean();
    if (!order) return next(new AppError('Không tìm thấy đơn hàng', 404));
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Cập nhật trạng thái đơn hàng
 * @route PUT /api/admin/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingCode, paymentStatus } = req.body;

    const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!VALID_STATUSES.includes(status)) {
      return next(new AppError('Trạng thái không hợp lệ', 400));
    }

    const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return next(new AppError('Trạng thái thanh toán không hợp lệ', 400));
    }

    const updateData = {
      status,
      $push: {
        statusHistory: {
          status,
          note: note || `Cập nhật bởi admin`,
          changedBy: req.user._id,
        },
      },
    };

    if (trackingCode) updateData.trackingCode = trackingCode;
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      updateData.paidAt = paymentStatus === 'paid' ? new Date() : null;
    }
    if (status === 'delivered') updateData.deliveredAt = new Date();
    if (status === 'shipped') updateData.shippedAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('user', 'fullName email phone');
    if (!order) return next(new AppError('Không tìm thấy đơn hàng', 404));

    res.json({ success: true, data: order, message: 'Đã cập nhật trạng thái đơn hàng' });
  } catch (error) {
    next(error);
  }
};

// ==============================
// SITE / HOMEPAGE CONFIG
// ==============================
const SiteConfig = require('../models/SiteConfig');

/**
 * @desc Get homepage config (singleton)
 * @route GET /api/admin/site/homepage
 */
const getHomepageConfig = async (req, res, next) => {
  try {
    const doc = await SiteConfig.findOne({ key: 'homepage' }).lean();
    res.json({ success: true, data: doc?.data || {} });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update homepage config (upsert)
 * @route PUT /api/admin/site/homepage
 */
const updateHomepageConfig = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const updated = await SiteConfig.findOneAndUpdate(
      { key: 'homepage' },
      { data: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: updated.data, message: 'Homepage config updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adminGetOrders,
  adminGetOrder,
  updateOrderStatus,
  getHomepageConfig,
  updateHomepageConfig,
};
