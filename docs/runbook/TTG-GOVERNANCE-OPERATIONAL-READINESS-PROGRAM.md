# TTG Governance Operational Readiness Program（GORP）

**Program ID:** `TTG-GORP`  
**Version:** v1-20260616  
**Phase:** **② Sepolia · GovFreeze V2 基线** · **≠ ③ Production GO**  
**Discipline:** **停止** 功能开发 · 治理规则修改 · 合约设计讨论 · 功能/代码测试  

**Inputs:** [Production Readiness Closure Audit](../spec/governance-token/TTG-GOVERNANCE-PRODUCTION-READINESS-CLOSURE-AUDIT.md) · GovFreeze V2 · Four-Ledger PASS · Enterprise HAT · [Ops & DR Audit](../spec/governance-token/TTG-GOVERNANCE-OPS-DISASTER-RECOVERY-AUDIT.md)

**Program goal:** 从「测试网功能通过」→「运营团队可接手运行」= **权限清楚 · Runbook 可执行 · 事故可恢复 · 签字链可问责**。

**诚实边界：** 本文 **发布** 运营模板与 RACI · **不** 宣称 Governance Production Ready，直至 **§5 Checklist P0 全 ☑ + Owner 签字**。

---

## 0 · 链上锚（GovFreeze V2 · 只读引用）

| 组件 | 地址 | 运维含义 |
|------|------|----------|
| V2 Timelock | `0x904a6c4c6aab698afbf08ec6151d317c393520cc` | Governor queue · Treasury **onlySpender** · `globalTreasury` 收款 |
| Legacy Timelock | `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` | **DE NetProfit Ledger owner** · NetProfit batch `schedule/execute` |
| Governor | `0x847b00ddb6ffed71812abc358a407dad4b099fcb` | 提案 · 投票 · queue |
| DE NetProfit Ledger | `0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa` | 45/55 split · `settlementPaused` |
| Env SSOT | `scripts/dev/.env.phase2-chain-deploy.local` | 禁止回滚 Legacy 栈 |

**双 Timelock 口诀：** **Legacy TL = 动 Ledger** · **V2 TL = 收 55% + Treasury spend + Governor 队列**

---

## 1 · Authority Matrix（最终版）

### 1.1 RACI 图例

| 列 | 含义 |
|----|------|
| **拥有（O）** | 对该域结果负最终责 |
| **审批（A）** | 签字/多签批准后方可执行 |
| **执行（E）** | 实际操作（Safe UI · 脚本 · 录屏） |
| **复核（R）** | 独立于执行者的二次确认 |
| **负责（C）** | 问责人（事故/对账/阶段闸） |

### 1.2 最终权限矩阵

| 域 | 拥有 O | 审批 A | 执行 E | 复核 R | 负责 C | 链上/系统边界 |
|----|--------|--------|--------|--------|--------|---------------|
| **Governor 提案/投票** | Owner | 冲突披露（提案人） | TTG 持有人 | Treasury Op（calldata 审查） | Owner | Governor · **不能** 直调 Ledger |
| **Timelock queue（治理）** | Owner | Safe ≥N-of-M | Governor（queue） | Treasury Op | Owner | V2 TL · 48h |
| **Timelock schedule（运维 batch）** | Owner | Safe ≥N-of-M | Treasury Operator | Finance Op | Owner | Legacy **或** V2 TL admin · **须** RB-G-09 表 |
| **Timelock execute** | — | — | 任意 EOA（到期） | Treasury Op + Safe 1 人 | On-call | 公开面 · **须** 监控 ETA |
| **Treasury USDC spend** | Owner | Safe + Owner（P4 动用） | V2 TL execute | Finance Op | Owner | **onlySpender**=V2 TL · GOV-01 30% cap |
| **Country Pool epoch** | Owner | Safe（Legacy path batch） | Treasury Op schedule | Finance Op | Finance Op | Legacy TL owner · `[D-4555-B]` 前缀 |
| **Country Pool 暂停** | Owner | Safe + Owner 双签 | Treasury Op schedule | Finance Op | Owner | `setSettlementPaused` · **非** Admin |
| **fundingSource / fund** | Finance Op | Finance Op + Treasury Op | Finance Op EOA | Owner | Finance Op | approve/pull · **非** Treasury spend |
| **Safe 名册/阈值** | Owner | Owner | Safe 治理 | 备份 signer | Owner | 链下 · ③ 须异名双人 |
| **Platform Admin** | Owner | ADM-U02 审批链 | Admin | — | Owner | **不能** Treasury/TL/split |
| **Four-Ledger 对账** | Finance Op | Owner（周期签字） | Finance Op + SRE | Treasury Op | Finance Op | 脚本 · **非** 改链 |
| **TTG 链上 SEV-1** | Owner | Safe + Owner（② 可同人自签声明） | Treasury Op | Finance Op | Owner | 见 §3 · POL-08 |
| **Human / 认知验收** | Owner | Owner | 执行 walkthrough 者 | — | Owner | 录屏 evidence |

