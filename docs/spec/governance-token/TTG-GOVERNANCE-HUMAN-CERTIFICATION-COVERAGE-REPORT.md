# TTG Governance Human Certification Coverage Report

> **SUPERSEDED · READ-ONLY · replaced by MTM 146 + Final Closure** — **Tier / Cert 队列** 以 [Final Closure Checklist](TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md) · [MTM](TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md) 为 **ACTIVE** 真源；本报告 **禁止** 扩写 · 仅作 **77 HC 矩阵旁证**。

**Report ID:** `TTG-GOV-HUMAN-CERT-COVERAGE`  
**Version:** v1-20260616  
**Mode:** **Certification-Only** · **Cert #1 ☑** · **Cert #2 ☑** · **Cert #3 ☑** · **Cert #4 ☑** · **Cert #5 ☑** · **Cert #6 ☑** · **active Cert #8**
**Baseline（只读 · 禁止复验）：** GovFreeze V2 Clean Baseline  
**Phase:** **② Sepolia** · **≠** ③ Production GO  

**SSOT 链：** [Final Closure Checklist §14](TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md) · [Acceptance-Only](../../runbook/TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md) · [GORP §4](../../runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md)

**纪律：** 只验 **Human 认知 / 录屏 / signoff** · **不**重审开发 · Tokenomics · GovFreeze · 合约实现 · **②机读 PASS ≠ Human DONE**

**Human Coverage（Closure SSOT · 58 CHK 适用）：** **9 / 58 = 15%** · 本报告 **77 HC 矩阵** 仍 **0 / 77 = 0%**（全表 ☐→☑ 目标不变）

**机读键：** `TTG_GOV_HUMAN_CERT: CHK_HUMAN=48/58 CERT_QUEUE=7/12 ACTIVE=8 HC_MATRIX=0/77 P0_OPEN=32 P1_OPEN=28 P2_OPEN=17 CERT1_MINIMAL=9/9`

**Gate-2.4：** **G24-HUMAN-CERT-01**

---

## 1 · 已验证清单（Closure SSOT · 9 CHK · 本矩阵 77 HC 仍 0 ☑）

> **诚实边界：** **Cert #1 minimal 9 CHK** 已在 Closure/MTM 升为 `HUMAN_DONE`（`evidence/GO_ttg_cert/20260616T100918Z/`）· **不等于** 本报告 §6 **77 HC 行**全 ☑。

| 旁证类型 | 说明 | 是否 = Human |
|----------|------|--------------|
| ② Sepolia 机读/链上 | Phase A · 四账 · cutover 等 | **否** |
| Enterprise HAT 机读 | L9 recheck JSON | **否** |
| L5 冻结 / contract test | ① 绿集 | **否** |
| `run-govfreeze-v2-human-screen-acceptance-prep.sh` | 生成清单 **≠** 录屏签字 | **否** |

**Human 已验证：** **无**（待 Owner 录屏 + signoff）

---

## 2 · 未验证清单（77 项 · 全表）

见 **§6 全链路矩阵** — 当前 **77/77 ☐**

**按 Cert 步骤分批（执行序）：**

| Cert # | 范围 | 本矩阵行数 | Human ☐ |
|--------|------|------------|---------|
| **#1 Human UAT** | HC-UI · HC-MI · HC-DI · HC-CP · HC-GV（读）· HC-TR · HC-AD（读）· HC-FR · HC-UP · HC-PM（读） | **52** | 52 |
| #2 Multi Identity | HC-MI 深化 · `/me/identities` | （含于 #1） | — |
| #3 Admin | HC-AD 全链 | （含于 #1 读面 + #3 深化） | — |
| #4～5 Safe/Finance | HC-FO · HC-TR（Op） | **5** | 5 |
| #6～9 Phase B | HC-GV-06～08 · HC-ST-06 · HC-TR-04 · HC-PM-03 | **8** | 8 |
| #10～11 DR | （Human 矩阵外 · DR 轨） | — | — |
| #12 GORP | Enterprise HAT 真人签 | **1** | 1 |
| **P1/P2 延后** | live purchase · delegate live · buyback · resign 等 | **11** | 11 |

