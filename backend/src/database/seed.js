const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('./mysql-config');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Check if users already exist
    const [existingUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('📝 Database already has data, skipping seed');
      return;
    }

    // Create sample user
    const userId = uuidv4();
    const workspaceId = uuidv4();
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insert user
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, avatar_url, 
       subscription_plan, subscription_status, subscription_expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'john@example.com',
        hashedPassword,
        'John',
        'Doe',
        null,
        'pro',
        'active',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      ]
    );

    // Insert workspace
    await pool.execute(
      'INSERT INTO workspaces (id, name, owner_id, plan_type) VALUES (?, ?, ?, ?)',
      [workspaceId, 'Personal Workspace', userId, 'personal']
    );

    // Insert sample projects
    const projects = [
      {
        id: uuidv4(),
        workspace_id: workspaceId,
        title: 'Blog Post: AI Trends 2024',
        content_type: 'article',
        content: 'Sample article content about AI trends...',
        word_count: 1250,
        status: 'completed',
        created_by: userId
      },
      {
        id: uuidv4(),
        workspace_id: workspaceId,
        title: 'Social Media Campaign',
        content_type: 'social_post',
        content: 'Sample social media content...',
        word_count: 450,
        status: 'in_progress',
        created_by: userId
      }
    ];

    for (const project of projects) {
      await pool.execute(
        `INSERT INTO projects (id, workspace_id, title, content_type, content, word_count, 
         status, metadata, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id,
          project.workspace_id,
          project.title,
          project.content_type,
          project.content,
          project.word_count,
          project.status,
          JSON.stringify({}),
          project.created_by
        ]
      );
    }

    // Insert sample usage logs
    await pool.execute(
      'INSERT INTO usage_logs (id, user_id, resource_type, amount_used) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, 'words', 24567]
    );
    
    await pool.execute(
      'INSERT INTO usage_logs (id, user_id, resource_type, amount_used) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, 'images', 156]
    );

    await pool.execute(
      'INSERT INTO usage_logs (id, user_id, resource_type, amount_used) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, 'video_minutes', 42]
    );

    console.log('✅ Database seeded successfully!');
    console.log('👤 Sample user created:');
    console.log('   Email: john@example.com');
    console.log('   Password: password123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };