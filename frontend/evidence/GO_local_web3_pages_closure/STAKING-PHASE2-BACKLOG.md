# `/staking` · Phase ② 待验 backlog（2026-06-12）

**阶段：② 测试网** — **宽轨**（**非** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) 窄 onboarding 主清单）  
**① 已闭（不重做）：** UI 体验深壳冻结 · Anvil 读/写烟测 · API 兜底 · DB best-effort — [`STAKING-PHASE1-CLOSURE`](./STAKING-PHASE1-CLOSURE.md)

**硬边界：** **不改** [`STAKING-PHASE1-CLOSURE`](./STAKING-PHASE1-CLOSURE.md) **UI 壳**；② 仅 **真链 / env 对拍 / staging 证据 / API 强一致**。

**Sepolia 地址真源：** [TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY](../../../docs/runbook/TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md)（`GUIDE_STAKING_POOL_ADDRESS` · `PROVIDER_STAKING_POOL_ADDRESS` · Registry）

---

## 总表

| ID | 清单项 | ① 状态 | ② 任务 | ③ |
|----|--------|--------|--------|---|
| **STK-P2-001** | staging / Sepolia **FundStack env** 注入（池 · token · registry · `chainId=11155111`） | Anvil 本地 **已闭** | **② 待验** | 主网地址 → **③** |
| **STK-P2-002** | **`smoke-guide-identity-stake`** Sepolia 变体（`approve` → `stake` → `stakeOf` → 全额 `withdraw`） | Anvil 烟测 **已闭** | **② 待验** | — |
| **STK-P2-003** | staging 浏览器：**`/staking?scope=guide`** 连钱包 → 质押 → 解押（已审核向导 + OpsGate） | ① 结构 **已闭** | **② 待验** | — |
| **STK-P2-004** | **`guide.stake_amount`** 与链上 `stakeOf` **强一致**（**非** ① best-effort） | ① `stakingGuideDbSync` best-effort | **② 待验** | ③ indexer SLA |
| **STK-P2-005** | **Provider 池** staging 读/写对拍（双池全页 · **非** 仅 guide scope） | ① Anvil 结构 **已闭** | **② 待验** | — |
| **STK-P2-006** | **Registry** `isApproved` / `guideApproval` Sepolia 只读 + 与 Admin 审核态对拍 | ① Anvil **已闭** | **② 待验** | — |
| **STK-P2-007** | **部分解押** staging 真链（`BelowMinIdentityAfterWithdraw` · UI 校验与 revert 对拍） | ① UI 校验 **已闭** | **② 待验** | — |
| **STK-P2-008** | 并入轨 1 · R-003 **`release_gate=GO`**（`/staking` 矩阵行） | ISS-007 窄切片 **≠ GO** | **② 待验** | Production GO → **③** |
| **STK-P2-009** | **Slashing** 治理路径 staging 演练（Timelock slasher · **只读+模拟** · **非** ③ 真罚没） | ① 地址展示 **已闭** | **② 待验** | 主网 slash → **③** |
| **STK-P2-010** | **链上交易历史** / 事件时间线 UI（`Stake`/`Withdraw` logs） | **未做** | **② 可选** | ③ 生产监控 |
| **STK-P2-011** | 工作台 **`GET /me` MIN_STAKE** 与链上 `MIN_STAKE()` 动态对拍（① 链可读时已读 `useGuideIdentityMinStake`） | ① 链读 **已闭** · API 档位仍 best-effort | **② 待验** | — |
| **STK-P2-012** | staging 浏览器：**不足 MIN** → 补足 → 工作台 Banner/Manage 档位切换 E2E | ① 结构 **已闭** | **② 待验** | — |
| **STK-P2-013** | **解押冷却期**（81 · 7～30 天）合约 + UI 对拍 | ① **即时 `withdraw`** | **② 待做** | ③ 治理调参 |
| **STK-P2-014** | **向导退出（Exited）** · Admin 审核 → 冷却满 → 自动/手动链上 withdraw | **①** `POST/GET /me/guide-exit-*` + 工作台卡片 · **无** Admin UI/冷却/链上联动 | **② 待做** | ③ |
| **STK-P2-015** | 退出期 **禁止接单** / 订单风险锁定释放规则与 81 三账本对拍 | **①** `exiting` → `guide_exit_pending` 接单门禁 · 在途订单释放 **未** 验 | **② 待做** | — |

---

## 逐项说明

### STK-P2-001 · Sepolia env 对拍

| 项 | 内容 |
|----|------|
| **真源** | `TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY` · `frontend/.env.staging.example` · `GET /meta` |
| **② 完成标准** | staging Next + API 运行时 `GUIDE_STAKING_POOL_ADDRESS` / `NEXT_PUBLIC_*` 与 spine 表 **一致** · `useBytecode` **deployed** |
| **依赖** | G-2 staging · **TT-9630** |
| **证据** | `evidence/GO_phase2_testnet_20260526/staking/env-audit.json`（待建） |

### STK-P2-002 · Sepolia 链上读/写烟测

