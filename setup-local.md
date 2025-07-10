# Complete Local Development Setup Guide

## Project Overview
This is a full-stack content platform with:
- **Frontend**: React + TypeScript + Vite (port 5173)
- **Backend**: Node.js + Express API (port 3001)
- **Database**: MySQL 8.0 (port 3306)
- **Database Admin**: phpMyAdmin (port 8080)

## ✅ Prerequisites (Already Set Up)
- ✅ Docker installed and running
- ✅ Node.js installed
- ✅ MySQL database running via Docker
- ✅ Dependencies installed

## 🚀 Quick Start (3 terminals needed)

### Terminal 1: Database (Already Running)
```bash
cd backend
sudo docker compose up -d
```
- MySQL: http://localhost:3306
- phpMyAdmin: http://localhost:8080 (root/rootpassword)

### Terminal 2: Backend API Server
```bash
cd backend
npm run dev
```
This starts the API server on **http://localhost:3001**

### Terminal 3: Frontend Development Server
```bash
npm run dev
```
This starts the React app on **http://localhost:8082** (Vite auto-selects available port)

## 🌐 Access Your Application

### Main Application
- **Frontend**: http://localhost:8082 (or check terminal output for exact port)
- **Backend API**: http://localhost:3001

### Database Management
- **phpMyAdmin**: http://localhost:8080
  - Server: `mysql`
  - Username: `root`  
  - Password: `rootpassword`

### Sample Login Credentials
- **Email**: john@example.com
- **Password**: password123

## 🔧 Environment Configuration

### Backend (.env file already created)
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=content_platform
DB_USER=app_user
DB_PASSWORD=app_password
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key-here
```

## 📁 Project Structure
```
/
├── src/                    # Frontend React code
├── backend/                # Backend Node.js API
│   ├── src/
│   │   ├── server.js      # Main server file
│   │   ├── database/      # DB migrations & config
│   │   ├── routes/        # API endpoints
│   │   └── middleware/    # Auth & other middleware
│   ├── .env              # Environment variables
│   └── docker-compose.yml # Database setup
├── package.json           # Frontend dependencies
└── README.md
```

## 🐛 Troubleshooting

### Frontend Not Loading
```bash
# Make sure you're in the root directory
pwd  # Should show /workspace
npm run dev
```

### Backend Not Starting
```bash
cd backend
npm run dev
```

### Database Connection Issues
```bash
cd backend
sudo docker compose down
sudo docker compose up -d
npm run db:setup
```

### Check What's Running
```bash
ps aux | grep -E "(node|vite)" | grep -v grep
```

### Reset Everything
```bash
# Stop all services
cd backend
sudo docker compose down

# Restart database
sudo docker compose up -d

# Restart backend
npm run dev

# In another terminal, restart frontend
cd ..
npm run dev
```

## 🎯 Development Workflow

1. **Start Database**: `cd backend && sudo docker compose up -d`
2. **Start Backend**: `cd backend && npm run dev`
3. **Start Frontend**: `npm run dev` (from root)
4. **Open Browser**: http://localhost:5173

## 📊 Database Schema
- **users** - User accounts and subscriptions
- **workspaces** - User workspaces
- **projects** - Content projects
- **usage_logs** - Usage tracking
- **user_sessions** - Authentication
- **generated_content** - AI content history

## 🔗 API Endpoints
- `GET /health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project

## 🚨 Common Issues

1. **Port Already in Use**: Kill processes using `pkill -f node` or `pkill -f vite`
2. **Permission Denied**: Use `sudo` for Docker commands
3. **Module Not Found**: Run `npm install` in both root and backend directories
4. **Database Error**: Restart Docker containers and run migrations

Your application should now be running on http://localhost:8082!