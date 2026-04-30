# GO_95 — §11.1「订单争议 HTTP 入口 / disputes 族路由」旁证

**登记日**：2026-04-22  
**对拍对象**：**`crates/api/src/routes/disputes.rs`** **`disputes::router()`** 与 **04** **§3.4** **`POST|GET /api/v1/orders/:id/dispute*`**、**`GET|POST /api/v1/disputes*`** 表行；**F-025** 主表仍 **`PARTIAL`**（**不**在本文闭 **§8.2 行完成** / **93 B** 全量）。

## 1. 挂载路径（`router()`）

| 方法 | 路径 | 处理函数 |
|------|------|----------|
| POST | `/api/v1/orders/:id/dispute` | `order_open_dispute` |
| GET | `/api/v1/disputes` | `get_disputes` |
| GET | `/api/v1/disputes/:id` | `get_dispute_by_id` |
| POST | `/api/v1/disputes/:id/resolve` | `dispute_resolve` |

**`api_router()`**：**`crates/api/src/routes/mod.rs`** **`.merge(disputes::router())`**（序见 **`merge` 列表**；与 **48 §2.2** **`routes/disputes`** 叙述互指）。

## 2. 机读命令

| 步骤 | 命令 / 结果（本登记日） |
|------|-------------------------|
| 争议路由单测 | `cargo test -p traveltrust-api 'routes::disputes::' -- --test-threads=1` → **5 passed**（**503 list/detail**、**`b099` 非法 cursor**、**`b118` PG 体与 envelope 契约**） |
| 路由门禁 | `bash scripts/run-check-04-routes.sh` → **exit 0** |

**诚实边界**：**5 passed** 以 **`GET /disputes`**、**`GET /disputes/:id`** 的 **503 / 400 / 契约体** 为主；**`POST /api/v1/orders/:id/dispute`** 经 **`order_open_dispute` → `chain_off::order_open_dispute_impl`**，**不**在 **`routes::disputes::tests`** 内以单独 **`oneshot` 全路径** 闭证（与 **95** **§8.2** **F-025** 脚注 **API·IT `[ ]`** 同源）。**本 §11.1 卫星 `[x]`** **不**将 **F-025** 升格为 **行完成**。

## 3. 前端 / `api.ts`

- **`routes.orderDispute(id)`** = **`/api/v1/orders/${id}/dispute`**（**`frontend/lib/api.ts`**），与上表 **POST** 行同源。  
- 列表/详情/裁决/意图等见 **§7.1 域 I** **`evidence/GO_95_20260421_section7_1_domain_i/README.md`**；**不**由本包替代。

## 4. 与 F-025 / §8.2 关系

- **F-025** 机读母链已登记 **`routes::disputes::tests` 5**（**`…section8_2_f021_f025/README.md`** 等）。  
- **§11.1 本行** 仅补 **「订单侧 `POST …/dispute` 为独立挂载面」** 的卫星勾号，**不**重复计 **M/C/T/K**。
