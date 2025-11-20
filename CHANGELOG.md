# Changelog

All notable changes to Proxmox Manager Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Container (LXC) management support
- Advanced monitoring and alerting
- Backup management interface
- API key authentication
- Two-factor authentication (2FA)
- Enhanced audit logging
- Mobile app

## [0.1.0] - 2025-11-20

### Added
- Initial public release
- Core virtual machine management (start, stop, restart, shutdown, reset)
- Real-time VM monitoring with auto-refresh every 30 seconds
- Multi-server Proxmox VE support
- User management with role-based access control (Admin, User, Readonly)
- Built-in authentication system with JWT
- White-label branding capabilities
  - Custom company name and logo
  - Favicon customization
  - Primary color theming
- First-run setup wizard
- Storage management and monitoring
- Activity logging
- Dark/light theme support
- CORS proxy server for secure Proxmox API communication
- Docker deployment support with Docker Compose
- Comprehensive test coverage (84%)
  - Vitest for unit and integration tests
  - Playwright for E2E tests
- Complete documentation
  - Deployment guide
  - Contributing guide
  - Security policy
  - Code of conduct

### Technical Stack
- React 18.3 with TypeScript 5.5
- Vite 5.4 build system
- Tailwind CSS 3.4 with Shadcn UI components
- TanStack Query 5.90 for state management
- React Router 6.26 for routing
- Express proxy server for CORS handling
- Optional PostgreSQL backend with Prisma ORM

### Security
- JWT-based authentication
- Password hashing with SHA-256 + salt
- Role-based permissions system
- CORS protection
- Secure setup wizard (no default credentials)
- Activity logging for audit trails

---

## Release Notes

### Version 0.1.0 - Initial Release

This is the first public release of Proxmox Manager Portal. The application provides a modern, secure web interface for managing Proxmox VE servers with the following key features:

**For Users:**
- Easy-to-use interface for VM management
- Multi-server support
- White-label branding options
- Secure authentication system
- Docker-based deployment

**For Developers:**
- Well-tested codebase (84% coverage)
- Modern tech stack
- Comprehensive documentation
- Easy contribution workflow
- Open source (MIT License)

**Known Limitations:**
- Container (LXC) management not yet supported
- No backup management interface
- Password hashing uses SHA-256 (bcrypt/argon2 migration planned)
- No two-factor authentication yet

**Upgrade Path:**
As this is the first release, there is no upgrade path. Future releases will include migration guides.

---

## How to Update

### Docker Deployment

```bash
cd /path/to/proxmox-manager-portal
git pull
docker-compose down
docker-compose up -d --build
```

### Manual Deployment

```bash
cd /path/to/proxmox-manager-portal
git pull
npm install
npm run build
pm2 restart all  # or restart your process manager
```

---

## Links

- [Documentation](docs/)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [License](LICENSE)

