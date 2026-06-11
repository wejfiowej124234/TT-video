# UI 交付物：Figma 结构 + Landing 线框 + Escrow 银行级模板

**Version:** 1.0.1  
**Landing/Discover 视觉框架定稿**：以 **[28-Cinematic-Glassmorphism-Web3融合规范](28-Cinematic-Glassmorphism-Web3融合规范.md)** 为准（Hero 可信承诺行+三徽章、卡片 Escrow 角标与 Escrow pricing、可信基建墙、WalletStatusMini）；本文线框与 **Escrow 银行级模板** 仍适用，与 28 配套。  
**用途**：设计/开发可直接按本文建 Figma、实现 Landing 与 EscrowDetail 页面。与 [21-UI-3D-旅游Web3融合规范](21-UI-3D-旅游Web3融合规范-v1.0.md)、[22-Design-Tokens-旅游Web3融合体系](22-Design-Tokens-旅游Web3融合体系-v1.0.md) 一致。**Landing/Discover/Itinerary 顶级标准**（沉浸叙事、动效哲学、杂志级 Itinerary、缺失模块验收）见 [25-顶级UI标准-Landing-Discover-Itinerary](25-顶级UI标准-Landing-Discover-Itinerary.md)。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **Tailwind / globals 工程路径** | **§一** |
| **Figma 文件结构、组件命名** | **§二** |
| **Landing 线框** | **§三** |
| **Escrow 银行级模板（结构+层级）** | **§四、§七** |
| **Awwwards 级排版、Before/After** | **§五、§六** |
| **叙事与动效哲学（导演级）** | **[25](25-顶级UI标准-Landing-Discover-Itinerary.md)**；Experience 组件 **[28](28-Cinematic-Glassmorphism-Web3融合规范.md)** |
| **`/` + `/market` 四页 ① 代码/UI/数据链** | **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §2～§3（线框 **≠** 行为 SSOT） |

---

## 一、Tailwind + CSS 变量落点（工程约束）

Design Tokens 已固化为工程约束：

- **Tailwind**：`frontend/tailwind.config.ts`（Travel/Trust 双轴、状态色、圆角/阴影/字体层级、8px grid、fadeUp 动效）
- **CSS 变量**：`frontend/app/globals.css`（:root 与 .dark 的 Token 定义）

实现时以 22 为准；Tailwind 的 content 路径已覆盖 `app/`、`pages/`、`components/`、`src/`。**若未安装 Tailwind**：在 `frontend/` 下执行 `npm install -D tailwindcss postcss autoprefixer`，并确保存在 `postcss.config.mjs`（已提供）。

---

## 二、Figma 结构图草稿（文件结构 + 组件体系）

发给设计/AI 时可直接使用，按协议产品方式建 Figma。

**Figma 文件**：TravelTrust – Gentle Tech Travel

### Pages（页面）

| Page | 内容 |
|------|------|
| **00 – Foundations** | Color Styles（Travel/Trust/State）、Typography Styles（H1/H2/H3/H4/Body/Meta）、Effects（shadow-soft/medium/strong）、Radius（sm/md/lg/xl）、Spacing（8px grid） |
| **01 – Components** | Buttons（TravelPrimary / TrustPrimary / Danger / Ghost）、Badges（StatusBadge：Open/Confirmed/Funded/Completed/Disputed）、Cards（DestinationCard / OrderCard）、Panels（ConsolePanel / AmountPanel / RiskNoticeBar）、Modals（AuthModal / SignatureModal / ConfirmFinalPlanModal）、Timeline（OnchainEventTimeline / DisputeTimeline）、Forms（FilterBar / ItineraryInputForm） |
| **02 – Templates** | Landing Template、**Discover→`/market` 重定向壳**（**无**独立列表 UI；列表见 Market Template）、Itinerary Template、OrderFlow Template、**EscrowDetail Template（银行级）** |
| **03 – Screens** | Landing（Desktop/Mobile）、**Discover 过渡壳**（Desktop/Mobile · 列表在 **`/market`**）、Itinerary（Desktop/Mobile）、Chat + QuoteSummary（Desktop）、EscrowDetail（Desktop/Mobile）、DisputeCenter（Desktop） |
| **99 – Archive** | 旧版本与实验稿（只读） |

