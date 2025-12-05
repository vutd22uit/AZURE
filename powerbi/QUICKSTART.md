# Power BI Desktop - Quick Start Guide (10 Minutes)

Get your first Power BI report running in 10 minutes. For detailed instructions, see [POWERBI_DESKTOP_SETUP.md](./POWERBI_DESKTOP_SETUP.md).

---

## Prerequisites Checklist

- [ ] Windows 10/11 computer
- [ ] Data loaded in Synapse Analytics (run `/scripts/seed-data-simple.js` first)
- [ ] Synapse SQL pool is running (not paused)
- [ ] Synapse admin credentials available

---

## Step 1: Install Power BI Desktop (2 minutes)

### Option A: Direct Download
1. Visit: https://www.microsoft.com/en-us/download/details.aspx?id=58494
2. Click "Download"
3. Install `PBIDesktopSetup_x64.exe`
4. Launch Power BI Desktop

### Option B: Microsoft Store
1. Open Microsoft Store
2. Search "Power BI Desktop"
3. Click "Install"

---

## Step 2: Get Synapse Connection Info (1 minute)

```bash
# Get Synapse workspace name
cd /home/user/AZURE/terraform
terraform output synapse_workspace_name

# Output example: ecommerce-cloud-synapse
```

**Your Connection Details**:
- **Server**: `<workspace-name>.sql.azuresynapse.net`
- **Database**: `ecommercedw`
- **Username**: `synapseadmin` (or your configured username)
- **Password**: (from your terraform.tfvars or environment)

---

## Step 3: Connect to Synapse (2 minutes)

1. **Open Power BI Desktop**

2. **Click "Get data"** (Home ribbon)

3. **Select Data Source**:
   - Search: "Azure Synapse"
   - Select: "Azure Synapse Analytics SQL"
   - Click "Connect"

4. **Enter Connection**:
   ```
   Server: <your-workspace>.sql.azuresynapse.net
   Database: ecommercedw
   ```

5. **Choose Mode**: Select "Import" (recommended)

6. **Authentication**:
   - Method: "Database"
   - Username: `synapseadmin`
   - Password: `<your-password>`
   - Click "Connect"

7. **Select Tables**:
   - ✅ Check `dw.FactOrders`
   - ✅ Check `dw.FactDailySales`
   - Click "Load"

8. **Wait for Load**: Should take 10-30 seconds

---

## Step 4: Create Your First Dashboard (5 minutes)

### Visualization 1: Total Revenue Card

1. Click "Card" visualization (right panel)
2. Drag `FactOrders > TotalAmount` to "Fields"
3. Click dropdown → Select "Sum"
4. **Title**: Click visualization → Format → Title → "Total Revenue"

### Visualization 2: Total Orders Card

1. Click empty space on canvas
2. Click "Card" visualization
3. Drag `FactOrders > OrderId` to "Fields"
4. Click dropdown → Select "Count"
5. **Title**: Format → Title → "Total Orders"

### Visualization 3: Daily Revenue Trend

1. Click empty space on canvas
2. Click "Line chart" visualization
3. **X-axis**: Drag `FactDailySales > SaleDate`
4. **Y-axis**: Drag `FactDailySales > TotalRevenue`
5. **Title**: "Daily Revenue Trend"

### Visualization 4: Orders by Payment Method

1. Click empty space on canvas
2. Click "Pie chart" visualization
3. **Legend**: Drag `FactOrders > PaymentMethod`
4. **Values**: Drag `FactOrders > OrderId` (will auto-count)
5. **Title**: "Payment Methods"

### Visualization 5: Orders by Status

1. Click empty space on canvas
2. Click "Stacked bar chart" visualization
3. **Y-axis**: Drag `FactOrders > Status`
4. **X-axis**: Drag `FactOrders > OrderId` (count)
5. **Title**: "Orders by Status"

### Add Date Filter

1. Click "Slicer" visualization
2. Drag `FactOrders > OrderDate` to "Field"
3. Click slicer → Format → Slicer settings → Style: "Between"

---

## Step 5: Format and Save (1 minute)

