require('dotenv').config();
const axios = require('axios');

/**
 * Continuous Order Generation Script
 * Simulates real-time order creation for data pipeline demos
 */

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 5000; // 5 seconds default
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@example.com';
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'demo123';

let authToken = null;
let orderCount = 0;

// Sample product data
const PRODUCTS = [
  { id: 'prod-1', name: 'Laptop', price: 999.99 },
  { id: 'prod-2', name: 'Mouse', price: 29.99 },
  { id: 'prod-3', name: 'Keyboard', price: 79.99 },
  { id: 'prod-4', name: 'Monitor', price: 299.99 },
  { id: 'prod-5', name: 'Headphones', price: 149.99 },
  { id: 'prod-6', name: 'Webcam', price: 89.99 },
  { id: 'prod-7', name: 'USB Cable', price: 12.99 },
  { id: 'prod-8', name: 'Phone', price: 699.99 },
  { id: 'prod-9', name: 'Tablet', price: 449.99 },
  { id: 'prod-10', name: 'Charger', price: 24.99 },
];

const PAYMENT_METHODS = ['Credit Card', 'PayPal', 'Debit Card'];
const CITIES = ['Seattle', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
const STATES = ['WA', 'NY', 'CA', 'IL', 'TX', 'AZ'];

/**
 * Login and get authentication token
 */
async function login() {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
    });

    authToken = response.data.token;
    console.log('✓ Authenticated successfully');
    return true;
  } catch (error) {
    console.error('✗ Authentication failed:', error.message);

    // Try to register if login fails
    try {
      console.log('Attempting to register new user...');
      await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, {
        email: DEMO_USER_EMAIL,
        password: DEMO_USER_PASSWORD,
        name: 'Demo User',
      });

      // Login again after registration
      return await login();
    } catch (regError) {
      console.error('✗ Registration failed:', regError.message);
      return false;
    }
  }
}

/**
 * Generate a random order
 */
function generateOrder() {
  const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
  const items = [];

  for (let i = 0; i < numItems; i++) {
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    items.push({
      productId: product.id,
      productName: product.name,
      quantity: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
      price: product.price,
    });
  }

  const cityIndex = Math.floor(Math.random() * CITIES.length);

  return {
    items,
    shippingAddress: {
      street: `${Math.floor(Math.random() * 999) + 1} Main St`,
      city: CITIES[cityIndex],
      state: STATES[cityIndex],
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      country: 'USA',
    },
    paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
  };
}

/**
 * Create an order via API
 */
async function createOrder() {
  const order = generateOrder();

  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/api/orders`, order, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    orderCount++;
    const totalAmount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    console.log(`✓ Order #${orderCount} created: ${response.data.orderId} | Total: $${totalAmount.toFixed(2)} | Items: ${order.items.length}`);

    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('Token expired, re-authenticating...');
      await login();
      return await createOrder(); // Retry with new token
    }

    console.error('✗ Failed to create order:', error.response?.data?.error || error.message);
    return false;
  }
}

/**
 * Display statistics
 */
function displayStats() {
  const uptimeSeconds = Math.floor(process.uptime());
  const avgRate = orderCount / (uptimeSeconds / 60); // orders per minute

  console.log('\n' + '='.repeat(60));
  console.log('📊 DEMO STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total Orders Created: ${orderCount}`);
  console.log(`Runtime: ${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`);
  console.log(`Average Rate: ${avgRate.toFixed(2)} orders/minute`);
  console.log(`Next order in: ${INTERVAL_MS / 1000}s`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Continuous Order Generation for Data Pipeline Demo');
  console.log(`Order Service: ${ORDER_SERVICE_URL}`);
  console.log(`Auth Service: ${AUTH_SERVICE_URL}`);
  console.log(`Interval: ${INTERVAL_MS / 1000}s between orders\n`);

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('Cannot proceed without authentication. Exiting.');
    process.exit(1);
  }

  console.log('\nStarting order generation...\n');

  // Create first order immediately
  await createOrder();

  // Create orders at regular intervals
  const orderInterval = setInterval(async () => {
    await createOrder();
  }, INTERVAL_MS);

  // Display statistics every 30 seconds
  const statsInterval = setInterval(() => {
    displayStats();
  }, 30000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n⚠️  Stopping order generation...');
    clearInterval(orderInterval);
    clearInterval(statsInterval);
    displayStats();
    console.log('\n✓ Script terminated gracefully\n');
    process.exit(0);
  });
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