---

## 3 · 风险清单（Human 未闭 · 运营后果）

| ID | 风险 | 级 | 关联 HC |
|----|------|-----|---------|
| **RK-H01** | 用户误认为持 TTG = 45% 主理人现金 | P0 | HC-UI-02, HC-DI-05, HC-CP-02 |
| **RK-H02** | Admin 界面误认可直转 Treasury USDC | P0 | HC-AD-01, HC-TR-03 |
| **RK-H03** | FeeRouter 65/20/15 与 NetProfit 45/55 同屏混淆 | P0 | HC-FR-01, HC-CP-06 |
| **RK-H04** | 多身份切换后治理数据串读 | P0 | HC-MI-08, HC-MI-09 |
| **RK-H05** | Claim 页暗示 P4 按持仓分现 | P0 | HC-DI-03, HC-DI-04 |
| **RK-H06** | Steward 误认退 USDC / 即时 unstake | P0 | HC-ST-04, HC-ST-05 |
| **RK-H07** | 提案 Queue/Execute 倒计时认知错误 | P0 | HC-GV-06, HC-GV-07 |
| **RK-H08** | 双 Timelock 运维面混淆（Legacy vs V2） | P0 | HC-TR-05, HC-UP-02 |
| **RK-H09** | Finance Op 与 Treasury Op 职责重叠 | P1 | HC-FO-01～05 |
| **RK-H10** | live TTG purchase 未走通仍对外演示 | P2 | HC-PM-03 |
| **RK-H11** | Delegate 与 Seat 投票权混淆 | P2 | HC-DL-01, HC-ST-07 |

---

## 4 · 缺失证据清单

| ID | 缺失物 | 路径 / 动作 | 阻塞 |
|----|--------|-------------|------|
| **EV-H01** | A1～D4 录屏 | `evidence/GO_ttg_cert/<stamp>/human-uat/recordings/` | Cert #1 |
| **EV-H02** | 逐条截图包 | `.../screenshots/HC-*.{png,webp}` | Cert #1 |
| **EV-H03** | `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` | `record-govfreeze-v2-human-screen-acceptance.sh` | Cert #1 关闸 |
| **EV-H04** | 多身份录屏（B1～B4） | `walkthrough/multi-identity-*` | Cert #1/#2 |
| **EV-H05** | Admin C1～C2 录屏 | `walkthrough/admin-*` | Cert #1/#3 |
| **EV-H06** | Investor distribution 读路径录屏 | W-I1～W-I4 | Cert #1 |
| **EV-H07** | `HUMAN-ENTERPRISE-HAT-SIGNOFF.json` | GORP-14 | Cert #12 前 |
| **EV-H08** | Phase B 钱包录屏 | `GO_hat_r1_sepolia/<stamp>/phase-b/` | Cert #6～9 |
| **EV-H09** | Finance Op W-F 录屏 | Cert #5 | Ops 轨 |
| **EV-H10** | 签核检查表 ☐→☑ | `HUMAN-SCREEN-ACCEPTANCE-CHECKLIST.md` | Cert #1 |

---

## 5 · Human UAT P0 / P1 / P2

### P0（32 项 · Cert #1 必须先 ☑）

HC-UI-01～08 · HC-MI-01～08 · HC-AD-01～04 · HC-CP-01～06 · HC-DI-01～05 · HC-GV-01～07 · HC-TR-01～05 · HC-FR-01～02 · HC-UP-01～02 · HC-ST-01～04

### P1（28 项 · Cert #1 后半 + Cert #6 前）

HC-MI-09～10 · HC-AD-05～06 · HC-PM-01～02 · HC-ST-05～07 · HC-GV-08 · HC-DL-01～04 · HC-DI-06 · HC-FO-01～03 · HC-PM-04

### P2（17 项 · 登记 · 100% 前必闭）

HC-FO-04～05 · HC-PM-03 · HC-ST-06 · HC-GV-09～10 · HC-DL-05 · HC-TR-06 · HC-UP-03 · HC-FR-03～04 · HC-AD-07 · HC-DI-07 · HC-CP-07 · HC-MI-11

