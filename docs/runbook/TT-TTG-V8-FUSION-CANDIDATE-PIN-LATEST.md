# TT · TTG V8 fusion Candidate Pin

> **Official Product Truth（活面）：** TravelTrust Official · **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-…-v9`) · API `8df2ab21…` · historical `daa5ae87` SUPERSEDED · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)


**STATUS:** `FROZEN` · `TTG_V8_FUSION_CANDIDATE_PINNED_STOP`  
**Machine:** [TT-TTG-V8-FUSION-CANDIDATE-PIN-LATEST.json](./TT-TTG-V8-FUSION-CANDIDATE-PIN-LATEST.json)  
**Fusion SSOT:** [TT-TTG-V8-LIVE-LOGIC-FUSION-LATEST.md](./TT-TTG-V8-LIVE-LOGIC-FUSION-LATEST.md)  
**`TT_PRODUCTION_GO`:** `NO_GO`

阶段口径：**① 本地 → ② 测试网 → ③ 公网/生产**。本 Pin **不是** ③ Mainnet cutover，**不是** Official live，**不是** Production GO。

唯一候选 = 已通过 **① Local 25/25** + **② Fusion-aligned Sepolia `PASS_STOP`** + **Etherscan Verified** + **Sourcify `exact_match`** 的 fusion 源。

---

## Frozen compile

| 项 | 值 |
|----|----|
| Solc | **0.8.26+commit.8a97fa7a** |
| optimizer | `true` · `runs=200` |
| `via_ir` | `true` |
| `evm_version` | `paris` |
| Foundry profile | `ttg_v8` |
| ① 复跑 | `bash scripts/dev/run-ttg-v8-forge.sh` → **25/25 PASS** |

`git commit SHA`（源码 + 哈希冻结提交，stamp 提交不改 Solidity）：`8b09d2974804dd20817bff25690a1035055ce3f2`

---

## Frozen bytecode / ABI（keccak256 / sha256）

| 合约 | deployed bytecode keccak256 | ABI sha256 |
|------|-----------------------------|------------|
| NEW TTG `TtgMemeDenomGovernanceToken` | `0x0fea44364ac77a5b2137f12fb5500a2081a58b4020bf9de457b06d6fed8e0f4a` | `0xa39513ae226c7b1aebe6268509d7ff14f5c2c2072395f81e780999eabaa46751` |
| NEW PM `TtgMemeDenomPrimaryMarket` | `0xa6a5023342821805221d7f3672f0fd904defd133e1a7406f365dd7e67945dcfb` | `0x4c2b198fe6fda8a18ba2468d8880c7218dbb9fe814057c53419d8d98307cd02c` |
| NEW Governor `TtgMemeDenomGovernor` | `0x09b957382a0153c3983362eb096974b61d858779e92af3b6bb51192010ffa023` | `0x9729d3ef7ac6d6ac2c87aefe963ee51b0b7a16213fced309680b76a35e21dfd7` |

Creation bytecode keccak 见 JSON。工件在 `contracts/out-ttg-v8/`（gitignore，不入库）。

---

## 未来 Mainnet **唯一允许**的 constructor 参数

Sepolia rehearsal 参数 **不得**抄到 Mainnet。

### TTG

`constructor(team_, daoTreasury_, publicSaleHolder_)`  
创世 **25T** · **15/35/50** 来自 Constants。三个地址 = **③ Preflight 由 Owner 填写**（本波不发明钱包）。

### Primary Market

| 参数 | Mainnet 唯一允许 |
|------|------------------|
| `usdc_` | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| `ttg_` | **本 Pin 部署的 NEW TTG**（尚不存在） |
| `usdcTreasury_` | `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF`（KEEP 活网 P4Cap） |
| `ttgPerUsdcUnit_` | `100000 ether`（1 USDC = 100,000 TTG） |

Constants 钉死（非 constructor，但改了即失效）：**min = 1 USDC** · R1/R2/R3 = **2T / 3T / 7.5T** · entity cap **400 bps** · per-wallet cap **NONE**。

### Governor

| 参数 | Mainnet 唯一允许 |
|------|------------------|
| `token_` | NEW TTG |
| `timelock_` | **`0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7`**（活网 Timelock · **禁止** throwaway） |
| `votingDelayBlocks_` | **1**（活网 `0x46Ce…` eth_call） |
| `votingPeriodBlocks_` | **50400**（活网；**不是** Sepolia 8） |
| `proposalThresholdVotes_` | **`2500000 ether`**（活网 1 TTG × MERGE_RATIO） |
| `quorumNumeratorBps_` | **400** |
| `maxVotingPowerPerAddressBps_` | **0**（KEEP 活网 GOV-03 cap disabled · **禁止**钉 400） |
| `orderRatingReviewWindowDays_` | **14**（活网读数为 0，V8 constructor 禁止 0；14 = rehearsal / TT-B110） |

---

## Sepolia `0x9924…` = rehearsal only

| 角色 | 地址 | 口径 |
|------|------|------|
| Token | `0x9924007BC7f8D5B937cBf1636fB913fc676B0A3D` | **绝不作为 Mainnet 地址** |
| PM | `0xAa5953192653d665A95f1F6E78b496152a4FED65` | 同上 |
| Governor | `0x08263820760938dF4a9918E2Ad37AdF7bCa6E6F1` | 同上 |
| Timelock | `0x2573da…` | throwaway · ③ **KEEP** `0x50f0…` |

Etherscan **Pass - Verified** · Sourcify v2 **`exact_match`**。历史 throwaway `0x7dA9…` **不是**本 Pin。

---

## 失效规则（写死）

Pin 后任何下列变化 **立即**使本 Pin **与 ② fusion 证据**失效，必须重新 rehearsal：

- `contracts/src/ttg-meme-denom/` 下任意 Solidity
- 上表 constructor allowlist
- Solc 0.8.26 / optimizer 200 / `via_ir` / `paris` / `ttg_v8` profile

---

## 本波禁止（未做）

Mainnet broadcast · Safe `setGovernor` · 任何 Timelock schedule/execute · CI-02 · Money Path · 旧 10M `0x3cB1…` 迁移 · FTB 修改 · `/meta` 切针 · Official www bake。

`TTG_V8_FUSION_CANDIDATE_PINNED_STOP` ≠ ③ Preflight ≠ Mainnet deploy ≠ Official live ≠ Production GO。
