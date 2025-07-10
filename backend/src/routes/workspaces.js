const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../database/db');
const router = express.Router();

// Get user's workspaces
router.get('/', auth, (req, res) => {
  try {
    const workspaces = db.getWorkspacesByOwner(req.user.id);
    
    // Add project count to each workspace
    const workspacesWithCounts = workspaces.map(workspace => {
      const projects = db.getProjectsByWorkspace(workspace.id);
      return {
        ...workspace,
        project_count: projects.length,
        recent_activity: projects.length > 0 ? 
          Math.max(...projects.map(p => new Date(p.updated_at).getTime())) : 
          new Date(workspace.created_at).getTime()
      };
    });

    // Sort by recent activity
    workspacesWithCounts.sort((a, b) => b.recent_activity - a.recent_activity);

    res.json(workspacesWithCounts);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Error fetching workspaces' });
  }
});

// Get single workspace
router.get('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const userWorkspaces = db.getWorkspacesByOwner(req.user.id);
    const workspace = userWorkspaces.find(w => w.id === id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Add additional details
    const projects = db.getProjectsByWorkspace(id);
    const workspaceDetails = {
      ...workspace,
      project_count: projects.length,
      projects: projects.slice(0, 10), // Latest 10 projects
      total_words: projects.reduce((sum, p) => sum + p.word_count, 0),
      content_types: [...new Set(projects.map(p => p.content_type))]
    };

    res.json(workspaceDetails);
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ message: 'Error fetching workspace' });
  }
});

// Create new workspace
router.post('/', auth, (req, res) => {
  try {
    const { name, plan_type = 'personal' } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    // Check if user already has a workspace with this name
    const existingWorkspaces = db.getWorkspacesByOwner(req.user.id);
    const duplicateName = existingWorkspaces.find(w => 
      w.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicateName) {
      return res.status(400).json({ message: 'Workspace with this name already exists' });
    }

    // Limit number of workspaces based on subscription
    const maxWorkspaces = req.user.subscription_plan === 'pro' ? 10 : 3;
    if (existingWorkspaces.length >= maxWorkspaces) {
      return res.status(400).json({ 
        message: `Maximum ${maxWorkspaces} workspaces allowed for ${req.user.subscription_plan} plan` 
      });
    }

    const workspaceData = {
      name,
      owner_id: req.user.id,
      plan_type
    };

    const workspace = db.createWorkspace(workspaceData);
    res.status(201).json(workspace);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ message: 'Error creating workspace' });
  }
});

// Update workspace
router.put('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const { name, plan_type } = req.body;

    const userWorkspaces = db.getWorkspacesByOwner(req.user.id);
    const workspace = userWorkspaces.find(w => w.id === id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== workspace.name) {
      const duplicateName = userWorkspaces.find(w => 
        w.id !== id && w.name.toLowerCase() === name.toLowerCase()
      );

      if (duplicateName) {
        return res.status(400).json({ message: 'Workspace with this name already exists' });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (plan_type) updates.plan_type = plan_type;
    updates.updated_at = new Date().toISOString();

    // For simplicity, we'll update the workspace in memory
    // In a real database, you'd have an update method
    Object.assign(workspace, updates);

    res.json(workspace);
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ message: 'Error updating workspace' });
  }
});

// Delete workspace
router.delete('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const userWorkspaces = db.getWorkspacesByOwner(req.user.id);
    const workspace = userWorkspaces.find(w => w.id === id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if this is the user's only workspace
    if (userWorkspaces.length === 1) {
      return res.status(400).json({ message: 'Cannot delete your only workspace' });
    }

    // Get projects in this workspace
    const projects = db.getProjectsByWorkspace(id);
    
    if (projects.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete workspace with ${projects.length} projects. Please move or delete projects first.` 
      });
    }

    // For simplicity, we'll just mark it as deleted
    // In a real implementation, you'd properly delete from database
    workspace.deleted = true;
    workspace.deleted_at = new Date().toISOString();

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ message: 'Error deleting workspace' });
  }
});

// Get workspace statistics
router.get('/:id/stats', auth, (req, res) => {
  try {
    const { id } = req.params;
    const userWorkspaces = db.getWorkspacesByOwner(req.user.id);
    const workspace = userWorkspaces.find(w => w.id === id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const projects = db.getProjectsByWorkspace(id);
    
    // Calculate statistics
    const stats = {
      total_projects: projects.length,
      total_words: projects.reduce((sum, p) => sum + p.word_count, 0),
      completed_projects: projects.filter(p => p.status === 'completed').length,
      in_progress_projects: projects.filter(p => p.status === 'in_progress').length,
      draft_projects: projects.filter(p => p.status === 'draft').length,
      content_types: {}
    };

    // Count by content type
    projects.forEach(project => {
      if (!stats.content_types[project.content_type]) {
        stats.content_types[project.content_type] = 0;
      }
      stats.content_types[project.content_type]++;
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    stats.recent_activity = projects.filter(p => 
      new Date(p.updated_at) > sevenDaysAgo
    ).length;

    res.json(stats);
  } catch (error) {
    console.error('Get workspace stats error:', error);
    res.status(500).json({ message: 'Error fetching workspace statistics' });
  }
});

module.exports = router;