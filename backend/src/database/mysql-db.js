const { v4: uuidv4 } = require('uuid');
const { pool } = require('./mysql-config');

class MySQLDatabase {
  constructor() {
    this.pool = pool;
  }

  // User methods
  async getUserByEmail(email) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const user = {
        id: uuidv4(),
        ...userData,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.pool.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, avatar_url, 
         subscription_plan, subscription_status, subscription_expires_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id, user.email, user.password_hash, user.first_name, user.last_name,
          user.avatar_url, user.subscription_plan, user.subscription_status,
          user.subscription_expires_at, user.created_at, user.updated_at
        ]
      );

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Project methods
  async getProjectsByWorkspace(workspaceId) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at DESC',
        [workspaceId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting projects by workspace:', error);
      throw error;
    }
  }

  async getProjectById(id) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM projects WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting project by ID:', error);
      throw error;
    }
  }

  async createProject(projectData) {
    try {
      const project = {
        id: uuidv4(),
        ...projectData,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.pool.execute(
        `INSERT INTO projects (id, workspace_id, title, content_type, content, word_count, 
         status, metadata, created_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id, project.workspace_id, project.title, project.content_type,
          project.content, project.word_count, project.status,
          JSON.stringify(project.metadata || {}), project.created_by,
          project.created_at, project.updated_at
        ]
      );

      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(key === 'metadata' ? JSON.stringify(updateData[key]) : updateData[key]);
        }
      });

      if (fields.length === 0) return null;

      fields.push('updated_at = ?');
      values.push(new Date());
      values.push(id);

      await this.pool.execute(
        `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await this.getProjectById(id);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      const [result] = await this.pool.execute(
        'DELETE FROM projects WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  // Workspace methods
  async getWorkspacesByOwner(ownerId) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM workspaces WHERE owner_id = ? ORDER BY created_at DESC',
        [ownerId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting workspaces by owner:', error);
      throw error;
    }
  }

  async createWorkspace(workspaceData) {
    try {
      const workspace = {
        id: uuidv4(),
        ...workspaceData,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.pool.execute(
        'INSERT INTO workspaces (id, name, owner_id, plan_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [workspace.id, workspace.name, workspace.owner_id, workspace.plan_type, workspace.created_at, workspace.updated_at]
      );

      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  // Usage methods
  async getUsageByUser(userId) {
    try {
      // Get current period usage
      const [usageRows] = await this.pool.execute(
        `SELECT 
           resource_type,
           SUM(amount_used) as total_used
         FROM usage_logs 
         WHERE user_id = ? 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY resource_type`,
        [userId]
      );

      // Convert to the expected format
      const usage = {
        user_id: userId,
        words_generated: 0,
        words_limit: 50000,
        image_tokens: 0,
        image_limit: 500,
        video_minutes: 0,
        video_limit: 100,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      usageRows.forEach(row => {
        switch (row.resource_type) {
          case 'words':
            usage.words_generated = row.total_used;
            break;
          case 'images':
            usage.image_tokens = row.total_used;
            break;
          case 'video_minutes':
            usage.video_minutes = row.total_used;
            break;
        }
      });

      return usage;
    } catch (error) {
      console.error('Error getting usage by user:', error);
      throw error;
    }
  }

  async updateUsage(userId, usageData) {
    try {
      // Log usage entry
      const logId = uuidv4();
      
      if (usageData.words_generated) {
        await this.pool.execute(
          'INSERT INTO usage_logs (id, user_id, resource_type, amount_used, project_id) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), userId, 'words', usageData.words_generated, usageData.project_id || null]
        );
      }

      if (usageData.image_tokens) {
        await this.pool.execute(
          'INSERT INTO usage_logs (id, user_id, resource_type, amount_used, project_id) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), userId, 'images', usageData.image_tokens, usageData.project_id || null]
        );
      }

      if (usageData.video_minutes) {
        await this.pool.execute(
          'INSERT INTO usage_logs (id, user_id, resource_type, amount_used, project_id) VALUES (?, ?, ?, ?, ?)',
          [uuidv4(), userId, 'video_minutes', usageData.video_minutes, usageData.project_id || null]
        );
      }

      return await this.getUsageByUser(userId);
    } catch (error) {
      console.error('Error updating usage:', error);
      throw error;
    }
  }

  // Session methods
  async createSession(userId, tokenHash, expiresAt) {
    try {
      const sessionId = uuidv4();
      await this.pool.execute(
        'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
        [sessionId, userId, tokenHash, expiresAt]
      );
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSessionByToken(tokenHash) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()',
        [tokenHash]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting session by token:', error);
      throw error;
    }
  }

  async deleteSession(tokenHash) {
    try {
      await this.pool.execute(
        'DELETE FROM user_sessions WHERE token_hash = ?',
        [tokenHash]
      );
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new MySQLDatabase();