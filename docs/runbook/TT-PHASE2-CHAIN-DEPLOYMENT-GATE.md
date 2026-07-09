# TT-PHASE2-CHAIN-DEPLOYMENT-GATE

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② **链上部署 P0 闸** — R-01/R-02/R-03 清零纪律 · **禁止未 PASS broadcast**

**互指：** [TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC](./TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md) · [TT-PHASE2-CONTRACT-DEPLOYMENT-READINESS](./TT-PHASE2-CONTRACT-DEPLOYMENT-READINESS.md) · [registry/protocol-convergence-deployments.v1.yaml](../../registry/protocol-convergence-deployments.v1.yaml)

**最后更新：** 2026-06-05

---

## 1 · 总表

| 风险 ID | 项 | 机读/代码态 | Sepolia broadcast |
|---------|-----|-------------|-------------------|
| **R-01** | 第三方合约审计 | **OPEN** | ② 可脚本闸绿 · **③ 前必须** |
| **R-02** | 控制面非 deployer EOA | **脚本+测试 ✅** | 须 env + 链上 cast 验证 |
| **R-03** | registry Sepolia 槽 + 脚本对拍 | **槽位 ✅ · 地址 null** | 部署后填址 |

**硬规则：** **R-01 / R-02 / R-03 未按 §4 全部 PASS 前，禁止 `forge script … --broadcast` 上 Sepolia。**

---

## 2 · R-02 修复（代码真源）

### 2.1 `Phase2ControlPlane.sol`

| 解析函数 | 用途 | 非 Anvil 规则 |
|----------|------|---------------|
| `resolveTimelockAdmin(deployer)` | `GovernanceTimelock.admin` | 须 `TIMELOCK_ADMIN_ADDRESS` **≠ deployer** |
| `resolveChainOwner(deployer)` | P2 pool / Claim owner | 默认 `TIMELOCK_ADDRESS` **≠ deployer** |
| `resolveEscrowFactoryGuardian(deployer, timelock)` | `EscrowFactory.guardian` | 默认 `TIMELOCK_ADDRESS` **≠ deployer** |

**Anvil (31337)：** 允许 deployer 回落（本地 smoke）。

### 2.2 已接入部署脚本

| 脚本 | R-02 绑定 |
|------|-----------|
| `DeployGovernanceStack.s.sol` | `admin = resolveTimelockAdmin` |
| `DeployFundStackUnderTimelock.s.sol` | `guardian = resolveEscrowFactoryGuardian` · Claims `owner = resolveChainOwner` |
| `DeployRegionStewardStakePool.s.sol` | `poolOwner = resolveChainOwner` |
| `DeployCountryPoolRedemptionEpochV0.s.sol` | `epochOwner = resolveChainOwner` |
| `DeployP51CountryLedger.s.sol` | `ledgerOwner = resolveChainOwner` |

### 2.3 必填 env（Sepolia）

| 变量 | 序 | 说明 |
|------|-----|------|
| `TIMELOCK_ADMIN_ADDRESS` | 1 | 多签 / Safe · **≠ PRIVATE_KEY EOA** |
| `TIMELOCK_ADDRESS` | 1 后 | `DeployGovernanceStack` 输出 |
| `PHASE2_CHAIN_OWNER_ADDRESS` | 可选 | 覆盖 P2 owner（默认 Timelock） |
| `ESCROW_FACTORY_GUARDIAN_ADDRESS` | 可选 | 覆盖 Factory guardian（默认 Timelock） |

模板：[`scripts/dev/.env.phase2-chain-deploy.local.example`](../../scripts/dev/.env.phase2-chain-deploy.local.example)

---

## 3 · R-03 registry 对拍

**文件：** [`registry/protocol-convergence-deployments.v1.yaml`](../../registry/protocol-convergence-deployments.v1.yaml)

| 项 | 状态 |
|----|------|
| `environments.sepolia.chain_id` | **11155111** |
| `deploy_order` | Governance → FundStack → Steward → Redemption |
| `env_to_registry` | 8 键 ↔ `addresses.*` |
| `control_plane_env` | 与 `Phase2ControlPlane.sol` 同源 |
| `addresses.*` | **null**（部署前预期） |

**部署后 Owner 动作：** 将 broadcast 地址填入 `environments.sepolia.addresses.*` + 根 `.env` + API 重启。

---

## 4 · 部署前验收清单（全部 PASS 才允许 broadcast）

