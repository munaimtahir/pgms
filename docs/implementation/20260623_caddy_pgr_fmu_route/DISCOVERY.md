# Discovery - Caddy Route for pgr.fmu.edu.pk

Date: 2026-06-23

## Task goal

Add an independent Caddy pathway for PGMS at `https://pgr.fmu.edu.pk` and proxy `/api/health/` to the PGMS backend.

## Current state of `pgms/`

- Brick 0 scaffold was already present.
- PGMS compose exposed the frontend and backend on local host ports chosen for this route.
- The backend health endpoint was already available locally.

## Legacy inspection

- Legacy inspection was not needed for this task.
- No legacy files were inspected.

## What will be built

- PGMS frontend on a unique localhost port.
- PGMS backend on a unique localhost port.
- A new Caddy site block for `pgr.fmu.edu.pk`.
- Public HTTPS routing for the frontend and `/api/health/`.

## What will not be built

- No legacy routes will be changed.
- No legacy code will be copied.
- No domain feature work outside the routing scaffold.

## Risks

- Host port collisions with other services.
- Caddy certificate issuance failure if the domain challenge path is not compatible.
- Path handling mistakes that can strip `/api` before the backend sees it.

## Acceptance criteria

- `https://pgr.fmu.edu.pk/` returns the PGMS frontend.
- `https://pgr.fmu.edu.pk/api/health/` returns the PGMS backend health response.
- Existing Caddy routes remain intact.
- `pgsims-legacy/` is not modified.

