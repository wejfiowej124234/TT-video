# 真自由市场 · 三页筛选 Phase ②/③ backlog（2026-06-03）

**范围：** **`/market` 旅行预约** · **`/market/provider` 商家** · **`/market/acquisition` 旅行收购** — **筛选 / 排序 / URL / API** 数据链（**非** UI 排版改版）。

**① 代码/UI 真源：** [`LANDING-MARKET-PAGES-CODE-SSOT.md`](./LANDING-MARKET-PAGES-CODE-SSOT.md)（含 `/` Hero→Market 深链 · 收藏 localStorage）

**阶段：② 测试网** — **宽轨**（与轨 8/9 并列 · **非** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) 窄 onboarding 主清单）

**① 已闭（2026-06-03 · 数据链修补 · UI 未动）：**

| 页 | ① 结论 | 真源 |
|----|--------|------|
| **旅行预约** `/market` | 筛选 **L5 已收口** · **300ms debounce** refetch | [`MARKET-L5-CLOSURE`](../GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md) · `useMarketPage.ts` |
| **商家 / 收购** 子站 | catalog + demo **统一 filter/sort** · API 失败 **degraded 提示** · Provider Studio **FE 门闸** + 入驻 CTA | `marketSubsiteFilters.ts` · `useMarketStandaloneBusinessPage.ts` · `MerchantShowcaseStudioModal` |

**硬边界：** **不改** [FIVE-MAIN](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) **UI 壳**；收购 Hub layout 仍见 [`ME-IDENTITIES-UI-FREEZE`](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)。

---

## 总表

| ID | 清单项 | ① 状态 | ② 任务 | ③ |
|----|--------|--------|--------|---|
| **MKT-FILT-P2-001** | **`/market` 旅行预约** staging 筛选全链（discover/guides · facet registry · URL 深链） | ① L5 + 本地 vitest **已闭** | **② 待验** | — |
| **MKT-FILT-P2-002** | **`/market/provider`** staging PG 目录 + **country/category/sort** URL 与列表/摘要条数一致 | ① 客户端+API query **已闭** | **② 待验** | — |
| **MKT-FILT-P2-003** | **`/market/acquisition`** 同上 + 与 PD-009 listing 字段对拍 | ① 同上 **已闭** | **② 待验** | — |
| **MKT-FILT-P2-004** | **staging E2E** 子站筛选（重置 · 空态 · `localStorage` 国家记忆 · `?listing=` 抽屉） | ① 单元测试 **已闭** | **② 待验** | — |
| **MKT-FILT-P2-005** | **staging API 证据** · `GET …/listings?country=&category=&sort=` 与 **94 §2.3.5** · Rust/TS 对拍 | ① 本地 **已闭** | **② 待验** | — |
| **MKT-FILT-P2-006** | **`cursor` 分页**（catalog **>200** · 94 §2.3.5 Target 扩展） | ① cap=200 全量 **已闭** | **② 待验** | 生产规模 → **③** |
| **MKT-FILT-P2-007** | **R-003 staging GO** 含 **93 B-MKT** 市场/子站筛选矩阵行 | ISS-007 **≠ GO** | **② 待验**（轨 1） | Production GO → **③** |
| **MKT-FILT-P2-008** | **`/market` 主站** staging **discover/guides 客户端 facet/天数/排序** 与 PG 大表对拍 | ① debounce+本地 **已闭** | **② 待验** | — |
| **MKT-FILT-P2-009** | **收藏服务端同步**（`/market` + `/` **`localStorage` 跨 tab** → **`/me`** 或等价 API） | ① **localStorage + 跨 tab 2026-06-03 已闭** | **② 待验** | **③** 跨设备 SLA |
| **MKT-FILT-P2-010** | **商家 Studio 付费 entitlement FE**（`GET /onboarding/entitlements/me` · provider **paid**） | ① FE **已闭** | **② staging 对拍** | — |
| **MKT-FILT-P2-011** | **nil-guide 一步抢单**（`MARKET-L5-CLOSURE` §② · accept 已指派链保留） | ① **未做** | **② 待验** | — |
| **MKT-FILT-P2-012** | **`/market` discover/guides API 服务端筛选**（facet 多选 · `days` · sort 收敛，减客户端大页过滤） | ① 客户端 **已闭** | **② 待验** | — |
| **MKT-FILT-P2-013** | **`/market` 写链 staging**（`bindGuideToOrder` 深链 · `POST accept` · `CustomItineraryModal` · `GET /orders` 本单回填 · 与 WEB3-P2-007 并跑） | ① 本地 smoke **已闭** | **② 待验** | — |
| **MKT-FILT-P2-014** | **`/market` staging 列表性能**（大页 discover/guides · 300ms debounce + 客户端 cache 与 PG 一致 · **非 UI**） | ① runtime **2026-06 已闭** | **② 待验** | 生产 SLA → **P3-006** |
| **MKT-FILT-P3-005** | **生产收藏 / 心愿单** 持久化与 **go-live** 矩阵行 | — | — | **③ 待验** |
| **MKT-FILT-P3-001** | **生产** catalog **cursor** 分页 + 筛选 URL 在公网负载下可用 | — | — | **③ 待验** |
| **MKT-FILT-P3-002** | **搜索框**（94 **二期** · provider/acquisition 发现页） | — | — | **③ 待验** |
| **MKT-FILT-P3-003** | **生产** filter 深链分享 · CDN/目录 SLA · `aria-live` 与 API 条数长期一致 | — | — | **③ 待验** |
| **MKT-FILT-P3-004** | **94 §9.2** · **go-live** 全站 market 子站筛选与 **93** 全矩阵 **③ GO** | — | — | **③ 待验** |
| **MKT-FILT-P3-006** | **生产** `/market` 列表 Web Vitals（INP/LCP）· discover/guides **P99** · 高并发下筛选/排序 UX | — | — | **③ 待验** |

