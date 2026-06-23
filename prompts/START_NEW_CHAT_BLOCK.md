I am starting a completely new clean-room software project called **PGMS**.

PGMS = **Postgraduate Management System**.

Treat this as a new project from scratch.

This is not a continuation of the previous PGSIMS codebase. The previous project exists only as a read-only reference vault. No previous model, module, API, route, database structure, serializer, frontend page, workflow, migration, or test data should be copied into the new scaffold.

Workspace layout:

```text
pgms-workspace/
├── pgms/                # New clean active project. Write code only here.
├── pgsims-legacy/       # Old PGSIMS project. Read-only reference vault only.
└── AGENTS.md            # Workspace-level agent instructions.
```

Active working folder:

```text
pgms/
```

## Core reset rule

PGMS is a completely new software project.

The scaffold must contain only the technical foundation.

No legacy model or previous architecture should be copied into the scaffold.

Every model, action, workflow, page, permission, API, database decision, navigation decision, and deployment decision will be redefined, reviewed, accepted, and locked again before implementation.

## Legacy usage rule

The `pgsims-legacy/` folder may be inspected later only as source material. It may help us understand previous attempts, useful functions, naming mistakes, validation logic, tests, or workflows. However:

- do not copy anything from legacy during Brick 0,
- do not import legacy models,
- do not preserve legacy database data,
- do not assume any previous model is correct,
- do not assume any previous workflow is accepted,
- do not revive any old route or hidden module,
- do not modify `pgsims-legacy/`,
- do not copy whole old modules at any stage.

Later, after a model or workflow is freshly defined and accepted, the agent may inspect the legacy folder to see whether any small function, validation idea, test pattern, or content structure can be adapted. Even then, it must be rewritten/adapted into the new architecture and documented.

## Important data rule

There is no production data in the old system that needs preservation. Old test/random data can be ignored. PGMS should start with a clean database and clean migrations.

## Initial product direction

The long-term product is expected to become a postgraduate resident/supervisor management system, but no domain model should be implemented in Brick 0.

The likely future modules are:

1. Auth and roles
2. Masters
3. People
4. Assignments
5. Onboarding
6. Resident first-login profile completion
7. Monitoring
8. Backup

These are only future phases. Their exact models, fields, pages, permissions, and workflows will be redefined and locked one by one before implementation.

## First task

Create only the clean technical scaffold for `pgms/`.

Required scaffold:

1. Backend scaffold
2. Frontend scaffold
3. Docker Compose scaffold
4. Environment example
5. README
6. AGENTS.md inside `pgms/`
7. Documentation folder structure
8. Implementation evidence folder structure
9. Health-check placeholders only
10. Model/workflow decision templates
11. Frontend/backend truth-map template
12. Gates/checks template

Recommended stack:

- Backend: Django + Django REST Framework
- Frontend: Next.js + React + TypeScript
- Database: PostgreSQL
- Runtime: Docker Compose

Do not implement in Brick 0:

- no custom user model unless explicitly approved later
- no Hospital model
- no Department model
- no HospitalDepartment model
- no Resident model
- no Supervisor model
- no HOD model
- no onboarding module
- no import module
- no backup module
- no Google Workspace bridge
- no AdminOps bridge
- no Google Drive connector
- no legacy rotations shell
- no old dashboard
- no domain-specific frontend pages
- no copied legacy code

Stop after Brick 0. Do not proceed to Auth, Masters, People, Onboarding, or any domain feature until the scaffold is reviewed and approved.
