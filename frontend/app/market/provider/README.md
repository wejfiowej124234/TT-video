# `/market/provider` — 商家橱窗 · 代码 SSOT

**阶段：① 本地 · 筛选数据链 + Studio 门闸 已闭（2026-06-03）**

**四页总 SSOT：** [`LANDING-MARKET-PAGES-CODE-SSOT.md`](../../evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)  
**入驻前置：** [`/provider/register` README](../../provider/register/README.md)

---

## 路由与组件

**入口：** `app/market/provider/page.tsx` → `MarketStandaloneBusinessPage variant="provider"`

```
MarketStandaloneBusinessPage (provider)
├── MarketAmbientBackdrop
├── MarketHeroFrame(subsite) + h1 + MarketHeroTrustPills
├── MarketHubSubNav
├── intro · CTA → /provider/register · 打开 Merchant Studio
├── MarketSubsiteFilterBar（country · category · sort → URL）
├── MarketSubsiteMasonry（catalog | demo badge）
├── MarketSubsiteListingDetailDrawer（?listing=）
├── MerchantShowcaseStudioModal（dynamic）
└── MarketPageFooter
```

| 逻辑 | 文件 |
|------|------|
| 页 Hook | `useMarketStandaloneBusinessPage.ts` |
| 列表/筛选 | `marketStandaloneBusinessPageUtils.ts` · `lib/marketSubsiteFilters.ts` |
| PG 适配 | `marketCatalogAdapter.ts` |
| Studio | `useMerchantShowcaseStudioModal.ts` · `MerchantShowcaseStudioModal.tsx` |
| FE 门闸 | `lib/provider/merchantPublishEligibility.ts` |

**机读：** `data-testid="market-provider-page"` · `data-tt-market-provider-page="1"`

---

## 设计（Dark Premium 子站）

- **氛围：** 与 `/market` 同源 `MarketAmbientBackdrop`（**非** `/` Ken Burns）
- **Hero：** `MarketHeroFrame variant="subsite"` · `TT_MARKETING_MARKET_PAGE_H1_COMPACT`
- **面板/CTA：** `TT_MARKETING_MARKET_DARK_PATH.subsiteHighlightPanel` · `subsiteGhostCta` · `TT_MARKETING_BTN_MARKET_PRIMARY`
- **UI 冻结：** **非** MARKET-L5 layout lock；Hub 壳/token 与主站一致，**禁止** 无审批回流主站 L5 结构

---

## 列表 / 筛选（①）

| 项 | 实现 |
|----|------|
| API | `GET /api/v1/market/provider/listings?country=&category=&sort=` |
| PG | `meta.source === "postgres_catalog"` |
| Demo 降级 | API 失败 + demo gate → masonry demo + i18n degraded 条 |
| URL | `lib/marketSubsiteFilters.ts` — 与 API query 对拍（`market_subsite_list_query.rs`） |
| 详情 | `?listing=` → drawer；深链 `showcase/[id]` |

---

## 发布 listing 前置（API · 三门闸）

`POST …/market/provider/listings` 与 **`…/listings/drafts`** 须：

1. **PG** `users.role = provider`
2. **PG** `onboarding_entitlements.status = paid`（`role_target=provider`）
3. **approved** 商家申请

**实现：** `crates/api/src/routes/market_merchant_gate.rs` · 规格 [94 §1.3](../../../../docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md)

**FE：** `merchantPublishEligibility.ts` + **ActionGateChecklist** + CTA **`/provider/register`** · **`/me/onboarding?role=provider`**

**错误码：** **403** `merchant_role_required` · `provider_application_not_approved`；**400** `onboarding_entitlement_required`

---

## 三阶进度

| 阶 | SSOT |
|----|------|
| **①** | country/category/sort + catalog 统一 filter + Studio FE 三门闸 — **2026-06-03 已闭** |
| **②** | **MKT-FILT-P2-002** · **P2-004～012** — [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](../../evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) |
| **③** | **MKT-FILT-P3-001～005** — 生产分页 · CDN · go-live 等 |

---

## 验收（①）

```bash
bash scripts/dev/smoke-provider-onboarding-local.sh
cd frontend && npx vitest run lib/marketSubsiteFilters.test.ts \
  components/market/marketStandaloneBusinessPageUtils.test.ts \
  lib/provider/merchantPublishEligibility.test.ts components/market/MerchantShowcaseStudioModal.test.ts
cargo test -p traveltrust-api market_subsite_list_query
```