---

## 逐项说明

### MKT-FILT-P2-001 · `/market` 旅行预约 staging 筛选

| 项 | 内容 |
|----|------|
| **真源** | `marketGuideFilterQuery.ts` · `registry/market-guide-facet.v1.json` · **93 B-MKT-002** |
| **② 完成标准** | staging **`GET /guides`** + **`GET /discover/orders`** 与 UI 国家/城市/语言/服务/天数/排序 **对拍** · 深链 `?country=&city=&language=&service=&days=&sort=` 可复现 |
| **① 对照** | `npx vitest run lib/marketGuideFilterQuery.test.ts` · `MARKET-L5-CLOSURE` 绿集 |
| **证据** | `evidence/GO_phase2_testnet_20260526/market-filters/travel-booking/`（待建） |

### MKT-FILT-P2-002 · 商家子站 staging 筛选

| 项 | 内容 |
|----|------|
| **真源** | [`app/market/provider/README.md`](../../app/market/provider/README.md) · **94 §2.3** |
| **② 完成标准** | staging **`GET /api/v1/market/provider/listings?country=JP&category=dining&sort=price_asc`** 与 UI 列表 + **`aria-live` 摘要条数** 一致 |
| **① 对照** | `marketStandaloneBusinessPageUtils.test.ts` · `marketSubsiteFilters.test.ts` |
| **证据** | 同上目录 `provider/` |

### MKT-FILT-P2-003 · 旅行收购子站 staging 筛选

| 项 | 内容 |
|----|------|
| **真源** | [`app/market/acquisition/README.md`](../../app/market/acquisition/README.md) · **94 §2.3** · **PD-009** payload 字段 |
| **② 完成标准** | staging acquisition listings query + **`bounty_desc`** 排序与 UI 一致 · 与 **M16～M21** 收购烟测 **可并跑** |
| **证据** | `evidence/GO_phase2_testnet_20260526/market-filters/acquisition/` |

### MKT-FILT-P2-004 · staging E2E 子站筛选

| 项 | 内容 |
|----|------|
| **真源** | `MarketSubsiteFilterBar` · `e2e/93-matrix-path-p1-remediation.spec.ts`（**B-MKT-002** 仅验 `/market` 可见） |
| **② 完成标准** | staging Playwright：**provider + acquisition** 各 ≥1 组 **country×category×sort** · **重置** 恢复 · **空态** 文案 · **不** 误回退 demo 橱窗 |
| **证据** | Playwright report → `market-filters/e2e/` |

### MKT-FILT-P2-005 · staging API query 对拍

| 项 | 内容 |
|----|------|
| **真源** | `crates/api/src/routes/market_subsite_list_query.rs` · **94 §2.3.5** |
| **② 完成标准** | staging 上 **curl/矩阵** 证明 query 键与响应 **items** 过滤一致 · 与前端 **`buildMarketSubsiteListingsQueryString`** 同键 |
| **诚实边界** | **① 本地 Rust unit test ≠ ② staging PG 行** |

### MKT-FILT-P2-006 · cursor 分页（②）

| 项 | 内容 |
|----|------|
| **真源** | **94 §2.3.5** `cursor=` · 当前 **`MARKET_LISTINGS_PAGE_CAP=200`** |
| **② 完成标准** | staging 目录 **>200** 时 **API cursor** + UI **加载更多**（或等价）· 筛选参数 **透传 cursor** |
| **与 ① 分工** | ① 200 内 client+server filter **已闭**；② 仅 **超 cap** 场景 |

