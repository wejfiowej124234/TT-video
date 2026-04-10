# 资损 Runbook 演练记录（§3 模板）

| 字段 | 内容 |
|------|------|
| **演练编号** | DR-2026Q1-01 |
| **场景** | ② Indexer 落后（含索引不可用 / 对账前置条件探测） |
| **触发阈值（模拟/对照）** | 与 `ops/RUNBOOK.md` §1 ② 一致：落后 block 数 > 100 或延迟 > 60s；本次为**主动探针**，对照 `state.lag_blocks` / `state.lag_max_blocks` 与 `indexer.status`。 |
| **执行人** | plant（本机发起 API 调用与落盘） |
| **批准人** | plant（同会话对响应与文件做复核；**正式发版 Gate 须改为异名双人**，与 §2 值班/批准人表一致） |
| **环境** | 仓库根；`DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`；API `http://127.0.0.1:3012`（本次进程监听端口以启动日志为准，非 8080）。 |
| **结果** | 成功（**非纯文档**：已产生真实 HTTP 响应体并落盘 JSON） |
| **复盘** | 当前环境 **未配置** `CHAIN_RPC_URL` / `ESCROW_FACTORY_ADDRESS`，故 `live_orders_projection_reconcile` 返回 `chain_not_configured`，`POST …/internal/indexer-reconcile` 同步返回 `chain_not_configured`。属**可复核的运行时真值**；预发/生产演练应在补齐链配置后重复本探针并比对 `projection_reconcile_clean` / `issues_total`。下次建议：链配置齐全后再登记 DR-2026Q1-02 或季度 DR。 |

## 非纯模拟证据（可复核）

### 1) `GET /api/v1/internal/indexer-status?live_reconcile=1`

- **命令**：

```bash
curl -sS -m 15 "http://127.0.0.1:3012/api/v1/internal/indexer-status?live_reconcile=1" \
  -o evidence/GO_20260407/artifacts/indexer-status-live-reconcile-20260407.json
```

- **响应文件**：`evidence/GO_20260407/artifacts/indexer-status-live-reconcile-20260407.json`
- **SHA256**：`3895484da795bb89d419d896d26161033acf5c232eb934942c3b028b8375b81b`
- **摘录（根级）**：`status=ok`；`indexer.status=unavailable`；`state.lag_blocks=0`，`state.lag_max_blocks=100`，`reorg_detected=false`；`live_orders_projection_reconcile.ok=false`，`error=chain_not_configured`。

### 2) `POST /api/v1/internal/indexer-reconcile`（`persist:false`，不落库报告）

- **命令**：

```bash
curl -sS -m 20 -X POST "http://127.0.0.1:3012/api/v1/internal/indexer-reconcile" \
  -H "Content-Type: application/json" -d '{"persist":false}' \
  -o evidence/GO_20260407/artifacts/indexer-reconcile-persist-false-20260407.json
```

- **响应文件**：`evidence/GO_20260407/artifacts/indexer-reconcile-persist-false-20260407.json`
- **SHA256**：`da418a807db5a9758f0c73ad3a27fc96626afb621c2e4575133ce6c341859242`
- **正文**：`{"error":"chain_not_configured","message":"chain_not_configured","hint":"CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"}`

## 产物清单（与 §4 互指）

| 文件 | 说明 |
|------|------|
| `runbook-dr-DR-2026Q1-01.md` | 本演练记录（§3 全字段） |
| `indexer-status-live-reconcile-20260407.json` | 探针响应原文 |
| `indexer-reconcile-persist-false-20260407.json` | 对账接口响应原文 |

**日期（UTC 日历日）**：2026-04-07
