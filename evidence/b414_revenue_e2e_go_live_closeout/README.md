# B-414 · Revenue Go-Live 联调收口证据

**母表**：[B-414](../../docs/任务母表.md) · **TT**：[TT-B414-REVENUE-E2E-GO-LIVE-CLOSEOUT-001.md](../../docs/runbook/TT-B414-REVENUE-E2E-GO-LIVE-CLOSEOUT-001.md)

## 目录约定

- **`run_<UTC>/`** — 单次执行产出（**勿**手改；可追加 `SHA256SUMS.txt`）
  - **`b414-closeout-record.json`** — **`verdict`**、**`order`**、**`revenue_bundle.rollup_marker`**、**`b413_drift_acceptable_hint`**
  - **`indexer_reconcile_200.json`**、**`admin_observability_overview_200.json`**
  - **`order_anchor.json`**（或 **`admin_order_response.json`**，当次带订单锚时）

## 一键

```bash
bash scripts/ops/b414-revenue-e2e-go-live-closeout.sh
```

**环境**：见 Runbook **§2**；**须** **`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。