### 1.3 ②  interim 人员登记（须 Owner 填写并签字）

> **模板：** 复制下表 → 填实名列 → 存 `evidence/GO_ttg_gorp/<stamp>/GORP-AUTHORITY-ROSTER-SIGNED.md`

| 角色 ID | 角色 | 姓名（② interim） | 备份 | 签字日期 | ☐ |
|---------|------|-------------------|------|----------|---|
| R-01 | Owner / 负责 C | _Sebastian Ward（默认 interim）_ | — | | ☐ |
| R-02 | Safe Signer 1 | _TBD_ | | | ☐ |
| R-03 | Safe Signer 2 | _TBD_ | | | ☐ |
| R-04 | Safe 阈值 | _e.g. 2-of-3_ | | | ☐ |
| R-05 | Treasury Operator | _interim = R-01 须声明 SoD 风险_ | 备份人 | | ☐ |
| R-06 | Finance Operator | _interim = R-01 须声明 SoD 风险_ | 备份人 | | ☐ |
| R-07 | On-call / SRE | _TBD_ | | | ☐ |
| R-08 | Platform Admin | _TBD_ | | | ☐ |

**③ Production 硬要求：** R-05/R-06 **不得** 与 R-01 同人 · Safe **须** ≥2 异名 signer · POL-08 异名双人 SEV-1。

### 1.4 签字链（写死顺序）

```text
日常链：Finance Op（数据）→ Treasury Op（calldata）→ Safe 复核 → schedule → [48h] → execute → Finance Op（对账）
P4 spend：+ Owner 书面批准（金额/收款/cap）→ 同上
暂停：Owner 书面原因 → Safe 双签 batch → Legacy TL execute → 公告 → 解除时重复
事故：On-call 建单 → Owner SEV 判定 → Safe 动作（若需）→ 录屏/tx 证据 → Owner 关闭
```

---

## 2 · Governance Runbook

### 2.1 Safe

| 步骤 | 动作 | 执行 | 复核 |
|------|------|------|------|
| S-01 | 打开 Safe · 确认 `chainId=11155111` · 目标 TL admin 地址 | Treasury Op | Safe Signer 2 |
| S-02 | 对照 **RB-G-09** 确认 target=Legacy **或** V2 · **禁止** 混 batch | Treasury Op | Finance Op |
| S-03 | calldata 与 `CountryPoolNetProfitGovernancePayload` / Treasury payload **hex 对拍** | Treasury Op | Owner（P4/暂停） |
| S-04 | 收集 N-of-M 签名 · 保存 Safe tx hash | Signers | Treasury Op |
| S-05 | Legacy：`schedule` · 记录 `operationId` + `executeAfter` | Safe | Finance Op |
| S-06 | 到期：`execute` · 保存 receipt · 跑 four-ledger（若 CP） | 任意 EOA | Treasury Op |

