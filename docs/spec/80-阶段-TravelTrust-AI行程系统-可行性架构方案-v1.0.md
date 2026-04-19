# 80 阶段：TravelTrust AI 行程系统 — 可行性架构方案 v1.0

**文档编号**：80  
**用途**：结合 TravelTrust **实际路由、页面组件与 API**，定义「用户偏好 → AI 生成可发布、可协商、可上链绑定」的行程与预算架构原则、组件划分、数据与价格能力、分阶段实施及验收标准。  
**受众**：产品、架构、前后端与合约实现；与 [01-总库总览](01-总库总览.md)、[04-后端与API](04-后端与API.md)、[05-前端总览](05-前端总览.md)、[09-技术架构总览-v1.0](09-技术架构总览-v1.0.md)、[42-自定义行程弹窗](42-自定义行程弹窗-游客与向导UI设计与算法.md)、[25-顶级UI标准-Landing-Discover-Itinerary](25-顶级UI标准-Landing-Discover-Itinerary.md) 衔接。**全系统大图口语链**见 [18-TravelTrust-全系统架构图](18-TravelTrust-全系统架构图.md) **§七**；专题在 [00-最终版架构图对应模块清单总表](00-最终版架构图对应模块清单总表.md) **§二点五** `80`。**AI 行程运营治理（后台）**见 [170-阶段开发AI行程系统运行管理治理层](170-阶段开发AI行程系统运行管理治理层.md)（与本文「可行性 + 前后台路由」分工：**80** = 产品/数据/门禁；**170** = 配置、审计、灰度、配额）。  
**与当前实现对照**：§ 实际项目页面与功能、§ 用户可见流程 与代码一一对应；其余各节标**已落点**与**待增强**，便于迭代不重造轮子。

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **路由 ↔ 页面 ↔ API 对照** | **§0.1** 表；契约以 **[04 §3.4](04-后端与API.md)** 为准 |
| **Draft / snapshot / confirm-final-plan 门禁** | **§0.3～§0.6**、**§4**；订单后续步骤 **[53](53-阶段开发技术文档.md)** |
| **分阶段实施与 DoD** | **§8～§9**（Phase 表与验收项） |
| **运营后台（配置/灰度/配额）** | **[170](170-阶段开发AI行程系统运行管理治理层.md)**（**80** = 产品数据门禁，**170** = 后台治理） |
| **大图口语链** | **[18 §七](18-TravelTrust-全系统架构图.md)**、**[07 §五 5.2](07-开发流程与顺序.md)** |

---

## 0. 目标与边界

| 项 | 说明 |
|----|------|
| **目标** | 用户填偏好 → AI 生成「可发布、可协商、可上链绑定」的行程与预算 → 向导撮合协商 → 固化最终版本 → 进入 Escrow。 |
| **边界** | 不训练大模型；不做未授权平台抓取；价格能力分层（估算 / 实时 / 导入证据）。 |

**当前落点（简要）**：  
- **首页**（**`app/(home)/page.tsx`**，路由 **`/`**）：`LandingHeroForm` + `useLandingPage`，提交后按 `ITINERARY_CARD_COUNT`（5）次调用 `postItineraryCreate`，每次返回 `order_id`，生成多份 Draft 订单并落库；结果在 `ItineraryResultsSection` 盲盒卡展示，解锁用 `getOrder(orderId)` 拉取详情（含 itinerary）。  
- **独立行程页**（`app/itinerary/new`）：表单提交 `POST /api/v1/itineraries`，后端 `itinerary_create_impl` 生成行程并创建 Draft 订单，响应含 `order_id`、daily_itinerary、amount_breakdown；同页展示结果与 `AgreementSummaryAccordion`。  
- **自由市场**（`app/market`）：订单列表来自 `getDiscoverOrders`（GET `/api/v1/discover/orders`，仅 Draft），向导列表来自 `getGuides`。`CustomItineraryModal`（42）旅行者/向导手填行程 + 平台定价（lib/countries，44）。**❶ 自定义行程走后端（已闭合，见 §0.3）**：提交须 **POST /api/v1/itineraries/custom** → 后端创建 Draft order + 写 itineraries → 返回 `order_id` → 市场页重新拉取 `getDiscoverOrders`；若代码回退为「仅前端列表」，即回到协议级缺陷，须按 §0.3 门禁修复。持久化订单来源应为：首页行程生成、**自定义行程接口**、或 `/orders/new` 的 `postOrder`。  
- **订单详情/托管**（`app/escrow/[id]`）：`EscrowDetail` 用 `getOrder(id)` 拉取 order + itinerary（daily_itinerary、amount_breakdown、snapshot_hash）；Draft 且无 snapshot 时展示 `ConfirmFinalPlanBlock`，确认调用 `POST /api/v1/orders/:id/confirm-final-plan`，后端 `confirm_final_plan_impl` 生成 snapshotHash 并写库（`update_itinerary_snapshot_hash`）。

---

## 0.1 实际项目页面与功能对照

下表按**路由**列出本项目中与行程、订单、Escrow 相关的页面、组件及调用的 API，与 05、04 一致。

| 路由 | 页面/入口 | 行程相关组件与能力 | 调用的 API（行程/订单相关） |
|------|-----------|--------------------|-----------------------------|
| **/** | **`app/(home)/page.tsx`** | `LandingHeroForm`（国家/城市/日期/天数/景区类型/餐饮酒店/预算）、`ItineraryResultsSection`（盲盒卡、解锁后 daily_itinerary + amount_breakdown）、`UnlockModal` | `postItineraryCreate`（多次生成 Draft）、`getOrder`（解锁详情） |
| **/itinerary/new** | `app/itinerary/new/page.tsx` | 行程表单（destination/city/travel_date/days/hotel/food/transport/budget_min_max/notes）、结果区 Day N + 费用明细、`AgreementSummaryAccordion` | `POST /api/v1/itineraries`（`routes.itineraries`） |
| **/market** | `app/market/page.tsx` | `MarketPageHero`（「自定义行程」打开 `CustomItineraryModal`）、`MarketContent`（订单/向导卡片）、`OrderDetailDrawer`、`GuideDetailDrawer`、`BookGuideModal`；`CustomItineraryModal` 手填行程 + lib/countries 定价（44） | `getDiscoverOrders`、`getGuides`。自定义行程：**POST /api/v1/itineraries/custom** → Draft + `order_id` → 刷新列表（与 §0.3 ❶ 已闭合一致；回归须门禁） |
| **/discover** | `app/discover/page.tsx` | 重定向到 `/market`（29 约定） | — |
| **/traveltrust** | `app/traveltrust/page.tsx` | **融资向网络落地页**（[85](85-TravelTrust网络落地页-融资级设计与开发规格.md)）：**`layout.tsx` 深色 Tropical 壳 + 环境粒子**、**85 §三 IA**（含 **`#overview`**；**非** ICO 认购）；**非** AI 生成主路径；T2 结算披露与顶栏 **TravelTrust** 字标一致 | 无专属行程 API；组件索引 **85 §二 2.6**；路由与合规见 **04 §3.4**、**13-1** |
| **/orders**、**/orders/new** | `app/orders/page.tsx`、`app/orders/new/page.tsx` | 订单列表（我的订单，`getOrders`）、新建订单（选向导+金额，`postOrder`）；详情跳转 `escrow/[id]` | `getOrders`（GET `/api/v1/orders`）；`/orders/new` 使用 `postOrder`（POST `/api/v1/orders`，body：guide_id、amount、currency），创建成功后跳转 `escrow/[id]` |
| **/escrow/[id]** | `app/escrow/[id]/page.tsx` | `EscrowDetail`（动态加载）：订单信息、itinerary 展示（daily_itinerary、amount_breakdown、snapshot_hash）、`ConfirmFinalPlanBlock`（Draft 且无 snapshot 时）、支付/放款/退款/争议入口 | `getOrder(id)`（GET `/api/v1/orders/:id`，响应含 order + itinerary）、`routes.orderConfirmFinalPlan(id)` → POST `/api/v1/orders/:id/confirm-final-plan` |

**前端 API 与路由常量**：`frontend/lib/api.ts` 定义 `apiUrl`、`routes`（如 `routes.itineraries`、`routes.orderById(id)`、`routes.orderConfirmFinalPlan(id)`、`routes.discoverOrders`）；行程与订单请求在 `frontend/lib/apiClient`（`postItineraryCreate`、`getOrder`、`getOrders`、`getDiscoverOrders`、`getGuides` 等），与 04 §3.4 清单一致。

---

## 0.2 用户可见流程（端到端）

从产品/UI 视角，用户在本项目中与「行程 → 订单 → Escrow」相关的典型路径如下，与 80 架构一一对应：

1. **首页生成多份草稿**：用户在 `/` 填写偏好（LandingHeroForm）→ 提交后循环调用 `postItineraryCreate`（5 次），每次后端创建 Draft 订单并写入 itineraries → 结果以盲盒卡展示（ItineraryResultsSection），解锁时 `getOrder(orderId)` 拉取 daily_itinerary、amount_breakdown。
2. **独立页生成单份行程**：用户进入 `/itinerary/new` 填表单 → 提交 `POST /api/v1/itineraries`，后端 `itinerary_create_impl` 生成行程并创建 Draft 订单 → 同页展示 daily_itinerary、amount_breakdown、AgreementSummaryAccordion；可再进入市场或订单列表。
3. **市场与新建订单**：`/market` 展示发现订单（getDiscoverOrders，Draft）与向导（getGuides）。「自定义行程」打开 CustomItineraryModal，手填行程 + lib/countries 定价。**目标流程（§0.3 ❶ 已闭合）**：提交 → POST `/api/v1/itineraries/custom` → 后端创建 Draft order + 写 itineraries → 返回 order_id → 前端刷新列表或跳转 `/escrow/[id]`。持久化订单来源：首页行程生成、**自定义行程接口**、或 `/orders/new` 的 postOrder。
4. **订单详情与确认最终版本**：进入 `/escrow/[id]`，EscrowDetail 通过 getOrder(id) 拉取 order + itinerary（daily_itinerary、amount_breakdown、snapshot_hash）。Draft 且无 snapshot 时展示 ConfirmFinalPlanBlock，确认后调用 `POST /api/v1/orders/:id/confirm-final-plan`，后端 `confirm_final_plan_impl` 生成 snapshotHash 并写库，此后可存款/放款/争议（28、13-1）。

