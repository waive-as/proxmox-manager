# Architecture Guide

This document provides an overview of the Proxmox Manager Portal architecture, design decisions, and technical implementation details.

## System Overview

Proxmox Manager Portal is a single-page application (SPA) that provides a web-based interface for managing Proxmox VE servers. The application follows a modern, layered architecture with clear separation of concerns.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Client                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React SPA (Port 8081)                        │   │
│  │  - React Router for navigation                       │   │
│  │  - TanStack Query for data fetching                  │   │
│  │  - Shadcn UI components                              │   │
│  │  - Context API for global state                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Proxy Server (Port 3001)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Express.js CORS Proxy                        │   │
│  │  - Handles CORS for Proxmox API                      │   │
│  │  - Server registration                               │   │
│  │  - SSL certificate handling                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Proxmox VE Server(s) (Port 8006)             │
│  - VM Management API                                         │
│  - Storage Management API                                    │
│  - Node Information API                                      │
└─────────────────────────────────────────────────────────────┘
```

### Optional Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Port 3002)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Express.js REST API                       │   │
│  │  - User authentication (JWT)                         │   │
│  │  - User management                                   │   │
│  │  - Activity logging                                  │   │
│  │  - Prisma ORM for database access                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database (Port 5432)             │
│  - User accounts and credentials                             │
│  - Activity logs                                             │
│  - Application settings                                      │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

- **React 18.3**: Core UI framework
- **TypeScript 5.5**: Static typing
- **Vite 5.4**: Build tool and dev server
- **TanStack Query 5.90**: Server state management
- **React Router 6.26**: Client-side routing
- **Tailwind CSS 3.4**: Utility-first styling
- **Shadcn UI**: Component library built on Radix UI

### Directory Structure

```
src/
├── components/         # React components
│   ├── ui/            # Shadcn UI primitives
│   ├── layout/        # Layout components (Navbar, Sidebar)
│   ├── vm/            # VM-specific components
│   ├── users/         # User management components
│   └── settings/      # Settings components
├── context/           # React Context providers
│   ├── AuthContext.tsx         # Authentication state
│   └── WhiteLabelContext.tsx   # Branding configuration
├── hooks/             # Custom React hooks
├── pages/             # Page-level components (routes)
├── services/          # API service layer
├── lib/               # Utilities and configurations
├── types/             # TypeScript type definitions
└── test/              # Test setup and utilities
```

### State Management Strategy

The application uses a hybrid state management approach:

1. **Server State** (TanStack Query)
   - All data from Proxmox API
   - Automatic caching and revalidation
   - 30-second auto-refresh for VM data
   - Optimistic updates

2. **Global Client State** (React Context)
   - Authentication state (`AuthContext`)
   - White-label configuration (`WhiteLabelContext`)
   - Theme preferences

3. **Local Component State** (useState)
   - UI-specific state (modals, forms, etc.)
   - Temporary user interactions

4. **Persistent State** (localStorage)
   - Authentication tokens
   - User preferences
   - Server configurations
   - White-label settings

### Context Provider Hierarchy

The application enforces a specific provider nesting order:

```typescript
QueryClientProvider          // TanStack Query client
└─ ThemeProvider            // Dark/light mode
   └─ WhiteLabelProvider    // Branding config
      └─ BrowserRouter      // React Router
         └─ AuthProvider    // User authentication
            └─ App          // Application routes
```

This order ensures:
- Query client is available everywhere
- Theme loads before any rendering
- White-label config applies before auth UI
- Auth wraps all protected routes

### Routing Strategy

- **Public Routes**: `/`, `/login`, `/signup`, `/setup`
- **Protected Routes**: All dashboard pages wrapped with `<ProtectedRoute>`
- **First-Run Flow**: `SetupCheck` component redirects to `/setup` if no admin exists
- **Layout Wrapper**: `<Layout>` component provides consistent sidebar/navbar

## Proxy Server Architecture

### Purpose

The proxy server solves CORS (Cross-Origin Resource Sharing) issues when the frontend needs to communicate with Proxmox VE servers that don't have CORS headers configured.

### Implementation

- **Framework**: Express.js
- **Port**: 3001
- **Features**:
  - Request forwarding to Proxmox servers
  - CORS header injection
  - SSL certificate handling
  - In-memory server registration (development)
  - Request/response logging

### Flow

```
Client Request → Proxy Server → Proxmox API
                ↓
         Add CORS headers
         Handle SSL certs
                ↓
Client Response ← Proxy Server ← Proxmox Response
```

## Authentication & Authorization

### Authentication Flow

1. User visits app → `SetupCheck` verifies admin exists
2. If no admin → Redirect to `/setup` → Create admin account
3. User enters credentials → `authService.login()`
4. Validate credentials against localStorage (or backend)
5. Generate JWT token → Store in localStorage
6. Store user object in `AuthContext`
7. `ProtectedRoute` checks authentication on route access
8. Axios interceptor adds token to all API requests

### Authorization Levels

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: manage users, servers, VMs, settings |
| **User** | Manage VMs, view servers, view users |
| **Readonly** | View-only access to VMs and servers |

### Permission Checking

```typescript
// Hook-based permission checks
const { canManageUsers, canControlVMs } = usePermissions();

// Component-level enforcement
{canManageUsers && <UserManagementButton />}

// Service-level enforcement (backend)
if (user.role !== 'admin') throw new ForbiddenError();
```

## Data Flow

### Typical VM Operation Flow

```
1. User clicks "Start VM" button
   ↓
