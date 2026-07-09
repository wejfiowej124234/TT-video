# TTG Governance Operations & Disaster Recovery Audit

**Audit ID:** `TTG-GOV-OPS-DR-AUDIT`  
**Version:** v1-20260616  
**Phase:** **② Sepolia · GovFreeze V2 + Four-Ledger PASS** · **≠ ③ Production GO**  
**Method:** 只读盘点 · **不验证正常流程** · **未**新增开发/功能/链上部署  
**Inputs:** [TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md](TTG-GOVERNANCE-FULL-COVERAGE-MATRIX.md) · [TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md](TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md) · Enterprise HAT · HAT-R1 · CP Revenue HAT · GovFreeze V2  

**诚实边界：** Escrow/FeeRouter **Pause**（`08-4` §6 · `ops/RUNBOOK.md`）**≠** Governance Treasury / Country Pool NetProfit 运维面；本审计 **不** 将平台 Pause 冒充治理灾备已闭。

---

## A · Governance Failure Matrix

| 场景 | 预期链上/系统行为 | ② 异常验证 | 恢复路径（文档/设计） | 缺口 |
|------|-------------------|------------|------------------------|------|
| **Proposal 创建失败** | `GovBadState` · 参数/权限不足 revert | **未验证** live 对抗（仅 ① contract test + Phase A 成功路径） | 修正 calldata · 重提 · 无专用 runbook | P1 |
| **Vote 失败** | `GovBadState`（窗口外/已投/weight=0） | **部分** · 未系统性测 Against/Abstain/重复投 | 等待 vote 窗口 · 无 incident runbook | P1 |
| **Queue 失败** | `GovBadState`（非 Succeeded） | **已验证** · HAT-R1 提前 queue 复现 | 等待 vote 结束再 queue · HAT-R1 runbook 一句 | P2 |
| **Execute 失败** | `TooEarly` · `CallFailed` · `UnknownOperation` | **未验证** ②（Phase B PAUSED） | 检查 ETA · 重模拟 calldata · **无** governance execute 故障 runbook | **P0** |
| **Timelock 卡死** | Safe/admin 不可用 · 队列堆积 · `OperationExists` | **未验证** | 依赖 Safe 签名人恢复 · **无** RTO/RPO · **无** 备用 admin 演练 | **P0** |
| **Governor 升级失败** | Proxy upgrade revert · storage clash | **未验证** ② rollback 演练 | [G24-P-UPGRADE-01](G24-P-UPGRADE-01-proxy-architecture-gate.md) 设计 · **无** 失败回滚 SOP | P1 |
| **Proposal Payload 错误** | `CallFailed` on execute · 资金未动 | **未验证** ② | 新提案 counter-action · **无** 「错误 payload 已 queue」应急表 | **P0** |

---

## B · Treasury Failure Matrix

| 场景 | 预期行为 | ② 异常验证 | 恢复路径 | 缺口 |
|------|----------|------------|----------|------|
| **Treasury Spend 失败** | `onlySpender` · insufficient balance revert | **未验证** live tx | Phase B 计划路径 · **无** spend 失败 runbook | **P0** |
| **USDC 不足** | transfer revert · `CallFailed` | **①** forge · **② 未** | 补款 · 重提案 · Finance 对账 | P1 |
| **Treasury 地址错误** | `setSettlementParams` / env 错配 | cutover **成功路径** 已证 · **错误地址未演练** | 治理 `setSettlementParams` via legacy TL · 四账 reconcile | P1 |
| **错误收款地址** | spend to 错 EOA | **未验证** | **无** 链上撤回 · 须治理 counter-spend/法律追索 · **无** runbook | **P0** |
| **超过 GOV-01 30% cap** | `P4CapExceeded` | **①** `TtgGovFreezeV1Enforcement.t.sol` · **② 未** tx | 缩小 spend 金额 · 新提案 · **无** ops 表 | P1 |
| **多笔 Spend 并发** | cap 累计 ·  nonce/ earmark 竞态 | **未验证** | SSOT earmark 规则 · **无** 并发 SOP | P2 |

---

## C · Country Pool Failure Matrix

