# Discovery - Brick 3 Supervisor Directory

Date: 2026-06-23

## Current `pgms/` state
- **Brick 2** (Resident Directory) is complete, verified, and committed. All 19 backend tests and Next.js frontend builds are fully passing.
- **Verification status**: `check_brick2.sh` runs successfully.

## Legacy repository status
- Inspected legacy system references.
- In legacy, supervisors and user accounts were stored in a mixed format, resulting in orphaned supervisor profiles.
- For PGMS, we will decouple authenticated accounts (`User`) from supervisor details (`SupervisorProfile`) and enforce One-to-One category integrity.

## Plan for Brick 3
1. **Create `supervisors` backend app**: Define `SupervisorProfile` model.
2. **Implement synchronization creation service**: Write `create_supervisor_with_user()` that transactionally provisions `User(category=SUPERVISOR)` and a linked `SupervisorProfile` with AuditLogs.
3. **Synchronize User management integration**: Ensure `/users/new` redirects attempts to create `SUPERVISOR` accounts to `/supervisors/new`.
4. **Supervisor API Endpoints**: Expose `/api/supervisors/` CRUD views. Implement soft delete (archives and unarchives) via `is_archived` flag. Expose duplicate checking API `/api/supervisors/check-duplicates/`.
5. **Permissions**:
   - `UTRMC_ADMIN`: Full CRUD, archive, unarchive, duplicate warnings.
   - `SUPPORT_STAFF`: Browse, view only. Cannot create or edit supervisors.
   - `SUPERVISOR`: Read-only self profile viewing and editing limited personal contact fields.
   - `RESIDENT`: Blocked completely from accessing the supervisor directory.
6. **Frontend Views**: Create `/supervisors`, `/supervisors/new`, and `/supervisors/[id]` pages in Next.js using Vanilla CSS and glassmorphic designs.
7. **Verification**: Add comprehensive backend tests to `supervisors/tests.py` and create `scripts/check_brick3.sh`.

## Risks
- Transaction failures: Rolling back `User` creation if `SupervisorProfile` validation or insertion fails.
- Access control: Preventing residents from accessing supervisor details in Brick 3.

## Acceptance Criteria
- `supervisors` app exists. `SupervisorProfile` requires a `SUPERVISOR` user category.
- Creating a supervisor atomically creates User + Profile.
- Duplicate PMDC and email validations are enforced.
- View permissions restrict SUPPORT_STAFF to read-only browsing, RESIDENT to blocked.
- Soft delete deactivates supervisor's user login.
- `check_brick3.sh` verification passes.
