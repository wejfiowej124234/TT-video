# 28 · Cinematic + Glassmorphism 旅行框架与 Web3 三层融合规范

**Status:** **叙事与结构 SSOT**（Experience 外观 **[86](86-UI-双系统未来风-风格与动效技术规格.md)**）  
**Version:** 1.0.10  
**定位**：旅行首页与**自由市场（`/market`）**采用「插画背景 + 玻璃容器 + 卡片」**可作为实现参考之一**的 Cinematic 杂志级结构；**`/discover` 仅为客户端重定向至 `/market` 的兼容壳**（无独立列表页）。Web3 仅作「可信标识 + 结算能力」，**低声但坚定**，不抢主视觉。  
**与 [86](86-UI-双系统未来风-风格与动效技术规格.md) 分工（企业级）**：**本文 28** 保留 **三层融合逻辑、页面级信息架构、组件清单、叙事动线**（Cinematic flow）。**Experience 路由（`/`、`/traveltrust`）的视觉 SSOT**（色板、粒子/Hero、亮→暗桥接渐变、glow 主 CTA 边界）以 **86** 为准。**`/market`**：**86 Business 降级版**（弱化粒子与 glow）+ **本文与 [29](29-自由市场-撮合控制台规范.md)** 的信息与撮合控制台要求并存。**冲突处理**：**资金区与安全边界** 以 **[13](13-协议级UI设计宪法.md)**；**Experience 外观** 以 **86**；**叙事结构与本规范 §3～§6** 仍以 **28** 为纲；**CSS 变量键名与禁止裸色类名** 以 **[22](22-Design-Tokens-旅游Web3融合体系-v1.0.md)** 为唯一赋值入口（值按 **22 §一点五** 映射 86）。**风格改版**（含配色、动效表现）**不**作为改动页面功能、路由或 **04** 契约的理由 — 边界见 **86** 篇首 **定稿口径**。  
**配套文档**：[13](13-协议级UI设计宪法.md) · [13-1](13-1-UI产品级SSOT与页面规范.md) · [21](21-UI-3D-旅游Web3融合规范-v1.0.md) · [25](25-顶级UI标准-Landing-Discover-Itinerary.md) · [29](29-自由市场-撮合控制台规范.md)（自由市场页定稿）。**命名**：文档与 **25** 文件名仍含「Discover」时，**实现真值**为 **`/market` 主 UI + `/discover` 重定向壳**（见 **04 §3.4**、**13-1**）。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **三层融合、情绪/可信/资金区** | **§1～§2** |
| **Landing / 自由市场页面级落点**（`/discover`→`/market`） | **§3** |
| **Web3 组件清单** | **§5** |
| **AI 行程单即协议文档（王牌融合）** | **§6** |
| **动效与 reduced-motion** | **§4** |
| **全站 Tokens / 清除清单 / 验收** | **§8**；Token 体系 **[22](22-Design-Tokens-旅游Web3融合体系-v1.0.md)**（**86 色谱映射**见 **22 §一点五**） |
| **自由市场（撮合控制台）** | **[29](29-自由市场-撮合控制台规范.md)**（**信息架构与组件** 以 **29+本文**；**Business 外观** **86 降级** + **22** 赋值） |
| **v1 API** | **[04 §3.4](04-后端与API.md)**；ABI **[14](14-合约-API-ABI-前后端对齐.md)** |

---

**目录**  
§1 融合总原则 → §2 三层融合（视觉/信息/交互）→ §3 页面级落点 → §4 动效 → §5 组件清单 → §6 王牌融合 → §7 一句话总结 → §8 实现状态与验收（含清除清单、代码映射）

---

**全站一致原则（22 键名 + 13 边界 + 28 结构 + 86 Experience 外观）**

