#!/usr/bin/env bash
# ① Phase ② Admin 证据骨架本地生成（release_gate NOT_MET · 非 GO）
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

echo "=== generate phase2 admin closure skeleton ==="
OUT="$(bash "$REPO_ROOT/scripts/dev/generate-phase2-admin-closure-skeleton.sh" | tee /dev/stderr | tail -n1)"
REPORT="${OUT#evidence=}"

python3 - <<'PY' "$REPORT"
import json, sys
path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    data = json.load(f)
assert data.get("release_gate") == "NOT_MET", data
assert data.get("phase") == "②-prep", data
checklist = data.get("phase2_checklist") or []
assert len(checklist) >= 6, checklist
print("TT_ADMIN_PHASE2_PREP_SKELETON_LOCAL: OK")
print(f"report={path}")
PY

echo "run-admin-phase2-prep-skeleton-local: exit 0"
