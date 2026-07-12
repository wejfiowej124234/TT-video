# TravelTrust Web3 审查工作台（Review Workspace）

> **不是拿来读的，是拿来工作的。**  
> 文件名：`WEB3-全系统业务规范-LATEST.md` · **Workspace ID：** `WEB3-REVIEW-WORKSPACE`

### 三角色定位（写死 · 长期不变）

| # | 角色 | 做什么 | 不做什么 |
|---|------|--------|----------|
| **①** | **审查工作台（主角色）** | 与 AI **一章一章** 讨论（Escrow · Treasury · Fee · Net Profit…） | 替代 Registry / 英文真源 |
| **②** | **决策记录（Decision Record）** | 每章终态：**保留 / 修改 / 删除 / 待确认** — Owner 决策沉淀 | 记录未确认的 AI 草案 |
| **③** | **同步入口（Sync Entry）** | 一章确认后触发：Review → Owner → Registry → English → Closed | 项目管理 · 任务排期 |

### 轻量边界（禁止膨胀）

**已有且足够：** Review Board · **Business Review** · Review Log · Sync 清单 · [附录 B 九步 + 收口问法](#附录-b--章节审查固定输出九步)

**禁止写入本工作台：** Sprint · Epic · Story · Priority · Owner List · Risk Matrix · Jira 风格字段 → 那些属于 **项目管理系统**，不是业务规范。

```yaml
doc_pair:
  pairing_version: v1.8
  workspace: WEB3-REVIEW-WORKSPACE
  roles: [review_workspace, decision_record, sync_entry]
  engineering_en: WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md
  business_spec_zh: WEB3-全系统业务规范-LATEST.md
  current_review_chapter: 9
  review_output_template: appendix_b_nine_steps_plus_closeout
  review_log_policy: owner_confirmed_only
  one_chapter_at_a_time: true
  primary_completion_metric: business_review_approved
```

**当前审查章：** **§9 USDC 全球金库**（§8 已 Approved · 下一章待开）

**配对工程文档：** [WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md](./WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md)

---

## 真源分层（长期不变）

| 层 | 定位 | 是否最终真源 | 典型路径 |
|----|------|:------------:|----------|
| **Registry** | **机器事实（Data）** | ✅ | `registry/*.v1.yaml` |
| **英文工程文档** | **工程认证（What）** | ✅ | `WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md` · `TT-WEB3-REALITY-CERTIFICATION.md` |
| **中文业务规范（本文）** | **业务理解 · 设计决策 · AI 审查（Why）** | ❌ | 本文 |

**维护纪律：**

- **中文** = 讨论与审查工作面 · **Registry** = 确认后的事实 · **英文** = 认证对拍。
- **禁止** 在本文硬编码会变数字（链 Registry）。
- Owner 确认后 → Registry → 英文 → Gate；**禁止** 只改中文不落地。

---

## 维护流程（写死）· ③ 同步入口

```
讨论（工作台 · 聊天输出）
        │
        ▼
AI 形成建议（附录 B 九步 · 仅在对话中呈现）
        │
        ▼
Owner 确认（保留 / 修改 / 删除 / 待确认）
        │
        ▼
写入 Review Log（仅已确认结论）→ 更新本章 Decision
        │
        ▼
Registry（Data）
        │
        ▼
English（What · Certification）
        │
        ▼
Business Review → Approved → Closed
```

### Review Log 纪律（写死）

| 允许 | 禁止 |
|------|------|
| Owner **确认后** AI/Owner **追加** RL 条目 | AI 把**未确认建议**直接写入 RL |
| RL 记录 **最终决定** + 简要依据 | RL 当聊天草稿 / 讨论过程 dump |
| 讨论在 **对话** 中进行 | 用 RL 代替 Cursor 聊天历史 |

**Decision Record 四态（每章终态 · ②）：** `保留` · `修改` · `删除` · `待确认`

### 单次章节审查 · AI 输出（附录 B 九步）

AI 在 **对话中** 按 [附录 B](#附录-b--章节审查固定输出九步) 逐步输出；**不得** 未经 Owner 确认就改 RL / Registry / 英文。

### 与三层真源的关系

```
中文（讨论 · 审查 · Why）  ──Owner确认──►  Registry（Data）
                              │
                              └──────────►  英文（What · Certification）
```

**AI 默认行为：** 当前章 **Business Review = Reviewing** 时按 **附录 B** 在**对话**输出 → **等 Owner 确认** → 第 10 步收口问 → 再写入 RL / 更新 Decision → Registry → 英文。

### 审查工作台纪律（写死）

| 规则 | 说明 |
|------|------|
| **一次只审一章** | 领域章（§6–§23）同时仅一章 **Business Review = Reviewing** |
| **讨论在聊天** | 工作台 RL 只存 **已确认** 决策 |
| **不翻聊天记录** | 已确认历史 → Review Log |
| **三轮确认** | AI 建议 → Owner Decision → Engineering Sync |
| **收口问法** | **禁止**问「文档写完了吗？」→ **必须**问 [附录 B 第 10 步](#附录-b--章节审查固定输出九步) |
| **完成定义** | **Business Review = Approved** 即本章业务审完（**与正文篇幅无关**） |

**Business Review 含义（主指标 · Review Board 第一列）：**

| 状态 | 含义 |
|------|------|
| **Not Started** | 业务审查未开始 |
| **Reviewing** | 业务审查进行中（**当前工作章**） |
| **Approved** | Owner 确认：**本章业务逻辑已敢上线**（正文三页亦可） |

**Business Risk（可选 · 排期用）：** `High` · `Medium` · `Low` — **优先审 High**，不阻塞 Approved。

**Eng Sync（工程同步轨 · Approved 之后）：** Owner ✓ → Registry ✓ → EN ✓ → **Closed**

**阶段 A 例外：** §1–§4 基础层可并行 Reviewing；**领域章**仍遵守「一次一章」。

**效率对比（写死口径）：**

| 旧路径 | 新路径 |
|--------|--------|
| 英文 → 人理解 → 再讨论 | **中文 → 直接讨论 → 确认 → AI 同步英文** |

---

## 修改影响矩阵

| 修改内容 | 必须同步 | 本文角色 |
|----------|----------|----------|
| Tokenomics / Genesis V2 四块 / 一级市场轮次 | Registry · 英文 · 本文（原则/决策/FAQ） | 记录 **Why** |
| FeeRouter 分账语义 | Registry · 英文 · fund-flow SSOT · API | 强调与 Net Profit 正交 |
| Country Net Profit 关账 | Registry · 英文 · 治理 payload · Indexer · API · FE | 强调与 Fee 独立 |
| Vesting 商业参数 | Registry · 英文 · 合约部署（L3） | Owner_INPUT 决策入口 |
| Treasury USDC P1–P4 / P4 cap | Registry · 英文 · Safe 配置 | 支出分类策略 |
| Treasury TTG DAO 桶 | Registry · 英文 · 治理流程 | 与 USDC 分离原则 |
| Escrow V1/V2 策略 | Registry · 英文 · FE 写链路径 · mainnet policy | V2 主网路径原则 |
| Seat / Stake 集中度 | Registry · 英文 · GOV-03 | 席位治理叙事 |
| Vacancy sweep 规则 | Registry · 英文 · Indexer | 空缺处理原则 |
| Governance 延迟/权限 | Registry · 英文 · multisig-registry | Safe 与 Timelock 原则 |
| 主网地址登记 | Registry · 英文 · 字节码验证 | 仅状态跟踪 |
| UI 文案 / 对外说明 | 本文 · 前端 i18n | 可不改 Registry |
| L2 SC PASS 证据 | 英文 L2 Runbook · Ledger · Evidence JSON | 可附决策背景 |
| **术语/FAQ/设计决策** | **本文**（追加 · 不删历史） | 沟通基线 |

---

## 章节审查状态总览（Review Board）

**一眼看清：** 业务审到哪 · **今天审哪章** · **先审哪类 High Risk**。

> **完成定义：** `Business Review = Approved` = 本章业务审完。**正文长短不是完成标准。**

| 章 | 标题 | Business Review | Business Risk | Owner | Registry | EN |
|----|------|-----------------|---------------|:-----:|:--------:|:--:|
| 0 | 读前 | Approved | Low | ✓ | — | — |
| 1 | 术语表 | Reviewing | Low | ☐ | — | — |
| 2 | 设计原则 | Reviewing | Medium | ☐ | — | — |
| 3 | FAQ | Reviewing | Low | ☐ | — | — |
| 4 | 设计演进 | Reviewing | Low | ☐ | — | — |
| 5 | 总体架构 | Not Started | Medium | ☐ | ☐ | ☐ |
| **6** | **Genesis V2 四块** | **Approved** | **High** | ✓ | ✓ | ☐ |
| **7** | **Vesting** | **Approved** | **High** | ✓ | ✓ | ✓ |
| **8** | **一级市场** | **Approved** | **High** | ✓ | ✓ | ✓ |
| 9 | USDC Treasury | Not Started | High | ☐ | ☐ | ☐ |
| 10 | TTG DAO | Not Started | High | ☐ | ☐ | ☐ |
| 11 | Safe | Not Started | High | ☐ | ☐ | ☐ |
| 12 | Escrow | Not Started | High | ☐ | ☐ | ☐ |
| 13 | Fee | Not Started | High | ☐ | ☐ | ☐ |
| 14 | Net Profit | Not Started | High | ☐ | ☐ | ☐ |
| 15 | Seat | Not Started | Medium | ☐ | ☐ | ☐ |
| 16 | Governor | Not Started | High | ☐ | ☐ | ☐ |
| 17 | Claim | Not Started | Medium | ☐ | ☐ | ☐ |
| 18 | Vacancy | Not Started | Medium | ☐ | ☐ | ☐ |
| 19 | Indexer/FE | Not Started | High | ☐ | ☐ | ☐ |
| 20 | Upgrade | Not Started | High | ☐ | ☐ | ☐ |
| 21 | Monitor | Not Started | Medium | ☐ | ☐ | ☐ |
| 22 | 资金流 | Not Started | High | ☐ | ☐ | ☐ |
| 23 | GAP/Owner | Not Started | Medium | ☐ | ☐ | ☐ |

**图例：** Owner ✓ = 本章 Decision 已确认 · Registry/EN ✓ = 工程已同步 → **Closed**

---

## 目录

| 章 | 标题 | Anchor | Business Review | Risk |
|----|------|--------|-----------------|------|
| 0 | 读前说明 | — | Approved | Low |
| 1 | 术语表 | — | Reviewing | Low |
| 2 | 核心设计原则 | `RISK-*` | Reviewing | Medium |
| 3 | FAQ | — | Reviewing | Low |
| 4 | 设计演进 | — | Reviewing | Low |
| 5 | Web3 总体架构 | §1 | Not Started | Medium |
| **6** | **TTG Genesis V2 四块** | `BD-TTG-SUPPLY` | **Approved** | **High** |
| **7** | **Vesting** | `BD-VESTING` | **Approved** | **High** |
| **8** | **一级市场** | `BD-PM-*` | **Approved** | **High** |
| 9 | USDC Treasury | `BD-TREASURY-USDC` | Not Started | High |
| 10 | TTG DAO | `BD-TREASURY-TTG` | Not Started | High |
| 11 | Safe | `BD-TREASURY-SAFE` | Not Started | High |
| 12 | Escrow | `BD-ESCROW` | Not Started | High |
| 13 | FeeRouter | `BD-FEE` | Not Started | High |
| 14 | Net Profit | `BD-NP-4555` | Not Started | High |
| 15 | Seat/Stake | `BD-SEAT` | Not Started | Medium |
| 16 | Governor | `BD-GOV` | Not Started | High |
| 17 | Claim | `BD-ALLOC` | Not Started | Medium |
| 18 | Vacancy | `BD-VAC` | Not Started | Medium |
| 19 | Indexer/FE | `BD-IDX` · `BD-FE` | Not Started | High |
| 20 | Upgrade | `BD-UPGRADE` | Not Started | High |
| 21 | Monitor | `BD-MON` | Not Started | Medium |
| 22 | 资金流 | `FF-*` | Not Started | High |
| 23 | GAP/Owner | `GAP-*` | Not Started | Medium |
| 附录 A | 锚点对照 | — | — | — |
| 附录 B | **九步 + 收口问法** | — | — | — |
| 附录 C | 章头 + Review Log 模板 | — | — | — |

### 推荐审查节奏（写死 · 依赖顺序 · 一次一章）

**为什么这个顺序：** Escrow 依赖 Treasury · Treasury 依赖 TTG Tokenomics — **先 Tokenomics，再金库，再托管**。

```
§6  TTG Genesis V2 四块  ← Approved（2026-07-12 · DD-2026-07-012）
§7  Vesting            ← Approved（2026-07-12 · team only standard_vesting）
§8  一级市场           ← 下一章
§9  USDC Treasury
§10 TTG DAO 金库
§11 Safe               （Treasury 权限面）
§12 Escrow
§13 Fee
§14 Net Profit
§16 Governor           （治理栈）
§15 Seat
§17 Claim
§18 Vacancy
§19 Indexer/FE
§20 Upgrade · §21 Monitor · §22 资金流 · §23 GAP  （横切 · 按需穿插）
```

**每章闭环：** 附录 B 九步（对话）→ Owner 确认 → **第 10 步收口问** → Business Review → **Approved** → Registry → EN → Closed

**基础层（§1–§4）** 可与领域章 **并行**；**领域章**严格 **一章 Approved** 再开下一章。

**收口问法（写死 · 每章结束必问）：**

> **如果今天部署到主网，这一章我还有没有不放心的地方？**

**目标不是写一本 Web3 手册，而是：把 TravelTrust 做到你自己敢上线。**

**开场白：**

> 「当前工作台 **§6 TTG Genesis V2 四块**。请按 **附录 B 九步** 在对话中输出审查；**待我确认后再写入 Review Log**。」

---

## 第 0 章 · 读前说明

### 本文档是什么

| 它是什么 | 它不是什么 |
|----------|------------|
| **① 审查工作台** — 锚定一章与 AI 讨论 | 项目管理工具（无 Sprint/Epic/Jira 字段） |
| **② 决策记录** — 保留/修改/删除/待确认 | 未确认 AI 建议的存放处 |
| **③ 同步入口** — 确认后推 Registry + 英文 | 第二份数字或认证真源 |

**价值目标：** 每一章经 **AI 建议 → Owner 确认 → Engineering 同步**；RL 只记 **已确认** 结论。

**本文读者：** Owner · 产品 · 业务讨论参与者 · AI Agent（审查模式）。

**诚实边界：**

- ① 本地 L1 工程认证 **≠** ② L2 Reality Certification **≠** ③ Production GO。
- 英文审计 `WARN` / `PASS_WITH_OPEN_L2_L3_GAPS` 表示：**代码与机读闸在 L1 齐**，链上与 Owner 项在 L2/L3 继续。
- 本文 **不得** 单独作为「Web3 已完成」宣称依据。

**数字从哪里读：**

| 主题 | Registry / SSOT 入口 |
|------|----------------------|
| TTG Genesis V2 四块与一级市场 | [registry/ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml) · [TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md) |
| 资产面分离 USDC/TTG | [registry/asset-denomination-treasury-separation.v1.yaml](../../../registry/asset-denomination-treasury-separation.v1.yaml) |
| 资金流 R1–R4 | [fund-flow-ssot.v1.md](./fund-flow-ssot.v1.md) |
| 多签 Safe 角色 | [registry/multisig-registry.v1.yaml](../../../registry/multisig-registry.v1.yaml) |
| Escrow 主网策略 | [registry/escrow-bilateral-mainnet-policy.v1.yaml](../../../registry/escrow-bilateral-mainnet-policy.v1.yaml) |
| 主网地址槽位 | mainnet-address-registry（OWNER_INPUT · 以 Registry 为准） |

**全仓引用纪律：** 讨论 Web3 业务时，**优先引用 [第 1 章 术语表](#第-1-章--术语表glossary)** 与 **[第 2 章 原则](#第-2-章--核心设计原则)**，避免同一英文词多种中文译法。

---

## 第 1 章 · 术语表（Glossary）

**用途：** 统一中英文与 **本项目特有含义**。Web3、运营、财务、开发文档 **均引用本章**。半年后的讨论、新人、AI **不各自发明译名**。

> **注意：** 定义解释 **角色与边界**，**不** 写死比例/额度（数字见 Registry）。  
> **阅读顺序：** 先看 **不等于** 列建立边界 · 再看 **本项目定义** · 最后看 **常见误读**。

| 中文 | 英文 | 本项目定义 | 不等于（Not Equal To） | 常见误读 |
|------|------|------------|------------------------|----------|
| **国家池** | Country Pool | 以 **司法辖区** 为单位的区域收入与 Steward 治理单元；承载国家侧 Fee/净利润路径 | Treasury · 单个 Vault 合约 · Escrow 账户 | 把「国家池」当成某一个链上合约地址 |
| **国家货架** | Country Shelf | **已取消（Genesis V2）** — 原 `country_pool_shelf` 创世桶不再存在；Region Steward 以 **自持 TTG** 质押达门槛（Same Protocol Rights） | Vault · USDC 资金账户 · Treasury · 空投/生态/奖励池 | 以为仍有 Country Shelf 创世配给可挪用 |
| **金库（总称）** | Treasury | 平台 **资金与资产管理体系**（USDC 运营金库、TTG DAO 桶、Safe 角色等） | Escrow · 单笔订单托管 · Ledger | 把 Treasury 当成用户订金账户 |
| **USDC 全球金库** | USDC Global Treasury | **USDC 现金** 运营与储备；链上主合约语义为 P4Cap；支出分 P1–P4 类 | TTG DAO 桶 · Escrow · 一级市场 TTG 桶 | 与 DAO TTG 桶混读余额 |
| **DAO TTG 金库** | DAO TTG Treasury | **TTG 治理拨款桶**（`treasury_dao` 30% · Genesis V2）；仅 TTG 转移，经提案→投票→Timelock；**≠ 投票权来源** · **禁 Mint 补仓** | USDC 全球金库 · P4Cap · Escrow | 用 USDC 支出语义理解 DAO 桶 |
| **保险库** | Vault | 链上 **资产持有容器**（RegionVault、StewardPathVault、ReserveVault 等） | Ledger · Shelf（已取消创世语义）· Treasury（总称） | 把 Vault 当成只记账的 Ledger |
| **账本** | Ledger | **只记录** 状态、epoch、分配与事件；**不** 替代用户钱包或金库持有 | Vault · Treasury · Escrow | 以为 Ledger 合约里「存着钱」 |
| **托管** | Escrow | **订单级** USDC 托管；与 Treasury、一级市场 **隔离** | Treasury · 平台运营金库 · Governor 直接拨款 | 把订金算进平台可自由支配资金 |
| **结算** | Settlement | 一笔订单或资金流程的 **最终结清**（含 Escrow 放款/退款、Fee 分账等完成态） | 一级市场 purchase · 仅「发起提案」 | 把「下单」当成「已结算」 |
| **质押** | Stake | 为 **席位/身份** 等目的 **锁定自持 TTG**；有 slash 路径 | 一级市场买币 · 持币即分红 · Vesting 释放 · Country Shelf | 与 Seat 募资表自动换算 |
| **锁仓释放** | Vesting | **team** **时间释放**（Genesis V2 **唯一** standard_vesting 创世轨）；cliff+duration；**不可撤销** · Community Incentive = **Program 非 vesting** | 一级市场 · DAO 治理拨款 · Release（Escrow） · advisors（已取消创世轨） | 以为 vesting 可随时撤销 / 仍有 advisors 创世 vesting |
| **分配** | Allocation | 系统按规则 **记入分配额度**（应得份额的认定）· 创世四块见 Genesis V2 | Distribution（实际发放）· Claim（领取动作）· 当前钱包余额 | 以为 Allocation 等于已到账 |
| **发放** | Distribution | **实际发放资产** 到可领取路径或受益方（链上/链下执行层） | Allocation（仅额度认定）· Snapshot（时点状态） | 与 Allocation 混用 |
| **释放** | Release | Vesting 到期段或 Escrow 条件下 **解锁/放款** 的动作 | Allocation · 治理 Proposal · Sweep | 把 Release 当成治理投票 |
| **领取** | Claim | 受益人 **主动** 从 Claim 合约取走 **已分配** 份额 | Distribution（系统发放过程）· Timelock 主动群发 | 未 Allocation 即可 Claim |
| **清扫** | Sweep | Vacancy 等路径 **未分配** 资金，经 **治理+Timelock** 转至指定目标 | 运营随手转账 · Escrow 退款 | 不经治理直接转走 |
| **周期** | Epoch | **结算或治理关账周期**（如净利润季度关账）；标记一段业务时间窗口 | 区块高度 · 自然日 · 单笔订单 | 把 block number 当 epoch |
| **快照** | Snapshot | **某一时刻** 的状态定格（投票权、领取基数、收益计算参考等）；**不** 随之后余额变化 | Current Balance（当前余额）· 实时 Indexer 行 | 用转账后余额回看历史投票 |
| **提案** | Proposal | 治理 **提案**；表达意图与参数，**不代表** 已执行 | Execute · Queue · 已通过投票的终态 | 提案通过即以为已生效 |
| **排队** | Queue | 提案 **已通过** 并进入 Timelock **等待执行** 的阶段 | Execute · Proposal（未通过）· Vote（进行中） | 排队即以为已链上生效 |
| **执行** | Execute | Timelock 延迟结束后 **正式链上执行** 治理动作 | Proposal · Queue · 链下讨论纪要 | 未过 Timelock 即宣称已执行 |
| **对账** | Reconcile | 链上、数据库、前端/API **三方数据一致性校验**与漂移修复；Indexer tick 同类 | 业务真源本身 · UI 本地缓存 · 单次 API 读数 | 以为 API 返回即链上终态 |
| **多签保险箱** | Safe | Gnosis Safe；timelock_admin / treasury / emergency **角色分离** | Timelock 合约 · EOA 热钱包 · Escrow | Safe 与 Timelock 混为一谈 |
| **时间锁** | Timelock | 治理通过后 **延迟执行**（工程默认 48h，以 Registry 为准） | Safe · 日常运营钱包 · Queue（仅等待） | 以为 Timelock 可绕过治理直接花金库 |
| **一级市场** | Primary Market | USDC 按轮次购买 TTG；USDC ingress 进 P4Cap；TTG 出 `public_sale` 桶（50% · Registry 初值 800K/1.2M/3M） | Seat 募资表 · Escrow · DAO 拨款 | 与 Seat 募资混为一谈 |
| **平台手续费** | Platform Fee / FeeRouter | 订单结算产生的 **平台费** 及国家/全球分账（工程标记 D-4555-A；比例见 Registry） | Net Profit（净利润分账）· Escrow 本金 · Treasury 运营杂项 | 与净利润 45/55 **混读**（见 **P-03**） |
| **国家池净利润** | Country Net Profit | 周期（Epoch）关账后的 **净利润** 分配（工程标记 D-4555-B；比例见 Registry） | Platform Fee · FeeRouter 分账 · Escrow | 与平台手续费 **混读** |
| **空缺路径** | Vacancy | 无 Steward 或规则未覆盖时的 **暂存与治理处理** 路径 | 正常国家池运营余额 · Escrow | 当普通收入池直接花掉 |
| **索引器** | Indexer | 链上事件 → DB → API 的 **同步层**（**P-10**：非业务状态权威） | Registry · 链上终态 · UI 缓存 | 以为 DB 可覆盖链上真相 |

**速查：高频「不等于」对照（引用本章，不另造表）**

| 术语 | 不等于 |
|------|--------|
| Treasury | Escrow |
| Vault | Ledger |
| Shelf | Vault |
| Pool（国家池） | Treasury |
| Allocation | Distribution |
| Snapshot | Current Balance |
| Proposal | Execute |
| Queue | Execute |
| Claim | Distribution |
| Fee（平台手续费） | Net Profit（净利润） |

**Owner 核对项：** ☐ 上表是否覆盖运营/财务/开发最常混淆的词 · ☐ 「不等于」列是否准确

---

## 第 2 章 · 核心设计原则

**Anchor：** 英文 §2.3 `RISK-*`

以下原则 **全系统适用**。讨论时 **直接引用编号**（如「违反 P-03」）。与 [术语表](#第-1-章--术语表glossary) **配合使用**。

| 编号 | 原则 | 含义 | 违反时的典型风险 |
|------|------|------|------------------|
| **P-01** | **TTG 与 USDC 永远分离** | 不同资产面 · 不同合约职责 | `RISK-MIX-TTG-USDC` |
| **P-02** | **Escrow 永远独立** | 订单 USDC **不与** 一级市场/金库运营混池 | `RISK-MIX-PM-ESC` |
| **P-03** | **Fee 与 Net Profit 永远独立** | 平台费分账 **≠** 净利润分账（即使比例数字相同） | `RISK-MIX-FEE-NP` |
| **P-04** | **Treasury 运营与 DAO TTG 桶独立** | USDC 全球金库 **≠** DAO TTG 拨款桶 | 用错资产面 |
| **P-05** | **Owner 参数必须 Registry 化** | 商业参数 **只** 在 Registry 登记变更 | `RISK-VEST-OWNER` |
| **P-06** | **业务修改必须保持 Anchor 一致** | 变更映射 BD/FF/GAP + [修改影响矩阵](#修改影响矩阵) | 双真源漂移 |
| **P-07** | **Governor 不得直接花 Escrow** | 托管只走 Escrow 状态机 | `RISK-GOV-ESC` |
| **P-08** | **升级与 admin 必须 Safe + Timelock** | 禁止 EOA 长期 admin | `RISK-UPGRADE-EOA` |
| **P-09** | **单一职责原则（Single Responsibility）** | 每个合约、资金池、账本 **唯一职责**；不因便利混合用途 | 混池 · 越权 · 审计不可追溯 |
| **P-10** | **状态唯一原则（Single State Authority）** | 同一业务状态 **只有一个权威来源**；多层只读/同步，不互相覆盖 | 链上/DB/UI 三套「真相」打架 |

**P-09 落地示例（引用术语表，不重复定义）：**

| 组件 | 唯一职责 |
|------|----------|
| **Escrow** | 只负责 **订单托管** |
| **Treasury** | 只负责 **平台资金体系**（非用户订金） |
| **Ledger** | 只负责 **记录** |
| **Vault** | 只负责 **持有资产** |

**P-10 权威层级（写死）：**

```
链上状态（终态权威）
    ↑ 配置
Registry（配置真源 · 数字/地址/比例）
    ↑ 同步
Indexer（同步层 · 事件投影）
    ↑ 读取
API（读取层 · 无第二业务真源）
    ↑ 展示
UI（展示层 · 不缓存业务真相）
```

**修改原则（总则）：** 讨论 → Owner 确认 → Registry → 英文 → Gate。L1 冻结期不新增 Web3 功能合约。

**Owner 核对项：** ☐ P-09/P-10 是否覆盖你关心的数据一致性问题

---

## 第 3 章 · 常见问题（FAQ）

**用途：** 新人、AI、未来的自己 **反复问** 的问题，在此 **一次答清**。答案指向 **原则/术语/章节**，不写死数字。

### Q1：为什么 Fee 和 Net Profit 都是 45/55？

**短答：** 数字可能相同，**业务含义完全不同** — 两套独立规则（**P-03**）。见术语表 **Fee ≠ Net Profit**。

| | 平台手续费（FeeRouter） | 国家池净利润（Net Profit） |
|--|-------------------------|----------------------------|
| **触发** | 单笔订单结算 | 周期（Epoch）关账 |
| **分的是什么** | 平台费分母 | 国家池 **净利润** |
| **工程标记** | D-4555-A | D-4555-B |
| **详见** | [第 13 章](#第-13-章--feerouter-平台手续费) | [第 14 章](#第-14-章--国家池净利润) |

### Q2：为什么 Treasury「有两个」？

**短答：** 不是两个随便的账户，而是 **两种资产面**（**P-01** · **P-04**）：

1. **USDC 全球金库** — 运营现金、一级市场 USDC 入口、净利润全球腿等。
2. **DAO TTG 金库桶** — 治理代币拨款，只动 TTG。

详见 [第 9 章](#第-9-章--usdc-全球金库-p1p4) · [第 10 章](#第-10-章--ttg-dao-金库)。

### Q3：为什么 DAO Treasury 和 USDC Treasury 必须分开？

**短答：** TTG 与 USDC **不可混读、不可混花**（**P-01**）。DAO 桶走 **提案→投票→Timelock 发 TTG**；USDC 金库走 **P1–P4 支出策略与 P4 cap**。

### Q4：为什么 Escrow 不属于 Treasury？

**短答：** Escrow 是 **用户订单托管**（**P-02** · **P-07** · **P-09**），资金 **不属于** 平台可自由支配的运营金库。术语：**Treasury ≠ Escrow**。

详见 [第 12 章](#第-12-章--escrow-订单托管)。

### Q5：为什么 Safe 有三套？

**短答：** **职责分离**（**P-08** · **P-09**）— 降低单点滥用风险。具体签名人以 Registry 为准。

详见 [第 11 章](#第-11-章--safe-多签与权限)。

### Q6：为什么 Timelock 要 48 小时？

**短答：** 给社区 **审查窗口**；**Proposal ≠ Execute** · **Queue ≠ Execute**（见术语表）。工程默认 48h（以 Registry 为准）；调整须走治理变更 + Registry + 英文认证。

详见 [第 16 章](#第-16-章--治理栈-governortimelock)。

### Q7：有没有「持 TTG 自动分红」？

**短答：** **没有** 全体持币人自动现金分红叙事（DD-2026-06-004）。Global 池路由语义 **≠** 「持币即分红」。

### Q8：Shelf、Pool、Vault 到底有什么区别？

**短答：** **Shelf** = TTG 配给语义 · **Pool** = 国家业务单元 · **Vault** = 链上持有容器 · **Shelf ≠ Vault**（见术语表速查表）。

### Q9：Seat 和一级市场募资是一回事吗？

**短答：** **不是**。Seat/Stake = 自持 TTG 质押与席位；一级市场 = `public_sale` 桶 USDC→TTG（50%）。募资表与 stake **无自动换算**（GOV-04 单钱包 cap 与 Seat min stake 结构性张力见 GOV-04 审计）。

### Q10：为什么 Registry 才保存数字，而中文规范不保存？

**短答：** 这是 **防漂移** 设计（**P-05** · **P-10**）：

| 若数字写进中文规范 | 后果 |
|--------------------|------|
| Tokenomics 改一次 | 中文、英文、Registry 三处可能对不齐 |
| 机读 Gate 以 Registry 为准 | 中文里的「1000 万」「15%」**无法** 被脚本验真 |

因此：**数字只在 Registry**；中文只解释 **Why** 并 **链接 Registry**；英文做 **Certification 对拍**。详见 [真源分层](#真源分层) 与 FAQ Q11–Q12。

### Q11：为什么英文工程文档不能直接改业务规则？

**短答：** 英文 L1 审计的定位是 **工程认证真源**（What + BD/FF/GAP + Gate），且当前处于 **L1 工程冻结 / Certification Governance Freeze**：

- 英文改动应来自 **已确认的 Registry/业务变更**，而非「讨论稿先行」。
- 机读闸、L2 SC、证据链 **锚定** 英文锚点；无 Owner 确认的英文改写会造成 **认证与业务脱节**。
- 讨论入口是 **中文规范**；确认后按 [维护流程](#维护流程写死) 同步英文。

**禁止：** 在英文审计里「顺手改业务叙事」而不走 Registry + Owner。

### Q12：为什么修改业务规则必须先经过 Owner 确认？

**短答：** Web3 规则 = **资金与权限**；错误规则的成本是 **链上不可撤回或高代价修复**。

| 无 Owner 确认 | 风险 |
|---------------|------|
| 仅改中文 | 团队以为已定，Registry/链上未变 → **假完成** |
| 仅改代码/英文 | 商业意图未对齐 → **Prod 事故** |
| AI 自动同步 | 须 **Owner 书面确认** 作为闸门（**P-05** · **P-06**） |

确认后：**追加** [第 4 章](#第-4-章--设计演进历史design-decisions) 决策行 → Registry → 英文 → Gate。单人维护者场景下 Owner = 维护者本人，但仍须 **显式确认**（可记在 §23 决策纪要区）。

**Owner 核对项：** ☐ Q10–Q12 是否说清你采用的文档治理方式 · ☐ 是否继续 **追加** FAQ，不删旧条

---

## 第 4 章 · 设计演进历史（Design Decisions）

**用途：** 记录 **为什么从 A 改成 B**。**只追加、不修改、不删除** 历史行。重大变更须 Owner 确认后新增一行。  
**影响范围（Impact）** 列供变更分析时 **一眼看清** 须同步的系统（可与 [修改影响矩阵](#修改影响矩阵) 交叉使用）。

| 日期 | 决策 ID | 决策摘要 | 原因（Why） | 影响范围（Impact） | 关联 Anchor / SSOT |
|------|---------|----------|-------------|-------------------|-------------------|
| 2026-06 | DD-2026-06-001 | **Fee 与 Net Profit 分离** | 避免平台费与季度净利润混池、混读；报表与治理 payload 可审计 | Registry · fund-flow SSOT · FeeRouter · CountryPoolNetProfitLedger · API · Indexer · 英文 · 本文 | **P-03** · `BD-FEE` · `BD-NP-4555` |
| 2026-06 | DD-2026-06-002 | **USDC Treasury 拆 P1–P4** | 运营现金分类支出；约束 P4 部署比例（GOV-01 语义） | Registry · asset-denomination · GovernanceTreasuryP4Cap · Safe · 运营政策 · 英文 · 本文 | `BD-TREASURY-USDC` |
| 2026-06 | DD-2026-06-003 | **TTG DAO 桶与 USDC 金库分离** | 不同资产面、不同授权路径 | Registry · ttg-vesting-registry · 治理流程 · 英文 · 本文 | **P-01** · `BD-TREASURY-TTG` |
| 2026-06 | DD-2026-06-004 | **取消「持 TTG 自动现金分红」叙事** | 合规与可持续运营；避免 Holder 误解与客诉 | Tokenomics Freeze 文档 · 前端治理 Hub 文案 · 对外口径 · 本文 FAQ | [TTG-TOKENOMICS-FREEZE-V1.md](./TTG-TOKENOMICS-FREEZE-V1.md) |
| 2026-07 | DD-2026-07-001 | **Escrow 主网路径强制 V2（双确认释放）** | V1 无双边门闸；主网禁止新 V1 订单 | 合约 EscrowV2/FactoryV2 · Registry mainnet policy · 前端写链 · Indexer 事件 · API Layer-A · 英文 | `BD-ESCROW` · escrow-bilateral-mainnet-policy |
| 2026-07 | DD-2026-07-002 | **一级市场 USDC 必须进 P4Cap** | 与 Escrow 隔离；可审计 ingress | Registry · TtgPrimaryMarketV1 · asset-denomination · Gate · 英文 | **P-02** · `BD-PM-USDC` |
| 2026-07 | DD-2026-07-003 | **Certification 治理冻结（L1 工程 HEAD）** | Framework/执行工件冻结；仅 Reality Evidence 增长 | TT-CERTIFICATION-FRAMEWORK · AGENTS.md · L2 Runbook · commit 纪律 | `3016731a` |
| 2026-07 | DD-2026-07-004 | **双语文档分工：英文 What / Registry Data / 中文 Why** | 降低 Owner 讨论成本；防多真源歧义 | 本文 · doc_pair · 协作流程（无链上合约） | 本文 doc_pair v1.1 |
| 2026-07 | DD-2026-07-005 | **`country_pool_shelf` 仅服务 Region Steward Seat 生命周期** | 防空投/生态/奖励挪用货架桶；新国家/Seat 扩容仍走 Seat 路径 | Registry `exclusive_use_policy` · Seat · Vacancy · 本文 §6 · 英文 | `BD-TTG-SUPPLY` · `BD-SEAT` |
| 2026-07 | DD-2026-07-006 | **生态桶释放须映射四类用途** | 禁止「什么都叫 ecosystem」 | Registry `allowed_release_categories` · 治理提案模板 · 本文 §6 | `BD-TTG-SUPPLY` · ecosystem |
| 2026-07 | DD-2026-07-007 | **DAO Treasury 不承担平台运营资金** | 防「Treasury = 公司账户」误读 | Registry `platform_operational_funds: false` · asset-denomination · 本文 §6/§10 | **P-04** · `BD-TREASURY-TTG` |
| 2026-07 | DD-2026-07-008 | **`public_sale` 售罄剩余：预留桶内 + 治理门控处置** | 避免轮次结束后 ad-hoc 争论；禁止自动 burn/Mint | Registry `remaining_unsold_*` · 本文 §8 · RL-8-001 | `BD-PM-3R` |
| 2026-07 | DD-2026-07-013 | **Community Incentive Policy V1 框架 ACTIVE** | 5% Allocation 有 Program 规则；禁止 ad-hoc 空投 | [COMMUNITY-INCENTIVE-POLICY-V1](./COMMUNITY-INCENTIVE-POLICY-V1.md) · Registry | `BD-CIP` |
| 2026-07 | DD-2026-07-014 | **Primary Market ① 默认无 lockup（0s）** | Genesis V2 未写 lockup；变更须治理 | Registry rounds `optional_lockup_seconds: 0` · 本文 §8 | `BD-PM-3R` |
| 2026-07 | DD-2026-07-015 | **§8 一级市场 Approved（Keep）** | Public Sale 50% · 800K/1.2M/3M · USDC→P4Cap · GOV-04 | Registry · FE · 英文 BD-PM · RL-8-001 | `BD-PM-3R` · `BD-PM-USDC` |
| 2026-07 | DD-2026-07-009 | **六桶 = Genesis Allocation · 改比例须治理+Timelock+Owner Release** | 防运营压力随意改桶 | Registry `genesis_allocation_policy` · Gate · 本文 §6 | `BD-TTG-SUPPLY` |
| 2026-07 | DD-2026-07-010 | **`bucket_sum_bps` 必须恒等于 10000（Gate）** | 防 99.99%/101% 分配漂移 | `validate-ttg-vesting-registry.py` · supply_ssot · protocol-ssot 对拍 | `BD-TTG-SUPPLY` |
| 2026-07 | DD-2026-07-011 | **§7 Vesting 架构保留 + 治理规则冻结** | Start 默认 MAINNET_VESTING_DEPLOY_EXECUTE · 组织 beneficiary · 释放≠治理权 · revocable=false | Registry `vesting_governance_policy` · 英文 BD-VESTING · 本文 §7 | `BD-VESTING` · `GAP-VESTING-006` |
| 2026-07 | DD-2026-07-012 | **Genesis V2：四块 15/5/30/50 取代六桶** | 取消顾问桶与 Country Shelf；Public Sale 50%；Community Incentive Allocation；DAO 30% 非投票来源；Same Protocol Rights | [TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md) · Registry v4 · Policy · 对齐审计 | `BD-TTG-SUPPLY` · `BD-CIP` |

**待 Owner 补充（占位 · 确认后 **追加行**，勿改上表）：**

- Seat 募资与链上 Stake **边界** 的最终对外口径
- 是否调整 Timelock 延迟（若与工程默认不同）
- 任何「第四轮一级市场」类结构性变更

**Owner 核对项：** ☐ 历史决策 Impact 列是否准确 · ☐ 是否有遗漏的重大决策需追加

---

## 第 5 章 · Web3 总体架构

**Anchor：** 英文 §1 业务域总览（`BD-*` 全表）

TravelTrust Web3 = **Tokenomics + 金库 + 托管 + 手续费 + 国家池净利润 + 治理 + 索引/前端**。

```
TTG 发行与 Genesis V2 四块
    ├── 一级市场 Public Sale（USDC → TTG · 50%）
    ├── Vesting（Team 15% · 唯一 standard_vesting）
    ├── Community Incentive（5% · Program）
    └── DAO TTG 金库（30% · 治理拨款 · ≠ 投票权来源）

USDC 侧
    ├── P4Cap 全球金库（P1–P4）
    ├── Escrow 订单托管（隔离）
    ├── FeeRouter 平台手续费
    └── Country Net Profit 净利润关账

治理与安全
    ├── Governor + Timelock
    ├── Safe 多签（admin / treasury / emergency）
    └── 升级与 pause

链下消费
    └── Indexer → DB → API → 前端写链/读账
```

**Owner 核对项：** ☐ Web3 边界是否完整

---

## 第 6 章 · TTG Genesis V2 四块设计

| 字段 | 值 |
|------|-----|
| **Anchor** | `BD-TTG-SUPPLY` |
| **Registry** | [ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml) |
| **Business Review** | **Approved**（**现行分配 = [Genesis V2](./TTG-TOKENOMICS-GENESIS-V2.md) / DD-2026-07-012** · 下列六桶正文为历史 RL） |
| **Business Risk** | **High** |
| **Owner Decision** | **保留（Keep）→ 后由 DD-2026-07-012 修正为四块模型** |

### 现行分配（operative · 先读这里）

**真源：** [TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md)

| 用途 | 键 | bps | 数量 |
|------|-----|-----|------|
| Team | `team` | 1500 | 1,500,000 |
| Community Incentive Allocation | `community_incentive` | 500 | 500,000 |
| DAO Treasury | `treasury_dao` | 3000 | 3,000,000 |
| Public Sale | `public_sale` | 5000 | 5,000,000 |
| **合计** | — | **10000** | **10,000,000** |

**公募 Registry 初值：** 800,000 / 1,200,000 / 3,000,000 = 5,000,000。  
**已取消：** advisors · country_pool_shelf · 独立 ecosystem 创世桶。  
**原则：** One TTG, Same Protocol Rights · DAO Treasury ≠ 投票权来源 · 禁 Mint 补仓 · Steward 自持 TTG 质押（无 Country Shelf）。

> **历史快照：** 下列「六桶」正文与 RL-6-001 为 **2026-07-12 前**叙事，**不得**当作现行比例（见 RL-6-002）。

### Sync 清单

| 步骤 | 状态 |
|------|------|
| Owner · ✓ Confirmed | ✓ |
| Registry · ✓ Updated | ✓ |
| Engineering EN · ✓ Synced | ☐ |
| Business Review → Approved | ✓ |

### Review Log

#### RL-6-001 · 2026-07-12 · Owner 确认

| 项 | 内容 |
|----|------|
| **Decision** | **保留（Keep）** |
| **Reason** | Genesis Six-Bucket Model is coherent — 不推翻架构 |
| **收口** | 六桶覆盖 100% TTG；`bucket_sum_bps` Gate 已加（=10000） |
| **Owner** | ✓ Confirmed · 2026-07-12 |

#### RL-6-002 · 2026-07-12 · Genesis V2 取代六桶分配

| 项 | 内容 |
|----|------|
| **Decision** | **修改（Genesis 修正）** — 分配真源切换至 [TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md) |
| **摘要** | 四块 15/5/30/50 · 取消顾问与 Country Shelf · Same Protocol Rights |
| **影响** | Registry v4 · protocol-ssot · FE rounds · 对齐审计 FAIL_WITH_PARTIAL_PASS |
| **Owner** | ✓ Confirmed · 2026-07-12 · DD-2026-07-012 |

---

### 为什么这么设计

10M TTG **创世一次性**划入六桶，每桶有 **唯一 track_type** 与 **唯一出口**（**P-09**）。六桶是 Tokenomics 根：Treasury、一级市场、Vesting、Seat、DAO 都从这里取语义，**不是**六个可混用的现金账户。

**Genesis 纪律（DD-2026-07-009）：** 六桶属于 **Genesis Allocation**。除非 **DAO Governance → Timelock Execute → Owner Release Policy** 三者齐备，**不得**因运营压力调整比例。

**覆盖率 Gate（DD-2026-07-010）：** Registry `bucket_sum_bps` **必须恒等于 10000**；六桶 `amount_tokens` 之和 **必须等于** `total_supply` — `validate-ttg-vesting-registry.py` 硬闸。

---

### Owner 五条商业确认（已写入 Registry）

#### ★★★★★ `country_pool_shelf`（DD-2026-07-005）

**写死：** `country_pool_shelf` **只服务 Region Steward Seat 生命周期**。

```
country_pool_shelf → Seat 激活/扩容 → RegionStewardStakePool 质押锁定
                  → Steward 退出/KPI → 解锁至 Steward 钱包
                  → Vacancy → 治理清扫路径
```

**新国家 · 新区域 · Seat 扩容** — 仍走 **Seat 路径**，**不是**另开用途。

**禁止挪用为：** 空投 · 生态 grant · 营销奖励 · 通用激励池 · 替代 Treasury 运营。

#### ★★★★★ `ecosystem`（DD-2026-07-006）

Governance Planned Release **须映射四类之一**（Registry `allowed_release_categories`）：

| 类别 | 英文键 |
|------|--------|
| 开发者 Grant | `developer_grant` |
| 生态激励 | `ecosystem_incentive` |
| 战略合作 | `strategic_partnership` |
| 营销活动 | `marketing_campaign` |

**禁止** 无分类的「泛 ecosystem」拨款。

#### ★★★★★ `treasury_dao`（DD-2026-07-007）

**DAO Treasury 不承担平台运营资金。** 它只是 **治理 TTG 拨款桶**（`platform_operational_funds: false`）。

平台 USDC 运营 → **USDC 全球金库**（§9 · `GovernanceTreasuryP4Cap`）— **P-01** · **P-04**。

#### ★★★★☆ `public_global`（DD-2026-07-008 · Owner Pending）

三轮发完后 **剩余 TTG** 策略 = **`OWNER_INPUT`**（主网 ACTIVE 前须定）。

候选（Registry `remaining_policy_options`）：Burn · 保留在桶内 · 治理开新轮 · 治理转入 `treasury_dao`。

#### ★★★★★ 六桶修改权限（DD-2026-07-009）

见上文 Genesis 纪律；改桶 → 治理提案 + Timelock + Owner Release Policy + 追加 §4 决策行。

---

### 每一桶承担什么职责

| 桶（Registry 键名） | 职责（业务含义） | 典型出口 |
|---------------------|------------------|----------|
| `country_pool_shelf` | **仅** Region Steward Seat 生命周期 TTG 配给 | Seat/Stake · Vacancy |
| `public_global` | 一级市场 TTG 来源（2M · 三轮） | Primary Market |
| `ecosystem` | 治理计划释放（四类用途） | Timelock 拨款 |
| `team` | 团队 vesting | 标准 vesting 轨道 |
| `advisors` | 顾问 vesting | 标准 vesting 轨道 |
| `treasury_dao` | DAO 治理 TTG（**非** 运营现金） | 提案→投票→Timelock |

### 为什么不能混用 · 修改原则

引用 **P-01** · **P-04** · **P-05** · **P-09** · [术语表 Shelf](#第-1-章--术语表glossary)。改桶 → Registry → 英文 → Gate → **追加** 第 4 章决策行。

---

### 附录 B 审查摘要（RL-6-001 依据）

| 步 | 结论 |
|----|------|
| 1 功能定位 | 六桶 = 10M TTG 创世分配根 |
| 2 业务边界 | 每桶唯一职责；禁止平行 investor 池 |
| 3 资金流 | 见上表；USDC 不进 TTG 桶 |
| 4 权限 | Timelock/治理/Primary Market/Seat 分轨 |
| 5 行业对比 | 非单池多签 · 非持币分红 · 非 ICO 进团队钱包 |
| 6 风险 | 桶混用 · 参数未填 · 比例漂移 — Gate 已覆盖 sum |
| 7 修改建议 | **保留** |
| 8 影响 | Registry 已更新；英文 EN 待同步 |
| 9 Owner | **Keep** |
| 10 收口 | Approved；三项 **Owner Pending** 不阻塞 Keep |

---

## 第 7 章 · 团队/顾问 Vesting

| 字段 | 值 |
|------|-----|
| **Anchor** | `BD-VESTING` · `GAP-VESTING-006` |
| **Registry** | [ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml) → `vesting_tracks` · `vesting_governance_policy` |
| **Business Review** | **Approved** |
| **Business Risk** | **High** |
| **Owner Decision** | **保留（Keep）** |

### Sync 清单

| 步骤 | 状态 |
|------|------|
| Owner · ✓ Confirmed | ✓ |
| Registry · ✓ Updated | ✓ |
| Engineering EN · ✓ Synced | ✓ |
| Business Review → Approved | ✓ |

### Review Log

#### RL-7-001 · 2026-07-12 · Owner 确认

| 项 | 内容 |
|----|------|
| **Decision** | **保留（Keep）** — 架构不变 |
| **治理规则** | Start 默认 `MAINNET_VESTING_DEPLOY_EXECUTE` · 组织 beneficiary · 释放≠治理权 · `revocable=false` 保持 |
| **商业参数** | `cliff_seconds` / `duration_seconds` / beneficiary 地址 **OWNER_INPUT** — 主网部署前最终冻结 |
| **收口** | 架构可 Approved；上线前完成参数冻结 + beneficiary 登记 + Start execute 确认 |
| **Owner** | ✓ Confirmed · 2026-07-12 |

---

### 功能定位（架构 · Genesis V2）

| 轨道 | 桶 | FROZEN | 模型 |
|------|-----|--------|------|
| **team** | `team` | 1,500,000 TTG (15%) | `standard_vesting`（**唯一**标准 vesting 创世轨） |

**不属于 §7 standard_vesting：**

| 轨道 | 说明 |
|------|------|
| `community_incentive` | **Program**（Community Incentive Allocation → Program）· **不是** cliff/duration vesting |
| `public_sale` | 一级市场（§8） |
| `treasury_dao` | DAO Timelock 拨款路径（§10） |

**已取消创世轨：** `advisors` standard_vesting · `country_pool_shelf` · 独立 `ecosystem` 创世桶。

`controller` / `custody` = **Timelock** · **`revocable: false`**（保持，不建议修改）。

---

### 业务治理规则（Owner 已确认 · DD-2026-07-011 · 经 DD-2026-07-012 收窄）

#### 1. Vesting Start Event

| 级别 | Event | 说明 |
|------|-------|------|
| **默认（写死推荐）** | **`MAINNET_VESTING_DEPLOY_EXECUTE`** | 主网 **team** vesting 合约 Timelock **Execute** 完成时刻 |
| 备用（仅历史/备查） | `TGE_ANNOUNCEMENT_UTC` · `GENESIS_MINT_TIMESTAMP` | **不作为默认**；偏离须治理 + Registry 记录 |

② 测试网 execute **≠** ③ 主网 Start。

#### 2. Beneficiary 原则

> **组织治理优先，不依赖个人身份。**

- team → **组织 Safe / 多签托管**（推荐 · 单受益钱包）
- 变更 beneficiary → 治理提案 + Timelock + Registry + §4 DD
- **禁止** 指向 PM 池 · 虚构 advisors 创世 vesting · Country Shelf（已取消）

#### 3. Vesting 与治理权边界

> **Vesting 仅决定 TTG 释放时间，不决定治理权来源。**

| Vesting 管 | 另章定义 |
|------------|----------|
| cliff 后何时释放/领取 | 投票权计算 → **[§16 Governor](#第-16-章--治理栈-governortimelock)** |
| beneficiary 接收已释放 TTG | Seat 权限 → **§15**（自持 TTG 质押） |

#### 4. Team 参数策略（Genesis V2）

- **仅 team** 走 standard_vesting 商业参数表
- **禁止**：重开 advisors 创世 vesting · 将 community_incentive 写成 cliff vesting · 改用已取消 ecosystem 创世桶模型

---

### 主网前仍须 OWNER_INPUT（不阻塞本章 Approved）

| 字段 | team | 冻结时点 |
|------|------|----------|
| `cliff_seconds` | OWNER_INPUT | 主网部署前 |
| `duration_seconds` | OWNER_INPUT | 主网部署前 |
| `beneficiary` | OWNER_INPUT | 主网 ACTIVE 前登记 |
| `start_timestamp` | 以 Execute 为准确认 | 主网 Execute 后 |

关联：`GAP-VESTING-006` · §23 Owner Pending #1（架构已批，**数值待填**）。**金额 1.5M FROZEN** — 不在 OWNER_INPUT 范围。

---

### 附录 B 审查摘要

| 步 | 结论 |
|----|------|
| 7 | **保留** |
| 10 收口 | **Approved** — 上线前补商业参数与 beneficiary 登记即可 |

---

## 第 8 章 · 一级市场（Primary Market · 三轮）

| 字段 | 值 |
|------|-----|
| **Anchor** | `BD-PM-3R` · `BD-PM-USDC` · `GAP-PM-005` |
| **Registry** | [ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml) → `primary_market` · [asset-denomination-treasury-separation.v1.yaml](../../../registry/asset-denomination-treasury-separation.v1.yaml) |
| **Genesis SSOT** | [TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md) §5 |
| **Business Review** | **Approved** |
| **Business Risk** | **High** |
| **Owner Decision** | **保留（Keep）** |

### Sync 清单

| 步骤 | 状态 |
|------|------|
| Owner · ✓ Confirmed | ✓ |
| Registry · ✓ Updated | ✓ |
| Engineering EN · ✓ Synced | ✓ |
| Business Review → Approved | ✓ |

### Review Log

#### RL-8-001 · 2026-07-13 · Owner 确认 {#rl-8-001}

| 项 | 内容 |
|----|------|
| **Decision** | **保留（Keep）** |
| **Public Sale** | 50%（5M）· Registry 初值 **800K + 1.2M + 3M** · 合计可变但须 = 5M |
| **Round 角色** | R1 Early Community（可无治理开门）· R2/R3 Governance Open |
| **USDC** | Buyer → **GovernanceTreasuryP4Cap**（**P-02** · 与 Escrow 隔离） |
| **GOV-04** | 单钱包 cap 25,000 TTG · min 100 USDC |
| **Lockup** | ① 默认 **0s**（无 PM lockup）；变更须治理 + Registry |
| **售罄剩余** | **默认留 `public_sale` 桶** · 处置仅经治理在 {未来轮次 / 转 DAO / burn} 中选择 |
| **收口** | 架构 Approved；**③** 主网部署 + KYC/AML + 链上 ACTIVE 另闸（GAP-PM-005） |
| **Owner** | ✓ Confirmed · 2026-07-13 |

---

### 第一步 · 功能定位

**Primary Market** = 用户以 **USDC** 按轮次从 **`public_sale` 创世桶（50%）** 兑换 **TTG** 的协议模块（`TtgPrimaryMarketV1`）。  
Round 1 主要目标：**建立早期社区**（Genesis V2 允许表述融资性质，不写「不是融资」）。

### 第二步 · 业务边界

| 负责 | 不负责 |
|------|--------|
| USDC→TTG 按轮 cap 销售 | Seat 质押门槛（§15 · 自持 TTG） |
| USDC ingress → P4Cap | Escrow 订单 USDC |
| GOV-04 单钱包认购上限 | 自动把 PM 购币换算成 Seat stake |
| 轮次 governance 开门（R2/R3） | Community Incentive Program 发放（Policy 另文档） |
| 售罄剩余治理门控处置 | Team vesting 释放 |

### 第三步 · 资金流

```text
Buyer USDC ──TtgPrimaryMarketV1.purchase──► GovernanceTreasuryP4Cap
public_sale bucket TTG ────────────────────► Buyer wallet
```

- **FF-PM-USDC** · **FF-PM-TTG**（英文 §2.2）  
- 未售出 TTG：**留 public_sale 桶** → 仅治理处置（DD-2026-07-008）

### 第四步 · 权限模型

| 动作 | 谁 | 门闸 |
|------|-----|------|
| Round 1 开启 | Timelock / 发布计划 | 无 governance_open_required |
| Round 2/3 开启 | Governor → Timelock | `governance_open_required: true` |
| 修改轮次额度（合计=5M） | 治理 + Registry bump | GOV-02 + 48h |
| 售罄剩余处置 | 治理 + Timelock | `remaining_unsold_allowed_dispositions` |
| 超 cap 购买 | 合约 revert | GOV-04 |

### 第五步 · 行业对比

| 模式 | TravelTrust |
|------|-------------|
| 一次卖完 | **三轮** · 社区建立节奏 |
| 国库混池 | USDC **独立** P4Cap · Escrow 隔离 |
| 货架发 Seat TTG | **无** · Same Protocol Rights · 自持 TTG stake |

### 第六步 · 风险分析

| 风险 | 缓解 |
|------|------|
| PM USDC 与 Escrow 混池 | **P-02** · asset-denomination Gate |
| GOV-04 cap < Seat min stake | **结构性** · 多源 TTG · 见 GOV-04 审计 |
| 轮次结束后 ad-hoc 处置 | **RL-8-001** 预留 + 治理门控 |
| 主网未部署冒充完成 | **GAP-PM-005** · ③ 另闸 |

### 第七步 · 是否需要修改

**保留（Keep）** — Genesis V2 Public Sale 架构与 Registry 一致；无结构性修改。

### 第八步 · 影响分析

| 面 | 状态 |
|----|------|
| Registry | ✓ `primary_market` · `remaining_unsold_*` · lockup 0 |
| Frontend | ✓ `traveltrustTtgPublicRounds.ts` · locales |
| Contract | `TtgPrimaryMarketV1` 已有 · 主网地址 ③ |
| English | ✓ `WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST` BD-PM 行 |

### 第九步 · Owner Decision

**保留（Keep）** · 见 RL-8-001。

### 附录 B 审查摘要

| 步 | 结论 |
|----|------|
| 7 | **保留** |
| 10 收口 | **Approved** — ① 政策无不放心的结构性项；**③** 主网/KYC/链上 ACTIVE 仍须 GAP-PM-005 |

---

## 第 9 章 · USDC 全球金库 P1–P4

**Anchor:** `BD-TREASURY-USDC` · `GAP-TREASURY-OPS-003`  
（待核对）

---

## 第 10 章 · TTG DAO 金库

**Anchor:** `BD-TREASURY-TTG`  
（待核对 — **P-01** · **P-04** · 见 FAQ Q2/Q3）

---

## 第 11 章 · Safe 多签与权限

**Anchor:** `BD-TREASURY-SAFE`  
（待核对 — 见 FAQ Q5）

---

## 第 12 章 · Escrow 订单托管

| 字段 | 值 |
|------|-----|
| **Anchor** | `BD-ESCROW` · `GAP-ESCROW-V2-002` |
| **Registry** | [escrow-bilateral-mainnet-policy.v1.yaml](../../../registry/escrow-bilateral-mainnet-policy.v1.yaml) |
| **Business Review** | Not Started |
| **Business Risk** | **High** |
| **Owner Decision** | `待确认` |

### Sync 清单（③ 同步入口 · 本章闭环）

| 步骤 | 状态 |
|------|------|
| Owner · ✓ Confirmed | ☐ |
| Registry · ✓ Updated | ☐ |
| Engineering EN · ✓ Synced | ☐ |
| Business Review → Approved | ☐ |
| Registry · EN → Closed | ☐ |

### Review Log（只追加 · 仅 Owner 确认后写入）

> **纪律：** 讨论与 AI 建议在 **聊天** 中进行；**禁止** 将未确认草案写入 RL。确认后追加 `RL-12-NNN`。

_（尚无已确认记录。Owner 确认附录 B 九步结论后，由 Owner 指令追加首条 RL。）_

---

### 审查正文（Owner 确认后填写 · 结构同附录 B 九步）

#### 第一步：功能定位

（待 Owner 确认后写入）

#### 第二步：业务边界

（待 Owner 确认后写入）

#### 第三步：资金流

（待 Owner 确认后写入）

#### 第四步：权限模型

（待 Owner 确认后写入）

#### 第五步：行业对比

（待 Owner 确认后写入）

#### 第六步：风险分析

（待 Owner 确认后写入）

#### 第七步：是否需要修改

建议四态：`保留` · `修改` · `删除` · `待确认` — （待 Owner 确认后写入）

#### 第八步：影响分析

（待 Owner 确认后写入 · Registry / API / Frontend / Contract / Documentation）

#### 第九步：Owner Decision

（待 Owner 确认后写入）

---

## 第 13 章 · FeeRouter 平台手续费

**Anchor:** `BD-FEE` · `FF-FEE-*`  
（待核对 — **P-03** · 见 FAQ Q1）

---

## 第 14 章 · 国家池净利润

**Anchor:** `BD-NP-4555` · `GAP-IDX-NP-004`  
（待核对 — **P-03** · 见 FAQ Q1）

---

## 第 15 章 · 席位质押 Seat/Stake

**Anchor:** `BD-SEAT`  
（待核对 — 见 FAQ Q9）

---

## 第 16 章 · 治理栈 Governor/Timelock

**Anchor:** `BD-GOV`  
（待核对 — 见 FAQ Q6）

---

## 第 17 章 · 分配与 Claim

**Anchor:** `BD-ALLOC`  
（待核对）

---

## 第 18 章 · 空缺账本 Vacancy

**Anchor:** `BD-VAC`  
（待核对）

---

## 第 19 章 · Indexer → API → 前端

**Anchor:** `BD-IDX` · `BD-FE`  
（待核对）

---

## 第 20 章 · 升级与紧急暂停

**Anchor:** `BD-UPGRADE`  
（待核对 — **P-08**）

---

## 第 21 章 · 监控与生产指标

**Anchor:** `BD-MON`  
（待核对 — L3 为主）

---

## 第 22 章 · 资金流与权限（业务口径）

**Anchor:** 英文 §2.1 · §2.2 `FF-*`  
（待核对 — 中文叙述「谁能在链上动什么」）

---

## 第 23 章 · 缺口与 Owner 决策清单

**Anchor:** 英文 §4 `GAP-*` · §6 · §8

| 缺口 ID | 业务含义（简述） | 决策状态 |
|---------|------------------|----------|
| `GAP-MAINNET-001` | 主网地址登记 | ☐ 待 Owner |
| `GAP-ESCROW-V2-002` | Escrow V2 主网与 FE 默认路径 | ☐ 待 Owner |
| `GAP-TREASURY-OPS-003` | 金库运营支出分类 | ☐ 待 Owner |
| `GAP-IDX-NP-004` | 净利润 L2 真链认证 | L1 已闭 · L2 待执行 |
| `GAP-PM-005` | 一级市场主网 ACTIVE | ☐ 待 Owner |
| `GAP-VESTING-006` | Vesting 商业参数与部署 | ☐ 待 Owner |
| `GAP-MATRIX-007` | 治理全覆盖矩阵 | 非阻塞 · L2 继续 |

**Owner Pending（商业参数 · 不阻塞 Genesis V2 分配冻结）：**

| # | 项 | 关联章 | 状态 |
|---|-----|--------|------|
| 1 | **Team Vesting Parameters**（cliff/duration/beneficiary 数值） | §7 | 架构 **Approved** · 数值 **L3 主网前**（GAP-VESTING-006） |
| 2 | **Community Incentive Program Policy** | §6 CIP · Policy | **ACTIVE 框架 Approved** · campaign 数值 **③** |
| 3 | **Remaining Public Sale Policy** | §8 · DD-2026-07-008 | ✅ **FROZEN**（RL-8-001） |

**Owner 决策纪要区：**（确认后：日期 + 结论 + Registry/第 4 章决策 ID）

| 日期 | 章 | 结论 | 决策 ID |
|------|-----|------|---------|
| 2026-07-12 | §6 六桶（历史） | **Keep** | RL-6-001 · DD-2026-07-005～010 |
| 2026-07-12 | §6 → Genesis V2 四块 | **修改** | RL-6-002 · DD-2026-07-012 |
| 2026-07-12 | §7 Vesting | **Keep**（V2 收窄为 team only） | RL-7-001 · DD-2026-07-011 |
| 2026-07-13 | §8 一级市场 | **Keep** | RL-8-001 · DD-2026-07-008/014/015 |
| 2026-07-13 | Genesis V2 Owner Pending #2 CIP | **Policy ACTIVE** | DD-2026-07-013 |
| 2026-07-13 | Genesis V2 Owner Pending #3 售罄策略 | **FROZEN** | RL-8-001 |

---

## 附录 A · 锚点对照表

| Anchor | 中文章节 | 英文位置 |
|--------|----------|----------|
| `BD-TTG-SUPPLY` | §6 | §1.1 |
| `BD-VESTING` | §7 | §1.1 |
| `BD-PM-3R` / `BD-PM-USDC` | §8 | §1.1 |
| `BD-TREASURY-USDC` | §9 | §1.1 |
| `BD-TREASURY-TTG` | §10 | §1.1 |
| `BD-TREASURY-SAFE` | §11 | §1.1 |
| `BD-ESCROW` | §12 | §1.1 |
| `BD-FEE` | §13 | §1.1 |
| `BD-NP-4555` | §14 | §1.1 |
| `BD-SEAT` | §15 | §1.1 |
| `BD-GOV` | §16 | §1.1 |
| `BD-ALLOC` | §17 | §1.1 |
| `BD-VAC` | §18 | §1.1 |
| `BD-IDX` / `BD-FE` | §19 | §1.1 |
| `BD-UPGRADE` | §20 | §1.1 |
| `BD-MON` | §21 | §1.1 |
| `FF-*` | §22 | §2.2 |
| `RISK-*` | §2 | §2.3 |
| `GAP-*` | §23 | §4 |

---

## 附录 B · 章节审查固定输出（九步 + 收口）

**用途：** AI 在 **对话中** 按此输出；**每一章格式一致**。Owner 确认后，结论写入本章正文 + Review Log（②）→ 触发同步（③）。

| 步 | 标题 | AI 输出什么 |
|----|------|-------------|
| **1** | **功能定位** | 本章模块是什么？（链 [§1 术语表](#第-1-章--术语表glossary)） |
| **2** | **业务边界** | 负责什么？不负责什么？（**P-09** · **不等于** 列） |
| **3** | **资金流** | 钱怎么进/出？何时锁？何时释放？（链 `FF-*`） |
| **4** | **权限模型** | 谁能：创建 · 存款 · 放款 · 退款 · 仲裁… |
| **5** | **行业对比** | Airbnb · Web3 Escrow · Marketplace · SaaS 等 |
| **6** | **风险分析** | 资金 · 权限 · 状态机 · 重复设计 · 安全 |
| **7** | **是否需要修改** | 建议四态之一：**保留 / 修改 / 删除 / 待确认** |
| **8** | **影响分析** | 若修改：Registry · API · Frontend · Contract · Documentation |
| **9** | **Owner Decision** | 等 Owner 明示；确认前 **不写 RL** |
| **10** | **收口问（写死）** | 问 Owner：**如果今天部署到主网，这一章我还有没有不放心的地方？** — 有则列项 · 无则 **Business Review → Approved** |

**禁止用「文档写完了吗？」作为收口问法。**

**Owner 确认后的落地顺序：**

1. 更新本章九步正文（篇幅不限 · **Approved 优先于篇幅**）
2. **追加** Review Log（`RL-N-NNN` · 仅已确认结论）
3. 更新 **Owner Decision** + [Review Board](#章节审查状态总览review-board) **Business Review**
4. 若需改真源 → Registry → 英文 → Gate
5. 若新决策 → [§4](#第-4-章--设计演进历史design-decisions) 追加 DD 行（含 Impact）
6. 可选 → [§1](#第-1-章--术语表glossary) / [§3 FAQ](#第-3-章--常见问题faq) 追加  

**AI 禁止：** 未经 Owner 确认，将步骤 1–8 的草案写入 Review Log 或 Registry 或英文文档。

---

## 附录 C · 章头 + Review Log 模板

**每一章（§1–§23）文首粘贴本块。** Review Log **只追加 · 仅 Owner 确认后写入**。

```markdown
| **Business Review** | Not Started / Reviewing / Approved |
| **Business Risk** | High / Medium / Low（可选） |
| **Owner Decision** | 待确认 / 保留 / 修改 / 删除 |

### Review Log（只追加 · 仅已确认决策）

#### RL-N-001 · YYYY-MM-DD · Owner 确认后追加

| 项 | 内容 |
|----|------|
| **Decision** | 保留 / 修改 / 删除 |
| **摘要** | （已确认结论一句话） |
| **影响** | Registry / EN / API / … |
| **Owner** | ✓ Confirmed · 姓名/日期 |
```

**禁止：** 将 AI 对话中的未确认「发现/建议」直接粘贴进 RL。

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-07-12 | 初版骨架：两真源+一规范 · 原则 · 修改影响矩阵 |
| v0.2 | 2026-07-12 | +Why 使命陈述 · 术语表 · FAQ · 设计演进历史 · 章节重排与推荐填写顺序 |
| v0.3 | 2026-07-12 | §1 +不等于列与新术语 · §2 P-09/P-10 · §3 Q10–Q12 · §4 Impact 列 · 基础层打磨纪律 |
| v0.4 | 2026-07-12 | 升格 AI Review Manual · 审查工作流 · 附录 B 十一问 · §12 Escrow 试点模板 |
| v0.5 | 2026-07-12 | Review Workspace · Review Board · Review Log · 一次只审一章 |
| v0.6 | 2026-07-12 | 三角色定位 · 轻量边界 · 附录 B 改 **九步** · RL 仅 Owner 确认后写入 · Decision 四态 |
| v0.7 | 2026-07-12 | Review Board 改 **Business Review** 主指标 + **Business Risk** · 审查顺序 Tokenomics→Treasury→Escrow… · 附录 B **第 10 步收口问** · 当前章 → **§6 六桶** · 工作台冻结进入业务审查 |
| v0.8 | 2026-07-12 | **§6 Approved（Keep）** · RL-6-001 · DD-2026-07-005～010 · Registry 六桶政策 + `bucket_sum` Gate |
| v1.0 | 2026-07-13 | **§8 Approved（Keep）** · RL-8-001 · DD-2026-07-008/013/014/015 · CIP Policy ACTIVE · Genesis V2 Owner Pending 政策层收口 |
