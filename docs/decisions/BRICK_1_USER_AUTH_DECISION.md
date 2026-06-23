# Architecture Decision - Brick 1 User Categories & Auth Foundation

Date: 2026-06-23

## Status
- **ACCEPTED**

## 1. Custom User Model Decision
We will use a custom user model `User` extending Django's `AbstractUser` instead of Django's default User model.
- **Why default Django User is not used**: Extending `AbstractUser` at the start of the project is a standard Django best practice. It avoids complex database migrations later when adding custom fields like `user_category`, `is_profile_complete`, or `must_change_password`.
- **Identity Boundary**: The custom User model represents login identity and access roles only. It is kept minimal and will *not* contain heavy resident-specific or supervisor-specific fields (like academic years, specialties, home department references, etc.). Those details will be isolated in separate profile models (e.g. `ResidentProfile`, `SupervisorProfile`) in future bricks.

## 2. User Categories
We define four explicit user roles under `user_category`:
- `RESIDENT`: Postgraduate trainee/student.
- `SUPERVISOR`: Faculty/training supervisor.
- `SUPPORT_STAFF`: Clerical/operational support.
- `UTRMC_ADMIN`: Main administrative authority with user management and audit viewing access.

## 3. Authentication & Login Method
- **Login Handle**: In Brick 1, username and password authentication will be used.
- **Token Mechanism**: We will use `djangorestframework-simplejwt` for stateless JSON Web Token (JWT) authentication, allowing the Next.js frontend to securely access backend APIs.
- **Future Compatibility**: We will design the `User` model to allow future authentication methods:
  - **Email login**: The `email` field is unique when populated, but nullable at the database level to accommodate accounts without defined emails initially. Normalization will map blank emails to null to avoid empty string collision errors.
  - **Google / Institutional Workspace login**: Keeping the internal `id` as the permanent identity anchor rather than `username` ensures we can link external identity providers (like Google OAuth) to the same account later.

## 4. First-Login & Profile Completion Rules
To ensure data quality, we implement strict state transitions:
- **Change Password Rule (`must_change_password`)**: Accounts created by UTRMC Admins are assigned temporary passwords, with `must_change_password=True` by default. Upon authentication, the user is restricted to changing their password. Only after changing their password is the flag set to `False`.
- **Profile Completion Rule (`is_profile_complete`)**: Newly created normal users (Resident, Supervisor, Support Staff) have `is_profile_complete=False` by default. They are restricted to completing their profile (`full_name`, `phone`, `email` are required). Once done, `is_profile_complete` becomes `True`, and normal access is granted.
- **Access States**:
  - **Blocked (Inactive)**: `is_active=False`. Cannot authenticate.
  - **Change Password Restricted**: Authenticated + `must_change_password=True`. API requests to endpoints other than password-change are blocked with HTTP 403.
  - **Profile Completion Restricted**: Authenticated + `must_change_password=False` + `is_profile_complete=False`. API requests to endpoints other than profile completion are blocked with HTTP 403.
  - **Active / Verified**: Authenticated + `must_change_password=False` + `is_profile_complete=True`. Full role-based access to normal endpoints.

## 5. Self-Registration and User Management
- **No Self-Registration**: There is no public registration endpoint. All users are provisioned and managed by a `UTRMC_ADMIN`.
- **Role Permissions**:
  - `UTRMC_ADMIN`: Complete user management (listing, viewing, updating, creating, deactivating, resetting passwords) and audit log visibility.
  - Others (`RESIDENT`, `SUPERVISOR`, `SUPPORT_STAFF`): Restricted to viewing and editing their own profile/changing their own password.

## 6. Audit Rule
An `audit` app will capture every system mutation and authentication event.
- **Append-only**: The `AuditLog` table will be append-only. No user (including Admins) can edit or delete audit records.
- **Actions Captured**: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_CHANGED`, `PASSWORD_RESET_BY_ADMIN`, `PROFILE_COMPLETED`, `PROFILE_UPDATED`, `USER_CREATED`, `USER_UPDATED`, `USER_DEACTIVATED`, `USER_ACTIVATED`.
