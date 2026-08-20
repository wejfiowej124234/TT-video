#!/usr/bin/env bash
# Restore Official www to the frozen Fly image. NO rebuild. NO git checkout.
#
#   bash scripts/dev/restore-tt-web-production-product-pin.sh --check-only
#   TT_OFFICIAL_WWW_RESTORE_PIN=1 bash scripts/dev/restore-tt-web-production-product-pin.sh
#
# SSOT: docs/runbook/TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json
# Pin identity: OPS-2026.08.20-v9 · git_sha=3e356617… · image hybrid-live-auth-pin-nontarget-v9-20260820
# (bootstrap v8 baked in v9; MUST NOT restore misnamed …-v8 = bootstrap v7)
# SUPERSEDED living: M07 …-v9-m07-unlock / 2551fafd… · prior OPS-20260820 · 08-16 daa5ae87 / deployment-01M05J…
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PIN_JSON="${TT_OFFICIAL_WWW_PIN_JSON:-$ROOT/docs/runbook/TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json}"
APP="${FLY_PROD_WEB_APP:-tt-web-prod}"
WEB_BASE="${PROD_WEB_BASE:-https://www.web3-ttg.com}"

fail() { echo "restore-tt-web-production-product-pin: FAIL $*" >&2; exit 2; }
ok() { echo "restore-tt-web-production-product-pin: OK $*"; }
info() { echo "restore-tt-web-production-product-pin: $*"; }

CHECK_ONLY=0
[[ "${1:-}" == "--check-only" ]] && CHECK_ONLY=1

[[ -f "$PIN_JSON" ]] || fail "missing $PIN_JSON"

PYTHON=python
command -v python >/dev/null 2>&1 || PYTHON=python3

IMAGE="$("$PYTHON" - "$PIN_JSON" <<'PY'
import json, sys
p = json.load(open(sys.argv[1], encoding="utf-8"))
live = p.get("live") or {}
restore = (p.get("restore") or {}).get("handle") or live.get("fly_image") or ""
print(restore.strip())
PY
)"
[[ -n "$IMAGE" ]] || fail "restore_handle empty"

EXPECT_SHA="$("$PYTHON" - "$PIN_JSON" <<'PY'
import json, sys
p = json.load(open(sys.argv[1], encoding="utf-8"))
print((p.get("live") or {}).get("git_sha") or "")
PY
)"
EXPECT_BT="$("$PYTHON" - "$PIN_JSON" <<'PY'
import json, sys
p = json.load(open(sys.argv[1], encoding="utf-8"))
print((p.get("live") or {}).get("build_time") or "")
PY
)"

info "restore_handle=$IMAGE"
info "expect git_sha=$EXPECT_SHA build_time=$EXPECT_BT"
info "command: fly deploy --app $APP --image $IMAGE"
info "MUST NOT: git checkout daa5ae87 · MUST NOT: deploy-tt-web-production.sh"

if [[ "$CHECK_ONLY" == "1" ]]; then
  export TT_OFFICIAL_SURFACE_CHECK_ONLY=1
  bash "$ROOT/scripts/gates/check-official-www-product-surface-frozen.sh" --class restore_image \
    || fail "restore pin gate"
  ok "check-only · no fly · no rebuild"
  exit 0
fi

[[ "${TT_OFFICIAL_WWW_RESTORE_PIN:-}" == "1" ]] \
  || fail "set TT_OFFICIAL_WWW_RESTORE_PIN=1 to fly deploy --image (no rebuild)"

command -v fly >/dev/null 2>&1 || fail "fly CLI not found"
fly auth whoami >/dev/null 2>&1 || fail "fly not authenticated"

info "fly deploy --image (no Docker rebuild) …"
fly deploy --app "$APP" --image "$IMAGE" || fail "fly deploy --image failed"

ri_json="$(curl -sS --max-time 30 "${WEB_BASE%/}/api/release-identity?t=$(date +%s)" 2>/dev/null || echo '{}')"
ri_sha="$("$PYTHON" -c "import json,sys; print(json.loads(sys.argv[1]).get('git_sha') or '')" "$ri_json")"
ri_bt="$("$PYTHON" -c "import json,sys; print(json.loads(sys.argv[1]).get('build_time') or '')" "$ri_json")"
[[ "$ri_sha" == "$EXPECT_SHA" ]] || fail "live git_sha=$ri_sha ≠ pin $EXPECT_SHA"
[[ "$ri_bt" == "$EXPECT_BT" ]] || fail "live build_time=$ri_bt ≠ pin $EXPECT_BT"
ok "www restored · git_sha=$ri_sha · build_time=$ri_bt · image=$IMAGE"
