# TT-9627 · 交付顺序清单：先主脊 → 再全站 → 再生产 GO

**Version:** 0.1.27  
**Status:** Runbook — **「先跑哪条、再跑哪条、最后才算全项目收口」** 的 **唯一顺序表**；与 **[TT-9625](TT-9625-golden-path-system-spine.md)**（**主脊**）、**[TT-9626](TT-9626-zero-to-production-go-single-path.md)**（**到 GO**）**串读**。**不**替代 **96-20 / 93 / go-live / 96-15** 正文。

**仓库路径：** `docs/runbook/TT-9627-delivery-order-spine-then-full-site.md`

---

## 0. 怎么用本清单

- **自上而下**勾选；**未完成上一段** 前，**不**宣称下一段已闭。  
- **阶次**：**① 本地 → ② 测试网/预发 → ③ 生产**（与 **CONTRIBUTING** 同源）；**③** 仅在 **段 6** 及 **go-live** 中展开。  
- **主脊**定义见 **TT-9625 §2**；**全站**定义见 **TT-9625 §2.1** + **96-20**。
- **段 1～6** = 产品交付主链；**§0.1** = 链下/发版并联；**§0.2** = **企业级深度多维**（**96-15**）— **与段 4～6 同周对拍**，未对外承诺 **Tier C** 时 **§3 可 N/A（须一句）**（见 **96-15 §0**）。
- **完成即标记**：每一项 **第一次通过** 就要在 **本清单 ☐→☑**、**96-20 行**、**`report.json`/manifest、证据 README** 留下 **日期 + 环境（①/②/③）+ commit + 路径**；**无复跑门槛** 时 **不**重复全链手点 — 细则见 **§0.c**。**主线 / 支线** 拆跑与「社区等扩展」**独立升级** 闸门见 **[TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md)**（与 **§0.c** 增量裁剪 **叠加**）。
- **机读闸脚本一行索引**（拆线时快速选 **`bash scripts/gates/…`**）：**[TT-9628 · §0.0.2a](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-tt9627-gates-index)**；**`ci-local`** 编排仍见 **[scripts/README](../../scripts/README.md)**、**[TT-LOCAL §2](TT-LOCAL-CI-DELIVERY-GATE-001.md)**。

### 0.a 独立维护、验证顺序与「生产向」真值（与 solo / CONTRIBUTING 叠读）

- **独立开发 / PR**：单人主线以 **[solo-dev-rhythm](../solo-dev-rhythm.md)** 为准 — **直连 `main` 可不建合并请求**；**删 spec、路径依赖 registry、`build.yml` 必过链** 等专程序 **不**因「单人」而缩水（同文 **§0.a / §7**）。
- **CI 欠费或 Actions 不可用时**：**不**把「没跑 GitHub」当成可跳过验证；以 **solo-dev-rhythm §6.5** 本地脚本子集 + **自留 `exit 0` 证据** 替代云端 CI。**组织恢复 Billing、workflow 可信后**，补一轮 **远端与本地对拍**，再进入 **③** 叙事。
- **验证与部署顺序（写死）**：**① 本地**（含 §6.5）→ **② 测试网/预发** → **（云端 CI 恢复后）workflow 复验**（**附加对齐闸**，**不**等价于 **③**）→ **③ 公网/生产**（**段 6** + **go-live**）。**禁止**用 **①** 或「仅本地绿」冒充 **③**。
- **生产向全链路（mock / 假环境）**：**段 1～3** 与 **[TT-9626](TT-9626-zero-to-production-go-single-path.md)** **阶段 2** 要求 **无 mock 冒充、真 API、真读写**；**禁止**用写死的业务假数、**假链 ID、密钥或第三方 URL** 冒充目标环境（配置以 **env、部署真值、04、go-live、`.env.example`** 为准；语言/框架层常量不在此抬杠，但须在 Runbook/证据可对拍）。
- **单库 → 分布式数据库（规划债）**：与 **①→③** 并行排期；接库、迁移、分布式兼容真源 **[41](../spec/41-后端数据库接库与落地清单.md)**、**[04](../spec/04-后端与API.md)**，检查项另见 **[59](../spec/59-企业级全域检查清单与文档补充计划.md)** **C6**；须在任务卡或官方总表 **显式里程碑**，避免临近 **③** 才突击。
- **治理币与投票（② 专项，与主脊并列）**：若本轮宣称 **测试网全链路已闭** 且 **必须** 包含「**新建治理代币 + 投票服务 + 投票 UI**」，则 **不可** 因 **段 1** 主脊通了而省略 — 见下文 **§0.b**。
- **Windows 本地一键栈**：**UTF-8 / `cmd.exe` 误解析 / Docker 预检** 见 **[TT-WINDOWS](TT-WINDOWS-LOCAL-STACK-ENV-001.md)**（与 **`scripts\dev\start-api-with-seed.bat`** 头 **`chcp 65001`** 同源说明）。

### 0.c 完成即标记（防重复测试、防无因复跑全链）

