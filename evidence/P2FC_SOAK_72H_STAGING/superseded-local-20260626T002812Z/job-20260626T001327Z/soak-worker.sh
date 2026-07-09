#!/usr/bin/env bash
set -euo pipefail
JOB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOAK_ROOT="$(cd "$JOB_DIR/.." && pwd)"
ROOT="/d/TravelTrust-V1.1"
# shellcheck source=scripts/ops/lib/p2fc-staging-probe-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-staging-probe-lib.sh"
API="${STAGING_API_BASE:?}"
WEB="${STAGING_WEB_BASE:?}"
POLL="${P2FC_SOAK_POLL_SEC:-60}"
REQUIRED="${P2FC_SOAK_REQUIRED_SEC:-259200}"
MAX_CONSEC_FAIL="${P2FC_SOAK_MAX_CONSEC_FAIL:-10}"
FREEZE_SHA="${P2FC_SOAK_EXPECT_GIT_SHA:-}"
LOG="$JOB_DIR/soak.log"
: >"$LOG"

ok=0
consec_fail=0
start_ts="$(date +%s)"

fail_job() {
  local reason="$1"
  node -e "
const fs=require('fs');
const p=process.argv[1];
const payload={
  schema:'p2fc_staging_soak_fail.v1',
  failed_at:new Date().toISOString(),
  job_dir:process.argv[2],
  reason:process.argv[3],
  ok_polls:Number(process.argv[4]),
  required_sec:Number(process.argv[5])
};
fs.writeFileSync(p, JSON.stringify(payload,null,2)+'\n');
" "$SOAK_ROOT/FAIL.json" "$JOB_DIR" "$reason" "$ok" "$REQUIRED"
  echo "P2FC_SOAK: FAIL reason=$reason ok_polls=$ok" >>"$LOG"
  exit 2
}

while true; do
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  hc="$(p2fc_probe_health_code "$API")"
  meta_raw="$(curl -sS --max-time 45 "$API/meta" 2>/dev/null || echo '{}')"
  probe_src="$(p2fc_probe_git_sha_source "$API" "$hc")"
  sha="$(p2fc_probe_git_sha "$API" "$hc")"
  chain_id="$(p2fc_probe_chain_id "$API")"
  if [[ "$probe_src" == "health" && -z "$chain_id" ]]; then
    chain_id="${P2FC_STAGING_CHAIN_ID:-11155111}"
  fi
  idx_src="$(echo "$meta_raw" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(((j.indexer||{}).checkpoint||{}).source||'')}catch{}})" 2>/dev/null || true)"
  wc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$WEB/" 2>/dev/null || echo 000)"

  line="${ts} health=${hc} web=${wc} chain_id=${chain_id} git_sha=${sha} probe=${probe_src} indexer_source=${idx_src}"
  echo "$line" >>"$LOG"

  pass=1
  [[ "$hc" == "200" ]] || pass=0
  [[ "$wc" == "200" ]] || pass=0
  [[ "$probe_src" != "none" ]] || pass=0
  if [[ "$probe_src" == "health" ]]; then
    [[ -n "$sha" ]] || pass=0
  else
    [[ "$chain_id" == "11155111" ]] || pass=0
  fi
  if [[ -n "$FREEZE_SHA" && -n "$sha" && "${sha,,}" != "${FREEZE_SHA,,}" ]]; then
    pass=0
    line="${line} SHA_DRIFT=1"
    echo "$line" >>"$LOG"
  fi

  if [[ "$pass" == "1" ]]; then
    echo "${ts} health=200" >>"$LOG"
    ok=$((ok + 1))
    consec_fail=0
  else
    consec_fail=$((consec_fail + 1))
    [[ "$consec_fail" -le "$MAX_CONSEC_FAIL" ]] || fail_job "consecutive_failures>${MAX_CONSEC_FAIL} last=${line}"
  fi

  elapsed=$((ok * POLL))
  if [[ "$elapsed" -ge "$REQUIRED" ]]; then
    node -e "
const fs=require('fs');
const payload={
  schema:'p2fc_staging_soak_completed.v1',
  completed_at:new Date().toISOString(),
  job_dir:process.argv[1],
  ok_polls:Number(process.argv[2]),
  required_sec:Number(process.argv[3]),
  wall_start_unix:Number(process.argv[4]),
  git_sha:process.argv[5]||null,
  honest_boundary:'72h wall-clock poll budget met · TN-P1-009 close candidate · ≠ Production GO'
};
fs.writeFileSync(process.argv[6], JSON.stringify(payload,null,2)+'\n');
" "$JOB_DIR" "$ok" "$REQUIRED" "$start_ts" "$sha" "$SOAK_ROOT/COMPLETED.json"
    echo "P2FC_SOAK: COMPLETED ok_polls=$ok" >>"$LOG"
    exit 0
  fi
  sleep "$POLL"
done
