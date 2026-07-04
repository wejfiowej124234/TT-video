#!/usr/bin/env bash
# G2 Reality Verification — prod/staging probes · internal route matrix · alert drill.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${1:-$ROOT/evidence/GO_production_readiness/g2-reality-verification/_tmp}"
PROD_API_BASE="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
PROD_API_BASE="${PROD_API_BASE%/}"
STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API_BASE="${STAGING_API_BASE%/}"

mkdir -p "$OUT/security-b001" "$OUT/security-b002" "$OUT/performance-b001" "$OUT/monitoring-b001"

# shellcheck source=scripts/dev/lib/g2-prod-probe.sh
source "$ROOT/scripts/dev/lib/g2-prod-probe.sh"

echo "== G2 Reality Verification probes · PROD=${PROD_API_BASE} =="

# --- SEC-B001: all internal routes without secret ---
ROUTES_JSON="$ROOT/registry/g2-internal-routes-ssot.v1.json"
set +e
python - "$ROUTES_JSON" "$OUT/security-b001/internal-route-matrix.json" "$PROD_API_BASE" <<'PY'
import json, subprocess, sys, time, uuid
routes_path, out_path, base = sys.argv[1:4]
routes = json.load(open(routes_path, encoding="utf-8"))["routes"]
results = []
fail = 0
for r in routes:
    method = r["method"]
    path = r["path"]
    url = base + path
    idem = f"g2-verify-{uuid.uuid4()}"
    cmd = ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "20", "-X", method, url]
    if r.get("body") is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", r["body"]]
    if method in ("POST", "PATCH", "PUT", "DELETE"):
        cmd += ["-H", f"Idempotency-Key: {idem}"]
    try:
        code = subprocess.check_output(cmd, text=True).strip()
    except subprocess.CalledProcessError:
        code = "000"
    ok = code in ("401", "403")
    if not ok:
        fail += 1
    results.append({"method": method, "path": path, "http": code, "gate_ok": ok})
summary = {
    "prod_api_base": base,
    "routes_total": len(results),
    "routes_gate_ok": sum(1 for x in results if x["gate_ok"]),
    "routes_gate_fail": fail,
    "pass": fail == 0,
    "routes": results,
}
json.dump(summary, open(out_path, "w", encoding="utf-8"), indent=2)
print(json.dumps({"internal_routes_pass": summary["pass"], "fail": fail, "total": len(results)}))
sys.exit(0 if summary["pass"] else 1)
PY
internal_exit=$?
set -e

# Code anchors
SSOT_ROUTE_COUNT="$(python - "$ROUTES_JSON" <<'PY'
import json, sys
print(len(json.load(open(sys.argv[1], encoding="utf-8"))["routes"]))
PY
)"
{
  echo "router_internal_gate=$(grep -c 'internal_api_secret_gate_layer' "$ROOT/crates/api/src/router.rs" || true)"
  echo "middleware_prefix_gate=$(grep -c 'starts_with(\"/api/v1/internal/\")' "$ROOT/crates/api/src/middleware/auth_pause_metrics/mod.rs" || true)"
  echo "ssot_routes=${SSOT_ROUTE_COUNT}"
} | tee "$OUT/security-b001/code-anchors.txt"

g2_probe_fly_secrets_inventory "$OUT/security-b001"
g2_probe_meta_build "$PROD_API_BASE" prod "$OUT/security-b001"

# --- SEC-B002 ---
mkdir -p "$OUT/security-b002/staging" "$OUT/security-b002/prod"
g2_probe_meta_build "$STAGING_API_BASE" staging "$OUT/security-b002/staging"
g2_probe_meta_build "$PROD_API_BASE" prod "$OUT/security-b002/prod"
cat "$OUT/security-b002/staging/meta-summary.txt" "$OUT/security-b002/prod/meta-summary.txt" \
  >"$OUT/security-b002/meta-summary.txt"
