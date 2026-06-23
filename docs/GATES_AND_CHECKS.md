# Gates and Checks — PGMS

## Brick 0 acceptance gate

Brick 0 is accepted only if:

- `pgms/` has a clean scaffold
- backend scaffold exists
- frontend scaffold exists
- Docker Compose scaffold exists
- `.env.example` exists
- documentation templates exist
- health-check placeholders exist
- no domain model exists
- no legacy model exists
- no legacy module was copied
- no old data is preserved
- no bridge module exists
- evidence is written

## Universal future brick gate

A future brick is accepted only if:

- design is freshly defined
- decision is accepted/locked
- implementation is inside `pgms/`
- frontend exposure exists
- backend/API exists
- RBAC is explicit
- success/error states exist
- tests pass
- evidence is written

## Suggested commands

Backend:

```bash
python manage.py check
python manage.py test
```

Frontend:

```bash
npm run typecheck
npm test
npm run lint
```

Docker:

```bash
docker compose config
docker compose up --build
```

## Verdict

Use:

- GO
- CONDITIONAL GO
- BLOCKED
