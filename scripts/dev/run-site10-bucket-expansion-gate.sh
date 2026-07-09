#!/usr/bin/env bash
# ① Site10 · bucket expansion phase：community → market → admin → acquisition 各 10/10 后解锁 rerun21
#
# 用法（仓库根）：
#   bash scripts/dev/run-site10-bucket-expansion-gate.sh check     # 仅读四桶 latest.log
#   bash scripts/dev/run-site10-bucket-expansion-gate.sh run     # 顺序跑四桶（community 先验绿）
#   bash scripts/dev/run-site10-bucket-expansion-gate.sh run-one market|admin|acquisition|community
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
STATUS="$EVID/site10-bucket-convergence-r21.status.txt"

# shellcheck source=scripts/dev/_site10-bucket-narrow-recheck-common.sh
source "$ROOT/scripts/dev/_site10-bucket-narrow-recheck-common.sh"

declare -A BUCKET_LOG=(
  [community]="$EVID/site10-community-bucket-narrow-recheck.latest.log"
  [market]="$EVID/site10-market-bucket-narrow-recheck.latest.log"
  [admin]="$EVID/site10-admin-bucket-narrow-recheck.latest.log"
  [acquisition]="$EVID/site10-acquisition-bucket-narrow-recheck.latest.log"
)
declare -A BUCKET_TOKEN=(
  [community]="TT_SITE10_COMMUNITY_BUCKET_NARROW_RECHECK: OK"
  [market]="TT_SITE10_MARKET_BUCKET_NARROW_RECHECK: OK"
  [admin]="TT_SITE10_ADMIN_BUCKET_NARROW_RECHECK: OK"
  [acquisition]="TT_SITE10_ACQUISITION_BUCKET_NARROW_RECHECK: OK"
)
declare -A BUCKET_SCRIPT=(
  [community]="$ROOT/scripts/dev/run-site10-community-bucket-narrow-recheck.sh"
  [market]="$ROOT/scripts/dev/run-site10-market-bucket-narrow-recheck.sh"
  [admin]="$ROOT/scripts/dev/run-site10-admin-bucket-narrow-recheck.sh"
  [acquisition]="$ROOT/scripts/dev/run-site10-acquisition-bucket-narrow-recheck.sh"
)

check_all_buckets() {
  local name ok=1 line=""
  for name in community market admin acquisition; do
    if site10_bucket_narrow_recheck_log_ok "${BUCKET_LOG[$name]}" "${BUCKET_TOKEN[$name]}"; then
      echo "BUCKET_OK: $name (10/10)"
    else
      echo "BUCKET_FAIL: $name (need 10/10 narrow recheck)" >&2
      ok=0
    fi
  done
  if [[ "$ok" -eq 1 ]]; then
    echo "TT_SITE10_ALL_BUCKETS_NARROW_RECHECK: OK"
    return 0
  fi
  echo "TT_SITE10_ALL_BUCKETS_NARROW_RECHECK: FAIL" >&2
  return 1
}

write_status_header() {
  local stamp="$1"
  cat >"$STATUS" <<EOF
# Site10 bucket expansion phase · rerun21 gate（① · baseline rerun20 REAL FAIL=49）
# updated: ${stamp}
# 解锁 rerun21 条件：community + market + admin + acquisition 各 narrow recheck 10/10

baseline_rerun20_real_fail=49
expansion_phase=ACTIVE
rerun21_unlock=ALL_BUCKETS_10_10

| bucket | script | log |
|--------|--------|-----|
| community | run-site10-community-bucket-narrow-recheck.sh | site10-community-bucket-narrow-recheck.latest.log |
| market | run-site10-market-bucket-narrow-recheck.sh | site10-market-bucket-narrow-recheck.latest.log |
| admin | run-site10-admin-bucket-narrow-recheck.sh | site10-admin-bucket-narrow-recheck.latest.log |
| acquisition | run-site10-acquisition-bucket-narrow-recheck.sh | site10-acquisition-bucket-narrow-recheck.latest.log |

## Gate

\`\`\`bash
source scripts/dev/export-database-url-from-root-env.sh
bash scripts/dev/run-site10-bucket-expansion-gate.sh check
bash scripts/dev/run-site10-bucket-expansion-gate.sh run
\`\`\`

## rerun21（仅 TT_SITE10_ALL_BUCKETS_NARROW_RECHECK: OK 后）

\`\`\`bash
bash scripts/dev/run-site10-rerun21-full-matrix.sh
\`\`\`

EOF
}

append_status_snapshot() {
  local stamp="$1"
  {
    echo ""
    echo "## snapshot ${stamp}"
    for name in community market admin acquisition; do
      if [[ -f "${BUCKET_LOG[$name]}" ]]; then
        grep -E "^# summary pass=" "${BUCKET_LOG[$name]}" 2>/dev/null | tail -1 || echo "# summary ${name}: (no summary line)"
      else
        echo "# summary ${name}: log missing"
      fi
    done
  } >>"$STATUS"
}

run_one() {
  local bucket="$1"
  if [[ -z "${BUCKET_SCRIPT[$bucket]+x}" ]]; then
    echo "unknown bucket: $bucket" >&2
    exit 2
  fi
  bash "${BUCKET_SCRIPT[$bucket]}"
}

run_all() {
  local stamp name
  stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  write_status_header "$stamp"
  for name in community market admin acquisition; do
    echo "=== expansion run bucket: $name ==="
    run_one "$name" || return 1
  done
  check_all_buckets
  append_status_snapshot "$stamp"
}

cmd="${1:-check}"
case "$cmd" in
  check)
    check_all_buckets
    ;;
  run)
    run_all
    ;;
  run-one)
    run_one "${2:?usage: $0 run-one community|market|admin|acquisition}"
    ;;
  *)
    echo "usage: $0 {check|run|run-one BUCKET}" >&2
    exit 2
    ;;
esac
