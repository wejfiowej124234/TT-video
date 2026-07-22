#!/usr/bin/env bash
# Reality Closure Gate — ten-dimension equality before Production Readiness Review.
#   bash scripts/gates/check-reality-closure-gate.sh
#
# FAIL-CLOSED:
#   - No Formal Baseline / no Reality Closure evidence → REALITY_CLOSURE_NOT_ARMED (exit 2)
#   - Docs-only claims without machine evidence → never PASS
#   - REALITY_CLOSURE_PASS requires evidence JSON + SHA equality (when armed)
#
# Does NOT mutate Candidate / does NOT deploy / does NOT run L5/S7.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VER="$ROOT/registry/psg-release-version-LATEST.yaml"
IDENT="$ROOT/evidence/GO_web3_candidate_v2/WEB3-CANDIDATE-V2-RELEASE-IDENTITY-LATEST.json"
PLAN="$ROOT/docs/runbook/TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.md"
GATE_EVIDENCE="$ROOT/evidence/PSG-REALITY-CLOSURE/REALITY-CLOSURE-GATE-LATEST.json"
STAGING_META_URL="${TRAVELTRUST_STAGING_META_URL:-https://tt-api-staging.fly.dev/meta}"

echo "TT_REALITY_CLOSURE_GATE: start"

if [[ ! -f "$PLAN" ]]; then
  echo "FAIL missing planning SSOT: $PLAN"
  exit 1
fi
if [[ ! -f "$VER" ]] || [[ ! -f "$IDENT" ]]; then
  echo "FAIL missing PSG pin or Candidate identity"
  exit 1
fi

# --- Armed only when Reality Closure evidence pack exists ---
if [[ ! -f "$GATE_EVIDENCE" ]]; then
  echo "TT_REALITY_CLOSURE_GATE: REALITY_CLOSURE_NOT_ARMED"
  echo "  reason: missing $GATE_EVIDENCE"
  echo "  when: after Formal Baseline + Waves 0–7 + Delta Recertify"
  echo "  forbid: docs-only PASS · Candidate mutation · wait-window Auth/CMS/DB fix as Closure"
  echo "TT_REALITY_CLOSURE_GATE: NOT_ARMED"
  exit 2
fi

# Prefer python for JSON (repo already uses it elsewhere)
python - <<'PY' "$GATE_EVIDENCE" "$IDENT" "$VER" "$STAGING_META_URL" "$ROOT"
import json, sys, urllib.request, subprocess
from pathlib import Path

ev_path, ident_path, ver_path, meta_url, root = sys.argv[1:6]
ev = json.loads(Path(ev_path).read_text(encoding="utf-8"))
ident = json.loads(Path(ident_path).read_text(encoding="utf-8"))

status = ev.get("status") or ev.get("TT_REALITY_CLOSURE_GATE")
if status != "REALITY_CLOSURE_PASS":
    print(f"TT_REALITY_CLOSURE_GATE: FAIL status={status!r} (need REALITY_CLOSURE_PASS)")
    sys.exit(1)

# forbid docs-only
if ev.get("docs_only") is True:
    print("TT_REALITY_CLOSURE_GATE: FAIL docs_only=true forbidden")
    sys.exit(1)

required_dims = [
    "psg_certification", "code", "migration", "database", "deploy",
    "runtime", "document", "evidence", "user_experience", "operations",
]
dims = ev.get("ten_dimensions") or {}
for d in required_dims:
    cell = dims.get(d) or {}
    if cell.get("pass") is not True:
        print(f"TT_REALITY_CLOSURE_GATE: FAIL dimension {d} not pass")
        sys.exit(1)

# SHA equality: evidence vs local HEAD vs identity
local = subprocess.check_output(["git", "-C", root, "rev-parse", "HEAD"], text=True).strip()
ev_sha = (ev.get("aligned_sha") or "").strip().lower()
id_sha = (ident.get("git_sha") or "").strip().lower()
if not ev_sha or ev_sha != local.lower():
    print(f"TT_REALITY_CLOSURE_GATE: FAIL aligned_sha {ev_sha!r} != local HEAD {local}")
    sys.exit(1)
if id_sha and ev_sha != id_sha:
    print(f"TT_REALITY_CLOSURE_GATE: FAIL aligned_sha != Candidate identity {id_sha}")
    sys.exit(1)

# Optional live staging probe (skip if unreachable — still fail if evidence claims staging_sha mismatch)
staging_sha = None
try:
    with urllib.request.urlopen(meta_url, timeout=15) as r:
        meta = json.load(r)
    staging_sha = (meta.get("build") or {}).get("git_sha")
except Exception as e:
    print(f"TT_REALITY_CLOSURE_GATE: WARN staging /meta unreachable: {e}")

claimed = (ev.get("staging_runtime_sha") or "").strip().lower()
if staging_sha and claimed and claimed != staging_sha.strip().lower():
    print(f"TT_REALITY_CLOSURE_GATE: FAIL evidence staging_runtime_sha != live /meta")
    sys.exit(1)
if staging_sha and staging_sha.strip().lower() != ev_sha:
    print(f"TT_REALITY_CLOSURE_GATE: FAIL live Staging SHA {staging_sha} != aligned_sha {ev_sha}")
    sys.exit(1)

# Sampling / ops flags must be true in evidence (machine-attested, not narrative)
for key in ("sample_flows_pass", "ops_alert_exists", "ops_incident_exists", "ops_backup_exists", "ops_rollback_exists"):
    if ev.get(key) is not True:
        print(f"TT_REALITY_CLOSURE_GATE: FAIL {key} must be true in evidence")
        sys.exit(1)

print("TT_REALITY_CLOSURE_GATE: REALITY_CLOSURE_PASS")
print("  next: Production Readiness Review (separate gate · ≠ automatic Production GO)")
sys.exit(0)
PY
