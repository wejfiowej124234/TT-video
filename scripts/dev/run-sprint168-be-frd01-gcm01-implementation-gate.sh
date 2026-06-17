#!/usr/bin/env bash
# Sprint 168-B combined implementation gate
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0

echo "== Sprint 168-B Combined Implementation Gate =="

bash "$ROOT/scripts/dev/run-sprint168-be-frd01-implementation-gate.sh" || fail=1
bash "$ROOT/scripts/dev/run-sprint168-be-gcm01-implementation-gate.sh" CN || fail=1
test -f "$ROOT/docs/handbook/engineering/169-Sprint168B-Business-Expansion-Implementation-Report.md" && echo "OK   169 report" || { echo "FAIL 169 report"; fail=1; }

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_SPRINT168_BE_FRD01_GCM01: IMPLEMENTATION_GO"
  exit 0
fi
echo "TT_SPRINT168_BE_FRD01_GCM01: IMPLEMENTATION_HOLD"
exit 2
