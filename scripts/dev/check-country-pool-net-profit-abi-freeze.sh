#!/usr/bin/env bash
# G23-04 · validate Country Pool net profit ABI export + manifest topic0/selectors freeze.
# Usage (repo root): bash scripts/dev/check-country-pool-net-profit-abi-freeze.sh
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root_dir"

fail() { echo "CPNP-ABI-FREEZE FAIL: $*" >&2; exit 1; }
ok() { echo "CPNP-ABI-FREEZE OK: $*"; }

command -v forge >/dev/null 2>&1 || fail "forge not in PATH"
command -v cast >/dev/null 2>&1 || fail "cast not in PATH"
command -v jq >/dev/null 2>&1 || fail "jq not in PATH"

manifest="contracts/abi/manifests/country-pool-net-profit-v1.json"
[[ -f "$manifest" ]] || fail "missing $manifest"

for c in CountryPoolNetProfitLedger StewardPathVault UnallocatedStewardPathVault; do
  [[ -f "contracts/abi/${c}.json" ]] || fail "missing contracts/abi/${c}.json"
  artifact="contracts/out/${c}.sol/${c}.json"
  [[ -f "$artifact" ]] || fail "missing forge artifact $artifact (run: cd contracts && forge build)"
  diff <(jq -S . "contracts/abi/${c}.json") <(jq -S .abi "$artifact") >/dev/null \
    || fail "ABI drift: contracts/abi/${c}.json != forge artifact (run sync-abi-from-forge.sh)"
  ok "ABI byte-match $c.json"
done

registry="registry/event-decoders/country-pool-net-profit-v1.yaml"
[[ -f "$registry" ]] || fail "missing $registry"

event_count="$(jq '.events | length' "$manifest")"
[[ "$event_count" -ge 9 ]] || fail "manifest events count $event_count < 9"

while IFS= read -r row; do
  contract="$(echo "$row" | jq -r '.contract')"
  name="$(echo "$row" | jq -r '.name')"
  sig="$(echo "$row" | jq -r '.signature')"
  expected="$(echo "$row" | jq -r '.topic0')"
  actual="$(cast sig-event "$sig")"
  [[ "$actual" == "$expected" ]] || fail "topic0 drift $contract.$name expected=$expected actual=$actual"
  grep -q "$expected" "$registry" || fail "registry missing topic0 $expected ($name)"
done < <(jq -c '.events[]' "$manifest")
ok "manifest topic0 × $event_count match cast + registry"

while IFS= read -r row; do
  key="$(echo "$row" | jq -r '.key')"
  sig="$(echo "$row" | jq -r '.signature')"
  expected="$(echo "$row" | jq -r '.selector')"
  actual="$(cast sig "$sig" | cut -c1-10)"
  [[ "$actual" == "$expected" ]] || fail "selector drift $key expected=$expected actual=$actual"
done < <(jq -c '.selectors | to_entries[] | {key: .key, signature: .value.signature, selector: .value.selector}' "$manifest")
ok "manifest core selectors match cast"

while IFS= read -r row; do
  key="$(echo "$row" | jq -r '.key')"
  sig="$(echo "$row" | jq -r '.target_signature')"
  expected="$(echo "$row" | jq -r '.selector')"
  actual="$(cast sig "$sig" | cut -c1-10)"
  [[ "$actual" == "$expected" ]] || fail "payload selector drift $key expected=$expected actual=$actual"
done < <(jq -c '.governance_payload | to_entries[] | {key: .key, target_signature: .value.target_signature, selector: .value.selector}' "$manifest")
ok "governance_payload selectors match cast"

echo ""
echo "CPNP-ABI-FREEZE: all checks passed (Gate-2.4 manifest input ready)"
