#!/usr/bin/env bash
# Display Data Governance (展示数据 governance) — Local · Staging
# SSOT: registry/display-data-governance.v1.yaml
# Runbook: docs/runbook/TT-DISPLAY-DATA-GOVERNANCE.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-tourist@test.com}"
ADMIN_PASS="${ADMIN_PASS:-Test123!}"
C3_EMAIL="${C3_EMAIL:-guide@test.com}"
C3_PASS="${C3_PASS:-Test123!}"
DRY_RUN="${DRY_RUN:-0}"
ENV_LABEL="${ENV_LABEL:-auto}"

if [[ "$ENV_LABEL" == "auto" ]]; then
  if [[ "$API" == *staging* ]]; then ENV_LABEL="staging"; else ENV_LABEL="local"; fi
fi

fail() { echo "display-data-governance: FAIL [$ENV_LABEL] $*" >&2; exit 1; }
log() { echo "display-data-governance: [$ENV_LABEL] $*"; }

curl -sS -X POST "$API/auth/seed-test-accounts" -H 'Content-Type: application/json' -d '{}' >/dev/null 2>&1 || true
curl -sS -X POST "$API/auth/seed-test-accounts" -H 'Content-Type: application/json' \
  -d "{\"promote_admin_email\":\"$ADMIN_EMAIL\"}" >/dev/null 2>&1 || true

TOK="$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  | node -e "let s='';try{const j=JSON.parse(require('fs').readFileSync(0,'utf8'));s=String(j.token||'').trim()}catch(e){}process.stdout.write(s)")"
[[ -n "$TOK" ]] || fail "admin login $ADMIN_EMAIL"

GTOK="$(curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$C3_EMAIL\",\"password\":\"$C3_PASS\"}" \
  | node -e "let s='';try{const j=JSON.parse(require('fs').readFileSync(0,'utf8'));s=String(j.token||'').trim()}catch(e){}process.stdout.write(s)")"
C3_ID="$(curl -sS -H "Authorization: Bearer $GTOK" "$API/api/v1/me" \
  | node -e "let s='';try{const j=JSON.parse(require('fs').readFileSync(0,'utf8'));s=String(j.guide?.id||'').trim()}catch(e){}process.stdout.write(s)")"
[[ -n "$C3_ID" ]] || fail "resolve C3 guide id via GET /api/v1/me ($C3_EMAIL)"

env API="$API" TOK="$TOK" C3_ID="$C3_ID" DRY_RUN="$DRY_RUN" ENV_LABEL="$ENV_LABEL" \
  POST_OCS_BASELINE="${POST_OCS_BASELINE:-1}" EVIDENCE_JSON="${EVIDENCE_JSON:-}" \
  node "$ROOT/scripts/dev/display-data-governance-run.cjs"
log "exit 0"
