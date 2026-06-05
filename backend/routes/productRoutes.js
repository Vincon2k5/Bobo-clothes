const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getCompleteTheLook,
  getCategories,
} = require('../controllers/productController');

// GET /api/products                     - Danh sách sản phẩm (filter, sort, paginate)
router.get('/', getProducts);

// GET /api/products/categories          - Danh sách categories
router.get('/categories', getCategories);

// GET /api/products/:slug               - Chi tiết sản phẩm
router.get('/:slug', getProductBySlug);

// GET /api/products/:slug/complete-the-look  - Cross-selling gợi ý
router.get('/:slug/complete-the-look', getCompleteTheLook);

module.exports = router;
