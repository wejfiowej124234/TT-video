#!/usr/bin/env bash
# TTG Governance Cert · post-change regression gate (Phase ②)
#
# Re-run machine smokes for all COMPLETED cert steps; validate registry + tier sync.
# Does NOT finalize active cert; does NOT bypass Timelock / FORCE_EXECUTE.
#
#   bash scripts/dev/run-ttg-governance-cert-post-change-gate.sh
#   bash scripts/dev/run-ttg-governance-cert-post-change-gate.sh --force
#   bash scripts/dev/run-ttg-governance-cert-post-change-gate.sh --check-paths-only
#
# Success: TTG_GOV_CERT_POST_CHANGE: OK completed=N active=M
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

FORCE=0
PATHS_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    --check-paths-only) PATHS_ONLY=1 ;;
  esac
done

fail() { echo "TTG_GOV_CERT_POST_CHANGE: FAIL $*" >&2; exit 1; }

should_run() {
  if [[ "$FORCE" -eq 1 ]]; then
    return 0
  fi
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    return 0
  fi
  local paths_file="$ROOT/registry/ttg-governance-cert-gates.v1.yaml"
  [[ -f "$paths_file" ]] || return 0
  python - "$paths_file" <<'PY'
import subprocess, sys
from pathlib import Path
try:
    import yaml
except ImportError:
    sys.exit(0)
paths_file = Path(sys.argv[1])
root = paths_file.resolve().parents[1]
reg = yaml.safe_load(paths_file.read_text(encoding="utf-8"))
triggers = reg.get("path_triggers", [])
diff = subprocess.run(
    ["git", "diff", "--name-only", "HEAD"],
    capture_output=True, text=True, encoding="utf-8", errors="replace",
    cwd=root,
)
names = [ln.strip() for ln in diff.stdout.splitlines() if ln.strip()]
if not names:
    unst = subprocess.run(
        ["git", "diff", "--name-only"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        cwd=root,
    )
    names = [ln.strip() for ln in unst.stdout.splitlines() if ln.strip()]
for name in names:
    p = name.replace("\\", "/")
    for t in triggers:
        t = t.rstrip("/")
        if p == t or p.startswith(t + "/") or t in p:
            sys.exit(0)
sys.exit(1)
PY
}

if [[ "$PATHS_ONLY" -eq 1 ]]; then
  if should_run; then
    echo "TTG_GOV_CERT_POST_CHANGE: PATHS_MATCH yes"
    exit 0
  fi
  echo "TTG_GOV_CERT_POST_CHANGE: PATHS_MATCH no"
  exit 1
fi

if ! should_run; then
  echo "TTG_GOV_CERT_POST_CHANGE: SKIP no governance cert path triggers (use --force)"
  exit 0
fi

echo "== TTG Governance Cert Post-Change Gate (②) =="
echo "Registry: registry/ttg-governance-cert-gates.v1.yaml"
echo "SSOT: docs/runbook/TTG-CERT-EXECUTION-SESSION-RUNBOOK.md"
echo ""

python "$ROOT/scripts/dev/validate-ttg-governance-cert-gates-registry.py" \
  || fail "registry validate"

OVERRIDES="$ROOT/docs/spec/governance-token/artifacts/ttg-governance-tier-overrides.v1.json"
[[ -f "$OVERRIDES" ]] || fail "missing tier overrides"
export TTG_TIER_OVERRIDES="$OVERRIDES"
COMPLETED="$(python - <<'PY'
import json, os
from pathlib import Path
o = json.loads(Path(os.environ["TTG_TIER_OVERRIDES"]).read_text(encoding="utf-8"))
print(" ".join(str(x) for x in o.get("cert_queue_completed", [])))
PY
)"
[[ -n "$COMPLETED" ]] || fail "cert_queue_completed empty — run cert finalize first or init session"

SMOKES="$(python - <<'PY'
import json, os, yaml
from pathlib import Path
reg = yaml.safe_load(Path("registry/ttg-governance-cert-gates.v1.yaml").read_text(encoding="utf-8"))
done = json.loads(Path(os.environ["TTG_TIER_OVERRIDES"]).read_text(encoding="utf-8")).get("cert_queue_completed", [])
for n in sorted(done):
    row = reg.get("certs", {}).get(str(n), {})
    smoke = row.get("smoke")
    if smoke:
        print(f"{n}:{smoke.strip()}")
PY
)"

fail_n=0
ran=0
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line//$'\r'/}"
  [[ "$line" =~ ^[0-9]+: ]] || continue
  cert="${line%%:*}"
  smoke="${line#*:}"
  smoke="${smoke//$'\r'/}"
  [[ -n "$smoke" && -f "$ROOT/$smoke" ]] || continue
  echo "-- Cert #${cert} smoke: ${smoke}"
  if bash "$ROOT/$smoke" 2>&1 | tee "/tmp/ttg-cert${cert}-smoke.log" | tail -3; then
    echo "OK   Cert #${cert}"
    ran=$((ran + 1))
  else
    echo "FAIL Cert #${cert} smoke"
    fail_n=$((fail_n + 1))
  fi
done <<< "$SMOKES"

ACTIVE="$(python - <<'PY'
import json, os
from pathlib import Path
o = json.loads(Path(os.environ["TTG_TIER_OVERRIDES"]).read_text(encoding="utf-8"))
done = set(o.get("cert_queue_completed", []))
active = min((c for c in range(1, 13) if c not in done), default=0)
print(active)
PY
)"

if [[ "$fail_n" -gt 0 ]]; then
  fail "completed cert smoke regression ($fail_n failed)"
fi

if [[ "$ran" -eq 0 ]]; then
  echo "WARN no smoke scripts ran for completed queue ($COMPLETED)"
fi

echo ""
echo "Active cert queue item: #${ACTIVE} (finalize separately; Timelock/wallet gates apply)"
echo "TTG_GOV_CERT_POST_CHANGE: OK completed=${ran} active=${ACTIVE}"
exit 0