g2_probe_seed_endpoint "$PROD_API_BASE" prod "$OUT/security-b002"
g2_probe_fly_secrets_inventory "$OUT/security-b002"
g2_probe_fly_env_redacted "$OUT/security-b002"
g2_compare_staging_prod_profiles "$OUT/security-b002"
cat "$OUT/security-b002/staging/meta-summary.txt" "$OUT/security-b002/prod/meta-summary.txt" \
  >"$OUT/security-b002/meta-summary.txt"

# --- Production Runtime Identity Guard (PRM-SEC-B002 / TT_PRODUCTION_RUNTIME_IDENTITY) ---
mkdir -p "$OUT/production-runtime-identity/staging" "$OUT/production-runtime-identity/prod"
g2_probe_meta_build "$STAGING_API_BASE" staging "$OUT/production-runtime-identity/staging"
g2_probe_meta_build "$PROD_API_BASE" prod "$OUT/production-runtime-identity/prod"
cat "$OUT/production-runtime-identity/staging/meta-summary.txt" \
  "$OUT/production-runtime-identity/prod/meta-summary.txt" \
  >"$OUT/production-runtime-identity/meta-summary.txt"
cp "$OUT/production-runtime-identity/prod/meta-build.json" "$OUT/production-runtime-identity/meta-build.json"
cp "$OUT/production-runtime-identity/prod/meta.json" "$OUT/production-runtime-identity/meta.json"
g2_compare_staging_prod_profiles "$OUT/production-runtime-identity"
g2_probe_seed_endpoint "$PROD_API_BASE" prod "$OUT/production-runtime-identity"
g2_probe_fly_secrets_inventory "$OUT/production-runtime-identity"
g2_probe_fly_env_redacted "$OUT/production-runtime-identity"
g2_compare_staging_prod_profiles "$OUT/production-runtime-identity"
cat "$OUT/production-runtime-identity/staging/meta-summary.txt" \
  "$OUT/production-runtime-identity/prod/meta-summary.txt" \
  >"$OUT/production-runtime-identity/meta-summary.txt"

# --- PER-B001: hot paths from registry ---
HOT_PATHS="$ROOT/registry/g2-perf-hot-paths-ssot.v1.json"
python - "$HOT_PATHS" "$OUT/performance-b001/latency.tsv" "$PROD_API_BASE" <<'PY'
import json, subprocess, sys
spec = json.load(open(sys.argv[1], encoding="utf-8"))
out_tsv, base = sys.argv[2], sys.argv[3]
samples = int(__import__("os").environ.get("G2_PERF_SAMPLES", "15"))
with open(out_tsv, "w", encoding="utf-8") as f:
    for ep in spec["endpoints"]:
        for i in range(1, samples + 1):
            url = base + ep["path"]
            try:
                t = subprocess.check_output(
                    ["curl", "-sS", "-o", "/dev/null", "-w", "%{time_total}", "--max-time", "25", url],
                    text=True,
                ).strip()
            except subprocess.CalledProcessError:
                t = "9.999"
            f.write(f"{ep['id']}\t{ep['path']}\t{i}\t{t}\n")
PY

python - "$HOT_PATHS" "$OUT/performance-b001/latency.tsv" "$OUT/performance-b001/perf-summary.json" "$PROD_API_BASE" <<'PY'
import json, statistics, sys
from collections import defaultdict
spec = json.load(open(sys.argv[1], encoding="utf-8"))
tsv, out, base = sys.argv[2:5]
limits = {e["id"]: e["p95_max_s"] for e in spec["endpoints"]}
by = defaultdict(list)
for line in open(tsv, encoding="utf-8"):
    eid, path, _, t = line.strip().split("\t")
    by[eid].append(float(t))
