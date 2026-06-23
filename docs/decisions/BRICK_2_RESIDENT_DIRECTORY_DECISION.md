# Architecture Decision - Brick 2 Resident Directory

Date: 2026-06-23

## Status
- **ACCEPTED**

## 1. Separation of User Identity and Profile
- **Decision**: Authenticated account credentials and categories reside on the custom `User` model (`accounts` app). Detailed training and profile records reside on the `ResidentProfile` model (`residents` app).
- **Why**: Keeps the auth layer thin, robust, and compatible with future multi-provider OAuth, while isolating postgraduate academic lifecycles into a distinct model.
- **Constraints**:
  - One-to-one relationship between `User` and `ResidentProfile`.
  - The linked `User.user_category` must be `RESIDENT`.
  - Orphan profiles or users are strictly forbidden.

## 2. Service-Layer Transactions vs Django Signals
- **Decision**: Avoid Django `post_save` or `pre_save` signals to handle profile/user synchronization. Instead, implement a dedicated service layer function `create_resident_with_user()` that wraps creation logic in an atomic database transaction (`transaction.atomic`).
- **Why**: Signals are implicit, difficult to test, and can fail silently or bypass validation checks, leading to corrupt or orphan states. Explicit service-layer functions are predictable and guarantee rollback on partial failures.

## 3. Departmental & Master Linkages (Temporary Text Strategy)
- **Decision**: Since master tables (Hospitals, Departments) are not implemented until Brick 4, we will store training sites and departments as temporary text fields:
  - `institution_name`
  - `department_name`
  - `program_name`
  - `specialty_name`
- **Why**: Allows building the phonebook and directories without creating incomplete or locked master tables early.
- **Consequence**: These columns will be mapped and migrated to proper ForeignKey references in Brick 4.

## 4. Deactivation & Archiving Strategy
- **Decision**: We will enforce soft deletes. Deleting a resident via `DELETE /api/residents/{id}/` does not destroy the database row; instead, it sets `is_archived = True`, records the timestamp, and logs the action in the audit trail.
- **Access**: Only `UTRMC_ADMIN` is permitted to archive and unarchive residents.

## 5. User Creation Synchronization
- **Decision**: To prevent orphan `RESIDENT` users, if an administrator attempts to create a user with category `RESIDENT` via `/users/new`, the frontend will block the submission and redirect/show a message directing the administrator to use `/residents/new`.

## 6. Access Control & Permissions
- `UTRMC_ADMIN`: Full permissions (Browse, view, create, edit, archive/unarchive, check duplicates).
- `SUPPORT_STAFF`: Browse, view, create, edit details, and run duplicate checks.
- `RESIDENT`: Read-only self profile viewing and editing limited personal details (like phone/address).
- `SUPERVISOR`: Blocked by default in Brick 2.
