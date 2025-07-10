const { v4: uuidv4 } = require('uuid');

// Simple in-memory database for development
// In production, you'd want to use a real database like PostgreSQL, MySQL, or MongoDB

class Database {
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.workspaces = new Map();
    this.usage = new Map();
    
    // Initialize with some mock data
    this.initMockData();
  }

  initMockData() {
    // Create a default user
    const userId = uuidv4();
    const workspaceId = uuidv4();
    
    this.users.set(userId, {
      id: userId,
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      password_hash: '$2a$10$example.hash', // In real app, this would be properly hashed
      avatar_url: null,
      subscription_plan: 'pro',
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    this.workspaces.set(workspaceId, {
      id: workspaceId,
      name: 'Personal Workspace',
      owner_id: userId,
      plan_type: 'personal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    this.usage.set(userId, {
      user_id: userId,
      words_generated: 24567,
      words_limit: 50000,
      image_tokens: 156,
      image_limit: 500,
      video_minutes: 42,
      video_limit: 100,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Add some sample projects
    const projects = [
      {
        id: uuidv4(),
        workspace_id: workspaceId,
        title: 'Blog Post: AI Trends 2024',
        content_type: 'article',
        content: 'Sample article content...',
        word_count: 1250,
        status: 'completed',
        metadata: {},
        created_by: userId,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        workspace_id: workspaceId,
        title: 'Social Media Campaign',
        content_type: 'social_post',
        content: 'Sample social media content...',
        word_count: 450,
        status: 'in_progress',
        metadata: {},
        created_by: userId,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      }
    ];

    projects.forEach(project => this.projects.set(project.id, project));
  }

  // User methods
  getUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  getUserById(id) {
    return this.users.get(id);
  }

  createUser(userData) {
    const user = {
      id: uuidv4(),
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.users.set(user.id, user);
    return user;
  }

  // Project methods
  getProjectsByWorkspace(workspaceId) {
    return Array.from(this.projects.values()).filter(project => project.workspace_id === workspaceId);
  }

  getProjectById(id) {
    return this.projects.get(id);
  }

  createProject(projectData) {
    const project = {
      id: uuidv4(),
      ...projectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.projects.set(project.id, project);
    return project;
  }

  updateProject(id, updateData) {
    const project = this.projects.get(id);
    if (!project) return null;
    
    const updatedProject = {
      ...project,
      ...updateData,
      updated_at: new Date().toISOString()
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  deleteProject(id) {
    return this.projects.delete(id);
  }

  // Workspace methods
  getWorkspacesByOwner(ownerId) {
    return Array.from(this.workspaces.values()).filter(workspace => workspace.owner_id === ownerId);
  }

  createWorkspace(workspaceData) {
    const workspace = {
      id: uuidv4(),
      ...workspaceData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  // Usage methods
  getUsageByUser(userId) {
    return this.usage.get(userId);
  }

  updateUsage(userId, usageData) {
    const currentUsage = this.usage.get(userId) || {
      user_id: userId,
      words_generated: 0,
      words_limit: 50000,
      image_tokens: 0,
      image_limit: 500,
      video_minutes: 0,
      video_limit: 100,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const updatedUsage = { ...currentUsage, ...usageData };
    this.usage.set(userId, updatedUsage);
    return updatedUsage;
  }
}

// Export singleton instance
module.exports = new Database();