#!/usr/bin/env bash
# TT-9627 §3 — R-002 local chain: generate ISS-007 prereport + validate (soft or strict).
# Thin delegate to scripts/gates/local-verify-r002-prereport-chain.sh (do not duplicate logic).
#
# Behavior (see that script):
#   - Without DATABASE_URL: gen-r002-iss007-prereport + soft validate (anchors may be NOT_RUN).
#   - With DATABASE_URL (+ P3_CHAIN_OFF etc. as documented there): strict --fail-on-no-go --fail-on-case-not-run.
#
# Usage:
#   bash scripts/gates/vertical-slice-tt9627-segment3-r002-prereport-chain.sh
#
# Read: docs/runbook/TT-9627-delivery-order-spine-then-full-site.md §3; docs/spec/R-002-回归执行闭环与发布准入.md §1
# ISS-007 prereport: see scripts/gates/local-verify-r002-prereport-chain.sh header + evidence/GO_local_r002_verify/README.md

set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "TT-9627 §3: delegating to local-verify-r002-prereport-chain.sh"
exec bash "$_HERE/local-verify-r002-prereport-chain.sh" "$@"
