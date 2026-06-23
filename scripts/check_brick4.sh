#!/usr/bin/env bash
set -eo pipefail

echo "========================================="
echo "PGMS Brick 4 Gate & Check Verification"
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
assert_exists "backend/masters"
assert_exists "backend/masters/models.py"
assert_exists "backend/access"
assert_exists "backend/access/models.py"

# Verify Master models
assert_contains "backend/masters/models.py" "class Institution"
assert_contains "backend/masters/models.py" "class TrainingSite"
assert_contains "backend/masters/models.py" "class Department"
assert_contains "backend/masters/models.py" "class Program"
assert_contains "backend/masters/models.py" "class Specialty"
assert_contains "backend/masters/models.py" "class Designation"
assert_contains "backend/masters/models.py" "class AcademicSession"

# Verify Access models
assert_contains "backend/access/models.py" "class UserRoleAssignment"

# 2. Frontend Routes
echo "Checking frontend routes..."
assert_exists "frontend/app/masters/page.tsx"
assert_exists "frontend/app/access/role-assignments/page.tsx"

# 3. Documentation
echo "Checking documentation files..."
assert_exists "docs/implementation/20260623_brick_4_masters_scope/DISCOVERY.md"
assert_exists "docs/implementation/20260623_brick_4_masters_scope/EVIDENCE.md"
assert_exists "docs/decisions/BRICK_4_MASTERS_SCOPE_DECISION.md"
assert_exists "docs/gates/BRICK_4_GATES_AND_CHECKS.md"
assert_exists "docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md"

echo "-----------------------------------------"
echo "✔ All Brick 4 Gate verification checks PASSED!"
echo "========================================="
