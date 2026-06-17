#!/usr/bin/env bash
# D-4555-B · Local Human Acceptance (HAT) — forge witness suite
# Phase: ① local only · ≠ ② Sepolia GO
# Usage (repo root): bash scripts/dev/run-d4555b-hat-local.sh
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root_dir/contracts"

log_dir="$root_dir/evidence/GO_local_country_pool_net_profit_gate2.3"
mkdir -p "$log_dir"
log_file="$log_dir/d4555b_hat_local_forge.log"
: >"$log_file"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
head_commit="$(git -C "$root_dir" rev-parse --short HEAD 2>/dev/null || echo unknown)"

run_hat() {
  local id="$1"
  local desc="$2"
  shift 2
  echo "" | tee -a "$log_file"
  echo "=== HAT-$id · $desc · $stamp ===" | tee -a "$log_file"
  if forge test "$@" 2>&1 | tee -a "$log_file"; then
    echo "HAT-$id: PASS" | tee -a "$log_file"
    return 0
  else
    echo "HAT-$id: FAIL" | tee -a "$log_file"
    return 1
  fi
}

{
  echo "D-4555-B HAT Local · $stamp"
  echo "HEAD: $head_commit"
  echo "Baseline: Gate-2.3 Exit · cf453bd9+ / d32b4813+"
} | tee -a "$log_file"

failures=0

# HAT-01 · 正常盈利分账（eligible · 45/55 守恒 · vault/treasury 落账）
run_hat "01" "normal profit split conservation" \
  --match-test "test_T_CLS_01_T_SPL_01_EligibleSplitConservation" || failures=$((failures + 1))

# HAT-02 · 无 Active Steward → Unallocated（45% 不进 Global 吞并）
run_hat "02" "ineligible steward to unallocated" \
  --match-test "test_T_SPL_02_UnallocatedWhenNotEligible|test_T_QLF_06_NoStakeGoesUnallocated|test_T_SPL_07_08_IneligibleGlobalNotAbsorbingStewardLeg" || failures=$((failures + 1))

# HAT-03 · 亏损 / 零利润不 split
run_hat "03" "loss and zero profit no split" \
  --match-test "test_T_CLS_02_LossIncreasesCarriedLossNoSplit|test_T_CLS_03_ZeroProfitNoSplit|test_T_SPL_05_SplitAfterNoSplitReverts" || failures=$((failures + 1))

# HAT-04 · carriedLoss 抵扣
run_hat "04" "carriedLoss applied before split" \
  --match-test "test_T_CLS_05_CarriedLossAppliedBeforeSplit|testFuzz_T_FUZ_02_CarriedLossAccounting" || failures=$((failures + 1))

# HAT-05 · recordAccrualBatch 边界
run_hat "05" "recordAccrualBatch boundaries" \
  --match-test "test_T_BATCH_" || failures=$((failures + 1))

# HAT-06 · Governance Payload / Timelock 权限
run_hat "06" "governance payload and timelock permissions" \
  --match-test "test_T_GOV_|test_T_GOV_03_CPNP_selector_parity" || failures=$((failures + 1))

# Regression bar (Gate-2.3 Exit)
run_hat "RG" "full CountryPoolNetProfit + FeeRouter regression" \
  --match-contract CountryPoolNetProfit || failures=$((failures + 1))
run_hat "FR" "FeeRouter orthogonality" \
  --match-contract FeeRouterTest || failures=$((failures + 1))

echo "" | tee -a "$log_file"
if [[ "$failures" -eq 0 ]]; then
  echo "D4555B_HAT_SUMMARY: PASS failures=0 head=$head_commit log=$log_file" | tee -a "$log_file"
  exit 0
else
  echo "D4555B_HAT_SUMMARY: FAIL failures=$failures head=$head_commit log=$log_file" | tee -a "$log_file"
  exit 1
fi
