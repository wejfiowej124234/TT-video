/**
 * **元数据与健康**（**`GET /api/v1/meta`**、**`GET …/meta/build`** 等；**`crates/api/src/routes/health_meta`**；**04** §7.10 等）。
 *
 * **只读**、一般**无需登录**；**不**走 **`chain_off_unavailable`** 式业务门禁（与 **`/orders` 写路径**不同）。响应形状与机读键序见本目录子模块及后端 **`handlers.rs`**。
 *
 * 实现拆分为同目录子模块（**`types` / `topKeys*` / `chainRuleClauses` / `readersAndFetch`**）；本文件为 **barrel**。
 */

export * from "./types";
export * from "./topKeysRoot";
export * from "./topKeysChainAndDomains";
export * from "./chainRuleClauses";
export * from "./readersAndFetch";
