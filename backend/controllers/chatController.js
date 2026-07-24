const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

const normalize = (value = '') =>
  value
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CATEGORY_ALIASES = [
  { category: 'ao', label: 'áo', words: ['ao', 'polo', 'thun', 'shirt', 'hoodie'] },
  { category: 'quan', label: 'quần', words: ['quan', 'jean', 'cargo', 'short'] },
  { category: 'vay', label: 'váy', words: ['vay', 'chan vay'] },
  { category: 'dam', label: 'đầm', words: ['dam'] },
  { category: 'outerwear', label: 'áo khoác', words: ['ao khoac', 'jacket', 'bomber'] },
  { category: 'phu-kien', label: 'phụ kiện', words: ['phu kien', 'tui', 'mu', 'kinh', 'vi', 'that lung'] },
];

const COLOR_ALIASES = [
  ['đen', ['den', 'black']],
  ['trắng', ['trang', 'white']],
  ['đỏ', ['do', 'red']],
  ['xanh', ['xanh', 'blue', 'navy', 'green']],
  ['cam', ['cam', 'orange']],
  ['vàng', ['vang', 'yellow']],
  ['hồng', ['hong', 'pink']],
  ['xám', ['xam', 'gray', 'grey']],
  ['kem', ['kem', 'cream']],
];

const STOP_WORDS = new Set([
  'toi', 'minh', 'muon', 'can', 'tim', 'mua', 'san', 'pham', 'cho', 'co',
  'khong', 'mau', 'size', 'gia', 'duoi', 'tren', 'khoang', 'phu', 'hop',
  'mot', 'cai', 'chiec', 'giup', 'voi', 'nhe', 'va', 'la', 'cua',
]);

const parseBudget = (message) => {
  const match = message.match(
    /(?:duoi|toi da|khong qua|tam gia|khoang)\s*([\d.,]+)\s*(k|nghin|trieu)?/
  );
  if (!match) return null;

  let amount = Number(match[1].replace(/[.,]/g, ''));
  if (!Number.isFinite(amount)) return null;
  if (match[2] === 'k' || match[2] === 'nghin') amount *= 1000;
  if (match[2] === 'trieu') amount *= 1000000;
  return amount;
};

const extractFilters = (message) => {
  const normalized = normalize(message);
  const categoryInfo = CATEGORY_ALIASES.find(({ words }) =>
    words.some((word) => normalized.includes(word))
  );
  const colorInfo = COLOR_ALIASES.find(([, words]) =>
    words.some((word) => normalized.includes(word))
  );
  const sizeMatch = normalized.match(/\b(one size|xxxl|xxl|xl|xs|s|m|l)\b/i);

  return {
    normalized,
    category: categoryInfo?.category,
    categoryLabel: categoryInfo?.label,
    color: colorInfo?.[0],
    colorWords: colorInfo?.[1] || [],
    size: sizeMatch?.[1]?.toUpperCase(),
    budget: parseBudget(normalized),
  };
};

const findRelevantProducts = async (message) => {
  const filters = extractFilters(message);
  const tokens = [...new Set(
    filters.normalized
      .split(/[^a-z0-9-]+/)
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
      .slice(0, 8)
  )];
  const conditions = tokens.flatMap((token) => {
    const regex = new RegExp(escapeRegex(token), 'i');
    return [{ name: regex }, { tags: regex }, { subCategory: regex }, { description: regex }];
  });

  const query = {
    isActive: true,
    ...(filters.category && { category: filters.category }),
    ...(conditions.length && { $or: conditions }),
  };

  let products = await Product.find(query)
    .select('name slug images category basePrice salePrice variants soldCount isFeatured')
    .sort({ isFeatured: -1, soldCount: -1 })
    .limit(40)
    .lean();

  products = products.filter((product) => {
    const price = product.salePrice || product.basePrice;
    if (filters.budget && price > filters.budget) return false;

    return product.variants.some((variant) => {
      if (variant.stock <= 0) return false;
      if (filters.size && variant.size !== filters.size) return false;
      if (
        filters.colorWords.length &&
        !filters.colorWords.some((word) => normalize(variant.color).includes(word))
      ) {
        return false;
      }
      return true;
    });
  });

  return { products: products.slice(0, 8), filters };
};

