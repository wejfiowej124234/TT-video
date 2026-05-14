#!/usr/bin/env bash
# 96-15 Tier A→B/C machine path (no spec edits): evidence stubs + orchestration + go_state_machine.
# Requires: bash, python|python3, repo-relative paths from cwd = repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
if [[ -n "${PYTHON:-}" ]]; then
  PY="$PYTHON"
else
  # shellcheck source=scripts/gates/_resolve_python_bin.sh
  source "$ROOT/scripts/gates/_resolve_python_bin.sh"
  PY="$PYTHON_BIN"
fi
if ! "$PY" -V >/dev/null 2>&1; then
  echo "run_96_tier_a_p0_full_chain: python interpreter not working: $PY" >&2
  exit 1
fi
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_ID="${TT_96_RUN_ID:-GO_96_15_machine_${STAMP}}"
OUT="evidence/${RUN_ID}"
DEEP="${OUT}/deep_evidence"
mkdir -p "$DEEP"
echo "== 1) Tier-A evidence stubs -> $DEEP"
"$PY" scripts/release/gen_tier_a_evidence_bundle.py "$DEEP"
echo "== 2) 96 booklets registry (read-only)"
"$PY" scripts/release/verify_96_booklets_registry.py --repo-root "$ROOT" --out "$OUT/96_booklets_registry.json"
echo "== 3) Orchestration (Tier A + B/C automated + B-421)"
export TT_96_V1_MAP_MANUAL_TO_FAIL="${TT_96_V1_MAP_MANUAL_TO_FAIL:-1}"
"$PY" scripts/release/run_96_15_orchestration.py \
  --out-dir "$OUT" \
  --tier-a1-readme "$DEEP/README.md" \
  --tier-a2-markdown "$DEEP/59_p0_table.md" \
  --require-tier-a-semiauto \
  --require-tier-a-all-pass \
  --require-tier-bc-all-pass
echo "== 4) go_state_machine (consumes release_orchestration.json)"
"$PY" scripts/release/go_state_machine.py \
  --orchestration "$OUT/release_orchestration.json" \
  --out "$OUT/go_state_suggestion.json"
echo "== 5) optional v2 full automation (TT_96_RUN_FULL_AUTO=1; TT_96_LIGHT=1 skips heavy npm)"
if [[ "${TT_96_RUN_FULL_AUTO:-}" == "1" ]]; then
  FULL_OUT="${TT_96_FULL_AUTO_OUT:-${OUT}_fullauto_v2}"
  mkdir -p "$FULL_OUT"
  TT_96_LIGHT="${TT_96_LIGHT:-1}" "$PY" scripts/release/run_96_full_automation.py \
    --out-dir "$FULL_OUT" \
    --tier-a1-readme "$DEEP/README.md" \
    --tier-a2-markdown "$DEEP/59_p0_table.md" \
    --require-tier-a-semiauto || true
  "$PY" scripts/release/go_state_machine.py \
    --orchestration "$FULL_OUT/release_orchestration.json" \
    --policy tri_state_v2 \
    --out "$FULL_OUT/go_state_suggestion_v2.json" || true
fi
echo "OK: $OUT"
echo "  - release_orchestration.json"
echo "  - go_state_suggestion.json"
echo "  - b421.log"
echo "  - 96_booklets_registry.json"
