const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { calculateShippingFee } = require('../services/shippingService');
const { processPayment } = require('../services/paymentService');

/**
 * @desc    Tạo đơn hàng mới (hỗ trợ cả Guest Checkout và User Checkout)
 * @route   POST /api/orders
 * @access  Public (guest + user đã đăng nhập)
 *
 * Luồng xử lý:
 * 1. Validate dữ liệu đầu vào
 * 2. Verify tồn kho từng sản phẩm
 * 3. Tính phí ship (qua GHN hoặc mặc định)
 * 4. Tính tổng tiền
 * 5. Tạo đơn hàng
 * 6. Trừ tồn kho (atomic)
 * 7. Xử lý thanh toán (redirect URL hoặc COD)
 * 8. Xóa cart
 */
const createOrder = async (req, res, next) => {
  try {
    const {
      items,              // [{ productId, size, color, quantity }]
      shippingAddress,   // { fullName, phone, street, ward, district, province }
      paymentMethod,     // 'cod' | 'momo' | 'zalopay' | 'vietqr'
      couponCode,
      customerNote,
      // Thông tin bắt buộc cho Guest Checkout
      guestInfo,         // { fullName, email, phone } - chỉ cần nếu chưa đăng nhập
    } = req.body;

    const userId = req.user?._id || null;
    const sessionId = req.headers['x-session-id'];

    // ==============================
    // BƯỚC 1: Validate guest vs user
    // ==============================
    if (!userId && !guestInfo?.email) {
      return next(new AppError('Vui lòng cung cấp email để tiếp tục mua hàng', 400));
    }

    if (!shippingAddress || !paymentMethod) {
      return next(new AppError('Thiếu thông tin địa chỉ hoặc phương thức thanh toán', 400));
    }

    // ==============================
    // BƯỚC 2: Verify tồn kho & build order items
    // ==============================
    const orderItems = [];
    let subtotal = 0;

    // Dùng Promise.all để query song song, tối ưu performance
    await Promise.all(
      items.map(async ({ productId, size, color, quantity }) => {
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
          throw new AppError(`Sản phẩm không tồn tại hoặc đã ngừng bán`, 400);
        }

        const variant = product.variants.find(
          (v) =>
            v.size === size?.toUpperCase() &&
            v.color?.toLowerCase() === color?.toLowerCase()
        );

        if (!variant) {
          throw new AppError(
            `${product.name} không có Size ${size} - Màu ${color}`,
            400
          );
        }

        if (variant.stock < quantity) {
          throw new AppError(
            `${product.name} (Size ${size}, ${color}) chỉ còn ${variant.stock} sản phẩm`,
            400
          );
        }

        const unitPrice = variant.priceOverride ?? product.salePrice ?? product.basePrice;
        const totalPrice = unitPrice * quantity;

        orderItems.push({
          product: productId,
          name: product.name,
          image: product.images[0],
          slug: product.slug,
          variant: {
            size: size.toUpperCase(),
            color: variant.color,
            sku: variant.sku,
          },
          quantity,
          unitPrice,
          totalPrice,
        });

        subtotal += totalPrice;
      })
    );

    // ==============================
    // BƯỚC 3: Tính phí vận chuyển
    // ==============================
    // Gọi service GHN - nếu lỗi thì dùng fee mặc định
    let shippingFee = 30000; // Mặc định 30k
    try {
      shippingFee = await calculateShippingFee({
        toDistrict: shippingAddress.district,
        toWard: shippingAddress.ward,
        weight: 500, // gram - TODO: tính từ sản phẩm thực tế
      });
    } catch {
      // Shipping service chưa cấu hình - dùng fee mặc định
      console.warn('⚠️  Shipping service unavailable, using default fee');
    }

    // ==============================
    // BƯỚC 4: Tính giảm giá coupon (placeholder)
    // ==============================
    let discount = 0;
    if (couponCode) {
      // TODO: Implement coupon logic
      // discount = await applyCoupon(couponCode, subtotal);
      console.log(`Coupon ${couponCode} - feature coming soon`);
    }

    const total = subtotal + shippingFee - discount;

    // ==============================
    // BƯỚC 5: Tạo đơn hàng trong DB
    // ==============================
    const orderData = {
      user: userId,
      guestInfo: !userId ? guestInfo : undefined,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total,
      couponCode: couponCode?.toUpperCase(),
      customerNote,
      statusHistory: [
        { status: 'pending', note: 'Đơn hàng vừa được tạo' },
      ],
    };

    const order = await Order.create(orderData);

    // ==============================
    // BƯỚC 6: Trừ tồn kho (atomic bulk write)
    // ==============================
    const bulkOps = items.map(({ productId, size, color, quantity }) => ({
      updateOne: {
        filter: {
          _id: productId,
          'variants.size': size.toUpperCase(),
          'variants.color': { $regex: new RegExp(`^${color}$`, 'i') },
          'variants.stock': { $gte: quantity },
        },
        update: {
          $inc: {
            'variants.$.stock': -quantity,
            soldCount: quantity,
          },
        },
      },
    }));

    await Product.bulkWrite(bulkOps);

    // ==============================
    // BƯỚC 7: Xử lý thanh toán
    // ==============================
    let paymentData = null;

    if (paymentMethod !== 'cod') {
      try {
        paymentData = await processPayment({
          method: paymentMethod,
          orderId: order._id.toString(),
          orderCode: order.orderCode,
          amount: total,
          orderDescription: `Thanh toán đơn hàng BoBo ${order.orderCode}`,
          returnUrl: `${process.env.CLIENT_URL}/checkout/result`,
          cancelUrl: `${process.env.CLIENT_URL}/checkout/cancel`,
        });
      } catch (paymentError) {
        // Thanh toán thất bại - cập nhật status nhưng không xóa đơn
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: 'failed',
          $push: { statusHistory: { status: 'pending', note: 'Thanh toán thất bại: ' + paymentError.message } },
        });
        return next(new AppError('Không thể khởi tạo thanh toán, vui lòng thử lại', 502));
      }
    }

    // ==============================
    // BƯỚC 8: Xóa giỏ hàng sau khi đặt hàng thành công
    // ==============================
    if (userId) {
      await Cart.findOneAndDelete({ user: userId });
    } else if (sessionId) {
      await Cart.findOneAndDelete({ sessionId });
    }

    // ==============================
    // RESPONSE
    // ==============================
    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: {
        order: {
          _id: order._id,
          orderCode: order.orderCode,
          total: order.total,
          paymentMethod: order.paymentMethod,
          status: order.status,
        },
        // URL redirect cho thanh toán online (MoMo, ZaloPay...)
        paymentUrl: paymentData?.paymentUrl || null,
        // QR code data cho VietQR
        qrData: paymentData?.qrData || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy chi tiết đơn hàng (user hoặc guest dùng orderCode + email)
 * @route   GET /api/orders/:orderCode
 * @access  Mixed
 */
const getOrderByCode = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    const { email } = req.query; // Cho guest tra cứu đơn hàng

    const order = await Order.findOne({ orderCode: orderCode.toUpperCase() })
      .populate('user', 'fullName email')
      .lean();

    if (!order) {
      return next(new AppError('Không tìm thấy đơn hàng', 404));
    }

    // Kiểm tra quyền truy cập
    const isOwner = req.user && order.user?._id.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    const isGuestWithEmail = !req.user && email && order.guestInfo?.email === email;

    if (!isOwner && !isAdmin && !isGuestWithEmail) {
      return next(new AppError('Bạn không có quyền xem đơn hàng này', 403));
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách đơn hàng của user
 * @route   GET /api/orders/my-orders
 * @access  Private (đăng nhập)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .select('orderCode status total paymentMethod createdAt items')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments({ user: req.user._id }),
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
 * @desc    Hủy đơn hàng
 * @route   PUT /api/orders/:orderCode/cancel
 * @access  Private
 */
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderCode: req.params.orderCode.toUpperCase(),
      user: req.user._id,
    });

    if (!order) return next(new AppError('Không tìm thấy đơn hàng', 404));

    // Chỉ cho phép hủy đơn đang chờ xác nhận
    if (!['pending', 'confirmed'].includes(order.status)) {
      return next(new AppError('Không thể hủy đơn hàng đang được xử lý', 400));
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Khách hàng hủy đơn', changedBy: req.user._id });
    await order.save();

    // TODO: Hoàn tồn kho nếu cần
    res.json({ success: true, message: 'Đơn hàng đã được hủy', data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getOrderByCode, getMyOrders, cancelOrder };
