import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Heart, Share2, Truck, RotateCcw, Shield } from 'lucide-react';
import { productApi } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard/ProductCard';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [completeLook, setCompleteLook] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [sizeError, setSizeError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const [productRes, lookRes] = await Promise.all([
          productApi.getBySlug(slug),
          productApi.getCompleteTheLook(slug),
        ]);
        setProduct(productRes.data);
        setCompleteLook(lookRes.data || []);

        // Tự động chọn màu đầu tiên
        const firstAvailableColor = [...new Set(
          productRes.data.variants.filter((v) => v.stock > 0).map((v) => v.color)
        )][0];
        setSelectedColor(firstAvailableColor || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedImage(0);
  }, [slug]);

  if (loading) {
    return (
      <div className="container-main py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-[3/4] bg-bobo-gray-100 animate-pulse" />
        <div className="space-y-4 pt-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-bobo-gray-100 animate-pulse rounded" style={{ width: `${80 - i * 10}%` }} />)}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-lg mb-4">Không tìm thấy sản phẩm</p>
        <Link to="/products" className="btn-secondary inline-block px-8">Quay lại</Link>
      </div>
    );
  }

  const { name, images, basePrice, salePrice, variants, material, careInstructions, rating, description } = product;

  // Lấy màu duy nhất có hàng
  const uniqueColors = [...new Map(
    variants.filter((v) => v.stock > 0).map((v) => [v.color, v])
  ).values()];

  // Sizes có hàng theo màu đang chọn
  const availableSizes = variants
    .filter((v) => (!selectedColor || v.color === selectedColor) && v.stock > 0)
    .map((v) => v.size);

  // Tồn kho của variant đang chọn
  const selectedVariant = selectedColor && selectedSize
    ? variants.find((v) => v.color === selectedColor && v.size === selectedSize)
    : null;

  const displayPrice = salePrice && salePrice < basePrice ? salePrice : basePrice;
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const handleAddToCart = async () => {
    if (!selectedSize) { setSizeError('Vui lòng chọn kích cỡ'); return; }
    if (!selectedColor) { setSizeError('Vui lòng chọn màu sắc'); return; }

    try {
      setIsAddingToCart(true);
      setSizeError('');
      await addToCart({ productId: product._id, size: selectedSize, color: selectedColor, quantity: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="container-main py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-bobo-gray-500 mb-6 flex gap-2">
        <Link to="/" className="hover:text-bobo-black">Trang chủ</Link> /
        <Link to="/products" className="hover:text-bobo-black">Sản phẩm</Link> /
        <span className="text-bobo-black">{name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <div className="space-y-3">
          {/* Main Image */}
          <div className="aspect-[3/4] overflow-hidden bg-bobo-gray-50">
            <img src={images[selectedImage]} alt={name} className="w-full h-full object-cover" />
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 aspect-[3/4] overflow-hidden border-2 transition-colors
                    ${selectedImage === i ? 'border-bobo-black' : 'border-transparent hover:border-bobo-gray-300'}`}
                >
                  <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:pt-4">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-3">{name}</h1>

          {/* Rating */}
          {rating?.count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={s <= Math.round(rating.average) ? 'text-yellow-400' : 'text-bobo-gray-200'}>★</span>
                ))}
              </div>
              <span className="text-sm text-bobo-gray-500">{rating.average} ({rating.count} đánh giá)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className={`text-2xl font-bold ${salePrice ? 'text-red-500' : ''}`}>
              {formatPrice(displayPrice)}
            </span>
            {salePrice && salePrice < basePrice && (
              <span className="text-bobo-gray-300 line-through text-lg">{formatPrice(basePrice)}</span>
            )}
          </div>

          {/* Color Selector */}
          <div className="mb-5">
            <p className="text-sm font-semibold mb-2.5 uppercase tracking-wide">
              Màu sắc: <span className="font-normal text-bobo-gray-500">{selectedColor || 'Chưa chọn'}</span>
            </p>
            <div className="flex gap-3 flex-wrap">
              {uniqueColors.map((v) => (
                <button
                  key={v.color}
                  onClick={() => { setSelectedColor(v.color); setSelectedSize(null); setSizeError(''); }}
                  title={v.color}
                  className={`w-8 h-8 rounded-full border-4 transition-all duration-150
                    ${selectedColor === v.color ? 'border-bobo-black' : 'border-bobo-gray-100 hover:border-bobo-gray-300'}`}
                  style={{ backgroundColor: v.colorHex || '#ccc' }}
                />
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-semibold uppercase tracking-wide">Kích cỡ</p>
              <Link to="/pages/size-guide" className="text-xs text-bobo-gray-500 hover:text-bobo-black underline">
                Hướng dẫn chọn size
              </Link>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                const available = availableSizes.includes(size);
                return (
                  <button
                    key={size}
                    disabled={!available}
                    onClick={() => { setSelectedSize(size); setSizeError(''); }}
                    className={`min-w-[52px] h-12 px-3 text-sm font-medium border transition-all
                      ${!available
                        ? 'border-bobo-gray-100 text-bobo-gray-300 cursor-not-allowed line-through'
                        : selectedSize === size
                        ? 'border-bobo-black bg-bobo-black text-white'
                        : 'border-bobo-gray-200 hover:border-bobo-black'
                      }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {sizeError && <p className="text-red-500 text-sm mt-2">{sizeError}</p>}
            {selectedVariant && (
              <p className="text-xs text-bobo-gray-500 mt-2">
                {selectedVariant.stock <= 5
                  ? `⚠️ Chỉ còn ${selectedVariant.stock} sản phẩm`
                  : `✓ Còn hàng (${selectedVariant.stock} sản phẩm)`}
              </p>
            )}
          </div>

          {/* Add to Cart */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-4"
            >
              <ShoppingBag size={20} />
              {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
            <button className="w-12 h-12 mt-0 border border-bobo-gray-200 flex items-center justify-center hover:border-bobo-black transition-colors flex-shrink-0">
              <Heart size={20} />
            </button>
          </div>

          {/* Delivery Info */}
          <div className="space-y-2.5 border-t border-bobo-gray-100 pt-5 mb-6">
            {[
              { icon: <Truck size={16} />, text: 'Giao hàng toàn quốc 1-3 ngày làm việc' },
              { icon: <RotateCcw size={16} />, text: 'Đổi trả miễn phí trong 30 ngày' },
              { icon: <Shield size={16} />, text: 'Hàng chính hãng BoBo, cam kết 100%' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-bobo-gray-500">
                {item.icon} {item.text}
              </div>
            ))}
          </div>

          {/* Description */}
          <details className="border-t border-bobo-gray-100 pt-4">
            <summary className="text-sm font-semibold cursor-pointer pb-3 uppercase tracking-wide">Mô tả sản phẩm</summary>
            <p className="text-sm text-bobo-gray-700 leading-relaxed">{description}</p>
            {material && <p className="text-sm mt-2"><strong>Chất liệu:</strong> {material}</p>}
          </details>

          {careInstructions?.length > 0 && (
            <details className="border-t border-bobo-gray-100 pt-4 mt-4">
              <summary className="text-sm font-semibold cursor-pointer pb-3 uppercase tracking-wide">Hướng dẫn bảo quản</summary>
              <ul className="space-y-1">
                {careInstructions.map((c, i) => <li key={i} className="text-sm text-bobo-gray-700 flex gap-2"><span>•</span>{c}</li>)}
              </ul>
            </details>
          )}
        </div>
      </div>

      {/* Complete the Look - Cross-selling */}
      {completeLook.length > 0 && (
        <section className="mt-20">
          <h2 className="font-serif text-2xl font-semibold mb-8 text-center">Phối cùng với</h2>
          <div className="product-grid">
            {completeLook.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
