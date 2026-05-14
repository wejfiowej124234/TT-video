#!/usr/bin/env bash
# Local release gate pipeline (no GitHub Actions, no remote HTTP dependencies).
# Serial: [95] static gates → [93] ISS-007 prereport → [96-15] orchestration →
#         merge → [R-002] validate-regression-report → go_state_machine.
#
# Outputs (under evidence/, default GO_local_ci_<UTC>):
#   report.json              — R-001 + top-level orchestration (after merge)
#   report.93_prereport.json — copy of 93 matrix report before merge
#   release_orchestration.json
#   go_state_suggestion.json
#   deep_evidence/           — Tier-A stubs; 95_96_booklets_registry.json
#
# Environment (optional):
#   TT_LOCAL_CI_EVIDENCE_DIR   — relative to repo root, e.g. evidence/MYRUN
#   TT_LOCAL_CI_SKIP_CARGO=1   — skip cargo test -p traveltrust-api
#   TT_LOCAL_CI_INCLUDE_CRATES_METADATA=1 — run check-pr-crates-needs-metadata.sh main HEAD
#   TT_LOCAL_CI_ORCH_MODE=v1   — run_96_15_orchestration only (schema v1); default v2 via run_96_full_automation.py
#   TT_96_LIGHT=0              — full registry gates (npm, external paths); default 1 for fast local loop
#   TT_LOCAL_CI_FAIL_ON_NO_GO=1 — validate-regression-report --fail-on-no-go
#   TT_LOCAL_CI_REQUIRE_GO=1   — validate --require-go (staging-style hard gate)
#   TT_LOCAL_CI_FAIL_ON_CASE_FAIL=1 — validate --fail-on-case-fail
#   TT_LOCAL_CI_FAIL_ON_VERDICT_NO_GO=1 — exit 1 if go_state_suggestion is NO_GO
#   PYTHON                    — interpreter (overrides auto-detect via _resolve_python_bin.sh)
#
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
  echo "run_local_ci: python interpreter not working: $PY" >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EV_REL="${TT_LOCAL_CI_EVIDENCE_DIR:-evidence/GO_local_ci_${STAMP}}"
