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
import OrderStatusPage from './pages/OrderStatusPage';
import ProductList from './components/ProductList/ProductList';
// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ProductsPage from './pages/admin/ProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import HomepageSettingsPage from './pages/admin/HomepageSettingsPage';

// Layout bọc Header + Footer cho các trang shop
const ShopLayout = ({ children }) => (
  <>
    <Header />
    {children}
    <Footer />
  </>
);

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
          <Route path="homepage" element={<HomepageSettingsPage />} />
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
              <OrderStatusPage checkoutResult />
            </ShopLayout>
          }
        />
        <Route
          path="/orders/:orderCode"
          element={
            <ShopLayout>
              <OrderStatusPage />
            </ShopLayout>
          }
        />
        <Route
          path="/account/orders/:orderCode"
          element={
            <ShopLayout>
              <OrderStatusPage />
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
