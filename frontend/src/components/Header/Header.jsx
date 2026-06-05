import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import MiniCart from '../MiniCart/MiniCart';

const NAV_LINKS = [
  { to: '/products?category=ao', label: 'Áo' },
  { to: '/products?category=quan', label: 'Quần' },
  { to: '/products?category=vay', label: 'Váy & Đầm' },
  { to: '/products?category=outerwear', label: 'Áo Khoác' },
  { to: '/products?category=phu-kien', label: 'Phụ Kiện' },
  { to: '/products?tags=sale', label: 'SALE', className: 'text-red-500 font-semibold' },
];

const Header = () => {
  const { totalItems, toggleMiniCart, isMiniCartOpen } = useCart();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Thêm shadow khi scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đóng mobile menu khi resize lên desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-white transition-shadow duration-300
          ${isScrolled ? 'shadow-sm' : ''}`}
      >
        {/* Announcement Bar */}
        <div className="bg-bobo-black text-white text-center text-xs py-2 px-4 tracking-wider">
          🚚 MIỄN PHÍ VẬN CHUYỂN ĐƠN HÀNG TRÊN 500K &nbsp;|&nbsp; TRẢ HÀNG MIỄN PHÍ TRONG 30 NGÀY
        </div>

        {/* Main Header */}
        <div className="container-main">
          <div className="flex items-center h-16 gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-2"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="font-serif text-2xl font-semibold tracking-widest text-bobo-black flex-shrink-0
                         mx-auto md:mx-0"
            >
              BOBO
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 ml-10">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-sm tracking-wide hover:text-bobo-gray-500 transition-colors
                     ${isActive ? 'border-b border-bobo-black pb-0.5' : ''}
                     ${link.className || ''}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-bobo-gray-50 transition-colors"
                aria-label="Tìm kiếm"
              >
                <Search size={20} />
              </button>

              {/* Account */}
              <Link
                to="/account"
                className="hidden sm:flex items-center gap-1.5 p-2 hover:bg-bobo-gray-50 transition-colors"
                aria-label="Tài khoản"
              >
                {user ? (
                  // Avatar chữ cái đầu khi đã đăng nhập
                  <span className="w-7 h-7 rounded-full bg-bobo-black text-white text-xs font-semibold flex items-center justify-center">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User size={20} />
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => toggleMiniCart(true)}
                className="p-2 hover:bg-bobo-gray-50 transition-colors relative"
                aria-label={`Giỏ hàng (${totalItems} sản phẩm)`}
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-bobo-black text-white
                               text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {isSearchOpen && (
          <div className="border-t border-bobo-gray-100 bg-white animate-slide-up">
            <form onSubmit={handleSearchSubmit} className="container-main py-3 flex gap-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm áo, quần, váy, phụ kiện..."
                className="input-base flex-1"
                autoFocus
              />
              <button type="submit" className="btn-primary px-6 py-2.5 text-sm">
                Tìm
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <nav className="absolute top-[104px] left-0 bottom-0 w-72 bg-white overflow-y-auto animate-slide-in-right">
            <div className="py-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-6 py-3.5 text-sm tracking-wide hover:bg-bobo-gray-50 transition-colors
                    ${link.className || ''}`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-bobo-gray-100 mt-4 pt-4 px-6">
                <Link to="/account" className="flex items-center gap-2 text-sm py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={18} /> Tài khoản của tôi
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Mini Cart */}
      <MiniCart isOpen={isMiniCartOpen} onClose={() => toggleMiniCart(false)} />

      {/* Spacer cho fixed header */}
      <div className="h-[104px]" />
    </>
  );
};

export default Header;
