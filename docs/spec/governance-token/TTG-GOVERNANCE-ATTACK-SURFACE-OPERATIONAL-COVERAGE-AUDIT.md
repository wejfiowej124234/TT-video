# TTG Governance Attack Surface & Operational Coverage Audit

**Audit ID:** `TTG-GOV-ATTACK-SURFACE-OPERATIONAL-AUDIT`  
**Version:** v1-20260616  
**Phase:** **② Sepolia · GovFreeze V2 经济基线** · **≠ ③ Production GO**  
**Method:** 只读盘点 · **未**新增开发 · **未**新增链上部署 · **未**重跑已有 PASS 测试  
**Inputs:** [TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md](TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md) · GovFreeze V2 · Enterprise HAT · HAT-R1 · CP Revenue HAT · Four-Ledger · GOV-01～04 · Concentration Audit · Full-System Audit  

**诚实边界：** 本审计 **不** 复述矩阵中已 PASS 的功能验收结论；只列 **遗漏 · 覆盖不足 · 误用 · 攻击 · 误解 · 治理事故** 场景。

---

## 维度审计（A～G · 仅盲区与风险）

### A · 治理权限矩阵

| 角色 | 已覆盖的操作面 | 盲区 / 误用 / 攻击面 | 缺口 |
|------|----------------|----------------------|------|
| **Traveler** | API session 门闸 · 无链上写 | ② 未测「Traveler 会话能否读到 Steward 专属 stake/DE 字段」跨 tab 污染 | P1 |
| **Guide** | RBAC 代码分离（L6 机读） | ② 未测 Guide 控制台是否链到 `/governance` 写路径或误展示 Treasury 余额 | P1 |
| **Merchant** | 同 Guide | 收购 PD-009 与治理页并存时，用户是否误以为「商家身份 = 国家池收益权」 | P1 |
| **Steward** | Phase A stake · stake-status 读 | **Resign 180d → finalize → unstake 全链未测**；Active Seat 资格变更与 split 原子 batch 未在 ② 对抗演练 | **P0** |
| **Moderator** | L7 无 treasury spend（机读） | 真人 UAT 未证 moderation 动作不触发 Admin 侧 steward 状态误写 | P1 |
| **Admin** | 无 spend POST · 无 castVote API | **Admin 批准 Seat → 链上 `setActiveStewardConfig` 同步路径 ② 未 E2E**；Admin 误操作可导致 split 进 Unallocated 或错误 steward | P1 |
| **Treasury Operator** | SSOT 定义为链下 calldata 编排者 | **矩阵无独立行** · 谁可触达 Safe/legacy TL schedule · ERP→calldata 权限 **无 RBAC 证据** | **P0** |
| **Finance Operator** | 文档：无链上 key | `fundLedgerForSplit` 的 **fundingSource EOA** 密钥保管 · 轮换 · 与 Timelock 职责分离 **未审计** | **P0** |
| **Governor Proposer** | Phase A 最小提案 | `/proposals/new` **② live 未测** · 恶意 payload 混入 `[D-4555-A]` selector **无对抗测试** | P1 |
| **Voter** | GOV-03 cap on HAT vote | **API `POST …/vote` 与钱包签名双路径** · 用户误点 API 以为已链上投票 | P1 |
| **Timelock Executor** | 48h delay 读面对拍 | **Execute 未测** · 到期后 **任意地址可 execute** 的 MEV/抢跑/错误 payload **无演练** | **P0** |

### B · 治理生命周期

| 阶段 | 盲区 / 事故场景 | 缺口 |
|------|------------------|------|
| **Purchase** | HAT-R1 因 USDC=0 跳过 live purchase · **GOV-04 min/cap 未在 ② 钱包闭环** | P2 |
| **Stake** | 仅 HAT 单辖区 KR · **10 国门槛交叉 stake 未测** | P2 |
| **Seat Apply** | POST 存在 · **Admin 审核→Active ② 未测** | P1 |
| **Active Steward** | DE drill 为 **ineligible** 路径 · **eligible → StewardPathVault 45% 未测** | P2 |
| **Revenue Split** | DE epoch 1 单次 · **多国并行 epoch · 重复 close · 负 NPP** 未测 | P1 |
| **Treasury Proposal** | 仅 noop/最小 payload · **真实 `Treasury.spend` 提案未构造** | **P0** |
| **Vote** | 单提案 · **Against/Abstain · 未达 quorum · 冲突披露** 未测 | P1 |
| **Queue** | Phase A 已 queue | Queue 后 **取消/过期/重复 queue** 边界未测 | P2 |
| **Execute** | **NOT TESTED · Phase B PAUSED** | **P0** |
| **Buyback** | SSOT TWAP/深度规则 · **零链上 tx** | P1 |
| **Burn** | **零链上 tx** | P1 |
| **Release** | 180d resign API **NOT TESTED** · `releaseUnallocated→StewardPath` **NOT TESTED** | P1 |
| **Unstake** | **NOT TESTED · Phase B** | **P0** |

