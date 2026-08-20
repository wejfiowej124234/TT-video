# TT · TTG V8 live-logic fusion（25T 面额 · DESIGN_ONLY）

**STATUS:** `DESIGN_ONLY` · **Candidate PINNED** · **① 25/25** · **② fusion Sepolia PASS_STOP** · **③ Preflight CLOSED** · **2A RUNTIME_PASS** · **Verification-1 PASS_STOP** · **`setGovernor` RUNTIME_PASS**（live already NEW · 禁止再发）· **Token Risk Differential `HOLD_NO_CUSTODY_CHANGE`** · **Token Risk Index `HOLD_RESCAN_PASS_STOP`（独立轨 · 不得 unwind V8 针）** · **Official Product Runtime Cutover Precheck `PASS_STOP`** · **Official Contract Registry Cutover Precheck `PASS_STOP`（`/meta` 段已 SUPERSEDED）** · **Official API Runtime ALIGNED** · **Registry/Runtime/L7 Consistency Cert `PASS_STOP`** · **Official Quote Surface Cutover Precheck `STOP`**（编译示意须重编译 · 无零漂移 overlay）· **Official www product surface FROZEN OLD bake** · **FTB V8 Cycle `20260818` ACTIVE**（parent `20260812` immutable）· **NOT** Production GO  
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

### 3.5 独立闸（2026-08-18 · `TTG_V8_FUSION_3_DEPLOY_AND_SETGOVERNOR_OWNER_AUTH_REQUIRED`）

Owner 本会话写出 2A：**③ Mainnet Deploy NEW TTG / NEW PM / NEW Governor + Safe NEW_TTG allowlist**。句中写明 **不含 Verification-1 与 setGovernor**。2A 已链上 **RUNTIME_PASS**。Owner 随后写死：Verification-1 **必须先于任何切针**。Verification-1 已 **PASS_STOP**（含 PM/Governor Sourcify `exact_match`）。Safe `setGovernor(NEW)` 已链上 **RUNTIME_PASS**（tx `0x94f61c61…2216` · block `25777625`）。2B 专用脚本已只读 pre-check + fork dry-run **PASS_STOP**；**禁止再发**。不重跑 Preflight。不改 Pin `8b09d297`。

NEW TTG `0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602` · NEW PM `0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2` · NEW Governor `0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F`。live Timelock `governor()` **已经是** NEW `0xD5819acACdA86F2C73de4a18cb5e4464ECAF787F`。

SSOT：[TT-TTG-V8-FUSION-3-OWNER-AUTH-GATE-LATEST.md](./TT-TTG-V8-FUSION-3-OWNER-AUTH-GATE-LATEST.md) · [fills](./TT-TTG-V8-FUSION-3-GENESIS-ADDRESS-FILLS-LATEST.md) · evidence `GO_ttg_v8_mainnet_2a`。

`team_` / `daoTreasury_` / `publicSaleHolder_` 已点名。MUST 1–7 已点头并执行。2A PASS ≠ Verification-1 ≠ `setGovernor`。`TT_PRODUCTION_GO` 仍 **NO_GO**。

### 3.6 Token Risk Index HOLD_RESCAN（`TTG_V8_TOKEN_RISK_INDEX_HOLD_RESCAN`）

只读：[TT-TTG-V8-TOKEN-RISK-INDEX-HOLD-RESCAN-LATEST.md](./TT-TTG-V8-TOKEN-RISK-INDEX-HOLD-RESCAN-LATEST.md)。官方地址识别：[registry/ttg-v8-token-risk-official-address-identification.v1.yaml](../../registry/ttg-v8-token-risk-official-address-identification.v1.yaml)。

- NEW TTG / PM / Governor、25T、15/35/50 **未动**。**禁止**再发 `setGovernor`。
- GoPlus 同条件复检：`is_open_source=1` · NEW `buy_tax`/`sell_tax` 已追上 `"0"` · holder `tag` 两边仍空。
- Bitget UI 无公开 API；老鼠仓 50% 在稳定索引后是否仍持续 = **未证明** → tranche &lt;15% **NOT_THIS_PHASE**。
- **禁止**拆仓、迁币、改 FTB、切 `/meta`、bake Official www、宣称 Production GO。

### 3.7 Official Product Runtime Cutover Precheck（`TTG_V8_OFFICIAL_PRODUCT_RUNTIME_CUTOVER_PRECHECK`）

只读：[TT-TTG-V8-OFFICIAL-PRODUCT-RUNTIME-CUTOVER-PRECHECK-LATEST.md](./TT-TTG-V8-OFFICIAL-PRODUCT-RUNTIME-CUTOVER-PRECHECK-LATEST.md)。

- HOLD_RESCAN **仍绑定**。**禁止**迁币 / 拆仓 / 再发 `setGovernor`。
- 控制面：Timelock.governor = NEW。
- **当时快照：** 产品面 `/meta` + Official www bake env 仍 OLD TTG / OLD Governor；`primary_market_address` **缺键**。
- **2026-08-18 活 overlay：** Official `/meta` **NOW** NEW Governor / NEW TTG / NEW PM `0x882Ad` + SR-FT。www chrome **10→10** + CMS 25T = Expected Difference · bake **FORBIDDEN**。见 [§3.11 Consistency Cert](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md)。
- KEEP：Timelock · Money Path · CI-02 · Official FeeRouter hop。FTB `20260812` **LOCKED**。
- 未部署合约默认 **不部署**。唯一「以后若部署必须绑新币」：`RegionStewardStakePool`（NEW TTG + 25T units）。
- `PASS_STOP` · **当时**等待 Owner **独立产品切针授权**。**之后已发生：** API Runtime overlay + Consistency Cert。www bake 仍 **FORBIDDEN**。`TT_PRODUCTION_GO=NO_GO`。

