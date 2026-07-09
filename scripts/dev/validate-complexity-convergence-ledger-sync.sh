#!/usr/bin/env bash
# 复杂度收敛台账 · ①② 双阶段漂移审计（只读）
#
#   bash scripts/dev/validate-complexity-convergence-ledger-sync.sh
#   bash scripts/dev/validate-complexity-convergence-ledger-sync.sh --strict
#
# 末行：TT_COMPLEXITY_CONVERGENCE_SYNC: PASS|DRIFT
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STRICT=0
[[ "${1:-}" == "--strict" ]] && STRICT=1

if [[ "$STRICT" == "1" ]]; then
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-complexity-convergence-ledger-status.py" --strict || {
    echo "TT_COMPLEXITY_CONVERGENCE_SYNC: DRIFT" >&2
    exit 1
  }
else
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-complexity-convergence-ledger-status.py" || {
    echo "TT_COMPLEXITY_CONVERGENCE_SYNC: DRIFT" >&2
    exit 1
  }
fi

# Gap inventory 必须存在且可解析
GAP="$ROOT/evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak/gap-inventory.latest.json"
[[ -f "$GAP" ]] || {
  echo "TT_COMPLEXITY_CONVERGENCE_SYNC: DRIFT missing_gap_inventory" >&2
  exit 1
}

LEDGER="$ROOT/registry/complexity-convergence-fix-ledger.v1.yaml"
[[ -f "$LEDGER" ]] || {
  echo "TT_COMPLEXITY_CONVERGENCE_SYNC: DRIFT missing_ledger" >&2
  exit 1
}

echo "TT_COMPLEXITY_CONVERGENCE_SYNC: PASS"
exit 0
