#!/usr/bin/env bash
# B-419 · SSOT 三角 CI：**`07`** **三线** **+** **`check-governance-doc-linkage`** **+** **`run-check-04-routes`** **（** **单一** **入口** **）** **。**
#
# 用法（仓库根）：**`bash scripts/check-ssot-triangle-gate.sh`**
#
# 互证：**[`docs/runbook/TT-B419-GO-SSOT-PR-TRIANGLE-CI-001.md`](../docs/runbook/TT-B419-GO-SSOT-PR-TRIANGLE-CI-001.md)**、**[`scripts/README.md`](./README.md)**。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== check-ssot-triangle-gate: 07 version triple ===" >&2
bash scripts/check-07-version-triple.sh

echo "=== check-ssot-triangle-gate: governance doc linkage ===" >&2
bash scripts/check-governance-doc-linkage.sh

echo "=== check-ssot-triangle-gate: 04 routes (subset) ===" >&2
bash scripts/run-check-04-routes.sh

echo "check-ssot-triangle-gate: ok" >&2