- **一次性真值**：某 **段 / 表行 / 脚本 / §0.b 判据** 首次 **PASS** 时，**当场**更新 **☑**（或 **96-20「已验证 + YYYY-MM-DD」**），并在 **`evidence/.../README`**、**`report.json` `notes`** 或 **任务卡** 写清 **UTC 时间、Owner、`git rev-parse --short HEAD`（或发布 tag）、环境标签（①/②/③）、命令与产物路径**。**禁止**仅靠会话记忆或口头「测过了」导致下一棒 **从零重跑**。
- **复跑门槛**（满足 **任一** 才对 **同一段 / 同一矩阵块** 做 **整段重跑**）：**触及该判据的代码 / 合约 / migration / 部署 env / 04 契约行** 已变；**新提交**落在 **上次证据声明的 commit 范围之外** 且 **经代码审或 diff 判断影响该链路**；**机读闸**（如 **`validate-regression-report.py` `NO_GO`**、**B-421**、**相关 `cargo test` 红**）要求 **新证据**。
- **增量优先**：非「全量发版封口」场景，**93 / E2E / 手点** 按 **[R-002](../spec/R-002-回归执行闭环与发布准入.md)**、**[93-matrix-batch-tracker](93-matrix-batch-tracker.md)** 与 **本轮变更声明** **裁剪 scope** 重跑；**不**默认「为求心安」从头点全站。**96-20** 行已达 **已验证+日期**、且 **04 / 路由** 无回归时 **不**改回 **待核验**。
- **认领防重**：跨日/多人接力时，证据 **README** 须有 **「本目录覆盖的 commit 上界」** 或 **「与哪份 `report.json` 对齐」**；后来者 **先读标记再执行**，避免重复占用同一环境窗口。

### 0.b ② 测试网必达：新建治理币 + 投票服务 + 投票 UI 全畅通

若 **本轮 scope** 要求 **治理域在测试网可演示、可验收**（与 **§0.a** **②** 叠读），则在 **同一测试链**、**同一套部署与 env** 下 **须** 同时满足下表（**禁止**仅用 **① 本地** 或 **`placeholder` / `chain_off` 冒充已闭环**；**`data_source` / `X-Implementation-Status` 语义** 以 **[04](../spec/04-后端与API.md)** 为准）。

**投票模式（须先写进任务卡）：** 本轮 **②** 验收须写明 **`signal_off_chain`（MVP）** 与 **`on_chain_governor`** **以何者为真**（或 **04** 当场混排规则）。**API** 的 **`governance_vote.kind`**、**`POST …/vote` 是否可写** 与 **钱包链上 `castVote`** **分别**留证，**禁止**把一种模式的 green 写进另一种模式的结论。

**合规边界（一句）：** 本节是 **工程 / 测试网技术验收**；**不**等同 **governance-token 对外定稿**或募资披露 — **对外叙事** 仍以 **[82](../spec/82-治理币-文档总览.md)**、**[08-4](../spec/08-4-对外口径包.md)**、**[governance-token/LEGAL-SIGNOFF-CHECKLIST](../spec/governance-token/LEGAL-SIGNOFF-CHECKLIST.md)** 为另闸。

