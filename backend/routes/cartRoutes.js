const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem } = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

// Tất cả cart routes đều dùng optionalAuth (hỗ trợ guest + user)
router.use(optionalAuth);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeCartItem);

module.exports = router;