2. Component calls startVM() from proxmoxService
   ↓
3. Service makes HTTP request through proxy
   ↓
4. Proxy forwards to Proxmox API
   ↓
5. Proxmox processes request
   ↓
6. Response flows back through proxy
   ↓
7. React Query updates cache
   ↓
8. UI automatically re-renders with new state
```

### React Query Configuration

```typescript
{
  queryKey: ['vms', serverId],      // Cache key
  queryFn: () => getVMs(serverId),  // Fetch function
  refetchInterval: 30000,            // Auto-refresh every 30s
  staleTime: 25000,                  // Data fresh for 25s
  cacheTime: 300000,                 // Keep in cache 5 minutes
}
```

## White-Label System

### Architecture

The white-label system allows complete UI customization:

- **Storage**: localStorage (`whiteLabel` key)
- **State**: `WhiteLabelContext` provider
- **Service**: `whiteLabelService` for persistence
- **Application**: Dynamic theme variables, logo/favicon updates

### Customizable Elements

1. **Company Name**: Updates `document.title` and navbar
2. **Logo**: Base64-encoded image in localStorage
3. **Favicon**: Base64-encoded icon, dynamically injected
4. **Primary Color**: CSS variable `--primary` updates
5. **Footer Branding**: Optional "Powered by" text

### Implementation

```typescript
// Service stores config
localStorage.setItem('whiteLabel', JSON.stringify(config));

// Context loads on mount
const config = whiteLabelService.getConfig();

// Apply branding
document.title = config.companyName;
document.documentElement.style.setProperty('--primary', config.primaryColor);
```

## Testing Architecture

### Test Layers

1. **Unit Tests** (Vitest)
   - Services, utilities, hooks
   - Pure logic without UI
   - Located: `src/**/__tests__/`

2. **Component Tests** (React Testing Library)
   - Component behavior
   - User interactions
   - Located: `src/components/__tests__/`

3. **E2E Tests** (Playwright)
   - Complete user flows
   - Auth, VM management, user management
   - Located: `e2e/`

### Test Configuration

- **Setup**: `src/test/setup.ts` (globals, mocks)
- **Coverage**: 80% minimum for lines/functions/branches/statements
- **Mocking**: MSW (Mock Service Worker) for API responses

## Performance Considerations

### Optimizations

1. **Code Splitting**: React Router lazy loading
2. **Image Optimization**: Base64 encoding for logos/favicons
3. **Query Caching**: TanStack Query reduces API calls
4. **Debouncing**: Search/filter inputs debounced
5. **Virtualization**: Large lists use virtual scrolling (when needed)

### Monitoring

- React Query DevTools in development
- Browser Performance API for metrics
- Lighthouse audits for production builds

## Security Architecture

### Current Implementation

- **Authentication**: JWT tokens in localStorage
- **Password Storage**: SHA-256 with salt (migration to bcrypt planned)
- **HTTPS**: Recommended for production
- **CORS**: Handled by proxy server
- **XSS Protection**: React auto-escapes, CSP headers planned
- **CSRF**: Token-based protection (when using backend)

### Security Layers

```
1. Network Layer
   └─ HTTPS encryption
   └─ Firewall rules

2. Application Layer
   └─ JWT verification
   └─ Role-based permissions
   └─ Input validation (Zod schemas)

3. Data Layer
   └─ Password hashing
   └─ SQL injection prevention (Prisma ORM)
   └─ Sensitive data encryption
```

## Deployment Architecture

### Docker Composition

```yaml
services:
  frontend:
    - Built from Vite production build
    - Served via nginx or serve
    - Port 8081

  proxy:
    - Node.js Express server
    - Port 3001

  backend: (optional)
    - Node.js Express API
    - Port 3002

  postgres: (optional)
    - PostgreSQL database
    - Port 5432
```

### Network Flow in Production

```
Internet → Reverse Proxy (Nginx) → Frontend (8081)
                                  → Proxy (3001) → Proxmox
                                  → Backend (3002) → PostgreSQL
```

## Extension Points

### Adding New Features

1. **New Proxmox API Call**
   - Add method to `proxmoxService.ts`
   - Define types in `types/`
   - Create React Query hook
   - Use in component

2. **New Page**
   - Create in `pages/`
   - Add route in `App.tsx`
   - Add sidebar link
   - Create page components

3. **New Permission**
   - Add to `UserRole` enum
   - Update `usePermissions` hook
   - Add checks in components/services

4. **New White-Label Option**
   - Update `WhiteLabelConfig` type
   - Add to `whiteLabelService`
   - Update context provider
   - Apply in UI/CSS

## Future Architecture Considerations

### Planned Enhancements

1. **WebSocket Support**: Real-time VM updates
2. **Service Workers**: Offline capabilities
3. **Micro-Frontends**: Plugin system for extensions
4. **GraphQL**: Consider for complex queries
5. **Redis**: Caching layer for backend
6. **Message Queue**: Async job processing

### Scalability

Current architecture supports:
- **Users**: Hundreds of concurrent users
- **Servers**: Dozens of Proxmox servers
- **VMs**: Thousands of VMs across servers

For larger scale:
- Add Redis for session storage
- Implement database read replicas
- Use CDN for static assets
- Add load balancer for multiple instances

## References

- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Proxmox VE API](https://pve.proxmox.com/wiki/Proxmox_VE_API)
- [Shadcn UI](https://ui.shadcn.com/)

---

**Last Updated**: November 20, 2025
