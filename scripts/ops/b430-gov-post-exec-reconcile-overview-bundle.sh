#!/usr/bin/env bash
# **TT-B430** / **B-430**：治理 **`execute`** **后**（或任意运维窗口）**固定顺序** 拉
# **`POST …/internal/indexer-reconcile`**（**`persist:true`** + **B-381/B-383/B-384** 三 `include_*`）再拉 **`GET …/admin/observability/overview`**，
# 对 **B-381 / B-383 / B-384 / B-415**（**`fee_router_governance_fact_stream_observability`** 总在 **200** 体中）做 **reconcile 根键** 与 **`overview.*`** **深相等**；
# 并 **best-effort** 校验 **B-381** 根键与 **B-415** 内嵌 **`governance_pool_db_vs_chain_balance`** 同源（同一响应内自洽）。
#
# **不**改合约 / ABI；**只**观测与对账；**不**替代 **B-424** meta/overview 其它门禁分工。
#
# 环境变量：
#   API_BASE_URL         默认 http://127.0.0.1:8080
#   INTERNAL_API_SECRET  **`X-Internal-Api-Secret`**
#   ADMIN_BEARER_TOKEN   Admin **Bearer**（不含 `Bearer ` 前缀）
#   B430_OUT_DIR         可选：落盘 **`b430-indexer-reconcile.json`** / **`b430-admin-overview.json`** / **`b430-verdict.json`** / **`b430-closeout-record.json`**
#   B430_WRITE_CLOSEOUT_PACK=1  且 **未** 设 **`B430_OUT_DIR`** 时：默认 **`evidence/b430_gov_post_exec_reconcile_overview/run_<UTC>/`**
#   B430_POST_INDEXER_TICK=1  **`POST …/internal/indexer-tick`** **`{}`** 一次（**execute** 后推进索引 checkpoint 时常用）
#   B430_PROPOSAL_ID       可选：跑通 **GO** 后 **`GET …/governance/proposals/:id`**，**`proposal.status == executed`** → **`governance_effect_applied=true`**（否则 **false**；未设则 **null**）
#   B430_FETCH_PUBLIC_POOL  设为 **`1`** 时额外 **`GET …/governance/pool`** 写入 **`b430-public-governance-pool.json`**（**不**自动断言；供与 B-381/B-415 人工对读）
#
# 退出码：
#   0  **GO**：四键 reconcile↔overview 相等 + 自洽检查通过
#   1  缺 **jq** / 缺密钥
#   2  HTTP **≠** **200**
#   3  reconcile **200** 体缺某观测键
#   4  overview 缺 **`overview.<key>`**
#   5  某键 reconcile **≠** overview（**SUSPECT**）
#   6  B-381 根键与 B-415 内嵌池漂移块不一致（**SUSPECT**）
#   7  某键 **anchor** 非预期
#
# Windows：须 **Git Bash** + **jq**。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

UTC="$(date -u +"%Y%m%dT%H%MZ" 2>/dev/null || date -u +"%Y%m%dT%H%MZ")"
if [[ -z "${B430_OUT_DIR:-}" && "${B430_WRITE_CLOSEOUT_PACK:-0}" == "1" ]]; then
  export B430_OUT_DIR="${ROOT}/evidence/b430_gov_post_exec_reconcile_overview/run_${UTC}"
fi

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

declare -a KEYS=(
  "governance_pool_db_vs_chain_balance_drift_observability"
  "fee_router_platform_fee_routed_log_count_chain_vs_db_observability"
  "region_vault_forwarded_log_count_chain_vs_db_observability"
  "fee_router_governance_fact_stream_observability"
)

declare -a ANCHORS=(
  "381-GOVERNANCE-POOL-DB-VS-CHAIN-BALANCE-DRIFT-OBS-V1"
  "383-FEE-ROUTER-PLATFORM-FEE-ROUTED-LOG-COUNT-CHAIN-VS-DB-OBS-V1"
  "384-REGION-VAULT-FORWARDED-LOG-COUNT-CHAIN-VS-DB-OBS-V1"
  "415-FEE-ROUTER-GOVERNANCE-FACT-STREAM-OBS-V1"
)

