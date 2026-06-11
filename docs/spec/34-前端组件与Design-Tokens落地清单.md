# 34 - 前端组件与 Design Tokens 落地清单

**Version:** 1.0.4  

**用途**：在 [33-前端页面实现顺序与验收清单](33-前端页面实现顺序与验收清单.md) 按页面推进的同时，将 [22-Design-Tokens](22-Design-Tokens-旅游Web3融合体系-v1.0.md)（**含 [86](86-UI-双系统未来风-风格与动效技术规格.md)→22 [§一点五](22-Design-Tokens-旅游Web3融合体系-v1.0.md) 色谱映射**）与 [28/29](28-Cinematic-Glassmorphism-Web3融合规范.md)、[23](23-UI交付物-Figma-Landing-Escrow模板.md) 的**组件与 Token 代码落点**整理为可执行清单；支撑 33 各页组件一致、全站视觉单源，并与 27 P8 门禁、36 测试、37 i18n/a11y 衔接。**换肤/风格**（含配色）优先只动 **globals.css / tailwind / 类名**，**不改** 组件行为与路由（**86 篇首「定稿口径」**）。

**受众与用法**：前端负责人、开发与 QA；实现或评审时按 §二 Token 落点与 §三 组件清单逐项核对；与 33 可同迭代（34 支撑页面组件一致）。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **与 32/33/22/28/86 关系** | **§一** |
| **globals / tailwind Token 落点与禁止类名** | **§二** |
| **按页面的组件清单与实现状态** | **§三**（及后文随小标题） |
| **Token 数值 SSOT** | **[22](22-Design-Tokens-旅游Web3融合体系-v1.0.md)** |
| **Experience 视觉与动效** | **[86](86-UI-双系统未来风-风格与动效技术规格.md)**（**§0.2～§0.4**） |
| **Experience 组件清单与叙事** | **[28 §5、§8](28-Cinematic-Glassmorphism-Web3融合规范.md)** |
| **五主路由 ① UI 壳（2026-05-25）** | **[FIVE-MAIN-ROUTES](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)** · **88 §一** · **`TT_MARKETING_*`**（**`lib/marketingUi.ts`**） |

---

## 一、文档定位与上下游

| 维度 | 说明 |
|------|------|
| **与 32** | 32 §二 为设计→代码映射总表；34 将「组件与 Tokens」展开为**可勾选落地清单**与**实现状态表**。 |
| **与 33** | 33 定页面顺序与每页验收；34 定**每页依赖的组件与 Token** 是否已实现、是否单源。34 与 33 可并行：33 做页面时按 34 取组件。 |
| **与 22** | 22 为 Token 数值与语义的**单源**；34 §二 为 22 在代码中的**落点**（globals.css、tailwind.config.ts）。 |
| **与 28/29/86** | **28** §5 组件清单、§8 实现状态；**29** 自由市场组件；**86** Experience 外观与 **22 §一点五** 映射。34 §三 将 28/29/23 组件列为**可复用组件清单**并维护实现状态。 |
| **与 35/36/37** | 35 DApp/钱包验收、36 前端测试、37 i18n/a11y；34 组件与 Token 稳定后，35/36/37 在此基础上做钱包/用例/无障碍核对。 |

**执行顺序建议**：32 设计→代码映射 → 33 页面顺序与验收 → **34 组件与 Tokens 落地**（可与 33 同迭代）→ 35 DApp 验收、36 测试、37 i18n/a11y。

---

## 二、Design Tokens 落地（22 单源）

### 2.1 单源原则与禁止项

全站仅用 **22 Design Tokens 键名**（[22](22-Design-Tokens-旅游Web3融合体系-v1.0.md)；**Hex 随 86 经 [22 §一点五](22-Design-Tokens-旅游Web3融合体系-v1.0.md) 映射**）；**28** 定叙事与禁止裸色纪律；禁止裸色与旧类名。**Experience** 区允许 **86** 规定的 **克制** 渐变/glow（**非资金 UI**；**13 §一 1️⃣**）。

