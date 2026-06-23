#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Running Brick 0 checks from ${root_dir}"

python_bin="${PYTHON_BIN:-}"
if [[ -z "${python_bin}" ]] && command -v python >/dev/null 2>&1; then
  python_bin="python"
elif [[ -z "${python_bin}" ]] && command -v python3 >/dev/null 2>&1; then
  python_bin="python3"
fi

if command -v docker >/dev/null 2>&1; then
  (cd "${root_dir}" && docker compose config)
else
  echo "docker not available; skipping docker compose config"
fi

if [[ -n "${python_bin}" ]]; then
  (cd "${root_dir}/backend" && "${python_bin}" manage.py check)
  (cd "${root_dir}/backend" && "${python_bin}" manage.py test)
else
  echo "python and python3 not available; skipping backend checks"
fi

if command -v npm >/dev/null 2>&1; then
  (cd "${root_dir}/frontend" && npm install)
  (cd "${root_dir}/frontend" && npm run lint)
  (cd "${root_dir}/frontend" && npm run build)
else
  echo "npm not available; skipping frontend checks"
fi
