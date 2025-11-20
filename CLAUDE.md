# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# AI Assistant Guide for Proxmox Manager Portal

This document provides comprehensive information about the codebase structure, development workflows, and conventions for AI assistants working on this project.

## Project Overview

**Proxmox Manager Portal** is a modern, secure web-based management interface for Proxmox VE servers with built-in authentication and user management. The application allows users to manage multiple Proxmox servers, monitor resources, control virtual machines, and manage users through a clean, responsive UI.

### Key Features
- Built-in authentication system with role-based access control (Admin, User, Readonly)
- Multi-server Proxmox management
- Real-time VM monitoring and control
- Storage management and monitoring
- User management with role-based permissions
- Activity logging
- Dark/light theme support
- Proxy server for handling CORS issues
- White-label branding (custom logo, favicon, colors, company name)
- First-run setup wizard

## Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.1
- **Language**: TypeScript 5.5.3
- **Styling**: Tailwind CSS 3.4.11
- **UI Components**: Shadcn UI (built on Radix UI primitives)
- **Routing**: React Router DOM 6.26.2
- **State Management**:
  - React Context API for auth and global state
  - TanStack Query (React Query) 5.90.5 for server state
- **Form Handling**: React Hook Form 7.65.0 with Zod validation
- **Icons**: Lucide React 0.462.0
- **Charts**: Recharts 2.12.7
- **Date Handling**: date-fns 3.6.0
- **HTTP Client**: Axios 1.12.2
- **Notifications**: Sonner 1.5.0

### Backend
- **Node.js/Express** backend (in `/backend` directory)
- **Database**: Prisma ORM with PostgreSQL/SQLite
- **Authentication**: JWT-based with localStorage
- **Password Hashing**: SHA-256 with salt

### Proxy Server
- **Express-based proxy** (in `/proxy-server` directory)
- Handles CORS issues with Proxmox API
- In-memory server registration for development

### Development Tools
- **Linting**: ESLint 9.9.0 with React hooks plugin
- **TypeScript Config**: Relaxed mode (noImplicitAny: false)
- **Testing**:
  - Vitest 4.0.9 for unit/integration tests
  - Playwright 1.56.1 for E2E tests
  - Testing Library for React component testing
  - MSW 2.12.2 for API mocking
- **CI/CD**: GitHub Actions workflows
- **Deployment**: Docker support with multi-stage builds

## Project Structure

```
proxmox-manager-portal/
├── .github/
│   └── workflows/          # CI/CD workflows
│       ├── deploy.yml      # Deployment workflow (manual trigger)
│       └── docker-publish.yml
├── backend/                # Node.js/Express backend
│   ├── prisma/            # Prisma schema and migrations
│   └── src/
│       ├── config/        # Configuration files
│       ├── controllers/   # Request handlers
│       ├── middleware/    # Auth, validation, error handling
│       ├── routes/        # API route definitions
│       ├── services/      # Business logic
│       ├── types/         # TypeScript types and schemas
│       └── utils/         # Utility functions
├── proxy-server/          # CORS proxy for Proxmox API
│   ├── proxmox-proxy.js  # Main proxy server
│   └── package.json
├── src/                   # Frontend source code
│   ├── assets/           # Static assets
│   ├── components/       # React components
│   │   ├── auth/        # Authentication components
│   │   ├── charts/      # Chart components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   ├── layout/      # Layout components (Navbar, Sidebar, Layout)
│   │   ├── settings/    # Settings page components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── users/       # User management components
│   │   └── vm/          # VM-related components
│   ├── context/         # React Context providers
│   │   ├── AuthContext.tsx       # Authentication context
│   │   └── WhiteLabelContext.tsx # White-label branding context
│   ├── hooks/           # Custom React hooks
│   │   ├── use-auth-operations.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-server-connections.tsx
│   │   ├── use-theme.tsx
│   │   ├── use-toast.ts
│   │   ├── use-user-management.ts
│   │   └── usePermissions.ts
│   ├── integrations/    # Third-party integrations (Supabase)
│   ├── lib/            # Utility libraries
│   │   ├── api.ts            # API configuration
│   │   ├── authService.ts    # Authentication service
│   │   ├── localStorage.ts   # LocalStorage utilities
│   │   ├── passwordUtils.ts  # Password hashing
│   │   ├── queryClient.ts    # React Query client
│   │   ├── settingsService.ts
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # General utilities (cn)
│   ├── pages/          # Page components (routes)
│   │   ├── Dashboard.tsx
│   │   ├── VirtualMachines.tsx
│   │   ├── Monitoring.tsx
│   │   ├── Storage.tsx
│   │   ├── Users.tsx
│   │   ├── Settings.tsx
│   │   ├── ActivityLogs.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Setup.tsx       # First-run setup wizard
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── services/       # Frontend API services
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── proxmoxApi.ts
│   │   ├── proxmoxService.ts
│   │   ├── userService.ts
│   │   └── whiteLabelService.ts  # White-label branding service
│   ├── test/           # Test setup and utilities
│   │   └── setup.ts   # Vitest test setup
│   ├── types/          # TypeScript type definitions
│   │   ├── auth.ts
│   │   └── vm.ts
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # App entry point
├── public/             # Public static files
├── supabase/          # Supabase configuration
├── e2e/               # Playwright E2E tests
├── Dockerfile         # Docker build configuration
├── docker-compose.yml # Docker compose configuration
├── package.json       # Frontend dependencies
├── vite.config.ts     # Vite configuration
├── vitest.config.ts   # Vitest test configuration
├── playwright.config.ts # Playwright E2E configuration
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── components.json    # Shadcn UI configuration
```

## Architecture

### Application Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Proxy Server   │    │  Proxmox Server │
│   (Port 8081)  │◄──►│  (Port 3001)   │◄──►│   (Port 8006)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  (Optional)     │
└─────────────────┘
```

### Authentication Flow
1. **First-Run Setup**: On initial load, `SetupCheck` component checks if admin user exists
   - If no admin exists, redirect to `/setup` page
   - User creates admin account via setup wizard
   - After setup, redirected to login
2. User enters credentials on Login page
3. `AuthContext` calls `authService.login()`
4. Credentials are validated against localStorage or backend API
5. JWT token is stored in localStorage
6. User object is stored in React Context
7. Protected routes check authentication via `ProtectedRoute` component
8. Navbar displays user info from `useAuth()` hook

### White-Label Flow
1. `WhiteLabelProvider` loads config from localStorage on mount
2. Company name updates `document.title`
3. Logo/favicon stored as base64 in localStorage
4. Primary color applied via CSS variable `--primary`
5. Users customize via Settings > Branding tab
6. Changes persist across sessions via `whiteLabelService`

### Data Flow
1. Components use **React Query** for server data
2. Services (`proxmoxService`, `userService`) handle API calls
3. API calls go through proxy server to avoid CORS issues
4. Responses are cached and managed by React Query
5. UI updates automatically via query invalidation

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `VMCard.tsx`, `UsersList.tsx`)
- **Utilities/Services**: camelCase (e.g., `authService.ts`, `passwordUtils.ts`)
- **Hooks**: kebab-case with `use-` prefix (e.g., `use-theme.tsx`, `use-mobile.tsx`)
- **Pages**: PascalCase matching route names (e.g., `Dashboard.tsx`, `VirtualMachines.tsx`)

### Component Structure
```typescript
// Standard component structure
import { useState } from "react";
import { ComponentProps } from "@/types/component";
import { useCustomHook } from "@/hooks/use-custom-hook";

interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

export const ComponentName = ({ prop1, prop2 }: ComponentNameProps) => {
  const [state, setState] = useState<string>("");
  const { data } = useCustomHook();

  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
};
```

### Styling Conventions
- Use **Tailwind CSS** utility classes
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Shadcn UI components are in `src/components/ui/`
- Custom components extend Shadcn UI patterns
- Theme variables defined in `globals.css` using CSS variables

### State Management
- **Local State**: `useState` for component-specific state
- **Global Auth State**: `AuthContext` (`src/context/AuthContext.tsx`)
- **White-Label State**: `WhiteLabelContext` (`src/context/WhiteLabelContext.tsx`)
- **Server State**: TanStack Query (React Query)
- **Settings**: localStorage + Context (when needed)
- **Theme**: `ThemeProvider` from `next-themes`

### Context Provider Hierarchy
The app uses a specific provider nesting order that **must be maintained**:
```typescript
QueryClientProvider
└─ ThemeProvider
   └─ WhiteLabelProvider
      └─ BrowserRouter
         └─ AuthProvider
            └─ TooltipProvider
```
This order ensures white-label config loads before auth, and both load before the app routes.

### API Integration
```typescript
// Service pattern
import { api } from "@/lib/api";

