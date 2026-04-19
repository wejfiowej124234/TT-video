#!/usr/bin/env bash
# 91 §8.2 — Generate or verify SHA256 manifest for evidence run_<UTC>/ (wrapper).
# Usage:
#   bash scripts/ops/evidence-run-sha256-manifest.sh generate evidence/.../run_<UTC>
#   bash scripts/ops/evidence-run-sha256-manifest.sh verify evidence/.../run_<UTC>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec python3 "$ROOT/scripts/ops/evidence_run_sha256_manifest.py" "${1:?cmd}" "${2:?dir}"
