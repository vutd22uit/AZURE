# Power BI Embedded - Quick Start Guide

This is a condensed guide to get Power BI Embedded running quickly. For detailed instructions, see [POWERBI_EMBEDDED_SETUP.md](./POWERBI_EMBEDDED_SETUP.md).

## Prerequisites Checklist

- [ ] Azure subscription with Power BI Embedded
- [ ] Power BI Pro or Premium license
- [ ] Azure CLI installed and logged in
- [ ] kubectl configured for your AKS cluster

## 5-Minute Setup

### 1. Create Azure AD App (2 minutes)

```bash
# Create app registration
az ad app create --display-name "PowerBI-Embedded-ECommerce"

# Copy the appId (client-id) from output
CLIENT_ID="<paste-app-id-here>"

# Create client secret
az ad app credential reset --id $CLIENT_ID

# Copy the password (client-secret) from output
CLIENT_SECRET="<paste-password-here>"

# Get tenant ID
TENANT_ID=$(az account show --query tenantId -o tsv)
```

### 2. Configure Power BI API Permissions (1 minute)

```bash
# Add Power BI Service permissions
az ad app permission add \
  --id $CLIENT_ID \
  --api 00000009-0000-0000-c000-000000000000 \
  --api-permissions \
    4ae1bf56-f562-4747-b7bc-2fa0874ed46f=Role \
    322b68b2-0804-416e-86a5-d772c567b6e3=Role \
    7f33e027-4039-419b-938e-2f8ca153e68e=Role

# Grant admin consent
az ad app permission admin-consent --id $CLIENT_ID
```

### 3. Create Power BI Workspace (1 minute)

1. Go to https://app.powerbi.com
2. Click **Workspaces** → **Create a workspace**
3. Name: `E-commerce Analytics`
4. Premium capacity: Select your Power BI Embedded capacity
5. Click **Save**
6. Copy workspace ID from URL: `https://app.powerbi.com/groups/{WORKSPACE_ID}/`

### 4. Add Service Principal to Workspace (30 seconds)

1. In workspace, click **Access**
2. Search for `PowerBI-Embedded-ECommerce`
3. Select role: **Member**
4. Click **Add**

### 5. Publish Power BI Report (1 minute)

Option A: Use sample report from `/powerbi/README.md`

Option B: Quick test report:
1. Open Power BI Desktop
2. Get data → Azure → Azure Synapse Analytics
3. Create a simple table visual
4. Publish to `E-commerce Analytics` workspace
5. Copy report ID from URL

### 6. Configure Kubernetes Secret (30 seconds)

```bash
cd /home/user/AZURE/kubernetes/secrets

# Create secret from template
cat > powerbi-secrets.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: powerbi-secrets
type: Opaque
stringData:
  client-id: "$CLIENT_ID"
  client-secret: "$CLIENT_SECRET"
  tenant-id: "$TENANT_ID"
  workspace-id: "YOUR_WORKSPACE_ID"
  report-id: "YOUR_REPORT_ID"
  dataset-id: "YOUR_DATASET_ID"
EOF

# Apply secret
kubectl create -f powerbi-secrets.yaml
```

### 7. Deploy Application (1 minute)

```bash
cd /home/user/AZURE

# Install dependencies
cd order-service && npm install && cd ..
cd frontend && npm install && cd ..

# Start services (local development)
cd order-service && npm start &
cd ../frontend && npm start &
```

### 8. Test (30 seconds)

1. Open http://localhost:3000
2. Login with your account
3. Click **Analytics** in header
4. Verify Power BI report loads

## Verify Installation

```bash
# Test Power BI service health
curl http://localhost:3002/api/powerbi/health

# Expected output:
# {"success":true,"status":"healthy","message":"Power BI service is connected and operational"}
```

## Quick Troubleshooting

### Error: "Unauthorized: Invalid Azure AD credentials"
```bash
# Re-create client secret
az ad app credential reset --id $CLIENT_ID

# Update Kubernetes secret
kubectl delete secret powerbi-secrets
kubectl create -f powerbi-secrets.yaml
kubectl rollout restart deployment order-service
```

### Error: "Power BI report not found"
- Verify workspace ID and report ID are correct
- Check service principal has access to workspace
- Ensure workspace is on Premium/Embedded capacity

### Report loads but shows no data
- Configure Row-Level Security in Power BI Desktop
- Verify dataset is published and refreshed
- Check data source credentials

## What's Next?

1. ✅ Basic setup complete
2. Configure Row-Level Security → See [POWERBI_EMBEDDED_SETUP.md](./POWERBI_EMBEDDED_SETUP.md#step-3-create-and-publish-reports)
3. Create custom dashboards → See [README.md](./README.md)
4. Deploy to production → See deployment section in setup guide

## Need Help?

- Full documentation: [POWERBI_EMBEDDED_SETUP.md](./POWERBI_EMBEDDED_SETUP.md)
- Architecture details: See README.md in this directory
- Azure support: https://azure.microsoft.com/support/

---

**Total Setup Time**: ~7 minutes
**Difficulty**: Intermediate
