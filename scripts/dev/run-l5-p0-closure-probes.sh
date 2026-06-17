#!/usr/bin/env bash
# L5-P0 Closure · run all probes → p0_closure_record.v1.json
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${L5_P0_CLOSURE_DIR:-$ROOT/evidence/l5_operations_deep_audit/p0_closure_probes/run-${STAMP}}"
EVID="$ROOT/evidence/l5_operations_deep_audit"
mkdir -p "$OUT"
export L5_P0_PROBE_OUT="$OUT"
PARTIAL="$OUT/p0_closure_record.partial.json"
rm -f "$PARTIAL"

exec > >(tee -a "$OUT/probes.log") 2>&1
echo "== L5-P0 Closure probes · $STAMP =="
echo "api=${L5_P0_API:-${API_BASE:-http://127.0.0.1:8080}}"

for script in \
  l5-p0-e2-approval-chain-smoke.sh \
  l5-p0-e3-2fa-coverage-smoke.sh \
  l5-p0-e4-rbac-escalation-smoke.sh \
  l5-p0-c5-growth-freeze-cross-smoke.sh \
  l5-p0-d3-cold-start-linkage-smoke.sh; do
  echo ""
  bash "$ROOT/scripts/dev/$script" || true
done

python - "$PARTIAL" "$EVID/p0_closure_record.v1.json" "$STAMP" <<'PY'
import json, sys
from pathlib import Path
partial = Path(sys.argv[1])
out = Path(sys.argv[2])
stamp = sys.argv[3]
data = json.loads(partial.read_text(encoding="utf-8")) if partial.is_file() else {"probes": {}}
probes = data.get("probes", {})
go = sum(1 for p in probes.values() if p.get("verdict") == "GO")
hold = sum(1 for p in probes.values() if p.get("verdict") != "GO")
payload = {
    "schema": "traveltrust_l5_p0_closure_record.v1",
    "recorded_utc": stamp,
    "probes": probes,
    "summary": {"go": go, "hold": hold, "total": len(probes)},
    "target_ids": ["E2", "E3", "E4", "C5", "D3", "F5"],
}
out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"p0_closure_record: GO={go}/{len(probes)} written {out}")
PY

cp "$EVID/p0_closure_record.v1.json" "$OUT/" 2>/dev/null || true
echo "Evidence: $OUT"
