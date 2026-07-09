#!/usr/bin/env bash
set -euo pipefail
JOB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOAK_ROOT="$(cd "$JOB_DIR/.." && pwd)"
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
  hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$API/health" 2>/dev/null || echo 000)"
  meta_raw="$(curl -sS --max-time 45 "$API/meta" 2>/dev/null || echo '{}')"
  sha="$(echo "$meta_raw" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);process.stdout.write((j.build&&j.build.git_sha)||'')}catch{}})" 2>/dev/null || true)"
  chain_id="$(echo "$meta_raw" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(String((j.chain&&j.chain.chain_id)||''))}catch{}})" 2>/dev/null || true)"
  idx_src="$(echo "$meta_raw" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(((j.indexer||{}).checkpoint||{}).source||'')}catch{}})" 2>/dev/null || true)"
  wc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$WEB/" 2>/dev/null || echo 000)"

  line="${ts} health=${hc} web=${wc} chain_id=${chain_id} git_sha=${sha} indexer_source=${idx_src}"
  echo "$line" >>"$LOG"

  pass=1
  [[ "$hc" == "200" ]] || pass=0
  [[ "$wc" == "200" ]] || pass=0
  [[ "$chain_id" == "11155111" ]] || pass=0
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
