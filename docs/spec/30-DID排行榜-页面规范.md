# 30 · DID 排行榜页面规范

**Status:** 产品与 UI 定稿  
**定位**：DID 排行榜为**书脊 + 单页内容区**：左侧竖向 **脊签**（旅行者 / 向导 / **行程** / 商家 / **旅行收购**）切换榜单；右侧**内页框**同一时间只展示一栏内容，切换时带**横向翻页感**动效（见 **§1、§4.3**）。突出链上/托管消费与接待战绩，类音乐排行榜信息层级。**① 本地 UI 壳层 L5**（五签、主/副榜 Top10+11～100 同构、行程 Top10、轮询、a11y）**已闭**；**产品数据 L5** 见 **§7.2（② 测试网）** 与 **[04-附录 §3.2](04-附录-did-rank对接说明.md)**。
**风格定稿**：**Web3 赛博朋克**（动感、科技、霓虹），见 §4；本页与 28/29 旅行玻璃态区分，仅 DID 排行榜采用此风格。  
**配套**：[28-Cinematic-Glassmorphism-Web3融合规范](28-Cinematic-Glassmorphism-Web3融合规范.md)、[29-自由市场-撮合控制台规范](29-自由市场-撮合控制台规范.md)、[13-1-UI产品级SSOT与页面规范](13-1-UI产品级SSOT与页面规范.md)。本页风格以本文 §4 为准。

**API 与排序 SSOT**（与实现对齐）：[04-附录-did-rank对接说明](04-附录-did-rank对接说明.md) §2；响应含 `period` / `since` / `limit` / **`rank_basis`**。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **排序主键、`rank_basis`、与 UI 主指标关系** | **§0.1**；契约 **[04-附录-did-rank](04-附录-did-rank对接说明.md) §2** |
| **书壳 + 脊签 + 内页翻页布局与动效** | **§1、§4.3** |
| **旅行者 / 向导 / 行程 / 商家 / 旅行收购** | **§2、§3、§0.1**（**①** 壳层 ✅；**②** 产品数据 **§7.2** / **04 附录 §3.2**） |
| **赛博朋克视觉（与 28 区分）** | **§4** |
| **路由、URL 参数与实现** | **§5、§6** |
| **同风格社区页** | **[31](31-TT社区页面设计.md)**（复用 **30 §4**） |
| **① UI 壳冻结（2026-05-25）** | **[FIVE-MAIN-ROUTES](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)** · **[DID-RANK-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/DID-RANK-PHASE1-FREEZE.md)** · [`app/did-rank/README.md`](../../frontend/app/did-rank/README.md) · **88 §一** · **L5 审计** **[DID-RANK-COMMUNITY-L5-AUDIT-TASKS](../../frontend/evidence/GO_local_marketing_front_closure/DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md)** |

---

## 0.1 排序与数据口径（与后端一致）

| 维度 | 说明 |
|------|------|
| **旅行者榜** | 按所选 `period` 窗口内 **已完成订单数**（订单 `completed_at` 且 `status=completed`）降序；细则与 `rank_basis` 见 04 附录。 |
| **向导榜** | 按窗口内 **已完成订单金额合计**（`orders.amount` 之和）降序，同分按 **完成单数**，再按用户创建时间；API 含 `reception_gross_total` / `reception_count`；`rank_basis`=`guide_reception_gross_total_then_completed_count`。 |
| **行程榜**（`GET …/did-rank/itineraries`） | 按关联订单 **完成时间**；无完成单时回退 **行程创建时间**（`rank_basis` 标明 fallback）。**①** `/did-rank?board=itinerary` 展示 **Top10 网格**（`ItineraryRankBlock` · `DidRankItineraryRankBlock`）；**无** 11～100 折叠（30 前 10 奖励叙事）。深链 **`?me=itinerary-<order_id>`**。 |
| **商家榜**（脊签） | **`GET …/providers`** **200**；**`ProviderRankBlock`** Top3+Top10+11～100 同构；**`rank_basis`** = **履约单→金额→published listings**（**`guide_id` 代理**，真 GMV **② D1**）。 |
| **旅行收购榜**（脊签） | **`GET …/acquisitions`** **200**；**`AcquisitionRankBlock`** 同构 IA；排序口径同上；产品叙事见 **§3.2**、**[87 §1.4](87-TravelTrust-角色体系技术文档-融合架构版.md)**；**②** 见 **§7.2**。 |
| **展示字段** | UI 仍可突出 **USDT 消费、接待金额、国家/城市数** 等，作为 **辅助指标**；**排序以 API 返回的 `rank` 与 §0.1 为准**，不必与单笔金额字段一致。 |

