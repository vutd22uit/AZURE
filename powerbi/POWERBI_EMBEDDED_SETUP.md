# Power BI Embedded Integration Guide

This guide provides step-by-step instructions for setting up and configuring Power BI Embedded in the E-commerce Cloud-Native System.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Azure Setup](#azure-setup)
5. [Power BI Configuration](#power-bi-configuration)
6. [Application Configuration](#application-configuration)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Power BI Embedded allows you to embed interactive Power BI reports directly into your web application. This integration enables:

- **Real-time Analytics**: Live dashboard with business metrics
- **Row-Level Security (RLS)**: Users see only their own data
- **Interactive Reports**: Filters, drill-downs, and visualizations
- **Seamless Integration**: Embedded directly in the application UI

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       ├─► GET /analytics (React Page)
       │
       ├─► GET /api/powerbi/embed-token (Backend API)
       │   └─► Azure AD Authentication
       │       └─► Power BI REST API
       │           └─► Generate Embed Token
       │
       └─► Power BI Embedded Report (iframe)
           └─► Display Report with RLS
```

### Components

1. **Frontend** (`frontend/src/pages/Analytics.js`)
   - Analytics page with Power BI Embedded component
   - Handles authentication and token refresh

2. **Backend** (`order-service/src/controllers/powerbiController.js`)
   - Generates embed tokens using Azure AD
   - Implements Row-Level Security (RLS)
   - Manages Power BI API interactions

3. **Infrastructure**
   - Power BI Embedded capacity (Terraform)
   - Kubernetes secrets for credentials
   - Azure AD App Registration

---

## Prerequisites

### Azure Subscriptions & Licenses

- Azure subscription with Power BI Embedded capacity
- Power BI Pro or Premium license
- Azure AD tenant

### Required Tools

- Azure CLI (`az`)
- kubectl
- Node.js 18+
- Terraform 1.0+

---

## Azure Setup

### Step 1: Deploy Power BI Embedded Capacity

Using Terraform, deploy the Power BI Embedded capacity:

```bash
cd terraform

# Initialize Terraform
terraform init

# Set Power BI variables
export TF_VAR_powerbi_sku="A1"  # A1, A2, A3, A4, A5, A6
export TF_VAR_powerbi_admins='["admin@yourdomain.com"]'

# Apply Terraform configuration
terraform apply
```

**SKU Pricing Guide:**
- **A1**: $1/hour (~$730/month) - Development/Testing
- **A2**: $2/hour - Small production
- **A3**: $4/hour - Medium production
- **A4**: $8/hour - Large production

### Step 2: Create Azure AD App Registration

1. **Navigate to Azure Portal**
   ```
   https://portal.azure.com
   → Azure Active Directory
   → App Registrations
   → New Registration
   ```

2. **Register Application**
   - **Name**: `PowerBI-Embedded-ECommerce`
   - **Supported account types**: Single tenant
   - **Redirect URI**: Leave empty (service-to-service auth)
   - Click **Register**

3. **Copy Credentials**
   - **Application (client) ID**: Copy this value
   - **Directory (tenant) ID**: Copy this value

4. **Create Client Secret**
   - Go to **Certificates & secrets**
   - Click **New client secret**
   - Description: `PowerBI Embedded Secret`
   - Expiry: `24 months`
   - Click **Add**
   - **Copy the secret value immediately** (you won't see it again)

### Step 3: Configure API Permissions

1. **Add Power BI API Permissions**
   - Go to **API permissions**
   - Click **Add a permission**
   - Select **Power BI Service**

2. **Add Application Permissions**
   - Select **Application permissions**
   - Check the following:
     - ✅ `Report.Read.All`
     - ✅ `Dataset.Read.All`
     - ✅ `Workspace.Read.All`
     - ✅ `Content.Create` (optional, for creating reports)

3. **Grant Admin Consent**
   - Click **Grant admin consent for [Your Tenant]**
   - Confirm by clicking **Yes**

---

## Power BI Configuration

### Step 1: Create Power BI Workspace

1. **Navigate to Power BI Service**
   ```
   https://app.powerbi.com
   ```

2. **Create Workspace**
   - Click **Workspaces** > **Create a workspace**
   - Name: `E-commerce Analytics`
   - Advanced settings:
     - **Premium capacity**: Select your Power BI Embedded capacity
   - Click **Save**

3. **Copy Workspace ID**
   - Open the workspace
   - Copy the ID from the URL:
     ```
     https://app.powerbi.com/groups/{WORKSPACE_ID}/list
     ```

### Step 2: Assign Service Principal to Workspace

1. **Enable Service Principal in Power BI Admin**
   - Go to **Power BI Admin Portal** > **Tenant settings**
   - Find **Developer settings** > **Allow service principals to use Power BI APIs**
   - Enable and add your Azure AD App to the security group
   - Click **Apply**

2. **Add Service Principal to Workspace**
   - Open your workspace
   - Click **Access** (top right)
   - Click **Add people or groups**
   - Enter your App Registration name: `PowerBI-Embedded-ECommerce`
   - Select role: **Admin** or **Member**
   - Click **Add**

### Step 3: Create and Publish Reports

#### Option A: Use Existing Reports from Documentation

Refer to the existing Power BI reports documented in `/powerbi/README.md`:
1. Overview Dashboard
2. Order Details Report
3. Top Products Report
4. Category Analysis

#### Option B: Create New Report

1. **Connect to Synapse Analytics**
   - Open Power BI Desktop
   - Get data > Azure > Azure Synapse Analytics
   - Server: `{synapse-workspace}.sql.azuresynapse.net`
   - Database: `ecommercedw`

2. **Import Views**
   ```sql
   dw.vw_OrdersSummary
   dw.vw_DailySalesTrend
   dw.FactOrders
   dw.DimProducts
   ```

3. **Create Visualizations**
   - KPI cards: Total Revenue, Total Orders
   - Line chart: Revenue trend
   - Bar chart: Top products
   - Table: Order details

4. **Configure Row-Level Security (RLS)**
   - Go to **Modeling** > **Manage Roles**
   - Create role: `User`
   - Add filter on `FactOrders` table:
     ```
     [UserId] = USERNAME()
     ```
   - Create role: `Admin` (no filters)

5. **Publish Report**
   - Click **Publish**
   - Select workspace: `E-commerce Analytics`
   - Click **Select**

6. **Copy Report and Dataset IDs**
   - Go to workspace in Power BI Service
   - Click on report > URL contains report ID:
     ```
     https://app.powerbi.com/groups/{WORKSPACE_ID}/reports/{REPORT_ID}
     ```
   - Go to **Datasets** > Click on dataset > Copy dataset ID from URL

---

## Application Configuration

### Step 1: Create Kubernetes Secret

1. **Copy the template**
   ```bash
   cd /home/user/AZURE/kubernetes/secrets
   cp powerbi-secrets.yaml.template powerbi-secrets.yaml
   ```

2. **Edit the secret file**
   ```bash
   vim powerbi-secrets.yaml
   ```

   Replace the placeholders:
   ```yaml
   stringData:
     client-id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
     client-secret: "your-client-secret-value"
     tenant-id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
     workspace-id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
     report-id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
     dataset-id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```

3. **Apply the secret**
   ```bash
   kubectl create -f powerbi-secrets.yaml
   ```

4. **Verify the secret**
   ```bash
   kubectl get secret powerbi-secrets
   kubectl describe secret powerbi-secrets
   ```

### Step 2: Install Dependencies

#### Backend (Order Service)
```bash
cd /home/user/AZURE/order-service
npm install
```

#### Frontend
```bash
cd /home/user/AZURE/frontend
npm install
```

### Step 3: Configure Environment Variables (Local Development)

Create `.env` file in `order-service/`:
```env
# Existing variables...

# Power BI Embedded
POWERBI_CLIENT_ID=your-client-id
POWERBI_CLIENT_SECRET=your-client-secret
POWERBI_TENANT_ID=your-tenant-id
POWERBI_WORKSPACE_ID=your-workspace-id
POWERBI_REPORT_ID=your-report-id
POWERBI_DATASET_ID=your-dataset-id
```

Create `.env` file in `frontend/`:
```env
REACT_APP_AUTH_SERVICE_URL=http://localhost:3001
REACT_APP_ORDER_SERVICE_URL=http://localhost:3002
```

---

## Deployment

### Local Development

1. **Start Backend Services**
   ```bash
   # Terminal 1: Auth Service
   cd /home/user/AZURE/auth-service
   npm start

   # Terminal 2: Order Service
   cd /home/user/AZURE/order-service
   npm start
   ```

2. **Start Frontend**
   ```bash
   # Terminal 3: Frontend
   cd /home/user/AZURE/frontend
   npm start
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Analytics page: http://localhost:3000/analytics

### Kubernetes Deployment

1. **Build and Push Docker Images**
   ```bash
   # Login to ACR
   az acr login --name <your-acr-name>

   # Build and push order-service
   cd /home/user/AZURE/order-service
   docker build -t <acr-name>.azurecr.io/order-service:latest .
   docker push <acr-name>.azurecr.io/order-service:latest

   # Build and push frontend
   cd /home/user/AZURE/frontend
   docker build -t <acr-name>.azurecr.io/frontend:latest .
   docker push <acr-name>.azurecr.io/frontend:latest
   ```

2. **Deploy to Kubernetes**
   ```bash
   cd /home/user/AZURE/kubernetes

   # Apply deployments
   kubectl apply -f deployments/order-service.yaml
   kubectl apply -f deployments/frontend.yaml

   # Verify deployments
   kubectl get pods
   kubectl logs -l app=order-service
   ```

3. **Verify Power BI Configuration**
   ```bash
   # Check if Power BI secrets are mounted
   kubectl exec -it <order-service-pod> -- env | grep POWERBI

   # Test Power BI health endpoint
   kubectl exec -it <order-service-pod> -- curl http://localhost:3002/api/powerbi/health
   ```

---

## Testing

### API Testing

1. **Health Check**
   ```bash
   curl http://localhost:3002/api/powerbi/health
   ```

   Expected response:
   ```json
   {
     "success": true,
     "status": "healthy",
     "message": "Power BI service is connected and operational",
     "timestamp": "2024-01-15T10:30:00.000Z"
   }
   ```

2. **Get Configuration** (requires authentication)
   ```bash
   TOKEN="your-jwt-token"
   curl -H "Authorization: Bearer $TOKEN" \
        http://localhost:3002/api/powerbi/config
   ```

3. **Get Embed Token** (requires authentication)
   ```bash
   TOKEN="your-jwt-token"
   curl -H "Authorization: Bearer $TOKEN" \
        http://localhost:3002/api/powerbi/embed-token
   ```

   Expected response:
   ```json
   {
     "success": true,
     "embedToken": "H4sIAAAAAAAEAB...",
     "embedUrl": "https://app.powerbi.com/reportEmbed?...",
     "reportId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     "expiresAt": "2024-01-15T11:30:00Z"
   }
   ```

### Frontend Testing

1. **Login to Application**
   - Navigate to http://localhost:3000
   - Click **Login**
   - Enter credentials

2. **Access Analytics Page**
   - Click **Analytics** in the header
   - Verify that the Power BI report loads
   - Test interactive features (filters, drill-downs)

3. **Verify Row-Level Security**
   - Login as different users
   - Confirm each user only sees their own data

---

## Troubleshooting

### Common Issues

#### 1. "Unauthorized: Invalid Azure AD credentials"

**Cause**: Invalid client ID, secret, or tenant ID

**Solution**:
```bash
# Verify credentials
kubectl get secret powerbi-secrets -o yaml

# Check if service principal has correct permissions
az ad app permission list --id <client-id>

# Regenerate client secret if needed
az ad app credential reset --id <client-id>
```

#### 2. "Power BI report or workspace not found"

**Cause**: Incorrect workspace or report ID

**Solution**:
- Verify IDs in Power BI Service URL
- Ensure service principal has access to workspace
- Check workspace is on Premium/Embedded capacity

#### 3. "Failed to load Power BI report" in frontend

**Cause**: CORS issues or expired embed token

**Solution**:
```javascript
// Check browser console for errors
// Verify CORS is enabled in backend (already configured in helmet)

// Check token expiration
// Embed tokens expire after 1 hour by default
```

#### 4. "Cannot read properties of undefined (powerbi-client)"

**Cause**: Missing npm dependencies

**Solution**:
```bash
cd /home/user/AZURE/frontend
npm install powerbi-client-react powerbi-client
npm start
```

#### 5. RLS not working - users see all data

**Cause**: RLS roles not configured or username not matching

**Solution**:
1. Check RLS configuration in Power BI Desktop
2. Verify username format matches:
   ```javascript
   // Backend sends: userId.toString()
   // Power BI RLS: [UserId] = USERNAME()
   ```
3. Test RLS in Power BI Desktop: **Modeling** > **View as roles**

### Debugging

#### Enable Debug Logging

**Backend** (`order-service/src/controllers/powerbiController.js`):
```javascript
console.log('Generating embed token for user', userId);
console.log('Access token acquired:', accessToken.substring(0, 20) + '...');
```

**Frontend** (`frontend/src/components/PowerBIEmbed.js`):
```javascript
console.log('Fetching embed token...');
console.log('Embed config:', embedConfig);
```

#### Check Power BI Activity Logs

1. Go to Power BI Admin Portal
2. Navigate to **Audit logs**
3. Filter by:
   - Activity: `GenerateEmbedToken`
   - User: Your service principal
   - Date range: Last 24 hours

---

## Performance Optimization

### 1. Embed Token Caching

Tokens are valid for 1 hour. Implement caching:

```javascript
// In frontend
const tokenCache = {
  token: null,
  expiresAt: null,
};

if (tokenCache.token && new Date() < new Date(tokenCache.expiresAt)) {
  // Use cached token
} else {
  // Fetch new token
}
```

### 2. Power BI Embedded Capacity Auto-Scaling

- **A1-A3**: Manual scaling only
- **A4-A6**: Auto-pause after inactivity
- Monitor capacity metrics in Azure Portal

### 3. Report Optimization

- Reduce visual count per page (max 20-30)
- Use aggregations in dataset
- Enable query caching
- Optimize DAX measures

---

## Security Best Practices

1. **Never expose secrets in frontend**
   - Always fetch embed tokens from backend
   - Don't store service principal credentials in browser

2. **Implement proper authentication**
   - All Power BI endpoints require JWT authentication
   - Validate user identity before generating tokens

3. **Use Row-Level Security**
   - Always implement RLS in Power BI reports
   - Pass user identity in embed token

4. **Rotate credentials regularly**
   - Azure AD client secrets expire
   - Set calendar reminders before expiry

5. **Monitor access logs**
   - Enable Azure AD audit logs
   - Track Power BI API usage

---

## Cost Management

### Power BI Embedded Capacity Costs

| SKU | Virtual Cores | Memory | Hourly Cost | Monthly Cost (24/7) |
|-----|---------------|--------|-------------|---------------------|
| A1  | 1 vCore       | 3 GB   | $1.00       | ~$730               |
| A2  | 2 vCores      | 5 GB   | $2.00       | ~$1,460             |
| A3  | 4 vCores      | 10 GB  | $4.00       | ~$2,920             |
| A4  | 8 vCores      | 25 GB  | $8.00       | ~$5,840             |

### Cost Optimization Tips

1. **Pause capacity when not in use**
   ```bash
   az powerbi embedded-capacity update \
     --resource-group ecommerce-cloud-rg \
     --name ecommerce-cloud-powerbi \
     --state Paused
   ```

2. **Use auto-pause for dev/test**
   - Configure auto-pause after 30 minutes of inactivity

3. **Start with A1 SKU**
   - Upgrade only when needed
   - Monitor query performance

---

## API Reference

### GET /api/powerbi/embed-token

Generate embed token for Power BI report.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "embedToken": "H4sIAAAAAAAEAB...",
  "embedUrl": "https://app.powerbi.com/reportEmbed?reportId=...",
  "reportId": "uuid",
  "expiresAt": "2024-01-15T11:30:00Z",
  "tokenId": "uuid"
}
```

### GET /api/powerbi/reports

List all available reports in workspace.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "reports": [
    {
      "id": "uuid",
      "name": "Overview Dashboard",
      "webUrl": "https://app.powerbi.com/...",
      "embedUrl": "https://app.powerbi.com/reportEmbed?...",
      "datasetId": "uuid"
    }
  ]
}
```

### GET /api/powerbi/config

Get Power BI configuration status.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "configured": true,
  "workspaceId": "uuid",
  "reportId": "uuid",
  "datasetId": "uuid"
}
```

### GET /api/powerbi/health

Health check for Power BI service.

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "message": "Power BI service is connected and operational",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Resources

### Documentation

- [Power BI Embedded Documentation](https://docs.microsoft.com/power-bi/developer/embedded/)
- [Power BI REST API Reference](https://docs.microsoft.com/rest/api/power-bi/)
- [Azure AD App Registration](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)

### Code Repositories

- Backend Controller: `/order-service/src/controllers/powerbiController.js`
- Backend Routes: `/order-service/src/routes/powerbi.js`
- Frontend Component: `/frontend/src/components/PowerBIEmbed.js`
- Frontend Page: `/frontend/src/pages/Analytics.js`

### Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Power BI Embedded [FAQ](https://docs.microsoft.com/power-bi/developer/embedded/embedded-faq)
3. Contact your Azure support team

---

## Next Steps

1. ✅ Complete Azure setup
2. ✅ Configure Power BI workspace
3. ✅ Deploy application with Power BI integration
4. ⬜ Create custom reports for your business needs
5. ⬜ Implement advanced features:
   - Multi-report dashboards
   - Export to PDF/PowerPoint
   - Scheduled refresh
   - Real-time streaming datasets

---

**Last Updated**: 2024-12-04
**Version**: 1.0.0
**Author**: E-commerce Cloud Team
