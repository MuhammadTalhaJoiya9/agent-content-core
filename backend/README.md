# AI Content Agent Backend

A comprehensive Node.js backend API for the AI Content Agent application, providing authentication, project management, usage tracking, and AI content generation capabilities.

## Features

- **Authentication & Authorization**: JWT-based auth with session management
- **Project Management**: CRUD operations for content projects
- **Workspace Management**: Multi-workspace support for organization
- **Usage Tracking**: Monitor and limit resource consumption
- **AI Content Generation**: Text and image generation with mock AI services
- **Rate Limiting**: Protect against abuse
- **Security**: Helmet, CORS, input validation
- **Database**: SQLite with comprehensive schema

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Demo Account

A demo account is automatically created:
- **Email**: demo@example.com
- **Password**: demo123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Workspaces
- `GET /api/workspaces` - Get all workspaces
- `GET /api/workspaces/:id` - Get single workspace
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `GET /api/workspaces/:id/stats` - Get workspace statistics

### Usage & Analytics
- `GET /api/usage/current` - Get current usage stats
- `POST /api/usage/log` - Log resource usage
- `GET /api/usage/history` - Get usage history
- `GET /api/usage/analytics` - Get usage analytics
- `POST /api/usage/check-limit` - Check usage limits

### Content Generation
- `POST /api/content/generate-text` - Generate text content
- `POST /api/content/generate-image` - Generate image content
- `GET /api/content/history` - Get generation history
- `GET /api/content/:id` - Get single generated content
- `DELETE /api/content/:id` - Delete generated content

## Database Schema

The application uses SQLite with the following main tables:

- **users** - User accounts and subscription info
- **workspaces** - Organization workspaces
- **projects** - Content projects
- **usage_logs** - Resource usage tracking
- **user_sessions** - JWT session management
- **generated_content** - AI-generated content history

## Usage Limits

### Free Plan
- Words: 10,000/month
- Images: 50/month
- Video: 10 minutes/month

### Pro Plan
- Words: 100,000/month
- Images: 500/month
- Video: 100 minutes/month

### Enterprise Plan
- Words: 1,000,000/month
- Images: 5,000/month
- Video: 1,000 minutes/month

## AI Integration

Currently uses mock AI services. To integrate real AI:

1. **OpenAI Integration**: Add your OpenAI API key to `.env`
2. **Text Generation**: Replace mock function in `src/routes/content.js`
3. **Image Generation**: Integrate DALL-E or Stable Diffusion

Example OpenAI integration:
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateTextContent(prompt, type) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
  });
  
  return {
    content: response.choices[0].message.content,
    tokens_used: response.usage.total_tokens
  };
}
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Express-validator
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs
- **SQL Injection Protection**: Parameterized queries

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with demo data

### Project Structure
```
backend/
├── src/
│   ├── database/
│   │   ├── init.js          # Database initialization
│   │   └── schema.sql       # Database schema
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   ├── errorHandler.js  # Error handling
│   │   ├── requestLogger.js # Request logging
│   │   └── validation.js    # Input validation
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── content.js       # Content generation routes
│   │   ├── projects.js      # Project management routes
│   │   ├── usage.js         # Usage tracking routes
│   │   └── workspaces.js    # Workspace management routes
│   └── server.js            # Main server file
├── .env                     # Environment variables
├── .env.example             # Environment template
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=./database.sqlite

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# OpenAI API Key (optional)
OPENAI_API_KEY=your-openai-api-key

# CORS Origins
CORS_ORIGINS=http://localhost:8080,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production database (PostgreSQL recommended)
3. Set up proper logging
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure monitoring and health checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details