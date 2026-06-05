const crypto = require('crypto');

/**
 * ============================================================
 * PAYMENT SERVICE - Tích hợp MoMo, ZaloPay, VietQR
 * ============================================================
 * HƯỚNG DẪN TÍCH HỢP:
 * - MoMo:    https://developers.momo.vn
 * - ZaloPay: https://docs.zalopay.vn
 * - VietQR:  https://vietqr.io/danh-sach-api
 * ============================================================
 */

/**
 * Router function: Gọi đúng payment handler theo method
 */
const processPayment = async ({
  method,
  orderId,
  orderCode,
  amount,
  orderDescription,
  returnUrl,
  cancelUrl,
}) => {
  switch (method) {
    case 'momo':
      return createMoMoPayment({ orderId, orderCode, amount, orderDescription, returnUrl, cancelUrl });
    case 'zalopay':
      return createZaloPayPayment({ orderId, orderCode, amount, orderDescription, returnUrl, cancelUrl });
    case 'vietqr':
      return createVietQRPayment({ orderId, orderCode, amount, orderDescription });
    default:
      throw new Error(`Phương thức thanh toán không hỗ trợ: ${method}`);
  }
};

// ==============================
// MoMo Payment
// ==============================
const createMoMoPayment = async ({ orderId, orderCode, amount, orderDescription, returnUrl, cancelUrl }) => {
  /**
   * PLACEHOLDER: Tích hợp MoMo Payment Gateway
   * Docs: https://developers.momo.vn/#/docs/en/aioPlusWallet
   *
   * Uncomment và điền credentials khi sẵn sàng:
   */
  /*
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const requestId = `${orderCode}-${Date.now()}`;
  const notifyUrl = `${process.env.SERVER_URL}/api/payments/momo/callback`;

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=`,
    `ipnUrl=${notifyUrl}`,
    `orderId=${orderCode}`,
    `orderInfo=${orderDescription}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${returnUrl}`,
    `requestId=${requestId}`,
    `requestType=payWithMethod`,
  ].join('&');

  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const response = await fetch(`${process.env.MOMO_API_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerCode,
      accessKey,
      requestId,
      amount: String(amount),
      orderId: orderCode,
      orderInfo: orderDescription,
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      requestType: 'payWithMethod',
      extraData: '',
      lang: 'vi',
      signature,
    }),
  });

  const data = await response.json();
  if (data.resultCode !== 0) throw new Error(data.message);

  return { paymentUrl: data.payUrl };
  */

  console.log('💳 MoMo payment placeholder called for order:', orderCode);
  return { paymentUrl: `${returnUrl}?orderCode=${orderCode}&method=momo&status=pending` };
};

// ==============================
// ZaloPay Payment
// ==============================
const createZaloPayPayment = async ({ orderId, orderCode, amount, orderDescription, returnUrl, cancelUrl }) => {
  /**
   * PLACEHOLDER: Tích hợp ZaloPay
   * Docs: https://docs.zalopay.vn/v2/start/
   */
  /*
  const appId = process.env.ZALOPAY_APP_ID;
  const key1 = process.env.ZALOPAY_KEY1;
  const transId = Math.floor(Math.random() * 1000000);
  const appTransId = `${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${transId}`;
  const appTime = Date.now();

  const data = `${appId}|${appTransId}|${process.env.ZALOPAY_APP_USER || 'bobo_user'}|${amount}|${appTime}|${JSON.stringify({ orderCode })}|`;
  const mac = crypto.createHmac('sha256', key1).update(data).digest('hex');

  const response = await fetch(`${process.env.ZALOPAY_API_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      app_id: appId,
      app_user: 'bobo_user',
      app_time: appTime,
      amount,
      app_trans_id: appTransId,
      embed_data: JSON.stringify({ redirecturl: returnUrl }),
      item: JSON.stringify([{ orderCode }]),
      description: orderDescription,
      mac,
    }),
  });

  const result = await response.json();
  if (result.return_code !== 1) throw new Error(result.return_message);

  return { paymentUrl: result.order_url };
  */

  console.log('💳 ZaloPay payment placeholder called for order:', orderCode);
  return { paymentUrl: `${returnUrl}?orderCode=${orderCode}&method=zalopay&status=pending` };
};

// ==============================
// VietQR - Tạo QR Code động
// ==============================
const createVietQRPayment = async ({ orderId, orderCode, amount, orderDescription }) => {
  /**
   * VietQR không cần credentials phức tạp
   * Sử dụng API public của VietQR để tạo QR code
   * Docs: https://vietqr.io/danh-sach-api/generate-qr/
   */

  const bankId = process.env.VIETQR_BANK_ID || 'MB'; // Mặc định MBBank
  const accountNo = process.env.VIETQR_ACCOUNT_NO || '0123456789';
  const accountName = process.env.VIETQR_ACCOUNT_NAME || 'CONG TY BOBO FASHION';

  // Template URL VietQR (không cần API key)
  const vietQRUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(accountName)}`;

  return {
    qrData: {
      imageUrl: vietQRUrl,
      bankId,
      accountNo,
      accountName,
      amount,
      transferContent: orderCode,
    },
  };
};

/**
 * Verify callback từ MoMo (IPN - Instant Payment Notification)
 * @route POST /api/payments/momo/callback
 */
const verifyMoMoCallback = (callbackData) => {
  /*
  const { signature, ...data } = callbackData;
  const secretKey = process.env.MOMO_SECRET_KEY;

  const rawSignature = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  return signature === expectedSignature;
  */
  return true; // Placeholder
};

/**
 * Verify callback từ ZaloPay
 */
const verifyZaloPayCallback = (callbackData) => {
  /*
  const { data, mac } = callbackData;
  const key2 = process.env.ZALOPAY_KEY2;
  const expectedMac = crypto.createHmac('sha256', key2).update(data).digest('hex');
  return mac === expectedMac;
  */
  return true; // Placeholder
};

module.exports = {
  processPayment,
  verifyMoMoCallback,
  verifyZaloPayCallback,
  createVietQRPayment,
};
