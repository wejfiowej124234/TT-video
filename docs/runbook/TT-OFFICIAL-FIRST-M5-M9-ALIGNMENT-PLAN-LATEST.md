# Official-First · M5–M9 Alignment Plan（28 项归属）

**STATUS:** `OWNED_PLAN_ISSUED` · **execution** `NOT_STARTED_NO_FIX`  
**Depth residuals commit:** `508a006e8`  
**Machine:** [`M5_M9_ALIGNMENT_PLAN_20260822.json`](../../evidence/GO_official_product_reality_capture/M5_M9_ALIGNMENT_PLAN_20260822.json)  
**Source residuals:** [`M5_M9_DEPTH_RESIDUALS_20260822.json`](../../evidence/GO_official_product_reality_capture/M5_M9_DEPTH_RESIDUALS_20260822.json)  
**Gate:** `PRODUCT_AND_DOCUMENTATION_PARITY` = **FAIL**  
**`TT_PRODUCTION_GO`:** NO_GO  

> 28 项全部 **REGISTER_ONLY** · **owned=true**（计划归属已发）· **禁止边登记边修** · **禁止** CMS/UI/功能优化直至 Parity PASS。  
> Web3 Candidate `b19b85810…` 与 Sepolia ETA **完全隔离**。

---

## Parity PASS 前置（写死）

1. 28 项均有明确 disposition / align_plan（本文件）  
2. Official → Git → Local → Staging **产品面 1:1** 收敛执行完成  
3. DOC_DRIFT 已 retag 或 Owner 接受  
4. DEFECT 已排队到 Parity 后修复轨，或接受为 Official AS-IS  
5. ED / CONFIRM_DESIGN 已显式确认  

**在此之前禁止盖** `PRODUCT_AND_DOCUMENTATION_PARITY_PASS`。

---

## Disposition 汇总

| Disposition | n | 含义 |
|-------------|---|------|
| DEEPEN_CAPTURE_THEN_REBASE_PLAN | 9 | 先补 Official Capture，再订 rebase |
| KEEP_OFFICIAL_OR_DESIGN | 7 | 保持官网/冻结设计 |
| CONFIRM_DESIGN_KEEP_ED | 4 | 预期差异 · 不强制一致 |
| DOC_RETAG_OFFICIAL_FIRST | 4 | 仅文档话术 Official-first |
| REGISTER_DEFECT_ALIGN_AFTER_PARITY_GATE | 3 | 缺陷登记 · **Parity 后**再修 |
| KEEP_OFFICIAL_AS_IS | 1 | 官网 404 等事实 · 勿用 Local 造绿 |

| parity_gate | n |
|-------------|---|
| BLOCKS_UNTIL_OWNED_AND_ALIGNED | 16 |
| NON_BLOCKING_IF_CONFIRM_OR_ED | 12 |

---

## 逐条（Official truth → Git / Local / Staging）