| 类型 | 必须使用 | 禁止使用 |
|------|----------|----------|
| **文字色** | `text-ink-*`、`text-travel-500`、`text-success`/`warning`/`danger`、`text-meta` | `text-gray-*`、`text-blue-*`、`text-red-*`、`text-green-*` |
| **背景** | `bg-bg-main`、`bg-bg-console`、`bg-bg-soft`、Experience 区玻璃 `bg-white/xx` | 裸 `bg-white`（**例外**：Hero 主 CTA、Experience 玻璃）、`bg-gray-*`、`bg-slate-*`、`bg-amber-*` |
| **圆角** | `rounded-[var(--radius-sm)]`（6px）、`radius-md`（12）、`radius-lg`（20）、`radius-xl`（32） | `rounded-md`、`rounded-lg` 等未走变量的裸类 |
| **阴影** | `shadow-soft`、`shadow-medium`、`shadow-strong`（对应 CSS 变量） | 自定义裸 rgba 阴影；**发光边框** 仅 **Experience 非资金区**（**86**、**13**） |
| **状态** | `success`、`warning`、`danger`、`info` 仅用于状态语义 | 用于装饰或非状态 |

**例外（写死）**：**Landing（`/`）正文** 玻璃容器仍可用 `bg-white/15`、`backdrop-blur-xl` 等（**28**）；**L0 顶栏** 按路径 Home/Cinematic/Dark/Light（**86 §6.0** · **`uiSystem.ts`**），**不**再全路由白底或 Experience 玻璃顶栏。Hero 主 CTA 可 `bg-white`；金额/地址用 `font-mono`、`letter-spacing` 按 22 §三。

### 2.2 代码落点与文件映射

| Token 类别 | 22 章节 | 代码落点 | 说明 |
|------------|---------|----------|------|
| **颜色（Travel/Trust/状态/背景/ink）** | 22 §二、§二.4 | `app/globals.css` 的 `:root`、`.dark`；`tailwind.config.ts` 的 `theme.extend.colors` | 仅通过 CSS 变量与 Tailwind 扩展引用，禁止硬编码 hex |
| **圆角** | 22 §五 | `globals.css` 的 `--radius-sm/md/lg/xl`；`tailwind.config.ts` 的 `borderRadius` | 6/12/20/32 px |
| **阴影** | 22 §六 | `globals.css` 的 `--shadow-soft/medium/strong`；`tailwind.config.ts` 的 `boxShadow` | Experience 可用 medium；Escrow 仅 soft |
| **字体** | 22 §三 | `globals.css` 的 `--font-sans`；`tailwind.config.ts` 的 `fontFamily`、`fontSize`（h1～h4、body-l、body、small、meta） | 金融区金额 600、letter-spacing -0.5px |
| **动效** | 22 §八、28 §4 | `globals.css` 的 `.motion-main`（600ms）、`.motion-sub`（250ms）；`tailwind.config.ts` 的 `animation`（fadeUp、fadeIn） | Escrow 禁止数字跳动、发光 |

### 2.3 Token 落地验收勾选表

实现或 Code Review 时按下列项勾选；全部通过视为 **22 单源** 已落地。

| □ | 验收项 | 核对方式 |
|----|--------|----------|
| ✓ | 全站无 `text-gray-*`、`text-blue-*`、`text-red-*`、`text-green-*` | 全局搜索或 ESLint 规则 |
| ✓ | 全站无裸 `bg-white`（除 28 规定例外） | 搜索 `bg-white`，仅 Hero CTA / 玻璃区允许 |
| ✓ | 全站无 `rounded-md` 等未走变量的圆角 | 统一为 `rounded-[var(--radius-sm)]` 或 tailwind 扩展（已用 theme 扩展） |
| ✓ | `globals.css` 的 `:root` 含 travel/trust/ink/状态/背景/radius/shadow/font | 与 22 §二～§六、§三 一致 |
| ✓ | `tailwind.config.ts` 的 colors/radius/shadow/font 仅引用 CSS 变量或 22 规定值 | 无硬编码 hex（除 ink 若已写死） |
| ✓ | Experience 区（Landing / **`/discover`→`/market` 重定向壳** / **`/market`** 卡片）可用 glass（backdrop-blur、bg-white/xx）；Escrow/Dispute 无玻璃 | 28 三层融合 |

**说明**：30/31（DID 排行榜、TT 社区）采用赛博风调色板（slate/amber/cyan/fuchsia），与 22 单源并行约定，该区 `bg-slate-*`/`bg-amber-*` 等为设计例外，不作为裸色违规。

---

## 三、可复用组件清单与实现状态

