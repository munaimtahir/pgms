# PGMS Gemini AI Agent Governance & Context Guide (GEMINI.md)

This document serves as the master context retention and governance file for Gemini (and other LLM-based) AI agents working on **PGMS (Postgraduate Management System)**. It ensures that the strict clean-room boundaries, design-first development philosophy, and phase-gate validation rules are adhered to across all agent sessions.

---

## 0) The North Star & Core Mandate

**PGMS is a completely new, clean-room software project built from scratch to replace the legacy PGSIMS system.**

1. **Adoption & Stability**: Adoption of PGMS depends on architectural simplicity, frontend/backend contract correctness, high test coverage, explicit role-based access control (RBAC), and stable UI workflows.
2. **Clean Slate**: No model, API, route, migration, frontend page, database table, or system behavior from the legacy PGSIMS codebase is accepted automatically. Every component must be freshly designed, accepted, and locked before any coding begins.

---

## 1) Workspace Structure & Write Boundaries

The workspace is structured into two primary subdirectories with a strict write boundary:

```text
pgms-workspace/
├── pgms/                # Active clean-room PGMS project (WRITE-ALLOWED)
└── pgsims/              # Legacy PGSIMS codebase (READ-ONLY REFERENCE)
```

### Strict Boundaries:
- **`pgms/` (Active Project)**: This is the **only** directory where agents are permitted to create, edit, delete, refactor, or commit code and documentation.
- **`pgsims/` (Legacy Reference Vault)**: Treat this directory as strictly read-only. Do not create, modify, delete, or rename any files here. Never copy modules, database migrations, model schemas, frontend layouts, or mock data wholesale.

---

## 2) Current Status: Brick 0 Completed

As of **June 23, 2026**, **Brick 0 (Technical Scaffold)** is complete, verified, and locked. No domain models or business workflows exist yet.

### Current Project Stack & Layout:
- **Backend**: Django & Django REST Framework (`pgms/backend/`)
  - Running under a Python virtual environment.
  - Active check endpoint: `GET /api/health/` (returns JSON status).
  - Test framework: `pytest`.
- **Frontend**: Next.js 14 + React + TypeScript + Vanilla CSS (`pgms/frontend/`)
  - Active pages: `/` (home index page) and `/health` (frontend system health status).
  - Code check tools: ESLint + TypeScript typechecking.
- **Database**: PostgreSQL
- **Runtime**: Multi-service configuration via Docker Compose (`pgms/compose.yml`)