---

## 6 · 全链路人工验收矩阵（77 项 · 一页可见）

**列说明：** **Cert** = Final Checklist §14 步骤 · **②旁证** = 已有 Sepolia 机读（**≠ Human**）· **Human** = ☐/☑

### 6.1 UI / 叙事 / 多池 / 可升级展示

| HC-ID | P | Cert | 功能 | 页面 | 角色 | 预期结果（Human） | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|------|------|-------------------|-----------|-------|-------|
| HC-UI-01 | P0 | 1 | Governance Hub | `/governance` | 游客 | 3 秒内知：多国家池 · P1–P4 · **无**自动 TTG 分红 | 全页 + URL | C-GOV-001 | ☐ |
| HC-UI-02 | P0 | 1 | Params GOV/45/55 | `/governance/params` | 持 TTG | 45/55 bps · Timelock 48h · GOV 冻结文案可读 | `#gov-params` 区 | cutover drill | ☐ |
| HC-UI-03 | P0 | 1 | Treasury 政策 | `/governance/params#gov-params-treasury-policy` | 持 TTG | P4 **仅**治理路径 · **无** Admin 直转 | Treasury 政策折叠 | G24-GOV-01 | ☐ |
| HC-UI-04 | P0 | 1 | 五主叙事不冲突 | `/market` · `/traveltrust` | 游客 | 与治理 params **不**矛盾 · 无刚性兑付 | 两页各 1 帧 | 五主冻结 | ☐ |
| HC-UI-05 | P0 | 1 | Pool/rewards 读 | `/governance` | 登录用户 | rewards 只读 · 非现金承诺 | rewards 面板 | GET pool/rewards | ☐ |
| HC-UI-06 | P1 | 1 | State machines 展示 | `/governance/params` | 持 TTG | epoch 状态机叙事与 Finance spec 一致 | 状态机段落 | GET state-machines | ☐ |
| HC-UI-07 | P2 | 1 | Upgrade 姿态展示 | `/governance/params` | 持 TTG | Proxy/Timelock 升级 **须治理** · 无 Admin 一键 | upgrade 文案块 | G24-P-UPGRADE | ☐ |
| HC-UI-08 | P2 | 1 | Primary Market 入口 | `/governance/params` | Investor | quote 区 · cap · min USDC 可见 | exchange 区 | GET ttg-exchange/quote | ☐ |

### 6.2 多身份 · 切换 · 边界

| HC-ID | P | Cert | 功能 | 页面 | 角色 | 预期结果 | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|------|------|----------|-----------|-------|-------|
| HC-MI-01 | P0 | 1 | Traveler 边界 | `/me/*` · `/governance` | Traveler | 无 Steward 面板写权限 · 数据不串 | 身份徽章 + 治理页 | L6 partial | ☐ |
| HC-MI-02 | P0 | 1 | Investor 边界 | `/governance/distribution-*` | Investor | 见 distribution · **非** 45% steward 路径 | 两页 + 角色 | W-I | ☐ |
| HC-MI-03 | P0 | 1 | Steward 边界 | `/governance?view=region` | Steward | 见 stake/seat · **无** Treasury spend | region 面板 | Phase A stake | ☐ |
| HC-MI-04 | P0 | 1 | Guide 隔离 | `/guide/*` · `/governance` | Guide | 无治理写 · 无 CP split | 工作台 + 治理只读 | L6 | ☐ |
| HC-MI-05 | P0 | 1 | Merchant 隔离 | `/provider/*` · `/governance` | Merchant | 同 Guide 级隔离 | 两上下文 | L6 | ☐ |
| HC-MI-06 | P0 | 1 | Moderator 边界 | `/moderation/*` | Moderator | moderation **≠** Treasury | mod 页 + 口述 | L7 | ☐ |
| HC-MI-07 | P0 | 1 | Admin 边界预览 | `/admin` | Admin | 读面可见 · spend 按钮 **不存在** | admin 治理 Tab | L7 | ☐ |
| HC-MI-08 | P0 | 1 | 多身份切换 | `/me/identities` | 同账户多角色 | 切换后路由/数据 **不串** | 切换前后对比录屏 | B1 | ☐ |
| HC-MI-09 | P1 | 1 | Finance Operator 预览 | 文档 + params | Finance Op | 知职责：**不**持 TL 私钥 · **不** Safe 签 | 口述 + params 对照 | W-F 待 Cert5 | ☐ |
| HC-MI-10 | P1 | 2 | Workspace 定义 | `/me/identities` | 多角色 | 与 WORKSPACE SSOT 一致 | identities 全页 | LOCAL-MULTI-IDENTITY | ☐ |
| HC-MI-11 | P2 | 2 | 异名双人披露 | N/A | Owner | ② 可单人 · ③ 须异名（口述） | 口头披露帧 | POL-08 草案 | ☐ |