### C · 资金流矩阵

| 资金流 | 盲区 / 混淆 / 劫持面 | 缺口 |
|--------|----------------------|------|
| **USDC Primary Market** | USDC 进 Treasury 子账叙事 · **② 无钱包 purchase 对账** | P2 |
| **Treasury USDC** | P1～P4 顺序仅文案+读面 · **子账余额 API≠链上全量对账未闭** | P1 |
| **Country Pool Revenue** | DE 单次 drill · **accrual 期 USDC 仍在外部 fundingSource** — 密钥/ERP 错账即劫持面 | **P0** |
| **Steward 45%** | Unallocated 路径已证 · **eligible steward 收 45% 未证** | P2 |
| **Global Treasury 55%** | V2 Timelock 已 cutover · **Ledger owner 仍为 legacy TL `0x0359…`** — 双 Timelock 运维混淆 | P2 |
| **Buyback / Burn** | 未测 | P1 |
| **Claim** | InvestorDistribution live withdraw **NOT TESTED** · 重放/双花/错误 distribution_id | P1 |
| **Vault Forward** | RegionVault 投影 PARTIAL · **与 NetProfit vault 同名「Vault」UI 混淆** | P2 |
| **Treasury Spend** | onlySpender 代码 PASS · **无 live spend tx · GOV-01 30% cap 未在 spend 路径实测** | **P0** |
| **FeeRouter 65/20/15** | 与 D-4555-B 45/55 **正交但数字同屏** — 误记账/误叙事 | P2 |

### D · 多身份污染矩阵

| 场景 | 风险 | 缺口 |
|------|------|------|
| 单账号多身份（Traveler+Steward+…） | L6 机读 PASS · **真人切换未测** · session 缓存导致 A 身份看到 B 工作台 | P1 |
| **Steward + Admin** | Admin 可改 steward 应用状态 · **同一人是否可自批 Seat 并触发 split 资格** 未测 | P1 |
| **Steward + Investor** | distribution-claim 与 steward 45% **叙事正交** · 同页是否暗示「双份收益」 | P1 |
| **Investor + Proposer** | GOV-02 冲突披露规则 · **UI/API 无强制披露流** | P2 |
| **多钱包关联控制** | GOV-04 25k/wallet · **Sybil 分钱包购买未测** | P1 |
| **fundingSource = 运营 EOA** | 若与 Admin/Finance 同组织 · **内控分离未证据化** | **P0** |

### E · 治理攻击面

| 攻击类 | 现状 | 残余风险 | 缺口 |
|--------|------|----------|------|
| **治理捕获** | GOV-03 vote cap + 48h TL · Concentration Audit PASS | **GOV-CAP-01：cap=quorum 时单地址可独自达 quorum**（设计接受 · 须披露+Timelock） | P2 |
| **投票集中度** | 8M TTG 场景机读 | 仅 HAT 钱包 · **多 Seat 聚合 stake 未对抗** | P2 |
| **提案刷票** | 未见 spam 限速证据 | Governor 提案创建成本/griefing **未测** | P2 |
| **Timelock 绕过** | B-407 allowlist · cutover 已 setAllowed | **恶意治理提案添加非白名单 target** 未对抗 · legacy TL 仍可 schedule ledger | P1 |
| **Treasury 滥用** | onlySpender | **Execute→spend 未测 · P4 超 cap 未在 tx 层证伪** | **P0** |
| **Buyback 操纵** | SSOT TWAP 规则 | **无 oracle/ DEX 集成测试** | P1 |
| **Country Pool 收益劫持** | split 守恒 PASS | **recordAccrual 伪造 R/E · fundingSource 未授权 transfer** 未对抗 · Indexer 无 CPNP decoder | P1 |
| **Vault 权限错误** | Ledger→Vault only | **StewardPath 0 余额 drill** · direct EOA call on vault **未 fuzz** | P2 |
| **Claim 重放** | 合约层未 ② 验 | **同一 distribution_id 双提 · 过期 epoch** | P1 |
| **Delegate 滥用** | 读面 PASS | **② live delegate · 委托链 · 提案快照前 flash delegate** 未测 | P2 |