### Baseline Files & Docs:
- Global instructions: [pgms-workspace/AGENTS.md](file:///home/munaim/srv/apps/pgms-workspace/AGENTS.md)
- Project instructions: [pgms/AGENTS.md](file:///home/munaim/srv/apps/pgms-workspace/pgms/AGENTS.md)
- Brick 0 discovery details: [DISCOVERY.md](file:///home/munaim/srv/apps/pgms-workspace/pgms/docs/implementation/20260623_brick_0_foundation/DISCOVERY.md)
- Brick 0 execution evidence: [EVIDENCE.md](file:///home/munaim/srv/apps/pgms-workspace/pgms/docs/implementation/20260623_brick_0_foundation/EVIDENCE.md)
- Validation script: [pgms/scripts/check_brick0.sh](file:///home/munaim/srv/apps/pgms-workspace/pgms/scripts/check_brick0.sh)

---

## 3) Development Philosophy: Design-First

No domain feature implementation is permitted to begin without first creating and approving its design documents. The sequence for every future task must be:

```text
Define fresh requirements
→ Create fresh design documents (Model, Workflow, API Contract, Truth-Map)
→ Submit design for review & accept decision (Lock in Decision Lock Register)
→ (Optional) Inspect legacy codebase for reference & lessons only
→ Implement the code cleanly inside pgms/
→ Write and execute tests
→ Generate dated implementation evidence
→ Stop and report results for review
```

### Design Template Repository:
Before coding any future brick, create the design documents using the templates in `pgms/docs/`:
- Model Design: [MODEL_DESIGN_TEMPLATE.md](file:///home/munaim/srv/apps/pgms-workspace/pgms/docs/MODEL_DESIGN_TEMPLATE.md)
- Workflow Design: [WORKFLOW_DESIGN_TEMPLATE.md](file:///home/munaim/srv/apps/pgms-workspace/pgms/docs/WORKFLOW_DESIGN_TEMPLATE.md)
- API Specs: [API_CONTRACT_TEMPLATE.md](file:///home/munaim/srv/apps/pgms-workspace/pgms/docs/API_CONTRACT_TEMPLATE.md)
- Frontend/Backend Mapping: [FRONTEND_BACKEND_TRUTHMAP_TEMPLATE.md](file:///home/munaim/srv/apps/pgms-workspace/pgms/docs/FRONTEND_BACKEND_TRUTHMAP_TEMPLATE.md)

---

## 4) Legacy Reuse Protocol

If legacy code in `pgsims/` is inspected for reference, follow these steps:
1. **Design First**: Ensure the new PGMS design is accepted *before* looking at legacy code.
2. **Inspection Mapping**: Identify the specific legacy files and the question being answered.
3. **Classification**: Categorize the legacy concepts into:
   - *Useful concept* (can be rewritten to fit PGMS)
   - *Useful validation idea*
   - *Useful test pattern*
   - *Avoid / Reject / Not relevant*
4. **Clean Adaptation**: Re-derive the logic inside `pgms/` conforming to the new architecture. Do not perform raw copy-paste.
5. **Log Comparison**: Document the comparison in the current brick's `DISCOVERY.md` using the table template in [LEGACY_REUSE_PROTOCOL.md](file:///home/munaim/srv/apps/pgms-workspace/pgms/docs/LEGACY_REUSE_PROTOCOL.md).

---

## 5) Future Build Phase Plan (Context of Work to be Done)

The work must progress strictly block-by-block. Do not work on later bricks until the current one is completed, tested, and accepted.

- **Brick 1 — Product Definition and Role Design**
  - Define user roles, access matrices, minimum pilot workflow, and auth philosophy.
  - Implement authentication foundation.
- **Brick 2 — Masters Design & Implementation**
  - Define fields and constraints for core entities: `Hospital`, `Department`, and the `HospitalDepartment` matrix.
  - Implement masters management pages, API endpoints, and RBAC rules.
- **Brick 3 — People Design & Implementation**
  - Define fields, profile requirements, and lifecycles for `Resident`, `Supervisor`, `HOD`, and `UTRMC Admin`.
  - Implement profile pages, APIs, and account state transitions.
- **Brick 4 — Assignment Design & Implementation**
  - Define training programme assignment, hospital placements, supervision links, and HOD assignments.
  - Implement assignment management UI and APIs.
- **Brick 5 — Onboarding (CSV Import)**
  - Define CSV import workflows, flexible column mapping, validation rules, username generation, and login sheet downloads.
  - Implement onboarding backend services and user interface.
- **Brick 6 — Resident First Login**
  - Define profile completion requirements, redirect guards, and mandatory password updates.
  - Implement first-login UI, backend updates, and state gates.
- **Brick 7 — Monitoring Dashboard**
  - Define monitoring metrics (KPIs, incomplete profiles, assignment gaps, and data quality issues).
  - Implement monitoring views for admins and HODs.
- **Brick 8 — Backup & Export**
  - Define backup scope, export packages, and verify restore proofs.
  - Implement secure backup triggers and logs.

---

## 6) Verification & Testing Commands

To run validation checks on the `pgms` workspace, execute the following commands (ensuring paths and virtual environment environments are appropriately set for the host OS):

### Backend Checks
```bash
# Execute within pgms/backend/ directory
# Use virtual environment python if system python lacks packages:
/tmp/pgms-brick0-venv/bin/python manage.py check
/tmp/pgms-brick0-venv/bin/python manage.py test
```

### Frontend Checks
```bash
# Execute within pgms/frontend/ directory
npm run typecheck
npm run lint
npm run build
```

### Overall Scaffold Validation
```bash
# Execute within pgms/ directory
docker compose config
PYTHON_BIN=/tmp/pgms-brick0-venv/bin/python bash scripts/check_brick0.sh
```

---

## 7) Anti-Drift Guardrails for Gemini Agents

Scope drift and legacy contamination are the greatest risks. To prevent them, every agent session must enforce these rules:

1. **Single Brick Focus**: Only perform work related to the active brick. Do not implement domain modules ahead of time.
2. **Documentation Gates**:
   - Every brick implementation must start by creating the evidence folder:
     `pgms/docs/implementation/YYYYMMDD_<brick_name>/`
   - Create `DISCOVERY.md` detailing goals, risks, and acceptance criteria *before* modifying code.
   - Create `EVIDENCE.md` detailing files modified, commands run, test results, and final verdict *after* changes are made.
3. **No Domain Models in Scaffold**: Keep Brick 0 completely clean of domain concepts (e.g. no custom user models, department entities, or login views).
4. **No Code Leakage**: Ensure `pgsims/` remains 100% untouched.

---

## 8) Session Handoff Plan Template

For future tasks, agents should initialize their plans using this template:

```markdown
# Session Plan: [Date] — Brick [N]: [Name]

## 1. Goal
- [ ] What is the target of this session?

## 2. In-Scope Tasks
- [ ] List allowed file edits and commands.

## 3. Out-Of-Scope Actions
- [ ] Explicitly state what must not be edited (e.g., legacy folders, future domain concepts).

## 4. Verification Plan
- [ ] Detail backend tests to run.
- [ ] Detail frontend linting/compilation checks.
- [ ] Detail E2E or check script targets.
```
