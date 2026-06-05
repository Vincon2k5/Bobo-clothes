import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-bobo-black text-white mt-20">
      <div className="container-main py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h2 className="font-serif text-2xl tracking-widest mb-4">BOBO</h2>
            <p className="text-bobo-gray-300 text-sm leading-relaxed">
              Thời trang trẻ trung, phong cách hiện đại. BoBo mang đến những thiết kế tinh tế cho người Việt trẻ.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 mt-5">
              {['Facebook', 'Instagram', 'TikTok'].map((s) => (
                <a key={s} href="#" className="text-bobo-gray-300 hover:text-white transition-colors text-sm">
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold tracking-wider text-sm uppercase mb-4">Sản phẩm</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/products?category=ao', label: 'Áo' },
                { to: '/products?category=quan', label: 'Quần' },
                { to: '/products?category=vay', label: 'Váy & Đầm' },
                { to: '/products?category=outerwear', label: 'Áo Khoác' },
                { to: '/products?tags=new-arrival', label: 'Hàng Mới Về' },
                { to: '/products?tags=sale', label: 'Sale' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-bobo-gray-300 hover:text-white transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold tracking-wider text-sm uppercase mb-4">Hỗ Trợ</h3>
            <ul className="space-y-2.5">
              {[
                { to: '/pages/shipping', label: 'Chính sách vận chuyển' },
                { to: '/pages/returns', label: 'Đổi trả & Hoàn tiền' },
                { to: '/pages/size-guide', label: 'Hướng dẫn chọn size' },
                { to: '/pages/care', label: 'Hướng dẫn bảo quản' },
                { to: '/orders/track', label: 'Tra cứu đơn hàng' },
                { to: '/pages/faq', label: 'Câu hỏi thường gặp' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-bobo-gray-300 hover:text-white transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold tracking-wider text-sm uppercase mb-4">Nhận Ưu Đãi</h3>
            <p className="text-bobo-gray-300 text-sm mb-4">
              Đăng ký nhận thông tin về BST mới và ưu đãi độc quyền.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 bg-bobo-gray-700 border border-bobo-gray-500 px-3 py-2.5 text-sm
                           text-white placeholder:text-bobo-gray-500 focus:outline-none focus:border-bobo-gray-300"
              />
              <button type="submit" className="bg-white text-bobo-black px-4 py-2.5 text-sm font-medium hover:bg-bobo-gray-100 transition-colors flex-shrink-0">
                Đăng ký
              </button>
            </form>
            {/* Payment Methods */}
            <div className="mt-6">
              <p className="text-bobo-gray-500 text-xs mb-2">Thanh toán an toàn</p>
              <div className="flex gap-2 flex-wrap">
                {['MoMo', 'ZaloPay', 'VietQR', 'COD'].map((method) => (
                  <span key={method} className="bg-bobo-gray-700 text-bobo-gray-300 text-[10px] px-2 py-1">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-bobo-gray-700">
        <div className="container-main py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-bobo-gray-500">
          <p>© {new Date().getFullYear()} BoBo Fashion. Bảo lưu mọi quyền.</p>
          <div className="flex gap-5">
            <Link to="/pages/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link to="/pages/terms" className="hover:text-white transition-colors">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