| 场景 | 预期行为 | ② 异常验证 | 恢复路径 | 缺口 |
|------|----------|------------|----------|------|
| **无 Active Steward** | 45% → `UnallocatedStewardPathVault` | **已验证** · DE cutover drill | `releaseUnallocated` 须 **独立治理提案** · **未测** | P1 |
| **多 Steward** | Q-01 唯一 Active · 链上 registry | **未验证** ② 对抗 | Admin+Timelock `setActiveStewardConfig` · **无** E2E | P1 |
| **Steward 被移除** | suspend / 辞任 · split 快照 | **未验证** mid-epoch 移除 | 同事务 batch：`setActiveStewardConfig→fund→split`（架构 §7.3）· **未演练** | P1 |
| **Split 中断** | `SplitNotFunded` · `InsufficientLedgerBalance` · `TransferFailed` | **①** forge · **② 未** 注入故障 | 补 fund · 重 `fundLedgerForSplit` · **无** runbook | P1 |
| **Split 重复执行** | `EpochNotSplitPending` / 状态机 guard | **①** forge · **② 未** | 链上状态只读确认 · **无** ops 检查表 | P2 |
| **Vault 地址错误** | deposit revert · 资金卡 Ledger | **未验证** 错误 vault 配置 | Timelock `setSettlementParams` · cutover 仅测 **正确** 路径 | P1 |
| **Ledger 配置错误** | bps/globalTreasury/owner 错 | legacy TL owner **文档化** · **错误配置未演练** | Safe→legacy TL schedule · 双 Timelock 易误操作 | P2 |
| **Settlement 暂停** | `settlementPaused` → `SettlementPausedErr` | **未验证**（**无 forge test**） | owner=legacy TL 可 pause · **谁/何时/如何恢复 无 runbook** | **P0** |

---

## D · Identity & Permission Failure Matrix

| 场景 | 影响 | ② 验证 | 恢复路径 | 缺口 |
|------|------|--------|----------|------|
| **Admin 离职** | 控制台 RBAC · Seat 审核停滞 | **未验证** governance 域 | ADM-U02 角色变更审批 · **与链上 Timelock 无自动联动** | P1 |
| **Treasury Operator 丢失私钥** | 无法 schedule legacy TL batch | **未验证** | **无** 密钥轮换 SOP · **无** 备用 Operator 登记 | **P0** |
| **Safe Signer 离职** | 无法 schedule/execute | **未验证** | Safe 换签 · **无** governance 专用 Safe 名册 runbook | **P0** |
| **单 Signer 不在线** | 阈值未达 | **未验证** | 等待其他 signer · **无** RTO | P1 |
| **多签无法达到阈值** | Timelock 全面停滞 | **未验证** | Safe 治理换签（链下）· **无** 演练证据 | **P0** |
| **Steward 失联** | 180d resign 未走 · stake 锁定 | **未验证** | `requestRelease` / Admin suspend · API **NOT TESTED** | P1 |
| **Steward 恶意行为** | 错误 accrual · 治理 spam | **未验证** | Admin suspend → `setActiveStewardConfig` via TL · **无** incident 表 | P1 |

---

## E · Financial Recovery Matrix

| 场景 | 检测手段 | ② 验证 | 恢复路径 | 缺口 |
|------|----------|--------|----------|------|
| **链上 ≠ API** | four-ledger reconcile · CP HAT | **已验证检测+修复** · `chain/mod.rs` NET_PROFIT 优先级 | 修 env/API · 重跑 reconcile · **无** 正式 incident 记录 | P2 |
| **API ≠ DB** | indexer reconcile · admin observability | **未验证**（DB skipped） | `internal-indexer-ops reconcile` · **无** governance 表专用 SOP | P1 |
| **DB 损坏** | PG 健康 · backup | staging DR **PASS**（通用）· **治理表无专项** | `pg_dump` restore · [PRODUCTION-INFRA DR](PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md) | P1 |
| **Indexer 丢块** | lag/reorg 告警 | **部分** · CPNP decoder **缺失** | replay/tick · [PRODUCTION-INCIDENT-RESPONSE.md](../../runbook/PRODUCTION-INCIDENT-RESPONSE.md) · **无** NetProfit 投影 | P1 |
| **RPC 提供商故障** | read fail · tx stuck | **未验证** governance 切换 | 切换 RPC · **无** 多 RPC 治理 ops 清单 | P2 |
| **Four-Ledger 不一致** | `four-ledger-reconcile.json` FAIL | **已验证** 一次 FAIL→fix→PASS 事件 | 见 CP Revenue HAT · **无** Standing runbook 模板 | P2 |