上述流程中，**结构化输出、版本化、预算闭合、链为资金真相、价格服务独立**等原则的落点见 §1、§2；**AI 流水线**当前为占位实现（Mock Mode，§3），**价格能力**见 §5。

### 0.2.1 核心流程与互斥约定（协议级）

**正确顺序**：① 旅行者发布行程（Draft）→ ② 向导接单（Accepted）→ ③ 双方**聊天确认行程**（可修改、可多轮）→ ④ **双方均确认无异议后**，才执行「确认最终行程」并**生成智能合约绑定**（confirm-final-plan → snapshotHash → 创建/绑定 Escrow）。**不得**在未完成聊天确认前就生成合约。

**互斥约束（向导档期）**：向导在**档期被锁定的时间段内**不得再接其它人行程；**旅行者**在「进行中订单」限制内不得再发布新行程（或按产品规则限制数量）。**锁定生效点、锁定范围、档期精度、取消恢复**等**必须写死**，见 **§4.15 档期与锁定规则**；概要如下：

- **锁定生效点**：**不是** confirm-final-plan，而是 **deposit 成功并达链上 finality**。confirm 后、未 deposit 前向导**不被锁定**，可接其他订单；否则向导在「旅行者 2 小时才支付」等场景下被长时间白锁（见 §4.15）。
- **锁定范围（设计选择，必须二选一成文）**：**仅禁止「时间重叠」**——只禁止向导在**本单 start_date～end_date** 再接与档期重叠的订单；不采用「合约存在即全局锁死」。长期订单（如 15 天欧洲游、30 天包车）下，向导仍可接**不重叠**的未来档期；否则高端向导不会接受（§4.15）。
- **档期精度**：订单**必须**有 **start_date**、**end_date**（至少日期级），否则无法判断重叠；依赖 **Schedule Engine（档期引擎）** 精确执行（§4.15）。
- **争议期间**：锁定范围须明确为 **「服务期间」** 还是 **「资金未释放期间」**。若为「资金未释放期间」，旅游已结束但 dispute 仲裁 7 天 → 向导被锁 7 天，供给下降；**建议**锁定范围定为 **服务期间（start_date～end_date）**，争议期间允许接不重叠档期（§4.15）。
- **payment_window**：confirm 后**限定时间**（如 30 分钟）内必须 deposit；**超时自动取消 + 解除向导锁定**，避免旅行者不支付、向导被锁、订单未开始的运营死局（§4.9、§4.15）。
- **防锁单攻击**：confirm 后不支付、反复操作的恶意行为须限制：**confirm 次数/频率限制**、**用户信誉惩罚**、**冷却时间**（§4.15）。
- **取消后恢复**：订单/合约取消后向导**立即解锁**，或需**冷却期/等 dispute 期过**须成文（§4.15）。
- **Schedule Engine**：档期与锁定规则**必须**由 **Schedule Engine（档期引擎）** 组件统一执行，否则规则无法精确落地（§4.15、§2/架构）。

---

---

## 0.3 评审问题与修复要求（必须满分）

| 级别 | 问题 | 要求 | 文档落点 |
|------|------|------|----------|
| **🔴 一级** | **❶ 自定义行程 Modal 只更新前端，不调后端** | CustomItineraryModal 提交 → **POST /api/v1/itineraries/custom** → 后端创建 Draft order + 写入 itineraries → 返回 order_id → 市场页重新拉取（getDiscoverOrders）。否则 UI 订单≠系统订单（无 order_id/version/snapshot，无法走 escrow），协议级严重不一致。 | **✅ 已闭合**：49 A 已实施；后端 `POST /api/v1/itineraries/custom` 已上线，前端提交后调该接口并刷新列表（getDiscoverOrders），E2E 联调通过后可确认。 |
| **🔴 一级** | **❷ ItinerarySpec v1 未落地，软结构生成硬签名** | 补 **Canonical JSON 规则文档**；明确 **参与 snapshotHash 的字段**（含完整 budget breakdown、policies、cancellation）；明确 **不参与 hash 的字段**（UI 文案等）；JSON Schema 强校验。否则字段顺序/文案变动导致 hash 变化、版本升级冲突。 | **✅ 已闭合**：Canonical JSON 规则与参与/不参与字段已在本文档 **§4.4 Canonical JSON 与 snapshotHash 参与字段**、**§4.5 confirm-final-plan 乐观锁与不可逆点** 成文；键字母序、数值格式、身份/链/结算/档期/breakdown/policies 等见 §4.4 表格；实现时以 §4.4、§4.5 及 0.5 四项交付物 ① 为准。49 未完成部分可标「80 ❷ 已落点」。 |
| **🟠 二级** | **❸ 后端预算与前端预算双轨制** | 前端 lib/countries 闭合，后端 generate_itinerary_mock 自算，两套独立 → 同条件两处金额可能不同。建议将预算算法抽成 **pricing_core**，后端与前端共享逻辑（或先复制到 Rust）。 | 见 §5.3、§8 Phase 1。 |
| **🟠 二级** | **❹ SnapshotHash 当前字段不完整** | 当前仅 hash order_id/version/amount/currency/destination/city/days/total_budget；guide_fee/vehicle 未单独参与，policies/cancellation 未参与，争议时无法证明完整合同。**必须**定义 snapshotHash 包含：完整 budget breakdown、policies、cancellation rules。 | 见 §4.3、§4.4。 |
| **🟡 三级** | **❺ AI 流水线文档是目标态** | 文档写 Planner/Budgeter/Narrator/Validator，现实仅有 generate_itinerary_mock。**必须标注**：当前为占位实现（Mock Mode），避免误判系统能力。 | 见 §3 开篇。 |
| **🟡 三级** | **❻ 缺「最终确认重算」策略** | Confirm Final Plan 时再拉实时价，但 TTL 过期/价格涨了怎么办？自动取消还是重新确认？**必须**写 **Price Drift Handling Policy**。 | 见 §5.4。 |

**目标**：修掉前两个红色问题（❶ 自定义行程走后端创建 Draft、❷ Canonical JSON + Schema 强约束），架构成熟度可达 **9.2+**；协议一致性与数据真相完整性同步提升。

---

## 0.4 协议与运营缺口与闭环要求（满分必闭环）

以下按**八层**列出文档未完全闭环的缺口；每项须在协议/实现/运营中**成文或落库**，否则影响协议严谨度与可运营性。**法律与责任（平台是否承担履约责任、旅游执照/保险）本文档不触及，由合规单独定稿。**

### 第一层：协议级缺口

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣** | **SnapshotHash 是否绑定「协商记录版本号」** | 若聊天中有额外口头承诺/附加条件未进结构化字段，snapshot 与实际协商断层，争议会出现「你聊天答应了」。 | **必须**：confirm-final-plan 时保存 **last_message_id**、**last_change_request_id**（若有），并进入 snapshot canonical payload；见 §4.4、§4.5。 |
| **2️⃣** | **ItinerarySpec 升级策略未定义** | v2 出现时如何兼容？老 snapshotHash 是否继续有效？schemaVersion 是否进 hash？ | **必须**：canonical payload **含 schemaVersion**；新版本**向下兼容**；老版本 snapshot **永远可 replay**；见 §4.4、§4.5。 |

### 第二层：并发与一致性

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **3️⃣** | **双端生成订单的竞态** | 首页 5 连 + itinerary/new 单生成 + 自定义行程；用户多 tab 同时提交 → 草稿爆炸、存储膨胀、市场页污染。 | **必须**：**每用户 Draft 上限**（建议 ≤20）、**旧 Draft 自动归档**策略；后端校验 per-user draft cap，超限拒绝或归档后再创建；见 §4.6。 |
| **4️⃣** | **confirm-final-plan 无乐观锁** | 向导改 v3、旅行者在旧页确认 v2 → 错误 snapshot。 | **P0 Gate**：confirm 请求**必须带 expected_version**，后端 **CAS 校验**（当前 version === expected_version 才写入 snapshot_hash），否则返回 409 并提示刷新；见 §4.5。 |

### 第三层：经济模型覆盖

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **5️⃣** | **平台费是否写入 snapshot？** | 费率未来调整会影响历史订单解释。 | **必须明确**：**platform_fee**（或 platform_fee_rate）在 snapshot 中**固定为确认时值**；是否链上常量由 08-3/合约定；见 §4.4。 |
| **6️⃣** | **小费是否走 escrow？** | 小费是否进 snapshot、是否可 dispute、是否链上支付未写。 | **须在协议层定稿**：小费是否进入 snapshot canonical、是否可争议、是否与主金额同通道链上支付；见 §4.4 与 03/合约。 |

### 第四层：AI 系统风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **7️⃣** | **Prompt 版本是否持久化？** | 用户投诉行程不合理时能否复现当时 AI 输出？ | **必须**：**promptVersion**、**modelName**、**temperature**（及必要采样参数）**写 DB**；snapshot 前**冻结**并写入 proof；支持**回放/审计**；见 §4.7。 |
| **8️⃣** | **AI 输出是否 deterministic？** | temperature > 0 则同输入不同结果，争议难复现。 | **建议**：生成阶段 **temperature 低**（或 0）；或**存 raw_output**（完整模型输出）便于争议时复现；见 §4.7。 |

### 第五层：价格风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **9️⃣** | **TTL 过期后 snapshot 是否允许？** | 无法证明确认时价格有效。 | **必须**：若使用 Live Quote，snapshot canonical **含 quote_id、expiresAt**（或等效）；TTL 过期后**禁止**生成 snapshot，或按 Price Drift Policy 降级并标注；见 §4.4、§5.4。 |
| **🔟** | **汇率锁定时间未定义** | 展示 EUR、结算 USDC 时，汇率何时锁定？ | **必须写**：汇率锁定时点三选一或组合成文——**生成时 / 确认时 / 上链时**；与 03/08-3 一致；见 §5.5。 |