**禁止：** Admin API · Steward 钱包 · 未 allowlist 的 target（`TargetNotAllowed`）

### 2.2 Timelock

| 路径 | 用途 | TL | schedule 方 | execute |
|------|------|-----|-------------|---------|
| **治理** | P4 spend · 参数 · Buyback 提案 | V2 `0x904a…` | Governor `queue` | 公开 · ETA=`delay` |
| **运维** | NetProfit epoch · pause · cutover 类 | Legacy `0x0359…` | Safe `admin.schedule` | 公开 |

**Execute 前检查：** `block.timestamp >= executeAfter` · target allowed · payload 模拟（`eth_call`）· 收款地址 checksum

### 2.3 Governor

| 步骤 | 动作 | 负责 |
|------|------|------|
| G-01 | 提案 calldata 审查 · `[D-4555-B]` / Treasury 分轨 | Treasury Op |
| G-02 | 冲突披露（team/advisor）· 公示 | Proposer |
| G-03 | 投票窗口内 cast · **钱包**为准（非 API 假投票） | Voter |
| G-04 | `Succeeded` 后 `queue` → V2 TL | 任意 |
| G-05 | 48h 后 §2.2 execute | On-call 监控 ETA |

**不讨论：**  quorum/cap/delay 参数变更（GovFreeze 冻结）

### 2.4 Treasury

| 步骤 | 动作 | 执行 | 审批 |
|------|------|------|------|
| T-01 | 确认 P1～P3 earmark · P4 余额 · GOV-01 30% cap | Finance Op | Owner |
| T-02 | 构造 `GovernanceTreasury.spend` / P4Cap payload | Treasury Op | Finance Op |
| T-03 | Governor 提案 → 投票 → queue | 社区 | Owner 披露 |
| T-04 | Execute · 对账 Treasury 余额前后 | On-call | Finance Op |
| T-05 | 存档 tx · API/admin 读面 · four-ledger（若相关） | Finance Op | Owner |

**禁止：** Admin POST · Seat 直转 · 绕过 Governor 的 spend

### 2.5 Country Pool（DE pilot · 可复制到它国 registry）

| 阶段 | 链上步骤 | 执行路径 | 复核 |
|------|----------|----------|------|
| 开账 | `openEpoch` | Legacy TL batch | Finance Op |
| 记账 | `recordAccrual` × N | Legacy TL batch | Finance Op |
| 关账 | `closeEpoch`（≥ epochEnd+closeDelay） | Legacy TL batch | Finance Op |
| 资格 | `setActiveStewardConfig`（与 fund/split **同批** 若变更） | Legacy TL batch | Admin + Treasury Op |
| 资金 | `fundingSource.approve` + `fundLedgerForSplit` | Finance EOA + TL batch | Finance Op |
| 分账 | `splitNetProfit` | Legacy TL batch | Finance Op + four-ledger |
| 释放 | `releaseUnallocated`（**独立**提案） | Legacy TL batch | Owner |

**异常：** 无 Active → 45% Unallocated（**非** Global 增额）— 运维须读 vault 余额而非改参数

### 2.6 Finance Operator

| 职责 | 动作 | 频率 |
|------|------|------|
| ERP → accrual | 生成 R/E 行 · 对拍 accounting spec | 每 epoch |
| fundingSource | 保管 EOA · 仅 approve Ledger · **无** Timelock key | 持续 |
| 关账 | 确认 closeDelay · 负 NPP 不 split | 每 epoch |
| 对账 | 跑 four-ledger · 存档 JSON | 每 split 后 + 月结 |
| 升级 | 密钥泄露 → §3.4 · Owner 24h 内批 | 按需 |

### 2.7 Treasury Operator

| 职责 | 动作 | 频率 |
|------|------|------|
| Calldata | 编码 payload · Safe 交易草稿 | 每 batch |
| Safe | schedule/execute 协调 · 存 operationId | 每 batch |
| 审查 | 收款地址 · selector · target TL | 每笔 |
| Governor | 协助 P4/Treasury 提案 calldata | 按需 |
| 事故 | §3 第一响应 · 拉 Owner | 按需 |

