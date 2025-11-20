# PostgreSQL Migration - Implementation Plan

**Status**: ✅ COMPLETED
**Target**: Remove localStorage, use PostgreSQL exclusively
**Breaking Change**: Yes - requires data migration
**Completed**: November 20, 2025

---

## 📋 Changes Required

### Backend Changes (7 files)

1. **Add setup routes** (`backend/src/routes/setup.ts`) - NEW FILE
   ```typescript
   GET  /api/setup/status  // Check if setup is needed
   POST /api/setup/initialize  // Create first admin user
   ```

2. **Add setup controller** (`backend/src/controllers/setupController.ts`) - NEW FILE
   - `checkStatus()` - Returns if admin user exists
   - `initialize()` - Creates first admin user

3. **Update auth routes** (`backend/src/routes/auth.ts`)
   - Ensure `/register` endpoint works for setup

4. **Update server.ts** (`backend/src/server.ts`)
   - Remove `initializeDefaultAdmin()` auto-creation
   - Add setup routes

5. **Create Dockerfiles for backend/proxy**
   - `backend/Dockerfile` - Already exists ✅
   - `proxy-server/Dockerfile` - Already exists ✅
   - Need to publish to GHCR

### Frontend Changes (8 files)

6. **Update AuthContext** (`src/context/AuthContext.tsx`)
   ```typescript
   // Change:
   import { localAuthService } from "@/services/localAuthService";
   // To:
   import { authService } from "@/services/authService";
   ```

7. **Update Setup page** (`src/pages/Setup.tsx`)
   ```typescript
   // Change:
   await storageService.initializeWithAdmin(...);
   // To:
   await authService.register(...); // or setupService.initialize(...)
   ```

8. **Update App.tsx** (`src/App.tsx`)
   ```typescript
   // Change:
   const needsSetup = storageService.needsSetup();
   // To:
   const { data: setupStatus } = useQuery(['setup-status'], setupService.checkStatus);
   const needsSetup = setupStatus?.needsSetup;
   ```

9. **Update API config** (`src/lib/api.ts`)
   ```typescript
   // Change baseURL to environment variable:
   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
   ```

10. **Delete localStorage services**
    - `src/services/localAuthService.ts` ❌ DELETE
    - `src/services/localUserService.ts` ❌ DELETE
    - `src/services/localProxmoxService.ts` ❌ DELETE

11. **Update authService** (`src/services/authService.ts`)
    - Verify it works with backend API
    - Already implemented! ✅

12. **Add setupService** (`src/services/setupService.ts`) - NEW FILE
    ```typescript
    export const setupService = {
      checkStatus: async () => {
        const response = await api.get('/setup/status');
        return response.data;
      },
      initialize: async (email, password, name) => {
        const response = await api.post('/setup/initialize', { email, password, name });
        return response.data;
      }
    };
    ```

13. **Update environment files**
    - Add `VITE_API_URL` to frontend `.env`
    - Ensure backend `.env` has all DB vars

### Docker & CI/CD (3 files)

14. **GitHub Actions workflow** (`.github/workflows/docker-publish.yml`)
    - Build 3 separate images:
      - `ghcr.io/waive-as/proxmox-manager:latest` (frontend)
      - `ghcr.io/waive-as/proxmox-manager-backend:latest` (backend)
      - `ghcr.io/waive-as/proxmox-manager-proxy:latest` (proxy)

15. **Update main Dockerfile** (`Dockerfile`)
    - Build frontend only (no backend/proxy)

16. **Verify docker-compose.yml**
    - Already updated! ✅

---

## 🔄 Implementation Order

### Phase 1: Backend (Do First)
1. ✅ Create `backend/src/routes/setup.ts`
2. ✅ Create `backend/src/controllers/setupController.ts`
3. ✅ Update `backend/src/server.ts`
4. ✅ Test backend endpoints locally

### Phase 2: Frontend
5. ✅ Create `src/services/setupService.ts`
6. ✅ Update `src/lib/api.ts` baseURL
7. ✅ Update `src/App.tsx` SetupCheck component
8. ✅ Update `src/pages/Setup.tsx`
9. ✅ Update `src/context/AuthContext.tsx`
10. ✅ Delete localStorage services
11. ✅ Test frontend locally

### Phase 3: Docker & Deployment
12. ✅ Update GitHub Actions to build 3 images
13. ✅ Test docker-compose locally
14. ✅ Push and verify GHCR images

### Phase 4: Documentation
15. ✅ Update README.md
16. ✅ Update DOCKER_SETUP.md
17. ✅ Create MIGRATION_GUIDE.md for users

---

## 🧪 Testing Checklist

Before marking complete:

**Backend Tests:**
- [ ] `GET /api/setup/status` returns `{ needsSetup: true }` when no users
- [ ] `POST /api/setup/initialize` creates admin user
- [ ] `GET /api/setup/status` returns `{ needsSetup: false }` after setup
- [ ] `POST /api/auth/login` works with created admin
- [ ] Database has user record

**Frontend Tests:**
- [ ] App loads and redirects to `/setup`
- [ ] Setup form validates password requirements
- [ ] Setup form submits to backend API
- [ ] After setup, redirects to `/login`
- [ ] Login works with created credentials
- [ ] Dashboard loads after login
- [ ] User data persists after browser refresh

**Docker Tests:**
- [ ] `docker-compose up -d` starts all 4 containers
- [ ] PostgreSQL container is healthy
- [ ] Backend container is healthy
- [ ] Frontend accessible on port 8080
- [ ] Setup wizard works
- [ ] Data persists after container restart

**Integration Tests:**
- [ ] Add Proxmox server works
- [ ] User management works
- [ ] Logout works
- [ ] Token refresh works

---

## 🚨 Breaking Changes

**For Users Upgrading:**

1. **Data Loss Warning**
   - All localStorage data will be lost
   - No automatic migration
   - Must manually export/import servers

2. **New Requirements**
   - PostgreSQL database required
   - Backend container required
   - Environment variables required

3. **Migration Steps for Users**
   ```bash
   # 1. Export current data (manual)
   # - Note your Proxmox servers
   # - Note user accounts

   # 2. Update to v0.2.0
   git pull

   # 3. Create .env file
   cp .env.example .env
   nano .env  # Add secrets

   # 4. Start new stack
   docker-compose up -d

   # 5. Complete setup wizard
   # 6. Re-add servers and users
   ```

---

## 📝 Commit Strategy

Suggest breaking into these commits:

1. `feat(backend): add setup API endpoints for first-run wizard`
2. `feat(frontend): migrate authentication to backend API`
3. `refactor(frontend): remove localStorage authentication services`
4. `feat(docker): separate backend, frontend, and proxy images`
5. `docs: update for PostgreSQL-only architecture`
6. `chore: bump version to 0.2.0`

---

## ⏱️ Estimated Time

- Backend changes: 1-2 hours
- Frontend changes: 2-3 hours
- Testing: 2-3 hours
- Docker/CI: 1-2 hours
- Documentation: 1 hour

**Total: 7-11 hours**

---

## 🎯 Ready to Start?

I can implement this step-by-step. Shall we start with Phase 1 (Backend)?