### 第六层：链级风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣1️⃣** | **Reorg + Snapshot 同步** | confirm 后生成 snapshotHash、准备支付期间 reorg，DB 有 hash 链上未确认。 | **必须**：与 01/03 **reorg listener、projection 回滚**机制衔接；80 模块（行程/snapshot）依赖链上终态处**不提前视为已上链**；见 §4.8。 |
| **1️⃣2️⃣** | **订单取消与 snapshot 是否可撤销？** | 确认后、尚未上链，用户想取消：是否允许生成 v2？旧 snapshot 是否废弃？ | **必须写「不可逆点」**：confirm 成功后 **snapshot 不可撤销**；未上链前是否允许「取消订单」仅作订单状态变更、**不**再生成新 snapshot；旧 snapshot 永续可验；见 §4.5。 |

### 第七层：可运营性

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣3️⃣** | **自由市场排序规则未定义** | 订单列表/向导列表按什么排？信誉？质押？ | **必须写**：订单排序（时间/金额/目的地等）、向导排序（信誉/质押/评分等）规则成文，与 04/29 一致；见 §6。 |
| **1️⃣4️⃣** | **AI 生成次数限制未定义** | 首页 5 份但用户可刷新无数次 → 成本与滥用。 | **必须写**：**免费额度**（如每用户每日 N 次）、**速率限制**（per-IP/per-user）、**成本控制**（超限拒绝或降级）；见 §4.6。 |

---

## 0.5 协议层最终盲区与八层深化缺口（满分必闭环）

> **企业级定位**：本节及 **§0.6** 为**已识别的协议深化台账**（已知债）。逐项闭合须 **OWNER、版本 bump、可复核证据**，并按 [07-开发流程与顺序 §二 2.4](07-开发流程与顺序.md) 联动 **04 / 14 / 18 / 00 索引**。**不阻塞**当前订单主链已实现路径（与 [18-TravelTrust-全系统架构图](18-TravelTrust-全系统架构图.md) 篇首 **读图串联** 一致）；对外叙事与法务门槛与工程排期**解耦**，避免「文档未满分则主链不得发版」的误用。

以下为**协议层最终盲区**及**数据演化 / 执行流程 / 经济 / AI / 链级 / 运营 / 可审计**深化缺口；闭环后须产出**四项交付物**（见本节约尾）。

### Ⅰ. 协议层最终盲区

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣** | **snapshotHash 是否绑定「身份与链上下文」** | 若不绑定 guide_id、traveler_id、chain_id、token、contract_version，同一 snapshot 理论上可被绑到另一向导或不同链。 | **必须**：canonical payload **含 traveler_id、guide_id、chain_id、settlement_token、contract_version**；snapshot = 完整合约不可迁移；见 §4.4、**Canonical Payload 白皮书**。 |
| **2️⃣** | **多币种结算风险** | 1000 USDC 与 1000 USDT 链上语义不同；snapshot 须锁死 **token_decimals、token_symbol、token_address**。 | **必须**：**settlement asset 锁死**；canonical 含 token 三要素；金额用**最小单位整数**（见 §4.4 精度规范）。 |

### Ⅱ. 数据演化风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **3️⃣** | **Canonical「字段删除」策略** | v2 删除字段时老 snapshot replay 是否允许缺失？ | **必须**：**删除字段只能标记 deprecated，不可移除**；canonical payload 为 **superset**（新版本仅追加）；历史订单可 replay；见 §4.4。 |
| **4️⃣** | **JSON 精度与小数规范** | 1000 / 1000.0 / 1000.00 导致 hash 不同。 | **必须**：**金额全部用整数（最小单位）**；JSON 数字**统一字符串或整数**，禁止 float；见 §4.4。 |

### Ⅲ. 执行流程盲点

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **5️⃣** | **confirm 与 deposit 之间的时间窗口** | confirm 后 30 分钟未支付怎么办？自动取消？释放档期？价格锁多久？ | **必须**：定义 **payment_window**（如 30min / 2h）、**超时状态转换**；见 **Payment Window + Timeout 状态机**、§4.9。 |
| **6️⃣** | **争议触发前提未绑定 snapshot** | dispute 允许在 deposit 前/后/completion 后？若未绑定 snapshot_version 会引用错误版本。 | **必须**：争议**绑定 snapshot_version**（或 order version）；明确 dispute 允许的订单状态；见 03、§4.5。 |

### Ⅳ. 经济模型隐藏风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **7️⃣** | **平台费与押金是否互斥？** | 向导违约扣押金时，平台费是否退还？deposit → 平台费扣除时点？completion 扣还是 dispute 后？ | **必须**：**资金流顺序成文**（deposit / platform_fee 扣除时点 / 押金 / 小费）；见 **资金流顺序图**。 |
| **8️⃣** | **小费是否影响信誉评分？** | 小费高=信誉高易刷单。 | **必须**：定义小费**是否进入 reputation**、**异常检测**规则；见 03、81。 |

### Ⅴ. AI 模块深层风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **9️⃣** | **AI「不可执行建议」的责任** | AI 建议不存在的景点/不合法活动/已关闭场馆，责任谁担？ | **必须**：成文 **AI 仅为建议，向导必须二次确认**；免责与责任界定；见 §4.7、产品口径。 |
| **🔟** | **Prompt 演化对历史订单的影响** | v1 生成 A、v2 生成 B，replay 用旧 prompt？ | **必须**：**冻结 promptVersion、system prompt、template** 于 proof；历史 replay 用当时冻结版本；见 §4.7。 |

### Ⅵ. 链级极端场景

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣1️⃣** | **链/合约升级** | Escrow 合约升级后 snapshotHash 是否仍兼容？ | **必须**：**contract_version 进入 canonical**；**proxy 升级策略**写明；见 §4.4、14。 |
| **1️⃣2️⃣** | **Token 黑名单/冻结** | USDT 等存在地址冻结；资金被冻结时平台责任？是否允许切换 token？ | **必须**：**Token 黑名单与冻结策略**成文（免责、切换规则）；见 03/08-3。 |

### Ⅶ. 运营与规模化盲区

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣3️⃣** | **订单撤回与信誉惩罚** | 旅行者频繁生成→撤回→不支付，向导时间被浪费。 | **必须**：**限制撤回次数**和/或**扣旅行者信誉**；成文；见 03、§4.6。 |
| **1️⃣4️⃣** | **市场操纵风险** | 多账号接单、抬高排序。 | **必须**：**anti-sybil**、**stake-weight 排序**、**信誉加权**等规则成文；见 §6、29。 |

### Ⅷ. 可审计与取证

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣5️⃣** | **能否 100% 重建任意订单状态？** | 投资人要求：任意 order_id 从 genesis 到终态完全重建。 | **必须**：**event_log 完整**、**snapshot 版本记录**、**message/quote 版本记录**；见 **Replay 测试规范**、§4.10。 |

### 四项交付物（只差此四则协议闭环）

| # | 交付物 | 说明 |
|----|--------|------|
| **①** | **Canonical Payload 完整字段白皮书（最终版）** | 参与 snapshotHash 的**完整字段清单**（含身份/链/结算：traveler_id、guide_id、chain_id、settlement_token、contract_version、token_decimals/symbol/address；金额整数最小单位；字段删除=仅 deprecated、payload=superset）；与 §4.4 一致，独立成文便于实现与审计。 |
| **②** | **资金流顺序图（含平台费/押金/小费）** | deposit → platform_fee 扣除时点、completion/dispute 时资金分配顺序、押金与平台费是否互斥、小费通道；与 03、81、合约一致。 |
| **③** | **Replay 测试规范** | 任意 order_id 从 genesis 到终态的 **Replay Validation Test**：event_log、snapshot 版本、message 版本、quote 版本齐全可重建；验收标准与用例。 |
| **④** | **Payment Window + Timeout 状态机** | confirm 后 **payment_window**（如 30min/2h）、超时状态转换（自动取消/释放档期/锁定价格时长）；与 01 订单状态机衔接。 |

**已独立成文**：① [80-附录-01-Canonical-Payload-白皮书](80-附录-01-Canonical-Payload-白皮书.md)；② [80-附录-02-资金流顺序图](80-附录-02-资金流顺序图.md)；③ [80-附录-03-Replay-测试规范](80-附录-03-Replay-测试规范.md)；④ [80-附录-04-Payment-Window-Timeout-状态机](80-附录-04-Payment-Window-Timeout-状态机.md)。实现与审计以附录为准。

**补件顺序**：**先完成四项交付物**（①～④）→ **再补**：**Emergency Mode 行为矩阵**、**Admin 权限最小化矩阵**、**GDPR 删除策略**（逻辑删除与可审计并存）；见 §0.6、§4.12。

---

## 0.6 治理与极端风险缺口（满分必闭环）

**术语边界（企业级）**：本节「**治理**」指 **订单规则不可追溯篡改、多签 / pause、版本路由** 等**协议运维与紧急处置**，**不是** [82-治理币-文档总览](82-治理币-文档总览.md) / [83-区域治理与收益分配-协议白皮书](83-区域治理与收益分配-协议白皮书.md) 中的 **FeeRouter / TTG / 区域池经济治理**。**后者**单源见 [49-阶段建议-下一阶段方向与优先级](49-阶段建议-下一阶段方向与优先级.md) **G.4**、[07-开发流程与顺序](07-开发流程与顺序.md) **§五 5.2A**。

以下为**协议不可变性/治理冲突、极端资金、数据主权、信誉操纵、AI 长期、汇率极端、可恢复性、权限、平台责任、混沌测试**等缺口；须成文并纳入补件顺序。

