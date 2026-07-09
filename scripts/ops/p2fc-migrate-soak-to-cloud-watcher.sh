#!/usr/bin/env bash
# 从本地 soak-worker 迁移至 Fly 云端 Soak Watcher（② · 只读 · 不触 staging redeploy）
#
#   bash scripts/ops/p2fc-migrate-soak-to-cloud-watcher.sh --preflight
#   bash scripts/ops/p2fc-migrate-soak-to-cloud-watcher.sh --execute
#
# SSOT: docs/runbook/TT-DEPLOYMENT-THREE-STATE-GOVERNANCE.md
# 末行: TT_P2FC_CLOUD_SOAK_MIGRATION: PASS|BLOCKED|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
FLY_CONFIG="$ROOT/deploy/fly/tt-soak-watcher-staging/fly.toml"
APP="${FLY_SOAK_WATCHER_APP:-tt-soak-watcher-staging}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$SOAK_DIR/cloud-migration/$STAMP"
EXECUTE=0
RESUME=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preflight) shift ;;
    --execute) EXECUTE=1; shift ;;
    --resume) RESUME=1; EXECUTE=1; shift ;;
    -h|--help)
      sed -n '2,8p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EVID"
fail() { echo "TT_P2FC_CLOUD_SOAK_MIGRATION: FAIL $*" >&2; exit 2; }
blocked() { echo "TT_P2FC_CLOUD_SOAK_MIGRATION: BLOCKED $*" >&2; exit 3; }

LOCAL_SHA="$(git -C "$ROOT" rev-parse HEAD)"
EXPECT_SHA="${P2FC_SOAK_EXPECT_GIT_SHA:-3bbedda776b2cf2666efaac055ce9e13d98127b7}"

[[ -f "$ROOT/evidence/COMPLEXITY_CONVERGENCE/GATE-P1-01/phase1.closed.json" ]] \
  || blocked "GATE-P1-01 phase1_closed missing"

[[ -f "$SOAK_DIR/COMPLETED.json" ]] && blocked "soak already COMPLETED — no migration needed"

# 找活跃本地 job
LOCAL_JOB=""
LOCAL_PID=""
LOCAL_OK=0
for job in "$SOAK_DIR"/job-*; do
  [[ -d "$job" ]] || continue
  [[ "$(basename "$job")" == job-CLOUD-* ]] && continue
  pid="$(cat "$job/pid.txt" 2>/dev/null || true)"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null || continue
  LOCAL_JOB="$job"
  LOCAL_PID="$pid"
  LOCAL_OK="$(grep -c 'health=200' "$job/soak.log" 2>/dev/null || echo 0)"
  break
done

[[ -n "$LOCAL_JOB" ]] || {
  if [[ "$RESUME" == "1" ]]; then
    ARCH="$(ls -td "$SOAK_DIR"/superseded-local-* 2>/dev/null | head -1 || true)"
    [[ -n "$ARCH" ]] || blocked "no alive local job and no superseded-local archive for --resume"
    LOCAL_JOB="$(ls -td "$ARCH"/job-* 2>/dev/null | head -1 || true)"
    [[ -n "$LOCAL_JOB" ]] || blocked "archived job missing under $ARCH"
    LOCAL_OK="$(grep -c 'health=200' "$LOCAL_JOB/soak.log" 2>/dev/null || echo 0)"
    LOCAL_PID="archived"
    echo "  resume: handoff from $LOCAL_JOB ok_polls=$LOCAL_OK"
  else
    blocked "no alive local soak job — use --resume after partial migration or launch soak first"
  fi
}

echo "== Cloud Soak Migration · $STAMP =="
echo "  local_job=$LOCAL_JOB pid=$LOCAL_PID handoff_ok_polls=$LOCAL_OK"
echo "  expect_sha=$EXPECT_SHA"

command -v fly >/dev/null 2>&1 || fail "fly CLI missing"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"
[[ -f "$FLY_CONFIG" ]] || fail "missing $FLY_CONFIG"

if [[ "$EXECUTE" != "1" ]]; then
  echo "  preflight: fly OK · local job alive · ready for --execute"
  echo "TT_P2FC_CLOUD_SOAK_MIGRATION: PREFLIGHT_OK handoff_ok_polls=$LOCAL_OK"
  exit 0
fi

