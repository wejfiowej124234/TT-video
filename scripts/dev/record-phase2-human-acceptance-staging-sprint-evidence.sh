#!/usr/bin/env bash
# PHASE2-HUMAN-ACCEPTANCE-STAGING-SPRINT — Identity Center P2 → staging + ② 四角色 + Phase ③ gate
#
#   export HTTPS_PROXY=http://127.0.0.1:15715   # 若 fly/curl 需代理
#   bash scripts/dev/record-phase2-human-acceptance-staging-sprint-evidence.sh
#
# 步骤：
#   A fly deploy tt-api-staging（P2 profile API）
#   B fly deploy tt-web-staging（settings 四页）
#   C identity-p2-staging-parity-probe + smoke-identity-p2-settings-staging
#   D PHASE2-HUMAN-ACCEPTANCE-SPRINT（①+② 四角色；② PASS → Phase ③ REQUESTED）
#
# 可选：
#   IDENTITY_P2_SKIP_DEPLOY=1          跳过 A+B（仅探针 + HAT）
#   P2HA_SKIP_LOCAL=1                  仅跑 ②（须已有 ① PASS manifest；默认跑 ①+②）
#   TESTNET_FREEZE_OVERRIDE=1          绕过 TESTNET_STAGING_FREEZE
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-freeze-sha-lib.sh
source "$ROOT/scripts/dev/lib/phase2-freeze-sha-lib.sh"

EVID="$ROOT/evidence/phase2-human-acceptance-staging-sprint"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/PHASE2-HUMAN-ACCEPTANCE-STAGING-SPRINT-${STAMP}.log"
SPRINT_DIR="$EVID/${STAMP}"
STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
FREEZE_DOC="$ROOT/frontend/evidence/GO_local_auth_l5/IDENTITY-CENTER-PHASE2-FREEZE.md"

fail() { echo "record-phase2-human-acceptance-staging-sprint: FAIL $*" >&2; exit 1; }

mkdir -p "$SPRINT_DIR"

if [[ -z "${HTTPS_PROXY:-}" && -z "${https_proxy:-}" ]]; then
  if curl -sS -o /dev/null --connect-timeout 5 --max-time 12 https://api.fly.io 2>/dev/null; then
    echo "identity-p2-staging-sprint: direct api.fly.io OK — not forcing shell proxy"
  elif curl -sS -o /dev/null --connect-timeout 2 --max-time 4 -x "http://127.0.0.1:15715" https://api.fly.io 2>/dev/null; then
    export HTTPS_PROXY="http://127.0.0.1:15715"
    export HTTP_PROXY="$HTTPS_PROXY"
    echo "identity-p2-staging-sprint: using HTTPS_PROXY=$HTTPS_PROXY"
  fi
fi

patch_freeze_doc() {
  local manifest="$1"
  local manifest_m overall phase3 p2ha_stamp
  manifest_m="$(cygpath -m "$manifest" 2>/dev/null || echo "$manifest")"
  overall="$(python -c "import json; print(json.load(open(r'''${manifest_m}''',encoding='utf-8'))['overall_verdict'])")"
  phase3="$(python -c "import json; print(json.load(open(r'''${manifest_m}''',encoding='utf-8'))['phase3_review_status'])")"
  p2ha_stamp="$(basename "$(dirname "$manifest")")"
  python - <<PY
from pathlib import Path
p = Path(r"""$FREEZE_DOC""")
text = p.read_text(encoding="utf-8")
block = f'''## ② 测试网验收（PHASE2-HUMAN-ACCEPTANCE-STAGING-SPRINT · {p2ha_stamp}）

| 项 | 结果 |
|----|------|
| **Identity P2 API parity** | **PASS** · \`evidence/phase2-human-acceptance-staging-sprint/${STAMP}/\` |
| **P2HA 四角色 · ② staging** | **{overall}**（manifest \`evidence/phase2-human-acceptance-sprint/{p2ha_stamp}/phase2-human-acceptance-manifest.v1.json\`） |
| **Phase ③ PRA** | **{phase3}** |

**诚实边界：** ② staging PASS **≠** ③ Production GO · **≠** 主网真链。

'''
marker = "**② 测试网：** staging API"
if marker in text:
    before, _, after = text.partition(marker)
    after_lines = after.split("\n", 1)
    rest = after_lines[1] if len(after_lines) > 1 else ""
    # drop old pending paragraph up to next ---
    if rest.startswith(" staging API"):
        idx = rest.find("\n---")
        if idx >= 0:
            rest = rest[idx + 1:]
    text = before + block + "---\n\n" + rest.lstrip("\n")
else:
    text = text.rstrip() + "\n\n" + block
p.write_text(text, encoding="utf-8")
print("patched", p)
PY
}

