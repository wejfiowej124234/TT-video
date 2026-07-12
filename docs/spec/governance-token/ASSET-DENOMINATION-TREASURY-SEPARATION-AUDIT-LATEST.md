# Asset Denomination & Treasury Separation Audit — Latest

**Verdict:** `PASS` · **Stamp:** `20260712T122952Z` · **Phase:** ① local

SSOT: [asset-denomination-treasury-separation.v1.yaml](../../../registry/asset-denomination-treasury-separation.v1.yaml)

## Executive split (must not conflate)

| Treasury | Asset | Amount / nature | Spend path |
|----------|-------|---------------|------------|
| **TTG DAO Treasury** | TTG | 2M supply bucket (`treasury_dao`) | Proposal → Vote → Timelock → **TTG transfer only** |
| **USDC Global Treasury** | USDC | PM sales · country 55% · FeeRouter global leg | **GovernanceTreasuryP4Cap** · P1→P4 · Timelock/Safe |
| **Escrow (orders)** | USDC | Per-order | Escrow instance · release/refund only · **isolated** |

## Fund-flow inventory

### `FF-01` — TTG DAO Treasury bucket (supply allocation)
- **asset:** TTG
- **amount:** 2,000,000 TTG (treasury_dao 20%)
- **source:** Genesis mint / allocation bucket
- **destination:** GovernanceTimelock · treasury Safe (custody)
- **authorization:** GOV-02 Proposal → Vote → Timelock 48h
- **spend_path:** TTG transfer only (grants · incentives · ecosystem TTG)
- **forbidden:** USDC spend · P4 deploy · PM USDC ingress
- **vote_policy:** G-VOTE-03
- **refund_accounting:** N/A (TTG grants — no order escrow)

### `FF-USDC-IN-primary_market_usdc` — USDC Global Treasury ingress: primary_market_usdc
- **asset:** USDC
- **source:** TtgPrimaryMarketV1.purchase
- **destination:** GovernanceTreasuryP4Cap (usdcTreasury slot)
- **isolated_from:** escrow_order_usdc
- **authorization:** Contract routing · spend via Timelock
- **spend_path:** P1→P4 per country-revenue-model §2.1

### `FF-USDC-IN-country_net_profit_55` — USDC Global Treasury ingress: country_net_profit_55
- **asset:** USDC
- **source:** CountryPoolNetProfit splitNetProfit Global leg
- **destination:** GovernanceTreasuryP4Cap (usdcTreasury slot)
- **isolated_from:** escrow_order_usdc
- **authorization:** Contract routing · spend via Timelock
- **spend_path:** P1→P4 per country-revenue-model §2.1

### `FF-USDC-IN-fee_router_global_pool` — USDC Global Treasury ingress: fee_router_global_pool
- **asset:** USDC
- **source:** FeeRouter D-4555-A global pool leg
- **destination:** GovernanceTreasuryP4Cap (usdcTreasury slot)
- **isolated_from:** Orthogonal to country net profit 55% — fund-flow-ssot R4
- **authorization:** Contract routing · spend via Timelock
- **spend_path:** P1→P4 per country-revenue-model §2.1

### `FF-USDC-SPEND-P1` — USDC Global Treasury spend stage P1
- **asset:** USDC
- **label:** platform_operations
- **authorization:** routine_budget_via_treasury_ops_policy
- **timelock_required:** True

### `FF-USDC-SPEND-P2` — USDC Global Treasury spend stage P2
- **asset:** USDC
- **label:** security_risk_reserve
- **authorization:** finance_ops_budget
- **timelock_required:** True

### `FF-USDC-SPEND-P3` — USDC Global Treasury spend stage P3
- **asset:** USDC
- **label:** ecosystem_incentives
- **authorization:** governance_approved_budget
- **governance_proposal_required:** True
- **timelock_required:** True

### `FF-USDC-SPEND-P4` — USDC Global Treasury spend stage P4
- **asset:** USDC
- **label:** treasury_reserve_surplus
- **authorization:** governance_proposal_required
- **timelock_required:** True
- **gov_rule:** GOV-01

### `FF-RAIL-R1_ttg` — fund-flow-ssot.v1#R1
- **asset:** TTG
- **contracts:** ['GovernanceVotesToken', 'RegionStewardStakePool', 'vesting_contracts']

### `FF-RAIL-R2_country_pool_usdc` — fund-flow-ssot.v1#R2
- **asset:** USDC
- **isolated_from:** ['R3_escrow', 'usdc_global_treasury_direct_mixing']

### `FF-RAIL-R3_escrow_usdc` — fund-flow-ssot.v1#R3
- **asset:** USDC
- **contracts:** ['Escrow', 'EscrowFactoryV2']
- **isolated_from:** ['usdc_global_treasury', 'primary_market', 'fee_router_treasury_pool']
- **authorization:** order_state_machine_release_refund_only

