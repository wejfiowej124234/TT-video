# GO_95 — §11.1「Intents / Evidence（订单扩展）」旁证

**登记日**：2026-04-22  
**对拍对象**：**`crates/api/src/routes/intents.rs`**、**`crates/api/src/routes/evidence.rs`** 与 **04** **§3.4** 表行；**F-008 / F-009** 主表仍属 **escrow/订单** 域（**不**在本文闭 **§8.2 行完成** / **93 B** 全量）。

## 1. 挂载与 `merge` 序

**`api_router()`**（**`crates/api/src/routes/mod.rs`**）：**`… .merge(disputes::router()).merge(evidence::router()).merge(media::router()).merge(intents::router()) …`**（**`evidence` 与 `intents` 之间** 另有 **`media::router()`**）。

## 2. 路径表

### 2.1 `intents::router()`（**签名 intent → outbox**）

| 方法 | 路径 |
|------|------|
| POST | `/api/v1/orders/:id/confirm-completion-intent` |
| POST | `/api/v1/orders/:id/open-dispute-intent` |
| POST | `/api/v1/disputes/:id/execute-resolution-intent` |

**语义**：**`ACCEPTED`** 入队 **FileOutbox**；链上执行与 **110** / 执行器正交；**`TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS` / `TRAVELTRUST_ACK_INTENT_FILE_OUTBOX`** 见 **`intents.rs`** 文内注释。

### 2.2 `evidence::router()`（**订单证据 list/post**）

| 方法 | 路径 |
|------|------|
| GET, POST | `/api/v1/orders/:id/evidence` |

**无 `chain_off`** 时 **503** **`chain_off_unavailable`**（**`not_impl_json`**），与 **04**、**`routes/evidence.rs`** 头注释一致。

## 3. 机读命令与诚实边界

| 步骤 | 命令 / 结果（本登记日） |
|------|-------------------------|
| **Evidence** 链下实现子集 | **`cargo test -p traveltrust-api 'chain_off::tests_reviews_evidence::' -- --test-threads=1`** → **3 passed**（含 **`p21_evidence_list_post`**，走 **`evidence_list_impl` / `evidence_post_impl`**，与 **HTTP 路由** 同一 **`chain_off`** 入口） |
| 路由契约门禁 | **`bash scripts/run-check-04-routes.sh`** → **exit 0** |

**诚实边界**：

- **`routes::intents`** **无** 独立 `#[test]` 子模块；本包**不**声称 **`Router::oneshot`** 对三条 **POST intent** 全路径已 HTTP 闭证。  
- **Evidence** 以 **`chain_off::tests_reviews_evidence`** 为 **F-008～009 相关** 链下母链旁证，**不**单独替代 **§8.2** 五态 / **行完成** / **E2E**。

## 4. 前端

**`frontend/lib/api.ts`**：`orderOpenDisputeIntent`、`confirmCompletion`/`dispute` intent 类路径与 **04** 表行同源（**`orderOpenDisputeIntent`** 等）；细表以 **04**/**`api.ts`** 为准。
