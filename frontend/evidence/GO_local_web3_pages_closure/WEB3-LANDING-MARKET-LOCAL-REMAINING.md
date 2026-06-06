# `/` · 自由市场三页 · ① 本地台账（2026-06-03）

> **① 工程状态：无未闭必改项。** 本文为审计记录与 **②③ 索引**；文件名保留 `REMAINING` 仅为路径稳定，**不**表示仍有 ① 待办队列。

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；**禁止**用 ① 冒充 ②③）

**范围：** 本轮审计与修补涉及的 **`/` Web3旅行** · **`/market` 旅行预约** · **`/market/provider`** · **`/market/acquisition`**。

---

## ① 已闭（2026-06-03 数据链 · 非 UI）

| 域 | 项 |
|----|-----|
| **`/`** | Hero i18n 诚实化 · **localStorage** 恢复 + 解锁 `getOrder` 回填 · 收藏 ↔ market 同步 · **F-020 API（已登录）** · result/unlock **跨 tab** · Hero→Market 精确 `days` · mock `content_images` |
| **`/market`** | 筛选 URL 同步 · 300ms debounce · discover/guides 读链 · **discover `?days=` · guides 多 facet query** · **nil-guide accept** · 绑定/接单/自定义行程写链 · **F-020 API（已登录）** |
| **子站** | PG `listings?country&category&sort` · demo degraded 提示 · Provider Studio 三门闸 FE + 入驻/准入 CTA · `useMerchantShowcaseStudioModal` 单 SSOT |
| **F-020 + 机读** | 收藏 API 已登录同步 · `data-tt-*-favorites-mode` · 文档对拍 | **P1-WB-08/09** · `web3PagesPhase1DataHonesty.contract.test.ts` |
| **L-001 / L-002 / L-004（① 诚实 mock）** | 解锁/行程/收购 bond **UI+机读** 标明非真 USDC·非生产 AI·非链上 | `data-tt-landing-unlock-honesty` · `data-tt-home-itinerary-honesty` · `data-tt-acquisition-bond-honesty` · **2026-06-03** |

**机读：** `run-web3-itinerary-l5-green.sh` · `marketSubsiteFilters*` · `merchantPublishEligibility.test.ts` 等（见 [`WEB3-PAGES-PHASE1-INVENTORY`](./WEB3-PAGES-PHASE1-INVENTORY.md)）。

---

## `/market` 旅行预约 · 收口与冻结审计（2026-06-03）

**结论：** **`/market` 主入口在 ① 已收口并已冻结**（UI + 筛选数据链 + 机读锚点一致）；**②③ 能力未验** — 须走 [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](./MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) **MKT-FILT-P2-*** / **P3-***，**禁止**用 ① 绿集或本地 perf 冒充 staging/production GO。

| 维度 | ① 状态 | SSOT |
|------|--------|------|
| **UI 壳 / L5** | **已收口 · 已冻结** | [`MARKET-L5-CLOSURE`](../GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md) · [`MARKET-UI-THAW`](../GO_local_marketing_front_closure/MARKET-UI-THAW.md) **CLOSED** |
| **筛选带 + 排序条 layout** | **已冻结** | [`MARKET-FILTER-SORT-UI-FREEZE`](../GO_local_marketing_front_closure/MARKET-FILTER-SORT-UI-FREEZE.md) · `data-tt-market-filter-sort-frozen="1"` |
| **五主路由行** | **已冻结** | [`FIVE-MAIN-ROUTES-PHASE1-FREEZE`](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) **`/market`** |
| **数据链（discover/guides/URL/debounce/写链）** | **① 已闭** | [`app/market/README.md`](../../app/market/README.md) · `useMarketPage.ts` · **300ms** debounce |
| **收藏** | **① FE + localStorage + F-020 API（已登录）** | **②** 跨设备 staging → **MKT-FILT-P2-009** |
| **客户端 facet/天数/排序** | **① 天数 + 多 facet 已进 API query**；排序仍客户端 | **②** staging 对拍 → **MKT-FILT-P2-008/012** |
| **nil-guide 一步抢单** | **① 已做** — `POST accept` 在 `guide_id=nil` 时认领并接单 | **②** staging 对拍 → **MKT-FILT-P2-011** |
| **企业级 runtime 性能（非 UI）** | **① 2026-06 已闭** | memo · deferred 列表 · API 30s TTL · `startTransition` 筛选 · 封面 lazy — **允许**维护类；**②** 负载对拍 → **MKT-FILT-P2-014 · P3-006** |
| **子站** provider/acquisition | **① 数据链已闭 · 非 MARKET-L5 lock** | 筛选 **②** MKT-FILT-P2-002～006 |

