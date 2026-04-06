# 30 · DID 排行榜页面规范

**Status:** 产品与 UI 定稿  
**定位**：DID 排行榜为**书脊 + 单页内容区**：左侧竖向 **脊签**（旅行者 / 向导 / 商家）切换榜单；右侧**内页框**同一时间只展示一栏内容，切换时带**横向翻页感**动效（见 **§1、§4.3**）。突出链上/托管消费与接待战绩，类音乐排行榜信息层级。  
**风格定稿**：**Web3 赛博朋克**（动感、科技、霓虹），见 §4；本页与 28/29 旅行玻璃态区分，仅 DID 排行榜采用此风格。  
**配套**：[28-Cinematic-Glassmorphism-Web3融合规范](28-Cinematic-Glassmorphism-Web3融合规范.md)、[29-自由市场-撮合控制台规范](29-自由市场-撮合控制台规范.md)、[13-1-UI产品级SSOT与页面规范](13-1-UI产品级SSOT与页面规范.md)。本页风格以本文 §4 为准。

**API 与排序 SSOT**（与实现对齐）：[04-附录-did-rank对接说明](04-附录-did-rank对接说明.md) §2；响应含 `period` / `since` / `limit` / **`rank_basis`**。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **排序主键、`rank_basis`、与 UI 主指标关系** | **§0.1**；契约 **[04-附录-did-rank](04-附录-did-rank对接说明.md) §2** |
| **书壳 + 脊签 + 内页翻页布局与动效** | **§1、§4.3** |
| **旅行者榜 / 向导榜 / 商家占位** | **§2、§3**（商家见 **§3.1**） |
| **赛博朋克视觉（与 28 区分）** | **§4** |
| **路由、URL 参数与实现** | **§5、§6** |
| **同风格社区页** | **[31](31-TT社区页面设计.md)**（复用 **30 §4**） |

---

## 0.1 排序与数据口径（与后端一致）

| 维度 | 说明 |
|------|------|
| **旅行者榜** | 按所选 `period` 窗口内 **已完成订单数**（订单 `completed_at` 且 `status=completed`）降序；细则与 `rank_basis` 见 04 附录。 |
| **向导榜** | 按窗口内 **已完成订单金额合计**（`orders.amount` 之和）降序，同分按 **完成单数**，再按用户创建时间；API 含 `reception_gross_total` / `reception_count`；`rank_basis`=`guide_reception_gross_total_then_completed_count`。 |
| **行程榜**（`GET …/did-rank/itineraries`） | 按关联订单 **完成时间**；无完成单时回退 **行程创建时间**（`rank_basis` 标明 fallback）。**当前 `/did-rank` 页不展示通栏行程榜**（后端与 `getDidRankItineraries` 仍保留，供其它入口或后续产品恢复）。 |
| **商家榜**（脊签） | 前端 **占位** UI（`ProviderRankBlock`）；排序与数据接口以产品后续定稿为准。 |
| **展示字段** | UI 仍可突出 **USDT 消费、接待金额、国家/城市数** 等，作为 **辅助指标**；**排序以 API 返回的 `rank` 与 §0.1 为准**，不必与单笔金额字段一致。 |

---

## 1. 页面布局

| 区域 | 说明 |
|------|------|
| **奖金池** | 页面最上：**奖金池**区块，说明每月奖励排行榜前 10 名、以治理币发放；展示本月池子总量（占位可接链上/后端）；风格与 §4 一致（霓虹青/品红/琥珀高亮） |
| **顶部** | 标题「DID排行榜」+ 简短说明（链上消费/接待可验证）；可与 28 玻璃 Hero 一致 |
| **主内容（书壳）** | **外层书壳**：圆角边框、浅 inset 高光、与页身赛博底对比。**左侧竖脊**（`role="tablist"`）：**旅行者**、**向导**、**商家** 三按钮纵向排列；大屏时脊部与内容区横排，小屏时脊在上、内容在下。**右侧内页框**：`min-h` 约 `min(520px, 72vh)`、`overflow` 裁剪，内部 **单时刻只展示当前脊签对应榜单**（`TravelerRankBlock` / `GuideRankBlock` / `ProviderRankBlock`）。 |
| **翻页动效（脊签切换）** | 在内页框内使用 **`framer-motion`**：`AnimatePresence` + `motion.div`，`key={activeBoard}`；进场/退场为 **横向位移** + 轻 **`rotateY`** + **模糊**，父级 **`perspective`** 增强立体感；按脊签顺序 **旅行者 → 向导 → 商家** 推导前后方向（`slideDir`）。**首次进入本页**对默认榜 **不播入场翻页**（`initial={false}` 于首屏），避免闪动；仅 **切换脊签** 时播放。**`useReducedMotion()`** 为真时改为极短 **淡入淡出**（与 **§4.3** 一致）。 |
| **每榜结构（内容区内）** | 上半：**前 10 名横板**（横向卡片，突出头像、排名、核心指标）；下半：**竖版 11～100 名**（列表式，不重复前 10；排名 + 头像 + 昵称 + 指标，类音乐排行榜） |

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

