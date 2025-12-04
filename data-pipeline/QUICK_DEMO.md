# Data Pipeline - Quick Demo (10 Minutes)

Fastest way to demonstrate the complete data pipeline from Cosmos DB to Power BI.

## Prerequisites

```bash
# Make sure services are running
cd /home/user/AZURE
```

## Step 1: Generate Demo Data (2 minutes)

```bash
cd scripts

# Install dependencies (first time only)
npm install

# Create 100 users, 50 products, 200 orders
node seed-data-simple.js
```

**Expected Output:**
```
✓ Created 100 users
✓ Created 50 products
✓ Created 200 orders
✓ Execution time: 45 seconds
```

## Step 2: Verify Data in Cosmos DB (1 minute)

### Option A: Azure Portal
1. Go to https://portal.azure.com
2. Navigate to your Cosmos DB account
3. Data Explorer → `ordersdb` → `orders`
4. Click "Items" to see orders

### Option B: Command Line
```bash
node verify-pipeline.js
```

## Step 3: Trigger Data Factory Pipeline (2 minutes)

### Using Azure Portal

1. **Open Data Factory**
   ```
   Portal → Data Factory → Author & Monitor
   ```

2. **Trigger Pipeline**
   - Click "Author" (pencil icon) on left sidebar
   - Find pipeline: `CosmosToSynapsePipeline`
   - Click "Add trigger" → "Trigger now"
   - Click "OK"

3. **Monitor Execution**
   - Click "Monitor" (clock icon) on left sidebar
   - Watch pipeline run status
   - Status changes: `In Progress` → `Succeeded`
   - Time: ~5-10 minutes

### Using Azure CLI

```bash
# Get Data Factory name
ADF_NAME=$(terraform output -raw data_factory_name 2>/dev/null || echo "ecommerce-cloud-adf")
RG_NAME="ecommerce-cloud-rg"

# Trigger pipeline
RUN_ID=$(az datafactory pipeline create-run \
  --resource-group $RG_NAME \
  --factory-name $ADF_NAME \
  --name CosmosToSynapsePipeline \
  --query "runId" -o tsv)

echo "Pipeline started: $RUN_ID"

# Monitor status (check every 30 seconds)
watch -n 30 "az datafactory pipeline-run show \
  --resource-group $RG_NAME \
  --factory-name $ADF_NAME \
  --run-id $RUN_ID \
  --query '{Status:status, Start:runStart, End:runEnd}'"
```

## Step 4: Query Data in Synapse (3 minutes)

### Connect to Synapse

**Server**: `<your-synapse-workspace>.sql.azuresynapse.net`
**Database**: `ecommercedw`
**Authentication**: SQL Authentication

### Run Verification Queries

```sql
-- 1. Check data loaded
SELECT
    'Staging Orders' AS TableName,
    COUNT(*) AS RowCount,
    MAX(createdAt) AS LatestOrder
FROM staging.Orders

UNION ALL

SELECT
    'Fact Orders',
    COUNT(*),
    MAX(OrderDate)
FROM dw.FactOrders

UNION ALL

SELECT
    'Daily Sales',
    COUNT(*),
    MAX(SaleDate)
FROM dw.FactDailySales;
```

**Expected Result:**
```
TableName         RowCount    LatestOrder
Staging Orders    200         2024-12-04 10:30:00
Fact Orders       200         2024-12-04 10:30:00
Daily Sales       15-30       2024-12-04
```

### Sample Business Queries

```sql
-- Daily revenue trend
SELECT TOP 10
    SaleDate,
    TotalOrders,
    TotalRevenue,
    AverageOrderValue
FROM dw.FactDailySales
ORDER BY SaleDate DESC;

-- Top products (extract from JSON)
SELECT TOP 5
    JSON_VALUE(item, '$.productName') AS Product,
    SUM(CAST(JSON_VALUE(item, '$.quantity') AS INT)) AS UnitsSold,
    SUM(CAST(JSON_VALUE(item, '$.price') AS DECIMAL) *
        CAST(JSON_VALUE(item, '$.quantity') AS INT)) AS Revenue
FROM dw.FactOrders
CROSS APPLY OPENJSON(Items) AS item
GROUP BY JSON_VALUE(item, '$.productName')
ORDER BY Revenue DESC;

-- Payment method breakdown
SELECT
    PaymentMethod,
    COUNT(*) AS Orders,
    SUM(TotalAmount) AS Revenue
FROM dw.FactOrders
GROUP BY PaymentMethod
ORDER BY Revenue DESC;
```

