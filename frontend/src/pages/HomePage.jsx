import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productApi } from '../services/api';
import ProductCard from '../components/ProductCard/ProductCard';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homepageConfig, setHomepageConfig] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch public homepage config (hero image/title/subtitle)
        try {
          const cfg = await import('../services/api').then(m => m.siteApi.getHomepage());
          setHomepageConfig(cfg.data || null);
        } catch (err) {
          // ignore if not available
          console.warn('Could not fetch homepage config:', err.message);
        }
        const [featured, arrivals] = await Promise.all([
          productApi.getAll({ featured: true, limit: 4 }),
          productApi.getAll({ tags: 'new-arrival', sort: '-createdAt', limit: 4 }),
        ]);
        setFeaturedProducts(featured.data);
        setNewArrivals(arrivals.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[500px] bg-bobo-cream flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={homepageConfig?.heroImage || 'https://via.placeholder.com/1920x1080?text=BoBo+Fashion+Hero'}
            alt={homepageConfig?.heroTitle || 'BoBo Fashion Hero'}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/1920x1080?text=BoBo+Fashion+Hero'; }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative container-main text-white">
          <p className="text-sm tracking-[0.3em] uppercase mb-4 opacity-80">{homepageConfig?.preTitle || 'BST Hè 2025'}</p>
          <h1 className="font-serif text-5xl md:text-7xl font-semibold leading-tight mb-6 max-w-2xl">
            {homepageConfig?.heroTitle || 'Phong Cách\nLà Bạn'}
          </h1>
          <p className="text-lg opacity-90 mb-8 max-w-md">{homepageConfig?.heroSubtitle || 'Khám phá bộ sưu tập thời trang mới nhất từ BoBo — trẻ trung, tươi mới và đầy cá tính.'}</p>
          <div className="flex gap-4 flex-wrap">
            <Link to="/products" className="btn-primary bg-white text-bobo-black hover:bg-bobo-gray-100 px-8 py-3.5">
              Mua sắm ngay
            </Link>
            <Link to="/products?tags=new-arrival" className="btn-secondary border-white text-white hover:bg-white hover:text-bobo-black px-8 py-3.5">
              Hàng mới về
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="container-main py-16">
        <h2 className="font-serif text-3xl text-center mb-10">Mua sắm theo danh mục</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/products?category=ao', label: 'Áo', img: 'https://via.placeholder.com/400x500?text=Áo' },
            { to: '/products?category=quan', label: 'Quần', img: 'https://via.placeholder.com/400x500?text=Quần' },
            { to: '/products?category=vay', label: 'Váy & Đầm', img: 'https://via.placeholder.com/400x500?text=Váy' },
            { to: '/products?category=phu-kien', label: 'Phụ Kiện', img: 'https://via.placeholder.com/400x500?text=Phụ+Kiện' },
          ].map((cat) => (
            <Link
              key={cat.to}
              to={cat.to}
              className="group relative aspect-[4/5] overflow-hidden bg-bobo-gray-100"
            >
              <img src={cat.img} alt={cat.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <span className="absolute bottom-4 left-4 text-white font-semibold text-lg tracking-wide">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {!loading && featuredProducts.length > 0 && (
        <section className="container-main pb-16">
          <SectionHeader title="Sản phẩm nổi bật" link="/products?featured=true" />
          <div className="product-grid">
            {featuredProducts.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {!loading && newArrivals.length > 0 && (
        <section className="bg-bobo-cream py-16">
          <div className="container-main">
            <SectionHeader title="Hàng Mới Về" link="/products?tags=new-arrival" />
            <div className="product-grid">
              {newArrivals.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* USP Banner */}
      <section className="border-t border-bobo-gray-100 py-10">
        <div className="container-main grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: '🚚', title: 'Miễn phí vận chuyển', desc: 'Đơn hàng từ 500K' },
            { icon: '↩️', title: 'Đổi trả 30 ngày', desc: 'Không cần lý do' },
            { icon: '💳', title: 'Thanh toán linh hoạt', desc: 'COD, MoMo, ZaloPay' },
            { icon: '🔒', title: 'Bảo mật tuyệt đối', desc: 'SSL 256-bit' },
          ].map((usp) => (
            <div key={usp.title}>
              <div className="text-3xl mb-2">{usp.icon}</div>
              <p className="font-semibold text-sm">{usp.title}</p>
              <p className="text-bobo-gray-500 text-xs mt-0.5">{usp.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

const SectionHeader = ({ title, link }) => (
  <div className="flex items-center justify-between mb-8">
    <h2 className="font-serif text-3xl font-semibold">{title}</h2>
    <Link to={link} className="flex items-center gap-1 text-sm hover:gap-2 transition-all text-bobo-gray-500 hover:text-bobo-black">
      Xem tất cả <ArrowRight size={16} />
    </Link>
  </div>
);

export default HomePage;
