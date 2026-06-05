import { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

/**
 * Modal chọn Size + Màu và Thêm nhanh vào giỏ hàng
 */
const QuickAddModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const { _id, name, images, basePrice, salePrice, variants } = product;

  // Lấy danh sách màu duy nhất có hàng
  const uniqueColors = [
    ...new Map(
      variants?.filter((v) => v.stock > 0).map((v) => [v.color, v])
    ).values(),
  ];

  // Lấy sizes có hàng theo màu đang chọn
  const availableSizes = selectedColor
    ? variants
        .filter((v) => v.color === selectedColor && v.stock > 0)
        .map((v) => v.size)
    : [...new Set(variants?.filter((v) => v.stock > 0).map((v) => v.size))];

  const displayPrice = salePrice && salePrice < basePrice ? salePrice : basePrice;
  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const handleAddToCart = async () => {
    if (!selectedSize) { setError('Vui lòng chọn kích cỡ'); return; }
    if (!selectedColor) { setError('Vui lòng chọn màu sắc'); return; }

    try {
      setIsAdding(true);
      setError('');
      await addToCart({
        productId: _id,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />

      {/* Modal */}
      <div
        className="relative bg-white w-full sm:max-w-md sm:mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-bobo-gray-100">
          <img
            src={images?.[0]}
            alt={name}
            className="w-20 h-24 object-cover bg-bobo-gray-50 flex-shrink-0"
          />
          <div className="flex-1">
            <h3 className="font-medium text-sm leading-tight mb-1">{name}</h3>
            <p className="text-bobo-black font-semibold">{formatPrice(displayPrice)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bobo-gray-100 transition-colors -mt-1"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Chọn màu */}
          <div>
            <p className="text-sm font-medium mb-2.5">
              Màu sắc:{' '}
              <span className="font-normal text-bobo-gray-500">{selectedColor || 'Chưa chọn'}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {uniqueColors.map((v) => (
                <button
                  key={v.color}
                  onClick={() => { setSelectedColor(v.color); setSelectedSize(null); setError(''); }}
                  title={v.color}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-150
                    ${selectedColor === v.color
                      ? 'border-bobo-black scale-110 shadow-md'
                      : 'border-transparent hover:border-bobo-gray-300'
                    }`}
                  style={{ backgroundColor: v.colorHex || '#ccc' }}
                />
              ))}
            </div>
          </div>

          {/* Chọn size */}
          <div>
            <p className="text-sm font-medium mb-2.5">Kích cỡ</p>
            <div className="flex gap-2 flex-wrap">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                const isAvailable = availableSizes.includes(size);
                return (
                  <button
                    key={size}
                    disabled={!isAvailable}
                    onClick={() => { setSelectedSize(size); setError(''); }}
                    className={`min-w-[44px] h-10 px-3 text-sm font-medium border transition-all duration-150
                      ${!isAvailable
                        ? 'border-bobo-gray-200 text-bobo-gray-300 cursor-not-allowed line-through'
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
          </div>

          {/* Error message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 space-y-2">
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ShoppingBag size={18} />
            {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;
