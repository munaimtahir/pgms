# Architecture Decision - Brick 5 Hospital / Department Identity Activation

Date: 2026-06-23

## Status
- **ACCEPTED**

## 1. Master Identity Simplification
- **Decision**: Activate master fields for resident and supervisor directories to move away from free-text representation to structured keys.
- **Wording/Labels Alignment**:
  - `TrainingSite` will be internally mapped but labeled as **Hospital** across all user-facing screens and naming schemas.
  - `Department` will represent **Department / Discipline**.
  - `Program` represents **Program**.
  - `AcademicSession` represents **Session** / Induction Year.
  - `Specialty` is designated as optional/reserved for the pilot; it is not required for resident/supervisor setup or Brick 6 assignments.
  - `Designation` maps directly to supervisor ranks.

## 2. API Level Validation Enforcements
- **Decision**: DB columns remain nullable to prevent breaking backward-compatibility for transitional entries. Serializer validators will require the structured FK identity fields upon creation of new residents/supervisors and identity completion.
- **Resident Complete Identity Requirements**:
  - Hospital (`training_site_ref`)
  - Department / Discipline (`department_ref`)
  - Program (`program_ref`)
  - Session (`academic_session_ref`)
- **Supervisor Complete Identity Requirements**:
  - Hospital (`training_site_ref`)
  - Department / Discipline (`department_ref`)
  - Designation (`designation_ref`)

## 3. Computed Identity Status
- **Decision**: Expose `identity_status` field on profiles:
  - `COMPLETE`: If all required operational FK relations are populated.
  - `INCOMPLETE`: If any required FK relation is missing.

## 4. Scoped Visibility Enforcements
- **Decision**: Enforce role-based access filtering at backend database queryset levels (not just UI-level hidden elements) via `UserRoleAssignment` scopes:
  - `UTRMC_ADMIN` / `UTRMC_ADMIN_ACCESS` role assignment: Global access.
  - `SUPPORT_STAFF` / `SUPPORT_STAFF_ACCESS` / `DATA_ENTRY_ACCESS` / `AUDITOR_ACCESS`: Restricted view based on the scope bounds (GLOBAL, INSTITUTION, TRAINING_SITE/HOSPITAL, DEPARTMENT, etc.) linked to the UserRoleAssignment model.
  - `RESIDENT` & `SUPERVISOR`: own profile only (unless additional delegation exists).

## 5. Audit Trails Logging
- **Decision**: Audit changes to Resident identity, Supervisor identity, and Role Assignments using the `audit.AuditLog` service. Log the actor, action, timestamp, target IDs, IP address, user agent, and before/after payloads.