### F · 财务与审计

| 层 | 盲区 | 缺口 |
|----|------|------|
| **链上** | DE 四账 PASS | 仅 DE · **无 DB 快照** · eligible steward leg 未测 |
| **API** | country-ledger env 修复 PASS | **internal accrual write 未测** · fee-pool-aggregates 与 chain 偏差 PARTIAL |
| **DB** | accrual 读 PARTIAL | **L9 DB parity NOT TESTED** · CP HAT 跳过 DATABASE_URL |
| **UI** | vitest/机读 PASS | **G24-HUMAN-UAT-01 全 ☐** |
| **报表** | four-ledger JSON | **无 ERP/Finance 三方对账证据** |
| **Evidence** | 多目录 PASS | **Human signoff 缺失** · Enterprise HAT 真人 signoff 与 UAT 分离 |

### G · UI/UX 认知风险

| 误解场景 | 证据状态 | 缺口 |
|----------|----------|------|
| 「持 TTG 按持仓分现 / P4 现金」 | 文案+contract 扫描 PASS · ENT-L4-01 `withdrawDividend` 命名 | **真人 3 秒认知未证** | P1 |
| 「Seat 退出退 USDC」 | locales PASS | **UAT B2 未录屏** | P1 |
| 「所有 TTG 分享国家池 45%」 | params 45/55 图 PASS | **Steward-only 路径未在游客流强调** | P1 |
| 「Admin 能转 Treasury」 | L7 机读 PASS | **UAT C1 未证** | P1 |
| 「Country Pool = Global Treasury 同一池」 | 两轨 SSOT 分维 | **同页 params + pool 读面易混** · FeeRouter 第三轨 | P1 |
| 「distribution-accruals = 链上已到账」 | 只读页 | **off-chain accrual vs 链上 split 时序未在 UI 标注** | P2 |

---

## 1 · 已验证清单（攻击/运维场景 · 已闭 · 不展开矩阵 PASS）

仅列 **本审计维度内、已有对抗或闭环证据** 的场景（详见引用路径，不重复矩阵行）。

| ID | 场景 | 证据 |
|----|------|------|
| **ASV-01** | GOV-03 V1.1 · `votingPowerCapDisabled` / 无单地址权重 cap（HAT-R1 · legacy Sepolia 可能仍 400 bps） | `GO_governance_concentration_audit_sepolia/` · HAT-R1 `20260616T063612Z` |
| **ASV-02** | 非 Timelock 无法 Treasury.spend（代码+叙事） | Enterprise HAT L5-01 · `GovernanceTreasury.sol` |
| **ASV-03** | DE NetProfit 45/55 守恒 + 55% → V2 Timelock | `cutover-drill/20260616T082259Z/fund-flow-verdict.json` |
| **ASV-04** | 链上=API=页 四账（DE · 无 DB） | `20260616T084248Z/four-ledger-reconcile.json` |
| **ASV-05** | ineligible steward → Unallocated 45%（非 Global 吞并） | cutover post-state · UAT prep D3 待真人 |
| **ASV-06** | Queue 前 vote period 未结束会 GovBadState | HAT-R1 Phase A fix evidence |
| **ASV-07** | legacy env rollback 被 assert 脚本拒绝 | `assert-gov-freeze-v2-active-baseline-only.sh` |
| **ASV-08** | Admin API 无 governance castVote / treasury spend POST | Enterprise HAT L6/L7 机读 |

---

## 2 · 未验证清单

| ID | 场景 | 维度 | 缺口 |
|----|------|------|------|
| **UNV-01** | Timelock Execute 后 payload 生效 | B · E | **P0** |
| **UNV-02** | Treasury.spend live tx + GOV-01 cap 实测 | B · C · E | **P0** |
| **UNV-03** | Phase B Unstake / finalize-resign | B | **P0** |
| **UNV-04** | G24-HUMAN-UAT A1～D4 全清单 | A · G · F | **P0** |
| **UNV-05** | HAT-R1 Phase B execute·treasury·unstake 五层证据 | B | **P0** |
| **UNV-06** | 180d resign notice API | B | P1 |
| **UNV-07** | Admin Seat 审核 → Active → 链上 registry E2E | A · B | P1 |
| **UNV-08** | Buyback + Burn 治理路径 tx | B · C · E | P1 |
| **UNV-09** | InvestorDistributionClaim live withdraw | C · E | P1 |
| **UNV-10** | internal investor-distribution accrual write | F | P1 |
| **UNV-11** | Indexer CPNP event decoder → API | E · F | P1 |
| **UNV-12** | DB accrual vs chain epoch parity | F | P1 |
| **UNV-13** | 多身份真人切换（B1～B4） | D · G | P1 |
| **UNV-14** | GOV-04 live purchase min/cap 钱包 | B · C | P2 |
| **UNV-15** | ② live delegate / 委托链 | E | P2 |
| **UNV-16** | eligible steward → StewardPathVault 45% | B · C | P2 |
| **UNV-17** | 10 国并行 split / 负 NPP epoch | B · C | P1 |
| **UNV-18** | Sybil 多钱包 GOV-04 cap | D · E | P1 |
| **UNV-19** | releaseUnallocated → StewardPath | B · C | P1 |
| **UNV-20** | Gate-2.4 LEG-XJ-05 法务 | F | P2 |
| **UNV-21** | Finance/Treasury Operator RBAC 与 fundingSource 密钥 | A · C · D | **P0** |
| **UNV-22** | Treasury Operator / Safe schedule 职责分离 | A | **P0** |

