# Role State Machine Audit

**Recorded:** 2026-07-08T13:45:49.707Z

## traveler

- **machine_code:** `order_traveler`
- **SSOT:** docs/spec/350-阶段状态机可视化与状态校验系统.md

| State | Allowed | Forbidden | Anomaly |
|-------|---------|-----------|---------|
| `browse` | create_order, connect_wallet | release_escrow, claim_ttg | off-chain KYC block → support ticket |
| `order_created` | deposit_escrow, cancel_pre_fund | guide_release | deposit fail → retry / refund off-chain |
| `escrow_funded` | refund, open_dispute | direct_fee_router | service dispute → dispute FSM |
| `completed` | review | on-chain refund | indexer lag → wait G2 replay |

- **SSOT cross-check:** PASS

## guide

- **machine_code:** `order_guide`
- **SSOT:** docs/spec/350-阶段状态机可视化与状态校验系统.md

| State | Allowed | Forbidden | Anomaly |
|-------|---------|-----------|---------|
| `identity_staked` | accept_order, deposit_identity | withdraw_stake_while_active_orders | slash → IdentityStakingPool |
| `service_active` | request_release via backend | pull_escrow_direct | no-show → slashed path |
| `payout_received` | withdraw_wallet | double_release | wrong amount → dispute |

- **SSOT cross-check:** PASS

## merchant

- **machine_code:** `country_pool_subscriber`
- **SSOT:** fund-flow-ssot.v1.md §2

| State | Allowed | Forbidden | Anomaly |
|-------|---------|-----------|---------|
| `subscription_open` | subscribe_usdc | steward_stake_same_pool | lock period → redemption queue |
| `locked` | request_redemption | instant_principal_guarantee | window closed → queue next epoch |

- **SSOT cross-check:** PASS

## steward

- **machine_code:** `steward_application`
- **SSOT:** docs/spec/governance-token/state-machine.v1.md §1 §2

| State | Allowed | Forbidden | Anomaly |
|-------|---------|-----------|---------|
| `draft` | submit_application | vote, receive_profit | withdrawn terminal |
| `stake_pending` | stake_ttg_on_chain | transfer_staked_ttg | tx fail → retry |
| `under_review` | admin_review | self_approve | rejected → stake_release_pending |
| `approved` | role_confirm, seat_activate | unstake_instant | KPI watch → seat FSM |
| `active` | vote, receive_profit, request_exit | direct_treasury_spend | probation → 0% bonus |
| `exit_requested` | wait_cooling_180d | usdc_exit | KPI review fail → extended delay |
| `released` | claimReleased | re_stake_same_epoch | claim fail → on-chain retry |

- **SSOT cross-check:** PASS

## ttg_holder

- **machine_code:** `ttg_governance_participant`
- **SSOT:** ttg-allocation-permissions-flows-ssot-v1.md

| State | Allowed | Forbidden | Anomaly |
|-------|---------|-----------|---------|
| `wallet_balance` | transfer, delegate, primary_market_if_enabled | mint_self | lost key → no recovery |
| `delegated` | vote, propose if threshold | double_delegate_same_block | flash vote mitigated by getPastVotes |
| `staked_steward` | governance_vote_per_rules | transfer_while_locked | see steward FSM |

- **SSOT cross-check:** PASS

## admin

- **machine_code:** `admin_console`
- **SSOT:** registry/admin-rbac-permissions.v1.yaml

| State | Allowed | Forbidden | Anomaly |
|-------|---------|-----------|---------|
| `authenticated` | rbac_scoped_reads, approval_workflows | direct_timelock_execute, spend_treasury | 403 → permission matrix audit |
| `approval_pending` | second_signer_approve | solo_p0_mutations | timeout → escalate Ops |

- **SSOT cross-check:** PASS

