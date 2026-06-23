# Architecture Decision - Brick 3 Supervisor Directory

Date: 2026-06-23

## Status
- **ACCEPTED**

## 1. Separation of User Identity and Profile
- **Decision**: Authenticated credentials and category reside on the custom `User` model (`accounts` app). Detailed professional and supervisor records reside on the `SupervisorProfile` model (`supervisors` app).
- **Why**: Keeps the auth layer thin, robust, and compatible with future multi-provider OAuth, while isolating postgraduate supervisor lifecycles and credentials into a distinct model.
- **Constraints**:
  - One-to-one relationship between `User` and `SupervisorProfile`.
  - The linked `User.user_category` must be `SUPERVISOR`.
  - Orphan profiles or users are strictly forbidden.

## 2. Service-Layer Transactions vs Django Signals
- **Decision**: Avoid Django `post_save` or `pre_save` signals to handle profile/user synchronization. Instead, implement a dedicated service layer function `create_supervisor_with_user()` that wraps creation logic in an atomic database transaction (`transaction.atomic`).
- **Why**: Signals are implicit, difficult to test, and can fail silently or bypass validation checks. Explicit service-layer functions are predictable and guarantee rollback on partial failures.

## 3. Departmental & Master Linkages (Temporary Text Strategy)
- **Decision**: Since master tables (Hospitals, Departments) are not implemented until Brick 4, we will store training sites, departments, designations, and programs as temporary text fields:
  - `institution_name`
  - `department_name`
  - `program_name`
  - `specialty_name`
  - `subspecialty_name`
  - `designation`
- **Why**: Allows building the phonebook and directories without locking master tables early.
- **Consequence**: These columns will be mapped and migrated to proper ForeignKey references in Brick 4.

## 4. Deactivation & Archiving Strategy
- **Decision**: We will enforce soft deletes. Deleting a supervisor via `DELETE /api/supervisors/{id}/` does not destroy the database row; instead, it sets `is_archived = True`, records the timestamp, and logs the action in the audit trail.
- **Access**: Only `UTRMC_ADMIN` is permitted to archive and unarchive supervisors.

## 5. User Creation Synchronization
- **Decision**: To prevent orphan `SUPERVISOR` users, if an administrator attempts to create a user with category `SUPERVISOR` via `/users/new`, the frontend will block the submission and show a link directing them to `/supervisors/new`.

## 6. Access Control & Permissions
- `UTRMC_ADMIN`: Full permissions (Browse, view, create, edit, archive/unarchive, check duplicates).
- `SUPPORT_STAFF`: Browse, view. Cannot create, edit, or archive supervisors unless explicitly approved. For Brick 3, SUPPORT_STAFF is read-only.
- `SUPERVISOR`: Read-only self profile viewing and editing limited personal details (like office phone/office room). Cannot view list.
- `RESIDENT`: Blocked by default in Brick 3.