const formatPrice = (value) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;

const buildReply = ({ message, products, filters }) => {
  const text = filters.normalized;

  if (/(xin chao|chao|hello|hi)\b/.test(text) && text.split(' ').length <= 5) {
    return {
      answer: 'Xin chào! Mình có thể giúp bạn tìm sản phẩm theo loại, màu, size và ngân sách. Ví dụ: “Tìm áo polo đen size M dưới 500k”.',
      showProducts: false,
    };
  }

  if (/(don hang|trang thai don|tra cuu don|ma don|huy don)/.test(text)) {
    return {
      answer: 'Bạn vào Tài khoản → Đơn hàng của tôi để xem trạng thái hoặc hủy đơn đủ điều kiện. Khách vãng lai có thể tra cứu bằng mã đơn hàng và email đã đặt.',
      showProducts: false,
    };
  }

  if (/(thanh toan|momo|zalopay|vietqr|chuyen khoan|cod)/.test(text)) {
    return {
      answer: 'BoBo hỗ trợ COD và các phương thức thanh toán trực tuyến đang được cửa hàng cấu hình. Với VietQR/chuyển khoản, hãy chuyển đúng số tiền và nội dung mã đơn; admin sẽ kiểm tra trạng thái thanh toán.',
      showProducts: false,
    };
  }

  if (/(giao hang|van chuyen|phi ship|bao lau|nhan hang)/.test(text)) {
    return {
      answer: 'BoBo giao hàng toàn quốc. Phí và thời gian dự kiến được hiển thị khi checkout; thông thường đơn sẽ được xử lý sau khi admin xác nhận.',
      showProducts: false,
    };
  }

  if (/(doi tra|tra hang|hoan tien|doi size)/.test(text)) {
    return {
      answer: 'Bạn nên giữ sản phẩm nguyên trạng và liên hệ cửa hàng kèm mã đơn. Điều kiện đổi trả cụ thể được áp dụng theo chính sách hiển thị trên website.',
      showProducts: false,
    };
  }

  if (/(chon size|kich co|size nao|one size)/.test(text) && !filters.category) {
    return {
      answer: 'Bạn hãy mở trang chi tiết sản phẩm để xem các size còn hàng. Phụ kiện ONE SIZE sẽ hiển thị “Một kích cỡ”. Nếu cho mình biết loại sản phẩm và size cần tìm, mình sẽ lọc giúp.',
      showProducts: false,
    };
  }

  if (!products.length) {
    const details = [
      filters.categoryLabel,
      filters.color && `màu ${filters.color}`,
      filters.size && `size ${filters.size}`,
      filters.budget && `dưới ${formatPrice(filters.budget)}`,
    ].filter(Boolean).join(', ');
    return {
      answer: `Mình chưa tìm thấy sản phẩm${details ? ` phù hợp với: ${details}` : ''}. Bạn thử bỏ bớt điều kiện hoặc dùng từ khóa khác nhé.`,
      showProducts: false,
    };
  }

  const details = [
    filters.categoryLabel,
    filters.color && `màu ${filters.color}`,
    filters.size && `size ${filters.size}`,
    filters.budget && `dưới ${formatPrice(filters.budget)}`,
  ].filter(Boolean);
  return {
    answer: `Mình tìm thấy ${products.length} sản phẩm${details.length ? ` phù hợp với ${details.join(', ')}` : ' nổi bật'}. Bạn có thể bấm vào sản phẩm bên dưới để xem màu, size và tồn kho.`,
    showProducts: true,
  };
};

const chat = async (req, res, next) => {
  try {
    const message = req.body.message?.trim();
    if (!message) return next(new AppError('Vui lòng nhập câu hỏi', 400));
    if (message.length > 1000) {
      return next(new AppError('Câu hỏi không được dài quá 1000 ký tự', 400));
    }

    const { products, filters } = await findRelevantProducts(message);
    const reply = buildReply({ message, products, filters });

    res.json({
      success: true,
      data: {
        answer: reply.answer,
        products: reply.showProducts
          ? products.slice(0, 4).map((product) => ({
              _id: product._id,
              name: product.name,
              slug: product.slug,
              image: product.images?.[0],
              price: product.salePrice || product.basePrice,
            }))
          : [],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat };
