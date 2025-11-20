# Migration to PostgreSQL-Only Architecture

## Overview

This document outlines the migration from the dual-mode (localStorage + PostgreSQL) architecture to a PostgreSQL-only architecture.

## Current State (v0.1.x)

**Dual Mode:**
- Frontend can use either localStorage OR backend API
- Currently configured to use `localAuthService` (localStorage)
- Backend exists but is not actively used by frontend

**Files involved in localStorage mode:**
- `src/lib/localStorage.ts` - Storage service
- `src/services/localAuthService.ts` - Auth using localStorage
- `src/services/localUserService.ts` - User management
- `src/services/localProxmoxService.ts` - Server management
- `src/context/AuthContext.tsx` - Uses `localAuthService`

## Target State (v0.2.0)

**PostgreSQL Only:**
- Frontend always uses backend API
- localStorage removed (except for temporary tokens)
- Backend is required to run
- Persistent, centralized data storage

**Required Changes:**

### 1. Frontend Changes

#### AuthContext.tsx
```typescript
// OLD (line 4)
import { localAuthService } from "@/services/localAuthService";

// NEW
import { authService } from "@/services/authService";

// OLD (line 54)
const { user } = await localAuthService.login(email, password);

// NEW
const { user } = await authService.login(email, password);
```

#### Remove unused services
- Delete `src/services/localAuthService.ts`
- Delete `src/services/localUserService.ts`
- Delete `src/services/localProxmoxService.ts`
- Keep `src/lib/localStorage.ts` (still needed for temp tokens/cache)

#### Update API configuration
```typescript
// src/lib/api.ts - Update baseURL to use environment variable
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
```

### 2. Backend Changes

#### Ensure backend is ready
- ✅ Prisma schema already defined
- ✅ Database migrations exist
- ⚠️ Need to verify all API endpoints work
- ⚠️ Need to ensure setup wizard works with backend

#### Required API endpoints:
- `POST /api/auth/register` - First admin setup
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/servers` - List Proxmox servers
- `POST /api/servers` - Add server
- `PUT /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server

### 3. Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://backend:3002/api
VITE_PROXY_URL=http://proxy:3001
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/proxmox_manager
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

### 4. Docker Configuration

#### Dockerfile
Update frontend Dockerfile to:
1. Build React app with proper API URL
2. Serve via nginx or serve
3. No longer need to run proxy in same container

#### docker-compose.yml
- ✅ Already updated with separate services
- ✅ PostgreSQL container configured
- ✅ Backend container configured
- ✅ Network configuration correct

### 5. Database Migrations

#### First-run initialization
```typescript
// backend/src/services/setup.service.ts
export async function needsSetup(): Promise<boolean> {
  const userCount = await prisma.user.count();
  return userCount === 0;
}

export async function createAdminUser(email: string, password: string, name: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return await prisma.user.create({
    data: {
      email,
      username: email.split('@')[0],
      password: hashedPassword,
      name,
      role: 'ADMIN',
      isActive: true,
    },
  });
}
```

### 6. Testing Checklist

Before migration is complete, verify:

- [ ] Setup wizard works (creates first admin in database)
- [ ] Login works (via backend API)
- [ ] Logout works
- [ ] User management (CRUD operations)
- [ ] Proxmox server management (CRUD operations)
- [ ] White-label settings persist (in database)
- [ ] Activity logs are recorded
- [ ] Permissions/roles work correctly
- [ ] Token refresh works
- [ ] Password reset works (if implemented)

### 7. Breaking Changes

**For Users:**

⚠️ **Data Migration Required**

Users upgrading from v0.1.x (localStorage) to v0.2.0 (PostgreSQL) will need to:

1. Export their current configuration
2. Note user accounts and Proxmox servers
3. Clear browser localStorage
4. Run through setup wizard again
5. Re-add Proxmox servers
6. Re-create user accounts

**No automatic migration** from localStorage to PostgreSQL.

### 8. Implementation Steps

**Phase 1: Backend Verification** (Do First)
1. Verify all backend API endpoints exist
2. Test backend endpoints with Postman/Insomnia
3. Ensure Prisma migrations work
4. Test setup wizard backend logic

**Phase 2: Frontend Migration** (After Backend Ready)
1. Update `AuthContext.tsx` to use `authService`
2. Update all components using localStorage auth
3. Remove localStorage service files
4. Update API configuration

**Phase 3: Testing** (Critical)
1. Test full user flow (setup → login → use → logout)
2. Test all CRUD operations
3. Test with real Proxmox server
4. Test error handling

**Phase 4: Documentation**
1. Update README with new setup instructions
2. Update DEPLOYMENT.md
3. Create migration guide for existing users
4. Update CLAUDE.md architecture section

## Rollback Plan

If migration fails:

1. Revert `AuthContext.tsx` changes
2. Restore localStorage service files
3. Revert to previous Git commit
4. Tag as v0.1.x-stable

## Notes

- Keep this migration in a separate branch first
- Test thoroughly before merging to main
- Consider a beta release for testing
- Document all breaking changes in CHANGELOG.md

---

**Status**: ✅ COMPLETED
**Assigned**: Completed
**Target Release**: v0.2.0
**Completed**: November 20, 2025
**Last Updated**: November 20, 2025
