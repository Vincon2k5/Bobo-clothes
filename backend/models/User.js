const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  ward: { type: String, required: true, trim: true },    // Phường/Xã
  district: { type: String, required: true, trim: true }, // Quận/Huyện
  province: { type: String, required: true, trim: true }, // Tỉnh/Thành phố
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Họ tên không được để trống'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email không được để trống'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      minlength: [6, 'Mật khẩu tối thiểu 6 ký tự'],
      select: false, // Không trả về password trong query mặc định
    },
    phone: {
      type: String,
      trim: true,
    },
    addresses: [addressSchema],
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Wishlist - danh sách yêu thích
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
);

// Hash password trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