---

## 1. 页面布局

| 区域 | 说明 |
|------|------|
| **奖金池** | 页面最上：**奖金池**区块，说明每月奖励排行榜前 10 名、以治理代币（TTG）发放（Target）；展示本月池子总量（占位可接链上/后端）；风格与 §4 一致（霓虹青/品红/琥珀高亮） |
| **顶部** | 标题「DID排行榜」+ 简短说明（链上消费/接待可验证）；可与 28 玻璃 Hero 一致 |
| **主内容（书壳）** | **外层书壳** + **左侧竖脊**（`role="tablist"`）：**五签** — 旅行者 / 向导 / **行程** / 商家 / 旅行收购（**`?board=`** · **§5**）。**右侧内页框**：`min-h` 约 `min(520px, 72vh)`；**单时刻一栏** — `TravelerRankBlock` / `GuideRankBlock` / **`DidRankItineraryRankBlock`**（Top10）/ `ProviderRankBlock` / `AcquisitionRankBlock`。 |
| **翻页动效（脊签切换）** | **`framer-motion`**：`AnimatePresence` + `motion.div`，`key={activeBoard}`；脊签序 **旅行者 → 向导 → 行程 → 商家 → 旅行收购**（**`DidRankBoardShell`** · **§4.3**）。首屏 **不播** 入场翻页；**`useReducedMotion()`** 收敛为淡入淡出。 |
| **每榜结构（内容区内）** | 旅行者/向导/商家/收购：**Top10 横板 + 11～100 分页**；**行程榜**：**仅 Top10 网格**（**无** 11～100）。 |

---

## 2. 旅行者排行榜（脊签：旅行者）

**排名依据**：见 **§0.1**；接口侧主键为窗口内 **已完成订单数**（非按 USDT 金额排序）。同序时可辅以注册/创建时间等（见 04 附录）。

| 展示项 | 说明 |
|--------|------|
| 排名 | 1～100，前 3 可高亮（金/银/铜或 28 色） |
| 头像/昵称 | 支持 DID/匿名展示 |
| **消费金额** | 总消费 USDT（或 USDC）**视觉主指标**（大号/加粗）；与排序主键可能独立，以 API `rank` 为准 |
| 去过国家数 | 例：12 国 |
| 去过城市数 | 例：28 城；可折叠「战绩」展开更多 |
| 战绩（可选展开） | 国家列表、城市列表、订单数等 |

**横板（前 10）**：卡片内含排名、头像、昵称、消费 USDT、国家数、城市数；可点击展开或跳转个人页。

**竖版 11～100**：每行：排名 | 头像 | 昵称 | 消费 USDT | 国家数 | 城市数；不重复前 10 横板，竖版从第 11 名开始。

---

## 3. 向导排行榜（脊签：向导）

**排名依据**：**接待总金额（USDT/USDC）** 从高到低；同分可辅以「接待次数」。

| 展示项 | 说明 |
|--------|------|
| 排名 | 1～100，前 3 高亮 |
| 头像/昵称/城市 | 向导标识 |
| **接待总金额** | 总接待金额 USDT **主指标**，大号/加粗 |
| 接待次数 | 总计接待多少单 |

**横板（前 10）**：排名、头像、昵称、城市、接待总金额、接待次数。

**竖版 11～100**：每行：排名 | 头像 | 昵称 | 接待总金额 | 接待次数；不重复前 10 横板。

### 3.0 行程榜（脊签：行程 · ① UI 壳 ✅）

**排名依据**：见 **§0.1**（`GET …/did-rank/itineraries`）。**UI**：**`DidRankItineraryRankBlock`** — **Top10** 卡片网格；创作者链 **`/community/user/[id]`**（有合法 UUID 时）；深链 **`?me=itinerary-<order_id>`**。**无** 11～100 列表。

### 3.1 商家榜（脊签：商家 · ① UI 壳 ✅ · ② 产品数据 Partial）

**UI（①）**：**`ProviderRankBlock`** — Top3 领奖台 + Top10 横板 + 11～100 分页，与旅行者/向导同构。**API**：**`GET /api/v1/did-rank/providers`**；**`rank_basis`** = **`provider_fulfillment_orders_then_gross_then_published_listings_in_window`**（MVP 以 **`guide_id`** 完成单代理履约，**② D1** 须换真任务/GMV 口径）。

### 3.2 旅行收购榜（脊签：旅行收购 · ① UI 壳 ✅ · ② 产品数据 Partial）