| 维度 | 要求 |
|------|------|
| **UI** | **仍** 全站仅用 **22 Design Tokens 键名 / 语义**（`text-ink-*`、`text-travel-*`、`bg-bg-main`/`bg-bg-console`/`bg-bg-soft`、`rounded-[var(--radius-sm)]`、`success`/`warning`/`danger` 等）；**具体 Hex** 在 Experience 按 **[86](86-UI-双系统未来风-风格与动效技术规格.md) → [22 §一点五](22-Design-Tokens-旅游Web3融合体系-v1.0.md)** 映射，**禁止** `text-gray-*`、`text-blue-*`、随意裸色与旧类名（**例外**：Experience 区玻璃 `bg-white/xx`、Hero 主 CTA 按 86/22）。 |
| **UX** | 顶栏仅 WalletStatusMini；链上操作强制走 SignatureModal（银行级、无玻璃）；Landing 与含 **`/discover` 短停** 的路径**页身**无大钱包 CTA；Console 内容区无玻璃。**`Header.tsx` 外观**（白底深字、全路由一致）以 **86 §6.0** 为准，**不**再随 Experience 切换玻璃浅字顶栏。 |
| **API** | 以 [04](04-后端与API.md) §三 为准；前端仅经 `lib/api.ts` + `lib/apiClient.ts` 调用，禁止手写 URL。 |
| **ABI** | 以 [14](14-合约-API-ABI-前后端对齐.md) 与 `contracts/abi` 为准；前端仅用 `dapp/abis/*.json`（自合约编译同步），禁止手写 ABI。 |
| **清除** | 与上述不一致的旧样式/交互/接口/ABI 须清除；状态见 §8。 |

---

## 1. 融合总原则：Web3 只能「低声但坚定」

| 区域 | Web3 角色 | 视觉要求 |
|------|------------|----------|
| 旅行首页 / **自由市场** | 可信标识 + 结算能力 | 微徽章、小 pill，不抢主视觉 |
| **自由市场（撮合控制台）** | 同上，仅撮合不付款 | 与上表「旅行首页」情绪层一致；**不出现支付/链上操作**；详见 [29-自由市场-撮合控制台规范](29-自由市场-撮合控制台规范.md) |
| 订单确认 / 发布 | 协议条款 + snapshot + escrow | 折叠条款、确认弹窗内首次出现严肃信息 |
| Escrow / Dispute | Web3 主角 | 银行级，**不用玻璃** |

**一句话**：旅行像杂志，协议像银行。

---

## 2. 三层融合策略

### A. 视觉层融合（UI 语言）

**保持**：插画背景 + 玻璃容器 + 卡片。

**允许的 Web3 视觉元素（Experience 区）**

- 「On-chain secured」微徽章（Apple 式小标识）
- 链/币种小 pill：USDC、Polygon 作为「支持方式」
- 「Escrow enabled」状态角标（卡片右上角）
- hash / chainId 仅在折叠区域出现（默认隐藏）

**禁止的 Web3 视觉元素**

- 巨大的 MetaMask 按钮
- 过多地址/哈希露出
- 赛博霓虹
- 区块链 Logo 墙
- 交易按钮在首页第一屏抢主 CTA

### B. 信息层融合（页面结构）

**Landing（Hero）**

- 只出现 **1 行可信承诺** + **3 个极简徽章**：
  - Non-custodial escrow
  - Snapshot-bound agreement
  - Dispute resolution
- 放在 Hero 标题下方一行（小号）。

**自由市场订单/向导卡片（撮合平台；非独立 `/discover` 列表页）**

- 卡片角标增加：**Escrow-enabled**、**Supports: USDC**
- 价格旁小字：**Escrow pricing**
- **不要**在卡片上出现钱包按钮。
- 自由市场页 = 撮合行程与向导的双栏控制台，风格与本节一致；布局与组件以 [29](29-自由市场-撮合控制台规范.md) 为准。

**Itinerary（AI 行程单）**

- 预算区底部加折叠模块：**Agreement summary**（默认折叠）
- 展开后展示：token、total、platform fee、snapshotHash（copy）、release conditions。

**Publish bounty / Confirm Final Plan**

- 点击发布 → 未登录：注册/登录；已登录未连钱包：提示连接（不强推）；已连接 → Confirm Final Plan
- **Confirm Final Plan 弹窗**内首次出现严肃 Web3 信息：版本号、snapshotHash、EIP-712 签名确认。

### C. 交互层融合（Web3 UX）

- **WalletConnect**：不做成醒目按钮，改为顶部右侧小入口 **Wallet**（状态：Connected / Wrong network）
- 关键动作时再弹 **SignatureModal**
- 所有链上操作**强制**走 SignatureModal
- **SignatureModal**：银行级（白底/深灰、清晰字段、**不用透明玻璃**）
  - 字段必须含：chainId、contract、function、amount、token、platformFeeBps、snapshotHash、finalityN

---

## 3. 具体落点（页面级）

### Hero 区

