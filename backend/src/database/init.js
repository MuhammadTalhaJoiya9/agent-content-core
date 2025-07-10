import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
let db;

export function getDatabase() {
  if (!db) {
    const dbPath = process.env.DATABASE_URL || './database.sqlite';
    db = new sqlite3.Database(dbPath);
    
    // Promisify database methods
    db.runAsync = promisify(db.run.bind(db));
    db.getAsync = promisify(db.get.bind(db));
    db.allAsync = promisify(db.all.bind(db));
  }
  return db;
}

export async function initializeDatabase() {
  const database = getDatabase();
  
  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements and execute them
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await database.runAsync(statement);
      }
    }
    
    console.log('Database schema initialized successfully');
    
    // Check if we need to seed data
    const userCount = await database.getAsync('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('No users found, creating demo user...');
      await seedDemoData();
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function seedDemoData() {
  const database = getDatabase();
  const bcrypt = await import('bcryptjs');
  
  try {
    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    await database.runAsync(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, subscription_plan, subscription_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'demo-user-id',
      'demo@example.com',
      hashedPassword,
      'Demo',
      'User',
      'free',
      'active'
    ]);
    
    // Create demo workspace
    await database.runAsync(`
      INSERT INTO workspaces (id, name, owner_id, plan_type)
      VALUES (?, ?, ?, ?)
    `, [
      'demo-workspace-id',
      'Demo Workspace',
      'demo-user-id',
      'personal'
    ]);
    
    // Create demo project
    await database.runAsync(`
      INSERT INTO projects (id, workspace_id, title, content_type, content, word_count, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'demo-project-id',
      'demo-workspace-id',
      'Welcome to AI Content Agent',
      'article',
      'This is your first project! Start creating amazing content with AI assistance.',
      15,
      'completed',
      'demo-user-id'
    ]);
    
    console.log('Demo data seeded successfully');
    console.log('Demo login: demo@example.com / demo123');
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}