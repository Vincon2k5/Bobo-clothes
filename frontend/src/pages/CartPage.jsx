import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { items, subtotal, totalItems, updateItem, removeItem, loading } = useCart();

  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  if (items.length === 0) {
    return (
      <div className="container-main py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-bobo-gray-200 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Giỏ hàng trống</h2>
        <p className="text-bobo-gray-500 mb-6">Thêm sản phẩm vào giỏ để tiếp tục mua sắm</p>
        <Link to="/products" className="btn-primary inline-block px-10">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-10 max-w-6xl">
      <h1 className="text-2xl font-serif font-semibold mb-8">
        Giỏ hàng ({totalItems} sản phẩm)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <ul className="divide-y divide-bobo-gray-100">
            {items.map((item) => (
              <li key={item._id} className="flex gap-5 py-6">
                <Link to={`/products/${item.productSnapshot?.slug}`} className="flex-shrink-0">
                  <img
                    src={item.productSnapshot?.image}
                    alt={item.productSnapshot?.name}
                    className="w-24 h-32 object-cover bg-bobo-gray-50"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.productSnapshot?.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.productSnapshot?.name}
                  </Link>
                  <p className="text-sm text-bobo-gray-500 mt-1">
                    {item.variant?.size} · {item.variant?.color}
                  </p>
                  <p className="font-semibold mt-2">{formatPrice(item.priceAtAdd)}</p>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center border border-bobo-gray-200 w-fit">
                      <button
                        onClick={() => updateItem(item._id, item.quantity - 1)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-bobo-gray-50 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item._id, item.quantity + 1)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-bobo-gray-50 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Total & Remove */}
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatPrice(item.priceAtAdd * item.quantity)}</span>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-bobo-gray-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-sm text-bobo-gray-500 hover:text-bobo-black transition-colors mt-4"
          >
            ← Tiếp tục mua sắm
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border border-bobo-gray-100 p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-5">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-bobo-gray-500">Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bobo-gray-500">Phí vận chuyển</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="text-xs text-bobo-gray-400">
                  Mua thêm {formatPrice(500000 - subtotal)} để được miễn phí ship
                </p>
              )}
              <div className="border-t border-bobo-gray-100 pt-3 flex justify-between font-semibold text-base">
                <span>Tổng cộng</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="btn-primary w-full text-center mt-6 flex items-center justify-center gap-2"
            >
              Tiến hành thanh toán <ArrowRight size={18} />
            </Link>

            {/* Payment icons */}
            <div className="flex items-center justify-center gap-3 mt-4 text-xs text-bobo-gray-400">
              🔒 Thanh toán bảo mật
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
