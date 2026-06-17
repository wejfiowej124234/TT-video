#!/usr/bin/env bash
# Lift TESTNET_STAGING_FREEZE for Phase ② SHA sync deploy (Owner · 非 soak 启动)
#
#   bash scripts/dev/lift-testnet-staging-freeze-for-sha-sync.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FREEZE_DIR="$ROOT/evidence/TESTNET_STAGING_FREEZE"
ACTIVE="$FREEZE_DIR/ACTIVE.json"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

[[ -f "$ACTIVE" ]] || {
  echo "lift-staging-freeze: already inactive (no ACTIVE.json)"
  exit 0
}

ARCHIVE="$FREEZE_DIR/LIFTED-${STAMP}-sha-sync.json"
cp "$ACTIVE" "$ARCHIVE"
python -c "
import json, datetime, sys
from pathlib import Path
p = Path(sys.argv[1])
d = json.loads(p.read_text(encoding='utf-8'))
d['lifted_at_utc'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
d['lifted_for'] = 'phase2_sha_hard_match_deploy'
d['lifted_git_sha'] = sys.argv[2]
p.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding='utf-8')
" "$ARCHIVE" "$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"

rm -f "$ACTIVE"
ln -sfn "$(basename "$ARCHIVE")" "$FREEZE_DIR/LATEST-LIFTED.json" 2>/dev/null || cp "$ARCHIVE" "$FREEZE_DIR/LATEST-LIFTED.json"

echo "TT_TESTNET_STAGING_FREEZE: LIFTED stamp=${STAMP} archive=${ARCHIVE}"
echo "  next: bash scripts/dev/run-phase2-testnet-full-sync-deploy.sh --full"