**机读锚点（`app/market/page.tsx` · 2026-06-03 对拍）：** `data-tt-market-l5="1"` · `data-tt-market-ui-thaw="closed"` · `data-tt-market-filter-sort-frozen="1"`

**维护期允许：** bugfix · 数据链 · i18n · a11y · 门闸 · **非 UI 的 runtime/缓存优化**（须过 MARKET-L5 vitest 绿集）。  
**维护期禁止：** Hero/双栏/筛选带/卡片 **结构·token·layout** 回流（须先解冻 THAW + FILTER-FREEZE）。

---

## ① 本地工程清单（2026-06-03 · **无未闭 ① 项**）

> **L-003 / L-005 / L-006 / L-007 / L-008 / L-009** 已于 2026-06-03 在 ① 代码闭（见上表「已闭」）。  
> **L-001 / L-002 / L-004** 在 ① 以 **诚实 mock + 机读锚点** 闭卷；**真 USDC / 真 AI / 链上 bond** 仅能在 **② / ③** 验收，**不得**用本节冒充。

### A · ① 已闭（诚实 mock · 真能力在 ②/③）

| ID | ① 已做（工程） | ②/③ 真能力 |
|----|----------------|-------------|
| **L-001** | `UnlockModal` · `unlock_payment_note` · `data-tt-landing-unlock-honesty="phase1-preview-no-usdc"` | 真 USDC **`/pay`** → **WEB3-P2-003** |
| **L-002** | `landing_hero_itinerary_disclaimer` · 结果区 `landing_results_*_note` · `data-tt-home-itinerary-honesty` | 真 AI → **WEB3-P2-010** |
| **L-004** | `me_trust_acquisition_publish_caption` · `data-tt-acquisition-bond-honesty="phase1-mock-pg-not-mainnet"` | PG mock → **②** §8.2 · **③** 真链 |
| **L-005** | API `limit`/`has_more` + FE 摘要文案；**无** cursor UI | **②** MKT-FILT-P2-006 · **③** MKT-FILT-P3-001 |

### C · 小缺口（① 可选补 · **不阻塞** Phase ① 封版）

| ID | 项 | 说明 |
|----|-----|------|
| **L-009** | `resultOrderIds` / `unlockedOrderIds` **localStorage + 跨 tab** | **① 2026-06-03 已闭**；**②** 账号态 WEB3-P2-012 |
| **L-010** | **`FAV_GUIDES_KEY`** 与 `/` 分离（向导收藏仅 market） | **① 设计如此** · SSOT [`marketFavoritesStorage.ts`](../../lib/marketFavoritesStorage.ts) |
| **L-011** | **`UNLOCK_PRICE_USD`** | `@deprecated`；仅 `archive/ui-v1` 引用 |

### E · `/market` ① 企业级性能（**2026-06 已闭 · 非 ②③**）

| 项 | 说明 | 应落阶 |
|----|------|--------|
| **① runtime** | memo 列表/壳层 · `useDeferredValue` · 筛选 `startTransition` · discover/guides/本单/子站目录 **30s TTL** · 封面 lazy/首屏 eager · 抽屉 `dynamic()` | **① 已闭** — 维护类允许 |
| **② 负载对拍** | staging 大页列表 INP · debounce+cache 与 PG 行为一致 | **MKT-FILT-P2-014** |
| **③ SLA** | 生产 discover/guides P99 · Web Vitals · `aria-live` 条数长期一致 | **MKT-FILT-P3-006** |

### D · 不在本四页范围（其它 ① 台账）

