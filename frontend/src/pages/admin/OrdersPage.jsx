import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = async (params = {}) => {
    try {
      setLoading(true);
      const res = await adminApi.getOrders({ page, limit: 20, ...params });
      setOrders(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders({ page, search: search || undefined, status: statusFilter || undefined });
  }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders({ page: 1, search: search || undefined, status: statusFilter || undefined });
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN').format(p) + '₫';

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">Đơn hàng</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mã đơn, email, SĐT..."
              className="border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-900 w-56"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-gray-900 text-white text-sm">Tìm</button>
        </form>

        {/* Status Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {['', ...Object.keys(STATUS_LABELS)].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-xs px-3 py-2 rounded-full border transition-colors
                ${statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
            >
              {s ? STATUS_LABELS[s] : 'Tất cả'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mã đơn</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Khách hàng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày đặt</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Tổng tiền</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">TT Thanh toán</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">Không có đơn hàng nào</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const customer = order.user?.fullName || order.guestInfo?.fullName || 'Khách vãng lai';
                  const contact = order.user?.email || order.guestInfo?.email || order.guestInfo?.phone || '';
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{order.orderCode}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{customer}</p>
                        <p className="text-xs text-gray-400">{contact}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium
                          ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'}`}>
                          {order.paymentStatus === 'paid' ? 'Đã thanh toán' :
                           order.paymentStatus === 'failed' ? 'Thất bại' : 'Chờ TT'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-flex"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <p>Tổng {pagination.total} đơn hàng</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span>Trang {page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
