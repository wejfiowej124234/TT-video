#!/usr/bin/env bash
# Production Feature Inventory Gate — Feature Reality Matrix (code ≠ complete).
#   bash scripts/gates/check-production-feature-inventory-gate.sh
#
# Wait-window: MATRIX_OK + NOT_ALL_READY is success (exit 0).
# FEATURE_INVENTORY_PASS only when armed evidence exists after W7.
# Does NOT mutate Candidate / code / deploy / Registry PASS.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INV="$ROOT/docs/runbook/TT-PRODUCTION-FEATURE-INVENTORY-LATEST.json"
PLAN="$ROOT/docs/runbook/TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.md"
GATE_EVIDENCE="$ROOT/evidence/PSG-REALITY-CLOSURE/FEATURE-INVENTORY-GATE-LATEST.json"

REQUIRED_DOMAINS=(Auth CMS Market Order Escrow Payment Settlement Admin Governance)

echo "TT_PRODUCTION_FEATURE_INVENTORY_GATE: start"

if [[ ! -f "$PLAN" ]]; then
  echo "FAIL missing planning SSOT: $PLAN"
  exit 1
fi
if [[ ! -f "$INV" ]]; then
  echo "FAIL missing Feature Inventory JSON: $INV"
  exit 1
fi

python - <<'PY' "$INV" "$GATE_EVIDENCE"
import json, sys
from pathlib import Path

inv_path, ev_path = sys.argv[1], sys.argv[2]
inv = json.loads(Path(inv_path).read_text(encoding="utf-8"))

required = ["Auth", "CMS", "Market", "Order", "Escrow", "Payment", "Settlement", "Admin", "Governance"]
ladder = [
    "code_exists",
    "migration_exists",
    "db_used",
    "api_closed",
    "ui_closed",
    "test_exists",
    "evidence_exists",
    "production_ready",
]

matrix = inv.get("feature_reality_matrix") or {}
missing = [d for d in required if d not in matrix]
if missing:
    print(f"TT_PRODUCTION_FEATURE_INVENTORY_GATE: FAIL missing domains: {missing}")
    sys.exit(1)

for dom, cell in matrix.items():
    if not isinstance(cell, dict):
        print(f"TT_PRODUCTION_FEATURE_INVENTORY_GATE: FAIL {dom} not object")
        sys.exit(1)
    for k in ladder:
        if k not in cell:
            print(f"TT_PRODUCTION_FEATURE_INVENTORY_GATE: FAIL {dom} missing key {k}")
            sys.exit(1)

# Forbid silent READY without armed pack
all_ready_claimed = all(matrix[d].get("production_ready") is True for d in required)

ev_file = Path(ev_path)
if all_ready_claimed and not ev_file.is_file():
    print("TT_PRODUCTION_FEATURE_INVENTORY_GATE: FAIL all domains production_ready=true but gate evidence missing")
    print("  forbid: docs-only ALL_READY")
    sys.exit(1)

if ev_file.is_file():
    ev = json.loads(ev_file.read_text(encoding="utf-8"))
    if ev.get("docs_only") is True:
        print("TT_PRODUCTION_FEATURE_INVENTORY_GATE: FAIL docs_only=true forbidden")
        sys.exit(1)
    status = ev.get("status") or ""
    if status == "FEATURE_INVENTORY_PASS":
        if not all_ready_claimed:
            print("TT_PRODUCTION_FEATURE_INVENTORY_GATE: FAIL evidence PASS but matrix not all ready")
            sys.exit(1)
        print("TT_PRODUCTION_FEATURE_INVENTORY_GATE: FEATURE_INVENTORY_PASS")
        sys.exit(0)
    print(f"TT_PRODUCTION_FEATURE_INVENTORY_GATE: FAIL unexpected evidence status={status!r}")
    sys.exit(1)

print("TT_PRODUCTION_FEATURE_INVENTORY_GATE: FEATURE_INVENTORY_MATRIX_OK")
print("TT_PRODUCTION_FEATURE_INVENTORY_GATE: FEATURE_INVENTORY_NOT_ALL_READY")
print("  note: code_exists ≠ production_ready · arm after W7 Delta Recertify")
print("TT_PRODUCTION_FEATURE_INVENTORY_GATE: MATRIX_OK")
sys.exit(0)
PY
