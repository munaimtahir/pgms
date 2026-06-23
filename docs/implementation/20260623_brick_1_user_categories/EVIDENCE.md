# Evidence - Brick 1 User Categories and Auth Foundation

Date: 2026-06-23

## Files Created or Changed

### Documentation
- `pgms/docs/implementation/20260623_brick_1_user_categories/DISCOVERY.md`
- `pgms/docs/implementation/20260623_brick_1_user_categories/EVIDENCE.md`
- `pgms/docs/decisions/BRICK_1_USER_AUTH_DECISION.md`
- `pgms/docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md`
- `pgms/docs/gates/BRICK_1_GATES_AND_CHECKS.md`

### Backend Code
- `pgms/backend/requirements.txt` (added `djangorestframework-simplejwt` and `django-cors-headers`)
- `pgms/backend/config/settings.py` (registered apps, configured CORS, SimpleJWT settings, and custom auth permissions)
- `pgms/backend/config/urls.py` (API routing configuration)
- `pgms/backend/accounts/models.py` (custom User model with user categories and state variables)
- `pgms/backend/accounts/serializers.py` (User serialization, profile completion, password update/reset serializers)
- `pgms/backend/accounts/views.py` (JWT views, profile completion views, password update views, and user viewset)
- `pgms/backend/accounts/permissions.py` (state enforcers `EnforceUserStatusPermission` and UTRMC admins `IsUtrmcAdmin` permission classes)
- `pgms/backend/accounts/tests.py` (complete unit/integration test suite)
- `pgms/backend/audit/models.py` (append-only AuditLog model)
- `pgms/backend/audit/serializers.py` (AuditLog serializer for admins)
- `pgms/backend/audit/views.py` (admin read-only AuditLogViewSet)
- `pgms/backend/audit/utils.py` (audit logging utility function)

### Frontend Code
- `pgms/frontend/package.json`
- `pgms/frontend/app/layout.tsx` (wrapped with AuthProvider and custom Navbar)
- `pgms/frontend/app/context.tsx` (AuthProvider context with state guards and redirect controllers)
- `pgms/frontend/lib/api.ts` (apiRequest helper with SimpleJWT automatic token refresh handler)
- `pgms/frontend/components/Navbar.tsx` (shared Navbar component with role-based visibility)
- `pgms/frontend/app/login/page.tsx` (login interface)
- `pgms/frontend/app/change-password/page.tsx` (password update interface)
- `pgms/frontend/app/complete-profile/page.tsx` (profile completion form interface)
- `pgms/frontend/app/account/page.tsx` (own profile view and edit interface)
- `pgms/frontend/app/users/page.tsx` (admin directory index view)
- `pgms/frontend/app/users/new/page.tsx` (admin user provisioning view)
- `pgms/frontend/app/users/[id]/page.tsx` (admin user update and password reset view)
- `pgms/frontend/app/audit/page.tsx` (admin system audit log view)
- `pgms/frontend/app/page.tsx` (landing page splash and dashboards routing logic)
- `pgms/frontend/app/health/page.tsx` (enhanced health view with client-side integration check)

### Verification Scripts
- `pgms/scripts/check_brick1.sh` (Brick 1 guardrail and verification suite)

---

## Backend Models Implemented
- `accounts.User`: Custom User model subclassing `AbstractUser` with fields: `full_name`, `phone`, `email` (unique nullable), `user_category` (`RESIDENT`, `SUPERVISOR`, `SUPPORT_STAFF`, `UTRMC_ADMIN`), `is_profile_complete`, `must_change_password`, `extra_data`.
- `audit.AuditLog`: Audit logs schema capturing request actor, action performed, targets, states (`before`/`after`), context `metadata`, request `ip_address`, and `user_agent`.

---

