#!/usr/bin/env bash
# Local First · ① 本地收敛闸（推 staging 前 · 不 deploy）
#
#   bash scripts/dev/run-local-first-convergence-gate.sh
#   bash scripts/dev/run-local-first-convergence-gate.sh --with-baseline-audit
#   bash scripts/dev/run-local-first-convergence-gate.sh --with-local-smoke
#
# SSOT: docs/runbook/TT-LOCAL-FIRST-CONVERGENCE.md
# 末行：TT_LOCAL_FIRST_CONVERGENCE_GATE: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${LOCAL_FIRST_CONVERGENCE_OUT:-$ROOT/evidence/GO_phase2_testnet_graduation/local-first-convergence-gate/$STAMP}"
WITH_BASELINE=0
WITH_SMOKE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-baseline-audit) WITH_BASELINE=1; shift ;;
    --with-local-smoke) WITH_SMOKE=1; shift ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

fail() {
  echo "run-local-first-convergence-gate: FAIL $*" >&2
  echo "TT_LOCAL_FIRST_CONVERGENCE_GATE: FAIL"
  exit 2
}

HEAD_SHA="$(git -C "$ROOT" rev-parse HEAD)"
echo "== Local First convergence gate · $STAMP =="
echo "HEAD=$HEAD_SHA"
echo "OUT=$EVID"

rm -f "$ROOT/evidence/.tmp-ssot-meta.json" "$ROOT/evidence/.tmp-ssot-web-meta.json"

echo ""
echo "=== alignment audit (fresh meta · drift classification) ==="
set +e
node "$ROOT/scripts/dev/emit-local-first-alignment-audit.mjs" \
  --evidence-dir "$EVID/alignment-audit"
ALIGN_RC=$?
set -e

P0_COUNT="$(PYTHONIOENCODING=utf-8 python -c "
import json
from pathlib import Path
p = Path(r'$EVID/alignment-audit/audit.json')
j = json.loads(p.read_text(encoding='utf-8'))
print(sum(1 for g in j.get('gaps', []) if g.get('sev') == 'P0'))
" 2>/dev/null || echo 0)"

if [[ "$P0_COUNT" != "0" ]]; then
  fail "alignment audit P0 gaps=$P0_COUNT"
fi

if [[ "$ALIGN_RC" -ne 0 ]]; then
  echo "NOTE: TT_LOCAL_FIRST_ALIGNMENT not 100% (exit $ALIGN_RC) — OK if only INFO/P1/LOCAL_AHEAD/PHASE3-WIP"
fi

if ! grep -q '"runtime_drift": false' "$EVID/alignment-audit/audit.json" 2>/dev/null; then
  fail "runtime drift detected (not LOCAL_AHEAD)"
fi
grep -E 'TT_LOCAL_FIRST_(ALIGNMENT|RUNTIME_DRIFT):' "$EVID/alignment-audit/SUMMARY.md" 2>/dev/null || true

if [[ "$WITH_BASELINE" -eq 1 ]]; then
  echo ""
  echo "=== baseline consistency audit @ HEAD (read-only) ==="
  python "$ROOT/scripts/dev/gen-phase2-baseline-consistency-audit.py" \
    --expect-sha "$HEAD_SHA" \
    --out-dir "$EVID/baseline-consistency" || fail "baseline consistency audit"
fi

if [[ "$WITH_SMOKE" -eq 1 ]]; then
  echo ""
  echo "=== S3 local smoke (parity gate local-test) ==="
  hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${API_BASE_URL:-http://127.0.0.1:8080}/health" 2>/dev/null || echo 000)"
  [[ "$hc" == "200" ]] || fail "local API not up for --with-local-smoke (start API first)"
  bash "$ROOT/scripts/dev/run-phase2-local-staging-parity-gate.sh" --local-test \
    || fail "local-staging parity S3"
fi

echo ""
echo "run-local-first-convergence-gate: OK"
echo "TT_LOCAL_FIRST_CONVERGENCE_GATE: PASS"
echo "Honest: PASS = local SSOT + no runtime drift · ≠ staging deploy · ≠ Production GO"
