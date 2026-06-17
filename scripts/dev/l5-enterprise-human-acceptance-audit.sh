#!/usr/bin/env bash
# L5 Enterprise · Human Acceptance manifest audit (161 · HA track)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MANIFEST="$ROOT/evidence/l5_enterprise_acceptance/human_acceptance_manifest.v1.json"

echo "== L5 Enterprise Human Acceptance Audit =="
[[ -f "$MANIFEST" ]] || { echo "FAIL missing manifest"; exit 2; }

python - "$MANIFEST" <<'PY'
import json, sys
from pathlib import Path
m = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
required = {"traveler", "guide", "merchant", "ops", "admin"}
roles = {j.get("role") for j in m.get("journeys", [])}
missing = required - roles
for role in sorted(required):
    print(f"  role {role}: {'GO' if role in roles else 'MISSING'}")
if missing:
    sys.exit(1)
PY

echo "TT_HUMAN_ACCEPTANCE: HUMAN_ACCEPTANCE_GO"
exit 0
