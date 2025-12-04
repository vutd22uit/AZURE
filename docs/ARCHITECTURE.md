# E-commerce Cloud-Native System Architecture

## System Overview

Cloud-native e-commerce platform deployed on Microsoft Azure, demonstrating:
- Microservices architecture
- Serverless computing
- Blue-Green deployment
- Real-time data pipeline
- Analytics and BI

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud Platform                       │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │────│  API Gateway │────│   Ingress    │      │
│  │  (React SPA) │    │   (Nginx)    │    │  Controller  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                        │                │
│         │                 AKS Cluster            │                │
│         └────────────────────┬──────────────────┘                │
│                              │                                    │
│         ┌────────────────────┴────────────────────┐             │
│         │                                           │             │
│  ┌──────▼──────┐                           ┌──────▼──────┐     │
│  │ Auth Service│                           │Order Service│     │
│  │  (Node.js)  │                           │  (Node.js)  │     │
│  └──────┬──────┘                           └──────┬──────┘     │
│         │                                           │             │
│  ┌──────▼──────┐                           ┌──────▼──────┐     │
│  │ PostgreSQL  │                           │  Cosmos DB  │     │
│  │  Database   │                           │  (NoSQL)    │     │
│  └─────────────┘                           └──────┬──────┘     │
│                                                     │             │
│                  ┌──────────────────────────────────┘            │
│                  │                                                │
│           ┌──────▼──────┐         ┌──────────────┐             │
│           │  Payment    │────────▶│    Email     │             │
│           │  Function   │         │  Function    │             │
│           │ (Serverless)│         │ (Serverless) │             │
│           └─────────────┘         └──────────────┘             │
│                                                                   │
│  ┌─────────────────────  Data Pipeline  ───────────────────┐   │
│  │                                                            │   │
│  │  Cosmos DB ──▶ Data Factory ──▶ Synapse ──▶ Power BI    │   │
│  │  (Source)      (ETL)            (DW)         (BI)         │   │
│  │                                                            │   │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────  Monitoring  ─────────────────────────┐ │
│  │  Application Insights  │  Azure Monitor  │  Log Analytics  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Frontend Layer
- **Technology**: React 18, Tailwind CSS
- **Hosting**: AKS with Nginx
- **Pages**: Home, Product Detail, Cart, Checkout
- **State Management**: Context API
- **Features**:
  - Responsive design
  - JWT authentication
  - Real-time cart updates
  - Client-side routing

### 2. API Gateway
- **Technology**: Nginx Ingress Controller
- **Functions**:
  - Route /api/auth → Auth Service
  - Route /api → Order Service
  - Route / → Frontend
  - SSL/TLS termination
  - Rate limiting

### 3. Microservices

#### Auth Service (Port 3001)
- **Technology**: Node.js, Express
- **Database**: Azure PostgreSQL
- **Features**:
  - User registration
  - JWT-based authentication
  - Token verification endpoint
  - Password hashing (bcrypt)
- **Scaling**: 3 replicas

#### Order Service (Port 3002)
- **Technology**: Node.js, Express
- **Database**: Azure Cosmos DB
- **Features**:
  - Product catalog management
  - Shopping cart operations
  - Order creation & tracking
  - Auth service integration
- **Scaling**: 3 replicas with auto-scaling

### 4. Serverless Functions

#### Payment Processor
- **Trigger**: HTTP POST from Order Service
- **Runtime**: Node.js 18
- **Functions**:
  - Payment simulation (90% success rate)
  - Order status update in Cosmos DB
  - Email notification trigger
- **Cold start**: <1s

#### Email Notification
- **Trigger**: HTTP POST from Payment Function
- **Runtime**: Node.js 18
- **Functions**:
  - HTML email generation
  - SendGrid integration
  - Order confirmation emails
- **Cold start**: <500ms

### 5. Data Storage

#### PostgreSQL (Auth Service)
- **Type**: Azure Database for PostgreSQL
- **SKU**: GP_Standard_D2s_v3
- **Storage**: 32GB
- **Tables**: users
- **Backup**: 7-day retention

#### Cosmos DB (Order Service)
- **Type**: GlobalDocumentDB (SQL API)
- **Mode**: Serverless
- **Containers**:
  - products (partition: /category)
  - orders (partition: /userId)
  - cart (partition: /userId)
- **Consistency**: Session

#### Redis Cache
- **Type**: Azure Cache for Redis
- **SKU**: Standard C1
- **Usage**: Session storage, caching

### 6. Container Orchestration (AKS)
- **Version**: Latest stable
- **Nodes**: 2 x Standard_D2s_v3
- **Network**: Azure CNI
- **Features**:
  - Auto-scaling (HPA)
  - Health checks
  - Rolling updates
  - Blue-Green deployment

### 7. CI/CD Pipeline
- **Tool**: Azure Pipelines
- **Stages**:
  1. Build (Docker images → ACR)
  2. Test (Unit + Integration)
  3. Deploy Green (New version)
  4. Health Check (Smoke tests)
  5. Swap Traffic (Blue → Green)
  6. Rollback (If failed)

