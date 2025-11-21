# Proxmox Manager Portal

<div align="center">

![Proxmox Manager Portal](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**A modern, secure web-based management interface for Proxmox VE servers**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 📖 Overview

Proxmox Manager Portal is an open-source web application that provides a clean, modern interface for managing Proxmox Virtual Environment (VE) servers. Built with React, TypeScript, and Tailwind CSS, it offers real-time VM monitoring, user management with role-based access control, and white-label branding capabilities.

### Why Proxmox Manager Portal?

- **🎨 Modern UI**: Clean, responsive interface built with React and Shadcn UI
- **🔐 Secure by Default**: Built-in authentication, role-based access control, and secure setup wizard
- **🎯 Multi-Server**: Manage multiple Proxmox servers from a single interface
- **⚡ Real-Time**: Live VM status updates and resource monitoring
- **🎨 White-Label**: Customize branding with your own logo, colors, and company name
- **🐳 Easy Deploy**: Docker-based deployment with complete documentation
- **🧪 Well-Tested**: Comprehensive test coverage with Vitest and Playwright

## ✨ Features

### Core Functionality

- **Virtual Machine Management**
  - Real-time VM status monitoring
  - Start, stop, restart, and shutdown operations
  - Resource usage tracking (CPU, memory, disk, network)
  - VM console access integration

- **Multi-Server Support**
  - Manage multiple Proxmox VE servers
  - Server health monitoring
  - Connection testing and validation

- **User Management**
  - Role-based access control (Admin, User, Readonly)
  - User creation and management
  - Activity logging and audit trails

- **Storage Management**
  - View storage pools across servers
  - Monitor storage usage and capacity
  - Support for multiple storage types

### Security Features

- **Built-in Authentication System**: No external dependencies required
- **JWT-Based Sessions**: Secure token-based authentication
- **Password Hashing**: SHA-256 with salt (bcrypt/argon2 planned)
- **Role-Based Permissions**: Granular access control per user
- **CORS Proxy**: Built-in proxy server for secure API communication
- **Setup Wizard**: Secure first-run configuration

### Customization

- **White-Label Branding**
  - Custom company name and logo
  - Favicon customization
  - Primary color theming
  - Optional footer branding

- **Theme Support**
  - Light and dark mode
  - Persistent user preferences

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x to 22.x (Node 23+ not yet supported by all dependencies)
  - Recommended: Node.js 22 LTS
  - If using `nvm`: run `nvm use` to switch to the correct version
- **npm** 9+
- **Proxmox VE** 7.0+ server
- **Docker** (optional, for containerized deployment)

### Installation

#### Option 1: Docker Compose (Recommended)

The easiest way to get started with the full stack (PostgreSQL + Backend + Proxy + Frontend):

```bash
# Clone the repository
git clone https://github.com/waive-as/proxmox-manager.git
cd proxmox-manager

# Start all services (no .env file needed for testing!)
docker compose up -d

# Access at http://localhost:8080
```

**For production deployments**, create a `.env` file with secure credentials:
```bash
cp .env.example .env
# Edit .env and set secure passwords and JWT secrets
docker compose up -d
```

**What's included:**
- PostgreSQL database (persistent storage)
- Backend API server
- CORS proxy server
- React frontend
- Automatic health checks and restarts

#### Option 1b: Portainer (Great for GUI Management)

Deploy directly in Portainer without cloning the repository:

1. Open Portainer → Stacks → Add Stack
2. Paste the contents of `docker-compose.yml` from the repository
3. (Optional but recommended) Add environment variables:
   - `POSTGRES_PASSWORD` - Secure database password
   - `JWT_SECRET` - Random string (generate with `openssl rand -base64 32`)
   - `JWT_REFRESH_SECRET` - Another random string
   - `PORT` - Frontend port (default: 8080)
4. Click "Deploy the stack"
5. Access at `http://<your-server-ip>:8080`

The application works with default values for quick testing, but **always set custom secrets for production**!

#### Option 2: Local Development (Contributors)

For contributors who want to build from source and develop locally:

```bash
# Clone the repository
git clone https://github.com/waive-as/proxmox-manager.git
cd proxmox-manager

# Use the local development compose file
docker compose -f docker-compose.local.yml up -d

# Or run without Docker:
npm install
cd proxy-server && npm install && cd ..
npm run dev  # Frontend on http://localhost:8081
cd proxy-server && npm start  # Proxy on http://localhost:3001
```

### First-Run Setup

1. On first launch, you'll be redirected to the **Setup Wizard**
2. Create an admin account with your email and password
3. Configure your first Proxmox server connection
4. Start managing your VMs!

## 📚 Documentation

- **[Docker Guide](docs/DOCKER.md)** - Docker deployment and usage guide
- **[Installation & Setup](docs/DEPLOYMENT.md)** - Complete deployment guide
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Development Guide](CONTRIBUTING.md)** - Contributing and development workflow
- **[Architecture Guide](CLAUDE.md)** - Detailed technical documentation
- **[Security Policy](SECURITY.md)** - Security guidelines and vulnerability reporting
- **[API Documentation](docs/API.md)** - API endpoints and integration guide