| # | 项 | 命令 / 证据 | 态 |
|---|-----|-------------|-----|
| G-01 | 架构规格已读 | [TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC](./TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md) | ☑ |
| G-02 | 机读部署闸 | `bash scripts/gates/check-phase2-chain-deployment-gate.sh` exit 0 | ☑ (2026-06-05) |
| G-03 | pregate | `bash scripts/gates/check-protocol-convergence-pregate.sh` exit 0 | ☑ (2026-06-05) |
| G-04 | R-02 Foundry | `Phase2ControlPlaneBindingsTest` + `RegistryTest` pass | ☑ (2026-06-05) |
| G-05 | `TIMELOCK_ADMIN_ADDRESS` 已设且 ≠ deployer | `bash scripts/dev/provision-phase2-timelock-admin-safe.sh` | ☑ (2026-06-05) |
| G-06 | Escrow Proxy 禁止 | ② 不引入 · 代码审查 | ☑ |
| G-07 | staging G-1/G-2（API 链） | `bootstrap-phase2-g1-g2.sh` · [dry-run 报告](./TT-PHASE2-SEPOLIA-DRY-RUN-PRECHECK.md) | ☐ · **Stripe 占位** |
| G-08 | R-01 外部审计 | **OPEN** — ② 窄广播可 proceed · **③ 前必须关** | ☑ (ack) |

**§4 并集闸（broadcast 前必跑）：**

```bash
bash scripts/gates/check-phase2-chain-broadcast-pregate.sh
# → TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK 才允许 --broadcast
```

**dry-run 预检：** [TT-PHASE2-SEPOLIA-DRY-RUN-PRECHECK](./TT-PHASE2-SEPOLIA-DRY-RUN-PRECHECK.md) · [TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN](./TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN.md) · [Broadcast 人工确认单](./TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md) · `bash scripts/dev/phase2-sepolia-deploy-dry-run.sh`

**broadcast 后追加：**

| # | 项 | 态 |
|---|-----|-----|
| G-09 | registry `sepolia.addresses.*` 已填 | ☐ |
| G-10 | `cast call` admin/guardian/owner ≠ deployer | ☐ |
| G-11 | `smoke-steward-stake-testnet-readonly.sh` exit 0 | ☐ |

---

## 5 · Sepolia 部署顺序（与 registry 同源）

```bash
# 0 · 闸
bash scripts/gates/check-phase2-chain-deployment-gate.sh
bash scripts/gates/check-protocol-convergence-pregate.sh

# 1 · 治理栈（须 TIMELOCK_ADMIN_ADDRESS + TIMELOCK_SAFE_OWNER_KEYS）
#    Phase A = deployer 部署 · Phase B = Safe owner 经 execTransaction 配置 admin
#    详见 docs/runbook/TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN.md
forge script script/DeployGovernanceStack.s.sol --rpc-url "$CHAIN_RPC_URL" --broadcast

# 2 · 资金栈（须 TIMELOCK_ADDRESS = 序 1 输出 · PRIVATE_KEY = Timelock.admin 多签成员或 schedule 路径）
#    注意：setAllowedExecutionTarget 须 Timelock.admin EOA 签名
forge script script/DeployFundStackUnderTimelock.s.sol --rpc-url "$CHAIN_RPC_URL" --broadcast

# 3 · Protocol P2（须 TIMELOCK_ADDRESS）
forge script script/DeployRegionStewardStakePool.s.sol --rpc-url "$CHAIN_RPC_URL" --broadcast
forge script script/DeployCountryPoolRedemptionEpochV0.s.sol --rpc-url "$CHAIN_RPC_URL" --broadcast

# 4 · 填 registry + .env · 只读 smoke
bash scripts/dev/smoke-steward-stake-testnet-readonly.sh
```

**包装脚本：** [`deploy-steward-stake-pool-testnet.sh`](../../scripts/dev/deploy-steward-stake-pool-testnet.sh)（已强制 `TIMELOCK_ADDRESS`）。

---

## 6 · 机读闸

```bash
bash scripts/gates/check-phase2-chain-deployment-gate.sh
# → TT_CHECK_PHASE2_CHAIN_DEPLOYMENT_GATE: OK
```

**Foundry 最小新增测试：**

| 文件 | 用例 |
|------|------|
| `test/Phase2ControlPlaneBindings.t.sol` | Sepolia 纯函数解析 · deployer 禁止 · Timelock 缺省 · 绑定集成 |
| `test/Registry.t.sol` | authority · approve · revoke · expiry |

---

## 7 · 风险状态（2026-06-05）

| ID | 修复内容 | 状态 |
|----|----------|------|
| R-02 | `Phase2ControlPlane` + 5 部署脚本 + shell 预检 + Foundry | **✅ 代码已闭** · 链上须 G-10 |
| R-03 | registry `sepolia` 槽 + env 对拍 + gate 脚本 | **✅ 槽位已闭** · 地址部署后填 |
| R-01 | 外部审计 | **❌ OPEN** |

---

## 8 · 机读摘要

```text
TT_PHASE2_CHAIN_DEPLOYMENT_GATE: SCRIPT_READY (2026-06-05)
R-02: CODE_CLOSED (Phase2ControlPlane + deploy scripts + tests)
R-03: REGISTRY_SLOTS_READY (sepolia null addresses pre-broadcast)
R-01: OPEN
SEPOLIA_BROADCAST: FORBIDDEN until §4 G-01..G-08 PASS (G-06 done)
Next: set TIMELOCK_ADMIN_ADDRESS -> run gate -> DeployGovernanceStack on Sepolia
```

---

**End of TT-PHASE2-CHAIN-DEPLOYMENT-GATE**
