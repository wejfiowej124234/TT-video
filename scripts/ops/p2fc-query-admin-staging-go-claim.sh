#!/usr/bin/env bash
# TT_ADMIN_STAGING_GO_CLAIM · Admin GO 唯一真源查询入口
#
# 仅当闸口 artifact 为 allowed=true 时输出 ALLOWED；否则 DENIED。
# Prep / Static / Tunnel / Local / Smoke / Watcher / Health / Prep-Only / Soak Inflight
# 一律不得替代本闸宣称 Admin GO · Phase② Closure · Production GO。
#
#   bash scripts/ops/p2fc-query-admin-staging-go-claim.sh
#   bash scripts/ops/p2fc-query-admin-staging-go-claim.sh --refresh   # 重跑 gate 再查
#
# 末行：TT_ADMIN_STAGING_GO_CLAIM: ALLOWED|DENIED
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
GATE_JSON="$SOAK_DIR/post-soak-staging-live-closure/admin-go-claim-gate.latest.json"
SSOT_YAML="$ROOT/registry/admin-staging-go-claim-ssot.v1.yaml"
REFRESH=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --refresh) REFRESH=1; shift ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -f "$SSOT_YAML" ]] || { echo "TT_ADMIN_STAGING_GO_CLAIM: DENIED reason=ssot_yaml_missing" >&2; exit 2; }

if [[ "$REFRESH" -eq 1 ]]; then
  bash "$ROOT/scripts/ops/p2fc-gate-admin-staging-go-claim.sh" || true
fi

if [[ ! -f "$GATE_JSON" ]]; then
  echo "TT_ADMIN_STAGING_GO_CLAIM: DENIED reason=gate_artifact_missing"
  exit 2
fi

allowed="$(node -e "
try {
  const j=require(process.argv[1]);
  process.stdout.write(j.allowed===true?'true':'false');
} catch { process.stdout.write('false'); }
" "$GATE_JSON")"

if [[ "$allowed" == "true" ]]; then
  echo "TT_ADMIN_STAGING_GO_CLAIM: ALLOWED ssot=$GATE_JSON"
  exit 0
fi

reason="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).reason||'not_allowed')}catch{console.log('parse_error')}" "$GATE_JSON")"
echo "TT_ADMIN_STAGING_GO_CLAIM: DENIED reason=${reason}"
exit 2
