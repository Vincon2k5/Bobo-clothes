const OpenAI = require('openai');

let client;

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Chat AI chưa được cấu hình trên máy chủ');
  }
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
};

const askBoBoAI = async ({ message, history, products, safetyIdentifier }) => {
  const productContext = products.map((product) => ({
    name: product.name,
    slug: product.slug,
    category: product.category,
    price: product.salePrice || product.basePrice,
    colors: [...new Set(product.variants.map((variant) => variant.color))],
    sizes: [...new Set(product.variants.map((variant) => variant.size))],
    inStock: product.variants.some((variant) => variant.stock > 0),
  }));

  const response = await getClient().responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    instructions: [
      'Bạn là BoBo AI, trợ lý mua sắm của cửa hàng thời trang BoBo.',
      'Trả lời bằng tiếng Việt, thân thiện, trực tiếp và tối đa khoảng 150 từ.',
      'Chỉ giới thiệu sản phẩm có trong dữ liệu được cung cấp.',
      'Không tự tạo giá, tồn kho, ưu đãi, chính sách hoặc đường dẫn.',
      'Nếu không có sản phẩm phù hợp, nói rõ và gợi ý khách đổi từ khóa.',
      'Size ONE SIZE phải gọi là Một kích cỡ.',
      'Không yêu cầu mật khẩu, OTP, số thẻ hoặc thông tin thanh toán nhạy cảm.',
      'Không xác nhận, hủy hoặc thay đổi đơn hàng.',
    ].join('\n'),
    input: [
      ...history.map((item) => ({ role: item.role, content: item.content })),
      {
        role: 'user',
        content: `Câu hỏi của khách: ${message}\n\nDữ liệu sản phẩm: ${JSON.stringify(productContext)}`,
      },
    ],
    max_output_tokens: 500,
    store: false,
    safety_identifier: safetyIdentifier,
  });

  return response.output_text?.trim() || 'Xin lỗi, mình chưa thể trả lời lúc này.';
};

module.exports = { askBoBoAI };
