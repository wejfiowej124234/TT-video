# 85 — TravelTrust 网络落地页（融资级）设计与开发规格

**文档编号**：85  
**版本**：1.0.19  
**最后更新**：2026-04-19  
**状态**：`Target`（产品 + 前端实现规格；对外文案须法务与 [08-4](08-4-对外口径包.md) 定稿）  
**页面入口（与当前实现一致）**：顶栏**不设**独立 **「网络」** 导航项；左侧**深色字标「TravelTrust」**（`Header.tsx`）→ **`/traveltrust`**（本页 SSOT 路由）。**行程/协议主 Landing（`/`）** 仍由主导航 **「Web3旅行」** 进入。**`/network`** 为 **`/traveltrust`** 的 **永久重定向别名**（`frontend/app/network/page.tsx`，与 [04 §3.4](04-后端与API.md)、[13-1](13-1-UI产品级SSOT与页面规范.md) 表 1 同批登记）。Landing **页脚「产品」列**首条已链 **`/traveltrust`**（i18n `footer_link_traveltrust_network`，与 **04 §3.4 / 13-1** 同路径）。首页 Hero 若增加「了解 TravelTrust 网络」等 CTA，应显式链到 **`/traveltrust`**。

**受众**：前端、UI、增长与融资材料、外包、Cursor/AI 生成页面时的**单源结构**；**非** ICO 专页、**非** 完整 DApp 控制台。

**维护**：前端负责人 + 产品；重大文案或「三币」叙事变更须联动 **82/83/84**（FeeRouter/DAO 口径以 **83** 为准，十国承销与费用分母以 **84** 为准）与 [governance-token/LEGAL-SIGNOFF-CHECKLIST](governance-token/LEGAL-SIGNOFF-CHECKLIST.md)。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **IA、模块规格、验收** | **§三～§廿三**（按模块名下钻） |
| **路由 `/traveltrust`** | **[04 §3.4](04-后端与API.md)**、**[13-1](13-1-UI产品级SSOT与页面规范.md) 表 1**（与文首「页面入口」一致） |
| **本页视觉层级与代码文件索引** | **§二 2.6**（深色 Tropical 全页壳 + **环境粒子** + Hero 旅游柔光；**非** ICO 认购交互）；动效与 Token 映射仍对齐 **[86](86-UI-双系统未来风-风格与动效技术规格.md)**、**[22 §一点五](22-Design-Tokens-旅游Web3融合体系-v1.0.md)**；读序 **[07 §五 5.3](07-开发流程与顺序.md)**、**[07 §五 5.3A](07-开发流程与顺序.md)** |
| **融资数字、Allocation** | **[84](84-第一阶段10国Country-Pool发行参数总表.md)**、**[governance-token/02 §2.5](governance-token/02-对内技术规格-草案.md)** |
| **订单主链 / Escrow** | **[53](53-阶段开发技术文档.md)**、**[01](01-总库总览.md)** — 本文**不**替代 |
| **法务与 A-B（B-106）** | **文内指针/勾选落点**：对外叙事 **fail-closed** 互证 **[08-4](08-4-对外口径包.md)**、**[governance-token/LEGAL-SIGNOFF-CHECKLIST](governance-token/LEGAL-SIGNOFF-CHECKLIST.md)**（**不**替代 **08-4** 签字定稿） |

---

## 与项目 SSOT 的对齐（实现前必读）

