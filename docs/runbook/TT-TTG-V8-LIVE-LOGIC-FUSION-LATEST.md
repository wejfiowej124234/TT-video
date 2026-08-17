# TT · TTG V8 live-logic fusion（25T 面额 · DESIGN_ONLY）

**STATUS:** `DESIGN_ONLY` · **Candidate PINNED** · **① 25/25** · **② fusion Sepolia PASS_STOP** · **NOT** Official live · **NOT** ③ Mainnet cutover · **NOT** Production GO  
**Pin:** [TT-TTG-V8-FUSION-CANDIDATE-PIN-LATEST.md](./TT-TTG-V8-FUSION-CANDIDATE-PIN-LATEST.md)  
**Machine:** [registry/ttg-v8-live-logic-fusion.v1.yaml](../../registry/ttg-v8-live-logic-fusion.v1.yaml)  
**Classification policy:** [TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY](./TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)  
**`TT_PRODUCTION_GO`:** unchanged · **Official www freeze:** 不得 bake · **FTB 20260812:** 不得改地址字节 · **Money Path / CI-02:** 不得触

阶段口径：**① 本地 → ② 测试网 → ③ 公网/生产**。禁止跳阶。禁止用 ① forge 绿冒充 ③ cutover。

---

## 0 · 融合定义（写死）

V8 **不是**重做 TravelTrust Web3。V8 把 **当前已部署、已验证的最新业务逻辑** 迁到新的 **25T TTG 面额**。

- 能 KEEP 的原样 KEEP。
- 只有被 immutable 钉死的 **TTG / Primary Market / Governor** 必须换新实例。
- 任何额外 KYC / O3 / O5 / O1 席位类型机 / O4 非席位 quorum 地板 / 旧历史逻辑 = **Drift**，③ 前必须对齐或踢出 cutover。

### Closed Expected Difference（仅这些 · CONFIRM_DESIGN）

| # | 差异 | 活网 | V8 |
|---|------|------|----|
| 1 | 新 TTG 地址 | `0x3cB1…` 10M | 新实例 |
| 2 | 总供应 | 10,000,000 TTG | 25,000,000,000,000 TTG |
| 3 | 分配 | 活网 Genesis V2 Public 50% 等 | Team 15 / DAO 35 / Public 50 |
| 4 | 报价 | `ttgPerUsdcUnit=4e16`（1 USDC = 0.04 TTG · $25/TTG） | `100_000 ether`（1 USDC = 100,000 TTG） |
| 5 | 绝对 TTG 数量重标定 | 10M 单位 | × `2,500,000`（轮次 80万/120万/300万 → 2T/3T/7.5T；提案钳制 5k/50k/100k/200k 同乘） |
| 6 | 最低买 | GOV-04-A1 **10 USDC**（旧 $25/TTG 地板） | **1 USDC**（到账 100,000 TTG） |

### 必须与活网一致（Drift 则 FIX）

PM 状态机 · 购买账 `walletPurchasedTtg` · 三轮 · Governor 提案/投票/quorum · Timelock（③ KEEP 活网实例）· Money Path（KEEP）· 权限语义（0.5/1/2% + 400 bps quorum + 400 bps entity cap + per-wallet cap NONE）。最低买 1 USDC 是上表 ED #6，不是 Drift。

---

## 1 · KEEP / REPLACE / NOT_IN_CUTOVER

| 组件 | 处置 | 活网 |
|------|------|------|
| TTG | **REPLACE** 新实例 | `0x3cB1b328E7a4ea01006b0697813aFEEdafe8512A` |
| Primary Market | **REPLACE** 新实例 · 状态机抄 `TtgPrimaryMarketV1AcquisitionPrice25Usdc` | proxy `0xf7B7BBa2a5f21b91Fbb016d6B8853DEFa34f56ce` |
| Governor | **REPLACE** 新实例 · 提案/投票/quorum 抄 `TravelTrustGovernor` | proxy `0x46Ce671b04d21760e496646bb370ADEbC374ea4d` |
| Timelock | **KEEP** · ③ 只 `setGovernor` | `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` |
| Money Path | **KEEP** | Wired / SR / OLD FeeRouter |
| CI-01 Seat 路由表 | **KEEP 作路由** · 不当 V8 创世 SSOT | `0x68e55d…` |
| SeatGate / vote-escrow lock / O4 / KYC / O3 / O5 / Migrator 默认创世 | **NOT_IN_CUTOVER** | 活网产品没有 |

已广播的 Sepolia `TtgMemeDenom*` 栈（`0x7dA9…` / `0xA6a7…` / `0x8512…`）= **② 历史 rehearsal**，**不是** fusion-aligned ③ 候选。禁止把它当 cutover 字节码。

---

## 2 · 逐项分类（活网最新 vs 融合前 V8）

