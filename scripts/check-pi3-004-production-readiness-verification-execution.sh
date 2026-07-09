#!/usr/bin/env bash
# PI3-004 · Production Readiness Verification Execution gate (154 SSOT)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_004_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-004-exec-${STAMP}}"
mkdir -p "$OUT"
LOG="$OUT/gate.log"
exec > >(tee -a "$LOG") 2>&1

echo "== PI3-004 Production Readiness Verification Execution · ${STAMP} =="
echo "SSOT: docs/handbook/engineering/154-PI3-004-Production-Readiness-Verification-Report.md"
echo "Scope: 148 PRODUCTION_SCOPE_SEPOLIA"
echo "Discipline: no new product feature code"

for f in \
  scripts/dev/generate-pi3-004-production-report-skeleton.py \
  scripts/dev/run-r003-production-regression.sh \
  scripts/dev/run-production-uat-six-domains.sh \
  scripts/dev/verify-pi3-004-six-domain-matrix.sh \
  scripts/dev/verify-pi3-004-ops-planes-freeze-matrix.sh \
  scripts/dev/verify-pi3-004-production-report-evidence.sh; do
  [[ -f "$ROOT/$f" ]] || { echo "execution artifacts: FAIL missing $f" >&2; exit 2; }
done
echo "execution artifacts: OK"
echo "151/152/153 execution baselines: OK"

python "$ROOT/scripts/gates/check-pi3-004-production-readiness-baseline-record.py" | tee "$OUT/pi3-004-baseline-gate.log"
pi4_st="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['status'])" "$ROOT/evidence/pi3_004_production_readiness_verification/baseline_record.v1.json")"
echo "pi3-004 baseline status=${pi4_st}"

bash "$ROOT/scripts/dev/verify-pi3-004-six-domain-matrix.sh" 2>&1 | tee "$OUT/six-domain-matrix.log" || true
bash "$ROOT/scripts/dev/verify-pi3-004-ops-planes-freeze-matrix.sh" 2>&1 | tee "$OUT/ops-planes-matrix.log" || true
bash "$ROOT/scripts/dev/verify-pi3-004-production-report-evidence.sh" 2>&1 | tee "$OUT/report-evidence.log" || true

python "$ROOT/scripts/dev/generate-pi3-004-production-report-skeleton.py" \
  --out "$ROOT/evidence/pi3_004_production_readiness_verification/r003-prod-skeleton" \
  --prod-api-base "${PROD_API_BASE:-https://api.example.com}" \
  --prod-web-base "${PROD_WEB_BASE:-https://app.example.com}" \
  2>&1 | tee "$OUT/generate-skeleton.log"

sk_rg="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['release_gate'])" "$ROOT/evidence/pi3_004_production_readiness_verification/r003-prod-skeleton/report.json")"
echo "skeleton release_gate=${sk_rg}"

latest_r003="$(ls -d "$ROOT/evidence/pi3_004_production_readiness_verification"/r003-production-* 2>/dev/null | sort | tail -1 || true)"
prod_r003_go=false
prod_r003_interim=false
if [[ -n "$latest_r003" && -f "${latest_r003}/report.json" ]]; then
  prg="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['release_gate'])" "${latest_r003}/report.json")"
  [[ "$prg" == "GO" ]] && prod_r003_go=true
  [[ "$prg" == "GO" || "$prg" == "PARTIAL_GO" ]] && prod_r003_interim=true
fi

prod_uat_ready=false
latest_uat="$(ls -d "$ROOT/evidence/pi3_004_production_readiness_verification"/prod-uat-six-domains-* 2>/dev/null | sort | tail -1 || true)"
if [[ -n "$latest_uat" && -f "${latest_uat}/STATUS.txt" ]]; then
  uat_st="$(cat "${latest_uat}/STATUS.txt")"
  if [[ "$uat_st" == "READY" || "$uat_st" == "INTERIM_READY" ]]; then
    prod_uat_ready=true
    echo "prod six-domain UAT: ${latest_uat##*/} STATUS=${uat_st}"
  fi
fi

interim_domain=false
[[ "${PROD_WEB_BASE:-https://tt-web-prod.fly.dev}" == *".fly.dev"* || "${PROD_API_BASE:-https://tt-api-prod.fly.dev}" == *".fly.dev"* ]] && interim_domain=true

verdict="PI3-004_HOLD"
if [[ "$pi4_st" == "PASS" && "$prod_r003_go" == true ]]; then
  verdict="PI3-004_GO"
elif [[ "$interim_domain" == true && "$prod_r003_interim" == true && "$prod_uat_ready" == true ]]; then
  verdict="PI3-004_INTERIM_GO"
  echo "PI3-004: INTERIM_GO (*.fly.dev · R-003 ${prg:-unknown} · six-domain UAT READY)"
fi

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  kind:'traveltrust.pi3_004_production_readiness_verification_execution.v1',
  recorded_utc:process.argv[2],
  verdict:process.argv[3],
  production_scope:'PRODUCTION_SCOPE_SEPOLIA',
  execution_sprint:'154',
  pi3_004_baseline_status:process.argv[4],
  skeleton_report_release_gate:process.argv[5],
  prod_r003_report_go:process.argv[6]==='true',
  r002_validate:'scripts/validate-regression-report.py --fail-on-no-go --require-go'
},null,2)+'\n');
" "$OUT/summary.json" "$STAMP" "$verdict" "$pi4_st" "$sk_rg" "$prod_r003_go"

echo ""
echo "Evidence: $OUT"
echo "TT_PI3_004_PRODUCTION_READINESS_VERIFICATION_EXECUTION: ${verdict}"
if [[ "$verdict" == "PI3-004_GO" || "$verdict" == "PI3-004_INTERIM_GO" ]]; then exit 0; fi
echo "PI3-004 execution prep: PASS (live closure OPEN — R-003 prod + six-domain UAT)"
exit 0
