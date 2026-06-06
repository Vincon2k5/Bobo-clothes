import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import QuickAddModal from './QuickAddModal';
import placeholder from '../../assets/placeholder.svg';

/**
 * ProductCard - Component thẻ sản phẩm thời trang BoBo
 *
 * Features:
 * - Hover swap ảnh (front → back/detail view)
 * - Color swatches để preview màu sắc
 * - Quick-add button (thêm nhanh vào giỏ không cần vào trang detail)
 * - Badge: New, Sale, Bestseller
 * - Wishlist button
 */
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  if (!product) return null;

  const {
    _id,
    name,
    slug,
    images,
    basePrice,
    salePrice,
    discountPercent,
    variants,
    tags,
    rating,
  } = product;

  // Lấy danh sách màu duy nhất từ variants
  const uniqueColors = [
    ...new Map(
      variants
        ?.filter((v) => v.stock > 0)
        .map((v) => [v.color, { color: v.color, colorHex: v.colorHex }])
    ).values(),
  ].slice(0, 4); // Hiển thị tối đa 4 màu

  // Giá hiển thị
  const displayPrice = salePrice && salePrice < basePrice ? salePrice : basePrice;
  const hasDiscount = salePrice && salePrice < basePrice;

  // Format tiền VNĐ
  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Lấy ảnh theo hover state và màu đang active
  const frontImage = images?.[0] || placeholder;
  const hoverImage = images?.[1] || images?.[0] || placeholder;

  // Badges
  const isNew = tags?.includes('new-arrival');
  const isBestSeller = tags?.includes('best-seller');
  const isSale = hasDiscount;

  /**
   * Quick-add: Nếu chỉ có 1 size available → thêm thẳng vào giỏ
   * Nếu nhiều size → mở modal chọn size
   */
  const handleQuickAdd = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const availableVariants = variants?.filter((v) => v.stock > 0) || [];

      // Nếu chỉ có 1 lựa chọn → thêm luôn
      if (availableVariants.length === 1) {
        try {
          setIsAddingToCart(true);
          await addToCart({
            productId: _id,
            size: availableVariants[0].size,
            color: availableVariants[0].color,
            quantity: 1,
          });
        } finally {
          setIsAddingToCart(false);
        }
      } else {
        // Mở modal chọn size/màu
        setIsQuickAddOpen(true);
      }
    },
    [_id, variants, addToCart]
  );

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
    // TODO: Gọi API wishlist
  };

  return (
    <>
      <article
        className="group relative bg-white"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/products/${slug}`} className="block">
          {/* ==============================
              Product Image Container
              Tỷ lệ 3:4 chuẩn thời trang
          ============================== */}
          <div className="relative aspect-[3/4] overflow-hidden bg-bobo-gray-50">
            {/* Ảnh chính (front) */}
            <img
              src={frontImage}
              alt={name}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = placeholder; }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
                ${isHovered ? 'opacity-0' : 'opacity-100'}`}
            />
            {/* Ảnh hover (back/detail) */}
            <img
              src={hoverImage}
              alt={`${name} - góc khác`}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = placeholder; }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
                ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* ==============================
                Badges (góc trên trái)
            ============================== */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {isNew && (
                <span className="bg-bobo-black text-white text-[10px] font-semibold uppercase px-2 py-1 tracking-wider">
                  Mới
                </span>
              )}
              {isSale && (
                <span className="bg-red-500 text-white text-[10px] font-semibold uppercase px-2 py-1 tracking-wider">
                  -{discountPercent}%
                </span>
              )}
              {isBestSeller && !isNew && !isSale && (
                <span className="bg-bobo-accent text-white text-[10px] font-semibold uppercase px-2 py-1 tracking-wider">
                  Hot
                </span>
              )}
            </div>

            {/* ==============================
                Action Buttons (góc trên phải)
                Hiện khi hover
            ============================== */}
            <div
              className={`absolute top-3 right-3 flex flex-col gap-2 z-10 transition-all duration-300
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
            >
              {/* Wishlist */}
              <button
                onClick={handleWishlist}
                aria-label={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                className="w-9 h-9 bg-white shadow-md flex items-center justify-center
                           hover:bg-bobo-black hover:text-white transition-colors duration-200"
              >
                <Heart
                  size={16}
                  className={isWishlisted ? 'fill-red-500 text-red-500' : ''}
                />
              </button>
              {/* Quick View */}
              <Link
                to={`/products/${slug}`}
                onClick={(e) => e.stopPropagation()}
                aria-label="Xem nhanh"
                className="w-9 h-9 bg-white shadow-md flex items-center justify-center
                           hover:bg-bobo-black hover:text-white transition-colors duration-200"
              >
                <Eye size={16} />
              </Link>
            </div>

            {/* ==============================
                Quick-Add Button (dưới ảnh)
                Slide up khi hover
            ============================== */}
            <div
              className={`absolute bottom-0 left-0 right-0 transition-transform duration-300
                ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}
            >
              <button
                onClick={handleQuickAdd}
                disabled={isAddingToCart}
                className="w-full bg-bobo-black text-white text-sm font-medium py-3.5
                           flex items-center justify-center gap-2 tracking-wide
                           hover:bg-bobo-gray-700 transition-colors
                           disabled:opacity-70 disabled:cursor-wait"
                aria-label="Thêm nhanh vào giỏ hàng"
              >
                <ShoppingBag size={16} />
                {isAddingToCart ? 'Đang thêm...' : 'Thêm nhanh vào giỏ'}
              </button>
            </div>
          </div>

          {/* ==============================
              Product Info
          ============================== */}
          <div className="pt-3 pb-1">
            {/* Color Swatches */}
            {uniqueColors.length > 1 && (
              <div className="flex gap-1.5 mb-2">
                {uniqueColors.map((colorObj, index) => (
                  <button
                    key={colorObj.color}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveColorIndex(index);
                    }}
                    title={colorObj.color}
                    aria-label={`Màu ${colorObj.color}`}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150
                      ${activeColorIndex === index
                        ? 'border-bobo-black scale-110'
                        : 'border-transparent hover:border-bobo-gray-300'
                      }`}
                    style={{ backgroundColor: colorObj.colorHex || '#ccc' }}
                  />
                ))}
              </div>
            )}

            {/* Tên sản phẩm */}
            <h3 className="text-sm font-medium text-bobo-black line-clamp-2 mb-1.5 hover:text-bobo-gray-700 transition-colors">
              {name}
            </h3>

            {/* Giá */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${hasDiscount ? 'text-red-500' : 'text-bobo-black'}`}>
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-bobo-gray-300 line-through">
                  {formatPrice(basePrice)}
                </span>
              )}
            </div>

            {/* Rating */}
            {rating?.count > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3 h-3 ${star <= Math.round(rating.average) ? 'text-yellow-400' : 'text-bobo-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] text-bobo-gray-500">({rating.count})</span>
              </div>
            )}
          </div>
        </Link>
      </article>

      {/* Quick-Add Modal */}
      {isQuickAddOpen && (
        <QuickAddModal
          product={product}
          onClose={() => setIsQuickAddOpen(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
