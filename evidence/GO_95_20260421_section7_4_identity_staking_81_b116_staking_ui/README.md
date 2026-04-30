# GO_95 · §7.4 · **IdentityStaking / 池 · 81 · B-116 · `/staking` UI** · 2026-04-21

## 口径（SSOT）

- **[81-经济模型-向导质押与订单押金.md](../../docs/spec/81-经济模型-向导质押与订单押金.md)**：**Guide/Provider** 身份准入与 **`IdentityStakingPool` 系**（**USDC** 等 **IERC20** 质押品）与 **TTG / Escrow / FeeRouter** 分轨。
- **[14-合约-API-ABI-前后端对齐.md](../../docs/spec/14-合约-API-ABI-前后端对齐.md)** **§1.1** 表行：**身份质押（IdentityStakingPool 系）**；**`GuideIdentityStakingPool.json`** / **`ProviderIdentityStakingPool.json`**；**`GET /meta`** **`guide_staking_address`** / **`staking_provider_address`**（与 **B-116** 经济投影叙事正交）。
- **`/staking`**：**[13-1](../../docs/spec/13-1-UI产品级SSOT与页面规范.md)** 资金/信任区与 **35** 质押入口一致。

## 工程真值（合约 ↔ ABI ↔ 页 ↔ 索引 topic0）

| 主题 | 位置 |
|------|------|
| **Solidity** | **`contracts/src/IdentityStakingPool.sol`**；**`GuideIdentityStakingPool.sol`** / **`ProviderIdentityStakingPool.sol`** |
| **ABI 单源 ↔ 前端** | **`contracts/abi/GuideIdentityStakingPool.json`**、**`ProviderIdentityStakingPool.json`** ↔ **`frontend/dapp/abis/`**（**`scripts/check-55-s13.sh`** **55-S13**） |
| **viem ABI 镜像** | **`frontend/lib/stakingAbi.ts`** **`identityStakingPoolAbi`**（注释锁 **55-S13**） |
| **双池 `/staking` 页** | **`frontend/app/staking/page.tsx`**（**`StakingContractPanel` / `StakingStakePanel` / `StakingWithdrawPanel`** **`pool="guide"`** / **`pool="provider"`** + **`StakingRegistryPanel`**） |
| **环境地址** | **`frontend/lib/stakingEnv.ts`** **`NEXT_PUBLIC_GUIDE_STAKING_ADDRESS`** / **`NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS`** |
| **Indexer topic0 校验** | **`crates/api/src/chain/indexer.rs`** **`STAKED_TOPIC0` / `WITHDRAWN_TOPIC0` / `SLASHED_TOPIC0`** ↔ **`staking_event_topic0s_keccak`** |
| **链外读与 API** | **`crates/api/src/chain/mod.rs`**、**`chain_off/indexer_event_track.rs`**（**`guide_staking_address` / `staking_provider_address`**）；**`routes/guides.rs`** **`guide_stake`**（**`chain_off/guides.rs`** **`guide_stake_impl`**） |

## 命令结果（仓库根 / `frontend`）

```bash
bash scripts/check-55-s13.sh
```

- **结果**：**55-S13 OK**（**Guide/Provider** JSON **`contracts/abi` ↔ `frontend/dapp/abis`** **字节一致**）。

```bash
cargo test -p traveltrust-api staking_event_topic0s_keccak
```

- **结果**：**1 passed**（**`Staked` / `Withdrawn` / `Slashed`** **topic0** **Keccak** 与常量一致）。

```bash
cargo test -p traveltrust-api guide_stake_without_chain_off_is_503_chain_off_unavailable
```

- **结果**：**1 passed**（**`chain_off` 不可用** 时 **503** 契约）。

```bash
cd frontend && npx vitest run staking --reporter=dot
```

- **结果**：**`stakingEnv.test.ts`** **4 passed**。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（**04↔`app`↔13-1** 路由面，含 **`/staking`** 登记）。

## 边界

- **不**替代 **主网** 部署字节码终验 / **`forge test`** 全矩阵 / **staging** **`indexer-tick`** 对 **`investor_stake_state_events`** 真链全量。
- **不**替代 **81** 全文经济审计 / **93** 域回归 / **SlashRouter / ReserveVault** **Target** 终局叙述。
