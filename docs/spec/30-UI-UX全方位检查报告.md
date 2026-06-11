# 30 · UI/UX 全方位检查报告

> **现行 SSOT（2026-06-03）**：五主路由 **① UI 壳冻结** — **[FIVE-MAIN-ROUTES](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)** · **[88 §一](88-五主路由页身实现快照与UX缺口审计-20260330.md)**。**`/` + `/market*` 四页 ① 数据链** — **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)**（**1×** POST · **`localStorage`** · **debounce** · 收藏 **`localStorage` + F-020 best-effort**（**`marketTravelBookmarksSync`**）→ **②** SLA）。下文部分段落为历史检查快照；**`/did-rank`** 以 **竖脊五签**（含 **行程**）为准 — **[DID-RANK-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/DID-RANK-PHASE1-FREEZE.md)**。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **维度总览（Tokens/a11y/i18n…）** | **§1** |
| **§8 已完成优化清单** | **§8** |
| **规范依据** | **[28](28-Cinematic-Glassmorphism-Web3融合规范.md)**、**[29](29-自由市场-撮合控制台规范.md)**、**[30-DID](30-DID排行榜-页面规范.md)**、**[13-1](13-1-UI产品级SSOT与页面规范.md)** |
| **`/` + `/market` 四页 ① 数据链** | **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §2～§3 |

**目的**：从 UI、UX、无障碍、一致性、i18n 等维度对前端做一次检查，并列出可优化项与优先级。  
**范围**：`frontend/app`、`frontend/components`；规范依据 28、29、30、13-1。

**§2～§7 与 §8（防误读）**：**§8** 为**已实现优化**的验收清单；**§2～§7** 保留首轮检查时的「可优化点」、**建议 key 表**与历史优先级正文，便于对照命名与回归审计。**当前结论**以 **§1 维度总览** 与 **§8** 为准；**勿将 §7 历史小结当作待办现状**。

---

## 1. 检查维度总览

| 维度 | 结论 | 说明 |
|------|------|------|
| **Design Tokens（28）** | ✅ 已符合 | 未发现 `text-gray-*`、`text-blue-*`、`rounded-md`；全站使用 ink/travel/success/warning/danger、`rounded-[var(--radius-sm)]`、`bg-bg-console` 等。 |
| **无障碍** | ✅ 已加强 | 跳过主内容、`:focus-visible`、DID 与全站 `prefer-reduced-motion`、error 页 `role="alert"`；html lang 由 LocaleProvider 同步。见 §8。 |
| **i18n** | ✅ 已补齐 | 根/市场/托管 error、loading、EmptyState、EscrowDetail、MarketSkeleton 等已统一 common_* / escrow_* / empty_*。见 §8。 |
| **加载/错误态** | ✅ 已统一 | 「加载中」统一 LoadingText（common_loading）；各 error 页 i18n + 重试/返回首页。见 §8。 |
| **一致性** | ✅ 已改善 | EscrowDetail 全文案 i18n，无中英混用。见 §8。 |
| **响应式** | ✅ 有基础 | Header 移动端折叠导航、市场页 StickyFilterBar/ViewSwitcher；**DID 榜** 竖脊在上、内页在下（**30 §1**）已考虑。 |

---

## 2. UI 检查

### 2.1 规范符合度（28 / 30）

- **Landing/Discover/市场**：Hero 可信承诺、TrustBadgesRow、可信基建墙、玻璃 pill、WalletStatusMini 已按 28 实现；**`/`** **1×** 创单 · **`ITINERARY_CARD_COUNT=1`** · **`landingItinerarySession` = `localStorage`**（**CODE SSOT** §2）；**`/discover`→`/market`** · **`useMarketPage`** **300ms debounce** · 收藏 **`localStorage` only**（**CODE SSOT** §3）。
- **DID 排行榜**：赛博风、**书壳 + 竖脊五签** + 内页翻页、五端点 HTTP、奖金池 **illustrative 披露**、`?board=` / `?period=`、档案链 **`/community/user/[id]`**（**①** **[DID-RANK-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/DID-RANK-PHASE1-FREEZE.md)**）。
- **Escrow**：银行级、无玻璃；FinalityBadge、OnchainEventTimeline、TxMachineStatus 已接入。
- **自由市场**：撮合控制台、订单/向导卡、Escrow-enabled/SupportedTokens、无支付 CTA 符合 29；**`getDiscoverOrders` debounce** · **F-020 best-effort 已接线（①）→ ② SLA** — **CODE SSOT** §3。