if ! command -v jq >/dev/null 2>&1; then
  echo "b430-gov-post-exec-reconcile-overview-bundle.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" || -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b430-gov-post-exec-reconcile-overview-bundle.sh: INTERNAL_API_SECRET and ADMIN_BEARER_TOKEN are required" >&2
  exit 1
fi

if [[ "${B430_POST_INDEXER_TICK:-0}" == "1" ]]; then
  tick_tmp="$(mktemp)"
  code_tick="$(
    curl -sS -o "$tick_tmp" -w "%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
      -d '{}' \
      "${BASE}/api/v1/internal/indexer-tick"
  )"
  rm -f "$tick_tmp"
  if [[ "$code_tick" != "200" ]]; then
    echo "b430-gov-post-exec-reconcile-overview-bundle.sh: indexer-tick HTTP ${code_tick} (expected 200)" >&2
    exit 2
  fi
  echo "b430-gov-post-exec-reconcile-overview-bundle.sh: indexer-tick ok" >&2
fi

rec="$(mktemp)"
adm="$(mktemp)"
trap 'rm -f "$rec" "$adm"' EXIT

REC_BODY='{"persist":true,"include_governance_pool_db_vs_chain_balance_drift_observability":true,"include_fee_router_platform_fee_routed_log_count_chain_vs_db_observability":true,"include_region_vault_forwarded_log_count_chain_vs_db_observability":true}'

code_rec="$(
  curl -sS -o "$rec" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "$REC_BODY" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_rec" != "200" ]]; then
  echo "b430-gov-post-exec-reconcile-overview-bundle.sh: indexer-reconcile HTTP ${code_rec} (expected 200)" >&2
  head -c 2000 "$rec" >&2 || true
  echo >&2
  exit 2
fi

code_adm="$(
  curl -sS -o "$adm" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview"
)"

if [[ "$code_adm" != "200" ]]; then
  echo "b430-gov-post-exec-reconcile-overview-bundle.sh: admin observability overview HTTP ${code_adm} (expected 200)" >&2
  head -c 2000 "$adm" >&2 || true
  echo >&2
  exit 2
fi

for i in "${!KEYS[@]}"; do
  k="${KEYS[$i]}"
  a="${ANCHORS[$i]}"
  if ! jq -e ".${k} != null" "$rec" >/dev/null 2>&1; then
    echo "b430-gov-post-exec-reconcile-overview-bundle.sh: missing reconcile root key ${k}" >&2
    exit 3
  fi
  if ! jq -e --arg ak "$a" "(.${k}.anchor == \$ak)" "$rec" >/dev/null 2>&1; then
    echo "b430-gov-post-exec-reconcile-overview-bundle.sh: unexpected anchor for ${k} in reconcile leg" >&2
    jq ".${k}.anchor" "$rec" >&2
    exit 7
  fi
  if ! jq -e ".overview.${k} != null" "$adm" >/dev/null 2>&1; then
    echo "b430-gov-post-exec-reconcile-overview-bundle.sh: missing overview.${k}" >&2
    exit 4
  fi
  if ! jq -e --arg ak "$a" "(.overview.${k}.anchor == \$ak)" "$adm" >/dev/null 2>&1; then
    echo "b430-gov-post-exec-reconcile-overview-bundle.sh: unexpected anchor for ${k} in overview leg" >&2
    jq ".overview.${k}.anchor" "$adm" >&2
    exit 7
  fi
  eq="$(jq -n --slurpfile r "$rec" --slurpfile a "$adm" --arg kk "$k" \
    '($r[0][$kk]) == ($a[0].overview[$kk])')"
  if [[ "$eq" != "true" ]]; then
    echo "b430-gov-post-exec-reconcile-overview-bundle.sh: SUSPECT reconcile vs admin overview mismatch for ${k}" >&2
    echo "reconcile_obs:" >&2
    jq ".${k}" "$rec" >&2
    echo "overview_obs:" >&2
    jq ".overview.${k}" "$adm" >&2
    exit 5
  fi
done

