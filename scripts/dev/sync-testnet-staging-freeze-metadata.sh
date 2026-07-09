#!/usr/bin/env bash
# Phase ② · sync TESTNET_STAGING_FREEZE metadata to runtime SHA (no redeploy)
#
#   bash scripts/dev/sync-testnet-staging-freeze-metadata.sh
#   bash scripts/dev/sync-testnet-staging-freeze-metadata.sh --git-sha 520abf396cce...
#
# 末行：TT_TESTNET_STAGING_FREEZE_METADATA: SYNCED
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/ops/lib/p2fc-staging-probe-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-staging-probe-lib.sh"

FREEZE_DIR="$ROOT/evidence/TESTNET_STAGING_FREEZE"
ACTIVE="$FREEZE_DIR/ACTIVE.json"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
GIT_SHA=""
AUDIT_EVID="evidence/GO_phase2_baseline_consistency_audit/full-diff-20260624T010127Z"
REASON="Phase② runtime SHA metadata sync · no redeploy · S5 deployed HEAD aligned"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --git-sha) GIT_SHA="$2"; shift 2 ;;
    --audit-evidence) AUDIT_EVID="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

HEAD_SHA="$(git -C "$ROOT" rev-parse HEAD)"
[[ -n "$GIT_SHA" ]] || GIT_SHA="$(p2fc_resolve_runtime_git_sha "$ROOT" "$API")"
PROBE_SRC="$(p2fc_probe_git_sha_source "$API")"
LIVE_SHA="$(p2fc_probe_git_sha "$API")"

mkdir -p "$FREEZE_DIR"
PREVIOUS=""
if [[ -f "$ACTIVE" ]]; then
  PREVIOUS="$(node -e "try{const j=require(process.argv[1]); console.log(j.git_sha||'')}catch{}" "$ACTIVE" 2>/dev/null || true)"
  cp "$ACTIVE" "$FREEZE_DIR/ARCHIVED-${STAMP}-metadata-sync.json"
fi

python -c "
import json, datetime, sys
from pathlib import Path
freeze = Path(sys.argv[1])
active = freeze / 'ACTIVE.json'
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
    'next_gate': 'P2FC 72h soak · TN-P1-009 · post-S5 deploy SHA alignment',
    'metadata_sync': {
        'synced_at_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'previous_git_sha': sys.argv[8] or None,
        'local_HEAD': sys.argv[9],
        'staging_live_git_sha': sys.argv[10] or None,
        'probe_source': sys.argv[11],
        'no_redeploy': True,
    },
}
active.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
(freeze / 'LATEST.json').write_text(active.read_text(encoding='utf-8'), encoding='utf-8')
print(json.dumps({'active': str(active), 'git_sha': payload['git_sha'], 'previous': payload['metadata_sync']['previous_git_sha'], 'probe': payload['metadata_sync']['probe_source']}, indent=2))
" "$FREEZE_DIR" "$STAMP" "$GIT_SHA" "$REASON" "$API" "$WEB" "$AUDIT_EVID" "$PREVIOUS" "$HEAD_SHA" "$LIVE_SHA" "$PROBE_SRC"

echo "TT_TESTNET_STAGING_FREEZE_METADATA: SYNCED stamp=${STAMP} git_sha=${GIT_SHA:0:12}… probe=${PROBE_SRC}"
