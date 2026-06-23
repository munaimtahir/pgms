# Brick 0 Prompt — PGMS Technical Scaffold Only

You are working inside this workspace:

```text
pgms-workspace/
├── pgms/
└── pgsims-legacy/
```

Task:

Create only the technical scaffold for `pgms/`.

This is a completely new clean-room software project.

Do not copy any previous model, module, workflow, API, route, migration, serializer, page, or database structure from `pgsims-legacy/`.

Do not modify `pgsims-legacy/`.

## Required scaffold

Create:

1. Backend scaffold
2. Frontend scaffold
3. Docker Compose scaffold
4. `.env.example`
5. README
6. `AGENTS.md`
7. `docs/` folder
8. `docs/implementation/` folder
9. Health-check placeholders only
10. Documentation templates:
   - PROJECT_CHARTER.md
   - ARCHITECTURE_DECISIONS.md
   - BUILD_PHASE_PLAN.md
   - DECISION_LOCK_REGISTER.md
   - MODEL_DESIGN_TEMPLATE.md
   - WORKFLOW_DESIGN_TEMPLATE.md
   - API_CONTRACT_TEMPLATE.md
   - FRONTEND_BACKEND_TRUTHMAP_TEMPLATE.md
   - LEGACY_REUSE_PROTOCOL.md
   - GATES_AND_CHECKS.md

## Recommended stack

- Backend: Django + Django REST Framework
- Frontend: Next.js + React + TypeScript
- Database: PostgreSQL
- Runtime: Docker Compose

## Do not implement

- no custom user model
- no Hospital model
- no Department model
- no HospitalDepartment model
- no Resident model
- no Supervisor model
- no HOD model
- no onboarding
- no import
- no backup
- no bridge modules
- no domain-specific pages
- no copied legacy code

## Discovery file

Before coding, create:

`pgms/docs/implementation/YYYYMMDD_brick_0_foundation/DISCOVERY.md`

Include:

- current `pgms/` state
- whether `pgsims-legacy/` exists
- confirmation that no legacy code will be copied
- scaffold plan
- risks

## Evidence file

After coding, create:

`pgms/docs/implementation/YYYYMMDD_brick_0_foundation/EVIDENCE.md`

Include:

- files created
- commands run
- results
- confirmation that no domain model was implemented
- confirmation that no legacy code was copied
- final verdict

## Stop condition

Stop after Brick 0.

Do not proceed to Auth, Masters, People, Onboarding, or any domain feature until the scaffold is reviewed and approved.