---

## 3 · 风险清单（按严重度）

| ID | 风险 | 类型 | 缺口 |
|----|------|------|------|
| **RSK-01** | Execute 未测 → 治理闭环断裂 · 用户以为「投票已生效」 | 治理事故 | **P0** |
| **RSK-02** | Treasury spend 未测 → P4 动用与 30% cap 无 tx 层证明 | 财务/治理 | **P0** |
| **RSK-03** | fundingSource EOA + Finance Operator 无 RBAC 证据 → 收益劫持/误账 | 运维/攻击 | **P0** |
| **RSK-04** | 双 Timelock（legacy owner vs V2 globalTreasury）运维误 schedule | 误用 | P2 |
| **RSK-05** | GOV-CAP-01 单地址可 solo quorum（设计接受）→ 须披露与多签监控 | 治理捕获 | P2 |
| **RSK-06** | API vote 与钱包 vote 双路径 → 假投票认知 | 误解/误用 | P1 |
| **RSK-07** | distribution-claim / accruals 像「分红」→ 监管与客诉 | 认知/合规 | P1 |
| **RSK-08** | FeeRouter 与 NetProfit 同屏 45/55 数字 → 财务误读 | 误解 | P2 |
| **RSK-09** | Indexer 无 CPNP → API/DB 与链上 split 漂移无人告警 | 攻击/审计 | P1 |
| **RSK-10** | Admin 批 Seat 与链上 Q-01 不同步 → 错误 split 路径 | 治理事故 | P1 |
| **RSK-11** | Claim 未测 → 重放/双提未知 | 攻击 | P1 |
| **RSK-12** | Buyback TWAP 规则无集成测试 → 操纵面开放 | 攻击 | P1 |
| **RSK-13** | 无 ERP/Finance 三方对账 → ② 不等于企业财务关账 | 财务 | P1 |
| **RSK-14** | Sybil GOV-04 → 突破 25k/wallet 意图 | 攻击 | P1 |
| **RSK-15** | Delegate flash / 委托链未测 | 攻击 | P2 |

---

## 4 · 缺失证据清单

| ID | 缺失证据 | 应产出位置 / 动作 |
|----|----------|-------------------|
| **EVD-01** | Human screen 录屏 + signoff | `evidence/GO_govfreeze_v2_human_screen_acceptance/<stamp>/HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` |
| **EVD-02** | Phase B Execute tx + 状态 diff | `evidence/GO_hat_r1_sepolia/<stamp>/phase-b-execute/` |
| **EVD-03** | Treasury spend tx + 前后 USDC 余额 | Phase B 或 dedicated spend drill |
| **EVD-04** | Unstake / finalize-resign tx | Phase B |
| **EVD-05** | DB snapshot vs chain epoch | CP HAT with `DATABASE_URL` |
| **EVD-06** | CPNP indexer decode smoke | Gate-2.4 G24-P-04 实施后 |
| **EVD-07** | Finance Operator / fundingSource 密钥 custody 备忘录 | runbook · **非代码** · Owner 签 |
| **EVD-08** | eligible steward split → StewardPath 余额 | ② drill variant |
| **EVD-09** | Multi-role 录屏 B1～B4 | 同 EVD-01 |
| **EVD-10** | Claim live withdraw + revert cases | ② wallet UAT |
| **EVD-11** | Enterprise HAT 真人 layer signoff（若与机读分离） | `HUMAN-ENTERPRISE-HAT-SIGNOFF.json` |
| **EVD-12** | Ledger owner 迁移至 V2 TL 的治理提案证据 | 显式 out-of-scope 或 future |

