#!/usr/bin/env bash
# IMP-EV-001：唯一基线为 evidence/GO_20260409；凡 PR/push diff 触及的含 manifest.json 的 evidence bundle
# 均须通过 validate --emit-summary --verify-artifact-files + jq 契约（见 docs/runbook/evidence-gate.md）。
# 用法：bash scripts/gates/imp-ev-001-evidence-bundles.sh <FROM_REF> <TO_REF>
#   PR：FROM=base.sha TO=head.sha；push main：FROM=HEAD^ TO=HEAD
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/gates/_resolve_python_bin.sh
source "$ROOT/scripts/gates/_resolve_python_bin.sh"

FROM="${1:?FROM ref}"
TO="${2:?TO ref}"

BASELINE="evidence/GO_20260409"

jq_expr='
  .status == "GO"
  and .schema == "traveltrust.evidence_manifest.validate_summary.v1_1"
  and (.artifact_count | type == "number")
  and .hash_verified == true
  and (.missing_files | type == "array")
  and (.missing_files | length == 0)
'

collect_roots() {
  printf '%s\n' "$BASELINE"
  git diff --name-only "$FROM" "$TO" | awk -F/ '
    $1 == "evidence" && NF >= 2 {
      d = $2
      if (d == "GO_YYYYMMDD_template" || d == "GO_placeholder") next
      print "evidence/" d
    }
  ' || true
}

validate_one() {
  local dir="$1"
  echo "IMP-EV-001: validating $dir"
  local err
  err="$(mktemp)"
  local summary
  summary="$("$PYTHON_BIN" "$ROOT/scripts/dev/validate_evidence_manifest.py" validate "$dir" \
    --emit-summary --verify-artifact-files 2>"$err")"
  cat "$err" >&2
  rm -f "$err"
  echo "$summary" | jq -e "$jq_expr" >/dev/null
}

mapfile -t CANDIDATES < <(collect_roots | sort -u)

declare -a BUNDLES=()
for r in "${CANDIDATES[@]}"; do
  [[ -n "$r" ]] || continue
  [[ -d "$r" ]] || continue
  [[ -f "$r/manifest.json" ]] || continue
  BUNDLES+=("$r")
done

if [[ ${#BUNDLES[@]} -eq 0 ]]; then
  echo "IMP-EV-001: no evidence bundles to validate (unexpected; baseline missing?)"
  exit 1
fi

for dir in "${BUNDLES[@]}"; do
  validate_one "$dir"
done

echo "IMP-EV-001: OK (${#BUNDLES[@]} bundle(s))"
