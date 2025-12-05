#!/usr/bin/env node

/**
 * Diagnostic Script - Kiểm tra lỗi tạo user
 * Checks why user creation is failing
 */

const axios = require('axios');
const { Client } = require('pg');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

// PostgreSQL connection
const DB_CONFIG = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DATABASE || 'authdb',
};

console.log('🔍 KIỂM TRA LỖI TẠO USER\n');
console.log('='.repeat(60));

async function checkService(name, url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ ${name}: Running`);
    console.log(`   URL: ${url}`);
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: NOT Running`);
    console.log(`   URL: ${url}`);
    console.log(`   Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   → Service is not started`);
    }
    return false;
  }
}

async function checkDatabase() {
  console.log('\n📊 Kiểm tra PostgreSQL Database...');
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log('✅ PostgreSQL: Connected');
    console.log(`   Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`   Database: ${DB_CONFIG.database}`);

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Table "users": Exists');

      // Count users
      const countResult = await client.query('SELECT COUNT(*) FROM users');
      console.log(`   → Users in database: ${countResult.rows[0].count}`);

      // Show table structure
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);

      console.log('   → Table structure:');
      structureResult.rows.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Table "users": DOES NOT EXIST');
      console.log('   → Run database migration first!');
      console.log('   → cd auth-service && npm run migrate');
    }

    await client.end();
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL: Connection Failed');
    console.log(`   Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   → PostgreSQL is not running');
      console.log('   → Start it with: brew services start postgresql (Mac)');
      console.log('   → Or: sudo systemctl start postgresql (Linux)');
    } else if (error.code === '3D000') {
      console.log('   → Database does not exist');
      console.log('   → Create it: createdb authdb');
    } else if (error.code === '28P01') {
      console.log('   → Authentication failed');
      console.log('   → Check POSTGRES_USER and POSTGRES_PASSWORD');
    }
    return false;
  }
}

async function testUserCreation() {
  console.log('\n👤 Kiểm tra tạo user...');

  const testUser = {
    email: `test-${Date.now()}@test.com`,
    password: 'Test123!',
    name: 'Test User'
  };

  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/register`,
      testUser,
      { timeout: 10000 }
    );

    console.log('✅ User creation: SUCCESS');
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Email: ${response.data.user.email}`);
    console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.log('❌ User creation: FAILED');

    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);

      if (error.response.status === 400) {
        console.log('   → Validation error - check email/password format');
      } else if (error.response.status === 409) {
        console.log('   → User already exists');
      } else if (error.response.status === 500) {
        console.log('   → Server error - check auth service logs');
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  // 1. Check Auth Service
  console.log('\n1️⃣  Checking Auth Service...');
  const authOk = await checkService('Auth Service', `${AUTH_SERVICE_URL}/health`);

  // 2. Check Order Service
  console.log('\n2️⃣  Checking Order Service...');
  const orderOk = await checkService('Order Service', `${ORDER_SERVICE_URL}/health`);

  // 3. Check Database
  console.log('\n3️⃣  Checking Database...');
  const dbOk = await checkDatabase();

  // 4. Test User Creation
  if (authOk && dbOk) {
    console.log('\n4️⃣  Testing User Creation...');
    await testUserCreation();
  } else {
    console.log('\n4️⃣  Skipping user creation test (prerequisites failed)');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY\n');
  console.log(`Auth Service:    ${authOk ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Order Service:   ${orderOk ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Database:        ${dbOk ? '✅ OK' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');

  if (!authOk) {
    console.log('❌ Auth Service is not running');
    console.log('   Fix: cd auth-service && npm install && npm start\n');
  }

  if (!orderOk) {
    console.log('❌ Order Service is not running');
    console.log('   Fix: cd order-service && npm install && npm start\n');
  }

  if (!dbOk) {
    console.log('❌ Database connection failed');
    console.log('   Fix 1: Start PostgreSQL');
    console.log('   Fix 2: Create database: createdb authdb');
    console.log('   Fix 3: Run migrations: cd auth-service && npm run migrate\n');
  }

  console.log('📚 For more help, check: /scripts/README.md\n');
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
