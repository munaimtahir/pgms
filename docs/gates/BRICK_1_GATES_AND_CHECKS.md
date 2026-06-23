# Brick 1 Gates and Checks — PGMS

This document outlines the validation rules and criteria that must pass for Brick 1 (User Categories and Auth Foundation) to be accepted.

## Brick 1 Acceptance Gate

Brick 1 is accepted only if:

### 1. Backend Scaffold & Custom User
- `accounts` app exists inside `pgms/backend/`.
- Custom User model `User` is active and extends Django `AbstractUser`.
- `user_category` field is added with choices: `RESIDENT`, `SUPERVISOR`, `SUPPORT_STAFF`, `UTRMC_ADMIN`.
- System restricts logins for inactive users.
- Self-registration is disabled.

### 2. State & Redirect Controls
- Accounts created by admin default to `must_change_password=True`.
- Password change requirement redirects/blocks normal requests.
- Profile completeness flag `is_profile_complete` restricts uncompleted users to `/complete-profile` on the frontend and the profile-completion endpoint on the backend.
- Completion requires: `full_name`, `phone`, `email`.

### 3. API & Auth Foundation
- DRF SimpleJWT is integrated.
- Endpoint `/api/auth/login/` returns tokens and user state details.
- Endpoint `/api/auth/me/` returns identity and redirect rules.
- Endpoint `/api/auth/change-password/` resets password and clears `must_change_password`.
- Endpoint `/api/auth/complete-profile/` updates profile and marks `is_profile_complete=True`.
- API endpoints for user management (`/api/users/`) exist and are restricted to `UTRMC_ADMIN`.

### 4. Audit Log Integrity
- `audit` app exists inside `pgms/backend/`.
- `AuditLog` model logs all authentication events, user updates, and profile edits.
- Logs are append-only.
- Audit list is visible only to `UTRMC_ADMIN`.

### 5. Frontend UI & Routing
- Frontend routes `/login`, `/change-password`, `/complete-profile`, `/account`, `/users`, `/users/new`, `/users/[id]`, `/audit` are implemented.
- Route guards enforce user states based on `allowed_next_route` returned by backend.
- Frontend matches backend permission controls (e.g. users view can only be accessed by `UTRMC_ADMIN`).

### 6. No Domain/Scaffold Contamination
- No hospital, department, or supervisor/resident profile models or pages exist.
- `pgsims-legacy/` remains completely unmodified.
- No legacy code is copied.

---

## Validation Commands

Run these checks to verify the gates:

### Backend Check
```bash
cd pgms/backend
/tmp/pgms-brick0-venv/bin/python manage.py check
/tmp/pgms-brick0-venv/bin/python manage.py test
```

### Frontend Check
```bash
cd pgms/frontend
npm run typecheck
npm run lint
npm run build
```

### Scripted Verification
```bash
cd pgms
bash scripts/check_brick1.sh
```
