const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Call Auth Service to verify token
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify`,
      {},
      {
        headers: {
          Authorization: authHeader
        },
        timeout: 5000
      }
    );

    if (response.data.valid) {
      req.user = response.data.user;
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    console.error('Authentication error:', err.message);

    if (err.response) {
      return res.status(err.response.status).json({
        error: err.response.data.error || 'Authentication failed'
      });
    }

    res.status(500).json({ error: 'Authentication service unavailable' });
  }
}

module.exports = { authenticateToken };
