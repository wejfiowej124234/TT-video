#!/usr/bin/env bash
# PI3-006 · M-00 Final Release Audit wrapper
#
# Wraps run-phase3-production-go-audit.sh for Sepolia prod scope.
# Prefer PROD_* bases; staging proxy allowed for program dry-run (WARN in baseline).
#
#   PROD_API_BASE=https://api.<domain> \
#   PROD_WEB_BASE=https://app.<domain> \
#     bash scripts/dev/run-m00-final-release-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_006_M00_AUDIT_DIR:-$ROOT/evidence/pi3_006_go_live_production_cutover/m00-audit-${STAMP}}"
BASELINE="$ROOT/evidence/pi3_006_go_live_production_cutover/baseline_record.v1.json"
DECISION="$ROOT/docs/runbook/PRODUCTION-GO-DECISION-PACKAGE.md"

API="${PROD_API_BASE:-${API_BASE:-https://tt-api-staging.fly.dev}}"
WEB="${PROD_WEB_BASE:-${WEB_BASE:-https://tt-web-staging.fly.dev}}"
API="${API%/}"
WEB="${WEB%/}"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/m00-audit.log") 2>&1

prod_mode=0
if [[ -n "${PROD_API_BASE:-}" && -n "${PROD_WEB_BASE:-}" ]]; then
  prod_mode=1
fi

echo "== M-00 Final Release Audit · ${STAMP} =="
echo "SSOT: PRODUCTION-GO-DECISION-PACKAGE.md · 147 §7.1 G6/G7"
echo "api=${API} web=${WEB} prod_mode=${prod_mode}"

API_BASE="$API" WEB_BASE="$WEB" PHASE3_EVIDENCE_DIR="$OUT/phase3-go-audit" \
  bash "$ROOT/scripts/dev/run-phase3-production-go-audit.sh" 2>&1 | tee "$OUT/phase3-go-audit-wrapper.log" || audit_rc=$?
audit_rc="${audit_rc:-0}"
echo "phase3-go-audit exit=${audit_rc} (NO_GO expected until Owner closure)"

audit_json="$OUT/phase3-go-audit/go_no_go.json"
if [[ ! -f "$audit_json" ]]; then
  echo "FAIL: missing go_no_go.json"
  exit 2
fi

python - "$audit_json" "$OUT/m00-summary.json" "$STAMP" "$prod_mode" "$API" "$WEB" <<'PY'
import json, sys
from pathlib import Path

audit = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
out = Path(sys.argv[2])
stamp, prod_mode, api, web = sys.argv[3], int(sys.argv[4]), sys.argv[5], sys.argv[6]
blockers = (audit.get("counts") or {}).get("blocker", 99)
verdict = audit.get("verdict", "NO_GO")
summary = {
    "kind": "traveltrust.pi3_006_m00_final_release_audit.v1",
    "recorded_utc": stamp,
    "audit_verdict": verdict,
    "blocker_count": blockers,
    "prod_bases_used": bool(prod_mode),
    "api_base": api,
    "web_base": web,
    "production_scope": "PRODUCTION_SCOPE_SEPOLIA",
    "mainnet_section_9": "N_A_SEPOLIA_SCOPE",
    "m00_gate": "G6",
    "production_go_decision_required": "GO",
    "honest_expectation": "NO_GO until PI3-001~004 Owner GO and checklist closed",
}
out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
print(f"audit_verdict={verdict} blockers={blockers} prod_bases={bool(prod_mode)}")
PY

m00_signed=0
prod_decision="NO_GO"
if [[ -f "$DECISION" ]]; then
  grep -q 'M-00_SIGNED: true' "$DECISION" && m00_signed=1 || true
  if grep -q '^PRODUCTION_GO_DECISION: GO' "$DECISION"; then
    prod_decision="GO"
  fi
  echo "decision_package: PRODUCTION_GO_DECISION ${prod_decision} · M-00_SIGNED=${m00_signed}"
fi

rel_audit="${OUT#$ROOT/}/phase3-go-audit/go_no_go.json"
python - "$BASELINE" "$rel_audit" "$STAMP" "$m00_signed" <<'PY'
import json, sys
from pathlib import Path

p = Path(sys.argv[1])
data = json.loads(p.read_text(encoding="utf-8"))
data["last_m00_audit_path"] = sys.argv[2]
if not data.get("last_cutover_smoke_utc"):
    data["last_cutover_smoke_utc"] = ""
p.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"baseline updated: last_m00_audit_path={sys.argv[2]}")
PY

echo "Evidence: $OUT"
echo "TT_PI3_006_M00_FINAL_RELEASE_AUDIT: recorded (see m00-summary.json)"
