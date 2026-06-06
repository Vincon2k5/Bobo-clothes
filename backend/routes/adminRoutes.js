const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDashboard,
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adminGetOrders,
  adminGetOrder,
  updateOrderStatus,
  // site config
  getHomepageConfig,
  updateHomepageConfig,
} = require('../controllers/adminController');

// Tất cả admin routes đều yêu cầu đăng nhập + role admin
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboard);

// Products
router.get('/products', adminGetProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', adminGetOrders);
router.get('/orders/:id', adminGetOrder);
router.put('/orders/:id/status', updateOrderStatus);

// Site / Homepage config
router.get('/site/homepage', getHomepageConfig);
router.put('/site/homepage', updateHomepageConfig);

module.exports = router;
