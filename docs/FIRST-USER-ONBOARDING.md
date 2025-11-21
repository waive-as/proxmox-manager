# First User Onboarding Flow

## Overview

The first user onboarding is handled through a **Setup Wizard** that appears automatically when the database is empty. This is a PostgreSQL-based flow that ensures only one admin user is created during initial setup.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens Application                   │
│                   http://localhost:8080                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              App.tsx - SetupCheck Component                 │
│   Query: GET /api/setup/status                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌───────────────────┐   ┌─────────────────────┐
    │  needsSetup=true  │   │  needsSetup=false   │
    │ (DB has 0 users)  │   │ (DB has users)      │
    └─────────┬─────────┘   └──────────┬──────────┘
              │                         │
              ▼                         ▼
    ┌──────────────────┐   ┌─────────────────────┐
    │  Redirect to     │   │  Show Login/App     │
    │  /setup          │   │                     │
    └─────────┬────────┘   └─────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Setup Wizard Page                        │
│  Components:                                                │
│  - Name field                                               │
│  - Email field                                              │
│  - Password field (with strength requirements)              │
│  - Confirm password field                                   │
│  - Submit button                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              User Submits Form                              │
│  POST /api/setup/initialize                                 │
│  Body: { email, password, name }                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Backend: setupController.initializeSetup            │
│  1. Validate input (email, password, name required)         │
│  2. Check DB user count is still 0                          │
│  3. Hash password with bcrypt (12 rounds)                   │
│  4. Create user with role='ADMIN'                           │
│  5. Return success response                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌───────────────────┐   ┌─────────────────────┐
    │     Success       │   │      Failure        │
    │  Admin user       │   │  Show error         │
    │  created          │   │  message            │
    └─────────┬─────────┘   └─────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │  Redirect to     │
    │  /login          │
    └──────────────────┘
