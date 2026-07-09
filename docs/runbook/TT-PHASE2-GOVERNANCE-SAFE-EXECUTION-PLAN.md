# TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② 治理栈 · **Safe 为 Timelock.admin** 时的两阶段执行计划（R-02）

**互指：** [TT-PHASE2-CHAIN-DEPLOYMENT-GATE](./TT-PHASE2-CHAIN-DEPLOYMENT-GATE.md) · [TT-PHASE2-SEPOLIA-DRY-RUN-PRECHECK](./TT-PHASE2-SEPOLIA-DRY-RUN-PRECHECK.md) · `contracts/script/DeployGovernanceStack.s.sol` · `contracts/script/Phase2SafeExec.sol`

**最后更新：** 2026-06-05

---

## 1 · 问题摘要

`GovernanceTimelock.admin` 在 Sepolia 上为 **Gnosis Safe**（`TIMELOCK_ADMIN_ADDRESS`）时，原 `DeployGovernanceStack` 在 **deployer 单广播** 内调用：

- `timelock.setGovernor(gov)`
- `timelock.setAllowedExecutionTarget(gov, true)`
- `timelock.setAllowedExecutionTarget(token, true)`

上述三处均带 **`onlyAdmin`**，`msg.sender` 须等于 `admin`（Safe 合约地址）。**Deployer EOA 直调 → `OnlyAdmin()` revert**。

**Anvil (31337)：** `admin == deployer` 时仍可在单广播内联完成（本地 smoke）。

---

## 2 · `OnlyAdmin()` 完整调用链

### 2.1 合约与角色

| 角色 | 地址来源 | 能否直调 Timelock admin 函数 |
|------|----------|------------------------------|
| **Deployer** | `PRIVATE_KEY` → EOA | **否**（admin ≠ deployer） |
| **Safe (Timelock.admin)** | `TIMELOCK_ADMIN_ADDRESS` | **是**（作为 `msg.sender`） |
| **Safe owner** | `TIMELOCK_SAFE_OWNER_KEYS` | **间接** — 须 `Safe.execTransaction` |
| **Governor** | 序 1 部署输出 | **否** — 仅 `scheduleByGovernor`（`onlyGovernor`） |

### 2.2 `DeployGovernanceStack` 逐步分解

| 步 | 调用 | `msg.sender` 要求 | 执行者 | 广播密钥 |
|----|------|-------------------|--------|----------|
| **A1** | `new GovernanceVotesToken(...)` | 无 | Deployer | `PRIVATE_KEY` |
| **A2** | `new GovernanceTimelock(safeAdmin, delay)` | 无（constructor 设 admin） | Deployer | `PRIVATE_KEY` |
| **A3** | `new TravelTrustGovernor(...)` | 无 | Deployer | `PRIVATE_KEY` |
| **B1** | `timelock.setGovernor(gov)` | **`admin` (Safe)** | Safe owner → **Safe.execTransaction** | `TIMELOCK_SAFE_OWNER_KEYS[0]` |
| **B2** | `timelock.setAllowedExecutionTarget(gov, true)` | **`admin` (Safe)** | 同上 | 同上 |
| **B3** | `timelock.setAllowedExecutionTarget(token, true)` | **`admin` (Safe)** | 同上 | 同上 |

**Phase A（A1–A3）：** 仅部署，**无** `onlyAdmin`。**Deployer 付 gas、单广播即可。**

**Phase B（B1–B3）：** 三笔 **Safe 交易**（脚本内顺序 `execTransaction` · nonce 递增）。**Safe owner EOA 付 gas**；链上 `Timelock` 看到的 `msg.sender` = **Safe 地址**。

### 2.3 Safe 内部路径（Phase B）

```
Safe owner EOA
  └─ Safe.execTransaction(to=Timelock, data=setGovernor|setAllowedExecutionTarget, signatures=eth_sign)
       └─ GovernanceTimelock.{setGovernor|setAllowedExecutionTarget}()
            └─ onlyAdmin: msg.sender == Safe ✓
```

实现真源：`contracts/script/Phase2SafeExec.sol` · `configureGovernanceTimelockViaSafe`.

---

## 3 · Deployer vs Safe 签名矩阵

| 动作 | Deployer | Safe owner | Safe 多签 |
|------|:--------:|:----------:|:---------:|
| 部署 TTG / Timelock / Governor | ✅ | — | — |
| `setGovernor` | ❌ | ✅（经 Safe） | ✅ threshold 签名 |
| `setAllowedExecutionTarget` × N | ❌ | ✅（经 Safe） | ✅ |
| `DeployFundStackUnderTimelock` 内 `setAllowedExecutionTarget` | ❌ | ✅ | ✅ |
| Timelock `schedule` / `execute`（运营） | ❌ | ✅（admin 路径） | ✅ |
| Governor `propose` / `vote` | — | — | 治理参与者 |

**纪律：** Sepolia 上 **禁止** 用 deployer EOA 冒充 Timelock.admin（R-02 · G-05）。

---

## 4 · 脚本与 env

### 4.1 统一入口（推荐 · dry-run / broadcast 同源）

