# Brick 4 Gates and Checks — PGMS

This document outlines the validation rules and criteria that must pass for Brick 4 (Masters + Departmental Scope Foundation) to be accepted.

## Brick  acceptance Gate

Brick 4 is accepted only if:

### 1. Master Data Foundation
- `masters` app exists inside `pgms/backend/`.
- Models `Institution`, `TrainingSite`, `Department`, `Program`, `Specialty`, `Designation`, and `AcademicSession` exist with standardized audit columns.
- TrainingSite links to Institution, Department links to TrainingSite, Specialty links to Program.
- Unique codes are enforced on master entities.

### 2. Profile Nullable References
- `ResidentProfile` has nullable master references: `institution_ref`, `training_site_ref`, `department_ref`, `program_ref`, `specialty_ref`.
- `SupervisorProfile` has nullable master references: `institution_ref`, `training_site_ref`, `department_ref`, `program_ref`, `specialty_ref`, `designation_ref`.
- Original free-text columns are fully retained.

### 3. Departmental Scope Foundation
- `access` app exists inside `pgms/backend/`.
- `UserRoleAssignment` model handles fine-grained roles and scopes.
- Permissions correctly validate scope rules.

### 4. API Endpoints
- Viewsets and routing exist for all master tables under `/api/masters/`.
- Viewset and routing exist for UserRoleAssignment under `/api/access/role-assignments/`.
- Access controls restrict management to `UTRMC_ADMIN` or users with `UTRMC_ADMIN_ACCESS` role.

### 5. Audit logs
- Captures actions: `MASTER_CREATED`, `MASTER_UPDATED`, `MASTER_DEACTIVATED`, `MASTER_REACTIVATED`, `ROLE_ASSIGNMENT_CREATED`, `ROLE_ASSIGNMENT_UPDATED`, `ROLE_ASSIGNMENT_DEACTIVATED`, `ROLE_ASSIGNMENT_REACTIVATED`, `RESIDENT_MASTER_REF_UPDATED`, `SUPERVISOR_MASTER_REF_UPDATED`.

### 6. Frontend Routes
- Pages exist under `/masters/`, `/masters/institutions`, `/masters/training-sites`, `/masters/departments`, `/masters/programs`, `/masters/specialties`, `/masters/designations`, `/masters/academic-sessions`, and `/access/role-assignments`.
- Styled using glassmorphic Vanilla CSS.

---

## Validation Commands

Run these checks to verify the gates:

### Backend Checks
```bash
cd pgms/backend
/tmp/pgms-brick0-venv/bin/python manage.py makemigrations --check --dry-run
/tmp/pgms-brick0-venv/bin/python manage.py check
/tmp/pgms-brick0-venv/bin/python manage.py test
```

### Frontend Checks
```bash
cd pgms/frontend
npx tsc --noEmit
npm run lint
npm run build
```

### Scripted Verification
```bash
cd pgms
bash scripts/check_brick4.sh
```
