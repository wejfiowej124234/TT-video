#!/usr/bin/env bash
# TT-B412 / B-412：订单 UUID 锚定 → 收入观测（B-383+B-386）reconcile 与 admin overview 同键对拍。
# **不新增观测键**；**复用** **`b402-min-revenue-e2e-reconcile-smoke.sh`**。
#
# 前置：**API** 已挂载 **chain_off**（否则 **`GET …/admin/orders/:id`** 为 **501**）；**`B412_ORDER_ID`** 须在 **store.orders** 中存在。
#
# 环境变量：
#   **`API_BASE_URL`**（默认 `http://127.0.0.1:8080`）
#   **`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**（与 **b402** 同源）
#   **`B412_ORDER_ID`**：订单 UUID（必填，除非 **`B412_SKIP_ORDER=1`**）
#   **`B412_SKIP_ORDER=1`**：跳过 admin 订单步，仅跑 **b402**（用于只验 reconcile↔overview，不验订单锚）
#
# 退出码：**0** 成功；**1** 缺依赖；**2** admin 订单 HTTP 非 200；**3** 订单体断言失败；**5/…** 来自 **b402**。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

if ! command -v jq >/dev/null 2>&1; then
  echo "b412-order-to-revenue-discoverability-smoke.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]] || [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b412-order-to-revenue-discoverability-smoke.sh: INTERNAL_API_SECRET and ADMIN_BEARER_TOKEN are required" >&2
  exit 1
fi

if [[ "${B412_SKIP_ORDER:-0}" == "1" ]]; then
  echo "b412-order-to-revenue-discoverability-smoke.sh: B412_SKIP_ORDER=1 — running b402 only"
  exec bash "${SCRIPT_DIR}/b402-min-revenue-e2e-reconcile-smoke.sh"
fi

if [[ -z "${B412_ORDER_ID:-}" ]]; then
  echo "b412-order-to-revenue-discoverability-smoke.sh: B412_ORDER_ID is required (or set B412_SKIP_ORDER=1)" >&2
  exit 1
fi

ord="$(mktemp)"
trap 'rm -f "$ord"' EXIT

code_o="$(
  curl -sS -o "$ord" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/orders/${B412_ORDER_ID}"
)"

if [[ "$code_o" != "200" ]]; then
  echo "b412-order-to-revenue-discoverability-smoke.sh: GET /api/v1/admin/orders/${B412_ORDER_ID} HTTP ${code_o} (need chain_off + admin order)" >&2
  head -c 1600 "$ord" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e '.order != null' "$ord" >/dev/null 2>&1; then
  echo "b412-order-to-revenue-discoverability-smoke.sh: response missing .order" >&2
  exit 3
fi

rid="$(jq -r '.order.id // empty' "$ord" | tr -d '\r\n')"
want="$(echo -n "${B412_ORDER_ID}" | tr '[:upper:]' '[:lower:]')"
got="$(echo -n "$rid" | tr '[:upper:]' '[:lower:]')"
if [[ -z "$got" ]] || [[ "$got" != "$want" ]]; then
  echo "b412-order-to-revenue-discoverability-smoke.sh: .order.id mismatch (expected ${B412_ORDER_ID}, got ${rid})" >&2
  exit 3
fi

echo "b412-order-to-revenue-discoverability-smoke.sh: order anchor ok:" \
  "$(jq -c '{order_id:.order.id, chain_id:(.order.chain_id // null), status:.order.status}' "$ord")"

exec bash "${SCRIPT_DIR}/b402-min-revenue-e2e-reconcile-smoke.sh"
