# Order Service

Order management microservice handling products, orders, and shopping cart functionality.

## Features

- Product catalog management (CRUD operations)
- Shopping cart management
- Order creation and tracking
- Integration with Auth Service for authentication
- Integration with Azure Functions for payment processing
- Cosmos DB for data storage

## API Endpoints

### Products

#### GET /api/products
Get all products.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "category": "electronics",
    "imageUrl": "https://...",
    "stock": 100,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/products/:id
Get product by ID.

#### POST /api/products
Create new product (admin).

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "electronics",
  "imageUrl": "https://...",
  "stock": 100
}
```

### Cart (Requires Authentication)

#### GET /api/cart
Get user's cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "cart-userId",
  "userId": "1",
  "items": [
    {
      "productId": "uuid",
      "name": "Product Name",
      "price": 99.99,
      "quantity": 2,
      "imageUrl": "https://...",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST /api/cart
Add item to cart.

**Request Body:**
```json
{
  "productId": "uuid",
  "name": "Product Name",
  "price": 99.99,
  "quantity": 1,
  "imageUrl": "https://..."
}
```

#### PUT /api/cart/:productId
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

#### DELETE /api/cart/:productId
Remove item from cart.

#### DELETE /api/cart
Clear entire cart.

### Orders (Requires Authentication)

#### POST /api/orders
Create new order.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "name": "Product Name",
      "price": 99.99,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345",
    "country": "Country"
  },
  "paymentMethod": "credit_card"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "1",
  "items": [...],
  "totalAmount": 199.98,
  "shippingAddress": {...},
  "paymentMethod": "credit_card",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/orders
Get user's orders.

#### GET /api/orders/:id
Get specific order by ID.

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3002
COSMOS_DB_ENDPOINT=https://...
COSMOS_DB_KEY=your-key
COSMOS_DB_DATABASE=ordersdb
AUTH_SERVICE_URL=http://auth-service:3001
PAYMENT_FUNCTION_URL=https://...
```

## Development

### Install Dependencies
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

## Docker

### Build Image
```bash
docker build -t order-service:latest .
```

### Run Container
```bash
docker run -p 3002:3002 \
  -e COSMOS_DB_ENDPOINT=https://... \
  -e COSMOS_DB_KEY=your-key \
  -e AUTH_SERVICE_URL=http://auth-service:3001 \
  order-service:latest
```

## Cosmos DB Collections

### Products Collection
- Partition Key: `/category`
- Stores product catalog

### Orders Collection
- Partition Key: `/userId`
- Stores customer orders

### Cart Collection
- Partition Key: `/userId`
- Stores shopping cart data

## Integration with Other Services

### Auth Service Integration
Order Service calls Auth Service to verify JWT tokens:

```javascript
// Middleware: src/middleware/auth.js
// Calls: POST http://auth-service:3001/api/auth/verify
```

### Azure Functions Integration
When an order is created, Order Service triggers the payment processor function:

```javascript
// Controller: src/controllers/orderController.js
// Calls: POST https://.../api/process-payment
```

## Security

- All cart and order endpoints require JWT authentication
- Tokens are verified by calling Auth Service
- Users can only access their own carts and orders
- Input validation on all endpoints
- Cosmos DB partition keys prevent cross-user data access