| 项 | 分类 | 处置 |
|----|------|------|
| 新 TTG 地址 · 25T · 15/35/50 · 1 USDC=100,000 TTG · ×2.5M 数量 | **EXPECTED_DIFFERENCE** | CONFIRM_DESIGN |
| Token checkpoints / transfer / 无 `mint` 标识 · 0.8.26 | **EXPECTED_DIFFERENCE**（新币扫描钉） | CONFIRM_DESIGN |
| Token `lockModule` / `lockedBalance` | **DRIFT** | 删除 · 对齐活网 `GovernanceVotesToken` |
| PM 报价单位 4e16 → 100_000 ether | **EXPECTED_DIFFERENCE** | CONFIRM_DESIGN |
| PM 最低买 **1 USDC** vs 活网 **10 USDC** | **EXPECTED_DIFFERENCE** | CONFIRM_DESIGN · 旧 $25/TTG 地板不跟到新币 |
| PM 三轮形状 + `walletPurchasedTtg` 审计账 + cap NONE | **KEEP** 逻辑 · 数量 ×2.5M | FIX 缺的 `initializeProxyStorage` / `PerWalletCapExceeded` ABI |
| PM `walletPurchasedTtg` 当 SeatGate 硬闸 | **DRIFT** | 踢出 ③ cutover |
| Governor quorum = `(for+abstain) ≥ supply × 400 / 10000` | **KEEP** | 删除 O4 remainder/non-seat floor |
| Governor `hasVoted` / `entityVotes` | **DRIFT** | 删除 · 对齐活网可重复计票语义 |
| Governor `proposalThresholdVotes` + V311 钳制 | **KEEP 语义** · 钳制 ×2.5M | 恢复 |
| Entity cap 450 bps | **DRIFT** | 改回活网 **400** |
| 独立 `TtgMemeDenomTimelock` 无 allowlist | **DRIFT（若当 ③）** | ③ KEEP 活网 Timelock |
| KYC / O3 / O5 / O1 类型机 / DAO_SPONSORED | **DRIFT** | 不进 ③ TTG/PM/Gov cutover |

---

## 3 · 本波完成标准（① only）

1. 本登记 + YAML 为 fusion SSOT（Master Plan O2/O3/O5 **不是**下一工作）。  
2. `contracts/src/ttg-meme-denom/` 的 **TTG / PM / Governor** 与上表对齐。  
3. `bash scripts/dev/run-ttg-v8-forge.sh` exit 0。  
4. **禁止** Mainnet broadcast。② fusion rehearsal 必须用**新**栈（无 O1/O4）；禁止重跑历史 Sepolia `0x7dA9…` 冒充 fusion。

### 3.1 ① Local forge proof（2026-08-18）

`bash scripts/dev/run-ttg-v8-forge.sh` → **exit 0** · **25/25 PASS** · Solc **0.8.26**.

| 套件 | 结果 |
|------|------|
| `TtgMemeDenomTokenomicsTest` | 16 PASS（25T · 15/35/50 · 1 USDC=100,000 TTG · **min 1 USDC** · 2T/3T/7.5T · V311 钳制 ×2.5M · 无 lockModule · live quorum 法国 4.5% 可单独开会 · entity cap 400） |
| `TtgMemeDenomRehearsalTest` | 4 PASS（创世三分 · 购买账 · live quorum · 源码无 `mint` 标识） |
| `TtgMemeDenomMigrationTest` | 5 PASS（可选兑 1:2,500,000 · **不**预充 25T · 400 bps = 1T） |

① 绿 **≠** ② fusion-aligned Sepolia **≠** ③ Mainnet cutover **≠** Production GO.

### 3.2 ② Sepolia fusion rehearsal proof（2026-08-18）

`bash scripts/dev/run-ttg-v8-sepolia-genesis-rehearsal.sh` → **exit 0** · stamp `TTG_V8_FUSION_SEPOLIA_REHEARSAL_PASS_STOP`.

| 项 | 值 |
|----|----|
| 新 TTG | `0x9924007BC7f8D5B937cBf1636fB913fc676B0A3D` |
| PM | `0xAa5953192653d665A95f1F6E78b496152a4FED65` |
| Governor | `0x08263820760938dF4a9918E2Ad37AdF7bCa6E6F1` |
| 最低买 | **1 USDC** → 100,000 TTG |
| Etherscan | Pass - Verified |
| Sourcify v2 | `exact_match` |
| O1/O4 | **NOT_IN_CUTOVER** |
| `TT_PRODUCTION_GO` | `NO_GO` |

② 绿 **≠** Official live **≠** Mainnet cutover **≠** Production GO。历史 throwaway `0x7dA9…` **不是**本栈。

树内 `GenesisSeatGate` / vote-escrow leftover / Migrator **仍是 NOT_IN_CUTOVER**，不得接进 ③ TTG/PM/Gov。

### 3.3 Candidate Pin（2026-08-18 · `TTG_V8_FUSION_CANDIDATE_PINNED_STOP`）

唯一候选已冻结：[TT-TTG-V8-FUSION-CANDIDATE-PIN-LATEST.md](./TT-TTG-V8-FUSION-CANDIDATE-PIN-LATEST.md)。

- git SHA + Solc **0.8.26** + NEW TTG/PM/Governor bytecode/ABI hash + Mainnet constructor allowlist 已钉。
- Sepolia `0x9924…` **仅为 rehearsal**，**绝不**作为 Mainnet 地址。
- Pin 后改 Solidity 或 constructor 参数 → ② 证据失效，须重新 rehearsal。
- **本波未做** Mainnet broadcast / Safe `setGovernor` / Timelock / CI-02 / Money Path / 10M 迁移 / FTB / `/meta` / Official www bake。

`TT_PRODUCTION_GO` = **NO_GO**。

### 3.4 ③ Preflight（2026-08-18 · `TTG_V8_FUSION_3_PREFLIGHT_PASS_STOP`）

只读核对已过：[TT-TTG-V8-FUSION-3-PREFLIGHT-LATEST.md](./TT-TTG-V8-FUSION-3-PREFLIGHT-LATEST.md)。

- Pin `8b09d297` 源码/字节码未漂 · ① **25/25** · 活网 Timelock / USDC / P4Cap KEEP 已 eth_call。
- 三个创世地址仍 **OWNER_FILLS_UNSET**（不发明钱包）。
- **本波未做** Mainnet broadcast / Safe `setGovernor` / Timelock op / CI-02 / Money Path / 10M 迁移 / FTB / `/meta` / Official www bake。

本事件到此结束。`TT_PRODUCTION_GO` 仍 **NO_GO**。
