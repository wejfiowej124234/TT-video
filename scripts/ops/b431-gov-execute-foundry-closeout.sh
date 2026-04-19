#!/usr/bin/env bash
# **TT-B431** / **B-431**：**Foundry SSOT** — **`test_B431_governor_execute_chain_reads_match_payload_and_timelock_operation`**
# **留证** **`forge test`** **stdout** **+** **`b431-closeout-record.json`** **。**
#
# **不**替代 **B-417** 测试网真 **`execute`** **证据** **；** **不** **声称** **UI/DB** **层** **已** **单独** **封口** **（** **API** **对拍** **见** **B-430** **）** **。**
#
# 环境变量：
#   **`B431_OUT_DIR`**  可选；默认 **`evidence/b431_gov_execute_chain_read/run_<UTC>/`**
#   **`B431_FORGE_EXTRA_ARGS`**  透传给 **`forge test`**（如 **`-vvv`**）
#
# 退出码：**0** **forge** **绿** **；** **≠0** **forge** **红** **。**
#
# 前置：项目根 **`contracts/`** **可** **`forge test`** **。**

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT}/contracts"

UTC="$(date -u +"%Y%m%dT%H%MZ" 2>/dev/null || date -u +"%Y%m%dT%H%MZ")"
OUT="${B431_OUT_DIR:-${ROOT}/evidence/b431_gov_execute_chain_read/run_${UTC}}"
mkdir -p "$OUT"

MATCH="test_B431_governor_execute_chain_reads_match_payload_and_timelock_operation"
LOG="${OUT}/forge_b431.log"

set +e
forge test --match-test "$MATCH" ${B431_FORGE_EXTRA_ARGS:-} 2>&1 | tee "$LOG"
EC=${PIPESTATUS[0]}
set -e

NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")"

jq -n \
  --arg sv "b431_foundry_chain_read_closeout_v1" \
  --arg at "$NOW" \
  --arg match "$MATCH" \
  --arg log_rel "forge_b431.log" \
  --argjson forge_exit "$EC" \
  --arg verdict "$(if [[ "$EC" -eq 0 ]]; then echo "GO"; else echo "NO_GO"; fi)" \
  '{
    schema_version: $sv,
    generated_at_utc: $at,
    forge_test_match: $match,
    forge_log_file: $log_rel,
    forge_exit_code: $forge_exit,
    chain_read_payload_align_verdict: $verdict,
    notes: "SSOT: contracts/test/TravelTrustGovernor.t.sol; see docs/verification-evidence/B-431-gov-execute-chain-read-payload-align-ENTRY.md"
  }' >"${OUT}/b431-closeout-record.json"

if [[ "$EC" -ne 0 ]]; then
  echo "b431-gov-execute-foundry-closeout.sh: forge exit ${EC} (see ${LOG})" >&2
  exit "$EC"
fi

echo "b431-gov-execute-foundry-closeout.sh: GO (Foundry B-431 test green; evidence=${OUT})" >&2
exit 0
