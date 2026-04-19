#!/usr/bin/env bash
# B-422 · 数据 reconcile / 投影 / 治理尾：**`indexer-reconcile-probe`** **→** **（** **可选** **）** **`b402-min-revenue-e2e-reconcile-smoke`** **→** **`governance-governor-proposal-count-ssot-ops-check`** **。**
#
# 环境：**`INTERNAL_API_SECRET`** **（** **probe** **）** **、** **`ADMIN_BEARER_TOKEN`** **（** **b402** **/** **governance** **）** **、** **`jq`** **。** **`B422_SKIP_REVENUE_E2E_SMOKE=1`** **跳过** **b402** **。**
#
# 用法（仓库根）：**`bash scripts/check-data-reconcile-projection-gov-gate.sh`**
#
# 互证：**[`docs/runbook/TT-B422-GO-DATA-RECONCILE-PROJECTION-GOV-001.md`](../docs/runbook/TT-B422-GO-DATA-RECONCILE-PROJECTION-GOV-001.md)**、**[`scripts/README.md`](./README.md)**。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== check-data-reconcile-projection-gov-gate: indexer-reconcile-probe ===" >&2
bash scripts/ops/indexer-reconcile-probe.sh

if [[ "${B422_SKIP_REVENUE_E2E_SMOKE:-}" == "1" ]]; then
  echo "check-data-reconcile-projection-gov-gate: skip b402 (B422_SKIP_REVENUE_E2E_SMOKE=1)" >&2
else
  echo "=== check-data-reconcile-projection-gov-gate: b402-min-revenue-e2e-reconcile-smoke ===" >&2
  bash scripts/ops/b402-min-revenue-e2e-reconcile-smoke.sh
fi

echo "=== check-data-reconcile-projection-gov-gate: SEQ10 governor proposal count ops check ===" >&2
bash scripts/ops/governance-governor-proposal-count-ssot-ops-check.sh

echo "check-data-reconcile-projection-gov-gate: ok" >&2
