# TT-B472 · 旅行者主旅程 P0 · 总封口证据包（汇总 Runbook）

**母表**：[`docs/任务母表.md`](../任务母表.md) **B-472**  
**AI 任务卡**：**`TT-B472-TOURIST-P0-JOURNEY-CLOSEOUT-BUNDLE-001`**  
**证据包根**：[`evidence/b472_tourist_p0_journey_closeout/`](../../evidence/b472_tourist_p0_journey_closeout/)  
**统一 PASS/FAIL 总表**：[`evidence/b472_tourist_p0_journey_closeout/pass_fail.md`](../../evidence/b472_tourist_p0_journey_closeout/pass_fail.md)

---

## 0 · 定位

- **对象**：旅行者 **P0** 主路径 — **发现 → 建单 → 接单 → 支付/托管 → 完成 → 评价 → 双边可见**，以及 **账号前置** 与 **产品/DID 叙事**（B-463）。
- **性质**：**汇总卡** — **不** **新增** **替代** **子卡** **E2E** **；** **只** **编排** **证据** **与** **总判**。
- **总判（2026-04-17）**：**FULL PASS** — **B-460** **/** **TT-U03** **已由** **[`TT-B473`](./TT-B473-SEAL-B460-TT-U03-001.md)** **`b473-seal-b460-tt-u03.sh`** **封口** **；** **见** **[`pass_fail.md`](../../evidence/b472_tourist_p0_journey_closeout/pass_fail.md)** **总判** **行** **。**

---

## 1 · 证据清单（机读索引）

**[`evidence/b472_tourist_p0_journey_closeout/evidence_manifest.md`](../../evidence/b472_tourist_p0_journey_closeout/evidence_manifest.md)**

---

## 2 · 旅程映射（母表 → 阶段）

| 阶段 | 母表（摘要） |
|------|----------------|
| 账号前置 | **B-458** |
| 发现（市场 / 多入口预约） | **B-468**、**B-469**、**B-470/B-471** |
| 建单 | **B-459**；全 UI 参考 **B-467** |
| 接单 · 支付/托管 · 完成 · 评价（机读门槛） | **B-460**（TT-U03）**/** **[`TT-B473`](./TT-B473-SEAL-B460-TT-U03-001.md)** **单一** **封口** |
| 双边评价可见（UI） | **B-465** |
| 产品与 DID 叙事（非代码下单链） | **B-463** |

---

## 3 · B-470 / B-471（无独立 `evidence/b470_*` 目录时）

### 3.1 B-470（数据链）

- **结论**：`/market` 与 `/guides/[id]` 经 **`BookGuideModal`** → **`ordersNewHrefForGuide`** → **`/orders/new?guide_id=`** → **`POST /api/v1/orders`** **提交体** **与** **入口** **无关** **（** **PASS** **）** **。**
- **列表读面**：**`/market`** 订单栏 **`useMarketPage` → `getDiscoverOrders`**（**300ms debounce** · **`/discover` 重定向壳**）— **[LANDING-MARKET-PAGES-CODE-SSOT §3](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)**。
- **弹层 `guideName`**：在 **B-471** **前** **曾** **存在** **展示** **分叉** **；** **B-471** **后** **已** **统一** **（** **PASS** **）** **。**

### 3.2 B-471（展示真值）

- **实现**：[`frontend/lib/guideDisplayName.ts`](../../frontend/lib/guideDisplayName.ts) **`formatGuideDisplayName`**
- **复用**：[`GuideCard`](../../frontend/components/market/GuideCard.tsx)、[`MarketContent`](../../frontend/components/market/MarketContent.tsx)、[`app/market/page.tsx`](../../frontend/app/market/page.tsx)、[`app/guides/[id]/page.tsx`](../../frontend/app/guides/[id]/page.tsx)、[`GuideDetailDrawer`](../../frontend/components/market/GuideDetailDrawer.tsx)

---

## 4 · 封口验收（本汇总卡）

| # | 检查项 | 要求 |
|---|--------|------|
| 1 | **总表** | [`pass_fail.md`](../../evidence/b472_tourist_p0_journey_closeout/pass_fail.md) **含** **总判** **与** **分卡** **指针** |
| 2 | **清单** | [`evidence_manifest.md`](../../evidence/b472_tourist_p0_journey_closeout/evidence_manifest.md) **与子目录** **一致** |
| 3 | **诚实性** | **FULL PASS** **须** **母表** **B-460** **已** **封口** **（** **现** **已** **满足** **）** **。**

---

## 5 · 维护

1. **回归** **旅行者** **P0** **链** **时** **优先** **跑** **`bash scripts/ops/b473-seal-b460-tt-u03.sh`** **确认** **TT-U03** **段** **未** **回退** **。**
2. **主索引** **与** **母表** **状态** **以** **[`docs/AI任务卡索引.md`](../AI任务卡索引.md)** **/** **[`任务母表.md`](../任务母表.md)** **为准** **。**

---

## 6 · 复现

子卡复现命令 **以** **各** **`evidence/b*-*/pass_fail.md`** **为准** **。** **本包** **不** **替代** **子** **Runbook** **（** **TT-U01～U03** **）** **。**
