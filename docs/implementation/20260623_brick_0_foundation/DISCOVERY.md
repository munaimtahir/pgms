# Discovery - Brick 0 Foundation

Date: 2026-06-23

## Current `pgms/` state

- `pgms/` exists as a separate clean-room repository.
- At the start of this task it contained only documentation, prompt files, and no backend or frontend application scaffold.
- There were no Django, Next.js, Docker Compose, or environment files for the new project yet.

## Legacy repository status

- `pgsims-legacy/` exists in the workspace.
- It is treated as read-only reference material only.
- It will not be modified for this task.
- No legacy code will be copied into `pgms/`.

## Scaffold plan

1. Create a minimal Django backend with a single health endpoint at `GET /api/health/`.
2. Create a minimal Next.js frontend with only `/` and `/health`.
3. Add Docker Compose for PostgreSQL, backend, and frontend services.
4. Add `.env.example`, `README.md`, `AGENTS.md`, and a Brick 0 check script.
5. Add dated implementation evidence after the scaffold is in place.

## Risks

- Tooling may be unavailable in the environment, which could block `docker compose`, `python manage.py`, or `npm` verification.
- The workspace already contains old `pgsims/` material, so the main risk is accidental cross-contamination if I reference it. I will avoid that.
- This brick must remain strictly non-domain; any accidental feature creep would violate scope.

