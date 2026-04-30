# GO_95 — §11.1「Internal indexer」路径旁证

**登记日**：2026-04-22  
**对拍对象**：**`crates/api/src/routes/internal/mod.rs`** **`internal::router()`** 内 **索引器族** 与 **04** **§3.4 `internal` 长段**、**[110](../../docs/spec/110-阶段开发链上索引器与事件同步器.md)**、**F-029**（**§3** 行仍 **`PARTIAL`**；**不**在本文闭 **§8.2 行完成**）。

## 1. 挂载路径（与 §11.1 原文略扩）

| HTTP | 路径 |
|------|------|
| POST | `/api/v1/internal/indexer-tick` |
| POST | `/api/v1/internal/indexer-replay` |
| POST | `/api/v1/internal/indexer-reorg-rewind` |
| POST | `/api/v1/internal/indexer-reconcile` |
| GET  | `/api/v1/internal/indexer-status` |

**§11.1** 表内 **`tick|replay|status`** 为**口语缩写**；实现另含 **`reorg-rewind`**、**`reconcile`**，与 **04/110** 一致。

**`api_router()`**：**`crates/api/src/routes/mod.rs`** **`.merge(internal::router())`**（**`merge` 21** 中 **internal** 域；与 **investor_distribution** 子路由等合并，见 **`internal::router()`** 首行）。

## 2. 机读命令

| 步骤 | 命令 / 结果（本登记日） |
|------|-------------------------|
| 索引器子集单测 | `cargo test -p traveltrust-api 'routes::internal::tests::suite_early::indexer_'` → **19 passed**（**`--test-threads=1`**；覆盖 **tick/replay/reorg-rewind/status** 负例与部分 PG 集成路径） |
| 路由门禁 | `bash scripts/run-check-04-routes.sh` → **exit 0** |

## 3. 边界

- **不**替 **主网 indexer** 真链长跑、**Runbook** 全链 **copy-paste** 绿、或 **F-029** **READY** 升格。  
- **internal** 路径**不**在 **`frontend/lib/api.ts`** 公共 **`routes.*`** 扇面（内网/运维 **curl**/脚本），与 **04**「**内部 API**」叙述一致即视为本行 **`[x]`**。
