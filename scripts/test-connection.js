#!/usr/bin/env node

/**
 * Test Script - Kiểm tra kết nối và tạo vài users test
 */

const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

console.log('=== Test Connection Script ===\n');
console.log('Auth Service:', AUTH_SERVICE_URL);
console.log('Order Service:', ORDER_SERVICE_URL);
console.log('');

async function testConnection() {
  console.log('1️⃣  Testing Auth Service connection...');
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/health`);
    console.log('   ✅ Auth Service is up:', response.data);
  } catch (error) {
    console.log('   ❌ Auth Service ERROR:', error.message);
    console.log('   💡 Hãy chắc chắn Auth Service đang chạy: cd auth-service && npm start');
    return false;
  }

  console.log('\n2️⃣  Testing Order Service connection...');
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/health`);
    console.log('   ✅ Order Service is up:', response.data);
  } catch (error) {
    console.log('   ❌ Order Service ERROR:', error.message);
    console.log('   💡 Hãy chắc chắn Order Service đang chạy: cd order-service && npm start');
    return false;
  }

  return true;
}

async function createTestUser(index) {
  console.log(`\n3️⃣  Creating test user ${index}...`);

  const email = `testuser${index}@test.com`;
  const password = 'Test123!';
  const name = `Test User ${index}`;

  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, {
      email,
      password,
      name
    });

    console.log('   ✅ User created successfully!');
    console.log('   👤 User ID:', response.data.user.id);
    console.log('   📧 Email:', response.data.user.email);
    console.log('   🎫 Token:', response.data.token.substring(0, 20) + '...');

    return {
      userId: response.data.user.id,
      token: response.data.token,
      email: response.data.user.email
    };
  } catch (error) {
    if (error.response) {
      console.log('   ❌ Error:', error.response.status, error.response.data);

      if (error.response.status === 409) {
        console.log('   💡 User already exists, trying to login...');
        try {
          const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
            email,
            password
          });
          console.log('   ✅ Login successful!');
          return {
            userId: loginResponse.data.user.id,
            token: loginResponse.data.token,
            email: loginResponse.data.user.email
          };
        } catch (loginError) {
          console.log('   ❌ Login failed:', loginError.response?.data || loginError.message);
        }
      }
    } else {
      console.log('   ❌ Network Error:', error.message);
    }
    return null;
  }
}

async function createTestProduct() {
  console.log('\n4️⃣  Creating test product...');

  const product = {
    name: 'Test Product',
    description: 'This is a test product',
    price: 99.99,
    category: 'electronics',
    imageUrl: 'https://picsum.photos/300/300',
    stock: 100
  };

  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/api/products`, product);
    console.log('   ✅ Product created successfully!');
    console.log('   📦 Product ID:', response.data.id);
    return response.data;
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function createTestOrder(user, product) {
  console.log('\n5️⃣  Creating test order...');

  const orderData = {
    items: [{
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    }],
    shippingAddress: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Vietnam'
    },
    paymentMethod: 'credit_card'
  };

  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/api/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });
    console.log('   ✅ Order created successfully!');
    console.log('   🛒 Order ID:', response.data.id);
    console.log('   💰 Total:', response.data.totalAmount);
    return response.data;
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  try {
    // Test connections
    const connected = await testConnection();
    if (!connected) {
      console.log('\n❌ Connection test failed. Please start the services first.\n');
      process.exit(1);
    }

    // Create test user
    const user = await createTestUser(Date.now());
    if (!user) {
      console.log('\n❌ Failed to create user. Cannot continue.\n');
      process.exit(1);
    }

    // Create test product
    const product = await createTestProduct();
    if (!product) {
      console.log('\n⚠️  Failed to create product, but continuing...\n');
    }

    // Create test order (if product exists)
    if (product && user) {
      await createTestOrder(user, product);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Test completed successfully!');
    console.log('🎉 System is working properly!');
    console.log('\n💡 Now you can run: npm run seed');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n📋 Stack trace:', error.stack);
    process.exit(1);
  }
}

main();
