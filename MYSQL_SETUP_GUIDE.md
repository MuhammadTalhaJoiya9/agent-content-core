# MySQL Database Setup Guide

This guide will help you set up MySQL database for your content platform project.

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed on your system

### 1. Start MySQL with Docker Compose

```bash
cd backend
docker-compose up -d
```

This will start:
- MySQL 8.0 server on port 3306
- phpMyAdmin on port 8080 (optional database management tool)

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

The `.env` file is already configured for the Docker setup:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=content_platform
DB_USER=app_user
DB_PASSWORD=Hacker!@#123123
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Run Migrations and Seed Data

```bash
npm run db:setup
```

This command will:
- Create all necessary tables
- Insert sample data for testing

### 5. Start the Backend Server

```bash
npm run dev
```

You should see:
```
✅ MySQL Database connected successfully
🚀 Starting database migrations...
✅ Migration 001_initial_schema.sql completed
🎉 All migrations completed successfully!
🌱 Seeding database with sample data...
✅ Database seeded successfully!
👤 Sample user created:
   Email: john@example.com
   Password: password123
🚀 Server is running on port 3001
📱 Frontend should connect to: http://localhost:3001/api
🗄️ MySQL Database connected and migrations completed
```

## 🐘 Manual MySQL Setup

If you prefer to install MySQL manually:

### 1. Install MySQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS (with Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Windows:**
Download and install from [MySQL official website](https://dev.mysql.com/downloads/mysql/)

### 2. Create Database and User

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE content_platform;

-- Create user and grant privileges
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'Hacker!@#123123';
GRANT ALL PRIVILEGES ON content_platform.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 3. Update Environment Configuration

Update your `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=content_platform
DB_USER=app_user
DB_PASSWORD=Hacker!@#123123
```

### 4. Follow steps 2-5 from the Docker setup above

## 📊 Database Schema Overview

The database includes the following tables:

- **users** - User accounts and subscription information
- **workspaces** - User workspaces for organizing projects
- **projects** - Content projects (articles, social posts, etc.)
- **usage_logs** - Usage tracking for billing and limits
- **user_sessions** - JWT session management
- **generated_content** - AI-generated content history

## 🛠️ Available Commands

```bash
# Run migrations only
npm run migrate

# Seed database with sample data
npm run seed

# Setup database (migrate + seed)
npm run db:setup

# Reset database (migrate + seed)
npm run db:reset

# Start development server
npm run dev

# Start production server
npm start
```

## 🔧 Database Management

### Using phpMyAdmin (with Docker setup)
- Open http://localhost:8080 in your browser
- Login with:
  - Server: mysql
  - Username: root
  - Password: rootpassword

### Using MySQL Command Line
```bash
# Connect to database
mysql -h localhost -u app_user -p content_platform

# View tables
SHOW TABLES;

# View table structure
DESCRIBE users;

# View sample data
SELECT * FROM users LIMIT 5;
```

## 🐛 Troubleshooting

### Connection Issues

1. **"Access denied for user"**
   - Check your `.env` file credentials
   - Ensure the MySQL user exists and has proper privileges

2. **"connect ECONNREFUSED"**
   - Ensure MySQL is running
   - Check if the port (3306) is correct and not blocked

3. **"Unknown database"**
   - Create the database manually: `CREATE DATABASE content_platform;`

### Docker Issues

1. **Port 3306 already in use**
   ```bash
   # Check what's using the port
   lsof -i :3306
   
   # Stop local MySQL service
   sudo service mysql stop
   ```

2. **Container won't start**
   ```bash
   # Check container logs
   docker-compose logs mysql
   
   # Restart containers
   docker-compose down
   docker-compose up -d
   ```

## 🔄 Migration Management

### Creating New Migrations

1. Create a new SQL file in `backend/src/database/migrations/`
2. Use naming convention: `002_description.sql`, `003_description.sql`, etc.
3. Run migrations: `npm run migrate`

### Example Migration File

```sql
-- 002_add_user_preferences.sql
ALTER TABLE users ADD COLUMN preferences JSON DEFAULT '{}';
CREATE INDEX idx_users_preferences ON users(preferences);
```

## 🚀 Production Deployment

### Environment Variables

Set these environment variables in production:

```env
DB_HOST=your-production-db-host
DB_PORT=3306
DB_NAME=content_platform
DB_USER=your-production-user
DB_PASSWORD=Hacker!@#123123
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Security Considerations

1. **Use strong passwords** for database users
2. **Enable SSL/TLS** for database connections
3. **Restrict database access** to application servers only
4. **Regular backups** of your database
5. **Monitor database performance** and usage

### Connection Pooling

The application uses connection pooling by default with these settings:
- Connection limit: 10
- Queue limit: 0
- Acquire timeout: 60 seconds
- Reconnect: enabled

Adjust these in `backend/src/database/mysql-config.js` for production needs.

## 📈 Performance Tips

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Connection Pooling**: Enabled by default for better performance
3. **Prepared Statements**: Used throughout for security and performance
4. **JSON Columns**: Used for flexible metadata storage

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your MySQL installation and configuration
3. Check application logs for detailed error messages
4. Ensure all dependencies are installed correctly

The sample user credentials for testing:
- **Email**: john@example.com
- **Password**: password123