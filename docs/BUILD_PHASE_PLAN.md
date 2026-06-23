# Build Phase Plan — PGMS

## Brick 0 — Technical scaffold only

Deliver:

- backend scaffold
- frontend scaffold
- Docker Compose scaffold
- `.env.example`
- README
- AGENTS.md
- docs folder
- implementation evidence folder
- health-check placeholders
- decision templates
- truth-map template
- gates/checks template

Must not deliver:

- domain models
- custom user model
- onboarding
- masters
- people
- assignment
- backup
- legacy code reuse

Gate:

- clean scaffold exists
- no domain implementation exists
- no legacy code copied
- evidence written

## Brick 1 — Product definition and role design

Before coding:

- define users
- define roles
- define access philosophy
- define minimum pilot workflow
- decide auth approach

Only after acceptance:

- implement auth foundation

## Brick 2 — Masters design

Before coding:

- define whether Hospital, Department, HospitalDepartment are accepted
- define fields
- define constraints
- define pages
- define APIs
- define RBAC

Only after acceptance:

- implement masters

## Brick 3 — People design

Before coding:

- define resident
- define supervisor
- define HOD
- define UTRMC/admin
- define profile fields
- define account lifecycle

Only after acceptance:

- implement people module

## Brick 4 — Assignment design

Before coding:

- define programme assignment
- define placement
- define supervision links
- define HOD assignment

Only after acceptance:

- implement assignment module

## Brick 5 — Onboarding design

Before coding:

- define import workflow
- define column mapping
- define username generation
- define password rule
- define login sheet
- define duplicate handling

Only after acceptance:

- implement onboarding

## Brick 6 — Resident first login

Before coding:

- define required profile fields
- define completion state
- define redirect rules
- define password change rule

Only after acceptance:

- implement first-login flow

## Brick 7 — Monitoring

Before coding:

- define KPIs
- define incomplete profile logic
- define assignment gap logic
- define data quality logic

Only after acceptance:

- implement monitoring dashboard

## Brick 8 — Backup

Only after core pilot is stable:

- define backup scope
- define restore proof
- define admin UI
- implement backup
# Build Phase Plan

## Brick 0

- Create the clean technical scaffold.
- Add only health placeholders.
- Add verification evidence.

## Future bricks

- Brick 1: authentication foundation
- Brick 2: masters foundation
- Brick 3: people foundation
- Brick 4+: domain workflows