### Ⅰ. 协议不可变性与治理冲突

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣** | **治理权是否可 retroactively 解释历史规则？** | 若治理可修改 dispute 规则/违约判定并影响历史订单，终态不可篡改性会被质疑。 | **必须写明**：**治理仅影响未来订单**；**历史订单按确认时规则执行**；snapshot/contract_version 锁定当时解释。见 08/治理文档。 |
| **2️⃣** | **多合约版本并存冲突** | Escrow V1/V2 并存时，是否允许不同版本订单同一市场？dispute 裁决逻辑是否兼容？ | **必须定义**：**版本并行策略**（同链多版本订单是否允许）、**向前迁移是否允许**；dispute 按 contract_version 路由裁决逻辑。见 14、§4.8。 |

### Ⅱ. 极端资金事故

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **3️⃣** | **合约 Pause 与订单状态** | 合约紧急暂停时，deposit/release/争议是否允许？ | **必须写**：**Emergency Mode 行为矩阵**（pause 下 deposit 禁止、release 禁止、争议是否允许、进行中订单状态）；与 01/03 一致。**补件**：四项交付物完成后补。 |
| **4️⃣** | **资金卡死场景** | 向导/旅行者失联、双方都不操作，资金永远锁仓。 | **必须**：Escrow 有**强制 timeout**、**强制 dispute 入口**、**强制清算机制**（如超时自动可争议、仲裁后执行）；见 01 订单状态机、03。 |

### Ⅲ. 数据主权与删除权（GDPR）

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **5️⃣** | **GDPR/删除请求 vs 不可篡改日志** | 用户要求「删除我的数据」与 event_log append-only、snapshot 永久存储冲突。 | **必须设计**：**逻辑删除与可审计并存**（如 pseudonymization、删除 PII 但保留 hash、订单级「已脱敏」标记）；**GDPR 删除策略**成文。**补件**：四项交付物完成后补。 |

### Ⅳ. 信誉系统可操纵风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **6️⃣** | **信誉权重防冷启动操纵** | 新向导刷小费、自成交。 | **必须**：reputation 是否**只计 dispute-free 完成**、**小费不计权重**或降权、**stake-weight 参与排序**等成文；防操纵规则见 03、81。 |

### Ⅴ. AI 长期演化风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **7️⃣** | **知识过期风险** | 景点关闭、政策/签证变化，固定 prompt 长期失效。 | **必须定义**：**数据刷新周期**、**RAG 数据源审核机制**；见 §3、Phase 3。 |
| **8️⃣** | **AI 歧视性/敏感内容** | 推荐「某区域不安全」、敏感政治等。 | **必须**：**content moderation**、**合规过滤**成文；见 §4.7、合规。 |

### Ⅵ. 价格与汇率深层风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **9️⃣** | **汇率极端波动** | EUR/USD 2 小时内波动 5% 等。 | **必须**：除锁定时间外，定义**极端波动阈值**、是否**自动冻结下单**；见 §5.5、03。 |

### Ⅶ. 系统可恢复性

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **🔟** | **DB 与链状态分叉** | DB 崩溃恢复、projection 回放后 snapshot 版本是否一致？ | **必须写**：**冷启动 replay 测试流程**、**hash 验证机制**；与 §4.10 Replay 规范一致。 |

### Ⅷ. 组织与权限风险

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣1️⃣** | **管理员权限范围** | admin 是否可改 snapshot、手动改订单状态、直接放款？ | **必须写**：**Admin 权限最小化矩阵**（admin **不可**改 snapshot、不可随意改订单状态/直接放款；仅限紧急/裁决执行等明确定义）。**补件**：四项交付物完成后补。 |

### Ⅸ. 终极边界（融资必问）

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣2️⃣** | **平台是否承担履约风险？** | 技术托管协议 vs 旅行服务商；向导出事故时平台免责/保险？ | **必须写**：**技术托管协议** vs **旅行服务商**定位；免责范围、是否含保险；与合规/法务定稿，融资前必答。 |

### Ⅹ. 终极测试

| # | 缺口 | 闭环要求 | 落点 |
|---|------|----------|------|
| **1️⃣3️⃣** | **灾难级演练** | 同时 1000 笔 dispute、链 reorg、API 聚合器宕机、AI 不可用、价格大幅波动。 | **必须**：**Chaos Test 方案**（场景、频率、通过标准）；见 38、运维。 |

---

## 1. 核心原则

| 原则 | 含义 | 当前实现与待增强 |
|------|------|------------------|
| **结构化输出（Schema First）** | 行程必须符合 ItinerarySpec v1 JSON Schema，便于校验、版本化与链上绑定。**禁止用软结构生成硬签名**：须有 Canonical JSON 规则、明确 hash 参与/不参与字段（§4.4）。 | **🔴 必须修**：当前 mock 输出自由格式，无 JSON Schema 强校验；需落地 ItinerarySpec v1、Canonical JSON 规则文档、hash 参与字段定义，避免字段顺序/文案变动导致 hash 变化（见 §0.3 ❷）。 |
| **版本化（Versioned）** | 任何修改生成新版本，不覆盖旧版本。 | **已落点**：itineraries 表含 version；confirm-final-plan 仅 Draft 且未确认过；前端 EscrowDetail 展示 version、snapshotHash。 |
| **预算闭合（Budget Closed）** | 分项加总必须等于总价。 | **已落点**：42 自定义行程弹窗侧由 lib/countries 与 useQuoteCalculation 保证分项=总价；**待增强**：Landing/AI 生成侧后端 amount_breakdown 需强校验 sum(items)==total。 |
| **链为资金真相** | 链上只绑定 snapshotHash，不把全文写链上。 | **已落点**：confirm_final_plan 生成 keccak256(orderData)，写 itineraries.snapshot_hash；Escrow 详情展示 snapshotHash；与 19/01 一致。 |
| **价格服务独立** | AI 不负责实时价；价格由 pricing_service 提供并带 TTL。 | **已落点**：前端定价来自 [44-国家独立定价模块](44-阶段-国家独立定价模块.md)（lib/countries）；**待增强**：后端 itinerary 生成仍用 body.budget_min/max 比例拆分，未接独立 pricing_service；Live Quote / Import Quote 见 §5。 |
| **可审计** | 保留 promptVersion、schemaVersion、quote source、hash/evidence。 | **部分落点**：snapshot_hash、version 已存；**待增强**：proof 字段（schemaVersion、promptVersion、modelName）、报价来源与 TTL 未统一落库。 |

---

## 2. 系统组件（分层架构）

### 2.1 前端（Next.js）— 与现有页面对照

| 组件/能力 | 方案描述 | 当前实现（TravelTrust：路由与组件） |
|-----------|----------|-------------------------------------|
| **Itinerary Builder Form** | 收集偏好：目的地/日期/天数/预算/景区类型/餐饮/酒店等。 | **已实现**：`/` 使用 `LandingHeroForm`（国家、城市、出发/结束日期、景区类型、餐饮/酒店标准、预算，`components/landing/LandingHeroForm`）；国家/城市选项与 **`lib/productCountries.ts`** → **`lib/geoOptions`** 一致，**`GET /meta.product_countries`** 与 **04** 对齐（**勿与 84 治理「十国」混读**，见 **07** 读前摘要）。`/itinerary/new` 使用独立表单（destination/city/travel_date/days/hotel_type/food_preference/transport/budget_min_max/notes）；与 25/28 玻璃风格一致。 |
| **Itinerary Preview（杂志式）** | 展示日程 + 预算拆分 + 高亮亮点。 | **已实现**：`/` 使用 `ItineraryResultsSection`（盲盒卡 + 解锁后 daily_itinerary、amount_breakdown）；`/itinerary/new` 结果区 Day N 分段、费用明细、`AgreementSummaryAccordion`（25/27-P22）。 |
| **Free Market** | 订单×向导撮合 + 聊天协商（版本化）。 | **已实现**：`/market` 订单列表（getDiscoverOrders）、向导列表（getGuides）、`OrderDetailDrawer`/`GuideDetailDrawer`/`BookGuideModal`；订单详情在 `/escrow/[id]`，聊天与 confirm-final-plan API 已具备。**🔴 必须修**：`CustomItineraryModal` 当前提交后仅加入前端列表；**目标**：提交 → POST `/api/v1/itineraries/custom` → Draft + order_id → 刷新列表（见 0.3 ❶）。 |
| **Confirm Final Plan** | 最终确认、生成 snapshotHash、进入 Escrow。 | **已实现**：`/escrow/[id]` 使用 `EscrowDetail`（`components/escrow/EscrowDetail`），展示 itinerary、snapshot_hash；Draft 态由 `ConfirmFinalPlanBlock` 调用 `POST /api/v1/orders/:id/confirm-final-plan` 生成 hash 并写库；签名与 Escrow 流程见 28/13-1。 |
| **Live Quote Page** | 聚合器 API 获取酒店/航班实时价（可选）。 | **待实现**：Phase 2；当前无实时报价页。 |
| **Import Quote Page** | 用户导入链接/截图报价（MVP 友好）。 | **待实现**：Phase 1 可做「链接/截图+手填」证据链；见 §5.2。 |

### 2.2 后端（Rust + Axum）— 与 04/09 对照

| 服务 | 方案描述 | 当前实现与待增强（本项目路径） |
|------|----------|------------------------------|
| **itinerary_service（AI 编排器）** | 接收偏好 → 调用大模型 API → 结构化输出 → 校验 → 落库。 | **当前**：`crates/api/src/chain_off.rs` 中 `itinerary_create_impl` + `generate_itinerary_mock` 为占位逻辑（按 budget_min/max 比例拆分、模板文案）；**待增强**：接入真实大模型 API，输出 ItinerarySpec v1，经 Validator 校验后写入 itineraries（db 层见 `crates/api/src/db.rs`）。 |
| **pricing_service** | 报价服务：API 聚合 + TTL；与 AI 解耦。 | **当前**：前端定价由 `frontend/lib/countries` 与 44 模块负责；后端无独立 pricing 服务；**待增强**：Phase 2 Live Quote 时引入 pricing_service（Redis 缓存、expiresAt）。 |
| **quote_import_service** | 导入报价：解析/校验/对比 + 证据链。 | **待实现**：Phase 1 可做用户手填+证据 hash，与 AI 估算做 Δ 对比。 |
| **Schedule Engine（档期引擎）** | 档期重叠判断、锁定生效（deposit finality 后）、payment_window 软占用与超时释放、接单/发布时校验；见 §4.15。 | **必须增加**：无此组件则「只禁时间重叠」「锁定生效点=deposit finality」等规则无法精确执行；与 01/03/04 接单与取消 API 衔接。 |

