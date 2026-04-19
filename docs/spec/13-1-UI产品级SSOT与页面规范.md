# UI 产品级 SSOT 与页面规范（避免 AI 跑偏）

**与 [13-协议级UI设计宪法](13-协议级UI设计宪法.md) 关系**：13 已锁死**风格与边界**（资金区像银行、3D 只在情绪层等）。本文档补**信息架构 + 页面职责 + 交互边界**，作为**产品级 SSOT**，避免 AI 把每个页面做成「万能页」或混入错误情绪/布局。05 §九 以 13 为准；**页面层次、角色权限、交易交互与异常态**以本文为准。**协议级四类角色命名与不变量**与 **[87-TravelTrust-角色体系技术文档-融合架构版](87-TravelTrust-角色体系技术文档-融合架构版.md)** 同读；下文 **表 2** 为**路由×页权**矩阵，与 **87** 分层见 **表 2 融合注**。  
**UI 风格定稿**：**Experience（`/`、`/traveltrust`）页身外观**（色、动效、粒子/Hero、桥接渐变等）以 **[86-UI-双系统未来风-风格与动效技术规格](86-UI-双系统未来风-风格与动效技术规格.md)** 为 **视觉 SSOT**；**全局顶栏（`Header.tsx`）** 自 2026-03 起 **全路由统一白底深字**（与 **86 §6.0** 一致），**不**再随 Experience 路径切换玻璃浅字顶栏。**Cinematic 叙事结构、三层融合、组件清单** 以 **[28-Cinematic-Glassmorphism-Web3融合规范](28-Cinematic-Glassmorphism-Web3融合规范.md)** 为准（见 28 篇首分工）。**`/market`**：**86 Business 降级** + **28/29** 信息与撮合；全页底与 **`/traveltrust`** 同系暖色场域：**`WarmRouteFieldBackdrop`**（`#14100d` + **`bg-traveltrust-atmosphere`** + **`bg-traveltrust-dot-grid`**，经 **`MarketAmbientBackdrop`**）；**`/did-rank`** 与 **`/community/*`** 共用同一暖场底，并叠 **静态** 赛博渐变（**`bg-scifi-gradient-static`**）与 **领奖台柔光**（**无**全屏 Three 粒子、**无** `bg-scifi-grid` 与 **`animate-did-gradient`** 位移动画），与 **`/market`** 切换时色差可控；**实现真值与缺口审计**见 **[88](88-五主路由页身实现快照与UX缺口审计-20260330.md)**。**`/discover`** 仅为 **重定向壳**，列表与角标验收以 **`/market`** 为准；表 1 关键组件与 **28 §5** 清单一致。**风格迭代**（含配色）须走 **[22 §一点五](22-Design-Tokens-旅游Web3融合体系-v1.0.md)**，**不改** 页面职责与路由（**86 篇首「定稿口径」**）。  
**全系统页面在技术栈中的位置**（用户层/市场/Escrow 等，与 **53** 主链对齐）：[18-TravelTrust-全系统架构图](18-TravelTrust-全系统架构图.md)、[18-补充-TravelTrust-全系统架构层级图-最终版](18-补充-TravelTrust-全系统架构层级图-最终版.md) §1；**订单步骤条与协议区**扩展以 **[53-阶段开发技术文档](53-阶段开发技术文档.md)**、**[29-自由市场-撮合控制台规范](29-自由市场-撮合控制台规范.md)** 为准。**治理页 `/governance` 与链上 DAO** 的产品 vs 合约边界见 **§二 表 2-续**、[83-区域治理与收益分配-协议白皮书](83-区域治理与收益分配-协议白皮书.md) **附录 I.0**；**治理控制台 IA**（含 **发起提案**、**角色视角**、**影响面板**、**移动端**）、分页面、时间轴与文案见 **[89-治理UI-全球旅游市场治理控制台设计规格](89-治理UI-全球旅游市场治理控制台设计规格.md)** **2.0.8**（**§5.0** 注册·多身份·地区代理商）。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **规范分层宪法 / 86 与 P0 冲突裁决** | **[00-Spec-Constitution-规范宪法.md](00-Spec-Constitution-规范宪法.md)**、**[Spec-CONFLICT-RESOLUTION-冲突处理.md](Spec-CONFLICT-RESOLUTION-冲突处理.md)** |
| **页面地图、每页「不做什么」** | **§二 表 1**（含 **`/traveltrust`**、**`/did-rank`**；**`/discover`→`/market`** 与 **[04 §3.4](04-后端与API.md)** 一致） |
| **角色 / RBAC / 导航** | **§二 表 2**、**表 2-续**（`/governance` vs **83 附录 I.0**）；**87 §1.3** 用语 + 协议四类 vs 本表「旅行者/向导/…」见 **表 2 融合注** |
| **治理域 IA、提案创建/详情/影响面板、执行时间轴、角色视角、金库/区域、移动端** | **[89](89-治理UI-全球旅游市场治理控制台设计规格.md)** **2.0.8**（**表 1** 仍锁页面职责；**89** 为治理子域 **Target** 规格） |
| **金融区 / Zone Control / 交易交互** | **§二 表 3、表 4**；**全站 F/X/G 分区与粒子/Hero 裁决** **[92](92-P0-全站UI分区控制表-金融体验灰区与动效裁决.md)** |
| **异常态清单** | **§二** 下文「异常态清单」；Escrow 扩展见 **[53](53-阶段开发技术文档.md)** |
| **风格宪法（情绪层 vs 资金层）** | **[13](13-协议级UI设计宪法.md)**（**§一 1️⃣** 补充款）；**Experience 视觉 [86](86-UI-双系统未来风-风格与动效技术规格.md)**；**叙事结构 [28](28-Cinematic-Glassmorphism-Web3融合规范.md)** |
| **浅色页 AA / 触控与对比度（B-107）** | **基线**：与 **[13](13-协议级UI设计宪法.md)**、**[22 §一点五](22-Design-Tokens-旅游Web3融合体系-v1.0.md)** 一致；五主路由页身抽检互证 **[88](88-五主路由页身实现快照与UX缺口审计-20260330.md)**、**[05 §九](05-前端总览.md)** |
| **新路由契约门禁（B-108）** | 新增 **`frontend/app/**/page.tsx`** 须同批 **[04 §3.4](04-后端与API.md)** + **本文表 1** + **`scripts/run-check-04-routes.sh`**（**`check-04-routes-vs-code.py`** 等）；**验收**以脚本绿与表内登记一致为准 |

---

## 一、最容易让 AI 跑偏的 6 类问题

| # | 问题 | 后果 | 本文应对 |
|---|------|------|----------|
| **1** | 没有「页面职责声明」 | 每页都变成旅游内容 + 交易按钮 + 3D + 社交 | §二 表 1：每页**唯一任务 + 明确不做什么** |
| **2** | 没有「信息层级规则」 | AI 先堆视觉再堆内容，金融信息被弱化 | §二 表 4：锁死金融页信息层级（状态→金额→finality→动作→风险提示） |
| **3** | 没有「展示区 vs 金融区」布局隔离 | 旅游情绪混进签名按钮区 | §二 表 3：Zone Control（统一金融区组件、信息密度与间距/字体） |
| **4** | 没有「角色工作空间」入口与导航规则 | 角色隔离只停留在原则，路由与 RBAC 未定 | §二 表 1、表 2：角色切换入口、每角色可见页面与动作 |
| **5** | 没有「交易交互规范」 | 钱包交互被做成普通表单提交 | §二 表 4 + 下文「交易交互规范」：Signature/Tx Modal、chainId/contract/amount/gas/finalityN、txMachine 状态必现 |
| **6** | 没有「异常态与风控态页面」 | 只画 happy path，异常态缺失击穿可信度 | 下文「异常态清单」：未连接、错链、allowance 不足、OFAC、disputeWindow 过期、reorg 回滚提示等 |

---

## 二、UI SSOT 四张表

### 表 1：页面地图（Information Architecture）

按**协议产品**分组，每页：目标 / 输入 / 输出 / **不做什么** / 关键组件。

