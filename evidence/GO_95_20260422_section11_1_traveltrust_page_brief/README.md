# GO_95 — §11.1「TravelTrust 页 API」旁证

**登记日**：2026-04-22  
**对拍对象**：**`GET /api/v1/traveltrust/page-brief`**（**`crates/api/src/routes/traveltrust_page.rs`**）与 **04** **§3.3 / §3.4** **B-191**、**[14](../../docs/spec/14-合约-API-ABI-前后端对齐.md)** **`/traveltrust`** 叙事、**[85](../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md)** **IA/机读锚** 互指。

## 1. 结论

- **`api_router()`** 含 **`.merge(traveltrust_page::router())`**（**`routes/mod.rs`**）。  
- **单一路由**：**`GET /api/v1/traveltrust/page-brief`** → 静态 **JSON**（**`allocation_ssot.protocol_reference_doc_version`** 与 **`governance_doc_reference::DOC_VERSION`** 同源；**`page.canonical_path`****=`/traveltrust`**、**`alias_paths`** 含 **`/network`**；**`cta_contract.p2_target`****=`/market`**）。  
- **前端**：**`frontend/lib/api.ts`** **`routes.traveltrustPageBrief`****=`/api/v1/traveltrust/page-brief`**；**`frontend/lib/api.test.ts`** 机读句 **`routes include traveltrust page-brief (04 B-191)`**。  
- **不**替代 **`/traveltrust` 全页** **85/13-1/86** 人工验收；**不**替 **93** / **staging `curl` 全字段** 录证。

## 2. 机读命令

| 步骤 | 命令 / 结果 |
|------|-------------|
| 契约单测 | `cargo test -p traveltrust-api traveltrust_page::tests` → **1 passed**（**`page_brief_doc_version_matches_protocol_reference`**） |
| 路由门禁 | `bash scripts/run-check-04-routes.sh` → **exit 0**（本登记日复核） |

## 3. 代码锚

- **路由**：`traveltrust_page.rs` **`pub fn router()`**、**`traveltrust_page_brief_json()`**、**`get_traveltrust_page_brief`。**  
- **04 表行**：**`GET /api/v1/traveltrust/page-brief`**（**04** 详表/前端路由表 **B-191** 行）。

## 4. 与 v1.4.90 / F-007 的边界

- **本证据** 仅闭 **§11.1** 卫星行 **「TravelTrust 页 API」**；**不**修改 **F-007** **头像** 或 **ISS-008** 对象存储 narrative。
