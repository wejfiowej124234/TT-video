# TT · TTG V9 Documentation Truth Baseline（全仓文档唯一上游 · DL_R1 + Periphery Candidate plane）

**STATUS:** `V9_DOCUMENTATION_TRUTH_BASELINE` · Phase1 convergence stamp retained as **historical FULL_CONVERGENCE for DL_R1 Mainnet Edition**  
**Living overlay (2026-08-22):** **THREE TRUTH PLANES (Web3 docs only)** — do not collapse Candidate into Official Live  
**PRODUCT plane (orthogonal):** Official Production → Local → Staging — [Dual Truth Planes](TT-TRAVELTRUST-DUAL-TRUTH-PLANES-LATEST.md) · Capture [IN_PROGRESS](TT-OFFICIAL-PRODUCT-REALITY-CAPTURE-LATEST.md). **This file is not the product master.**  
**`TT_PRODUCTION_GO`:** **NO_GO**  

| Plane | What it is | Living now? |
|-------|------------|-------------|
| **A · Mainnet Phase1 Reality** | chain_id=1 addresses below · Solo 48h · FeeRouter/Pool Phase1 · `DEPLOYED_PENDING_CUTOVER` | **YES** (Official Web3 facts) |
| **B · Periphery Governance Upgrade Candidate** | Audit #1 SHA `b19b85810…` · FeeRouterV2 · PoolV2 · NEW Governor+12h Timelock · Sepolia `IN_PROGRESS` | **YES as Candidate** · **≠** Official Live |
| **C · LEGACY / SUPERSEDED narratives** | R2_FINAL remint · Safe-as-V9-admin · globalStakers ACTIVE · old Exact-Match inheritance | **DO_NOT_USE as living** |

