import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Lock, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderApi } from '../services/api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
  { id: 'momo', label: 'Ví MoMo', icon: '💜' },
  { id: 'zalopay', label: 'ZaloPay', icon: '🔵' },
  { id: 'vietqr', label: 'VietQR / Chuyển khoản ngân hàng', icon: '🏦' },
];

const PROVINCES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Khác'];

/**
 * CheckoutPage - Trang thanh toán BoBo
 *
 * Hỗ trợ:
 * - User đã đăng nhập (dùng địa chỉ đã lưu)
 * - Guest Checkout (không cần tạo tài khoản - giảm ma sát)
 * - Nhiều phương thức thanh toán
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, totalItems } = useCart();
  const [step, setStep] = useState(1); // 1: Thông tin | 2: Thanh toán | 3: Xác nhận
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    // Thông tin khách (guest hoặc user)
    fullName: '',
    email: '',
    phone: '',
    // Địa chỉ giao hàng
    street: '',
    ward: '',
    district: '',
    province: 'Hà Nội',
    // Thanh toán
    paymentMethod: 'cod',
    // Ghi chú
    customerNote: '',
  });

  const [errors, setErrors] = useState({});
  const shippingFee = subtotal >= 500000 ? 0 : 30000; // Miễn ship đơn ≥ 500k
  const total = subtotal + shippingFee;

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // ==============================
  // Validate form trước khi submit
  // ==============================
  const validateStep1 = () => {
    const newErrors = {};

    if (!form.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!form.email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Email không hợp lệ';
    if (!form.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^(0|\+84)[0-9]{9}$/.test(form.phone.replace(/\s/g, '')))
      newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!form.street.trim()) newErrors.street = 'Vui lòng nhập địa chỉ';
    if (!form.ward.trim()) newErrors.ward = 'Vui lòng nhập phường/xã';
    if (!form.district.trim()) newErrors.district = 'Vui lòng nhập quận/huyện';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==============================
  // Submit đơn hàng
  // ==============================
  const handlePlaceOrder = async () => {
    if (!form.paymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        items: items.map((item) => ({
          productId: item.product._id || item.product,
          size: item.variant.size,
          color: item.variant.color,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          street: form.street,
          ward: form.ward,
          district: form.district,
          province: form.province,
        },
        paymentMethod: form.paymentMethod,
        customerNote: form.customerNote,
        // Guest Checkout: luôn gửi guestInfo
        // Backend sẽ dùng nếu user chưa đăng nhập
        guestInfo: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
        },
      };

      const response = await orderApi.create(orderPayload);
      const { order, paymentUrl, qrData } = response.data;

      // Chuyển hướng theo payment method
      if (paymentUrl) {
        // MoMo / ZaloPay → redirect tới payment gateway
        window.location.href = paymentUrl;
      } else if (qrData) {
        // VietQR → hiện QR code ở trang kết quả
        navigate(`/checkout/result?orderCode=${order.orderCode}&method=vietqr`, {
          state: { qrData, order },
        });
      } else {
        // COD → trang xác nhận đơn
        navigate(`/checkout/result?orderCode=${order.orderCode}`, {
          state: { order },
        });
      }
    } catch (error) {
      toast.error(error.message || 'Đặt hàng thất bại, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect nếu giỏ hàng trống
  if (totalItems === 0) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-lg mb-4">Giỏ hàng của bạn đang trống</p>
        <Link to="/products" className="btn-primary inline-block">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-10 max-w-6xl">
      {/* Progress Steps */}
      <CheckoutSteps currentStep={step} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-3">
          {/* STEP 1: Thông tin giao hàng */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Thông tin giao hàng</h2>

              {/* Guest Checkout Banner - Giảm ma sát */}
              <div className="bg-bobo-cream border border-bobo-accent/30 p-4 mb-6">
                <p className="text-sm">
                  <strong>Mua hàng không cần tài khoản!</strong> Điền thông tin bên dưới và tiếp tục.
                  <Link to="/login" className="text-bobo-accent hover:underline ml-1">
                    Đăng nhập
                  </Link>{' '}
                  nếu bạn đã có tài khoản để xem lịch sử đơn hàng.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Họ và tên *"
                    value={form.fullName}
                    onChange={(v) => updateForm('fullName', v)}
                    error={errors.fullName}
                    placeholder="Nguyễn Văn A"
                  />
                  <FormField
                    label="Số điện thoại *"
                    value={form.phone}
                    onChange={(v) => updateForm('phone', v)}
                    error={errors.phone}
                    placeholder="0912 345 678"
                    type="tel"
                  />
                </div>

                <FormField
                  label="Email *"
                  value={form.email}
                  onChange={(v) => updateForm('email', v)}
                  error={errors.email}
                  placeholder="example@gmail.com"
                  type="email"
                  helpText="Chúng tôi sẽ gửi xác nhận đơn hàng tới email này"
                />

                <FormField
                  label="Địa chỉ *"
                  value={form.street}
                  onChange={(v) => updateForm('street', v)}
                  error={errors.street}
                  placeholder="Số nhà, tên đường..."
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    label="Phường/Xã *"
                    value={form.ward}
                    onChange={(v) => updateForm('ward', v)}
                    error={errors.ward}
                    placeholder="Phường Bến Nghé"
                  />
                  <FormField
                    label="Quận/Huyện *"
                    value={form.district}
                    onChange={(v) => updateForm('district', v)}
                    error={errors.district}
                    placeholder="Quận 1"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tỉnh/Thành phố</label>
                    <select
                      value={form.province}
                      onChange={(e) => updateForm('province', e.target.value)}
                      className="input-base"
                    >
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Ghi chú đơn hàng</label>
                  <textarea
                    value={form.customerNote}
                    onChange={(e) => updateForm('customerNote', e.target.value)}
                    placeholder="Ghi chú về đơn hàng, thời gian giao hàng..."
                    rows={3}
                    className="input-base resize-none"
                  />
                </div>
              </div>

              <button onClick={handleNextStep} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                Tiếp theo: Thanh toán <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: Phương thức thanh toán */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Phương thức thanh toán</h2>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors
                      ${form.paymentMethod === method.id
                        ? 'border-bobo-black bg-bobo-gray-50'
                        : 'border-bobo-gray-200 hover:border-bobo-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={form.paymentMethod === method.id}
                      onChange={(e) => updateForm('paymentMethod', e.target.value)}
                      className="accent-bobo-black"
                    />
                    <span className="text-2xl">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                  </label>
                ))}
              </div>

              {/* VietQR Info */}
              {form.paymentMethod === 'vietqr' && (
                <div className="bg-blue-50 border border-blue-200 p-4 mt-4 text-sm">
                  <p className="font-medium text-blue-800 mb-1">Chuyển khoản qua VietQR</p>
                  <p className="text-blue-700">
                    Sau khi đặt hàng, bạn sẽ nhận được mã QR để quét và chuyển khoản.
                    Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán.
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Quay lại
                </button>
                <button onClick={handleNextStep} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Xem lại đơn hàng <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Xác nhận đơn hàng */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Xác nhận đơn hàng</h2>

              {/* Tóm tắt thông tin */}
              <div className="space-y-4">
                <InfoSection title="Địa chỉ giao hàng">
                  <p className="text-sm">{form.fullName} - {form.phone}</p>
                  <p className="text-sm text-bobo-gray-500">
                    {form.street}, {form.ward}, {form.district}, {form.province}
                  </p>
                  <button onClick={() => setStep(1)} className="text-xs text-bobo-accent hover:underline mt-1">
                    Thay đổi
                  </button>
                </InfoSection>

                <InfoSection title="Phương thức thanh toán">
                  <p className="text-sm">
                    {PAYMENT_METHODS.find((m) => m.id === form.paymentMethod)?.label}
                  </p>
                  <button onClick={() => setStep(2)} className="text-xs text-bobo-accent hover:underline mt-1">
                    Thay đổi
                  </button>
                </InfoSection>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 py-4 text-base"
              >
                <Lock size={18} />
                {isSubmitting ? 'Đang xử lý...' : `Đặt hàng - ${formatPrice(total)}`}
              </button>

              <p className="text-xs text-center text-bobo-gray-500 mt-3">
                Bằng cách đặt hàng, bạn đồng ý với{' '}
                <Link to="/pages/terms" className="underline">Điều khoản sử dụng</Link> của BoBo
              </p>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingFee={shippingFee}
            total={total}
            formatPrice={formatPrice}
          />

          {/* Trust Badges */}
          <div className="mt-4 space-y-3">
            {[
              { icon: <Lock size={16} />, text: 'Thanh toán bảo mật SSL' },
              { icon: <Truck size={16} />, text: 'Giao hàng toàn quốc' },
              { icon: <RotateCcw size={16} />, text: 'Đổi trả miễn phí 30 ngày' },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-sm text-bobo-gray-500">
                {badge.icon}
                {badge.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================
// Sub-components
// ==============================

const CheckoutSteps = ({ currentStep }) => {
  const steps = ['Thông tin', 'Thanh toán', 'Xác nhận'];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = currentStep === stepNum;
        const isDone = currentStep > stepNum;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full text-sm font-semibold flex items-center justify-center
              ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-bobo-black text-white' : 'bg-bobo-gray-100 text-bobo-gray-500'}`}>
              {isDone ? '✓' : stepNum}
            </div>
            <span className={`text-sm ${isActive ? 'font-medium' : 'text-bobo-gray-500'}`}>{label}</span>
            {i < steps.length - 1 && <ChevronRight size={14} className="text-bobo-gray-300 mx-1" />}
          </div>
        );
      })}
    </div>
  );
};