| 分组 | 页面 | 唯一任务（目标） | 不做什么 | 关键组件 |
|------|------|------------------|----------|----------|
| **Experience（情绪层）** | Landing | 品牌叙事 + 抽象资金流、引导进入协议 | 不放交易按钮、不堆链上操作 | Hero、可信承诺行+TrustBadgesRow、TrustInfraWall、CTA（**组件清单 [28 §5](28-Cinematic-Glassmorphism-Web3融合规范.md)**；**外观 [86](86-UI-双系统未来风-风格与动效技术规格.md)** + **[22 §一点五](22-Design-Tokens-旅游Web3融合体系-v1.0.md)**） |
| **Network（融资向）** | **TravelTrust 网络（/traveltrust 或 /network）** | 品牌/协议级 **网络叙事** + 合规融资转化入口（见 [85](85-TravelTrust网络落地页-融资级设计与开发规格.md)）；**`/network`** 重定向至 **`/traveltrust`**（与 [04 §3.4](04-后端与API.md) 前端路由表一致） | **不做**单笔订单 Escrow 主流程、**不做**完整 DApp 控制台堆叠 | **Partial**：`frontend/app/traveltrust` 最小壳；**T2** 结算披露（allowlist 稳定币 vs TTG/Target）须在页面 **Trust 邻近**可见；完整 IA/三币框/动效以 **85** 验收 |
| | **Discover（`/discover`）** | **路由壳**：**`/discover` 客户端重定向至 `/market`**（**[04 §3.4](04-后端与API.md)**、**`app/discover/page.tsx`**）。**「发现」列表与卡片**不在此路径单独实现，与下行 **自由市场** 同一套 UI。 | 不在 **`app/discover`** 维护第二套订单/向导卡片列表 | 过渡/loading（**`app/discover/*`**）；角标与列表验收见 **自由市场** 行 |
| **Protocol Console（协议控制台）** | **自由市场（/market）** | **撮合行程与向导**：发现订单（**GET `/api/v1/discover/orders`**）+发现向导、邀请/接单、协商、去 Escrow；**承接原 Discover 列表心智与 UI** | **不出现支付/链上操作堆叠**、不做论坛/3D | 双栏（订单流+向导库）、ViewSwitcher、StickyFilterBar、OrderCard/GuideCard、Drawer、EmptyStates、EscrowEnabledBadge/SupportedTokensPill、Escrow pricing、TrustInfraWall（[29](29-自由市场-撮合控制台规范.md) **撮合**；**28** **组件/IA**；**Business 外观 [86](86-UI-双系统未来风-风格与动效技术规格.md) 降级** + **[22 §一点五](22-Design-Tokens-旅游Web3融合体系-v1.0.md)**） |
| **Protocol Console（协议控制台）** | **TT社区（/community）** | **UGC 信息流**：**L1** 主 Tab（动态\|发现\|消息\|好友\|我）；**L2** **「帮助与支持」下拉**（**`CommunitySupportMenu`**）：建议与反馈（`/community/feedback`）、帮助中心（`/help`）、社区规范（`/terms/community-guidelines`）三项同型归并，**不与** L1 Tab 并列（见 [31 §5.1.0](31-TT社区页面设计.md)）；旅行者与向导发帖（照片/旅游/美食/视频）、点赞/收藏/评论/关注、按推荐/关注/最新/最热与目的地/类型筛选。**费路由/治理**不在该下拉，见 **`/help`**、**`/traveltrust`**、页脚、**`ProductCrossNav`** | **不支付、不撮合、不在此页做 Escrow 操作**；不做 28 玻璃态 Hero | **暖场 + 静态赛博叠层**（**`WarmRouteFieldBackdrop`**、`layout.tsx`）；卡片/Feed 仍 **cyan/fuchsia** 霓虹语义（**31**）；壳层**无** `Web3SciFiBackground`、**无**背景网格位移动画（**88**）；子路由、空态、骨架、loading/error |
| **Protocol Console（协议控制台）** | **DID 排行榜（/did-rank）** | **竖脊切换三签**：旅行者 / 向导 / 商家（商家占位）；**内页翻页**动效（**30 §1、§4.3**）；**`?board=`** + 时间范围与 **`rank_basis`** 元数据（见 [30](30-DID排行榜-页面规范.md)、[04-附录 did-rank](04-附录-did-rank对接说明.md) §2）；**`GET …/itineraries` 行程榜** API 仍存，**当前页不展示**；**Me** 高亮与 **`?me=`** 对齐 | **不做** Escrow 签名与单笔支付；**不做**社区 Feed；评价/信誉加权排行见 [04-附录 §3.1](04-附录-did-rank对接说明.md)（**Target**） | **暖场 + 静态赛博叠层**（**30 §4.1**）；**`framer-motion`** 脊签切换（**30 §6**）；榜单 **cyan/fuchsia**（**30 §4.2**）；**无**全屏 Three、**无** `bg-scifi-grid` / **`animate-did-gradient`** 背景漂移；`getDidRankTravelers`/`Guides`、`normalize*Row` |
| **Protocol Console（协议控制台）** | OrderFlow | 步骤引导：草稿→确认→付款→完成；**53 阶段扩展**为草稿→**向导确认→双边确认**→确认→付款→完成→**评分→资金释放**（详见 [53-阶段开发技术文档](53-阶段开发技术文档.md) §3.2）；状态机可视化 | 不放大图/强情绪、不用 3D | 步骤条、状态、金额、签名入口 |
| | EscrowDetail | 托管单笔状态、金额、参与方、finality、允许动作（链下确认行程完成/**release**/争议）；**53 约定**：订单/Escrow 详情页内**协议控制台区**（行程与预算、报价摘要、步骤条、聊天、操作区）采用 [30-DID 赛博朋克](30-DID排行榜-页面规范.md) §4，以 53 为准。**企业级 UI/UX**（信息层级、留白、异常态、动效、a11y）以 [53 §4.4](53-阶段开发技术文档.md) 验收清单为准。 | 默认禁止霓虹/强动效、禁止 3D；**协议控制台区**以 53+30-DID 为准 | 状态、金额与币种、时间与 finality、操作区、风险提示 |
| | **Escrow 评分子页（`/escrow/:id/rate`）** | **53-S8**：行程评分材料上传与 **`orderConfirmRating`**；**订单处于可评价资金终态**时内嵌与 Escrow 详情相同的链下文字评价（**REST** **`GET`/`POST`** **`api/v1/orders/:id/reviews`**；列表 **权重**、**`meta.review_weight_*`**、提交 **`weight_breakdown`**，与 **04 / 90** 一致） | **不做**链上 **release** 的**唯一**入口（释放仍回 **`/escrow/:id`**） | 与详情共用 **`ReviewBlock`**（**`variantDid`**）、**`EscrowRateRouteSuspense`** |
| | Dispute | 证据时间线、可裁决项、裁决执行记录、可追溯 hash | 禁止 3D、禁止装饰性动效 | 时间线、证据列表、裁决表单、tx 记录 |
| **Governance（治理）** | **`/governance`** **及子路径**（总览、提案列表/详情、**提案创建器·89 Target**、金库、区域、我的治理、代表/席位等；**创建器** 独立 `page.tsx` 落地前勿写可机读裸路径以免 CI 误抽） | **链上治理控制台**：**发起**（达链上阈值）、提案与投票、**影响面板**、**执行时间轴**、区域/金库/DID 业务叙事；**非**旅游 Feed | **不放**撮合下单、**不放**社区 Feed 主内容 | 参数表、提案列表、投票 UI、**IA 与分页面规格** **[89](89-治理UI-全球旅游市场治理控制台设计规格.md)** **2.0.8** |
| **Ops（内部）** | Admin / Runbook / Evidence Viewer | 内部运维与证据查看 | 不对外暴露为默认入口 | 按角色 RBAC |
| **个人中心（/me 或 /account）** | **账号维度统一入口（类淘宝「我的」）**：用户点击**顶栏头像/账号**进入；含 **我的订单**、**我的行程**（生成的行程/草稿）、向导侧**我的接单**、个人资料与设置；与 [31 TT社区「我」](31-TT社区页面设计.md) **互通**（见下表「个人中心与 TT 社区·我 互通」）。**不在此页做**：支付/链上签名（在 Escrow 详情）；发帖/Feed（在 TT 社区）。 | 订单列表（卡片或列表、状态筛选）、行程列表（草稿/已发布）、接单列表（向导）、资料/设置、**入口到 TT 社区·我** |

**个人中心与 TT 社区「我」互通（类淘宝：点头像找订单）**：

| 入口 | 去向 | 说明 |
|------|------|------|
| **顶栏头像/账号** | **个人中心**（/me 或 /account） | 全站统一：点击头像或账号名进入「我的」空间，与淘宝「我的淘宝」一致。 |
| **个人中心** | **我的订单**（/me/orders 或 /orders）、**我的行程**、**我的接单**（向导）、资料/设置、**TT 社区·我** | 订单列表展示当前用户作为旅行者/向导的订单，支持状态筛选；点击订单进入订单详情或 Escrow 详情。**生成的行程**在「我的行程」或「我的订单」中可查（订单关联行程，订单卡可展示行程摘要）。 |
| **个人中心 → TT 社区·我** | /community/me | 显式入口「去 TT 社区·我」或「我的动态/帖子」；同一账号，不重复登录。 |
| **TT 社区「我」**（/community/me） | **我的订单 / 我的行程** 入口 | 显式入口「我的订单」「我的行程」跳转至个人中心或 /orders，避免用户只在社区时找不到订单。 |

**结论**：**个人中心** = 订单与行程的**主入口**（点头像即进）；**TT 社区「我」** = UGC 侧（帖子、收藏、关注）；两者**互通**，一处可到另一处，且用户从任意一处都能找到「我的订单」与生成的行程。

*输入/输出细节见 §二 表 4 关键页字段级信息结构。*

---

### 表 2：角色 × 页面权限矩阵（RBAC）

