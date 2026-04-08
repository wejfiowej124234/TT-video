# 本地 Foundry 验收（B-093 · `test_B093_release*`）

## 1. 仓库里已有的固定方式

| 位置 | 内容 |
|------|------|
| **`contracts/README.md`** | 构建：`forge build` / `forge test`；依赖 **`forge install foundry-rs/forge-std`** |
| **`contracts/foundry.toml`** | `solc_version = "0.8.19"`、`remappings` → `lib/forge-std` |
| **`.github/workflows/contract-abi-gate.yml`** | CI：`foundry-rs/foundry-toolchain@v1`，缺则 **`forge install`**，再 **`forge test --root contracts`** |

## 2. 为什么本机会出现 `forge: command not found`

- **Foundry 未安装**，或已安装但 **`forge` 所在目录不在当前 shell 的 `PATH`**。  
- 官方安装器把二进制放在 **`~/.foundry/bin`**（Windows 用户目录下一般为 **`%USERPROFILE%\.foundry\bin`**）。**Git Bash / PowerShell / CMD** 若未包含该路径，任意目录执行 `forge` 都会 **exit 127**。

## 3. 为什么 Docker 可能报引擎不可用

- 错误形如 **`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`** 表示 **Docker Desktop 未运行**，或未启用 **Linux 容器** 后端，客户端无法连上本机引擎。  
- 与 **镜像是否存在** 无关；引擎起来之前 **`docker run … forge`** 不会成功。

## 4. 推荐方案（二选一中的唯一推荐）

**推荐：本机安装 Foundry**（与 CI、`contracts/README` 一致；不依赖 Docker）。

**最小修复步骤**

1. 安装（官方）：<https://book.getfoundry.sh/getting-started/installation>  
   - 常见一键：`curl -L https://foundry.paradigm.xyz | bash` 后执行 **`foundryup`**。  
2. **新开终端**，确认 **`forge --version`** 有输出。若无：把 **`~/.foundry/bin`** 加入 PATH（Windows 可在「环境变量」或 shell 配置里追加）。  
3. 在仓库根执行一次依赖（与 CI 同源）：  
   `cd contracts && ([ -f lib/forge-std/src/Test.sol ] || forge install foundry-rs/forge-std)`  
4. **唯一推荐验收命令**（仓库根目录，与 ABI Gate 的 `--root contracts` 一致；**`--match-test "B093"`** 覆盖 **`test_B093_*`**、**`test_COMP_B093_*`**、**`testFuzz_B093_*`**，与 `Escrow.t.sol` 内 B-093 收口一致）：  

```bash
forge test --root contracts --match-path test/Escrow.t.sol --match-test "B093" -vv
```

等价封装（从仓库根）：`bash contracts/run-b093-forge.sh`

**备选：Docker** — 仅当 **Docker Desktop 已启动且 Linux 引擎可用** 时再使用；需在镜像内挂载仓库并安装/使用 Foundry，维护成本高于本机，故不作首选。

## 5. 若仍无法执行

按第 2、3 节逐项排除 **PATH** 与 **Docker 引擎**；通过后仅用第 4 节 **一条** `forge test` 命令验收即可。

### 5.1 `foundryup` 卡在 attestation / `sigstore`

若日志停在 **downloading attestation** 或 **`foundry-attestation.sigstore.json`**，多为 GitHub API/附件链路问题。可改用 **跳过签名校验、直接下发行包**：

```bash
export PATH="$HOME/.foundry/bin:$PATH"
foundryup -f
```

（**`-f`** = **`--force`**，见本机 `foundryup` 脚本说明。）

### 5.2 `github.com:443` 连接超时

若 **`curl https://github.com`** 长时间无响应或 **exit 28**，说明当前环境 **到 GitHub 的 HTTPS 被墙/防火墙/代理策略阻断**。此时 **无法** 在线安装 Foundry，也 **无法** 在本环境跑通 `forge test`；请在 **能访问 GitHub 的机器或 CI**（如本仓库 **Contract ABI Gate**）执行第 4 节命令。

## 6. B-087（InvestorDistributionClaim · 封口用）

与 **§4** 相同前置：**`forge` 在 PATH**、**`contracts/lib/forge-std`** 已安装。

**唯一验收命令**（仓库根；仅 `test/InvestorDistributionClaim.t.sol` 内名称含 **`B087`** 的用例，即 **`test_B087_abi_selectors_match_canonical_signatures`**、**`test_B087_first_claim_transfers_exact_then_second_reverts`**）：

```bash
forge test --root contracts --match-path test/InvestorDistributionClaim.t.sol --match-test "B087" -vv
```

等价封装（从仓库根）：`bash contracts/run-b087-forge.sh`

## 7. B-089（Governor / Timelock / FeeRouter · 封口用）

与 **§4** 相同前置：**`forge` 在 PATH**、**`contracts/lib/forge-std`** 已安装。

**唯一验收命令**（仓库根；**`--match-test "[Bb]089"`** 命中 **6** 个用例，含 **`test_b089_*`**（小写 **b**）与 **`test*_B089_*`**，跨 **`TravelTrustGovernor.t.sol`**、**`GovernanceTimelock.t.sol`**、**`FeeRouter.t.sol`**；与 **B-100** 证据主命令 **`test_COMP_B089_governor_full_cycle_propose_vote_queue_execute`** 同族）：

```bash
forge test --root contracts --match-test "[Bb]089" -vv
```

等价封装（从仓库根）：`bash contracts/run-b089-forge.sh`

**封口计入的测试名（固定枚举）**：

| 文件 | 函数 |
|------|------|
| `test/TravelTrustGovernor.t.sol` | `test_COMP_B089_governor_full_cycle_propose_vote_queue_execute`、`test_TT_B089_governor_execute_set_routing_config_matches_payload`、`test_COMP_B089_getPastVotes_matches_cast_weight` |
| `test/GovernanceTimelock.t.sol` | `test_b089_full_cycle_fee_router_transfer_ownership`、`test_COMP_B089_timelock_execute_set_routing_config` |
| `test/FeeRouter.t.sol` | `test_COMP_B089_setRoutingConfig_then_distribute_matches` |

链上 **`queue`→`execute`** 运维叙述仍以 **`docs/verification-evidence/governor-timelock-queue-execute-evidence.md`**（**B-100**）为准；本命令为 **Foundry B-089 全集** 封口。

## 8. B-090（GovernanceTreasury · 封口用）

与 **§4** 相同前置：**`forge` 在 PATH**、**`contracts/lib/forge-std`** 已安装。

**唯一验收命令**（仓库根；**`GovernanceTreasury.t.sol`** 内 **`test*_b090_*` / `test*_B090_*`**，**`--match-test "[Bb]090"`**）：

```bash
forge test --root contracts --match-path test/GovernanceTreasury.t.sol --match-test "[Bb]090" -vv
```

等价封装（从仓库根）：`bash contracts/run-b090-forge.sh`

**封口计入的测试名（固定枚举 · 共 6）**：`test_b090_spend_increases_recipient_balance_by_payload`、`test_b090_non_spender_cannot_spend`、`test_b090_timelock_execute_spend_matches_payload`、`test_COMP_B090_timelock_execute_spendETH_matches_payload`、`test_TT_B090_spendETH_direct_increases_recipient_balance_by_payload`、`test_COMP_B090_non_spender_cannot_spendETH`。

**只读 UI / `GET …/governance/proposals*`** 验收仍以 **`docs/verification-evidence/tt-07-b090-proposal-ui.json`** 等为指针（与 **B-100** 证据分工一致）；本命令为 **Foundry B-090** 封口。
