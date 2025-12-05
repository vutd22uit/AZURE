# 🏗️ Kiến Trúc Hệ Thống E-commerce Cloud-Native

Tài liệu này mô tả chi tiết kiến trúc, data flow và các thành phần của hệ thống E-commerce trên Azure.

---

## 📋 Mục Lục

1. [Tổng Quan Kiến Trúc](#-tổng-quan-kiến-trúc)
2. [Sơ Đồ Hệ Thống](#-sơ-đồ-hệ-thống)
3. [Data Flow](#-data-flow)
4. [Chi Tiết Components](#-chi-tiết-components)
5. [Networking & Security](#-networking--security)
6. [Data Pipeline](#-data-pipeline)
7. [Deployment Architecture](#-deployment-architecture)

---

## 🎯 Tổng Quan Kiến Trúc

### Kiến Trúc Pattern

- **Microservices Architecture**: Tách biệt services độc lập
- **Event-Driven**: Sử dụng Azure Functions cho async processing
- **Cloud-Native**: Thiết kế tối ưu cho Azure cloud
- **Container-Based**: Docker + Kubernetes (AKS)
- **Serverless Components**: Azure Functions cho specific tasks

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend:    React 18 + Tailwind CSS + React Router        │
│  Backend:     Node.js 18 + Express.js                       │
│  Container:   Docker + Kubernetes (AKS)                      │
│  Database:    PostgreSQL + Cosmos DB                         │
│  Cache:       Azure Redis Cache                              │
│  Serverless:  Azure Functions (Node.js)                      │
│  Analytics:   Synapse Analytics + Data Factory               │
│  BI:          Power BI Desktop                               │
│  IaC:         Terraform                                       │
│  CI/CD:       Azure Pipelines                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Sơ Đồ Hệ Thống

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INTERNET / USERS                                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AZURE LOAD BALANCER                                  │
│                    (Standard Load Balancer)                              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  AZURE KUBERNETES SERVICE (AKS)                          │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     INGRESS CONTROLLER                            │  │
│  │                      (Nginx Ingress)                              │  │
│  └────────────┬────────────────────────────┬────────────────────────┘  │
│               │                             │                            │
│               ▼                             ▼                            │
│  ┌─────────────────────┐      ┌────────────────────────────┐           │
│  │   FRONTEND POD      │      │    BACKEND SERVICES        │           │
│  │   (React SPA)       │      │                            │           │
│  │   Replicas: 3       │      │  ┌──────────────────────┐ │           │
│  │   Port: 80          │      │  │  Auth Service        │ │           │
│  └─────────────────────┘      │  │  Port: 3001          │ │           │
│                                │  │  Replicas: 3         │ │           │
│                                │  └──────────┬───────────┘ │           │
│                                │             │              │           │
│                                │  ┌──────────▼───────────┐ │           │
│                                │  │  Order Service       │ │           │
│                                │  │  Port: 3002          │ │           │
│                                │  │  Replicas: 3         │ │           │
│                                │  └──────────────────────┘ │           │
│                                └────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
                    │                              │
                    │                              │
        ┌───────────▼──────────┐      ┌───────────▼──────────┐
        │  PostgreSQL          │      │  Cosmos DB           │
        │  (Auth Data)         │      │  (Orders, Products)  │
        │  Flexible Server     │      │  Serverless          │
        └──────────────────────┘      └──────────────────────┘
                                                  │
                                                  │ Change Feed
                                                  ▼
                                      ┌────────────────────────┐
                                      │  Azure Functions       │
                                      │  - Payment Processor   │
                                      │  - Email Notification  │
                                      └────────────────────────┘
```

### Detailed Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              React Single Page Application (SPA)                 │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                   │   │
│  │  Pages:                        Components:                       │   │
│  │  ├─ Home                       ├─ Header                         │   │
│  │  ├─ ProductDetail              ├─ ProductCard                    │   │
│  │  ├─ Cart                       ├─ CartItem                       │   │
│  │  ├─ Checkout                   └─ LoadingSpinner                 │   │
│  │  ├─ Login                                                         │   │
│  │  └─ Register                   Context:                          │   │
│  │                                ├─ AuthContext (JWT)              │   │
│  │  Routing: React Router v6     └─ CartContext (State)            │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (HTTP/HTTPS)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────┐       ┌──────────────────────────┐        │
│  │   AUTH SERVICE           │       │   ORDER SERVICE          │        │
│  │   (Node.js/Express)      │       │   (Node.js/Express)      │        │
│  ├──────────────────────────┤       ├──────────────────────────┤        │
│  │                          │       │                          │        │
│  │  Routes:                 │       │  Routes:                 │        │
│  │  POST /api/auth/register │       │  GET    /api/products    │        │
│  │  POST /api/auth/login    │       │  POST   /api/products    │        │
│  │  POST /api/auth/verify   │       │  GET    /api/orders      │        │
│  │                          │       │  POST   /api/orders      │        │
│  │  Controllers:            │       │  GET    /api/cart        │        │
│  │  ├─ authController       │       │  POST   /api/cart        │        │
│  │  └─ JWT generation       │       │                          │        │
│  │                          │       │  Controllers:            │        │
│  │  Middleware:             │       │  ├─ productController    │        │
│  │  ├─ helmet (security)    │       │  ├─ orderController      │        │
│  │  ├─ cors                 │       │  └─ cartController       │        │
│  │  ├─ morgan (logging)     │       │                          │        │
│  │  └─ express-validator    │       │  Middleware:             │        │
│  │                          │       │  ├─ auth (JWT verify)    │        │
│  │                          │       │  ├─ helmet               │        │
│  │                          │◄──────┤  └─ cors                 │        │
│  │                          │ verify│                          │        │
│  └────────┬─────────────────┘ token └────────┬─────────────────┘        │
│           │                                   │                          │
└───────────┼───────────────────────────────────┼──────────────────────────┘
            │                                   │
            │                                   │
┌───────────▼───────────────────────────────────▼──────────────────────────┐
│                            DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐           ┌──────────────────────────┐        │
│  │  PostgreSQL          │           │  Cosmos DB (NoSQL)       │        │
│  │  Flexible Server     │           │  Serverless Mode         │        │
│  ├──────────────────────┤           ├──────────────────────────┤        │
│  │                      │           │                          │        │
│  │  Database: authdb    │           │  Database: ordersdb      │        │
│  │                      │           │                          │        │
│  │  Tables:             │           │  Containers:             │        │
│  │  └─ users            │           │  ├─ products             │        │
│  │     ├─ id (PK)       │           │  │  └─ partition: /category │    │
│  │     ├─ email         │           │  ├─ orders               │        │
│  │     ├─ password      │           │  │  └─ partition: /userId   │    │
│  │     ├─ name          │           │  └─ cart                 │        │
│  │     ├─ created_at    │           │     └─ partition: /userId   │    │
│  │     └─ updated_at    │           │                          │        │
│  │                      │           │  Consistency: Session    │        │
│  │  Indexes:            │           │  Throughput: Autoscale   │        │
│  │  └─ idx_users_email  │           │                          │        │
│  │                      │           │                          │        │
│  └──────────────────────┘           └──────────┬───────────────┘        │
│                                                 │                        │
└─────────────────────────────────────────────────┼────────────────────────┘
                                                  │
                                                  │ Change Feed
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVERLESS LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Azure Functions                              │    │
│  │                  (Consumption Plan)                             │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ┌──────────────────────────┐    ┌──────────────────────────┐ │    │
│  │  │  Payment Processor       │    │  Email Notification      │ │    │
│  │  │  (Node.js 18)            │    │  (Node.js 18)            │ │    │
│  │  ├──────────────────────────┤    ├──────────────────────────┤ │    │
│  │  │                          │    │                          │ │    │
│  │  │  Trigger: HTTP           │    │  Trigger: HTTP           │ │    │
│  │  │  Bindings: Cosmos DB     │    │  Bindings: SendGrid     │ │    │
│  │  │                          │    │                          │ │    │
│  │  │  Flow:                   │    │  Flow:                   │ │    │
│  │  │  1. Receive order        │───▶│  1. Receive order info  │ │    │
│  │  │  2. Process payment      │    │  2. Format email        │ │    │
│  │  │  3. Update order status  │    │  3. Send via SendGrid   │ │    │
│  │  │  4. Trigger email        │    │  4. Return success      │ │    │
│  │  │                          │    │                          │ │    │
│  │  └──────────────────────────┘    └──────────────────────────┘ │    │
│  │                                                                  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. User Registration Flow

```
┌─────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│ Browser │         │ Frontend │         │   Auth   │         │PostgreSQL│
│         │         │   (SPA)  │         │ Service  │         │          │
└────┬────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                   │                    │                     │
     │ 1. Fill form      │                    │                     │
     │ (email, password) │                    │                     │
     │──────────────────▶│                    │                     │
     │                   │                    │                     │
     │                   │ 2. POST /register  │                     │
     │                   │ {email, password,  │                     │
     │                   │  name}             │                     │
     │                   │───────────────────▶│                     │
     │                   │                    │                     │
     │                   │                    │ 3. Validate input   │
     │                   │                    │ (email format,      │
     │                   │                    │  password strength) │
     │                   │                    │                     │
     │                   │                    │ 4. Check existing   │
     │                   │                    │ SELECT FROM users   │
     │                   │                    │ WHERE email=?       │
     │                   │                    │────────────────────▶│
     │                   │                    │                     │
     │                   │                    │ 5. User not found   │
     │                   │                    │◀────────────────────│
     │                   │                    │                     │
     │                   │                    │ 6. Hash password    │
     │                   │                    │ bcrypt.hash(pwd)    │
     │                   │                    │                     │
     │                   │                    │ 7. INSERT user      │
     │                   │                    │ INSERT INTO users   │
     │                   │                    │────────────────────▶│
     │                   │                    │                     │
     │                   │                    │ 8. User created     │
     │                   │                    │ RETURNING id, email │
     │                   │                    │◀────────────────────│
     │                   │                    │                     │
     │                   │                    │ 9. Generate JWT     │
     │                   │                    │ jwt.sign({userId})  │
     │                   │                    │                     │
     │                   │ 10. Return token   │                     │
     │                   │ {user, token}      │                     │
     │                   │◀───────────────────│                     │
     │                   │                    │                     │
     │ 11. Store token   │                    │                     │
     │ localStorage      │                    │                     │
     │◀──────────────────│                    │                     │
     │                   │                    │                     │
     │ 12. Redirect to   │                    │                     │
     │     home page     │                    │                     │
     │                   │                    │                     │
```

### 2. Create Order Flow

```
┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐
│ Browser │  │ Frontend │  │ Order  │  │ Cosmos   │  │ Payment │  │ Email │
│         │  │   (SPA)  │  │Service │  │    DB    │  │ Function│  │  Func │
└────┬────┘  └────┬─────┘  └────┬───┘  └────┬─────┘  └────┬────┘  └───┬───┘
     │            │              │           │             │            │
     │ 1. Add to  │              │           │             │            │
     │    cart    │              │           │             │            │
     │───────────▶│              │           │             │            │
     │            │              │           │             │            │
     │ 2. Checkout│              │           │             │            │
     │───────────▶│              │           │             │            │
     │            │              │           │             │            │
     │            │ 3. POST      │           │             │            │
     │            │   /api/orders│           │             │            │
     │            │   + JWT token│           │             │            │
     │            │──────────────▶           │             │            │
     │            │              │           │             │            │
     │            │              │ 4. Verify │             │            │
     │            │              │    JWT    │             │            │
     │            │              │    with   │             │            │
     │            │              │    Auth   │             │            │
     │            │              │    Service│             │            │
     │            │              │           │             │            │
     │            │              │ 5. Create │             │            │
     │            │              │    order  │             │            │
     │            │              │    object │             │            │
     │            │              │           │             │            │
     │            │              │ 6. INSERT │             │            │
     │            │              │    order  │             │            │
     │            │              │───────────▶             │            │
     │            │              │           │             │            │
     │            │              │ 7. Order  │             │            │
     │            │              │    saved  │             │            │
     │            │              │◀───────────             │            │
     │            │              │           │             │            │
     │            │              │ 8. Trigger│             │            │
     │            │              │    payment│             │            │
     │            │              │───────────┼────────────▶│            │
     │            │              │           │             │            │
     │            │              │           │             │ 9. Process │
     │            │              │           │             │    payment │
     │            │              │           │             │            │
     │            │              │           │             │10. Update  │
     │            │              │           │             │   order    │
     │            │              │           │◀────────────│            │
     │            │              │           │             │            │
     │            │              │           │             │11. Trigger │
     │            │              │           │             │    email   │
     │            │              │           │             │───────────▶│
     │            │              │           │             │            │
     │            │              │           │             │            │12. Send
     │            │              │           │             │            │    email
     │            │              │           │             │            │
     │            │ 13. Return   │           │             │            │
     │            │     order ID │           │             │            │
     │            │◀──────────────           │             │            │
     │            │              │           │             │            │
     │ 14. Show   │              │           │             │            │
     │     success│              │           │             │            │
     │◀───────────│              │           │             │            │
     │            │              │           │             │            │
```

### 3. Data Analytics Pipeline Flow

```
┌──────────┐      ┌─────────┐      ┌──────────┐      ┌────────────┐
│ Cosmos   │      │  Data   │      │ Synapse  │      │  Power BI  │
│   DB     │      │ Factory │      │Analytics │      │  Desktop   │
└────┬─────┘      └────┬────┘      └────┬─────┘      └─────┬──────┘
     │                 │                 │                   │
     │ 1. Orders       │                 │                   │
     │    created in   │                 │                   │
     │    real-time    │                 │                   │
     │                 │                 │                   │
     │                 │ 2. Scheduled    │                   │
     │                 │    trigger      │                   │
     │                 │    (hourly)     │                   │
     │                 │                 │                   │
     │                 │ 3. Read from    │                   │
     │                 │    Cosmos DB    │                   │
     │◀────────────────│                 │                   │
     │                 │                 │                   │
     │ 4. Return data  │                 │                   │
     │────────────────▶│                 │                   │
     │                 │                 │                   │
     │                 │ 5. Transform    │                   │
     │                 │    data (ETL)   │                   │
     │                 │                 │                   │
     │                 │ 6. Load to      │                   │
     │                 │    Synapse      │                   │
     │                 │────────────────▶│                   │
     │                 │                 │                   │
     │                 │                 │ 7. Store in DW    │
     │                 │                 │    - staging.Orders│
     │                 │                 │    - dw.FactOrders│
     │                 │                 │    - dw.FactDailySales│
     │                 │                 │                   │
     │                 │                 │                   │
     │                 │                 │ 8. Query data     │
     │                 │                 │    (SQL)          │
     │                 │                 │◀──────────────────│
     │                 │                 │                   │
     │                 │                 │ 9. Return results │
     │                 │                 │───────────────────▶
     │                 │                 │                   │
     │                 │                 │                   │10. Create
     │                 │                 │                   │    reports
     │                 │                 │                   │    & dashboards
     │                 │                 │                   │
```

### 4. Authentication Flow (JWT)

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│ Client  │         │   Auth   │         │  Order   │
│         │         │ Service  │         │ Service  │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ 1. POST /login    │                     │
     │ {email, password} │                     │
     │──────────────────▶│                     │
     │                   │                     │
     │                   │ 2. Verify password  │
     │                   │                     │
     │                   │ 3. Generate JWT     │
     │                   │    Payload: {       │
     │                   │      userId: 123,   │
     │                   │      email: "..."   │
     │                   │    }                │
     │                   │    Secret: JWT_KEY  │
     │                   │    Expires: 24h     │
     │                   │                     │
     │ 4. Return token   │                     │
     │ {token: "eyJ..."}│                     │
     │◀──────────────────│                     │
     │                   │                     │
     │ 5. Store token    │                     │
     │    localStorage   │                     │
     │                   │                     │
     │ 6. Request with   │                     │
     │    Bearer token   │                     │
     │────────────────────────────────────────▶│
     │                   │                     │
     │                   │                     │ 7. Verify token
     │                   │                     │    with Auth
     │                   │                     │    Service
     │                   │ POST /verify        │
     │                   │◀────────────────────│
     │                   │                     │
     │                   │ 8. Decode JWT       │
     │                   │                     │
     │                   │ 9. Return user info │
     │                   │────────────────────▶│
     │                   │                     │
     │                   │                     │10. Process request
     │                   │                     │    with userId
     │                   │                     │
     │ 11. Response      │                     │
     │◀────────────────────────────────────────│
     │                   │                     │
```

---

## 🧩 Chi Tiết Components

### Frontend (React SPA)

```yaml
Component: Frontend Application
Technology: React 18 + Tailwind CSS
Container: nginx:alpine
Port: 80
Replicas: 3

Features:
  - Client-side routing (React Router v6)
  - State management (Context API)
  - JWT authentication
  - Responsive design
  - Progressive Web App (PWA) ready

Pages:
  - Home: Product listing with categories
  - ProductDetail: Single product view
  - Cart: Shopping cart management
  - Checkout: Order placement
  - Login: User authentication
  - Register: User registration

State Management:
  - AuthContext: User authentication state
  - CartContext: Shopping cart state

API Communication:
  - Axios for HTTP requests
  - Base URLs from environment variables
  - JWT token in Authorization header
```

### Auth Service

```yaml
Component: Authentication & Authorization Service
Technology: Node.js 18 + Express.js
Database: PostgreSQL Flexible Server
Port: 3001
Replicas: 3

Responsibilities:
  - User registration
  - User authentication (login)
  - JWT token generation
  - Token verification (for other services)

Endpoints:
  POST   /api/auth/register    # Register new user
  POST   /api/auth/login       # Login user
  POST   /api/auth/verify      # Verify JWT token
  GET    /health               # Health check

Database Schema:
  users:
    - id: SERIAL PRIMARY KEY
    - email: VARCHAR(255) UNIQUE
    - password: VARCHAR(255) (bcrypt hashed)
    - name: VARCHAR(255)
    - created_at: TIMESTAMP
    - updated_at: TIMESTAMP

Security:
  - Password hashing: bcrypt (10 rounds)
  - JWT signing: HS256 algorithm
  - Token expiration: 24 hours
  - CORS enabled
  - Helmet for HTTP headers
```

### Order Service

```yaml
Component: Order & Product Management Service
Technology: Node.js 18 + Express.js
Database: Cosmos DB (Serverless)
Port: 3002
Replicas: 3

Responsibilities:
  - Product CRUD operations
  - Order management
  - Shopping cart operations
  - Integration with Auth Service

Endpoints:
  # Products
  GET    /api/products         # List all products
  POST   /api/products         # Create product (admin)
  GET    /api/products/:id     # Get product details

  # Orders
  GET    /api/orders           # List user orders (authenticated)
  POST   /api/orders           # Create new order (authenticated)
  GET    /api/orders/:id       # Get order details

  # Cart
  GET    /api/cart             # Get user cart
  POST   /api/cart             # Add to cart
  DELETE /api/cart/:productId  # Remove from cart

  GET    /health               # Health check

Cosmos DB Containers:
  products:
    - partition key: /category
    - fields: id, name, description, price, imageUrl, stock

  orders:
    - partition key: /userId
    - fields: id, userId, items[], totalAmount, status, createdAt

  cart:
    - partition key: /userId
    - fields: userId, items[], updatedAt

Authentication:
  - Middleware verifies JWT with Auth Service
  - Extracts userId from token
  - Uses userId for data isolation
```

### Azure Functions

```yaml
# Payment Processor Function
Name: payment-processor
Runtime: Node.js 18
Trigger: HTTP POST
Plan: Consumption

Flow:
  1. Receive order data via HTTP POST
  2. Validate payment information
  3. Process payment (mock implementation)
  4. Update order status in Cosmos DB
  5. Trigger email notification
  6. Return success/failure response

Environment:
  - COSMOS_DB_ENDPOINT
  - COSMOS_DB_KEY
  - EMAIL_FUNCTION_URL

---

# Email Notification Function
Name: email-notification
Runtime: Node.js 18
Trigger: HTTP POST
Plan: Consumption

Flow:
  1. Receive order confirmation data
  2. Format email template
  3. Send email via SendGrid
  4. Log email sent status
  5. Return success response

Environment:
  - SENDGRID_API_KEY
  - FROM_EMAIL
```

---

## 🔐 Networking & Security

### Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AZURE VNET                              │
│                   (10.0.0.0/16)                              │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │           AKS SUBNET (10.0.1.0/24)                 │     │
│  │                                                     │     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │  Frontend    │  │   Backend    │               │     │
│  │  │  Pods        │  │   Pods       │               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  │                                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │        DATABASE SUBNET (10.0.2.0/24)               │     │
│  │                                                     │     │
│  │  ┌──────────────┐  ┌──────────────┐               │     │
│  │  │  PostgreSQL  │  │  Cosmos DB   │               │     │
│  │  └──────────────┘  └──────────────┘               │     │
│  │                                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Security Measures

```yaml
Application Level:
  - JWT authentication (24h expiration)
  - Password hashing (bcrypt, 10 rounds)
  - Input validation (express-validator)
  - CORS configuration
  - Helmet.js for HTTP headers
  - Rate limiting (future)

Network Level:
  - Azure Virtual Network
  - Network Security Groups (NSG)
  - Azure Firewall
  - Private endpoints for databases
  - TLS/SSL encryption

Database Level:
  - PostgreSQL: SSL required
  - Cosmos DB: Private endpoint
  - Firewall rules
  - Managed identities

Kubernetes Level:
  - Network policies
  - Pod security policies
  - Secrets management
  - RBAC (Role-Based Access Control)
  - Service mesh (future)

Infrastructure Level:
  - Terraform state encryption
  - Azure Key Vault for secrets
  - Managed identities
  - Azure AD integration
```

---

## 📊 Data Pipeline

### ETL Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE FLOW                            │
└─────────────────────────────────────────────────────────────────┘

STEP 1: DATA COLLECTION
┌─────────────────┐
│   Cosmos DB     │  Real-time operational data
│   (OLTP)        │  - Products
│                 │  - Orders
│   Change Feed   │  - Cart items
│   Enabled       │
└────────┬────────┘
         │
         │ Continuous streaming
         ▼
┌─────────────────┐
│  Azure Data     │  Scheduled pipeline (hourly)
│  Factory        │  - Extract from Cosmos DB
│                 │  - Transform data
│  Pipeline:      │  - Load to Synapse
│  - Extract      │
│  - Transform    │  Transformations:
│  - Load (ETL)   │  - Flatten JSON
│                 │  - Calculate totals
└────────┬────────┘  - Aggregate by date
         │
         ▼
┌─────────────────┐
│  Synapse        │  Data Warehouse (OLAP)
│  Analytics      │
│                 │  Schemas:
│  SQL Pool:      │  - staging: Raw data
│  DW100c         │  - dw: Star schema
│                 │
│  Tables:        │  Fact Tables:
│  staging.Orders │  - dw.FactOrders
│                 │  - dw.FactDailySales
│                 │
│                 │  Dimension Tables:
│                 │  - dw.DimDate
│                 │  - dw.DimProducts
└────────┬────────┘
         │
         │ Direct SQL connection
         ▼
┌─────────────────┐
│  Power BI       │  Business Intelligence
│  Desktop        │
│                 │  Reports:
│  Connection:    │  - Revenue dashboard
│  SQL Server     │  - Order analytics
│                 │  - Product performance
│  Mode:          │  - Customer insights
│  Import/        │
│  DirectQuery    │
└─────────────────┘
```

### Data Warehouse Schema

```sql
-- Star Schema in Synapse Analytics

-- Fact Table: Orders
CREATE TABLE dw.FactOrders (
    OrderId NVARCHAR(50) PRIMARY KEY,
    UserId INT,
    OrderDate DATETIME,
    TotalAmount DECIMAL(10,2),
    Status NVARCHAR(20),
    PaymentMethod NVARCHAR(50),
    Items NVARCHAR(MAX),  -- JSON array
    ShippingAddress NVARCHAR(MAX),  -- JSON object
    CreatedAt DATETIME
);

-- Fact Table: Daily Sales Aggregates
CREATE TABLE dw.FactDailySales (
    SaleDate DATE PRIMARY KEY,
    TotalOrders INT,
    TotalRevenue DECIMAL(10,2),
    AverageOrderValue DECIMAL(10,2),
    CompletedOrders INT,
    PendingOrders INT,
    CancelledOrders INT
);

-- Dimension Table: Date
CREATE TABLE dw.DimDate (
    DateKey INT PRIMARY KEY,
    FullDate DATE,
    Year INT,
    Quarter INT,
    Month INT,
    MonthName NVARCHAR(20),
    Week INT,
    DayOfWeek INT,
    DayName NVARCHAR(20),
    IsWeekend BIT,
    IsHoliday BIT
);

-- Staging Table
CREATE TABLE staging.Orders (
    id NVARCHAR(50),
    userId INT,
    items NVARCHAR(MAX),
    totalAmount DECIMAL(10,2),
    status NVARCHAR(20),
    shippingAddress NVARCHAR(MAX),
    paymentMethod NVARCHAR(50),
    createdAt DATETIME,
    LoadedAt DATETIME DEFAULT GETDATE()
);
```

---

## 🚀 Deployment Architecture

### CI/CD Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│                    AZURE DEVOPS PIPELINE                        │
└────────────────────────────────────────────────────────────────┘

TRIGGER: Push to main branch
│
├─▶ BUILD STAGE
│   ├─ Checkout code
│   ├─ Install dependencies
│   ├─ Run tests
│   ├─ Build Docker images
│   │   ├─ frontend:latest
│   │   ├─ auth-service:latest
│   │   └─ order-service:latest
│   ├─ Push to ACR
│   └─ Publish artifacts
│
├─▶ TEST STAGE
│   ├─ Unit tests
│   ├─ Integration tests
│   ├─ Security scanning
│   └─ Code quality checks
│
├─▶ DEPLOY GREEN (New version)
│   ├─ Update green deployment
│   ├─ Apply manifests:
│   │   ├─ green-deployment.yaml
│   │   └─ service-green.yaml
│   ├─ Wait for pods ready
│   └─ Health check
│
├─▶ SWAP TRAFFIC (Blue-Green)
│   ├─ Update service selector
│   ├─ Point to green pods
│   ├─ Monitor metrics
│   └─ Validation check
│
└─▶ CLEANUP/ROLLBACK
    ├─ If success: Delete blue pods
    └─ If failure: Rollback to blue
```

### Blue-Green Deployment

```
BEFORE DEPLOYMENT (Blue Active):
┌───────────────────────────────────┐
│         Load Balancer             │
│              │                     │
│              ▼                     │
│      ┌───────────────┐            │
│      │  BLUE (v1.0)  │◀─── Active │
│      │  Pods: 3      │            │
│      └───────────────┘            │
│                                    │
│      ┌───────────────┐            │
│      │ GREEN (empty) │     Idle   │
│      │  Pods: 0      │            │
│      └───────────────┘            │
└───────────────────────────────────┘

DURING DEPLOYMENT:
┌───────────────────────────────────┐
│         Load Balancer             │
│              │                     │
│              ▼                     │
│      ┌───────────────┐            │
│      │  BLUE (v1.0)  │◀─── Active │
│      │  Pods: 3      │            │
│      └───────────────┘            │
│                                    │
│      ┌───────────────┐            │
│      │ GREEN (v1.1)  │  Deploying │
│      │  Pods: 3      │            │
│      └───────────────┘            │
└───────────────────────────────────┘

AFTER SWAP:
┌───────────────────────────────────┐
│         Load Balancer             │
│              │                     │
│              ▼                     │
│      ┌───────────────┐            │
│      │  BLUE (v1.0)  │     Idle   │
│      │  Pods: 3      │            │
│      └───────────────┘            │
│                                    │
│      ┌───────────────┐            │
│      │ GREEN (v1.1)  │◀─── Active │
│      │  Pods: 3      │            │
│      └───────────────┘            │
└───────────────────────────────────┘
```

### Kubernetes Manifests

```yaml
# Blue Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: blue
  template:
    metadata:
      labels:
        app: order-service
        version: blue
    spec:
      containers:
      - name: order-service
        image: myacr.azurecr.io/order-service:v1.0
        ports:
        - containerPort: 3002

---
# Green Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
      version: green
  template:
    metadata:
      labels:
        app: order-service
        version: green
    spec:
      containers:
      - name: order-service
        image: myacr.azurecr.io/order-service:v1.1
        ports:
        - containerPort: 3002

---
# Service (switch between blue/green)
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
    version: green  # Switch to blue/green here
  ports:
  - protocol: TCP
    port: 3002
    targetPort: 3002
```

---

## 📈 Performance & Scaling

### Auto-Scaling Configuration

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

# Cluster Autoscaler
# Automatically adds/removes nodes based on pod demands
# Min nodes: 2
# Max nodes: 10
```

### Performance Benchmarks

```
Load Testing Results (Apache Bench):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endpoint: GET /api/products
Concurrent users: 100
Total requests: 10,000

Requests per second:    2,847 req/s
Time per request:       35.1 ms
Transfer rate:          1,234 KB/s
Success rate:           100%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endpoint: POST /api/orders
Concurrent users: 50
Total requests: 5,000

Requests per second:    1,234 req/s
Time per request:       40.5 ms
Success rate:           99.8%
Database write time:    12.3 ms avg
```

---

## 💰 Cost Estimation

```
┌─────────────────────────────────────────────────────────┐
│              MONTHLY COST BREAKDOWN                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Service                           Cost/Month            │
│  ─────────────────────────────────────────────          │
│  AKS (2 x D2s_v3 nodes)            $140                  │
│  PostgreSQL Flexible Server        $120                  │
│  Cosmos DB Serverless              $25-50                │
│  Synapse DW100c (paused 20h/day)   $360                  │
│  Azure Functions (Consumption)     $10                   │
│  Data Factory (hourly pipeline)    $10                   │
│  Redis Cache Standard C1           $15                   │
│  Container Registry (Standard)     $5                    │
│  Application Insights              $10                   │
│  Storage & Bandwidth               $20                   │
│  Load Balancer                     $25                   │
│  ─────────────────────────────────────────────          │
│  TOTAL (estimated)                 ~$740/month           │
│                                                           │
│  💰 SAVINGS:                                             │
│  Power BI Embedded REMOVED         -$730/month           │
│  (Now using free Power BI Desktop)                       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 References

- **Azure AKS**: https://docs.microsoft.com/azure/aks/
- **Cosmos DB**: https://docs.microsoft.com/azure/cosmos-db/
- **Synapse Analytics**: https://docs.microsoft.com/azure/synapse-analytics/
- **Azure Functions**: https://docs.microsoft.com/azure/azure-functions/
- **Power BI Desktop**: https://powerbi.microsoft.com/desktop/

---

**Last Updated**: 2024-12-05
**Version**: 2.0.0
**Author**: E-commerce Cloud Team