---

## 3 · Incident Runbook

**通用：** `POST /api/v1/internal/incident/open`（见 [PRODUCTION-INCIDENT-RESPONSE.md](./PRODUCTION-INCIDENT-RESPONSE.md)）· 证据目录 `evidence/GO_ttg_gorp/incidents/<stamp>/`

### 3.1 Execute 失败

| # | 动作 | 角色 |
|---|------|------|
| 1 | 记录 tx hash · revert reason（`TooEarly` / `CallFailed` / `UnknownOperation`） | On-call |
| 2 | `TooEarly` → 等到 `EXECUTE_EARLIEST_UNIX` · **禁止** `HAT_R1_FORCE_EXECUTE` 除非 Owner 书面 | On-call |
| 3 | `CallFailed` → `eth_call` 模拟 · 对照 payload · **不要** 重复 execute 同 id | Treasury Op |
| 4 | 资金未动 → 修正 calldata · 新 Safe schedule **或** 新 Governor 提案 | Treasury Op + Owner |
| 5 | 资金已动部分 → **升级 SEV-1** · Finance 冻结下一 batch | Owner |
| 6 | 关闭 incident · 存档 receipt + 模拟日志 | Owner |

### 3.2 Treasury 误转

| # | 动作 | 角色 |
|---|------|------|
| 1 | **停止** 后续 spend batch · 截图链上 tx | On-call |
| 2 | Owner SEV-1 · **承认链上不可逆** | Owner |
| 3 | 错地址联系/法律 · 治理 counter-proposal **仅** 若有余额可治理控制 | Owner + 法务 |
| 4 | 对外公告模板（08-4 批准后） | Owner |
| 5 | 根因：calldata/收款/checksum/cap · 更新 §2.4 复核清单 | Treasury Op |
| 6 | **不能** Admin API 撤回 | — |

### 3.3 Country Pool 异常

| 症状 | 分诊 | 恢复 |
|------|------|------|
| `SplitNotFunded` | 未 `fundLedgerForSplit` | Finance approve + fund batch |
| `InsufficientLedgerBalance` | pull 不足 | 补 USDC · 重 fund |
| `SettlementPausedErr` | pause=true | Owner 批准 → `setSettlementPaused(false)` batch |
| `CloseTooEarly` | 未过 closeDelay | 等待 · **禁止** 改 closeDelay（冻结） |
| 45% 进 Unallocated | Q-01 不满足 | **预期** · 非事故 · 若误 suspend → Admin+TL 资格 batch |
| four-ledger FAIL | env/API/indexer | §3.6 |

### 3.4 Safe signer 失联

| # | 动作 |
|---|------|
| 1 | 确认阈值仍可达（其他 signer 在线） |
| 2 | 若不可达 → **暂停** 新 schedule（口头）· Owner 启动 Safe 换签流程 |
| 3 | 备份 signer 升权（Safe 治理 tx） |
| 4 | 积压 batch 按优先级：pause 解除 > 误转响应 > 常 split |
| 5 | 桌演记录 · 更新 R-02～R-04 名册 |

### 3.5 Timelock 异常

| 症状 | 动作 |
|------|------|
| `TargetNotAllowed` | `setAllowedExecutionTarget` via Safe（cutover 先例） |
| `OperationExists` | 换 salt · 勿重复同一 hash |
| 队列堆积 | Owner 排优先级 · 禁止合并 `[D-4555-A]` 与 `[D-4555-B]` |
| Legacy/V2 混用 | 停手 · 对照 §0 口诀 · RB-G-09 |

### 3.6 Four-Ledger 异常