export const serviceMethod = async (params: ParamsType): Promise<ReturnType> => {
  try {
    const response = await api.post("/endpoint", params);
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
```

### Routing
- Public routes: `/`, `/login`, `/signup`
- Protected routes: All other routes wrapped in `<ProtectedRoute>`
- Layout wrapper: `<Layout>` component wraps all dashboard pages
- Navigation: Use `useNavigate()` from react-router-dom

### Error Handling
- Use `try-catch` blocks in async functions
- Display errors using `toast.error()` from Sonner
- Log errors to console for debugging
- Return meaningful error messages to users

## Development Workflows

### Getting Started
```bash
# Clone repository
git clone <repo-url>
cd proxmox-manager-portal

# Install dependencies
npm install
cd proxy-server && npm install && cd ..

# Start development servers
npm run dev  # Frontend on port 8081
cd proxy-server && npm start  # Proxy on port 3001
```

### Development Server
- Frontend runs on `http://localhost:8081`
- Proxy server runs on `http://localhost:3001`
- Hot module replacement (HMR) enabled
- React Query DevTools available in development

### Building
```bash
# Development build
npm run build:dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Linting
```bash
npm run lint
```

### Testing
```bash
# Unit/Integration tests (Vitest)
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report (80% threshold)
npm run test:watch       # Watch mode

# E2E tests (Playwright)
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run with Playwright UI
npm run test:e2e:debug   # Debug E2E tests

# Run all tests
npm run test:all         # Runs unit + E2E tests
```

**Test Structure:**
- Unit tests: `src/**/__tests__/*.test.ts(x)` or `src/**/*.test.ts(x)`
- E2E tests: `e2e/*.spec.ts`
- Test setup: `src/test/setup.ts`
- Coverage: Minimum 80% for lines, functions, branches, statements

### Code Quality
- ESLint configured for React and TypeScript
- Relaxed TypeScript settings (noImplicitAny: false)

## Common Tasks for AI Assistants

### Adding a New Page
1. Create page component in `src/pages/PageName.tsx`
2. Add route in `src/App.tsx` in the `<Routes>` section
3. Wrap with `<ProtectedRoute>` and `<Layout>` if needed
4. Add navigation link in `src/components/layout/Sidebar.tsx`
5. Create any page-specific components in `src/components/page-name/`

### Adding a New API Endpoint
1. Create service method in `src/services/serviceName.ts`
2. Define TypeScript types in `src/types/`
3. Use React Query hook in component:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['key'],
  queryFn: serviceMethod,
});
```

### Adding a New UI Component
1. If using Shadcn UI, components are in `src/components/ui/`
2. For custom components, create in appropriate subdirectory
3. Import and use Shadcn primitives as base
4. Follow existing styling patterns with Tailwind

### Modifying Authentication
1. Update `AuthContext` (`src/context/AuthContext.tsx`)
2. Modify `authService` (`src/services/authService.ts`)
3. Update user types in `src/types/auth.ts`
4. Test login/logout flow thoroughly

### Adding Permissions
1. Update `UserRole` enum in `src/types/auth.ts`
2. Modify `usePermissions` hook (`src/hooks/usePermissions.ts`)
3. Wrap UI elements with permission checks
4. Update backend authorization if needed

### Modifying White-Label Features
1. Update types in `src/services/whiteLabelService.ts`
2. Modify `WhiteLabelContext` if adding new state
3. Update Settings > Branding tab UI
4. Ensure changes persist to localStorage
5. Apply CSS changes via theme variables if needed

### Writing Tests
1. **Unit tests**: Test services, hooks, and utilities in isolation
   - Create `__tests__` folder next to the file being tested
   - Use MSW for mocking API calls
   - Example: `src/services/__tests__/authService.test.ts`

2. **Component tests**: Test component behavior with Testing Library
   - Mock contexts and hooks as needed
   - Example: `src/components/__tests__/Setup.test.tsx`

3. **E2E tests**: Test critical user flows with Playwright
   - Create in `e2e/` directory
   - Test auth flows, VM management, user management
   - Example: `e2e/auth.spec.ts`

## Testing Checklist

When making changes, verify:
- [ ] TypeScript compilation succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Unit tests pass (`npm run test:run`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Coverage meets 80% threshold (`npm run test:coverage`)
- [ ] Authentication flow works (login/logout)
- [ ] First-run setup works (clear localStorage, test setup wizard)
- [ ] White-label changes persist and apply correctly
- [ ] Protected routes redirect unauthenticated users
- [ ] UI is responsive (mobile, tablet, desktop)
- [ ] Theme switching works (dark/light mode)
- [ ] No console errors in browser
- [ ] React Query DevTools show correct data flow

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:8080
```

### Production Considerations
- Set environment variables for API endpoints
- Configure HTTPS for Proxmox connections
- Set secure: true in proxy configuration
- Configure proper CORS policies
- Use production database (PostgreSQL)
- Set up proper logging and monitoring

## Important Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main application component, routing configuration, provider hierarchy |
| `src/pages/Setup.tsx` | First-run setup wizard for creating admin user |
| `src/context/AuthContext.tsx` | Authentication state management |
| `src/context/WhiteLabelContext.tsx` | White-label branding state management |
| `src/components/layout/Layout.tsx` | Main layout wrapper with sidebar and navbar |
| `src/services/proxmoxService.ts` | Proxmox API integration |
| `src/services/whiteLabelService.ts` | White-label configuration service |
| `src/lib/queryClient.ts` | React Query configuration |
| `src/lib/localStorage.ts` | Type-safe localStorage utilities |
| `src/lib/utils.ts` | Utility functions including `cn()` |
| `src/test/setup.ts` | Vitest test configuration and global setup |
| `vitest.config.ts` | Vitest configuration |
| `playwright.config.ts` | Playwright E2E test configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `vite.config.ts` | Vite build configuration |
| `components.json` | Shadcn UI configuration |

## Common Patterns

### Fetching Data
```typescript
import { useQuery } from "@tanstack/react-query";
import { proxmoxService } from "@/services/proxmoxService";

const { data, isLoading, error } = useQuery({
  queryKey: ['vms', serverId],
  queryFn: () => proxmoxService.getVMs(serverId),
  refetchInterval: 30000, // Auto-refresh every 30s
});
```

### Protected Component
```typescript
import { useAuth } from "@/context/AuthContext";

export const AdminOnlyComponent = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
};
```

### Form Handling
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});

const onSubmit = (data: FormData) => {
  // Handle form submission
};
```

## Troubleshooting

### Common Issues

**CORS Errors**
- Ensure proxy-server is running on port 3001
- Check server registration in proxy-server
- Verify Proxmox server URL configuration

**Authentication Not Persisting**
- Check localStorage for `auth_token`
- Verify token validation in `authService`
- Check browser console for errors

**Build Failures**
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npm run build`
- Verify all imports are correct

**Styling Issues**
- Ensure Tailwind CSS is properly configured
- Check `globals.css` for theme variables
- Verify component imports from `@/components/ui`

**Setup Loop / Redirect Issues**
- Clear localStorage to reset: `localStorage.clear()`
- Check `storageService.needsSetup()` logic
- Verify admin user was created successfully

**White-Label Not Applying**
- Check localStorage for `whiteLabel` key
- Verify `WhiteLabelProvider` is in correct position in provider hierarchy
- Check browser console for errors in `whiteLabelService`

**Test Failures**
- Run `npm run test:coverage` to see what's not covered
- Check `src/test/setup.ts` for global mocks
- For E2E failures, run `npm run test:e2e:debug` to step through

## Best Practices for AI Assistants

1. **Always check existing patterns** before creating new ones
2. **Use TypeScript types** for all functions and components
3. **Follow the established folder structure**
4. **Import from `@/` alias** not relative paths for src files
5. **Use Shadcn UI components** as building blocks
6. **Handle loading and error states** in all async operations
7. **Use React Query** for server state management
8. **Add proper error handling** with try-catch and toast notifications
9. **Test authentication flows** when modifying auth code
10. **Keep components small and focused** - extract to separate files when needed
11. **Use semantic HTML** and proper accessibility attributes
12. **Follow responsive design** principles with Tailwind breakpoints
13. **Write tests for new features** - aim for 80% coverage minimum
14. **Test white-label and setup flows** when modifying auth or branding
15. **Maintain provider hierarchy** - never reorder context providers in App.tsx

## Git Workflow

### Branch Strategy
- `main` branch for production-ready code
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-description`
- Use Claude branches: `claude/claude-md-*` for AI-assisted development

### Commit Messages
Use conventional commits format:
```
feat: Add user role management
fix: Resolve CORS issue with proxy server
docs: Update CLAUDE.md with new patterns
refactor: Simplify authentication flow
style: Update button styling
test: Add tests for VM controls
```

### CI/CD
- GitHub Actions workflow runs on manual trigger
- Workflow steps:
  1. Install dependencies
  2. Run linting
  3. Build application
  4. (Deploy step disabled by default)

## Environment Variables

Create `.env` file for local development:
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Security Considerations

- **Never commit** sensitive data (API keys, passwords, tokens)
- **Use environment variables** for configuration
- **Validate all user inputs** on frontend and backend
- **Sanitize data** before displaying (XSS prevention)
- **Use HTTPS** in production
- **Implement rate limiting** on API endpoints
- **Keep dependencies updated** regularly
- **Review authentication logic** carefully

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Router Docs](https://reactrouter.com/)
- [Proxmox VE API](https://pve.proxmox.com/wiki/Proxmox_VE_API)

## Contact & Support

For questions about this codebase:
1. Check existing documentation in `/docs` folder
2. Review README.md for setup instructions
3. Check DEPLOYMENT.md for deployment guides
4. Consult this CLAUDE.md for development patterns

---

**Last Updated**: November 20, 2025
**Version**: 0.1.0
**Maintained for**: AI Development Assistants (Claude Code, etc.)
