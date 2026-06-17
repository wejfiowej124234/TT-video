#!/usr/bin/env bash
# ① 本地 · 全站企业「10 分」编排闸（L5 全链路 + 域烟测 + 走廊 10 · 可选 Chromium 全矩阵 E2E）
#
# 用法（仓库根 · API + DATABASE_URL 已起）：
#   bash scripts/dev/run-enterprise-site-10-local.sh
#   SKIP_E2E=1 bash scripts/dev/run-enterprise-site-10-local.sh
#   ENTERPRISE_SITE_10_FULL_E2E=1 bash scripts/dev/run-enterprise-site-10-local.sh
#
# SSOT：docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/gates/_load_database_url_from_root_env.sh
source "$ROOT/scripts/gates/_load_database_url_from_root_env.sh"
_load_db_gate_name="run-enterprise-site-10-local"
load_database_url_from_root_env "$ROOT" || exit $?

echo "== enterprise site 10 local (① · full-chain · L5 · not ②③) =="

bash "$ROOT/scripts/dev/run-go-local-phase1-acceptance.sh"
bash "$ROOT/scripts/gates/local-phase1-linkage-quality-gates.sh"
bash "$ROOT/scripts/smoke-ab-core-chain.sh"
bash "$ROOT/scripts/dev/smoke-provider-onboarding-local.sh"
bash "$ROOT/scripts/dev/smoke-steward-onboarding-local.sh"
bash "$ROOT/scripts/dev/smoke-acquisition-pd009-local.sh"

if [[ "${SKIP_E2E:-}" == "1" ]]; then
  SKIP_E2E=1 bash "$ROOT/scripts/dev/run-orders-corridor-local.sh"
else
  bash "$ROOT/scripts/dev/run-orders-corridor-local.sh"
fi

if [[ "${SKIP_E2E:-}" == "1" ]]; then
  SKIP_E2E=1 bash "$ROOT/scripts/dev/run-enterprise-local-10.sh"
else
  bash "$ROOT/scripts/dev/run-enterprise-local-10.sh"
fi

if [[ "${ENTERPRISE_SITE_10_FULL_E2E:-}" == "1" ]]; then
  echo "== Playwright chromium full matrix (optional · long run) =="
  bash "$ROOT/scripts/gates/local-e2e-chromium-full-matrix.sh"
else
  echo "ENTERPRISE_SITE_10_FULL_E2E not set → skipped local-e2e-chromium-full-matrix (see ENTERPRISE-SITE-10-L5-MATRIX.md §1.1)"
fi

echo ""
echo "TT_ENTERPRISE_SITE_10_LOCAL: OK (① local · enterprise site L5 · not ② testnet · not ③ production GO)"
echo "  SSOT: docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md"
