const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  // Snapshot đầy đủ để đơn hàng không bị ảnh hưởng nếu product thay đổi
  name: { type: String, required: true },
  image: { type: String, required: true },
  slug: String,
  variant: {
    size: { type: String, required: true },
    color: { type: String, required: true },
    sku: String,
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  ward: { type: String, required: true },
  district: { type: String, required: true },
  province: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    // Mã đơn hàng hiển thị (thân thiện hơn ObjectId)
    orderCode: {
      type: String,
      unique: true,
      uppercase: true,
    },

    // User đã đăng nhập hoặc null nếu guest
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Thông tin khách mua (bắt buộc, dùng cho cả guest checkout)
    guestInfo: {
      fullName: String,
      email: {
        type: String,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
      },
      phone: String,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'Đơn hàng cần ít nhất 1 sản phẩm',
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // ==============================
    // Giá trị đơn hàng
    // ==============================
    subtotal: { type: Number, required: true, min: 0 }, // Tổng tiền hàng
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, default: 0, min: 0 }, // Giảm giá từ coupon
    total: { type: Number, required: true, min: 0 }, // Tổng thanh toán

    couponCode: { type: String, uppercase: true, trim: true },

    // ==============================
    // Thanh toán
    // ==============================
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cod', 'momo', 'zalopay', 'vietqr', 'bank_transfer'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    // Lưu transaction ID từ cổng thanh toán
    paymentTransactionId: String,
    paidAt: Date,

    // ==============================
    // Vận chuyển (Giao Hàng Nhanh)
    // ==============================
    shippingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'picking', 'shipping', 'delivered', 'returned', 'cancelled'],
      default: 'pending',
    },
    // Mã vận đơn từ GHN
    trackingCode: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date,

    // ==============================
    // Trạng thái đơn hàng tổng thể
    // ==============================
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },

    // Ghi chú của khách
    customerNote: {
      type: String,
      maxlength: 500,
    },
    // Ghi chú nội bộ của admin
    adminNote: String,

    // Lịch sử trạng thái đơn hàng
    statusHistory: [
      {
        status: String,
        note: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { timestamps: true }
);

// Tự động tạo mã đơn hàng trước khi lưu
orderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  // Format: BOBO-YYYYMMDD-XXXXX
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  this.orderCode = `BOBO-${dateStr}-${random}`;
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
// orderCode đã có unique:true trên field nên không khai báo lại
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
