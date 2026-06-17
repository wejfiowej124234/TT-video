#!/usr/bin/env bash
# Protocol SSOT v1 · API ↔ frontend ↔ YAML 收敛闸
# SSOT: docs/spec/governance-token/protocol-ssot.v1.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

REF_RS="crates/api/src/routes/governance_doc_reference.rs"
FE_TS="frontend/lib/governance/protocolSsot.v1.ts"
YAML="docs/spec/governance-token/protocol-ssot.v1.yaml"

api_v="$(grep -m1 'pub const PROTOCOL_SSOT_VERSION' "$REF_RS" | sed -E 's/.*"([^"]+)".*/\1/')"
fe_v="$(grep -m1 'export const PROTOCOL_SSOT_VERSION' "$FE_TS" | sed -E 's/.*"([^"]+)".*/\1/')"
[[ -n "$api_v" && -n "$fe_v" ]] || fail "could not parse PROTOCOL_SSOT_VERSION from API/frontend mirrors"
[[ "$api_v" == "$fe_v" ]] || fail "PROTOCOL_SSOT_VERSION mismatch API=$api_v frontend=$fe_v"

yaml_v="$(grep -m1 '^version:' "$YAML" | sed -E 's/.*"([^"]+)".*/\1/')"
[[ -n "$yaml_v" ]] || fail "could not parse version from $YAML"

cargo test -p traveltrust-api protocol_reference_ -- --nocapture

cd "$ROOT/frontend"
npx vitest run lib/governance/protocolSsot.v1.contract.test.ts

echo "OK: protocol SSOT convergence (API=$api_v FE=$api_v yaml=$yaml_v)"
