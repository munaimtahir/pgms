# Brick 5 Gates and Checks — PGMS

This document outlines the validation rules and criteria that must pass for Brick 5 (Hospital / Department Identity Activation) to be accepted.

## Brick Acceptance Gate

Brick 5 is accepted only if:

### 1. Master Identity Integration
- ResidentProfile and SupervisorProfile link to master models using nullable FKs.
- `academic_session_ref` is present on ResidentProfile.
- Serializers validate required identity FKs on creation of new profiles or updates.
- Resident requires: `training_site_ref` (Hospital), `department_ref`, `program_ref`, `academic_session_ref`.
- Supervisor requires: `training_site_ref` (Hospital), `department_ref`, `designation_ref`.

### 2. Computed Identity Status
- Serializer response includes `identity_status` field.
- `COMPLETE` if required FK relations are set, `INCOMPLETE` otherwise.

### 3. Scoped Viewset Filtering
- Support Staff, Data Entry, Auditor, and Department Admin have directories lists filtered according to user scope assignments.
- Scope checks cannot be bypassed by direct API calls.

### 4. Custom Audit Logs
- Creates audit logs on resident/supervisor identity updates and role assignments changes, capturing IP address, User-Agent, actor, and before/after states.

### 5. Frontend Pages
- `/residents`, `/residents/new`, `/residents/[id]` support filters and master dropdown inputs.
- `/supervisors`, `/supervisors/new`, `/supervisors/[id]` support filters and master dropdown inputs.
- Terminology uses: Hospital, Department / Discipline, Program, Session, Designation.
- Specialty is kept optional and not required.

---

## Validation Commands

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
npm run lint
npm run build
```

### Scripted Verification
```bash
cd pgms
bash scripts/check_brick5.sh
```