**表 2 与 [87](87-TravelTrust-角色体系技术文档-融合架构版.md) 融合注**：**87** 锁死协议侧 **Traveler / Guide / Shop（UI）·`provider` / Region Steward** 及 **UI·API·合约**分层；本表是**工作空间与页权**（含**仲裁员**、**治理者**、**观察者**、**Admin**）。**旅行者 = Traveler（协议 SSOT 中文）**；**旅行者** 为产品常用同义词，与 **旅行者** 同一角色（UI 文案「旅行者」可保留；API 收敛 **`traveler`** 见 **87 §1.2～§1.3**、**04 §二 2.1**）。**治理者 + `/governance`** 为产品治理入口；链上投票权以 **治理代币（TTG）** 与 **[governance-token/02 §4.5](governance-token/02-对内技术规格-草案.md)** 为准，**不**由表 2 产品身份单独决定。**Region Steward** 绑定 **FeeRouter/83**，**不**参与订单内 Escrow 操作叙事（**87 §5**）。**商铺（`provider`）**：订单参与方见 **87 §4**、**14**；独立商铺工作台路由与 RBAC **落地前**可按订单关联 **Partial**。**仲裁员** = 争议**裁决执行**，见 **87 §6** 注、**100**。

| 角色 | 可访问页面 | 可执行动作 | 必须隐藏/限制 |
|------|------------|------------|----------------|
| **旅行者** | Landing、**自由市场（`/market`；`/discover`→`/market`）**、OrderFlow（自己订单）、EscrowDetail（参与方）、Profile、**TT社区** | 下单、付款（签名）、**确认行程完成（链下 API）**、评分路径后 **release（钱包）**、发起争议、**社区发帖/点赞/收藏/评论/关注** | 仲裁/治理/Admin |
| **向导** | Landing、**自由市场（`/market`；`/discover`→`/market`）**、OrderFlow、EscrowDetail、Profile、我的接单、**TT社区** | 接单、**确认行程完成（链下 API）**、**release**、争议响应、**社区发帖/点赞/收藏/评论/关注** | 仲裁裁决、治理投票、Admin |
| **仲裁员** | Dispute（分配案件）、证据与时间线、裁决提交 | 裁决、执行器触发（若权限） | 非分配案件、治理敏感操作 |
| **治理者** | Governance、Proposals、Params | 提案、投票、参数查看 | 资金操作、仲裁裁决 |
| **Admin** | Admin 工作台（`/admin` 及子路由，含 **`/admin/community/*`**、**`/admin/lifecycle`** 等） | 用户/角色管理、订单监管、争议运营、审计检索、审批工作台、财务摘要、**Schema/索引器/API 版本/160 社区治理只读台账/350 生命周期只读**（最小实现） | 公共导航默认不暴露；未授权 fail-closed（401/403） |
| **观察者** | Landing、**自由市场（`/market`；`/discover`→`/market`）**、公开 Escrow 状态（只读）、**TT社区（仅浏览）** | 无写操作 | 所有写与签名、社区发帖/互动需登录 |

### 表 2-续：`/governance` 产品页 vs [83](83-区域治理与收益分配-协议白皮书.md) 链上治理

| 对象 | 边界 |
|------|------|
| **本表「治理者」+ 路由 `/governance`** | 产品内治理入口；**IA Target** 见 **[89](89-治理UI-全球旅游市场治理控制台设计规格.md)**。已登记前端路由与契约见 **[04 §3.4](04-后端与API.md)**：含 **提案列表/详情**、**委托**、参数与路由事件等；Governor 模式下投票计票须与合约**一致**，不得伪造链上状态。**`pool` / `rewards`** 及若干经济投影页仍以 **只读或占位叙事**为主（与 **04** `GET` 行、**82** 一致）。**89** 所列 **完整影响面板**、treasury/regions 等 **Target** 与实现对拍；**提案创建器** 等子路径须待 **`page.tsx`** 落地后再于 **04** 单行登记。**禁止** 将 **`fee-pool-aggregates` Σ** 等投影累计冒充 **`pool`** 链上主读或链上已执行（与本表下行、**83** 一致）。**工程**：**母表 B-432** **`check-b432-governance-ui-ssot-surface`**（**`run-check-04-routes`** 串联末步）钉死 **B-428** 演示路径之 **`frontend/app/governance/*`**、**`/staking`** 与 **`governance_b428_closeloop_doc_pointer`** i18n（**不**替代 **04** 全量表） |
| **`/governance/distribution-accruals`（及 `[id]`）** | **P5-4-2**：应计分录叙事 **只读**；消费 **`GET …/governance/investor-distribution-accruals`**；**不**冒充链上 **Claim** SSOT、**不**承担 **`fee-pool-aggregates`** Σ 主叙事；**不**从前台调用 **`/internal/`** 写接口（与 [04 §3.4 前端路由表](04-后端与API.md) 同批登记） |
| **`/governance/distribution-claim`** | **P5-4-1**：**`InvestorDistributionClaim`** **用户钱包** **`claim` / `withdrawDividend`**；**不**在 UI 封装 **`registerAccrual`**（**owner** 链上登记仍归 **B-115** 内网/运维路径）；**不**将 **`fee-pool-aggregates`** Σ **文案化成** Claim 主叙事；合约地址 **`NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS`**（与 [04 §3.4](04-后端与API.md)、[evidence/GO_P5_4_CLOSE.md](../../evidence/GO_P5_4_CLOSE.md) 同批） |
| **[83](83-区域治理与收益分配-协议白皮书.md) GlobalDAO / RegionDAO** | **FeeRouter 比例、Snapshot、Seat、Claim** 等以**链上合约 + 治理流程**为权威；后端 **禁止**直接改池内余额或分配比例；职责矩阵见 **83 附录 I**（含 **I.0** 与本表对照） |
| **82 / 84 / 08-4** | 经济数字与对外口径的 SSOT；募资与 **Country Pool** 叙事见 [84](84-第一阶段10国Country-Pool发行参数总表.md)；**FeeRouter 未上链前**不得对外宣称治理页数字=链上路由真值 |
| **Admin（表 2-补充）** | 运营/审批/审计；**不得**与「治理者」链上参数改动混为同一入口或同一套权限语义 |
| **公开治理区 → Admin 经济台账（交叉链）** | **Partial**：各 **`/governance*`** 主 **`nav`** 在 **`/traveltrust#fee-router`** 与 **`/help`** 之间挂 **`GovernanceOpsAdminLinks`**（**`/admin/finance`**、**`/admin/fee-router#admin-fee-router-events`**、**`/admin/region-vault#admin-region-vault-events`**）；**`governance/error.tsx`** 在 **治理·争议·支付** 脚注下 **`border-t` `nav`** 同挂 **`GovernanceOpsAdminLinks`**，**`aria-label`** **`governance_error_adminOpsNav_aria`**；**目标须 Admin RBAC**（未授权 **401/403**）；与 **表 2-补充** **Admin** 分层一致，**非**将治理者权限等同于运营后台；i18n **`governance_ops_admin_*`** / **`governance_error_adminOpsNav_aria`** |

**角色与顶栏（当前实现）**：顶栏**无角色切换**，仅「登录」「注册」及导航；左侧**深色字标「TravelTrust」**→ **`/traveltrust`**（[85](85-TravelTrust网络落地页-融资级设计与开发规格.md)、[04 §3.4](04-后端与API.md)），**不设**独立顶栏「网络」项；**字标** **非** **`<nav>`** 内第五链（与 **88** 文首、**07 §二 2.3 #9**、**86** 读前摘要一致）。**`<nav>`** 仅 **Web3旅行**（`/`）、**自由市场**（`/market`）、**DID排行榜**（`/did-rank`）、**TT社区**（`/community`）；主导航文案键 **`header_web3Travel` / `header_market` / `header_didRank` / `header_community`**（`frontend/locales/zh.ts`、`en.ts`）。**不含** **`/discover`**（该路由重定向至 **`/market`**）、**不含** **`/pay`**。**支付与托管**（`/pay`）及 **我的订单、个人中心、质押、用户反馈**等仅在**已登录用户顶栏下拉菜单**露出（**主入口**）；帮助页、各路由 **error** 恢复区、`ProductCrossNav` 等**非 `<nav>`** 场景可保留 **`/pay`** 深链，与 **04 §3.4** 表前总述一致。角色由**注册入口**（**目标态**：**旅行者** 首登主路径；**追加身份** 见 **[89 §5.0](89-治理UI-全球旅游市场治理控制台设计规格.md)** — 头像菜单申请向导/服务商/地区代理商等；**当前实现** 仍为 **四角色同页注册** 见 **04 §3.4**）与**路由/权限**自然区分（如 /disputes、**`/guide`（向导工作台）**、/guide/register、/governance 按权限可见）。若后续恢复「角色工作空间」入口，须与 13「角色必须空间隔离」一致并写死入口位置（如独立路由前缀 `/tourist` / `/guide` / `/arbitrator`）。

**登录态全站统一（与个人中心 / TT 社区数据同步）**：

