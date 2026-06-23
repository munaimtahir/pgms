# Evidence - Caddy Route for pgr.fmu.edu.pk

Date: 2026-06-23

## Selected ports

- PGMS frontend host port: `3026`
- PGMS backend host port: `8026`

## Port availability check

- Checked `ss -tulpen | grep -E ':3026|:8026'` before allocation.
- Result: no existing listener on either port.
- The server was already using other ports such as `8010`, `8015`, `8018`, `8057`, `8080`, `8081`, `9030`, and `9031`, so `3026` and `8026` were chosen as unused.

## PGMS files updated

- `pgms/.env.example`
- `pgms/compose.yml`
- `pgms/backend/config/settings.py`
- `pgms/backend/.dockerignore`
- `pgms/frontend/.dockerignore`

## Caddy file used

- Active source config: `/home/munaim/srv/proxy/caddy/Caddyfile`
- System config sync target: `/etc/caddy/Caddyfile`

## Backup created

- Backup file: `/home/munaim/srv/proxy/caddy/Caddyfile.bak.20260623_100858`

## Caddy site block added

- `pgr.fmu.edu.pk`
- Routes:
  - `/` -> `127.0.0.1:3026`
  - `/api/*` -> `127.0.0.1:8026`
- TLS challenge adjustment:
  - `disable_tlsalpn_challenge` was added so Caddy could obtain the certificate via HTTP-01.

## Validation and reload

- `caddy validate --config /home/munaim/srv/proxy/caddy/Caddyfile`
  - Result: `Valid configuration`
- `sudo install -m 0644 /home/munaim/srv/proxy/caddy/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy`
  - Result: succeeded.

## Docker Compose

- `cd /home/munaim/srv/apps/pgms-workspace/pgms && docker compose -f compose.yml config`
  - Result: passed.
- `cd /home/munaim/srv/apps/pgms-workspace/pgms && docker compose -f compose.yml up -d --build`
  - Result: passed after removing the published DB host port and adding `.dockerignore` files to reduce build context.

## Local checks

- `curl -fsS http://127.0.0.1:8026/api/health/`
  - Result:
    - `{"status": "ok", "service": "pgms-backend", "brick": "1"}`
- `curl -I http://127.0.0.1:3026/`
  - Result: `HTTP/1.1 200 OK`

## Public checks

- `curl -I https://pgr.fmu.edu.pk/`
  - Result: `HTTP/2 200`
- `curl -fsS https://pgr.fmu.edu.pk/api/health/`
  - Result:
    - `{"status": "ok", "service": "pgms-backend", "brick": "1"}`

## Notes

- The initial `/api/*` block used `handle_path`, which stripped `/api` and caused a 404. It was corrected to `handle /api/*`.
- The DB host port publish was removed because `127.0.0.1:5432` was already occupied on the server.

## Boundary confirmation

- No existing Caddy site block was removed.
- `pgsims-legacy/` was not modified.
- No legacy code was copied.

## Final verdict

PGMS Caddy route is live and verified.

