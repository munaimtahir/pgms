#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "--------------------------------------------------------"
echo "Running Brick 1 Validation Checks from ${root_dir}"
echo "--------------------------------------------------------"

python_bin="${PYTHON_BIN:-/tmp/pgms-brick0-venv/bin/python}"

# 1. Check Django apps and models
if [[ -x "${python_bin}" ]]; then
  echo "Checking Django apps and models..."
  "${python_bin}" "${root_dir}/backend/manage.py" shell -c "
from django.apps import apps
from django.contrib.auth import get_user_model

# Verify accounts and audit are installed
assert apps.is_installed('accounts'), 'accounts app is not installed!'
assert apps.is_installed('audit'), 'audit app is not installed!'

# Verify forbidden apps are not installed
forbidden_apps = [
    'residents', 'supervisors', 'hospitals', 'departments', 'masters', 
    'assignments', 'onboarding', 'backups', 'monitoring', 'rotations',
    'google_bridge', 'adminops_bridge', 'drive_connector'
]
for app in forbidden_apps:
    assert not apps.is_installed(app), f'Forbidden app {app} is installed!'

# Verify custom User model exists and has correct categories
User = get_user_model()
assert hasattr(User, 'Category'), 'User.Category choices class is missing!'
assert 'RESIDENT' in User.Category.values, 'RESIDENT category is missing!'
assert 'SUPERVISOR' in User.Category.values, 'SUPERVISOR category is missing!'
assert 'SUPPORT_STAFF' in User.Category.values, 'SUPPORT_STAFF category is missing!'
assert 'UTRMC_ADMIN' in User.Category.values, 'UTRMC_ADMIN category is missing!'

# Verify must_change_password and is_profile_complete flags exist
assert hasattr(User, 'must_change_password'), 'User must_change_password flag is missing!'
assert hasattr(User, 'is_profile_complete'), 'User is_profile_complete flag is missing!'
assert hasattr(User, 'user_category'), 'User user_category is missing!'

# Verify forbidden models do not exist
try:
    apps.get_model('accounts', 'ResidentProfile')
    raise AssertionError('Forbidden model ResidentProfile exists!')
except LookupError:
    pass

try:
    apps.get_model('accounts', 'SupervisorProfile')
    raise AssertionError('Forbidden model SupervisorProfile exists!')
except LookupError:
    pass

print('Django apps and model validation: PASS')
"
else
  echo "Python binary not found at ${python_bin}; skipping backend model assertions."
fi

# 2. Check frontend routes
echo "Checking Next.js frontend routes..."
frontend_dir="${root_dir}/frontend"
routes=(
  "login"
  "change-password"
  "complete-profile"
  "account"
  "users"
  "users/new"
  "users/[id]"
  "audit"
)
for r in "${routes[@]}"; do
  if [[ ! -d "${frontend_dir}/app/${r}" ]]; then
    echo "ERROR: Frontend route /${r} directory is missing!"
    exit 1
  fi
done

# Check forbidden frontend routes are not present
forbidden_routes=(
  "residents"
  "supervisors"
  "hospitals"
  "departments"
  "masters"
  "assignments"
  "onboarding"
  "imports"
  "backups"
  "monitoring"
  "dashboard"
)
for fr in "${forbidden_routes[@]}"; do
  if [[ -d "${frontend_dir}/app/${fr}" ]]; then
    echo "ERROR: Forbidden frontend route /${fr} directory exists!"
    exit 1
  fi
done
echo "Frontend routes validation: PASS"

# 3. Check documentation files exist
echo "Checking documentation files..."
required_docs=(
  "docs/decisions/BRICK_1_USER_AUTH_DECISION.md"
  "docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md"
  "docs/gates/BRICK_1_GATES_AND_CHECKS.md"
)
for doc in "${required_docs[@]}"; do
  if [[ ! -f "${root_dir}/${doc}" ]]; then
    echo "ERROR: Required documentation file ${doc} is missing!"
    exit 1
  fi
done
echo "Documentation files validation: PASS"

# 4. Check for dated discovery and evidence logs
discovery_log=$(find "${root_dir}/docs/implementation" -name "DISCOVERY.md" | grep "brick_1_user_categories")
if [[ -z "${discovery_log}" ]]; then
  echo "ERROR: Dated Discovery log for Brick 1 is missing under docs/implementation!"
  exit 1
fi
echo "Implementation logs check: PASS"

echo "--------------------------------------------------------"
echo "All Brick 1 verification checks: SUCCESS"
echo "--------------------------------------------------------"
exit 0