**Plane B SSOT:** [Periphery Freeze](TT-TTG-V9-PERIPHERY-GOVERNANCE-UPGRADE-FREEZE-LATEST.md) · [Audit #1](TT-TTG-V9-AI-AUDIT1-PERIPHERY-GOVERNANCE-UPGRADE-LATEST.md) · [Sepolia WAITING_ETA](TT-TTG-V9-PERIPHERY-GOVERNANCE-SEPOLIA-REALITY-WAITING-ETA-LATEST.md) · [ETA Ops P0](TT-TTG-V9-PERIPHERY-SEPOLIA-ETA-OPS-CHECKLIST-LATEST.md)  
**Plane B whitepaper:** [Periphery Delta DRAFT](../whitepaper/TT-TTG-V9-PERIPHERY-GOVERNANCE-UPGRADE-DELTA-DRAFT-EN-LATEST.md) — **not** Mainnet Edition PASS substitute  
**Exact-Match:** Plane B **NOT_ISSUED** · prior DL_R1 Exact-Match **must not** be inherited for Plane B  

**Stamp (DL_R1 historical):** `2026-08-21T11:45:00Z`  
**Residue (DL_R1 pack):** `OLD_V9_ACTIVE_DOCUMENT_REFERENCES=0` … — [Residue Report](TT-TTG-V9-DOCUMENTATION-TRUTH-CONVERGENCE-RESIDUE-LATEST.md) · PASS [`V9_DOCUMENTATION_FULL_CONVERGENCE_PASS.json`](../../evidence/GO_ttg_v9_audit/V9_DOCUMENTATION_FULL_CONVERGENCE_PASS.json)  
**Mainnet Edition Whitepaper (Plane A):** [zh](../whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-LATEST.md) · [en](../whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md) · PASS [`TTG_V9_MAINNET_EDITION_WHITEPAPER_PASS.json`](../../evidence/GO_ttg_v9_audit/TTG_V9_MAINNET_EDITION_WHITEPAPER_PASS.json)  
**GitHub Official Docs pack (Plane A + Candidate pointers):** [`docs/github-official/README.md`](../github-official/README.md)  
**Machine:** [`registry/ttg-v9-documentation-truth-baseline.v1.yaml`](../../registry/ttg-v9-documentation-truth-baseline.v1.yaml) · [`evidence/GO_ttg_v9_audit/V9_DOCUMENTATION_TRUTH_BASELINE.json`](../../evidence/GO_ttg_v9_audit/V9_DOCUMENTATION_TRUTH_BASELINE.json)  
**Conflict scan:** [`V9_DOC_TRUTH_CONVERGENCE_SCAN.json`](../../evidence/GO_ttg_v9_audit/V9_DOC_TRUTH_CONVERGENCE_SCAN.json)  
**Gate:** `python scripts/dev/run-ttg-v9-doc-truth-convergence-gate.py --require-zero`  
**Whitepaper gate:** `python scripts/dev/run-ttg-v9-mainnet-edition-whitepaper-gate.py --require-zero`  
**GitHub Official gate:** `python scripts/dev/run-ttg-v9-github-official-alignment-gate.py --require-zero`

**Forbidden this convergence:** mutate Plane B Candidate Solidity (`b19b85810…`) · redeploy/swap Mainnet addresses as “docs fix” · live on-chain param edits · flip `TT_PRODUCTION_GO` · rewrite Official www / Production `/meta`·Indexer as automatic next step without Owner open · auto `git push` / publicize · claim Plane B is Official Live · inherit old Audit triad PASS for Plane B

**唯一事实基线（本文件上游输入）：**

| Input | Role | Plane |
|-------|------|-------|
| Mainnet Phase1 chain reality | Addresses / genesis / scheduled ops | **A** |
| `V9_AUDIT_CANDIDATE_DESIGN_LOCK` · **DL_R1** | Historical audited Exact Match candidate | **A** (historical bind) |
| [Owner Design Lock](TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md) | Economics / topology lock (Phase1) | **A** |
| `V9_PERIPHERY_GOVERNANCE_UPGRADE_FREEZE` · Audit #1 `b19b85810…` | Periphery upgrade Candidate | **B** |
| Sepolia Reality WAITING_ETA / PASS_STOP | ② Candidate lifecycle | **B** |
| [Phase2 Freeze Wait](TT-TTG-V9-MAINNET-DL-R1-PHASE2-FREEZE-WAIT-LATEST.md) | Cutover pending clock (Phase1) | **A** |
| [`TTG_V9_MAINNET_EDITION_WHITEPAPER_PASS`](../whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-LATEST.md) | Formal whitepaper Plane A | **A** |

---

## 0 · Status machine（写死）

| State | Meaning | Now? |
|-------|---------|------|
| `MAINNET_DEPLOYED_PHASE1` / `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` | Stack + Genesis on chain; Solo ops + KEEP setFeeRouter **not** finished | **YES** |
| `MAINNET_FULLY_ACTIVE` / `ACTIVE_OFFICIAL` | After Solo execute + KEEP SR→NEW FeeRouter + Reality verify + `V9_MAINNET_DEPLOYMENT_VERIFIED_STOP` | **NO** |
| `TT_PRODUCTION_GO` | Independent Owner written GO | **NO_GO** (unchanged) |

**Discipline:** Phase1 facts **may** enter SSOT. **Must not** claim V9 Official FULLY ACTIVE.

---

## 1 · Reality / Contract Facts（Phase1 · chain_id=1）

| Role | Address | Doc status |
|------|---------|------------|
| TTG V9 | `0xD5c1Ef9ec730F93e324A1966bD414a7f5ebc41c9` | `DEPLOYED_PENDING_CUTOVER` · Etherscan Verified |
| SoloTimelock | `0x99e43FaBA8dC773888223f70e1dfCd18bea37D7f` | `DEPLOYED_PENDING_CUTOVER` · admin=Marketing · delay=48h |
| ProjectPool | `0x7B21b421981A3B61cc08c8E22D4fd690E457Df37` | `DEPLOYED_PENDING_CUTOVER` |
| CountryFeeRouter | `0x5afD2e0C8b9fa4eecfde4bf582d3B282D28F4970` | `DEPLOYED_PENDING_CUTOVER` |
| Vault (proxy) | `0xe87378e49Ead2E1a422B8cae118d3C905Ee45B6C` | `DEPLOYED_PENDING_CUTOVER` |
| Market (proxy) | `0xc714E2567982ea92d5f3C5b66ab65532Cfc5f09b` | `DEPLOYED_PENDING_CUTOVER` |
| Governor | `0xA0DfC4C5C544488AfEfE696AfB8e5823911e5A9c` | `DEPLOYED_PENDING_CUTOVER` |
| RoleStake (proxy) | `0xf6A1Fb4435E463117a666818611F49D03F91E7A7` | `DEPLOYED_PENDING_CUTOVER` |
| KEEP EscrowFactoryV2Wired | `0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6` | **KEEP** Money Path |
| KEEP SettlementRouter | `0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372` | **KEEP** · `setFeeRouter` **pending** |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | **KEEP** |
| Legacy Safe | `0x96491aa894658ff7946506318c49F3c76b8f40e7` | **LEGACY** · only Safe→KEEP Timelock one-shot |
| Legacy KEEP Timelock | `0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7` | **LEGACY** for V9 Official governance · one-shot SR retarget only |
| Legacy P4Cap | `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF` | **LEGACY** · **not** V9 sale USDC sink |

**Pending ops:** `idBind` / `idSeed` / `idCallerSr` / `idCallerEf` (Solo ETA ≥ `2026-08-23T10:52:59Z`) · then KEEP `setFeeRouter(NEW)`.

---

## 2 · Economic / Governance locks（ACTIVE narrative）

| Topic | ACTIVE truth |
|-------|----------------|
| Supply | **25T** genesis · **NO-MINT** after |
| Genesis | **50 / 35 / 3 / 5 / 7** → Vault / SoloTimelock / Team / Marketing / Treasury |
| Batches | Five Norm batches · `seedBatchesFromNorm` (after Solo execute) |
| Sale USDC | → **NEW ProjectPool** · never Legacy P4Cap |
| Platform fee | **500 bps (5%)** |
| Fee split | Active steward → **45% / 55% Pool** · else **100% Pool** |
| `globalStakers` 35.75% | **EXIT** · **LEGACY / DO_NOT_USE** as ACTIVE |
| P4 | NEW Pool · **90d ≤ 30%** · ops `to` = Treasury `0xF34804…` |
| Access Fee | **300k USDC** → `0xF34804…` |
| Role Stake | live `totalSupply` × country bps · Steward **ACTIVE** · Merchant/Guide TTG = **`NOT_REQUIRED` / `DISABLED`**（非默认待办）· Guide 履约 = **逐订单 USDC Performance Bond**（Escrow 正交；**≠** 81 Identity ACTIVE）· Merchant Bond **独立未确认** — [Guide Bond](TT-TTG-V9-GUIDE-PER-ORDER-PERFORMANCE-BOND-LATEST.md) · [Stake Layer Split](TT-TTG-V9-OWNER-STAKE-LAYER-SPLIT-LATEST.md) |
| Governance | Governor → **SoloTimelock 48h** · admin = `0xe1e732…` · **no Safe** as V9 Official admin |
| Norm wallets | Marketing `0xe1e732…` · Team `0x010365…` · Treasury/Guardian `0xF34804…` |

---

## 3 · Layer matrix（docs must cite this Baseline）

| Layer | Align to | Principle |
|-------|----------|-----------|
| Final Truth Baseline | This Baseline + Phase1 status machine | Highest priority overlay |
| Web3 Protocol SSOT | Token / Gov / Money / Stake above | Update |
| Architecture / Master Matrix | NEW + KEEP + LEGACY | Update |
| Contract Registry | Phase1 addresses `DEPLOYED_PENDING_CUTOVER` | Update |
| Economic / Fee / Wallet / Security / Release | Design Lock + DL_R1 evidence | Update |
| Indexer / API `/meta` | Prepare V9 projection | Prepare · **no Production cut** |
| Whitepaper / GitHub / 官网 | **Last** · generated from this Baseline only | Do not edit first |

---

## 4 · GLOBAL DEMOTION（ACTIVE path）

| Asset class | Disposition |
|-------------|-------------|
| V8 Official TTG / PM / Governor (FTB V8 Cycle rows) | **SUPERSEDED** as Official V9 token/sale/gov root · historical Reality may remain cited |
| Remint / `R2_FINAL` / old V9 candidate | **LEGACY / SUPERSEDED / DO_NOT_USE** for Official ACTIVE |
| Old Safe / KEEP Timelock / P4Cap as V9 Official admin/sink/Fee | **LEGACY** · Safe+KEEP Timelock allowed **only** for one-shot SR `setFeeRouter` |
| FeeRouter `globalStakers` / 83 Global staking ACTIVE ops | **EXIT** · not living Design Lock |

Historical evidence **must not be deleted**. Unmarked ACTIVE claims must reach **`OLD_V9_ACTIVE_DOCUMENT_REFERENCES=0`**.

---

## 5 · Downstream order（locked）

```text
V9 Mainnet DL_R1 Reality
  → Final Truth Baseline overlay
  → Protocol / Economic / Governance SSOT
  → Architecture Matrix
  → Registry · Security · Release
  → Documentation Baseline (this file)
  → Whitepaper · GitHub · 官网 (last)
```

---

## 中文要点

- 本文件 = **V9 文档唯一上游**；白皮书/GitHub/官网最后引用。  
- Mainnet 现况只能写 **`DEPLOYED_PHASE1` / `TIMELOCK_CUTOVER_PENDING`**，禁止 **FULLY ACTIVE**。  
- 公售 USDC→**NEW ProjectPool**；Fee **5%→45/55 或 100%**；**无** globalStakers ACTIVE。  
- Safe/旧 Timelock/P4Cap **不是** V9 Official ACTIVE 根，仅保留一次性 KEEP 切针事实。  
- **不**改 DL_R1 源码、已部署地址、链上参数、`TT_PRODUCTION_GO`。
