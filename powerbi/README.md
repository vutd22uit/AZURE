# Power BI Dashboard - E-commerce Analytics

## Overview

Interactive Power BI dashboard với 4 báo cáo chính để phân tích dữ liệu e-commerce.

## 4 Reports Chính

### 1. **Tổng Quan (Overview)**
- **KPI Cards**:
  - Doanh thu hôm nay
  - Doanh thu tháng này
  - Doanh thu năm nay
  - Tổng số đơn hàng
- **Line Chart**: Xu hướng doanh thu theo thời gian
- **Bar Chart**: Top 5 ngày có doanh thu cao nhất

### 2. **Chi Tiết Đơn Hàng (Order Details)**
- **Table**: Danh sách đơn hàng với các cột:
  - Order ID
  - User ID
  - Order Date
  - Total Amount
  - Payment Method
  - Status
- **Filters**: Date range, Status, Payment Method
- **Search**: Tìm kiếm theo Order ID

### 3. **Sản Phẩm Bán Chạy (Top Products)**
- **Bar Chart**: Top 10 sản phẩm bán chạy nhất
- **Metrics**: Số lượng bán, Doanh thu
- **Pie Chart**: Phân bổ doanh thu theo sản phẩm
- **Filters**: Category, Date range

### 4. **Phân Tích Theo Danh Mục (Category Analysis)**
- **Pie Chart**: Doanh thu theo category
- **Donut Chart**: Số lượng đơn hàng theo category
- **Table**: Chi tiết từng category
- **Filters**: Date range

## Navigation

- Buttons chuyển đổi giữa các reports
- Breadcrumb navigation
- Back to Home button trên mỗi report

## Row-Level Security (RLS)

### Cấu hình RLS

```dax
// Role: User
[UserId] = USERNAME()
```

**Roles được tạo:**
- **Admin**: Xem tất cả dữ liệu
- **User**: Chỉ xem dữ liệu của mình (filter theo UserId)

### Testing RLS

1. Power BI Desktop: `Modeling` → `View as Role`
2. Chọn role và nhập username để test

## Data Source

**Connection Type**: DirectQuery hoặc Import

**Source**: Azure Synapse Analytics

**Connection String**:
```
Server: ecommerce-cloud-synapse.sql.azuresynapse.net
Database: ecommercedw
Authentication: Azure AD
```

### Tables/Views Used:
- `dw.vw_OrdersSummary`
- `dw.vw_DailySalesTrend`
- `dw.FactOrders`
- `dw.DimDate`

## DAX Measures

### Revenue Measures
```dax
Total Revenue = SUM(FactOrders[TotalAmount])

Revenue Today =
CALCULATE(
    [Total Revenue],
    FactOrders[OrderDate] = TODAY()
)

Revenue This Month =
CALCULATE(
    [Total Revenue],
    MONTH(FactOrders[OrderDate]) = MONTH(TODAY()),
    YEAR(FactOrders[OrderDate]) = YEAR(TODAY())
)

Revenue This Year =
CALCULATE(
    [Total Revenue],
    YEAR(FactOrders[OrderDate]) = YEAR(TODAY())
)
```

### Order Measures
```dax
Total Orders = COUNTROWS(FactOrders)

Average Order Value = DIVIDE([Total Revenue], [Total Orders], 0)

Orders Today =
CALCULATE(
    [Total Orders],
    FactOrders[OrderDate] = TODAY()
)
```

### Time Intelligence
```dax
Revenue Last Month =
CALCULATE(
    [Total Revenue],
    DATEADD(FactOrders[OrderDate], -1, MONTH)
)

Revenue Growth % =
DIVIDE(
    [Total Revenue] - [Revenue Last Month],
    [Revenue Last Month],
    0
) * 100
```

## Setup Instructions

### 1. Connect to Data Source

```text
1. Open Power BI Desktop
2. Get Data → Azure → Azure Synapse Analytics
3. Enter server: ecommerce-cloud-synapse.sql.azuresynapse.net
4. Database: ecommercedw
5. Authentication: Azure Active Directory
6. Select tables/views: dw.vw_OrdersSummary, dw.vw_DailySalesTrend
```

### 2. Create Measures

```text
1. Create new Measure Group "Revenue Metrics"
2. Add DAX measures (see above)
3. Format measures (Currency for revenue, Number for orders)
```

### 3. Build Reports

**Report 1 - Overview:**
```text
- Add 4 Card visuals for KPIs
- Add Line chart: X=Date, Y=Revenue
- Add Bar chart: X=Date, Y=Revenue (Top 5)
```

**Report 2 - Order Details:**
```text
- Add Table visual with all order columns
- Add Date slicer
- Add Status slicer
- Add Search box (Order ID)
```

**Report 3 - Top Products:**
```text
- Add Bar chart: Y=Product, X=Revenue (Top 10)
- Add Pie chart: Values=Revenue, Legend=Product
```

**Report 4 - Category Analysis:**
```text
- Add Pie chart: Values=Revenue, Legend=Category
- Add Donut chart: Values=Orders, Legend=Category
- Add Matrix: Rows=Category, Values=Revenue, Orders
```

### 4. Add Navigation

```text
1. Insert → Buttons → Blank
2. Set button text: "Overview", "Orders", "Products", "Categories"
3. Set Action: Page navigation → Select target page
4. Format buttons consistently across all pages
```

### 5. Configure RLS

```text
1. Modeling → Manage Roles → Create Role "User"
2. Table: FactOrders
3. Filter: [UserId] = USERNAME()
4. Save
5. Modeling → View as Role → User → Type username to test
```

### 6. Publish to Power BI Service

```text
1. File → Publish → Select workspace
2. In Power BI Service:
   - Configure scheduled refresh
   - Set up security roles
   - Share with users
```

## Scheduled Refresh

**Recommendation**: Refresh mỗi giờ

```text
Settings → Datasets → Schedule refresh
- Frequency: Hourly
- Time: Every hour
- Time zone: (UTC+07:00) Bangkok, Hanoi
```

## Performance Optimization

1. **Use DirectQuery** cho real-time data
2. **Aggregations**: Tạo aggregate tables trong Synapse
3. **Indexes**: Đảm bảo indexes trên Date, UserId
4. **Incremental Refresh**: Chỉ refresh dữ liệu mới

## Screenshots Required

For documentation, capture:
1. Overview dashboard
2. Order details with filters
3. Top products visualization
4. Category analysis
5. RLS configuration
6. Navigation buttons
7. Azure Portal - Power BI Service

## Troubleshooting

**Connection Issues:**
```text
- Verify Synapse firewall allows Power BI IPs
- Check Azure AD authentication
- Test connection string manually
```

**RLS Not Working:**
```text
- Verify role is applied to dataset
- Check USERNAME() function returns correct format
- Test with "View as Role"
```

**Slow Performance:**
```text
- Check Synapse query execution times
- Optimize DAX measures
- Consider aggregations
- Use DirectQuery instead of Import
```

## Files

- `dashboard.pbix` - Power BI Desktop file
- `measures.dax` - All DAX measures
- `screenshots/` - Dashboard screenshots
- `RLS-config.md` - Row-level security setup
