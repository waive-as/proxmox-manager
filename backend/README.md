# Proxmox Manager Backend

A Node.js/Express TypeScript backend API for the Proxmox Manager Portal.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (optional, currently using mock data)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models (when implemented)
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── dist/                # Compiled JavaScript (after build)
├── .env                 # Environment variables
├── env.example          # Environment variables template
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:8081` |

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Servers
- `GET /api/servers` - Get user's Proxmox servers
- `GET /api/servers/:id` - Get server details
- `POST /api/servers` - Create new server
- `PUT /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server
- `POST /api/servers/:id/test` - Test server connection

### Proxmox
- `GET /api/proxmox/servers/:serverId/nodes` - Get Proxmox nodes
- `GET /api/proxmox/servers/:serverId/vms` - Get VMs
- `GET /api/proxmox/servers/:serverId/vms/:vmid` - Get VM details
- `POST /api/proxmox/servers/:serverId/vms/:vmid/start` - Start VM
- `POST /api/proxmox/servers/:serverId/vms/:vmid/stop` - Stop VM
- `POST /api/proxmox/servers/:serverId/vms/:vmid/restart` - Restart VM

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🎯 Features

- **JWT Authentication** - Secure token-based auth
- **Role-based Access Control** - Admin, readonly, user roles
- **Proxmox API Integration** - Direct Proxmox server communication
- **Input Validation** - Zod schema validation
- **Error Handling** - Centralized error handling
- **Rate Limiting** - Request rate limiting
- **CORS Support** - Cross-origin resource sharing
- **TypeScript** - Full type safety

## 🚧 Current Status

This is a **mock implementation** with in-memory data storage. To make it production-ready:

1. **Database Integration** - Replace mock data with PostgreSQL + Prisma
2. **Real Proxmox API** - Implement actual Proxmox communication
3. **Password Reset** - Complete forgot/reset password flow
4. **Audit Logging** - Add comprehensive audit trails
5. **Email Service** - Add email notifications
6. **File Upload** - Add file upload capabilities
7. **WebSocket Support** - Real-time VM status updates

## 🔄 Next Steps

1. Set up PostgreSQL database
2. Implement Prisma ORM
3. Add real Proxmox API integration
4. Implement password reset flow
5. Add comprehensive testing
6. Set up CI/CD pipeline

## 📝 License

MIT License - see LICENSE file for details