### 6.3 Admin 权限边界

| HC-ID | P | Cert | 功能 | 页面 | 角色 | 预期结果 | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|------|------|----------|-----------|-------|-------|
| HC-AD-01 | P0 | 1 | 治理只读 | `/admin` 治理区 | Admin | 无 POST spend · 无 split 写 | admin 治理截图 | W-A1 | ☐ |
| HC-AD-02 | P0 | 1 | suspend 门闸 | `/admin` | Admin | suspend **不改** 45/55 | suspend 操作 + params 对照 | C2 | ☐ |
| HC-AD-03 | P0 | 1 | Treasury  bypass 不存在 | `/admin` | Admin | 搜不到 Treasury 转出 | 全 admin 导航 | L7 | ☐ |
| HC-AD-04 | P0 | 1 | Country Pool Admin | `/admin` CP 区 | Admin | 无 on-chain split 按钮 | CP admin 页 | — | ☐ |
| HC-AD-05 | P1 | 3 | Seat 审核 UI | `/admin` steward | Admin | 知 Q-01 须 TL batch | 审核流录屏 | W-A2 | ☐ |
| HC-AD-06 | P1 | 3 | SoD POL-06 | `/admin` | Admin | 不得自批 Seat + split 资格 | 口述 + 政策页 | POL-06 | ☐ |
| HC-AD-07 | P2 | 3 | Distribution internal | `/admin` | Admin | internal 写 **不**面向旅行者 | internal 门态 | — | ☐ |

### 6.4 Country Pool · 45/55 · 多池 · USDC 读路径

| HC-ID | P | Cert | 功能 | 页面/API | 角色 | 预期结果 | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|----------|------|----------|-----------|-------|-------|
| HC-CP-01 | P0 | 1 | DE NetProfit 读 | `/governance/params` + API | 登录 | 45/55 与四账基线一致 | params + network 面板 | four-ledger PASS | ☐ |
| HC-CP-02 | P0 | 1 | 45% steward 路径 | params 文案 | Steward | 45% **非** EOA 直收 | steward 路径段落 | vault drill | ☐ |
| HC-CP-03 | P0 | 1 | 55% Global TL | params 文案 | 持 TTG | 指向 **V2** Timelock · 非 legacy | globalTreasury 行 | cutover | ☐ |
| HC-CP-04 | P0 | 1 | Unallocated 45% | params / 帮助 | 持 TTG | 无 Active → Unallocated · **非** Global 吞并 | D3 对照 narration | post-state.json | ☐ |
| HC-CP-05 | P0 | 1 | 多国家池架构 | `/governance` | 游客 | 多 jurisdiction 池 **≠** 仅 DE 误导 | 国家列表 | registry JSON | ☐ |
| HC-CP-06 | P0 | 1 | FeeRouter 正交 | `/governance/fee-routes` | 持 TTG | 65/20/15 **≠** 45/55 SSOT | fee-routes 页 | C-GOV-007 | ☐ |
| HC-CP-07 | P2 | 1 | Session 401 门 | API | 未登录 | country-ledger 须 session · 口述 | 401 响应帧 | CP HAT step-06 | ☐ |

### 6.5 TTG 购买 · Stake · Seat · 退出

