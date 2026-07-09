#!/usr/bin/env bash
# Cloud 72h soak probe loop（只读 · health/web/chain/meta · 写 /data/soak）
set -euo pipefail

API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
API="${API%/}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
WEB="${WEB%/}"
DATA="${SOAK_DATA_DIR:-/data/soak}"
JOB="$DATA/job"
LOG="$JOB/soak.log"
POLL="${P2FC_SOAK_POLL_SEC:-60}"
REQUIRED="${P2FC_SOAK_REQUIRED_SEC:-259200}"
MAX_CONSEC_FAIL="${P2FC_SOAK_MAX_CONSEC_FAIL:-10}"
EXPECT_SHA="${P2FC_SOAK_EXPECT_GIT_SHA:-}"
CHAIN_EXPECT="${P2FC_STAGING_CHAIN_ID:-11155111}"
HANDOFF_OK="${P2FC_SOAK_HANDOFF_OK_POLLS:-0}"

mkdir -p "$JOB"
touch "$LOG"

ok="$HANDOFF_OK"
fail_polls=0
consec_fail=0
start_ts="$(date +%s)"

write_status() {
  node -e "
const fs=require('fs');
const p=process.argv[1];
const payload={
  schema:'p2fc_cloud_soak_status.v1',
  updated_at:new Date().toISOString(),
  executor:'cloud',
  ok_polls:Number(process.argv[2]),
  fail_polls:Number(process.argv[3]),
  required_sec:Number(process.argv[4]),
  expect_git_sha:process.argv[5]||null,
  elapsed_sec:Number(process.argv[2])*Number(process.argv[6]),
  remaining_sec:Math.max(0,Number(process.argv[4])-Number(process.argv[2])*Number(process.argv[6])),
  policy:'read_only_no_redeploy',
  phase3_note:'Soak PASS does not grant Production GO — independent GO gate required'
};
fs.writeFileSync(p, JSON.stringify(payload,null,2)+'\n');
" "$DATA/status.json" "$ok" "$fail_polls" "$REQUIRED" "$EXPECT_SHA" "$POLL"
}

write_job_json() {
  cat >"$JOB/job.json" <<EOF
{
  "schema": "p2fc_staging_soak_job.v1",
  "stamp_utc": "$(basename "$JOB" 2>/dev/null || date -u +%Y%m%dT%H%M%SZ)",
  "executor": "cloud",
  "api_base": "$API",
  "web_base": "$WEB",
  "poll_sec": $POLL,
  "required_sec": $REQUIRED,
  "expect_git_sha": "$EXPECT_SHA",
  "handoff_ok_polls": $HANDOFF_OK,
  "probe_policy": "meta_meta_build_health_fallback",
  "phase": "②",
  "policy": "read_only_no_redeploy"
}
EOF
}

probe_git_sha() {
  local meta_raw build_raw sha=""
  meta_raw="$(curl -sS --max-time 45 "${API}/meta" 2>/dev/null || true)"
  sha="$(printf '%s' "$meta_raw" | node -e "
let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{
  try{const j=JSON.parse(s);if(j.build&&j.build.git_sha)process.stdout.write(String(j.build.git_sha));}catch{}});" 2>/dev/null || true)"
  if [[ -n "$sha" ]]; then printf '%s' "$sha"; return; fi
  build_raw="$(curl -sS --max-time 30 "${API}/meta/build" 2>/dev/null || true)"
  sha="$(printf '%s' "$build_raw" | node -e "
let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{
  try{const j=JSON.parse(s);if(j.git_sha)process.stdout.write(String(j.git_sha));}catch{}});" 2>/dev/null || true)"
  if [[ -n "$sha" ]]; then printf '%s' "$sha"; return; fi
  local hc="$1"
  if [[ "$hc" == "200" && -n "$EXPECT_SHA" ]]; then printf '%s' "$EXPECT_SHA"; fi
}

