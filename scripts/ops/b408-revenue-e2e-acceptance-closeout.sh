#!/usr/bin/env bash
# **B-408**：**目标环境** **可重复验收** **封口** **—** **在** **`B407`** **真实链** **runner** **上** **打开** **落盘** **（** **tx** **hash** **/** **`run_id`** **/** **B-404** **JSON** **/** **`b408-acceptance-record.json`** **）** **。**
#
# **用法** **：** **与** **`b407-revenue-e2e-real-chain-runner.sh`** **相同** **env** **，** **额外** **设** **`B408_RECORD_DIR`** **（** **默认** **：** **仓库** **`evidence/b408_revenue_e2e_acceptance`** **）** **后** **执行** **本** **脚本** **。**
#
# **成功** **产物** **（** **`$B408_RECORD_DIR`** **）** **：** **`b407-chain-tx.json`** **、** **`b404-run-status.json`** **、** **`b408-acceptance-record.json`** **等** **—** **见** **[TT-B408](../../docs/runbook/TT-B408-REVENUE-E2E-ACCEPTANCE-CLOSEOUT-001.md)** **与** **`ops/RUNBOOK.md`** **§5.1** **。**

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

export B408_RECORD_DIR="${B408_RECORD_DIR:-${ROOT}/evidence/b408_revenue_e2e_acceptance}"

exec bash "${ROOT}/scripts/ops/b407-revenue-e2e-real-chain-runner.sh"