| HC-ID | P | Cert | 功能 | 页面 | 角色 | 预期结果 | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|------|------|----------|-----------|-------|-------|
| HC-PM-01 | P1 | 1 | Exchange quote | `/governance/params` | Investor | quote · cap · min 100 USDC | quote UI | GET quote PASS | ☐ |
| HC-PM-02 | P1 | 1 | USDC→TTG 叙事 | params + 口述 | Investor | 须 wallet approve · **非** Admin 代买 | 口述 + UI | PM contract | ☐ |
| HC-PM-03 | P2 | 1 | Live purchase | wallet + params | Investor | ② live 购 TTG（若 USDC 可用） | tx + UI | HAT-R1 skip | ☐ |
| HC-PM-04 | P1 | 1 | 25k cap 展示 | `/governance/params` | Investor | 每钱包 cap 可见 | cap 文案 | G24-GOV-04 | ☐ |
| HC-ST-01 | P0 | 1 | Stake 门槛 | `/governance?view=region` | Steward | min stake · GOV-03 可见 | stake 面板 | stake-quote | ☐ |
| HC-ST-02 | P0 | 1 | Stake 状态读 | 同上 | Steward | on-chain stake 与 UI 一致 | status 区 | Phase A stake | ☐ |
| HC-ST-03 | P1 | 1 | Seat 申请 | 同上 | Steward | 申请流 **不**承诺 USDC 回报 | application 表单 | POST applications | ☐ |
| HC-ST-04 | P0 | 1 | 180d 退出叙事 | 同上 | Steward | **不退 USDC** · notice 路径 | resign 文案 | W-S2 | ☐ |
| HC-ST-05 | P1 | 1 | Voting power / Seat | 同上 | Seat holder | GOV-03 V1.1 cap_disabled 认知 | voting power | concentration audit | ☐ |
| HC-ST-06 | P2 | 9 | Unstake live | wallet + region | Steward | Phase B unstake tx | tx 录屏 | Phase B PAUSED | ☐ |
| HC-ST-07 | P2 | 1 | Vault forwards | `/governance/vault-forwards` | Steward | escrow fee forward **≠** NetProfit | vault-forwards | C-GOV-008 | ☐ |

### 6.6 Claim · 收益分配 · Investor

| HC-ID | P | Cert | 功能 | 页面 | 角色 | 预期结果 | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|------|------|----------|-----------|-------|-------|
| HC-DI-01 | P0 | 1 | Accrual 列表 | `/governance/distribution-accruals` | Investor | 登记投影 · **非** P4 自动现金 | 列表页 | W-I1 | ☐ |
| HC-DI-02 | P0 | 1 | Accrual 详情 | `.../distribution-accruals/[id]` | Investor | line detail 只读 | 详情页 | C-GOV-009 | ☐ |
| HC-DI-03 | P0 | 1 | Claim 边界 | `/governance/distribution-claim` | Investor | 仅 registered distribution_id | claim 页 | W-I2 | ☐ |
| HC-DI-04 | P0 | 1 | 无按持仓分现 | claim + params | Investor | 持 TTG **≠** 自动 USDC | 两页对照 | L4 contract | ☐ |
| HC-DI-05 | P0 | 1 | orthogonal steward | 口述 | Investor | investor leg **≠** 45% steward | 口述帧 | D4 | ☐ |
| HC-DI-06 | P1 | 1 | Live claim tx | wallet + claim | Investor | ② live claim（若有数据） | tx | NOT TESTED | ☐ |
| HC-DI-07 | P2 | 1 | Buyback/Burn 叙事 | `/governance/params` | 持 TTG | 仅治理 · 未启用须披露 | policy 段 | NOT TESTED | ☐ |

### 6.7 Delegate · Proposal · Vote · Queue · Timelock