### MKT-FILT-P2-007 · R-003 staging GO

| 项 | 内容 |
|----|------|
| **真源** | [PHASE2-TESTNET-ACCEPTANCE · 轨 1](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) · **93 §8.2 B-MKT-*** |
| **② 完成标准** | `environment.name=staging` + **`release_gate=GO`** 含 market 子站筛选相关行 |
| **互指** | 与 **WEB3-P2-005** / **TTNET-P2-007** 同源轨 1 |

### MKT-FILT-P2-013 · `/market` 写链 staging

| 项 | 内容 |
|----|------|
| **真源** | `useMarketPage.ts` · `OrderDetailDrawer` · `CustomItineraryModal` · `bindGuideToOrder` query |
| **② 完成标准** | staging **`GET discover/orders` + `GET /orders` 本单回填** · **`POST …/accept`** · **自定义行程 submit** · Escrow **`bindGuideToOrder`** 深链 **exit 0**（`smoke-*` staging 变体或 WEB3-P2-007 并跑） |
| **① 对照** | 本地 discover/guides/debounce · 绑定/接单写链 vitest + 可选本地 smoke |
| **证据** | `evidence/GO_phase2_testnet_20260526/market-filters/travel-booking/write-chain/`（待建） |

### MKT-FILT-P2-014 · `/market` staging 列表性能（非 UI）

| 项 | 内容 |
|----|------|
| **真源** | `useMarketPage.ts` · `MarketContent.tsx` · `marketDiscoverListCache` · `marketGuidesListCache` · `marketDiscoverOrdersMerge` |
| **② 完成标准** | staging **大页** discover/guides（≥30 条/分页）下：300ms debounce **不丢请求** · cache **不展示 stale 本单** · 筛选 `startTransition` **INP 可接受** · **`aria-live` 条数与 API 一致** |
| **① 对照** | ① runtime 优化 **2026-06 已闭**（memo/deferred/TTL/lazy/dynamic）— 见 [`WEB3-LANDING-MARKET-LOCAL-REMAINING §E`](./WEB3-LANDING-MARKET-LOCAL-REMAINING.md) |
| **诚实边界** | ① 本地 vitest **≠** staging 负载 · **非** UI 改版 |

---

## ③ 明确不在 ②（勿混入）

| ID | 项 |
|----|-----|
| **MKT-FILT-P3-001** | 生产 catalog **cursor** 与公网 QPS 下筛选延迟 SLA |
| **MKT-FILT-P3-002** | **搜索**（94 二期 · **非** 当前 pill/chips 筛选） |
| **MKT-FILT-P3-003** | 生产 filter URL · CDN · 长期 **`aria-live`** 观测 |
| **MKT-FILT-P3-004** | **go-live** · **94 §9.2** · 主网 Escrow 下游（筛选本身 **不** 触链） |
| **MKT-FILT-P3-006** | **生产** `/market` Web Vitals · discover/guides **P99** · 高并发筛选/排序 · CDN 封面 SLA |

---

## 不在本 backlog 单列（其它 Phase · 勿混入）

| 项 | 阶段 | 说明 |
|----|------|------|
| **PD-009 bond / publish gate** | ① 已闭 · ② 轨 5 | 收购 **发布/接单** — [acquisition-publish-trust-rules §8.2](../../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#82-第二阶段--测试网--待验backlog) |
| **商家 KYB / onboarding** | ② 窄 onboarding | [`smoke-provider-onboarding-local.sh`](../../../scripts/dev/smoke-provider-onboarding-local.sh) staging 变体 |
| **UnlockModal 真 USDC** | — | 走 **WEB3-P2-003** `/pay` |
| **UI 筛选带 layout 改版** | — | **FIVE-MAIN / MARKET-FILTER-SORT-UI-FREEZE 禁止** |

---

## 互指

| 文档 | 用途 |
|------|------|
| [`WEB3-PAGES-PHASE1-INVENTORY.md`](./WEB3-PAGES-PHASE1-INVENTORY.md) | ① 总表 #3 · #24 · 本 backlog 索引 |
| [PHASE2-TESTNET-ACCEPTANCE · 轨 10](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) | 宽 ② 执行顺序 |
| [PHASE2-ENTERPRISE-GAP-AUDIT §3.10](../../../docs/runbook/PHASE2-ENTERPRISE-GAP-AUDIT.md) | 企业缺口 |
| [94 §2.3 · §9.1 M7](../../../docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md) | 规格 Target |
| [`MARKET-L5-CLOSURE`](../GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md) | **`/market`** ① 旅行预约筛选 |