- **单源**：全站登录态以 `localStorage.traveltrust_user_id` + 后端 `GET /api/v1/me`（请求头 `X-User-Id`）为唯一依据；个人中心、TT 社区、自由市场、订单等**共用同一套**，不做各自一份「是否登录」状态。
- **同步**：登录成功后前端写入 `traveltrust_user_id` 并清除 getMe 缓存、派发 `traveltrust:auth-change` 事件，顶栏等监听该事件以即时更新「登录/未登录」展示，避免社区已登录而个人中心仍显示未登录。
- **测试账号与权限**：测试账号（如种子接口）与功能权限（旅行者/向导/仲裁员/治理）由**后端统一**；前端仅根据 getMe() 或统一 Auth 展示，权限归类以**表 2 角色×页面权限矩阵**为准，不在各 UI 重复维护权限逻辑。

### 表 2-补充：Admin 工作台状态锚点（对齐 70）

| 项 | 口径 |
|----|------|
| **实现状态标签** | **Partial**（信息架构与 RBAC 已定义；前台默认导航不暴露 Admin 入口） |
| **当前基线** | 表 1 已定义 Ops 内部域（Admin / Runbook / Evidence Viewer）；表 2 已限制旅行者/向导不可见 Admin；前端路由现状含 **`/admin/users`**（**GET** + **`/admin/users/[id]`**（**GET** `…/admin/users/:id`，`routes.admin.userById`）+ **Modal POST** `role-change-request`）、**`/admin/guides`**（**GET** 向导入驻台账）、**`/admin/guides/[id]`**（**GET** `…/admin/guides/:id`，`routes.admin.guideById`）、**`/admin/orders`**、**`/admin/orders/[id]`**（**GET** `…/admin/orders/:id`，`routes.admin.orderById`）、**`/admin/disputes`**、**`/admin/disputes/[id]`**（**GET** `…/admin/disputes/:id`，`routes.admin.disputeById`）、**`/admin/reviews`**、**`/admin/reviews/[id]`**（**GET** `…/admin/reviews/:id`，`routes.admin.reviewById`）、**`/admin/audit`**、**`/admin/audit/logs/[id]`**（**GET** `…/admin/audit-logs/:id`，`routes.admin.auditLogById`）、**`/admin/approvals`**、**`/admin/approvals/[id]`**（**GET** `…/admin/approvals/:id`，`routes.admin.approvalById`）、**POST …/approve**（`writeRequestHeaders`）、**`/admin/finance`**、**`/admin/fee-router`**、**`/admin/region-vault`**；**orders/disputes/reviews/audit/approvals/finance/fee-router/region-vault/observability** 等页 UI **zh/en** 已入 **`frontend/locales`**（含 **`admin_em_dash`** 表格空值占位——**orders/disputes/audit** 全列与 **incident** 副标题等，替代 **`admin_approvals_dash`**；**`audit/operations` / `alerts/incidents*`** 顶栏 **`admin_schema_back`**；**非 Admin 前台**缺省占位键 **`ui_em_dash`**（与市场、社区、订单、托管详情、DID 榜、`StatusBadge` 等 **`t()`** 对齐，字形与 **`admin_em_dash`** 一致）**）、**`/admin/observability`**、**`/admin/audit/operations`**、**`/admin/alerts/incidents`**（含 **`[id]`**）、**`/admin/community/*`**（含 **`/reports`** 上 **moderation PATCH**、**`/penalties`** 上 **POST**、**`/comments/visibility`**（**PATCH** + **select** 枚举 **zh/en**）、**`/abuse-policy`**、**`/appeals`** **GET**、**`/appeals/review`** **POST**（**decision** **zh/en**））、**`/admin/compliance/requests/[requestId]/update`**（**status** **select** **zh/en**）、**`/admin/jobs`**、**`/admin/config/releases`**、**`/admin/secrets/metadata`**、**`/admin/scheduler/jobs`**（含 **rerun** 写）、**`/admin/tenants/scopes`**（含发布写）、**`/admin/compliance/requests`**（**`…/events`**、**`…/update`**）与 **`/admin/lifecycle`**、**`/admin/api-versions`**、**`/admin/policies`**（含 **publish** 写）、**`/admin/internal-tools/audits`**、**`/admin/flags`**（含 **publish** 写）等页 |
| **目标锚点** | 与 [70-管理员系统开发文档](70-管理员系统开发文档.md) §3.1、§6.4、§9.1/§9.2/§9.4、§12.6/§12.7/§12.8 及 [04-后端与API](04-后端与API.md) §3.5 保持同一状态口径 |

**UI Target（待实现，路由命名可在实现中微调）**：