| # | 动作 |
|---|------|
| 1 | 跑 `four-ledger-reconcile.json` · 存 FAIL 快照 |
| 2 | 分诊：**env**（`NET_PROFIT` 优先）→ **RPC** → **API** → **indexer** → **DB** |
| 3 | 链上为准调 API/env · **禁止** 改链上 split 比例 |
| 4 | 修复后重跑至 PASS · Owner 签字一页纪要（REC-06 模板） |
| 5 | 参考先例：`chain/mod.rs` NET_PROFIT 优先级 |

---

## 4 · Human Walkthrough（运营接手 · 非功能测试）

**纪律：** 录屏 · URL · 角色标识 · 结论「能否接手该角色日常决策」· 存 `evidence/GO_ttg_gorp/walkthrough/<stamp>/`

### 4.1 Traveler

| # | 走查 | 通过标准 |
|---|------|----------|
| W-T1 | `/governance` 游客读 | 知：无按持仓分现 · 多池 · P1–P4 |
| W-T2 | `/governance/params` | 知：持 TTG ≠ 45% 主理人收益 |
| W-T3 | 与 `/market` 叙事不冲突 | 无「保本/刚性兑付」 |
| W-T4 | **不能** Admin · **不能** Safe · **不能** split | 角色边界口述 |

### 4.2 Investor（含 distribution 读路径）

| # | 走查 | 通过标准 |
|---|------|----------|
| W-I1 | `/governance/distribution-accruals` | accrual=登记投影 · **非** P4 自动现金 |
| W-I2 | `/governance/distribution-claim` | 仅 registered distribution · **非** 持 TTG 即分红 |
| W-I3 | 对比 params Treasury 政策 | 知：P4 须治理 |
| W-I4 | **不能** 触 Timelock/Treasury spend | |

### 4.3 Steward

| # | 走查 | 通过标准 |
|---|------|----------|
| W-S1 | `/governance?view=region` · stake 面板 | 知：Stake 门槛 · GOV-03 |
| W-S2 | 退出文案 | **不退 USDC** · 180d 路径 |
| W-S3 | **不能** 直收 45% 到 EOA | 知：Vault/治理路径 |
| W-S4 | 误操作 escalation → Admin · **非** Finance |

### 4.4 Admin

| # | 走查 | 通过标准 |
|---|------|----------|
| W-A1 | `/admin` 治理读面 · observability | 可见配置 · **无** spend POST |
| W-A2 | Seat 审核 UI | 知：链上 Q-01 须 TL batch 同步 |
| W-A3 | suspend/门闸 | **不**改 45/55 |
| W-A4 | SoD：不得自批本人 Seat 并批 split 资格（POL-06） | |

### 4.5 Finance Operator

| # | 走查 | 通过标准 |
|---|------|----------|
| W-F1 | 读 accounting spec + epoch 状态机 | 能口述 open→split |
| W-F2 | `fundingSource` 职责 | 仅 approve/pull · 无 TL key |
| W-F3 | 跑 four-ledger 脚本 · 读 FAIL 分诊树 §3.6 | |
| W-F4 | 与 Treasury Op 交接：calldata 审查点 §2.6→2.7 | |
| W-F5 | 月结对账签字页模板（Owner 联签） | |

**合并入口（已有清单）：** `bash scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh` 覆盖 W-T/W-I/W-S/W-A 子集 · **须** 补 W-F · **须** `record-govfreeze-v2-human-screen-acceptance.sh` signoff

---

## 5 · Production Governance Ready Checklist

**宣称：** 下列 **P0 全 ☑** + **Owner 在 `GORP-SIGNOFF.json` 签字** → **② Governance Production Ready** · **仍 ≠ ③ Production GO**

### P0（必须 ☑）