以下组件来自 [28 §5](28-Cinematic-Glassmorphism-Web3融合规范.md)、[29](29-自由市场-撮合控制台规范.md)、[23](23-UI交付物-Figma-Landing-Escrow模板.md)；**实现状态** 需随开发更新。

### 3.1 Experience 内嵌（28 §5 低声）

| 组件名 | 规范来源 | 代码路径 | 用途 | 实现状态 □ | 备注 |
|--------|----------|----------|------|------------|------|
| **TrustBadgesRow** | 28 §3、§8.1 | `components/trust/TrustBadgesRow.tsx` | Hero 下三徽章：Non-custodial · On-chain escrow · Dispute support | ✓ | 支持 zh/en |
| **TrustInfraWall** | 28 §8.1 | `components/trust/TrustInfraWall.tsx` | Polygon · USDC · WalletConnect · Audited；Landing 第三屏、Market 页脚 | ✓ | |
| **EscrowEnabledBadge** | 28 §3、§8.1 | `components/trust/EscrowEnabledBadge.tsx` | 卡片角标「Escrow-enabled」 | ✓ | |
| **SupportedTokensPill** | 28 §3、§8.1 | `components/trust/SupportedTokensPill.tsx` | 小 pill：USDC / Polygon | ✓ | |
| **WalletStatusMini** | 28 §2.C、§8.1 | `components/trust/WalletStatusMini.tsx` | 顶栏右侧 Wallet（Connected / Wrong network） | ✓ | Header 集成 |
| **AgreementSummaryAccordion** | 28 §2.B、§8.1 | `app/itinerary/new/page.tsx` 内联或可抽组件 | 预算区底部折叠：token、total、platformFee、snapshotHash、release conditions | ✓ | 默认折叠 |

### 3.1a Landing `/`（Web3 旅行 · ① 代码 SSOT）

| 组件名 | 规范来源 | 代码路径 | 用途 | 实现状态 □ | 备注 |
|--------|----------|----------|------|------------|------|
| **page.tsx 页壳** | 88 §一、25 | `app/(home)/page.tsx` | Ken Burns 叠层 + Hero→结果区分隔 + 页脚顶 fade | ✓ | **`TT_MARKETING_HOME_*`** · **`SECTION_BRIDGE`** · **`FOOTER_TOP_FADE`** |
| **LandingHomeAmbientBackdrop** | 88、25 | `components/landing/LandingHomeAmbientBackdrop.tsx` | 十国摄影 Ken Burns 底 | ✓ | **`landingAmbientByCountry.ts`** |
| **LandingHeroForm** | 28、25、86 §6.1 | `components/landing/LandingHeroForm.tsx` | 中央玻璃规划表单（`#landing-hero-form`） | ✓ | **`TT_MARKETING_HOME_SUBMIT_FAB`** |
| **useLandingPage** | 04 P15、53 | `components/landing/useLandingPage.ts` | **1×** `postItineraryCreate`；解锁 **`getOrder`** | ✓ | contract 禁止循环 POST |
| **ItineraryResultsSection** | 25、28 | `components/landing/ItineraryResultsSection.tsx` | **1** 预览卡（**`ITINERARY_CARD_COUNT=1`**） | ✓ | 链 **`/escrow/[id]`** |
| **UnlockModal** | 25、13 资金边界 | `components/landing/UnlockModal.tsx` | 预览解锁确认（① 非真 USDC） | ✓ | |
| **LandingFooter** | 28、86 | `components/landing/LandingFooter.tsx` | 冷灰页脚 + **TrustInfraWall** | ✓ | **`TT_MARKETING_HOME_FOOTER_*`** |
| **landingItinerarySession** | — | `lib/landingItinerarySession.ts` | **`localStorage`** 恢复卡态（跨 tab · 旧 session 迁移） | ✓ | |
| **marketFavoritesStorage** | 29 H-L5 · F-020 ② | `lib/marketFavoritesStorage.ts` | **`/` + `/market`** 订单/向导收藏 SSOT · 跨 tab | ✓ | **F-020 best-effort 已接线（①）** |

互指 **[`(home)/README`](../../frontend/app/(home)/README.md)** · **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · **[GO_local_web3_itinerary_l5](../../frontend/evidence/GO_local_web3_itinerary_l5/README.md)**。

