#!/usr/bin/env bash
# Phase ③ Production Entry Review · prerequisite gate + sign-off bundle
#
#   bash scripts/dev/run-phase3-production-entry-review.sh
#
# 末行：TT_PHASE3_PRODUCTION_ENTRY_REVIEW: ACTIVE
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase3_production_entry_review/$STAMP"
RUNTIME_SHA="9979b35efe562e8dd200e9f1a1e17fcc8182d170"
GRADUATION_SHA="fc9266ce94f18810420e720bb933946c086ce909"

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "BLOCKED: missing $1" >&2
    exit 1
  fi
}

require_file "$ROOT/evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json"
require_file "$ROOT/evidence/GO_phase2_testnet_graduation/PHASE2-CLOSURE-GRADUATION-FREEZE.latest.json"
require_file "$ROOT/evidence/GO_phase2_testnet_graduation/freeze-fc9266ce/manifest.v1.json"
require_file "$ROOT/evidence/GO_phase2_final_human_acceptance/PHASE2-FINAL-HUMAN-ACCEPTANCE.latest.json"
require_file "$ROOT/evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-DRIFT-dd5df42-vs-fc9266ce.json"
require_file "$ROOT/evidence/GO_phase2_runtime_baseline/PHASE2-LOCAL-FIRST-SYNC-9979b35e.latest.json"
require_file "$ROOT/evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-DRIFT-fc9266ce-to-9979b35e-local-first.json"

PRIOR_DRIFT="$(cd "$ROOT" && python -c "
import json
j=json.load(open('evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-DRIFT-dd5df42-vs-fc9266ce.json', encoding='utf-8'))
print((j.get('verdict') or {}).get('runtime_drift', 'UNKNOWN'))
")"
if [[ "$PRIOR_DRIFT" != "NONE" ]]; then
  echo "BLOCKED: prior closure drift TT_PHASE2_RUNTIME_DRIFT=$PRIOR_DRIFT (expected NONE)" >&2
  exit 1
fi

LOCAL_FIRST_DRIFT="$(cd "$ROOT" && python -c "
import json
j=json.load(open('evidence/GO_phase2_runtime_baseline/PHASE2-RUNTIME-DRIFT-fc9266ce-to-9979b35e-local-first.json', encoding='utf-8'))
print((j.get('verdict') or {}).get('runtime_drift', 'UNKNOWN'))
")"
if [[ "$LOCAL_FIRST_DRIFT" != "LOCAL_FIRST_INTENTIONAL" ]]; then
  echo "BLOCKED: TT_PHASE2_RUNTIME_DRIFT=$LOCAL_FIRST_DRIFT (expected LOCAL_FIRST_INTENTIONAL)" >&2
  exit 1
fi

SYNC_OK="$(cd "$ROOT" && python -c "
import json
j=json.load(open('evidence/GO_phase2_runtime_baseline/PHASE2-LOCAL-FIRST-SYNC-9979b35e.latest.json', encoding='utf-8'))
print((j.get('verdicts') or {}).get('tt_phase2_local_first_sync', 'UNKNOWN'))
")"
if [[ "$SYNC_OK" != "COMPLETE" ]]; then
  echo "BLOCKED: tt_phase2_local_first_sync=$SYNC_OK (expected COMPLETE)" >&2
  exit 1
fi

HA_SHA="$(cd "$ROOT" && python -c "
import json
j=json.load(open('evidence/GO_phase2_final_human_acceptance/PHASE2-FINAL-HUMAN-ACCEPTANCE.latest.json', encoding='utf-8'))
print(str(j.get('runtime_staging_sha') or '').lower())
")"
if [[ "$HA_SHA" != "$GRADUATION_SHA" ]]; then
  echo "BLOCKED: Final HA graduation SHA $HA_SHA != $GRADUATION_SHA" >&2
  exit 1
fi

LIVE_SHA="$(curl -sS --max-time 45 "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}/meta" 2>/dev/null \
  | python -c "import sys,json; d=json.load(sys.stdin); print((d.get('build') or {}).get('git_sha','').lower())" 2>/dev/null || echo '')"
if [[ -n "$LIVE_SHA" && "$LIVE_SHA" != "$RUNTIME_SHA" ]]; then
  echo "BLOCKED: live staging /meta git_sha=$LIVE_SHA != Local First baseline $RUNTIME_SHA" >&2
  exit 1
fi

mkdir -p "$EVID"
python "$ROOT/scripts/dev/gen-phase3-production-entry-review-signoff.py" \
  --stamp "$STAMP" \
  --evid-dir "$EVID"

echo "TT_PHASE2_LOCAL_FIRST_SYNC: COMPLETE"
echo "TT_PHASE2_RUNTIME_BASELINE_FROZEN: YES"
echo "TT_PHASE2_RUNTIME_DRIFT: LOCAL_FIRST_INTENTIONAL"
echo "TT_PHASE3_PRODUCTION_ENTRY_REVIEW: ACTIVE $STAMP"