### Components 命名规则

- `C/Button/Primary/Travel`
- `C/Button/Primary/Trust`
- `C/Badge/Status/Funded`
- `C/Panel/Console`
- `C/Modal/Signature`
- `T/EscrowDetail`
- `S/EscrowDetail/Desktop`

---

## 三、Landing 页面结构线框图（Wireframe + 模块清单）

目标：旅行动效质感 + Web3 可信要素嵌在「信任条/协议说明」，不抢主视觉。

### Landing（Desktop）Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Top Nav                                                     │
│ [Logo]  Discover  How it works  Safety  FAQ        [Login]  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ HERO (Split)                                                │
│ Left:                                                       │
│  H1: Plan travel. Pay with escrow. Stay protected.         │
│  Sub: AI itinerary + transparent pricing + on-chain escrow  │
│  CTA1: Create itinerary  CTA2: Browse bounties              │
│  Trust badges: Non-custodial | On-chain escrow | Dispute     │
│                                                             │
│ Right: Hero3D (Gentle)                                      │
│  - globe arc lines + route particles (slow, subtle)         │
│  - degrade to static on low perf                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ “How it works” (4 steps)                                    │
│ 1) Generate itinerary  2) Publish bounty  3) Negotiate       │
│ 4) Escrow deposit & release                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Featured Itinerary Card (Long-scroll preview)               │
│ - image + text sections + budget breakdown                  │
│ - shows: version, snapshotHash (collapsed)                  │
│ - CTA: Publish bounty (requires login)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Latest Bounties Carousel (OrderCards)                        │
│ [img] Tokyo 5d  $2,300  Escrow-enabled  Open                 │
│ [img] Paris 7d  $3,800  Escrow-enabled  Open                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Safety / Protocol Guarantees                                │
│ - Funds locked on-chain                                     │
│ - Snapshot-bound final plan                                 │
│ - Dispute & resolution flow                                 │
│ - Platform fee disclosed in contract params                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Footer: Docs | Terms | Privacy | Contact                    │
└─────────────────────────────────────────────────────────────┘
```

### Landing 模块清单（开发用）

- NavBar  
- HeroSplit  
- HeroCopy  
- TrustBadges  
- Hero3D（只此处允许）  
- HowItWorksSteps  
- ItineraryPreviewCard  
- BountyCarousel  
- SafetyGuarantees  
- Footer  

---

## 四、Escrow 页面「银行级 UI 模板」（结构 + 字段级信息层级）

可信度核心页面：信息优先、极低动效、无 3D、无渐变/发光。

### EscrowDetail（Desktop）Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Console Top Bar                                              │
│ Escrow #ORDER_ID (copy)   StatusBadge   NetworkBadge         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ A) Status + Amount (Top priority)                            │
│  Status: Funded / Confirmed / Completed / Disputed           │
│  Amount: 2,300.00 USDC                                       │
│  Parties: Traveler addr (copy) | Guide addr (copy)          │
│  Snapshot: snapshotHash (copy)                               │
│  Finality: 12/12 confirmations (FinalityBadge)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┬───────────────────┐
│ B) On-chain Event Timeline               │ C) Action Panel    │
│ - EscrowCreated                          │ - Primary CTA      │
│ - Deposited                              │   Deposit / Release│
│ - ...                                    │ - Secondary CTA    │
│ txHash + block + logIndex + timestamp    │   Refund / OpenDispute
│                                         │ - RiskNoticeBar     │
└─────────────────────────────────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ D) Fee Breakdown (read-only)                                 │
│ Total: 2300 USDC                                             │
│ Platform fee (bps): 1000 (10.00%)                            │
│ Guide receives: 2070 USDC                                    │
│ (No hidden fees)                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ E) Evidence / Notes (optional, chain-off)                    │
│ - Link to itinerary snapshot (off-chain)                     │
│ - Chat transcript link (off-chain)                           │
│ - Evidence file hashes (if dispute)                          │
└─────────────────────────────────────────────────────────────┘
```

