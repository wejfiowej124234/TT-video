# TT-B450-REVIEW-POST-JSON-SSOT-DOC-OPENAPI-ALIGN-001 · `POST …/reviews` **`weight`/`weight_breakdown`/`weight_breakdown_note`** 对外契约文档 SSOT 回写

**母表**：[B-450](../任务母表.md)

**与相邻卡关系**：[TT-B449-REVIEW-JSON-CONTRACT-VERSION-STABILITY-COMPAT-001](./TT-B449-REVIEW-JSON-CONTRACT-VERSION-STABILITY-COMPAT-001.md)（**B-449**）机读固化 **`b449_*`** **；** **本卡** **将** **同一** **语义** **回写** **[04 §3.4](../spec/04-后端与API.md)** **主表** **、** **§** **Reviews API** **示例** **、** **[14](../spec/14-合约-API-ABI-前后端对齐.md)** **路由表** **与** **`frontend/lib/apiClient/orders.ts`** **类型** **，** **防** **实现** **与** **文档** **漂移** **。**

**OpenAPI**：仓库**无**独立 **`openapi.yaml`** **产物** **（** **见** **B-357** **`openapi_or_api_smoke_touchpoints_preflight.py`** **说明** **）** **；** **本** **TT** **以** **04 §3.4** **+** **本节** **验收** **为** **对外** **HTTP** **JSON** **契约** **SSOT** **。**

---

## §1 · 验收（封口条件）

### §1.1 机读（实现锚，继承 B-449）

```bash
cargo test -p traveltrust-api b449_ -- --nocapture
```

### §1.2 文档 / 类型 / 门禁

```bash
python scripts/gates/check-b450-review-post-ssot-doc-anchors.py
bash scripts/run-check-04-routes.sh
cd frontend && npx tsc --noEmit
```

- **`check-b450-*`** **：** **钉** **[04](../spec/04-后端与API.md)** **/** **[14](../spec/14-合约-API-ABI-前后端对齐.md)** **/** **`orders.ts`** **关键** **锚** **串** **（** **漂移** **即** **失败** **）** **。**
- **`run-check-04-routes`** **：** **沿用** **既有** **04** **↔** **路由** **/** **13-1** **全** **链路** **（** **本** **批** **追加** **`check-b450`** **一步** **）** **。**

### §1.3 人读（SSOT 清单）

| 工件 | 内容 |
|------|------|
| **[04 §3.4 主表 · `POST …/reviews` 行](../spec/04-后端与API.md)** | **首次成功** **`weight_breakdown_note`** **键** **不得** **出现** **；** **幂等** **`weight_breakdown`/`weight_breakdown_note`** **双** **键** **。** |
| **[04 · Reviews API 示例 JSON](../spec/04-后端与API.md)** | **分支** **A/B** **示例** **响应** **`status:"ok"`** **嵌** **`review`** **。** |
| **[14 路由表 · POST reviews](../spec/14-合约-API-ABI-前后端对齐.md)** | **与** **04** **互指** **。** |
| **`frontend/lib/apiClient/orders.ts`** | **`OrderReviewSubmitReview`** **/** **`OrderReviewSubmitOk`** **类型** **。** |

---

## §2 · 非目标

- **不** **新增** **独立** **OpenAPI** **artifact** **（** **除非** **另** **开** **TT** **定义** **导出** **管道** **）** **。**
- **不** **改变** **`b449_*`** **断言** **（** **契约** **变更** **须** **先** **改** **机读** **再** **改** **文档** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