### 3.8 Official Contract Registry Cutover Precheck（`TTG_V8_OFFICIAL_CONTRACT_REGISTRY_CUTOVER_PRECHECK`）

只读全项目 Mainnet 矩阵：[TT-TTG-V8-OFFICIAL-CONTRACT-REGISTRY-CUTOVER-PRECHECK-LATEST.md](./TT-TTG-V8-OFFICIAL-CONTRACT-REGISTRY-CUTOVER-PRECHECK-LATEST.md)。

- **不是**全部合约重新部署。NEW TTG / PM / Governor 已 L7 部署并接到 KEEP Timelock；其余成熟合约 KEEP。
- L7 NEW 映射全部正确：TTG `0x0EC4…3602` · PM `0x882A…B6D2` · Governor `0xD581…787F` · Timelock `0x50F0…22f7`（`governor()`=NEW · `admin()`=Safe）。
- **当时快照（2026-08-17 23:58Z）：** OLD `0x3cB1…` / `0xf7B7…` / `0x46Ce…` 仍被 Official `/meta`、living Registry、www bake env 引用。`/meta` `primary_market_address` 缺键。
- **Living successor：** [Registry/Runtime/L7 Consistency Cert](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md) — Official API Runtime + Registry Official 槽 **已** NEW。www bake 与 FTB 吸收仍另闸。不得用本快照回滚 V8 针。`TT_PRODUCTION_GO=NO_GO`。

### 3.9 Official Runtime Contract Cutover · NO_UI_BAKE（`TTG_V8_OFFICIAL_RUNTIME_CONTRACT_CUTOVER_NO_UI_BAKE`）

[TT-TTG-V8-OFFICIAL-RUNTIME-CONTRACT-CUTOVER-NO-UI-BAKE-LATEST.md](./TT-TTG-V8-OFFICIAL-RUNTIME-CONTRACT-CUTOVER-NO-UI-BAKE-LATEST.md)

- Owner 已授权 runtime-only 切针，并 **CANCEL** checkout 旧 tip / bake www。
- **当时** `STOP_BLOCKED_RUNTIME_DECOUPLING_REQUIRED`（2026-08-18 01:16Z）：活 API `8df2ab21` 不能仅靠 env 放出 `primary_market_address` 与 V8 报价。
- **之后已闭：** [API Runtime Decoupling](./TT-TTG-V8-API-RUNTIME-DECOUPLING-NO-WEB-TOUCH-LATEST.md) 放出 overlay；Official `/meta`/quote **已** NEW。www pin 未动。`TT_PRODUCTION_GO=NO_GO`。

### 3.10 Official API Runtime Decoupling · No Web Touch（`TTG_V8_API_RUNTIME_DECOUPLING_NO_WEB_TOUCH`）

[TT-TTG-V8-API-RUNTIME-DECOUPLING-NO-WEB-TOUCH-LATEST.md](./TT-TTG-V8-API-RUNTIME-DECOUPLING-NO-WEB-TOUCH-LATEST.md)

- Official API `/meta` + quote = NEW V8；Official www fingerprint BEFORE == AFTER。
- `PASS_STOP` · ≠ FTB 已改 ≠ Production GO。

### 3.11 Registry / Runtime Evidence / Mainnet Reality Consistency Cert（`TTG_V8_REGISTRY_RUNTIME_MAINNET_REALITY_CONSISTENCY_CERT`）

[TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md](./TT-TTG-V8-REGISTRY-RUNTIME-MAINNET-REALITY-CONSISTENCY-CERT-LATEST.md)

- Overlay = living Registry Official = Official `/meta`/quote = Mainnet L7 = **NEW V8 ALIGNED**。
- Official www Product Truth = **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-live-auth-pin-nontarget-v9-20260820`；historical `daa5ae87` SUPERSEDED；cert-era Expected Difference 观察保留）。FTB `20260812` = immutable parent。Living FTB = V8 Cycle `20260818` Active Truth（NEW TTG/PM/Governor · KEEP Money Path）+ Product Truth OPS-v9。M07 **NOT this wave**。
- Token Risk · Bitget HOLD = **独立轨** · 不得 unwind V8 针。
- Consistency Cert `PASS_STOP` 被引用，不重证 · `TT_PRODUCTION_GO=NO_GO`。下一闸 = Final Reality / Release Certification（未做）。

### 3.12 Official Quote Surface Cutover Precheck（`TTG_V8_OFFICIAL_QUOTE_SURFACE_CUTOVER_PRECHECK`）

[TT-TTG-V8-OFFICIAL-QUOTE-SURFACE-CUTOVER-PRECHECK-LATEST.md](./TT-TTG-V8-OFFICIAL-QUOTE-SURFACE-CUTOVER-PRECHECK-LATEST.md)

- 只读核验 Official `/traveltrust#liquidity`：报价面 **只认 USDC**。**API 报价已 V8** `1 USDC = 100,000 TTG`；**示意仍是编译期 OLD USDC** `1 USDC → 约 0.0360 TTG` / `1 TTG ≈ 27.7778 USDC`。
- 零 UI/UX 漂移允许名单：**仅** API overlay 已 live。示意行无手术式 overlay；git-tree web3 overlay = 整镜像替换 = **FORBIDDEN**。
- 本闸 **`STOP`** · 不得 bake / checkout pin / 改 i18n·CSS·组件·公告·ticker · `TT_PRODUCTION_GO=NO_GO`。
