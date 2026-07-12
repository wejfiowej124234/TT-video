# TTG Vesting & Public Distribution — Production Governance (Phase③ · Step 7)

**Status:** Allocation semantics **must be defined** before Production GO if TTG is publicly marketed.  
**Supply amounts:** **FROZEN** per [protocol-ssot §1](../../docs/spec/governance-token/protocol-ssot.v1.md).  
**Commercial schedule:** `OWNER_INPUT` — cliff / duration / start / beneficiary / optional round lockup.

**SSOT:** [registry/ttg-vesting-registry.v1.yaml](../../registry/ttg-vesting-registry.v1.yaml) (v3)  
**Gate:** `bash scripts/gates/check-ttg-vesting-registry-gate.sh`

---

## Distribution semantics (v3)

| Model | SSOT bucket | Amount (FROZEN) | Mechanism |
|-------|-------------|-----------------|-----------|
| **Standard vesting** | `team` 15% | **1,500,000 TTG** | cliff · duration · Timelock custody |
| **Standard vesting** | `advisors` 5% | **500,000 TTG** | cliff · duration · Timelock custody |
| **Governance planned release** | `ecosystem` 15% | **1,500,000 TTG** | GOV-02 Proposal → Vote → Timelock → approved schedule |
| **Primary Market** | `public_global` 20% | **2,000,000 TTG** | R1 500K + R2 500K + R3 1M · `TtgPrimaryMarketV1` · GOV-04 |
| **Bucket path** | `country_pool_shelf` 25% | **2,500,000 TTG** | Seat stake lock · exit unlock · vacancy rules |
| **Bucket path** | `treasury_dao` 20% | **2,000,000 TTG** | Proposal → Vote → Timelock · P4 cash deploy rules |

**Forbidden:** independent `investor` pool · `public_global` as single-beneficiary cliff vesting.

---

## Primary Market (public_global)

| Round | TTG | Governance open | Optional lockup |
|-------|-----|-----------------|-----------------|
| R1 Early | 500,000 | No (Phase 1 default) | `OWNER_INPUT` |
| R2 | 500,000 | Yes | `OWNER_INPUT` |
| R3 | 1,000,000 | Yes | `OWNER_INPUT` |

**GOV-04:** 25,000 TTG/wallet · 100 USDC min · USDC → GovernanceTreasury.

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
