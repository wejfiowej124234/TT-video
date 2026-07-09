#!/usr/bin/env bash
# 关闭复杂度收敛台账单项 · 强制 ①② 证据同步
#
#   bash scripts/dev/close-complexity-convergence-item.sh --id BOOK-P0-01
#   bash scripts/dev/close-complexity-convergence-item.sh --id BOOK-P0-01 --skip-phase2
#   bash scripts/dev/close-complexity-convergence-item.sh --id BOOK-P0-02 --skip-phase2 --gate-passed
#
# 流程：
#   1. 跑 phase1 gate（ledger YAML）
#   2. 写 evidence/COMPLEXITY_CONVERGENCE/<id>/phase1.closed.json
#   3. 跑 phase2 gate（除非 --skip-phase2）
#   4. 写 evidence/.../final-candidate-pre-soak/items/<id>/phase2.closed.json
#   5. 刷新 gap-inventory + ledger-status
#   6. 更新 registry 中 status → closed（需 yq 或 python patch）
#
# 末行：TT_COMPLEXITY_CONVERGENCE_ITEM_CLOSE: <id> PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ITEM_ID=""
SKIP_P2=0
GATE_PASSED=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --id) ITEM_ID="$2"; shift 2 ;;
    --skip-phase2) SKIP_P2=1; shift ;;
    --gate-passed) GATE_PASSED=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$ITEM_ID" ]] || { echo "usage: --id <LEDGER_ID>" >&2; exit 2; }

fail() { echo "TT_COMPLEXITY_CONVERGENCE_ITEM_CLOSE: $ITEM_ID FAIL $*" >&2; exit 1; }

LEDGER="$ROOT/registry/complexity-convergence-fix-ledger.v1.yaml"
P1_EVID="$ROOT/evidence/COMPLEXITY_CONVERGENCE/${ITEM_ID}"
P2_EVID="$ROOT/evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak/items/${ITEM_ID}"
mkdir -p "$P1_EVID" "$P2_EVID"

# Extract phase gates via python (no yq dependency)
read -r P1_GATE P2_GATE <<< "$(PYTHONIOENCODING=utf-8 python - "$ITEM_ID" "$LEDGER" <<'PY'
import sys, yaml
from pathlib import Path
item_id, path = sys.argv[1], Path(sys.argv[2])
data = yaml.safe_load(path.read_text(encoding="utf-8"))
hit = next((i for i in (data.get("items") or []) if i.get("id") == item_id), None)
if not hit:
    print("MISSING MISSING")
    sys.exit(3)
p1 = (hit.get("phase1") or {}).get("gate", "")
p2 = (hit.get("phase2") or {}).get("gate", "")
print(p1, p2)
PY
)" || fail "ledger item not found"

[[ "$P1_GATE" != "MISSING" && -n "$P1_GATE" ]] || fail "no phase1 gate"

if [[ "$GATE_PASSED" == "1" ]]; then
  echo "== close ${ITEM_ID} phase1: gate-passed (skip re-run) =="
else
  echo "== close ${ITEM_ID} phase1: ${P1_GATE} =="
  bash -c "$P1_GATE" || fail "phase1 gate"
fi

SHA="$(git -C "$ROOT" rev-parse HEAD)"
UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
node -e "
const fs=require('fs');
const p=process.argv[1];
fs.writeFileSync(p, JSON.stringify({
  schema:'traveltrust.complexity_convergence_item_close.v1',
  item_id:process.argv[2],
  phase:'phase1',
  closed_at_utc:process.argv[3],
  git_sha:process.argv[4],
  gate:process.argv[5],
},null,2)+'\n');
" "$P1_EVID/phase1.closed.json" "$ITEM_ID" "$UTC" "$SHA" "$P1_GATE"

if [[ "$SKIP_P2" != "1" && -n "$P2_GATE" && "$P2_GATE" != "MISSING" ]]; then
  echo "== close ${ITEM_ID} phase2: ${P2_GATE} =="
  bash -c "$P2_GATE" || fail "phase2 gate"
  node -e "
const fs=require('fs');
const p=process.argv[1];
fs.writeFileSync(p, JSON.stringify({
  schema:'traveltrust.complexity_convergence_item_close.v1',
  item_id:process.argv[2],
  phase:'phase2',
  closed_at_utc:process.argv[3],
  git_sha:process.argv[4],
  gate:process.argv[5],
},null,2)+'\n');
" "$P2_EVID/phase2.closed.json" "$ITEM_ID" "$UTC" "$SHA" "$P2_GATE"
  NEW_STATUS="closed"
else
  NEW_STATUS="phase1_closed"
fi

# Patch ledger status
PYTHONIOENCODING=utf-8 python - "$ITEM_ID" "$LEDGER" "$NEW_STATUS" <<'PY'
import sys
from pathlib import Path
import yaml
item_id, path, status = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
data = yaml.safe_load(path.read_text(encoding="utf-8"))
for it in data.get("items") or []:
    if it.get("id") == item_id:
        it["status"] = status
        break
else:
    raise SystemExit("item not found for patch")
path.write_text(yaml.dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
PY

PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-final-candidate-gap-inventory.py" >/dev/null || true
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-complexity-convergence-ledger-status.py" >/dev/null

echo "TT_COMPLEXITY_CONVERGENCE_ITEM_CLOSE: ${ITEM_ID} PASS"
exit 0