| 路由/域 | ① 状态 | SSOT |
|---------|--------|------|
| **`/traveltrust`** | 叙事 UI 已冻 · 数据 **②** | [`TRAVELTRUST-NETWORK-PHASE2-BACKLOG`](./TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) |
| **`/escrow/[id]` 已上链** | **未 UI 冻结** | [`ESCROW-ONCHAIN-RATE-STATUS`](./ESCROW-ONCHAIN-RATE-STATUS.md) |
| **Phase ① 封版 G-0** | **✅ 2026-06-03** `acceptance.latest.log` · `TT_GO_LOCAL_PHASE1: OK` | [`GO_local_phase1`](../../GO_local_phase1/README.md) · [`PHASE2-REPOSITORY-STATUS`](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md) |

---

## ② / ③ 任务清单（SSOT 索引）

| 文档 | ② | ③ |
|------|---|---|
| [`WEB3-HOME-PHASE2-BACKLOG`](./WEB3-HOME-PHASE2-BACKLOG.md) | **WEB3-P2-001～012** | **WEB3-P3-001～006** |
| [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](./MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) | **MKT-FILT-P2-001～012** | **MKT-FILT-P3-001～005** |
| [`TRAVELTRUST-NETWORK-PHASE2-BACKLOG`](./TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) | **TTNET-P2-001～008** | **TTNET-P3-001～004** |

**宽轨执行：** [PHASE2-TESTNET-ACCEPTANCE](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) 轨 8 / 9 / 10 · [PHASE2-START-CHECKLIST B-SMOKE-6～8](../../../docs/runbook/PHASE2-START-CHECKLIST.md)

---

## 互指

| 文档 | 用途 |
|------|------|
| **[`LANDING-MARKET-PAGES-CODE-SSOT.md`](./LANDING-MARKET-PAGES-CODE-SSOT.md)** | **四页** 代码/UI/设计/功能 **真源** |
| [`WEB3-PAGES-PHASE1-INVENTORY.md`](./WEB3-PAGES-PHASE1-INVENTORY.md) | 全站 Web3 页 ① 总表 |
| [`app/(home)/README.md`](../../app/(home)/README.md) | `/` 代码 SSOT |
| [`app/market/README.md`](../../app/market/README.md) | `/market` 代码 SSOT |
| [`product-manager/23-资料室总索引页`](../../../docs/product-manager/23-资料室总索引页.md) · [`33-上线验收与发布门禁清单`](../../../docs/product-manager/33-上线验收与发布门禁清单.md) | 对外/demo 入口表 · UAT 工程真源 |
| [`fundraising/internal/10-资料室索引`](../../../docs/fundraising/internal/10-资料室索引.md) | IR 资料室入口表（同源口径） |
| [`fundraising/external/03-FAQ`](../../../docs/fundraising/external/03-FAQ.md) · [`00-README`](../../../docs/fundraising/external/00-README.md) · [`01-OnePager`](../../../docs/fundraising/external/01-OnePager.md) · [`05-Litepaper`](../../../docs/fundraising/external/05-Litepaper.md) · [`en/00-README`](../../../docs/fundraising/external/en/00-README.md) · [`en/01-OnePager`](../../../docs/fundraising/external/en/01-OnePager.md) · [`en/05-Litepaper`](../../../docs/fundraising/external/en/05-Litepaper.md) | 对外 FAQ / 投资者包 · 尽调工程真源互指 |
| [`product-manager/30-产品需求池`](../../../docs/product-manager/30-产品需求池与优先级总表.md) · [`18-任务卡`](../../../docs/product-manager/18-产品经理专业任务卡.md) · [`29-深查`](../../../docs/product-manager/29-产品经理多维度深度检查与新增缺口.md) · [`31-埋点`](../../../docs/product-manager/31-产品指标与埋点口径表.md) · [`35-路线图`](../../../docs/product-manager/35-产品路线图与版本节奏表.md) · [`26-FAQ`](../../../docs/product-manager/26-项目 FAQ（对外初稿）.md) · [`32-反馈`](../../../docs/product-manager/32-用户反馈与问题闭环台账.md) · [`34-Bug`](../../../docs/product-manager/34-Bug 分级与质量复盘机制.md) · [`36-竞品`](../../../docs/product-manager/36-竞品与对标项目观察表.md) · [`25-OnePager`](../../../docs/product-manager/25-项目 One Pager（对外初稿）.md) · [`27-Deck`](../../../docs/product-manager/27-Pitch Deck 初稿（页序版）.md) · [`README`](../../../docs/product-manager/README.md) | PM 需求/漏斗/任务卡/路线图/对外初稿 |
