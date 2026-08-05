import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Package, ShoppingCart, TrendingUp } from 'lucide-react';
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

const STATUS_CHART_COLORS = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  processing: '#a855f7',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

const formatPrice = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatCompact = (value) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;
  }

  const { stats, recentOrders, lowStockProducts, charts } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Tổng quan hoạt động kinh doanh của BoBo Clothes</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="text-green-600" size={22} />}
          label="Doanh thu tháng"
          value={formatPrice(stats?.monthRevenue)}
          bg="bg-green-50"
        />
        <StatCard
          icon={<ShoppingCart className="text-blue-600" size={22} />}
          label="Đơn hàng hôm nay"
          value={stats?.todayOrders || 0}
          sub={`Tổng: ${stats?.totalOrders || 0} đơn`}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Clock className="text-yellow-600" size={22} />}
          label="Chờ xác nhận"
          value={stats?.pendingOrders || 0}
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<Package className="text-purple-600" size={22} />}
          label="Sản phẩm đang bán"
          value={stats?.totalProducts || 0}
          sub={stats?.lowStockCount > 0 ? `${stats.lowStockCount} sản phẩm sắp hết` : 'Tồn kho ổn định'}
          bg="bg-purple-50"
        />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">Doanh thu 7 ngày gần nhất</h2>
            <p className="mt-1 text-xs text-gray-500">Không tính đơn đã hủy hoặc hoàn tiền</p>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            {charts?.salesByDay?.reduce((sum, item) => sum + item.orders, 0) || 0} đơn
          </span>
        </div>
        <RevenueChart data={charts?.salesByDay || []} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Trạng thái đơn hàng" subtitle="Phân bố trên toàn bộ đơn hàng">
          <OrderStatusChart data={charts?.ordersByStatus || []} />
        </ChartCard>
        <ChartCard title="Sản phẩm bán chạy" subtitle="Xếp hạng theo tổng số lượng đã đặt">
          <TopProductsChart data={charts?.topProducts || []} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentOrders?.length && (
              <p className="py-8 text-center text-sm text-gray-400">Chưa có đơn hàng nào</p>
            )}
            {recentOrders?.map((order) => {
              const customerName = order.user?.fullName || order.guestInfo?.fullName || 'Khách hàng';
              return (
                <Link
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderCode}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{customerName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">{formatPrice(order.total)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <AlertTriangle size={16} className="text-yellow-500" />
              Sắp hết hàng
            </h2>
            <Link to="/admin/products" className="text-sm text-blue-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!lowStockProducts?.length && (
              <p className="py-8 text-center text-sm text-gray-400">Tất cả sản phẩm còn đủ hàng</p>
            )}
            {lowStockProducts?.map((product) => {
              const total = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
              return (
                <Link
                  key={product._id}
                  to={`/admin/products/${product._id}/edit`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50"
                >
                  <p className="text-sm text-gray-800">{product.name}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    total === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
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

const RevenueChart = ({ data }) => {
  if (!data.length) return <EmptyChart />;

  const width = 760;
  const height = 260;
  const margin = { top: 16, right: 20, bottom: 42, left: 68 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...data.map((item) => item.revenue), 1);
  const x = (index) => margin.left + (plotWidth * index) / Math.max(data.length - 1, 1);
  const y = (value) => margin.top + plotHeight - (value / maxValue) * plotHeight;
  const points = data.map((item, index) => `${x(index)},${y(item.revenue)}`).join(' ');
  const area = `M ${margin.left} ${margin.top + plotHeight} L ${points.replaceAll(',', ' ')} L ${
    margin.left + plotWidth
  } ${margin.top + plotHeight} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full" role="img" aria-label="Biểu đồ doanh thu 7 ngày">
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const gridY = margin.top + plotHeight * ratio;
          const value = maxValue * (1 - ratio);
          return (
            <g key={ratio}>
              <line x1={margin.left} x2={width - margin.right} y1={gridY} y2={gridY} stroke="#e5e7eb" />
              <text x={margin.left - 10} y={gridY + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                {formatCompact(value)}
              </text>
            </g>
          );
        })}
        <path d={area} fill="url(#revenueArea)" />
        <polyline points={points} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => (
          <g key={item.date}>
            <circle cx={x(index)} cy={y(item.revenue)} r="5" fill="white" stroke="#16a34a" strokeWidth="3">
              <title>{`${item.label}: ${formatPrice(item.revenue)} - ${item.orders} đơn`}</title>
            </circle>
            <text x={x(index)} y={height - 14} textAnchor="middle" fontSize="11" fill="#6b7280">{item.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const OrderStatusChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!total) return <EmptyChart />;

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const percent = (item.count / total) * 100;
        return (
          <div key={item.status}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{STATUS_LABELS[item.status]}</span>
              <span className="text-gray-500">{item.count} đơn · {percent.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percent}%`, backgroundColor: STATUS_CHART_COLORS[item.status] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TopProductsChart = ({ data }) => {
  if (!data.length) return <EmptyChart />;
  const max = Math.max(...data.map((item) => item.quantity), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={`${item.productId || item.name}-${index}`} className="grid grid-cols-[24px_1fr_auto] items-center gap-3">
          <span className="text-center text-sm font-semibold text-gray-400">{index + 1}</span>
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="truncate text-xs font-medium text-gray-700">{item.name}</p>
              <span className="flex-shrink-0 text-xs text-gray-500">{item.quantity} sản phẩm</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gray-800" style={{ width: `${(item.quantity / max) * 100}%` }} />
            </div>
          </div>
          <span className="text-right text-xs font-medium text-gray-600">{formatCompact(item.revenue)}đ</span>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="mb-5">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
    {children}
  </section>
);

const EmptyChart = () => (
  <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
    Chưa có đủ dữ liệu để hiển thị biểu đồ
  </div>
);

const StatCard = ({ icon, label, value, sub, bg }) => (
  <div className={`${bg} rounded-lg p-5`}>
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
  </div>
);

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-40 rounded bg-gray-200" />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-lg bg-gray-200" />)}
    </div>
    <div className="h-80 rounded-xl bg-gray-200" />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="h-72 rounded-xl bg-gray-200" />
      <div className="h-72 rounded-xl bg-gray-200" />
    </div>
  </div>
);

export default DashboardPage;