**产品叙事**：用户发布 **收购任务**（目标国家/地区、品类、预算或单价、交割方式等），**入境该地区的旅行者** 浏览可顺带捎带的物品并接单赚取约定对价（与 **[87 §1.4](87-TravelTrust-角色体系技术文档-融合架构版.md)** 一致）。**药品、首饰/贵金属、禁限品** 须在任务与接单流程中 **强制披露与风险提示**；合规边界以 **03**、法务与属地监管为准，**本页榜单不**构成合规承诺。

**UI（当前 · ①）**：第五脊签 + **`AcquisitionRankBlock`** — 合规与风险提示、**`/market`** 动线；**Top3+Top10+11～100** 同构；**`GET …/acquisitions`**。**UI（② · 产品数据）**：窗口内 **成功履约单数**、**撮合 GMV**、**委托/受托信誉** 等产品定稿排序（非 **`guide_id` 代理**）见 **§7.2 D1**。

---

## 4. 风格定稿：Web3 赛博朋克（动感、科技、霓虹）

**本页采用与 28/29 不同的独立风格**：深色底、霓虹青/品红、网格、光晕动效，突出排行榜的科技感与动感。

### 4.1 背景

**实现真值（2026-03，与 `/market`、`/community` 暖场对齐）**：页面根 **`#14100d`** + **`WarmRouteFieldBackdrop`**（与 **`MarketAmbientBackdrop`** 同源：`#14100d` + **`bg-traveltrust-atmosphere`** + **`bg-traveltrust-dot-grid`**）+ **`bg-web3-podium-spotlight`** + **静态** **`bg-scifi-gradient-static`**（`globals.css`，与 `.bg-scifi-gradient` 同色但 **`background-size: 100%`**，**无**位移动画）+ 纵向柔光带（**无** `animate-did-bg`）+ 径向暖色高光 + **`bg-ref-silhouette-vignette`**。**已移除**：全屏 **`Web3SciFiBackground`**、**`bg-scifi-grid`**、`animate-did-gradient` / `animate-did-bg` 等**页身级**循环动效（避免「色块漂移 / 微粒上升」干扰阅读与顶栏三切和谐）。**详见 [88 §一](88-五主路由页身实现快照与UX缺口审计-20260330.md)**。

| 元素 | 约定（面板与榜单仍赛博） |
|------|------|
| **页身基座** | **`#14100d` + 暖场点阵**（上表）；与表 1 **自由市场** 同系 TravelTrust 氛围 |
| **赛博渐变（静态）** | **`bg-scifi-gradient-static`**：Token 色 `--bg-dark-console` / `--scifi-midnight` / `--scifi-cyan` / `--scifi-teal` 对角渐变，**不**使用 `400%` 尺寸 + `animate-did-gradient` |
| **动效（保留在组件级）** | 前 3 名 **`animate-did-glow`** / **`animate-did-glow-fuchsia`**、列表 hover、**`prefer-reduced-motion`** 降级（`globals.css`） |
| **网格（页身）** | **不在此页使用** `bg-scifi-grid`；科技感由**卡片霓虹边**与**静态渐变**承担 |

### 4.2 主色与霓虹

| 用途 | 约定 |
|------|------|
| **脊签选中态** | 以 **cyan** 高光为主（边框/背景/微光），与书壳右侧分界（如 `border-r-cyan-500/25`、内阴影） |
| **内页 · 旅行者榜** | 主色 **cyan**：边框 `border-cyan-500/30`、标题 `text-cyan-200`、金额 `text-cyan-400`、阴影 `rgba(34,211,238,...)`（与 `TravelerRankBlock` 一致） |
| **内页 · 向导榜** | 主色 **fuchsia**：边框 `border-fuchsia-500/30`、标题 `text-fuchsia-200`、金额 `text-fuchsia-400`、阴影 `rgba(217,70,239,...)`（与 `GuideRankBlock` 一致） |
| **内页 · 行程榜** | **`DidRankItineraryRankBlock`**：与旅行者/向导区分的 **行程卡** 网格（实现真值 **`didRankTheme.contract.test.ts`**） |
| **内页 · 商家榜** | **`ProviderRankBlock`** + **`DidRankSecondaryRankListBody`**：**amber** 系霓虹点缀（与奖金池琥珀高光一致；**① UI 壳已挂载**） |
| **内页 · 旅行收购榜** | **`AcquisitionRankBlock`** + **`DidRankSecondaryRankListBody`**（**① UI 壳已挂载** · **2026-05-25**）；主色与 **ProviderRankBlock** 同族 **amber** 系；**②** 产品排序口径见 **§3.2** / **§7.2 D1** |
| **页面标题** | 渐变字 `from-cyan-300 via-cyan-400 to-fuchsia-400`、`bg-clip-text text-transparent` |
| **徽章** | Polygon：`border-cyan-400/50`、`bg-cyan-400/10`、`text-cyan-300`；USDT/USDC：`border-fuchsia-400/50`、`bg-fuchsia-400/10`、`text-fuchsia-300` |
| **面板** | `bg-slate-900/70`、`backdrop-blur-md`、霓虹边框 + `shadow-[0_0_20px_...]`；hover 时边框与阴影加强 |

