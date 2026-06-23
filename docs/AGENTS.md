# AGENTS.md — PGMS

## Mission

Build `pgms/` as a completely new clean-room software project.

PGMS means **Postgraduate Management System**.

The old `pgsims-legacy/` folder is a read-only source-material vault only. It is not the base product.

## Primary rule

PGMS is not a cleaned copy of legacy PGSIMS.

No model, route, API, module, page, workflow, permission, serializer, migration, database structure, or test data from legacy PGSIMS is accepted by default.

## Write boundary

Allowed:

- write only inside `pgms/`
- create scaffold, docs, templates, tests, and evidence in `pgms/`
- read `pgsims-legacy/` only when explicitly relevant and only after a fresh design has been accepted

Forbidden:

- modify `pgsims-legacy/`
- copy legacy models into scaffold
- copy legacy modules wholesale
- create domain models in Brick 0
- revive old Google/AdminOps/Drive/rotations modules
- preserve old database data
- assume old architecture decisions are correct

## Development sequence

For every future model/workflow:

1. Define fresh requirement.
2. Draft model/workflow/API/frontend design.
3. Review and accept/lock decision.
4. Then optionally inspect legacy for small reusable ideas.
5. Build only inside `pgms/`.
6. Test.
7. Write evidence.

## Brick 0 rule

Brick 0 is technical scaffold only.

No domain-specific implementation is allowed in Brick 0.

## Evidence rule

Every brick must create:

`pgms/docs/implementation/YYYYMMDD_<brick_name>/DISCOVERY.md`

and:

`pgms/docs/implementation/YYYYMMDD_<brick_name>/EVIDENCE.md`

## Verdict values

Use:

- GO
- CONDITIONAL GO
- BLOCKED
