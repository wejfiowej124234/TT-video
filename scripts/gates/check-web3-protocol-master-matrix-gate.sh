#!/usr/bin/env bash
# Web3 Protocol Master Matrix v1 · P0/P1 convergence gate (W1)
# SSOT: registry/traveltrust-web3-protocol-master-matrix.v1.yaml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

REGISTRY="registry/protocol-convergence-deployments.v1.yaml"
MATRIX="registry/traveltrust-web3-protocol-master-matrix.v1.yaml"
SSOT_YAML="docs/spec/governance-token/protocol-ssot.v1.yaml"
DE_CFG="config/jurisdiction_country_pool_net_profit.sepolia.json"
MTM_COUNTS="registry/ttg-governance-mtm-counts.v1.yaml"
REF_RS="crates/api/src/routes/governance_doc_reference.rs"
FE_TS="frontend/lib/governance/protocolSsot.v1.ts"

[[ -f "$REGISTRY" ]] || fail "missing $REGISTRY"
[[ -f "$MATRIX" ]] || fail "missing $MATRIX"
[[ -f "$SSOT_YAML" ]] || fail "missing $SSOT_YAML"

yaml_v="$(grep -m1 '^version:' "$SSOT_YAML" | sed -E 's/.*"([^"]+)".*/\1/')"
reg_v="$(grep -A5 '^protocol_ssot:' "$REGISTRY" | grep 'version:' | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
matrix_v="$(grep -A3 'web3_protocol_version:' "$MATRIX" | grep 'current:' | sed -E 's/.*"([^"]+)".*/\1/')"
api_v="$(grep -m1 'pub const PROTOCOL_SSOT_VERSION' "$REF_RS" | sed -E 's/.*"([^"]+)".*/\1/')"
fe_v="$(grep -m1 'export const PROTOCOL_SSOT_VERSION' "$FE_TS" | sed -E 's/.*"([^"]+)".*/\1/')"

[[ -n "$yaml_v" && -n "$reg_v" && -n "$matrix_v" && -n "$api_v" && -n "$fe_v" ]] \
  || fail "could not parse WEB3_PROTOCOL_VERSION from yaml/registry/matrix/api/fe"

for v in "$reg_v" "$matrix_v" "$api_v" "$fe_v"; do
  [[ "$v" == "$yaml_v" ]] || fail "version drift yaml=$yaml_v reg=$reg_v matrix=$matrix_v api=$api_v fe=$fe_v"
done

if command -v sha256sum >/dev/null 2>&1; then
  actual_sha="$(sha256sum "$SSOT_YAML" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  actual_sha="$(shasum -a 256 "$SSOT_YAML" | awk '{print $1}')"
else
  fail "need sha256sum or shasum"
fi

reg_sha="$(grep 'content_sha256:' "$REGISTRY" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
[[ "$actual_sha" == "$reg_sha" ]] || fail "protocol-ssot sha256 mismatch registry=$reg_sha actual=$actual_sha"

grep -q 'GOVERNANCE_TREASURY_P4CAP_ADDRESS' "$REGISTRY" \
  || fail "treasury_semantics: missing GOVERNANCE_TREASURY_P4CAP_ADDRESS"
grep -q 'LEGACY_TREASURY_ADDRESS' "$REGISTRY" \
  || fail "treasury_semantics: missing LEGACY_TREASURY_ADDRESS"
grep -q 'country_pool_unallocated_steward_vault_address' "$REGISTRY" \
  || fail "DE triplet: missing unallocated vault in registry"

if [[ -f "$DE_CFG" ]]; then
  de_ledger="$(python - <<'PY' "$DE_CFG"
import json, sys
j = json.load(open(sys.argv[1]))
print(j["entries"][0]["COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS"].lower())
PY
)"
  de_unalloc="$(python - <<'PY' "$DE_CFG"
import json, sys
j = json.load(open(sys.argv[1]))
print(j["entries"][0]["COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS"].lower())
PY
)"
  reg_ledger="$(grep 'country_pool_net_profit_ledger_address:' "$REGISTRY" | tail -1 | sed -E 's/.*"([^"]+)".*/\1/' | tr '[:upper:]' '[:lower:]')"
  reg_unalloc="$(grep 'country_pool_unallocated_steward_vault_address:' "$REGISTRY" | head -1 | sed -E 's/.*"([^"]+)".*/\1/' | tr '[:upper:]' '[:lower:]')"
  [[ "$de_ledger" == "$reg_ledger" ]] || fail "DE ledger mismatch cfg=$de_ledger registry=$reg_ledger"
  [[ "$de_unalloc" == "$reg_unalloc" ]] || fail "DE unallocated vault mismatch cfg=$de_unalloc registry=$reg_unalloc"
fi

grep -q 'proxy_implementations:' "$REGISTRY" || fail "missing proxy_implementations block"
[[ -f "$MTM_COUNTS" ]] || fail "missing $MTM_COUNTS"
grep -q 'ROWS=146' "$MTM_COUNTS" || fail "MTM counts registry missing ROWS=146"

echo "OK: Web3 Protocol Master Matrix gate (WEB3_PROTOCOL_VERSION=$yaml_v sha256=$actual_sha)"