### 4.3 动效

| 元素 | 约定 |
|------|------|
| **脊签切换 · 内页翻页** | **`framer-motion`**（项目依赖见 `frontend/package.json`）：`AnimatePresence` `mode="wait"`；`motion.div` 绑定 `activeBoard` 为 `key`；进退场 **`custom={slideDir}`** 与变体中 **`x` / `rotateY` / `opacity` / `filter: blur`** 组合；父容器 **`perspective`**（约 1200px 量级）；脊签序 **旅行者 → 向导 → 行程 → 商家 → 旅行收购**（五签；实现真值 **`DidRankBoardShell`**）。**`useReducedMotion()`**：缩短时长或仅用透明度切换。实现真值 **`didRankFlipTransition`**、**`didRankPageVariants`**、**`usePreviousDidRankBoard`**。 |
| **路由 loading 骨架** | **`frontend/app/did-rank/loading.tsx`** 与书壳 + 竖脊 + 内页框 **同构**，减轻首屏与 `page` 切换时的布局跳变。 |
| **前 3 名卡片** | `animate-did-glow`：光晕脉冲（约 2.5s），旅行者区 cyan、向导区 fuchsia |
| **面板 hover** | `motion-sub` + `hover:border-*-400/50`、`hover:shadow-[0_0_28px_...]` |
| **列表行 hover** | `hover:bg-cyan-500/10` 或 `hover:bg-fuchsia-500/10`、对应边框高亮 |
| **返回链接** | `hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]` |
| **无障碍** | **`prefers-reduced-motion`**：`globals.css` 对 `.animate-did-*` 降级；翻页动效另由 **`useReducedMotion()`** 收敛（与上表一致）。 |
| **排名追赶（台阶）** | 原设计：标题框右侧 5→3→1 循环 + overshoot + 第一名 Pulse；**已按产品决策移除**，当前标题区无该模块。若需恢复可参考 60fps.design「Duolingo League Leaderboard Move Up」。 |

### 4.4 组件与细节

| 项 | 约定 |
|------|------|
| **数字/金额** | `font-mono`，金额主色 + 轻微 `drop-shadow` 发光 |
| **头像** | `ring-2 ring-cyan-400/30` 或 `ring-fuchsia-400/30` |
| **排名 1** | `text-amber-400` + 发光；2/3 银/铜或 slate/amber-600 |
| **圆角** | `rounded-lg`（与 28 的 radius-sm 在本页可放宽为 lg 以配合赛博感） |

### 4.5 数据与 Web3 露出

- 金额统一 USDT/USDC、Polygon · 链上可验证；不大段地址/哈希。
- 数据来源：**优先** `getDidRankTravelers` / `getDidRankGuides` / **`getDidRankItineraries`** / 副榜 **`getDidRankProviders` / `getDidRankAcquisitions`**（`?period=`；向导 **`?guide_sort=`** ↔ API **`sort=`**）；**失败时** 各榜 **`DidRankFetchErrorBanner`** + 空列表，**不**运行时回退 **`didRankMockData.ts` 生成器**；**① 本地** 可选 **`NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW=1`** 注入预览榜（`didRankDevPreview` + Header banner）。页头 pill 区分「实时 API」与未完整连通（见 `DidRankHeader`）。**奖池** `illustrative` → **③**。

---

## 5. 路由与入口

- **路由**：`/did-rank`（与 05、Header 导航「DID排行榜」一致）
- **查询参数**：**`?board=traveler|guide|itinerary|provider|acquisition`**（默认 **traveler**），与 **`parseDidRankBoardParam`** 一致。**`?period=week|month|all`**、**`?guide_sort=`**（向导榜）、**`?me=traveler-|guide-|itinerary-|provider-|acquisition-<id>`**（行程 id = **order_id**）深链与分页行为见 **`didRankUtils`** / **`useDidRankDeepLinkAutoScroll`**。
- **SEO**：layout 内 `title`、`description` 含 DID 排行榜、旅行者/向导排名

---

## 6. 实现与优化

**颜色与风格以 §4 为准**；**§4.1 页身背景栈**以仓库 **`did-rank/page.tsx` + `WarmRouteFieldBackdrop` + `globals.css` `.bg-scifi-gradient-static`** 为真值（**88**）。

