# TT · TTG V9 — Pre-Audit Alignment Register (Root Replacement + Money Flow)


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** `PRE_AUDIT_ALIGNMENT_ACTIVE` · **3× security audit NOT STARTED**  
**Owner Target FREEZE:** [Owner Economic Target FREEZE](TT-TTG-V9-OWNER-ECONOMIC-TARGET-FREEZE-LATEST.md)  
**Owner answers required:** [Owner Decision Checklist](TT-TTG-V9-OWNER-DECISION-CHECKLIST-LATEST.md)  
**Rule:** Checklist P0 answered → implement Target → Local→Sepolia → **new** Audit Candidate → 3× audits  
**Forbidden:** Inherit old R2_FINAL Pre-Mainnet/RT2/Audit3 PASS for Fee+Root+Stake Target · Sepolia/Mainnet broadcast · auto `TT_PRODUCTION_GO`

Parents: [Money Flow](TT-TTG-V9-MONEY-FLOW-ECONOMIC-TRUTH-RECONCILIATION-LATEST.md) · [Gov Root Replacement](TT-TTG-V9-GOVERNANCE-ROOT-REPLACEMENT-LATEST.md) · [Fee vs Stake](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md)

---

## Already aligned (do not reopen)

| Item | Status |
|------|--------|
| Path A · Sale USDC → P4Cap Exact | ALIGNED |
| Path B · 300k Access Fee → Marketing Exact `0xe1e732…` | ALIGNED Exact · collection OPEN (orthogonal) |
| Role Stake ⊥ FeeRouter · ten-country bps · live `totalSupply()` Target | FROZEN Target |
| FeeRouter `globalStakers` 35.75% Owner ACTIVE | **EXIT** |
| Platform fee Target · 45/55 or 100%→P4Cap | FROZEN Target · **implementation open (checklist)** |
| R2_FINAL Token/Vault/PM monetary bytes (25T · batches · burn) | Reference only · **Fee/Root/Stake PASS does not inherit** |
| Guardian = pause-only in Batch PM code | ALIGNED |
| Mainnet broadcast halt · prior auth paused | BINDING |

**SUPERSEDED as Owner ACTIVE:** treating on-chain default BPS `4500/3575/1100/825` as V9 business truth.

---

## P0 — Owner checklist (see full doc)

Primary gate: **Q1–Q8** in [Owner Decision Checklist](TT-TTG-V9-OWNER-DECISION-CHECKLIST-LATEST.md).  
Until answered: **no** Target code freeze · **no** 3× audit.

---

## P1 — Agent living drift (fix this wave where possible)

| ID | Issue | Action |
|----|--------|--------|
| P1-1 | Local PASS §1 / Root Replacement §① still mandate NEW_BUCKET RegionVault+GSFV | Amend to Option I/II language |
| P1-2 | Auth Await / Cutover / Owner Gate still say Official wire = KEEP Timelock `0x50f0…` | Living SUPERSEDED overlay |
| P1-3 | AtomicDeployerMainnet / GovernorV9 NatSpec “KEEP Timelock on Mainnet” | Reword: Official Timelock = Owner-pinned (NEW after Root Replacement) |
| P1-4 | GlobalStakersFeeVault NatSpec as default companion | Mark Option II only |
| P1-5 | Security ladder KEEP Safe/Timelock table | Overlay note |
| P1-6 | Option I Local Forge test missing | Add `test_optionI_all_legs_to_p4cap_shape` |
| P1-7 | Founder Exact address null | Owner later · not Root Replacement gate |

---

## Business vs function alignment matrix

| Domain | Business logic aligned? | Function aligned? | Gap |
|--------|-------------------------|-------------------|-----|
| Sale → P4Cap | Yes | Yes (V9 PM + Norm) | — |
| 300k Steward fee | Yes (Founder wallet) | Collection OPEN in registry | Orthogonal gap · not FeeRouter |
| Fee BPS | Yes | Yes | Destination Option I/II open |
| Governance Burn | Yes (Gov→Timelock→Vault) | Needs **NEW** Timelock pin | Timelock root |
| V9 five-batch / RETURN / burn | Yes | R2_FINAL code | Do not mutate for Safe-exit |
| Safe-exit privilege | Owner intent Yes | Old Timelock cannot drop Safe | NEW Timelock + rewire |
| 83 RegionVault GO | Target only | Not Official | Must not claim via Safe-exit |

---

## Three audits (only after P0 clear)

| # | Role | Scope |
|---|------|--------|
| Audit 1 | Smart contract / privilege | NEW Timelock · KEEP_AND_REWIRE · V9 bind · Option I or II buckets Exact |
| Audit 2 | Red team / attacker | Solo Timelock admin · Guardian pause · migration window · no Safe ACTIVE |
| Audit 3 | Release / Exact Match + money-flow | Bytes · addresses · three money paths · no 83 false GO |

Until P0-1…P0-5 closed: **do not start** Audit 1–3.

---

## 中文要点

- **先对齐、再三审。** 未选 FeeRouter Option I/II + Guardian Exact + 迁权窗确认前，**禁止**开三次安全审计 / Sepolia。  
- 业务三条钱路已对齐；功能缺口主要在 **治理根替换** 与 **Fee 落点选项**。  
- Agent 本波只修活文档/NatSpec/Option I 测试漂移；**不**改 R2_FINAL 经济语义。
