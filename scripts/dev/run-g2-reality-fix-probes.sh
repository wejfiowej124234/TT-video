#!/usr/bin/env bash
# Collect G2 Reality Fix probes into evidence subdirs (prod-first · staging cross-check).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${1:-$ROOT/evidence/GO_production_readiness/g2-reality-fix/_tmp}"
# shellcheck source=scripts/dev/lib/g2-prod-probe.sh
source "$ROOT/scripts/dev/lib/g2-prod-probe.sh"

mkdir -p "$OUT/security-b001" "$OUT/security-b002" "$OUT/performance-b001" "$OUT/monitoring-b001"

echo "== G2 prod probes · PROD=${PROD_API_BASE} =="

g2_probe_meta_build "$PROD_API_BASE" prod "$OUT/security-b001"
g2_probe_internal_exposure "$PROD_API_BASE" prod "$OUT/security-b001"
g2_probe_fly_secrets_inventory "$OUT/security-b001"

mkdir -p "$OUT/security-b002/staging" "$OUT/security-b002/prod"
g2_probe_meta_build "$STAGING_API_BASE" staging "$OUT/security-b002/staging"
g2_probe_meta_build "$PROD_API_BASE" prod "$OUT/security-b002/prod"
cat "$OUT/security-b002/staging/meta-summary.txt" "$OUT/security-b002/prod/meta-summary.txt" \
  >"$OUT/security-b002/meta-summary.txt"
g2_probe_internal_exposure "$PROD_API_BASE" prod "$OUT/security-b002"
g2_probe_seed_endpoint "$PROD_API_BASE" prod "$OUT/security-b002"
g2_probe_fly_secrets_inventory "$OUT/security-b002"
g2_probe_fly_env_redacted "$OUT/security-b002"

bash "$ROOT/scripts/dev/smoke-g2-prod-perf-baseline.sh" "$OUT/performance-b001"
bash "$ROOT/scripts/dev/smoke-g2-prod-monitoring-baseline.sh" "$OUT/monitoring-b001"

echo "G2 probes written: $OUT"
