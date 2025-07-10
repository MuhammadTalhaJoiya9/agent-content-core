import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Usage limits by plan
const USAGE_LIMITS = {
  free: {
    words_limit: 10000,
    image_limit: 50,
    video_limit: 10
  },
  pro: {
    words_limit: 100000,
    image_limit: 500,
    video_limit: 100
  },
  enterprise: {
    words_limit: 1000000,
    image_limit: 5000,
    video_limit: 1000
  }
};

// Get current usage statistics
router.get('/current', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    
    // Get current month's usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const usage = await db.allAsync(`
      SELECT 
        resource_type,
        SUM(amount_used) as total_used
      FROM usage_logs 
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
      GROUP BY resource_type
    `, [userId, currentMonth]);
    
    // Initialize usage stats with limits
    const limits = USAGE_LIMITS[userPlan];
    const stats = {
      words_generated: 0,
      words_limit: limits.words_limit,
      image_tokens: 0,
      image_limit: limits.image_limit,
      video_minutes: 0,
      video_limit: limits.video_limit
    };
    
    // Fill in actual usage
    usage.forEach(item => {
      switch (item.resource_type) {
        case 'words':
          stats.words_generated = item.total_used;
          break;
        case 'images':
          stats.image_tokens = item.total_used;
          break;
        case 'video_minutes':
          stats.video_minutes = item.total_used;
          break;
      }
    });
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Log usage
router.post('/log', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { resource_type, amount_used, project_id } = req.body;
    const userId = req.user.id;
    
    if (!resource_type || !amount_used) {
      return res.status(400).json({ error: 'resource_type and amount_used are required' });
    }
    
    const logId = uuidv4();
    
    await db.runAsync(`
      INSERT INTO usage_logs (id, user_id, resource_type, amount_used, project_id)
      VALUES (?, ?, ?, ?, ?)
    `, [logId, userId, resource_type, amount_used, project_id || null]);
    
    res.status(201).json({ 
      message: 'Usage logged successfully',
      id: logId
    });
  } catch (error) {
    next(error);
  }
});

// Get usage history
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { limit = 50, offset = 0, resource_type } = req.query;
    
    let query = `
      SELECT ul.*, p.title as project_title
      FROM usage_logs ul
      LEFT JOIN projects p ON ul.project_id = p.id
      WHERE ul.user_id = ?
    `;
    let params = [userId];
    
    if (resource_type) {
      query += ' AND ul.resource_type = ?';
      params.push(resource_type);
    }
    
    query += ' ORDER BY ul.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const history = await db.allAsync(query, params);
    
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Get usage analytics (monthly breakdown)
router.get('/analytics', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { months = 6 } = req.query;
    
    const analytics = await db.allAsync(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        resource_type,
        SUM(amount_used) as total_used
      FROM usage_logs 
      WHERE user_id = ? 
        AND created_at >= datetime('now', '-${parseInt(months)} months')
      GROUP BY month, resource_type
      ORDER BY month DESC, resource_type
    `, [userId]);
    
    // Group by month
    const monthlyData = {};
    analytics.forEach(item => {
      if (!monthlyData[item.month]) {
        monthlyData[item.month] = {};
      }
      monthlyData[item.month][item.resource_type] = item.total_used;
    });
    
    res.json(monthlyData);
  } catch (error) {
    next(error);
  }
});

// Check if user can perform action (usage limit check)
router.post('/check-limit', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { resource_type, amount_needed = 1 } = req.body;
    const userId = req.user.id;
    const userPlan = req.user.subscription_plan || 'free';
    
    if (!resource_type) {
      return res.status(400).json({ error: 'resource_type is required' });
    }
    
    // Get current month's usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const currentUsage = await db.getAsync(`
      SELECT SUM(amount_used) as total_used
      FROM usage_logs 
      WHERE user_id = ? AND resource_type = ? AND strftime('%Y-%m', created_at) = ?
    `, [userId, resource_type, currentMonth]);
    
    const used = currentUsage?.total_used || 0;
    const limits = USAGE_LIMITS[userPlan];
    
    let limit;
    switch (resource_type) {
      case 'words':
        limit = limits.words_limit;
        break;
      case 'images':
        limit = limits.image_limit;
        break;
      case 'video_minutes':
        limit = limits.video_limit;
        break;
      default:
        return res.status(400).json({ error: 'Invalid resource_type' });
    }
    
    const canProceed = (used + amount_needed) <= limit;
    const remaining = Math.max(0, limit - used);
    
    res.json({
      can_proceed: canProceed,
      current_usage: used,
      limit: limit,
      remaining: remaining,
      amount_needed: amount_needed
    });
  } catch (error) {
    next(error);
  }
});

export default router;