| HC-ID | P | Cert | 功能 | 页面 | 角色 | 预期结果 | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|------|------|----------|-----------|-------|-------|
| HC-DL-01 | P1 | 1 | Delegate UI | `/governance/delegate` | TTG holder | 委托 **≠** Seat 集中度 | delegate 页 | C-GOV-005 | ☐ |
| HC-DL-02 | P1 | 1 | Voting power API | proposals 页 | holder | snapshot 与 UI 一致 | power 显示 | Phase A | ☐ |
| HC-DL-03 | P1 | 1 | Revoke delegate | `/governance/delegate` | holder | 可撤销 · 口述 | 操作录屏 | partial | ☐ |
| HC-DL-04 | P1 | 1 | Live delegate tx | wallet | holder | ② live（可选） | tx | NOT TESTED | ☐ |
| HC-DL-05 | P2 | 1 | API vote vs wallet | `/governance/proposals/[id]` | voter | 知双路径 · 不混淆 | vote 区 + 口述 | RK-03 | ☐ |
| HC-GV-01 | P0 | 1 | 提案列表 | `/governance/proposals` | 公众 | 列表含 Phase A prop · 状态可读 | 列表页 | indexer ② | ☐ |
| HC-GV-02 | P0 | 1 | 新建提案 UI | `/governance/proposals/new` | proposer | 表单可见 · 参数冻结披露 | new 页 | partial | ☐ |
| HC-GV-03 | P0 | 1 | 投票 UI | `/governance/proposals/[id]` | voter | cast vote · cap 提示 | vote 按钮区 | Phase A vote | ☐ |
| HC-GV-04 | P0 | 1 | Queue 状态 | `/governance/proposals/[id]` | 公众 | Queued · eta · TL 地址 V2 | status 面板 | queue tx | ☐ |
| HC-GV-05 | P0 | 1 | Timelock 48h | 同上 | 公众 | 倒计时/文案 = 48h | timelock 区 | GOV-02 | ☐ |
| HC-GV-06 | P0 | 1 | Execute 引导 | 同上 | 公众 | Execute **须**等待 · 按钮态正确 | execute 区 UI | Phase B PAUSED | ☐ |
| HC-GV-07 | P0 | 7 | Execute live | wallet + 提案页 | 任何人 | Phase B execute tx + 效果 | tx + 页 | NOT TESTED | ☐ |
| HC-GV-08 | P1 | 8 | Treasury spend 效果 | params + 链 | Finance Op | spend 后 Treasury 叙事一致 | 前后对照 | NOT TESTED | ☐ |
| HC-GV-09 | P2 | 1 | Buyback 提案类型 | params | 持 TTG | 知尚未 live | 口述 | — | ☐ |
| HC-GV-10 | P2 | 12 | Enterprise HAT 真人签 | N/A | Owner | 机读 HAT **≠** 真人签字 | signoff 页 | L9 recheck | ☐ |

### 6.8 Treasury · USDC · Finance Operator

| HC-ID | P | Cert | 功能 | 页面/流程 | 角色 | 预期结果 | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|-----------|------|----------|-----------|-------|-------|
| HC-TR-01 | P0 | 1 | P1–P4 分类 | `/governance/params` | 持 TTG | P1/P2/P3/P4 语义清晰 | treasury 表 | protocol-reference | ☐ |
| HC-TR-02 | P0 | 1 | P4 deploy cap | params | 持 TTG | 30% cap **≠** spend | cap 文案 | GOV-01 | ☐ |
| HC-TR-03 | P0 | 1 | only Timelock spend | 口述 + params | 持 TTG | **无** Admin spend | 口述 + policy | L5-01 | ☐ |
| HC-TR-04 | P0 | 8 | Live Treasury spend | wallet + TL | Treasury Op | Phase B USDC out | tx 录屏 | NOT TESTED | ☐ |
| HC-TR-05 | P0 | 1 | 双 Timelock 认知 | 口述 + params | Finance Op | Legacy=Ledger batch · V2=Governor | 口述帧 | GORP-08 待 | ☐ |
| HC-TR-06 | P2 | 5 | fundingSource 职责 | 文档 | Finance Op | 仅 approve/pull | W-F2 文档 | custody 待签 | ☐ |
| HC-FO-01 | P1 | 5 | Epoch 状态机 | 文档 + UI | Finance Op | 口述 open→split | W-F1 | accounting spec | ☐ |
| HC-FO-02 | P1 | 5 | Four-ledger 脚本 | terminal | Finance Op | 会跑脚本 · 读 FAIL 树 | 终端录屏 | REC-06 待 | ☐ |
| HC-FO-03 | P1 | 5 | calldata 审查 | 文档 | Finance Op | 与 Treasury Op 交接点 | W-F4 | GORP §2.6 | ☐ |
| HC-FO-04 | P2 | 5 | 月结签字页 | 模板 | Finance Op | 模板已填 | PDF | GORP-11 | ☐ |
| HC-FO-05 | P2 | 5 | ERP 占位 | 文档 | Finance Op | ② 占位披露 | 口述 | — | ☐ |

