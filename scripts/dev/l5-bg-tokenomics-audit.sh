#!/usr/bin/env bash
# L5 Enterprise Business & Governance · Tokenomics audit (165)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }
echo "== L5 BG Tokenomics Audit =="
check "governance votes token abi" "test -f '$ROOT/contracts/abi/GovernanceVotesToken.json'"
check "tokenomics reader" "test -f '$ROOT/docs/fundraising/external/07-Protocol-Tokenomics-Reader.md'"
check "investor distribution accruals" "rg -q 'investor_distribution_accruals' '$ROOT/crates/api/src/db/investor_distribution.rs'"
check "investor distribution claim" "test -f '$ROOT/contracts/src/InvestorDistributionClaim.sol'"
check "governance pool route" "rg -q 'governance_pool' '$ROOT/crates/api/src/routes/governance/governance_pool.rs'"
check "governance token SSOT" "rg -q 'governance_token_address' '$ROOT/frontend/locales/en.ts'"
[[ "$fail" -eq 0 ]] && echo "TT_TOKENOMICS: TOKENOMICS_GO" || { echo "TT_TOKENOMICS: HOLD"; exit 2; }
