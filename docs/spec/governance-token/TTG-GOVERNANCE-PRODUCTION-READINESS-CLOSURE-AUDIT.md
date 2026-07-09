# TTG Governance Production Readiness Closure Audit

**Audit ID:** `TTG-GOV-PRODUCTION-READINESS-CLOSURE`  
**Version:** v1-20260616  
**Phase:** **② Sepolia 基线已锁** · 本审计裁定 **Governance Production Ready** · **≠** 全站 ③ Production GO  
**Method:** 只读收口 · **不**测功能/代码/合约 · **禁止** Tokenomics/Governor/Treasury/Country Pool 设计变更  
**Inputs:** GovFreeze V2 · Four-Ledger PASS · Enterprise HAT · [Ops & DR Audit](TTG-GOVERNANCE-OPS-DISASTER-RECOVERY-AUDIT.md) · [Attack Surface Audit](TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md)

**裁定前缀（写死）：** **Governance Production Ready** = 权限/签字/Runbook/灾备/真人责任链 **可运营、可恢复、可问责** — **不**等于经济验收已全部真人闭环。

---

## A · Authority Matrix（最终权限矩阵）

**链上真源（GovFreeze V2 · ② 已部署 · 不重复功能 PASS）：**

| 组件 | 控制面 | Sepolia 锚 |
|------|--------|------------|
| V2 Timelock | `admin`=Safe · `governor` queue · **48h** · `execute`=公开 | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` |
| Legacy Timelock | Ledger **owner** · `schedule`/`execute` NetProfit batch | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` |
| Governor | 提案 · 投票 · queue → V2 TL | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` |
| GovernanceTreasury | **onlySpender** = V2 Timelock | `0x6a83…`（env SSOT） |
| DE NetProfit Ledger | **owner** = Legacy TL · `globalTreasury` = V2 TL | `0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa` |

### A.1 角色 × 九问（运营/责任 · 缺口优先）

| 角色 | 1 拥有权限 | 2 谁能签字 | 3 恢复系统 | 4 暂停 | 5 动 Treasury | 6 动 Country Pool | 7 执行 Timelock | 8 事故处理 | 9 财务对账 | ② 签字/名册 | 缺口 |
|------|------------|------------|------------|--------|---------------|-------------------|-----------------|------------|------------|-------------|------|
| **Owner（产品/合规）** | 阶段闸 · 维护窗 · Phase B unpause | Phase①/③ 模板 · **无 TTG 治理 POL 签字** | 授权 Runbook 编写 · **无 REC 签字** | **不能**链上直暂停 | **不能** | **不能** | **不能**代 Safe | 最终批准人（08-4 代号）· **未绑 TTG** | 批准四账口径 · **无 standing 签字** | Solo 索引 · **缺 TTG 专项** | **P0** |
| **Safe 多签（V2 TL admin + Legacy 路径）** | `schedule` · `setAllowedExecutionTarget` · Legacy owner 批 | **须** N-of-M · **名册未登记** | Safe 社交恢复 · **无 drill** | 间接：`settlementPaused` via schedule | 间接：`Treasury.spend` via execute | 间接：Ledger epoch batch | **admin schedule** + 任何人 **execute**（到期后） | **应为** SEV-1 链上批准 · **无 TTG 表** | **不**做 ERP 对账 | env `TIMELOCK_ADMIN_ADDRESS` · **无人名** | **P0** |
| **Treasury Operator（链下）** | 编 calldata · 触达 Safe UI · **无链上 key** | **未定义** | 重 schedule · **无 SOP** | **不能** | **不能**直 spend | **不能**直 split | 协助 Safe schedule | 协助 incident · **无 RACI** | 协助 Treasury 子账 · **无分工** | SSOT 一词 · **无 POL-01** | **P0** |
| **Finance Operator（链下）** | ERP→accrual calldata · **`fundingSource` EOA** | **未定义** | 密钥轮换 · **无 REC-07** | **不能** | pull USDC to Ledger · **非** Treasury spend | `fundLedgerForSplit` 资金准备 | **不能** execute TL | 发现账实不符 · **无 escalation** | **主责** ERP↔accrual · **无签字轮次** | accounting spec · **无名册** | **P0** |
| **Governor Proposer / Voter** | 持 TTG · 提案/投票/委托 | 冲突披露 SSOT · **无 UI 强制** | 新提案 counter · **无 POL-07** | **不能** | **不能** | **不能** | queue only · **不能** admin schedule | **不能** | **不能** | — | P1 |
| **Timelock Executor（任意 EOA）** | 到期后 `execute` | 无需签字 | 重试 execute · **无 RB-G-01** | **不能** | 仅执行已 queue payload | 同左 | **公开 execute 面** | 报告 `CallFailed` · **无通道** | **不能** | 设计公开 · **无监控 Owner** | **P0** |
| **Platform Admin** | Seat 审核 · 控制台 RBAC · 治理读面 | ADM-U02 角色变更审批 · **与链上无联动** | 恢复审核队列 · **无链上恢复** | **不能**（Escrow Pause 别轨） | **不能** | 写 DB 申请态 · **不能** split | **不能** | Moderation · **无 TTG incident 角色** | 读 admin observability · **非** ERP | L7 机读 · **无 SoD POL-06** | P1 |
| **Active Steward** | 辖区治理 · stake | 辞任 notice · **未验** | `requestRelease` · **无 runbook** | **不能** | **不能** | **不能** 直收 45% | **不能** | 报告辖区 · **无表** | **不能** | — | P1 |
| **Moderator** | 内容 moderation | — | — | **不能** | **不能** | **不能** | **不能** | 内容 incident · **非** treasury | **不能** | — | P2 |
| **SRE / On-call** | API/Indexer/PG | PRODUCTION-INCIDENT 模板 | 通用 DR · **无 CPNP 节** | Escrow/FeeRouter pause 别轨 | **不能** | **不能** | **不能** | **平台** incident · **未含 TTG Safe** | Indexer reconcile · **无治理表 SOP** | DR-06 PASS 平台级 | P1 |
| **Indexer / API（系统）** | 只读投影 | — | replay/tick | **不能** | **不能** | 读 chain · **CPNP decoder 缺** | **不能** | 告警 | 四账探测 · **DB 未闭** | — | P1 |

### A.2 九问汇总（设计 vs 运营就绪）

| # | 问题 | 链上/SSOT 答案 | 运营就绪 | 缺口 |
|---|------|----------------|----------|------|
| 1 | **谁拥有什么权限** | §A.1 + [ttg-allocation-permissions-flows-ssot-v1 §5](ttg-allocation-permissions-flows-ssot-v1.md) | **缺 signed POL + Safe 名册** | **P0** |
| 2 | **谁能签字** | Safe N-of-M · Owner 阶段签 · Finance/Treasury Operator **未命名** | **无 TTG 治理签字矩阵** | **P0** |
| 3 | **谁能恢复** | TL execute · Safe 恢复 · counter-proposal | **REC-01～08 均未签字发布** | **P0** |
| 4 | **谁能暂停** | Ledger `settlementPaused`（Legacy TL owner）· **非** Admin | **无 RB-G-04 · 无批准人** | **P0** |
| 5 | **谁能动 Treasury** | **仅** V2 TL `spend` · GOV-01 cap | **误转无 SOP · Operator 名册无** | **P0** |
| 6 | **谁能动 Country Pool** | Legacy TL owner batch · Governor 路径（V2 queue） | **双 TL 矩阵 RB-G-09 无** | **P0** |
| 7 | **谁能执行 Timelock** | 任何人（到期）· schedule=Safe admin 或 Governor | **Execute 失败无 Owner** | **P0** |
| 8 | **谁负责事故** | 08-4/RUNBOOK plant · **未绑 TTG** | **POL-08 + RACI 缺失** | **P0** |
| 9 | **谁负责财务对账** | Finance Operator（设计）· CP HAT 脚本 | **无 standing 轮次 · 无 ERP 签字** | **P1** |

---

## B · Operations Runbook Matrix（运营手册矩阵）

| ID | 运营域 | 应有内容 | 现有文档 | 签字 Owner | 状态 | 缺口 |
|----|--------|----------|----------|------------|------|------|
| **OPS-01** | 日常治理提案/投票/queue | RACI · 披露 · 监控 | HAT-R1 runbook（happy path） | — | **缺** | P1 |
| **OPS-02** | Timelock schedule（Safe） | 双 TL 矩阵 · calldata 审查 | RB-G-09 占位 | Safe 名册 | **缺失** | **P0** |
| **OPS-03** | Timelock execute | ETA · CallFailed 分诊 | RB-G-01 占位 | On-call + Safe | **缺失** | **P0** |
| **OPS-04** | Treasury spend / P4 cap | 金额 · cap · 收款校验 | Tokenomics SSOT · **无 ops** | Treasury Operator | **缺失** | **P0** |
| **OPS-05** | Country Pool epoch 批处理 | open→accrue→close→fund→split | architecture §7.3 · **无 ops 版** | Finance + Treasury Op | **缺 ops 版** | **P0** |
| **OPS-06** | settlementPaused | 触发/解除/公告 | contract only | Safe + Owner | **缺失** | **P0** |
| **OPS-07** | fundingSource 密钥 | 保管/轮换/泄露 | RB-G-07 占位 | Finance Operator | **缺失** | **P0** |
| **OPS-08** | Four-Ledger standing | 周期 reconcile · FAIL 分诊 | CP HAT 一次性 · REC-06 未发布 | Finance + SRE | **缺模板** | P1 |
| **OPS-09** | Admin Seat→链上 Q-01 | Admin 审核与 Timelock 批次 | state-machine · **无 E2E ops** | Admin + Treasury Op | **缺失** | P1 |
| **OPS-10** | 人机验收 | 录屏 · signoff | acceptance-only · prep 清单 | Owner | **未签** | **P0** |
| **OPS-11** | Buyback/Burn | TWAP · 深度 · 审批 | GOV-02 SSOT · RB-G-08 | Owner + Safe | **缺失** | P1 |
| **OPS-12** | 平台 incident 衔接 | TTG 链上事故升级 | PRODUCTION-INCIDENT（通用） | On-call | **未扩展** | P1 |

---

## C · Disaster Recovery Matrix（灾备矩阵）

| ID | 灾难场景 | RTO/RPO | 恢复主体 | Runbook | ② drill | ③ 前 | 缺口 |
|----|----------|---------|----------|---------|---------|------|------|
| **DR-01** | Safe 签名人不可用 | **未定义** | Safe 备份 signer | RB-G-02 | **无** | 硬阻塞 | **P0** |
| **DR-02** | Safe 完全丢失 | **未定义** | 社交恢复 | — | **无** | 硬阻塞 | **P0** |
| **DR-03** | Treasury Operator 密钥丢失 | **未定义** | 轮换 + Safe | RB-G-07 | **无** | 硬阻塞 | **P0** |
| **DR-04** | fundingSource 泄露/丢失 | **未定义** | 新 EOA + approve | REC-07 | **无** | 硬阻塞 | **P0** |
| **DR-05** | Execute CallFailed / 错 payload | **未定义** | 模拟 + 新提案 | REC-01 | **无** | 硬阻塞 | **P0** |
| **DR-06** | Treasury 误转账 | **不可逆** | 法律 + 治理公告 | REC-05 | **无** | 硬阻塞 | **P0** |
| **DR-07** | Split 中断 | **未定义** | epoch 状态机续跑 | REC-03 | **无** | 硬阻塞 | P1 |
| **DR-08** | settlementPaused 误触 | **未定义** | 解除 + 四账 | REC-04 | **无** | 硬阻塞 | **P0** |
| **DR-09** | Four-Ledger 漂移 | 检测已有 | env/API/indexer | REC-06 | 一次事件 | standing | P1 |
| **DR-10** | Indexer CPNP 丢块 | **未定义** | replay + backfill | REC-08 | **无** | 硬阻塞 | P1 |
| **DR-11** | DB 治理表损坏 | staging 通用 DR | pg_restore | INFRA B-475 | staging only | prod drill | P1 |
| **DR-12** | Governor 升级失败 | **未定义** | proxy rollback | G24-P-UPGRADE | **无** | 启用升级前 | P1 |
| **DR-13** | RPC 故障 | **未定义** | RPC 切换清单 | — | **无** | — | P2 |

---

## D · Human Walkthrough Matrix（真人体验矩阵）

| ID |  walkthrough | 目的 | 执行入口 | 签字产物 | 状态 | 缺口 |
|----|--------------|------|----------|----------|------|------|
| **HW-01** | GovFreeze V2 录屏 A1～D4 | 认知/多身份/Admin/收益 | `run-govfreeze-v2-human-screen-acceptance-prep.sh` | `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` | **全 ☐** | **P0** |
| **HW-02** | Enterprise HAT L1～L9 真人 | 业务/权限/资金体验 | `record-tt-governance-enterprise-hat-signoff.sh` | `HUMAN-ENTERPRISE-HAT-SIGNOFF.json` | 机读 prep · **真人签分离** | P1 |
| **HW-03** | HAT-R1 Phase B 真人钱包 | Execute→Spend→Unstake 责任确认 | `run-hat-r1-phase-b-when-ready.sh` | Phase B 五层证据 | **PAUSED** | **P0** |
| **HW-04** | Safe 操作 walkthrough | schedule/execute 双人复核 | — | Safe 操作录屏 | **未规划** | **P0** |
| **HW-05** | Finance 对账 walkthrough | ERP↔链↔API 月结 | — | 对账签字页 | **未规划** | P1 |
| **HW-06** | Incident 桌演 | Safe 不可用 / 误 spend | — | 桌演纪要 | **未规划** | **P0** |
| **HW-07** | ③ 异名双人 TTG incident | Production 批准链 | POL-08 | 签字 | **未定义** | **P0**（③） |

**说明：** HW-01/03 为 **② Governance Production Ready 硬闸**；HW-07 为 **③ 全站 Production GO** 硬闸。

---

## E · Production Blocking Items（Governance 域）

| 优先级 | ID | 阻塞项 | 类型 |
|--------|-----|--------|------|
| **P0** | **BLK-01** | Signed **Authority Matrix**（POL-01～05 + Safe 名册 + 双 Timelock RB-G-09） | 权限 |
| **P0** | **BLK-02** | Published **RB-G-01～05** + **REC-01～05**（链上资金类灾备） | Runbook |
| **P0** | **BLK-03** | **HW-01** 录屏 signoff + **HW-03** Phase B 闭环证据 | 真人 |
| **P0** | **BLK-04** | **HW-04/06** Safe + incident 桌演（至少 1 次） | 真人 |
| **P0** | **BLK-05** | **POL-08** TTG 链上 SEV-1 批准人（③ 须异名双人） | 责任 |
| **P0** | **BLK-06** | settlementPaused **RB-G-04** + 批准链签字 | 暂停 |
| **P1** | **BLK-07** | **OPS-08** Four-Ledger standing + Finance 对账轮次（HW-05） | 财务 |
| **P1** | **BLK-08** | **REC-06～08** + CPNP indexer 运维节 | 恢复 |
| **P1** | **BLK-09** | **OPS-09** Admin→链上 Active Seat ops + POL-06 SoD | 权限 |
| **P1** | **BLK-10** | **HW-02** Enterprise 真人 signoff 与机读分离 | 真人 |
| **P2** | **BLK-11** | RPC 切换 · solo-quorum 监控 · 并发 spend SOP | 运维 |
| **P2** | **BLK-12** | Ledger owner 迁移决策记录（legacy vs V2 长期） | 架构决策 |

---

## F · Production GO Checklist（Governance Production Ready）

**用法：** 全部 **P0** ☑ 方可宣称 **Governance Production Ready（② 测试网治理运营）**；**≠** ③ 主网/Production GO。

### F.1 权限与签字（P0）

| ☐ | 项 |
|---|-----|
| ☐ | **POL-01** Treasury Operator 名册 + 备份 + 轮换（Owner 签字） |
| ☐ | **POL-02** Finance Operator / `fundingSource` EOA 分离 + 无链上 Treasury 私钥 |
| ☐ | **POL-03** Safe 签名人名单 · 阈值 · 离职 24h 换签 |
| ☐ | **POL-04** Legacy TL `schedule` vs V2 Governor `queue` 边界表（RB-G-09） |
| ☐ | **POL-05** `settlementPaused` 双签批准链（Safe + Owner） |
| ☐ | **POL-06** Admin Seat 审核 SoD（不得自批 split 资格） |

### F.2 Runbook 与灾备（P0）

| ☐ | 项 |
|---|-----|
| ☐ | **RB-G-01** Execute / CallFailed 分诊 + Owner |
| ☐ | **RB-G-02** Safe 停滞 / 签名人不可用 |
| ☐ | **RB-G-03** Country Pool split 中断（ops 版） |
| ☐ | **RB-G-04** settlementPaused 触发与解除 |
| ☐ | **RB-G-05** Treasury 误转账 / 错误 spend |
| ☐ | **REC-01～05** 与 Runbook 交叉引用 · 版本号 |

### F.3 真人责任链（P0）

| ☐ | 项 |
|---|-----|
| ☐ | **HW-01** G24-HUMAN-UAT 全清单 ☑ + 录屏 + signoff |
| ☐ | **HW-03** HAT-R1 Phase B 五层证据 + Owner unpause 记录 |
| ☐ | **HW-04** Safe schedule/execute 双人 walkthrough 录屏 |
| ☐ | **HW-06** 至少 1 次 TTG governance incident 桌演纪要 |

### F.4 财务与观测（P1 · ③ 前必 ☑）

| ☐ | 项 |
|---|-----|
| ☐ | **OPS-08** / **REC-06** Four-Ledger standing 模板 + 周期 Owner 签字 |
| ☐ | **HW-05** ERP↔链↔API 对账 walkthrough |
| ☐ | **REC-08** CPNP indexer replay 节 + 治理投影表 DR |
| ☐ | **PRO-DR-09** Prod PG backup 含 governance 表 |

### F.5 ③ 全站 Production GO 附加（非 ② Governance Ready）

| ☐ | 项 |
|---|-----|
| ☐ | **POL-08** 异名双人 TTG SEV-1 批准人 |
| ☐ | **PRO-DR-08** KYC/LEG + 08-4 TTG Treasury 终极控制路径 |
| ☐ | 主网部署闸 · Production PSP · ISS-007 全矩阵（见根 go-live） |

---

## 距离 Governance Production Ready 还差什么

**当前裁定：** **NOT Governance Production Ready**（② 测试网治理 **运营/责任/灾备** 层未闭）

### 已具备（不展开 PASS 细节）

- 链上权限 **模型** 与 GovFreeze V2 地址冻结 · Four-Ledger 检测能力 · 经济基线文档 · 验收轨脚本入口

### P0（必须先闭 · 12 项）

1. **BLK-01** Signed Authority + Safe 名册 + **双 Timelock 矩阵**  
2. **BLK-02** RB-G-01～05 + REC-01～05 **发布并签字**  
3. **BLK-03** HW-01 录屏 signoff  
4. **BLK-03** HW-03 Phase B 闭环（Execute→Spend→Unstake）  
5. **BLK-04** HW-04 Safe walkthrough  
6. **BLK-04** HW-06 incident 桌演  
7. **BLK-05** POL-08 草案（② 可 Owner 单人 · ③ 升级异名双人）  
8. **BLK-06** settlementPaused RB-G-04 + POL-05  
9. Treasury Operator / Finance Operator **具名签字**（POL-01/02）  
10. Timelock execute 失败 **Owner/on-call**（RB-G-01）  
11. Treasury 误转 **无撤回** 的应急公告链（RB-G-05）  
12. **禁止** 在无 POL/RB 情况下以 Solo Maintainer 索引冒充 Production 治理问责  

### P1（Governance Ready 后 · ③ 前）

- Four-Ledger standing（OPS-08/REC-06）· ERP 对账 walkthrough · CPNP indexer DR · Admin→链上 Seat ops · Enterprise 真人 signoff 分离 · Buyback/Burn ops  

### P2（不挡 ② Governance Ready · 宜登记）

- RPC 清单 · solo-quorum 监控 · legacy Ledger owner 长期决策文档化  

---

## 诚实边界

| 陈述 | 真伪 |
|------|------|
| Four-Ledger PASS + Enterprise L9 recheck | **② 经济读面已锁** · **≠** 治理运营 Ready |
| Solo Maintainer（Sebastian Ward）签字 | **①/阶段闸** · **≠** Safe 多签运营名册 |
| 完成 F.1～F.3 全部 P0 | 可宣称 **② Governance Production Ready** |
| ② Governance Ready | **仍 ≠** ③ Production GO · 主网 · KYC · prod infra |

**下一合法动作（无设计变更）：** 执行 [TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md](../../runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md) §5 P0 → **GORP-SIGNOFF**

**交叉引用：** [TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md](../../runbook/TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md) · Gate-2.4 **G24-PROD-READY-01** · **G24-GORP-01**
