const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Lấy danh sách sản phẩm (có filter, sort, pagination)
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      size,
      color,
      sort = '-createdAt',
      page = 1,
      limit = 12,
      search,
      tags,
      featured,
    } = req.query;

    // Xây dựng query object
    const query = { isActive: true };

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (tags) query.tags = { $in: tags.split(',') };

    // Filter giá
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    // Filter size (tìm trong variants)
    if (size) {
      query['variants.size'] = size.toUpperCase();
      query['variants.stock'] = { $gt: 0 }; // Chỉ lấy size còn hàng
    }

    // Filter màu sắc
    if (color) {
      query['variants.color'] = { $regex: color, $options: 'i' };
    }

    // Full-text search
    if (search) {
      query.$text = { $search: search };
    }

    // Tính pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Validate sort field (ngăn injection qua sort param)
    const allowedSorts = ['-createdAt', 'createdAt', '-basePrice', 'basePrice', '-soldCount', '-rating.average'];
    const sortField = allowedSorts.includes(sort) ? sort : '-createdAt';

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name slug images basePrice salePrice discountPercent category tags variants rating soldCount isFeatured')
        .sort(sortField)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy chi tiết sản phẩm theo slug
 * @route   GET /api/products/:slug
 * @access  Public
 */
const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate('relatedProducts', 'name slug images basePrice salePrice variants rating')
      .populate('accessories', 'name slug images basePrice salePrice variants rating');

    if (!product) {
      return next(new AppError('Không tìm thấy sản phẩm', 404));
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cross-selling: Gợi ý "Complete the Look" (phụ kiện đi kèm)
 * @route   GET /api/products/:slug/complete-the-look
 * @access  Public
 *
 * Logic: Ưu tiên accessories được chỉ định thủ công,
 * fallback về sản phẩm cùng category có rating cao nhất
 */
const getCompleteTheLook = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .select('category accessories tags')
      .populate('accessories', 'name slug images basePrice salePrice discountPercent variants rating isFeatured');

    if (!product) {
      return next(new AppError('Không tìm thấy sản phẩm', 404));
    }

    let suggestions = [];

    // 1. Lấy accessories được chỉ định
    if (product.accessories?.length > 0) {
      suggestions = product.accessories.filter((a) => a.isActive !== false);
    }

    // 2. Nếu không đủ 4 suggestions, bổ sung từ category liên quan
    if (suggestions.length < 4) {
      // Mapping: nếu đang xem áo → gợi ý quần/váy/phụ kiện
      const crossCategoryMap = {
        ao: ['quan', 'vay', 'dam', 'phu-kien'],
        quan: ['ao', 'phu-kien', 'giay-dep'],
        vay: ['ao', 'phu-kien', 'giay-dep'],
        dam: ['phu-kien', 'giay-dep'],
        outerwear: ['ao', 'quan', 'phu-kien'],
        'phu-kien': ['ao', 'quan', 'vay'],
        'giay-dep': ['quan', 'vay', 'dam'],
      };

      const relatedCategories = crossCategoryMap[product.category] || ['phu-kien'];
      const existingIds = suggestions.map((s) => s._id);

      const fallback = await Product.find({
        category: { $in: relatedCategories },
        isActive: true,
        _id: { $nin: [product._id, ...existingIds] },
      })
        .select('name slug images basePrice salePrice discountPercent variants rating')
        .sort({ 'rating.average': -1, soldCount: -1 })
        .limit(4 - suggestions.length)
        .lean();

      suggestions = [...suggestions, ...fallback];
    }

    res.json({
      success: true,
      data: suggestions.slice(0, 4), // Tối đa 4 gợi ý
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách categories có số lượng sản phẩm
 * @route   GET /api/products/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getCompleteTheLook,
  getCategories,
};