### 2.3 数据层（CockroachDB / PostgreSQL）

版本化存储、证据留存、对账可追溯。**当前**：04 附录 DDL 有 itineraries 草案；`crates/api/migrations/20250228000006_itineraries.sql` 定义 itineraries 表（order_id UNIQUE、draft_id、version、destination、city、days_json、amount_breakdown_json、snapshot_hash 等），`crates/api/src/db.rs` 中 `insert_itinerary`、`update_itinerary_snapshot_hash` 及启动时 hydrate 用的 SELECT 与之一致；运行时订单+行程由 chain_off 内存 store 提供（GET order 时从 store.itineraries 取 bundle 拼 itinerary）。与 01 §9、04 §二 一致；证据包与 01 §6 对齐。

---

## 3. AI 生成流水线（Orchestrator Pipeline）

**🟡 标注（❺）**：以下四步为**目标流水线**；**当前后端仅为占位实现（Mock Mode）**，实际仅有 `generate_itinerary_mock`，未接大模型。文档区分目标态与现状，避免误判系统能力。**49 F 落点**：§3 Mock 标注已满足 49 F.2.2（AI 流水线标注）。

| Step | 名称 | 输入 | 输出 | 当前状态（本项目） |
|------|------|------|------|---------------------|
| 1 | **Planner** | 用户偏好 | days[]（早/午/晚）、节奏、亮点 | `generate_itinerary_mock` 按 body.days 生成 ItineraryDayRow[]，content_text 为模板句（目的地+城市+第 N 天+酒店/交通/餐饮）。 |
| 2 | **Budgeter** | 行程结构 + 定价输入 | 预算拆分（hotel/catering/tickets/guide_fee/vehicle/platform_fee/total_budget）；校验 sum==total | mock 按 budget_min/max 比例拆为上述六项+total_budget（chain_off AmountBreakdown）；**待**：闭合校验与重试。 |
| 3 | **Narrator** | 结构化日程 | 杂志级文案块（仅展示层） | 可选；当前 mock 为单行 content_text。 |
| 4 | **Validator** | 上述输出 | JSON Schema 校验、数学闭合、天数/日期一致性 | **待实现**：ItinerarySpec v1 schema + 校验器。 |

---

## 4. 关键数据结构

### 4.1 ItinerarySpec v1（目标核心 Schema）

| 块 | 内容 |
|----|------|
| **meta** | 目的地、**start_date**、**end_date**（档期必选，§4.15）、人数、语言、偏好、生成时间。 |
| **days[]** | morning/afternoon/evening + transport + notes。 |
| **budget** | 分项 + total + currency；**必须** sum(items)==total。 |
| **policies** | 取消/争议/退款口径（用于协商与合约绑定语义）。 |
| **proof** | schemaVersion、promptVersion、（可选）modelName。 |

**当前实现**：API 与 DB 使用 destination、city、days_json（每日 content_text/content_images）、amount_breakdown_json、snapshot_hash、version；与 ItinerarySpec v1 的**字段可映射**，但未强制 Schema 校验与 proof 字段。**须落地 §4.4 Canonical JSON 与 hash 参与字段**，避免软结构生成硬签名（🔴 ❷）。

### 4.2 版本机制

version = v1, v2, v3…；任何协商或改价产生新版本；旧版本只读保留。**已落点**：itineraries.version、confirm 仅一次、snapshot_hash 写回。

### 4.3 snapshotHash

最终确认版本：**canonicalize JSON**（字段排序、仅含参与字段）→ snapshotHash = keccak256(canonical_json)。**当前实现**：confirm_final_plan_impl 对 order_id、version、amount、currency、destination、city、days（长度）、total_budget 做 keccak256。**🟠 二级问题（❹）**：当前 **未**包含完整 budget breakdown（guide_fee、vehicle 等未单独参与）、**未**包含 policies、cancellation rules，争议时 snapshotHash 无法证明完整合同。**必须**扩展为包含：完整 amount_breakdown、policies、cancellation rules（见 §4.4）。

### 4.4 Canonical JSON 与 snapshotHash 参与字段（🔴 必须落地）

**目的**：避免「软结构生成硬签名」——字段顺序或 UI 文案变动导致 hash 不同、版本升级冲突。须有**成文规则**并严格执行。

| 项 | 要求 |
|----|------|
| **Canonical JSON 规则** | 键按字母序排列；数值/字符串格式统一；不包含未定义或 null 的可选键（或明确约定 null 的序列化方式）；编码 UTF-8；无多余空白。 |
| **参与 snapshotHash 的字段（合同真相）** | **身份与链上下文（0.5 1️⃣2️⃣）**：**traveler_id**、**guide_id**、**chain_id**、**settlement_token**（或 token_address）、**contract_version**；**结算锁死**：**token_decimals**、**token_symbol**、**token_address**。**档期（§4.15）**：**start_date**、**end_date**（必选，用于重叠判断与锁定）。order_id、**schemaVersion**、version、**amount（最小单位整数）**、currency、destination、city、**完整 budget breakdown**（含 platform_fee）、**days**、**policies**、**cancellation_rules**；**协商锚点**：last_message_id、last_change_request_id；Live Quote 时 quote_id、expiresAt。**小费**是否入 canonical 须协议层定稿。**完整清单**以 **Canonical Payload 完整字段白皮书（最终版）** 为准（0.5 四项交付物 ①）。 |
| **不参与 snapshotHash 的字段（仅展示）** | UI 文案、content_images、proof 中与合同无关部分。 |
| **按日行程结构（52）** | 若 canonical 或 itinerary 响应中含按日行程（days/daily_itinerary），字段定义以 [52-阶段开发技术文档](52-阶段开发技术文档.md) §3.1 统一表为准。 |
| **Schema 强约束** | 生成 snapshot 前，payload 必须通过 Snapshot Payload Schema 校验；校验失败不得写入 snapshot_hash。 |
| **ItinerarySpec 升级策略（0.4 2️⃣）** | schemaVersion 必进 canonical；新版本**向下兼容**；老 snapshot 永远可 replay。 |
| **字段删除策略（0.5 3️⃣）** | **v2 不得移除字段**，只能**标记 deprecated**；canonical payload 为 **superset**（新版本仅追加），老 replay 时缺失字段按 deprecated 处理；否则历史订单不可 replay。 |
| **JSON 精度与小数规范（0.5 4️⃣）** | **金额全部用整数（最小单位）**；JSON 数字**统一为字符串或整数**，禁止 float（1000 / 1000.0 / 1000.00 会导致 hash 不同）。 |

**当前**：无独立 Canonical JSON 文档，hash 参与字段不全；**必须补**：**Canonical Payload 完整字段白皮书（最终版）**（0.5 ①）、Snapshot Payload Schema、后端生成 hash 前校验（见 §0.3 ❷、❹）。

### 4.5 confirm-final-plan：乐观锁与不可逆点（P0 Gate）

| 项 | 要求 |
|----|------|
| **乐观锁（CAS）** | 请求**必须带 expected_version**（当前前端展示的 itinerary version）；后端**仅当**当前 DB/store 中 version === expected_version 时写入 snapshot_hash，否则返回 **409 Conflict** 并提示「版本已变更，请刷新后重试」。**P0 Gate**：未实现 CAS 不得上线（0.4 4️⃣）。 |
| **不可逆点** | confirm 成功后 **snapshot 不可撤销**；未上链前若允许「取消订单」，仅作订单状态变更，**不再**生成新 snapshot，旧 snapshot 永续可验（0.4 1️⃣2️⃣）。 |
| **争议绑定 snapshot（0.5 6️⃣）** | 争议**必须绑定 snapshot_version**（或 order version），避免 dispute 引用错误版本；明确 dispute 允许的订单状态（deposit 前/后、completion 后）；见 03。 |

### 4.9 Payment Window + Timeout 状态机（0.5 5️⃣、四项交付物 ④）

confirm 与 deposit 之间的时间窗口须成文，否则订单会卡死、向导被白锁：

| 项 | 要求 |
|----|------|
| **payment_window** | **必须**定义 **payment_window**（建议 **30 分钟**）：confirm 后在此时间内**必须**完成 deposit；超时未支付则**自动取消订单**。 |
| **超时状态转换** | 超时后：**自动取消订单** + **解除向导档期锁定**（向导可再接单）+ 释放价格/报价占用；**不得**在未 deposit 前长期占用向导档期。与 01 订单状态机、§4.15 Schedule Engine 衔接。 |
| **交付物** | **Payment Window + Timeout 状态机**文档（状态图 + 转换表），与 03、04 一致。 |
| **49 F 落点** | 策略已成文；后端以 **P3_PAYMENT_TTL_SECS** 或 **PAYMENT_WINDOW_MINUTES**（49 F.5）可配置，Accepted 后超时未 deposit 时 order_mock_pay 返回 410 payment_window_expired 并自动取消订单、释放档期；见 49 F.5、ops/RUNBOOK §2.5。 |

### 4.6 Draft 上限与 AI 生成限制

| 项 | 要求 |
|----|------|
| **Draft 上限** | **每用户 Draft 数量上限**（建议 ≤20）；超限时拒绝新创建或**先归档旧 Draft**再创建；避免多 tab/多入口同时提交导致草稿爆炸、市场页污染（0.4 3️⃣）。 |
| **AI 生成次数** | **免费额度**（如每用户每日 N 次）、**速率限制**（per-IP/per-user）、**成本控制**（超限拒绝或降级）；首页 5 连生成与 itinerary/new、custom 共享额度逻辑（0.4 1️⃣4️⃣）。 |