---

## 5 · 企业级阻塞项（② Enterprise / Gate-2.4 口径）

| 优先级 | 阻塞项 | 说明 |
|--------|--------|------|
| **P0** | **G24-HUMAN-UAT-01 未签** | 认知/多身份/Admin 边界无真人证据 |
| **P0** | **HAT-R1 Phase B 未执行** | Execute · Treasury spend · Unstake 企业闭环未闭 |
| **P0** | **Treasury Operator / Finance Operator 运维面未文档化** | 企业内控无法签字 |
| **P1** | **DB 四账扩展未做** | 链上 PASS 但 DB parity 空白 |
| **P1** | **Indexer CPNP 缺失** | 运营监控与审计 trail 不完整 |
| **P1** | **Admin→链上 Active Seat E2E 缺失** | Seat 治理与 split 资格链断裂 |

---

## 6 · Production（③）前必须关闭项

| ID | 项 | 阶段 |
|----|-----|------|
| **PRO-01** | 全部 **P0** 未验证项（UNV-01～05 · UNV-21～22） | ② 先闭 |
| **PRO-02** | KYC/AML · 合格投资者 · 对外 LEG 改写（Full-System Audit OPEN） | ③ |
| **PRO-03** | Mainnet 部署 · 非 Sepolia 密钥 · Production PSP | ③ |
| **PRO-04** | Buyback/Burn · Claim · Delegate 对抗测试 | ②→③ |
| **PRO-05** | Sybil · 多 Seat · 多国并行 split 压测 | ②→③ |
| **PRO-06** | ERP/Finance 三方对账与 SOX 级证据 | ③ |
| **PRO-07** | Ledger owner 统一至 V2 Timelock（或经治理显式接受 legacy） | ② 决策 |
| **PRO-08** | ISS-007 全矩阵 staging GO **不得**冒充 governance Production GO | ③ 闸 |

---

## 7 · 按 P0 / P1 / P2 排序（合并视图）

### P0

| ID | 摘要 |
|----|------|
| UNV-01 / RSK-01 | Timelock **Execute** 未测 |
| UNV-02 / RSK-02 | **Treasury.spend** + GOV-01 cap 无 tx |
| UNV-03 / UNV-05 | **Unstake** · Phase B 全链 |
| UNV-04 | **Human UAT** A1～D4 |
| UNV-21 / RSK-03 | **fundingSource / Finance Operator** RBAC |
| UNV-22 | **Treasury Operator / Safe** 职责分离 |
| ENT block | Steward **finalize-resign** · **Treasury spend**（矩阵 M-018 · M-026 · M-024 · M-049 · M-078 · M-060） |

### P1

| ID | 摘要 |
|----|------|
| UNV-06～13 | Resign · Admin Seat E2E · Buyback/Burn · Claim · internal accrual · Indexer · DB · multi-role |
| UNV-17～19 | 多国 split · releaseUnallocated · 负 NPP |
| UNV-18 / RSK-14 | Sybil GOV-04 |
| RSK-06～07 · RSK-09～13 | API 假投票 · 分红误解 · indexer 漂移 · Admin/Seat · claim · buyback · ERP |
| G · ENT-L4-01 | withdrawDividend 命名 · accrual 时序标注 |

### P2

| ID | 摘要 |
|----|------|
| UNV-14～16 | live purchase · delegate · eligible 45% |
| UNV-20 | LEG-XJ-05 |
| RSK-04～05 · RSK-08 · RSK-15 | 双 Timelock · solo quorum · FeeRouter 混淆 · delegate flash |
| M-037 | legacy TL ledger owner 无迁移证据 |

---

## 下一合法动作（② · 无新开发）

1. **轨 1：** `run-govfreeze-v2-human-screen-acceptance-prep.sh` → 录屏 → `record-govfreeze-v2-human-screen-acceptance.sh`  
2. **轨 2：** Timelock 到期 + UAT 签核 → `HAT_R1_PHASE_B_PAUSED=0` → `run-hat-r1-phase-b-when-ready.sh`  
3. **运维：** Owner 签署 EVD-07 fundingSource/Finance Operator custody（文档 · 非链上）

**交叉引用：** [TT-GOVERNANCE-FULL-COVERAGE-MATRIX.md](TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md) · [TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md](../../runbook/TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md)

**机读：** `docs/spec/governance-token/artifacts/ttg-governance-attack-surface-audit.v1.json`（由 `gen-ttg-governance-attack-surface-audit.py` 生成 · 可选）
