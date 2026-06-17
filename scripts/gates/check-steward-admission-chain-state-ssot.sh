#!/usr/bin/env bash
# TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT · machine-read gate (① local + ② boundary checks)
#
# Usage (repo root):
#   bash scripts/gates/check-steward-admission-chain-state-ssot.sh
#
# Exit 0 + final line: TT_STEWARD_CHAIN_STATE_SSOT: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "TT_STEWARD_CHAIN_STATE_SSOT: FAIL $*" >&2; exit 1; }
ok() { echo "TT_STEWARD_CHAIN_STATE_SSOT: OK $*"; }

SSOT="$ROOT/docs/runbook/TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT.md"
[[ -f "$SSOT" ]] || fail "missing $SSOT"

for anchor in \
  "唯一 SSOT" \
  "命名陷阱" \
  "重启 / 操作矩阵" \
  "TTG_ANVIL_FORCE_DEPLOY" \
  "TN-P1-010" \
  "HAT-R1" \
  "multi-demo@test.com" \
  "0x104FCb93B5e097F92c93Ee4621C487C6C953D212"; do
  grep -q "$anchor" "$SSOT" || fail "SSOT missing anchor: $anchor"
done
ok "SSOT doc anchors present"

ALIGN="$ROOT/scripts/dev/align-anvil-local-stack.sh"
[[ -f "$ALIGN" ]] || fail "missing $ALIGN"
grep -q 'TTG_ANVIL_FORCE_DEPLOY="${TTG_ANVIL_FORCE_DEPLOY:-0}"' "$ALIGN" \
  || fail "align-anvil-local-stack.sh must default TTG_ANVIL_FORCE_DEPLOY to 0 (preserve stakes)"
ok "align-anvil TTG_ANVIL_FORCE_DEPLOY default=0"

AUTH_RS="$ROOT/crates/api/src/chain_off/auth.rs"
FE_WALLET="$ROOT/frontend/lib/steward/stewardStakeUiModel.ts"
[[ -f "$AUTH_RS" ]] || fail "missing auth.rs"
[[ -f "$FE_WALLET" ]] || fail "missing stewardStakeUiModel.ts"

WALLET="0x104FCb93B5e097F92c93Ee4621C487C6C953D212"
grep -q "$WALLET" "$AUTH_RS" || fail "MULTI_DEMO_WALLET missing in auth.rs"
grep -q "$WALLET" "$FE_WALLET" || fail "MULTI_DEMO_STEWARD_WALLET missing in stewardStakeUiModel.ts"
ok "multi-demo wallet byte-aligned API + FE"

grep -q 'region_steward' "$AUTH_RS" \
  || fail "auth.rs must preserve region_steward on multi-demo seed"
grep -q 'eq_ignore_ascii_case("region_steward")' "$AUTH_RS" \
  || fail "auth.rs must not clobber region_steward role on seed (A2 persistence)"
ok "multi-demo A2 role preserve logic present"

LOCAL_README="$ROOT/scripts/dev/LOCAL-ANVIL-STACK-README.md"
[[ -f "$LOCAL_README" ]] || fail "missing LOCAL-ANVIL-STACK-README.md"
grep -q 'TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT' "$LOCAL_README" \
  || fail "LOCAL-ANVIL-STACK-README must link SSOT runbook"
ok "LOCAL-ANVIL-STACK-README links SSOT"

START_README="$ROOT/scripts/dev/start-api-with-seed-README.md"
grep -q 'TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT' "$START_README" \
  || fail "start-api-with-seed-README must link SSOT runbook"
ok "start-api-with-seed-README links SSOT"

GATE_SELF="$ROOT/scripts/gates/check-steward-admission-chain-state-ssot.sh"
grep -q 'check-steward-admission-chain-state-ssot.sh' "$SSOT" \
  || fail "SSOT must reference this gate script"
ok "SSOT references gate script"

if [[ -f "$ROOT/evidence/TESTNET_STAGING_FREEZE/ACTIVE.json" ]]; then
  grep -q 'TESTNET_STAGING_FREEZE' "$SSOT" || fail "SSOT must document staging freeze boundary"
  ok "staging freeze boundary documented"
else
  echo "TT_STEWARD_CHAIN_STATE_SSOT: WARN evidence/TESTNET_STAGING_FREEZE/ACTIVE.json absent (optional ② anchor)"
fi

echo ""
echo "TT_STEWARD_CHAIN_STATE_SSOT: OK — docs/runbook/TT-STEWARD-ADMISSION-CHAIN-STATE-SSOT.md"
