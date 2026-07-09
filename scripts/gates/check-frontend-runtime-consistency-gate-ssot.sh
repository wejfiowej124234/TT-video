#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
fail() { echo "FAIL: $*" >&2; exit 1; }

REG="registry/frontend-runtime-consistency-gate.v1.yaml"
RB="docs/runbook/TT-FRONTEND-RUNTIME-CONSISTENCY-GATE.md"
SCRIPT="scripts/dev/run-frontend-runtime-consistency-gate.sh"
AUDIT="scripts/dev/audit-frontend-runtime-consistency-gate.cjs"
PIPE="registry/release-pipeline.v1.yaml"

[[ -f "$REG" ]] || fail "missing $REG"
[[ -f "$RB" ]] || fail "missing $RB"
[[ -f "$SCRIPT" ]] || fail "missing $SCRIPT"
[[ -f "$AUDIT" ]] || fail "missing $AUDIT"
grep -q 'TT_FRONTEND_RUNTIME_CONSISTENCY_GATE: ENFORCED' "$REG" || fail "machine key"
grep -q 'dual_environment' "$REG" || fail "dual_environment section"
grep -q 'browser_back' "$REG" || fail "browser_back scenario"
grep -q 'Frontend Runtime Consistency Gate' "$RB" || fail "runbook title"
grep -q 'run-frontend-runtime-consistency-gate' "$SCRIPT" || fail "orchestrator self-ref"
grep -q 'audit-frontend-runtime-consistency-gate' "$SCRIPT" || fail "audit script ref"
grep -q 'FRONTEND_RUNTIME_CONSISTENCY' "$PIPE" || fail "not wired in release-pipeline"
grep -q 'TT_FRONTEND_RUNTIME_CONSISTENCY_GATE' "$PIPE" || fail "pipeline machine key missing"

echo "PASS: frontend-runtime-consistency-gate SSOT"
