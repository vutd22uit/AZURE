const { getOrdersContainer, getCartContainer } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const PAYMENT_FUNCTION_URL = process.env.PAYMENT_FUNCTION_URL;

async function createOrder(req, res) {
  try {
    const userId = req.user.id.toString();
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = {
      id: uuidv4(),
      userId: userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const container = getOrdersContainer();
    const { resource: createdOrder } = await container.items.create(order);

    // Call payment processor function
    if (PAYMENT_FUNCTION_URL) {
      try {
        await axios.post(PAYMENT_FUNCTION_URL, {
          orderId: createdOrder.id,
          userId: userId,
          amount: totalAmount,
          paymentMethod
        }, { timeout: 10000 });
      } catch (err) {
        console.error('Payment processor call failed:', err.message);
        // Order is still created, payment will be processed async
      }
    }

    // Clear user's cart after order is created
    try {
      const cartContainer = getCartContainer();
      const cartId = `cart-${userId}`;
      await cartContainer.item(cartId, userId).delete();
    } catch (err) {
      console.log('No cart to clear or cart clear failed');
    }

    res.status(201).json(createdOrder);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

async function getUserOrders(req, res) {
  try {
    const userId = req.user.id.toString();
    const container = getOrdersContainer();

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: userId }]
    };

    const { resources: orders } = await container.items
      .query(querySpec)
      .fetchAll();

    res.status(200).json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();
    const container = getOrdersContainer();

    try {
      const { resource: order } = await container.item(id, userId).read();

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify order belongs to user
      if (order.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.status(200).json(order);
    } catch (err) {
      if (err.code === 404) {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById
};
