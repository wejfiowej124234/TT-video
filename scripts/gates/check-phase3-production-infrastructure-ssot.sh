#!/usr/bin/env bash
# Phase3 production infrastructure registry SSOT gate
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REG="$ROOT/registry/phase3-production-infrastructure.v1.yaml"
fail() { echo "check-phase3-production-infrastructure-ssot: FAIL $*" >&2; exit 1; }
[[ -f "$REG" ]] || fail "missing registry"
grep -q 'PI3-002' "$REG" || fail "PI3-002 missing"
grep -q 'dependency_order' "$REG" || fail "dependency_order missing"
grep -q 'PI3-005' "$REG" || fail "PI3-005 deferral missing"
for s in \
  scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh \
  scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh \
  scripts/check-pi3-003-stripe-live-production-webhook-execution.sh \
  scripts/check-pi3-004-production-readiness-verification-execution.sh \
  scripts/dev/run-pi3-production-infra-prep.sh; do
  [[ -f "$ROOT/$s" ]] || fail "missing $s"
done
echo "check-phase3-production-infrastructure-ssot: PASS"
