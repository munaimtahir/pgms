# Discovery - Brick 5 Hospital / Department Identity Activation

Date: 2026-06-23

## Existing Naming & Structure
- Backend models from Brick 4:
  - `masters.Institution`
  - `masters.TrainingSite` (maps to actual hospitals)
  - `masters.Department` (maps to department/discipline)
  - `masters.Program` (Degree tracks)
  - `masters.Specialty` (Reserved/Optional)
  - `masters.Designation` (Ranks)
  - `masters.AcademicSession` (Sessions)
  - `access.UserRoleAssignment` (Permissions mapping)

- **Chosen User-Facing Labels**:
  - `TrainingSite` labeled as **Hospital**
  - `Department` labeled as **Department / Discipline**
  - `AcademicSession` labeled as **Session**
  - `Specialty` labeled as **Specialty (Optional)**

## Implementation Naming Strategy
- Backend uses existing fields: `training_site_ref`, `department_ref`, `program_ref`, `academic_session_ref`, `designation_ref`, `institution_ref`, `specialty_ref`.
- Frontend API serializes IDs, labels, transition text fields, and computed `identity_status` (`COMPLETE` vs `INCOMPLETE`).

## Scope & Access Enforcements
- Permissions filter backend viewsets to prevent scope bypass.
- User categories are protected: RESIDENT and SUPERVISOR profiles synchronized with Django user profiles atomically.

## Risks
- Data fragmentation for existing text-only entries: null references are accepted dynamically, but serializers require FK fields for updates and new entries.

## forbidden Modules Checked Absent
- No supervision mapping (ResidentSupervisorAssignment is deferred to Brick 6).
- No rotation dashboards or evaluator components.
