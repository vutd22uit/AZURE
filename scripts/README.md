# Scripts Directory

Collection of utility scripts for data generation, testing, and demo purposes for the E-commerce Cloud-Native System.

## Available Scripts

### Data Generation

#### `seed-data-simple.js`
Simple data seeding script for development and demos.

**Usage:**
```bash
node seed-data-simple.js
```

**Configuration (via environment variables):**
```bash
USERS=500 PRODUCTS=100 ORDERS=1000 node seed-data-simple.js
```

**Defaults:**
- Users: 100
- Products: 50
- Orders: 200
- Execution time: ~30-60 seconds

---

#### `seed-data.js`
Production-scale data generation for performance testing.

**Usage:**
```bash
node seed-data.js
```

**Creates:**
- 100,000+ users
- 500,000+ orders
- Execution time: 30-60 minutes

**Warning:** This generates a large dataset. Use only for production testing.

---

#### `continuous-orders.js` ✨ NEW
Real-time order generation for live demos.

**Usage:**
```bash
# Set credentials
export DEMO_USER_EMAIL="demo@example.com"
export DEMO_USER_PASSWORD="demo123"

# Start generating orders (1 every 5 seconds by default)
node continuous-orders.js

# Custom interval (1 order every 10 seconds)
INTERVAL_MS=10000 node continuous-orders.js
```

**Features:**
- Creates orders continuously at specified interval
- Auto-registers demo user if doesn't exist
- Displays statistics every 30 seconds
- Graceful shutdown with Ctrl+C

**Environment Variables:**
- `ORDER_SERVICE_URL`: Order service endpoint (default: http://localhost:3002)
- `AUTH_SERVICE_URL`: Auth service endpoint (default: http://localhost:3001)
- `DEMO_USER_EMAIL`: Demo user email
- `DEMO_USER_PASSWORD`: Demo user password
- `INTERVAL_MS`: Milliseconds between orders (default: 5000)

---

### Testing & Verification

#### `verify-pipeline.js` ✨ NEW
Verifies data pipeline from Cosmos DB to Synapse.

**Usage:**
```bash
node verify-pipeline.js
```

**Checks:**
- ✅ Cosmos DB connection and order count
- ✅ Latest order timestamp
- ✅ Synapse Analytics queries (manual)
- ✅ Data Factory pipeline status (manual)

---

#### `test-connection.js`
Tests database connectivity (Cosmos DB and Synapse).

**Usage:**
```bash
node test-connection.js
```

---

#### `performance-tests.sh`
Apache Bench performance testing for API endpoints.

**Usage:**
```bash
chmod +x performance-tests.sh
./performance-tests.sh
```

---

## Quick Start

### Demo Data Pipeline (15 minutes)

```bash
# 1. Generate demo data
node seed-data-simple.js

# 2. Verify data in Cosmos DB
node verify-pipeline.js

# 3. Trigger Data Factory pipeline (via Azure Portal or CLI)
az datafactory pipeline create-run \
  --resource-group ecommerce-cloud-rg \
  --factory-name ecommerce-cloud-adf \
  --name CosmosToSynapsePipeline

# 4. Wait 5-10 minutes for pipeline to complete

# 5. Query data in Synapse (see /data-pipeline/QUICK_DEMO.md)
```

### Live Demo with Continuous Orders

```bash
# Terminal 1: Start order generation
export DEMO_USER_EMAIL="demo@example.com"
export DEMO_USER_PASSWORD="demo123"
node continuous-orders.js

# Terminal 2: Monitor pipeline
watch -n 10 "node verify-pipeline.js"

# Let run for 5-10 minutes, then trigger Data Factory pipeline
```

---

## Environment Setup

### Required Environment Variables

Create `.env` file in the scripts directory:

```env
# Cosmos DB
COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-key
COSMOS_DB_DATABASE=ordersdb

# Service URLs (for local development)
ORDER_SERVICE_URL=http://localhost:3002
AUTH_SERVICE_URL=http://localhost:3001

# Demo User (for continuous-orders.js)
DEMO_USER_EMAIL=demo@example.com
DEMO_USER_PASSWORD=demo123

# Synapse (optional, for verification)
SYNAPSE_SERVER=your-synapse.sql.azuresynapse.net
SYNAPSE_DATABASE=ecommercedw
SYNAPSE_USER=admin
SYNAPSE_PASSWORD=password

# Data Factory (optional)
ADF_RESOURCE_GROUP=ecommerce-cloud-rg
ADF_NAME=ecommerce-cloud-adf
```

### Install Dependencies

```bash
cd /home/user/AZURE/scripts
npm install
```

---

## Common Use Cases

### Use Case 1: Quick Demo for Stakeholders (15 min)

```bash
# 1. Generate sample data
node seed-data-simple.js

# 2. Show data in Cosmos DB (Azure Portal)

# 3. Trigger pipeline (Azure Portal or CLI)

# 4. Show results in Synapse and Power BI
```

### Use Case 2: Live Demo with Real-Time Updates

```bash
# Start continuous order generation
INTERVAL_MS=3000 node continuous-orders.js

# Let run during presentation
# Show orders appearing in real-time
# Trigger pipeline to show ETL process
```

---

## Troubleshooting

### Error: "Cannot connect to Cosmos DB"

**Solution:**
```bash
# Test connection
node test-connection.js

# Check firewall rules
az cosmosdb show \
  --resource-group ecommerce-cloud-rg \
  --name ecommerce-cloud-cosmos \
  --query "ipRules"
```

### Error: "Authentication failed"

**Solution:**
```bash
# Test auth service
curl http://localhost:3001/health

# Register user manually
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123","name":"Demo User"}'
```

---

## Additional Resources

- **Quick Demo Guide**: [/data-pipeline/QUICK_DEMO.md](../data-pipeline/QUICK_DEMO.md)
- **Full Demo Guide**: [/data-pipeline/DEMO_GUIDE.md](../data-pipeline/DEMO_GUIDE.md)
- **Power BI Setup**: [/powerbi/POWERBI_EMBEDDED_SETUP.md](../powerbi/POWERBI_EMBEDDED_SETUP.md)

---

**Last Updated**: 2024-12-04
