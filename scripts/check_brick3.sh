#!/usr/bin/env bash
set -eo pipefail

echo "========================================="
echo "PGMS Brick 3 Gate & Check Verification"
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
    echo "✘ Error: Path $1 exists but should not be implemented in Brick 3!"
    exit 1
  fi
}

# 1. Models & Backend Structure
echo "Checking backend structure..."
assert_exists "backend/supervisors"
assert_exists "backend/supervisors/models.py"

# Verify SupervisorProfile model name is in models.py
if grep -q "class SupervisorProfile" "backend/supervisors/models.py"; then
  echo "✔ SupervisorProfile model verified in models.py."
else
  echo "✘ SupervisorProfile class definition not found in models.py!"
  exit 1
fi

# Verify no masters app exists yet
assert_not_exists "backend/masters"

# 2. Frontend Routes
echo "Checking frontend routes..."
assert_exists "frontend/app/supervisors/page.tsx"
assert_exists "frontend/app/supervisors/new/page.tsx"
assert_exists "frontend/app/supervisors/[id]/page.tsx"

assert_not_exists "frontend/app/masters"

# 3. Documentation
echo "Checking documentation files..."
assert_exists "docs/implementation/20260623_brick_3_supervisor_directory/DISCOVERY.md"
assert_exists "docs/implementation/20260623_brick_3_supervisor_directory/EVIDENCE.md"
assert_exists "docs/decisions/BRICK_3_SUPERVISOR_DIRECTORY_DECISION.md"
assert_exists "docs/gates/BRICK_3_GATES_AND_CHECKS.md"
assert_exists "docs/truth-map/FRONTEND_BACKEND_TRUTH_MAP.md"

echo "-----------------------------------------"
echo "✔ All Brick 3 Gate verification checks PASSED!"
echo "========================================="