### 3.2 自由市场（29 撮合控制台）

| 组件名 | 规范来源 | 代码路径 | 用途 | 实现状态 □ | 备注 |
|--------|----------|----------|------|------------|------|
| **ViewSwitcher** | 29 §2.1 | `components/market/ViewSwitcher.tsx` | Split / Orders / Guides 视图切换 | ✓ | |
| **StickyFilterBar** | 29 §2.1 | `components/market/StickyFilterBar.tsx` | 国家/城市/语言/服务类型筛选 | ✓ | |
| **OrderCard** | 29 §3.1 | `components/market/OrderCard.tsx` | 订单卡片：目的地、状态、报价、Escrow pricing、动作 | ✓ | 含 EscrowEnabledBadge、SupportedTokensPill |
| **GuideCard** | 29 §4.1 | `components/market/GuideCard.tsx` | 向导卡片：头像、城市、语言、信任信息、报价、动作 | ✓ | |
| **OrderDetailDrawer** | 29 §3.2 | `components/market/OrderDetailDrawer.tsx` | 订单详情抽屉：预算表、Agreement Summary 折叠、CTA | ✓ | |
| **GuideDetailDrawer** | 29 §4.2 | `components/market/GuideDetailDrawer.tsx` | 向导详情抽屉：套餐、评价、邀请接单 | ✓ | |
| **EmptyState** | 29、13-1 | `components/market/EmptyState.tsx` | 空订单/空向导/无匹配 | ✓ | |
| **MarketSkeleton** | 29 | `components/market/MarketSkeleton.tsx` | 订单/向导列表加载骨架 | ✓ | |
| **useMarketPage** | 29 · 94 | `components/market/useMarketPage.ts` | URL 筛选 · **300ms debounce** · 收藏 **`localStorage`** | ✓ | **`marketPageQuery.ts`** |
| **MarketHubSubNav** | 94 §9.0 L1 | `components/market/MarketHubSubNav.tsx` | **`/market` / provider / acquisition** 三签 | ✓ | |
| **MarketStandaloneBusinessPage** | 94 | `components/market/MarketStandaloneBusinessPage.tsx` | 子站 provider/acquisition 共用壳 | ✓ | **`marketSubsiteFilters.ts`** |

**四页代码 SSOT：** **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §3～§5

### 3.3 Console 专属（28 §5 银行级）

| 组件名 | 规范来源 | 代码路径 | 用途 | 实现状态 □ | 备注 |
|--------|----------|----------|------|------------|------|
| **SignatureModal** | 28 §2.C、§8.1、13-1 | `components/escrow/EscrowDetail/EscrowTxModal.tsx` | 链上操作签名：chainId、contract、amount、token、snapshotHash、finalityN、platformFeeBps；**不用玻璃** | ✓ | 白底、字段完整 |
| **StatusBadge** | 28、13-1 | `components/escrow/StatusBadge.tsx` | 订单/托管状态徽章 | ✓ | |
| **FinalityBadge** | 28 §8.3 | `components/escrow/FinalityBadge.tsx` | 终局状态标识（如「已终局 N 块」） | ✓ | |
| **OnchainEventTimeline** | 28 §8.3 | `components/escrow/OnchainEventTimeline.tsx` | 链上事件时间线 | ✓ | |
| **TxMachineStatus** | 28 §8.3、13-1 | `components/escrow/TxMachineStatus.tsx` | 交易状态机展示 | ✓ | |
| **EscrowDetail** | 28 §8.1、23 §七、80 | `components/escrow/EscrowDetail/`（`index.tsx`） | **双壳**：① **Experience** 草稿（`experienceDraft` · **UI 冻结** [`ESCROW-DRAFT-EXPERIENCE-FREEZE`](../frontend/evidence/GO_local_web3_itinerary_l5/ESCROW-DRAFT-EXPERIENCE-FREEZE.md)）；② **协议 DID**（已上链 · deposit/争议） | ✓ | 路径为目录非单文件；见 [`EscrowDetail/README`](../frontend/components/escrow/EscrowDetail/README.md) |

### 3.4 通用与布局

