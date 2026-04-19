#!/usr/bin/env bash
# **TT-B414 / B-414**：Revenue **Go-Live 联调收口** — 串联 **B-412**（订单锚）→ 可选 **indexer-tick** → **B-402**（B-383+B-386 reconcile ↔ admin overview 深相等）→ **B-413**（`order_state_transition_facts_chain_align_observability` 同键对拍）。
#
# **不新增观测键**；与 **`b402-min-revenue-e2e-reconcile-smoke.sh`** 同源 reconcile body，额外断言 **B-413** 锚与 overview 对齐。
#
# 环境变量：
#   **`API_BASE_URL`**（默认 `http://127.0.0.1:8080`）
#   **`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**
#   **`B414_ORDER_ID`** 或 **`B412_ORDER_ID`**：订单 UUID（**推荐**；除非 **`B414_SKIP_ORDER=1`**）
#   **`B414_SKIP_ORDER=1`**：跳过 **GET …/admin/orders/:id`**（仅验 reconcile↔overview **+** **B-413**，不证明「订单锚」）
#   **`B414_INDEXER_TICK_ROUNDS`**：默认 **0**；设为 **≥1** 时每轮 **`POST …/internal/indexer-tick`** **`{}`** 再跑对拍（与 **b403** 同形）
#   **`B414_OUT_DIR`**：证据目录（默认 **`evidence/b414_revenue_e2e_go_live_closeout/run_<UTC>`**）
#
# 退出码：**0** **GO**；**1** 缺依赖；**2** HTTP；**3** 断言/锚；**5** reconcile↔overview 不等；**6** 写证据失败。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

ANCHOR_383="383-FEE-ROUTER-PLATFORM-FEE-ROUTED-LOG-COUNT-CHAIN-VS-DB-OBS-V1"
ANCHOR_386="386-REVENUE-PIPELINE-LOG-COUNT-CHAIN-VS-DB-BUNDLE-OBS-V1"
ANCHOR_413="413-ORDER-STATE-FACTS-CHAIN-ALIGN-OBS-V1"
KEY_383="fee_router_platform_fee_routed_log_count_chain_vs_db_observability"
KEY_386="revenue_pipeline_log_count_chain_vs_db_bundle_observability"
KEY_413="order_state_transition_facts_chain_align_observability"

BODY='{"persist":true,"include_fee_router_platform_fee_routed_log_count_chain_vs_db_observability":true,"include_revenue_pipeline_log_count_chain_vs_db_bundle_observability":true}'

if ! command -v jq >/dev/null 2>&1; then
  echo "b414-revenue-e2e-go-live-closeout.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]] || [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b414-revenue-e2e-go-live-closeout.sh: INTERNAL_API_SECRET and ADMIN_BEARER_TOKEN are required" >&2
  exit 1
fi

UTC="$(date -u +"%Y%m%dT%H%MZ" 2>/dev/null || date -u +"%Y%m%dT%H%MZ")"
OUT="${B414_OUT_DIR:-${ROOT}/evidence/b414_revenue_e2e_go_live_closeout/run_${UTC}}"
mkdir -p "$OUT"

OID="${B414_ORDER_ID:-${B412_ORDER_ID:-}}"
ORDER_JSON="${OUT}/admin_order_response.json"
ORDER_META="${OUT}/order_anchor.json"

ROUNDS="${B414_INDEXER_TICK_ROUNDS:-0}"

order_note="skipped"
if [[ "${B414_SKIP_ORDER:-0}" == "1" ]]; then
  echo "b414-revenue-e2e-go-live-closeout.sh: B414_SKIP_ORDER=1 — no GET /admin/orders/:id" >&2
  jq -n \
    --arg note "skipped_b414_skip_order" \
    '{skipped:true,note:$note}' >"$ORDER_META"
elif [[ -z "$OID" ]]; then
  echo "b414-revenue-e2e-go-live-closeout.sh: B414_ORDER_ID or B412_ORDER_ID is required (or B414_SKIP_ORDER=1)" >&2
  exit 1
else
  code_o="$(
    curl -sS -o "$ORDER_JSON" -w "%{http_code}" \
      -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
      "${BASE}/api/v1/admin/orders/${OID}"
  )"
  if [[ "$code_o" != "200" ]]; then
    echo "b414-revenue-e2e-go-live-closeout.sh: GET /admin/orders/${OID} HTTP ${code_o}" >&2
    head -c 1600 "$ORDER_JSON" >&2 || true
    echo >&2
    exit 2
  fi
  if ! jq -e '.order != null' "$ORDER_JSON" >/dev/null 2>&1; then
    echo "b414-revenue-e2e-go-live-closeout.sh: response missing .order" >&2
    exit 3
  fi
  rid="$(jq -r '.order.id // empty' "$ORDER_JSON" | tr -d '\r\n')"
  want="$(echo -n "$OID" | tr '[:upper:]' '[:lower:]')"
  got="$(echo -n "$rid" | tr '[:upper:]' '[:lower:]')"
  if [[ -z "$got" ]] || [[ "$got" != "$want" ]]; then
    echo "b414-revenue-e2e-go-live-closeout.sh: .order.id mismatch" >&2
    exit 3
  fi
  jq -n \
    --arg id "$rid" \
    --argjson chain_id "$(jq '.order.chain_id // null' "$ORDER_JSON")" \
    --arg status "$(jq -r '.order.status // empty' "$ORDER_JSON")" \
    '{order_id:$id,chain_id:$chain_id,status:$status,anchor:"b412_discoverability"}' >"$ORDER_META"
  order_note="anchored"
  echo "b414-revenue-e2e-go-live-closeout.sh: order anchor ok ($(jq -c . "$ORDER_META"))" >&2