| 项 | 落点 |
|------|------|
| **页面** | `frontend/app/did-rank/page.tsx`（SSR · `?period=` · `?guide_sort=`）+ **`DidRankPageInner`**：**书壳 + 竖脊五签**；子块 **`TravelerRankBlock`** / **`GuideRankBlock`** / **`DidRankItineraryRankBlock`**（Top10）/ **`ProviderRankBlock`** / **`AcquisitionRankBlock`**（副榜 Top3+Top10+11～100 · **§7.1**）；霓虹语义 **§4.2** |
| **动效** | **`framer-motion`**：脊签切换（上表）；`globals.css`：榜单 **`animate-did-glow`** / **`animate-did-glow-fuchsia`** 等仍可用；**页身**不再使用 **`animate-did-gradient` / `animate-did-bg`** 驱动整屏背景（见 **§4.1**） |
| **Loading** | `frontend/app/did-rank/loading.tsx`：与 **§1** 书壳布局对齐的骨架 |
| **SEO** | `frontend/app/did-rank/layout.tsx`：title、description |
| **类型 SSOT** | **`frontend/lib/didRankTypes.ts`**：与 **`GET /api/v1/did-rank/*`** 对齐；**`didRankMockData.ts`** 仅保留 **devPreview 生成器** 与单测，**非** 页内运行时回退 |
| **后续优化** | 见 §7（不改变 §4 颜色与风格） |

---

## 7. 在确定风格基础上的可优化项（Web3 赛博朋克风不变）

以下均不改动 §4 的颜色、动效、布局风格，仅做功能/体验/数据/无障碍补充。

| 类别 | 优化项 | 说明 | 状态 |
|------|--------|------|------|
| **动效** | 向导内页前 3 名品红光晕 | §4.3：向导内容区 fuchsia；前 3 卡片使用 `animate-did-glow-fuchsia`（品红脉冲） | ✅ 已做 |
| **无障碍** | `prefer-reduced-motion` | globals.css 已对 `.animate-did-*` 在 reduce 时关闭动效 | ✅ 已有 |
| **无障碍** | 列表 `aria-label` | 旅行者/向导完整榜均已 `role="region"` + `aria-label` | ✅ 已有 |
| **无障碍** | 头像 `alt` | 已用 `alt={nickname}`，不再用空 alt | ✅ 已有 |
| **数据** | 接入真实 API | **`/did-rank` 页**使用 **`getDidRankTravelers` / `getDidRankGuides` / `getDidRankItineraries` / `getDidRankProviders` / `getDidRankAcquisitions`**（**`?board=`**）；失败 **不** mock 回退 | ✅ 已对接 |
| **性能** | 完整榜分页 | 完整榜每页 20 条，上一页/下一页；减轻 DOM | ✅ 已做 |
| **交互** | 「我的排名」高亮 | URL 支持 `?me=traveler-5` 或 `?me=guide-3`，对应行高亮；栏内按钮「回到我的排名」先切页再滚动到该行 | ✅ 已做 |
| **交互** | 时间范围 Tab | **`?period=week|month|all`** + SSR 首屏；**`GET …/did-rank/*?period=`** | ✅ 已做 |
| **交互** | 点击跳转详情 | 向导/旅行者/副榜行链 **`/community/user/[id]`**（**`isDidRankDevPreviewId`** 拦截预览 UUID）；**无** `/guides/{uuid}` | ✅ 已做 |
| **交互** | 战绩展开（可选） | 旅行者前 10 卡片与列表行支持「战绩」展开/收起，展示国家、城市列表 | ✅ 已做 |
| **多语言** | 文案 i18n | 页面文案走 `locales`：`didRank_*`（zh.ts / en.ts），标题、Tab、按钮、分页等均已接入 | ✅ 已做 |
| **移动端** | 间距与横板列数 | 小屏 `px-3 py-6`、`gap-2`、横板 `grid-cols-2`、头像/文字略缩、分页与「回到我的排名」同栏折行 | ✅ 已做 |
| **布局** | 书脊与翻页 | **已实现（①）**：竖脊 **五签**（含 **行程**）+ **`AnimatePresence`** + **`?board=`** + 副榜 **Top10+分页** 同构（2026-05-25） | ✅ 壳层 L5 |

### 7.1 副榜（商家 / 旅行收购）实现台账（2026-05-25）