---

## F · Governance Recovery Procedures

| 问题 | SSOT/设计答案 | ② 演练 | 缺口 |
|------|---------------|--------|------|
| **如何暂停** | Ledger: `setSettlementPaused(true)` · owner=**legacy Timelock**；Escrow/FeeRouter: 别轨 Pause | **未演练** | **无** TTG 治理暂停一页 SOP | **P0** |
| **谁能暂停** | Ledger **owner**（legacy TL via Safe）；**非** Admin API；**非** Moderator | 文档+合约 · **无** 名册 | **缺失权限策略** | **P0** |
| **谁不能暂停** | Governor 直调 Ledger · Admin · Steward · Traveler | 机读 PASS · **无** 事故表 | P2 |
| **如何恢复** | `setSettlementPaused(false)` + 重跑 fund/split batch；错误 spend **不可** admin 撤回 | **未验证** | **缺失恢复流程** | **P0** |
| **恢复需哪些签名** | Safe 阈值 → legacy TL `schedule` → 48h → `execute`（V2 TL 为 globalTreasury 收款） | cutover **成功路径** only | 双 Timelock 签名矩阵 **未文档化** | **P0** |
| **是否需要 Timelock** | 是（Ledger mutating · Treasury spend · 参数） | 设计 YES · **失败路径 NO** | P1 |
| **是否需要治理提案** | Governor queue 路径 vs admin `schedule`（运维 batch） | 架构 §7.3 双路径 · **边界未 ops 化** | P1 |

---

## G · Production Disaster Recovery

| 灾难 | 设计缓解 | ② 演练 | Runbook | 缺口 |
|------|----------|--------|---------|------|
| **Timelock 私钥丢失** | Timelock 无单私钥 · **admin=Safe** | **未** | **缺失** · 仅 Safe 社交恢复 | **P0** |
| **Safe Owner 丢失** | Safe 社交恢复 / 预设备份 signer | **未** | **缺失** governance Safe 名册 | **P0** |
| **Treasury Operator 丢失** | 密钥轮换 · 备用 EOA | **未** | **缺失** | **P0** |
| **Governor 升级失败** | Proxy rollback 窗口 | **未** | G24-P-UPGRADE 设计 · **无** DR | P1 |
| **Country Pool 配置错误** | `setSettlementParams` 治理修正 | cutover 正向 · **无** 回滚 drill | **缺失** | P1 |
| **Treasury 误转账** | **不可逆** · 治理 counter · 法律 | **未** | **缺失** · 08-4 终极控制图未覆盖 TTG Treasury | **P0** |
| **错误 Buyback** | GOV-02 + TWAP 规则 | **未** | **缺失** | P1 |
| **错误 Burn** | 治理提案不可逆 | **未** | **缺失** | P1 |

---

## 1 · 已验证（异常/恢复 · 不列正常 PASS）

| ID | 场景 | 证据 | 阶段 |
|----|------|------|------|
| **DR-V-01** | Queue 在 vote 未结束 → `GovBadState` | HAT-R1 Phase A fix · M-070 | ② |
| **DR-V-02** | Timelock `TargetNotAllowed`（未 allowlist target） | `T-GOV-01` forge · cutover `setAllowedExecutionTarget` 运维修复 | ① + ② ops |
| **DR-V-03** | 无 eligible Steward → 45% Unallocated（非 Global 吞并） | cutover-drill `20260616T082259Z` | ② |
| **DR-V-04** | Four-Ledger 不一致 **检测** → API env 修复 → PASS | `20260616T084248Z` 前后 · `chain/mod.rs` | ② |
| **DR-V-05** | Primary Market USDC=0 → 购买失败（不 silent pass） | HAT-R1 skip purchase note | ② |
| **DR-V-06** | `CloseTooEarly` / `SplitNotFunded` / `InsufficientLedgerBalance` revert | `CountryPoolNetProfitLedger.t.sol` | ① only |
| **DR-V-07** | Timelock `TooEarly` on execute | `GovernanceTimelock.t.sol` | ① only |
| **DR-V-08** | `P4CapExceeded` on overspend | `TtgGovFreezeV1Enforcement.t.sol` | ① only |
| **DR-V-09** | Legacy env rollback 拒绝 | `assert-gov-freeze-v2-active-baseline-only.sh` | ② |

