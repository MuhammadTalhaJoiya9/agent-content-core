const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../database/db');
const router = express.Router();

// Get all projects for user
router.get('/', auth, (req, res) => {
  try {
    const { workspace } = req.query;
    
    // Get user's workspaces
    const userWorkspaces = db.getWorkspacesByOwner(req.user.id);
    
    let projects = [];
    if (workspace) {
      // Get projects for specific workspace
      const targetWorkspace = userWorkspaces.find(w => w.id === workspace);
      if (targetWorkspace) {
        projects = db.getProjectsByWorkspace(workspace);
      }
    } else {
      // Get projects from all user's workspaces
      userWorkspaces.forEach(ws => {
        const workspaceProjects = db.getProjectsByWorkspace(ws.id);
        projects.push(...workspaceProjects);
      });
    }

    // Sort by updated_at (newest first)
    projects.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Get single project
router.get('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const project = db.getProjectById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns this project
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Error fetching project' });
  }
});

// Create new project
router.post('/', auth, (req, res) => {
  try {
    const { title, content_type, content = '', workspace_id, metadata = {} } = req.body;

    if (!title || !content_type) {
      return res.status(400).json({ message: 'Title and content type are required' });
    }

    // Get user's default workspace if not specified
    let targetWorkspaceId = workspace_id;
    if (!targetWorkspaceId) {
      const userWorkspaces = db.getWorkspacesByOwner(req.user.id);
      if (userWorkspaces.length > 0) {
        targetWorkspaceId = userWorkspaces[0].id;
      } else {
        return res.status(400).json({ message: 'No workspace found' });
      }
    }

    // Verify user owns the workspace
    const workspace = db.getWorkspacesByOwner(req.user.id).find(w => w.id === targetWorkspaceId);
    if (!workspace) {
      return res.status(403).json({ message: 'Access denied to workspace' });
    }

    const projectData = {
      workspace_id: targetWorkspaceId,
      title,
      content_type,
      content,
      word_count: content.split(/\s+/).filter(word => word.length > 0).length,
      status: content ? 'draft' : 'draft',
      metadata,
      created_by: req.user.id
    };

    const project = db.createProject(projectData);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// Update project
router.put('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = db.getProjectById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns this project
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate word count if content is being updated
    if (updates.content) {
      updates.word_count = updates.content.split(/\s+/).filter(word => word.length > 0).length;
    }

    // Don't allow changing certain fields
    delete updates.id;
    delete updates.created_by;
    delete updates.created_at;

    const updatedProject = db.updateProject(id, updates);
    if (!updatedProject) {
      return res.status(500).json({ message: 'Failed to update project' });
    }

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// Delete project
router.delete('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const project = db.getProjectById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns this project
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deleted = db.deleteProject(id);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete project' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

// Duplicate project
router.post('/:id/duplicate', auth, (req, res) => {
  try {
    const { id } = req.params;
    const project = db.getProjectById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns this project
    if (project.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const duplicateData = {
      workspace_id: project.workspace_id,
      title: `${project.title} (Copy)`,
      content_type: project.content_type,
      content: project.content,
      word_count: project.word_count,
      status: 'draft',
      metadata: { ...project.metadata },
      created_by: req.user.id
    };

    const duplicatedProject = db.createProject(duplicateData);
    res.status(201).json(duplicatedProject);
  } catch (error) {
    console.error('Duplicate project error:', error);
    res.status(500).json({ message: 'Error duplicating project' });
  }
});

module.exports = router;