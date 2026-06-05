const express = require('express');
const router = express.Router();
const { createOrder, getOrderByCode, getMyOrders, cancelOrder } = require('../controllers/orderController');
const { protect, optionalAuth } = require('../middleware/auth');

// POST /api/orders          - Tạo đơn hàng (guest + user)
router.post('/', optionalAuth, createOrder);

// GET /api/orders/my-orders - Đơn hàng của tôi (đăng nhập)
router.get('/my-orders', protect, getMyOrders);

// GET /api/orders/:orderCode - Tra cứu đơn hàng
router.get('/:orderCode', optionalAuth, getOrderByCode);

// PUT /api/orders/:orderCode/cancel - Hủy đơn hàng
router.put('/:orderCode/cancel', protect, cancelOrder);

module.exports = router;
