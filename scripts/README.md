# Scripts for E-commerce System

Các scripts để seed data và test performance.

## Prerequisites

1. Cài đặt dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Đảm bảo các services đang chạy:
   ```bash
   # Terminal 1: Auth Service
   cd auth-service
   npm install
   npm start

   # Terminal 2: Order Service
   cd order-service
   npm install
   npm start
   ```

## Scripts Available

### 1. Test Connection
Kiểm tra kết nối với các services và tạo test data.

```bash
npm run test
```

Sẽ kiểm tra:
- ✅ Auth Service health
- ✅ Order Service health
- ✅ Tạo test user
- ✅ Tạo test product
- ✅ Tạo test order

### 2. Seed Data (Simple Version)
Tạo dữ liệu với số lượng nhỏ để test nhanh.

```bash
# Mặc định: 100 users, 50 products, 200 orders
npm run seed-simple

# Custom số lượng:
NUM_USERS=500 NUM_PRODUCTS=200 NUM_ORDERS=1000 npm run seed-simple
```

### 3. Seed Data (Full Version)
Tạo dữ liệu với Faker.js (cần @faker-js/faker).

```bash
# Số lượng mặc định
npm run seed

# Tạo 100K users + 500K orders (>4GB data)
npm run seed-large
```

### 4. Performance Testing
Chạy performance tests với Apache Bench.

```bash
npm run test-performance
```

## Troubleshooting

### Error: "Cannot find module 'axios'"
```bash
cd scripts
npm install
```

### Error: "connect ECONNREFUSED"
```bash
# Auth Service chưa chạy
cd auth-service
npm install
npm start

# Order Service chưa chạy
cd order-service
npm install
npm start
```

### Error: "User already exists"
Script sẽ tự động login nếu user đã tồn tại.

### Muốn xóa data và bắt đầu lại
```bash
# Xóa PostgreSQL data
psql -h <host> -U pgadmin -d authdb -c "TRUNCATE users CASCADE;"

# Xóa Cosmos DB data (dùng Azure Portal hoặc CLI)
```

## Chạy từng bước

### Bước 1: Test kết nối
```bash
npm run test
```

Nếu thấy:
```
✨ Test completed successfully!
🎉 System is working properly!
```

Tiếp tục bước 2.

### Bước 2: Seed data nhỏ
```bash
npm run seed-simple
```

Nếu thành công, bạn sẽ thấy:
```
✅ Total users created: 100
✅ Total products created: 50
✅ Total orders created: 200
```

### Bước 3: Seed data lớn (>4GB)
```bash
# Chạy qua đêm, mất ~2-3 giờ
npm run seed-large
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| AUTH_SERVICE_URL | http://localhost:3001 | Auth service URL |
| ORDER_SERVICE_URL | http://localhost:3002 | Order service URL |
| NUM_USERS | 100 | Số lượng users |
| NUM_PRODUCTS | 50 | Số lượng products |
| NUM_ORDERS | 200 | Số lượng orders |

## Performance

### Seed Simple
- 100 users: ~10 giây
- 500 users: ~30 giây
- 1000 users + 2000 orders: ~2 phút

### Seed Large (với Faker)
- 100K users: ~30-60 phút
- 500K orders: ~60-90 phút
- Tổng: ~2-3 giờ

## Tips

1. **Chạy qua đêm** cho seed large
2. **Monitor services** để đảm bảo không crash
3. **Check database** để xác nhận data được tạo
4. **Reduce số lượng** nếu gặp rate limiting

## Example Output

```bash
$ npm run seed-simple

=== E-commerce Data Seeder (Simplified) ===
Target: 100 users, 50 products, 200 orders

🔍 Checking services...

✅ Auth Service is running
✅ Order Service is running

📝 Creating 100 users...
   ✓ Created 50/100 users (50.0%)
   ✓ Created 100/100 users (100.0%)

✅ Total users created: 98
❌ Failed: 2

🛍️  Creating 50 products...
   ✓ Created 20/50 products
   ✓ Created 40/50 products

✅ Total products created: 48

📦 Creating 200 orders...
   ✓ Created 50/200 orders (25.0%)
   ✓ Created 100/200 orders (50.0%)
   ✓ Created 150/200 orders (75.0%)
   ✓ Created 200/200 orders (100.0%)

✅ Total orders created: 195
❌ Failed: 5

==================================================
✨ Seeding completed!
⏱️  Duration: 45.23 seconds
👥 Users: 98
🛍️  Products: 48
📦 Orders: ~200
==================================================
```