# 停止本地 worker（保留 job 目录归档）
if [[ "$LOCAL_PID" != "archived" && -n "$LOCAL_PID" ]]; then
  echo "-- stop local worker pid=$LOCAL_PID --"
  kill -TERM "$LOCAL_PID" 2>/dev/null || true
  for _ in $(seq 1 15); do
    kill -0 "$LOCAL_PID" 2>/dev/null || break
    sleep 1
  done
  kill -0 "$LOCAL_PID" 2>/dev/null && kill -KILL "$LOCAL_PID" 2>/dev/null || true
  ARCH="$SOAK_DIR/superseded-local-${STAMP}"
  mkdir -p "$ARCH"
  cp -a "$LOCAL_JOB" "$ARCH/" 2>/dev/null || true
  echo "  archived local job → $ARCH"
else
  ARCH="$(dirname "$LOCAL_JOB")"
fi

# 创建 Fly app（幂等）
fly apps list 2>/dev/null | grep -q "$APP" \
  || fly apps create "$APP" 2>&1 | tee "$EVID/fly-app-create.log" || true

# 创建 volume（幂等）
fly volumes list -a "$APP" 2>/dev/null | grep -q tt_soak_watcher_staging_data \
  || fly volumes create tt_soak_watcher_staging_data -a "$APP" -r sin --size 1 -y 2>&1 | tee "$EVID/volume-create.log" || true

echo "-- deploy cloud soak watcher --"
( cd "$(dirname "$FLY_CONFIG")" && fly deploy -a "$APP" --strategy immediate ) 2>&1 | tee "$EVID/fly-deploy.log"

fly secrets set -a "$APP" \
  "P2FC_SOAK_EXPECT_GIT_SHA=$EXPECT_SHA" \
  "P2FC_SOAK_HANDOFF_OK_POLLS=$LOCAL_OK" \
  2>&1 | tee "$EVID/fly-secrets.log"

# 本地 cloud job 镜像目录（attest 消费）
CLOUD_JOB="$SOAK_DIR/job-CLOUD-${STAMP}"
mkdir -p "$CLOUD_JOB"
cp -a "$LOCAL_JOB/job.json" "$CLOUD_JOB/job.json" 2>/dev/null || true
node -e "
const fs=require('fs');
const p=process.argv[1];
const base=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
base.executor='cloud';
base.handoff_ok_polls=Number(process.argv[3]);
base.stamp_utc=process.argv[4];
base.fly_app=process.argv[5];
fs.writeFileSync(p, JSON.stringify(base,null,2)+'\n');
" "$CLOUD_JOB/job.json" "$CLOUD_JOB/job.json" "$LOCAL_OK" "$STAMP" "$APP" 2>/dev/null || cat >"$CLOUD_JOB/job.json" <<EOF
{
  "schema": "p2fc_staging_soak_job.v1",
  "stamp_utc": "$STAMP",
  "executor": "cloud",
  "fly_app": "$APP",
  "api_base": "$API",
  "web_base": "$WEB",
  "poll_sec": 60,
  "required_sec": 259200,
  "expect_git_sha": "$EXPECT_SHA",
  "handoff_ok_polls": $LOCAL_OK,
  "policy": "read_only_no_redeploy"
}
EOF
echo "cloud:${APP}" >"$CLOUD_JOB/pid.txt"
touch "$CLOUD_JOB/soak.log"

cat >"$SOAK_DIR/CLOUD-WATCHER.json" <<EOF
{
  "schema": "traveltrust.p2fc_cloud_soak_watcher.v1",
  "migrated_at_utc": "$(date -u +%Y-%m-%dT:%M:%SZ)",
  "stamp": "$STAMP",
  "fly_app": "$APP",
  "fly_config": "deploy/fly/tt-soak-watcher-staging/fly.toml",
  "local_job_archived": "$ARCH",
  "cloud_job_dir": "$CLOUD_JOB",
  "handoff_ok_polls": $LOCAL_OK,
  "expect_git_sha": "$EXPECT_SHA",
  "sync_script": "scripts/ops/p2fc-sync-cloud-soak-evidence.sh",
  "orchestrator": "scripts/ops/p2fc-cloud-soak-orchestrator.sh --watch",
  "post_soak_chain": "scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh",
  "phase3_policy": "Production GO requires independent GO gate — Soak PASS does not inherit"
}
EOF

bash "$ROOT/scripts/ops/p2fc-sync-cloud-soak-evidence.sh" 2>&1 | tee "$EVID/first-sync.log" || true

echo "TT_P2FC_CLOUD_SOAK_MIGRATION: PASS app=$APP handoff_ok_polls=$LOCAL_OK evidence=$EVID"
echo "  observe: bash scripts/ops/p2fc-cloud-soak-orchestrator.sh --watch"
exit 0
