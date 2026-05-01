#!/usr/bin/env bash
# TT-DOC-ENTERPRISE-AUDIT-CHECKLIST-001 · 机读聚合（默认「快路径」；全量见 DOC_AUDIT_FULL=1）
# Repo root:
#   bash scripts/gates/doc-enterprise-audit-machine-phases.sh
# Env:
#   DOC_AUDIT_FULL=1      Also run check-55-s13 + run-check-04-routes (slower)
#   DOC_AUDIT_SKIP_07=1   Skip 07 version triple
#   DOC_AUDIT_SKIP_AI=1   Skip AI task card index overview
#   DOC_AUDIT_SKIP_LINKS=1  Skip markdown relative link scan under docs/
#   DOC_AUDIT_LINKS_ENFORCE=1  Link scan exits 1 on any broken target (default: warn-only exit 0)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

pick_py() {
  if [[ -n "${PYTHON:-}" ]] && command -v "${PYTHON}" >/dev/null 2>&1 && "${PYTHON}" -c "import sys" >/dev/null 2>&1; then
    echo "${PYTHON}"
    return 0
  fi
  # Windows: PATH may prefer Store `python3` stub; `py -3` resolves a real interpreter.
  if command -v py >/dev/null 2>&1; then
    _py_exe="$(py -3 -c "import sys; print(sys.executable)" 2>/dev/null || true)"
    if [[ -n "${_py_exe}" ]] && [[ -f "${_py_exe}" ]] && "${_py_exe}" -c "import sys" >/dev/null 2>&1; then
      echo "${_py_exe}"
      return 0
    fi
  fi
  for c in python python3; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys" >/dev/null 2>&1; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

py=""
if [[ "${DOC_AUDIT_SKIP_AI:-}" != "1" || "${DOC_AUDIT_SKIP_LINKS:-}" != "1" ]]; then
  py="$(pick_py)" || {
    echo "doc-enterprise-audit-machine-phases: need working python or python3 on PATH (or set PYTHON)" >&2
    exit 2
  }
fi

run_07() {
  echo "== [TT-DOC machine] Phase 1.2 · 07 version triple =="
  bash scripts/check-07-version-triple.sh
}

run_ai() {
  echo "== [TT-DOC machine] Phase 3.3 · AI task card index overview (main + from-stash) =="
  "$py" scripts/check-ai-task-card-index-overview.py docs/AI任务卡索引.md
  "$py" scripts/check-ai-task-card-index-overview.py docs/AI任务卡索引.from-stash.md
}

run_links() {
  echo "== [TT-DOC machine] Phase 10 · docs/ relative markdown links =="
  "$py" scripts/gates/check-doc-markdown-relative-links.py
}

run_55() {
  echo "== [TT-DOC machine] Phase 4.2 · 55-S13 (DOC_AUDIT_FULL) =="
  bash scripts/check-55-s13.sh
}

run_04() {
  echo "== [TT-DOC machine] Phase 2.1 · check-04 routes (DOC_AUDIT_FULL) =="
  bash scripts/run-check-04-routes.sh
}

if [[ "${DOC_AUDIT_SKIP_07:-}" != "1" ]]; then
  run_07
else
  echo "== [TT-DOC machine] SKIP 07 (DOC_AUDIT_SKIP_07=1) =="
fi

if [[ "${DOC_AUDIT_SKIP_AI:-}" != "1" ]]; then
  run_ai
else
  echo "== [TT-DOC machine] SKIP AI index (DOC_AUDIT_SKIP_AI=1) =="
fi

if [[ "${DOC_AUDIT_SKIP_LINKS:-}" != "1" ]]; then
  run_links
else
  echo "== [TT-DOC machine] SKIP link scan (DOC_AUDIT_SKIP_LINKS=1) =="
fi

if [[ "${DOC_AUDIT_FULL:-}" == "1" ]]; then
  run_55
  run_04
else
  echo "== [TT-DOC machine] DOC_AUDIT_FULL unset: skip check-55-s13 + run-check-04-routes =="
fi

echo "OK: doc-enterprise-audit-machine-phases completed."
