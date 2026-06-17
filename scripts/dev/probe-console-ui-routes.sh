#!/usr/bin/env bash
# ① Console 主流程 UI 路由 HTTP 探测（不等价目视/Playwright/②③）
# 单人开发：通过即可 commit/push，不建 PR（见 docs/runbook/TT-UI-V2-SOLO-WALKTHROUGH-001.md）
# 用法：bash scripts/dev/probe-console-ui-routes.sh
# 可选：FRONTEND_PORT=3012 API_PORT=8080
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scripts/dev/_dev_stack_ports.sh
source "$REPO_ROOT/scripts/dev/_dev_stack_ports.sh"
FE="${FRONTEND_PORT}"
API="${BACKEND_PORT}"
BASE="http://127.0.0.1:${FE}"

probe() {
  local path="$1"
  local expect="${2:-200}"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 120 "${BASE}${path}" 2>/dev/null || echo "000")"
  if [[ "$code" == "$expect" ]] || [[ "$expect" == "3xx" && "$code" =~ ^30[0-9]$ ]]; then
    printf "OK   %s  HTTP %s\n" "$path" "$code"
  else
    printf "FAIL %s  HTTP %s (expected %s)\n" "$path" "$code" "$expect"
    return 1
  fi
}

echo "=== TravelTrust Console UI route probe (①) ==="
echo "API:  http://127.0.0.1:${API}/health"
api_code="$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 10 "http://127.0.0.1:${API}/health" 2>/dev/null || echo "000")"
if [[ "$api_code" != "200" ]]; then
  echo "WARN API /health HTTP ${api_code} — 前端页可能空数据，请先 start-api-with-seed 或 cargo run"
else
  echo "OK   API /health HTTP 200"
fi
echo "FE:   ${BASE}"
echo ""

fail=0
routes=(
  "/auth/login:200"
  "/auth/register:200"
  "/orders:200"
  "/orders/new:200"
  "/disputes:200"
  "/help:200"
  "/privacy:200"
  "/terms:200"
  "/me/password:200"
  "/me/security:200"
  "/me/onboarding:200"
  "/me/identities:200"
  "/guide/register:200"
  "/itinerary/new:200"
  "/staking:200"
  "/governance:200"
  "/pay:200"
  "/discover:3xx"
)
for entry in "${routes[@]}"; do
  path="${entry%%:*}"
  expect="${entry##*:}"
  probe "$path" "$expect" || fail=1
done

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "probe-console-ui-routes: all PASS (HTTP only; still need visual walkthrough)"
  exit 0
fi
echo "probe-console-ui-routes: FAIL — fix 500/build errors before visual QA"
exit 1