| 层级 | 已落地（① 本地） | 仍属 **② 测试网**（见 **§7.2** / **[04 §3.2](04-附录-did-rank对接说明.md)**） |
|------|-------------------|-------------------------------------------------------------------|
| **前端** | **五签** + **`?board=itinerary|provider|acquisition`** · **`DidRankItineraryRankBlock`**（Top10）；**`ProviderRankBlock`/`AcquisitionRankBlock`** + **`DidRankSecondaryRankListBody`** Top3+Top10+分页；**`getDidRankProviders`/`getDidRankAcquisitions`**；**`didRankResponseNormalize`**；**`devPreview`** 仅 **`NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW=1`**；E2E **`93-matrix-path-did-rank-boards`**（**① 窄切片**） | **§8.6** 全路径 E2E（**staging baseURL**）；93 矩阵角色变体（**D7**） |
| **后端** | **`GET /api/v1/did-rank/providers`**、**`/acquisitions`**；**`limit=100`**；**`rank_basis`** **`…fulfillment_orders_then_gross_then_published_listings_in_window`**；**`providers`** 含 **`owner_role_filter=provider`**；**`acquisitions`** **无** **`owner_role_filter`**（**PD-009 · 任意 listing owner**）；**`smoke`/`check-55`** 断言 | 真 **任务/收购履约**、**撮合 GMV** 排序（**D1**）；staging **≥10** 演示行（**D2**） |
| **数据库** | **`list_market_owners_did_rank_by_fulfillment`**（**`market_listings` + `orders`**，**`guide_id` 代理**） | 收购/任务专用聚合表或联表（产品定稿） |

### 7.2 ② 测试网验收（产品数据 · 非 ① 壳层）

**完整清单 SSOT**：[04-附录-did-rank §3.2](04-附录-did-rank对接说明.md)（**D1～D9**）。**禁止**用 **①** 本地绿 / 窄 E2E / **`devPreview`** 冒充 **② GO**。

**L5 双层（2026-05）**：**① UI 壳层 L5 已闭**（**§7.1**）；**产品数据 L5** 缺口（副榜真 GMV/履约、staging 密度、**§8.6** E2E、奖池 **③** 等）**全部** 在本表 **D1～D9**（**②**）。**禁止**用壳层 L5 冒充 **综合 L5**。

| 编号 | 主题 | ② 要点 |
|------|------|--------|
| **D1** | 副榜真排序 | 任务/收购 **履约单**、**撮合 GMV**、委托/受托 **信誉** — 非 **`guide_id` 完成单代理** |
| **D2** | 副榜数据密度 | staging PG **≥10** 演示行；**`limit=100`** 与 UI 一致 |
| **D3** | 无假主榜 | staging **禁** **`DEMO_PREVIEW`**；空态诚实 |
| **D4** | 奖金池 | **`prize-pool`** 与治理 **`pool`** 对读；**③** 链上/派奖 SSOT |
| **D5** | 文档同批 | **§7.1**、**04 §3.4** **`rank_basis`** 同步 |
| **D6** | E2E 关键路径 | **§8.6** 全路径（**staging baseURL**） |
| **D7** | 93 矩阵 | **`93-matrix-path-did-rank-boards`** + 角色变体 |
| **D8** | 实时（可选） | 轮询 env；WebSocket 另立项 |
| **D9** | 旅行者公开页 | **§8.7** **`/community/user/[id]`** |

**机读（②）**：测试网 **`smoke-api-public-routes.sh`** + **`check-55-quick-verify.sh`**；**`GET /meta` → `.did_rank` `db_backed`**。

---

## 8. 还可优化的方向（清单）

在 §7 表内「已定稿风格与主路径」**① 已闭**的前提下，**§7.2** 列 **② 产品数据** 待验项；以下为**后续可逐步做的优化**，不改变 §4 风格；按优先级与资源选做。

### 8.1 DID 页内体验

| 项 | 说明 | 状态 |
|------|------|------|
| **Loading 状态** | 首屏与切换时间范围时展示赛博风骨架屏（DidRankSkeleton）；接入 API 后仅需在数据返回前保持 isLoading | ✅ 已做 |
| **错误态与重试** | `fetchError` 状态 + 顶部 ApiErrorAlert +「重试」按钮；接入 API 后 catch 时 setFetchError、retry 时重拉 | ✅ 已做 |
| **空态** | 旅行者/向导榜无数据时展示 `didRank_emptyTraveler` / `didRank_emptyGuide`（i18n） | ✅ 已做 |
| **时间范围同步 URL** | 将 `timeRange` 同步到 `?period=week|month|all`，便于分享链接与刷新保持 | ✅ 已做 |
| **切换时间范围重置分页** | 切换 Tab 时把 `pageTraveler` / `pageGuide` 重置为 1，避免停留在上一时间范围的末页 | ✅ 已做 |
| **时间 Tab 无障碍** | 时间范围按钮组加 `role="tablist"`、`role="tab"`、`aria-selected`、`aria-controls` | ✅ 已做 |
| **脊签无障碍** | 脊签 `role="tablist"` / `role="tab"`；可见内页 `role="tabpanel"`，`aria-labelledby` / `aria-controls` 与 `id` 配对（`did-rank-board-tab-*` / `did-rank-board-panel-*`） | ✅ 已做 |
| **分页无障碍** | 分页区域加 `aria-label`、当前页用 `aria-current="page"`；分页用 `<nav>` | ✅ 已做 |
| **头像懒加载与占位** | 头像 `loading="lazy"`；`onError` 回退为首字母占位（`failedAvatarIds`） | ✅ 已做 |

