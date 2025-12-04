const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/', cartController.addToCart);

// Update cart item
router.put('/:productId', cartController.updateCartItem);

// Remove item from cart
router.delete('/:productId', cartController.removeFromCart);

// Clear cart
router.delete('/', cartController.clearCart);

module.exports = router;
