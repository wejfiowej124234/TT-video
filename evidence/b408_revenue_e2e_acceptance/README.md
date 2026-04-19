# B-408 · Revenue E2E 目标环境验收（封口落盘目录）

**脚本**：[scripts/ops/b408-revenue-e2e-acceptance-closeout.sh](../../scripts/ops/b408-revenue-e2e-acceptance-closeout.sh)（**或** **带** **`B408_RECORD_DIR`** **调用** **[`b407-revenue-e2e-real-chain-runner.sh`](../../scripts/ops/b407-revenue-e2e-real-chain-runner.sh)** **）**

**规格**：[docs/runbook/TT-B408-REVENUE-E2E-ACCEPTANCE-CLOSEOUT-001.md](../../docs/runbook/TT-B408-REVENUE-E2E-ACCEPTANCE-CLOSEOUT-001.md) · **Runbook** **[§5.1](../../ops/RUNBOOK.md)**

**建议**：**每** **批次** **建** **子目录** **（** **例** **：** **`b408_20260415_staging/`** **）** **再** **设** **`B408_RECORD_DIR`** **，** **避免** **覆盖** **默认** **本** **目录** **内** **文件** **。**

**成功** **后** **典型** **文件** **：** **`b407-chain-tx.json`** **、** **`b404-run-status.json`** **、** **`b408-acceptance-record.json`** **。**



**试跑** **/** **未闭合** **留痕** **：** [`b408_20260415_engineering_attempt/STATUS.md`](b408_20260415_engineering_attempt/STATUS.md) **（** **2026-04-15** **）** **。**
