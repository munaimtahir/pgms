# Evidence - Brick 2 Resident Directory

Date: 2026-06-23

## Files Created/Modified

### Backend Created
- `residents/` directory structure:
  - `residents/migrations/0001_initial.py` (Model schema migration)
  - `residents/tests.py` (Comprehensive unit and integration test suite)
- Verification script:
  - `scripts/check_brick2.sh` (Assertions checker)

### Backend Modified
- `residents/services.py` (Fixed Attribute error with `created_by` serialization)
- `residents/serializers.py` (Made User details write-only in `ResidentCreateSerializer` and implemented custom `to_representation` to avoid AttributeError)
- `residents/views.py` (Allowed `unarchive` action to query archived records in `get_queryset` and fixed AttributeError in audit logging)
- `config/settings.py` (Migrated and updated DB configs)
- `accounts/tests.py` (Adjusted user creation test to use `SUPPORT_STAFF` instead of raw `SUPERVISOR` to align with identity isolation constraints)

### Frontend Created
- `frontend/app/residents/page.tsx` (Directory list view, search, filters)
- `frontend/app/residents/new/page.tsx` (Register resident view, interactive unique duplication indicators)
- `frontend/app/residents/[id]/page.tsx` (Detail view, edit mode, admin options for archive/unarchive and password resets)

### Frontend Modified
- `frontend/lib/api.ts` (Added `ResidentProfile` interface and added `is_active` field to `User` interface)
- `frontend/components/Navbar.tsx` (Added Residents directory navigation link for Admin/Support categories)
- `frontend/app/users/new/page.tsx` (Blocked raw Resident/Supervisor creation flows and redirected/styled with a notification)

### Documentation Created/Updated
- `docs/implementation/20260623_brick_2_resident_directory/DISCOVERY.md`
- `docs/implementation/20260623_brick_2_resident_directory/EVIDENCE.md`
- `docs/decisions/BRICK_2_RESIDENT_DIRECTORY_DECISION.md`
- `docs/gates/BRICK_2_GATES_AND_CHECKS.md`
- `docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md`

## Backend Endpoints Implemented
- `GET    /api/residents/` (List residents, handles filters)
- `POST   /api/residents/` (Create resident + user)
- `GET    /api/residents/{id}/` (Retrieve single resident detail)
- `PATCH  /api/residents/{id}/` (Modify resident details)
- `DELETE /api/residents/{id}/` (Soft-delete/archive resident, deactivates user)
- `POST   /api/residents/{id}/unarchive/` (Restore resident, reactivates user)
- `POST   /api/residents/check-duplicates/` (Interactive duplicates validator)

## Frontend Routes Implemented
- `/residents` (Directory browser)
- `/residents/new` (Add resident form)
- `/residents/[id]` (View/update details, admin tools)

## Commands Run & Verification Results

### Backend Checks
```bash
# Verify migrations check out
/tmp/pgms-brick0-venv/bin/python manage.py check
# Run full unit and integration tests
/tmp/pgms-brick0-venv/bin/python manage.py test
```
**Result**: Found 19 tests. System check identified no issues. All 19 tests passed successfully (including rollback transactions, soft archiving, permissions, and audit logs).

### Frontend Checks
```bash
# Verify type safety
npx tsc --noEmit
# Run Next.js linting
npm run lint
# Verify compilation build
npm run build
```
**Result**:
- Typecheck: Compiled successfully.
- Lint: Completed successfully with 0 errors.
- Build: Optimized production build generated successfully. All static and dynamic pages prerendered.

### Scripted Verification
```bash
bash scripts/check_brick2.sh
```
**Result**:
```text
=========================================
PGMS Brick 2 Gate & Check Verification
=========================================
Checking backend structure...
✔ Checked path: backend/residents exists.
✔ Checked path: backend/residents/models.py exists.
✔ ResidentProfile model verified in models.py.
✔ Checked path: backend/supervisors is correctly absent.
✔ Checked path: backend/masters is correctly absent.
Checking frontend routes...
✔ Checked path: frontend/app/residents/page.tsx exists.
✔ Checked path: frontend/app/residents/new/page.tsx exists.
✔ Checked path: frontend/app/residents/[id]/page.tsx exists.
✔ Checked path: frontend/app/supervisors is correctly absent.
✔ Checked path: frontend/app/masters is correctly absent.
Checking documentation files...
✔ Checked path: docs/implementation/20260623_brick_2_resident_directory/DISCOVERY.md exists.
✔ Checked path: docs/implementation/20260623_brick_2_resident_directory/EVIDENCE.md exists.
✔ Checked path: docs/decisions/BRICK_2_RESIDENT_DIRECTORY_DECISION.md exists.
✔ Checked path: docs/gates/BRICK_2_GATES_AND_CHECKS.md exists.
✔ Checked path: docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md exists.
-----------------------------------------
✔ All Brick 2 Gate verification checks PASSED!
=========================================
```

## Write Boundary & Design Constraints
- All edits happened inside the `pgms/` folder.
- Absolutely zero legacy files inside `pgsims-legacy/` were modified.
- No legacy code was copied wholesale; logic was re-derived.
- Absolutely no SupervisorProfile or Masters models were created, ensuring strict Brick separation.

## Known Limitations
- Postgraduate master definitions (Hospitals, Departments, Specialties, Programs) are currently represented as freeform text fields. Under Brick 4, they will be migrated to ForeignKey model references.

## Final Verdict
**GO**
