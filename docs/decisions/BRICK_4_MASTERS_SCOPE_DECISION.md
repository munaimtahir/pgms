# Architecture Decision - Brick 4 Masters + Departmental Scope

Date: 2026-06-23

## Status
- **ACCEPTED**

## 1. Master Data Entities
- **Decision**: Define proper master tables in a new `masters` app to handle core organizational and academic taxonomies:
  - `Institution`
  - `TrainingSite` (Hospitals/College sites under an institution)
  - `Department` (Under a training site)
  - `Program` (Degree/Training programs like FCPS, MD, MS)
  - `Specialty` (Under a program)
  - `Designation` (Professional ranks)
  - `AcademicSession` (Academic years)
- **Why**: Transitioning from freeform text fields in directories to standardized data structures enables clean indexing, reporting, quality controls, and validation.

## 2. Nullable References Transition Strategy
- **Decision**: Add nullable ForeignKey fields to `ResidentProfile` and `SupervisorProfile` referencing the new master tables. Keep the original free-text columns intact for transition, migration compatibility, and fallback mapping.
- **Consequence**: Automatic conversion is avoided to prevent data loss. A manual mapping API / admin utility will allow administrative alignment.

## 3. Departmental Scope Foundation (Role Assignments)
- **Decision**: Create an assignment model `UserRoleAssignment` inside a new `access` app to handle fine-grained permissions.
- **Scope Model**:
  - `user`: Linked user account.
  - `role`: UTRMC_ADMIN_ACCESS, SUPPORT_STAFF_ACCESS, DATA_ENTRY_ACCESS, AUDITOR_ACCESS, DEPARTMENT_ADMIN_ACCESS.
  - `scope_type`: GLOBAL, INSTITUTION, TRAINING_SITE, DEPARTMENT, PROGRAM, SPECIALTY.
  - Scope links (ForeignKeys to master models): `institution`, `training_site`, `department`, `program`, `specialty`.
- **Enforcement Rules**:
  - The primary User category remains unchanged (e.g. category `SUPERVISOR` stays `SUPERVISOR` even if granted `UTRMC_ADMIN_ACCESS`).
  - Scoped assignments determine data visibility in directories and training dashboards (e.g., support staff restricted to view only their assigned department's residents).

## 4. Archiving Masters and Scope Assignments
- **Decision**: Master data records cannot be hard deleted. Setting `is_active = False` deactivates them. Scope assignments are deactivated via `is_active = False` or by deletion of the assignment (using soft delete or deactivated toggle).
