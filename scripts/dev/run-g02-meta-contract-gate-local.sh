#!/usr/bin/env bash
# ① · G02 GET /meta 契约实时校验（soak 并行 · 本地全量契约 + staging 只读 meta/build 探针）
#
#   bash scripts/dev/run-g02-meta-contract-gate-local.sh
#   bash scripts/dev/run-g02-meta-contract-gate-local.sh --watch
#
# soak 冻结窗：staging 全量 GET /meta 可能 408（服务端 30s TimeoutLayer）— 不 redeploy；
#   · 本地 :8080/:3012 → 全量 G02 契约（REQUEST_TIMEOUT_SECS=120）
#   · staging → 只读 GET /meta/build（与 p2fc-soak meta_build 探针同源）
#
# 末行：TT_G02_META_CONTRACT_GATE: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_API="${API_BASE_URL:-http://127.0.0.1:8080}"
LOCAL_API="${LOCAL_API%/}"
LOCAL_WEB="${PLAYWRIGHT_BASE_URL:-http://localhost:3012}"
LOCAL_WEB="${LOCAL_WEB%/}"
STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
STAGING_WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
STAGING_WEB="${STAGING_WEB%/}"
WATCH=0
POLL_SEC="${G02_META_GATE_POLL_SEC:-300}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${G02_META_GATE_OUT:-$ROOT/evidence/GO_phase2_deploy_backlog/g02-meta-gate-local/$STAMP}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$OUT"

probe_local_availability() {
  local ts log
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log="$OUT/local-availability-${ts}.log"
  hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "${LOCAL_API}/health" 2>/dev/null || echo 000)"
  mc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 180 "${LOCAL_API}/meta" 2>/dev/null || echo 000)"
  wc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 180 "${LOCAL_WEB}/meta" 2>/dev/null || echo 000)"
  echo "${ts} local_availability health=${hc} api/meta=${mc} web/meta=${wc}" | tee "$log"
  [[ "$hc" == "200" && "$mc" == "200" && "$wc" == "200" ]]
}

run_local_g02_contract() {
  local ts log
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log="$OUT/g02-local-contract-${ts}.log"
  export PHASE2_DEEP_GATE_ALLOW_LOCAL=1
  export G02_ALLOW_LOCAL_CHAIN_ID=1
  export G02_META_HTTP_TIMEOUT="${G02_META_HTTP_TIMEOUT:-180}"
  export G02_META_HTTP_RETRIES="${G02_META_HTTP_RETRIES:-3}"
  export STAGING_API_BASE="$LOCAL_API"
  export STAGING_WEB_BASE="$LOCAL_WEB"
  mkdir -p "$OUT/deep-g02-local"
  set +e
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/phase2-deep-release-gate-g02-only.py" \
    --api-base "$LOCAL_API" --web-base "$LOCAL_WEB" --out "$OUT/deep-g02-local" 2>&1 | tee -a "$log"
  local rc=${PIPESTATUS[0]}
  set -e
  return "$rc"
}

probe_staging_meta_build() {
  local ts log code sha
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log="$OUT/staging-meta-build-${ts}.log"
  code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time "${P2FC_META_BUILD_TIMEOUT_SEC:-45}" "${STAGING_API}/meta/build" 2>/dev/null || echo 000)"
  sha=""
  if [[ "$code" == "200" ]]; then
    sha="$(curl -sS --max-time "${P2FC_META_BUILD_TIMEOUT_SEC:-45}" "${STAGING_API}/meta/build" 2>/dev/null | node -e "let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).git_sha||'')}catch{}})" 2>/dev/null || true)"
  fi
  wcode="$(curl -sS -o /dev/null -w "%{http_code}" --max-time "${P2FC_META_BUILD_TIMEOUT_SEC:-45}" "${STAGING_WEB}/meta" 2>/dev/null || echo 000)"
  echo "${ts} staging_probe api/meta/build=${code} web/meta=${wcode} git_sha=${sha:-missing}" | tee "$log"
  if [[ "$code" == "200" && -n "$sha" ]]; then
    if [[ "$wcode" != "200" ]]; then
      echo "${ts} staging_probe NOTE web/meta=${wcode} deferred until post-soak web deploy (hotfix patch)" | tee -a "$log"
    fi
    return 0
  fi
  return 1
}

run_once() {
  local rc=0
  # shellcheck source=scripts/ops/lib/p2fc-meta-observability-lib.sh
  source "$ROOT/scripts/ops/lib/p2fc-meta-observability-lib.sh"
  p2fc_record_meta_observability "$STAGING_API" "$STAGING_WEB" "$OUT/meta-observability" || true
  probe_local_availability || rc=2
  run_local_g02_contract || rc=2
  probe_staging_meta_build || rc=2
  if [[ "$rc" -eq 0 ]]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) TT_G02_META_CONTRACT_GATE: PASS"
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) TT_META_OBSERVABILITY: EXEC_CHAIN_OK (staging /meta deferred until post-soak deploy)"
    return 0
  fi
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) TT_G02_META_CONTRACT_GATE: FAIL" >&2
  return 2
}

if [[ "$WATCH" -eq 1 ]]; then
  while true; do
    run_once || true
    sleep "$POLL_SEC"
  done
fi

run_once
