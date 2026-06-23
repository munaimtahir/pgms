# Discovery - Brick 1 User Categories and Auth Foundation

Date: 2026-06-23

## Current `pgms/` state
- **Backend**: Django/DRF scaffold exists in `pgms/backend` with a `/api/health/` endpoint. Running on `/tmp/pgms-brick0-venv/`.
- **Frontend**: Next.js 14 scaffold in `pgms/frontend` with `/` and `/health` routes.
- **Database**: PostgreSQL configured but no tables or models exist.
- **Compose**: `compose.yml` configuration is verified.
- No custom user model or authentication app is implemented yet.

## Legacy repository status
- `pgsims-legacy/` exists in the workspace.
- Treated as read-only reference vault only.
- It will not be modified.
- No legacy model, route, serializer, view, page, migration, workflow, or test data will be copied wholesale.

## Discovery & Plan for Brick 1
1. **Custom Minimal User Model**: Create a custom user model representing auth identity and user category. Avoid expanding it to a database-heavy profile model (which will be separate). Use `djangorestframework-simplejwt` for authentication tokens.
2. **User Categories**:
   - `RESIDENT`
   - `SUPERVISOR`
   - `SUPPORT_STAFF`
   - `UTRMC_ADMIN`
3. **Login Handling**: Establish username/password authentication now, ensuring future compatibility with email/Google login (unique nullable/empty-safe email).
4. **Mandatory First-Login & Profile Completion**:
   - Create a `must_change_password` boolean (default `True` for admin-created users).
   - Create an `is_profile_complete` boolean (default `False` for normal users). Required fields: `full_name`, `phone`, `email`.
   - Prevent API access to normal features for users who have incomplete profiles or must change their password.
   - Design frontend guards to redirect users to `/change-password` or `/complete-profile` if needed.
5. **Audit Logging**: Create an `audit` app to log logins, password changes, updates, activations, etc.
6. **User Management API**: Expose routes for admins to list, view, update users, change categories, and reset passwords.
7. **Frontend Pages**: Build interfaces for login, profile completion, password change, own account, admin user list, admin edit user, and admin audit log list.
8. **No-Domain Confirmation**: Confirm no hospital, department, placement, resident profile, or other domain modules will be implemented in this brick.

## Risks
- Authentication middleware must intercept and correctly redirect/block users with incomplete profiles or required password changes at the API level, not just the frontend level.
- CORS or session configurations when integrating simple-jwt authentication. SimpleJWT headers need to be passed and verified.
- The default django auth groups/permissions should align with DRF permissions for the `UTRMC_ADMIN` role.

## Acceptance Criteria
- Custom User model exists with categories.
- JWT-based authentication works.
- Users with `must_change_password=True` are restricted to password change endpoints only.
- Users with `is_profile_complete=False` are restricted to profile completion endpoints only.
- Full audit logging for authentication and user changes.
- Frontend matches backend behavior and locks routes properly.
- All verification tests pass.
