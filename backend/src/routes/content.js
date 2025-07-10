import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateContentGeneration } from '../middleware/validation.js';

const router = express.Router();

// Mock AI content generation (replace with actual AI service)
async function generateTextContent(prompt, type = 'general') {
  // This is a mock implementation
  // In production, you would integrate with OpenAI, Claude, or other AI services
  
  const mockResponses = {
    article: `# ${prompt}\n\nThis is a comprehensive article about ${prompt}. Here's an in-depth exploration of the topic:\n\n## Introduction\n\nThe subject of ${prompt} has gained significant attention in recent years. This article will explore various aspects and provide valuable insights.\n\n## Key Points\n\n1. Understanding the fundamentals\n2. Practical applications\n3. Future implications\n\n## Conclusion\n\nIn conclusion, ${prompt} represents an important area of focus that deserves continued attention and research.`,
    
    social_post: `🚀 Exciting insights about ${prompt}! \n\nHere are the key takeaways:\n✅ Innovation drives progress\n✅ Community matters\n✅ Keep learning and growing\n\nWhat are your thoughts? Share in the comments! 👇\n\n#Innovation #Growth #Community`,
    
    video_script: `[INTRO]\nHello everyone! Today we're diving deep into ${prompt}.\n\n[HOOK]\nDid you know that ${prompt} can completely transform the way we think about innovation?\n\n[MAIN CONTENT]\nLet me share three key insights:\n\nFirst, understanding the basics is crucial...\n\nSecond, practical application makes all the difference...\n\nThird, the future possibilities are endless...\n\n[CALL TO ACTION]\nIf you found this valuable, please like and subscribe for more content like this!\n\n[OUTRO]\nThanks for watching, and I'll see you in the next video!`,
    
    email: `Subject: Important Update About ${prompt}\n\nHi there,\n\nI hope this email finds you well. I wanted to share some exciting news about ${prompt}.\n\nHere's what you need to know:\n\n• Key benefit #1: Enhanced efficiency\n• Key benefit #2: Improved results\n• Key benefit #3: Better user experience\n\nWe're committed to providing you with the best possible experience, and these updates are part of that commitment.\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nThe Team`,
    
    seo_content: `# The Complete Guide to ${prompt}: Everything You Need to Know\n\n## What is ${prompt}?\n\n${prompt} is a crucial concept that impacts many aspects of modern business and technology. Understanding ${prompt} can help you make better decisions and achieve better results.\n\n## Why ${prompt} Matters\n\nIn today's competitive landscape, ${prompt} has become increasingly important for several reasons:\n\n### 1. Improved Performance\n${prompt} directly contributes to enhanced performance metrics.\n\n### 2. Cost Efficiency\nImplementing ${prompt} strategies can lead to significant cost savings.\n\n### 3. Competitive Advantage\nBusinesses that master ${prompt} often outperform their competitors.\n\n## How to Get Started with ${prompt}\n\nHere's a step-by-step approach to implementing ${prompt}:\n\n1. **Assessment**: Evaluate your current situation\n2. **Planning**: Develop a comprehensive strategy\n3. **Implementation**: Execute your plan systematically\n4. **Monitoring**: Track progress and adjust as needed\n\n## Conclusion\n\n${prompt} represents a significant opportunity for growth and improvement. By following the strategies outlined in this guide, you'll be well-positioned to succeed.\n\n*Ready to get started with ${prompt}? Contact us today to learn more about our services and how we can help you achieve your goals.*`
  };
  
  const content = mockResponses[type] || mockResponses.article;
  const wordCount = content.split(/\s+/).length;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  return {
    content,
    word_count: wordCount,
    tokens_used: Math.ceil(wordCount * 1.3) // Rough token estimation
  };
}

async function generateImageContent(prompt, style = 'realistic') {
  // Mock image generation
  // In production, integrate with DALL-E, Midjourney, or Stable Diffusion
  
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
  
  return {
    image_url: `https://picsum.photos/1024/1024?random=${Date.now()}`,
    prompt: prompt,
    style: style,
    tokens_used: 1
  };
}

