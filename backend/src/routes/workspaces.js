import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateWorkspace } from '../middleware/validation.js';

const router = express.Router();

// Get all workspaces for user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    
    const workspaces = await db.allAsync(
      'SELECT * FROM workspaces WHERE owner_id = ? ORDER BY created_at ASC',
      [req.user.id]
    );
    
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
});

// Get single workspace
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const workspace = await db.getAsync(
      'SELECT * FROM workspaces WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

// Create new workspace
router.post('/', authenticateToken, validateWorkspace, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { name, plan_type = 'personal' } = req.body;
    
    const workspaceId = uuidv4();
    
    await db.runAsync(
      'INSERT INTO workspaces (id, name, owner_id, plan_type) VALUES (?, ?, ?, ?)',
      [workspaceId, name, req.user.id, plan_type]
    );
    
    const workspace = await db.getAsync(
      'SELECT * FROM workspaces WHERE id = ?',
      [workspaceId]
    );
    
    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

// Update workspace
router.put('/:id', authenticateToken, validateWorkspace, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { name, plan_type } = req.body;
    
    // Check if workspace exists and belongs to user
    const existingWorkspace = await db.getAsync(
      'SELECT id FROM workspaces WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );
    
    if (!existingWorkspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    await db.runAsync(
      'UPDATE workspaces SET name = ?, plan_type = ? WHERE id = ?',
      [name, plan_type, id]
    );
    
    const workspace = await db.getAsync(
      'SELECT * FROM workspaces WHERE id = ?',
      [id]
    );
    
    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

// Delete workspace
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Check if workspace exists and belongs to user
    const workspace = await db.getAsync(
      'SELECT id FROM workspaces WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Check if it's the user's last workspace
    const workspaceCount = await db.getAsync(
      'SELECT COUNT(*) as count FROM workspaces WHERE owner_id = ?',
      [req.user.id]
    );
    
    if (workspaceCount.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete your last workspace' });
    }
    
    await db.runAsync('DELETE FROM workspaces WHERE id = ?', [id]);
    
    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get workspace statistics
router.get('/:id/stats', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Verify workspace belongs to user
    const workspace = await db.getAsync(
      'SELECT id FROM workspaces WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Get project counts by status
    const projectStats = await db.allAsync(`
      SELECT status, COUNT(*) as count 
      FROM projects 
      WHERE workspace_id = ? 
      GROUP BY status
    `, [id]);
    
    // Get total word count
    const wordCount = await db.getAsync(
      'SELECT SUM(word_count) as total_words FROM projects WHERE workspace_id = ?',
      [id]
    );
    
    // Get recent activity (last 30 days)
    const recentActivity = await db.getAsync(`
      SELECT COUNT(*) as recent_projects 
      FROM projects 
      WHERE workspace_id = ? AND created_at > datetime('now', '-30 days')
    `, [id]);
    
    res.json({
      project_stats: projectStats,
      total_words: wordCount.total_words || 0,
      recent_projects: recentActivity.recent_projects || 0
    });
  } catch (error) {
    next(error);
  }
});

export default router;