| 主题 | 权威文档 |
|------|----------|
| 订单结算、Escrow、**不发行 MVP 平台支付币** | [01-总库总览](01-总库总览.md)、[53-阶段开发技术文档](53-阶段开发技术文档.md) |
| **向导身份/订单质押**（与 TTG 质押、FeeRouter **分称**） | [81-经济模型-向导质押与订单押金](81-经济模型-向导质押与订单押金.md)、[08-3-参数与门禁表](08-3-参数与门禁表.md)；Trust/FAQ 文案勿与 **84** 承销或 **83** Global 激励混读 |
| 融资参数、Country Pool、费用分母 | [84-第一阶段10国Country-Pool发行参数总表](84-第一阶段10国Country-Pool发行参数总表.md)（**§1.1.1** 可分配费用基数；**§1.3** 分母勿与承销混读）、[82-治理币-文档总览](82-治理币-文档总览.md)；运维闭合表 [Runbook](../../ops/RUNBOOK.md) **§7.1** |
| **TTG 总量 100% 分解（对内，Allocation 模块勿与费用%混用）** | [governance-token/02-对内技术规格-草案](governance-token/02-对内技术规格-草案.md) **§2.5**（与 **84 §1.5** 一致） |
| DAO / FeeRouter / 链上边界 | [83-区域治理与收益分配-协议白皮书](83-区域治理与收益分配-协议白皮书.md) |
| 对外口径、收益与证券隔离 | [08-4-对外口径包](08-4-对外口径包.md)、[governance-token/LEGAL-SIGNOFF-CHECKLIST](governance-token/LEGAL-SIGNOFF-CHECKLIST.md) |
| 页面职责、RBAC、金融区克制 | [13-1-UI产品级SSOT与页面规范](13-1-UI产品级SSOT与页面规范.md)、[13-协议级UI设计宪法](13-协议级UI设计宪法.md) |
| 顶级 Landing 叙事与动效哲学 | [25-顶级UI标准-Landing-Discover-Itinerary](25-顶级UI标准-Landing-Discover-Itinerary.md)、[28-Cinematic-Glassmorphism-Web3融合规范](28-Cinematic-Glassmorphism-Web3融合规范.md) |
| 路由与 API 登记 | [04-后端与API](04-后端与API.md)、[05-前端总览](05-前端总览.md)、[07-开发流程与顺序](07-开发流程与顺序.md) |

**路由约定（SSOT）**：**`/traveltrust`**（已登记 **[04 §3.4](04-后端与API.md)** 前端路由表、**[13-1](13-1-UI产品级SSOT与页面规范.md) 表 1**；顶栏 **TravelTrust 字标** → 同路径，**无**单独「网络」顶栏项）。**`/network`** 已实现为 **`/traveltrust`** 的永久重定向（与 **04 / 13-1** 一致）；外部材料若使用短链 **`/network`**，不另建独立 IA。

**技术栈说明**：本文件正文中的 **Vite** 可作为**独立静态落地子应用**选项；**当前仓库**前端为 **Next.js 15 + React 19**（见 `frontend/package.json`）。**默认落地方式**：在 Next.js App Router 内实现本 IA，复用既有 **wagmi / viem / TanStack Query**；若单独拆 Vite 子域，须补齐构建、环境与 **CORS**，并在 **07** 变更记录中登记。

---

## 一、页面总体定位

**名称**：Global Travel Web3 Network Landing Page  

**本质**：

- 品牌入口 + 产品能力证明 + **可控**模拟体验 + **合规**融资参与入口。

**不是**：

- 证券式 ICO 专页、纯企业官网、完整 DApp（下单/托管全链路仍以主应用为准）。

**而是**：

- 可交互宣传页、可转化融资页、产品能力预览页。

---

## 二、技术架构

### 2.1 前端（目标能力）

| 项 | 说明 |
|----|------|
| 框架 | **推荐**：与仓库一致的 **Next.js App Router + React 19**；可选独立 **Vite + React 18** 子应用 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS；与 **[22-Design-Tokens](22-Design-Tokens-旅游Web3融合体系-v1.0.md)**（**86→22 §一点五**）、**[86](86-UI-双系统未来风-风格与动效技术规格.md)**（**`/traveltrust`** 与 **`/`** 同属 **Experience**）、**[28](28-Cinematic-Glassmorphism-Web3融合规范.md)**（叙事）对齐时优先复用既有 Token；读序 **[07 §五 5.3](07-开发流程与顺序.md)** |
| 动效 | Framer Motion（仓库已依赖）；主动效节奏与 [25](25-顶级UI标准-Landing-Discover-Itinerary.md) 一致时可采用 **200ms / 600ms** 分层 |
| 粒子 | **Canvas 2D** 为主（`requestAnimationFrame`）；必要时 **GPU transform**；粒子数见 §廿二 |