```bash
source scripts/dev/.env.phase2-chain-deploy.local
# 必填：CHAIN_RPC_URL, PRIVATE_KEY, TIMELOCK_ADMIN_ADDRESS, TIMELOCK_SAFE_OWNER_KEYS

cd contracts
forge script script/DeployGovernanceStack.s.sol:DeployGovernanceStack \
  --rpc-url "$CHAIN_RPC_URL" \
  --slow \
  -vv
# broadcast 前须 pregate exit 0 · 再加 --broadcast
```

脚本行为：

- `timelockAdmin != deployer && timelockAdmin.code.length > 0` → **Safe 路径**：Phase A + Phase B 双广播
- 否则（Anvil）→ 单广播内联 admin 调用

### 4.2 Phase B 单独重跑

治理合约已上链、仅缺 admin 配置时：

```bash
export TIMELOCK_ADDRESS=0x...
export GOVERNOR_ADDRESS=0x...
export GOVERNANCE_TOKEN_ADDRESS=0x...

forge script script/ConfigureGovernanceTimelockViaSafe.s.sol:ConfigureGovernanceTimelockViaSafe \
  --rpc-url "$CHAIN_RPC_URL" --broadcast
```

### 4.3 必填 env

| 变量 | Phase | 说明 |
|------|-------|------|
| `PRIVATE_KEY` | A | Deployer · 付部署 gas |
| `TIMELOCK_ADMIN_ADDRESS` | A,B | Safe · `Timelock.admin()` |
| `TIMELOCK_SAFE_OWNER_KEYS` | B | 逗号分隔 owner 私钥 · 1-of-1 取首段 |
| `TIMELOCK_SAFE_OWNER_KEY` | B | 可选 · 单 key 覆盖 |
| `TIMELOCK_ADDRESS` | B 单独 | Phase A 输出 |
| `GOVERNOR_ADDRESS` | B 单独 | Phase A 输出 |
| `GOVERNANCE_TOKEN_ADDRESS` | B 单独 | Phase A 输出 |

---

## 5 · Dry-run 预检

```bash
bash scripts/dev/phase2-sepolia-deploy-dry-run.sh
# → evidence/GO_phase2_chain_sepolia/dry-run/latest/precheck.json
```

**通过标准：** `DeployGovernanceStack` simulate **exit 0**（含 Phase B Safe exec · 无 `OnlyAdmin`）。

**broadcast 前并集闸：**

```bash
bash scripts/gates/check-phase2-chain-broadcast-pregate.sh
# G-07 仍须 Stripe 真值 · 见 §7
```

---

## 6 · Broadcast 顺序（治理栈之后）

| 序 | 脚本 | Admin / Owner 注意 |
|----|------|-------------------|
| 0 | `provision-phase2-timelock-admin-safe.sh` | G-05 · Safe ≠ deployer |
| 1 | `DeployGovernanceStack.s.sol` | **本文 Phase A+B** |
| 2 | `DeployFundStackUnderTimelock.s.sol` | **`setAllowedExecutionTarget` 仍须 Safe**（后续迭代：FundStack Safe 路径） |
| 3+ | Steward / Redemption / Ledger | `resolveChainOwner` → Timelock |

**序 1 后 Owner 动作：** 将 `TIMELOCK_ADDRESS` / `GOVERNANCE_TOKEN_ADDRESS` / `GOVERNOR_ADDRESS` 写入 `.env.phase2-chain-deploy.local` + registry `sepolia.addresses.*`。

**序 1 后链上验证：**

```bash
cast call $TIMELOCK_ADDRESS "admin()(address)" --rpc-url "$CHAIN_RPC_URL"
# → TIMELOCK_ADMIN_ADDRESS (Safe)

cast call $TIMELOCK_ADDRESS "governor()(address)" --rpc-url "$CHAIN_RPC_URL"
# → GOVERNOR_ADDRESS

cast call $TIMELOCK_ADDRESS "allowedExecutionTarget(address)(bool)" $GOVERNOR_ADDRESS --rpc-url "$CHAIN_RPC_URL"
# → true
```

---

## 7 · 并行：Stripe G-07

| 项 | 态 |
|----|-----|
| `scripts/dev/.env.staging-secrets.local` | **仍占位** `sk_test_REPLACE_ME` / `whsec_REPLACE_ME` |
| 机读闸 G-07 | **FAIL** until 真值 |
| Owner 动作 | Dashboard → Test mode → Secret key + Webhook signing secret → 填入 env |
| 验证 | `bash scripts/dev/bootstrap-phase2-g1-g2.sh` exit 0 |

**② 链上 broadcast 与 G-07 可并行准备；pregate 并集须 G-07 PASS 才允许 `--broadcast`。**

---

## 8 · 诚实边界

- 本文与 dry-run 绿集 = **② Sepolia 脚本/simulate 就绪** · **≠ ③ 主网 Production GO**
- **FundStack** 在 Safe admin 下 **`setAllowedExecutionTarget` 同样须 Safe** — 序 2 需另立 Safe 执行计划（与本文 Phase B 同模式）
- **R-01** 外部审计 **OPEN** — ② 窄广播可 proceed · **③ 前必须关**

---

## 9 · 一句话结论

**治理栈 Sepolia：Deployer 只部署（Phase A）；Timelock 上所有 `onlyAdmin` 配置（Phase B）必须由 Safe 经 `execTransaction` 签名执行 — 已写入 `DeployGovernanceStack` + `Phase2SafeExec`，dry-run 须双阶段 simulate 通过后再 broadcast。**
