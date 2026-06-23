# PGMS Agent Guide

## Scope

`pgms/` is a clean-room repository for **PGMS: Postgraduate Management System**.

Brick 0 is scaffold only. Do not implement any domain modules, workflows, models, or APIs beyond the health placeholder endpoints documented for this brick.

## Hard rules

- Write code only inside `pgms/`.
- Do not modify `pgsims-legacy/`.
- Do not copy any legacy code, schema, workflow, page, API, or test data.
- Do not introduce a custom user model.
- Do not add domain apps in Brick 0.

## Expected Brick 0 surface

- Backend: Django + Django REST Framework
- Frontend: Next.js + React + TypeScript
- Database: PostgreSQL
- Runtime: Docker Compose

## Allowed endpoints and routes

- Backend: `GET /api/health/`
- Frontend: `/` and `/health`

## Evidence discipline

- Create a dated discovery note before implementation.
- Create a dated evidence note after implementation.
- Be honest about commands that cannot run in the current environment.