| 组件名 | 规范来源 | 代码路径 | 用途 | 实现状态 □ | 备注 |
|--------|----------|----------|------|------------|------|
| **Header** | 28、05、86 | `components/Header.tsx` | 顶栏：字标、导航、语言、WalletStatusMini、登录/注册 | ✓ | L0 **分层顶栏**（**`uiSystem.ts`** · **86 §6.0**）；**WalletStatusMini** **`variant="dark"`** |
| **LoadingText** | 13-1、30-UX | `components/LoadingText.tsx` | 统一加载文案（i18n） | ✓ | |
| **ApiErrorAlert** | 13-1 异常态 | `components/ApiErrorAlert.tsx` | API 错误提示与重试 | ✓ | |

### 3.5 组件与页面映射（33 用到的组件）

| 33 页面 | 依赖的 34 组件（主要） |
|---------|------------------------|
| Landing | **`LandingHomeAmbientBackdrop`**、**LandingHeroForm**、**`TT_MARKETING_HOME_SECTION_BRIDGE`**、**useLandingPage**、**ItineraryResultsSection**、**UnlockModal**、**`landingItinerarySession`**、**`marketFavoritesStorage`**、**`TT_MARKETING_HOME_FOOTER_TOP_FADE`**、**LandingFooter**、TrustInfraWall、Header、WalletStatusMini |
| Discover（→/market） | 同 Market |
| 自由市场 /market | **useMarketPage**、ViewSwitcher、StickyFilterBar、OrderCard、GuideCard、OrderDetailDrawer、GuideDetailDrawer、EmptyState、**`marketFavoritesStorage`**、EscrowEnabledBadge、SupportedTokensPill、TrustInfraWall |
| Itinerary | AgreementSummaryAccordion（费用明细下）、表单与结果区 |
| OrderFlow | 步骤条/状态、金额、签名入口（EscrowDetail 内） |
| Escrow Detail | EscrowDetail、StatusBadge、FinalityBadge、OnchainEventTimeline、TxMachineStatus、SignatureModal |
| Dispute | 时间线、证据列表、裁决表单（可复用或独立） |
| DID 排行榜 | **书脊 + 单内页**、**`framer-motion` 翻页**、赛博风背景（**30 §1、§4.3**） |
| TT 社区 | Feed 卡片、发帖/评论抽屉、**L1** 壳（31、**88**） |

---

## 四、开发步骤与执行顺序（34 在流程中的位置）

| 步骤 | 工作内容 | 产出/完成标准 |
|------|----------|----------------|
| **1. 确认 Token 单源** | 核对 §2.2 落点：globals.css、tailwind.config.ts 与 22 一致；无禁止项（§2.1） | §2.3 验收表勾选通过 |
| **2. 组件清单与状态** | 按 §3 逐组件核对：路径存在、Props/行为符合 28/29；缺失则实现或标注「待实现」 | §3 各表「实现状态」列可勾选 |
| **3. 与 33 并行** | 33 做某页时，从 §3.5 取该页依赖组件；若组件未就绪则先做 34 该组件再继续 33 | 页面与组件一致、无裸色 |
| **4. 清除裸色与旧类名** | 按 28 §8.2 清除清单：全仓库搜索 gray/blue/red/white（例外除外）、rounded-md 等，改为 22 token | 28 §8.2 涉及范围无违规 |
| **5. 门禁与后续** | 34 闭环后作为 P8 门禁输入之一；进入 35（DApp/钱包）、36（测试）、37（i18n/a11y） | 与 27 P8、36/37 衔接 |

**小结**：先 Token 单源（§二）→ 组件清单与状态（§三）→ 与 33 页面同步使用 → 清除清单 → 门禁。34 可与 33 同迭代推进。

---

## 五、验收与门禁

### 5.1 34 自身验收标准

- **Token**：§2.3 六项全部勾选；全站无禁止类名（可辅以脚本或 ESLint 规则）。
- **组件**：§3 所列 Experience/市场/Console/通用组件均存在且行为符合 28/29/23；Escrow 区无玻璃、无霓虹。
- **映射**：32 §2.2 设计→代码映射表中与「组件与 Tokens」相关的行，在 34 §2.2、§3 中均有对应落点与状态。

### 5.2 与 27 P8 的关系

| 27 门禁 | 34 贡献 |
|---------|----------|
| P8 Phase 4 门禁（一） | 34 组件与 Tokens 落地清单已执行且 §2.3、§3 状态已勾选，可作为「前端与 05/13-1/22/28 一致性」的一部分。 |

