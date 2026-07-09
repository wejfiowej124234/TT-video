# Governance Concentration Audit · Sepolia

**Verdict:** `PASS` · **Stamp:** `20260616T074542Z`

## Scenario

- Wallet `0x104FCb93B5e097F92c93Ee4621C487C6C953D212` · raw **7,800,100 TTG** (78.001% of supply)
- Effective vote weight (GOV-03 cap): **4.0%**
- Quorum need (GOV-02): **400,000 TTG** (4.0%)

## GOV-02 / GOV-03 alignment

- ✅ `GOV-02-quorum-bps`
- ✅ `GOV-02-timelock-48h`
- ✅ `GOV-03-vote-cap-bps`
- ✅ `GOV-03-max-aggregate-stake`
- ✅ `GOV-03-stake-within-cap`
- ✅ `GOV-03-vote-cap-enforced-hat-r1`
- ✅ `SSOT-params-aligned`

## Findings

- **ECON-01** (informational): Wallet holds 78.00% of total supply raw; on-chain vote weight capped at 4.00% per GOV-03.
- **GOV-CAP-01** (accepted-design): max_voting_power_per_address_bps equals governance_quorum_bps (400). A holder at the cap contributes exactly quorum threshold — not uncapped capture; mitigated by Timelock 48h + disclosure rules in SSOT.
