#!/usr/bin/env bash
# B-423 · 83/84 链↔DB smoke：**`b384`** **→** **`b385`** **（** **可** **分** **腿** **跳过** **）** **。**
#
# 环境：**`INTERNAL_API_SECRET`** **、** **`ADMIN_BEARER_TOKEN`** **、** **`jq`** **（** **与** **各** **子** **smoke** **一致** **）** **。**
#
# 用法（仓库根）：**`bash scripts/check-8384-snapshot-country-smoke-gate.sh`**
#
# 互证：**[`docs/runbook/TT-B423-GO-DATA-8384-SNAPSHOT-COUNTRY-SMOKE-001.md`](../docs/runbook/TT-B423-GO-DATA-8384-SNAPSHOT-COUNTRY-SMOKE-001.md)**。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "${B423_SKIP_REGION_VAULT_SMOKE:-}" == "1" ]]; then
  echo "check-8384-snapshot-country-smoke-gate: skip b384 (B423_SKIP_REGION_VAULT_SMOKE=1)" >&2
else
  echo "=== check-8384-snapshot-country-smoke-gate: b384 ===" >&2
  bash scripts/ops/b384-region-vault-forwarded-log-count-reconcile-admin-overview-smoke.sh
fi

if [[ "${B423_SKIP_COUNTRY_LEDGER_SMOKE:-}" == "1" ]]; then
  echo "check-8384-snapshot-country-smoke-gate: skip b385 (B423_SKIP_COUNTRY_LEDGER_SMOKE=1)" >&2
else
  echo "=== check-8384-snapshot-country-smoke-gate: b385 ===" >&2
  bash scripts/ops/b385-p5-country-ledger-credited-log-count-reconcile-admin-overview-smoke.sh
fi

echo "check-8384-snapshot-country-smoke-gate: ok" >&2