```

## Technical Implementation

### 1. **Frontend: Setup Check (App.tsx)**

The `SetupCheck` component wraps the entire app and checks if setup is needed:

```typescript
const SetupCheck = ({ children }: { children: React.ReactNode }) => {
  const { data: setupStatus, isLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupService.checkStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  const needsSetup = setupStatus?.needsSetup ?? false;

  useEffect(() => {
    // If setup is needed and not already on setup page, redirect
    if (!isLoading && needsSetup && location.pathname !== "/setup") {
      window.location.href = "/setup";
    }
  }, [needsSetup, location, isLoading]);

  // ... render logic
};
```

**File**: `src/App.tsx`

### 2. **Frontend: Setup Service**

Handles API calls for setup:

```typescript
export const setupService = {
  checkStatus: async (): Promise<SetupStatus> => {
    const response = await api.get<SetupStatus>('/setup/status');
    return response.data;
  },

  initialize: async (data: InitializeSetupData) => {
    const response = await api.post('/setup/initialize', data);
    return response.data;
  }
};
```

**File**: `src/services/setupService.ts`

### 3. **Frontend: Setup Page**

The setup wizard UI with form validation:

**Features**:
- Name, email, password, confirm password fields
- Real-time password strength validation
- Strong password requirements (12+ chars, uppercase, lowercase, number, special char)
- Visual feedback for each requirement
- Error handling
- Automatic redirect to login on success

**File**: `src/pages/Setup.tsx`

### 4. **Backend: Setup Routes**

```typescript
router.get('/status', asyncHandler(checkSetupStatus));
router.post('/initialize', asyncHandler(initializeSetup));
```

**File**: `backend/src/routes/setup.ts`

### 5. **Backend: Setup Controller**

**Check Status Endpoint**:
```typescript
export const checkSetupStatus = async (_req: Request, res: Response) => {
  const userCount = await prisma.user.count();

  res.json({
    needsSetup: userCount === 0,
    message: userCount === 0
      ? 'Initial setup required'
      : 'Setup already completed'
  });
};
```

**Initialize Endpoint**:
```typescript
export const initializeSetup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validate input
  if (!email || !password || !name) {
    throw new ApiError(400, 'Email, password, and name are required');
  }

  // Check if setup is still needed (race condition protection)
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    throw new ApiError(400, 'Setup has already been completed');
  }

  // Hash password
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.default.hash(password, 12);

  // Create first admin user
  const user = await userService.create({
    email,
    passwordHash,
    name,
    username: email.split('@')[0],
    role: 'ADMIN',
    isActive: true
  });

  res.status(201).json({
    message: 'Setup completed successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
};
```

**File**: `backend/src/controllers/setupController.ts`

## Password Requirements

The setup wizard enforces strong passwords:

✅ **Minimum 12 characters**
✅ **At least one uppercase letter (A-Z)**
✅ **At least one lowercase letter (a-z)**
✅ **At least one number (0-9)**
✅ **At least one special character (!@#$%^&*()...)**

These requirements are validated both on the frontend (real-time) and backend.

## Security Features

### 1. **Race Condition Protection**
The backend checks user count twice:
- Once to determine if setup page should be shown
- Again before creating the user (in case of concurrent requests)

### 2. **Password Hashing**
- Uses bcrypt with 12 rounds (strong security)
- Password never stored in plain text
- Hashed before saving to database

### 3. **Admin Role Assignment**
- First user is automatically assigned 'ADMIN' role
- Has full permissions across the system
- Can create additional users with different roles

### 4. **Username Generation**
- Automatically generated from email (part before @)
- Example: `admin@example.com` → username: `admin`

### 5. **One-Time Setup**
- Setup wizard only appears when database has 0 users
- After first user is created, setup is permanently disabled
- Prevents accidental re-initialization

## User Experience

### First Visit (No Users)
1. User opens `http://localhost:8080`
2. Loading screen appears briefly
3. Automatically redirected to `/setup`
4. Setup wizard shows with form
5. User fills in details (name, email, password)
6. Password strength indicator shows real-time feedback
7. Submit button enabled only when all requirements met
8. On success: "Setup completed successfully!" toast
9. Automatically redirected to `/login` after 1 second

### Subsequent Visits (Users Exist)
1. User opens `http://localhost:8080`
2. Loading screen appears briefly
3. Redirected to `/login` (normal login flow)
4. No setup wizard appears

## Database Schema

The first user is created in the `users` table:

```sql
INSERT INTO users (
  id,           -- UUID generated by Prisma
  email,        -- From form input
  username,     -- Generated from email
  password,     -- Bcrypt hashed password
  name,         -- From form input
  role,         -- 'ADMIN'
  isActive,     -- true
  createdAt,    -- Current timestamp
  updatedAt     -- Current timestamp
  lastLoginAt   -- NULL (not logged in yet)
)
```

## Testing the Setup Flow

### Clean Database Test

```bash
# 1. Stop services
docker-compose down -v  # -v removes volumes (clears database)

# 2. Start services
docker-compose up --build

# 3. Open browser
open http://localhost:8080

# 4. You should see the setup wizard
```

### Check Setup Status Manually

```bash
# Check if setup is needed
curl http://localhost:3002/api/setup/status

# Response when no users:
{
  "needsSetup": true,
  "message": "Initial setup required"
}

# Response when users exist:
{
  "needsSetup": false,
  "message": "Setup already completed"
}
```

### Create First Admin User Manually

```bash
curl -X POST http://localhost:3002/api/setup/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!@#",
    "name": "Admin User"
  }'

# Response:
{
  "message": "Setup completed successfully",
  "user": {
    "id": "uuid-here",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

## Common Issues

### Setup Page Doesn't Appear

**Cause**: Database already has users

**Solution**:
```bash
# Clear database and restart
docker-compose down -v
docker-compose up --build
```

### Setup Keeps Redirecting in Loop

**Cause**: API call to `/api/setup/status` is failing

**Check**:
```bash
# Verify backend is running
docker-compose logs backend

# Check backend health
curl http://localhost:3002/health

# Check setup endpoint
curl http://localhost:3002/api/setup/status
```

### "Setup has already been completed" Error

**Cause**: Trying to create second user through setup endpoint

**Solution**: This is expected behavior. Use the admin account to create additional users through:
- Settings > Users > Add User

### Password Requirements Not Met

**Cause**: Password doesn't meet security requirements

**Solution**: Ensure password has:
- 12+ characters
- Mix of upper/lowercase
- At least one number
- At least one special character

Example valid password: `Admin123!@Pass`

## Next Steps After Setup

Once the admin user is created:

1. **Login** with the created credentials
2. **Add Proxmox Servers** (Settings > Servers)
3. **Create Additional Users** (Settings > Users)
4. **Configure White-Label Branding** (Settings > Branding)
5. **Start Managing VMs**

## Migration from LocalStorage

If you previously used the localStorage version:

⚠️ **Data is NOT migrated automatically**

You'll need to:
1. Re-create the admin user via setup wizard
2. Re-add Proxmox servers
3. Re-create user accounts
4. Re-configure white-label settings

The localStorage data remains in the browser but is no longer used by the application.

---

**Version**: 0.2.0 (PostgreSQL-only)
**Last Updated**: November 2025