### 4.7 AI 可审计与确定性

| 项 | 要求 |
|----|------|
| **Prompt/模型持久化** | **promptVersion**、**modelName**、**temperature**（及必要采样参数）**写 DB**，snapshot 前**冻结**并写入 proof；支持投诉/争议时**回放与审计**（0.4 7️⃣）。 |
| **Prompt 演化与历史 replay（0.5 🔟）** | 历史订单 replay 时**必须用当时冻结的 promptVersion、system prompt、template**，不得用新版本；否则同样输入不同输出，无法复现。 |
| **不可执行建议的责任（0.5 9️⃣）** | **AI 仅为建议，向导必须二次确认**；不存在的景点/不合法活动/已关闭场馆等责任界定成文（免责与向导确认义务）；产品口径与 03 一致。 |
| **确定性建议** | 生成阶段 **temperature 低**（或 0）；或**存 raw_output** 便于争议复现（0.4 8️⃣）。 |

### 4.8 Reorg 与 Snapshot 关系

订单/snapshot 模块与链上终态一致：**不提前将「已写 DB 的 snapshotHash」视为已上链**；支付/放款等依赖链上事件的逻辑须与 01/03 的 **reorg listener、projection 回滚**机制衔接，避免 reorg 后 DB 与链不一致（0.4 1️⃣1️⃣）。**合约升级（0.5 1️⃣1️⃣）**：**contract_version 已进 canonical**；Escrow proxy 升级策略须在 14/合约文档写明，保证老 snapshot 仍可验证。**Token 黑名单/冻结（0.5 1️⃣2️⃣）**：USDT 等地址冻结时的平台责任、是否允许切换 token，须在 03/08-3 成文。

### 4.10 Replay 测试规范（0.5 1️⃣5️⃣、四项交付物 ③）

**目标**：任意 order_id 从 genesis 到终态 **100% 可重建**（投资人/审计要求）。

| 项 | 要求 |
|----|------|
| **event_log 完整** | 订单生命周期内关键事件可追溯（创建、确认、deposit、争议、裁决、放款等）。 |
| **snapshot 版本记录** | 每笔订单的 snapshot 版本与 canonical 快照可查、可 replay。 |
| **message / quote 版本记录** | 协商消息、报价版本与 snapshot 锚点一致，可复现「确认时上下文」。 |
| **交付物** | **Replay Validation Test** 规范：输入 order_id，输出「可重建完整状态」的验收标准与用例；与 04、DB 事件表一致。 |

### 4.11 资金流顺序与运营规则（0.5 7️⃣8️⃣、四项交付物 ②）

**资金流顺序**（平台费/押金/小费）须成文，避免争议时歧义：deposit → **platform_fee 扣除时点**（deposit 时 / completion 时 / dispute 后）；向导违约**扣押金**时**平台费是否退还**、是否先抽成；**小费**是否进 escrow、是否可 dispute。**交付物**：**资金流顺序图**（含平台费/押金/小费），与 03、81、合约一致。**小费与信誉（0.5 8️⃣）**：小费**是否进入 reputation**、**异常检测**（防刷）须定义。

### 4.12 Emergency Mode 行为矩阵（0.6 Ⅱ 3️⃣）

合约被紧急暂停（pause）时，须成文行为，避免歧义与法律/审计质疑：

| 操作/状态 | Pause 下是否允许 | 说明 |
|-----------|------------------|------|
| **deposit** | **禁止** | 暂停期间不得新存入资金。 |
| **release** | **禁止**（或仅允许已裁决的 release） | 暂停期间不得执行普通 release；若仲裁已裁决，可约定仅允许「执行已裁决结果」或一律禁止直至解除 pause。 |
| **争议提起** | **允许**（建议） | 用户仍可提起 dispute，避免「暂停期间无法维权」；裁决执行可延至解除 pause 后。 |
| **争议裁决执行** | **禁止**（或按治理定稿） | 是否在 pause 下执行仲裁结果须治理定稿。 |
| **进行中订单状态** | **冻结** | 已 deposit 未 release 的订单保持「进行中」，不自动取消；解除 pause 后按原规则继续。 |

**落点**：与 01 订单状态机、03 争议流程、合约 pause 逻辑一致；**补件顺序**：四项交付物完成后补。

### 4.13 Admin 权限最小化矩阵（0.6 Ⅷ 1️⃣1️⃣）

| 权限/操作 | 是否允许 | 说明 |
|-----------|----------|------|
| **修改 snapshot / snapshot_hash** | **禁止** | 历史真相不可篡改；admin 不得改已确认 snapshot。 |
| **手动更改订单状态** | **仅限明确定义场景** | 如：客服裁决后「标记为已裁决」、系统故障恢复后的状态校正；须审计日志、双人复核或治理约定。 |
| **直接放款（不经合约/裁决）** | **禁止** | 资金走向必须经合约或仲裁结果执行，admin 不得绕过。 |
| **紧急 pause 合约** | **允许**（多签/治理） | 须多签或治理通过，并留审计日志。 |
| **查看/导出审计日志** | **允许**（合规/审计角色） | 仅限合规、审计、执法配合等明确定义角色。 |

**落点**：与 08、运维 RBAC 一致；**补件顺序**：四项交付物完成后补。

### 4.14 GDPR 删除策略（逻辑删除与可审计并存）（0.6 Ⅲ 5️⃣）

在「用户要求删除数据」与「event_log append-only、snapshot 永久存储」之间须成文策略，满足可审计且合规：

| 项 | 要求 |
|----|------|
| **PII 删除** | 用户请求删除时：**删除或 pseudonymization 可识别个人数据**（姓名、邮箱、电话、地址等）；**保留** order_id、链 tx hash、snapshot_hash、金额、时间等**业务与链上可验证数据**。 |
| **保留 hash / 不可篡改** | **snapshot_hash、event 哈希、链上数据**不删除；链上记录不可删，链下 DB 可「逻辑删除」或「脱敏后保留 hash」。 |
| **逻辑删除** | 对订单/用户记录采用 **deleted_at / is_anonymized** 等标记，查询时过滤；审计与对账仍可按 hash 验证历史一致性。 |
| **数据源与留存期限** | 明确**哪些表/字段**可删、哪些仅脱敏、**留存期限**（如 7 年合规）；与合规/法务定稿。 |

**落点**：与 04 数据分类、合规文档一致；**补件顺序**：四项交付物完成后补。

### 4.15 档期与锁定规则（时间冲突边界、Schedule Engine）

单线程模型（同一向导同一时段只服务一单）下，**时间冲突边界**与**锁定生效点**必须写死，否则运营弹性差、向导被白锁或供给下降。以下为**必成文**规则，由 **Schedule Engine（档期引擎）** 统一执行。

#### 4.15.1 锁定生效点（写死）

| 时间点 | 是否作为「向导档期锁定」起点 | 说明 |
|--------|------------------------------|------|
| A. confirm-final-plan 成功 | **否** | 若以此为准，旅行者 2 小时后才支付则向导被白锁 2 小时；**禁止**。 |
| B. deposit 成功（链上） | **否（单独不足）** | 若未达 finality，reorg 可能导致 deposit 无效，锁定应延后。 |
| C. 链上 escrow 实例部署成功 | 可与 D 合并定义 | 视合约设计；若 deposit 即创建实例，则与 D 一致。 |
| **D. deposit 确认达到 finality** | **是（采用）** | **锁定从 deposit 成功并达链上 finality 开始**；confirm 后、deposit finality 前向导**不被锁定**，可接其他订单。 |

**结论**：**锁定生效点 = deposit 成功且达链上 finality**。confirm 后至 deposit finality 前，仅占用「意向档期」或软占用（payment_window 内）；超时则自动取消并释放（§4.9）。

#### 4.15.2 payment_window 与超时（防单线程死锁）

见 **§4.9**：confirm 后 **payment_window**（建议 30 分钟）内必须 deposit；**超时自动取消 + 解除向导锁定**。否则旅行者不支付、向导被锁、订单未开始 = 严重运营问题。

#### 4.15.3 防「锁单攻击」（confirm 滥用）

旅行者恶意：反复 confirm 不支付，向导被反复锁定。**必须成文**：

| 措施 | 要求 |
|------|------|
| **confirm 次数/频率限制** | 每订单 confirm 仅一次（已满足）；同一用户**短时内对多订单 confirm 不支付**可设上限（如 24h 内 N 单未支付则限制再 confirm）。 |
| **用户信誉惩罚** | confirm 后超时未支付：扣**旅行者信誉**或记入「未支付次数」；与 03、81 信誉规则一致。 |
| **冷却时间** | 同一旅行者对同一向导、或全局「confirm 未支付」后，**冷却期内**限制再次 confirm 新单（可选）。 |

#### 4.15.4 争议期间是否允许接单（设计选择）

若规则是「合约终态前不能接单」，则旅游已完成但 dispute 进入仲裁（如 7 天）→ 向导被锁 7 天，供给严重下降。**必须明确**：

| 选项 | 含义 | 建议 |
|------|------|------|
| **锁定范围 = 服务期间** | 仅在本单 **start_date～end_date** 内禁止接重叠档期；争议期间（资金未释放）**允许**接**不重叠**档期。 | **采用**：平衡供给与公平。 |
| **锁定范围 = 资金未释放期间** | 直至 release/refund/slash 前向导均不可接单。 | 供给下降大，不推荐。 |

**落点**：与 01 订单状态、03 争议流程一致；**建议**锁定范围定为 **服务期间（start_date～end_date）**。

#### 4.15.5 长期订单与「只禁时间重叠」

15 天欧洲游、30 天包车等长期订单：若「合约存在即全局锁死」则向导 30 天不能接单，不合理。现实向导可**同一天只服务一单**，但可安排**未来不重叠档期**。

