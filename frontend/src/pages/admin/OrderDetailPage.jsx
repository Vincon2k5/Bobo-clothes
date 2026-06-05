import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao hàng' },
  { value: 'delivered', label: 'Đã giao thành công' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getOrder(id)
      .then((res) => {
        setOrder(res.data);
        setNewStatus(res.data.status);
        setTrackingCode(res.data.trackingCode || '');
      })
      .catch(() => toast.error('Không thể tải đơn hàng'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    if (newStatus === order.status && !trackingCode && !note) {
      toast('Không có thay đổi nào');
      return;
    }
    try {
      setSaving(true);
      const res = await adminApi.updateOrderStatus(id, {
        status: newStatus,
        note: note || undefined,
        trackingCode: trackingCode || undefined,
      });
      setOrder(res.data);
      setNote('');
      toast.success('Đã cập nhật đơn hàng!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + '₫';
  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 bg-gray-100 rounded"/>)}</div>;
  if (!order) return <p className="text-gray-500">Không tìm thấy đơn hàng</p>;

  const customer = order.user?.fullName || order.guestInfo?.fullName || 'Khách vãng lai';

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/orders')} className="p-2 hover:bg-gray-100 rounded transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{order.orderCode}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`ml-auto text-sm px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
          {STATUS_OPTIONS.find(s => s.value === order.status)?.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Items */}
          <Card title="Sản phẩm đặt hàng">
            <div className="divide-y divide-gray-100">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <img src={item.image} alt={item.name} className="w-14 h-16 object-cover bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.variant.size} · {item.variant.color}</p>
                    <p className="text-xs text-gray-500">x{item.quantity} · {formatPrice(item.unitPrice)}/cái</p>
                  </div>
                  <p className="font-semibold text-sm">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span><span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span><span>{formatPrice(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span><span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Tổng cộng</span><span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Cập nhật trạng thái */}
          <Card title="Cập nhật trạng thái">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Trạng thái mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-base"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mã vận đơn (GHN)</label>
                <input
                  className="input-base"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Để trống nếu chưa có"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ghi chú nội bộ</label>
                <textarea
                  className="input-base resize-none"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú về lý do cập nhật..."
                />
              </div>
              <button
                onClick={handleUpdateStatus}
                disabled={saving}
                className="flex items-center gap-2 bg-bobo-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                <Save size={16} />
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </Card>

          {/* Lịch sử trạng thái */}
          {order.statusHistory?.length > 0 && (
            <Card title="Lịch sử trạng thái">
              <div className="space-y-3">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className={`mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_OPTIONS.find(s => s.value === h.status)?.label || h.status}
                    </span>
                    <div>
                      {h.note && <p className="text-gray-600">{h.note}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.changedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Khách hàng */}
          <Card title="Khách hàng">
            <p className="font-medium">{customer}</p>
            {(order.user?.email || order.guestInfo?.email) && (
              <p className="text-sm text-gray-500 mt-1">{order.user?.email || order.guestInfo?.email}</p>
            )}
            {(order.user?.phone || order.guestInfo?.phone) && (
              <p className="text-sm text-gray-500">{order.user?.phone || order.guestInfo?.phone}</p>
            )}
            {!order.user && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-2 inline-block">Khách vãng lai</span>
            )}
          </Card>

          {/* Địa chỉ */}
          <Card title="Địa chỉ giao hàng">
            <p className="font-medium text-sm">{order.shippingAddress?.fullName}</p>
            <p className="text-sm text-gray-600 mt-1">{order.shippingAddress?.phone}</p>
            <p className="text-sm text-gray-600 mt-1">
              {order.shippingAddress?.street}, {order.shippingAddress?.ward},<br />
              {order.shippingAddress?.district}, {order.shippingAddress?.province}
            </p>
          </Card>

          {/* Thanh toán */}
          <Card title="Thanh toán">
            <div className="space-y-2 text-sm">
              <Row label="Phương thức" value={order.paymentMethod?.toUpperCase()} />
              <Row label="Trạng thái"
                value={
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </span>
                }
              />
              {order.trackingCode && <Row label="Mã vận đơn" value={order.trackingCode} />}
            </div>
          </Card>

          {/* Ghi chú */}
          {order.customerNote && (
            <Card title="Ghi chú khách hàng">
              <p className="text-sm text-gray-600 italic">"{order.customerNote}"</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-5">
    <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default OrderDetailPage;
