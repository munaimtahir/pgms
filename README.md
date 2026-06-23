# PGMS Documentation Plan

This documentation pack is for starting **PGMS** as a completely new clean-room software project.

## Project identity

**PGMS** = **Postgraduate Management System**

## Recommended workspace

```text
pgms-workspace/
├── pgms/                # New clean active project. Write code only here.
├── pgsims-legacy/       # Old PGSIMS project. Read-only reference vault only.
└── AGENTS.md            # Workspace-level agent instructions.
```

## Most important rule

`PGMS` is a new software project from scratch.

The old `pgsims-legacy/` folder is a read-only reference vault only. No previous model, module, API, route, database structure, serializer, frontend page, workflow, migration, or test data is accepted automatically.

## Brick 0 scope

Brick 0 is scaffold only.

Brick 0 must not implement:

- custom user model
- Hospital model
- Department model
- HospitalDepartment model
- Resident model
- Supervisor model
- HOD model
- onboarding/import
- backup
- Google Workspace bridge
- AdminOps bridge
- Google Drive connector
- legacy rotations
- old dashboard
- domain-specific frontend pages
- copied legacy code

## Development philosophy

Design fresh first.
Accept and lock decision.
Then optionally compare legacy.
Then build in `pgms/` only.
Test.
Write evidence.
