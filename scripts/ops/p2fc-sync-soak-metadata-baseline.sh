#!/usr/bin/env bash
# P2FC · patch in-flight soak job.json metadata baseline (read-only · no worker restart)
#
#   bash scripts/ops/p2fc-sync-soak-metadata-baseline.sh
#   bash scripts/ops/p2fc-sync-soak-metadata-baseline.sh --git-sha 520abf396cce...
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/ops/lib/p2fc-staging-probe-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-staging-probe-lib.sh"
# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
EXPECT_SHA=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --git-sha) EXPECT_SHA="$2"; shift 2 ;;
    --job-dir)
      JOB="$2"
      shift 2
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "${JOB:-}" ]]; then
  JOB=""
  for d in "$SOAK_DIR"/job-*; do
    [[ -d "$d" && -f "$d/job.json" ]] || continue
    [[ -z "$JOB" || "$(basename "$d")" > "$(basename "$JOB")" ]] && JOB="$d"
  done
fi

[[ -n "${JOB:-}" && -f "$JOB/job.json" ]] || {
  echo "p2fc-sync-soak-metadata-baseline: no job.json under $SOAK_DIR" >&2
  exit 3
}

if [[ -z "$EXPECT_SHA" ]]; then
  EXPECT_SHA="$(p2fc_resolve_runtime_git_sha "$ROOT" "$API")"
fi

FREEZE_SHA="$(phase2_read_freeze_git_sha "$ROOT")"
PROBE_SRC="$(p2fc_probe_git_sha_source "$API")"
LIVE_SHA="$(p2fc_probe_git_sha "$API")"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

node -e "
const fs=require('fs');
const jobPath=process.argv[1];
const payload={
  expect_git_sha: process.argv[2],
  metadata_baseline_updated_at: process.argv[3],
  metadata_baseline_previous_expect_git_sha: null,
  metadata_baseline_source: process.argv[4],
  metadata_baseline_live_git_sha: process.argv[5] || null,
  metadata_baseline_probe_source: process.argv[6],
  freeze_ssot_git_sha: process.argv[7] || null,
  metadata_baseline_policy: 'read_only_no_redeploy_no_worker_restart',
};
const j=JSON.parse(fs.readFileSync(jobPath,'utf8'));
payload.metadata_baseline_previous_expect_git_sha=j.expect_git_sha||null;
Object.assign(j,payload);
fs.writeFileSync(jobPath, JSON.stringify(j,null,2)+'\n');
console.log(JSON.stringify({job:jobPath, expect_git_sha:j.expect_git_sha, previous:payload.metadata_baseline_previous_expect_git_sha, live:j.metadata_baseline_live_git_sha, probe:j.metadata_baseline_probe_source}, null, 2));
" "$JOB/job.json" "$EXPECT_SHA" "$STAMP" "runtime_meta_build_or_resolve" "$LIVE_SHA" "$PROBE_SRC" "$FREEZE_SHA"

echo "TT_P2FC_SOAK_METADATA_BASELINE: OK job=$JOB expect=${EXPECT_SHA:0:12}… probe=${PROBE_SRC}"
