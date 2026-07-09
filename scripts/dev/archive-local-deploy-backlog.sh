#!/usr/bin/env bash
# Archive local deploy-path dirty tree as Phase ② deploy backlog (no commit · no deploy)
#
#   bash scripts/dev/archive-local-deploy-backlog.sh
#
# 末行：TT_LOCAL_DEPLOY_BACKLOG: ARCHIVED
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$ROOT/evidence/GO_phase2_deploy_backlog/${STAMP}"
HEAD_SHA="$(git -C "$ROOT" rev-parse HEAD)"
BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
# shellcheck source=scripts/ops/lib/p2fc-staging-probe-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-staging-probe-lib.sh"
RUNTIME_SHA="$(p2fc_probe_git_sha "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}" 2>/dev/null || true)"
[[ -n "$RUNTIME_SHA" ]] || RUNTIME_SHA="$HEAD_SHA"

mkdir -p "$OUT"

git -C "$ROOT" status --porcelain -- crates/ frontend/ deploy/ registry/ >"$OUT/dirty-paths.porcelain" || true
git -C "$ROOT" diff --stat HEAD -- crates/ frontend/ deploy/ registry/ >"$OUT/diff-stat.txt" 2>/dev/null || true
git -C "$ROOT" diff HEAD -- crates/ frontend/ deploy/ registry/ >"$OUT/deploy-backlog.patch" 2>/dev/null || true

# Untracked deploy-path files (not in git diff) — copy before clean
UNTRACKED_DIR="$OUT/untracked"
mkdir -p "$UNTRACKED_DIR"
while IFS= read -r ln; do
  [[ -z "$ln" ]] && continue
  st="${ln:0:2}"
  path="${ln:3}"
  [[ "$st" == *"?"* ]] || continue
  src="$ROOT/$path"
  [[ -e "$src" ]] || continue
  dest="$UNTRACKED_DIR/$path"
  mkdir -p "$(dirname "$dest")"
  if [[ -d "$src" ]]; then
    cp -a "$src" "$(dirname "$dest")/" 2>/dev/null || true
  else
    cp -a "$src" "$dest" 2>/dev/null || true
  fi
done <"$OUT/dirty-paths.porcelain"
UNTRACKED_COUNT="$(find "$UNTRACKED_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')"

DIRTY_COUNT="$(grep -c . "$OUT/dirty-paths.porcelain" 2>/dev/null || echo 0)"

python -c "
import json, subprocess, sys
from pathlib import Path
root = Path(sys.argv[1])
out = Path(sys.argv[2])
porcelain = (out / 'dirty-paths.porcelain').read_text(encoding='utf-8', errors='replace').splitlines()
paths = []
for ln in porcelain:
    ln = ln.rstrip()
    if not ln:
        continue
    status, path = ln[:2].strip(), ln[3:]
    paths.append({'status': status, 'path': path})
key = [p for p in paths if any(k in p['path'] for k in ('itineraries.rs', 'db/mod.rs', 'auth_pause_metrics', 'AGENTS.md'))]
payload = {
    'schema': 'traveltrust.local_deploy_backlog.v1',
    'archived_at_utc': sys.argv[3],
    'local_HEAD': sys.argv[4],
    'branch': sys.argv[5],
    'staging_runtime_git_sha': sys.argv[6],
    'dirty_path_count': len(paths),
    'key_paths': key[:20],
    'policy': 'backlog_only · staging not redeployed · apply on next S5 after soak graduation',
    'artifacts': {
        'porcelain': str(out / 'dirty-paths.porcelain'),
        'diff_stat': str(out / 'diff-stat.txt'),
        'patch': str(out / 'deploy-backlog.patch'),
        'untracked_dir': str(out / 'untracked'),
    },
    'untracked_file_count': int(sys.argv[7]),
}
(out / 'manifest.json').write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({'count': len(paths), 'key': len(key), 'patch_bytes': (out / 'deploy-backlog.patch').stat().st_size if (out / 'deploy-backlog.patch').is_file() else 0}, indent=2))
" "$ROOT" "$OUT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$HEAD_SHA" "$BRANCH" "$RUNTIME_SHA" "$UNTRACKED_COUNT"

echo "TT_LOCAL_DEPLOY_BACKLOG: ARCHIVED stamp=${STAMP} dirty_paths=${DIRTY_COUNT} out=${OUT}"
