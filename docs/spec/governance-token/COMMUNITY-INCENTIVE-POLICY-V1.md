# Community Incentive Policy V1

**Document ID:** `COMMUNITY-INCENTIVE-POLICY-V1`  
**Status:** **ACTIVE · Owner-approved framework (2026-07-13)**  
**Genesis SSOT:** [TTG-TOKENOMICS-GENESIS-V2](./TTG-TOKENOMICS-GENESIS-V2.md)  
**Naming (fixed):**

| Layer | Name |
|-------|------|
| Genesis | Community Incentive Allocation |
| Program | Community Incentive Program |
| This doc | Community Incentive Policy |

**Forbidden aliases:** Community Rewards · Community Pool · Community Grant

---

## 1. Scope

- **Allocation (Genesis):** 500,000 TTG (5%) — fixed bps; never rewritten by ops.  
- **Program:** How incentives are granted to community members under governed schedules.  
- **DAO top-up:** Governance may transfer TTG from DAO Treasury to fund the Program — **does not** change Genesis Allocation 5%.

## 2. Principles

1. Issued TTG follows **One TTG, Same Protocol Rights** (protocol-restriction states excepted).  
2. No holder automatic cash dividend.  
3. No ad-hoc issuance without this Policy or a governance amendment of this Policy.  
4. Campaign-specific numbers live in **Program schedules** under this Policy — **not** in Genesis.

## 3. Eligible activity categories (V1 · frozen framework)

| Category | Description | Anti-abuse minimum |
|----------|-------------|-------------------|
| **Onboarding** | Account verification / first meaningful platform action | One wallet per verified identity tier; rate limits |
| **Referral** | Invited user completes qualifying action | No self-referral; cap per referrer per epoch |
| **Order completion** | Completed travel order meeting policy criteria | No wash / circular orders |
| **Community contribution** | Documented contribution (content, support, events) | Manual or council review for large grants |
| **Bug bounty / security** | Valid reported vulnerabilities per severity rubric | Duplicate / out-of-scope excluded |
| **Steward-path prep** | **Not** a separate TTG class — same TTG; may include education grants only | Must not bypass Region Steward stake/review |

**Forbidden without governance amendment:** register-and-dump airdrops · undisclosed insider allocations · parallel «community pool» buckets.

## 4. Caps and authority (V1)

| Rule | Policy |
|------|--------|
| **Per-wallet epoch cap** | Set per Program schedule; default **≤ 0.5% total supply (50,000 TTG)** unless governance raises cap for a named campaign |
| **Per-campaign cap** | Must not exceed remaining **Allocation** balance without DAO top-up budget line |
| **Funding order** | Draw **Community Incentive Allocation** first · then **DAO Treasury top-up** (governance-approved budget) |
| **Routine ops** | Campaigns within published schedule + caps → ops execution with audit log |
| **Material campaigns** | New category or cap above epoch default → **governance proposal + Timelock** |
| **Pause / emergency** | Owner or governance may pause Program disbursement; no burn of unissued Allocation |

## 5. Accounting

- **Allocation ledger:** tracks remaining 500,000 TTG genesis quota.  
- **DAO top-up:** separate budget lines; **does not** change genesis bps.  
- **On-chain:** transfers from Timelock / Program custody wallets only; no mint.

## 6. Owner checklist (framework · closed 2026-07-13)

| ✓ | Item |
|---|------|
| ✓ | Eligible activity categories + anti-abuse (§3) |
| ✓ | Per-wallet / per-campaign cap framework (§4) |
| ✓ | Approval authority: ops within schedule · governance for material (§4) |
| ✓ | Accounting: Allocation first · DAO top-up separate (§5) |
| ✓ | Pause / emergency stop (§4) |

**③ 前仍须：** 具体 campaign 数值表 · KYC/AML 供应商 · 主网 custody 地址登记。

## 7. Change control

- Program schedule edits: Owner + audit log; material changes → governance.  
- This Policy framework: governance if flagged material.  
- Genesis 5% ratio: **out of scope** — requires Genesis amendment.
