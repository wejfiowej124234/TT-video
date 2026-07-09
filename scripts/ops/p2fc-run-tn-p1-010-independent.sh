#!/usr/bin/env bash
# ② · TN-P1-010 独立执行轨（internal 脊 · 不依赖 GET /meta · 可与 meta 观测并行）
#
#   bash scripts/ops/p2fc-run-tn-p1-010-independent.sh
#   bash scripts/ops/p2fc-run-tn-p1-010-independent.sh --require-completed   # 默认
#
# 纪律：不 redeploy staging · 不调用 /meta · 仅 internal/indexer-tick|replay|reconcile
# 末行：TT_TN_P1_010_INDEPENDENT: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"
REQUIRE_COMPLETED=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --require-completed) REQUIRE_COMPLETED=1; shift ;;
    --allow-pre-soak) REQUIRE_COMPLETED=0; export TN_P1_010_ALLOW_PRE_SOAK=1; shift ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ "$REQUIRE_COMPLETED" -eq 1 && ! -f "$COMPLETED" ]]; then
  echo "TT_TN_P1_010_INDEPENDENT: FAIL missing $COMPLETED" >&2
  exit 2
fi

# 记录 meta 观测（非阻塞）
# shellcheck source=scripts/ops/lib/p2fc-meta-observability-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-meta-observability-lib.sh"
p2fc_record_meta_observability \
  "${STAGING_API_BASE:-https://tt-api-staging.fly.dev}" \
  "${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}" \
  "$SOAK_DIR/meta-observability" || true

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"
export TN_P1_010_EXPECT_FREEZE_GIT_SHA="$(phase2_resolve_baseline_ssot_sha "$ROOT")"
export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"

echo "TT_TN_P1_010_INDEPENDENT: START $(date -u +%Y%m%dT%H%M%SZ) meta_coupling=none"

if bash "$ROOT/scripts/dev/record-tn-p1-010-indexer-reconcile-staging-evidence.sh"; then
  echo "TT_TN_P1_010_INDEPENDENT: PASS"
  exit 0
fi

echo "TT_TN_P1_010_INDEPENDENT: FAIL" >&2
exit 2