### `FF-RAIL-R4_fee_usdc` — fund-flow-ssot.v1#R4
- **asset:** USDC
- **contracts:** FeeRouter

### `FF-PM` — Primary Market purchase
- **asset:** TTG + USDC
- **ttg_leg:** public_global bucket → buyer ([500000, 500000, 1000000])
- **usdc_leg:** TtgPrimaryMarketV1.usdcTreasury → GovernanceTreasuryP4Cap
- **isolated_from:** Escrow order USDC

### `FF-OWNER-refunds` — Spend class: refunds
- **asset:** USDC
- **policy:** OWNER_INPUT
- **note:** Owner-defined ops policy — not simulated in ① audit

### `FF-OWNER-taxes` — Spend class: taxes
- **asset:** USDC
- **policy:** OWNER_INPUT
- **note:** Owner-defined ops policy — not simulated in ① audit

### `FF-OWNER-supplier_payments` — Spend class: supplier_payments
- **asset:** USDC
- **policy:** OWNER_INPUT
- **note:** Owner-defined ops policy — not simulated in ① audit

### `FF-OWNER-payroll_manual` — Spend class: payroll_manual
- **asset:** USDC
- **policy:** OWNER_INPUT
- **note:** Owner-defined ops policy — not simulated in ① audit

### `FF-OWNER-emergency_spend` — Spend class: emergency_spend
- **asset:** USDC
- **policy:** emergency_safe_break_glass
- **note:** Owner-defined ops policy — not simulated in ① audit

## Automated checks

- ✅ `SEP-validator` — OK: asset-denomination-treasury-separation v1 ttg_dao=2M-TTG-only usdc_global=GovernanceTreasuryP4Cap rails=R1-R4-isolated pm_usdc_sink=P4Cap
- ✅ `SEP-treasury-dao-ttg-only` — asset=TTG forbidden=['usdc_spend', 'p4_deploy_cap', 'primary_market_usdc_ingress', 'conflate_with_GovernanceTreasuryP4Cap']
- ✅ `SEP-primary-market-usdc-sink` — sink=GovernanceTreasuryP4Cap
- ✅ `SEP-contract-pm-usdc-to-treasury-slot` — TtgPrimaryMarketV1 → usdcTreasury immutable
- ✅ `SEP-contract-escrow-holds-usdc-per-order` — Escrow USDC custody per order instance
- ✅ `SEP-genesis-split-gvote-03-04` — GENESIS §7.2 TTG bucket vs USDC Global Treasury
- ✅ `SEP-genesis-no-treasury-dao-p4-conflation` — treasury_dao row must not read as P4 Reserve
- ✅ `SEP-runbook-treasury-dao-ttg-path` — runbook splits TTG dao bucket vs USDC treasury
- ✅ `SEP-mainnet-treasury-slot-usdc-p4cap` — mainnet.treasury=GovernanceTreasuryP4Cap
- ✅ `SEP-vesting-cross-ref` — cross_ref=registry/asset-denomination-treasury-separation.v1.yaml
- ✅ `SEP-frontend-treasury-dao-hint-ttg` — frontend treasury_dao hint describes TTG not USDC P4
- ✅ `SEP-frontend-usdc-treasury-scope-note` — USDC treasury budget alignment deferred to Gate-2.4 — documented
- ✅ `SEP-no-stale-treasury-dao-p4-drift` — stale: none
- ✅ `SEP-vesting-registry-validator` — OK: ttg-vesting-registry v3 vesting=team+advisors pm=500k+500k+1m ecosystem=governance_release bucket_paths=country+treasury lifecycle=READY_TEMPLATE

## Findings

- None.

## Manual checklist (Owner only · not simulated)

- [ ] Confirm operational Safe multisig signers for USDC P1/P2 routine budget (treasury-ops-policy)
- [ ] Define refunds / taxes / supplier / payroll routing in treasury-ops-policy (OWNER_INPUT)
- [ ] Verify on-chain Primary Market usdcTreasury == GovernanceTreasuryP4Cap address (② Sepolia)
- [ ] Confirm Escrow USDC never shares address with Global Treasury (② integration test)
- [ ] P4 deploy cap 30% enforcement — live spend tx (③ · not simulated here)

## Correction applied (this audit)

- Split `treasury_dao` from USDC P4 in registry + runbooks + GENESIS
- Added `asset-denomination-treasury-separation.v1.yaml` machine SSOT
- Primary Market USDC sink → `GovernanceTreasuryP4Cap` (not TTG dao bucket)

Machine-readable: `evidence/GO_asset_denomination_treasury_separation_audit/20260712T122952Z/asset-denomination-treasury-separation-audit.json`