### 6.9 可升级架构 · 多池 · 杂项

| HC-ID | P | Cert | 功能 | 页面 | 角色 | 预期结果 | 截图/录屏 | ②旁证 | Human |
|-------|---|------|------|------|------|----------|-----------|-------|-------|
| HC-UP-01 | P0 | 1 | Upgrade via Timelock | `/governance/params` | 持 TTG | 升级权 **不**在 Admin | upgrade 段 | G24-P-UPGRADE | ☐ |
| HC-UP-02 | P0 | 1 | Emergency 路径披露 | params / 文档 | Owner | 08-4 边界口述 | 口述 | emergency 待绑 | ☐ |
| HC-UP-03 | P2 | 11 | Rollback drill | N/A | Owner | DR 轨 · 非 Cert1 | drill 纪要 | UP drill 待 | ☐ |
| HC-FR-01 | P0 | 1 | Fee vs NetProfit | `/governance/fee-routes` | 持 TTG | 两体系正交 | 同会话两 Tab | C-GOV-007 | ☐ |
| HC-FR-02 | P0 | 1 | Region vault audit | `/governance/vault-forwards` | 持 TTG | forward 只读 | 页全屏 | partial | ☐ |
| HC-FR-03 | P2 | 1 | Escrow fee 不进入 45/55 | 口述 | Finance Op | 口述清晰 | 口述 | FeeRouter | ☐ |
| HC-FR-04 | P2 | 1 | Buyback policy | params | 持 TTG | 治理专属 · 未启用 | policy | NOT TESTED | ☐ |

---

## 7 · Cert #1 执行包（52 项 P0+P1 读路径）

**前置：** 前端 `:3012` · API `:8080` · Sepolia 钱包 · **不**重跑 GovFreeze assert（Owner 自行确认基线已冻）

**证据目录：** `evidence/GO_ttg_cert/<stamp>/human-uat/`

```bash
# 可选：生成逐页 checklist（内含 assert · Owner 知悉后再跑）
bash scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh

# Cert #1 完成后
bash scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh \
  --evidence-dir evidence/GO_ttg_cert/<stamp>/human-uat \
  --signer "Sebastian Ward"
```

**Cert #1 完成定义（minimal · 已闭）：** 九项 CHK（CORE-01 · FE-01～03 · FE-09～10 · FE-13 · OPS-12 · BASE-06）+ `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` → Final Checklist **§14 #1 ☑** · **9/58** `HUMAN_DONE` · **77 HC 矩阵仍开放**

---

## 8 · 100% Human Coverage 关闸

| 条件 | 状态 |
|------|------|
| §6 矩阵 **77/77 ☑** | ☐ |
| `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` | ☑（Cert #1 minimal · `20260616T100918Z`） |
| `HUMAN-ENTERPRISE-HAT-SIGNOFF.json` | ☐ |
| Final Checklist Human **58/58** `HUMAN_DONE` | ☐（**9/58**） |
| **Human Coverage 100%** | **NOT** |

**下一动作：** **Cert #3**（§14 队列下一项）· 本报告 §6 **77 HC** 仍按 P0 顺序推进

---

## 诚实边界

| 陈述 | 真伪 |
|------|------|
| 本报告 = 开发审计 | **否** · 仅 Human 覆盖映射 |
| ② Phase A 链上 = Human 测过 | **否** |
| Cert #1 = 仅 3 页 UI | **否** · **52 项**全链路读路径 + 多角色 |
| Human 100% = Enterprise 100% | **否** · 仍须 Ops + DR + GORP signoff |

**Gate-2.4：** **G24-HUMAN-CERT-01**
