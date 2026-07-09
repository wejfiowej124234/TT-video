#!/usr/bin/env bash
# G2 · PRM-PER-B001 — prod API latency baseline (read-only GET probes).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
API="${API%/}"
OUT="${1:-$ROOT/evidence/GO_production_readiness/g2-reality-fix/_tmp/perf}"
SAMPLES="${G2_PERF_SAMPLES:-25}"
mkdir -p "$OUT"

endpoints=(
  "/health"
  "/meta"
  "/api/v1/community/feed?limit=5"
)

: >"$OUT/latency.tsv"
for ep in "${endpoints[@]}"; do
  for i in $(seq 1 "$SAMPLES"); do
    t="$(curl -sS -o /dev/null -w '%{time_total}' --max-time 20 "${API}${ep}" 2>/dev/null || echo 9.999)"
    printf '%s\t%s\t%s\n' "$ep" "$i" "$t" >>"$OUT/latency.tsv"
  done
done

python - "$OUT/latency.tsv" "$OUT/perf-summary.json" "$API" <<'PY'
import json, statistics, sys
from collections import defaultdict
path, out, api = sys.argv[1:4]
by = defaultdict(list)
for line in open(path, encoding="utf-8"):
    ep, _, t = line.strip().split("\t")
    by[ep].append(float(t))
summary = {"api_base": api, "samples_per_endpoint": len(next(iter(by.values()), [])), "endpoints": {}}
for ep, times in sorted(by.items()):
    times.sort()
    p95_idx = max(0, int(len(times) * 0.95) - 1)
    summary["endpoints"][ep] = {
        "count": len(times),
        "p50_s": round(statistics.median(times), 4),
        "p95_s": round(times[p95_idx], 4),
        "max_s": round(max(times), 4),
    }
summary["pass"] = all(
    summary["endpoints"].get(ep, {}).get("p95_s", 99) <= limit
    for ep, limit in {
        "/health": 2.0,
        "/meta": 6.0,
        "/api/v1/community/feed?limit=5": 2.0,
    }.items()
)
json.dump(summary, open(out, "w", encoding="utf-8"), indent=2)
print(json.dumps(summary, indent=2))
PY

if python -c "import json,sys; sys.exit(0 if json.load(open(sys.argv[1],encoding='utf-8')).get('pass') else 1)" "$OUT/perf-summary.json"; then
  echo "G2 prod perf baseline: PASS"
else
  echo "G2 prod perf baseline: WARN (p95 > 2s on an endpoint — review perf-summary.json)"
fi