| 页面/路由 | 最小能力 | 门禁 |
|-----------|----------|------|
| `/admin` | Admin 控制台首页（风险与待办聚合） | **Partial**：**`AdminHomeClient`** 壳头 **`Link`** → **`/admin/observability`**（**`admin_observability_title`**，与子页顶栏同口径）；**`app/admin/error.tsx`** 页级错误边界内联快链含 **`/admin/observability`**（与同路径 **hub/子页** 运维矩阵同口径）；**Retry** **`text-meta` **`admin_error_boundary_retry_hint`****+**`form aria-describedby`**+**`type=submit`**** **`reset()`**（**593**；**Home** 仍 **`Link`**）；域分组卡片含 **`/admin/indexer/reconcile-reports`**（对账报告列表，与 **`/admin/indexer`**/**可观测**/**审计** 等并列）；**`admin_home_desc_indexer`**/**`admin_home_desc_reconcile_reports`**（**locales**）互指 **report_type**/**chain_id** 与 **indexer health**/**列表**/**`reconcile/[id]`** 同键；仅 Admin |
| `/admin/users` | 用户与角色管理 | **Partial**：列表 **`GET …/admin/users`**（**URL 同步** `limit` / `role` / `kyc_status`，与 **`applied_filters`** 对齐；`routes.admin.users(params?)`）；详情 **`GET …/admin/users/:id`**（`routes.admin.userById`）；**Modal** **`POST …/users/:id/role-change-request`**（`routes.admin.userRoleChangeRequest`，`writeRequestHeaders`）；**`text-meta` **`admin_users_role_modal_filter_hint`****+**`<form aria-describedby>`**+**`name`** **`target_role`/`reason`****+**`type=submit`**/**`onSubmit` → **POST**（**589** **`568～588` 模态口径**）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**Reset 独 **`form` **`type=submit`**（**594** **续** **593**）；列表与详情顶栏 **`Link`** → **`/admin/approvals`**、**`/admin/observability`**；仅 Admin，操作必审计 |
| `/admin/guides` | 向导入驻台账 | **Partial**：只读 **`GET …/admin/guides`**（**URL 同步** `limit` / `status`，与 **`applied_filters`** 对齐；`routes.admin.guides(params?)`，审计 **`admin.guides.read`**）+ **`/admin/guides/[id]`**（**`GET …/admin/guides/:id`**，`routes.admin.guideById`，审计 **`admin.guides.detail.read`**）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**Reset 独 **`form` **`type=submit`**（**593**）；列表与详情顶栏 **`Link`** → **`/admin/observability`**；审核写链路仍 **Target** |
| `/admin/orders` | 订单监管视图 | **Partial**：只读 **`GET …/admin/orders`**（**URL 同步** `limit` / `state`，与 **`applied_filters`** 对齐；`routes.admin.orders(params?)`）、**`GET …/admin/orders/:id`**（`routes.admin.orderById`）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**Reset 独 **`form` **`type=submit`**（**593**）；列表与详情顶栏 **`Link`** → **`/admin/observability`**；仅 Admin |
| `/admin/disputes` | 争议运营视图 | **Partial**：只读 **`GET …/admin/disputes`**（**URL 同步** `limit` / `status`，与 **`applied_filters`** 对齐；`routes.admin.disputes(params?)`）、**`GET …/admin/disputes/:id`**（`routes.admin.disputeById`）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**Reset 独 **`form` **`type=submit`**（**593**）；列表与详情顶栏 **`Link`** → **`/admin/observability`**；仅 Admin / 仲裁运营 |
| `/admin/reviews` | 评价运营抽检 | **Partial**：只读 **`GET …/admin/reviews`**（**URL 同步** `limit` / `min_score` / `max_score`，与 **`applied_filters`** 对齐；`routes.admin.reviews(params?)`）+ **`/admin/reviews/[id]`**（**`GET …/admin/reviews/:id`**，`routes.admin.reviewById`）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**低分预设**/**清分** **独 **`form` **`type=submit`** **`router.push`**（**594**）；列表与详情顶栏 **`Link`** → **`/admin/observability`**；仅 Admin |
| `/admin/audit` | 审计日志检索 | **Partial**：只读 **`GET …/audit-logs`**（**URL 同步** `limit` / `actor_id` / `action` / `resource_type`，与 **`applied_filters`** 对齐；`routes.admin.auditLogs(params?)`）+ **`/admin/audit/logs/[id]`**（**`GET …/audit-logs/:id`**，`routes.admin.auditLogById`）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**Reset 独 **`form` **`type=submit`**（**593**）；顶栏链 **`/admin/audit/operations`**、**`/admin/observability`**；列表表内 **`action`**/**`actor_id`**/**资源**（有 **`resource_type`** 时 **`type:id`** 整格）**`Link`** → 本页对应 query（**保留**其余已应用筛选；**`lib/adminAuditLogsPath.ts`**）；**详情** 顶栏另链 **`observability`**；**详情** **`action`**/**`actor_id`**/**`resource_type`** 字段单筛 **`Link`**（**`adminAuditLogDetailFieldListHref`**，默认 **`limit=50`**）；仅 Admin |
| `/admin/audit/operations` | **120** 运维审计动作 | **Partial**：只读 **`GET …/admin/audit/operations`**（**URL 同步** `limit`，与 **`applied_filters`** 对齐；`routes.admin.auditOperations(params?)`；**`operations`** 为 **`action_catalog_v1`** 静态 **`{code,mutating}`** 目录，**非** DB 事件流；**`limit=200`** 可取全表；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**Reset 独 **`form` **`type=submit`**（**593**）；目录表各行链 **`/admin/audit?action=`**（与 **`GET …/audit-logs?action=`** 精确等值一致；`lib/adminAuditNav.ts`）；顶栏链 **`/admin/observability`** |
| `/admin/alerts/incidents` | **120** 告警 incident 入口 | **Partial**：**URL 同步** query **`incident_id`**（与输入框对齐）；**`text-meta` **`admin_alert_incident_hub_filter_hint`****+**`<form aria-describedby>`**（**568～570** **hub** **口径**）；**`type=submit`「打开详情」**+**`form` **`onSubmit`****（**Enter** **同** **打开详情**）；**`GET …/alerts/incidents/:id`**（`routes.admin.alertIncident`）；顶栏 **`Link`** → **`/admin/observability`**（**`admin_observability_title`**，与 **hub**/**子页** 同口径） |
| `/admin/alerts/incidents/[id]` | **120** 告警 incident 详情 | **Partial**：只读 JSON（占位载荷）；顶栏 **`Link`** → **`/admin/observability`**（与 **hub**/**`/admin`** 并列） |
| `/admin/approvals` | 审批工作台（审批单检索、批准动作） | **Partial**：**`GET …/approvals`**（**URL 同步** `limit` / `status`；缺省 **`status` 查询键**时列表按 **pending**；**`status=` 空**为不按状态过滤；与 **`applied_filters`** 对齐；`routes.admin.approvals(params?)`）+ **`GET …/approvals/:id`**（`routes.admin.approvalById`，审计 **`admin.approvals.detail.read`**）+ **`POST …/approvals/:id/approve`**（**super_admin**，`routes.admin.approvalApprove`，**`writeRequestHeaders`**）；**筛选 **`text-meta` **`admin_approvals_list_filter_hint`****+**`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**`aria-describedby`** **串** **两 hint**+**`name`** **`status`/`limit`****+**Apply **`button[type=submit][form=…]`**+**Reset 独 **`form` **`type=submit`**（**593** **续** **590**）；**待办行 **`text-meta` **`admin_approvals_approve_filter_hint`****+**每行 **`<form aria-describedby>`**+**`name`** **`reason`****+**`type=submit`****+**`onSubmit` → **POST …/approve**（**590**）；列表与详情顶栏 **`Link`** → **`/admin/observability`**（与 **`/admin/users`** 等并列）；与 04 §3.5、70 §3.1 同步 |
| `/admin/finance` | 财务摘要（订单状态计数、金额汇总） | **Partial**：**`GET …/finance/summary`**（`routes.admin.financeSummary`）+ **CSV 导出** **`GET …/finance/summary/export?format=csv`**（浏览器 **`fetch`+blob**；`routes.admin.financeSummaryExport`；**首行 **`finance_summary_v2`**，**`meta`** **路由/金库/投影** **对象 **CSV **按子键拆行** — **04** §3.5）；**导出 **`<form aria-describedby>`** **`admin_finance_export_submit_filter_hint`****+**`admin_finance_export_csv_format_hint`****+**`type=submit`****+**`onSubmit` → **`fetch` export**（**`aria-label`** **`admin_finance_export_csv_aria`** **en/zh**；**590**）；列表块 UI **zh/en**（`admin_finance_*`）；**`meta`** **`fee_router_address`**/**`fee_router_stats`**/**`region_vault_address`**/**`region_vault_stats`**（**04** §3.5，与 **110** 投影表同源汇总）；**元数据** **`last_stored_orders_projection_reconcile`** 可读 **`report_type`**/**`chain_id`**（与 **`/admin/indexer`**/**`observability`** **`last_stored_reconciliation`** 同键，**`admin_indexer_last_reconcile_*`**）；**「账本 DB」** 栅格 **三卡** **`Link`**（**FeeRouter** **`#admin-fee-router-events`**、**RegionVault** **`#admin-region-vault-events`**、**最近投影对账**；**`xl:grid-cols-3`**）；快链 **`fee-router`**/**`region-vault`**/**`indexer`**/**`reconcile-reports`**；顶栏 **`Link`** → **`/admin/observability`**；与 **[Runbook §2.55](../../ops/RUNBOOK.md)**「**Admin 只读 UI**」互证；批次复算与修正链待补 |
| `/admin/fee-router` | FeeRouter 路由事件（管理端只读） | **Partial**：**`GET …/admin/fee-router/routed-events`**（`routes.admin.feeRouterRoutedEvents`）；分页与摘要 UI **zh/en**（`admin_fee_router_*`）；**`load more`** **`text-meta` **`admin_fee_router_load_more_filter_hint`****+**`<form aria-describedby>`**（**`applied_filters` `banner` `id`** **入串** **当** **有**）+**`type=submit`****+**`onSubmit` **cursor **追加**（**592**）；**`load more`** 请求复带上游 **`chain_id`**（与 **`applied_filters`** 一致）；须 **PostgreSQL**；顶栏 **`Link`** → **`/admin/observability`**、**`/admin/finance`**、**`/admin/region-vault`** |
| `/admin/region-vault` | RegionVault 转出投影（管理端只读） | **Partial**：**`GET …/admin/region-vault/forwarded-events`**（`routes.admin.regionVaultForwardedEvents`）；分页与摘要 UI **zh/en**（`admin_region_vault_*`）；**`load more`** **`text-meta` **`admin_region_vault_load_more_filter_hint`****+**`<form aria-describedby>`**（**`applied_filters` `banner` `id`** **入串** **当** **有**）+**`type=submit`****+**`onSubmit` **cursor **追加**（**592**）；与 **`applied_filters`**（**`limit`/`cursor`/`chain_id`**）同 **fee-router** 口径；须 **PostgreSQL**；顶栏 **`Link`** → **`/admin/observability`**、**`/admin/finance`**、**`/admin/fee-router`** |
| `/admin/observability` | 可观测总览（链、索引器、限流等） | **Partial**：**`GET …/observability/overview`**（`routes.admin.observabilityOverview`）；**`overview.indexer`** 含 **`checkpoint`** / lag / reorg / replay；**有 DB** 时含 **`last_stored_reconciliation`**（与 **`/admin/indexer`** health 同源；可读 **`report_type`**/**`chain_id`**/**issues**/**打开详情**，**`admin_indexer_last_reconcile_*`**）；页内**可读摘要** + 原始 JSON；索引器标题旁链 **`/admin/indexer`**、**`/admin/indexer/reconcile-reports`**；**zh/en**（`admin_observability_*` 等）；顶栏链 **`/admin/audit`**（审计日志）、**`audit/operations`**、**`indexer/reconcile-reports`**、**alerts/incidents**、返回 **`/admin`**；与 **`/admin/audit`**/**`audit/operations`**/**`audit/logs/[id]`** 顶栏 **`observability`** **互链闭合**；**`/admin/schema`**/**`/admin/community/*`**（**160**）/**`alerts/incidents/[id]`**；**`/admin/config`**/**`flags`**/**`lifecycle`**/**`jobs`**/**`api-versions`**/**`policies`**/**`config/releases`**/**`releases/[id]`**/**`compliance/*`**/**`internal-tools/audits`**/**`media/*`**/**`scheduler/jobs`**/**`secrets/metadata`**/**`tenants/scopes`** 顶栏 **`observability`** **同口径**；与 **[Runbook §2.55](../../ops/RUNBOOK.md)**「**Admin 只读 UI**」互证 |
| `/admin/indexer` | 索引器与对账运维（health/reconcile/replay） | **Partial**：**`/admin/indexer`** 对接 `GET …/indexer/health`（**刷新**；**顶栏 **`text-meta` **`admin_indexer_header_tools_filter_hint`****+**`useId`****+**`<form aria-describedby>`**+**`type=submit`****+**`onSubmit` → **`setRefreshTick`**（**592**））；**可读摘要**（checkpoint、lag、finality、reorg、replay、内存 **runtime** 一行）；**有 DB 且存在持久化对账报告**时展示 **「最近持久化对账」**卡片（**`health.last_stored_reconciliation`**：**`report_type`**、**`chain_id`**、干净/问题/未知、**issues_total**、打开详情；与 **`db::admin_last_stored_orders_projection_reconcile`** JSON 键同路径）；**对账 ID** 表单 **`text-meta` **`admin_indexer_reconcile_open_filter_hint`****+**`<form aria-describedby>`**+**`name`** **`report_id`****+**`type=submit`****+**`onSubmit` → **`router.push`** **`/admin/indexer/reconcile/[id]`**；**`input`/`submit`** 白底 **`travelFocusRingCoreOffset2White`**；**运维说明**块指向 internal tick/replay/reconcile 与 **[Runbook §2.55](../../ops/RUNBOOK.md)**（正文 **「Admin 只读 UI」** 与本页及 **`reconcile-reports`**/**`reconcile/[id]`**/**`observability`**/**`finance`** 一桌互证）；顶栏 **`Link`** → **`reconcile-reports`**、**`/admin/observability`**、返回 **`/admin`**；链至 **`reconcile/[id]`**；浏览器内不调用 internal 写路径；完整导出/回放等仍 **Target** |
| `/admin/indexer/reconcile-reports` | 对账报告分页列表 | **Partial**：**`GET …/indexer/reconcile-reports`** + **`GET …/reconcile-reports/export`**（本页/全部 **CSV·JSON**，**`exportScope: 'all'`**，**`fetch`+blob**）；**顶栏四导出 **`text-meta` **`admin_indexer_reconcile_reports_export_filter_hint`****+**四 **`form aria-describedby`**+**`type=submit`****+**`onSubmit` → **`fetch`+blob**（**590**）**；**`page`/`limit`/`report_type`**、**每页条数**、**复制本页 URL**、**datalist**；表列 **report_type**/**chain_id** 与 **`reconcile/[id]`** 页头 **`admin_reconciliation_report_payload`** 同键（**`admin_indexer_last_reconcile_*`** 文案族）；顶栏 **`Link`** → **`/admin/observability`**（与 **`/admin/indexer`** 返回链并列）；链至 **`/admin/indexer/reconcile/[id]`**；与 **[Runbook §2.55](../../ops/RUNBOOK.md)**「**Admin 只读 UI**」互证 |
| `/admin/indexer/reconcile/[id]` | 对账报告详情 | **Partial**：**`GET …/reconcile-report/:id`**（`latest`/UUID）；**顶栏工具 **`text-meta` **`admin_indexer_reconcile_detail_tools_filter_hint`****+**`useId`****+**三 **`form aria-describedby`**+**`type=submit`****+**`onSubmit` → **`setRefreshTick`****/**`clipboard.writeText`****/**`downloadJsonFile`**（**591**）；页头在 **报告 ID** 下只读 **`report.report_type`**/**`report.chain_id`**（**`admin_indexer_last_reconcile_*`**，与 **`admin_reconciliation_report_payload`** 同键）；顶栏 **`Link`** → **`reconcile-reports`**、**`/admin/observability`**、**`/admin/indexer`**；与 **[Runbook §2.55](../../ops/RUNBOOK.md)**「**Admin 只读 UI**」互证 |
| `/admin/community/reports` | **160** 社区举报工单池（列表/筛选 + 处置） | **Partial**：列表已对接 `GET …/admin/community/reports`（**URL 同步** `limit`/`status`/`reporter_id`/`target_type`/`reason_code`/`target_id`，与 **`applied_filters`** 对齐）；行内 **Modal** 已对接 **`PATCH …/admin/community/moderation/:id`**（`expected_version`、`status`、可选 `record_penalty`，`writeRequestHeaders`）；**`text-meta` **`admin_reports_mod_filter_hint`****+**`<form aria-describedby>`**+**多 **`name`**（**`expected_version`/`status`/`admin_notes`/`disposition`/`record_penalty`/罚则子键**）+**`type=submit`**/**`onSubmit` → **PATCH**（**589**）；申诉复核见 **`/admin/community/appeals/review`** |
| `/admin/community/moderation/cases` | **160** 审核审计行 | **Partial**：只读列表已对接 `GET …/admin/community/moderation/cases`（**URL 同步** `limit`/`report_id`/`actor_id`/`status_before`/`status_after`，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**） |
| `/admin/community/risk-signals` | **160 §5** 风险信号 | **Partial**：只读列表已对接 `GET …/admin/community/risk-signals`（**URL 同步** `limit`/`subject_user_id`/`signal_type`/`rule_id`/`severity`，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**） |
| `/admin/community/policy-change-logs` | **160 §5** 策略变更审计 | **Partial**：只读列表已对接 `GET …/admin/community/policy-change-logs`（**URL 同步** `limit`/`scope`/`summary`/`source`/`actor_id`，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**） |
| `/admin/community/ranking/snapshots` | **160** Feed 排序快照审计 | **Partial**：只读已对接 `GET …/admin/community/ranking/snapshots`（**URL 同步** `limit`/`feed_mode`，与 **`applied_filters`** 对齐） |
| `/admin/community/penalties` | **160** 处罚台账 | **Partial**：列表已对接 `GET …/admin/community/penalties`（**URL 同步** `limit`/`subject_user_id`/`report_id`/`status`，与 **`applied_filters`** 对齐）；**Modal** 已对接 **`POST …/admin/community/penalties`**（`writeRequestHeaders`）；**`text-meta` **`admin_penalties_create_filter_hint`****+**`<form aria-describedby>`**+**`name`** **`subject_user_id`/`action`/`report_id`/`reason`/`expires_at`/`metadata`****+**`type=submit`**/**`onSubmit` → **POST**（**589**） |
| `/admin/community/comments/visibility` | **160** 评论可见性 | **Partial**：表单已对接 **`PATCH …/admin/community/comments/:id`**（`visibility_status`，`writeRequestHeaders`）；**`text-meta` **`admin_comment_vis_filter_hint`****+**`<form aria-describedby>`**（**`commentVisFilterHintId`**）+**`name`** **`comment_id`/`visibility_status`****+**`type=submit`**/**`onSubmit` → **PATCH**（与 **568～583** 管理端筛选表单 a11y 口径一致） |
| `/admin/community/abuse-policy` | **160 §5** 滥用策略数值表 | **Partial**：表单已对接 **`PATCH …/admin/community/abuse-policy`**（**super_admin**，`writeRequestHeaders`）；**`text-meta` **`admin_abuse_filter_hint`****+**`<form aria-describedby>`**（**`abusePolicyFilterHintId`**）+**`name`** **各 **`ABUSE_KEYS`****+**`type=submit`**/**`onSubmit` → **PATCH**（与 **584** **`comments/visibility`** 同 **568～570** 工具表单 a11y 口径） |
| `/admin/community/appeals` | **160** 申诉台账 | **Partial**：列表已对接 **`GET …/admin/community/appeals`**（**URL 同步** `limit`/`report_id`/`status`，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**Reset **`admin_appeals_reset`** **独 **`form` **`type=submit`** **`buildAppealsListPath({limit:50,…})`**（**594**）；pending 行链至 **`/admin/community/appeals/review?appeal_id&expected_version`** |
| `/admin/community/appeals/review` | **160** 结案后申诉复核 | **Partial**：表单已对接 **`POST …/admin/community/appeals/:id/review`**（**super_admin**，`expected_version` + `decision`，`writeRequestHeaders`）；支持 query 预填；**`text-meta` **`admin_appeal_review_filter_hint`****+**`<form aria-describedby>`**（**`appealReviewFilterHintId`**）+**`name`** **`appeal_id`/`expected_version`/`decision`/`reviewer_note`****+**`type=submit`**/**`onSubmit` → **POST**（与 **584～585** 社区工具表单 a11y 口径一致） |
| `/admin/policies` | 数据权限策略中心（policy/scope/binding） | **Partial**：列表已对接 `GET …/policies`（`limit` / `policy_code` / `status` / `scope_type` / `binding_role`；**URL 同步**）+ 列表内 **Modal** 已对接 **`POST …/policies/:id/publish`**（`draft|active|deprecated` + `expected_version`，`writeRequestHeaders`）；**`text-meta` **`admin_policies_publish_filter_hint`****+**`<form aria-describedby>`**+**`name`** **`status`/`expected_version`****+**`type=submit`**/**`onSubmit` → **POST**（**589**）；完整策略中心仍 **Target** |
| `/admin/compliance/requests` | DSAR 合规请求中心（导出/删除） | **Partial**：列表已对接 `GET …/compliance/data-requests`（**URL 同步** `limit` / `request_ref` / `subject_id` / `request_type` / `status` / `jurisdiction`，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**）；**`/admin/compliance/requests/[requestId]/events`** **URL 同步** `limit` / `event_type`（与 **`applied_filters`** 对齐）+ **`/admin/compliance/requests/[requestId]/update`** 已对接 **`POST …/update`**（`event_type` + `expected_version`，`writeRequestHeaders`）；**`text-meta` **`admin_compliance_update_filter_hint`****+**`<form aria-describedby>`**（**`complianceUpdateFilterHintId`**）+**`name`** **`expected_version`/`event_type`/`status`/`notes`/`event_detail`****+**`type=submit`**/**`onSubmit` → **POST**（与 **584～586** 管理端工具表单 a11y 口径一致）；导出/删除完整中心仍迭代 |
| `/admin/config` | 配置发布与回滚中心（版本/审批/回滚点） | **Partial**：导航台已落地（链 **`/admin/flags`**、**`/admin/secrets/metadata`**、**`/admin/config/releases`**、**`/admin/jobs`**、**`/admin/approvals`**）；完整键值/灰度/回滚中心仍 **Target** |
| `/admin/config/releases` | 220 配置发布登记列表 | **Partial**：只读已对接 `GET …/admin/config/releases`（`limit` / `release_key` / `status`）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**）；详情经 **`relist`** 回列表可恢复筛选 |
| `/admin/secrets` | Secret/Key 元数据中心（轮换、失效、告警） | Target（完整中心）；元数据只读见 **`/admin/secrets/metadata`** |
| `/admin/secrets/metadata` | Secret 元数据（无密钥明文） | **Partial**：只读已对接 `GET …/admin/secrets/metadata`（`limit` / `key_alias` 子串 / `status` / `env_scope`；URL 同步）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**） |
| `/admin/flags` | Feature Flag 与灰度发布中心 | **Partial**：列表已对接 `GET …/admin/flags`（`limit` / `flag_code` / `enabled` / `scope`；**URL 同步**）+ **Modal** 已对接 **`POST …/flags/:id/publish`**（`enabled` + `expected_version`，可选 `rollout_percent` / `region`，`writeRequestHeaders`）；**`text-meta` **`admin_flags_publish_filter_hint`****+**`<form aria-describedby>`**+**`name`** **`enabled`/`rollout_percent`/`region_mode`/`region`/`expected_version`****+**`type=submit`**/**`onSubmit` → **POST**（**589**）；完整灰度中心仍 **Target** |
| `/admin/jobs` | Job/Queue 运行治理台（重试/死信/批处理） | **Partial**：只读已对接 `GET …/admin/jobs`（`summary`+`items`，`limit`/`status`，**URL 同步**）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**`aria-describedby`** **串** **`admin_jobs_filter_hint`**+**活跃状态**+**`applied_filters` `banner` `id`** **当** **有**+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除 **`status`** **独 **`form` **`type=submit`**（**594**）；队列治理写操作仍 **Target** |
| `/admin/scheduler` | Scheduler 任务编排与执行记录 | **Partial**：**`/admin/scheduler/jobs`** 已对接 `GET …/scheduler/jobs`（`limit` / `job_code`；**URL 同步**）与行内 **补跑 Modal**（**`POST …/scheduler/jobs/:job_code/rerun`**，`writeRequestHeaders`）；**`text-meta` **`admin_scheduler_rerun_filter_hint`****+**`<form aria-describedby>`**+**`name`** **`reason`****+**`type=submit`**/**`onSubmit` → **POST**（**589**）；编排台仍 **Target** |
| `/admin/tenants` | 多租户/多区域作用域管理台 | **Partial**：**`/admin/tenants/scopes`** 已对接 `GET …/tenants/scopes`（`limit` / `tenant_key` / `region_code` / `status` / `scope_class`；**URL 同步**）与列表内 **发布**（**`POST …/scopes/:id/publish`**，`writeRequestHeaders`）；**`text-meta` **`admin_tenant_scopes_publish_filter_hint`****+**`<form aria-describedby>`**+**`name`** **`status`/`expected_version`****+**`type=submit`**/**`onSubmit` → **POST**（**589**）；完整治理台仍 **Target** |
| `/admin/api-versions` | API 版本兼容与退役管理台 | **Partial**：只读列表已对接 `GET /api/v1/admin/api-versions`（`items` 表；**URL 同步** `limit` / `api_version` / `status`，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**`aria-describedby`** **串** **hint**+**活跃态**+**`applied_filters`****+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**）；完整退役治理 UI 仍迭代 |
| `/admin/schema` | Schema 迁移与回滚治理台 | **Partial**：只读页已对接 `GET /api/v1/admin/schema/migrations`（`items` 分项 JSON）；顶栏 **`Link`** → **`/admin/observability`**；完整治理台仍 **Target** |
| `/admin/internal-tools` | 内部工具执行审计台（与主后台分层） | **Partial**：**`/admin/internal-tools/audits`** 只读列表已对接 `GET …/internal-tools/audits`（`limit` / `tool_id` / `action_code` / `actor_id` / `approval_request_id`；**URL 同步**）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**）；完整控制台仍迭代 |
| `/admin/media/access-logs` | **270** 媒体签名链接访问审计 | **Partial**：只读列表已对接 `GET …/admin/media/access-logs`（`limit` / `action` / `object_id` / `actor_or_ip` / `token_id`；**URL 同步**，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**）；对象存储与完整媒体台仍 **270** |
| `/admin/media/signed-url-tokens` | **270** 签名 URL 签发台账 | **Partial**：只读列表已对接 `GET …/admin/media/signed-url-tokens`（`limit` / `object_id` / `url_scope` / `issued_to` / `token_id`；**URL 同步**，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**）；与 access-logs 联查仍以 **270** 为准 |
| `/admin/lifecycle` | 全域生命周期状态机与异常迁移台 | **Partial**：只读列表已对接 `GET …/admin/lifecycle/state-machines`（**URL 同步** `limit` / `machine_code` / `domain` / `entity_type` / `version` / `source_of_truth` / `anomaly_flag`，与 **`applied_filters`** 对齐）；**列表筛选 **`text-meta` **`admin_list_filters_apply_reset_hint`****+**外卡 **`div`**+**字段 **`form` `id`**+**Apply **`button[type=submit][form=…]`**+**清除非 limit **独 **`form` **`type=submit`****（**595**）；完整可视化/迁移台仍迭代 |

跨阶段门禁对齐：上述 Target 路由用于承接 `90~550` 阶段后台一级模块，发布门禁判定以 [70-管理员系统开发文档](70-管理员系统开发文档.md) `§6.1.3/§6.1.4/§9.3/§9.4` 为准。

`/admin/approvals`（Partial）页面最小字段门禁：

- 审批链路字段：`approval_flow_id`、`initiator`、`approver`、`risk_level`、`ticket_no`、`expire_at`。
- 执行器高危动作字段：`resolution_id`、`idempotency_key`、`amount_limit_snapshot`、`approver_quorum`、`resolution_type`、`chain_id`、`contract_address`。
- 结果回执字段：`tx_hash`、`block_number`、`log_index`。
- 审计串查字段：`request_id`、`message_id`、`job_id`（与 `tx_hash/log_index` 可串查）。

**强制约束**：

- Admin 路由不得出现在旅行者/向导默认导航和公开 sitemap。
- 未授权访问 Admin 路由时必须 fail-closed（401/403）并记录审计事件。
- Admin 高危写与导出动作在 UI 必须显式显示“审计失败即拒绝执行”结果，不得静默降级为成功。
- 审批工作台必须显式展示并校验：`No Self-Approval`、步骤完整性、审批超时重校验。
- Admin 侧链路追踪口径统一为 `requestId -> messageId -> txHash -> logIndex -> jobId`（与 70、04 一致）。
- 上线前需完成与 04 §3.5 的 API 路径、权限与错误码逐项对照。

---

### 表 3：页面分区与动效强度（Zone Control）

与 13「资金区像银行、3D 只能情绪层」一致；落地为布局与动效约束。

| 区域 | 允许内容 | 禁止内容 | 动效等级 | 3D |
|------|----------|----------|----------|-----|
| Landing Hero | 品牌叙事、抽象资金流 | 交易按钮 | 中 | ✅ |
| Discover | 目的地/向导卡片 | 链上按钮堆叠 | 中 | 可选 |
| **自由市场（/market）** | 订单卡/向导卡、撮合、筛选、抽屉 | 支付、链上操作堆叠、霓虹、论坛流 | 中 | ❌ |
| **TT社区（/community）** | 赛博风 Feed、发帖、互动（点赞/收藏/评论） | 支付、撮合、28 玻璃 Hero、资金操作 | 中（与 30 DID 一致） | ❌ |
| OrderFlow | 步骤引导、状态机 | 大图/强情绪 | 低 | ❌ |
| EscrowDetail | 金额、状态、签名区 | 霓虹、强动效 | 极低 | ❌ |
| Dispute | 时间线、证据、裁决 | 3D、装饰 | 极低 | ❌ |
| Governance | 参数、提案、投票 | 旅游内容 | 极低 | ❌ |

**EscrowDetail 例外（A3）**：**订单/Escrow 详情页**内**协议控制台区**（行程与预算、报价摘要、步骤条、聊天、操作区）以 **[53+30-DID §4](53-阶段开发技术文档.md)** 为准，采用赛博朋克风格（霓虹、光晕）；与表内「禁止霓虹」在该区以 53 为准。

**布局约束**：金融区必须使用**统一布局组件**（同一信息密度、同一间距/字体体系）；展示区（Landing / 自由市场 **Experience** 区，含 **`/discover` 短停重定向**）可自由。避免「旅游情绪」混入「签名按钮区」。

**订单与 Escrow 路由（53/N4）**：前端采用**单路由** `/orders/[id]`，订单详情页内嵌 Escrow 区块（状态 Escrowed 后展示存款/释放/争议等）；不单独提供 `/escrow/[id]` 路由。**若存在旧 `/escrow/[id]`**：见 [53 附录 A](53-阶段开发技术文档.md) 迁移或废弃策略（301 重定向至 /orders/[id] 或只读+废弃标注）。**从 /market 进入订单详情**时：**全局顶栏**与 **`Header.tsx`** 一致（**白底深字**，**86 §6.0**）；**面包屑与订单页顶区壳层**可按 **28** 叙事（浅色/玻璃容器等，不与协议区抢银行感）；**主内容区**（协议控制台）采用 **53+30-DID** 赛博风，见 [53 附录 D](53-阶段开发技术文档.md)。

**降级与不可用（J3）**：API 或链不可用时，订单/Escrow 页展示只读缓存或提示「部分功能暂不可用」；不展示或禁用敏感操作（付款、释放、争议）；详见 [53 附录 E](53-阶段开发技术文档.md)。

**交互响应时间**（与 [13](13-协议级UI设计宪法.md) 第7条、[22](22-Design-Tokens-旅游Web3融合体系-v1.0.md) §八 一致）：**所有切换类操作**（路由、Tab、抽屉、弹窗、视图切换，如市场订单/向导、社区动态/关注、好友 Tab、个人笔记/收藏/赞过等）必须在 **200ms 内**完成可感知展示；数据加载可滞后，但视觉反馈（进度条、激活态、骨架）不可延迟。

---

### 表 4：关键页面的「字段级信息结构」

信息层级顺序**必须**：状态（不可忽略）→ 金额与币种（不可误读）→ 时间与 finality（可验证）→ 操作按钮（签名/交易）→ 风险与提示（永远可见）。

#### OrderFlow

| 步骤/区块 | 字段与来源 | 按钮条件 |
|-----------|------------|----------|
| 草稿 | 订单摘要、参与方、金额；来源 API | 提交确认 |
| **向导确认**（53） | 订单摘要、行程概要、报价；来源 API | 确认接该项目（向导） |
| **双边确认**（53） | 行程与金额；双方确认态；来源 API | 旅行者/向导各自确认行程与金额 |
| 确认 | 锁定金额、币种、超时时间；链下+链上 | 前往付款（唤起钱包） |
| 付款 | chainId、contract、amount、token、gas、finalityN；链上 | 签名并支付 |
| 完成 | 状态、finality 块数、完成/争议入口；链上+API | **确认行程完成（链下）** / 发起争议；**release** 在评分路径后见操作区 |
| **评分/资金释放**（53） | 上传照片/视频、双方确认；来源 API+合约 | 双方确认后触发释放 |

**说明**：上表基础 4 步（草稿→确认→付款→完成）；**53 阶段**在草稿与确认之间插入「向导确认」「双边确认」，在完成之后增加「评分」「资金释放」，步骤条与允许动作以 [53-阶段开发技术文档](53-阶段开发技术文档.md) §3.2、§五 为准。每步的链上/链下来源须在 04/06 可追溯。

#### EscrowDetail

| 区块 | 字段 | 说明 |
|------|------|------|
| **步骤条（53 八步）** | 53 阶段：草稿→向导确认→双边确认→确认→付款→完成→评分→资金释放；当前步高亮、已完成打勾、未完成灰显 | 见 [53 §3.2](53-阶段开发技术文档.md)、表 4 OrderFlow；不可缺步或顺序错 |
| 状态 | 当前状态（Draft/Confirmed/Funded/Completed/Disputed/Resolved） | 不可忽略、不可折叠 |
| 金额与币种 | 金额、USDC（或白名单 token） | 不可误读、统一小数位 |
| 参与方 | 旅行者、向导、仲裁（若已分配） | 来自 API |
| 时间与 finality | 创建时间、finality 块高、可验证链接 | 可验证 |
| 事件列表 | 链上事件摘要（EscrowCreated/Funded/…） | 可选折叠，默认可见最近 |
| 允许动作 | **确认行程完成（链下）**、发起争议、**release（链上，评分路径后）**、裁决（按角色） | 按状态与 RBAC 显示；语义与 [04](04-后端与API.md) §3.4、[53](53-阶段开发技术文档.md)、[14](14-合约-API-ABI-前后端对齐.md) 一致 |
| 风险提示 | disputeWindow 剩余、reorg 提示（若适用） | 永远可见区域 |

#### Dispute

| 区块 | 字段 | 说明 |
|------|------|------|
| 证据与时间线 | 提交时间、证据类型、hash/链接 | 不可删减 |
| 可裁决项 | 退款比例、扣罚、执行状态 | 仲裁员可见可操作 |
| 裁决执行记录 | resolutionId、txHash、执行时间 | 可追溯 |
| 可追溯 hash | 链上 txHash、blockNumber | 必现 |

---

## 三、交易交互规范（强制）

所有链上动作**必须**经过 **Signature / Tx Modal**，不得做成普通表单提交。

**Modal 内必须展示**：chainId、contract、function、amount、token、gas estimate、finalityN（或等价文案）。

**状态机必须可见**（与 [09](09-技术架构总览-v1.0.md) txMachine 一致）：idle → signing → pending → confirmed → final / failed；以及 replaced（若支持）。

---

## 四、异常态与风控态（必须覆盖）

AI 默认只画 happy path；以下异常态**必须**有明确页面或组件，否则 UI 可信度会被击穿。

| 异常态 | 表现要求 |
|--------|----------|
| 钱包未连接 | 明确提示 + 连接入口，不展示敏感操作 |
| 链不对（非 Polygon / 本地未配置） | 提示切换网络、显示当前 chainId |
| USDC allowance 不足 | 提示授权、引导 approve |
| OFAC/冻结命中 | 风控提示、不执行交易（与后端/合约一致） |
| disputeWindow 过期 | 明确「已过争议窗口」、不可再发起争议 |
| reorg/replay 导致状态回滚 | 提示「链已回滚，状态已更新」、引导刷新或重试 |
| **TT 社区写操作失败 / 滥用防护（含 HTTP 429）** | 后端返回 JSON：`status: "error"`、`message`（机器键）及可选 `errors` 字段级键；**须**经 `frontend/lib/formatCommunityApiMessage.ts`（`interpretCommunityWriteError` 等）映射为 `community_api_msg_<code>` 的中英文案（`frontend/locales/zh.ts`、`en.ts`），**禁止**向用户裸显后端英文键。写接口的 `fetch` 层须在非 2xx 时仍解析 body（如 `communityJsonBody`），以便读取 `message`。契约与键清单以 **[04-后端与API](04-后端与API.md)** 社区相关接口为准；与 **[07-开发流程与顺序](07-开发流程与顺序.md) §二 2.4** 联动时，新增机器键须同批补 locale。 |

---

## 五、标准输入模板（给 AI 用）

在让 AI 产出页面/组件**之前**，可粘贴以下提示，避免跑偏：

```
我在做协议级产品 TravelTrust（链为资金真相）。
请先输出 UI 信息架构 SSOT，不要写代码：

1. 页面地图（按 Experience / Protocol Console / Governance / Ops 分组），每页一句话职责 + 明确不做什么
2. 角色 × 页面权限矩阵（旅行者/向导/仲裁员/治理者/观察者）
3. Zone Control 表（展示区 vs 金融区，动效等级、3D 允许/禁止）
4. EscrowDetail / Dispute / OrderFlow 三页的字段级信息结构（信息层级顺序必须：状态→金额→finality→动作→风险提示）

约束：资金区像银行、3D 只在情绪层、禁止 neon。
```
**MVP 实现时**：模块划分与系统边界以 [17-TravelTrust-MVP-产品与模块清单](17-TravelTrust-MVP-产品与模块清单.md) 为准；可据此向 AI 下发「实现模块 X」的指令。

---

## 六、最核心三件事（还没说清楚就会跑偏）

不是颜色、不是组件库。而是：

1. **每个页面的唯一职责（以及「不做什么」）** — 表 1 与表 4。
2. **角色空间隔离的导航与权限（RBAC + 路由组织）** — 表 2 + 角色切换入口写死。
3. **交易交互与异常态的强制规范（签名弹窗、finality、错误态）** — 上文「交易交互规范」+「异常态与风控态」。

把这三件事补齐，AI 就很难跑偏。

---

*本文与 [13-协议级UI设计宪法](13-协议级UI设计宪法.md)、[05-前端总览](05-前端总览.md)、[06-DApp架构总览](06-DApp架构总览.md)、[09-技术架构总览](09-技术架构总览-v1.0.md) 配套。文档版本与最后更新见 [00-文档索引](00-文档索引.md)。*
