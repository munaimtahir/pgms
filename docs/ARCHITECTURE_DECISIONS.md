# Architecture Decisions — PGMS

## ADR-001 — Clean-room project

`pgms/` is a new software project from scratch.

Legacy PGSIMS is not the base architecture.

## ADR-002 — Domain-free scaffold

Brick 0 must create only:

- backend scaffold
- frontend scaffold
- Docker scaffold
- environment examples
- health-check placeholders
- documentation templates
- evidence folders

No domain model may be created in Brick 0.

## ADR-003 — Fresh decision lock

Every model, workflow, API, page, permission, and action must be defined and accepted before implementation.

## ADR-004 — Legacy source-material only

Legacy code may be consulted after fresh acceptance of a design, but only for:

- ideas
- validation patterns
- small utility logic
- test inspiration
- lessons learned

It must not be copied wholesale.

## ADR-005 — No data preservation requirement

The old app contains no production data that needs preservation. PGMS starts with a clean database and clean migrations.

## ADR-006 — No bridge modules in early core

Google Workspace, AdminOps, Google Drive connector, and legacy rotations remain out of scope until explicitly approved later.
# Architecture Decisions

Use this document to record architecture decisions as they are accepted.

## Brick 0 status

- No domain architecture is locked yet.
- The scaffold stack is fixed to:
  - Django + Django REST Framework backend
  - Next.js + React + TypeScript frontend
  - PostgreSQL database
  - Docker Compose runtime

## Decision entries

- Date:
- Decision:
- Context:
- Consequences:
- Alternatives considered:
