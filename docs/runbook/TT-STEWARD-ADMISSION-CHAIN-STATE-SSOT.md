# TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT

**Version:** 1.0.1 · **2026-06-17**
**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；本文 **①② 边界** 写死，**③ 另闸**）

**唯一 SSOT：** 主理人双轨准入 · TTG SEAT 质押 · Anvil 对齐 · MetaMask 钱包 · 治理池地址 · 身份确认 · 与 Soak / TN-P1-010 / HAT-R1 的依赖关系。

**机读 Gate：** `bash scripts/gates/check-steward-admission-chain-state-ssot.sh`（末行 `TT_STEWARD_CHAIN_STATE_SSOT: OK`）

**互指（勿分叉）：**

| 文档 | 用途 |
|------|------|
| [`scripts/dev/LOCAL-ANVIL-STACK-README.md`](../../scripts/dev/LOCAL-ANVIL-STACK-README.md) | Anvil 一键对齐命令 |
| [`scripts/dev/start-api-with-seed-README.md`](../../scripts/dev/start-api-with-seed-README.md) | 一键栈 env · multi-demo Plan A |
| [`frontend/evidence/GO_local_steward_workbench_l5/STEWARD-WORKBENCH-L5-FREEZE.md`](../../frontend/evidence/GO_local_steward_workbench_l5/STEWARD-WORKBENCH-L5-FREEZE.md) | 工作台 UI 冻结 |
| [`frontend/lib/onboarding/ONBOARDING-B-TRACK-USDC-SSOT.md`](../../frontend/lib/onboarding/ONBOARDING-B-TRACK-USDC-SSOT.md) | USDC 准入费（代码 hook 名 `BTrack`） |
| [`docs/runbook/TTG-HAT-R1-SEPOLIA-LIVE-WALLET-RUNBOOK.md`](TTG-HAT-R1-SEPOLIA-LIVE-WALLET-RUNBOOK.md) | ② HAT-R1  live 钱包 |
| [`evidence/TESTNET_STAGING_FREEZE/ACTIVE.json`](../../evidence/TESTNET_STAGING_FREEZE/ACTIVE.json) | ② staging 冻结基线 |

---

## 0 · 命名陷阱（必读）

| 客户 UI（工作台） | 代码 / hook | 内容 |
|-------------------|-------------|------|
| **A 轨** | `useStewardOnboardingBTrack` · `stewardBTrackModel` | USDC 准入费 + **身份确认** |
| **B 轨** | `StewardWorkbenchTtgStakeSection` · `#steward-ttg-stake` | **TTG SEAT** 链上质押（MetaMask） |

下文 **A/B 均指客户 UI**，与 Rust/TS 符号 `bTrack`（= 客户 A 轨 USDC）区分。

---

## 1 · 状态三层模型

| 层 | 存储 | 典型键 / 表 |
|----|------|-------------|
| **PG（持久）** | Docker Postgres | `onboarding_entitlements` · `users.role` · `users.default_wallet_address` · `role_applications` |
| **chain_off（进程内存）** | API 进程 | `steward_applications_by_user`（**无**独立 PG 表为 SSOT） |
| **链上（Anvil / Sepolia）** | RPC | `RegionStewardStakePool.stakeOf(wallet,jurisdiction)` · 合约地址在根 `.env` |

**诚实边界：** ① 本地绿 / multi-demo seed **≠** ② Sepolia steward GO **≠** ③ Production GO。

---

## 2 · 双轨准入逐步持久化

### A1 · 付 USDC

| 项 | 说明 |
|----|------|
| API | `POST /api/v1/onboarding/payment-intents` → `onboarding_entitlements.status=paid` |
| ① 本地 | `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` 可 0 元调试 |
| **重启 API** | **保留**（PG） |
| **重启前端** | **保留** |
| **`RESET_DOCKER_DB=1`** | **丢失** → 须重走 A1 |

### A2 · 确认身份

| 项 | 说明 |
|----|------|
| API | `POST /api/v1/onboarding/role-confirm` `{ "role": "region_steward" }` → `users.role=region_steward` |
| 前置 | A1 paid entitlement |
| **重启 API** | **保留**（PG hydrate → `GET /me`） |
| **multi-demo 种子** | `seed_multi_identity_demo_account` **不得**覆盖已确认的 `region_steward`（见 `auth.rs`） |
| **`RESET_DOCKER_DB=1`** | **丢失** → 须再点「确认身份」 |

### B · TTG SEAT 质押

| 项 | 说明 |
|----|------|
| 链 | MetaMask → `RegionStewardStakePool` approve + stake |
| 读 | `GET /api/v1/steward/stake-status?jurisdiction=CN&wallet=0x…`（API eth_call） |
| 池地址 SSOT | 根 `.env` `REGION_STEWARD_STAKE_POOL_ADDRESS` → `NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS` |
| **重启 API / 前端** | **保留**（链上状态 + `.env` 地址不变） |
| **Anvil 进程保持、无 redeploy** | **保留** |
| **池 force redeploy / 换地址** | **须重新质押**（旧池上 stake 成为 orphan） |
| **`RESET_DOCKER_DB=1`** | 链上 stake **仍在**；PG 身份可能丢，但 **同一 wallet 同一池** 仍显示已质押 |

### 治理待办解锁

`stewardDualTrackProgressComplete` = A2 完成 **且** 链上 CN 已质押 → `gateMode=satisfied` → 待办三卡解锁。

① 待办计数来源 `chain_off_mvp`（**非** ② Governor 强一致）— 见工作台脚注。

---

## 3 · 重启 / 操作矩阵（① 本地）

| 操作 | A1 USDC (PG) | A2 身份 (PG) | steward app (内存) | TTG stake (链) | 须重做 |
|------|--------------|--------------|--------------------|----------------|--------|
| 仅重启 **API** | 保留 | 保留 | multi-demo **自动 re-seed**；其他用户 **可能丢** → `POST /auth/seed-test-accounts` 或重提申请 | 保留（同池） | 非 seed 用户可能重提 `POST /steward/applications` |
| 仅重启 **Next.js** | 保留 | 保留 | 保留 | 保留 | **否** |
| **`SKIP_ANVIL_ALIGN=1`** 启栈 | 保留 | 保留 | 同上 | 保留 | **否**（推荐日常） |
| **`align-anvil-local-stack`** 默认 | 保留 | 保留 | 同上 | **保留**（`TTG_ANVIL_FORCE_DEPLOY` 默认 **0** · reuse 池） | **否** |
| **`TTG_ANVIL_FORCE_DEPLOY=1`** | 保留 | 保留 | 同上 | **orphan** · UI 未质押 | **B 轨须重质押** |
| **Anvil 重启（`--state` 持久化）** | — | — | — | 保留（同地址） | **否** |
| **Anvil reset / 删 state** | — | — | — | **丢失** | **须 redeploy + 重质押** |
| **`RESET_DOCKER_DB=1`** | 丢失 | 丢失 | 丢失 | 链上可能仍在 | **A1+A2 必做**；B 视池地址 |
| **改合约未 sync ABI** | — | — | — | — | 跑 Step 1b / `sync-abi-from-forge` |

---

## 4 · multi-demo 手测 SSOT（①）

| 项 | 值 |
|----|-----|
| 账号 | `multi-demo@test.com` / `Test123!` |
| MetaMask 钱包 | `0x104FCb93B5e097F92c93Ee4621C487C6C953D212`（Anvil #0） |
| 代码锚 | `crates/api/src/chain_off/auth.rs` · `frontend/lib/steward/stewardStakeUiModel.ts` |
| A1 | Step 6b seed → `onboarding_entitlements` paid（可 0 USDC 本地） |
| A2 | 首次须点「确认身份」→ `users.role=region_steward`；**之后 API 重启保留** |
| B | 400,000 TTG · Step 3c 默认 mint 1.25M TTG 到上址 |
| 工作台 URL | `http://localhost:3012/governance?view=region#steward-ttg-stake` |

**日常链上验收（不重质押）：**

```bat
set TRAVELTRUST_STEWARD_PERSIST=1
scripts\start-api-with-seed.bat
```

或手动：

```bat
set SKIP_ANVIL_ALIGN=1
scripts\start-api-with-seed.bat
```

**须 redeploy 池（地址碰撞修复）时：**

```bat
set TTG_ANVIL_FORCE_DEPLOY=1
bash scripts/dev/align-anvil-local-stack.sh
```

然后 **仅 B 轨** 在 MetaMask 重质押一次。

---

## 5 · Anvil 对齐与 env 键（①）

| 步骤 | 脚本 | 默认行为 |
|------|------|----------|
| 全栈对齐 | `scripts/dev/align-anvil-local-stack.sh` | FundStack reuse → TTG **reuse**（`TTG_ANVIL_FORCE_DEPLOY=0`） |
| 一键栈 | `start-api-with-seed.bat` Step **3b4** | 同上；`ANVIL_ALIGN_RAN=1` 时跳过 3b5/3c/3b6 重复 |
| 日常 preset | `TRAVELTRUST_STEWARD_PERSIST=1` | Step **6c/6c1/6t/6t1** · `SKIP_ANVIL_ALIGN=1` · 不重质押 |
| 跳过对齐 | `SKIP_ANVIL_ALIGN=1` | 保留 `.env` 池地址与链上 stake |
| 前端 env | `sync-frontend-env-local-from-root.ps1` | Step **7** · 不删链上状态 |
| Indexer | `reset-indexer-runtime-local-anvil.sh` | 仅删 `data/indexer_state.json.runtime`（31337）· **不**动 stake |

根 `.env` 托管块：`BEGIN TT FUNDSTACK ANVIL LOCAL` · `BEGIN TT ANVIL LOCAL`（**不**提交 staging Secret）。

---

## 6 · ② 测试网 · Soak · TN-P1-010 · HAT-R1 依赖

| 程序 | 与主理人准入关系 | 阻塞？ |
|------|------------------|--------|
| **`TESTNET_STAGING_FREEZE`** | ② deploy 冻结；**① Anvil 脚本不得冒充 staging GO** | ②  graduation 程序 |
| **Soak 72h** | 运行时稳定性；**不**重复 ① A2/B 手测 | ② TN-P1-010 前置 |
| **TN-P1-010** | Indexer deep reconcile / graduation gate | ② 毕业闸；**不**要求 ① 重质押 |
| **TN-P1-004** | Sepolia steward stake 证据 | ② 专项；与 ① multi-demo **分离** |
| **HAT-R1** | Sepolia live 钱包治理；须 **Seat TTG ≥ minStake** | ② Owner 钱包；**非** ① Anvil 同一状态 |
| **TN-P1-007/008** | 多身份 / steward 走廊 | ② 矩阵项 |

**纪律：** ① 本地 Anvil 状态 **不得** 写入 staging Secret 或 soak 监控路径（见 `LOCAL-ANVIL-STACK-README.md`）。

Graduation 总入口：`bash scripts/dev/run-phase2-graduation-closure-program.sh --status`

---

## 7 · 恢复命令（①）

| 症状 | 恢复 |
|------|------|
| A2 回到待确认 | 点「确认身份」；或查 PG `users.role` |
| `GET /me/steward-application` 404 | `cargo build -p traveltrust-api` + 重启 |
| steward app 空（非 multi-demo） | `POST /auth/seed-test-accounts` 或 `POST /steward/applications` |
| UI 未质押但链上已 stake | 查 `.env` 池地址是否与 stake 目标一致；勿 `FORCE_DEPLOY=1` |
| 池 orphan 后 | `TTG_ANVIL_FORCE_DEPLOY=1` align → MetaMask 重质押 |
| 全库乱 | `RESET_DOCKER_DB=1` + 一键栈 → A1+A2+B 全流程一次 |

烟测 Gate：`bash scripts/dev/smoke-steward-workbench-l5-local.sh`

---

## 8 · 禁止假完成（机读）

- ① `smoke-steward-workbench-l5` exit 0 **≠** ② Sepolia steward stake GO  
- Step 6c multi-demo 探针 **≠** MetaMask 已质押  
- ISS-007 / 窄切片 `report.json` **≠** 全站矩阵 GO（见 CONTRIBUTING · TT-9628）

---

## 9 · Gate 与变更纪律

改下列路径时 **须** `bash scripts/gates/check-steward-admission-chain-state-ssot.sh` exit 0：

- 本文档
- `scripts/dev/align-anvil-local-stack.sh`（`TTG_ANVIL_FORCE_DEPLOY` 默认）
- `crates/api/src/chain_off/auth.rs`（`MULTI_DEMO_WALLET` · seed 角色逻辑）
- `frontend/lib/steward/stewardStakeUiModel.ts`（`MULTI_DEMO_STEWARD_WALLET`）
- `scripts/dev/start-api-with-seed.bat` Step 3b4 / chain-on profile

---

## 10 · 变更记录

| 日期 | 变更 |
|------|------|
| 2026-06-17 | v1.0.1：`start-api-with-seed` · `TRAVELTRUST_STEWARD_PERSIST=1` · Step 6t · Step 3c 不再默认 force redeploy |