### 2.2 Web3

| 项 | 说明 |
|----|------|
| 库 | **viem** + **wagmi**（与主站一致）；历史方案 **ethers v6** 仅在新包内评估 |
| 连接 | WalletConnect / 注入钱包；`chainId` 与 [06-DApp架构总览](06-DApp架构总览.md)、**GET /meta** 一致 |

### 2.3 状态与数据

| 项 | 说明 |
|----|------|
| 服务端/缓存状态 | TanStack React Query（与主站一致） |
| 轻量客户端状态 | Zustand 可选（本页局部 UI/粒子开关） |
| Live Stats | **允许 mock**；若接 API，须与 **04** 契约一致，并标注「演示数据」 |

### 2.4 视频

- 格式：**MP4 + WebM**；**lazy load**；进入视口或用户交互后再加载重资源。

### 2.5 粒子系统（实现要点）

- **Canvas 2D** + `requestAnimationFrame`；避免与主线程长任务抢帧。
- 与 §五规范一致。

### 2.6 视觉层级与仓库落点（与专业项目落地页「分段节奏」对齐）

**目的**：在**信息架构**上可对齐常见项目官网 / 融资介绍站（首屏强叙事 → **卖点栅格** → 双栏「问题 / 回应」→ 横向锚点 → 深度模块 → FAQ → CTA），便于访客扫读；但 **TravelTrust 仍须遵守** 文首「**非** ICO 专页」— **禁止**内嵌链上认购、倒计时募资、固定收益话术或隐含证券承诺；一切统计与粒子动效均为**演示**。