### 5.3 清除清单速查（28 §8.2）

- **禁止类名**：`text-gray-*`、`text-red-*`、`text-blue-*`、`text-green-*`、`bg-gray-*`、`bg-emerald-*`、`bg-slate-*`、`bg-amber-*`、裸 `bg-white`（例外：Hero CTA、Experience 玻璃）、`rounded-md`。
- **涉及范围**：`app/*`、`components/Header.tsx`、`components/trust/*`、`components/market/*`、`components/escrow/*`、`ApiErrorAlert`、`LoadingText` 等。**例外**：`app/community/*`、`app/did-rank/*` 为 30/31 赛博风，使用 slate/amber/cyan/fuchsia 为设计约定，不纳入清除。
- **替换规则**：文字色→ ink/travel/状态色；背景→ bg-main/soft/console 或 22 规定；圆角→ `rounded-[var(--radius-sm)]` 或 tailwind 扩展。

---

## 六、多维度检查（广度与深度）

以下维度在 34 执行或评审时可一并核对，避免只做「清单打勾」而忽略一致性。

| 维度 | 检查要点 | 参考 |
|------|----------|------|
| **Token 单源** | 全站仅 22 token；无裸色；CSS 变量与 tailwind 扩展一致 | §2、22、28 §8.2 |
| **三层融合** | 情绪层（Landing / **`/discover`→`/market` 重定向壳** / **`/market`**）玻璃+微徽章；可信层折叠条款；资金层（Escrow/Dispute）银行级、无玻璃 | 28 §1、§2 |
| **Zone Control** | 金融区信息层级：状态→金额→finality→操作→风险提示；交易交互仅 SignatureModal | 13-1 表 4 |
| **组件复用** | 同功能仅一套组件（如 TrustBadgesRow、OrderCard）；无重复造轮子 | §3 |
| **API/ABI** | 前端仅 `lib/api.ts`、`lib/apiClient.ts` 调 04；ABI 仅 `dapp/abis/*.json` | 14、32 §2.4 |
| **无障碍与 i18n** | 关键组件支持 t(key)、aria；与 37 衔接时可再细化 | 30-UX、37 |
| **性能与 3D** | R3F/3D 若存在则符合 21/22 边界；Escrow 无重动效 | 21、22 §九 |

---

## 七、与 35、36、37 的衔接

| 文档 | 与 34 的关系 |
|------|--------------|
| **35 DApp 与钱包** | 34 的 WalletStatusMini、SignatureModal、EscrowDetail 内链操作为 35 验收对象；34 组件稳定后 35 做钱包连接/EIP-712/tx 状态机验收。 |
| **36 前端测试** | 34 组件为单测与集成测试目标；36 用例可覆盖 Token 类名不出现禁止项、关键组件渲染与交互。 |
| **37 i18n/a11y** | 34 组件文案走 LocaleProvider/t(key)；焦点/ARIA 在 34 实现时预留，37 做清单与验收。 |

---

## 八、附录：Figma/23 命名与 34 组件对照（可选）

实现或设计还原时，Figma（23 §二）命名可与 34 组件对应，便于设计→代码追溯。

| Figma 命名（示例） | 34 组件 |
|--------------------|---------|
| C/Badge/EscrowEnabled、C/Pill/SupportedTokens | EscrowEnabledBadge、SupportedTokensPill |
| C/TrustBadgesRow、C/TrustInfraWall | TrustBadgesRow、TrustInfraWall |
| C/OrderCard、C/GuideCard | OrderCard、GuideCard |
| T/EscrowDetail、C/Modal/Signature | EscrowDetail、SignatureModal |
| C/Button/Primary/Travel、C/Button/Console | 22 §七 主按钮（Experience / Escrow） |

---

**34 执行记录**：2025-03-01 完成 §2.3 Token 验收（六项已勾选）、§3 组件路径核对（均已存在）；Landing/Market/Escrow/Trust 无禁止类名；30/31 赛博风区为设计例外已注明。可作为 P8 门禁输入进入 35/36/37。

---

*本文与 22、28、29、23、32、33、13-1、05、14 配套。**v1.0.2（2026-06-03）**：**§3.5** Landing/`/market` 组件映射补 **`marketFavoritesStorage`** · **`useMarketPage`**；与 **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §3.1a/§3.2 对拍。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
