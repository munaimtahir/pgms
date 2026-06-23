# Discovery - Brick 2 Resident Directory

Date: 2026-06-23

## Current `pgms/` state
- **Brick 1** (User Categories and Auth Foundation) is complete. Custom User model, JWT auth, and permission guards are fully implemented and verified.
- **Verification status**: All 8 backend tests and Next.js frontend build are passing successfully.

## Legacy repository status
- Checked `pgsims/` reference vault.
- In legacy PGSIMS, user accounts and resident training details were merged inside the `User` model.
- In the new PGMS clean-room rebuild, we are separating identity (`User` model) from training profile details (`ResidentProfile` model).
- Under no circumstances will legacy models, views, or code be copied wholesale.

## Plan for Brick 2
1. **Create `residents` backend app**: Define `ResidentProfile` with a 1-to-1 relationship to the `RESIDENT` User.
2. **Implement synchronization creation service**: Write `create_resident_with_user()` that handles transaction-safe atomic creations of both `User` and `ResidentProfile` together, creating corresponding AuditLogs and disabling any post-save signals.
3. **Synchronize User management integration**: Modify backend viewset and frontend `/users/new` to redirect RESIDENT user creation flows to the dedicated `/residents/new` path to ensure no orphan RESIDENT users are created.
4. **Resident API Endpoints**: Expose `/api/residents/` CRUD views. Implement soft delete (archives and unarchives) via `is_archived` flag. Expose duplicate CNIC/email check API `/api/residents/check-duplicates/`.
5. **Permissions**:
   - `UTRMC_ADMIN`: Full CRUD, archive, unarchive, duplicate warnings.
   - `SUPPORT_STAFF`: Create, view, edit (limited fields). Cannot archive.
   - `RESIDENT`: Read-only/limited self-edit of own profile.
   - `SUPERVISOR`: Blocked by default.
6. **Frontend Views**: Create `/residents`, `/residents/new`, and `/residents/[id]` pages in Next.js using Vanilla CSS and glassmorphic designs.
7. **Verification**: Draft backend test suite verifying relationship validation, transactional rollbacks, duplicate checks, permission rules, and audit logs. Create check script `check_brick2.sh`.

## Risks
- Transaction failures: Ensuring that if `ResidentProfile` creation fails (e.g. invalid CNIC or training details), the linked `User` creation is rolled back.
- Authorization mapping: Ensuring `SUPPORT_STAFF` users can execute duplicate checks and creations, but are restricted from deactivations or archives.

## Acceptance Criteria
- `residents` app exists. `ResidentProfile` model requires a `RESIDENT` category User.
- Creating a resident atomically creates the User + Profile.
- Users cannot create `ResidentProfile` linked to `UTRMC_ADMIN` or other category users.
- API endpoints support filtering by status, program, specialty, department, and training year.
- Front-end views are fully wired to the backend and enforce proper redirection gates.
- All verification checks pass.
