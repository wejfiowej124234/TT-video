# GO_95 · §7.4 ABI · 合约 · 链基线重验（2026-04-22）

## 1. 目的

在 **《95》§7.4** 六子条已 **`[x]`** 的前提下，重跑 **55-S13**、**04 路由闸**、**Rust 契约子集**、**治理文档链**、**前端 Vitest**（**governance** / **staking** / **didRank**），确认机读链仍绿。  
**不**替代 **`evidence/GO_95_20260421_section7_4_*/README.md`** 各子包全文；**不**替代 **forge test** / **主网字节码** / **staging `curl /meta`** 终验。

## 2. 命令与结果（仓库根，除非另注）

### 2.1 **55-S13** + **04** + **`dapp/abis` 计数**

```bash
bash scripts/check-55-s13.sh
# → 55-S13 OK（**contracts/abi ↔ frontend/dapp/abis** 关键 JSON **cmp** 等）

bash scripts/run-check-04-routes.sh
# → exit 0

find frontend/dapp/abis -maxdepth 1 -name '*.json' | wc -l
# → 10
```

### 2.2 **Escrow / `orders_projection` / 110**（子集）

```bash
cargo test -p traveltrust-api orders_projection::
# → 19 passed
```

### 2.3 **FeeRouter / RegionVault / governance 只读**（子集）

```bash
cargo test -p traveltrust-api governance_read_contract_contract_tests::
# → 7 passed

cargo test -p traveltrust-api fee_router_events::
# → 5 passed

cargo test -p traveltrust-api region_vault_events::
# → 3 passed

cargo test -p traveltrust-api governance_investor_share::
# → 2 passed
```

### 2.4 **TTG / governance-token/02 / `/governance` UI**（子集）

```bash
bash scripts/check-governance-doc-linkage.sh
# → OK: governance doc linkage checks passed.

cargo test -p traveltrust-api governance_doc_reference::
# → 7 passed

cd frontend && npx vitest run governance
# → Test Files 18 passed; Tests 66 passed
```

### 2.5 **IdentityStaking / `/staking`**（子集）

```bash
cargo test -p traveltrust-api staking_event_topic0s_keccak
# → 1 passed

cargo test -p traveltrust-api guide_stake_without_chain_off_is_503_chain_off_unavailable
# → 1 passed

cd frontend && npx vitest run staking
# → Test Files 1 passed; Tests 4 passed
```

### 2.6 **DID · `did-rank`**（子集）

```bash
cargo test -p traveltrust-api routes::did_rank::tests
# → 11 passed

cargo test -p traveltrust-api health_meta::tests::did_rank
# → 4 passed

cd frontend && npx vitest run didRank
# → Test Files 7 passed; Tests 53 passed
```

（**Vitest** 日志中 **`getDidRankTravelers API status not ok`** 为**预期**负例路径控制台输出，**不**表示套件失败。）

## 3. 与 §7.4 子条互证（仍以前序证据为主证）

| §7.4 子条 | 主证目录（2026-04-21） |
|-----------|-------------------------|
| （14）链 ID / ABI / `NEXT_PUBLIC_*` | `…section7_4_chain_abi_next_public/` |
| Escrow / projection / 110 | `…section7_4_escrow_orders_projection_110/` |
| FeeRouter / RegionVault / governance 只读 | `…section7_4_fee_router_region_vault_governance_read/` |
| TTG / 02 / governance UI | `…section7_4_ttg_governance_token_02_ui/` |
| IdentityStaking / `/staking` | `…section7_4_identity_staking_81_b116_staking_ui/` |
| DID / PG | `…section7_4_did_chain_did_rank_pg/` |

## 4. 诚实边界

- **Rust** 合计 **60**（**19+7+5+3+2+7+1+1+11+4**）+ **Vitest** **123**（**66+4+53**）为**窄扇面**；**不**闭 **§7.7** 治理 **pool/rewards 真源**、**不**闭 **F-029** **行完成**。
- **`cargo test`** 多过滤串须**分命令**执行（见 **§7.3** 基线证据 **§4**）。
