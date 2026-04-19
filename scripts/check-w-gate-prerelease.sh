#!/usr/bin/env bash
# B-420 · W-GATE：**invariants** **+** **55-S13** **+** **SSOT** **三角** **+** **08** **一致性** **+** **可选** **evidence** **manifest** **。**
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== check-w-gate-prerelease: check-invariants ===" >&2
bash scripts/check-invariants.sh

echo "=== check-w-gate-prerelease: 55-S13 ===" >&2
bash scripts/check-55-s13.sh

echo "=== check-w-gate-prerelease: SSOT triangle ===" >&2
bash scripts/check-ssot-triangle-gate.sh

if [[ "${W_GATE_SKIP_08_CONSISTENCY:-}" != "1" ]]; then
  echo "=== check-w-gate-prerelease: 08 consistency ===" >&2
  bash scripts/check-08-consistency.sh
else
  echo "check-w-gate-prerelease: skip 08 consistency (W_GATE_SKIP_08_CONSISTENCY=1)" >&2
fi

GO_DIR="${W_GATE_EVIDENCE_GO_DIR:-}"
if [[ -z "$GO_DIR" && -d "${ROOT}/evidence" ]]; then
  while IFS= read -r mf; do
    case "$mf" in */GO_*/manifest.json)
      GO_DIR="$(dirname "$mf")"
      break
      ;;
    esac
  done < <(find "${ROOT}/evidence" -maxdepth 2 -type f -name manifest.json 2>/dev/null || true)
fi

if [[ "${W_GATE_SKIP_EVIDENCE_MANIFEST:-}" == "1" ]]; then
  echo "check-w-gate-prerelease: skip evidence manifest (W_GATE_SKIP_EVIDENCE_MANIFEST=1)" >&2
elif [[ -n "$GO_DIR" && -f "${GO_DIR}/manifest.json" ]]; then
  echo "=== check-w-gate-prerelease: validate-evidence-manifest (${GO_DIR}) ===" >&2
  bash scripts/validate-evidence-manifest.sh validate "$GO_DIR"
else
  echo "check-w-gate-prerelease: skip evidence manifest (set W_GATE_EVIDENCE_GO_DIR=evidence/GO_<id> when ready)" >&2
fi

echo "check-w-gate-prerelease: ok" >&2
