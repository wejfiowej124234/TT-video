# GO_95 · §7.4 ABI · 合约 · 链 · 机读复验（补充登记 · v1.4.166）

**Scope:** **§7.4** 六条横切 — **55-S13** / **合约·ABI·dapp 计数** / **`check-governance-doc-linkage`** / **Rust 子集**（**orders_projection**/**governance 只读契约**/**fee_router**/**region_vault**/**staking topic0**/**guide_stake 503**/**governance_doc_reference**/**did-rank**/**meta did_rank**）/ **有界 Vitest**（**`staking`+`governance`+`didRank`** 同次 `npx vitest run`）+ **`run-check-04-routes`**。  
**Date:** 2026-04-22  
**Repo:** `d:\Wbe3-TravelTrust`

## 1. 命令与真值输出

```bash
bash scripts/check-07-version-triple.sh   # OK · 07 1.0.858
bash scripts/run-check-04-routes.sh       # exit 0（含 178 api.ts↔04）
bash scripts/check-55-s13.sh              # 55-S13 OK
find contracts/src -maxdepth 1 -name '*.sol' | wc -l
find contracts/abi -maxdepth 1 -name '*.json' | wc -l
find frontend/dapp/abis -maxdepth 1 -name '*.json' | wc -l
find contracts/script contracts/test -name '*.sol' | wc -l
test ! -d packages && echo "root packages/: absent"
bash scripts/check-governance-doc-linkage.sh   # OK

cargo test -p traveltrust-api orders_projection::
cargo test -p traveltrust-api governance_read_contract_contract_tests::
cargo test -p traveltrust-api fee_router_events::
cargo test -p traveltrust-api region_vault_events::
cargo test -p traveltrust-api staking_event_topic0s_keccak
cargo test -p traveltrust-api guide_stake_without_chain_off_is_503_chain_off_unavailable
cargo test -p traveltrust-api governance_doc_reference::
cargo test -p traveltrust-api routes::did_rank::tests
cargo test -p traveltrust-api health_meta::tests::did_rank

cd frontend && npx vitest run staking governance didRank --reporter=dot
```

**机读计数（摘录）**

| 指标 | 值 |
|------|-----|
| `contracts/src` `*.sol`（`-maxdepth 1`） | **23** |
| `contracts/abi` `*.json` | **18** |
| `frontend/dapp/abis` `*.json` | **10** |
| `contracts/script`+`contracts/test` `*.sol` | **20** |
| 根 `packages/` | **无**（`test ! -d packages`） |

**Rust 子集**

| `cargo test` 过滤前缀 | passed |
|------------------------|--------|
| `orders_projection::` | **19** |
| `governance_read_contract_contract_tests::` | **7** |
| `fee_router_events::` | **5** |
| `region_vault_events::` | **3** |
| `staking_event_topic0s_keccak` | **1** |
| `guide_stake_without_chain_off_is_503_chain_off_unavailable` | **1** |
| `governance_doc_reference::` | **7** |
| `routes::did_rank::tests` | **11** |
| `health_meta::tests::did_rank` | **4** |

**Vitest（有界 · 同一 CLI）**

- **`npx vitest run staking governance didRank`** → **26** files / **123** tests **passed**（**stderr** 中含 **`didRank.test.ts`** 预期 **`invalid_period`** 负例日志，**非**失败）。

## 2. 诚实边界（非闭证）

- **不**将本包 **Vitest 123** 与 **95** 历史叙述 **「governance 66 + staking 4 + didRank 53」** 简单等同（**本次**为 **三 filter 合并**一次跑出的 **26/123** 机读真值）。
- **不**替代 **`forge test`** / **主网字节码** / **93** 域矩阵 / **83/84** 账本终局 / **staging `indexer-tick`** 全量。
- **不**闭 **§8.2 F-029**/**110**/**§12.2·C-5** 主行。

## 3. 互指

- **95 · §7.4** 六条 **`[x]`** 主证据仍为 **`evidence/GO_95_20260421_section7_4_chain_abi_next_public/README.md`** 等 **2026-04-21** 域包。
- **95 · §12.4** 登记本路径。
