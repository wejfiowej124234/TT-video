#!/usr/bin/env bash
# Phase ② · Final Human Acceptance（五角色 + 全业务链 · staging @ runtime SHA）
#
#   export P2FC_RUNTIME_SHA_FROZEN=fc9266ce94f18810420e720bb933946c086ce909
#   bash scripts/dev/run-phase2-final-human-acceptance.sh
#
# 纪律：无 redeploy · 无 soak 重跑 · RCA→Fix→Runtime Verify 后复跑本脚本
# 末行：TT_PHASE2_FINAL_HUMAN_ACCEPTANCE: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_final_human_acceptance/${STAMP}"
LOG="$EVID/final-human-acceptance.log"
RUNTIME_SHA="${P2FC_RUNTIME_SHA_FROZEN:-fc9266ce94f18810420e720bb933946c086ce909}"
API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
API="${API%/}"
WEB="${WEB%/}"

export HTTPS_PROXY="${HTTPS_PROXY:-}"
export NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev,api.fly.io,fly.io,.fly.io,6pn.dev}"

mkdir -p "$EVID"

json_verdict() {
  PYTHONIOENCODING=utf-8 python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['verdict'])" "$1"
}

fail() {
  echo "TT_PHASE2_FINAL_HUMAN_ACCEPTANCE: FAIL $*" | tee -a "$LOG" >&2
  exit 2
}

{
  echo "TT_PHASE2_FINAL_HUMAN_ACCEPTANCE: START ${STAMP}"
  echo "runtime_sha_frozen=${RUNTIME_SHA}"
  echo "api=${API} web=${WEB}"

  echo ""
  echo "== 0 · Runtime SHA + closure prerequisites =="
  live_sha="$(curl --noproxy "*" -sS --max-time 45 "${API}/meta" \
    | python -c "import json,sys; print((json.load(sys.stdin).get('build') or {}).get('git_sha',''))" 2>/dev/null || true)"
  [[ -n "$live_sha" ]] || fail "staging /meta unreachable"
  [[ "${live_sha,,}" == "${RUNTIME_SHA,,}" ]] || fail "sha_mismatch live=${live_sha} frozen=${RUNTIME_SHA}"

  if ! grep -q 'TT_P2FC_POST_SOAK_ONE_SHOT: PASS' "$ROOT/evidence/P2FC_SOAK_72H_STAGING/post-soak-one-shot/one-shot.log" 2>/dev/null; then
    fail "MR12 one-shot not PASS"
  fi
  python -c "
import json
m=json.load(open('evidence/GO_phase2_testnet_graduation/PHASE2-CLOSURE-GRADUATION-FREEZE.latest.json',encoding='utf-8'))
v=m.get('verdicts',{})
assert v.get('tt_testnet_graduation')=='CLOSED', 'graduation not CLOSED'
print('graduation CLOSED l5=', v.get('tt_phase2_l5_composite_score'))
" || fail "graduation freeze manifest"

  echo ""
  echo "== 1 · FRCA 五角色全链路 API =="
  export FRCA_OUT="$EVID/frca"
  export FRCA_API_BASE="$API"
  export FRCA_WEB_BASE="$WEB"
  mkdir -p "$FRCA_OUT"
  python "$ROOT/scripts/dev/five-role-full-chain-audit.py" 2>&1 | tee "$EVID/frca-probe.log"
  python "$ROOT/scripts/dev/generate-five-role-audit-matrix-report.py" \
    --findings "$FRCA_OUT/frca-findings.json" \
    --out "$ROOT/docs/runbook/FIVE-ROLE-FULL-CHAIN-AUDIT-REPORT.md"
  FRCA_V="$(json_verdict "$FRCA_OUT/frca-findings.json")"
  [[ "$FRCA_V" != "NO-GO" ]] || fail "FRCA verdict NO-GO"

  echo ""
  echo "== 2 · Phase28 HAT 五角色（API + browser） =="
  export HAT_OUT="$EVID/phase28-hat"
  export HAT_API_BASE="$API"
  export HAT_WEB_BASE="$WEB"
  unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy
  export NO_PROXY="tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev,localhost,127.0.0.1"
  bash "$ROOT/scripts/dev/run-phase28-human-acceptance-test.sh" 2>&1 | tee "$EVID/phase28-hat.log"
  HAT_V="$(json_verdict "$HAT_OUT/hat-findings.json")"
  [[ "$HAT_V" == "PASS" || "$HAT_V" == "CONDITIONAL" ]] || fail "HAT verdict $HAT_V"

  echo ""
  echo "== 3 · P2HA 四角色 staging =="
  export P2HA_PHASE=staging
  export P2HA_API_BASE="$API"
  export P2HA_WEB_BASE="$WEB"
  export P2HA_OUT="$EVID/p2ha-staging"
  mkdir -p "$P2HA_OUT"
  export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:15715}"
  python "$ROOT/scripts/dev/phase2-human-acceptance-probe.py" 2>&1 | tee "$EVID/p2ha-staging.log"
  P2HA_V="$(json_verdict "$P2HA_OUT/p2ha-findings.json")"
  [[ "$P2HA_V" == "PASS" ]] || fail "P2HA staging $P2HA_V"

  echo ""
  echo "== 4 · Final sign-off bundle =="
  python "$ROOT/scripts/dev/gen-p2fc-phase2-final-human-acceptance-signoff.py" \
    --evid-dir "$EVID" \
    --stamp "$STAMP" \
    --runtime-sha "$RUNTIME_SHA" \
    --frca-verdict "$FRCA_V" \
    --hat-verdict "$HAT_V" \
    --p2ha-verdict "$P2HA_V"

  ln -sfn "$STAMP" "$ROOT/evidence/GO_phase2_final_human_acceptance/latest" 2>/dev/null || true

  echo ""
  echo "TT_PHASE2_FINAL_HUMAN_ACCEPTANCE: PASS ${STAMP}"
  echo "TT_PHASE3_ENTRY_REVIEW: READY ${STAMP}"
  echo "evidence: ${EVID}"
  echo "owner_signoff: ${EVID}/OWNER-PHASE2-FINAL-HUMAN-ACCEPTANCE.md"
} 2>&1 | tee "$LOG"

grep -q "TT_PHASE2_FINAL_HUMAN_ACCEPTANCE: PASS" "$LOG" || exit 1
exit 0
