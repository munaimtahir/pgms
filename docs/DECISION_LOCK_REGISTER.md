# Decision Lock Register — PGMS

This file records decisions only after explicit review and acceptance.

| ID | Area | Decision | Status | Date | Notes |
|---|---|---|---|---|---|
| D-000 | Project reset | `pgms/` is a new clean-room project; legacy is source-material only | LOCKED | TBD | No legacy model accepted automatically |
| D-001 | Brick 0 scope | Scaffold only; no domain models | LOCKED | TBD | Foundation must remain domain-free |
| D-002 | Data preservation | No old test/random data needs preservation | LOCKED | TBD | Clean database and clean migrations |
| D-003 | Auth model | Custom User model with Category choices, SimpleJWT auth, must_change_password/is_profile_complete rules | LOCKED | 2026-06-23 | Locked in BRICK_1_USER_AUTH_DECISION.md |
| D-004 | Masters | Not decided | OPEN | TBD | Hospital/Department matrix not implemented until accepted |
| D-005 | Onboarding | Not decided | OPEN | TBD | To be designed later |
# Decision Lock Register

This register records decisions that are frozen for the current brick or a later phase.

## Brick 0

- No domain decision locks.
- Scaffold stack locked to:
  - Django + DRF
  - Next.js + React + TypeScript
  - PostgreSQL
  - Docker Compose

## Entries

- Date:
- Scope:
- Decision:
- Locked by:
- Reason:
