const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// Create new order
router.post('/', orderController.createOrder);

// Get user's orders
router.get('/', orderController.getUserOrders);

// Get specific order
router.get('/:id', orderController.getOrderById);

module.exports = router;
