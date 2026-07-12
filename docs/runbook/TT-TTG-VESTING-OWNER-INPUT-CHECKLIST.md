# TTG Vesting & Public Distribution — Owner Input Checklist (Step 7C)

**SSOT:** [registry/ttg-vesting-registry.v1.yaml](../../registry/ttg-vesting-registry.v1.yaml) · [TTG-TOKENOMICS-GENESIS-V2](../spec/governance-token/TTG-TOKENOMICS-GENESIS-V2.md)  
**Governance doc:** [TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md](./TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md)  
**Gate:** `bash scripts/gates/check-ttg-vesting-registry-gate.sh`

**FROZEN amounts** — Owner must not override without GOV-02 + Genesis/SSOT bump.  
**OWNER_INPUT** — team beneficiary · cliff · duration · start · optional round lockup · Community Incentive Program schedule（Policy）.

---

## Frozen supply (Genesis V2 four-block)

| Track / bucket | Amount (FROZEN) | Model |
|----------------|-----------------|-------|
| Team | **1,500,000 TTG** | Standard vesting |
| Community Incentive Allocation | **500,000 TTG** | Program（**not** standard vesting） |
| DAO Treasury | **3,000,000 TTG** | Timelock governance path |
| Public Sale | **5,000,000 TTG** | Primary Market R1+R2+R3 |

**Cancelled:** `advisors` · `country_pool_shelf` · standalone `ecosystem` as Owner vesting / genesis input buckets.

---

## Standard vesting — Team (1,500,000 TTG)

| ☐ | Field | Value |
|---|-------|-------|
| ☐ | `beneficiary` | OWNER fills（组织 Safe / 多签推荐） |
| ☐ | `cliff_seconds` | OWNER fills |
| ☐ | `duration_seconds` | OWNER fills |
| ☐ | `start_timestamp` | OWNER fills（默认 `MAINNET_VESTING_DEPLOY_EXECUTE`） |
| ☐ | `amount_tokens` | **1,500,000 (FROZEN)** |

---

## Community Incentive Allocation (500,000 TTG) — Program

**Policy status:** **ACTIVE**（框架 2026-07-13）· [COMMUNITY-INCENTIVE-POLICY-V1](../spec/governance-token/COMMUNITY-INCENTIVE-POLICY-V1.md)

| ✓ | Item |
|---|------|
| ✓ | Categories + anti-abuse framework |
| ✓ | Cap / authority / accounting rules |
| ☐ | Campaign numeric schedules（③ 前） |
| ☐ | KYC/AML vendor + mainnet custody addresses |

| ☐ | Field | Value |
|---|-------|-------|
| ☐ | Program wallet / custody | OWNER fills |
| ☐ | Program release rules | Policy（not this checklist’s cliff/duration schema） |
| ☐ | `amount_tokens` | **500,000 (FROZEN · genesis allocation)** |

DAO may top up Program from DAO Treasury without changing genesis 5%.

---

## Primary Market — public_sale (800K + 1.2M + 3M)

**Not** single-beneficiary cliff vesting. Controlled by `TtgPrimaryMarketV1` + GOV-04.

| Round | TTG (Registry initial · FROZEN sum) | ☐ Optional `lockup_seconds` | ☐ Governance open |
|-------|-------------------------------------|----------------------------|-------------------|
| R1 Early | **800,000** | OWNER fills (optional) | Default open |
| R2 | **1,200,000** | OWNER fills (optional) | Proposal required |
| R3 | **3,000,000** | OWNER fills (optional) | Proposal required |

| ☐ | Check |
|---|-------|
| ☐ | Sub-allocations sum = **5,000,000 TTG** |
| ☐ | No parallel `investor` pool outside this bucket |
| ☐ | GOV-04 25k/wallet · 100 USDC min disclosed |

---

## Bucket paths (reference — custody in registry)

| Bucket | Custody / authorization (see registry) |
|--------|----------------------------------------|
| **treasury_dao** | **3M TTG** · Timelock → TTG grants only · [USDC Treasury SSOT](../../registry/asset-denomination-treasury-separation.v1.yaml) · **≠** voting power source |
| **Steward Seat** | Self-held TTG stake（**no** `country_pool_shelf` genesis bucket） |

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
| ☐ | On-chain matches FROZEN four-block amounts |
| ☐ | Primary Market rounds match Registry（initial 800K+1.2M+3M · sum 5M） |
| ☐ | Legal sign-off |
| ☐ | No broadcast / deploy in ① checklist execution |
