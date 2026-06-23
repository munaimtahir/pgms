# Brick 3 Gates and Checks — PGMS

This document outlines the validation rules and criteria that must pass for Brick 3 (Supervisor Directory) to be accepted.

## Brick 3 Acceptance Gate

Brick 3 is accepted only if:

### 1. Data Integrity and Modeling
- `supervisors` app exists inside `pgms/backend/`.
- `SupervisorProfile` model exists.
- OneToOneField to `settings.AUTH_USER_MODEL` exists with `on_delete=models.PROTECT`.
- OneToOne relationship ensures only one profile per user.
- Model validations prevent linking `SupervisorProfile` to non-SUPERVISOR users.
- Verification tests confirm atomic rollback if user or profile creation fails.
- PMDC number and official email must be unique.

### 2. Service Layer Synchronization
- An explicit service layer function `create_supervisor_with_user` handles creations.
- No post-save signals are registered.
- Creating a SUPERVISOR User via `/users/new` redirects/guides the administrator to `/supervisors/new`.

### 3. API Scope and Filter Controls
- Endpoints `GET`, `POST`, `PATCH`, `DELETE` exist at `/api/supervisors/`.
- `DELETE` soft-deletes (archives) the record.
- Duplicate checking API exists at `/api/supervisors/check-duplicates/`.
- API queries allow searching/filtering by status, designation, program, specialty, department, and training site.

### 4. Role Permissions
- UTRMC_ADMIN has full permissions, including archive/unarchive.
- SUPPORT_STAFF can browse and view, but cannot create or edit/archive/unarchive supervisors.
- SUPERVISOR can only view and edit limited self details.
- RESIDENT is blocked from accessing the supervisor directory.

### 5. Audit logs
- Captures actions: `SUPERVISOR_CREATED`, `SUPERVISOR_UPDATED`, `SUPERVISOR_ARCHIVED`, `SUPERVISOR_UNARCHIVED`, `SUPERVISOR_DUPLICATE_CHECKED`.

### 6. Frontend
- Pages `/supervisors`, `/supervisors/new`, `/supervisors/[id]` exist and are styled with Vanilla CSS.

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
bash scripts/check_brick3.sh
```
