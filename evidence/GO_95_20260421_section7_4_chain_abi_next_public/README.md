# GO_95 · §7.4 · **（14）地址、链 ID、ABI 与 `NEXT_PUBLIC_*` 同源** · 2026-04-21

## 口径（SSOT）

- **[14-合约-API-ABI-前后端对齐.md](../../docs/spec/14-合约-API-ABI-前后端对齐.md)** **§1**（合约↔ABI↔调用方）、**§1.2**（**`contracts/abi` → `frontend/dapp/abis`** 同步规则）。
- **[ops/RUNBOOK.md](../../ops/RUNBOOK.md)** **§12.4** ABI 同步有序清单；**§7.1** **`FEE_ROUTER_ADDRESS`** 与 **`Escrow.platformFeeRecipient`** / **`NEXT_PUBLIC_FEE_ROUTER_ADDRESS`** / **`GET /meta.chain.contracts`** 同址叙述。
- **根 `.env.example`** + **`frontend/.env.example`**：**`CHAIN_ID`**、**`NEXT_PUBLIC_CHAIN_ID`**、**`NEXT_PUBLIC_*_ADDRESS`** 与 **`GET /meta`** **`chain.contracts`** 注释互链。

## 实现与前端绑定（代码真值）

| 主题 | 位置 |
|------|------|
| **Wagmi 目标链** | **`frontend/lib/chainEnv.ts`** **`getExpectedChainId()`** / **`getTargetChain()`**（**`NEXT_PUBLIC_CHAIN_ID`**，缺省 **137**；注释要求与后端 **`CHAIN_ID`** 一致） |
| **Provider 挂载** | **`frontend/components/Providers.tsx`** **`createConfig({ chains: [targetChain] … })`** |
| **运行时 meta 链读** | **`crates/api/src/routes/health_meta/handlers.rs`** **`chain`** / **`chain.contracts`**（与 **Env** **`CHAIN_ID`**、**`FEE_ROUTER_ADDRESS`** 等同源；**`frontend/lib/apiClient/meta.ts`** 机读注释互链 **804～806** 与 **`NEXT_PUBLIC_CHAIN_ID`**） |

## 命令结果（仓库根）

```bash
bash scripts/check-55-s13.sh
```

- **要点**：**55-S13 OK** — **`GuideIdentityStakingPool`/`ProviderIdentityStakingPool`/`Registry`/`EscrowFactory`/`FeeRouter`/`RegionVault`** 共 **6** 个 **`contracts/abi/*.json`** 与 **`frontend/dapp/abis/*.json`** **`cmp` 字节一致**；**`Escrow.json`** 双端含 **`openDispute`**/**`DisputeOpened`**（前端最小 ABI 规则）。
- **说明**：**Escrow** 全量 canonical 与 dapp 精简体**不要求**整文件 `cmp`（脚本 **§2** 文案）；**2b** 子集为闭证扇面。

```bash
find frontend/dapp/abis -maxdepth 1 -name '*.json' | wc -l
```

- **结果**：**10**（与 **95 文首**/**§12.3.3** 机读 **「约 10」** 一致）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（**04 §3.4** 路由/契约链不断）。

## 边界

- **不**替代 **链上已部署合约字节码** vs **本地 `contracts/out`** 的**区块浏览器**终验；**不**替代 **`forge test` / `run-verify-abi-forge.sh`** 全矩阵（未在本包强制跑 **Foundry**）。
- **不**替代 **staging** 上 **`NEXT_PUBLIC_*` 构建注入** 与 **`GET /meta`** **逐字段**人工对拍（Runbook **§7.1**/**§12.4**）。
