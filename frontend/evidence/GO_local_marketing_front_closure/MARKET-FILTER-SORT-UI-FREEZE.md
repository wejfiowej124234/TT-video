# `/market` 筛选带 + 排序条 · UI 布局冻结（2026-05-30）

**阶段：① 本地** — 与 [`MARKET-L5-CLOSURE.md`](./MARKET-L5-CLOSURE.md)（**ACTIVE**）、[`MARKET-UI-THAW.md`](./MARKET-UI-THAW.md)（**CLOSED**）、[`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) 五主路由 `/market` 行同源。

## 状态

| 项 | 值 |
|---|---|
| **范围** | `/market` 主站：**Hero 下 → 双栏列表上** 的筛选带、摘要条、视图切换 + 排序条 |
| **机读锚点** | `data-tt-market-filter-sort-frozen="1"`（`app/market/page.tsx`） |
| **组件 SSOT** | `MarketMainFilterBand` · `StickyFilterBar` · `MarketTravelFilterSummaryStrip` · `MarketContentViewSortBar` |
| **URL SSOT** | `lib/marketPageQuery.ts`（`sort` · `filters=open` · 既有 `country/city/language/service/days/view`） |
| **Facet 数据链 SSOT** | `registry/market-guide-facet.v1.json` · `lib/marketGuideFilterQuery.ts` · `chain_off/market_guide_filter.rs`（筛选读取 + `POST /guides` 写入 canonical） |

## 冻结布局（禁止回流）

1. **筛选 band 顶栏**：左「筛选」标题 + 右「重置」（有筛选项时可点）。
2. **StickyFilterBar**：国家 pill 行（含 **「全部」**）+ **「高级筛选 / 收起筛选」**（`filters=open` 同步 URL）+ 展开区（城市 / 向导语言 / 服务 + hint）。
3. **摘要条**：两行 live region（筛选口径 + 视图/排序/条数）；绑定流下 geo 豁免提示。
4. **列表上栏**：`ViewSwitcher`（双栏/订单/向导）+ **排序 radiogroup**（视图相关价格文案）。
5. **禁止**恢复向导列内嵌 `max-h` 滚动条（整页滚动）。

## 允许变更（与 MARKET-UI-THAW 一致）

- 数据链路 / i18n / a11y / 错误态 / 门闸
- **`marketPageQuery` URL 键** 仅 additive（不删既有 query）
- 契约测试与 smoke 对齐

## 禁止

- 筛选带 / 排序条 **结构、位置、视觉 token** 回流（须先解冻本文件 + MARKET-UI-THAW）
- 用 mock 列表冒充 discover 真数据（见 THAW「真实数据」）

## ① 验收

```bash
cd frontend
npx vitest run lib/marketUiL5Thaw.contract.test.ts lib/marketPageQuery.test.ts lib/marketTravelFilterSummary.test.ts lib/marketGuideFilterQuery.test.ts lib/marketGuideFacetRegistry.parity.test.ts
npx vitest run components/market/marketTheme.contract.test.ts components/market/useMarketPage.contract.test.ts
```
