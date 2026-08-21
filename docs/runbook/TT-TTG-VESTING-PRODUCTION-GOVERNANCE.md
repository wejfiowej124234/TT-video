# TTG Vesting & Public Distribution — Production Governance (Phase③ · Step 7)


> **STATUS (V9 Documentation Truth Convergence · phase-2):** **SUPERSEDED as Official ACTIVE V9 path** · **DO_NOT_USE_AS_ACTIVE_TRUTH** · **HISTORICAL**.  
> Sole living upstream: [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Public-sale USDC→P4Cap · globalStakers 35.75% · R2_FINAL/Remint · Safe/old Timelock as V9 Official admin = **LEGACY / SUPERSEDED**. Evidence retained.

**Status:** Allocation semantics **must be defined** before Production GO if TTG is publicly marketed.  
**Supply amounts:** **FROZEN** per [TTG-TOKENOMICS-GENESIS-V2](../../docs/spec/governance-token/TTG-TOKENOMICS-GENESIS-V2.md) · [protocol-ssot §1](../../docs/spec/governance-token/protocol-ssot.v1.md).  
**Commercial schedule:** `OWNER_INPUT` — cliff / duration / start / beneficiary / optional round lockup.

**SSOT:** [registry/ttg-vesting-registry.v1.yaml](../../registry/ttg-vesting-registry.v1.yaml)  
**Gate:** `bash scripts/gates/check-ttg-vesting-registry-gate.sh`

---

## Distribution semantics (Genesis V2)

| Model | SSOT bucket | Amount (FROZEN) | Mechanism |
|-------|-------------|-----------------|-----------|
| **Standard vesting** | `team` 15% | **1,500,000 TTG** | cliff · duration · Timelock custody · single beneficiary wallet |
| **Program (not vesting)** | `community_incentive` 5% | **500,000 TTG** | Community Incentive Allocation → Community Incentive Program · Policy |
| **Bucket path** | `treasury_dao` 30% | **3,000,000 TTG** | Proposal → Timelock → **TTG transfer only**（≠ USDC P1→P4 · ≠ voting power source · no Mint replenish） |
| **Primary Market** | `public_sale` 50% | **5,000,000 TTG** | R1 800K + R2 1.2M + R3 3M（Registry 初值）· `TtgPrimaryMarketV1` · GOV-04 |

**Cancelled (V1):** independent `advisors` genesis bucket · `country_pool_shelf` · standalone `ecosystem` genesis bucket.

**Forbidden:** independent `investor` pool · `public_sale` as single-beneficiary cliff vesting · Country Shelf as genesis supply.

**Steward:** no Country Shelf; stake **self-held** TTG（Same Protocol Rights · source not recorded）.

---

## Primary Market (public_sale)

| Round | TTG (Registry initial) | Governance open | Optional lockup |
|-------|------------------------|-----------------|-----------------|
| R1 Early | 800,000 | No (Phase 1 default) | `OWNER_INPUT` |
| R2 | 1,200,000 | Yes | `OWNER_INPUT` |
| R3 | 3,000,000 | Yes | `OWNER_INPUT` |

**Sum must remain 5,000,000.** Per-round split revisable via governance + Registry（Genesis does not freeze per-round amounts）.

**GOV-04:** 25,000 TTG/wallet · 100 USDC min · **USDC → USDC Global Treasury** (`GovernanceTreasuryP4Cap` · see [asset-denomination-treasury-separation.v1.yaml](../../registry/asset-denomination-treasury-separation.v1.yaml)).

**Frontend SSOT:** [traveltrustTtgPublicRounds.ts](../../frontend/lib/traveltrustTtgPublicRounds.ts)

---

## Gate separation

| 闸 | 阶段 | 依赖 | **不**依赖 |
|----|------|------|-----------|
| **Sepolia Governor V1.1** | ② | Framework 冻结 · 双审计 PASS · Owner broadcast 授权 | Vesting / Primary Market commercial params |
| **Mainnet vesting + PM ACTIVE** | ③ | commercial OWNER_INPUT · legal sign-off · on-chain = registry | Sepolia upgrade timing |

---

## Lifecycle

`READY_TEMPLATE` → `OWNER_FILLED` → `VERIFIED` → `ACTIVE`
