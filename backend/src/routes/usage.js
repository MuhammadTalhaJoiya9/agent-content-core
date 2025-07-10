const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../database/db');
const router = express.Router();

// Get current usage stats
router.get('/current', auth, (req, res) => {
  try {
    const usage = db.getUsageByUser(req.user.id);
    
    if (!usage) {
      // Create default usage if not exists
      const defaultUsage = {
        user_id: req.user.id,
        words_generated: 0,
        words_limit: req.user.subscription_plan === 'pro' ? 50000 : 10000,
        image_tokens: 0,
        image_limit: req.user.subscription_plan === 'pro' ? 500 : 50,
        video_minutes: 0,
        video_limit: req.user.subscription_plan === 'pro' ? 100 : 10,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      db.updateUsage(req.user.id, defaultUsage);
      return res.json(defaultUsage);
    }

    res.json(usage);
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ message: 'Error fetching usage statistics' });
  }
});

// Log usage (for tracking API calls)
router.post('/log', auth, (req, res) => {
  try {
    const { resource_type, amount_used, project_id } = req.body;

    if (!resource_type || !amount_used) {
      return res.status(400).json({ message: 'Resource type and amount are required' });
    }

    const currentUsage = db.getUsageByUser(req.user.id);
    if (!currentUsage) {
      return res.status(404).json({ message: 'Usage record not found' });
    }

    let updateData = {};
    
    switch (resource_type) {
      case 'words':
        updateData.words_generated = currentUsage.words_generated + amount_used;
        break;
      case 'image_tokens':
        updateData.image_tokens = currentUsage.image_tokens + amount_used;
        break;
      case 'video_minutes':
        updateData.video_minutes = currentUsage.video_minutes + amount_used;
        break;
      default:
        return res.status(400).json({ message: 'Invalid resource type' });
    }

    const updatedUsage = db.updateUsage(req.user.id, updateData);
    res.json(updatedUsage);
  } catch (error) {
    console.error('Log usage error:', error);
    res.status(500).json({ message: 'Error logging usage' });
  }
});

// Get usage history (mock data for now)
router.get('/history', auth, (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Generate mock usage history data
    const now = new Date();
    const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
    
    const history = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      history.push({
        date: date.toISOString().split('T')[0],
        words_generated: Math.floor(Math.random() * 500) + 100,
        image_tokens: Math.floor(Math.random() * 10),
        video_minutes: Math.floor(Math.random() * 5),
        api_calls: Math.floor(Math.random() * 20) + 5
      });
    }

    res.json(history);
  } catch (error) {
    console.error('Get usage history error:', error);
    res.status(500).json({ message: 'Error fetching usage history' });
  }
});

// Get usage breakdown by content type
router.get('/breakdown', auth, (req, res) => {
  try {
    // Get user's projects to analyze usage
    const userWorkspaces = db.getWorkspacesByOwner(req.user.id);
    let allProjects = [];
    
    userWorkspaces.forEach(ws => {
      const workspaceProjects = db.getProjectsByWorkspace(ws.id);
      allProjects.push(...workspaceProjects);
    });

    // Calculate breakdown by content type
    const breakdown = {};
    allProjects.forEach(project => {
      if (!breakdown[project.content_type]) {
        breakdown[project.content_type] = {
          count: 0,
          total_words: 0,
          avg_words: 0
        };
      }
      
      breakdown[project.content_type].count++;
      breakdown[project.content_type].total_words += project.word_count;
    });

    // Calculate averages
    Object.keys(breakdown).forEach(type => {
      breakdown[type].avg_words = Math.round(
        breakdown[type].total_words / breakdown[type].count
      );
    });

    res.json(breakdown);
  } catch (error) {
    console.error('Get usage breakdown error:', error);
    res.status(500).json({ message: 'Error fetching usage breakdown' });
  }
});

// Reset usage (for testing or new billing period)
router.post('/reset', auth, (req, res) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not allowed in production' });
    }

    const resetUsage = {
      words_generated: 0,
      image_tokens: 0,
      video_minutes: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const updatedUsage = db.updateUsage(req.user.id, resetUsage);
    res.json(updatedUsage);
  } catch (error) {
    console.error('Reset usage error:', error);
    res.status(500).json({ message: 'Error resetting usage' });
  }
});

module.exports = router;