#!/usr/bin/env bash
# FINAL RELEASE BASELINE freeze gate — cert suite forbidden until FROZEN.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
REG="registry/final-release-baseline.v1.yaml"
HUM="docs/runbook/TT-FINAL-RELEASE-BASELINE-LATEST.md"
JSON="docs/runbook/TT-FINAL-RELEASE-BASELINE-LATEST.json"
REQUIRE_FROZEN=0
[[ "${1:-}" == "--require-frozen" ]] && REQUIRE_FROZEN=1

echo "TT_FINAL_RELEASE_BASELINE_GATE: start"
for f in "$REG" "$HUM" "$JSON"; do
  [[ -f "$f" ]] || { echo "FAIL missing: $f"; exit 1; }
done
grep -q 'machine_key: TT_FINAL_RELEASE_BASELINE' "$REG" || { echo "FAIL machine_key"; exit 1; }
grep -q 'PSG-REL-20260720-WEB3-CAND-V2' "$REG" || { echo "FAIL Candidate pin"; exit 1; }
grep -q 'V3.1.1' "$REG" || { echo "FAIL V3.1.1"; exit 1; }
grep -q 'PSG_EGM_Final\|PSG-EGM' "$REG" || { echo "FAIL EGM"; exit 1; }
if ! grep -qE 'FORBIDDEN_UNTIL_FREEZE|ARMED_NOT_EXECUTED' "$REG"; then
  echo "FAIL cert_suite lock missing"
  exit 1
fi

freeze=$(python -c "import json; j=json.load(open(r'$JSON', encoding='utf-8')); print(j.get('freeze_status','UNKNOWN'))")
cert=$(python -c "import json; j=json.load(open(r'$JSON', encoding='utf-8')); print(j.get('cert_suite','UNKNOWN'))")
echo "freeze_status=$freeze cert_suite=$cert"

if [[ "$REQUIRE_FROZEN" == "1" ]]; then
  if [[ "$freeze" != "FROZEN" ]]; then
    echo "TT_FINAL_RELEASE_BASELINE_GATE: NOT_FROZEN — cert suite FORBIDDEN"
    exit 2
  fi
  echo "TT_FINAL_RELEASE_BASELINE_GATE: FROZEN — cert suite may run only on Owner explicit start (ARMED_NOT_EXECUTED)"
  exit 0
fi
if [[ "$freeze" == "FROZEN" ]]; then
  echo "TT_FINAL_RELEASE_BASELINE_GATE: FROZEN_OK (cert not auto-started)"
  exit 0
fi
echo "TT_FINAL_RELEASE_BASELINE_GATE: ESTABLISHMENT_OK (freeze pending · cert FORBIDDEN)"
exit 0