- 主标题下加一行：**「Escrow-secured payments on Polygon. No custody.»**
- 再加 3 个微徽章（灰白小 pill）：**Non-custodial** · **On-chain escrow** · **Dispute support**
- **与参考截图对齐**：徽章下方增加 **3 个玻璃 pill 快捷入口**（**自由市场** → **`/market`**，文案与顶栏 **`header_market`** 一致 / 创建行程 / 向导列表），样式与三徽章一致（`rounded-full bg-white/20 backdrop-blur-sm`），不抢主 CTA。

### 首页中央规划表单与盲盒行程

- **表单**（Hero 下方玻璃容器）：目的地国家、出行天数、景区/餐饮/酒店标准、预算（USD）；**支付统一美元 + USDT/USDC**，表单与弹窗均明确展示「USDT / USDC」。提交后 `POST /api/v1/itineraries`，可多次得到 3～5 份方案。
- **盲盒行程卡**：3～5 个方案卡片，虚化玻璃（`backdrop-blur`）；未解锁时仅显示「盲盒行程」「支付 x.xx USD（USDT/USDC）可解锁」+ 解锁按钮。
- **解锁流程**：点击 → 弹窗确认支付（稳定币 USDT/USDC）→ 确认后解锁，展示行程摘要并可跳转 `/escrow/[id]`（当前支付可前端模拟，实际接稳定币）。

### 卡片区（自由市场订单/行程卡）

- 右上角小角标：**Escrow-enabled**、**USDC**
- 卡片底部价格旁小字：**Escrow pricing**
- **Web3 融入**：在 Escrow pricing 下增加一行小字 **「Polygon · USDC · 链上托管」**（text-meta），强化链/币可感知、不抢主视觉。
- 不加任何钱包按钮。
- 可选：卡片使用轻微玻璃态（`bg-bg-console/95 backdrop-blur-sm`）以贴近参考截图。

### 页面底部（品牌/合作方）

- 由 Booking/Airbnb/Expedia 式合作方改为**可信基建墙**（极简，最多 3～4 个）：
  - Polygon · USDC · WalletConnect · Audited (future)
- **与参考截图差异**：截图为合作方 Logo；我们以可信基建墙替代，为 Web3 融入的一部分，见 [28-P28与截图对照-Web3融入与缺口清单](28-P28与截图对照-Web3融入与缺口清单.md)。

### TT 社区（发布入口与发帖弹窗 · 最佳实践对齐）

| 决策 | 参考 | 实现 |
|------|------|------|
| **发布入口 above-the-fold、单行 CTA** | Facebook/Threads/小红书：顶部「写点什么」单行 + 头像/图标 + 发布，减少干扰、首屏即见 | 社区页标题下单一发布条：图标 + 占位文案「写点什么…」+「+ 发布」；hint 放 `title` 与抽屉内说明 |
| **发帖弹窗媒体优先、可点击** | 小红书/朋友圈：先选图/视频再写文案；媒体区为明确可点击入口 | PublishDrawer：类型 → 添加照片/添加视频（`button`，hover/focus 态）→ 文案 → 字数/话题提示 |
| **字数与话题** | 小红书 1000 字 + 话题标签 | 文案区 0/1000 字计数（达限高亮）；下方「添加话题」占位（#目的地 #美食 #旅行） |
| **无障碍** | 单主 CTA、焦点顺序、live region | 发布条 `min-h`/`aria-label`；抽屉内 `aria-describedby` 字数、媒体区 `aria-label` |

实现位置：`app/community/page.tsx`（发布条）、`components/community/PublishDrawer.tsx`（弹窗）。FAB 保留为次要快捷入口，主入口以顶部发布条为准。

---

## 4. 动效规则

| 类型 | 允许 | 禁止 |
|------|------|------|
| Travel 动效 | 卡片 hover 1.02、视差 6px、文字 reveal 600ms | — |
| Web3 元素动效 | badge 淡入 200ms、modal 出现 250ms、状态仅颜色/文字 | 钱包连接成功特效、余额数字跳动、霓虹呼吸 |

---

## 5. Web3 组件清单

### Experience 内嵌（低声）

| 组件 | 用途 |
|------|------|
| EscrowEnabledBadge | 卡片角标「Escrow-enabled」 |
| SupportedTokensPill | 小 pill：USDC / Polygon |
| TrustBadgesRow | Hero 下三徽章：Non-custodial / On-chain escrow / Dispute support |
| AgreementSummaryAccordion | 折叠「Agreement summary」 |
| WalletStatusMini | 顶栏右侧钱包状态（Connected / Wrong network） |

