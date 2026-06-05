import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// Layout & Guards
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import AdminLayout from './components/admin/AdminLayout';
import RequireAdmin from './components/admin/RequireAdmin';
// Public Pages
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import ProductList from './components/ProductList/ProductList';
// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ProductsPage from './pages/admin/ProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';

// Layout bọc Header + Footer cho các trang shop
const ShopLayout = ({ children }) => (
  <>
    <Header />
    {children}
    <Footer />
  </>
);

const CheckoutResultPage = () => {
  const params = new URLSearchParams(window.location.search);
  return (
    <div className="container-main py-20 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-serif font-semibold mb-2">Đặt hàng thành công!</h1>
      <p className="text-bobo-gray-500 mb-2">Mã đơn hàng:</p>
      <p className="text-xl font-bold tracking-wider mb-6">{params.get('orderCode')}</p>
      <p className="text-sm text-bobo-gray-500 mb-8">
        Chúng tôi đã gửi xác nhận tới email của bạn.
      </p>
      <a href="/" className="btn-primary inline-block px-10">Tiếp tục mua sắm</a>
    </div>
  );
};

const App = () => {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#1a1a1a', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ==============================
            ADMIN ROUTES
            Không có Header/Footer của shop
        ============================== */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
        </Route>

        {/* ==============================
            PUBLIC ROUTES
            Có Header + Footer của shop
        ============================== */}
        <Route
          path="/"
          element={
            <ShopLayout>
              <HomePage />
            </ShopLayout>
          }
        />
        <Route
          path="/products"
          element={
            <ShopLayout>
              <ProductList />
            </ShopLayout>
          }
        />
        <Route
          path="/products/:slug"
          element={
            <ShopLayout>
              <ProductDetailPage />
            </ShopLayout>
          }
        />
        <Route
          path="/cart"
          element={
            <ShopLayout>
              <CartPage />
            </ShopLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <ShopLayout>
              <CheckoutPage />
            </ShopLayout>
          }
        />
        <Route
          path="/checkout/result"
          element={
            <ShopLayout>
              <CheckoutResultPage />
            </ShopLayout>
          }
        />
        <Route
          path="/login"
          element={
            <ShopLayout>
              <LoginPage />
            </ShopLayout>
          }
        />
        <Route
          path="/account"
          element={
            <ShopLayout>
              <AccountPage />
            </ShopLayout>
          }
        />
      </Routes>
    </>
  );
};

export default App;
