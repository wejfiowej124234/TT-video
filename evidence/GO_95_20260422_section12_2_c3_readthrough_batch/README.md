# GO_95 · §12.2 · C-3 读通批次（非主行闭证 · v1.4.158）

**日期**：2026-04-22  
**范围（有界）**：`crates/api/src/router.rs` **`pub fn app`**；`crates/api/src/middleware/mod.rs` 篇首（模块表、`pub use`、幂等常量/`idempotency_key_layer` 文档首段）；**[48-后端模块化拆分与落地清单](../../docs/spec/48-后端模块化拆分与落地清单.md)** **§4.3**「Layer 顺序」表行；**[95-全链路生产就绪检查清单与完成度矩阵](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§12.3.1** 入站链 SSOT 段。

## 1 机读

- **`find crates/api/src/middleware -name '*.rs' | wc -l`** → **6**（`mod.rs`、`rate_limit.rs`、`trace.rs`、`timeout_cors.rs`、`auth_pause_metrics/mod.rs`、`auth_pause_metrics/tests.rs`）。
- **`router.rs`** 自 **`api_router().with_state`** 起向外叠 **11** 个 **`axum::middleware::from_fn(...)`**（另 **`TimeoutLayer`**、**`RequestBodyLimitLayer`**、**`cors`**），与 **95 §12.3.1** 自 **`internal_api_secret_gate_layer`** 起至 **`metrics_request_count_layer`** 的叙述一致（**自外而内** = 请求先经 **`metrics`**，最后经 **`internal`** 再进 **`api_router()`**）。

## 2 对拍结论（链名序）

**95 §12.3.1** / **48 §4.3** 所列 **`metrics` → … → `internal` → `api_router()`** 与 **`router.rs`** 中 **`.layer` 注册顺序（自下而上 = 自内而外包裹）**一致；**`middleware/mod.rs`** 的 **`pub use`** 与 **`router.rs`** `use crate::middleware::{…}` 中的层函数名一一对应。

## 3 诚实边界

- **未**通读 **`rate_limit.rs`** / **`auth_pause_metrics/mod.rs`** 全文阈值与分支；**未**重跑 **`cargo test -p traveltrust-api middleware::`** 子集（旁证仍见 **95 §7.3**/**§0.2** 历史 **`auth_placeholder_strict_gate`** / **`middleware::rate_limit::tests`** 等）。
- **不**将 **§12.2 · C-3** 主表 **`[ ]]`** 改为 **`[x]`**（须限流、**pause**、**internal** gate 等**行为与阈值**逐条审计）。

## 4 门禁

- `bash scripts/check-07-version-triple.sh` → **exit 0**
- `bash scripts/run-check-04-routes.sh` → **exit 0**