---

## 2 · 未验证（异常/灾备 · 按矩阵 A～G）

| 优先级 | 未验证簇 |
|--------|----------|
| **P0** | Execute 失败 · Timelock 卡死 · 错误 payload 已 queue · Treasury spend/误转账 · settlementPaused · Safe/Operator 密钥丢失 · 多签阈值不可达 · Production 误操作无 SOP |
| **P1** | Proposal/Vote 失败全集 · Governor 升级失败 · USDC 不足 live · 多 Steward/移除 · Split 中断 ② · Vault/Ledger 配错 · Admin/Steward 人事 · API≠DB · Indexer CPNP · DB 治理表 restore |
| **P2** | 并发 spend · 重复 split ② · RPC 切换 · Solo quorum 监控 |

---

## 3 · 缺失 Runbook

| ID | 应有 Runbook | 现有最接近文档 | 状态 |
|----|--------------|----------------|------|
| **RB-G-01** | Governance Execute 失败 / `CallFailed` 分诊 | HAT-R1 runbook（仅 happy path） | **缺失** |
| **RB-G-02** | Timelock / Safe 停滞 · 签名人不可用 | — | **缺失** |
| **RB-G-03** | Country Pool split 中断（fund/pull/transfer） | architecture §7.3 · accounting spec | **缺 ops 版** |
| **RB-G-04** | `settlementPaused` 触发与解除 | contract only | **缺失** |
| **RB-G-05** | Treasury 误转账 / 错误 spend | — | **缺失** |
| **RB-G-06** | Four-Ledger 不一致 standing 响应 | CP Revenue HAT（一次性） | **缺模板** |
| **RB-G-07** | Finance Operator / fundingSource 密钥轮换 | Attack Surface EVD-07 占位 | **缺失** |
| **RB-G-08** | Buyback/Burn 错误执行 | TTG-TOKENOMICS §GOV-02 TWAP | **缺失** |
| **RB-G-09** | 双 Timelock（legacy owner vs V2 treasury）运维 | GOV-FREEZE-V2 acceptance-only 一句 | **缺失** |
| **RB-G-10** | Governance 域 Indexer replay | PRODUCTION-INCIDENT（通用 indexer） | **缺 CPNP 节** |

*平台级：* [PRODUCTION-INCIDENT-RESPONSE.md](../../runbook/PRODUCTION-INCIDENT-RESPONSE.md) · [ops/RUNBOOK.md](../../ops/RUNBOOK.md) **不覆盖** TTG Treasury/Governor/NetProfit 链上灾备。

---

## 4 · 缺失权限策略

| ID | 策略 | 现状 |
|----|------|------|
| **POL-01** | Treasury Operator 名册 · 备份 · 轮换 | 未定义 |
| **POL-02** | Finance Operator / `fundingSource` EOA 与 Treasury 分离 | SSOT 一句 · 无 RBAC |
| **POL-03** | Safe 签名人最低人数 · 离职 24h 内换签 | 未定义 |
| **POL-04** | 谁可调用 legacy TL `schedule` vs V2 Governor queue | 架构分散 · 无矩阵 |
| **POL-05** | 谁可 `setSettlementPaused` · 须几人批准 | owner=legacy TL · **无** 人名/阈值 |
| **POL-06** | Admin 不得自批 Seat 与 split 资格（SoD） | 代码门闸 partial · **无** 策略文 |
| **POL-07** | 错误 governance tx 的 counter-proposal 审批链 | 未定义 |
| **POL-08** | Production ③ 治理 incident 批准人（异名双人） | 08-4 / RUNBOOK plant 代号 · **未绑 TTG** |

---

## 5 · 缺失恢复流程

