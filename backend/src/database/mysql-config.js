const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'content_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };