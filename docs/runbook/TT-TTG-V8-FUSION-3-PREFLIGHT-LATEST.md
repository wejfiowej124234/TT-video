# TT · TTG V8 fusion · ③ Preflight（只读）


> **STATUS (V9 Documentation Truth Convergence · phase-2):** **SUPERSEDED as Official ACTIVE V9 path** · **DO_NOT_USE_AS_ACTIVE_TRUTH** · **HISTORICAL**.  
> Sole living upstream: [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Public-sale USDC→P4Cap · globalStakers 35.75% · R2_FINAL/Remint · Safe/old Timelock as V9 Official admin = **LEGACY / SUPERSEDED**. Evidence retained.

> **Official Product Truth（活面）：** TravelTrust Official · **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-…-v9`) · API `8df2ab21…` · historical `daa5ae87` SUPERSEDED · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)


**STATUS:** `TTG_V8_FUSION_3_PREFLIGHT_PASS_STOP`  
**Machine:** [TT-TTG-V8-FUSION-3-PREFLIGHT-LATEST.json](./TT-TTG-V8-FUSION-3-PREFLIGHT-LATEST.json)  
**Pin:** [TT-TTG-V8-FUSION-CANDIDATE-PIN-LATEST.md](./TT-TTG-V8-FUSION-CANDIDATE-PIN-LATEST.md)  
**`TT_PRODUCTION_GO`:** `NO_GO`

阶段口径：**① 本地 → ② 测试网 → ③ 公网/生产**。本闸是 ③ **只读 Preflight**。**不是** Mainnet deploy，**不是** Official live，**不是** Production GO。

RPC：`https://ethereum.publicnode.com` · stamp `2026-08-17T16:57:55Z` · **零广播**。

---

## 核对结果

| # | 项 | 结果 |
|---|-----|------|
| 1 | Pin SHA `8b09d297` Solidity 未漂 | ✅ |
| 2 | 源码 SHA256 = Pin | ✅ |
| 3 | Force rebuild Solc **0.8.26+commit.8a97fa7a** · bytecode/ABI = Pin | ✅ |
| 4 | ① `forge test` **25/25 PASS** | ✅ |
| 5 | 报价 `100_000 ether` · 最低买 `1e6` · 轮次 **2T / 3T / 7.5T** · entity/quorum **400 bps** | ✅ |
| 6 | Governor `timelock_` = 活网 `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` | ✅ |
| 7 | `usdc_` = 主网 USDC `0xA0b86991…eB48`（symbol USDC · 6 decimals · codesize 2186） | ✅ |
| 8 | `usdcTreasury_` = 活网 P4Cap `0xfB906ae3…9BbF` | ✅ |
| 9 | **不**部署新 Timelock / Money Path / Migrator / SeatGate | ✅ 本波未部署 |
| 10 | Sepolia `0x9924…` **未**当作 Mainnet 地址 | ✅ |

---

## 活网 KEEP（eth_call）

| 合约 | 读数 | 处置 |
|------|------|------|
| Timelock `0x50f0…` | admin = Safe `0x96491aa8…` · governor = 活网 Gov `0x46Ce…` · delay **172800**（48h） | **KEEP** 实例 |
| `setGovernor` | `onlyAdmin` · **不是** 48h `schedule` | 活网函数语义（本事件不调用） |
| Governor `0x46Ce…` | delay **1** · period **50400** · threshold **1 TTG** · quorum **400** · per-address cap **0** · review days **0** · token = 旧 TTG · timelock = 活网 | 实例 **REPLACE**；参数按 Pin 缩放 |
| PM `0xf7B7…` | USDC / P4Cap / 旧 TTG · `ttgPerUsdcUnit=4e16` · min **10 USDC** · per-wallet **0** · rounds **800k / 1.2M / 3M** | 实例 **REPLACE**；Closed ED 已确认 |
| 旧 TTG `0x3cB1…` | 总量 **10M** · PM 持仓 ≈ **4.999M** | **LEGACY** · 本针不迁 |

V8 轮次 = 活网 800k/1.2M/3M × `MERGE_RATIO` 2,500,000 → **2T / 3T / 7.5T**。提案门槛 = 活网 1 TTG × 2,500,000 = **`2500000 ether`**。最低买 10 USDC → **1 USDC**（Closed ED）。

活网 `orderRatingReviewWindowDays=0`；V8 constructor **禁止 0**。Pin 仍钉 **14**。

---

## 未填（不发明钱包）

`TtgMemeDenomGovernanceToken` 三个创世地址仍是 **`OWNER_FILLS_UNSET`**：

- `team_`
- `daoTreasury_`
- `publicSaleHolder_`

须三个 **互不相同、非零、Mainnet** 地址。旧币 PM 持仓 **不是** `publicSaleHolder_` 的填值。

---

本文件只记录 **③ Preflight** 这一件审计事件。`TT_PRODUCTION_GO` 仍 **NO_GO**。
