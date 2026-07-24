const crypto = require('crypto');
const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');
const { askBoBoAI } = require('../services/aiService');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CATEGORY_ALIASES = [
  { category: 'ao', words: ['áo', 'polo', 'thun', 'shirt', 'hoodie'] },
  { category: 'quan', words: ['quần', 'jean', 'cargo', 'short'] },
  { category: 'vay', words: ['váy', 'chân váy'] },
  { category: 'dam', words: ['đầm'] },
  { category: 'outerwear', words: ['áo khoác', 'jacket', 'bomber'] },
  { category: 'phu-kien', words: ['phụ kiện', 'túi', 'mũ', 'kính', 'ví', 'thắt lưng'] },
];

const findRelevantProducts = async (message) => {
  const normalized = message.toLocaleLowerCase('vi-VN');
  const category = CATEGORY_ALIASES.find(({ words }) =>
    words.some((word) => normalized.includes(word))
  )?.category;

  const tokens = [...new Set(
    normalized
      .split(/[^\p{L}\p{N}-]+/u)
      .filter((token) => token.length >= 2)
      .slice(0, 8)
  )];
  const conditions = tokens.flatMap((token) => {
    const regex = new RegExp(escapeRegex(token), 'i');
    return [{ name: regex }, { tags: regex }, { subCategory: regex }, { description: regex }];
  });

  const query = {
    isActive: true,
    ...(category && { category }),
    ...(conditions.length && { $or: conditions }),
  };
  const selectFields = 'name slug images category basePrice salePrice variants soldCount isFeatured';

  let products = await Product.find(query)
    .select(selectFields)
    .sort({ isFeatured: -1, soldCount: -1 })
    .limit(8)
    .lean();

  if (!products.length) {
    products = await Product.find({ isActive: true })
      .select(selectFields)
      .sort({ isFeatured: -1, soldCount: -1 })
      .limit(8)
      .lean();
  }
  return products;
};

const chat = async (req, res, next) => {
  try {
    const message = req.body.message?.trim();
    if (!message) return next(new AppError('Vui lòng nhập câu hỏi', 400));
    if (message.length > 1000) {
      return next(new AppError('Câu hỏi không được dài quá 1000 ký tự', 400));
    }

    const history = Array.isArray(req.body.history)
      ? req.body.history
          .filter((item) =>
            ['user', 'assistant'].includes(item?.role) &&
            typeof item?.content === 'string'
          )
          .slice(-8)
          .map((item) => ({ role: item.role, content: item.content.slice(0, 1500) }))
      : [];

    const products = await findRelevantProducts(message);
    const sessionValue = String(req.headers['x-session-id'] || req.ip || 'anonymous');
    const safetyIdentifier = crypto
      .createHash('sha256')
      .update(sessionValue)
      .digest('hex')
      .slice(0, 32);
    const answer = await askBoBoAI({ message, history, products, safetyIdentifier });

    res.json({
      success: true,
      data: {
        answer,
        products: products.slice(0, 4).map((product) => ({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0],
          price: product.salePrice || product.basePrice,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat };
