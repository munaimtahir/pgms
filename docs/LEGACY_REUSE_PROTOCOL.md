# Legacy Reuse Protocol — PGMS

## Main rule

Legacy PGSIMS is source material only.

It is not the base architecture and not a code donor during scaffold creation.

## When legacy may be inspected

Only after:

1. A new model/workflow has been freshly defined.
2. The design has been reviewed.
3. The decision has been accepted/locked.

## What may be reused

Only small adapted pieces may be considered:

- validation ideas
- edge-case handling
- utility functions
- test patterns
- documentation lessons
- naming warnings

## What must not be reused

- whole modules
- old migrations
- old database data
- old hidden routes
- old frontend pages
- old bridge modules
- old assumptions
- old model structure without fresh approval

## Required documentation

Every legacy comparison must be documented:

| Legacy file inspected | Reason | Reuse decision | Adaptation needed |
|---|---|---|---|
# Legacy Reuse Protocol

This project is clean-room. Treat `pgsims-legacy/` as reference-only.

## Rules

- Do not copy code directly.
- Do not copy schemas directly.
- Do not copy route structures directly.
- Do not copy UI layouts directly.
- Do not copy tests directly.

## If legacy is consulted

- Describe the idea in your own words.
- Re-derive the implementation inside `pgms/`.
- Record why the reuse is safe or rejected.
