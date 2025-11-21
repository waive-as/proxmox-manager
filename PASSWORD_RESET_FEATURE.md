# Password Reset Feature Documentation

## Overview

The password reset feature has been successfully implemented for the Proxmox Manager Portal. This feature provides two methods for resetting user passwords:

1. **Admin UI Password Reset** - Admins can reset passwords for any user through the web interface
2. **CLI Emergency Reset** - Command-line tool for emergency password resets (useful for locked-out admins)

## Features Implemented

### 1. Database Schema Updates

Added `requirePasswordChange` field to the User model:
- Type: Boolean
- Default: false
- Purpose: Flags users who need to change their password on next login

**Location:** `backend/prisma/schema.prisma`

### 2. Backend API Endpoints

#### Admin Password Reset
- **Endpoint:** `POST /api/users/:userId/reset-password`
- **Auth Required:** Yes (Admin only)
- **Request Body:**
  ```json
  {
    "newPassword": "NewSecurePassword123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Password reset successfully. User will be required to change password on next login.",
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "requirePasswordChange": true
      }
    }
  }
  ```

#### User Password Change
- **Endpoint:** `POST /api/auth/change-password`
- **Auth Required:** Yes (Any authenticated user)
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

**Locations:**
- Controllers: `backend/src/controllers/authController.ts`
- Routes: `backend/src/routes/users.ts` and `backend/src/routes/auth.ts`
- Service: `backend/src/services/userService.ts`

### 3. CLI Emergency Password Reset Tool

A command-line script for emergency password resets when admins are locked out.

**Usage:**
```bash
# From Docker (recommended for production):
docker exec proxmox-backend-local sh -c "npm run reset-password <email> [newPassword]"

# Examples:
docker exec proxmox-backend-local sh -c "npm run reset-password admin@example.com"
docker exec proxmox-backend-local sh -c "npm run reset-password admin@example.com MyNewPassword123!"

# From backend directory (development only):
cd backend
npm run reset-password admin@example.com
```

**Features:**
- Generates secure random password if not provided
- Validates password requirements (minimum 12 characters)
- Sets `requirePasswordChange` flag
- Shows clear instructions and warnings
- Displays the new password once (securely)

**Docker Usage:**
```bash
docker exec proxmox-backend-local sh -c "npm run reset-password admin@example.com"
```

**Location:** `backend/scripts/reset-password.ts`

### 4. Frontend UI Components

#### Reset Password Dialog
A comprehensive dialog component for admin password resets with:
- Password input field
- "Generate Secure Password" button
- Real-time password requirement validation
- Password strength indicators
- Copy to clipboard functionality
- Success state showing the new password
- 10-second timeout before auto-closing

