# TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST

**阶段口径：** **① 本地 → ② Sepolia 测试网 → ③ 主网**

**文档类型：** Phase ② · `DeployGovernanceStack` **Sepolia broadcast 人工确认单**（**非**自动广播 · **非** ③ GO）

**互指：** [TT-PHASE2-CHAIN-DEPLOYMENT-GATE](./TT-PHASE2-CHAIN-DEPLOYMENT-GATE.md) · [TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN](./TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN.md) · [TT-PHASE2-SEPOLIA-DRY-RUN-PRECHECK](./TT-PHASE2-SEPOLIA-DRY-RUN-PRECHECK.md)

**最后更新：** 2026-06-05T12:00Z · **签发态：ISSUED**（pregate + dry-run exit 0 · **② Agent 代跑已开闸**）

---

## 0 · 硬纪律

| 项 | 要求 |
|----|------|
| **② Sepolia · Agent 代跑** | **允许**：Owner **本轮明确授权** + **`TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1`** → **`bash scripts/dev/phase2-sepolia-broadcast-governance-stack.sh`**（内嵌 pregate + dry-run + `--broadcast`） |
| **禁止** | 裸 **`forge script … --broadcast`**（须走统一脚本）· **CI 默认**调用 · **③ 主网** / **非 11155111** chain_id |
| **Owner** | 授权 Agent 代跑 **或** 亲手执行 §4 等价命令；播后 §5 回填仍须 Owner/Agent 按清单完成 |
| **阶段** | 本单仅 **② Sepolia 测试 ETH** · **≠ ③** 主网 Production GO |
| **R-01** | 外部审计 **OPEN** — ② 窄广播可 proceed · **③ 前必须关** |

---

## 1 · 前置闸（须机读 exit 0）

| # | 检查项 | 命令 | Owner ☑ | exit |
|---|--------|------|:-------:|------|
| P-01 | 链部署闸 | `bash scripts/gates/check-phase2-chain-deployment-gate.sh` | ☑ | **0** |
| P-02 | protocol pregate | `bash scripts/gates/check-protocol-convergence-pregate.sh` | ☑ | **0** |
| P-03 | **§4 并集闸** | `bash scripts/gates/check-phase2-chain-broadcast-pregate.sh` | ☑ | **0** |
| P-04 | G-1/G-2 bootstrap | `STAGING_USE_LOCAL_TUNNEL=1 bash scripts/dev/bootstrap-phase2-g1-g2.sh` | ☑* | **1*** |
| P-05 | dry-run simulate | `bash scripts/dev/phase2-sepolia-deploy-dry-run.sh` | ☑ | **0** |

\* P-04：`check-phase2-onboarding-staging-ready` **exit 0**（G-07 已绿）；脚本末步 `run-phase1-to-phase2-transition-audit` 因 04 路由漂移 **exit 1** — **不阻塞** broadcast pregate G-07。

**机读摘要行（pregate 绿后期望）：** `TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK`

### 1.1 机读记录（2026-06-05T08:06Z · ISSUED）

| # | 命令 | exit |
|---|------|------|
| P-04 bootstrap | `STAGING_USE_LOCAL_TUNNEL=1 bootstrap-phase2-g1-g2.sh` | **1**（G-07 内检 **0** · transition audit 04 路由） |
| P-03 pregate | `check-phase2-chain-broadcast-pregate.sh` | **0** · `TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK` |
| P-05 dry-run | `phase2-sepolia-deploy-dry-run.sh` | **0** · `TT_PHASE2_SEPOLIA_DRY_RUN: OK` |

**API_BASE（tunnel）：** `https://free-memes-juggle.loca.lt`（ ephemeral · bootstrap 写入 onboarding env）

---

## 2 · 公开链上 / 控制面（填址 · 不含私钥）

| 项 | 值 / 来源 | Owner 核对 ☑ |
|----|-----------|:------------:|
| `chain_id` | **11155111** (Sepolia) | ☐ |
| deployer EOA | `cast wallet address --private-key $PRIVATE_KEY` | ☐ |
| deployer Sepolia 余额 | ≥ **0.20 ETH**（dry-run 估 ~0.15 ETH + buffer） | ☐ |
| `TIMELOCK_ADMIN_ADDRESS` (Safe) | `0x7c018293396325077bb4D039930dcEe11B7Fb1Cf` | ☐ |
| Safe 有 code | `cast code $TIMELOCK_ADMIN_ADDRESS --rpc-url $CHAIN_RPC_URL` ≠ `0x` | ☐ |
| Safe admin ≠ deployer | **是** | ☐ |
| Safe owner 已备 gas | `TIMELOCK_SAFE_OWNER_KEYS` 对应 EOA 有余额 | ☐ |
| `CHAIN_RPC_URL` | 可用（`publicnode` 失败时可换 `https://sepolia.drpc.org`） | ☐ |

