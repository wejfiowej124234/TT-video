#!/usr/bin/env bash
# R-003 Production full regression wrapper（PI3-004 · Sepolia scope · Owner）
#
#   PROD_API_BASE=https://api.<domain> PROD_WEB_BASE=https://app.<domain> \
#     bash scripts/dev/run-r003-production-regression.sh
#
# Wraps r003_staging_full_regression.py with --environment-name prod · post-labels production scope.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${R003_PROD_OUT:-$ROOT/evidence/pi3_004_production_readiness_verification/r003-production-${STAMP}}"
BASELINE="$ROOT/evidence/pi3_004_production_readiness_verification/baseline_record.v1.json"

PROD_API="${PROD_API_BASE:-${PUBLIC_API_BASE_URL:-}}"
PROD_WEB="${PROD_WEB_BASE:-${NEXT_PUBLIC_SITE_URL:-}}"
EXECUTOR="${R003_PROD_EXECUTOR:-pi3-004-owner@traveltrust.local}"

[[ -n "$PROD_API" && "$PROD_API" != *example.com* ]] || {
  echo "run-r003-production-regression: set PROD_API_BASE to real prod API" >&2
  exit 2
}

mkdir -p "$OUT"
exec > >(tee -a "$OUT/run.log") 2>&1

PROD_API_BASE="${PROD_API}" bash "$ROOT/scripts/dev/bootstrap-prod-r003-account.sh" 2>&1 | tee "$OUT/bootstrap-account.log" || true
R003_PROD_A_EMAIL="${R003_PROD_A_EMAIL:-r003.prod.interim2@traveltrust.test}"
R003_PROD_A_PASSWORD="${R003_PROD_A_PASSWORD:-R003ProdPass9!}"
echo "== R-003 production regression · ${STAMP} =="
echo "api=${PROD_API} web=${PROD_WEB:-<unset>} scope=PRODUCTION_SCOPE_SEPOLIA"

python "$ROOT/scripts/dev/r003_staging_full_regression.py" \
  --environment-name prod \
  --api-base "${PROD_API%/}" \
  --out "$OUT" \
  --executor "$EXECUTOR" \
  --chain-mode testnet \
  --auth-mode cookie \
  ${R003_PROD_A_EMAIL:+--a-email "$R003_PROD_A_EMAIL"} \
  ${R003_PROD_A_PASSWORD:+--a-password "$R003_PROD_A_PASSWORD"} \
  "$@"

# Normalize environment.name → production (R-001 / go-live §0.3)
python - "$OUT/report.json" "$PROD_API" "$PROD_WEB" <<'PY'
import json, sys
from pathlib import Path
p, api, web = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
data = json.loads(p.read_text(encoding="utf-8"))
env = data.setdefault("environment", {})
env["name"] = "production"
env["production_scope"] = "PRODUCTION_SCOPE_SEPOLIA"
env["chain_id"] = 11155111
env["prod_api_base"] = api
if web:
    env["prod_web_base"] = web
data["title"] = "R-003 Production full-site regression (Sepolia scope)"
p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("normalized environment.name=production")
PY

python "$ROOT/scripts/validate-regression-report.py" "$OUT/report.json" | tee "$OUT/validate-shape.log"

RUN_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RG="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('release_gate',''))" "$OUT/report.json")"

python - "$BASELINE" "$OUT/report.json" "$RUN_UTC" "$RG" <<'PY'
import json, sys
from pathlib import Path
baseline, report, run_utc, rg = sys.argv[1:5]
p = Path(baseline)
data = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
data["last_r003_production_run_utc"] = run_utc
data["report_json_path"] = report.replace("\\", "/")
data["report_release_gate"] = rg
if rg == "GO":
    data["status"] = "PASS"
    data["production_scope"] = "PRODUCTION_SCOPE_SEPOLIA"
data["notes"] = f"R-003 production run {run_utc} release_gate={rg}"
p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"baseline updated report_release_gate={rg} status={data.get('status')}")
PY

if [[ "$RG" == "GO" ]]; then
  python "$ROOT/scripts/gates/check-pi3-004-production-readiness-baseline-record.py" | tee "$OUT/pi3-004-baseline-gate.log"
  python "$ROOT/scripts/validate-regression-report.py" "$OUT/report.json" --fail-on-no-go --require-go | tee "$OUT/validate-go.log"
fi

echo "READY" >"$OUT/STATUS.txt"
echo "TT_R003_PRODUCTION_REGRESSION: OK release_gate=${RG}"
echo "Evidence: ${OUT}"