## 🛠️ Technology Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Styling
- **Shadcn UI** - Component library
- **TanStack Query 5.90** - Server state management
- **React Router 6.26** - Routing
- **Zod** - Schema validation

### Backend & Proxy
- **Express** - API server and CORS proxy
- **Prisma** - ORM (optional backend)
- **PostgreSQL** - Production database (optional)
- **JWT** - Authentication tokens

### Testing
- **Vitest** - Unit and integration testing
- **Playwright** - E2E testing
- **React Testing Library** - Component testing
- **MSW** - API mocking

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     Proxmox Manager Container       │
│                                     │
│  ┌──────────────┐  ┌────────────┐  │
│  │   Frontend   │  │   Proxy    │  │    ┌─────────────────┐
│  │ (React SPA)  │◄─┤   Server   │◄─┼───►│  Proxmox Server │
│  │  Port 8080   │  │ Port 3001  │  │    │   (Port 8006)   │
│  └──────────────┘  └────────────┘  │    └─────────────────┘
│                                     │
└─────────────────────────────────────┘
         (Single Docker container)
```

The application uses a proxy server to handle CORS issues when communicating with Proxmox VE servers. This allows for secure API communication without requiring CORS configuration on your Proxmox servers.

## 🧪 Development

### Running Tests

```bash
# Unit tests
npm test                 # Watch mode
npm run test:run         # Run once
npm run test:coverage    # Coverage report

# E2E tests
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # With UI

# All tests
npm run test:all
```

### Building

```bash
# Development build
npm run build:dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Coding standards
- Testing requirements
- Pull request process

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
5. Push to your fork (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 🔒 Security

Security is a top priority. If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) for responsible disclosure.

### Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with salt
- ✅ Role-based access control
- ✅ CORS protection via proxy
- ✅ Secure setup wizard
- ✅ Activity logging

### Planned Security Enhancements

- 🔄 Migration to bcrypt/argon2 for password hashing
- 🔄 Two-factor authentication (2FA)
- 🔄 Rate limiting on auth endpoints
- 🔄 Enhanced audit logging
- 🔄 Content Security Policy (CSP) headers

## 📦 Deployment

### Production Deployment Options

1. **Docker Compose** (Recommended)
   - See [DEPLOYMENT.md](docs/DEPLOYMENT.md)
   - Includes PostgreSQL, backend, and frontend
   - SSL/TLS support with reverse proxy

2. **Standalone Build**
   ```bash
   npm run build
   npx serve -s dist
   ```

3. **Behind Reverse Proxy**
   - Nginx, Apache, or Traefik
   - See deployment docs for configuration examples

### Environment Variables

The application works with defaults, but you can customize with a `.env` file:

```env
# Optional frontend configuration
VITE_API_URL=http://localhost:3002/api
VITE_PROXY_URL=http://localhost:3001

# See .env.example for full list of options
```

## 📊 Project Status

- **Current Version**: 0.1.0
- **Status**: Production Ready
- **Test Coverage**: 84%
- **License**: MIT

### Roadmap

- [x] Core VM management
- [x] User authentication and RBAC
- [x] White-label branding
- [x] Docker deployment
- [x] Testing infrastructure
- [ ] Container management
- [ ] Advanced monitoring and alerts
- [ ] Backup management
- [ ] API key authentication
- [ ] Mobile app

See [ROADMAP.md](docs/ROADMAP.md) for detailed future plans.

## 🙏 Acknowledgments

- [Proxmox VE](https://www.proxmox.com/) - The amazing virtualization platform
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful component library
- [TanStack Query](https://tanstack.com/query/) - Powerful data synchronization
- All our [contributors](https://github.com/waive-as/proxmox-manager/graphs/contributors)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Community & Support

- **Issues**: [GitHub Issues](https://github.com/waive-as/proxmox-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/waive-as/proxmox-manager/discussions)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

<div align="center">

Made with ❤️ by the Proxmox Manager Portal community

[Report Bug](https://github.com/waive-as/proxmox-manager/issues) • [Request Feature](https://github.com/waive-as/proxmox-manager/issues) • [Documentation](docs/)

</div>