**外部 UX 参考（仅排版与节奏，非背书）**：公开 ICO/项目页常用「Hero + 关键数字/卖点卡 + How to buy 步骤 + 细则表格 + FAQ」结构。团队对齐时可对照例如 [Nefe Coin ICO 落地页](https://ico.nefecoin.com/?utm_source=CryptoTotem) 的**区块划分与扫读顺序**；**不得**复用其认购、倒计时、收益或上币宣传等**功能与合规敏感文案**。

| 项 | 实现说明 |
|----|----------|
| **页面壳** | `frontend/app/traveltrust/layout.tsx`：深色底 `#030712` + `bg-market-atmosphere` + `bg-web3-dot-grid`（Tropical jade / Web3 场域，与自由市场底同系） |
| **全页环境动效** | `TravelTrustAmbientCanvas`：`fixed` 全视口 Canvas 粒子层（`z-[1]`，无交互，尊重 `prefers-reduced-motion`），与 §五语义一致、粒子数受 §廿一约束 |
| **主 IA 与 Hero** | `frontend/app/traveltrust/page.tsx`：`TravelTrustHeroBackdrop`（22 palette 柔光 blob + `globals.css` `.traveltrust-hero-aurora-*` 慢漂）+ **内嵌** `TravelTrustNetworkParticles` **`tone="hero"`**（更高对比连线）；双栏文案 + 预览卡 + CTA + `details` 规格折叠 |
| **概览区 `#overview`** | 同页内：**核心能力**四卡（Escrow / 撮合 / 治理分层 / 争议与演示声明）+ **叙事与痛点对照**双栏（`#problem` / `#solution` 锚点保留，便于外链） |
| **章节锚点** | `TravelTrustSectionNav`（`variant="glass"`）；IA 含 **`#overview`**，**不再**单独列出顶部「痛点 / 方案」导航项（内容并入概览） |
| **演示统计** | `TravelTrustLiveStats`（`variant="glass"`） |
| **可交互粒子区** | `TravelTrustNetworkParticles`（默认 `tone="card"`，区块内 hover/click 演示）；与全页环境层分工：**环境 = 氛围**，**区块 = 可玩演示** |
| **图例 / Demo / 常驻条** | `TravelTrustParticleLegend`、`TravelTrustDemoPreview`、`TravelTrustStickyCta` |
| **错误 / 加载** | `app/traveltrust/error.tsx`、`loading.tsx` 与壳色一致 |
| **全局顶栏** | `frontend/components/Header.tsx`：字标 **TravelTrust** → **`/traveltrust`**；主导航**无**「网络」、**无** **`/pay`**（与 **13-1** 一致） |

**合规文案与功能边界**仍以 **08-4**、**LEGAL-SIGNOFF**、**01/53** 为准。

---

## 三、页面信息架构（IA，最终版）

自上而下建议顺序（可随 A/B 微调，但须保留 **合规块** 与 **Trust**）：

1. **Hero**（柔光 + 内嵌粒子 + 双栏 CTA）  
2. **Overview / 概览**（`#overview`：核心能力四卡 + `#problem` / `#solution` 双栏对照；对应专业落地页「卖点 + 摘要」区）  
3. **章节锚点导航**（横向 `TravelTrustSectionNav`）  
4. **Live Network**（宽幅**可交互**粒子 + 图例；与全页环境粒子分工见 §二 2.6）  
5. **Live Stats**  
6. **Quick Explain**（三步；带「产品路径」眉题以贴近「How it works」扫读）  
7. **Video**  
8. **Flow**  
9. **Demo**（纯 UI，不执行链上成交）  
10. **Token System**（三币叙事，须符合 §十四合规框）  
11. **Allocation**（融资档位，数字与 **84** 一致）  
12. **Settlement**（常驻 T2 披露）  
13. **FeeRouter**（5.2A 自检块）  
14. **Trust**（事实列表）  
15. **Global Map**  
16. **FAQ**  
17. **CTA**  
18. **Footer**（站点级，非本文件独占）

---

## 四、Hero 模块

| 维度 | 规格 |
|------|------|
| 功能 | 主标语、**全页环境粒子**（layout）+ Hero 内 **旅游柔光 blob**（CSS）+ **内嵌高对比粒子画布**、主副 **CTA**、**连接钱包**（仅连接与网络展示，不隐含认购完成）；**禁止**融资倒计时组件（除非法务单列且非证券暗示） |
| 主文案（示例） | `Travel Anywhere With One Token` — **「One Token」须脚注**：品牌/效用叙事 vs 实际结算币（USDC 等）见 §十四 |
| 主 CTA | `Join Early Access` |
| 次 CTA | `Explore Demo`（锚点至 Demo 区） |
| FOMO 元素（可选） | `Early Access Ends In`、`Spots Remaining`、**Tier 1 / 2 / 3**（档位与 **84**、产品表一致，不得虚构链上已售罄） |

---

## 五、粒子系统（最终规范）

**定位**：全球旅游网络可视化（非游戏化炫技，服务于「网络效应」叙事）。

### 5.1 粒子语义（颜色）

| 语义 | 颜色建议 |
|------|----------|
| 城市 | 蓝 |
| 订单 | 绿 |
| 高级节点 / 关键枢纽 | 紫 |
| 热点 | 橙 |

### 5.2 动画能力

- 呼吸、连线、光流、路径、热点、残影（择要实现，**优先 FPS**，见 §廿二）。
- **双层实现**：① **环境层**（`TravelTrustAmbientCanvas`）：全视口、无交互、略高连线不透明度，保证首屏可见「网络感」；② **模块层**（`TravelTrustNetworkParticles`）：区块内交互与图例说明。减少「粒子仅出现在页面中段小框」导致的感知缺失。

### 5.3 交互

- **Hover**：展示城市名、`Trips` / `Guides` / `Avg` 等（可为 **mock**，须标注演示）。  
- **Click**：可生成**示意路径**（不调用真实订单 API 亦可）。

---

## 六、Live Network 模块

- 全屏或宽幅粒子层；**自动生成路线**动效。  
- **资金流光点**、**成交爆发**、**DAO 闪烁**等为**视觉隐喻**，须在页脚或 FAQ 说明「演示动画不等同链上实时成交」。

---

## 七、Live Stats 模块

- **动态数字**：Users / Trips / Cities / Guides。  
- **数字滚动**动画；**每约 3 秒**可刷新一次（mock 允许）。  
- 若展示与链或 DB 不一致，必须标注 **Demo** 或 **Illustrative**。

---

## 八、Quick Explain 模块

- **三步**：Book → Match → Travel。  
- 横向排列 + **图标动画**；步骤文案与 [53](53-阶段开发技术文档.md) 主流程口语可对齐，避免与 `release` 顺序矛盾（评分→release 见 01/53）。

---

## 九、Video 模块

- 内容线建议：**问题 → Escrow → 完成 → DAO**（叙事顺序可剪辑调整）。  
- **自动播放**仅建议静音 + 用户曾交互后；**scroll 进入视口**再加载。  
- 字幕与旁白须通过 **08-4** 话术审查（无收益承诺）。

---

## 十、Problem 模块

- 跨国旅游痛点：**货币 / 平台抽佣 / 语言 / 信任** 等（事实陈述，避免攻击具体竞品可识别信息除非已合规审查）。

---

## 十一、Solution 模块

- **统一平台、Escrow、DAO、向导锁单（档期/接单约束）、Token（效用/治理分层说明）**；与 **01/83** 能力边界一致，不夸大已上链模块（FeeRouter 等 Target 须标注）。

---

## 十二、Flow 模块

- 流程动画建议阶段：**Create → Accept → Confirm → Travel → Complete → Release**。  
- **颜色/状态**与订单状态机一致时，以 [01](01-总库总览.md)、[53](53-阶段开发技术文档.md) 为准；**Release** 须在动画或旁白中与「评分/确认后」一致。

---

## 十三、Demo 模块

- **模拟**：选城市、选向导、选价格、`Start Trip`。  
- **不执行链**、不发起真实 `deposit`；仅 UI 状态机或 toast。  
- 显著标注 **Simulation** / **Preview**。

---

## 十四、Token System（三币叙事与合规框）

本模块为**融资与产品沟通**核心，须与 **01 / 82 / 83 / 84** 一致，**禁止**暗示「持币即享固定收益」。

| 叙事层 | 建议定义（与 SSOT 对齐） |
|--------|---------------------------|
| **Settlement（结算币）** | **订单 Escrow 结算**以 allowlist **稳定币**为主（如 USDC），见 **01**；**非**平台任意新发「旅游支付币」替代结算，除非单独产品决策并全量改 01/04/14/08-4。 |
| **Governance（治理）** | **TTG / 治理代币** 为 **Target**，经济参数见 **83/84**；**FeeRouter 区域/Global 分账（如 45/55）** 的 **100% 分子** 以 **84 §1.1.1** 为准（**不含** L1/L2 gas；**仲裁费**、向导侧 **`IdentityStakingPool` 系 `slash`（USDC）** 与上述分账 **正交**，见 **Runbook §7.1**、**81/14**）；**国家承销桶 vs 个人/全局桶**、**禁「分红」措辞** 见 **84 §1.5**、**83 §19**；披露见 **governance-token/01**、**08-4**。 |
| **Travel（旅行效用层）** | **积分 / 会员 / 生态效用** 或路线图通证；**须**在对外稿中区分于**证券式分红**；具体权利义务以法务稿为准。 |

**图表**：用途、锁仓、释放曲线等**仅展示已法务审阅**版本；数字与 **84** 承销/费用分母勿混用（见 **84 §1.3**）。

---

## 十五、Allocation 模块（融资核心）

| 项 | 规格 |
|----|------|
| 标题示例 | `Early Access Allocation` |
| 展示 | **Tier**、**Progress**、**Remaining**（数据与 **84**、内部 CRM 一致） |
| 与费用/代币叙事边界 | 本模块仅承载 **承销档位与进度**；**勿**与 **84 §1.1.1**（订单侧可分配费用基数）、**governance-token/02 §2.5**（TTG 供应 **100%** 行表）混为同一套「百分比」故事；链上路由与账户归属以 **83** + **[Runbook](../../ops/RUNBOOK.md) §7.1** 为闭合参考。 |
| CTA | `Get Early Access` / `Secure Spot` → 跳转已合规的认购流（链下表单或已审计合约，**不在本文假定**） |

---

## 十六、Trust 模块

- **Escrow 流程**、**向导锁单**、**DAO** 角色、**资金流**（可链路至 [08-4-附录](08-4-附录-收益流闭环图-FeeRouter-Target.md)）、**黑名单 / allowlist**、**评分与终态** 等。  
- 与 **83 附录 I**、**13-1** 金融区表述一致：**资金区像银行**，避免霓虹娱乐化。
- **强制披露（DAO / FeeRouter / 链上治理）**：凡出现 **DAO**、**区域池**、**手续费路由**、**TTG** 等措辞，须在 **Trust 块内或紧邻 FAQ** 标注 **Target / 路线图** 或 **「链上未部署前不构成已生效承诺」**（口径同 [13-1](13-1-UI产品级SSOT与页面规范.md) **表 2-续**、[83](83-区域治理与收益分配-协议白皮书.md) **附录 I.0**）；**不得**暗示页面数字或动画等于链上真路由或与 **认购/固定收益** 挂钩（见 **§十四**、[08-4](08-4-对外口径包.md)）；融资页另须满足 [governance-token/LEGAL-SIGNOFF-CHECKLIST](governance-token/LEGAL-SIGNOFF-CHECKLIST.md) **含「13-1 表 2-续」勾选项**。

---

## 十七、Global Map 模块

- 地图或抽象世界底图；**点亮国家**、路径、扩展动画；与 **84** 十国阶段可联动高亮（数据以表为准）。

---

## 十八、FAQ 模块（建议问题）

- 钱安全吗？（Escrow、非托管表述边界见 08-4）  
- 是否必须持有某 Token 才能旅游？（与 01 结算币关系）  
- 怎么结算？  
- 是否已上线某链某功能？（按实际部署诚实作答）  
- 如何仲裁？（指向 01/03 争议路径）

---

## 十九、CTA 模块

- `Join Early Access`、`Become Guide`、`Partner` 等。  
- **Sticky** 底部或侧边按钮（注意 **a11y** 与遮挡可读区）。  
- 与 **13-1** Zone Control：CTA 不得压在关键金融说明文字上。  
- 若链向「发现 / 撮合」主流程，**统一** **`/market`**（**`/discover`** 仅为 **`/market`** 的重定向壳；**不**并列两个同义按钮）。

---

## 廿、UI 规范

| 维度 | 建议 |
|------|------|
| 风格 | Futuristic + Glass + **Dark** + Grid；与 **28** 玻璃态可融合，**Escrow 相关句段保持克制** |
| 网格与间距 | 8px baseline |
| 动效 | 约 **200ms** 微交互；**scale ≤ 1.05**；渐变与 **blur** 适度，避免可读性下降 |
| 对比度 | 满足 WCAG 目标（见 **37** / Lighthouse a11y） |

---

## 廿一、性能

| 指标 | 目标 |
|------|------|
| 粒子实例 | **≤ 100**（或等价绘制批处理），低端机可降载 |
| FPS | **≥ 55**（主流笔记本 Chrome 目标）；不达标则减粒子、降模糊与阴影 |
| 其他 | **OffscreenCanvas**（若浏览器支持）、视频 lazy、路由级 **code split** |

---

## 廿二、合规与对外表述（强制）

**禁止书写**：

- 固定 **ROI**、保证**收益**、承诺**回本**、与股价/股权直接类比。

**应书写**：

- **Access（参与资格）**、**Utility（效用）**、**Participation（参与方式）**、**Risk（风险）**；与 [08-4](08-4-对外口径包.md) 一致。
- **常驻结算披露（T2）**：页面凡出现「One Token」或 **TTG** 叙事，须在 **Settlement** 脚注或 **Trust/FAQ** 邻近位置写明 — **订单 Escrow 实际结算**以 **allowlist 稳定币（如 USDC）** 为主（与 **§十四**、[01](01-总库总览.md)、[04](04-后端与API.md) 一致）；**TTG / Country Pool** 为路线图或融资层时须标注 **Target**，勿暗示已替代结算币。

**社会证明**：Logo墙、数据、证言须**可验证**或标注来源；禁止虚构机构背书。

---

## 廿三、验收维度（自检用）

以下为**内部评审维度**，非对外评分承诺：

| 维度 | 检查要点 |
|------|----------|
| 视觉 | 与 25/28 一致的高级感与克制 |
| 产品 | 与真实功能（Escrow、锁单、DAO 边界）**无矛盾** |
| 转化 | CTA 路径清晰、加载可接受 |
| 信任 | Trust/FAQ 与 01/08-4 一致 |
| Web3 | 钱包与链 ID 行为正确、错误态完整 |
| 融资 | 数字与 **84**、披露与 **LEGAL-SIGNOFF** 一致 |
| 合规路由 | **04 §3.4 / 13-1** 已登记落地路径；**LEGAL-SIGNOFF** 含 **分母与正交**、**收益流图示脚注**；**T2**（USDC 常驻结算披露）在页面上**可见** |

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.19 | 2026-04-19 | **§十四 叙事表**：向导罚没与 **84 §1.1.1** 正交句 — **`Staking.slash`** → **`IdentityStakingPool` 系 `slash`**（**81/14**）。 |
| 1.0.18 | 2026-03-30 | **§二 2.6 / §三 / §四 / §五.2**：与当前 `layout.tsx` 深色壳一致；新增 **全页环境粒子**、**Hero 旅游柔光**、**`#overview` 概览区**（四卡 + 痛点/方案双栏）；锚点导航增 **`overview`**、移除独立痛点/方案项；**ICO 式分段**以外链 [Nefe Coin ICO](https://ico.nefecoin.com/?utm_source=CryptoTotem) 为**排版节奏参考**（非功能背书）；`TravelTrustNetworkParticles` 支持 **`tone="hero"`**。 |
| 1.0.17 | 2026-03-30 | **§2.1 样式**、**§廿 风格**：显式 **86/22/28** 分工与 **07 §五 5.3**，避免「样式唯 28」误读。 |
| 1.0.16 | 2026-03-30 | **文首版本**与变更表对齐；读前摘要补 **86/22** 与 **07 §五 5.3/5.3A**；**1.0.15** 联动句显式 **86**（**`/traveltrust`** Experience）。 |
| 1.0.15 | 2026-03-30 | **§十九 CTA**：撮合入口只链 **`/market`**，与 **`/discover`→`/market`** 实现一致；联动 **`frontend/app/traveltrust/page.tsx`**、**04/13-1/** **86/22**/28/**00**、**07**。 |
| 1.0.14 | 2026-03-30 | **视觉与壳**（历史）：`/traveltrust` 曾采用暖色全页底、Hero 双栏与金渐变 CTA、章节导航/统计/Demo/Sticky 条暖色变体；**已由 1.0.18** 深色底+粒子+概览区取代。**§二 2.6** 代码索引；**顶栏** **`/pay`** 自主导航移除（仅用户菜单）；联动 **04/05/07/00/13-1/14/缺口**、**`frontend/README`**。 |
| 1.0.13 | 2026-03-30 | **入口 IA**：取消顶栏独立「网络」项；**深色字标「TravelTrust」**（`Header.tsx`）→ **`/traveltrust`**；**「Web3旅行」** 仍 → **`/`**；**13-1** 顶栏说明、**00/80** 索引行、**`header_network` i18n** 移除。 |
| 1.0.12 | 2026-03-29 | **工程**：**sticky 章节锚点导航**（`TravelTrustSectionNav`）、**Trust 事实列表**（Escrow/allowlist/向导争议/Target 脚注）；**`#settlement`**、**`#trust-facts`**；**04 §3.4** `/traveltrust` 行、**00/07** 双写。 |
| 1.0.11 | 2026-03-26 | **读前摘要**：IA/04·13-1/84/53 分工；仅导航。 |
| 1.0.10 | 2026-03-26 | **入口**：补 Landing **页脚产品列** →`/traveltrust`（历史同期曾规划顶栏「网络」项；现改为字标入口，见 **1.0.13**）。 |
| 1.0.9 | 2026-03-26 | **页面入口**（历史）：曾约定顶栏「网络」→`/traveltrust`、独立 Logo→`/`；**1.0.13** 起改为字标→`/traveltrust`、**「Web3旅行」**→`/`。 |
| 1.0.8 | 2026-03-26 | **路由 SSOT** 闭合：`/traveltrust` 写入 **04 §3.4**、**13-1**；**§廿三** 合规路由与实现一致；前端 **Partial** 壳（历史顶栏「网络」表述见 **1.0.13**）。 |
| 1.0.7 | 2026-03-26 | **§廿三** 验收表增 **合规路由** 行（04/13-1、LEGAL-SIGNOFF、T2 可见性）。 |
| 1.0.6 | 2026-03-26 | **SSOT** 链 **84 §1.1.1**、**Runbook §7.1**；**§十四** 治理行补 FeeRouter 基数与正交；**§十五** 防 Allocation 与费用/02 §2.5 混读；**§廿二** 常驻 USDC 结算披露（T2）。 |
| 1.0.5 | 2026-03-26 | **SSOT 表** 增 **governance-token/02 §2.5**（**100%** 分解；Allocation 模块数据须与定稿表一致）。 |
| 1.0.4 | 2026-03-26 | **§十四**：**84 §1.5 / 83 §19** 互链（国家 vs 个人桶、措辞禁「分红」）。 |
| 1.0.3 | 2026-03-26 | **SSOT 表** 增 **81 / 08-3**（向导质押与 TTG/FeeRouter 分称），与 **82 §六**、**84 §八** 防呆一致。 |
| 1.0.2 | 2026-03-26 | **§十六 Trust**：DAO/FeeRouter/Target 强制披露与 13-1 表 2-续、LEGAL-SIGNOFF 勾选项；**§十四** 补 **83** 互链。 |
| 1.0.1 | 2026-03-26 | 维护责任：重大文案联动 **82/83/84** 与 `governance-token/LEGAL-SIGNOFF-CHECKLIST`（补 **83**，避免仅盯 82/84 导致 FeeRouter 叙事漂移）。 |
| 1.0.0 | 2026-03-26 | 初版：IA、模块规格、技术栈与仓库对齐说明、三币合规框、性能与合规强制项。 |

---

*本文与 [00-文档索引](00-文档索引.md)、[01-总库总览](01-总库总览.md)、[82-治理币-文档总览](82-治理币-文档总览.md)、[83](83-区域治理与收益分配-协议白皮书.md)、[84](84-第一阶段10国Country-Pool发行参数总表.md)、[08-4](08-4-对外口径包.md)、[13-1](13-1-UI产品级SSOT与页面规范.md)、[86-UI-双系统未来风-风格与动效技术规格](86-UI-双系统未来风-风格与动效技术规格.md)、[22-Design-Tokens-旅游Web3融合体系-v1.0.md](22-Design-Tokens-旅游Web3融合体系-v1.0.md) **§一点五**、[07-开发流程与顺序](07-开发流程与顺序.md) **§五 5.3A**、[25](25-顶级UI标准-Landing-Discover-Itinerary.md)、[28](28-Cinematic-Glassmorphism-Web3融合规范.md) 配套。*