### 2.2 可优化点

> **历史归档**：下列 UI 条目已在 **§8** 标记为 ✅；新漏网项请增 **§8** 表行。

- **根级 loading**：当前为「加载中…」单行，可改为 i18n，并与各路由 loading 统一用 `common_loading`。
- **根级 / 市场 / 托管 error 页**：标题、描述、按钮「重试」「返回首页」建议全部走 i18n，与 DID error 页一致。
- **EmptyState**：案「暂无待撮合订单」「暂无向导」「暂无匹配结果」及 CTA 文案建议入 i18n，便于中英切换。
- **EscrowDetail**：Confirm Final Plan 弹窗、接单/取消/**确认行程完成（链下）**/发起争议/存款/**release（链上）**/退款等按钮与提示，建议统一 i18n，避免中英混用；勿将「确认完成」与「放款」混标（04 §3.4）。

---

## 3. UX 检查

### 3.1 导航与反馈

- 顶栏：四链激活色与路径一致（**`/`** 仅亮 Web3旅行；深条暖金 / 浅条暖棕，**86 §6.0** · **`uiSystem.test.ts`**）；Wallet / 登录 / 注册 清晰。
- 错误反馈：DID 页「请求失败，当前为示例数据」+ 重试 已成型；市场页有示例数据提示与重试；Escrow 有 ApiErrorAlert。
- 加载反馈：多数列表/详情页为「加载中…」+ 骨架或占位，缺少统一「加载中」文案 key。

### 3.2 可优化点

> **历史归档**：下列 UX 条目已在 **§8** 闭环或已由 §1 总览覆盖；详见 **§8**。

- **统一「加载中」**：根 `loading.tsx`、`escrow/[id]` Suspense fallback、`me`/`orders`/`guides`/`disputes` 等页的 loading 文案，统一使用 `common_loading`（i18n）。
- **错误页动线**：各 error.tsx 除「重试」外，保留「返回首页」或「返回 XX 列表」等，便于恢复；文案统一 i18n。
- **Escrow 操作反馈**：链上「交易已提交，请等待链上确认」等可入 i18n，与全站一致。

---

## 4. 无障碍检查

### 4.1 已实现

- **ClientSkipLink**：`sr-only` + focus 时固定左上角，跳转 `#main-content`。
- **layout.tsx**：`<div id="main-content">` 包裹子级，跳过主内容有效。
- **:focus-visible**：globals.css 中 2px outline + travel-500，按钮/链接一致。
- **DID 动效**：`@media (prefers-reduced-motion: reduce)` 下关闭 did-rank 动画。
- **语言选择**：Header 下拉 `aria-expanded`、`aria-haspopup="listbox"`、`role="listbox"`/`option"`、`aria-selected`。
- **收藏按钮**：OrderCard/GuideCard 等 `aria-label`「收藏」/「取消收藏」。

### 4.2 可优化点

> **历史归档**：`html lang`、error `role="alert"`、全站 `prefer-reduced-motion` 等见 **§8**。

- **html lang**：当前根 layout 为 `lang="zh-CN"` 固定；若全站 i18n 后，建议随当前语言切换（如 client 侧 `document.documentElement.lang` 与 locale 同步），便于读屏与 SEO。
- **错误边界**：error 页可考虑 `role="alert"` 或 `aria-live="assertive"` 对标题/主要说明加注，便于辅助技术优先播报。
- **全站动效**：除 DID 外，`motion-main`/`motion-sub` 未在 `prefers-reduced-motion` 下减弱；若产品要求更高无障碍，可在此处做减弱（非必须）。

---

## 5. i18n 缺口清单（建议 key · 历史归档）

> **说明**：下表为首轮建议 key；**实现状态**以 **§8** 为准。