const FormField = ({ label, value, onChange, error, placeholder, type = 'text', helpText }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`input-base ${error ? 'border-red-400 focus:border-red-500' : ''}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    {helpText && !error && <p className="text-bobo-gray-500 text-xs mt-1">{helpText}</p>}
  </div>
);

const InfoSection = ({ title, children }) => (
  <div className="border border-bobo-gray-100 p-4">
    <h4 className="text-sm font-semibold mb-2">{title}</h4>
    {children}
  </div>
);

const OrderSummary = ({ items, subtotal, shippingFee, total, formatPrice }) => (
  <div className="border border-bobo-gray-100 p-5 sticky top-24">
    <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Đơn hàng của bạn</h3>
    <ul className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
      {items.map((item) => (
        <li key={item._id} className="flex gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={item.productSnapshot?.image}
              alt={item.productSnapshot?.name}
              className="w-14 h-16 object-cover bg-bobo-gray-50"
            />
            <span className="absolute -top-1.5 -right-1.5 bg-bobo-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {item.quantity}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium line-clamp-2">{item.productSnapshot?.name}</p>
            <p className="text-[10px] text-bobo-gray-500">{item.variant?.size} · {item.variant?.color}</p>
          </div>
          <p className="text-xs font-semibold flex-shrink-0">
            {formatPrice(item.priceAtAdd * item.quantity)}
          </p>
        </li>
      ))}
    </ul>

    <div className="border-t border-bobo-gray-100 mt-4 pt-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-bobo-gray-500">Tạm tính</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-bobo-gray-500">Phí vận chuyển</span>
        <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
          {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
        </span>
      </div>
      <div className="flex justify-between font-semibold text-base border-t pt-3 mt-1">
        <span>Tổng cộng</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  </div>
);

export default CheckoutPage;