## Backend Endpoints Implemented
- `GET /api/health/` (health check view showing system status and brick "1")
- `POST /api/auth/login/` (obtains tokens and status details; logs success/fail in audit)
- `POST /api/auth/refresh/` (refreshes tokens)
- `POST /api/auth/logout/` (blacklists refresh token; logs in audit)
- `GET /api/auth/me/` (returns current authenticated session details)
- `POST /api/auth/change-password/` (updates password; resets must_change_password=False; logs in audit)
- `PATCH /api/auth/complete-profile/` (completes onboarding fields; resets is_profile_complete=True; logs in audit)
- `GET /api/users/` (admin only; lists all users)
- `POST /api/users/` (admin only; provision new accounts; logs in audit)
- `GET /api/users/{id}/` (admin only; view user details)
- `PATCH /api/users/{id}/` (admin only; edit user details/deactivate; logs in audit)
- `POST /api/users/{id}/reset-password/` (admin only; resets user password; logs in audit)
- `GET /api/audit/` (admin only; read audit trail logbook)

---

## Frontend Routes Implemented
- `/` (landing page with welcome dashboard shell)
- `/health` (system integration check page)
- `/login` (credential form view)
- `/change-password` (forces password change)
- `/complete-profile` (forces onboarding profile update)
- `/account` (user's profile management)
- `/users` (admin directory table view)
- `/users/new` (admin account creator form)
- `/users/[id]` (admin user management form)
- `/audit` (admin system audit logging browse table)

---

## User Categories Implemented
- `RESIDENT`: Allowed to change temporary password, complete own profile, view and update own contact details.
- `SUPERVISOR`: Allowed to change temporary password, complete own profile, view and update own contact details.
- `SUPPORT_STAFF`: Allowed to change temporary password, complete own profile, view and update own contact details.
- `UTRMC_ADMIN`: Administrative permissions with full User Management CRUD access and system Audit Trail browsing access.

---

## First-Login / Profile-Completion Behavior
Enforced at both backend level (via custom `EnforceUserStatusPermission` class applied to API endpoints) and frontend level (via Next.js router hook guards in `AuthProvider`):
1. User with `must_change_password = True` is restricted exclusively to the password-change page/endpoint.
2. User with `is_profile_complete = False` (after resetting password) is restricted to the profile-completion page/endpoint until `full_name`, `phone`, and `email` are provided.
3. Attempts to access other URLs redirect automatically. Protected API responses return HTTP 403.

---

## Audit Coverage Evidence
- Checked automatic logging for all actions: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_CHANGED`, `PASSWORD_RESET_BY_ADMIN`, `PROFILE_COMPLETED`, `PROFILE_UPDATED`, `USER_CREATED`, `USER_UPDATED`, `USER_DEACTIVATED`, `USER_ACTIVATED`.
- Test suite validates logging assertions for authentication and CRUD operations.
- Audit table is append-only with request IP and User-Agent capture.

---

## Commands Run and Results

- `makemigrations`
  - Result: Generated `accounts/migrations/0001_initial.py` and `audit/migrations/0001_initial.py`.
- `migrate`
  - Result: Migration applied successfully to default SQLite test database.
- `python manage.py test`
  - Result: Passed all 8 tests verifying authentication, deactivations, permission controls, and audit logs.
- `npm run build`
  - Result: Webpack built the Next.js production bundle with 100% correct typechecking and lint checking.
- `bash scripts/check_brick1.sh`
  - Result: Validation checks succeeded, asserting zero guardrail violations.

---

## Commands Not Run and Why
- Caddy reverse-proxy reload.
  - Reason: `PGMS_DOMAIN` variable was not provided in the environment or user instructions, so the Caddy routing stage was skipped.
- Sudo/service config changes.
  - Reason: Host systems changes are skipped when not needed or when variables are absent.

---

## Scope confirmation
- **No domain module** (ResidentProfile, SupervisorProfile, Hospital, Department, rotations, assignments, onboarding, backups, imports) was created or referenced.
- **No legacy code** from `pgsims-legacy/` was copied.
- **`pgsims-legacy/`** remains completely unmodified.

---

## Final verdict

```text
Brick 1 status: READY FOR HUMAN REVIEW
```