summary = {"api_base": base, "hot_paths_ssot": spec["schema"], "endpoints": {}, "pass": True}
for eid, times in sorted(by.items()):
    times.sort()
    p95_idx = max(0, int(len(times) * 0.95) - 1)
    p95 = round(times[p95_idx], 4)
    lim = limits.get(eid, 2.0)
    ok = p95 <= lim
    if not ok:
        summary["pass"] = False
    summary["endpoints"][eid] = {"p95_s": p95, "p95_max_s": lim, "pass": ok, "count": len(times)}
json.dump(summary, open(out, "w", encoding="utf-8"), indent=2)
print(json.dumps(summary, indent=2))
PY

# --- MON-B001: synthetic + alert drill (with secret if available) ---
bash "$ROOT/scripts/dev/smoke-g2-prod-monitoring-baseline.sh" "$OUT/monitoring-b001" || true

INTERNAL_SECRET=""
if [[ -f "$ROOT/scripts/dev/.env.production.local" ]]; then
  # shellcheck disable=SC1091
  set +u
  source <(grep -E '^(INTERNAL_API_SECRET|PROD_API_BASE)=' "$ROOT/scripts/dev/.env.production.local" | sed 's/^/export /')
  set -u
fi

ALERT_DRILL="$OUT/monitoring-b001/alert-incident-drill.json"
python - "$PROD_API_BASE" "$ALERT_DRILL" "${INTERNAL_API_SECRET:-}" <<'PY'
import json, subprocess, sys, uuid
base, out, secret = sys.argv[1:4]
report = {"prod_api_base": base, "secret_available": bool(secret.strip()), "steps": []}

def post(path, use_secret=False):
    url = base + path
    idem = f"g2-mon-{uuid.uuid4()}"
    cmd = [
        "curl", "-sS", "--max-time", "20", "-X", "POST", url,
        "-H", "Content-Type: application/json",
        "-H", f"Idempotency-Key: {idem}",
        "-d", "{}",
        "-w", "\n__HTTP__%{http_code}",
    ]
    if use_secret and secret.strip():
        cmd += ["-H", f"X-Internal-Api-Secret: {secret.strip()}"]
    try:
        raw = subprocess.check_output(cmd, text=True)
    except subprocess.CalledProcessError as e:
        raw = e.output or ""
    if "__HTTP__" not in raw:
        return {"http": "000", "body": raw[:500]}
    body, _, code = raw.rpartition("__HTTP__")
    try:
        parsed = json.loads(body) if body.strip() else {}
    except json.JSONDecodeError:
        parsed = {"raw": body[:500]}
    return {"http": code.strip(), "body": parsed}

for name, path in [("alert_test_fire_no_secret", "/api/v1/internal/alerts/test-fire"),
                   ("incident_open_no_secret", "/api/v1/internal/incident/open")]:
    report["steps"].append({"step": name, **post(path, use_secret=False)})

if secret.strip():
    fire = post("/api/v1/internal/alerts/test-fire", use_secret=True)
    inc = post("/api/v1/internal/incident/open", use_secret=True)
    report["steps"].append({"step": "alert_test_fire_with_secret", **fire})
    report["steps"].append({"step": "incident_open_with_secret", **inc})
    inc_id = (inc.get("body") or {}).get("incident", {}).get("id")
    report["incident_record"] = {
        "opened_id": inc_id,
        "resolve_note": "Resolve path is runbook-driven until /internal/incident/resolve exists",
        "runbook": "docs/runbook/PRODUCTION-INCIDENT-RESPONSE.md",
        "drill_complete": fire.get("http") == "200" and inc.get("http") == "200" and bool(inc_id),
    }
else:
    report["incident_record"] = {
        "drill_complete": False,
        "reason": "INTERNAL_API_SECRET not loaded locally — set scripts/dev/.env.production.local for authenticated drill",
    }

json.dump(report, open(out, "w", encoding="utf-8"), indent=2)
print(json.dumps({"alert_drill": report.get("incident_record", {})}, indent=2))
PY

echo "Verification probes complete: $OUT (internal_matrix_exit=$internal_exit)"
exit 0