fi

tick_tmp="$(mktemp)"
trap 'rm -f "$tick_tmp"' EXIT

for ((i = 1; i <= ROUNDS; i++)); do
  code_tick="$(
    curl -sS -o "$tick_tmp" -w "%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
      -d '{}' \
      "${BASE}/api/v1/internal/indexer-tick"
  )"
  if [[ "$code_tick" != "200" ]]; then
    echo "b414-revenue-e2e-go-live-closeout.sh: indexer-tick round ${i} HTTP ${code_tick}" >&2
    exit 2
  fi
  cp "$tick_tmp" "${OUT}/indexer_tick_round_${i}.json"
  echo "b414-revenue-e2e-go-live-closeout.sh: indexer-tick round ${i} ok" >&2
done

rec="${OUT}/indexer_reconcile_200.json"
adm="${OUT}/admin_observability_overview_200.json"

code_rec="$(
  curl -sS -o "$rec" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "$BODY" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_rec" != "200" ]]; then
  echo "b414-revenue-e2e-go-live-closeout.sh: indexer-reconcile HTTP ${code_rec}" >&2
  exit 2
fi

for pair in "${KEY_383}:${ANCHOR_383}" "${KEY_386}:${ANCHOR_386}" "${KEY_413}:${ANCHOR_413}"; do
  k="${pair%%:*}"
  a="${pair#*:}"
  if ! jq -e ".${k} != null" "$rec" >/dev/null 2>&1; then
    echo "b414-revenue-e2e-go-live-closeout.sh: missing ${k} in reconcile body" >&2
    exit 3
  fi
  if ! jq -e --arg an "$a" "(.${k}.anchor == \$an)" "$rec" >/dev/null 2>&1; then
    echo "b414-revenue-e2e-go-live-closeout.sh: unexpected anchor for ${k}" >&2
    jq ".${k}.anchor" "$rec" >&2
    exit 3
  fi
done

code_adm="$(
  curl -sS -o "$adm" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview"
)"

if [[ "$code_adm" != "200" ]]; then
  echo "b414-revenue-e2e-go-live-closeout.sh: admin overview HTTP ${code_adm}" >&2
  exit 2
fi

for k in "$KEY_383" "$KEY_386" "$KEY_413"; do
  if ! jq -e ".overview.${k} != null" "$adm" >/dev/null 2>&1; then
    echo "b414-revenue-e2e-go-live-closeout.sh: missing overview.${k}" >&2
    exit 3
  fi
done

for k in "$KEY_383" "$KEY_386" "$KEY_413"; do
  eq="$(jq -n --slurpfile r "$rec" --slurpfile a "$adm" \
    "(\$r[0].${k}) == (\$a[0].overview.${k})")"
  if [[ "$eq" != "true" ]]; then
    echo "b414-revenue-e2e-go-live-closeout.sh: reconcile vs admin mismatch for ${k}" >&2
    exit 5
  fi
done

mk="$(jq -r ".${KEY_386}.rollup.marker // empty" "$rec")"
b413_hint_json="$(jq -c ".${KEY_413}.drift_signals.drift_acceptable_hint // null" "$rec")"

RECORD="${OUT}/b414-closeout-record.json"
if ! jq -n \
  --arg sv "b414_go_live_revenue_closeout_v1" \
  --arg at "$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg base "$BASE" \
  --arg order_note "$order_note" \
  --argjson order_id "$(jq -n --arg id "${OID:-}" 'if ($id|length)>0 then $id else null end')" \
  --argjson indexer_tick_rounds "$ROUNDS" \
  --arg bundle_rollup_marker "$mk" \
  --argjson b413_drift_acceptable_hint "$b413_hint_json" \
  --arg verdict "GO" \
  --arg bundle "B402_B383_B386_plus_B413_reconcile_admin_overview_deepeq" \
  '{
    schema_version: $sv,
    generated_at_utc: $at,
    api_base_url: $base,
    steps: ["order_anchor_or_skip","optional_indexer_tick","indexer_reconcile_persist","admin_observability_overview","deepeq_b383_b386_b413"],
    order: {note: $order_note, order_id: $order_id},
    indexer_tick_rounds: $indexer_tick_rounds,
    revenue_bundle: {marker: $bundle, rollup_marker: $bundle_rollup_marker, b413_drift_acceptable_hint: $b413_drift_acceptable_hint},
    verdict: $verdict
  }' >"$RECORD"
then
  echo "b414-revenue-e2e-go-live-closeout.sh: failed to write record" >&2
  exit 6
fi

echo "b414-revenue-e2e-go-live-closeout.sh: ok (B-414 GO-Live revenue closeout; evidence=${OUT}; rollup.marker=${mk}; b413 drift_acceptable_hint=${b413_hint})" >&2
exit 0