### 8.2 数据与后端

| 项 | 说明 |
|------|------|
| **页面真正接 API** | 五签均已 HTTP：**travelers / guides / itineraries / providers / acquisitions**；失败 **不** **`didRankMockData` 运行时回退** — **`useDidRankData`** · **`useDidRankItineraryBoard`** · **`useDidRankSecondaryBoard`** + **`DidRankFetchErrorBanner`**；可选 **`devPreview`**（**§4.5**） |
| **后端实现排名接口** | **`GET /api/v1/did-rank/{travelers,guides,itineraries,providers,acquisitions}`** + **`prize-pool`**；**`limit=100`**；**`rank_basis`** 见 **04 附录 §2** |
| **「我的排名」与登录态** | 后端榜行 **`is_me`** + RSC **`serverForwardAuthHeaders`**（cookie → **`X-User-Id`**）SSR 首屏对齐 + URL **`?me=`** 深链；副榜/缓存策略扩展 → **②** |

### 8.3 可访问性（a11y）

| 项 | 说明 | 状态 |
|------|------|------|
| **列表语义** | 完整榜容器 `role="list"`，每行 `role="listitem"` + `aria-posinset` / `aria-setsize` | ✅ 已做 |
| **战绩展开按钮** | `aria-expanded` + `aria-controls` 指向展开内容 id | ✅ 已做 |
| **跳过主内容** | 主内容容器 `id="main-content"` 供全站 skip link | ✅ 已做 |
| **标题层级** | 确保 h1 → h2 层级清晰（当前已满足） | ✅ 已有 |

### 8.4 SEO 与分享

| 项 | 说明 | 状态 |
|------|------|------|
| **Open Graph / Twitter** | layout 中补充 `openGraph`、`twitter`（title、description） | ✅ 已做 |
| **结构化数据** | 对「前 10 旅行者/向导」输出 ItemList JSON-LD（name、position、numberOfItems），利于富结果 | ✅ 已做 |

### 8.5 性能与体验

| 项 | 说明 |
|------|------|
| **图片优化** | 头像用 Next.js `Image` 或统一 CDN 尺寸，减少 LCP；外链 Unsplash 可考虑代理或固定尺寸参数 |
| **首屏关键路径** | 若数据来自 API，可对首屏前 10 与第一页列表做优先请求或合并接口 |
| **虚拟滚动（可选）** | 若将来列表远超 100 条，可引入虚拟滚动替代分页，减少 DOM |

### 8.6 测试与质量

| 项 | 说明 | 状态 |
|------|------|------|
| **单元测试** | `lib/didRankUtils.test.ts`：分页（getTotalPages、getPaginatedSlice）、period 解析（parsePeriodParam）、getPageForRankIndex；页面已改用 didRankUtils | ✅ 已做 |
| **E2E** | 关键路径：进入页 → 切换时间 Tab → **切换脊签 `?board=`** → 副榜分页 → 点击向导进详情 → 「回到我的排名」 | **① Partial**（**`93-matrix-path-did-rank-boards`** 窄切片）；**② D6** 全路径 staging |
| **错误边界** | 页面级 Error Boundary（`app/did-rank/error.tsx`），赛博风样式 + 重试/返回首页 | ✅ 已做 |

### 8.7 分析与全站

| 项 | 说明 | 状态 |
|------|------|------|
| **埋点** | `lib/analytics.ts` 新增 `trackDidRankEvent`：`did_rank_view`（进入）、`did_rank_period_change`、`did_rank_go_to_my_rank`、`did_rank_guide_click` | ✅ 已做 |
| **旅行者详情入口** | 有效社区档案 UUID → **`/community/user/[id]`**；无档案纯文本 | **① Partial**；**② D9** |

### 8.8 DID 页当前问题与待优化（汇总）

**已修复（问题）**

