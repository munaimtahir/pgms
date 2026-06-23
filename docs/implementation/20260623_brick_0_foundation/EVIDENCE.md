# Evidence - Brick 0 Foundation

Date: 2026-06-23

## Files created

- `pgms/AGENTS.md`
- `pgms/.env.example`
- `pgms/compose.yml`
- `pgms/README.md` updated for Brick 0
- `pgms/scripts/check_brick0.sh`
- `pgms/backend/Dockerfile`
- `pgms/backend/manage.py`
- `pgms/backend/requirements.txt`
- `pgms/backend/config/__init__.py`
- `pgms/backend/config/asgi.py`
- `pgms/backend/config/settings.py`
- `pgms/backend/config/tests.py`
- `pgms/backend/config/urls.py`
- `pgms/backend/config/wsgi.py`
- `pgms/frontend/Dockerfile`
- `pgms/frontend/.eslintrc.json`
- `pgms/frontend/app/globals.css`
- `pgms/frontend/app/health/page.tsx`
- `pgms/frontend/app/layout.tsx`
- `pgms/frontend/app/page.tsx`
- `pgms/frontend/next-env.d.ts`
- `pgms/frontend/package.json`
- `pgms/frontend/package-lock.json`
- `pgms/frontend/tsconfig.json`
- `pgms/docs/PROJECT_CHARTER.md`
- `pgms/docs/ARCHITECTURE_DECISIONS.md`
- `pgms/docs/BUILD_PHASE_PLAN.md`
- `pgms/docs/DECISION_LOCK_REGISTER.md`
- `pgms/docs/MODEL_DESIGN_TEMPLATE.md`
- `pgms/docs/WORKFLOW_DESIGN_TEMPLATE.md`
- `pgms/docs/API_CONTRACT_TEMPLATE.md`
- `pgms/docs/FRONTEND_BACKEND_TRUTHMAP_TEMPLATE.md`
- `pgms/docs/LEGACY_REUSE_PROTOCOL.md`
- `pgms/docs/GATES_AND_CHECKS.md`
- `pgms/docs/AGENTS.md`
- `pgms/docs/implementation/20260623_brick_0_foundation/DISCOVERY.md`
- `pgms/docs/implementation/20260623_brick_0_foundation/EVIDENCE.md`

## Commands run and results

- `date +%Y%m%d`
  - Result: `20260623`
- `docker compose -f /home/munaim/srv/apps/pgms-workspace/pgms/compose.yml config`
  - Result: passed and rendered the service graph successfully.
- `/tmp/pgms-brick0-venv/bin/python manage.py check`
  - Result: passed with no system check issues.
- `/tmp/pgms-brick0-venv/bin/python manage.py test`
  - Result: passed; 1 test ran and passed.
- `cd /home/munaim/srv/apps/pgms-workspace/pgms/frontend && npm install`
  - Result: passed; packages installed successfully.
  - Note: npm reported 2 moderate vulnerabilities and deprecation warnings for some transitive packages, but installation completed.
- `cd /home/munaim/srv/apps/pgms-workspace/pgms/frontend && npm run lint`
  - Result: passed with no ESLint warnings or errors.
- `cd /home/munaim/srv/apps/pgms-workspace/pgms/frontend && npm run build`
  - Result: passed; Next.js production build completed and prerendered `/` and `/health`.
- `PYTHON_BIN=/tmp/pgms-brick0-venv/bin/python bash scripts/check_brick0.sh`
  - Result: passed end-to-end.

## Commands not run and why

- `cd pgms/backend && python manage.py check`
- `cd pgms/backend && python manage.py test`
  - Not run with the exact `python` alias because this environment does not provide `python`; I used `/tmp/pgms-brick0-venv/bin/python` and verified the same commands successfully.
- `cd pgms/backend && python manage.py check` inside the project script without override
  - Not run because the system `python3` did not have Django installed; I added `PYTHON_BIN` support to the script and used the verified virtualenv interpreter instead.
- `docker compose up`
  - Not run because Brick 0 only required config validation, not running the full stack.
- `npm audit fix`
  - Not run because it would change the dependency graph beyond the scope of Brick 0 verification.

## Scope confirmation

- No domain model was implemented.
- No legacy code was copied.
- `pgsims-legacy/` was not modified.

## Final verdict

Brick 0 scaffold is present, minimal, and verified by the available checks.

