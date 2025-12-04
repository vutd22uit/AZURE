# Kubernetes Manifests

Kubernetes deployment configurations for the e-commerce microservices.

## Directory Structure

```
kubernetes/
├── deployments/         # Deployment manifests
│   ├── auth-service.yaml
│   ├── order-service.yaml
│   └── frontend.yaml
├── services/           # Service manifests
│   ├── auth-service.yaml
│   ├── order-service.yaml
│   └── frontend.yaml
├── ingress/            # Ingress configuration
│   └── ingress.yaml
├── blue-green/         # Blue-Green deployment
│   ├── blue-deployment.yaml
│   ├── green-deployment.yaml
│   ├── service-blue.yaml
│   └── service-green.yaml
└── secrets-template.yaml
```

## Prerequisites

1. AKS cluster deployed via Terraform
2. kubectl configured to access the cluster
3. Azure Container Registry with pushed images
4. Secrets created in cluster

## Setup

### 1. Configure kubectl

```bash
az aks get-credentials \
  --resource-group ecommerce-cloud-rg \
  --name ecommerce-cloud-aks
```

### 2. Create Secrets

```bash
# Copy template and fill in values
cp secrets-template.yaml secrets.yaml
# Edit secrets.yaml with actual values

# Apply secrets
kubectl apply -f secrets.yaml
```

### 3. Install Nginx Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

## Standard Deployment

Deploy all services:

```bash
# Apply deployments
kubectl apply -f deployments/

# Apply services
kubectl apply -f services/

# Apply ingress
kubectl apply -f ingress/
```

Verify deployments:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress
```

## Blue-Green Deployment

Blue-Green deployment strategy for zero-downtime updates.

### Initial Deployment (Blue)

```bash
# Deploy blue version
kubectl apply -f blue-green/blue-deployment.yaml

# Point service to blue
kubectl apply -f blue-green/service-blue.yaml
```

### Deploy New Version (Green)

```bash
# Deploy green version with new image
export GREEN_IMAGE_TAG="v2.0"
envsubst < blue-green/green-deployment.yaml | kubectl apply -f -

# Wait for green pods to be ready
kubectl wait --for=condition=ready pod -l version=green --timeout=300s

# Test green deployment (optional)
kubectl port-forward deployment/order-service-green 8002:3002
# Test at http://localhost:8002
```

### Switch Traffic to Green

```bash
# Point service to green
kubectl apply -f blue-green/service-green.yaml

# Verify traffic is going to green
kubectl get svc order-service -o yaml | grep version
```

### Rollback to Blue (if needed)

```bash
# Point service back to blue
kubectl apply -f blue-green/service-blue.yaml
```

### Cleanup Old Version

```bash
# After confirming green is stable
kubectl delete deployment order-service-blue
```

## Environment Variables

Set these before applying manifests:

```bash
export ACR_LOGIN_SERVER="yourregistry.azurecr.io"
export IMAGE_TAG="v1.0"
export BLUE_IMAGE_TAG="v1.0"
export GREEN_IMAGE_TAG="v2.0"
```

Then apply with variable substitution:

```bash
envsubst < deployments/order-service.yaml | kubectl apply -f -
```

## Scaling

Scale deployments:

```bash
# Manual scaling
kubectl scale deployment auth-service --replicas=5

# Auto-scaling (HPA)
kubectl autoscale deployment order-service \
  --cpu-percent=70 \
  --min=3 \
  --max=10
```

## Monitoring

View logs:

```bash
# View logs for a service
kubectl logs -l app=order-service --tail=100 -f

# View logs for specific pod
kubectl logs <pod-name> -f
```

Check health:

```bash
# Check pod status
kubectl get pods -o wide

# Describe pod for events
kubectl describe pod <pod-name>

# Check resource usage
kubectl top pods
kubectl top nodes
```

## Troubleshooting

### Pods not starting

```bash
# Check events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check secrets
kubectl get secrets
kubectl describe secret auth-service-secrets
```

### Service not accessible

```bash
# Check service endpoints
kubectl get endpoints

# Check ingress
kubectl describe ingress ecommerce-ingress

# Test service internally
kubectl run test-pod --image=curlimages/curl -it --rm -- curl http://order-service:3002/health
```

### Image pull errors

```bash
# Check ACR credentials
kubectl get secret regcred

# Create image pull secret if needed
kubectl create secret docker-registry regcred \
  --docker-server=<acr-login-server> \
  --docker-username=<acr-username> \
  --docker-password=<acr-password>

# Add to deployment
# imagePullSecrets:
# - name: regcred
```

## Resource Limits

Recommended resource limits:

- **Auth Service**: 256Mi-512Mi RAM, 250m-500m CPU
- **Order Service**: 256Mi-512Mi RAM, 250m-500m CPU
- **Frontend**: 128Mi-256Mi RAM, 100m-200m CPU

## Health Checks

All services include:

- **Liveness Probe**: Restarts pod if unhealthy
- **Readiness Probe**: Removes from load balancer if not ready

## Security

- Services use ClusterIP (internal only)
- Frontend uses LoadBalancer (external)
- Secrets managed via Kubernetes Secrets
- Network policies (optional, add if needed)

## Cost Optimization

- Use pod disruption budgets
- Configure auto-scaling
- Use appropriate resource limits
- Consider spot instances for non-critical workloads
