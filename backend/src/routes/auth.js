import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Register new user
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    const db = getDatabase();

    // Check if user already exists
    const existingUser = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    await db.runAsync(
      `INSERT INTO users (id, email, password_hash, first_name, last_name) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, first_name, last_name]
    );

    // Create default workspace
    const workspaceId = uuidv4();
    await db.runAsync(
      `INSERT INTO workspaces (id, name, owner_id, plan_type) 
       VALUES (?, ?, ?, ?)`,
      [workspaceId, `${first_name}'s Workspace`, userId, 'personal']
    );

    // Generate JWT token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Store session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.runAsync(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, userId, token, expiresAt.toISOString()]
    );

    // Get user data (without password)
    const user = await db.getAsync(
      'SELECT id, email, first_name, last_name, avatar_url, subscription_plan, subscription_status FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();

    // Find user
    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Store session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.runAsync(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, token, expiresAt.toISOString()]
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    
    // Remove user sessions
    await db.runAsync('DELETE FROM user_sessions WHERE user_id = ?', [req.user.id]);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    
    // Generate new token
    const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Update session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Remove old sessions and create new one
    await db.runAsync('DELETE FROM user_sessions WHERE user_id = ?', [req.user.id]);
    await db.runAsync(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, req.user.id, token, expiresAt.toISOString()]
    );
    
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

export default router;