| 项 | 内容 |
|----|------|
| **① 对照** | `bash scripts/dev/smoke-guide-identity-stake-anvil.sh` → `TT_GUIDE_IDENTITY_STAKE_ANVIL_SMOKE: OK` |
| **② 完成标准** | 新脚本或 `--network sepolia` 变体：**测试 ETH** · 测试 USDC mint/approve · 全流程 **exit 0** |
| **证据** | `TT_GUIDE_IDENTITY_STAKE_SEPOLIA_SMOKE: OK` 日志 · tx hash（脱敏） |

### STK-P2-003 · staging 浏览器 E2E

| 项 | 内容 |
|----|------|
| **范围** | `/staking?scope=guide` · 深顶栏 · `GuideIdentityStakingOpsGate` · 单页钱包 CTA |
| **② 完成标准** | staging URL + Sepolia 钱包 · 已登录 **approved** 向导 · stake ≥ `MIN_STAKE` · 全额 withdraw |
| **证据** | Playwright 或人工截图包 → `evidence/GO_phase2_testnet_20260526/staking/` |

### STK-P2-004 · API ↔ 链上强一致

| 项 | 内容 |
|----|------|
| **① 对照** | `stakingGuideDbSync.ts` · `POST /guides/:id/stake` |
| **② 完成标准** | tx 确认后 **GET /me** · **GET /guides/:id** 的 `stake_amount` 与 `stakeOf` **一致**（容差 0） |
| **依赖** | staging PG · indexer 或轮询对拍策略（文档化） |

### STK-P2-005 · Provider 池 staging

| 项 | 内容 |
|----|------|
| **范围** | 全页 `/staking` provider 三节（contract · stake · withdraw） |
| **② 完成标准** | 已审核商家账号 · provider 池 Sepolia 读/写 **exit 0** |
| **互指** | `smoke-provider-onboarding-local.sh` staging 变体 |

### STK-P2-006 · Registry staging 只读

| 项 | 内容 |
|----|------|
| **范围** | `StakingRegistryCollapsible` · `isApproved` / `guideApproval` |
| **② 完成标准** | 连 Sepolia 钱包后资格字段与 Admin 审核记录 **可对拍** |

### STK-P2-007 · 部分解押 revert 对拍

| 项 | 内容 |
|----|------|
| **合约** | `BelowMinIdentityAfterWithdraw` |
| **② 完成标准** | staging 尝试部分 withdraw 低于 `MIN_STAKE` · UI 拦截 **或** 链上 revert 文案诚实展示 |

### STK-P2-008 · R-003 矩阵

| 项 | 内容 |
|----|------|
| **真源** | [PHASE2-TESTNET-ACCEPTANCE](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) 轨 1 |
| **② 完成标准** | `environment.name=staging` + **`release_gate=GO`**（**非** `PARTIAL_GO`） |

---

### STK-P2-011 · 动态 MIN_STAKE 对拍

| 项 | 内容 |
|----|------|
| **① 对照** | `GUIDE_IDENTITY_MIN_STAKE_REFERENCE=1000` · `resolveGuideIdentityStakingTier` |
| **② 完成标准** | 工作台/质押页档位以链上 `MIN_STAKE()` 为准（非静态参考锚） |
| **证据** | staging 改参后 UI 档位与链读一致 |

### STK-P2-012 · 不足额补足 E2E

| 项 | 内容 |
|----|------|
| **范围** | `/guide` below-min 警告 → `/staking?scope=guide` 一键补足 → stake tx |
| **② 完成标准** | Sepolia 钱包 · `stakeOf ≥ MIN_STAKE` · 工作台切换为 ManageLink |

---

## ③（勿混入 ②）

| ID | 项 |
|----|-----|
| **STK-P3-001** | 主网 FundStack 部署与 `go-live` 对拍 |
| **STK-P3-002** | 生产 slashing 与争议仲裁真链 |
| **STK-P3-003** | 生产 PSP / 真 USDC 流动性监控 |
| **STK-P3-004** | 链上事件 indexer + 合规留存 |
| **STK-P3-005** | 生产级区块浏览器 / 多链 explorer 矩阵（① 仅已知链） |
| **STK-P3-006** | API↔链 indexer SLA · 跨设备质押额一致（③ 合规留存） |

---

## 互指

| 文档 | 用途 |
|------|------|
| [STAKING-PHASE1-CLOSURE](./STAKING-PHASE1-CLOSURE.md) | **①** 收口 |
| [GUIDE-ONBOARDING-STAKING-FLOW](../../lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md) | 向导全链 SSOT |
| [PHASE2-START-CHECKLIST §5.2 B-SMOKE-9](../../../docs/runbook/PHASE2-START-CHECKLIST.md) | 窄 ② 阻塞索引 |
| [TT-9629](../../../docs/runbook/TT-9629-protocol-convergence-steward-stake-testnet.md) | 主理人 stake ②（**平行轨** · 非本页） |
| [FUNDSTACK-ANVIL-LOCAL-README](../../../scripts/dev/FUNDSTACK-ANVIL-LOCAL-README.md) | **①** 部署/烟测 |

**末行（② 待定义）：** `TT_STAKING_GUIDE_IDENTITY_SEPOLIA_SMOKE: OK (② only · test ETH · no mainnet)`