| 规则 | 要求 |
|------|------|
| **只禁止时间重叠** | 向导**仅**在**本单 start_date～end_date** 不能接与此时段重叠的订单；**不重叠**的档期可接。 |
| **全局禁止** | 不采用；否则高端向导不会接受长期单。 |

**落点**：接单/发布时由 **Schedule Engine** 检查**档期是否重叠**，而非「是否存在进行中订单」的布尔判断。

#### 4.15.6 档期精度：start_date / end_date（必须）

| 项 | 要求 |
|----|------|
| **必选字段** | 订单/行程**必须**有 **start_date**、**end_date**（至少**日期级**），否则无法判断重叠。 |
| **粒度** | 若需「同一天多单错峰」（如上午 A、下午 B），可扩展为 datetime；MVP 可先日期级。 |

无 start_date/end_date 则档期引擎无法精确执行，系统会非常僵硬。

#### 4.15.7 订单取消后的恢复逻辑

| 场景 | 要求 |
|------|------|
| **旅行者取消 / 合约终止** | 向导档期**是否立即解锁**须成文。建议：**立即解锁**（取消/终止即释放档期）。 |
| **冷却期？** | 若需防止「取消后立刻接同档期」滥用，可设**短冷却**（如 1h）；否则建议无冷却。 |
| **等 dispute 期过？** | 若订单已取消且无未决争议，**不**应要求等 dispute 期；若有进行中 dispute，是否锁定该档期至裁决完成须成文（建议：争议期间该档期仍视为占用直至裁决）。 |

#### 4.15.8 经济激励副作用（单线程模型）

单线程模型下：向导一旦接单，机会成本锁死 → **倾向只接高价单** → 低价订单无人接、市场两极分化。

| 措施 | 要求 |
|------|------|
| **动态排序** | 订单列表/向导列表**动态排序**（如低价单加权曝光、新向导扶持），减轻「只接高价」倾向。 |
| **最低保证或激励** | 可选：**最低保证机制**（如接单率达标奖励）、或低价档位单独激励；与 81 经济模型一致。 |

#### 4.15.9 向导退出攻击

向导接单后被锁，然后**拒绝履约**、等自动 dispute。单线程模型会放大该风险。

| 措施 | 要求 |
|------|------|
| **押金惩罚** | 向导违约（未履约/恶意退出）：**押金惩罚**（slash 或部分扣罚）；与合约、81 一致。 |
| **信誉降级** | **信誉降级**、排序下沉；与 03、81 一致。 |
| **冷却期** | 违约后**冷却期**内限制接单（可选）；防反复接单-退出。 |

#### 4.15.10 极端情况：替代向导 / 订单转让

旅游进行中：向导生病、自然灾害、突发停运 → 向导无法履约。**必须定义**：

| 选项 | 说明 |
|------|------|
| **指定替代向导** | 是否允许**更换为另一向导**继续履约（需双方或平台同意、合约/协议支持）。 |
| **订单转让** | 是否允许**订单转让**（换向导、换旅行者）；与 01/03 状态机、合约一致。 |

单线程模型下替代机制重要，否则不可抗力时订单僵死。

#### 4.15.11 Schedule Engine（档期引擎，必须组件）

档期与锁定规则**必须**由统一组件 **Schedule Engine（档期引擎）** 执行，否则无法精确落地：

| 职责 | 说明 |
|------|------|
| **重叠判断** | 给定 start_date/end_date，判断两订单档期是否重叠；接单/发布时调用。 |
| **锁定生效** | 在 deposit 达 finality 后，将对应 start_date～end_date 标记为「已占用」；取消/终态后释放。 |
| **payment_window 软占用** | confirm 后、deposit 前可做「软占用」（如 30min 内保留档期），超时释放；与 §4.9 一致。 |
| **防重复接单** | 向导接单时校验：该向导在**目标订单的 start_date～end_date** 是否已有**已锁定**订单（deposit finality 已达成）。 |

**落点**：架构须增加 **Schedule Engine**；与 01 订单状态、03 业务规则、04 API（接单/发布/取消接口）衔接。

---

## 5. 价格能力（两条路线 + MVP 折中）

### 5.1 Live Quote（最稳定：聚合器 API）

航班：Amadeus（主）/ Duffel（备）；酒店：Booking Demand（主）/ Expedia Rapid（备）。输出 Quote 对象（source、retrievedAt、ttl、expiresAt）；UI 标注 Live quote + 倒计时 TTL。仅在确认阶段或报价页刷新，避免成本爆炸。**当前**：未实现；属 Phase 2。

### 5.2 Import Quote（MVP 友好：用户导入）

用户粘贴链接或上传截图；系统要求填写结构化字段（MVP 可不做 OCR）；生成 evidence_hash 进入证据包；与 AI 估算做 Δ 对比，可生成新版本预算。**当前**：未实现；Phase 1 可做手填+证据链。

### 5.3 当前定价落点

- **前端**：CustomItineraryModal 与 Landing 侧「估算」均依赖 [44-国家独立定价模块](44-阶段-国家独立定价模块.md)（lib/countries）；按国家、人数、天数、交通/酒店/景区/向导等级计算，**已闭合**。  
- **后端**：itinerary 生成使用 body.budget_min/max 比例拆分，**未**与 lib/countries 或外部 API 对齐；Phase 1 可保持「估算」，Phase 2 引入 pricing_service + Live Quote。

**🟠 二级建议（❸）**：前端 lib/countries 与后端 generate_itinerary_mock 为**双轨制**，同条件可能两处金额不同（市场页价格=前端逻辑，AI 行程页=后端逻辑）。建议将预算算法抽成 **pricing_core**，后端与前端共享逻辑（或先将规则复制到 Rust），保证同一输入同一输出。

**结论**：AI 生成 = 估算与结构；实时价格 = API（Phase 2）；早期落地 = 用户导入证据（Phase 1 可选）。

### 5.4 Price Drift Handling Policy（🟡 必须写清，❻）

Confirm Final Plan 时若拉实时价（Phase 2 Live Quote），**必须**明确以下策略，否则上线必出问题：

| 场景 | 策略选项（须选一或组合并成文） |
|------|--------------------------------|
| **TTL 过期** | 禁止确认并提示「报价已过期，请刷新」；或自动刷新一次后再允许确认；或降级为「估算价」并明确标注。 |
| **价格涨了** | 要求用户重新确认新金额后再生成 snapshot；或允许在阈值内（如 ±5%）自动接受、超出则重新确认；或一律以「确认时价」为准并记录 quote_id/expiresAt。 |
| **价格跌了** | 以确认时价为准；或允许用户选择「用新价」再确认。 |

**要求**：在 Phase 2 上线前产出 **Price Drift Handling Policy** 文档（可放在 80 附录或独立运维文档），产品与风控共同定稿。**49 F 落点**：本节策略选项已成文，满足 49 F.2.1；实现时以本节与 49 F.5 可配置项为准。

### 5.5 汇率锁定时间与极端波动（0.4 🔟、0.6 Ⅵ 9️⃣）

展示币种（如 EUR）与结算币种（如 USDC）不一致时，**必须**明确**汇率锁定时点**：**生成时 / 确认 Final Plan 时 / 上链 deposit 时**（三选一或组合成文）；与 03、08-3 一致，避免争议时歧义。**极端波动**：须定义**极端波动阈值**（如 2h 内 ±5%）及是否**自动冻结下单/确认**；与 03、风控一致。

---

## 6. 自由市场与协商（订单×向导）

市场页（`/market`）：发现订单（getDiscoverOrders，仅 Draft）与向导（getGuides）、对比、邀请/申请、聊天协商。双方在 `/escrow/[id]` 点击「确认最终行程」调用 confirm-final-plan 生成 snapshotHash。资金动作在 Escrow 页完成（银行级 UI，13-1）。**当前**：订单/向导列表、订单详情与 confirm-final-plan/messages/accept 已实现。**🔴 必须修**：CustomItineraryModal 须走后端创建 Draft（§0.3 ❶）。

**排序规则（0.4 1️⃣3️⃣）**：**订单列表**与**向导列表**的排序规则须成文——如订单按创建时间/金额/目的地，向导按信誉/质押/评分等；与 04 API、29 自由市场规范一致，避免后期反复改。

**订单撤回与信誉（0.5 1️⃣3️⃣）**：旅行者频繁生成→撤回→不支付会浪费向导档期；须成文**限制撤回次数**和/或**扣旅行者信誉**，与 03 一致。**市场操纵（0.5 1️⃣4️⃣）**：多账号接单、抬高排序须防范；须成文 **anti-sybil**、**stake-weight 排序**、**信誉加权**等，与 29 一致。

---

## 7. 安全与合规要点

- 不抓未授权平台内容（尤其 UGC）。  
- 外部数据保存来源与时间。  
- 报价带 TTL、免责声明。  
- 关键动作（确认计划、进入 Escrow）走 SignatureModal，字段齐全（chainId、contract、amount、token、snapshotHash、finalityN 等，28）。  
- 日志与证据包：schemaVersion、promptVersion、snapshotHash、quoteHash（**待**在 proof/evidence 中统一落库）。

---

## 8. 分阶段实施（可落地计划）

| 阶段 | 内容 | 与当前实现关系 |
|------|------|----------------|
| **Phase 1（最短闭环/演示级）** | **🔴 必须**：① **POST /api/v1/itineraries/custom**：CustomItineraryModal 提交 → 后端创建 Draft order + 写 itineraries → 返回 order_id → 市场重新拉取；② **Canonical JSON 规则 + Snapshot Payload Schema**：明确 hash 参与/不参与字段，snapshotHash 含完整 budget breakdown、policies、cancellation；ItinerarySpec v1 强校验。itinerary_service 生成 + 预算闭合；自由市场订单发布/向导接单/聊天；Import Quote 证据链可选。 | 当前 snapshotHash、confirm-final-plan、itineraries 表、Preview 与 Escrow 已具备；**待补**：itineraries/custom 接口、Canonical 文档与 Schema、snapshotHash 扩展字段、预算双轨制收敛（pricing_core 建议）。 |
| **Phase 2（商业化关键）** | Live Quote：1 个航班 API + 1 个酒店 API；Quote TTL、缓存（Redis）、expiresAt UI；Confirm Final Plan 时再拉一次实时价。**必须**产出 **Price Drift Handling Policy**（TTL 过期/价格涨跌时的处理策略，§5.4）。 | 需新增 pricing_service、前端 Live Quote 页与 TTL 展示、Price Drift 策略文档。 |
| **Phase 3（质量与规模）** | RAG 知识库（合规数据源：POI/交通/季节性）；多语言模板；风控与异常态完善（reorg/tx replaced/quote expired）。 | 依赖 01/03 异常态与 38 性能观测。 |