| 位置 | 当前文案示例 | 建议 key |
|------|--------------|----------|
| `app/error.tsx` | 出错了、页面加载异常、重试、返回首页 | common_errorTitle、common_errorMessage、common_retry、common_backToHome |
| `app/loading.tsx` | 加载中… | common_loading |
| `app/escrow/[id]/page.tsx` Suspense | 加载中… | common_loading |
| `app/market/error.tsx` | 自由市场加载异常、重试、返回首页 | market_errorTitle + common_* |
| `app/escrow/error.tsx` | 托管页加载异常、重试、返回首页 | escrow_errorTitle + common_* |
| `components/market/EmptyState.tsx` | 暂无待撮合订单、去生成行程、暂无向导、申请向导、暂无匹配结果、清除筛选 | empty_* |
| `components/escrow/EscrowDetail.tsx` | 确认最终行程、确认并提交、取消、提交中…、接单、取消订单、确认完成（链下）、发起争议、返回订单列表、加载中…、提交评价、Deposit/**Release**/Refund 等 | escrow_* |

以上为第一轮建议；EscrowDetail 文案多，可分批上 key。

---

## 6. 优先级建议（历史归档）

> **说明**：下表为 §8 落地前的分批建议；**当前排期**见 [缺口与待补-官方总表](缺口与待补-官方总表.md) **P1-D** 与 **§8**。

| 优先级 | 项 | 说明 |
|--------|----|------|
| **P0** | 根 error + loading i18n | 全站通用，改动小，影响大。 |
| **P0** | 市场/托管 error 页 i18n | 与 DID error 页一致，体验统一。 |
| **P1** | EmptyState i18n | 自由市场高频可见，中英切换必需。 |
| **P1** | Escrow 详情关键文案 i18n | Confirm Final Plan、接单/取消/确认完成（链下）/争议、**Release**、加载中/返回订单列表等。 |
| **P2** | html lang 随 locale | 无障碍与 SEO 增强。 |
| **P2** | 其他 EscrowDetail 长文案 | 弹窗说明、签名前确认等。 |
| **P3** | 全站 prefer-reduced-motion 扩展 | 非 DID 动效减弱，按产品需求决定。 |

---

## 7. 小结（与 §8 对齐后的当前结论）

- **UI**：与 28/29/30 规范已对齐，Design Tokens 无裸色；DID 与 Escrow Console 风格区分清晰。
- **UX**：导航与错误/示例数据反馈已有；加载与错误态已与 **§8** 统一 i18n（`common_*`、各模块 `error_*` 等）。
- **无障碍**：跳过主内容、焦点、`prefer-reduced-motion`、`html lang` 随 locale、error 页 `role="alert"` 等见 **§8**。
- **i18n**：§5 所列 key 路径已在 **§8** 闭环；持续迭代（运营文案、新页面）见 [缺口与待补-官方总表](缺口与待补-官方总表.md) **P1-D**。

*历史「可优化点」与 key 表仍见 §2～§6；验收对照 **§1 + 本文 §8**；全站视觉规范另见 [28](28-Cinematic-Glassmorphism-Web3融合规范.md) §8；DID 页专项见 [30-DID 排行榜页面规范](30-DID排行榜-页面规范.md)。*

---

## 8. 本次已完成的优化（与报告同步）

| 项 | 状态 |
|----|------|
| 根 error.tsx i18n + role="alert" | ✅ |
| 根 loading.tsx、escrow/[id] Suspense 使用 common_loading（LoadingText 组件） | ✅ |
| market/error.tsx、escrow/error.tsx i18n + role="alert" | ✅ |
| EmptyState 全文案 i18n（empty_*） | ✅ |
| EscrowDetail 全文案 i18n（escrow_*、common_cancel、common_submitting） | ✅ |
| html lang 随 locale | ✅（LocaleProvider 内已有 document.documentElement.lang 同步） |
| me/orders/guides/disputes 等页「加载中」统一为 LoadingText（i18n） | ✅ |
| MarketSkeleton sr-only「加载中」i18n | ✅ |
| prefer-reduced-motion：motion-main/motion-sub/btn-console 减弱 | ✅（globals.css） |
| community/error.tsx i18n + role="alert"（31 赛博风） | ✅ |
| community **L1** 壳、loading.tsx、登录态、页面切换滚动置顶（31 §5、**88**、31 企业级检查） | ✅ |
| did-rank/error.tsx 补 role="alert"（与根/市场/托管一致） | ✅ |
