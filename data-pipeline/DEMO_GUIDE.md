# Data Pipeline Demo Guide

Complete guide to demonstrate the end-to-end data pipeline from Cosmos DB → Azure Data Factory → Synapse Analytics → Power BI.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Demo (15 minutes)](#quick-demo-15-minutes)
4. [Detailed Demo Steps](#detailed-demo-steps)
5. [Demo Scenarios](#demo-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Data Pipeline Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   Cosmos DB │────>│ Data Factory │────>│   Synapse   │────>│ Power BI │
│  (Orders)   │     │   (ETL)      │     │ Analytics   │     │ Reports  │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
      │                    │                     │                  │
   Realtime            Scheduled            Data Warehouse      Visualizations
  Operational           Hourly               OLAP Queries        Dashboards
    Database           Pipeline             Star Schema          Analytics
```

### Data Flow

1. **Source**: Orders are created in Cosmos DB (operational database)
2. **Extract**: Azure Data Factory extracts orders every hour
3. **Transform**: Data is cleaned, transformed, and aggregated
4. **Load**: Transformed data loaded into Synapse Analytics
5. **Analyze**: Power BI connects to Synapse for reporting

### Key Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Source** | Transactional data | Cosmos DB (NoSQL) |
| **ETL** | Data extraction & transformation | Azure Data Factory |
| **Data Warehouse** | Analytical queries | Azure Synapse Analytics |
| **BI Layer** | Dashboards & reports | Power BI / Power BI Embedded |

---

## Prerequisites

### Azure Resources (Already Deployed)

- ✅ Azure Cosmos DB account with `ordersdb` database
- ✅ Azure Data Factory instance
- ✅ Azure Synapse Analytics workspace with SQL pool
- ✅ Power BI workspace (for embedded reports)

### Tools Required

```bash
# Azure CLI
az --version

# Node.js (for seed scripts)
node --version  # v18+

# SQL client (for Synapse queries)
# Option 1: Azure Data Studio
# Option 2: sqlcmd
# Option 3: Azure Portal Query Editor
```

### Access Requirements

- Azure subscription owner/contributor role
- Synapse administrator access
- Data Factory contributor access
- Cosmos DB read/write access

---

## Quick Demo (15 minutes)

Perfect for stakeholder presentations and quick walkthroughs.

### Step 1: Seed Sample Data (2 minutes)

```bash
cd /home/user/AZURE/scripts

# Install dependencies
npm install

# Generate demo data
# Creates 100 users, 50 products, 200 orders
node seed-data-simple.js
```

**Expected Output:**
```
✓ Created 100 users
✓ Created 50 products
✓ Created 200 orders
✓ Total execution time: 45 seconds
```

### Step 2: Trigger Data Factory Pipeline (3 minutes)

#### Option A: Azure Portal

1. Open Azure Portal → Data Factory
2. Navigate to **Author & Monitor**
3. Click **Author** (pencil icon)
4. Select pipeline: `CosmosToSynapsePipeline`
5. Click **Trigger** → **Trigger Now**
6. Click **OK**

#### Option B: Azure CLI

```bash
# Get Data Factory name
ADF_NAME=$(az datafactory list \
  --resource-group ecommerce-cloud-rg \
  --query "[0].name" -o tsv)

# Trigger pipeline
az datafactory pipeline create-run \
  --resource-group ecommerce-cloud-rg \
  --factory-name $ADF_NAME \
  --name CosmosToSynapsePipeline

# Monitor pipeline run
az datafactory pipeline-run show \
  --resource-group ecommerce-cloud-rg \
  --factory-name $ADF_NAME \
  --run-id <run-id-from-previous-command>
```

### Step 3: Monitor Pipeline Execution (5 minutes)

Watch the pipeline run in real-time:

1. In Data Factory → **Monitor** (clock icon)
2. View **Pipeline runs**
3. Watch status change: `In Progress` → `Succeeded`
4. Click on run to see detailed execution
5. Verify all activities completed successfully

**Pipeline Activities:**
- ✅ Extract orders from Cosmos DB
- ✅ Copy to staging table
- ✅ Run transformation stored procedure
- ✅ Load into fact/dimension tables

### Step 4: Query Data in Synapse (3 minutes)

```sql
-- Connect to Synapse SQL Pool
-- Server: <synapse-workspace>.sql.azuresynapse.net
-- Database: ecommercedw

-- Check row counts
SELECT 'staging.Orders' AS TableName, COUNT(*) AS RowCount
FROM staging.Orders
UNION ALL
SELECT 'dw.FactOrders', COUNT(*) FROM dw.FactOrders
UNION ALL
SELECT 'dw.FactDailySales', COUNT(*) FROM dw.FactDailySales
UNION ALL
SELECT 'dw.DimDate', COUNT(*) FROM dw.DimDate;

-- Sample daily sales data
SELECT TOP 10
    SaleDate,
    TotalOrders,
    TotalRevenue,
    AverageOrderValue
FROM dw.FactDailySales
ORDER BY SaleDate DESC;

-- Sample orders with details
SELECT TOP 10 *
FROM dw.vw_OrdersSummary
ORDER BY OrderDate DESC;
```

**Expected Results:**
```
TableName              RowCount
staging.Orders         200
dw.FactOrders         200
dw.FactDailySales     ~10-30 (depends on date spread)
dw.DimDate            1095 (3 years)
```

### Step 5: View in Power BI (2 minutes)

1. Open Power BI Service: https://app.powerbi.com
2. Navigate to **E-commerce Analytics** workspace
3. Open **Overview Dashboard** report
4. Verify data is showing:
   - Total Revenue
   - Total Orders
   - Revenue trend chart
   - Top products

**OR** use Power BI Embedded in your app:
```bash
# Start the application
cd /home/user/AZURE/frontend
npm start

# Navigate to http://localhost:3000/analytics
```

---

## Detailed Demo Steps

### Phase 1: Data Generation (Production Simulation)

#### Scenario 1: Small Dataset (Development)

```bash
cd /home/user/AZURE/scripts
node seed-data-simple.js
```

Configuration via environment variables:
```bash
# Create 500 users, 100 products, 1000 orders
USERS=500 PRODUCTS=100 ORDERS=1000 node seed-data-simple.js
```

#### Scenario 2: Large Dataset (Production Simulation)

```bash
# WARNING: This creates 100K+ users and 500K+ orders
# Execution time: 30-60 minutes
node seed-data.js
```

#### Scenario 3: Continuous Data Generation

Create a script to simulate real-time order creation:

```bash
cd /home/user/AZURE/scripts
node continuous-orders.js
```

See [Creating Continuous Orders Script](#continuous-orders-script) below.

### Phase 2: Data Factory Pipeline

#### Understanding the Pipeline

**Pipeline Components:**

1. **Source**: Cosmos DB Linked Service
   - Connects to `ordersdb` database
   - Reads `orders` container
   - Uses partition key: `userId`

2. **Copy Activity**: Cosmos → Staging
   - Incremental load (only new/modified orders)
   - Uses change feed for delta detection
   - Lands in `staging.Orders` table

3. **Stored Procedure Activity**: Transform
   - Executes `sp_TransformOrders`
   - Cleanses data (removes duplicates, handles nulls)
   - Populates `dw.FactOrders`
   - Aggregates into `dw.FactDailySales`

4. **Post-Processing**: Update metadata
   - Logs pipeline run details
   - Updates last run timestamp

#### Triggering the Pipeline

**Manual Trigger** (for demos):
```bash
az datafactory pipeline create-run \
  --resource-group ecommerce-cloud-rg \
  --factory-name ecommerce-cloud-adf \
  --name CosmosToSynapsePipeline
```

**Scheduled Trigger** (production):
```bash
# Pipeline runs automatically every hour at :00
# Schedule: 0 * * * * (cron expression)
# No manual intervention needed
```

**Event-Based Trigger** (advanced):
- Trigger when new files arrive in Blob Storage
- Trigger on Cosmos DB change feed events
- Trigger via Logic Apps / Event Grid

#### Monitoring Pipeline Execution

**Real-time Monitoring:**

```bash
# List recent pipeline runs
az datafactory pipeline-run query-by-factory \
  --resource-group ecommerce-cloud-rg \
  --factory-name ecommerce-cloud-adf \
  --last-updated-after "2024-12-01" \
  --last-updated-before "2024-12-31"

# Get specific run details
az datafactory pipeline-run show \
  --resource-group ecommerce-cloud-rg \
  --factory-name ecommerce-cloud-adf \
  --run-id <run-id>
```

**Portal Monitoring:**
1. Data Factory → Monitor
2. Filter by pipeline name
3. View execution timeline
4. Drill into activity details
5. Check error messages (if any)

### Phase 3: Synapse Analytics Queries

#### Basic Data Verification

```sql
-- 1. Check data freshness
SELECT
    'Last Order in Cosmos' AS Source,
    MAX(createdAt) AS LatestTimestamp
FROM staging.Orders
UNION ALL
SELECT
    'Last Order in Warehouse',
    MAX(OrderDate)
FROM dw.FactOrders;

-- 2. Data quality check - duplicates
SELECT
    OrderId,
    COUNT(*) AS DuplicateCount
FROM dw.FactOrders
GROUP BY OrderId
HAVING COUNT(*) > 1;

-- 3. Missing products (data integrity)
SELECT DISTINCT
    f.OrderId,
    JSON_VALUE(item, '$.productId') AS ProductId
FROM dw.FactOrders f
CROSS APPLY OPENJSON(f.Items) AS item
WHERE JSON_VALUE(item, '$.productId') NOT IN (
    SELECT DISTINCT ProductId FROM dw.DimProducts
);
```

#### Business Intelligence Queries

```sql
-- 1. Daily Sales Trend (Last 30 Days)
SELECT
    SaleDate,
    TotalOrders,
    TotalRevenue,
    AverageOrderValue,
    TotalRevenue - LAG(TotalRevenue) OVER (ORDER BY SaleDate) AS RevenueChange
FROM dw.FactDailySales
WHERE SaleDate >= DATEADD(day, -30, GETDATE())
ORDER BY SaleDate DESC;

-- 2. Top 10 Products by Revenue
SELECT TOP 10
    JSON_VALUE(item, '$.productName') AS ProductName,
    SUM(CAST(JSON_VALUE(item, '$.price') AS DECIMAL(10,2)) *
        CAST(JSON_VALUE(item, '$.quantity') AS INT)) AS TotalRevenue,
    SUM(CAST(JSON_VALUE(item, '$.quantity') AS INT)) AS TotalQuantitySold,
    COUNT(DISTINCT f.OrderId) AS NumberOfOrders
FROM dw.FactOrders f
CROSS APPLY OPENJSON(f.Items) AS item
GROUP BY JSON_VALUE(item, '$.productName')
ORDER BY TotalRevenue DESC;

-- 3. Customer Segmentation by Order Value
SELECT
    CASE
        WHEN TotalAmount < 50 THEN 'Low Value'
        WHEN TotalAmount BETWEEN 50 AND 200 THEN 'Medium Value'
        ELSE 'High Value'
    END AS CustomerSegment,
    COUNT(*) AS OrderCount,
    AVG(TotalAmount) AS AvgOrderValue,
    SUM(TotalAmount) AS TotalRevenue
FROM dw.FactOrders
GROUP BY
    CASE
        WHEN TotalAmount < 50 THEN 'Low Value'
        WHEN TotalAmount BETWEEN 50 AND 200 THEN 'Medium Value'
        ELSE 'High Value'
    END
ORDER BY TotalRevenue DESC;

-- 4. Payment Method Analysis
SELECT
    PaymentMethod,
    COUNT(*) AS TransactionCount,
    SUM(TotalAmount) AS TotalRevenue,
    AVG(TotalAmount) AS AvgTransactionSize
FROM dw.FactOrders
GROUP BY PaymentMethod
ORDER BY TotalRevenue DESC;

-- 5. Monthly Revenue Trend
SELECT
    YEAR(OrderDate) AS Year,
    MONTH(OrderDate) AS Month,
    COUNT(*) AS TotalOrders,
    SUM(TotalAmount) AS MonthlyRevenue,
    AVG(TotalAmount) AS AvgOrderValue
FROM dw.FactOrders
GROUP BY YEAR(OrderDate), MONTH(OrderDate)
ORDER BY Year DESC, Month DESC;
```

### Phase 4: Power BI Visualization

#### Refresh Power BI Dataset

```bash
# Using Power BI REST API
curl -X POST \
  "https://api.powerbi.com/v1.0/myorg/groups/{workspace-id}/datasets/{dataset-id}/refreshes" \
  -H "Authorization: Bearer {access-token}" \
  -H "Content-Type: application/json"
```

#### Create New Visualizations

1. **Revenue KPI Card**
   - Measure: `Total Revenue = SUM(FactOrders[TotalAmount])`
   - Format: Currency
   - Conditional formatting: Green if > target

2. **Daily Trend Line Chart**
   - X-axis: `DimDate[Date]`
   - Y-axis: `FactDailySales[TotalRevenue]`
   - Trend line: Enabled
   - Forecast: 7 days

3. **Product Performance Bar Chart**
   - Category: Product Name
   - Value: Total Revenue
   - Top N filter: 10
   - Data labels: Show value

4. **Payment Method Pie Chart**
   - Legend: Payment Method
   - Values: Count of orders
   - Percentage labels: Enabled

---

## Demo Scenarios

### Scenario 1: Real-Time Data Updates (Live Demo)

**Objective**: Show data flowing from app → Cosmos DB → Synapse → Power BI

**Steps:**
1. Open application: http://localhost:3000
2. Login and create 5-10 orders
3. Show orders in Cosmos DB (Azure Portal)
4. Manually trigger Data Factory pipeline
5. Watch pipeline execution (5-10 minutes)
6. Query Synapse to see new orders
7. Refresh Power BI report to show updated data

**Script:**
```bash
# Terminal 1: Monitor Cosmos DB
while true; do
  echo "Order count: $(az cosmosdb sql container query \
    --account-name ecommerce-cloud-cosmos \
    --database-name ordersdb \
    --name orders \
    --query "SELECT VALUE COUNT(1) FROM c" | jq '.[0]')"
  sleep 5
done

# Terminal 2: Create orders via API
for i in {1..10}; do
  curl -X POST http://localhost:3002/api/orders \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{...order payload...}'
  sleep 2
done
```

### Scenario 2: Historical Analysis (Stakeholder Demo)

**Objective**: Demonstrate analytical capabilities on historical data

**Steps:**
1. Load 3 months of historical data
2. Show revenue trends over time
3. Identify top-performing products
4. Analyze customer segmentation
5. Compare month-over-month growth

**Queries:**
```sql
-- Growth analysis
WITH MonthlyStats AS (
  SELECT
    YEAR(OrderDate) AS Year,
    MONTH(OrderDate) AS Month,
    SUM(TotalAmount) AS Revenue
  FROM dw.FactOrders
  GROUP BY YEAR(OrderDate), MONTH(OrderDate)
)
SELECT
  Year, Month, Revenue,
  LAG(Revenue) OVER (ORDER BY Year, Month) AS PrevMonthRevenue,
  ((Revenue - LAG(Revenue) OVER (ORDER BY Year, Month)) /
   LAG(Revenue) OVER (ORDER BY Year, Month) * 100) AS GrowthPercent
FROM MonthlyStats
ORDER BY Year DESC, Month DESC;
```

### Scenario 3: Performance Testing

**Objective**: Show pipeline can handle production volumes

**Steps:**
1. Load 100K users, 500K orders using `seed-data.js`
2. Trigger full pipeline run
3. Monitor execution time and resource usage
4. Query performance on large dataset
5. Show Power BI rendering large datasets

**Expected Performance:**
- ETL completion: 10-15 minutes for 500K orders
- Query response: < 3 seconds for aggregates
- Power BI refresh: < 5 minutes

---

## Troubleshooting

### Issue 1: Pipeline Fails - Cosmos DB Connection

**Error**: `Failed to connect to Cosmos DB`

**Solution:**
```bash
# Check Cosmos DB firewall
az cosmosdb show \
  --resource-group ecommerce-cloud-rg \
  --name ecommerce-cloud-cosmos \
  --query "ipRules"

# Add Data Factory IP to firewall
az cosmosdb update \
  --resource-group ecommerce-cloud-rg \
  --name ecommerce-cloud-cosmos \
  --ip-range-filter "0.0.0.0" # Allow all (dev only)
```

### Issue 2: Synapse Table Not Updating

**Error**: Pipeline succeeds but no new data in tables

**Solution:**
```sql
-- Check staging table
SELECT COUNT(*), MAX(createdAt)
FROM staging.Orders;

-- Manually run transformation
EXEC dw.sp_TransformOrders;

-- Check stored procedure logs
SELECT * FROM dw.ETL_Logs
ORDER BY ExecutionTime DESC;
```

### Issue 3: Power BI Shows Old Data

**Error**: Power BI not reflecting latest Synapse data

**Solution:**
1. Manually refresh dataset:
   - Power BI Service → Datasets → Refresh Now
2. Check dataset refresh history
3. Verify connection string to Synapse
4. Clear Power BI cache

### Issue 4: Performance Degradation

**Error**: Queries slow, pipeline takes too long

**Solution:**
```sql
-- Check table statistics
DBCC SHOW_STATISTICS('dw.FactOrders', OrderId);

-- Update statistics
UPDATE STATISTICS dw.FactOrders;

-- Rebuild indexes
ALTER INDEX ALL ON dw.FactOrders REBUILD;

-- Scale up Synapse (if needed)
-- Azure Portal → Synapse → Scale → DW200c or higher
```

---

## Additional Scripts

### Continuous Orders Script

Create `/home/user/AZURE/scripts/continuous-orders.js`:

```javascript
const axios = require('axios');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
const TOKEN = process.env.AUTH_TOKEN; // Get from login

// Generate random order
async function createOrder() {
  const order = {
    items: [
      {
        productId: `prod-${Math.floor(Math.random() * 50) + 1}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: (Math.random() * 100 + 10).toFixed(2)
      }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101'
    },
    paymentMethod: ['Credit Card', 'PayPal', 'Debit Card'][Math.floor(Math.random() * 3)]
  };

  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/api/orders`, order, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log(`✓ Order created: ${response.data.orderId}`);
  } catch (error) {
    console.error('✗ Failed to create order:', error.message);
  }
}

// Create order every 5 seconds
console.log('Starting continuous order generation...');
setInterval(createOrder, 5000);
```

### Pipeline Monitor Script

Create `/home/user/AZURE/scripts/monitor-pipeline.sh`:

```bash
#!/bin/bash

ADF_NAME="ecommerce-cloud-adf"
RG="ecommerce-cloud-rg"

while true; do
  echo "=== Pipeline Status $(date) ==="

  # Get latest run
  RUN_ID=$(az datafactory pipeline-run query-by-factory \
    --resource-group $RG \
    --factory-name $ADF_NAME \
    --last-updated-after "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)" \
    --query "value[0].runId" -o tsv)

  if [ -n "$RUN_ID" ]; then
    STATUS=$(az datafactory pipeline-run show \
      --resource-group $RG \
      --factory-name $ADF_NAME \
      --run-id $RUN_ID \
      --query "status" -o tsv)

    echo "Latest Run: $RUN_ID"
    echo "Status: $STATUS"
  else
    echo "No recent runs found"
  fi

  sleep 30
done
```

---

## Demo Checklist

### Pre-Demo Setup (1 hour before)

- [ ] Verify all Azure resources are running
- [ ] Clear Synapse tables for fresh demo
- [ ] Prepare seed data scripts
- [ ] Test application connectivity
- [ ] Open Azure Portal tabs (Data Factory, Synapse, Cosmos DB)
- [ ] Load Power BI reports
- [ ] Test queries in Synapse
- [ ] Prepare demo data (run seed-data-simple.js)

### During Demo

- [ ] Show architecture diagram
- [ ] Demonstrate order creation in app
- [ ] Show data in Cosmos DB
- [ ] Trigger Data Factory pipeline
- [ ] Monitor pipeline execution
- [ ] Query Synapse for results
- [ ] Display Power BI visualizations
- [ ] Answer questions about scalability, cost, security

### Post-Demo

- [ ] Clean up demo data (optional)
- [ ] Pause Synapse SQL pool to save costs
- [ ] Document questions/feedback
- [ ] Share demo recording/screenshots

---

## Resources

- **Pipeline Definition**: `/home/user/AZURE/data-pipeline/cosmos-to-synapse-pipeline.json`
- **Synapse Schema**: `/home/user/AZURE/data-pipeline/synapse-schema.sql`
- **Seed Scripts**: `/home/user/AZURE/scripts/`
- **Power BI Guide**: `/home/user/AZURE/powerbi/README.md`

---

**Demo Duration Estimates:**
- Quick Demo: 15 minutes
- Detailed Demo: 45 minutes
- Full Workshop: 2 hours (including hands-on)

**Last Updated**: 2024-12-04
