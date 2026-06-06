# `/market` 自由市场 · Phase ① L5 收口声明（2026-05-30）

**阶段：① 本地** — 旅行预约主入口 **`/market`**（**不含** `/market/provider` · `/market/acquisition` Hub）**产品 UI + 筛选数据链 + 机读** 一并收口；**不**表示 ② 测试网 / ③ 生产撮合或 Escrow GO。

**代码真源：** `frontend/app/market/page.tsx` · `frontend/components/market/*` · `lib/marketGuideFilterQuery.ts`

**四页总 SSOT：** [`LANDING-MARKET-PAGES-CODE-SSOT.md`](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · **子站** [`provider/README`](../../app/market/provider/README.md) · [`acquisition/README`](../../app/market/acquisition/README.md)

---

## 收口结论（ACTIVE · FROZEN）

| 维度 | 状态 | 真源 |
|------|------|------|
| **五主路由 UI 壳** | **已冻结** | [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · `/market` 行 |
| **解冻期记录** | **CLOSED** | [`MARKET-UI-THAW.md`](./MARKET-UI-THAW.md) |
| **筛选带 + 排序条** | **已冻结** | [`MARKET-FILTER-SORT-UI-FREEZE.md`](./MARKET-FILTER-SORT-UI-FREEZE.md) |
| **工程 README** | **已对齐** | [`app/market/README.md`](../../app/market/README.md) |
| **Facet 数据链（①）** | **已闭** | `registry/market-guide-facet.v1.json` · `marketGuideFilterQuery.ts` · `chain_off/market_guide_filter.rs` · guides 分页 `limit/cursor/country_code` · **300ms debounce** |
| **角色分流 UX** | **已文档化** | 游客左栏「我的订单」→ 右栏选向导；向导左栏「抢订单」→ accept（nil `guide_id` 认领链 → ② 前另项） |

**维护期纪律（写死）：** 仅 **bugfix** · **数据链路** · **i18n（同语义）** · **a11y/错误态** · **门闸**；**禁止** Hero/双栏/筛选带/卡片 **结构·L5 token·layout lock** 回流（须先解冻 THAW + FILTER-FREEZE）。

---

## 机读锚点（与 `page.tsx` 一致）

```text
data-tt-market-l5="1"
data-tt-market-ui-thaw="closed"
data-tt-market-filter-sort-frozen="1"
data-tt-market-filter-band="frozen"   # MarketMainFilterBand
```

---

## ① 验收命令（收口日 · exit 0）

```bash
cd frontend
npx vitest run \
  lib/marketUiL5Thaw.contract.test.ts \
  lib/marketPageQuery.test.ts \
  lib/marketTravelFilterSummary.test.ts \
  lib/marketGuideFilterQuery.test.ts \
  lib/marketGuideFacetRegistry.parity.test.ts \
  components/market/marketTheme.contract.test.ts \
  components/market/useMarketPage.contract.test.ts \
  components/market/marketModalsG4.contract.test.ts \
  components/shell/marketDarkRouteScene.contract.test.ts
```

**收口日记录：** 102 tests passed（vitest 9 files · 2026-05-30）。

**五主路由并集闸（可选 · 含 home/community 等）：** 仓库根 `bash scripts/gates/five-main-routes-ui-antiregression-gate.sh` — 与 `/market` 收口**非同键**；market 变更以本节 vitest 为准。

**本地数据烟测（可选）：** API + `TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=1` → `/market` 筛选「中国 + 英语 + 向导服务」≥1 向导。

---

## 数据面（① · 与 UI 冻结并行允许维护）

| 源 | 用途 |
|----|------|
| `GET /api/v1/discover/orders` | 左栏可抢/本单合并；`limit/cursor` |
| `GET /api/v1/guides` | 右栏向导；`country_code` · 分页 |
| `PATCH /orders/:id/guide` | 游客绑定 Escrow 已发布单 |
| `POST /orders/:id/accept` | 向导接单（须已指派 `guide_id`） |

**默认不注入：** `marketDevVarietyOrders`（`NEXT_PUBLIC_MARKET_DEV_VARIETY=1` 才开）· mock detail（`NEXT_PUBLIC_MARKET_MOCK_DETAIL=1`）。

---

## ②③ 显式非本收口

- staging 全矩阵 GO · 真 Escrow 深链 · 主网 · 向导 nil-guide 一步抢单认领 API
- 见 **FIVE-MAIN** `/market` 行 **②③** 与 **TT-PH1** 数据面项

---

## 互指

| 读者 | 文档 |
|------|------|
| 改 UI 前 | **MARKET-UI-THAW** → **MARKET-FILTER-SORT-UI-FREEZE** → 本文 |
| 改筛选数据 | **MARKET-FILTER-SORT-UI-FREEZE** §Facet SSOT · `marketGuideFilterQuery.test.ts` |
| 五主路由总闸 | **FIVE-MAIN-ROUTES-PHASE1-FREEZE** |
| 规格 | **29 撮合控制台** · **88 §一** |
