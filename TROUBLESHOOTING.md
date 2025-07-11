# Troubleshooting Guide

This guide addresses common issues with database connections, Docker port conflicts, and environment variable setup.

## 🔧 Quick Fix Checklist

### 1. Database Connection Issues

**Problem**: `Access denied for user 'root'@'localhost'`

**Solution**:
1. Ensure the `.env` file exists in the `backend/` directory
2. Check that credentials match the docker-compose.yml configuration
3. Verify Docker containers are running

```bash
# Check if .env file exists
ls -la backend/.env

# Verify Docker containers are running
cd backend && docker-compose ps

# Check container logs
docker-compose logs mysql
```

### 2. Port Conflicts

**Problem**: `Port 3306 is already in use`

**Solution**:
```bash
# Check what's using port 3306
sudo lsof -i :3306

# Stop local MySQL service if running
sudo systemctl stop mysql
# or on macOS: brew services stop mysql

# Check Docker port conflicts
docker ps -a | grep 3306
```

**Alternative**: Change ports in docker-compose.yml:
```yaml
ports:
  - "3307:3306"  # Use port 3307 instead
```

Then update your `.env` file:
```env
DB_PORT=3307
```

### 3. Environment Variables Setup

**Problem**: Missing or incorrect environment variables

**Solution**:
1. Copy the example file: `cp backend/.env.example backend/.env`
2. Use the correct credentials from docker-compose.yml
3. Never commit .env files to version control

**Correct .env configuration**:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=content_platform
DB_USER=app_user
DB_PASSWORD=Hacker!@#123123
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🐳 Docker Setup Process

### Step 1: Start Docker Services
```bash
cd backend
docker-compose up -d
```

### Step 2: Verify Services Are Running
```bash
docker-compose ps
```

Expected output:
```
Name                     Command               State           Ports
------------------------------------------------------------------------
content_platform_mysql        docker-entrypoint.sh mysqld    Up      0.0.0.0:3306->3306/tcp
content_platform_phpmyadmin   /docker-entrypoint.sh apac ...   Up      0.0.0.0:8080->80/tcp
```

### Step 3: Test Database Connection
```bash
# Test with mysql client
mysql -h localhost -u app_user -p content_platform
# Password: Hacker!@#123123

# Or test with phpMyAdmin
# Visit: http://localhost:8080
# Server: mysql, Username: app_user, Password: Hacker!@#123123
```

## 🛠️ Common Fix Commands

### Reset Everything
```bash
# Stop all containers
cd backend && docker-compose down -v

# Remove all containers and volumes
docker-compose down -v --remove-orphans

# Start fresh
docker-compose up -d
```

### Check Container Health
```bash
# View container logs
docker-compose logs mysql
docker-compose logs phpmyadmin

# Execute commands in container
docker-compose exec mysql mysql -u root -p
```

### Database Connection Test
```bash
# From backend directory
cd backend
npm install
npm run dev
```

Look for these success messages:
- `✅ MySQL Database connected successfully`
- `🚀 Server is running on port 3001`

## 🔍 Debug Steps

### 1. Check File Permissions
```bash
# Ensure .env file is readable
ls -la backend/.env
chmod 644 backend/.env
```

### 2. Verify Docker Installation
```bash
docker --version
docker-compose --version
```

### 3. Check Network Connectivity
```bash
# Test if MySQL port is accessible
telnet localhost 3306
# or
nc -zv localhost 3306
```

### 4. Environment Variable Loading
Add debug logging to your server.js:
```javascript
// Add this after require('dotenv').config()
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
```

## 🚨 Error Messages and Solutions

### "ECONNREFUSED"
- **Cause**: MySQL server is not running
- **Fix**: Start Docker containers with `docker-compose up -d`

### "Access denied for user"
- **Cause**: Wrong credentials in .env file
- **Fix**: Check credentials match docker-compose.yml

### "Unknown database"
- **Cause**: Database doesn't exist
- **Fix**: Restart containers to reinitialize database

### "Port already in use"
- **Cause**: Another service is using the port
- **Fix**: Change port in docker-compose.yml or stop conflicting service

## 📋 Verification Checklist

- [ ] `.env` file exists in backend/ directory
- [ ] Credentials in .env match docker-compose.yml
- [ ] Docker containers are running (`docker-compose ps`)
- [ ] Ports 3306 and 8080 are available
- [ ] Database connection test passes
- [ ] Backend server starts successfully

## 🔐 Security Notes

- Never commit .env files to version control
- Use strong, unique passwords in production
- Change default JWT secret
- Enable SSL for production database connections
- Restrict database access to application servers only

## 📞 Additional Help

If issues persist:
1. Check Docker container logs: `docker-compose logs`
2. Verify database exists: Connect to phpMyAdmin at http://localhost:8080
3. Test backend endpoint: `curl http://localhost:3001/health`
4. Check network connectivity between containers