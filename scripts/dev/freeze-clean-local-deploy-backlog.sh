#!/usr/bin/env bash
# Freeze + clean local deploy-path dirty tree during P2FC soak (no staging deploy · no soak interrupt)
#
#   bash scripts/dev/freeze-clean-local-deploy-backlog.sh
#
# 1) archive → evidence/GO_phase2_deploy_backlog/<stamp>/
# 2) git restore deploy paths → clean HEAD working tree
# 3) write evidence/GO_phase2_deploy_backlog/ACTIVE.json (apply after COMPLETED.json)
#
# 末行：TT_LOCAL_DEPLOY_BACKLOG: FROZEN_AND_CLEAN
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKLOG_ROOT="$ROOT/evidence/GO_phase2_deploy_backlog"
DEPLOY_PATHS=(crates/ frontend/ deploy/ registry/)

bash "$ROOT/scripts/dev/archive-local-deploy-backlog.sh"

STAMP="$(ls -td "$BACKLOG_ROOT"/*/ 2>/dev/null | head -1 | xargs basename 2>/dev/null || true)"
[[ -n "$STAMP" && -f "$BACKLOG_ROOT/$STAMP/manifest.json" ]] || {
  echo "freeze-clean: FAIL no archive stamp under $BACKLOG_ROOT" >&2
  exit 2
}

DIRTY_BEFORE="$(git -C "$ROOT" status --porcelain -- "${DEPLOY_PATHS[@]}" 2>/dev/null | wc -l | tr -d ' ')"
git -C "$ROOT" checkout HEAD -- "${DEPLOY_PATHS[@]}" 2>/dev/null || git -C "$ROOT" restore --source=HEAD --worktree -- "${DEPLOY_PATHS[@]}"
git -C "$ROOT" clean -fd -- "${DEPLOY_PATHS[@]}" 2>/dev/null || true
DIRTY_AFTER="$(git -C "$ROOT" status --porcelain -- "${DEPLOY_PATHS[@]}" 2>/dev/null | wc -l | tr -d ' ')"

python -c "
import json, sys
from pathlib import Path
root = Path(sys.argv[1])
stamp = sys.argv[2]
dirty_before = int(sys.argv[3])
dirty_after = int(sys.argv[4])
arch = root / 'evidence' / 'GO_phase2_deploy_backlog' / stamp
manifest = json.loads((arch / 'manifest.json').read_text(encoding='utf-8'))
payload = {
    'schema': 'traveltrust.local_deploy_backlog_active.v1',
    'frozen_at_utc': manifest.get('archived_at_utc'),
    'stamp': stamp,
    'dirty_path_count': manifest.get('dirty_path_count'),
    'local_HEAD_at_freeze': manifest.get('local_HEAD'),
    'staging_runtime_git_sha_at_freeze': manifest.get('staging_runtime_git_sha'),
    'apply_after': 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json',
    'apply_script': 'scripts/ops/p2fc-post-soak-deploy-backlog-and-graduate.sh',
    'artifacts': manifest.get('artifacts'),
    'clean_summary': {'dirty_before': dirty_before, 'dirty_after': dirty_after},
    'policy': 'soak_inflight_no_staging_redeploy_until_completed',
}
out = root / 'evidence' / 'GO_phase2_deploy_backlog' / 'ACTIVE.json'
out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({'stamp': stamp, 'dirty_before': dirty_before, 'dirty_after': dirty_after}, indent=2))
" "$ROOT" "$STAMP" "$DIRTY_BEFORE" "$DIRTY_AFTER"

echo "TT_LOCAL_DEPLOY_BACKLOG: FROZEN_AND_CLEAN stamp=${STAMP} dirty_before=${DIRTY_BEFORE} dirty_after=${DIRTY_AFTER}"
