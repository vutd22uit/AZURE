# Auth Service

Authentication microservice for the e-commerce cloud-native system.

## Features

- User registration with email and password
- User login with JWT token generation
- Token verification endpoint for other microservices
- PostgreSQL database for user storage
- Password hashing with bcrypt
- Input validation and security headers

## API Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login
Login existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/verify
Verify JWT token (used by other microservices).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3001
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=authdb
POSTGRES_USER=pgadmin
POSTGRES_PASSWORD=your-password
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
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
docker build -t auth-service:latest .
```

### Run Container
```bash
docker run -p 3001:3001 \
  -e POSTGRES_HOST=host.docker.internal \
  -e POSTGRES_DATABASE=authdb \
  -e POSTGRES_USER=pgadmin \
  -e POSTGRES_PASSWORD=password \
  auth-service:latest
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Input validation with express-validator
- Security headers with helmet
- CORS protection
- SQL injection prevention with parameterized queries

## Integration with Other Services

Other microservices can verify user authentication by calling the `/api/auth/verify` endpoint:

```javascript
const axios = require('axios');

async function verifyUser(token) {
  try {
    const response = await axios.post(
      'http://auth-service:3001/api/auth/verify',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data.user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```
