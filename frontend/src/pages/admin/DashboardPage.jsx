import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../services/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
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

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

  if (loading) return <DashboardSkeleton />;

  const { stats, recentOrders, lowStockProducts } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="text-green-600" size={22} />}
          label="Doanh thu tháng"
          value={formatPrice(stats?.monthRevenue)}
          bg="bg-green-50"
        />
        <StatCard
          icon={<ShoppingCart className="text-blue-600" size={22} />}
          label="Đơn hàng hôm nay"
          value={stats?.todayOrders}
          sub={`Tổng: ${stats?.totalOrders} đơn`}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Clock className="text-yellow-600" size={22} />}
          label="Chờ xác nhận"
          value={stats?.pendingOrders}
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<Package className="text-purple-600" size={22} />}
          label="Sản phẩm đang bán"
          value={stats?.totalProducts}
          sub={stats?.lowStockCount > 0 ? `⚠️ ${stats.lowStockCount} sắp hết hàng` : null}
          bg="bg-purple-50"
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders?.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Chưa có đơn hàng nào</p>
            )}
            {recentOrders?.map((order) => {
              const customerName =
                order.user?.fullName || order.guestInfo?.fullName || 'Khách vãng lai';
              return (
                <Link
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderCode}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{customerName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatPrice(order.total)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              Sắp hết hàng
            </h2>
            <Link to="/admin/products" className="text-sm text-blue-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {lowStockProducts?.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Tất cả sản phẩm còn đủ hàng ✓</p>
            )}
            {lowStockProducts?.map((p) => {
              const total = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <Link
                  key={p._id}
                  to={`/admin/products/${p._id}/edit`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm text-gray-800">{p.name}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full
                    ${total === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {total === 0 ? 'Hết hàng' : `Còn ${total}`}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, bg }) => (
  <div className={`${bg} rounded-lg p-5`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-40" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-lg" />)}
    </div>
  </div>
);

export default DashboardPage;
