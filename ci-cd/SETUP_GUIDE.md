# CI/CD Setup Guide - Azure Pipelines

Hướng dẫn chi tiết setup CI/CD pipeline với Azure DevOps cho E-commerce Cloud-Native System.

## 📋 Mục Lục

1. [Tổng Quan CI/CD](#tổng-quan-cicd)
2. [Prerequisites](#prerequisites)
3. [Setup Azure DevOps](#setup-azure-devops)
4. [Tạo Pipeline](#tạo-pipeline)
5. [Configure Service Connections](#configure-service-connections)
6. [Setup Variables](#setup-variables)
7. [Run Pipeline](#run-pipeline)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

---

## Tổng Quan CI/CD

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIGGER (Push to main)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: BUILD                                              │
│  - Build Docker images (auth, order, frontend)               │
│  - Tag with $(Build.BuildId)                                 │
│  - Push to Azure Container Registry                          │
│  - Publish Kubernetes manifests as artifacts                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: TEST                                               │
│  - Run unit tests (Jest)                                     │
│  - Run integration tests                                     │
│  - Code coverage analysis                                    │
│  - Security scanning                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: DEPLOY GREEN                                       │
│  - Deploy new version to green environment                   │
│  - Wait for pods to be ready                                 │
│  - Run health checks                                         │
│  - Run smoke tests                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 4: SWAP TRAFFIC                                       │
│  - Switch traffic from blue to green                         │
│  - Monitor for 5 minutes                                     │
│  - Check error rates                                         │
│  - If errors > threshold → ROLLBACK                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴─────┐
                    │          │
              Success      Failure
                    │          │
                    ▼          ▼
           ┌────────────┐  ┌──────────┐
           │   DONE     │  │ ROLLBACK │
           └────────────┘  └──────────┘
```

---

## Prerequisites

### 1. Azure Subscription
```bash
# Verify Azure access
az account show

# Output should show your subscription
{
  "id": "xxx-xxx-xxx",
  "name": "Your Subscription",
  "state": "Enabled"
}
```

### 2. GitHub Repository
- Repository: https://github.com/vutd22uit/AZURE
- Access: Owner or Admin permissions
- Branch: `main` (default)

### 3. Azure Resources (already deployed)
- ✅ AKS Cluster: `ecommerce-cloud-aks`
- ✅ ACR: `ecommerceacr`
- ✅ Resource Group: `ecommerce-cloud-rg`

---

## Setup Azure DevOps

### Bước 1: Tạo Azure DevOps Organization

1. **Truy cập Azure DevOps**
   ```
   https://dev.azure.com
   ```

2. **Sign in với Azure account**
   - Dùng cùng account với Azure subscription

3. **Create new organization**
   - Click "New organization"
   - Name: `ecommerce-cloud-devops` (hoặc tên bạn muốn)
   - Region: `Southeast Asia`
   - Click "Continue"

4. **Verify organization**
   ```
   https://dev.azure.com/ecommerce-cloud-devops
   ```

### Bước 2: Tạo Azure DevOps Project

1. **Create new project**
   - Name: `E-commerce-Cloud`
   - Visibility: `Private`
   - Version control: `Git`
   - Work item process: `Agile`
   - Click "Create"

2. **Project URL**
   ```
   https://dev.azure.com/ecommerce-cloud-devops/E-commerce-Cloud
   ```

---

## Tạo Pipeline

### Bước 3: Connect to GitHub Repository

1. **Go to Pipelines**
   ```
   Azure DevOps → Pipelines → Create Pipeline
   ```

2. **Select GitHub**
   - Click "GitHub"
   - Authorize Azure Pipelines
   - Select repository: `vutd22uit/AZURE`

3. **Select existing pipeline**
   - Choose "Existing Azure Pipelines YAML file"
   - Branch: `main`
   - Path: `/ci-cd/azure-pipelines.yaml`
   - Click "Continue"

4. **Review pipeline**
   - Azure DevOps sẽ hiển thị nội dung file YAML
   - Click "Run" (chưa chạy ngay, sẽ báo lỗi do chưa config)

### Bước 4: Configure Pipeline Settings

1. **Rename pipeline** (optional)
   ```
   Pipelines → Click on pipeline → ... (menu) → Rename/move
   Name: "E-commerce CI/CD Pipeline"
   ```

2. **Configure triggers**
   ```
   Pipelines → Edit → Triggers tab

   ✅ Enable continuous integration
   Branch filters:
   - Include: main, develop
   - Exclude: feature/*

   Path filters (optional):
   - Include:
     * /auth-service/*
     * /order-service/*
     * /frontend/*
     * /kubernetes/*
   ```

---

## Configure Service Connections

Service connections cho phép Azure Pipelines connect tới Azure resources.

### Bước 5: Azure Resource Manager Connection

1. **Create service connection**
   ```
   Project Settings (bottom left) → Service connections → New service connection
   ```

2. **Select Azure Resource Manager**
   - Connection type: `Azure Resource Manager`
   - Authentication: `Service principal (automatic)`
   - Click "Next"

3. **Configure connection**
   - Scope level: `Subscription`
   - Subscription: Select your Azure subscription
   - Resource group: `ecommerce-cloud-rg`
   - Service connection name: `azure-ecommerce-connection`
   - Grant access permission to all pipelines: ✅ Check
   - Click "Save"

### Bước 6: Docker Registry Connection (ACR)

1. **Create new service connection**
   ```
   Service connections → New service connection
   ```

2. **Select Docker Registry**
   - Registry type: `Azure Container Registry`
   - Subscription: Select your subscription
   - Azure container registry: `ecommerceacr`
   - Service connection name: `acr-ecommerce-connection`
   - Click "Save"

### Bước 7: Kubernetes Connection (AKS)

1. **Create new service connection**
   ```
   Service connections → New service connection
   ```

2. **Select Kubernetes**
   - Authentication method: `Azure Subscription`
   - Subscription: Select your subscription
   - Cluster: `ecommerce-cloud-aks`
   - Namespace: `default`
   - Service connection name: `aks-ecommerce-connection`
   - Click "Save"

### Verify Service Connections

```
Project Settings → Service connections

Should see:
✅ azure-ecommerce-connection (Azure Resource Manager)
✅ acr-ecommerce-connection (Docker Registry)
✅ aks-ecommerce-connection (Kubernetes)
```

---

## Setup Variables

### Bước 8: Pipeline Variables

1. **Go to pipeline variables**
   ```
   Pipelines → Select your pipeline → Edit → Variables
   ```

2. **Add variables**

   Click "New variable" cho mỗi variable sau:

   | Name | Value | Secret? |
   |------|-------|---------|
   | `azureSubscription` | `azure-ecommerce-connection` | No |
   | `dockerRegistryServiceConnection` | `acr-ecommerce-connection` | No |
   | `kubernetesServiceConnection` | `aks-ecommerce-connection` | No |
   | `containerRegistry` | `ecommerceacr.azurecr.io` | No |
   | `imageRepository.auth` | `auth-service` | No |
   | `imageRepository.order` | `order-service` | No |
   | `imageRepository.frontend` | `frontend` | No |
   | `resourceGroupName` | `ecommerce-cloud-rg` | No |
   | `aksClusterName` | `ecommerce-cloud-aks` | No |

3. **Save variables**

### Bước 9: Variable Groups (Optional - for secrets)

1. **Create variable group**
   ```
   Pipelines → Library → + Variable group
   ```

2. **Configure variable group**
   - Variable group name: `ecommerce-secrets`
   - Description: "Secrets for e-commerce pipeline"

3. **Add variables**
   | Name | Value | Secret? |
   |------|-------|---------|
   | `postgres.password` | `YourStrongPassword123!` | ✅ Yes |
   | `jwt.secret` | `your-jwt-secret-key` | ✅ Yes |
   | `cosmos.key` | `your-cosmos-key` | ✅ Yes |

4. **Link to pipeline**
   ```
   Pipelines → Edit → Variables → Variable groups → Link variable group
   Select: ecommerce-secrets
   ```

---

## Run Pipeline

### Bước 10: First Run

1. **Trigger manual run**
   ```
   Pipelines → Select pipeline → Run pipeline

   Branch/tag: main
   Advanced options: (leave default)

   Click "Run"
   ```

2. **Monitor pipeline execution**
   ```
   Pipeline will show:
   - Stage 1: Build (in progress)
   - Stage 2: Test (waiting)
   - Stage 3: Deploy Green (waiting)
   - Stage 4: Swap Traffic (waiting)
   ```

3. **View logs**
   - Click on each stage để xem logs
   - Click on tasks để xem chi tiết

### Expected Timeline

```
Stage 1: Build         → 5-10 minutes
  ├── Build auth-service       (2 min)
  ├── Build order-service      (2 min)
  ├── Build frontend           (2 min)
  └── Push to ACR              (2 min)

Stage 2: Test          → 2-3 minutes
  ├── Unit tests              (1 min)
  └── Integration tests       (1 min)

Stage 3: Deploy Green  → 3-5 minutes
  ├── Deploy to AKS           (2 min)
  ├── Wait for ready          (1 min)
  └── Health checks           (1 min)

Stage 4: Swap Traffic  → 5 minutes
  ├── Switch traffic          (10 sec)
  └── Monitor                 (5 min)

Total: ~15-25 minutes
```

---

## Monitoring & Logs

### View Pipeline Runs

```
Pipelines → Select pipeline → Runs

Shows:
- Run history
- Status (Succeeded, Failed, Canceled)
- Duration
- Branch
- Commit
```

### View Logs

1. **Real-time logs**
   ```
   Click on running pipeline → Click on stage → Click on task
   Logs stream in real-time
   ```

2. **Download logs**
   ```
   Pipeline run → ... (menu) → Download logs
   Downloads .zip file với tất cả logs
   ```

### Pipeline Analytics

```
Pipelines → Analytics

Shows:
- Pass rate
- Run duration
- Failure trend
- Most failed tasks
```

---

## Troubleshooting

### Issue 1: Permission Denied (ACR)

**Error:**
```
Failed to push image to ACR: unauthorized
```

**Solution:**
```bash
# Grant AKS access to ACR
az aks update \
  --name ecommerce-cloud-aks \
  --resource-group ecommerce-cloud-rg \
  --attach-acr ecommerceacr

# Verify service connection
# Project Settings → Service connections → acr-ecommerce-connection → Verify
```

### Issue 2: Kubernetes Connection Failed

**Error:**
```
Unable to connect to AKS cluster
```

**Solution:**
```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group ecommerce-cloud-rg \
  --name ecommerce-cloud-aks \
  --overwrite-existing

# Verify kubectl works
kubectl get nodes

# Re-create service connection
# Project Settings → Service connections → Delete aks-ecommerce-connection
# Create new connection with updated credentials
```

### Issue 3: Build Failed - Docker Build Error

**Error:**
```
docker build failed: no space left on device
```

**Solution:**
```yaml
# In azure-pipelines.yaml, add cleanup step:
- task: Docker@2
  displayName: 'Clean up Docker images'
  inputs:
    command: 'system prune'
    arguments: '-af'
```

### Issue 4: Deploy Failed - Secrets Not Found

**Error:**
```
Error from server (NotFound): secrets "order-service-secrets" not found
```

**Solution:**
```bash
# Create secrets manually first
kubectl create secret generic auth-service-secrets \
  --from-literal=postgres-host=<host> \
  --from-literal=postgres-password=<password> \
  --from-literal=jwt-secret=<secret>

kubectl create secret generic order-service-secrets \
  --from-literal=cosmos-endpoint=<endpoint> \
  --from-literal=cosmos-key=<key> \
  --from-literal=payment-function-url=<url>

kubectl create secret generic powerbi-secrets \
  --from-literal=client-id=<id> \
  --from-literal=client-secret=<secret> \
  --from-literal=tenant-id=<tenant> \
  --from-literal=workspace-id=<workspace> \
  --from-literal=report-id=<report> \
  --from-literal=dataset-id=<dataset>
```

### Issue 5: Health Check Failed

**Error:**
```
Health check failed: deployment not ready
```

**Solution:**
```bash
# Check pod status
kubectl get pods

# Check pod logs
kubectl logs <pod-name>

# Increase health check timeout in azure-pipelines.yaml
# Change initialDelaySeconds from 30 to 60
```

### Issue 6: Pipeline Stuck

**Error:**
Pipeline stuck at "Waiting for approval"

**Solution:**
```
# If manual approval is required:
Pipelines → Select run → Approve deployment

# To disable manual approval:
Pipelines → Edit → Stages → Deploy → Pre-deployment conditions
Uncheck "Pre-deployment approvals"
```

---

## Advanced Configuration

### Enable Blue-Green Deployment

Update `azure-pipelines.yaml` to use blue-green strategy:

```yaml
stages:
- stage: DeployGreen
  jobs:
  - deployment: DeployToGreen
    environment: production-green
    strategy:
      runOnce:
        deploy:
          steps:
          - task: KubernetesManifest@0
            displayName: 'Deploy to Green'
            inputs:
              action: 'deploy'
              kubernetesServiceConnection: '$(kubernetesServiceConnection)'
              manifests: |
                $(Pipeline.Workspace)/manifests/blue-green/green-deployment.yaml

- stage: SwapTraffic
  dependsOn: DeployGreen
  jobs:
  - job: SwapToGreen
    steps:
    - task: KubernetesManifest@0
      displayName: 'Switch traffic to Green'
      inputs:
        action: 'deploy'
        manifests: |
          $(Pipeline.Workspace)/manifests/blue-green/service-green.yaml
```

### Add Notifications

```yaml
# Add to azure-pipelines.yaml
trigger:
  branches:
    include:
    - main

notifications:
  - email:
      addresses:
      - your-email@example.com
    on:
      - buildCompleted
      - buildFailed
```

Or configure in Azure DevOps:
```
Project Settings → Notifications → New subscription
Event: Build completes
Email: your-email@example.com
```

---

## Quick Start Commands

### Complete CI/CD Setup (Copy-Paste)

```bash
# 1. Install Azure DevOps CLI extension
az extension add --name azure-devops

# 2. Configure defaults
az devops configure --defaults \
  organization=https://dev.azure.com/ecommerce-cloud-devops \
  project=E-commerce-Cloud

# 3. Create service connections via CLI (alternative to Portal)
# Note: Easier to do via Portal for first time

# 4. Trigger pipeline manually
az pipelines run \
  --name "E-commerce CI/CD Pipeline" \
  --branch main

# 5. Monitor pipeline
az pipelines runs list --output table

# 6. Get pipeline run details
az pipelines runs show --id <run-id>
```

### Verify Setup

```bash
# Check Azure DevOps configuration
az devops configure --list

# List all pipelines
az pipelines list --output table

# List all service connections
az devops service-endpoint list --output table

# Check pipeline permissions
az pipelines show --name "E-commerce CI/CD Pipeline"
```

---

## Resources

### Documentation
- [Azure Pipelines Documentation](https://docs.microsoft.com/azure/devops/pipelines/)
- [YAML Schema Reference](https://docs.microsoft.com/azure/devops/pipelines/yaml-schema)
- [Service Connections](https://docs.microsoft.com/azure/devops/pipelines/library/service-endpoints)

### File Locations
- Pipeline YAML: `/ci-cd/azure-pipelines.yaml`
- Kubernetes Manifests: `/kubernetes/`
- Docker Build Contexts: `/auth-service/`, `/order-service/`, `/frontend/`

### Support
- Azure DevOps Status: https://status.dev.azure.com
- Community: https://developercommunity.visualstudio.com

---

## Summary Checklist

Setup CI/CD pipeline trong 10 bước:

- [ ] **Step 1**: Tạo Azure DevOps Organization
- [ ] **Step 2**: Tạo Azure DevOps Project
- [ ] **Step 3**: Connect GitHub Repository
- [ ] **Step 4**: Configure Pipeline Settings
- [ ] **Step 5**: Create Azure Resource Manager Connection
- [ ] **Step 6**: Create Docker Registry Connection (ACR)
- [ ] **Step 7**: Create Kubernetes Connection (AKS)
- [ ] **Step 8**: Setup Pipeline Variables
- [ ] **Step 9**: Create Variable Groups (optional)
- [ ] **Step 10**: Run Pipeline

**Total Time**: ~30-45 minutes

---

**Last Updated**: 2024-12-04
**Version**: 1.0.0
