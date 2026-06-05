const mongoose = require('mongoose');

/**
 * Schema cho từng item trong giỏ hàng
 * Lưu snapshot giá tại thời điểm thêm vào giỏ để tránh thay đổi giá
 */
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  // Snapshot thông tin sản phẩm tại thời điểm add to cart
  productSnapshot: {
    name: String,
    image: String,
    slug: String,
  },
  variant: {
    size: { type: String, required: true },
    color: { type: String, required: true },
    colorHex: String,
    sku: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Số lượng tối thiểu là 1'],
    default: 1,
  },
  // Giá tại thời điểm thêm vào giỏ
  priceAtAdd: {
    type: Number,
    required: true,
    min: 0,
  },
});

const cartSchema = new mongoose.Schema(
  {
    // User đã đăng nhập
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Session ID cho guest checkout (khách không đăng nhập)
    sessionId: {
      type: String,
      default: null,
      // index khai báo bên dưới với sparse:true
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Tổng số lượng item
cartSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual: Tổng tiền giỏ hàng
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0
  );
});

// Index: mỗi user chỉ có 1 cart active
cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