// Generate text content
router.post('/generate-text', authenticateToken, validateContentGeneration, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { prompt, type = 'general', project_id } = req.body;
    const userId = req.user.id;
    
    // Check usage limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentUsage = await db.getAsync(`
      SELECT SUM(amount_used) as total_used
      FROM usage_logs 
      WHERE user_id = ? AND resource_type = 'words' AND strftime('%Y-%m', created_at) = ?
    `, [userId, currentMonth]);
    
    const used = currentUsage?.total_used || 0;
    const userPlan = req.user.subscription_plan || 'free';
    const limits = { free: 10000, pro: 100000, enterprise: 1000000 };
    
    if (used >= limits[userPlan]) {
      return res.status(429).json({ 
        error: 'Usage limit exceeded for this month',
        current_usage: used,
        limit: limits[userPlan]
      });
    }
    
    // Generate content
    const result = await generateTextContent(prompt, type);
    
    // Store generated content
    const contentId = uuidv4();
    await db.runAsync(`
      INSERT INTO generated_content (id, user_id, project_id, content_type, prompt, generated_content, metadata, tokens_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contentId,
      userId,
      project_id || null,
      'text',
      prompt,
      result.content,
      JSON.stringify({ type, word_count: result.word_count }),
      result.tokens_used
    ]);
    
    // Log usage
    const usageId = uuidv4();
    await db.runAsync(`
      INSERT INTO usage_logs (id, user_id, resource_type, amount_used, project_id)
      VALUES (?, ?, ?, ?, ?)
    `, [usageId, userId, 'words', result.word_count, project_id || null]);
    
    res.json({
      id: contentId,
      content: result.content,
      word_count: result.word_count,
      tokens_used: result.tokens_used,
      type: type
    });
  } catch (error) {
    next(error);
  }
});

// Generate image content
router.post('/generate-image', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { prompt, style = 'realistic', project_id } = req.body;
    const userId = req.user.id;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Check usage limits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentUsage = await db.getAsync(`
      SELECT SUM(amount_used) as total_used
      FROM usage_logs 
      WHERE user_id = ? AND resource_type = 'images' AND strftime('%Y-%m', created_at) = ?
    `, [userId, currentMonth]);
    
    const used = currentUsage?.total_used || 0;
    const userPlan = req.user.subscription_plan || 'free';
    const limits = { free: 50, pro: 500, enterprise: 5000 };
    
    if (used >= limits[userPlan]) {
      return res.status(429).json({ 
        error: 'Image generation limit exceeded for this month',
        current_usage: used,
        limit: limits[userPlan]
      });
    }
    
    // Generate image
    const result = await generateImageContent(prompt, style);
    
    // Store generated content
    const contentId = uuidv4();
    await db.runAsync(`
      INSERT INTO generated_content (id, user_id, project_id, content_type, prompt, generated_content, metadata, tokens_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contentId,
      userId,
      project_id || null,
      'image',
      prompt,
      result.image_url,
      JSON.stringify({ style }),
      result.tokens_used
    ]);
    
    // Log usage
    const usageId = uuidv4();
    await db.runAsync(`
      INSERT INTO usage_logs (id, user_id, resource_type, amount_used, project_id)
      VALUES (?, ?, ?, ?, ?)
    `, [usageId, userId, 'images', 1, project_id || null]);
    
    res.json({
      id: contentId,
      image_url: result.image_url,
      prompt: prompt,
      style: style,
      tokens_used: result.tokens_used
    });
  } catch (error) {
    next(error);
  }
});

// Get generated content history
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    const { limit = 20, offset = 0, content_type, project_id } = req.query;
    
    let query = `
      SELECT gc.*, p.title as project_title
      FROM generated_content gc
      LEFT JOIN projects p ON gc.project_id = p.id
      WHERE gc.user_id = ?
    `;
    let params = [userId];
    
    if (content_type) {
      query += ' AND gc.content_type = ?';
      params.push(content_type);
    }
    
    if (project_id) {
      query += ' AND gc.project_id = ?';
      params.push(project_id);
    }
    
    query += ' ORDER BY gc.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const history = await db.allAsync(query, params);
    
    // Parse metadata JSON
    const historyWithMetadata = history.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null
    }));
    
    res.json(historyWithMetadata);
  } catch (error) {
    next(error);
  }
});

// Get single generated content
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const userId = req.user.id;
    
    const content = await db.getAsync(`
      SELECT gc.*, p.title as project_title
      FROM generated_content gc
      LEFT JOIN projects p ON gc.project_id = p.id
      WHERE gc.id = ? AND gc.user_id = ?
    `, [id, userId]);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Parse metadata JSON
    if (content.metadata) {
      content.metadata = JSON.parse(content.metadata);
    }
    
    res.json(content);
  } catch (error) {
    next(error);
  }
});

// Delete generated content
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const userId = req.user.id;
    
    const content = await db.getAsync(
      'SELECT id FROM generated_content WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    await db.runAsync('DELETE FROM generated_content WHERE id = ?', [id]);
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;