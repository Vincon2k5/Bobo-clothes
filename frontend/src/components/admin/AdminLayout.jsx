import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-bobo-black text-white flex flex-col transition-all duration-300 flex-shrink-0
          ${sidebarOpen ? 'w-56' : 'w-14'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {sidebarOpen && (
            <span className="font-serif text-xl tracking-widest">BOBO</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors ml-auto"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors
                 ${isActive ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-white/70 hover:text-white'}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-white/10 p-3 space-y-1">
          {sidebarOpen && (
            <p className="text-xs text-white/50 px-2 truncate">{user?.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-white/70
                       hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white h-16 flex items-center px-6 border-b border-gray-200 flex-shrink-0">
          <Breadcrumb />
          <div className="ml-auto text-sm text-gray-500">
            Xin chào, <span className="font-medium text-gray-900">{user?.fullName}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Breadcrumb tự động từ URL
const Breadcrumb = () => {
  const labels = {
    admin: 'Admin',
    products: 'Sản phẩm',
    orders: 'Đơn hàng',
    new: 'Thêm mới',
    edit: 'Chỉnh sửa',
  };
  const parts = window.location.pathname.split('/').filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        // Bỏ qua MongoDB ID (24 ký tự hex)
        const label = /^[a-f0-9]{24}$/i.test(part) ? 'Chi tiết' : (labels[part] || part);
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} />}
            <span className={isLast ? 'text-gray-900 font-medium' : ''}>{label}</span>
          </span>
        );
      })}
    </nav>
  );
};

export default AdminLayout;
