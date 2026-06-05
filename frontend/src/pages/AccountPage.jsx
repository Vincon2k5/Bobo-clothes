import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, LogOut, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../services/api';
import toast from 'react-hot-toast';

// ==============================
// AccountPage — Router chính
// Chưa đăng nhập → Login/Register tabs
// Đã đăng nhập   → Dashboard tài khoản
// ==============================
const AccountPage = () => {
  const { user } = useAuth();
  return user ? <AccountDashboard /> : <AuthTabs />;
};

// ==============================
// AUTH TABS: Login / Đăng ký
// ==============================
const AuthTabs = () => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Tab switcher */}
        <div className="flex border-b border-bobo-gray-200 mb-8">
          {[
            { key: 'login', label: 'Đăng nhập' },
            { key: 'register', label: 'Tạo tài khoản' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 pb-3 text-sm font-medium transition-colors
                ${tab === t.key
                  ? 'border-b-2 border-bobo-black text-bobo-black'
                  : 'text-bobo-gray-500 hover:text-bobo-black'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <LoginForm onSwitchTab={() => setTab('register')} />
        ) : (
          <RegisterForm onSwitchTab={() => setTab('login')} />
        )}
      </div>
    </div>
  );
};

// ==============================
// LOGIN FORM
// ==============================
const LoginForm = ({ onSwitchTab }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const user = await login(form.email, form.password);
      toast.success(`Chào mừng trở lại, ${user.fullName}!`);
      navigate(user.role === 'admin' ? '/admin' : '/account');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Email"
        error={errors.email}
        input={
          <input
            type="email"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
            className={`input-base ${errors.email ? 'border-red-400' : ''}`}
            placeholder="email@example.com"
            autoComplete="email"
          />
        }
      />
      <Field
        label="Mật khẩu"
        error={errors.password}
        input={
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
              className={`input-base pr-10 ${errors.password ? 'border-red-400' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bobo-gray-300 hover:text-bobo-black"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        }
      />

      <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>

      <p className="text-center text-sm text-bobo-gray-500 pt-2">
        Chưa có tài khoản?{' '}
        <button type="button" onClick={onSwitchTab} className="text-bobo-black font-medium hover:underline">
          Tạo tài khoản ngay
        </button>
      </p>
    </form>
  );
};

// ==============================
// REGISTER FORM
// ==============================
const RegisterForm = ({ onSwitchTab }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!form.email) e.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (form.phone && !/^(0|\+84)[0-9]{9}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Số điện thoại không hợp lệ';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const update = (key, value) => {
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await register({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone });
      toast.success('Đăng ký thành công! Chào mừng bạn đến với BoBo 🎉');
      navigate('/account');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Họ và tên *"
        error={errors.fullName}
        input={
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className={`input-base ${errors.fullName ? 'border-red-400' : ''}`}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
          />
        }
      />
      <Field
        label="Email *"
        error={errors.email}
        input={
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={`input-base ${errors.email ? 'border-red-400' : ''}`}
            placeholder="email@example.com"
            autoComplete="email"
          />
        }
      />
      <Field
        label="Số điện thoại"
        error={errors.phone}
        input={
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={`input-base ${errors.phone ? 'border-red-400' : ''}`}
            placeholder="0912 345 678 (tuỳ chọn)"
            autoComplete="tel"
          />
        }
      />
      <Field
        label="Mật khẩu *"
        error={errors.password}
        input={
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className={`input-base pr-10 ${errors.password ? 'border-red-400' : ''}`}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-bobo-gray-300 hover:text-bobo-black"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        }
      />
      <Field
        label="Xác nhận mật khẩu *"
        error={errors.confirmPassword}
        input={
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword', e.target.value)}
            className={`input-base ${errors.confirmPassword ? 'border-red-400' : ''}`}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
          />
        }
      />

      <p className="text-xs text-bobo-gray-500">
        Bằng cách tạo tài khoản, bạn đồng ý với{' '}
        <Link to="/pages/terms" className="underline">Điều khoản sử dụng</Link> của BoBo.
      </p>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
      </button>

      <p className="text-center text-sm text-bobo-gray-500 pt-2">
        Đã có tài khoản?{' '}
        <button type="button" onClick={onSwitchTab} className="text-bobo-black font-medium hover:underline">
          Đăng nhập
        </button>
      </p>
    </form>
  );
};

// ==============================
// ACCOUNT DASHBOARD (đã đăng nhập)
// ==============================
const AccountDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // Lazy load đơn hàng khi chọn tab
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'orders' && !ordersLoaded) {
      try {
        setLoadingOrders(true);
        const res = await orderApi.getMyOrders({ limit: 10 });
        setOrders(res.data);
        setOrdersLoaded(true);
      } catch {
        toast.error('Không thể tải lịch sử đơn hàng');
      } finally {
        setLoadingOrders(false);
      }
    }
  };

  // Load đơn hàng ngay khi vào dashboard
  useState(() => { handleTabChange('orders'); }, []);

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất');
    navigate('/');
  };

  return (
    <div className="container-main py-10 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Tài khoản của tôi</h1>
          <p className="text-bobo-gray-500 text-sm mt-1">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-bobo-gray-500 hover:text-bobo-black transition-colors"
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bobo-gray-200 mb-8 gap-6">
        {[
          { key: 'orders', label: 'Đơn hàng của tôi', icon: Package },
          { key: 'profile', label: 'Thông tin tài khoản', icon: User },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors
              ${activeTab === key
                ? 'border-b-2 border-bobo-black text-bobo-black'
                : 'text-bobo-gray-500 hover:text-bobo-black'}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Đơn hàng */}
      {activeTab === 'orders' && (
        <OrderHistory orders={orders} loading={loadingOrders} />
      )}

      {/* Tab: Thông tin */}
      {activeTab === 'profile' && (
        <ProfileInfo user={user} />
      )}
    </div>
  );
};

// ==============================
// Order History
// ==============================
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

const OrderHistory = ({ orders, loading }) => {
  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-bobo-gray-100 rounded" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package size={48} className="mx-auto text-bobo-gray-200 mb-4" />
        <p className="font-medium mb-1">Bạn chưa có đơn hàng nào</p>
        <p className="text-sm text-bobo-gray-500 mb-6">Khám phá và mua sắm những sản phẩm thời trang mới nhất!</p>
        <Link to="/products" className="btn-primary inline-block px-8">
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order._id} className="border border-bobo-gray-100 p-5 hover:border-bobo-gray-300 transition-colors">
          {/* Order header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="font-semibold tracking-wide">{order.orderCode}</p>
              <p className="text-xs text-bobo-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          {/* Items preview */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar mb-4">
            {order.items?.slice(0, 4).map((item, i) => (
              <div key={i} className="flex-shrink-0 relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-16 object-cover bg-bobo-gray-50"
                />
                {i === 3 && order.items.length > 4 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-bobo-gray-500">{order.items?.length} sản phẩm · </span>
              <span className="font-semibold">{formatPrice(order.total)}</span>
            </div>
            <Link
              to={`/account/orders/${order.orderCode}`}
              className="flex items-center gap-1 text-sm hover:gap-2 transition-all text-bobo-gray-500 hover:text-bobo-black"
            >
              Xem chi tiết <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==============================
// Profile Info
// ==============================
const ProfileInfo = ({ user }) => (
  <div className="max-w-md space-y-5">
    <div className="w-16 h-16 bg-bobo-black text-white rounded-full flex items-center justify-center text-2xl font-serif">
      {user.fullName?.charAt(0).toUpperCase()}
    </div>

    <div className="space-y-4">
      <InfoRow label="Họ và tên" value={user.fullName} />
      <InfoRow label="Email" value={user.email} />
      <InfoRow label="Vai trò" value={user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'} />
    </div>

    {user.role === 'admin' && (
      <Link
        to="/admin"
        className="btn-secondary inline-flex items-center gap-2 text-sm"
      >
        Vào trang quản trị →
      </Link>
    )}
  </div>
);

// ==============================
// Helper components
// ==============================
const Field = ({ label, error, input }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    {input}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-bobo-gray-100 last:border-0">
    <span className="text-sm text-bobo-gray-500 sm:w-32 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium">{value || '—'}</span>
  </div>
);

export default AccountPage;
