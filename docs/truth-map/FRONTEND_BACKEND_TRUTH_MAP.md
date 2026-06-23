# Frontend / Backend Truth-Map — PGMS

This document maps all public and protected user interfaces (frontend) to their corresponding API endpoints, database models, and permission rules.

| Feature | Frontend route/component | Backend endpoint | Model/table | Permission | Status | Evidence |
|---|---|---|---|---|---|---|
| Health | `/health` | `GET /api/health/` | None | Public | Implemented | Brick 1 |
| Login | `/login` | `POST /api/auth/login/` | `accounts.User` | Public | Implemented | Brick 1 |
| Refresh Token | Auth Context / Axios Interceptor | `POST /api/auth/refresh/` | None | Public | Implemented | Brick 1 |
| Current user | Auth Context / Navigation | `GET /api/auth/me/` | `accounts.User` | Authenticated | Implemented | Brick 1 |
| Complete profile | `/complete-profile` | `PATCH /api/auth/complete-profile/` | `accounts.User` | Self (Authenticated) | Implemented | Brick 1 |
| Change password | `/change-password` | `POST /api/auth/change-password/` | `accounts.User` | Self (Authenticated) | Implemented | Brick 1 |
| User list | `/users` | `GET /api/users/` | `accounts.User` | `UTRMC_ADMIN` | Implemented | Brick 1 |
| Create user | `/users/new` | `POST /api/users/` | `accounts.User` | `UTRMC_ADMIN` | Implemented | Brick 1 |
| User detail/edit | `/users/[id]` | `GET` / `PATCH /api/users/{id}/` | `accounts.User` | `UTRMC_ADMIN` | Implemented | Brick 1 |
| Reset password | `/users/[id]` | `POST /api/users/{id}/reset-password/` | `accounts.User` | `UTRMC_ADMIN` | Implemented | Brick 1 |
| Audit list | `/audit` | `GET /api/audit/` | `audit.AuditLog` | `UTRMC_ADMIN` | Implemented | Brick 1 |
| Logout | Navigation logout CTA | `POST /api/auth/logout/` (blacklist token) | None | Authenticated | Implemented | Brick 1 |
| Resident list | `/residents` | `GET /api/residents/` | `residents.ResidentProfile` | `UTRMC_ADMIN`, `SUPPORT_STAFF` | Implemented | Brick 2 |
| Resident create | `/residents/new` | `POST /api/residents/` | `residents.ResidentProfile` + `accounts.User` | `UTRMC_ADMIN`, `SUPPORT_STAFF` | Implemented | Brick 2 |
| Resident detail/edit | `/residents/[id]` | `GET` / `PATCH /api/residents/{id}/` | `residents.ResidentProfile` | `UTRMC_ADMIN`, `SUPPORT_STAFF` | Implemented | Brick 2 |
| Resident self-view | `/residents/[id]` | `GET` / `PATCH /api/residents/{id}/` | `residents.ResidentProfile` | Self `RESIDENT` | Implemented | Brick 2 |
| Resident archive | `/residents/[id]` | `DELETE /api/residents/{id}/` | `residents.ResidentProfile` | `UTRMC_ADMIN` | Implemented | Brick 2 |
| Resident unarchive | `/residents/[id]` | `POST /api/residents/{id}/unarchive/` | `residents.ResidentProfile` | `UTRMC_ADMIN` | Implemented | Brick 2 |
| Resident duplicate check | `/residents/new` | `POST /api/residents/check-duplicates/` | None | `UTRMC_ADMIN`, `SUPPORT_STAFF` | Implemented | Brick 2 |
| Supervisor list | `/supervisors` | `GET /api/supervisors/` | `supervisors.SupervisorProfile` | `UTRMC_ADMIN`, `SUPPORT_STAFF` | Implemented | Brick 3 |
| Supervisor create | `/supervisors/new` | `POST /api/supervisors/` | `supervisors.SupervisorProfile` + `accounts.User` | `UTRMC_ADMIN` | Implemented | Brick 3 |
| Supervisor detail/edit | `/supervisors/[id]` | `GET` / `PATCH /api/supervisors/{id}/` | `supervisors.SupervisorProfile` | `UTRMC_ADMIN` | Implemented | Brick 3 |
| Supervisor self-view | `/supervisors/[id]` | `GET` / `PATCH /api/supervisors/{id}/` | `supervisors.SupervisorProfile` | Self `SUPERVISOR` | Implemented | Brick 3 |
| Supervisor archive | `/supervisors/[id]` | `DELETE /api/supervisors/{id}/` | `supervisors.SupervisorProfile` | `UTRMC_ADMIN` | Implemented | Brick 3 |
| Supervisor unarchive | `/supervisors/[id]` | `POST /api/supervisors/{id}/unarchive/` | `supervisors.SupervisorProfile` | `UTRMC_ADMIN` | Implemented | Brick 3 |
| Supervisor duplicate check | `/supervisors/new` | `POST /api/supervisors/check-duplicates/` | None | `UTRMC_ADMIN` | Implemented | Brick 3 |
| Supervisor view-only | `/supervisors` & `/[id]` | `GET /api/supervisors/` & `/{id}/` | `supervisors.SupervisorProfile` | `SUPPORT_STAFF` | Implemented | Brick 3 |
| Masters catalog lists | `/masters` | `GET /api/masters/{catalog}/` | `masters.{CatalogModel}` | Authenticated | Implemented | Brick 4 |
| Masters catalog write | `/masters` | `POST` / `PUT` / `PATCH /api/masters/{catalog}/{id}/` | `masters.{CatalogModel}` | `UTRMC_ADMIN` or `UTRMC_ADMIN_ACCESS` role | Implemented | Brick 4 |
| Masters catalog delete | `/masters` | `DELETE /api/masters/{catalog}/{id}/` | `masters.{CatalogModel}` | `UTRMC_ADMIN` or `UTRMC_ADMIN_ACCESS` role | Implemented | Brick 4 |
| Role assignment list | `/access/role-assignments` | `GET /api/access/role-assignments/` | `access.UserRoleAssignment` | `UTRMC_ADMIN` or `UTRMC_ADMIN_ACCESS` role | Implemented | Brick 4 |
| Role assignment edit/create | `/access/role-assignments` | `POST` / `PUT` / `DELETE /api/access/role-assignments/{id}/` | `access.UserRoleAssignment` | `UTRMC_ADMIN` or `UTRMC_ADMIN_ACCESS` role | Implemented | Brick 4 |
| Identity option catalog | Directory Pages / Forms | `GET /api/identity/options/` | None | Authenticated | Implemented | Brick 5 |
| User scopes | Navigation / Context | `GET /api/access/my-scope/` | `access.UserRoleAssignment` | Authenticated | Implemented | Brick 5 |

---

## Mapping Integrity Verification

- No frontend routes contain fake mocked flows.
- No backend endpoints are exposed without a dedicated frontend or administrative requirement.
- Access permissions are enforced at both frontend (navigation and routing guards) and backend (middleware/permissions) levels.