### Console 专属（银行级）

| 组件 | 用途 |
|------|------|
| SignatureModal | 链上操作签名弹窗（白底、字段完整） |
| FinalityBadge | 终局状态标识 |
| OnchainEventTimeline | 链上事件时间线 |
| TxMachineStatus | 交易状态机展示 |

---

## 6. 王牌融合：AI 行程单即协议文档

- 把 **AI 行程单** 当作 **协议条款文档**
- 最终确认时生成 **snapshotHash**，链上 escrow 绑定
- 用户感知：我确认的是一份「旅行合同」→ 资金锁在 escrow → 完成后自动释放 → **可信旅游协议**

---

## 7. 一句话总结

照 Cinematic + Glassmorphism 框架做旅行沉浸，把 Web3 变成：

- **微徽章**（可信承诺）
- **折叠条款**（Agreement Summary）
- **最终确认**（Signature + snapshotHash）
- **资金页隔离**（银行级 Console）

---

## 8. 实现状态与验收（定稿对照）

实现落点：前端 **`app/(home)/page.tsx`**（**`/`** Landing）、`app/discover/page.tsx`（重定向至 /market）、`app/market/page.tsx`（自由市场撮合控制台）、`components/trust/*`、`components/market/*`、`components/Header.tsx`；Escrow 见 `components/escrow/EscrowDetail.tsx`（银行级、无玻璃）。

### 8.1 功能落点

| 落点 | 规范要求 | 实现状态 | 位置 |
|------|----------|----------|------|
| Hero 可信承诺行 | 主标题下一行 + 三徽章 | ✅ 已实现 | **`app/(home)/page.tsx`**：Escrow-secured… + TrustBadgesRow |
| TrustBadgesRow | Non-custodial · On-chain escrow · Dispute support | ✅ 已实现 | `components/trust/TrustBadgesRow.tsx` |
| 可信基建墙 | Polygon · USDC · WalletConnect · Audited | ✅ 已实现 | `components/trust/TrustInfraWall.tsx`；Landing 第三屏、**`/market`** 页脚（**`/discover`** 重定向至 **`/market`**） |
| 订单卡 Web3 角标（自由市场） | Escrow-enabled、USDC、Escrow pricing | ✅ 已实现 | EscrowEnabledBadge、SupportedTokensPill；**`app/market/page.tsx`**、`components/market/*`（**非** `app/discover` 列表页） |
| WalletStatusMini | 顶栏小入口 Wallet（Connected / Wrong network） | ✅ 已实现 | `components/trust/WalletStatusMini.tsx`；Header 集成 |
| 动效 | Travel 600ms / Web3 200ms fadeIn | ✅ 已实现 | `tailwind.config.ts` fadeUp/fadeIn；卡片 hover scale |
| AgreementSummaryAccordion | Itinerary 预算区底部折叠 | ✅ 已实现 | `app/itinerary/new/page.tsx` 结果区「费用明细」下方，默认折叠，展开展示 token/total/platform fee/snapshotHash（复制）/release conditions |
| Confirm Final Plan 弹窗 | 版本号、snapshotHash、EIP-712 | ✅ 已实现 | EscrowDetail：点击「Confirm Final Plan」先弹窗展示版本号、snapshotHash（或「确认后将由后端生成」）、EIP-712 说明，再「确认并提交」调 API |
| SignatureModal 银行级字段 | chainId/contract/amount/token/snapshotHash/finalityN/platformFeeBps | ✅ 已补全 | EscrowDetail 签名前展示；已增加 snapshotHash（若有）、platformFeeBps（由合约/协议配置） |
| 全站 Design Tokens（22） | 无 gray/blue/red 裸色，统一 ink/travel/success/warning/danger | ✅ 已替换 | 见 8.2 清除清单 |
| 自由市场页（撮合控制台） | 玻璃态、双栏、订单/向导卡、Escrow-enabled/SupportedTokens、可信基建墙、无支付 CTA | ✅ 已实现 | `app/market/page.tsx`、`components/market/*`；详见 [29-自由市场-撮合控制台规范](29-自由市场-撮合控制台规范.md) |

### 8.2 清除清单与单源（叙事/结构以本文为准；Token **[22](22-Design-Tokens-旅游Web3融合体系-v1.0.md)**；Experience 外观 **[86](86-UI-双系统未来风-风格与动效技术规格.md)**）

