# PGMS

**PGMS** = **Postgraduate Management System**

This repository starts as a clean-room scaffold. Brick 0 includes only the technical foundation needed for later work.

## Repository boundaries

- Write code only inside `pgms/`.
- Treat `pgsims-legacy/` as read-only reference material.
- Do not copy legacy code, schema, routes, pages, workflows, migrations, or test data.

## Brick 0 scope

- Backend scaffold: Django + Django REST Framework
- Frontend scaffold: Next.js + React + TypeScript
- Database scaffold: PostgreSQL
- Runtime scaffold: Docker Compose
- Health placeholders only

## Allowed surface in Brick 0

- Backend endpoint: `GET /api/health/`
- Frontend routes: `/` and `/health`

## Home page text requirement

The home page must clearly state:

- `PGMS`
- `Postgraduate Management System`
- `Brick 0 technical scaffold only.`
- `No domain modules implemented yet.`

## Non-goals

- custom user model
- domain models
- onboarding
- import/export
- backup
- bridge modules
- role dashboards
- domain permissions
- copied legacy code
