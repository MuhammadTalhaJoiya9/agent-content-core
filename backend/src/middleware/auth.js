import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is valid
    const db = getDatabase();
    const session = await db.getAsync(
      'SELECT * FROM user_sessions WHERE user_id = ? AND expires_at > DATETIME("now")',
      [decoded.userId]
    );

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get user data
    const user = await db.getAsync(
      'SELECT id, email, first_name, last_name, avatar_url, subscription_plan, subscription_status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  // Use the same logic as authenticateToken but don't fail if no token
  authenticateToken(req, res, (error) => {
    if (error) {
      req.user = null;
    }
    next();
  });
}