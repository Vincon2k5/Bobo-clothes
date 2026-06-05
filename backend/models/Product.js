const mongoose = require('mongoose');

/**
 * Schema cho biến thể sản phẩm (size + màu + tồn kho)
 * Ví dụ: Áo thun BoBo - Size M - Màu Trắng - Còn 50 cái
 */
const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE SIZE'],
    trim: true,
  },
  color: {
    type: String,
    required: true,
    trim: true,
  },
  // Mã màu hex để hiển thị color swatch trên UI
  colorHex: {
    type: String,
    default: '#000000',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Mã màu hex không hợp lệ'],
  },
  // SKU riêng cho từng biến thể (Size-Color)
  sku: {
    type: String,
    trim: true,
    uppercase: true,
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Tồn kho không thể âm'],
    default: 0,
  },
  // Giá override cho biến thể cụ thể (nếu có)
  priceOverride: {
    type: Number,
    min: 0,
    default: null,
  },
  images: [String], // Ảnh riêng cho biến thể màu sắc (hover effect)
});

/**
 * Schema chính cho Sản phẩm thời trang BoBo
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên sản phẩm không được để trống'],
      trim: true,
      maxlength: [200, 'Tên sản phẩm không quá 200 ký tự'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Mô tả sản phẩm không được để trống'],
      maxlength: [5000, 'Mô tả không quá 5000 ký tự'],
    },
    // Mô tả ngắn cho card sản phẩm
    shortDescription: {
      type: String,
      maxlength: [300, 'Mô tả ngắn không quá 300 ký tự'],
    },
    // Ảnh chính của sản phẩm (index 0 = front, index 1 = back/hover)
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'Sản phẩm cần ít nhất 1 ảnh',
      },
    },
    category: {
      type: String,
      required: [true, 'Danh mục không được để trống'],
      enum: ['ao', 'quan', 'vay', 'dam', 'outerwear', 'phu-kien', 'giay-dep'],
      lowercase: true,
    },
    // Tag phụ (ví dụ: áo thun, áo sơ mi, quần jean...)
    subCategory: {
      type: String,
      trim: true,
      lowercase: true,
    },
    tags: [String], // ["new-arrival", "best-seller", "sale", "summer-2025"]

    basePrice: {
      type: Number,
      required: [true, 'Giá sản phẩm không được để trống'],
      min: [0, 'Giá không thể âm'],
    },
    // Giá sau khi giảm (nếu có sale)
    salePrice: {
      type: Number,
      min: 0,
      default: null,
    },
    // Phần trăm giảm giá (tự tính hoặc nhập tay)
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Mảng các biến thể size + màu + tồn kho
    variants: {
      type: [variantSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: 'Sản phẩm cần ít nhất 1 biến thể',
      },
    },

    // Thông tin chất liệu & hướng dẫn giặt
    material: String,
    careInstructions: [String],

    // Gợi ý "Complete the Look" - cross-selling
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    // Phụ kiện gợi ý đi kèm (Complete the Look)
    accessories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],

    // SEO
    metaTitle: String,
    metaDescription: String,

    // Trạng thái
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Rating & Reviews (tổng hợp)
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    // Số lượng đã bán (dùng cho bestseller ranking)
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==============================
// Virtual: Giá hiển thị (salePrice hoặc basePrice)
// ==============================
productSchema.virtual('currentPrice').get(function () {
  return this.salePrice && this.salePrice < this.basePrice
    ? this.salePrice
    : this.basePrice;
});

// ==============================
// Virtual: Tổng tồn kho tất cả biến thể
// ==============================
productSchema.virtual('totalStock').get(function () {
  return this.variants.reduce((sum, v) => sum + v.stock, 0);
});

// ==============================
// Indexes để tối ưu query
// ==============================
// slug đã có unique:true trên field nên không cần khai báo lại
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ basePrice: 1 });
// Full-text search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
