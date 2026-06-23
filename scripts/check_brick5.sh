#!/usr/bin/env bash
set -eo pipefail

echo "========================================="
echo "PGMS Brick 5 Gate & Check Verification"
echo "========================================="

# Helper functions
assert_exists() {
  if [ -f "$1" ] || [ -d "$1" ]; then
    echo "✔ Checked path: $1 exists."
  else
    echo "✘ Error: Path $1 does not exist!"
    exit 1
  fi
}

assert_contains() {
  if grep -q "$2" "$1"; then
    echo "✔ Verified '$2' is present in $1."
  else
    echo "✘ Error: '$2' not found in $1!"
    exit 1
  fi
}

# 1. Models & Backend Structure
echo "Checking backend structure..."
assert_exists "backend/access/permissions.py"
assert_exists "backend/residents/views.py"
assert_exists "backend/supervisors/views.py"

# Verify masters endpoint registrations
assert_contains "backend/config/urls.py" "IdentityOptionsView"
assert_contains "backend/config/urls.py" "MyScopeView"

# Verify Resident model has academic_session_ref field
assert_contains "backend/residents/models.py" "academic_session_ref"

# 2. Frontend Routes / Code
echo "Checking frontend files..."
assert_exists "frontend/lib/api.ts"
assert_exists "frontend/app/residents/page.tsx"
assert_exists "frontend/app/supervisors/page.tsx"
assert_exists "frontend/app/supervisors/new/page.tsx"
assert_exists "frontend/app/supervisors/[id]/page.tsx"

# 3. Documentation & Evidence
echo "Checking documentation files..."
assert_exists "docs/implementation/20260623_brick_5_hospital_department_identity/DISCOVERY.md"
assert_exists "docs/implementation/20260623_brick_5_hospital_department_identity/EVIDENCE.md"
assert_exists "docs/decisions/BRICK_5_HOSPITAL_DEPARTMENT_IDENTITY_DECISION.md"
assert_exists "docs/gates/BRICK_5_GATES_AND_CHECKS.md"
assert_exists "docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md"

# Verify truth-map has Brick 5 mappings
assert_contains "docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md" "Brick 5"

# 4. Run previous verification scripts
echo "Running previous verification scripts..."
bash scripts/check_brick0.sh
bash scripts/check_brick4.sh

echo "-----------------------------------------"
echo "✔ All Brick 5 Gate verification checks PASSED!"
echo "========================================="