## Step 5: View in Power BI (2 minutes)

### Option A: Power BI Service

1. Open https://app.powerbi.com
2. Navigate to "E-commerce Analytics" workspace
3. Open "Overview Dashboard" report
4. Click "Refresh" button if data is not updated

### Option B: Power BI Embedded (Your App)

```bash
# Start the application (if not already running)
cd /home/user/AZURE/frontend
npm start

# Navigate to:
# http://localhost:3000/analytics
```

**What to Show:**
- ✅ Total Revenue KPI card
- ✅ Total Orders count
- ✅ Revenue trend line chart
- ✅ Top products bar chart
- ✅ Daily sales table

## Continuous Demo (Live Orders)

For a more impressive demo, generate orders in real-time:

```bash
cd /home/user/AZURE/scripts

# Set demo user credentials
export DEMO_USER_EMAIL="demo@example.com"
export DEMO_USER_PASSWORD="demo123"

# Generate 1 order every 5 seconds
node continuous-orders.js

# Output:
# ✓ Order #1 created: ord-abc123 | Total: $149.99 | Items: 2
# ✓ Order #2 created: ord-def456 | Total: $299.99 | Items: 1
# ...
```

**Demo Flow:**
1. Start continuous-orders.js in one terminal
2. Show orders appearing in Cosmos DB (refresh Data Explorer)
3. After 5-10 minutes, trigger Data Factory pipeline
4. Show new data appearing in Synapse
5. Refresh Power BI to see updated dashboards

## Troubleshooting

### Issue: Pipeline Fails

```bash
# Check pipeline error details
az datafactory pipeline-run show \
  --resource-group ecommerce-cloud-rg \
  --factory-name ecommerce-cloud-adf \
  --run-id <run-id> \
  --query "message"
```

**Common Fixes:**
- Check Cosmos DB firewall allows Data Factory IP
- Verify Synapse SQL pool is running (not paused)
- Check Data Factory linked services are connected

### Issue: No Data in Synapse

```sql
-- Check if staging table has data
SELECT COUNT(*) FROM staging.Orders;

-- If staging has data but fact table doesn't, run transformation manually
EXEC dw.sp_TransformOrders;
```

### Issue: Power BI Not Updating

1. Power BI Service → Datasets → Your Dataset
2. Click "Refresh now"
3. Check refresh history for errors
4. Verify dataset connection to Synapse

## Demo Script (What to Say)

> "Let me show you our end-to-end data pipeline in action."

**Step 1:**
> "First, I'll generate some sample orders. This simulates real customer activity in our e-commerce platform."
>
> [Run seed-data-simple.js]

**Step 2:**
> "These orders are now stored in Cosmos DB, our operational database. You can see them here in the Azure Portal."
>
> [Show Cosmos DB Data Explorer]

**Step 3:**
> "Now I'll trigger our ETL pipeline in Azure Data Factory. This runs automatically every hour in production, but I can trigger it manually for this demo."
>
> [Trigger Data Factory pipeline]

**Step 4:**
> "While the pipeline is running, it's extracting data from Cosmos DB, transforming it, and loading it into our Synapse Analytics data warehouse. This takes about 5-10 minutes."
>
> [Show pipeline monitoring]

**Step 5:**
> "Once complete, we can query the data warehouse using SQL. Here's our daily sales summary, top products, and revenue trends."
>
> [Run Synapse queries]

**Step 6:**
> "Finally, all of this data is visualized in Power BI dashboards. Business users can access these interactive reports without writing any SQL."
>
> [Show Power BI reports]

> "The entire pipeline is automated, scalable, and runs continuously to provide real-time business insights."

## Clean Up (Optional)

```bash
# Stop continuous order generation
# Press Ctrl+C in the terminal running continuous-orders.js

# Pause Synapse SQL pool to save costs
az synapse sql pool pause \
  --name ecommercedw \
  --workspace-name ecommerce-cloud-synapse \
  --resource-group ecommerce-cloud-rg

# Clear demo data (optional)
# This will delete all orders from Cosmos DB
# Only do this if you want to start fresh
```

## Next Steps

- **Full Demo Guide**: See [DEMO_GUIDE.md](./DEMO_GUIDE.md)
- **Power BI Setup**: See [/powerbi/POWERBI_EMBEDDED_SETUP.md](../powerbi/POWERBI_EMBEDDED_SETUP.md)
- **Production Deployment**: See [/docs/](../docs/)

---

**Total Demo Time**: 10 minutes
**Preparation**: 5 minutes
**Difficulty**: Easy
