const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Middleware to verify admin authentication
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'dev-auth-secret';
    const decoded = jwt.verify(token, secret);
    
    // JWT is signed with { sub: user.id, name, email, role }
    const userId = decoded.sub;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    // Check if user exists, is active, and has admin role
    const result = await pool.query(
      'SELECT user_id, email, name, role FROM users WHERE user_id = $1 AND status = $2',
      [userId, 'Active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    req.admin = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Admin auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { verifyAdmin };
