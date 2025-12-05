# 🔧 Hướng Dẫn Sửa Lỗi Tạo User

Hướng dẫn này giúp bạn khắc phục lỗi "không tạo được user" trong scripts.

---

## 🔍 Bước 1: Chạy Script Chẩn Đoán

```bash
cd /home/user/AZURE/scripts
npm install
npm run diagnose
```

Script sẽ tự động kiểm tra:
- ✅ Auth Service có đang chạy không
- ✅ Order Service có đang chạy không
- ✅ PostgreSQL database có kết nối được không
- ✅ Table `users` có tồn tại không
- ✅ Có thể tạo user test được không

---

## ❌ Các Lỗi Thường Gặp & Cách Sửa

### Lỗi 1: Auth Service không chạy

**Triệu chứng:**
```
❌ Auth Service: NOT Running
   Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Cách sửa:**
```bash
# Terminal 1: Start Auth Service
cd /home/user/AZURE/auth-service
npm install
npm start

# Chờ cho đến khi thấy:
# Auth Service running on port 3001
```

---

### Lỗi 2: PostgreSQL không chạy

**Triệu chứng:**
```
❌ PostgreSQL: Connection Failed
   Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cách sửa:**

**Linux/Ubuntu:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql
```

**macOS:**
```bash
# Install PostgreSQL (if not installed)
brew install postgresql

# Start PostgreSQL
brew services start postgresql
```

**Docker (recommended):**
```bash
# Run PostgreSQL in Docker
docker run -d \
  --name postgres-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=authdb \
  -p 5432:5432 \
  postgres:14
```

---

### Lỗi 3: Database không tồn tại

**Triệu chứng:**
```
❌ PostgreSQL: Connection Failed
   Error: database "authdb" does not exist
```

**Cách sửa:**
```bash
# Create database
createdb authdb

# Or using psql
psql -U postgres -c "CREATE DATABASE authdb;"
```

---

### Lỗi 4: Table "users" không tồn tại

**Triệu chứng:**
```
❌ Table "users": DOES NOT EXIST
```

**Cách sửa:**

Auth service tự động tạo table khi start. Chỉ cần:

```bash
cd /home/user/AZURE/auth-service

# Set environment variables
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_DATABASE=authdb

# Start service (will auto-create table)
npm start
```

**Hoặc tạo table thủ công:**
```bash
psql -U postgres -d authdb <<EOF
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
EOF
```

---

### Lỗi 5: Environment variables không đúng

**Triệu chứng:**
```
❌ Authentication failed
   Error: password authentication failed
```

**Cách sửa:**

**Tạo file `.env` cho auth-service:**
```bash
cd /home/user/AZURE/auth-service

cat > .env <<'EOF'
PORT=3001
NODE_ENV=development

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=authdb

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h
EOF
```

**Tạo file `.env` cho order-service:**
```bash
cd /home/user/AZURE/order-service

cat > .env <<'EOF'
PORT=3002
NODE_ENV=development

# Cosmos DB Configuration (Azure)
COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-key
COSMOS_DB_DATABASE=ordersdb

# Auth Service URL
AUTH_SERVICE_URL=http://localhost:3001

# Payment Function URL
PAYMENT_FUNCTION_URL=http://localhost:7071/api/process-payment
EOF
```

---

## ✅ Kiểm Tra Lại

Sau khi sửa lỗi, chạy lại script chẩn đoán:

```bash
cd /home/user/AZURE/scripts
npm run diagnose
```

Kết quả mong muốn:
```
📋 SUMMARY

Auth Service:    ✅ OK
Order Service:   ✅ OK
Database:        ✅ OK
User Creation:   ✅ SUCCESS
```

---

## 🚀 Chạy Scripts Tạo Data

Sau khi mọi thứ OK:

```bash
cd /home/user/AZURE/scripts

# Tạo data test (100 users, 200 orders)
npm run seed-simple

# Tạo data lớn hơn
NUM_USERS=1000 NUM_ORDERS=2000 npm run seed-simple

# Tạo data rất lớn (100K users, 500K orders)
npm run seed-large
```

---

## 🔍 Debug Chi Tiết

### Kiểm tra Auth Service logs:

```bash
cd /home/user/AZURE/auth-service
npm start

# Xem logs khi tạo user
# Logs sẽ hiển thị:
# - Database connection
# - Table creation
# - User registration attempts
```

### Kiểm tra PostgreSQL trực tiếp:

```bash
# Connect to database
psql -U postgres -d authdb

# Check table
\dt

# Count users
SELECT COUNT(*) FROM users;

# View recent users
SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

### Test tạo user bằng curl:

```bash
# Test register endpoint
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# Expected response:
# {
#   "message": "User registered successfully",
#   "user": {
#     "id": 1,
#     "email": "test@example.com",
#     "name": "Test User"
#   },
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }
```

---

## 📚 Tài Liệu Tham Khảo

- **Auth Service**: `/auth-service/README.md`
- **Scripts**: `/scripts/README.md`
- **Database Config**: `/auth-service/src/config/database.js`
- **Environment Setup**: `/README.md` (Local Development section)

---

## 🆘 Vẫn Gặp Lỗi?

### Option 1: Reset toàn bộ database

```bash
# Drop and recreate database
dropdb authdb
createdb authdb

# Restart auth service (will auto-create table)
cd /home/user/AZURE/auth-service
npm start
```

### Option 2: Sử dụng Docker Compose

```bash
cd /home/user/AZURE

# Create docker-compose.yml for local development
cat > docker-compose.dev.yml <<'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: authdb
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
EOF

# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose -f docker-compose.dev.yml ps
```

### Option 3: Check logs chi tiết

```bash
# Auth service logs
cd /home/user/AZURE/auth-service
npm start 2>&1 | tee auth-service.log

# Order service logs
cd /home/user/AZURE/order-service
npm start 2>&1 | tee order-service.log

# PostgreSQL logs (Linux)
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

**Last Updated**: 2024-12-05
