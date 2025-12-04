# Terraform Infrastructure for E-commerce Cloud-Native System

This Terraform configuration creates a complete Azure infrastructure for a cloud-native e-commerce system.

## Resources Created

### Compute & Container Services
- **Azure Kubernetes Service (AKS)**: 2-node cluster for microservices hosting
- **Azure Container Registry (ACR)**: Private Docker registry
- **Azure Functions**: Serverless payment processor and email notification

### Database Services
- **Azure Database for PostgreSQL**: Auth service database
- **Azure Cosmos DB**: Order service database (products, orders, cart containers)
- **Azure Cache for Redis**: Session and caching layer

### Analytics & Data
- **Azure Synapse Analytics**: Data warehouse with SQL pool
- **Azure Data Factory**: ETL pipeline for data transformation
- **Application Insights**: Monitoring and logging

### Storage
- **Azure Storage Account**: Function apps and Synapse storage
- **Data Lake Gen2**: Synapse workspace storage

## Prerequisites

1. Azure CLI installed and authenticated:
   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

2. Terraform installed (>= 1.0):
   ```bash
   terraform --version
   ```

3. Update `terraform.tfvars` with your specific values:
   - PostgreSQL admin credentials
   - Synapse admin credentials
   - SendGrid API key (if using email notifications)

## Deployment Steps

### 1. Initialize Terraform
```bash
cd terraform
terraform init
```

### 2. Plan Infrastructure
```bash
terraform plan -out=tfplan
```

### 3. Apply Configuration
```bash
terraform apply tfplan
```

This will take 15-20 minutes to create all resources.

### 4. Get Outputs
```bash
terraform output
terraform output -json > outputs.json
```

### 5. Configure kubectl for AKS
```bash
az aks get-credentials \
  --resource-group $(terraform output -raw resource_group_name) \
  --name $(terraform output -raw aks_cluster_name)

kubectl get nodes
```

### 6. Login to ACR
```bash
az acr login --name $(terraform output -raw acr_login_server | cut -d'.' -f1)
```

## Important Outputs

After deployment, you'll need these outputs for configuring services:

- **postgres_server_fqdn**: PostgreSQL connection string
- **cosmos_db_endpoint**: Cosmos DB endpoint
- **redis_hostname**: Redis connection string
- **acr_login_server**: Docker registry URL
- **payment_function_url**: Payment processor endpoint
- **email_function_url**: Email notification endpoint

## Cost Estimation

Monthly cost estimate for dev environment (~$200-300/month):
- AKS: ~$150 (2 x D2s_v3 nodes)
- PostgreSQL: ~$30 (GP_Standard_D2s_v3)
- Cosmos DB: ~$20 (Serverless, usage-based)
- Redis: ~$15 (Standard C1)
- Functions: ~$0 (Consumption plan, free tier)
- Synapse: ~$50 (DW100c, paused when not in use)
- Storage: ~$5
- Other services: ~$10

**Note**: Pause/stop services when not in use to reduce costs.

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

**Warning**: This will permanently delete all resources and data!

## Security Considerations

1. **Passwords**: Use strong passwords and store in Azure Key Vault
2. **Firewall Rules**: Update PostgreSQL and Synapse firewall rules to restrict access
3. **Network**: Consider using Virtual Network for added security
4. **RBAC**: Implement proper role-based access control
5. **Secrets**: Never commit `terraform.tfvars` with real credentials to git

## Troubleshooting

### AKS Connection Issues
```bash
az aks get-credentials --resource-group <rg-name> --name <aks-name> --overwrite-existing
```

### PostgreSQL Connection Issues
Check firewall rules allow your IP:
```bash
az postgres flexible-server firewall-rule create \
  --resource-group <rg-name> \
  --name <server-name> \
  --rule-name AllowMyIP \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

### Cosmos DB Connection Issues
Verify endpoint and key in outputs:
```bash
terraform output cosmos_db_endpoint
terraform output cosmos_db_primary_key
```

## Next Steps

After infrastructure is ready:
1. Build and push Docker images to ACR
2. Deploy microservices to AKS
3. Configure Azure Functions
4. Set up Data Factory pipelines
5. Configure Power BI connection to Synapse