---

## 3 · 部署内容（序 1 · 治理栈）

| 合约 | 脚本动作 | 广播角色 |
|------|----------|----------|
| `GovernanceVotesToken` (TTG) | Phase **A1** · deployer | `PRIVATE_KEY` |
| `GovernanceTimelock` | Phase **A2** · `admin=Safe` | `PRIVATE_KEY` |
| `TravelTrustGovernor` | Phase **A3** | `PRIVATE_KEY` |
| `setGovernor` + `setAllowedExecutionTarget` ×2 | Phase **B** · Safe `execTransaction` | `TIMELOCK_SAFE_OWNER_KEYS` |

**真源：** [TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN](./TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN.md)

---

## 4 · broadcast 命令（Owner 亲手 · 或 Agent 代跑）

### 4.1 推荐 · Agent / Owner 统一入口（② Sepolia only）

```bash
# Owner 本轮明确授权（测试网 · 测试 ETH）
export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1

bash scripts/dev/phase2-sepolia-broadcast-governance-stack.sh
# → TT_PHASE2_SEPOLIA_GOVERNANCE_BROADCAST: OK
# → evidence/GO_phase2_chain_sepolia/broadcast/latest/broadcast-*.json
```

脚本内硬闸：**chain_id=11155111** · pregate exit 0 · dry-run exit 0 · deployer ≥ 0.20 ETH · Safe 有 code · admin ≠ deployer。

### 4.2 等价 · Owner 亲手（不推荐裸跑 forge）

```bash
set -a && source scripts/dev/.env.phase2-chain-deploy.local && set +a
bash scripts/gates/check-phase2-chain-broadcast-pregate.sh
bash scripts/dev/phase2-sepolia-deploy-dry-run.sh
cd contracts
forge script script/DeployGovernanceStack.s.sol:DeployGovernanceStack \
  --rpc-url "$CHAIN_RPC_URL" --broadcast --slow -vv
```

---

## 5 · 广播后 15 分钟内（Owner 动作）

| # | 动作 | 命令 / 文件 | ☑ |
|---|------|-------------|:-:|
| B-01 | 记录三地址 | console / `broadcast/DeployGovernanceStack.s.sol/11155111/run-latest.json` | ☐ |
| B-02 | 写入 env | `TIMELOCK_ADDRESS` · `GOVERNANCE_TOKEN_ADDRESS` · `GOVERNOR_ADDRESS` → `.env.phase2-chain-deploy.local` + 根 `.env` | ☐ |
| B-03 | registry | `registry/protocol-convergence-deployments.v1.yaml` → `environments.sepolia.addresses.*` | ☐ |
| B-04 | `admin()` | `cast call $TIMELOCK_ADDRESS "admin()(address)"` → Safe | ☐ |
| B-05 | `governor()` | `cast call $TIMELOCK_ADDRESS "governor()(address)"` → Governor | ☐ |
| B-06 | allowed targets | `cast call $TIMELOCK_ADDRESS "allowedExecutionTarget(address)(bool)" $GOVERNOR_ADDRESS` → `true` | ☐ |
| B-07 | G-09/G-10 | [TT-PHASE2-CHAIN-DEPLOYMENT-GATE](./TT-PHASE2-CHAIN-DEPLOYMENT-GATE.md) §4 broadcast 后表 | ☐ |

---

## 6 · Owner 签字（人工）

| 字段 | 填写 |
|------|------|
| **日期 (UTC)** | |
| **Owner** | Sebastian Ward（塞巴斯蒂安·沃德） |
| **pregate exit 0 证据** | `TT_CHECK_PHASE2_CHAIN_BROADCAST_PREGATE: OK` 终端截图 / 日志路径 |
| **dry-run exit 0 证据** | `evidence/GO_phase2_chain_sepolia/dry-run/latest/precheck.json` |
| **broadcast tx 哈希** | Phase A deployer / Phase B Safe owner 各列 |
| **我确认未跳阶** | ☐ ① 绿 · ② pregate+dry-run 绿 · **未**宣称 ③ GO |

**签字：** _________________________

---

## 7 · 一句话结论

**本单 = Sepolia 治理栈 broadcast 放行清单；机读闸 + dry-run 全绿后，Owner 授权 **`TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1`** 可 Agent 代跑 **`phase2-sepolia-broadcast-governance-stack.sh`**；③ 主网仍 Owner-only。**
