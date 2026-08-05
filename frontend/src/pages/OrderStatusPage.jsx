import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, Loader2, RefreshCw } from 'lucide-react';
import { orderApi } from '../services/api';

const STATUS_STEPS = [
  { value: 'pending', label: 'Chờ admin xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao hàng' },
  { value: 'delivered', label: 'Đã giao thành công' },
];

const TERMINAL_LABELS = {
  cancelled: 'Đơn hàng đã hủy',
  refunded: 'Đơn hàng đã hoàn tiền',
};

const getSavedOrderEmail = (orderCode) => {
  if (!orderCode) return '';
  try {
    const saved = JSON.parse(localStorage.getItem('bobo_order_contacts') || '{}');
    return saved[orderCode] || '';
  } catch {
    return '';
  }
};

const OrderStatusPage = ({ checkoutResult = false }) => {
  const { orderCode: routeOrderCode } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderCode = routeOrderCode || searchParams.get('orderCode') || location.state?.order?.orderCode;
  const initialEmail = useRef(location.state?.email || getSavedOrderEmail(orderCode));
  const didAutoLoad = useRef(false);
  const [order, setOrder] = useState(location.state?.order || null);
  const [email, setEmail] = useState(initialEmail.current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const fetchOrder = useCallback(async (lookupEmail = email) => {
    if (!orderCode) {
      setError('Không tìm thấy mã đơn hàng.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await orderApi.getByCode(orderCode, lookupEmail || undefined);
      setOrder(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, orderCode]);

  useEffect(() => {
    if (didAutoLoad.current || !orderCode) return;
    if (!initialEmail.current && !localStorage.getItem('bobo_token')) return;

    didAutoLoad.current = true;
    fetchOrder(initialEmail.current);
  }, [fetchOrder, orderCode]);

  const currentStep = STATUS_STEPS.findIndex((step) => step.value === order?.status);
  const formatPrice = (value) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  const qrData = location.state?.qrData || order?.paymentDetails;
  const isVietQr = order?.paymentMethod === 'vietqr' || searchParams.get('method') === 'vietqr';

  const copyValue = async (field, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(''), 1600);
    } catch {
      setError('Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.');
    }
  };

  return (
    <main className="container-main max-w-3xl py-12">
      {checkoutResult && (
        <div className="mb-8 text-center">
          <CheckCircle2 size={56} className="mx-auto mb-4 text-green-600" />
          <h1 className="font-serif text-3xl font-semibold">Đặt hàng thành công!</h1>
          <p className="mt-2 text-sm text-bobo-gray-500">
            Đơn hàng sẽ được admin kiểm tra và xác nhận.
          </p>
        </div>
      )}

      <section className="border border-bobo-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-bobo-gray-500">Mã đơn hàng</p>
            <h2 className="mt-1 text-xl font-bold tracking-wide">{orderCode || '—'}</h2>
          </div>
          <button
            type="button"
            onClick={() => fetchOrder()}
            disabled={loading || !orderCode}
            className="flex items-center gap-2 border border-bobo-gray-300 px-4 py-2 text-sm hover:border-bobo-black disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Cập nhật trạng thái
          </button>
        </div>

        {!localStorage.getItem('bobo_token') && !email && (
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              fetchOrder(email);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email đã dùng khi đặt hàng"
              className="input-base flex-1"
            />
            <button className="btn-primary px-6" type="submit">Tra cứu đơn</button>
          </form>
        )}

        {error && <p className="mt-5 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {order && (
          <>
            {isVietQr && (
              <div className={`mt-7 border p-5 ${order.paymentStatus === 'paid' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">Thanh toán bằng VietQR</p>
                    <p className="mt-1 text-sm text-bobo-gray-600">
                      {order.paymentStatus === 'paid'
                        ? 'Admin đã xác nhận nhận được chuyển khoản.'
                        : 'Quét QR và chuyển đúng số tiền, đúng nội dung bên dưới.'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ xác nhận thanh toán'}
                  </span>
                </div>

                {order.paymentStatus !== 'paid' && qrData && (
                  <div className="mt-5 grid gap-5 sm:grid-cols-[230px_1fr] sm:items-center">
                    <img
                      src={qrData.imageUrl}
                      alt={`Mã VietQR cho đơn ${orderCode}`}
                      className="mx-auto w-full max-w-[230px] border border-white bg-white object-contain shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-3 text-sm">
                      <PaymentInfo label="Ngân hàng" value={qrData.bankId} />
                      <PaymentInfo
                        label="Số tài khoản"
                        value={qrData.accountNo}
                        action={<CopyButton copied={copiedField === 'account'} onClick={() => copyValue('account', qrData.accountNo)} />}
                      />
                      <PaymentInfo label="Chủ tài khoản" value={qrData.accountName} />
                      <PaymentInfo label="Số tiền" value={formatPrice(qrData.amount || order.total)} strong />
                      <PaymentInfo
                        label="Nội dung chuyển khoản"
                        value={qrData.transferContent}
                        strong
                        action={<CopyButton copied={copiedField === 'content'} onClick={() => copyValue('content', qrData.transferContent)} />}
                      />
                    </div>
                  </div>
                )}

                {order.paymentStatus !== 'paid' && !qrData && (
                  <p className="mt-4 rounded bg-white p-3 text-sm text-red-700">
                    Chưa tải được mã QR. Hãy bấm “Cập nhật trạng thái” để thử lại.
                  </p>
                )}
              </div>
            )}

            <div className="mt-7">
              <p className="mb-4 text-sm font-semibold">Trạng thái đơn hàng</p>
              {TERMINAL_LABELS[order.status] ? (
                <div className="rounded bg-red-50 p-4 font-medium text-red-700">
                  {TERMINAL_LABELS[order.status]}
                </div>
              ) : (
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, index) => {
                    const complete = currentStep >= index;
                    return (
                      <div key={step.value} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`h-4 w-4 rounded-full border-2 ${complete ? 'border-bobo-black bg-bobo-black' : 'border-bobo-gray-300 bg-white'}`} />
                          {index < STATUS_STEPS.length - 1 && (
                            <span className={`h-8 w-0.5 ${currentStep > index ? 'bg-bobo-black' : 'bg-bobo-gray-200'}`} />
                          )}
                        </div>
                        <p className={`-mt-0.5 text-sm ${complete ? 'font-medium text-bobo-black' : 'text-bobo-gray-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-7 border-t border-bobo-gray-100 pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-bobo-gray-500">Tổng thanh toán</span>
                <span className="font-semibold">{formatPrice(order.total)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-bobo-gray-500">Trạng thái thanh toán</span>
                <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-700' : 'text-yellow-700'}`}>
                  {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </span>
              </div>
              {order.trackingCode && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-bobo-gray-500">Mã vận đơn</span>
                  <span className="font-medium">{order.trackingCode}</span>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <div className="mt-7 flex justify-center gap-3">
        <Link to="/products" className="btn-primary px-7">Tiếp tục mua sắm</Link>
        <Link to="/account" className="btn-secondary px-7">Tài khoản</Link>
      </div>
    </main>
  );
};

const PaymentInfo = ({ label, value, strong = false, action }) => (
  <div>
    <p className="text-xs text-bobo-gray-500">{label}</p>
    <div className="mt-0.5 flex items-center gap-2">
      <p className={strong ? 'font-bold text-bobo-black' : 'font-medium'}>{value || '—'}</p>
      {action}
    </div>
  </div>
);

const CopyButton = ({ copied, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
  >
    <Copy size={13} />
    {copied ? 'Đã sao chép' : 'Sao chép'}
  </button>
);

export default OrderStatusPage;