{
  echo "TT_PHASE2_HUMAN_ACCEPTANCE_STAGING_SPRINT: START ${STAMP}"
  echo "targets: api=${STAGING_API} web=${STAGING_WEB}"

  echo ""
  echo "== Step A: fly deploy tt-api-staging =="
  if [[ "${IDENTITY_P2_SKIP_DEPLOY:-}" == "1" ]]; then
    echo "SKIP IDENTITY_P2_SKIP_DEPLOY=1"
  else
    phase2_require_staging_deploy_allowed "$ROOT" || exit 3
    export TESTNET_FREEZE_OVERRIDE=1
    bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$SPRINT_DIR/fly-api-deploy.log"
  fi

  echo ""
  echo "== Step B: fly deploy tt-web-staging =="
  if [[ "${IDENTITY_P2_SKIP_DEPLOY:-}" == "1" ]]; then
    echo "SKIP IDENTITY_P2_SKIP_DEPLOY=1"
  else
    phase2_require_staging_deploy_allowed "$ROOT" || exit 3
    export TESTNET_FREEZE_OVERRIDE=1
    bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$SPRINT_DIR/fly-web-deploy.log"
  fi

  echo ""
  echo "== Step C: Identity P2 staging parity + smoke =="
  export STAGING_API_BASE="$STAGING_API"
  python "$ROOT/scripts/dev/identity-p2-staging-parity-probe.py" 2>&1 | tee "$SPRINT_DIR/identity-p2-parity.log"
  grep -q "TT_IDENTITY_P2_STAGING_PARITY: PASS" "$SPRINT_DIR/identity-p2-parity.log"
  bash "$ROOT/scripts/dev/smoke-identity-p2-settings-staging.sh" 2>&1 | tee "$SPRINT_DIR/identity-p2-smoke.log"

  echo ""
  echo "== Step D: PHASE2-HUMAN-ACCEPTANCE-SPRINT (四角色 ①+②) =="
  export P2HA_STAGING_API="$STAGING_API"
  export P2HA_STAGING_WEB="$STAGING_WEB"
  export P2HA_START_FE="${P2HA_START_FE:-1}"
  if [[ "${P2HA_SKIP_LOCAL:-}" == "1" ]]; then
    export P2HA_SKIP_LOCAL=1
  fi
  bash "$ROOT/scripts/dev/record-phase2-human-acceptance-sprint-evidence.sh" 2>&1 | tee "$SPRINT_DIR/human-acceptance.log"
  grep -q "TT_PHASE2_HUMAN_ACCEPTANCE_SPRINT: OK" "$SPRINT_DIR/human-acceptance.log"
  grep -q "TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED" "$SPRINT_DIR/human-acceptance.log"

  P2HA_MANIFEST="$(ls -td "$ROOT/evidence/phase2-human-acceptance-sprint"/*/phase2-human-acceptance-manifest.v1.json 2>/dev/null | head -1)"
  [[ -n "$P2HA_MANIFEST" ]] || fail "missing P2HA manifest"
  P2HA_MANIFEST="$(cygpath -m "$P2HA_MANIFEST" 2>/dev/null || echo "$P2HA_MANIFEST")"
  cp "$P2HA_MANIFEST" "$SPRINT_DIR/phase2-human-acceptance-manifest.v1.json"

  echo ""
  echo "== Step E: patch Identity Center freeze doc =="
  patch_freeze_doc "$P2HA_MANIFEST"

  echo ""
  echo "TT_PHASE2_HUMAN_ACCEPTANCE_STAGING_SPRINT: OK ${STAMP}"
  echo "TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED ${STAMP}"
  echo "evidence: ${SPRINT_DIR}"
  echo "freeze: ${FREEZE_DOC}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_PHASE2_HUMAN_ACCEPTANCE_STAGING_SPRINT: OK" "$RUN_LOG" || exit 1
ln -sfn "$STAMP" "$EVID/latest" 2>/dev/null || true
echo "Log: $RUN_LOG"
exit 0
