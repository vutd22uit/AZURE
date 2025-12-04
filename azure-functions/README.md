# Azure Functions

Serverless functions for payment processing and email notifications.

## Functions

### 1. Payment Processor (`payment-processor`)

**Trigger**: HTTP POST

**Endpoint**: `/api/process-payment`

**Request Body**:
```json
{
  "orderId": "uuid",
  "userId": "1",
  "amount": 199.99,
  "paymentMethod": "credit_card"
}
```

**Functionality**:
- Receives payment request from Order Service
- Simulates payment processing (90% success rate)
- Updates order status in Cosmos DB
- Triggers email notification on success

**Environment Variables**:
- `COSMOS_DB_ENDPOINT`: Cosmos DB endpoint
- `COSMOS_DB_KEY`: Cosmos DB key
- `COSMOS_DB_DATABASE`: Database name
- `COSMOS_DB_CONTAINER`: Container name (orders)
- `EMAIL_FUNCTION_URL`: Email notification function URL

### 2. Email Notification (`email-notification`)

**Trigger**: HTTP POST

**Endpoint**: `/api/send-email`

**Request Body**:
```json
{
  "orderId": "uuid",
  "userId": "1",
  "amount": 199.99,
  "paymentId": "PAY-123",
  "customerEmail": "customer@example.com"
}
```

**Functionality**:
- Sends order confirmation emails
- Uses SendGrid API (or mock for testing)
- HTML email template with order details

**Environment Variables**:
- `SENDGRID_API_KEY`: SendGrid API key (use 'mock-sendgrid-key' for testing)
- `FROM_EMAIL`: Sender email address

## Development

### Prerequisites

1. Install Azure Functions Core Tools:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. Install dependencies for each function:
   ```bash
   cd payment-processor && npm install
   cd ../email-notification && npm install
   ```

### Run Locally

```bash
# From azure-functions directory
func start
```

The functions will be available at:
- Payment Processor: http://localhost:7071/api/process-payment
- Email Notification: http://localhost:7071/api/send-email

### Test Payment Processor

```bash
curl -X POST http://localhost:7071/api/process-payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-id",
    "userId": "1",
    "amount": 99.99,
    "paymentMethod": "credit_card"
  }'
```

### Test Email Notification

```bash
curl -X POST http://localhost:7071/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-id",
    "userId": "1",
    "amount": 99.99,
    "paymentId": "PAY-12345",
    "customerEmail": "test@example.com"
  }'
```

## Deployment

### Deploy to Azure

1. Login to Azure:
   ```bash
   az login
   ```

2. Deploy functions:
   ```bash
   func azure functionapp publish <function-app-name>
   ```

### Configure Application Settings

```bash
# Payment Processor
az functionapp config appsettings set \
  --name <payment-function-name> \
  --resource-group <rg-name> \
  --settings \
    COSMOS_DB_ENDPOINT=https://... \
    COSMOS_DB_KEY=... \
    COSMOS_DB_DATABASE=ordersdb \
    COSMOS_DB_CONTAINER=orders \
    EMAIL_FUNCTION_URL=https://...

# Email Notification
az functionapp config appsettings set \
  --name <email-function-name> \
  --resource-group <rg-name> \
  --settings \
    SENDGRID_API_KEY=... \
    FROM_EMAIL=noreply@ecommerce.com
```

## Architecture

```
Order Service
    |
    | POST /api/orders
    v
[Create Order in Cosmos DB]
    |
    | HTTP POST
    v
Payment Processor Function
    |
    ├─> Update Order Status in Cosmos DB
    |
    └─> HTTP POST
        v
    Email Notification Function
        |
        └─> Send Email via SendGrid
```

## Monitoring

View function logs in Azure Portal:
1. Navigate to Function App
2. Click on "Functions" -> Select function
3. Click "Monitor" tab
4. View invocations and logs

## Error Handling

- Payment failures are recorded with status "payment_failed"
- Email failures don't affect payment processing
- All errors are logged to Application Insights
- Automatic retries for transient failures

## Cost Optimization

- Functions use Consumption Plan (pay per execution)
- Cold start mitigation with keep-alive pings
- Efficient Cosmos DB queries
- Email batching for high volume (future enhancement)

## Security

- Function-level authentication required
- Managed identities for Azure service access
- Secrets stored in Azure Key Vault
- HTTPS-only endpoints
