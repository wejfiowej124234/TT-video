#!/usr/bin/env bash
# L5 UI/UX Enterprise Acceptance · matrix + contract tests (159)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_UI_UX_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/l5-ui-ux-acceptance-${STAMP}}"
EVID="$ROOT/evidence/l5_ui_ux_enterprise_acceptance"
mkdir -p "$OUT"

exec > >(tee -a "$OUT/audit.log") 2>&1
echo "== L5 UI/UX Enterprise Acceptance · $STAMP =="
echo "baselines: 145 OPERATIONS_PLATFORM_GO · 150 E2E-A-01 GO · 157 OPERATIONS_L5_AUDIT_GO"

SKIP="${L5_UI_UX_SKIP_CONTRACTS:-0}"
if [[ "$SKIP" == "1" ]]; then
  python "$ROOT/scripts/dev/generate-l5-ui-ux-enterprise-audit-matrix.py" "$EVID/audit_matrix.v1.json" static
else
  python "$ROOT/scripts/dev/generate-l5-ui-ux-enterprise-audit-matrix.py" "$EVID/audit_matrix.v1.json"
fi

# Playwright manifest (list specs · live run optional)
python - "$ROOT" "$OUT/playwright-manifest.json" <<'PY'
import json, sys
from pathlib import Path
root = Path(sys.argv[1])
out = Path(sys.argv[2])
specs = sorted((root / "frontend/e2e").glob("*.spec.ts"))
payload = {
    "schema": "traveltrust_l5_ui_ux_playwright_manifest.v1",
    "specs": [str(p.relative_to(root)).replace("\\", "/") for p in specs if any(
        x in p.name for x in ("c-s", "o-s", "g-s", "e2e-a-01")
    )],
    "run_hint": "PLAYWRIGHT_BASE_URL=http://localhost:3012 npm run e2e -- frontend/e2e/<spec>",
    "screenshot_hint": "Re-run with --headed · traces in frontend/test-results/ on failure",
}
out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"playwright manifest: {len(payload['specs'])} ops-plane specs")
PY

cp "$EVID/audit_matrix.v1.json" "$OUT/" 2>/dev/null || true
cp "$OUT/playwright-manifest.json" "$EVID/" 2>/dev/null || true
echo "Evidence: $OUT"
