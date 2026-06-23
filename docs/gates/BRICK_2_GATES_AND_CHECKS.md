# Brick 2 Gates and Checks — PGMS

This document outlines the validation rules and criteria that must pass for Brick 2 (Resident Directory) to be accepted.

## Brick 2 Acceptance Gate

Brick 2 is accepted only if:

### 1. Data Integrity and Modeling
- `residents` app exists inside `pgms/backend/`.
- `ResidentProfile` model exists.
- OneToOneField to `settings.AUTH_USER_MODEL` exists with `on_delete=models.PROTECT`.
- OneToOne relationship ensures only one profile per user.
- Model validations prevent linking `ResidentProfile` to non-RESIDENT users.
- Verification tests confirm atomic rollback if user or profile creation fails.
- CNIC and PMDC numbers must be unique.

### 2. Service Layer Synchronization
- An explicit service layer function `create_resident_with_user` handles creations.
- No post-save signals are registered for creating profile profiles.
- Creating a RESIDENT User via `/users/new` redirects the administrator to `/residents/new`.

### 3. API Scope and Filter Controls
- Endpoints `GET`, `POST`, `PATCH`, `DELETE` exist at `/api/residents/`.
- `DELETE` soft-deletes (archives) the record.
- Duplicate checking API exists at `/api/residents/check-duplicates/`.
- API queries allow searching by name, status, program, specialty, department, and training year.

### 4. Role Permissions
- UTRMC_ADMIN has full permissions, including archive/unarchive.
- SUPPORT_STAFF can create and edit, but cannot archive/unarchive.
- RESIDENT can only view and edit limited self details.
- SUPERVISOR is blocked from accessing the resident directory by default.

### 5. Audit logs
- Captures actions: `RESIDENT_CREATED`, `RESIDENT_UPDATED`, `RESIDENT_ARCHIVED`, `RESIDENT_UNARCHIVED`, `RESIDENT_DUPLICATE_CHECKED`.

### 6. Frontend
- Pages `/residents`, `/residents/new`, `/residents/[id]` exist and are styled with Vanilla CSS.

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
npm run typecheck
npm run lint
npm run build
```

### Scripted Verification
```bash
cd pgms
bash scripts/check_brick2.sh
```
