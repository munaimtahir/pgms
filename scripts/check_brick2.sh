#!/usr/bin/env bash
set -eo pipefail

echo "========================================="
echo "PGMS Brick 2 Gate & Check Verification"
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

assert_not_exists() {
  if [ ! -f "$1" ] && [ ! -d "$1" ]; then
    echo "✔ Checked path: $1 is correctly absent."
  else
    echo "✘ Error: Path $1 exists but should not be implemented in Brick 2!"
    exit 1
  fi
}

# 1. Models & Backend Structure
echo "Checking backend structure..."
assert_exists "backend/residents"
assert_exists "backend/residents/models.py"

# Verify ResidentProfile model name is in models.py
if grep -q "class ResidentProfile" "backend/residents/models.py"; then
  echo "✔ ResidentProfile model verified in models.py."
else
  echo "✘ ResidentProfile class definition not found in models.py!"
  exit 1
fi

# Verify no supervisor profile exists
assert_not_exists "backend/supervisors"
assert_not_exists "backend/masters"

# 2. Frontend Routes
echo "Checking frontend routes..."
assert_exists "frontend/app/residents/page.tsx"
assert_exists "frontend/app/residents/new/page.tsx"
assert_exists "frontend/app/residents/[id]/page.tsx"

assert_not_exists "frontend/app/supervisors"
assert_not_exists "frontend/app/masters"

# 3. Documentation
echo "Checking documentation files..."
assert_exists "docs/implementation/20260623_brick_2_resident_directory/DISCOVERY.md"
assert_exists "docs/implementation/20260623_brick_2_resident_directory/EVIDENCE.md"
assert_exists "docs/decisions/BRICK_2_RESIDENT_DIRECTORY_DECISION.md"
assert_exists "docs/gates/BRICK_2_GATES_AND_CHECKS.md"
assert_exists "docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md"

echo "-----------------------------------------"
echo "✔ All Brick 2 Gate verification checks PASSED!"
echo "========================================="