---

## 9. 产出与验收标准（Definition of Done）

| 序号 | 验收项 | 当前状态 |
|------|--------|----------|
| 1 | **🔴** CustomItineraryModal 提交走 POST /api/v1/itineraries/custom，创建 Draft、返回 order_id，市场重新拉取 | **待修复**：当前仅前端列表；须后端新增接口 + 前端改调用并刷新。 |
| 2 | **🔴** ItinerarySpec v1 + Canonical JSON 规则 + hash 参与/不参与字段文档，Schema 强校验 | **待修复**：当前 mock 自由格式、无 Canonical 文档、hash 字段不全。 |
| 3 | 预算闭合通过（分项=总价） | **前端** 42 已满足；**后端** 待强校验；**建议** pricing_core 前后端一致（❸）。 |
| 4 | 版本化可追溯（v1→v2→…） | **已实现**：version、snapshot_hash、只读旧版。 |
| 5 | snapshotHash 含完整 budget breakdown、policies、cancellation（❹）并用于 Escrow 绑定 | **部分**：当前已绑定；**待**扩展参与字段。 |
| 6 | Import Quote 可形成证据链（hash + source + timestamp） | **待实现**：Phase 1 可选。 |
| 7 | Live Quote（Phase 2）具备 TTL 与 **Price Drift Handling Policy**（❻） | **待实现**：Phase 2；策略文档须先定稿。 |
| 8 | **confirm-final-plan 带 expected_version、CAS 校验**（0.4 4️⃣） | **P0 Gate**：未实现不得上线；409 时前端提示刷新。 |
| 9 | **Snapshot canonical 含 schemaVersion、协商锚点（last_message_id/last_change_request_id）、platform_fee、可选 quote_id/expiresAt**（0.4 1️⃣2️⃣5️⃣9️⃣） | **待补**：Canonical 文档与实现。 |
| 10 | **Draft 上限 per-user、AI 生成免费额度与速率限制**（0.4 3️⃣1️⃣4️⃣） | **待补**：后端 cap + 归档策略；额度/限流成文。 |
| 11 | **ItinerarySpec 升级：向下兼容、老 snapshot 可 replay**（0.4 2️⃣） | **待补**：升级策略文档。 |
| 12 | **汇率锁定时点、自由市场排序规则、小费协议口径**（0.4 🔟1️⃣3️⃣6️⃣） | **待补**：03/08-3 或独立成文。 |
| 13 | **AI：promptVersion/modelName/temperature 持久化与回放；Reorg 与 snapshot 关系**（0.4 7️⃣8️⃣1️⃣1️⃣） | **待补**：proof 落库；与 01/03 reorg 机制衔接。 |
| 14 | **Canonical 含身份/链/结算**（traveler_id、guide_id、chain_id、settlement_token、contract_version、token_decimals/symbol/address）；**金额整数最小单位**；**字段删除=仅 deprecated、payload=superset**（0.5 1️⃣2️⃣3️⃣4️⃣） | **待补**：**Canonical Payload 完整字段白皮书（最终版）**（0.5 ①）。 |
| 15 | **Payment Window + Timeout 状态机**（0.5 5️⃣）、**资金流顺序图**（平台费/押金/小费）（0.5 7️⃣8️⃣②）、**Replay 测试规范**（0.5 1️⃣5️⃣③）、**争议绑定 snapshot_version**（0.5 6️⃣） | **待补**：四项交付物 ②③④；03 争议状态与 snapshot 绑定。 |
| 16 | **AI 仅为建议/向导二次确认、prompt 冻结 replay**（0.5 9️⃣🔟）；**订单撤回与信誉、anti-sybil/排序**（0.5 1️⃣3️⃣1️⃣4️⃣）；**Token 黑名单/合约升级策略**（0.5 1️⃣1️⃣1️⃣2️⃣） | **待补**：产品口径；03/08-3/29。 |
| 17 | **核心流程与互斥约定**（§0.2.1）：旅行者发布→向导接单→聊天确认行程→**双方确认后**才生成智能合约；确认后至行程结束前**旅行者不得再发布、向导不得再接单**，本单结束后才恢复 | **待补**：01/03 订单状态与业务规则成文；后端接单/发布时校验进行中订单与档期。 |
| 18 | **治理与版本**（0.6 Ⅰ）：**治理仅影响未来订单**、历史订单按确认时规则；**版本并行策略**与向前迁移、dispute 按 contract_version 路由 | **待补**：08/治理文档、14。 |
| 19 | **Emergency Mode 行为矩阵**（§4.12）、**Admin 权限最小化矩阵**（§4.13）、**GDPR 删除策略**（§4.14） | **待补**：四项交付物完成后补；与 01/03/04/08 一致。 |
| 20 | **资金卡死**：强制 timeout、强制 dispute 入口、强制清算（0.6 Ⅱ 4️⃣）；**信誉防操纵**（只计 dispute-free、小费权重、stake-weight）（0.6 Ⅳ 6️⃣） | **待补**：01/03/81。 |
| 21 | **极端汇率波动阈值与自动冻结**（0.6 Ⅵ 9️⃣）、**Chaos Test 方案**（0.6 Ⅹ 1️⃣3️⃣）、**平台履约风险定性**（技术托管 vs 旅行服务商、融资必问）（0.6 Ⅸ 1️⃣2️⃣） | **待补**：03/运维；合规定稿。 |
| 22 | **锁定生效点 = deposit 达 finality**（非 confirm）；**payment_window 超时自动取消 + 解除向导锁定**（§4.9、§4.15） | **待补**：01/03 状态机；Schedule Engine。 |
| 23 | **档期必选 start_date/end_date**；**只禁时间重叠**（不全局锁死）；**锁定范围 = 服务期间**（争议期间可接不重叠档期）；**Schedule Engine** 组件（§4.15） | **待补**：订单/行程 schema、接单 API、§2.2 Schedule Engine。 |
| 24 | **防锁单攻击**（confirm 次数/信誉惩罚/冷却）；**取消后恢复**（立即解锁或成文）；**向导退出攻击**（押金/信誉/冷却）；**替代向导/订单转让**；**经济副作用**（动态排序/最低保证）（§4.15） | **待补**：03/81、产品与风控定稿。 |

---

## 10. 文档索引与变更

- **依据**：01 总库、02 架构、04 后端与 API、05 前端总览、09 技术架构、14 合约-API-ABI 对齐；42 自定义行程弹窗、44 国家定价、25 Landing/Discover/Itinerary UI、28 电影感与 Escrow、13-1 协议级 UI；**170** AI 行程运营治理后台（与本文分工见文首）。  
- **变更记录**：v1.0～v1.5 见前。**v1.6**：§0.5、四项交付物、§4.4～4.11、§9 验收 14～16。**v1.7**：§0.2.1 流程互斥、§0.6 治理与极端风险、§4.12～4.14、§9 验收 17～21。**v1.8 档期与锁定边界、Schedule Engine**：**锁定生效点写死**为 deposit 达 finality（非 confirm）；§0.2.1 重写为概要并指向 §4.15。**§4.9**：payment_window 超时 → 自动取消 + **解除向导锁定**（建议 30min）。新增 **§4.15 档期与锁定规则**：4.15.1 锁定生效点（A/B/C/D 四选一，采用 D）；4.15.2 payment_window；4.15.3 防锁单攻击（confirm 次数/信誉/冷却）；4.15.4 争议期间接单（锁定范围=服务期间 vs 资金未释放，建议服务期间）；4.15.5 长期订单只禁重叠；4.15.6 start_date/end_date 必选；4.15.7 取消后恢复；4.15.8 经济副作用（动态排序/最低保证）；4.15.9 向导退出攻击（押金/信誉/冷却）；4.15.10 替代向导/订单转让；4.15.11 **Schedule Engine（档期引擎）** 必须组件。§2.2 增加 Schedule Engine；§4.1 meta 增加 start_date/end_date；§9 验收 22～24。**v1.9**：文首受众互链 [18](18-TravelTrust-全系统架构图.md) **§七**、[00-总表](00-最终版架构图对应模块清单总表.md) **§二点五**；§0.6 增**术语边界**（协议治理 vs 82/83 经济治理）。**v1.10**：文首 + §10 互链 **[170](170-阶段开发AI行程系统运行管理治理层.md)**；§0.1 路由表增 **`/traveltrust`**（与 **85/04/13-1** 一致）。**v1.11**：§0.5 前 **企业级定位**（协议债台账 vs 主链路径解耦；**07 §二 2.4**、**18** 读图串联）。**v1.12**（2026-03-26）：篇首 **读前摘要**（§0.1/0.3～0.6、§8～§9、170、18/07）。**v1.13**（2026-03-28）：§2.1 **LandingHeroForm** 行补 **productCountries→geoOptions**、**GET /meta**、**04**；与 **84** 治理「十国」勿混读（**07** 读前摘要）。**v1.14**（2026-03-30）：§0.1 **`/traveltrust`** 行与 **85** 暖色壳、**85 §二 2.6**、**Header** **`<nav>`**/**`/discover`→`/market`** 文档对齐（**04/05/13-1/14/00**）。**v1.15**（2026-03-30）：§0 **当前落点** 与 §0.1 **`/**` 行 — 首页文件统写 **`app/(home)/page.tsx`**（**33 / 88 / 86 §6.1**）。