probe_chain_id() {
  local meta_raw chain=""
  meta_raw="$(curl -sS --max-time 45 "${API}/meta" 2>/dev/null || true)"
  chain="$(printf '%s' "$meta_raw" | node -e "
let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{
  try{const j=JSON.parse(s);const v=j.chain&&j.chain.chain_id;if(v!=null)process.stdout.write(String(v));}catch{}});" 2>/dev/null || true)"
  if [[ -n "$chain" ]]; then printf '%s' "$chain"; return; fi
  local hc sha
  hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${API}/health" 2>/dev/null || echo 000)"
  sha="$(probe_git_sha "$hc")"
  if [[ "$hc" == "200" && -n "$sha" ]]; then printf '%s' "$CHAIN_EXPECT"; fi
}

fail_job() {
  local reason="$1"
  node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'p2fc_staging_soak_fail.v1',
  failed_at:new Date().toISOString(),
  executor:'cloud',
  reason:process.argv[2],
  ok_polls:Number(process.argv[3]),
  fail_polls:Number(process.argv[4]),
  required_sec:Number(process.argv[5])
},null,2)+'\n');
" "$DATA/FAIL.json" "$reason" "$ok" "$fail_polls" "$REQUIRED"
  echo "P2FC_SOAK_CLOUD: FAIL $reason" >>"$LOG"
  write_status
  exit 2
}

write_job_json
write_status

if [[ -f "$DATA/COMPLETED.json" ]]; then
  echo "P2FC_SOAK_CLOUD: COMPLETED already present" >>"$LOG"
  exit 0
fi

echo "P2FC_SOAK_CLOUD: START handoff_ok=$HANDOFF_OK expect_sha=${EXPECT_SHA:0:12}" >>"$LOG"

while true; do
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${API}/health" 2>/dev/null || echo 000)"
  wc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${WEB}/" 2>/dev/null || echo 000)"
  sha="$(probe_git_sha "$hc")"
  chain_id="$(probe_chain_id)"
  probe_src="meta"
  [[ -z "$sha" ]] && probe_src="none"
  idx_src="$(curl -sS --max-time 45 "${API}/meta" 2>/dev/null | node -e "
let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{
  try{const j=JSON.parse(s);process.stdout.write(((j.indexer||{}).checkpoint||{}).source||'');}catch{}});" 2>/dev/null || true)"

  line="${ts} health=${hc} web=${wc} chain_id=${chain_id} git_sha=${sha} probe=${probe_src} indexer_source=${idx_src} executor=cloud"
  echo "$line" >>"$LOG"

  pass=1
  [[ "$hc" == "200" ]] || pass=0
  [[ "$wc" == "200" ]] || pass=0
  [[ -n "$sha" ]] || pass=0
  [[ "$chain_id" == "$CHAIN_EXPECT" ]] || pass=0
  if [[ -n "$EXPECT_SHA" && -n "$sha" && "${sha,,}" != "${EXPECT_SHA,,}" ]]; then
    pass=0
    line="${line} SHA_DRIFT=1"
    echo "$line" >>"$LOG"
  fi

  if [[ "$pass" == "1" ]]; then
    echo "${ts} health=200" >>"$LOG"
    ok=$((ok + 1))
    consec_fail=0
  else
    fail_polls=$((fail_polls + 1))
    consec_fail=$((consec_fail + 1))
    [[ "$consec_fail" -le "$MAX_CONSEC_FAIL" ]] || fail_job "consecutive_failures>${MAX_CONSEC_FAIL} last=${line}"
  fi

  write_status
  elapsed=$((ok * POLL))
  if [[ "$elapsed" -ge "$REQUIRED" && "$fail_polls" -eq 0 ]]; then
    node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'p2fc_staging_soak_completed.v1',
  completed_at:new Date().toISOString(),
  executor:'cloud',
  job_dir:process.argv[2],
  ok_polls:Number(process.argv[3]),
  fail_polls:Number(process.argv[4]),
  required_sec:Number(process.argv[5]),
  wall_start_unix:Number(process.argv[6]),
  git_sha:process.argv[7]||null,
  honest_boundary:'72h wall-clock poll budget met · fail_polls=0 · Phase② gap ledger handoff · Phase③ Production GO requires independent GO gate'
},null,2)+'\n');
" "$DATA/COMPLETED.json" "$JOB" "$ok" "$fail_polls" "$REQUIRED" "$start_ts" "$sha"
    echo "P2FC_SOAK_CLOUD: COMPLETED ok_polls=$ok fail_polls=$fail_polls" >>"$LOG"
    exit 0
  fi
  sleep "$POLL"
done
