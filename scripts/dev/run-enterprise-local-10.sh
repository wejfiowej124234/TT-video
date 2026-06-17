#!/usr/bin/env bash
# ① 本地 · 创新行程走廊「10 分」机读闸（L5 绿集 + API 全链 + 关键 cargo + 五主防回归 + 可选 Playwright）
#
# 用法（仓库根）：
#   bash scripts/dev/run-enterprise-local-10.sh
#   SKIP_E2E=1 bash scripts/dev/run-enterprise-local-10.sh   # 无浏览器（API + vitest + cargo）
#
# SSOT：frontend/evidence/GO_local_enterprise_10/README.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "== enterprise local 10 (① · web3 itinerary corridor) =="

bash "$ROOT/scripts/dev/run-web3-itinerary-l5-green.sh"
bash "$ROOT/scripts/dev/smoke-web3-itinerary-full-chain-local.sh"

echo "== cargo · itinerary security + budget alignment =="
for t in \
  generate_itinerary_mock_total_budget_matches_line_sum \
  itinerary_bundle_requires_final_plan_confirm_skips_order_create_placeholder \
  patch_order_itinerary_on_accepted_returns_not_editable \
  mock_pay_requires_confirm_for_experience_itinerary; do
  cargo test -p traveltrust-api "$t" -- --nocapture
done

bash "$ROOT/scripts/gates/five-main-routes-ui-antiregression-gate.sh"

cd "$ROOT/frontend"
npx vitest run lib/enterpriseLocal10Gate.contract.test.ts lib/web3ItineraryFullChainGate.contract.test.ts

if [[ "${SKIP_E2E:-}" != "1" ]]; then
  echo "== Playwright · web3-itinerary-corridor-10 (full-stack) =="
  npm run e2e:web3-itinerary-10
else
  echo "SKIP_E2E=1 → skipped Playwright corridor (vitest + API smokes only)"
fi

echo ""
echo "TT_ENTERPRISE_LOCAL_10: OK (① local · web3 corridor · not ②③ staging/production GO)"
echo "  SSOT: frontend/evidence/GO_local_enterprise_10/README.md"