| ☐ | ID | 项 |
|---|-----|-----|
| ☐ | GORP-01 | §1.3 **Authority Roster** 填完并签字 |
| ☐ | GORP-02 | §2 **Governance Runbook** Owner 确认「团队可照此执行」 |
| ☐ | GORP-03 | §3 **Incident Runbook** Owner 确认 + **HW-06 桌演 1 次**（纪要存档） |
| ☐ | GORP-04 | §4 **Human Walkthrough** W-T/I/S/A 录屏 signoff（G24-HUMAN-UAT） |
| ☐ | GORP-05 | §4 **W-F** Finance Op walkthrough 录屏 + 月结模板 |
| ☐ | GORP-06 | **Safe walkthrough**（§2.1 S-01～S-06 录屏） |
| ☐ | GORP-07 | **HAT-R1 Phase B** 闭环证据（Execute→Spend→Unstake）· Owner unpause 记录 |
| ☐ | GORP-08 | **Dual Timelock 一页矩阵**（§0 + §2.2）贴于 Safe 旁 |
| ☐ | GORP-09 | settlementPaused 批准链（Owner 双签政策） |
| ☐ | GORP-10 | POL-08 TTG SEV-1 批准人（② 可 Owner 单人 · ③ 升级异名双人） |

### P1（Governance Ready 后 · ③ 前 ☑）

| ☐ | ID | 项 |
|---|-----|-----|
| ☐ | GORP-11 | Four-Ledger standing 月次 + Owner 签字 |
| ☐ | GORP-12 | CPNP indexer incident 节 + replay drill |
| ☐ | GORP-13 | Admin→链上 Active Seat E2E ops 纪要 |
| ☐ | GORP-14 | Enterprise HAT 真人 signoff 与机读分离 |
| ☐ | GORP-15 | Buyback/Burn ops（启用前） |

### P2（登记）

| ☐ | ID | 项 |
|---|-----|-----|
| ☐ | GORP-16 | RPC 切换清单 · solo-quorum 监控 |
| ☐ | GORP-17 | Legacy Ledger owner 长期决策文档 |

---

## 6 · 距离 Governance Production Ready 还剩什么

**当前：** **NOT Ready** — GORP 文档 **已发布** · **签字/ walkthrough / drill 未闭**

### 必做（P0 · 10 项）

1. **GORP-01** Authority Roster 具名签字（Safe signer **不能** 永久 TBD 上生产）  
2. **GORP-04** Human UAT 录屏 signoff  
3. **GORP-06** Safe 操作录屏  
4. **GORP-03 + 桌演** Incident 至少 Execute 失败 + Safe 失联 各 1 次  
5. **GORP-07** Phase B 闭环  
6. **GORP-05** Finance Op walkthrough  
7. **GORP-08～10** 双 TL 矩阵 · pause 政策 · SEV-1 批准人  
8. **GORP-02** Owner 书面确认 Runbook 可执行  
9. **GORP-SIGNOFF**（见下）  
10. **③ 前：** R-05/R-06 与 Owner **不得** 同人 · Safe **异名** 阈值  

### 签核命令（证据 · 不跑链上）

```bash
# 1) 填 roster + walkthrough 录屏后
bash scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh
bash scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh \
  --evidence-dir evidence/GO_govfreeze_v2_human_screen_acceptance/<stamp> \
  --signer "Sebastian Ward"

# 2) GORP 程序签字（复制模板 → evidence/GO_ttg_gorp/<stamp>/GORP-SIGNOFF.json）
# 字段：program_id=TTG-GORP · p0_items[] · owner_sign · utc
```

### P1 / P2

- **P1：** 月结 four-ledger · CPNP DR · Admin Seat E2E · Enterprise 真人签  
- **P2：** RPC · quorum 监控 · Ledger owner 决策  

---

## 7 · 文档索引

| 文档 | 用途 |
|------|------|
| [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md) | 地址冻结 |
| [TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md](./TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md) | 验收轨 |
| [Production Readiness Closure Audit](../spec/governance-token/TTG-GOVERNANCE-PRODUCTION-READINESS-CLOSURE-AUDIT.md) | 缺口审计 |
| [Ops & DR Audit](../spec/governance-token/TTG-GOVERNANCE-OPS-DISASTER-RECOVERY-AUDIT.md) | 灾备盘点 |

**稳定 grep：** `TTG_GORP: PUBLISHED v1-20260616`