### 强制信息层级（不能改）

1. Status  
2. Amount + Token  
3. Finality  
4. Actions（按钮不抢戏）  
5. Timeline（txHash/区块/日志）  
6. RiskNotice（持续可见）  

### 交易弹窗 SignatureModal（银行级字段必须出现）

- chainId  
- contract address  
- function  
- token  
- amount  
- platformFeeBps  
- snapshotHash  
- gas estimate  
- finalityN  

**用户确认文案**：「Funds are locked on-chain. This action is irreversible once confirmed.」

### EscrowDetail 必备异常态（必须做）

- 钱包未连接  
- 链不匹配  
- allowance 不足（Approve 引导）  
- 余额不足  
- finality 未达（显示 Pending/Confirmations）  
- tx replaced（显示替换交易 hash）  
- reorg 回退提示（状态回滚警告 + 自动刷新说明）  

### Escrow 组件清单（开发用）

- ConsoleTopBar  
- StatusHeader  
- AmountPanel  
- PartiesPanel  
- SnapshotHashRow  
- FinalityBadge  
- OnchainEventTimeline  
- ActionPanel  
- RiskNoticeBar  
- FeeBreakdown  
- SignatureModal  
- ErrorStateCard  

---

## 五、Landing 高端排版结构图（Awwwards 级，可直接执行）

**目标**：沉浸叙事 + 情绪渐变 + 可信收束。**风格**：Gentle Tech Travel × Minimal Luxury。与 [25-顶级UI标准](25-顶级UI标准-Landing-Discover-Itinerary.md) §十、§十七 一致。

### 结构总览（Desktop 1440px）

```
┌──────────────────────────────────────────────────────────────┐
│ NavBar (transparent → solid on scroll)                      │
└──────────────────────────────────────────────────────────────┘

[Section 1] HERO — Immersive Split (100vh)
┌──────────────────────────────────────────────────────────────┐
│ Left (40%)                                                   │
│  H1 (48px): Plan journeys.                                   │
│             Lock trust on-chain.                             │
│  Sub (18px): AI-crafted itineraries secured by escrow.       │
│  CTA Primary: Start your journey                             │
│  CTA Secondary: Browse bounties                              │
│  Trust Badges (small, subtle)                                │
│                                                              │
│ Right (60%)                                                  │
│  Hero3D: globe arcs + route particles (subtle)               │
└──────────────────────────────────────────────────────────────┘

[Section 2] Editorial Travel (Full-width image blocks)
┌──────────────────────────────────────────────────────────────┐
│ Full-bleed image (Tokyo dusk)                                │
│ Overlay gradient (top→bottom 0%→40% black @ 20%)             │
│ Left-bottom text block:                                      │
│  H2: Day 1 — Arrival in Tokyo                                │
│  Body: Private transfer, curated dining…                    │
└──────────────────────────────────────────────────────────────┘

[Section 3] AI Itinerary Narrative (Split alternating)
┌──────────────────────────────────────────────────────────────┐
│ Left: Large image                                            │
│ Right:                                                        │
│  H3: Designed by AI. Confirmed by humans.                     │
│  Budget breakdown (minimal table)                            │
│  Version + snapshotHash (collapsed row)                      │
└──────────────────────────────────────────────────────────────┘

[Section 4] Protocol Assurance (Minimal, light background)
┌──────────────────────────────────────────────────────────────┐
│ H2: Funds secured on Polygon.                                │
│ 3-column grid:                                               │
│  - Non-custodial escrow                                      │
│  - Snapshot-bound agreement                                  │
│  - Dispute resolution                                        │
└──────────────────────────────────────────────────────────────┘

[Section 5] Final CTA (Large whitespace)
┌──────────────────────────────────────────────────────────────┐
│ Centered:                                                    │
│  H2: Publish your itinerary.                                 │
│  Subtle line: Travel secured.                                │
│  CTA Primary (large)                                         │
└──────────────────────────────────────────────────────────────┘
```

