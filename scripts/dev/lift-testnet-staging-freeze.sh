#!/usr/bin/env bash
# Phase ② · lift TESTNET_STAGING_FREEZE for final-candidate deploy window (Owner)
#
#   bash scripts/dev/lift-testnet-staging-freeze.sh
#   bash scripts/dev/lift-testnet-staging-freeze.sh --reason "final candidate pre-soak fixes"
#
# 末行：TT_TESTNET_STAGING_FREEZE: LIFTED
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FREEZE_DIR="$ROOT/evidence/TESTNET_STAGING_FREEZE"
ACTIVE="$FREEZE_DIR/ACTIVE.json"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REASON="final_candidate_pre_soak_deploy_window"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reason) REASON="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,8p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) shift ;;
  esac
done

mkdir -p "$FREEZE_DIR"

if [[ ! -f "$ACTIVE" ]]; then
  echo "TT_TESTNET_STAGING_FREEZE: LIFTED (no ACTIVE — deploy allowed with TESTNET_FREEZE_OVERRIDE)"
  exit 0
fi

PREVIOUS="$(cat "$ACTIVE")"
cp "$ACTIVE" "$FREEZE_DIR/ARCHIVED-${STAMP}-lifted.json"
rm -f "$ACTIVE"

python -c "
import json, datetime, sys
from pathlib import Path
lifted = {
    'schema': 'traveltrust.testnet_staging_freeze_lift.v1',
    'lifted_at_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'stamp': sys.argv[1],
    'reason': sys.argv[2],
    'previous_active': json.loads(sys.argv[3]),
    'deploy_policy': 'TESTNET_FREEZE_OVERRIDE=1 required for staging deploy until re-engage',
    'next_gate': 'final candidate validation → engage-testnet-staging-baseline-freeze.sh → fresh 72h soak',
}
p = Path(sys.argv[4]) / f'LIFTED-{sys.argv[1]}.json'
p.write_text(json.dumps(lifted, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
(Path(sys.argv[4]) / 'LIFTED.latest.json').write_text(p.read_text(encoding='utf-8'), encoding='utf-8')
" "$STAMP" "$REASON" "$PREVIOUS" "$FREEZE_DIR"

echo "TT_TESTNET_STAGING_FREEZE: LIFTED stamp=${STAMP} reason=${REASON}"
echo "  archived=$FREEZE_DIR/ARCHIVED-${STAMP}-lifted.json"