| ID | Class | Official truth | Git | Local | Staging | Disposition | Align plan（不执行修） |
|----|-------|----------------|-----|-------|---------|-------------|------------------------|
| M5-01 | RESIDUAL | Pin bootstrap v8 · `SKIP_ME_FETCH=0` | mother/env docs | `.env.local` 可能偏离 | bake 不得开 dev skip | DEEPEN_CAPTURE_THEN_REBASE_PLAN | Local env 对齐 Official bootstrap；不改 Official image |
| M5-02 | CONFIRM_DESIGN | Official/Staging 禁 DEV flags | 文档可述 | 仅 Local/dev | 禁 `MARKET_DEV_VARIETY` 等 | KEEP_OFFICIAL_OR_DESIGN | 无代码；引用 freeze |
| M5-03 | RESIDUAL | Fly runtime vs pin | — | Config Capture OPEN | secrets/env | DEEPEN_CAPTURE_THEN_REBASE_PLAN | 补 Official runtime 清单再 diff |
| M6-01 | ED | API `8df2ab21…` | N/A live | 可指 staging/local | `1915ec4d…` | CONFIRM_DESIGN_KEEP_ED | 不强制 Staging API=Official |
| M6-02 | ED | chain_id=1 | N/A | 可 Sepolia/local | 11155111 | CONFIRM_DESIGN_KEEP_ED | plane-map ED |
| M6-03 | CONFIRM_DESIGN | service/api_version SAME | — | — | SAME | KEEP_OFFICIAL_OR_DESIGN | 保持 |
| M6-04 | RESIDUAL | `database_baseline=production_surface` | 157 migrationish 本地 | schema 未对拍 Production | staging DB ≠ prod | DEEPEN_CAPTURE_THEN_REBASE_PLAN | 先 Capture Production schema |
| M6-05 | RESIDUAL | Official API 产品行为 | 代码树 | 本地行为 | staging 行为 | DEEPEN_CAPTURE_THEN_REBASE_PLAN | GP 行为矩阵 vs Official |
| M7-01 | RESIDUAL | Official CMS 展示 AS-IS | matrix/docs | CMS ops 证据 | staging CMS | DEEPEN_CAPTURE_THEN_REBASE_PLAN | Capture CMS 层 |
| M7-02 | RESIDUAL | Official Assets/CDN AS-IS | — | — | — | DEEPEN_CAPTURE_THEN_REBASE_PLAN | Capture Assets 层 |
| M7-03 | DOC_DRIFT | 以 live www Ambient 为准 | matrix 写 unsplash_fallback | 同左 | bake catalog=1 | DOC_RETAG_OFFICIAL_FIRST | 文档 cite 官网实际源；不改官网图 |
| M7-04 | RESIDUAL | Official 运行时媒体源 | placeholder 行 | — | — | DEEPEN_CAPTURE_THEN_REBASE_PLAN | Capture 后再对齐叙述 |
| M7-05 | CONFIRM_DESIGN | OCS vs CMS 分权 | matrix OCS 行 | — | — | KEEP_OFFICIAL_OR_DESIGN | 不并入 CMS 修轨 |
| M7-06 | ED | Official CMS Capture ≠ JP QA | JP CLOSED 证据 | — | — | CONFIRM_DESIGN_KEEP_ED | 禁止等同 |
| M7-07 | DEFECT | community uploads 404 AS-IS | — | — | 可能不同 | REGISTER_DEFECT_ALIGN_AFTER_PARITY_GATE | Parity 后再 Local→Staging→Prod |
| M7-08 | DEFECT | announcements 401/200 AS-IS | — | — | — | REGISTER_DEFECT_ALIGN_AFTER_PARITY_GATE | 同上 |
| M8-01 | RESIDUAL | Auth/Admin/UI/i18n Capture OPEN | freezes ① | Local UI | Staging UI | DEEPEN_CAPTURE_THEN_REBASE_PLAN | 深度 Capture |
| M8-02 | CONFIRM_DESIGN | FIVE-MAIN 结构以官网为准 | ① freeze | 禁结构回流 | 对齐 pin | KEEP_OFFICIAL_OR_DESIGN | 不解冻 |
| M8-03 | CONFIRM_DESIGN | Auth UI freeze ≠ Capture PASS | ① freeze | — | — | KEEP_OFFICIAL_OR_DESIGN | 登记 |
| M8-04 | ED | 历史 405 CLOSED_REALITY | 文档 | — | — | CONFIRM_DESIGN_KEEP_ED | 不重开 Official 修轨 |
| M8-05 | OFFICIAL_ROUTE_AS_IS | 若干路由 404 | 禁造路由 | 禁造绿 | 禁造绿 | KEEP_OFFICIAL_AS_IS | 记为官网事实 |
| M8-06 | CONFIRM_DESIGN | `/admin` 307 | — | — | — | KEEP_OFFICIAL_OR_DESIGN | AS-IS |
| M8-07 | DEFECT | `/me/payments` `/legal/*` GAP | — | — | — | REGISTER_DEFECT_ALIGN_AFTER_PARITY_GATE | Parity 后修 |
| M8-08 | RESIDUAL | i18n Capture OPEN | — | — | — | DEEPEN_CAPTURE_THEN_REBASE_PLAN | zh/en 清单 |
| M9-01 | DOC_DRIFT | 产品文 cite OPS-v9 | 白皮书/runbook | — | — | DOC_RETAG_OFFICIAL_FIRST | 仅文档 |
| M9-02 | DOC_DRIFT | 「以本地为准」= git 交付 | handbook | — | — | DOC_RETAG_OFFICIAL_FIRST | 澄清 ≠ 产品 SSOT |
| M9-03 | DOC_DRIFT | 工程轨缺 Official pin | parallel/cockpit | — | — | DOC_RETAG_OFFICIAL_FIRST | 加 pin cite |
| M9-04 | CONFIRM_DESIGN | Dual Truth Planes ACTIVE | 宪法 | — | — | KEEP_OFFICIAL_OR_DESIGN | 保持双平面 |

---

## 执行序（仍禁止修官网）

```text
① Capture deepen（阻塞 RESIDUAL 面）
② DOC_RETAG（M9 / M7-03）
③ CONFIRM ED / DESIGN（签字确认）
④ DEFECT 入 Parity-后队列（不本波修官网）
⑤ Official→Git→Local→Staging 产品 1:1 执行
⑥ 才可申请 PRODUCT_AND_DOCUMENTATION_PARITY_PASS
```

**P0 interrupt:** Sepolia ETA → Reality · 禁止 Exact-Match / Mainnet / `TT_PRODUCTION_GO` 翻转。
