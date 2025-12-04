#!/usr/bin/env node

/**
 * Seed Data Script - SIMPLIFIED VERSION
 * Tạo dữ liệu test với số lượng nhỏ hơn để dễ kiểm tra
 */

const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

// Số lượng nhỏ hơn để test
const NUM_USERS = parseInt(process.env.NUM_USERS) || 100;
const NUM_PRODUCTS = parseInt(process.env.NUM_PRODUCTS) || 50;
const NUM_ORDERS = parseInt(process.env.NUM_ORDERS) || 200;
const BATCH_SIZE = 10;

console.log('=== E-commerce Data Seeder (Simplified) ===');
console.log(`Target: ${NUM_USERS} users, ${NUM_PRODUCTS} products, ${NUM_ORDERS} orders\n`);

// Sample data arrays
const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];
const productNames = ['Laptop', 'Phone', 'Tablet', 'Watch', 'Camera', 'Headphones', 'Speaker'];
const cities = ['Hanoi', 'HCMC', 'Danang', 'Haiphong', 'Can Tho'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice(min = 10, max = 1000) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createUser(index) {
  try {
    const email = `user${index}@ecommerce-test.com`;
    const password = 'Password123!';
    const name = `${randomElement(firstNames)} ${randomElement(lastNames)}`;

    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, {
      email,
      password,
      name
    });

    return {
      userId: response.data.user.id,
      token: response.data.token,
      email
    };
  } catch (error) {
    if (error.response?.status === 409) {
      // User exists, try to login
      try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
          email: `user${index}@ecommerce-test.com`,
          password: 'Password123!'
        });
        return {
          userId: response.data.user.id,
          token: response.data.token,
          email: response.data.user.email
        };
      } catch (loginError) {
        console.error(`   ⚠️  Login failed for user ${index}`);
        return null;
      }
    }
    console.error(`   ⚠️  Failed to create user ${index}: ${error.message}`);
    return null;
  }
}

async function seedUsers() {
  console.log(`\n📝 Creating ${NUM_USERS} users...`);
  const users = [];
  let created = 0;
  let failed = 0;

  for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
    const batchPromises = [];
    const batchEnd = Math.min(i + BATCH_SIZE, NUM_USERS);

    for (let j = i; j < batchEnd; j++) {
      batchPromises.push(createUser(j));
    }

    const batchUsers = await Promise.allSettled(batchPromises);

    for (const result of batchUsers) {
      if (result.status === 'fulfilled' && result.value) {
        users.push(result.value);
        created++;
      } else {
        failed++;
      }
    }

    if (created % 50 === 0 && created > 0) {
      console.log(`   ✓ Created ${created}/${NUM_USERS} users (${((created/NUM_USERS)*100).toFixed(1)}%)`);
    }

    await sleep(50);
  }

  console.log(`\n✅ Total users created: ${created}`);
  console.log(`❌ Failed: ${failed}\n`);
  return users;
}

async function createProduct(index) {
  try {
    const product = {
      name: `${randomElement(productNames)} ${index}`,
      description: `High quality product with great features`,
      price: randomPrice(10, 999),
      category: randomElement(categories),
      imageUrl: `https://picsum.photos/seed/${index}/300/300`,
      stock: randomInt(10, 500)
    };

    const response = await axios.post(`${ORDER_SERVICE_URL}/api/products`, product);
    return response.data;
  } catch (error) {
    console.error(`   ⚠️  Failed to create product ${index}`);
    return null;
  }
}

async function seedProducts() {
  console.log(`\n🛍️  Creating ${NUM_PRODUCTS} products...`);
  const products = [];
  let created = 0;

  for (let i = 0; i < NUM_PRODUCTS; i += BATCH_SIZE) {
    const batchPromises = [];
    const batchEnd = Math.min(i + BATCH_SIZE, NUM_PRODUCTS);

    for (let j = i; j < batchEnd; j++) {
      batchPromises.push(createProduct(j));
    }

    const batchProducts = await Promise.allSettled(batchPromises);

    for (const result of batchProducts) {
      if (result.status === 'fulfilled' && result.value) {
        products.push(result.value);
        created++;
      }
    }

    if (created % 20 === 0 && created > 0) {
      console.log(`   ✓ Created ${created}/${NUM_PRODUCTS} products`);
    }

    await sleep(50);
  }

  console.log(`\n✅ Total products created: ${created}\n`);
  return products;
}

async function createOrder(user, products) {
  try {
    const numItems = randomInt(1, 3);
    const items = [];

    for (let i = 0; i < numItems; i++) {
      const product = randomElement(products);
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: randomInt(1, 3)
      });
    }

    const orderData = {
      items,
      shippingAddress: {
        street: `${randomInt(1, 999)} Main Street`,
        city: randomElement(cities),
        state: 'VN',
        zipCode: `${randomInt(10000, 99999)}`,
        country: 'Vietnam'
      },
      paymentMethod: randomElement(['credit_card', 'debit_card', 'paypal'])
    };

    await axios.post(`${ORDER_SERVICE_URL}/api/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    return true;
  } catch (error) {
    return false;
  }
}

async function seedOrders(users, products) {
  console.log(`\n📦 Creating ${NUM_ORDERS} orders...`);
  let created = 0;
  let failed = 0;

  if (products.length === 0) {
    console.log('   ⚠️  No products available, skipping order creation\n');
    return;
  }

  for (let i = 0; i < NUM_ORDERS; i += BATCH_SIZE) {
    const batchPromises = [];
    const batchEnd = Math.min(i + BATCH_SIZE, NUM_ORDERS);

    for (let j = i; j < batchEnd; j++) {
      const randomUser = randomElement(users);
      batchPromises.push(createOrder(randomUser, products));
    }

    const results = await Promise.allSettled(batchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        created++;
      } else {
        failed++;
      }
    }

    if (created % 50 === 0 && created > 0) {
      console.log(`   ✓ Created ${created}/${NUM_ORDERS} orders (${((created/NUM_ORDERS)*100).toFixed(1)}%)`);
    }

    await sleep(50);
  }

  console.log(`\n✅ Total orders created: ${created}`);
  console.log(`❌ Failed: ${failed}\n`);
}

async function main() {
  try {
    console.log('🔍 Checking services...\n');

    // Check Auth Service
    try {
      await axios.get(`${AUTH_SERVICE_URL}/health`);
      console.log('✅ Auth Service is running');
    } catch (error) {
      console.error('❌ Auth Service is not running. Please start it first:');
      console.error('   cd auth-service && npm start');
      process.exit(1);
    }

    // Check Order Service
    try {
      await axios.get(`${ORDER_SERVICE_URL}/health`);
      console.log('✅ Order Service is running\n');
    } catch (error) {
      console.error('❌ Order Service is not running. Please start it first:');
      console.error('   cd order-service && npm start');
      process.exit(1);
    }

    const startTime = Date.now();

    // Seed data
    const users = await seedUsers();

    if (users.length === 0) {
      console.error('❌ No users created. Cannot continue.');
      process.exit(1);
    }

    const products = await seedProducts();

    if (products.length > 0 && users.length > 0) {
      await seedOrders(users, products);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('='.repeat(50));
    console.log('✨ Seeding completed!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`👥 Users: ${users.length}`);
    console.log(`🛍️  Products: ${products.length}`);
    console.log(`📦 Orders: ~${NUM_ORDERS}`);
    console.log('='.repeat(50));
    console.log('\n💡 To create more data, use environment variables:');
    console.log('   NUM_USERS=1000 NUM_PRODUCTS=500 NUM_ORDERS=2000 npm run seed-simple\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