| ☐ | 判据 | 说明与真源 |
|---|------|------------|
| ☐ | **链上：新建/部署本轮治理代币与编排（含 Governor / Timelock 等当轮真值）** | 在 **目标测试网** 完成 **新治理代币**（及当轮规定的 Governor 等）**部署与地址登记**；顺序与运维真值 **`ops/RUNBOOK.md`** **§2.56**、**[14 §6](../spec/14-合约-API-ABI-前后端对齐.md)**、**[governance-token/02](../spec/governance-token/02-对内技术规格-草案.md)**、**`contracts/README`**；ABI / 地址与 **部署 commit** 对拍。 |
| ☐ | **后端：`/api/v1/governance/*` 真通** | **04** 治理节：`GET …/governance/proposals`、`GET …/governance/proposals/:id`（计票/权重）、`POST …/proposals/:id/vote`（**MVP 信号票**或 **Governor** 模式下 **04** 规定的门禁）、`GET …/governance/voting-power`、`GET`/`POST …/governance/delegate` 等在 **②** 下与 **真实 `DATABASE_URL`、RPC、`GOVERNOR_*` / `GOVERNANCE_*` 等 env** 联调 **非假成功**。 |
| ☐ | **前端：治理子站全路径可点通** | **`frontend/app/governance/*`**：**提案列表 → 提案详情（投票入口）→（按需）委托页** 与上列 API **同源 env**；与 **[96-20](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** **`governance` 域**、**[82](../spec/82-治理币-文档总览.md)** 工程入口对读；留痕：**录屏/截图路径** 或 **E2E 日志** + **测试网 `CHAIN_ID` 与合约地址** 文案。 |
| ☐ | **闭环句** | 至少 **一名** 测试用户可在 **②** 完成：**看到依赖新建代币权重的提案 → 完成一次有效投票（或 **04** 允许的链上投票路径）→ 刷新后 **列表/详情/计票** 与后端 **一致**。**手测叙事旁证**（质押/池/国库 UI）可与 **[TT-B428](TT-B428-GOV-STAKING-TREASURY-UI-CLOSELOOP-001.md)** 对读；**执行态 UX 分步**与 **[Epic-A-governance-execution-ux-ladder.md](Epic-A-governance-execution-ux-ladder.md)** 并联（与 **根 README · Epic A** 同源）。**链上 queue/execute 证据链**与 **[TT-B417](TT-B417-GOVERNANCE-EXECUTION-AUTOMATION-L3-001.md)**（或 **`ops/RUNBOOK.md`** **Governor / Timelock · L3** 段所引 **B-417** 入口）**范围触发**时并联。 |

**与段式清单的挂接：** 矩阵与页面收口在 **段 2**（**2.4**）；**93 / `report.json`** 在 **段 3**（治理相关行须 **☑**，**NO_GO** 不得发版）。

### 0.b.1 最小证据包（建议落盘）

**建议目录：** `evidence/GO_gov_testnet_<YYYYMMDD>/README.md`（或与 **`evidence/GO_…`**、**R-002 manifest** 同批合并，**须** 在 README 内 **互指** **§0.b** 表行）。

| ☐ | 产物 | 说明 |
|---|------|------|
| ☐ | **环境指纹** | 测试网 **`CHAIN_ID`**、RPC 主机名（可脱敏）、**部署 commit**、治理相关 **env 键名列表**（值可脱敏为末四位）。 |
| ☐ | **合约地址表** | 治理代币、**Governor**、**Timelock**、Votes 等当轮 **env** 指向的地址一览（与 **forge broadcast** 或部署记录互指）。 |
| ☐ | **链上只读快照** | 至少一段 **`GET /meta`**（或等价）JSON，**`governance.*` / `contracts`** 与当轮部署 **不矛盾**（脱敏）。 |
| ☐ | **API 证据** | **`GET …/governance/proposals`**、**`…/proposals/:id`**、**`…/voting-power`**（及 **`POST …/vote`** 若适用）：**可复制 curl** 或 **HAR 路径**；响应内 **`data_source`** / **`governance_vote.kind`** 与 **04** **一致**。 |
| ☐ | **UI 证据** | **录屏**或**带时间戳截图序列**：列表 → 详情 → 投票/链上指引 → 刷新后计票一致。 |
| ☐ | **`report.json` 指针** | **段 3** 已跑时：含 **93 §3 · C-GOV-*** **通过** 的机读路径，或与 **R-002** 同批 **manifest**。 |

### 0.1 全栈全链路仍易漏（与段 1～6 **并联**，勿只靠「页面点通」）

> 下列项 **不**都在 **96-20 的 URL 行**里展开；发版前须 **显式勾选或 N/A 一句**。

| 类 | 补什么 | 主入口（仓库内） |
|----|--------|-------------------|
| **发版真值并联** | **P0 十二项**、**08-2/08-4**、**00 快速核对**、**evidence/manifest** | **[缺口与待补-官方总表](../spec/缺口与待补-官方总表.md)**（**P0 表** + **按序核查流水**）；**[go-live-checklist.md](../go-live-checklist.md)** **§11**；**[15 附录〇](../spec/15-多维度文档与技术检查报告.md#发版前勾选总表)** |
| **机读预检（不替代签字）** | **55-S13·2b**、**04 路由**、**pre-release** 等 | 官方总表 **§按序核查流水**；**`ops/RUNBOOK.md`** **§12.5～12.8** |
| **链下异步与消息** | Webhook、邮件、任务队列、通知可达 | **[96-09](../spec/96-09-消息通知与异步任务.md)**；准入费 **`TT-9618`** |
| **治理（② 专项）** | **新建治理代币 + 投票 API + 治理 UI**；与主脊 **并列**，勿只做准入费即宣称 **②** 已闭 | **§0.b**；**[93 §3 C 域](../spec/93-全站功能验证矩阵-域别回归清单.md)**；**[TT-9618](TT-9618-onboarding-local-testnet.md)**（准入费 **不**覆盖治理） |
| **登录态 / RBAC / 特权边界** | **登录后** 各角色（`users.role`，见 **87**）**可见路由与写接口**；**`/admin`、治理写、争议解决、他人订单** 等 **401/403/404** 与 **[04](../spec/04-后端与API.md)** **一致**；**Me / 多钱包** 与 **96-17** 对拍 | **[93](../spec/93-全站功能验证矩阵-域别回归清单.md)**（**A-LOG-***、**B-NEG-***、**C-NEG-***、**D-ADM-***、**L1/L5** 等）；**[87](../spec/87-TravelTrust-角色体系技术文档-融合架构版.md)**；**[96-17 §4](../spec/96-17-多重身份与钱包真值.md)** |
| **UI/UX / a11y / i18n（深度，非「能点开」）** | **96-16** **D1～D12** 抽样、**F 区**、**88** 响应式断点、**裸 error** / **资金误导** / **a11y 阻断主路径**（**96-13 P0**） | **[96-16](../spec/96-16-全页面UI-UX优化方案总册.md)**；**[96-13](../spec/96-13-UI-UX-i18n-a11y-性能走查.md)**；**[88](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)**；**[96-15](../spec/96-15-深度多维度检查与审计体系.md)** **Tier C** |
| **索引器 / internal / 对账** | 无浏览器 UI，但属 **全链数据闭环** | **`ops/RUNBOOK.md`**；**[Epic-D](Epic-D-indexer-ops-readonly-ladder.md)**；**go-live §4** |
| **支付 / PSP 真生产** | **③** 与 **Stripe live / webhook 公网** 等 | **go-live** 相关节；**`TT-9618`**（测试网阶段） |
| **安全与密钥** | 轮换、供应链、**internal 不外露** | **[96-03](../spec/96-03-安全密钥与供应链.md)**；**go-live §3 / §6** |
| **合规与隐私** | KYC/AML、跨境、DSAR、备份 | **[96-01](../spec/96-01-总则与95边界和执行顺序.md)～[96-04](../spec/96-04-合规风控与跨境数据.md)**、**[96-06](../spec/96-06-数据隐私备份与迁移.md)**（范围触发才深做） |
| **合约 / ABI / 字节码** | 与部署 commit 对拍 | **[14](../spec/14-合约-API-ABI-前后端对齐.md)**；**`check-55-s13`** 等（见官方总表流水 **步骤 5**） |
| **容灾与演练** | 备份恢复、资损 runbook、回滚 | **go-live §2 / §8**；官方总表 **P0 #11** |
| **负载与性能** | 峰值、慢查询、前端预算 | **[96-13](../spec/96-13-UI-UX-i18n-a11y-性能走查.md)**；官方总表流水 **步骤 6**（**30 §5** i18n 抽样） |
| **主网 cutover** | **`CHAIN_ID=1`** 另闸 | **[TT-MAINNET](TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md)** + **go-live §9** |
| **封口 Epic / 母表 B-*** | 若本轮触达治理/索引器/财务只读 | **[sealed-programs-and-epics-master-index.md](sealed-programs-and-epics-master-index.md)**、**[任务母表](../任务母表.md)**（`docs/任务母表.md`） |

### 0.2 深度多维审计（96-15）— 缺口在哪、怎么补齐

**真源：** **[96-15 §0～§3](../spec/96-15-深度多维度检查与审计体系.md)**；**与 95 正交**；**何时必跑**见 **96-15 §0**（对外 **「深度审计」/ DPA** 等 → **§1 Tier A + §3** 全 **☑**；否则 **§3** 可 **N/A 一句**，**Tier A 仍建议** 与 **96-11** 并联）。**`GO_96_bundle_*` 一束** 中 **「深度多维」** 行与 **96-01 §0.3** 对拍时，须含 **§3** 全部勾选语义（含 **（范围触发）② 治理测试网全链** 行，见 **96-15 §3** 表）；**不**与 **§0.b** 拆成两套结论。

| ☐ | Tier / 块 | 补什么（缺口若不补会误以为自己「全审计了」） | 主读 / 硬输出 |
|---|------------|-----------------------------------------------|----------------|
| ☐ | **Tier A · 1** | **15 附录〇** 逐项 | **[15 附录〇](../spec/15-多维度文档与技术检查报告.md#发版前勾选总表)** |
| ☐ | **Tier A · 2** | **59** 九维 **P0 行** | **[59](../spec/59-企业级全域检查清单与文档补充计划.md)**；证据路径见 **96-15 §1** |
| ☐ | **Tier A · 3** | **B-421** 文档互指机读 | **`bash scripts/check-runbook-golive-doclink-gate.sh`** **exit 0** |
| ☐ | **Tier B** | **66 / 51 / 53-深度**、**27-P** 与本轮 scope 相交行 | **96-15 §1** 表 **Tier B**；防 **隐藏 P0** |
| ☐ | **Tier C** | **96-13 + 96-16**（**F 区 / 资金路径** 与 **§4** 最长前缀）；范围触发 **96-17 §4**、**96-18 §8/§11.7** | **96-15 §1** 表 **Tier C**；与 **本清单 段 4** **合并执行**、勿拆成两套结论 |
| ☐ | **Tier C · 映射** | **code-maps / snapshots** 与 **04** 冲突登记 | **96-15 §1** 序 **7**；契约以 **04** 为准 |
| ☐ | **§3 P0 最小勾选** | 若承诺「深度多维」或合同要求 | **[96-15 §3](../spec/96-15-深度多维度检查与审计体系.md)** 表 **全 ☑ 或书面 N/A** |
| ☐ | **机读编排（可选）** | **I/O 契约、orchestration 进 report** | **[TT-9615](TT-9615-RELEASE-ORCHESTRATION-MACHINE-IO-001.md)**；**96-15 §1.1**；**`scripts/release/run_96_15_orchestration.py`**；本地包 **TT-9600 §5** |

**与段 1～6 的挂接：** **段 3～4** 做完仍 **不**等于 **96-15 全 Tier**；须在 **发版前** 按 **96-15 §0** 决定跑 **A+B+C** 还是 **A + §3 N/A**，并在 **段 6** 与 **go-live / 缺口官方总表** **同一证据包** 可对拍。

---

## 1. 段 1 — 主脊跑通（交易主钱路）

**目标：** **注册/登录 → `/meta` → `/market` → 创单 → `/escrow/:id`** 在目标环境 **无 mock、真 API、真读写、能点通**（**①** 起，**②** 再验）。

| ☐ | 项 | 主读 / 动作 |
|---|-----|----------------|
| ☐ | **1.1** 理解主脊五段与代码锚 | **[TT-9625 §2](TT-9625-golden-path-system-spine.md)** |
| ☐ | **1.2** 地基不架空（API/DB/链与 `chain_off` 语义） | **[TT-9621](TT-9621-master-order-96-backend-db-chain-frontend.md)** **Phase A→C** |
| ☐ | **1.3** 八类闭环里与主脊相关的行 | **[TT-9624](TT-9624-closed-loop-checklist.md)** **#1～8**（至少 **4～6**） |
| ☐ | **1.4** 规则层与主脊相交部分 | **[96-21](../spec/96-21-工程闭环扩展清单进阶.md)** **9～13**（按本轮 scope，不必一次扫全站） |
| ☐ | **1.5** 竖切打法可对拍 | **[TT-9623](TT-9623-vertical-slice-01-guides-catalog.md)**（已落地示例） |
| ☐ | **1.6**（可选）主脊 **gate 脚本** 收口 | **`bash scripts/gates/vertical-slice-02-main-spine.sh`**（**①** 公开半脊：`/health` + `/meta` + **`/meta/build`** + **`GET /api/v1/discover/orders`**）；**编排（02→条件 01）**：**`bash scripts/gates/vertical-slice-tt9627-segment1-api-smoke.sh`**；**`TT9627_SEGMENT1_API_SMOKE=1`** 时 **`ci-local-delivery-minimum.sh`** 尾段可串跑。**注册→创单→托管** 仍须 **E2E/手点**；与 **竖切 01** 单列脚本并列。**96-18** 立 P0 后可再补 **Runbook 专篇** 与 **TT-9626** 编号区分。 |

**段 1 完成判据（复述句）：** 指定环境下 **主脊五 URL** 走完 **无假空、无裸 501、无链上/DB 与 UI 互斥**（与 **96-21 · 9** 可对读）。

---

## 2. 段 2 — 全站 URL × API 矩阵（仍属产品「面」）

**目标：** **96-20** 中与本版本相关的行，从 **「待核验」→ 已验证 + 日期**；**自由市场子站、社区、治理…** 均在此段分批吃掉。

| ☐ | 项 | 主读 / 动作 |
|---|-----|----------------|
| ☐ | **2.1** 打开矩阵与本轮范围 | **[96-20 §5–§8](../spec/96-20-前后端页面对齐与UI生产级审计报告.md)** |
| ☐ | **2.2** 按域分批 `rg` / E2E / 手点（与 **TT-9621 Phase D** 一致） | **96-20 §8**；**`/market` 公开读面①机读**：**`bash scripts/gates/vertical-slice-03-market-hub-public-smoke.sh`**（**`discover/orders` + `guides`**；**不**替代抽屉/下单/登录矩阵） |
| ☐ | **2.2-a** **`/` + `/market` 四页数据链（① · FE）** | **`bash scripts/dev/run-web3-itinerary-l5-green.sh`** + 可选 **`bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh`** — **`localStorage`** · **300ms debounce** · 收藏 **`localStorage` + F-020 best-effort**（**→ ②** SLA）；**[LANDING-MARKET-PAGES-CODE-SSOT](../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · **[dev-local-smoke §10](../dev-local-smoke-baseline.md)**；**不**替代 **2.2** API 竖切 |
| ☐ | **2.2-b** **`/community/explore` 公开读面（①）** | **`bash scripts/gates/vertical-slice-04-community-explore-public-smoke.sh`** — **`GET /api/v1/community/feed`**（与 **`getFeed`** 同源）+ **`GET /api/v1/community/stats/posts-by-tag`**（话题统计；**不**含 **登录态 / mode=follow**） |
| ☐ | **2.2-c** **段 2 公开读编排（①）** | **`bash scripts/gates/vertical-slice-tt9627-segment2-hub-public-smoke.sh`** — 串 **竖切 03** + **竖切 04**；**`TT9627_SEGMENT2_API_SMOKE=1`** 时 **`ci-local-delivery-minimum.sh`** 尾段可选串跑 |
| ☐ | **2.3** 与 **04 / `api.ts`** 契约无互斥 | **04**、**`frontend/lib/api.ts`** |
| ☐ | **2.4**（**scope 含治理投票**）**②** **治理代币新建 + 投票 API + 治理 UI 全畅通** | **§0.b**；**96-20 `governance`**；**04** 治理路由表；**82**、**governance-token/02** |

**段 2 完成判据：** 本轮 **scope 内** **96-20** 相关行 **已对齐** 或 **已登记 N/A（一句范围）**；**若 scope 含治理投票**，**§0.b** 表 **须全 ☑** 并附 **②** 证据（与 **§0.a** **禁止用①冒充②** 同口径）。

---

## 3. 段 3 — 功能矩阵与回归准入（「全功能」主战场）

**目标：** **93** 覆盖 + **`report.json`** 机读 **NO_GO 不得发版**。

| ☐ | 项 | 主读 / 动作 |
|---|-----|----------------|
| ☐ | **3.1** Staging 首轮（若适用） | **[R-003](../spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md)**；**本地 R-002 预链（生成 + 校验）统一入口**：**`bash scripts/gates/vertical-slice-tt9627-segment3-r002-prereport-chain.sh`**（薄委托 **`local-verify-r002-prereport-chain.sh`**；**无 `DATABASE_URL`** 为软校验，**有库** 时与脚本内 **strict** 路径一致） |
| ☐ | **3.2** 域别矩阵执行与批次 | **[93](../spec/93-全站功能验证矩阵-域别回归清单.md)**、**[93-matrix-batch-tracker](93-matrix-batch-tracker.md)** |
| ☐ | **3.3** 汇总与发版闸 | **[R-002](../spec/R-002-回归执行闭环与发布准入.md)** · **`python scripts/validate-regression-report.py … --fail-on-no-go`**；**已有 `report.json` 机读一键**：**`bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh <path>`**（可选 **`R002_FAIL_ON_NO_GO=1`** 等，见脚本头）；**`TT9627_SEGMENT3_R002_VALIDATE=1`** 时 **`ci-local-delivery-minimum.sh`** 须同设 **`REPORT_JSON`**；**路径优先级·无仓库根默认**见 **[TT-9628 §0.0.3](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-report-json-path-convention)**；**ISS-007 窄切片**（**`gen-r002-iss007-prereport.py`**）自述见仓库 **`evidence/GO_local_r002_verify/README.md`**（**`release_gate` 全 PASS 仍为 `PARTIAL_GO`**，**勿**单独 **`--require-go`** 冒充 staging 全矩阵 **GO**） |

**段 3 完成判据：** **staging / 全矩阵** **`report.json`**：**`release_gate`** 与 **93 §7.1** 一致且 **`validate-regression-report.py … --fail-on-no-go`（及目标环境所要求的 flags）** **exit 0**。**ISS-007 窄切片**（上表 **3.3** **`gen-r002-iss007-prereport.py`**）：**43 锚全 PASS** 时 **`release_gate` 仍为 `PARTIAL_GO`**（设计如此）；**机读收口**用 **`--fail-on-no-go`**，与 **95 §1.1**、**`scripts/README`** 同口径。**若 scope 含治理投票**，**93 §3** 相关行（如 **C-GOV-***）**不得** 在 **`report.json`** 侧以 **NO_GO** 放行（与 **§0.b** 同证据包可对拍）。

---

## 4. 段 4 — UI / UX 生产级走查（观感与无障碍）

**目标：** 不把「能跑」当成「好看、好用、可达」。**若本轮须跑 96-15 Tier C**：与本段 **合并同一批证据**，并回写 **96-15 §1** 序 **6** 要求（**F 区** 等）。

| ☐ | 项 | 主读 / 动作 |
|---|-----|----------------|
| ☐ | **4.0**（**可选**）**① 机读：段 4 母表文件在位** | **`bash scripts/gates/vertical-slice-tt9627-segment4-spec-presence.sh`**（**96-13** + **96-16** + **29** 路径存在；**不**替代走查留痕）；**`TT9627_SEGMENT4_SPEC_PRESENCE=1`** 时 **`ci-local-delivery-minimum.sh`** 尾段可选串跑 |
| ☐ | **4.1** 维度母表 | **[96-16](../spec/96-16-全页面UI-UX优化方案总册.md)** |
| ☐ | **4.2** 门禁式走查留痕 | **[96-13](../spec/96-13-UI-UX-i18n-a11y-性能走查.md)** |
| ☐ | **4.3**（**范围触发**）市场域企业级清单 | **[29](../spec/29-自由市场-企业级检查清单.md)** 等 **96-15 §2** 表行 |

**段 4 完成判据：** 本轮 **高流量路径** **96-13** 可勾选证据已落（或与 **96-20** 备注互指）；**已承诺 Tier C** 时另满足 **§0.2** 表 **Tier C** 行。

---

## 5. 段 5 — 全项目闭环自检（工程 + 规则层扫尾）

**目标：** 补 **段 1～4** 未覆盖的 **TT-9624** 行 + **96-21** 全表（按产品范围 **N/A** 须有 **一句**）。

| ☐ | 项 | 主读 / 动作 |
|---|-----|----------------|
| ☐ | **5.0**（**可选**）**① 机读：段 5 真源文件在位** | **`bash scripts/gates/vertical-slice-tt9627-segment5-spec-presence.sh`**（**TT-9624** + **96-21** + **96-17** 路径存在；**不**替代表内勾选）；**`TT9627_SEGMENT5_SPEC_PRESENCE=1`** 时 **`ci-local-delivery-minimum.sh`** 尾段可选串跑 |
| ☐ | **5.1** 八类闭环全扫 | **[TT-9624](TT-9624-closed-loop-checklist.md)** **1～8** |
| ☐ | **5.2** 进阶 9～17 | **[96-21](../spec/96-21-工程闭环扩展清单进阶.md)** |
| ☐ | **5.3** 身份 / 钱包触达时 | **[96-17](../spec/96-17-多重身份与钱包真值.md)** |

**段 5 完成判据：** 表内 **无「假装勾了」**；**③** 未做的项 **未**写成已闭。

---

## 6. 段 6 — 生产 GO（全项目「能发」）

**目标：** **工程 + 运维 + 并联法务/主网** 按仓库真源收口。

| ☐ | 项 | 主读 / 动作 |
|---|-----|----------------|
| ☐ | **6.0**（**可选**）**① 机读：段 6 真源文件在位** | **`bash scripts/gates/vertical-slice-tt9627-segment6-spec-presence.sh`**（**TT-9626**、**go-live**、**缺口总表**、**TT-MAINNET**、**96-15**、**`ops/RUNBOOK.md`** 路径存在；**不**替代勾选/签字；**`TT9627_SEGMENT6_SPEC_PRESENCE=1`** 时 **`ci-local-delivery-minimum.sh`** 尾段可选串跑 |
| ☐ | **6.1** 一条路从阶段 0 走到 6 | **[TT-9626](TT-9626-zero-to-production-go-single-path.md)** |
| ☐ | **6.2** 逐项勾选 | **[go-live-checklist.md](../go-live-checklist.md)** |
| ☐ | **6.3** 官方总表 P0 并联 | **[缺口与待补-官方总表](../spec/缺口与待补-官方总表.md)** |
| ☐ | **6.4**（若 **Ethereum Mainnet**） | **[TT-MAINNET](TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md)** + **go-live §9** |
| ☐ | **6.5**（**深度多维承诺时**） | **[96-15 §3](../spec/96-15-深度多维度检查与审计体系.md)** **P0 最小勾选** 全 **☑** 或 **N/A（须一句）**；与 **go-live · GO Decision · 96 维** 同口径 |

**段 6 完成判据：** **go-live** 与 **TT-9626** 文内 **§0** 并联项 **均已满足或书面 N/A**；**签字与证据路径**可追溯；**已承诺深度审计** 时 **§0.2 + 6.5** 不得留空。

<a id="tt-9627-segments-456-orchestration"></a>

**编排（可选 · ①）：** 一键串 **段 4.0～6.0** 机读：**`bash scripts/gates/vertical-slice-tt9627-segments-456-spec-presence.sh`**。**`TT9627_SEGMENT456_SPEC_PRESENCE=1`** 时 **`ci-local-delivery-minimum.sh`** 尾段可选；**机读去重**：**`SEGMENT456=1`** 时 **`ci-local`** **不**再跑 **`SEGMENT4/5/6`** 个体尾段（若环境变量仍误同开 **`=1`**，stderr 一条 **note**；编排仍只跑 **4+5+6** 一次）。

---

## 7. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-04-30 | 首版：段 1～6 顺序清单 |
| 0.1.1 | 2026-04-30 | **§0.1**：全栈并联易漏项（发版真值、internal、96-09、安全合规、主网） |
| 0.1.2 | 2026-04-30 | **§0.2**：**96-15** Tier A/B/C + §3 P0 + **TT-9615**；**段 4** 并 Tier C；**段 6.5** |
| 0.1.3 | 2026-04-30 | **§0.a**：独立维护与 **PR** 口径、**CI 欠费** 与 **①→②→（CI）→③** 顺序、**无 mock/无假环境写死**、**单库→分布式** 规划互指 **41/04/59** 与 **solo-dev-rhythm**。 |
| 0.1.4 | 2026-04-30 | **§0.b**：**②** 测试网 **新建治理币 + 投票 API + 治理 UI** 必达表；**段 2.4** 与完成判据挂接；互指 **TT-B428** / **TT-B417**（范围触发）。 |
| 0.1.5 | 2026-04-30 | **§0.b** 增 **合规边界** 句；**§0.1** 表增 **治理（②）** 行；**段 3** 判据并联 **93 §3 C-GOV** 与 **§0.b**。 |
| 0.1.6 | 2026-04-30 | **§0.a** 互指 **TT-WINDOWS**；**§0.b** 增 **投票模式** 句、**Epic A**、**§0.b.1** 最小证据包表。 |
| 0.1.7 | 2026-04-30 | **§0.2** 首段增 **96-01 §0.3**/**`GO_96_bundle_*`** 与 **96-15 §3**（含 **② 治理** 触发行）**对拍**句。 |
| 0.1.8 | 2026-04-30 | **§0** 列表 + **§0.c**：**完成即标记**、**复跑门槛**、**增量 93**、**认领防重**（防重复全链测试）。 |
| 0.1.9 | 2026-04-30 | **§0.1** 表增 **登录态/RBAC/特权边界** 与 **UI·UX·a11y·i18n 深度** 行（与 **93/87/96-17/96-13/96-16/96-15 Tier C** 对拍）。 |
| 0.1.10 | 2026-04-30 | **§0.1** 表 **RBAC** 行：修正 `users.role` 与加粗嵌套导致的 Markdown 断裂。 |
| 0.1.11 | 2026-04-30 | **§0** 列表：互指 **[TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md)**（**主线/支线** 拆跑与独立升级）。 |
| 0.1.12 | 2026-05-01 | **段 1.6**：落地 **`vertical-slice-02-main-spine.sh`**（主脊公开半脊机读闸）。 |
| 0.1.13 | 2026-05-01 | **段 1.6**：**`vertical-slice-02`** 增 **`/meta/build`**；增 **`vertical-slice-tt9627-segment1-api-smoke.sh`** 与 **`ci-local-delivery-minimum`** 可选 **`TT9627_SEGMENT1_API_SMOKE`**。 |
| 0.1.14 | 2026-05-01 | **段 2.2**：**`vertical-slice-03-market-hub-public-smoke.sh`**（**/market** 与 **`useMarketPage`** 同源公开 GET）。 |
| 0.1.15 | 2026-05-01 | **段 2.2-b**：**`vertical-slice-04-community-explore-public-smoke.sh`**（**/community/explore** 公开 **feed** + **posts-by-tag**）。 |
| 0.1.16 | 2026-05-01 | **段 2.2-c**：**`vertical-slice-tt9627-segment2-hub-public-smoke.sh`** + **`TT9627_SEGMENT2_API_SMOKE`** **`ci-local-delivery-minimum`** 可选串跑。 |
| 0.1.17 | 2026-05-01 | **段 3.3**：**`vertical-slice-tt9627-segment3-r002-validate.sh`** + **`TT9627_SEGMENT3_R002_VALIDATE`** **`ci-local`** 可选（须 **`REPORT_JSON`**）。 |
| 0.1.18 | 2026-05-01 | **段 3.1**：**`vertical-slice-tt9627-segment3-r002-prereport-chain.sh`** 委托 **`local-verify-r002-prereport-chain.sh`**。 |
| 0.1.19 | 2026-05-01 | **段 4.0**：**`vertical-slice-tt9627-segment4-spec-presence.sh`** + **`TT9627_SEGMENT4_SPEC_PRESENCE`** **`ci-local`** 可选。 |
| 0.1.20 | 2026-05-01 | **段 5.0**：**`vertical-slice-tt9627-segment5-spec-presence.sh`** + **`TT9627_SEGMENT5_SPEC_PRESENCE`** **`ci-local`** 可选。 |
| 0.1.21 | 2026-05-01 | **段 6.0**：**`vertical-slice-tt9627-segment6-spec-presence.sh`** + **`TT9627_SEGMENT6_SPEC_PRESENCE`** **`ci-local`** 可选。 |
| 0.1.22 | 2026-05-01 | **段 4～6 编排**：**`vertical-slice-tt9627-segments-456-spec-presence.sh`** + **`TT9627_SEGMENT456_SPEC_PRESENCE`** **`ci-local`** 可选。 |
| 0.1.23 | 2026-05-01 | **段 4～6 编排**：锚 **`#tt-9627-segments-456-orchestration`**；**`ci-local`** **`SEGMENT456=1`** 时跳过 **`SEGMENT4/5/6`** 个体尾段（误同开 stderr **note**）；**TT-LOCAL** / **scripts/README** / **TT-9625 §3** 外链对拍。 |
| 0.1.24 | 2026-05-01 | **§0**：互指 **TT-9628 §0.0.2a** 机读闸脚本索引表 **`#tt-9628-tt9627-gates-index`**。 |
| 0.1.25 | 2026-05-01 | **段 3.3**：互指 **TT-9628 §0.0.3** **`report.json`** 路径约定 **`#tt-9628-report-json-path-convention`**。 |
| 0.1.27 | 2026-06-03 | **段 2.2-a**：**`/` + `/market` 四页 FE 数据链** — **`run-web3-itinerary-l5-green.sh`** · **`smoke-web3-itinerary-full-chain-local.sh`**；互指 **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · **dev-local-smoke §10** · **scripts/README**。**承** **0.1.26**。 |
| 0.1.26 | 2026-05-01 | **段 3.3 / 段 3 完成判据**：**ISS-007** 窄切片 **`PARTIAL_GO`** 与 **staging 全矩阵** **`release_gate`** 分轨；互指 **`evidence/GO_local_r002_verify/README.md`**、**95 §1.1**、**`scripts/README`**。 |

---

**文档结束**
