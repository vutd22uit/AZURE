#!/usr/bin/env node

/**
 * Seed Data Script
 * Generates 100K users + 500K orders to ensure >4GB data requirement
 */

const axios = require('axios');
const { faker } = require('@faker-js/faker');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

const NUM_USERS = 100000;
const NUM_ORDERS = 500000;
const BATCH_SIZE = 100;

console.log('=== E-commerce Data Seeder ===');
console.log(`Target: ${NUM_USERS} users, ${NUM_ORDERS} orders`);
console.log(`Data size estimate: >4GB\n`);

// Generate fake product IDs
const PRODUCT_IDS = Array.from({ length: 1000 }, () => faker.string.uuid());

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createUser(index) {
  try {
    const email = `user${index}@ecommerce-test.com`;
    const password = 'Password123!';
    const name = faker.person.fullName();

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
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: `user${index}@ecommerce-test.com`,
        password: 'Password123!'
      });
      return {
        userId: response.data.user.id,
        token: response.data.token,
        email: response.data.user.email
      };
    }
    throw error;
  }
}

async function createOrder(user) {
  try {
    const numItems = faker.number.int({ min: 1, max: 10 });
    const items = Array.from({ length: numItems }, () => ({
      productId: faker.helpers.arrayElement(PRODUCT_IDS),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      quantity: faker.number.int({ min: 1, max: 5 })
    }));

    const orderData = {
      items,
      shippingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      paymentMethod: faker.helpers.arrayElement(['credit_card', 'debit_card', 'paypal'])
    };

    await axios.post(`${ORDER_SERVICE_URL}/api/orders`, orderData, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    return true;
  } catch (error) {
    console.error(`Failed to create order for user ${user.userId}:`, error.message);
    return false;
  }
}

async function seedUsers() {
  console.log(`\n📝 Creating ${NUM_USERS} users...`);
  const users = [];
  let created = 0;

  for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
    const batchPromises = [];
    const batchEnd = Math.min(i + BATCH_SIZE, NUM_USERS);

    for (let j = i; j < batchEnd; j++) {
      batchPromises.push(createUser(j));
    }

    try {
      const batchUsers = await Promise.all(batchPromises);
      users.push(...batchUsers);
      created += batchUsers.length;

      if (created % 1000 === 0) {
        console.log(`   ✓ Created ${created}/${NUM_USERS} users (${((created/NUM_USERS)*100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error(`   ✗ Batch failed at ${i}:`, error.message);
    }

    await sleep(100); // Rate limiting
  }

  console.log(`\n✅ Total users created: ${users.length}\n`);
  return users;
}

async function seedOrders(users) {
  console.log(`\n📦 Creating ${NUM_ORDERS} orders...`);
  let created = 0;
  let failed = 0;

  for (let i = 0; i < NUM_ORDERS; i += BATCH_SIZE) {
    const batchPromises = [];
    const batchEnd = Math.min(i + BATCH_SIZE, NUM_ORDERS);

    for (let j = i; j < batchEnd; j++) {
      const randomUser = faker.helpers.arrayElement(users);
      batchPromises.push(createOrder(randomUser));
    }

    try {
      const results = await Promise.all(batchPromises);
      const successCount = results.filter(r => r).length;
      created += successCount;
      failed += results.length - successCount;

      if (created % 1000 === 0) {
        console.log(`   ✓ Created ${created}/${NUM_ORDERS} orders (${((created/NUM_ORDERS)*100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error(`   ✗ Batch failed at ${i}:`, error.message);
      failed += BATCH_SIZE;
    }

    await sleep(100); // Rate limiting
  }

  console.log(`\n✅ Total orders created: ${created}`);
  console.log(`❌ Failed orders: ${failed}\n`);
}

async function createSampleProducts() {
  console.log('\n🛍️  Creating sample products...');

  const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];
  const products = [];

  for (let i = 0; i < 100; i++) {
    try {
      const product = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        category: faker.helpers.arrayElement(categories),
        imageUrl: `https://picsum.photos/seed/${i}/300/300`,
        stock: faker.number.int({ min: 0, max: 1000 })
      };

      await axios.post(`${ORDER_SERVICE_URL}/api/products`, product);
      products.push(product);

      if ((i + 1) % 20 === 0) {
        console.log(`   ✓ Created ${i + 1}/100 products`);
      }
    } catch (error) {
      console.error(`Failed to create product ${i}:`, error.message);
    }
  }

  console.log(`\n✅ Total products created: ${products.length}\n`);
}

async function main() {
  try {
    const startTime = Date.now();

    // Create sample products first
    await createSampleProducts();

    // Create users
    const users = await seedUsers();

    if (users.length === 0) {
      console.error('❌ No users created. Exiting...');
      process.exit(1);
    }

    // Create orders
    await seedOrders(users);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

    console.log('='.repeat(50));
    console.log('✨ Seeding completed!');
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`👥 Users: ${users.length}`);
    console.log(`📦 Orders: ${NUM_ORDERS}`);
    console.log(`💾 Estimated data size: >4GB`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createUser, createOrder, createSampleProducts };