### 3.1 商家榜（脊签：商家）

占位区块：文案与空态说明以 `ProviderRankBlock` + `locales` `didRank_*` 为准；不接排序数据前不冒充真实排行。

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
| **页面标题** | 渐变字 `from-cyan-300 via-cyan-400 to-fuchsia-400`、`bg-clip-text text-transparent` |
| **徽章** | Polygon：`border-cyan-400/50`、`bg-cyan-400/10`、`text-cyan-300`；USDT/USDC：`border-fuchsia-400/50`、`bg-fuchsia-400/10`、`text-fuchsia-300` |
| **面板** | `bg-slate-900/70`、`backdrop-blur-md`、霓虹边框 + `shadow-[0_0_20px_...]`；hover 时边框与阴影加强 |

### 4.3 动效

| 元素 | 约定 |
|------|------|
| **脊签切换 · 内页翻页** | **`framer-motion`**（项目依赖见 `frontend/package.json`）：`AnimatePresence` `mode="wait"`；`motion.div` 绑定 `activeBoard` 为 `key`；进退场 **`custom={slideDir}`** 与变体中 **`x` / `rotateY` / `opacity` / `filter: blur`** 组合；父容器 **`perspective`**（约 1200px 量级）。**`useReducedMotion()`**：缩短时长或仅用透明度切换。实现真值 **`frontend/app/did-rank/page.tsx`**（`didRankFlipTransition`、`didRankPageVariants`、`usePreviousDidRankBoard`）。 |
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
- 数据来源：**优先** `getDidRankTravelers` / `getDidRankGuides`（`?period=`；向导侧 API **`sort=weighted`** 与实现对齐）；失败或降级时回退 `didRankMockData.ts`；页头 pill 区分「实时 API」与未完整连通（见 `DidRankHeader`）。**行程榜**接口仍存在于后端与 client，**当前页不拉取 itineraries 列表**。

---

## 5. 路由与入口

- **路由**：`/did-rank`（与 05、Header 导航「DID排行榜」一致）
- **查询参数**：**`?board=traveler|guide|provider`**（默认 **traveler**），与 **`parseDidRankBoardParam`**（`frontend/lib/didRankUtils.ts`）一致；**`?period=week|month|all`**、**`?me=traveler-<uuid>` / `guide-<uuid>`** 高亮与分页行为不变。
- **SEO**：layout 内 `title`、`description` 含 DID 排行榜、旅行者/向导排名

---

## 6. 实现与优化

**颜色与风格以 §4 为准**；**§4.1 页身背景栈**以仓库 **`did-rank/page.tsx` + `WarmRouteFieldBackdrop` + `globals.css` `.bg-scifi-gradient-static`** 为真值（**88**）。

