import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import placeholder from '../../assets/placeholder.svg';
import { resolveImageUrl } from '../../utils/image';

/**
 * Mini Cart - Drawer từ phải hiện khi click icon giỏ hàng
 */
const MiniCart = ({ isOpen, onClose }) => {
  const { items, subtotal, totalItems, updateItem, removeItem, loading } = useCart();

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white z-50
                    flex flex-col shadow-2xl transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Giỏ hàng"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bobo-gray-100">
          <h2 className="font-medium text-lg flex items-center gap-2">
            <ShoppingBag size={20} />
            Giỏ hàng
            {totalItems > 0 && (
              <span className="text-sm font-normal text-bobo-gray-500">({totalItems} sản phẩm)</span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bobo-gray-50 transition-colors -mr-2"
            aria-label="Đóng giỏ hàng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <ShoppingBag size={48} className="text-bobo-gray-200" />
              <div>
                <p className="font-medium mb-1">Giỏ hàng trống</p>
                <p className="text-sm text-bobo-gray-500">Thêm sản phẩm vào giỏ để tiếp tục mua sắm</p>
              </div>
              <button onClick={onClose} className="btn-secondary text-sm px-8">
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <ul className="space-y-0 divide-y divide-bobo-gray-100">
              {items.map((item) => (
                <CartItem
                  key={item._id}
                  item={item}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  formatPrice={formatPrice}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer - Tổng tiền + Checkout */}
        {items.length > 0 && (
          <div className="border-t border-bobo-gray-100 p-5 space-y-4 bg-white">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-bobo-gray-500">Tạm tính</span>
              <span className="font-semibold text-lg">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-bobo-gray-500">Phí vận chuyển sẽ được tính ở trang thanh toán</p>

            {/* Buttons */}
            <div className="space-y-2.5">
              <Link
                to="/checkout"
                onClick={onClose}
                className="btn-primary w-full text-center block text-sm"
              >
                Thanh toán ngay
              </Link>
              <Link
                to="/cart"
                onClick={onClose}
                className="btn-secondary w-full text-center block text-sm"
              >
                Xem giỏ hàng
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <span className="text-[10px] text-bobo-gray-300 flex items-center gap-1">🔒 Thanh toán bảo mật</span>
              <span className="text-[10px] text-bobo-gray-300 flex items-center gap-1">↩️ Đổi trả 30 ngày</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ==============================
// Sub-component: Cart Item
// ==============================
const CartItem = ({ item, onUpdate, onRemove, formatPrice }) => {
  const { productSnapshot, variant, quantity, priceAtAdd, _id } = item;

  return (
    <li className="flex gap-4 px-5 py-4">
      {/* Product Image */}
      <Link to={`/products/${productSnapshot?.slug}`} className="flex-shrink-0">
        <img
          src={resolveImageUrl(productSnapshot?.image) || placeholder}
          onError={(e) => { e.currentTarget.src = placeholder; }}
          alt={productSnapshot?.name}
          className="w-20 h-24 object-cover bg-bobo-gray-50"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${productSnapshot?.slug}`}
          className="text-sm font-medium line-clamp-2 hover:underline"
        >
          {productSnapshot?.name}
        </Link>

        {/* Variant Info */}
        <p className="text-xs text-bobo-gray-500 mt-1">
          {variant?.size} · {variant?.color}
        </p>

        {/* Price */}
        <p className="text-sm font-semibold mt-1">{formatPrice(priceAtAdd)}</p>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-bobo-gray-200">
            <button
              onClick={() => onUpdate(_id, quantity - 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-bobo-gray-50 transition-colors"
              aria-label="Giảm số lượng"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => onUpdate(_id, quantity + 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-bobo-gray-50 transition-colors"
              aria-label="Tăng số lượng"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(_id)}
            className="p-1.5 text-bobo-gray-300 hover:text-red-500 transition-colors"
            aria-label="Xóa sản phẩm"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
};

export default MiniCart;