### 高端细节控制（必须遵守）

| 项 | 数值/规则 |
|------|------------|
| Section 顶部留白 | ≥ **96px** |
| 布局 | 图片与文字交替，**禁止**卡片网格堆叠 |
| 缓动 | 统一 **cubic-bezier(0.22, 1, 0.36, 1)** |
| Hero 3D | 旋转不超过 **3°**；粒子透明度 **20%–40%** |
| NavBar | 滚动 **40px** 后加 `bg-white/70 backdrop-blur-md` |

---

## 六、UI 风格视觉升级对比稿（Before → After）

### A. Landing

| Before（常见问题） | After（顶级标准） |
|--------------------|-------------------|
| 卡片网格堆满 | 单焦点 Hero（大留白） |
| 3D 过亮 | 分段叙事（杂志化） |
| 文案过多 | 统一动效节奏（600ms 主节奏） |
| 多个 CTA 抢焦点 | Trust 表达内嵌（小徽章/说明） |
| 动效节奏不统一 | 视觉收束到 Escrow 可信 |

### B. Discover

| Before | After |
|--------|-------|
| 普通卡片列表 | 目的地「故事块」优先 |
| 视觉密集 | 卡片下沉为次级 |
| 信息同权重 | 状态角标极简（Escrow enabled） |

### C. Escrow

| Before | After |
|--------|-------|
| 渐变背景 | 白/深灰底 |
| 大动画、视觉抢戏 | 单色主按钮（Trust Axis） |
| 金额动画 | 明确分区边界线 |
| — | 等宽字体展示地址/tx |
| — | 时间线可复制字段 |

---

## 七、Escrow 页面银行级视觉代码模板（Next.js + Tailwind）

以下为可直接落地的代码结构，与 §四、[25 §二十](25-顶级UI标准-Landing-Discover-Itinerary.md) 银行级基准一致；Design Tokens 见 [22](22-Design-Tokens-旅游Web3融合体系-v1.0.md)、`frontend/tailwind.config.ts` 与 `frontend/app/globals.css`。

### 页面入口 `app/escrow/[id]/page.tsx`

```tsx
import { Suspense } from "react";
import EscrowDetail from "@/components/escrow/EscrowDetail";

export default function EscrowPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-console text-ink-800">
      <div className="container py-12">
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
          <EscrowDetail escrowId={params.id} />
        </Suspense>
      </div>
    </div>
  );
}
```

### 主组件 `components/escrow/EscrowDetail.tsx`

- Top Bar：Escrow #ID + 说明 + StatusBadge  
- Amount + Parties：白底卡片、金额 3xl、Traveler/Guide 等宽字体  
- Timeline：On-chain Activity 列表  
- Action Panel：单色主按钮（trust-500）、风险提示 meta 文案  

（完整 TSX 见仓库 `frontend/app/escrow/[id]/page.tsx` 与 `frontend/components/escrow/EscrowDetail.tsx`。）

### StatusBadge

- 使用语义色（success/warning/danger）背景浅色 + 文字；小圆角、small 字号。

### Escrow 页面视觉规则（必须遵守）

| 禁止 | 必须 |
|------|------|
| ❌ 3D | ✅ 单色主按钮（trust-500） |
| ❌ 渐变背景 | ✅ 等宽字体展示地址 |
| ❌ 金额动画 | ✅ 时间线字段可复制 |
| ❌ 大动画/粒子 | ✅ 明确区块边界（shadow-soft、留白） |

---

*本文与 [21-UI-3D-旅游Web3融合规范](21-UI-3D-旅游Web3融合规范-v1.0.md)、[22-Design-Tokens-旅游Web3融合体系](22-Design-Tokens-旅游Web3融合体系-v1.0.md)、[13-1-UI产品级SSOT与页面规范](13-1-UI产品级SSOT与页面规范.md)、[25-顶级UI标准-Landing-Discover-Itinerary](25-顶级UI标准-Landing-Discover-Itinerary.md) 配套。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
