#!/usr/bin/env bash
# TTG-TOKENOMICS-FREEZE-V1 · GOV-01～04 链上强制执行 HAT（① local forge · ≠ Sepolia broadcast）
# Usage (repo root): bash scripts/dev/run-gov-freeze-v1-onchain-hat-local.sh
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root_dir/contracts"

evid_dir="$root_dir/evidence/GO_local_gov_freeze_v1_onchain"
mkdir -p "$evid_dir"
log_file="$evid_dir/gov_freeze_v1_onchain_hat_forge.log"
json_file="$evid_dir/gov-freeze-v1-onchain-hat-summary.json"
: >"$log_file"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
head_commit="$(git -C "$root_dir" rev-parse --short HEAD 2>/dev/null || echo unknown)"
freeze_doc="TTG-TOKENOMICS-FREEZE-V1"

run_hat() {
  local id="$1"
  local desc="$2"
  shift 2
  echo "" | tee -a "$log_file"
  echo "=== GOV-HAT-$id · $desc · $stamp ===" | tee -a "$log_file"
  if forge test "$@" 2>&1 | tee -a "$log_file"; then
    echo "GOV-HAT-$id: PASS" | tee -a "$log_file"
    return 0
  else
    echo "GOV-HAT-$id: FAIL" | tee -a "$log_file"
    return 1
  fi
}

{
  echo "TTG-TOKENOMICS-FREEZE-V1 On-chain HAT · $stamp"
  echo "HEAD: $head_commit"
  echo "SSOT: docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md"
} | tee -a "$log_file"

failures=0

run_hat "01" "GOV-01 Treasury 30% P4 cap" \
  --match-test "test_GOV01_" || failures=$((failures + 1))

run_hat "02" "GOV-02 Governor quorum 400bps + Timelock 48h" \
  --match-test "test_GOV02_" || failures=$((failures + 1))

run_hat "03" "GOV-03 Seat concentration + vote cap" \
  --match-test "test_GOV03_" || failures=$((failures + 1))

run_hat "04" "GOV-04 Primary Market per-wallet + round caps" \
  --match-test "test_GOV04_" || failures=$((failures + 1))

run_hat "SSOT" "freeze constants parity" \
  --match-test "test_freeze_constants_match_ssot_yaml" || failures=$((failures + 1))

run_hat "RG-GOV" "TravelTrustGovernor regression" \
  --match-contract TravelTrustGovernor || failures=$((failures + 1))

echo "" | tee -a "$log_file"
if [[ "$failures" -eq 0 ]]; then
  summary="PASS"
  exit_code=0
else
  summary="FAIL"
  exit_code=1
fi

cat >"$json_file" <<EOF
{
  "document_id": "${freeze_doc}",
  "phase": "①",
  "hat_stamp_utc": "${stamp}",
  "git_head": "${head_commit}",
  "summary": "${summary}",
  "failures": ${failures},
  "contracts": {
    "GovernanceTreasuryP4Cap": "contracts/src/GovernanceTreasuryP4Cap.sol",
    "TtgPrimaryMarketV1": "contracts/src/TtgPrimaryMarketV1.sol",
    "TtgSeatConcentrationRegistry": "contracts/src/TtgSeatConcentrationRegistry.sol",
    "TravelTrustGovernor": "contracts/src/TravelTrustGovernor.sol",
    "GovernanceTimelock": "contracts/src/GovernanceTimelock.sol"
  },
  "gov_rules_verified_local": ["GOV-01", "GOV-02", "GOV-03", "GOV-04"],
  "log_file": "${log_file}",
  "audit_report": "evidence/GO_local_gov_freeze_v1_onchain/GOV-FREEZE-V1-ONCHAIN-ALIGNMENT-AUDIT.md",
  "honest_boundary": "① forge HAT ≠ ② Sepolia broadcast ≠ ③ legal GO"
}
EOF

if [[ "$exit_code" -eq 0 ]]; then
  echo "GOV_FREEZE_V1_ONCHAIN_HAT_SUMMARY: PASS failures=0 head=${head_commit} log=${log_file}" | tee -a "$log_file"
else
  echo "GOV_FREEZE_V1_ONCHAIN_HAT_SUMMARY: FAIL failures=${failures} head=${head_commit} log=${log_file}" | tee -a "$log_file"
fi

exit "$exit_code"