# B-415 内嵌 **`governance_pool_db_vs_chain_balance`** 应与 **B-381** 根键同源（同一 **`indexer-reconcile`** 响应内）
inner_ok="$(jq -r '
  if (.fee_router_governance_fact_stream_observability.governance_pool_db_vs_chain_balance != null)
     and (.governance_pool_db_vs_chain_balance_drift_observability != null) then
    (.governance_pool_db_vs_chain_balance_drift_observability == .fee_router_governance_fact_stream_observability.governance_pool_db_vs_chain_balance)
  else
    true
  end
' "$rec")"
if [[ "$inner_ok" != "true" ]]; then
  echo "b430-gov-post-exec-reconcile-overview-bundle.sh: SUSPECT B-381 root drift blob != B-415 nested governance_pool_db_vs_chain_balance" >&2
  exit 6
fi

if [[ -n "${B430_OUT_DIR:-}" ]]; then
  mkdir -p "${B430_OUT_DIR}"
  cp "$rec" "${B430_OUT_DIR}/b430-indexer-reconcile.json"
  cp "$adm" "${B430_OUT_DIR}/b430-admin-overview.json"
  keys_json="$(printf '%s\n' "${KEYS[@]}" | jq -R . | jq -s .)"

  ge_for_jq="null"
  prop_status=""
  if [[ -n "${B430_PROPOSAL_ID:-}" ]]; then
    prop_tmp="${B430_OUT_DIR}/b430-governance-proposal.json"
    code_p="$(
      curl -sS -o "$prop_tmp" -w "%{http_code}" \
        "${BASE}/api/v1/governance/proposals/${B430_PROPOSAL_ID}"
    )"
    if [[ "$code_p" != "200" ]]; then
      echo "b430-gov-post-exec-reconcile-overview-bundle.sh: GET /governance/proposals/${B430_PROPOSAL_ID} HTTP ${code_p} (expected 200 for governance_effect check)" >&2
      exit 2
    fi
    prop_status="$(jq -r '.proposal.status // empty' "$prop_tmp")"
    if [[ "$prop_status" == "executed" ]]; then
      ge_for_jq="true"
    else
      ge_for_jq="false"
    fi
  fi

  jq -n \
    --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%SZ')" \
    --arg base "$BASE" \
    --argjson keys "$keys_json" \
    --argjson ge "$ge_for_jq" \
    --arg pid "${B430_PROPOSAL_ID:-}" \
    --arg pst "$prop_status" \
    '{
      verdict:"GO",
      observed_at:$ts,
      api_base_url:$base,
      keys:$keys,
      reconcile:"GO",
      overview:"aligned",
      governance_effect_applied: $ge,
      proposal_id: (if ($pid|length)>0 then $pid else null end),
      proposal_status: (if ($pst|length)>0 then $pst else null end),
      notes:"reconcile root keys match overview; B-381 vs B-415 embed self-consistent when both present"
    }' \
    >"${B430_OUT_DIR}/b430-verdict.json"

  jq -n \
    --arg sv "b430_governance_execute_closeout_v1" \
    --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%SZ')" \
    --arg base "$BASE" \
    --argjson ge "$ge_for_jq" \
    --arg pid "${B430_PROPOSAL_ID:-}" \
    --arg pst "$prop_status" \
    '{
      schema_version: $sv,
      generated_at_utc: $ts,
      api_base_url: $base,
      reconcile: "GO",
      overview: "aligned",
      governance_effect_applied: $ge,
      proposal_id: (if ($pid|length)>0 then $pid else null end),
      proposal_status: (if ($pst|length)>0 then $pst else null end),
      verdict: "GO"
    }' \
    >"${B430_OUT_DIR}/b430-closeout-record.json"
fi

if [[ "${B430_FETCH_PUBLIC_POOL:-0}" == "1" ]]; then
  pool_file="b430-public-governance-pool.json"
  [[ -n "${B430_OUT_DIR:-}" ]] && pool_file="${B430_OUT_DIR}/b430-public-governance-pool.json"
  curl -sS -o "$pool_file" "${BASE}/api/v1/governance/pool" || {
    echo "b430-gov-post-exec-reconcile-overview-bundle.sh: warning: GET /governance/pool failed" >&2
  }
fi

echo "b430-gov-post-exec-reconcile-overview-bundle.sh: GO (B-381/B-383/B-384/B-415 reconcile == overview; inner B-381 vs B-415 embed ok)"
exit 0