### 8. Data Pipeline
- **ETL Tool**: Azure Data Factory
- **Schedule**: Hourly
- **Flow**:
  1. Extract from Cosmos DB (Change Feed)
  2. Transform (Clean, aggregate)
  3. Load to Synapse Analytics

#### Synapse Analytics
- **SKU**: DW100c
- **Schema**:
  - dw.FactOrders
  - dw.DimDate
  - dw.FactDailySales

### 9. Business Intelligence
- **Tool**: Power BI
- **Connection**: DirectQuery to Synapse
- **Reports**: 4 interactive dashboards
- **Security**: Row-Level Security (RLS)
- **Refresh**: Hourly

### 10. Monitoring & Logging
- **Application Insights**: Performance monitoring
- **Azure Monitor**: Infrastructure metrics
- **Log Analytics**: Centralized logging
- **Alerts**: Automated notifications

## Security

### Authentication & Authorization
- JWT tokens (24h expiration)
- HTTPS enforced
- RBAC on Azure resources
- Network policies in AKS

### Secrets Management
- Kubernetes Secrets for credentials
- Azure Key Vault integration
- No secrets in code/images

### Network Security
- Private endpoints
- Firewall rules on databases
- Ingress controller with SSL
- DDoS protection

## High Availability

### Service Level Objectives
- **Uptime**: 99.9%
- **API Response Time**: <200ms (p95)
- **Database RTO**: <5 minutes
- **Database RPO**: <1 hour

### Fault Tolerance
- Multi-replica deployments (3x)
- Health checks & auto-restart
- Blue-Green deployment (zero downtime)
- Database geo-replication ready

## Scalability

### Horizontal Scaling
- **Frontend**: 2-10 pods (auto-scale)
- **Services**: 3-10 pods (CPU-based HPA)
- **Functions**: Automatic scaling

### Vertical Scaling
- Node pool resizing
- Database tier upgrades

### Performance Targets
- **Read Operations**: 1000+ req/sec
- **Write Operations**: 500+ req/sec
- **Concurrent Users**: 10,000+

## Cost Optimization

### Strategies
- Serverless Cosmos DB (pay-per-use)
- Consumption plan for Functions
- Reserved instances for AKS nodes
- Auto-shutdown for dev/test environments

### Estimated Monthly Cost (Production)
- AKS: $150
- PostgreSQL: $30
- Cosmos DB: $50 (usage-based)
- Redis: $15
- Functions: $5
- Synapse: $100 (when active)
- **Total**: ~$350/month

## Deployment Workflow

```
Developer → Git Push → Azure Pipelines → Build Images → Push to ACR
                ↓
          Run Tests (Unit + Integration)
                ↓
          Deploy to Green Environment
                ↓
          Health Check & Smoke Tests
                ↓
          Switch Traffic (Blue → Green)
                ↓
          Monitor & Verify
                ↓
          [Success] → Keep Green, Remove Blue
          [Failure] → Rollback to Blue
```

## Blue-Green Deployment

### Process
1. **Initial State**: Blue is active (serving traffic)
2. **Deploy Green**: New version deployed to green environment
3. **Test Green**: Smoke tests, health checks
4. **Switch Traffic**: Service selector points to green
5. **Monitor**: Watch metrics for issues
6. **Cleanup**: Remove blue deployment if stable
7. **Rollback**: Revert to blue if issues detected

### Benefits
- Zero downtime deployments
- Instant rollback capability
- Risk mitigation
- Production testing

## Data Flow

### User Request Flow
```
User → Frontend → Ingress → Service → Pod → Database
                                    ↓
                              Auth Verification
```

### Order Processing Flow
```
User → Checkout → Order Service → Create Order in Cosmos DB
                                        ↓
                              Payment Function (Trigger)
                                        ↓
                              Update Order Status
                                        ↓
                              Email Function (Trigger)
                                        ↓
                              Send Confirmation Email
```

### Analytics Flow
```
Cosmos DB → Change Feed → Data Factory → Transform
                                              ↓
                                        Synapse DW
                                              ↓
                                        Power BI
```

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS |
| Backend | Node.js 18, Express |
| Databases | PostgreSQL, Cosmos DB |
| Cache | Redis |
| Container | Docker, Kubernetes (AKS) |
| Serverless | Azure Functions |
| ETL | Azure Data Factory |
| Data Warehouse | Azure Synapse Analytics |
| BI | Power BI |
| CI/CD | Azure Pipelines |
| Monitoring | Application Insights |
| Infrastructure | Terraform |
| Code Repository | Git |

## Future Enhancements

1. **Multi-region deployment** for global scalability
2. **Service mesh** (Istio) for advanced traffic management
3. **GraphQL API** for flexible data querying
4. **Real-time notifications** with SignalR
5. **Advanced analytics** with ML models
6. **Mobile apps** (React Native)
