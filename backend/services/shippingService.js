/**
 * ============================================================
 * SHIPPING SERVICE - Tích hợp Giao Hàng Nhanh (GHN)
 * ============================================================
 * HƯỚNG DẪN TÍCH HỢP:
 * 1. Đăng ký tài khoản GHN tại: https://ghn.vn
 * 2. Lấy GHN_TOKEN và GHN_SHOP_ID từ dashboard
 * 3. Điền vào file .env
 * 4. Uncomment và hoàn thiện code bên dưới
 * ============================================================
 */

const GHN_API_URL = process.env.GHN_API_URL;
const GHN_TOKEN = process.env.GHN_TOKEN;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;

/**
 * Tính phí vận chuyển từ GHN API
 * @param {Object} params
 * @param {string} params.toDistrict - Tên quận/huyện nhận hàng
 * @param {string} params.toWard - Tên phường/xã nhận hàng
 * @param {number} params.weight - Khối lượng (gram)
 * @param {number} params.length - Chiều dài (cm), mặc định 20
 * @param {number} params.width - Chiều rộng (cm), mặc định 15
 * @param {number} params.height - Chiều cao (cm), mặc định 10
 * @returns {Promise<number>} Phí vận chuyển (VNĐ)
 */
const calculateShippingFee = async ({
  toDistrict,
  toWard,
  weight = 500,
  length = 20,
  width = 15,
  height = 10,
}) => {
  // ==============================
  // PLACEHOLDER: Uncomment khi có GHN credentials
  // ==============================
  /*
  try {
    // Bước 1: Lấy district_id từ tên quận/huyện
    const districtResponse = await fetch(`${GHN_API_URL}/master-data/district`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': GHN_TOKEN,
      },
      body: JSON.stringify({ province_id: null }), // Cần tìm province_id trước
    });
    const districtData = await districtResponse.json();
    const district = districtData.data?.find(d =>
      d.DistrictName.toLowerCase().includes(toDistrict.toLowerCase())
    );

    if (!district) throw new Error(`Không tìm thấy quận: ${toDistrict}`);

    // Bước 2: Tính phí
    const feeResponse = await fetch(`${GHN_API_URL}/v2/shipping-order/fee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': GHN_TOKEN,
        'ShopId': GHN_SHOP_ID,
      },
      body: JSON.stringify({
        service_type_id: 2, // Giao hàng tiêu chuẩn
        to_district_id: district.DistrictID,
        to_ward_code: toWard,
        weight,
        length,
        width,
        height,
      }),
    });

    const feeData = await feeResponse.json();
    if (feeData.code !== 200) throw new Error(feeData.message);

    return feeData.data.total;
  } catch (error) {
    console.error('GHN API error:', error.message);
    throw error;
  }
  */

  // Phí mặc định khi chưa tích hợp GHN
  // Logic đơn giản dựa trên tỉnh thành
  const defaultFees = {
    'Hà Nội': 25000,
    'Hồ Chí Minh': 25000,
    'Đà Nẵng': 35000,
    default: 45000,
  };

  const fee = defaultFees[toDistrict] || defaultFees.default;
  return fee;
};

/**
 * Tạo đơn vận chuyển trên GHN sau khi đơn hàng được xác nhận
 * @param {Object} orderData - Thông tin đơn hàng
 * @returns {Promise<{trackingCode: string, estimatedDelivery: Date}>}
 */
const createShipment = async (orderData) => {
  // ==============================
  // PLACEHOLDER: Tích hợp GHN Create Order API
  // ==============================
  /*
  const response = await fetch(`${GHN_API_URL}/v2/shipping-order/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Token': GHN_TOKEN,
      'ShopId': GHN_SHOP_ID,
    },
    body: JSON.stringify({
      payment_type_id: orderData.paymentMethod === 'cod' ? 2 : 1,
      note: orderData.customerNote || '',
      required_note: 'KHONGCHOXEMHANG',
      to_name: orderData.shippingAddress.fullName,
      to_phone: orderData.shippingAddress.phone,
      to_address: orderData.shippingAddress.street,
      to_ward_name: orderData.shippingAddress.ward,
      to_district_name: orderData.shippingAddress.district,
      to_province_name: orderData.shippingAddress.province,
      cod_amount: orderData.paymentMethod === 'cod' ? orderData.total : 0,
      weight: 500,
      service_type_id: 2,
      items: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        weight: 200,
      })),
    }),
  });

  const data = await response.json();
  if (data.code !== 200) throw new Error(data.message);

  return {
    trackingCode: data.data.order_code,
    estimatedDelivery: new Date(data.data.expected_delivery_time),
  };
  */

  // Placeholder return
  console.log('📦 Shipping service: createShipment placeholder called');
  return {
    trackingCode: `GHN-PENDING-${Date.now()}`,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 ngày
  };
};

/**
 * Theo dõi trạng thái vận chuyển
 * @param {string} trackingCode - Mã vận đơn GHN
 */
const trackShipment = async (trackingCode) => {
  // ==============================
  // PLACEHOLDER: GHN Track Order API
  // ==============================
  /*
  const response = await fetch(`${GHN_API_URL}/v2/shipping-order/detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Token': GHN_TOKEN,
    },
    body: JSON.stringify({ order_code: trackingCode }),
  });
  const data = await response.json();
  return data.data;
  */

  return { status: 'pending', message: 'Tracking chưa được tích hợp' };
};

module.exports = { calculateShippingFee, createShipment, trackShipment };