| 项 | 落点 |
|------|------|
| **页面** | `frontend/app/did-rank/page.tsx`：**书壳 + 竖脊 + 内页框**；脊签切换 **`framer-motion`** 翻页（**§1、§4.3**）；子块 **`TravelerRankBlock`** / **`GuideRankBlock`** / **`ProviderRankBlock`**：前 10 横板、竖版 11～100（不重复前 10）；霓虹语义 **§4.2** |
| **动效** | **`framer-motion`**：脊签切换（上表）；`globals.css`：榜单 **`animate-did-glow`** / **`animate-did-glow-fuchsia`** 等仍可用；**页身**不再使用 **`animate-did-gradient` / `animate-did-bg`** 驱动整屏背景（见 **§4.1**） |
| **Loading** | `frontend/app/did-rank/loading.tsx`：与 **§1** 书壳布局对齐的骨架 |
| **SEO** | `frontend/app/did-rank/layout.tsx`：title、description |
| **假数据** | `frontend/lib/didRankMockData.ts`：旅行者/向导各 100 条，消费 USDT、国家/城市数、接待次数/总金额 |
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
| **数据** | 接入真实 API | **`/did-rank` 页**使用 `getDidRankTravelers` / `getDidRankGuides`；**`getDidRankItineraries`** 仍存在于 **apiClient**，供其它场景；**页内不拉行程榜**（**§0.1**） | ✅ 已对接 |
| **性能** | 完整榜分页 | 完整榜每页 20 条，上一页/下一页；减轻 DOM | ✅ 已做 |
| **交互** | 「我的排名」高亮 | URL 支持 `?me=traveler-5` 或 `?me=guide-3`，对应行高亮；栏内按钮「回到我的排名」先切页再滚动到该行 | ✅ 已做 |
| **交互** | 时间范围 Tab | 本周 / 本月 / 全部 Tab，当前用 mock 数据；后端就绪后可按 period 拉取 | ✅ 已做 |
| **交互** | 点击跳转详情 | 向导榜：前 10 卡片与列表行均链至 `/guides/[id]`；旅行者暂无用户页，未加链接 | ✅ 已做 |
| **交互** | 战绩展开（可选） | 旅行者前 10 卡片与列表行支持「战绩」展开/收起，展示国家、城市列表 | ✅ 已做 |
| **多语言** | 文案 i18n | 页面文案走 `locales`：`didRank_*`（zh.ts / en.ts），标题、Tab、按钮、分页等均已接入 | ✅ 已做 |
| **移动端** | 间距与横板列数 | 小屏 `px-3 py-6`、`gap-2`、横板 `grid-cols-2`、头像/文字略缩、分页与「回到我的排名」同栏折行 | ✅ 已做 |
| **布局** | 书脊三签 + 单页翻页 | 竖脊 **旅行者/向导/商家**；内页 **`AnimatePresence`** 切换；URL **`?board=`**；**loading** 同构 | ✅ 已做（2026-04） |

---

## 8. 还可优化的方向（清单）

在 §7 已全部完成的前提下，以下为**后续可逐步做的优化**，不改变 §4 风格；按优先级与资源选做。

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
| **页面真正接 API** | 页内已接 **`getDidRankTravelers` / `getDidRankGuides`**；**`getDidRankItineraries`** 非本页路径（**§0.1**）；mock 回退策略见 `page.tsx` |
| **后端实现排名接口** | 后端提供 `GET /api/v1/did-rank/travelers?period=`、`/guides?period=`，返回与 mock 同构或兼容结构 |
| **「我的排名」与登录态** | 若需自动高亮当前用户：从登录态/钱包取 identity，后端在排名数据中返回 `is_me` 或前端用 identity 匹配 |

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
| **E2E** | 关键路径：进入页 → 切换时间 Tab → **切换脊签 `?board=`** → 分页 → 点击向导进详情 → 「回到我的排名」 | 待做 |
| **错误边界** | 页面级 Error Boundary（`app/did-rank/error.tsx`），赛博风样式 + 重试/返回首页 | ✅ 已做 |

### 8.7 分析与全站

| 项 | 说明 | 状态 |
|------|------|------|
| **埋点** | `lib/analytics.ts` 新增 `trackDidRankEvent`：`did_rank_view`（进入）、`did_rank_period_change`、`did_rank_go_to_my_rank`、`did_rank_guide_click` | ✅ 已做 |
| **旅行者详情入口** | 若有用户/个人公开页或「发现该用户的行程」能力，可为旅行者榜增加跳转链接 | 待做 |

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

**文档版本**：1.8（2026-04-04：**§1 / §4.2～4.3 / §5～§6** 与 **书壳 + 竖脊 + `framer-motion` 内页翻页**、`?board=`、**`loading.tsx` 同构** 对齐；**行程通栏** 从前端页移除说明写入 **§0.1**；**商家** 占位见 **§3.1**）  
此前 **1.7**（2026-03-30）：**§4.1 / §6** 与 **`WarmRouteFieldBackdrop` + 静态赛博叠层** 实现真值对齐，链 **[88](88-五主路由页身实现快照与UX缺口审计-20260330.md)**。  
**§7** 已全部完成；**§8** 为还可优化方向清单，**§8.8** 为当前问题与优化汇总，按需排期实施。
