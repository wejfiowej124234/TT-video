# ① 本地 Anvil 栈对齐（真人测试专用）

**阶段：** 仅 **① 本地** · **不**同步 **② 测试网** · **不**触碰 **③ 生产**

**基线纪律：** `main` @ `877a1e77` 上 **Phase ② soak**（`job-20260615T015345Z`）保持冻结；本分支工作 **不得** 合并进 soak 监控路径或 staging 部署脚本。

## 修复顺序（本分支）

1. **Anvil 地址语义校验** — `ttg_anvil_try_reuse_deploy` 校验 `pool.ttg()`；`fundstack_anvil_try_reuse_deploy` 要求 provider/factory/fee_router 有 bytecode；`verify-anvil-local-bytecode.sh` 校验 Guide/Provider/Pool/TTG/USDC/Registry/Factory/**FeeRouter** 并拒绝池=USDC、TTG=Factory 碰撞。
2. **管家/治理合约错指** — 部署顺序 **FundStack → TTG**（`TTG_ANVIL_FORCE_DEPLOY` 在 FundStack 后）；`DeployRegionStewardStakePool` 在 Anvil 31337 允许 deployer 作 pool owner。
3. **`.env` Sepolia 残留** — `anvil-local-env-lib.sh` 注释托管块外 ② 键（dotenv first-read 安全）；`sync-frontend-env-local` last-wins。
4. **`P3_CHAIN_OFF` 覆盖** — `start-api-with-seed.bat` 有 TT FUNDSTACK/TT ANVIL 块时自动 `TRAVELTRUST_CHAIN_ON=1`，API 不再默认 `P3_CHAIN_OFF=1` 盖掉块内 `P3_CHAIN_OFF=0`。

## 一键对齐（仓库根）

```bash
bash scripts/dev/align-anvil-local-stack.sh
```

（脚本自动检测 Anvil 是否已在 :8545 监听；未启动时会拉起 Anvil。）

或 Windows：

```powershell
powershell -File scripts/dev/align-anvil-local-stack.ps1
```

验收：

```bash
bash scripts/dev/verify-anvil-local-bytecode.sh
```

## 一键本地栈（含 3b5 FundStack · 3c TTG · 3b6 mint/DB 对齐）

```bat
scripts\start-api-with-seed.bat
```

Step **3b4** 在检测到 `BEGIN TT FUNDSTACK ANVIL LOCAL` / `BEGIN TT ANVIL LOCAL` 时自动跑 `align-anvil-local-stack`（含 bytecode 校验）；跳过 3b5/3c/3b6 重复步骤。显式链上模式：`set TRAVELTRUST_CHAIN_ON=1`（有 Anvil 块时会自动开启）。

## 不同步测试网

- **勿**在本分支运行 `deploy-tt-web-staging.sh`、`phase2-sepolia-*`、`run-phase2-testnet-*` soak/graduation 链。
- **勿**把根 `.env` 中 TT FUNDSTACK / TT ANVIL 块复制到 staging Secret；② 地址仍以 Sepolia 部署证据为准。

## 关键产物（git 跟踪）

| 路径 | 作用 |
|------|------|
| `scripts/dev/lib/anvil-local-env-lib.sh` | Sepolia supersede + 块去重 |
| `scripts/dev/lib/fundstack-anvil-common.sh` | Guide/Provider/Registry FundStack |
| `scripts/dev/lib/ttg-anvil-common.sh` | TTG + RegionStewardStakePool |
| `scripts/dev/align-anvil-local-stack.sh` | 全栈编排 |
| `scripts/dev/mint-fundstack-anvil-usdc.sh` | 测试钱包 USDC |
| `scripts/dev/align-guide-stake-db-to-chain-local.sh` | guide@test.com DB stake ← 链 |

生成文件（**不提交**）：`scripts/dev/.env.anvil.local`、`scripts/dev/.env.fundstack-anvil.local`、根 `.env` 托管块、`frontend/.env.local`。