| 项 | 说明 | 状态 |
|----|------|------|
| **API 失败与「示例数据」区分** | API 失败时设 `fetchError`，顶部展示 `ApiErrorAlert`（`didRank_loadError`）+ 重试按钮；成功或重试后清除。示例数据态（API 返回空）仍仅显示「当前为示例数据」+ 重试。 | ✅ 已修复 |
| **错误边界文案 i18n** | `app/did-rank/error.tsx` 使用 `useTranslation`，文案用 `didRank_errorTitle`、`didRank_errorFallback`、`didRank_retry`、`didRank_backToHome`（zh/en 已补）。 | ✅ 已修复 |
| **3D 背景** | **`Web3SciFiBackground`** 仍存在于 **`components/did-rank/`**，供其它场景复用；**`/did-rank` 页身已不再挂载**（**§4.1** 静态 CSS 叠层 + **`WarmRouteFieldBackdrop`**）。若将来重新启用，须同步 **88 / 13-1 表 1**。 | ✅ 与实现对齐（2026-03） |

**可优化（体验与规范）**

| 项 | 说明 |
|----|------|
| **「回到我的排名」滚动稳定性** | 当前依赖 `setTimeout(..., 100)` 在分页切换后滚动；可改为 `useEffect` 监听 `pageTraveler`/`pageGuide` 与 `highlightTravelerId`/`highlightGuideId`，在对应行已挂载后再 `scrollIntoView`，或使用 `requestAnimationFrame` 延后一帧。 |
| **E2E 关键路径** | 规范 8.6 列 E2E 为「待做」；可补充：进入页 → 切换时间 Tab → 分页 → 点击向导进详情 → 「回到我的排名」。 |
| **头像与 LCP** | 已用 Next.js `Image` 与 `loading="lazy"`；外链头像可确认尺寸与 CDN，必要时用 `sizes` 或代理优化 LCP。 |
| **规范与实现同步** | §4.3 排名追赶已注明「已移除」；§0.1/§8.2 与 API 对齐：**旅行者**已完成订单数、**向导**接待金额合计 + 完成单数（`reception_gross_total` / `reception_count`）；**书脊布局与 framer 翻页** 见 **§1、§4.3、§6**。 |

---

**文档版本**：**2.2.3**（2026-06-03：**代码为准** — SSR **`is_me`**（**`serverForwardAuthHeaders`**）· **`didRankDevPreviewGate`** 生产硬关；互链 **DID-RANK-PHASE1-FREEZE** **P1-DR-12** / **P1-DR-PREVIEW-GATE**）  
**文档版本**：**2.2.2**（2026-06-03：**代码为准** — **五签** + **`?board=itinerary`** Top10；五端点 HTTP、失败不 mock；档案 **`/community/user/[id]`**；互链 **DID-RANK-PHASE1-FREEZE** / **DID-RANK-COMMUNITY-L5-AUDIT-TASKS**）  
**文档版本**：**2.2.1**（2026-05-26：**§4.2 / §6** — 商家/旅行收购榜 **① UI 已挂载**勘误；与 **`AcquisitionRankBlock`** / **FIVE-MAIN-ROUTES** 对拍；**未改前端**）  
**文档版本**：**2.2**（2026-05-25：**§0.1 / §3.1 / §3.2 / §7.1 / §7.2** 与 **① 壳层 L5**、**04 附录 §3.2（② D1～D9）** 对齐；副榜 HTTP + Top10+分页同构；**§7.2** 增 **L5 双层** 互指）
此前 **2.0**（2026-04-19：**四签** 旅行收购 **UI** 落地（**`AcquisitionRankBlock`**、**`?board=acquisition`**）；**§7.1** 前端/后端/DB 待办表；**§0.1 / §1 / §3.2 / §4.3 / §5 / §6 / §7** 与实现对齐；互链 **87 §1.4**、**04 附录 §1.2** **1.23**）  
此前 **1.9**（2026-04-17：**旅行收购** 脊签与榜单 **Target** 叙事；**`?board=acquisition`** 预留文案）  
此前 **1.8**（2026-04-04：**§1 / §4.2～4.3 / §5～§6** 与 **书壳 + 竖脊 + `framer-motion` 内页翻页**、`?board=`、**`loading.tsx` 同构** 对齐；**行程通栏** 从前端页移除说明写入 **§0.1**；**商家**「占位」为 **历史** — **§3.1** 现行 **① UI 已挂载** + **② Partial**）  
此前 **1.7**（2026-03-30）：**§4.1 / §6** 与 **`WarmRouteFieldBackdrop` + 静态赛博叠层** 实现真值对齐，链 **[88](88-五主路由页身实现快照与UX缺口审计-20260330.md)**。  
**§7** 已全部完成；**§8** 为还可优化方向清单，**§8.8** 为当前问题与优化汇总，按需排期实施。
