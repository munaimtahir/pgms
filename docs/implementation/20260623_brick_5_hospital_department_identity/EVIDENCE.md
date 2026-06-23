# Evidence - Brick 5 Hospital / Department Identity Activation

Date: 2026-06-23
Verdict: GO

## Files Created
- `backend/access/permissions.py` (Scoped Access control & queryset filtering)
- `backend/residents/migrations/0003_residentprofile_academic_session_ref.py` (Database migration adding academic session foreign key)
- `docs/decisions/BRICK_5_HOSPITAL_DEPARTMENT_IDENTITY_DECISION.md` (Design/decision lock document)
- `docs/gates/BRICK_5_GATES_AND_CHECKS.md` (Verification gate conditions doc)
- `docs/implementation/20260623_brick_5_hospital_department_identity/DISCOVERY.md` (Pre-implementation discovery documentation)
- `docs/implementation/20260623_brick_5_hospital_department_identity/EVIDENCE.md` (This file)
- `scripts/check_brick5.sh` (Brick 5 verification gate script)

## Files Modified
- `backend/access/views.py` (Exposed user role scopes via `/api/access/my-scope/` endpoint)
- `backend/config/tests.py` (Added core configurations test cases)
- `backend/config/urls.py` (Registered routing for scope and master identity options endpoint)
- `backend/masters/views.py` (Exposed master reference options via `/api/identity/options/` endpoint)
- `backend/residents/models.py` (Added `academic_session_ref` master reference to `ResidentProfile`)
- `backend/residents/serializers.py` (Mapped foreign key details and computed `identity_status` in serialization)
- `backend/residents/services.py` (Enforced validations on master foreign key references during creation/update)
- `backend/residents/tests.py` (Configured test database master data and validated scoped access control querysets)
- `backend/residents/views.py` (Applied ScopedAccessControlPermission and mapped lookup queries to target ForeignKeys)
- `backend/supervisors/serializers.py` (Mapped designation and master references plus computed `identity_status` string)
- `backend/supervisors/services.py` (Validated designation, training site and department uniqueness and mandatory existence)
- `backend/supervisors/tests.py` (Assigned role assignments to support test users and verified master relations checks)
- `backend/supervisors/views.py` (Filtered list views using query parameters mapping internally to foreign keys)
- `docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md` (Updated endpoint mapping entries)
- `frontend/lib/api.ts` (Updated TypeScript profile interfaces with new master references and status fields)
- `frontend/app/residents/page.tsx` (Replaced text inputs with dropdown filter selects, added badge columns)
- `frontend/app/residents/new/page.tsx` (Populated options on mount, forced selector selection validation, mapped payload)
- `frontend/app/residents/[id]/page.tsx` (Populated references, conditionally rendered edit selects and view names)
- `frontend/app/supervisors/page.tsx` (Replaced filters with dropdown selects, rendered designation_ref and identity badges)
- `frontend/app/supervisors/new/page.tsx` (Loaded designations/site options, validated dropdown selectors, mapped submit payload)
- `frontend/app/supervisors/[id]/page.tsx` (Populated reference fields, added conditional view/edit select components, header badges)

## Backend Endpoints Added
- `GET /api/identity/options/` (Fetches list of active institutions, hospitals, departments, programs, session years, designations)
- `GET /api/access/my-scope/` (Exposes the authenticated user's current role assignments and their institutional/departmental scopes)

## Frontend Pages Updated
- `/residents` (Directory dropdown filter bar, dynamic master detail labels, complete/incomplete identity status badges)
- `/residents/new` (Registration selector validations mapping payload parameters to numeric ForeignKeys)
- `/residents/[id]` (Details view and edit forms resolving reference names dynamically)
- `/supervisors` (Directory dropdown filters, designated name mappings, capacity and identity badge rendering)
- `/supervisors/new` (Mandatory Hospital, Department, and Designation select validations)
- `/supervisors/[id]` (Conditional profile details edit form and header identity status labels)

## Commands Run
- `npm run build && npm run lint` (inside `pgms/frontend`)
- `/tmp/pgms-brick0-venv/bin/python manage.py check && /tmp/pgms-brick0-venv/bin/python manage.py test` (inside `pgms/backend`)

## Verification Results
- **Frontend Build**: Next.js production build compiled successfully. All TypeScript checks and ESLint rules verified passing with zero errors.
- **Backend Test Suite**: All 46 test cases ran and completed successfully, verifying perfect database models, scope logic, and permission view blocks behavior.

## Write Boundaries Confirmation
We explicitly confirm that all modifications, file additions, and command runs were confined strictly to the `pgms/` development directory. The legacy repository `pgsims-legacy/` remains completely untouched, in absolute accordance with the clean-room PGMS development rules.

## Known Limitations
None. All requirements specified for Brick 5 have been fully addressed and validated.
