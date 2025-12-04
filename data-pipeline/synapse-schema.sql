-- Azure Synapse Analytics Schema for E-commerce Data Warehouse

-- Create schemas
CREATE SCHEMA staging;
GO
CREATE SCHEMA dw;
GO

-- Staging table for raw orders from Cosmos DB
CREATE TABLE staging.Orders (
    OrderId NVARCHAR(100),
    UserId NVARCHAR(50),
    TotalAmount DECIMAL(18,2),
    OrderStatus NVARCHAR(50),
    PaymentMethod NVARCHAR(50),
    CreatedAt DATETIME2,
    OrderData NVARCHAR(MAX)
)
WITH (
    DISTRIBUTION = ROUND_ROBIN,
    CLUSTERED COLUMNSTORE INDEX
);
GO

-- Fact table: Orders
CREATE TABLE dw.FactOrders (
    OrderKey BIGINT IDENTITY(1,1) NOT NULL,
    OrderId NVARCHAR(100) NOT NULL,
    UserId NVARCHAR(50) NOT NULL,
    OrderDate DATE NOT NULL,
    OrderTime TIME NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    OrderStatus NVARCHAR(50),
    PaymentMethod NVARCHAR(50),
    CreatedAt DATETIME2 NOT NULL
)
WITH (
    DISTRIBUTION = HASH(OrderId),
    CLUSTERED COLUMNSTORE INDEX
);
GO

-- Dimension table: Date
CREATE TABLE dw.DimDate (
    DateKey INT NOT NULL,
    Date DATE NOT NULL,
    Year INT NOT NULL,
    Quarter INT NOT NULL,
    Month INT NOT NULL,
    MonthName NVARCHAR(20) NOT NULL,
    Week INT NOT NULL,
    DayOfWeek INT NOT NULL,
    DayName NVARCHAR(20) NOT NULL
)
WITH (
    DISTRIBUTION = REPLICATE,
    CLUSTERED COLUMNSTORE INDEX
);
GO

-- Dimension table: Products (aggregated from orders)
CREATE TABLE dw.DimProducts (
    ProductKey BIGINT IDENTITY(1,1) NOT NULL,
    ProductId NVARCHAR(100) NOT NULL,
    ProductName NVARCHAR(500),
    Category NVARCHAR(100),
    AveragePrice DECIMAL(18,2)
)
WITH (
    DISTRIBUTION = REPLICATE,
    CLUSTERED COLUMNSTORE INDEX
);
GO

-- Aggregated fact table: Daily sales
CREATE TABLE dw.FactDailySales (
    SalesDateKey INT NOT NULL,
    SalesDate DATE NOT NULL,
    TotalOrders INT NOT NULL,
    TotalRevenue DECIMAL(18,2) NOT NULL,
    AverageOrderValue DECIMAL(18,2) NOT NULL
)
WITH (
    DISTRIBUTION = REPLICATE,
    CLUSTERED COLUMNSTORE INDEX
);
GO

-- Stored procedure for ETL transformation
CREATE PROCEDURE dbo.sp_TransformOrders
AS
BEGIN
    SET NOCOUNT ON;

    -- Insert into fact table
    INSERT INTO dw.FactOrders (
        OrderId, UserId, OrderDate, OrderTime, TotalAmount,
        OrderStatus, PaymentMethod, CreatedAt
    )
    SELECT
        OrderId,
        UserId,
        CAST(CreatedAt AS DATE) AS OrderDate,
        CAST(CreatedAt AS TIME) AS OrderTime,
        TotalAmount,
        OrderStatus,
        PaymentMethod,
        CreatedAt
    FROM staging.Orders
    WHERE OrderId NOT IN (SELECT OrderId FROM dw.FactOrders);

    -- Update daily sales aggregation
    TRUNCATE TABLE dw.FactDailySales;

    INSERT INTO dw.FactDailySales (SalesDateKey, SalesDate, TotalOrders, TotalRevenue, AverageOrderValue)
    SELECT
        CAST(FORMAT(OrderDate, 'yyyyMMdd') AS INT) AS SalesDateKey,
        OrderDate AS SalesDate,
        COUNT(*) AS TotalOrders,
        SUM(TotalAmount) AS TotalRevenue,
        AVG(TotalAmount) AS AverageOrderValue
    FROM dw.FactOrders
    GROUP BY OrderDate;

END;
GO

-- Create views for Power BI
CREATE VIEW dw.vw_OrdersSummary AS
SELECT
    f.OrderId,
    f.UserId,
    f.OrderDate,
    f.TotalAmount,
    f.OrderStatus,
    f.PaymentMethod,
    d.Year,
    d.Quarter,
    d.Month,
    d.MonthName
FROM dw.FactOrders f
INNER JOIN dw.DimDate d ON CAST(FORMAT(f.OrderDate, 'yyyyMMdd') AS INT) = d.DateKey;
GO

CREATE VIEW dw.vw_DailySalesTrend AS
SELECT
    SalesDate,
    TotalOrders,
    TotalRevenue,
    AverageOrderValue
FROM dw.FactDailySales;
GO

-- Populate date dimension (for 3 years)
DECLARE @StartDate DATE = '2023-01-01';
DECLARE @EndDate DATE = '2025-12-31';

WHILE @StartDate <= @EndDate
BEGIN
    INSERT INTO dw.DimDate (DateKey, Date, Year, Quarter, Month, MonthName, Week, DayOfWeek, DayName)
    VALUES (
        CAST(FORMAT(@StartDate, 'yyyyMMdd') AS INT),
        @StartDate,
        YEAR(@StartDate),
        DATEPART(QUARTER, @StartDate),
        MONTH(@StartDate),
        DATENAME(MONTH, @StartDate),
        DATEPART(WEEK, @StartDate),
        DATEPART(WEEKDAY, @StartDate),
        DATENAME(WEEKDAY, @StartDate)
    );

    SET @StartDate = DATEADD(DAY, 1, @StartDate);
END;
GO
