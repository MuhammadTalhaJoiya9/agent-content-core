import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateProject } from '../middleware/validation.js';

const router = express.Router();

// Get all projects for user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { workspace } = req.query;
    
    let query = `
      SELECT p.*, w.name as workspace_name 
      FROM projects p 
      JOIN workspaces w ON p.workspace_id = w.id 
      WHERE w.owner_id = ?
    `;
    let params = [req.user.id];
    
    if (workspace) {
      query += ' AND p.workspace_id = ?';
      params.push(workspace);
    }
    
    query += ' ORDER BY p.updated_at DESC';
    
    const projects = await db.allAsync(query, params);
    
    // Parse metadata JSON
    const projectsWithMetadata = projects.map(project => ({
      ...project,
      metadata: project.metadata ? JSON.parse(project.metadata) : null
    }));
    
    res.json(projectsWithMetadata);
  } catch (error) {
    next(error);
  }
});

// Get single project
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const project = await db.getAsync(`
      SELECT p.*, w.name as workspace_name 
      FROM projects p 
      JOIN workspaces w ON p.workspace_id = w.id 
      WHERE p.id = ? AND w.owner_id = ?
    `, [id, req.user.id]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Parse metadata JSON
    if (project.metadata) {
      project.metadata = JSON.parse(project.metadata);
    }
    
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', authenticateToken, validateProject, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { title, content_type, content = '', status = 'draft', metadata, workspace_id } = req.body;
    
    // Get user's default workspace if not specified
    let targetWorkspaceId = workspace_id;
    if (!targetWorkspaceId) {
      const defaultWorkspace = await db.getAsync(
        'SELECT id FROM workspaces WHERE owner_id = ? ORDER BY created_at ASC LIMIT 1',
        [req.user.id]
      );
      targetWorkspaceId = defaultWorkspace?.id;
    }
    
    // Verify workspace belongs to user
    const workspace = await db.getAsync(
      'SELECT id FROM workspaces WHERE id = ? AND owner_id = ?',
      [targetWorkspaceId, req.user.id]
    );
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    const projectId = uuidv4();
    const wordCount = content ? content.split(/\s+/).length : 0;
    
    await db.runAsync(`
      INSERT INTO projects (id, workspace_id, title, content_type, content, word_count, status, metadata, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectId,
      targetWorkspaceId,
      title,
      content_type,
      content,
      wordCount,
      status,
      metadata ? JSON.stringify(metadata) : null,
      req.user.id
    ]);
    
    // Get the created project
    const project = await db.getAsync(`
      SELECT p.*, w.name as workspace_name 
      FROM projects p 
      JOIN workspaces w ON p.workspace_id = w.id 
      WHERE p.id = ?
    `, [projectId]);
    
    // Parse metadata JSON
    if (project.metadata) {
      project.metadata = JSON.parse(project.metadata);
    }
    
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', authenticateToken, validateProject, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { title, content_type, content, status, metadata } = req.body;
    
    // Check if project exists and belongs to user
    const existingProject = await db.getAsync(`
      SELECT p.id 
      FROM projects p 
      JOIN workspaces w ON p.workspace_id = w.id 
      WHERE p.id = ? AND w.owner_id = ?
    `, [id, req.user.id]);
    
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const wordCount = content ? content.split(/\s+/).length : 0;
    
    await db.runAsync(`
      UPDATE projects 
      SET title = ?, content_type = ?, content = ?, word_count = ?, status = ?, metadata = ?
      WHERE id = ?
    `, [
      title,
      content_type,
      content,
      wordCount,
      status,
      metadata ? JSON.stringify(metadata) : null,
      id
    ]);
    
    // Get updated project
    const project = await db.getAsync(`
      SELECT p.*, w.name as workspace_name 
      FROM projects p 
      JOIN workspaces w ON p.workspace_id = w.id 
      WHERE p.id = ?
    `, [id]);
    
    // Parse metadata JSON
    if (project.metadata) {
      project.metadata = JSON.parse(project.metadata);
    }
    
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    // Check if project exists and belongs to user
    const project = await db.getAsync(`
      SELECT p.id 
      FROM projects p 
      JOIN workspaces w ON p.workspace_id = w.id 
      WHERE p.id = ? AND w.owner_id = ?
    `, [id, req.user.id]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await db.runAsync('DELETE FROM projects WHERE id = ?', [id]);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;