| ID | 流程 | 依赖 |
|----|------|------|
| **REC-01** | Execute `CallFailed` → 模拟 → 新提案 → 是否需 counter-spend | RB-G-01 |
| **REC-02** | Safe 不可用 → 社交恢复 → 重 schedule 积压 batch | RB-G-02 |
| **REC-03** | Split 半完成 → 链上 epoch 状态机读数 → 续 fund/split | RB-G-03 |
| **REC-04** | settlementPaused → 根因 → 解除 → 四账重跑 | RB-G-04 |
| **REC-05** | 误转账 → 链上冻结/法律 → 治理公告模板 | RB-G-05 |
| **REC-06** | four-ledger FAIL → env/API/indexer/chain 分诊树 | RB-G-06 |
| **REC-07** | fundingSource 密钥泄露 → 轮换 EOA → approve 重绑 | RB-G-07 |
| **REC-08** | Indexer CPNP 丢事件 → backfill decoder → DB 重投影 | RB-G-10 |

**② 已发生但未流程化：** DR-V-04（API env 修复）应沉淀为 REC-06 模板。

---

## 6 · Production（③）前必须补齐项

| ID | 项 | 阻塞性质 |
|----|-----|----------|
| **PRO-DR-01** | RB-G-01～05 + REC-01～05（链上资金类） | **硬阻塞** |
| **PRO-DR-02** | POL-01～05 + Safe/Operator 名册签字 | **硬阻塞** |
| **PRO-DR-03** | ② Phase B Execute+Spend **失败路径** 至少一次 drill | **硬阻塞** |
| **PRO-DR-04** | settlementPaused 演练 + RB-G-04 | **硬阻塞** |
| **PRO-DR-05** | CPNP Indexer + REC-08 + four-ledger standing（REC-06） | **硬阻塞** |
| **PRO-DR-06** | 双 Timelock 运维矩阵 RB-G-09 | ② 决策后 **③ 前** |
| **PRO-DR-07** | Buyback/Burn 错误执行 RB-G-08 | 启用该功能前 |
| **PRO-DR-08** | ③ KYC/LEG + 08-4 终极控制路径含 TTG Treasury | 法务闸 |
| **PRO-DR-09** | Prod PG backup/restore 含 governance 投影表 | INFRA B-475 |

---

## 7 · P0 / P1 / P2 排序（合并）

### P0

- A: Execute 失败 · Timelock 卡死 · Payload 错误已 queue  
- B: Spend 失败 · 误收款地址 · （cap ② 未 live）  
- C: `settlementPaused` 无 runbook/无测试  
- D: Treasury Operator / Safe 密钥/阈值丢失  
- F: 暂停/恢复/签名矩阵全缺失  
- G: Safe/Treasury Operator 丢失 · Treasury 误转账  
- RB-G-01～05 · POL-01～05 · REC-01～05 · PRO-DR-01～04  

### P1

- A: Proposal/Vote 失败 · Governor 升级失败  
- B: USDC 不足 live · 地址错误 · cap live  
- C: 多 Steward · 移除 · Split 中断 ② · Vault 错  
- D: Admin/Steward 人事事故  
- E: API≠DB · Indexer · DB 治理表  
- G: CP 配错 · Buyback/Burn 错误  
- RB-G-06～10 缺节 · POL-06～07 · REC-06～08  

### P2

- B: 并发 spend  
- C: 重复 split ② · Ledger 配错文档化  
- E: RPC 切换  
- Attack Surface GOV-CAP-01 监控  

---

## 下一合法动作（② · 无新代码）

1. Owner 签署 **POL-01～05** 与 **RB-G-09** 双 Timelock 矩阵（文档 · 非链上）  
2. Timelock 到期后 Phase B：**刻意**记录 Execute/Spend **失败→重试** 证据（仍属验收轨 · 非新功能）  
3. 将 DR-V-04 固化为 **REC-06** 模板写入 `docs/runbook/`（若 Owner 授权文档-only PR）

**交叉引用：** [TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md](../../runbook/TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md) · [Attack Surface Audit](TTG-GOVERNANCE-ATTACK-SURFACE-OPERATIONAL-COVERAGE-AUDIT.md)
