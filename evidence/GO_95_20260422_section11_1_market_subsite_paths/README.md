# GO_95 — §11.1「Market subsite」路径旁证

**登记日**：2026-04-22  
**对拍对象**：`crates/api/src/routes/market_subsite.rs` **`pub fn router()`** 与 **04** **§3.3 / §3.4**、**[94](../../docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md)**、**95 §3** **F-021 / F-022**（**`PARTIAL` · READY***；母表行 **API·IT / 93 / E2E** 仍 **ISS-007**）。

## 1. 结论（诚实）

- **`api_router()`** 在 **`crates/api/src/routes/mod.rs`** 中 **`.merge(market_subsite::router())`**，与 **07/14/50/59** 所述 **`merge` 21** 含子站域一致。  
- **`router()`** 内 **8** 条 **`/api/v1/market/{provider|acquisition}/listings…`** 路径与 **04** 表行（含 **`routes/market_subsite.rs`** 指名）同形；**`frontend/lib/api.ts`** **`routes.market*`** 前缀一致。  
- **F-020**（**`…/me/market-bookmarks`**）在 **`routes/me.rs`**，**不**由 **`market_subsite`** 实现；本包仅闭合 **F-021 / F-022** 子站 **HTTP 面** 与 **94** 目录契约的「路径挂载」对拍。  
- **不**替代 **§8.2** **行完成**、**93 B** 全量、**staging** 有库 **200** 成功路径人签。

## 2. 机读命令（可复核）

| 步骤 | 命令 / 结果 |
|------|-------------|
| 子站测例 | `cargo test -p traveltrust-api market_subsite::tests` → **10 passed**（**2026-04-22** 本机） |
| 路由门禁 | `bash scripts/run-check-04-routes.sh` → **exit 0**（**2026-04-22** 本机；含 **04 §3.4** 与 **`api.ts`** 对拍） |

## 3. 代码锚点（手检）

- **`router()` 路径表**：`market_subsite.rs` **`pub fn router()`**（**`…/provider/listings`、…`drafts`、…`acquisition/…`**，共 **8** 路由）。  
- **聚合挂载**：`routes/mod.rs` **`api_router()`** **`.merge(market_subsite::router())`**（序在 **`me::router()`** 之后）。  
- **04 表行**：`04-后端与API.md` **GET/POST** **`/api/v1/market/provider/*`**、**`/api/v1/market/acquisition/*`**（**237～246** 与 **§3.3 详表** 互指段）。

## 4. 边界

- 本证据**不**声明 **F-021 / F-022** 已从 **`PARTIAL`** 升为 **`READY`without***（仍以 **95 §3** 主表为准）。  
- **无** **`DATABASE_URL`** 时列表 **503** **`database_required`** 等行为以 **`market_subsite.rs`** 头注释与测例为准，**不**在本文重复逐码摘录。
