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

---

## Mapping Integrity Verification

- No frontend routes contain fake mocked flows.
- No backend endpoints are exposed without a dedicated frontend or administrative requirement.
- Access permissions are enforced at both frontend (navigation and routing guards) and backend (middleware/permissions) levels.
