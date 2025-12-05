# Power BI Desktop Integration Guide

This guide provides step-by-step instructions for using Power BI Desktop to create analytics dashboards for the E-commerce Cloud-Native System.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Connecting to Synapse](#connecting-to-synapse)
6. [Creating Reports](#creating-reports)
7. [Publishing to Power BI Service](#publishing-to-power-bi-service)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Power BI Desktop is a free Windows application that allows you to create interactive data visualizations and reports. This integration enables:

- **Real-time Analytics**: Create dashboards with business metrics from Synapse Analytics
- **Interactive Reports**: Filters, drill-downs, and rich visualizations
- **Data Modeling**: Build relationships between tables and create measures
- **Easy Publishing**: Share reports via Power BI Service

**Key Difference from Power BI Embedded:**
- No Azure capacity costs
- No web embedding or backend API needed
- Standalone application for report authoring
- Reports viewed in Power BI Desktop or Power BI Service

## Architecture

```
┌─────────────────────┐
│  Power BI Desktop   │
│   (Local Windows)   │
└──────────┬──────────┘
           │
           │ Direct Connection
           ↓
┌─────────────────────┐
│ Synapse Analytics   │
│   SQL Dedicated     │
│      Pool (DW)      │
└─────────────────────┘
           ↑
           │ ETL Pipeline
           │
┌─────────────────────┐
│    Cosmos DB        │
│ (Operational Data)  │
└─────────────────────┘
```

### Data Flow

1. **Operational Data**: Orders stored in Cosmos DB
2. **ETL Pipeline**: Azure Data Factory loads data into Synapse
3. **Data Warehouse**: Synapse Analytics with star schema (FactOrders, FactDailySales)
4. **Power BI Desktop**: Connects to Synapse and creates reports
5. **Power BI Service** (Optional): Publish reports for team access

---

## Prerequisites

### Required

- **Operating System**: Windows 10/11 (Power BI Desktop is Windows-only)
- **Azure Access**: Access to your Azure subscription
- **Synapse Analytics**: Deployed and running (from Terraform)
- **Data**: Data loaded in Synapse (see [/data-pipeline/QUICK_DEMO.md](../data-pipeline/QUICK_DEMO.md))

### Optional

- **Power BI Pro/Premium License**: For publishing to Power BI Service (sharing reports)
- **Power BI Service Account**: For cloud-based report access

---

## Installation

### Step 1: Download Power BI Desktop

1. **Visit Microsoft Download Page**:
   ```
   https://www.microsoft.com/en-us/download/details.aspx?id=58494
   ```

2. **Click "Download"** and install `PBIDesktopSetup_x64.exe`

3. **Install**: Follow the installation wizard (default settings)

4. **Launch**: Open Power BI Desktop from Start Menu

**Alternative: Microsoft Store**
```
Open Microsoft Store → Search "Power BI Desktop" → Install
```

### Step 2: Verify Installation

1. Open Power BI Desktop
2. You should see the welcome screen with options:
   - Get data
   - Recent sources
   - Open other reports

---

## Connecting to Synapse

### Step 1: Get Synapse Connection Details

Run this command to get your Synapse workspace name:

```bash
cd /home/user/AZURE/terraform
terraform output synapse_workspace_name
```

**Connection String Format**:
```
Server: <synapse-workspace-name>.sql.azuresynapse.net
Database: ecommercedw
Port: 1433
```

### Step 2: Connect from Power BI Desktop

1. **Open Power BI Desktop**

2. **Get Data**:
   - Click "Get data" on Home ribbon
   - Select "Azure" → "Azure Synapse Analytics SQL"
   - Click "Connect"

3. **Enter Server Details**:
   ```
   Server: <your-synapse-workspace>.sql.azuresynapse.net
   Database: ecommercedw
   ```

4. **Choose Data Connectivity Mode**:
   - **Import**: Faster performance, scheduled refresh (recommended)
   - **DirectQuery**: Real-time data, slower performance

5. **Authentication**:
   - Select "Database" (SQL Authentication)
   - Enter Synapse credentials:
     - **Username**: `synapseadmin` (or your admin username)
     - **Password**: `<your-synapse-password>`

6. **Select Tables**:
   - Check the following tables:
     - `dw.FactOrders`
     - `dw.FactDailySales`
     - `staging.Orders` (optional)
   - Click "Load"

### Step 3: Verify Connection

1. In the **Fields** pane (right side), you should see:
   - FactOrders (with fields: OrderId, UserId, TotalAmount, etc.)
   - FactDailySales (with fields: SaleDate, TotalOrders, TotalRevenue, etc.)

2. If tables appear, connection is successful!

---

## Creating Reports

### Report 1: Overview Dashboard

#### KPI Cards

1. **Total Revenue**:
   - Drag `FactOrders[TotalAmount]` to canvas
   - Select "Card" visualization
   - Change aggregation to "Sum"

2. **Total Orders**:
   - Drag `FactOrders[OrderId]` to canvas
   - Select "Card" visualization
   - Change aggregation to "Count"

3. **Average Order Value**:
   - Create new measure (Modeling → New Measure):
     ```dax
     Avg Order Value = DIVIDE(SUM(FactOrders[TotalAmount]), COUNT(FactOrders[OrderId]))
     ```
   - Add as Card visualization

#### Revenue Trend Chart

1. **Line Chart**:
   - Select "Line chart" from Visualizations pane
   - **X-axis**: `FactDailySales[SaleDate]`
   - **Y-axis**: `FactDailySales[TotalRevenue]`
   - **Title**: "Daily Revenue Trend"

#### Orders by Payment Method

1. **Pie Chart**:
   - Select "Pie chart" from Visualizations pane
   - **Legend**: `FactOrders[PaymentMethod]`
   - **Values**: `FactOrders[OrderId]` (Count)
   - **Title**: "Orders by Payment Method"

#### Top Products Table

Since products are stored in JSON format in the `Items` column, we need to parse them. For simplicity, create a table showing order details:

1. **Table Visualization**:
   - Select "Table" from Visualizations pane
   - Add columns:
     - `FactOrders[OrderId]`
     - `FactOrders[OrderDate]`
     - `FactOrders[TotalAmount]`
     - `FactOrders[Status]`
   - Sort by TotalAmount (descending)

### Report 2: Sales Analysis

#### Daily Sales Table

1. **Table Visualization**:
   - Add columns from FactDailySales:
     - `SaleDate`
     - `TotalOrders`
     - `TotalRevenue`
     - `AverageOrderValue`
   - Sort by SaleDate (descending)

#### Revenue by Status

1. **Stacked Bar Chart**:
   - **Y-axis**: `FactOrders[Status]`
   - **X-axis**: `FactOrders[TotalAmount]` (Sum)
   - **Title**: "Revenue by Order Status"

### Adding Filters

1. **Date Slicer**:
   - Select "Slicer" from Visualizations
   - Add `FactOrders[OrderDate]`
   - Change slicer style to "Between" (Format → Slicer settings)

2. **Status Filter**:
   - Add another Slicer
   - Add `FactOrders[Status]`

### Formatting Tips

- **Change Colors**: Format → Data colors → Choose your color scheme
- **Add Titles**: Format → Title → Customize text and font
- **Adjust Layout**: Resize and position visualizations for clean layout
- **Add Backgrounds**: Format → Canvas background → Choose color

---

## Publishing to Power BI Service

### Prerequisites

- Power BI Pro or Premium license
- Power BI Service account (sign up at https://app.powerbi.com)

### Step 1: Sign In to Power BI Service

1. In Power BI Desktop, click **Sign in** (top right)
2. Enter your Power BI account credentials

### Step 2: Publish Report

1. **File → Publish → Publish to Power BI**
2. **Select Destination**:
   - Choose "My workspace" or create a new workspace
   - Click "Select"
3. **Wait for Upload**: Publishing may take 1-2 minutes
4. **Open in Power BI Service**: Click the link when complete

### Step 3: Configure Data Refresh (Optional)

For scheduled data refresh:

1. Go to https://app.powerbi.com
2. Navigate to your workspace → Datasets
3. Click "..." on your dataset → Settings
4. **Data source credentials**: Enter Synapse credentials
5. **Scheduled refresh**: Configure refresh schedule (e.g., daily at 8 AM)

### Step 4: Share Reports

1. In Power BI Service, open your report
2. Click "Share" button
3. Enter email addresses of users
4. Click "Send"

---

## Sample DAX Measures

### Revenue Metrics

```dax
Total Revenue = SUM(FactOrders[TotalAmount])

Previous Day Revenue =
CALCULATE(
    [Total Revenue],
    DATEADD(FactDailySales[SaleDate], -1, DAY)
)

Revenue Growth % =
DIVIDE(
    [Total Revenue] - [Previous Day Revenue],
    [Previous Day Revenue],
    0
)
```

### Order Metrics

```dax
Total Orders = COUNT(FactOrders[OrderId])

Completed Orders =
CALCULATE(
    [Total Orders],
    FactOrders[Status] = "completed"
)

Completion Rate =
DIVIDE(
    [Completed Orders],
    [Total Orders],
    0
)
```

### Customer Metrics

```dax
Unique Customers = DISTINCTCOUNT(FactOrders[UserId])

Orders Per Customer =
DIVIDE(
    [Total Orders],
    [Unique Customers],
    0
)
```

---

## Troubleshooting

### Issue 1: Cannot Connect to Synapse

**Error**: "Cannot connect to server"

**Solutions**:

1. **Check Synapse SQL Pool Status**:
   ```bash
   az synapse sql pool show \
     --name ecommercedw \
     --workspace-name <synapse-workspace-name> \
     --resource-group ecommerce-cloud-rg \
     --query "status"
   ```
   - If paused, resume it:
     ```bash
     az synapse sql pool resume \
       --name ecommercedw \
       --workspace-name <synapse-workspace-name> \
       --resource-group ecommerce-cloud-rg
     ```

2. **Check Firewall Rules**:
   - Go to Azure Portal → Synapse workspace → Networking
   - Ensure your IP address is allowed
   - Or temporarily enable "Allow Azure services and resources to access this workspace"

3. **Verify Credentials**:
   - Username should be `synapseadmin` (or your configured username)
   - Check password in terraform.tfvars or environment variables

### Issue 2: Tables are Empty

**Error**: Tables load but show 0 rows

**Solutions**:

1. **Verify Data Pipeline Ran**:
   ```bash
   cd /home/user/AZURE/scripts
   node verify-pipeline.js
   ```

2. **Check Synapse Tables**:
   - Connect to Synapse using Azure Data Studio or SSMS
   - Run: `SELECT COUNT(*) FROM dw.FactOrders`
   - If 0, run the data pipeline again (see [QUICK_DEMO.md](../data-pipeline/QUICK_DEMO.md))

3. **Refresh Power BI Data**:
   - In Power BI Desktop: Home → Refresh
   - This reloads data from Synapse

### Issue 3: Slow Performance

**Solutions**:

1. **Use Import Mode** instead of DirectQuery:
   - File → Options → Data Load
   - Choose "Import" for better performance

2. **Reduce Data Volume**:
   - Filter data at source (Power Query Editor → Source → Add date filter)
   - Only load recent data (e.g., last 90 days)

3. **Optimize Synapse**:
   - Scale up SQL pool if needed
   - Add indexes on frequently queried columns

### Issue 4: Cannot Publish to Power BI Service

**Error**: "You need a Power BI Pro license"

**Solutions**:

1. **Sign Up for Pro Trial**:
   - Go to https://app.powerbi.com
   - Click "Try free" → Start Power BI Pro trial (60 days free)

2. **Alternative: Save Locally**:
   - File → Save As
   - Share .pbix file directly with users
   - They can open it in Power BI Desktop

### Issue 5: Data Not Refreshing

**Solutions**:

1. **Manual Refresh**:
   - In Power BI Desktop: Home → Refresh
   - In Power BI Service: Dataset → Refresh now

2. **Check Refresh Schedule**:
   - Power BI Service → Dataset → Settings → Scheduled refresh
   - Verify credentials are configured
   - Check refresh history for errors

---

## Best Practices

### Performance

1. **Use Import Mode**: Faster than DirectQuery for most scenarios
2. **Filter Early**: Apply filters in Power Query before loading data
3. **Create Aggregations**: Use aggregated tables (FactDailySales) instead of raw data
4. **Optimize DAX**: Use variables and avoid complex nested calculations

### Data Modeling

1. **Create Relationships**: Link tables using common keys
2. **Use Measures**: Create reusable DAX measures for calculations
3. **Hide Unnecessary Columns**: Reduce clutter in Fields pane
4. **Set Data Types**: Ensure correct data types for all columns

### Report Design

1. **Consistent Formatting**: Use same color scheme and fonts throughout
2. **Clear Titles**: Every visualization should have a descriptive title
3. **Use Tooltips**: Add extra context to charts via tooltips
4. **Test Filters**: Ensure slicers affect the correct visualizations

### Collaboration

1. **Use Workspaces**: Organize reports by department or project
2. **Set Permissions**: Control who can view/edit reports
3. **Document Changes**: Add descriptions to datasets and reports
4. **Schedule Refreshes**: Automate data updates for always-current reports

---

## Next Steps

1. **Explore Sample Reports**: Open provided .pbix files (if available)
2. **Advanced DAX**: Learn time intelligence and complex calculations
3. **Custom Visuals**: Import custom visualizations from AppSource
4. **Mobile Layout**: Configure reports for mobile devices
5. **Power BI Service**: Create dashboards, set up alerts, and share reports

---

## Additional Resources

- **Power BI Desktop Documentation**: https://docs.microsoft.com/power-bi/desktop-what-is-desktop
- **DAX Reference**: https://dax.guide/
- **Power BI Community**: https://community.powerbi.com/
- **Video Tutorials**: https://www.youtube.com/user/mspowerbi

---

**Last Updated**: 2024-12-05
