#!/usr/bin/env bash
# P2FC · /meta 408/503 观测隔离（fallback · 非阻塞执行链）
#
# 执行链（Soak · TN-P1-010）：health + /meta/build + internal/* — 不依赖全量 GET /meta
# 验收链（Graduation · Deep Gate G01/G02）：Soak COMPLETED + deploy 后须 /meta 200
#
# shellcheck source=scripts/ops/lib/p2fc-staging-probe-lib.sh
set -euo pipefail

p2fc_meta_observability_root() {
  if [[ -n "${P2FC_META_OBS_ROOT:-}" ]]; then
    printf '%s' "$P2FC_META_OBS_ROOT"
    return 0
  fi
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  printf '%s' "$(cd "$here/../../.." && pwd)"
}

# ① Soak 冻结窗内且未 post-soak meta 绿：/meta 408/503 仅观测
p2fc_meta_observability_only() {
  if [[ "${PHASE2_META_OBSERVABILITY_ONLY:-}" == "1" ]]; then
    return 0
  fi
  if [[ "${PHASE2_REQUIRE_META_GREEN:-}" == "1" ]]; then
    return 1
  fi
  local root freeze completed
  root="$(p2fc_meta_observability_root)"
  freeze="$root/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json"
  completed="${P2FC_SOAK_DIR:-$root/evidence/P2FC_SOAK_72H_STAGING}/COMPLETED.json"
  [[ -f "$freeze" && ! -f "$completed" ]]
}

p2fc_http_code() {
  local url="$1" max="${2:-45}"
  curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' --max-time "$max" "$url" 2>/dev/null || echo 000
}

# 写入 observability JSON；stdout 一行摘要；exit 0 当执行链可继续（health+meta_build OK）
p2fc_record_meta_observability() {
  local api="${1:?api}" web="${2:?web}" out="${3:-}"
  api="${api%/}"
  web="${web%/}"
  local root obs_only
  root="$(p2fc_meta_observability_root)"
  # shellcheck source=scripts/ops/lib/p2fc-staging-probe-lib.sh
  source "$root/scripts/ops/lib/p2fc-staging-probe-lib.sh"

  obs_only=0
  p2fc_meta_observability_only && obs_only=1

  local hc code_meta code_mb code_wm sha probe
  hc="$(p2fc_probe_health_code "$api")"
  code_meta="$(p2fc_http_code "${api}/meta" 90)"
  code_mb="$(p2fc_http_code "${api}/meta/build" 45)"
  code_wm="$(p2fc_http_code "${web}/meta" 60)"
  sha="$(p2fc_probe_git_sha "$api")"
  probe="$(p2fc_probe_git_sha_source "$api")"

  local ts stamp dir
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  dir="${out:-$root/evidence/P2FC_SOAK_72H_STAGING/meta-observability}"
  mkdir -p "$dir"

  local exec_ok=0 acceptance_ok=0
  [[ "$hc" == "200" && "$code_mb" == "200" && -n "$sha" ]] && exec_ok=1
  [[ "$code_meta" == "200" && "$code_wm" == "200" ]] && acceptance_ok=1

  node -e "
const fs=require('fs');
const payload={
  schema:'traveltrust.p2fc_meta_observability.v1',
  recorded_at_utc:process.argv[1],
  observability_only:process.argv[2]==='1',
  policy:process.argv[2]==='1'
    ? 'execution_chain_non_blocking · acceptance_deferred_until_post_soak_deploy'
    : 'acceptance_chain_requires_meta_200',
  probes:{
    api_health:process.argv[3],
    api_meta:process.argv[4],
    api_meta_build:process.argv[5],
    web_meta:process.argv[6],
    git_sha:process.argv[7],
    probe_source:process.argv[8],
  },
  execution_chain_ok:process.argv[9]==='1',
  acceptance_chain_ok:process.argv[10]==='1',
  fallback:'meta → meta_build → health (p2fc-staging-probe-lib)',
};
const dir=process.argv[11];
const file=dir+'/observability-'+process.argv[12]+'.json';
fs.writeFileSync(file, JSON.stringify(payload,null,2)+'\n');
fs.writeFileSync(dir+'/latest.json', JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify({file,execution_chain_ok:payload.execution_chain_ok,acceptance_chain_ok:payload.acceptance_chain_ok,observability_only:payload.observability_only},null,0));
" "$ts" "$obs_only" "$hc" "$code_meta" "$code_mb" "$code_wm" "$sha" "$probe" "$exec_ok" "$acceptance_ok" "$dir" "$stamp" \
    >"$dir/.last-line.json"

  local line
  line="$(cat "$dir/.last-line.json")"
  rm -f "$dir/.last-line.json"

  if [[ "$exec_ok" -eq 1 ]]; then
    echo "TT_META_OBSERVABILITY: EXEC_CHAIN_OK observability_only=${obs_only} api_meta=${code_meta} web_meta=${code_wm} probe=${probe} sha=${sha:0:12}…"
    return 0
  fi
  echo "TT_META_OBSERVABILITY: EXEC_CHAIN_WARN api_health=${hc} meta_build=${code_mb} probe=${probe}" >&2
  return 2
}