### Quick Formatting

1. **Resize Visualizations**: Drag corners to arrange nicely
2. **Add Background**: View → Canvas background → Choose light gray
3. **Align Items**: Hold Shift → Select multiple → Format → Align → Align left/top

### Save Your Report

1. **File → Save**
2. **File name**: `Ecommerce-Analytics.pbix`
3. **Location**: Choose your preferred folder

---

## Your Dashboard is Ready! 🎉

You now have a working Power BI dashboard with:
- ✅ Total Revenue KPI
- ✅ Total Orders KPI
- ✅ Revenue trend line chart
- ✅ Payment method breakdown
- ✅ Order status distribution
- ✅ Date range filter

---

## What's Next?

### Option 1: Enhance Your Report

- Add more visualizations (maps, gauges, scatter charts)
- Create calculated measures with DAX
- Add drill-through pages for detailed analysis
- Configure tooltips for extra context

### Option 2: Publish to Power BI Service

**Requirements**: Power BI Pro license (60-day free trial available)

1. Click "Publish" (Home ribbon)
2. Sign in to Power BI Service
3. Select destination workspace
4. Share report with your team

### Option 3: Automate Data Refresh

1. Publish report to Power BI Service
2. Configure dataset credentials
3. Set up scheduled refresh (e.g., daily at 8 AM)
4. Reports always show latest data

---

## Troubleshooting

### ❌ "Cannot connect to Synapse"

**Check if SQL pool is running**:
```bash
az synapse sql pool show \
  --name ecommercedw \
  --workspace-name <your-workspace> \
  --resource-group ecommerce-cloud-rg \
  --query "status"
```

**Resume if paused**:
```bash
az synapse sql pool resume \
  --name ecommercedw \
  --workspace-name <your-workspace> \
  --resource-group ecommerce-cloud-rg
```

### ❌ "Tables are empty"

**Verify data exists**:
```bash
cd /home/user/AZURE/scripts
node verify-pipeline.js
```

**Load demo data**:
```bash
node seed-data-simple.js
```

**Trigger Data Factory pipeline** (wait 5-10 minutes):
```bash
az datafactory pipeline create-run \
  --resource-group ecommerce-cloud-rg \
  --factory-name ecommerce-cloud-adf \
  --name CosmosToSynapsePipeline
```

### ❌ "Authentication failed"

**Double-check credentials**:
- Username is case-sensitive: `synapseadmin`
- Password must match what you set in Terraform
- Check your `terraform.tfvars` file for the correct password

### ❌ Visualizations not showing data

**Refresh data**:
1. Home ribbon → Click "Refresh"
2. Wait for refresh to complete
3. Check if data appears

---

## Quick Reference

### Connection String
```
Server: <synapse-workspace>.sql.azuresynapse.net
Database: ecommercedw
Auth: SQL Authentication
```

### Essential Tables
- `dw.FactOrders` - Individual order records
- `dw.FactDailySales` - Daily aggregated sales
- `staging.Orders` - Raw staging data (optional)

### Key Measures
```dax
Total Revenue = SUM(FactOrders[TotalAmount])
Total Orders = COUNT(FactOrders[OrderId])
Avg Order Value = DIVIDE([Total Revenue], [Total Orders])
```

### Keyboard Shortcuts
- **Ctrl + S** - Save report
- **Ctrl + R** - Refresh data
- **Ctrl + C / Ctrl + V** - Copy/paste visualizations
- **Shift + Click** - Select multiple items

---

## Additional Resources

- **Full Setup Guide**: [POWERBI_DESKTOP_SETUP.md](./POWERBI_DESKTOP_SETUP.md)
- **Data Pipeline Demo**: [/data-pipeline/QUICK_DEMO.md](../data-pipeline/QUICK_DEMO.md)
- **Power BI Learn**: https://docs.microsoft.com/learn/powerbi/
- **DAX Basics**: https://dax.guide/

---

**Total Time**: 10 minutes
**Difficulty**: Easy
**Cost**: Free (Power BI Desktop)

**Last Updated**: 2024-12-05