**已清除旧 UI**

- 裸色/旧类名：`text-gray-*`、`text-red-*`、`text-blue-*`、`text-green-*`、`bg-gray-*`、`bg-emerald-*`/`bg-slate-*`/`bg-amber-*` 已移除或改为 22 token。
- `bg-white` → `bg-bg-console`（**例外**：Experience 区玻璃 `bg-white/xx`、Hero 主 CTA 可 `bg-white`）。
- `rounded-md` → `rounded-[var(--radius-sm)]`。
- 2025-02：`app/guide/register` 已由 amber 改为 ink；字级/分隔线/表单控件已统一为 `text-small`/`text-meta`、`border-ink-200`、`bg-bg-console`；主/区块标题已统一为 `text-h3`/`text-h4`/`text-body`/`text-body-l`；Landing、**`/market`**、**`/discover` 短停** 与第三屏文案已与 22 及中文入口一致。

**涉及范围**：`app/auth|me|orders|guide|guides|disputes|itinerary|escrow|page|discover|market|loading|error|governance|layout`、`components/Header|ApiErrorAlert|escrow/EscrowDetail|trust/*|market/*`。

**单源**：UX 顶栏仅 WalletStatusMini，链上仅 EscrowDetail 内 SignatureModal。API 仅 `lib/api.ts` + `lib/apiClient.ts`，路径同 04 §三。ABI 仅 `dapp/abis/Escrow.json`（自 contracts/abi 同步），见 14 §1.2。

**验收**：Landing、**`/discover` 短停**、**`/market`** 无大钱包 CTA、Console 无玻璃；全站与 **本文（叙事/IA）**、**04**、**14**、**22**（键名/语义色）、**86**（Experience 色与动效）一致。

**配套与延伸**：本文为 **28 主规范（定稿）**。端到端 API/ABI 落点见 [14-附录-API与ABI对齐检查报告](14-附录-API与ABI对齐检查报告.md)。28 审计/对照（可选参考）：[28-P28与截图对照-Web3融入与缺口清单](28-P28与截图对照-Web3融入与缺口清单.md)、[28-截图风格对照与UI深度检查](28-截图风格对照与UI深度检查.md)、[28-企业级UI设计审计报告](28-企业级UI设计审计报告.md)。

### 8.3 可选优化（Console 体验迭代）

| 项 | 说明 | 状态 |
|----|------|------|
| **FinalityBadge** | 终局状态标识（如「已终局 12 块」）组件化 | ✅ 已实现 `components/escrow/FinalityBadge.tsx`，EscrowDetail 已接入 |
| **OnchainEventTimeline** | 链上事件时间线（EscrowCreated / Funded / …）；无数据时占位，待后端索引接数据 | ✅ 已实现 `components/escrow/OnchainEventTimeline.tsx`，EscrowDetail 已接入 |
| **TxMachineStatus** | 交易状态机展示抽为复用组件 | ✅ 已实现 `components/escrow/TxMachineStatus.tsx`，签名弹窗与操作区已接入 |

核心项（AgreementSummaryAccordion、Confirm Final Plan 弹窗、SignatureModal 字段）已在 §8.1 实现；上述三项已完成组件化并接入 EscrowDetail。

### 8.4 代码与文档映射（当前为准）

| 文档 | 内容 |
|------|------|
| **05 §四** | 前端骨架与路由：Landing、discover（→/market）、market、guides、orders、disputes、escrow/[id]、itinerary/new、guide/register 等；无 tourist/arbitrator 子目录。 |
| **28 + 22** | UI 风格与 Token：全站 22 token；Experience 玻璃+微徽章；Console 银行级。 |
| **29** | 自由市场页：撮合控制台、双栏、订单/向导卡与抽屉；**信息分层/玻璃叙事** 与 **28** 一致，**像素与 Business 降级** 以 **86 + 22**、**[29](29-自由市场-撮合控制台规范.md)** 定稿、**[07 §五 5.3](07-开发流程与顺序.md)** 为准；`app/market/`、`components/market/*`。 |
| **核对** | 2025-02 与 05、28、29 清除清单已对齐。 |

---

*配套 13、13-1、21、22、25、29；实现落点：Landing（**`app/(home)/page.tsx`**）、**`discover`（→`/market`）**、**`market`**、Itinerary、Escrow 与 components/trust/*、components/market/*。**v1.0.10**：§8 **`/`** 路径与 **88/33** 对齐。*