**Features:**
- ✅ Minimum 12 characters
- ✅ Uppercase letter (A-Z)
- ✅ Lowercase letter (a-z)
- ✅ Number (0-9)
- ✅ Special character (!@#$%^&*...)

**Location:** `src/components/users/ResetPasswordDialog.tsx`

#### Users List Updates
Added a "Reset Password" button (key icon) to the Users management page:
- Visible to admin users only
- Opens the Reset Password dialog
- Located next to Edit and Delete buttons

**Location:** `src/components/users/UsersList.tsx`

## Security Considerations

1. **Password Requirements:**
   - Minimum 12 characters
   - Must contain uppercase, lowercase, number, and special character
   - Validated on both frontend and backend

2. **Admin-Only Access:**
   - Only users with "admin" role can reset passwords
   - Protected by authentication middleware

3. **Forced Password Change:**
   - Users must change password on next login after reset
   - `requirePasswordChange` flag is set to true

4. **Password Hashing:**
   - bcryptjs with cost factor of 12
   - Secure one-way hashing

5. **Secure Password Generation:**
   - Random 16-character passwords
   - Uses crypto.randomInt for secure randomness
   - Meets all password requirements

## User Workflow

### Admin Resetting User Password

1. Admin navigates to Users page
2. Clicks the key icon (Reset Password button) for a user
3. Dialog opens with two options:
   - Manually enter a new password
   - Click "Generate Secure Password" for a random secure password
4. Password requirements are validated in real-time
5. Admin clicks "Reset Password"
6. Success message displays the new password
7. Admin copies the password to share with user
8. Dialog auto-closes after 10 seconds

### User First Login After Reset

1. User receives new password from admin
2. Logs in with new password
3. System detects `requirePasswordChange` flag
4. User is prompted to change password
5. User sets their own secure password
6. `requirePasswordChange` flag is cleared

### Emergency CLI Reset

1. Admin runs CLI command with user's email
2. Script generates secure password (or uses provided one)
3. Password is displayed in terminal
4. Admin shares password with user securely
5. User logs in and must change password

## Testing the Feature

### 1. Test Admin Password Reset via UI

```bash
# Access the application
open http://localhost:8080

# Login as admin
# Navigate to Users page
# Click the key icon next to a user
# Generate a secure password
# Copy the password
# Try logging in as that user with the new password
```

### 2. Test CLI Password Reset

```bash
# From the host machine
docker exec proxmox-backend-local sh -c "npm run reset-password admin@example.com"

# Or with a specific password
docker exec proxmox-backend-local sh -c "npm run reset-password admin@example.com NewPassword123!"

# Copy the displayed password and test login
```

### 3. Test Password Change Requirement

After resetting a password:
1. Login as the user whose password was reset
2. Verify the system prompts for password change
3. Change the password successfully
4. Verify subsequent logins don't require password change

## API Testing Examples

### Reset Password (Admin)

```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPassword123!"}' \
  | jq -r '.data.token')

# Reset a user's password
curl -X POST http://localhost:3002/api/users/{userId}/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"newPassword":"NewSecurePass123!"}'
```

### Change Own Password

```bash
curl -X POST http://localhost:3002/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword":"OldPassword123!",
    "newPassword":"NewSecurePass123!"
  }'
```

## Files Modified/Created

### Backend Files
- ✅ `backend/prisma/schema.prisma` - Added `requirePasswordChange` field
- ✅ `backend/src/controllers/authController.ts` - Added password reset controllers
- ✅ `backend/src/routes/auth.ts` - Added change password route
- ✅ `backend/src/routes/users.ts` - Added admin reset password route
- ✅ `backend/src/services/userService.ts` - Updated User interface and update method
- ✅ `backend/scripts/reset-password.ts` - New CLI script
- ✅ `backend/package.json` - Added reset-password script

### Frontend Files
- ✅ `src/components/users/ResetPasswordDialog.tsx` - New password reset dialog
- ✅ `src/components/users/UsersList.tsx` - Added reset password button

## Troubleshooting

### CLI Script Not Working in Docker

If the CLI script fails in Docker, ensure:
1. The container is running: `docker ps | grep backend`
2. The script has correct permissions
3. Use the full command: `docker exec proxmox-backend-local sh -c "npm run reset-password email@example.com"`

### Password Reset Button Not Visible

Ensure:
1. You're logged in as an admin user
2. The frontend container has been rebuilt with the latest code
3. Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)

### Database Schema Not Updated

If `requirePasswordChange` field is missing:
```bash
docker exec proxmox-backend-local sh -c "npx prisma db push"
```

## Future Enhancements

Potential improvements for future versions:

1. **Email-Based Password Reset**
   - Implement SMTP configuration
   - Send password reset links via email
   - Token-based reset flow

2. **Password History**
   - Prevent reuse of last N passwords
   - Track password change history

3. **Forced Periodic Password Changes**
   - Configure password expiration periods
   - Notify users before expiration

4. **Two-Factor Authentication**
   - Add 2FA support for enhanced security
   - Integrate with authenticator apps

5. **Password Reset Audit Log**
   - Track who reset which passwords
   - Display in activity logs

## Support

For issues or questions:
- Check the application logs: `docker logs proxmox-backend-local`
- Review the frontend console in browser DevTools
- Verify environment variables are correct in `docker-compose.local.yml`

---

**Implementation Date:** November 21, 2025
**Version:** 1.0.0
**Status:** ✅ Completed and Tested
