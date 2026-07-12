# TTG Vesting & Public Distribution — Owner Input Checklist (Step 7C)

**SSOT:** [registry/ttg-vesting-registry.v1.yaml](../../registry/ttg-vesting-registry.v1.yaml) v3  
**Governance doc:** [TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md](./TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md)  
**Gate:** `bash scripts/gates/check-ttg-vesting-registry-gate.sh`

**FROZEN amounts** — Owner must not override without GOV-02 + SSOT bump.  
**OWNER_INPUT** — beneficiary · cliff · duration · start · optional round lockup · ecosystem schedule.

---

## Frozen supply (six-bucket SSOT)

| Track / bucket | Amount (FROZEN) | Model |
|----------------|-----------------|-------|
| Team | **1,500,000 TTG** | Standard vesting |
| Advisors | **500,000 TTG** | Standard vesting |
| Ecosystem | **1,500,000 TTG** | Governance planned release |
| Public global | **2,000,000 TTG** | Primary Market R1+R2+R3 |
| Country shelf | **2,500,000 TTG** | Seat stake path (see registry) |
| Treasury DAO | **2,000,000 TTG** | Timelock governance path |

---

## Standard vesting — Team (1,500,000 TTG)

| ☐ | Field | Value |
|---|-------|-------|
| ☐ | `beneficiary` | OWNER fills |
| ☐ | `cliff_seconds` | OWNER fills |
| ☐ | `duration_seconds` | OWNER fills |
| ☐ | `start_timestamp` | OWNER fills |
| ☐ | `amount_tokens` | **1,500,000 (FROZEN)** |

## Standard vesting — Advisors (500,000 TTG)

| ☐ | Field | Value |
|---|-------|-------|
| ☐ | `beneficiary` | OWNER fills |
| ☐ | `cliff_seconds` | OWNER fills |
| ☐ | `duration_seconds` | OWNER fills |
| ☐ | `start_timestamp` | OWNER fills |
| ☐ | `amount_tokens` | **500,000 (FROZEN)** |

---

## Governance planned release — Ecosystem (1,500,000 TTG)

| ☐ | Field | Value |
|---|-------|-------|
| ☐ | `beneficiary` | Program wallet — OWNER fills |
| ☐ | `schedule_template` | Approved release cadence — OWNER fills |
| ☐ | Governance approval ref | Proposal ID per tranche |
| ☐ | `amount_tokens` | **1,500,000 (FROZEN)** |

---

## Primary Market — public_global (500K + 500K + 1M)

**Not** single-beneficiary cliff vesting. Controlled by `TtgPrimaryMarketV1` + GOV-04.

| Round | TTG (FROZEN) | ☐ Optional `lockup_seconds` | ☐ Governance open |
|-------|--------------|----------------------------|-------------------|
| R1 Early | **500,000** | OWNER fills (optional) | Default open |
| R2 | **500,000** | OWNER fills (optional) | Proposal required |
| R3 | **1,000,000** | OWNER fills (optional) | Proposal required |

| ☐ | Check |
|---|-------|
| ☐ | Sub-allocations sum ≤ **2,000,000 TTG** |
| ☐ | No parallel `investor` pool outside this bucket |
| ☐ | GOV-04 25k/wallet · 100 USDC min disclosed |

---

## Bucket paths (reference — custody in registry)

| Bucket | Custody / authorization (see registry) |
|--------|----------------------------------------|
| **country_pool_shelf** | RegionStewardStakePool · Seat lock · exit KPI unlock |
| **treasury_dao** | **2M TTG** · Timelock → TTG grants only · [USDC Treasury SSOT](../../registry/asset-denomination-treasury-separation.v1.yaml) |

---

## Sepolia vs Mainnet

| Action | Blocked by vesting commercial params? |
|--------|--------------------------------------|
| **Sepolia Governor V1.1** | **No** |
| **Mainnet vesting / Primary Market ACTIVE** | **Yes** |

---

## Before ACTIVE (③)

| ☐ | Check |
|---|-------|
| ☐ | On-chain matches FROZEN bucket amounts |
| ☐ | Primary Market rounds match 500K+500K+1M |
| ☐ | Legal sign-off |
| ☐ | No broadcast / deploy in ① checklist execution |
