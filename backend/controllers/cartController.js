const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper: Lấy hoặc tạo cart dựa trên user hoặc sessionId
 */
const getOrCreateCart = async (userId, sessionId) => {
  const query = userId ? { user: userId } : { sessionId };
  let cart = await Cart.findOne(query);
  if (!cart) {
    cart = new Cart(userId ? { user: userId } : { sessionId });
  }
  return cart;
};

/**
 * @desc    Lấy giỏ hàng hiện tại
 * @route   GET /api/cart
 * @access  Public (user hoặc guest)
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const sessionId = req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return res.json({ success: true, data: { items: [], totalItems: 0, subtotal: 0 } });
    }

    const cart = await getOrCreateCart(userId, sessionId);
    await cart.populate('items.product', 'name slug images isActive variants');

    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Thêm sản phẩm vào giỏ hàng
 * @route   POST /api/cart/items
 * @access  Public (user hoặc guest)
 */
const addToCart = async (req, res, next) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;
    const userId = req.user?._id;
    const sessionId = req.headers['x-session-id'];

    if (!userId && !sessionId) {
      return next(new AppError('Session ID không hợp lệ', 400));
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return next(new AppError('Sản phẩm không tồn tại', 404));
    }

    // Tìm variant tương ứng
    const variant = product.variants.find(
      (v) =>
        v.size === size.toUpperCase() &&
        v.color.toLowerCase() === color.toLowerCase()
    );

    if (!variant) {
      return next(new AppError(`Không có biến thể Size ${size} - Màu ${color}`, 400));
    }

    if (variant.stock < quantity) {
      return next(
        new AppError(
          `Chỉ còn ${variant.stock} sản phẩm trong kho`,
          400
        )
      );
    }

    const cart = await getOrCreateCart(userId, sessionId);

    // Kiểm tra item đã tồn tại trong giỏ chưa
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.size === size.toUpperCase() &&
        item.variant.color.toLowerCase() === color.toLowerCase()
    );

    const price = variant.priceOverride ?? product.salePrice ?? product.basePrice;

    if (existingItemIndex > -1) {
      // Cập nhật số lượng
      const newQty = cart.items[existingItemIndex].quantity + quantity;
      if (newQty > variant.stock) {
        return next(new AppError(`Giỏ hàng đã có ${cart.items[existingItemIndex].quantity} cái, kho chỉ còn ${variant.stock}`, 400));
      }
      cart.items[existingItemIndex].quantity = newQty;
    } else {
      // Thêm item mới
      cart.items.push({
        product: productId,
        productSnapshot: {
          name: product.name,
          image: product.images[0],
          slug: product.slug,
        },
        variant: {
          size: size.toUpperCase(),
          color: variant.color,
          colorHex: variant.colorHex,
          sku: variant.sku,
        },
        quantity,
        priceAtAdd: price,
      });
    }

    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật số lượng item trong giỏ
 * @route   PUT /api/cart/items/:itemId
 * @access  Public
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;
    const userId = req.user?._id;
    const sessionId = req.headers['x-session-id'];

    const cart = await getOrCreateCart(userId, sessionId);
    const item = cart.items.id(itemId);

    if (!item) {
      return next(new AppError('Sản phẩm không có trong giỏ hàng', 404));
    }

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa item khỏi giỏ hàng
 * @route   DELETE /api/cart/items/:itemId
 * @access  Public
 */
const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?._id;
    const sessionId = req.headers['x-session-id'];

    const cart = await getOrCreateCart(userId, sessionId);
    const item = cart.items.id(itemId);

    if (!item) {
      return next(new AppError('Sản phẩm không có trong giỏ hàng', 404));
    }

    item.deleteOne();
    await cart.save();

    res.json({ success: true, message: 'Đã xóa khỏi giỏ hàng', data: cart });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
