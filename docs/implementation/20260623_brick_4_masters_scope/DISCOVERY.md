# Discovery - Brick 4 Masters + Departmental Scope Foundation

Date: 2026-06-23

## Current `pgms/` state
- **Brick 3** (Supervisor Directory) is complete and verified. 30 backend tests and frontend builds are passing.
- **Verification status**: `check_brick3.sh` runs successfully.

## Legacy repository status
- Inspected legacy data structures. Legacy system did not enforce standardized departmental structures, causing massive data entry errors and fragmentation.
- In PGMS, we will implement strict master tables to clean data entry, and use a flexible scope model to restrict Support Staff views dynamically.

## Plan for Brick 4
1. **Create `masters` backend app**: Define models `Institution`, `TrainingSite`, `Department`, `Program`, `Specialty`, `Designation`, and `AcademicSession`.
2. **Add Profile References**: Add nullable ForeignKey reference columns to `ResidentProfile` and `SupervisorProfile` models. Keep the existing text fields.
3. **Create `access` backend app**: Define `UserRoleAssignment` model to support scoped access.
4. **Register API Endpoints**: Expose master management under `/api/masters/` and role assignments under `/api/access/role-assignments/`.
5. **Permissions**: Standardize roles (`UTRMC_ADMIN_ACCESS`, `SUPPORT_STAFF_ACCESS`, etc.) and scopes (`GLOBAL`, `DEPARTMENT`, etc.) and implement helper permissions check logic.
6. **Frontend Views**: Create master browse directories and role scope management pages.
7. **Verification**: Draft backend test suite verifying relationship hierarchies, nullable profiles references, and UserRoleAssignment scope evaluations. Create `check_brick4.sh`.

## Risks
- Hierarchy validation: Preventing a specialty linking to a program it doesn't belong to.
- Backward compatibility: Keeping old directory profiles functioning properly as new columns are added.

## Acceptance Criteria
- `masters` app exists with core models.
- Profiles contain new nullable ForeignKey fields.
- `access` app exists with `UserRoleAssignment`.
- Admin can edit role assignments.
- All verification commands succeed.
