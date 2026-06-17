#!/usr/bin/env bash
# Re-engage TESTNET_STAGING_FREEZE after baseline consistency audit PASS (Owner · ②)
#
#   bash scripts/dev/engage-testnet-staging-baseline-freeze.sh
#   bash scripts/dev/engage-testnet-staging-baseline-freeze.sh --audit-evidence evidence/GO_phase2_baseline_consistency_audit/<stamp>
#
# 末行：TT_TESTNET_STAGING_FREEZE: ACTIVE
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FREEZE_DIR="$ROOT/evidence/TESTNET_STAGING_FREEZE"
ACTIVE="$FREEZE_DIR/ACTIVE.json"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
AUDIT_EVID=""
REASON="Phase② baseline consistency audit PASS · TL#1 Wave 1 wait"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --audit-evidence) AUDIT_EVID="$2"; shift 2 ;;
    --reason) REASON="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,8p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

SHA="$(git -C "$ROOT" rev-parse HEAD)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"

mkdir -p "$FREEZE_DIR"
if [[ -f "$ACTIVE" ]]; then
  echo "engage-staging-freeze: ACTIVE already exists — update skipped" >&2
  cat "$ACTIVE"
  exit 0
fi

python -c "
import json, datetime, sys
from pathlib import Path
root = Path(sys.argv[1])
active = root / 'ACTIVE.json'
payload = {
    'schema': 'traveltrust.testnet_staging_freeze.v1',
    'frozen_at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'stamp': sys.argv[2],
    'git_sha': sys.argv[3],
    'reason': sys.argv[4],
    'policy': 'no_redeploy_no_restart_no_migrations_no_config_changes',
    'staging_api': sys.argv[5],
    'staging_web': sys.argv[6],
    'override_env': 'TESTNET_FREEZE_OVERRIDE=1',
    'audit_evidence': sys.argv[7] or None,
    'next_gate': 'TL#1 Wave 1 (Cert #7 finalize + Cert #8 queue)',
}
active.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
latest = root / 'LATEST.json'
latest.write_text(active.read_text(encoding='utf-8'), encoding='utf-8')
" "$FREEZE_DIR" "$STAMP" "$SHA" "$REASON" "$API" "$WEB" "$AUDIT_EVID"

echo "TT_TESTNET_STAGING_FREEZE: ACTIVE stamp=${STAMP} git_sha=${SHA}"
echo "  active=$ACTIVE"