EV="$EV_REL"
if [[ "$EV_REL" != /* ]]; then EV="$ROOT/$EV_REL"; fi
mkdir -p "$EV"

export TT_96_V1_MAP_MANUAL_TO_FAIL="${TT_96_V1_MAP_MANUAL_TO_FAIL:-1}"

echo "==> Local CI evidence dir: $EV_REL"

# --- [95] release hygiene / static (local only) ---
if [[ "${TT_LOCAL_CI_SKIP_CARGO:-}" != "1" ]]; then
  echo "==> [95] cargo test -p traveltrust-api"
  cargo test -p traveltrust-api
else
  echo "==> [95] skip cargo (TT_LOCAL_CI_SKIP_CARGO=1)"
fi

echo "==> [95] run-check-04-routes"
bash scripts/run-check-04-routes.sh

echo "==> [95] frontend check:tokens (34 §5.3 · 96-13; app/components 含 community、did-rank)"
( cd "$ROOT/frontend" && npm run check:tokens )

echo "==> [95] verify_96_booklets_registry"
"$PY" scripts/release/verify_96_booklets_registry.py --repo-root "$ROOT" --out "$EV/95_96_booklets_registry.json"

if [[ "${TT_LOCAL_CI_INCLUDE_CRATES_METADATA:-}" == "1" ]]; then
  echo "==> [95] check-pr-crates-needs-metadata.sh main HEAD"
  bash scripts/check-pr-crates-needs-metadata.sh main HEAD
fi

# --- [93] regression matrix prereport (R-001 report.json) ---
echo "==> [93] gen-r002-iss007-prereport"
export TRAVELTRUST_R002_REPORT_PARENT="$EV_REL"
"$PY" scripts/gen-r002-iss007-prereport.py

if [[ ! -f "$EV/r002_iss007_prereport/report.json" ]]; then
  echo "ERROR: missing $EV/r002_iss007_prereport/report.json" >&2
  exit 2
fi
cp "$EV/r002_iss007_prereport/report.json" "$EV/report.93_prereport.json"
cp "$EV/report.93_prereport.json" "$EV/report.json"

# Point 96-11 R002 gate at report (pre-merge; schema valid without orchestration)
export TT_96_REPORT_JSON="$EV/report.json"

# --- [96-15] orchestration ---
DEEP="$EV/deep_evidence"
mkdir -p "$DEEP"
echo "==> [96-15] gen_tier_a_evidence_bundle"
"$PY" scripts/release/gen_tier_a_evidence_bundle.py "$DEEP"

export TT_96_LIGHT="${TT_96_LIGHT:-1}"

if [[ "${TT_LOCAL_CI_ORCH_MODE:-v2}" == "v1" ]]; then
  echo "==> [96-15] run_96_15_orchestration.py (v1 JSON)"
  "$PY" scripts/release/run_96_15_orchestration.py --out-dir "$EV" \
    --tier-a1-readme "$DEEP/README.md" \
    --tier-a2-markdown "$DEEP/59_p0_table.md" \
    --require-tier-a-semiauto \
    --require-tier-a-all-pass \
    --require-tier-bc-all-pass
else
  echo "==> [96-15] run_96_full_automation.py (v2 JSON; embeds Tier A/B/C + registry)"
  "$PY" scripts/release/run_96_full_automation.py --out-dir "$EV" \
    --tier-a1-readme "$DEEP/README.md" \
    --tier-a2-markdown "$DEEP/59_p0_table.md" \
    --require-tier-a-semiauto
fi

if [[ ! -f "$EV/release_orchestration.json" ]]; then
  echo "ERROR: missing $EV/release_orchestration.json" >&2
  exit 2
fi

echo "==> merge orchestration into report.json"
MERGE_TMP="$EV/.report.merged.$$"
"$PY" scripts/release/merge_orchestration_into_report.py \
  "$EV/report.json" \
  "$EV/release_orchestration.json" \
  -o "$MERGE_TMP"
mv "$MERGE_TMP" "$EV/report.json"

# --- [R-002] machine validation ---
echo "==> [R-002] validate-regression-report.py"
VAL_ARGS=( "$EV/report.json" --validate-orchestration )
if [[ "${TT_LOCAL_CI_FAIL_ON_NO_GO:-}" == "1" ]]; then
  VAL_ARGS+=( --fail-on-no-go )
fi
if [[ "${TT_LOCAL_CI_REQUIRE_GO:-}" == "1" ]]; then
  VAL_ARGS+=( --require-go )
fi
if [[ "${TT_LOCAL_CI_FAIL_ON_CASE_FAIL:-}" == "1" ]]; then
  VAL_ARGS+=( --fail-on-case-fail )
fi
"$PY" scripts/validate-regression-report.py "${VAL_ARGS[@]}"

# --- go_state_machine (local verdict artifact) ---
echo "==> go_state_machine"
POL="${TT_LOCAL_CI_GO_POLICY:-auto}"
"$PY" scripts/release/go_state_machine.py \
  --orchestration "$EV/release_orchestration.json" \
  --regression "$EV/report.json" \
  --policy "$POL" \
  --out "$EV/go_state_suggestion.json"

if [[ "${TT_LOCAL_CI_FAIL_ON_VERDICT_NO_GO:-}" == "1" ]]; then
  echo "==> strict: fail if verdict is NO_GO"
  export _TT_LOCAL_CI_VERDICT_JSON="$EV/go_state_suggestion.json"
  VERDICT="$("$PY" -c "import json,os; print(json.load(open(os.environ['_TT_LOCAL_CI_VERDICT_JSON'],encoding='utf-8')).get('release_verdict_suggestion',''))")"
  unset _TT_LOCAL_CI_VERDICT_JSON
  if [[ "$VERDICT" == "NO_GO" ]]; then
    echo "ERROR: release_verdict_suggestion is NO_GO (see $EV_REL/go_state_suggestion.json)" >&2
    exit 1
  fi
fi

echo "OK: local CI pipeline finished."
echo "  $EV_REL/report.json"
echo "  $EV_REL/release_orchestration.json"
echo "  $EV_REL/go_state_suggestion.json"
