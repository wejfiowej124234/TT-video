#!/usr/bin/env bash
# CFG maintenance regression guard — TT_CONFIGURATION_ZERO_DRIFT is FROZEN.
# Configuration Sprint is permanently closed unless new configuration is introduced.
# If verify fails: file DEFECT-NNN + REG-NNN (Regression) — do NOT reopen CFG sprint or add CFG-029+.
# Usage:
#   bash scripts/dev/verify-cfg-drift-closure.sh           # strict (WARN=FAIL)
#   bash scripts/dev/verify-cfg-drift-closure.sh --batch B1
#   CFG_VERIFY_LENIENT=1 bash scripts/dev/verify-cfg-drift-closure.sh  # allow WARN
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
BATCH=""
STRICT="${CFG_VERIFY_STRICT:-1}"
if [[ "${1:-}" == "--batch" ]]; then BATCH="${2:-}"; fi
if [[ "${CFG_VERIFY_LENIENT:-0}" == "1" ]]; then STRICT=0; fi

fail=0
warns=0
ok() { echo "OK   $*"; }
warn() {
  echo "WARN $*"
  warns=$((warns + 1))
  if [[ "$STRICT" == "1" ]]; then fail=1; fi
}
die() { echo "FAIL $*"; fail=1; }

echo "=== verify-cfg-drift-closure (strict=${STRICT}) ==="
echo "root=$ROOT batch=${BATCH:-ALL}"

if [[ -z "$BATCH" ]]; then
  bash scripts/dev/scan-repository-cfg-drift.sh && ok "Repository Drift = 0" || die "Repository Drift > 0"
fi

if curl -sf "http://127.0.0.1:8080/health" >/dev/null 2>&1; then
  ok "GET /health"
  curl -sf "http://127.0.0.1:8080/meta" >/dev/null && ok "GET /meta" || die "GET /meta"
else
  die "API :8080 not up (Runtime Drift)"
fi

if [[ -f .env ]]; then
  API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}" bash scripts/dev/verify-root-env-vs-meta-chain-contracts.sh && ok "verify-root-env-vs-meta-chain-contracts" || die "verify-root-env-vs-meta-chain-contracts"
else
  die "no root .env"
fi

if command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -File scripts/dev/sync-frontend-env-local-from-root.ps1 >/dev/null && ok "sync-frontend-env-local" || die "sync-frontend-env-local"
else
  bash scripts/dev/sync-frontend-env-local-from-root.sh >/dev/null && ok "sync-frontend-env-local" || die "sync-frontend-env-local"
fi

if [[ -f frontend/.env.local ]] && rg -q '^NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080' frontend/.env.local 2>/dev/null; then
  ok "NEXT_PUBLIC_API_BASE_URL=8080"
else
  die "frontend/.env.local API base not 8080"
fi

run_b1() {
  rg -q '^TRAVELTRUST_DEPLOYMENT_PROFILE=local' .env 2>/dev/null && ok "DEPLOYMENT_PROFILE=local" || die "DEPLOYMENT_PROFILE not local"
  rg -q 'TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1' .env 2>/dev/null && ok "SEED_GUIDE_PUBLIC_MARKET=1" || die "SEED_GUIDE_PUBLIC_MARKET missing"
  rg -q '127.0.0.1:5432' .env 2>/dev/null && ok "DATABASE_URL 127.0.0.1" || die "DATABASE_URL not 127.0.0.1"
  if rg -q 'localhost:3012' .env 2>/dev/null && rg -q '127.0.0.1:3012' .env 2>/dev/null; then ok "CORS includes :3012"; else die "CORS missing :3012"; fi
  if rg -q 'ALLOW_CHAIN_OFF_MOCK_PAY_UI' frontend/.env.local 2>/dev/null; then die "frontend ALLOW_CHAIN_OFF_MOCK_PAY_UI"; else ok "no mock-pay UI flag"; fi
  mc=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:19000/minio/health/live 2>/dev/null || echo 000)
  [[ "$mc" == "200" ]] && ok "MinIO :19000" || die "MinIO :19000 not up ($mc)"
  if cast chain-id --rpc-url http://127.0.0.1:8545 >/dev/null 2>&1; then ok "Anvil :8545"; else die "Anvil :8545 not up"; fi
  if curl -sf "http://127.0.0.1:8080/meta/build" 2>/dev/null | python -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('git_sha') not in (None,'unknown','') else 1)" 2>/dev/null; then
    ok "meta/build git_sha set"
  else
    die "meta/build git_sha unknown"
  fi
  if curl -sf "http://127.0.0.1:8080/meta/build" 2>/dev/null | python -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('deployment_profile')=='local' else 1)" 2>/dev/null; then
    ok "meta/build deployment_profile=local"
  else
    die "meta/build deployment_profile not local (restart API after PER)"
  fi
  if rg -q 'SYNCED_FROM_ROOT_ENV_SHA=' frontend/.env.local 2>/dev/null; then ok "frontend sync stamp"; else die "frontend/.env.local missing SYNCED_FROM_ROOT_ENV_SHA"; fi
  if rg -q '^B407_' .env 2>/dev/null; then die "active B407_* in root .env"; else ok "no active B407_* in .env"; fi
  if rg -q '^LEGACY_' .env 2>/dev/null; then die "active LEGACY_* in root .env"; else ok "no active LEGACY_* in .env"; fi
  (cd frontend && npx vitest run lib/api.browser-url.test.ts >/dev/null 2>&1) && ok "vitest api.browser-url" || die "vitest api.browser-url"
}

run_b2() {
  rg -q '3012' docs/spec/38-端口与接口完整清单.md && ! rg -q '\| \*\*Frontend \(Next.js\)\*\* \| 3000 \|' docs/spec/38-端口与接口完整清单.md && ok "spec/38 frontend 3012" || die "spec/38 drift"
  rg -q 'FRONTEND_PORT:-3012' scripts/dev/smoke-acquisition-pd009-local.sh && ok "smoke-acquisition 3012" || die "smoke-acquisition drift"
  rg -q 'password123' frontend/e2e 2>/dev/null && die "e2e password123" || ok "e2e passwords"
  rg -q 'CFG-REGISTRY' docs/dev-local-smoke-baseline.md docs/测试账号与本地联调.md && ok "docs CFG cross-links" || die "docs missing CFG links"
}

run_b3() {
  rg -q 'API_REWRITE_TARGET=https://tt-api-staging.fly.dev' deploy/fly/tt-web-staging/build.env.example && ok "staging API_REWRITE_TARGET" || die "staging API_REWRITE_TARGET"
  rg -q '0x847b00ddb6ffed71812abc358a407dad4b099fcb' deploy/fly/tt-web-staging/build.env.example && ok "staging GOVERNOR" || die "staging GOVERNOR"
  rg -q 'NEXT_PUBLIC_REGISTRY_ADDRESS=0xc50913e154f850583D0afbE9158a75E0e2167AAb' deploy/fly/tt-web-staging/build.env.example && ok "staging REGISTRY in build.env.example" || die "staging REGISTRY example"
  rg -q 'REGISTRY_ADDRESS' scripts/dev/phase2-staging-fly-deploy-and-sync.sh && ok "phase2 fly sync includes REGISTRY_ADDRESS" || die "phase2 fly sync missing REGISTRY_ADDRESS"
  rg -q 'CFG-001' scripts/dev/staging-onboarding.env.example && ok "staging secret isolation doc" || die "staging isolation doc"
  ! rg -q 'ONBOARDING_LOCAL_DEV_TOOLS' deploy/fly/tt-web-staging/build.env.example 2>/dev/null && ok "staging build.env no local-dev-tools" || die "staging build.env must not set ONBOARDING_LOCAL_DEV_TOOLS"
  rg -q 'NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=0x' deploy/fly/tt-web-staging/build.env.example && ok "staging GOVERNANCE_TOKEN in build.env.example" || die "staging GOVERNANCE_TOKEN example"
  if [[ "${TRAVELTRUST_STAGING_META_VERIFY:-0}" == "1" ]]; then
    bash scripts/dev/verify-staging-ssot-parity.sh && ok "staging SSOT parity (live)" || die "staging SSOT parity (live)"
  fi
}

run_b4() {
  rg -q 'SEED_TEST_ACCOUNTS=0' scripts/dev/.env.production.example && ok "production SEED=0" || die "production SEED"
  rg -q 'CFG-027' scripts/dev/.env.production.example && ok "production preprod pointer" || die "production preprod"
  rg -q 'CFG-028' scripts/dev/.env.production.example && ok "production build.env pointer" || die "production build pointer"
  test -f deploy/fly/tt-web-prod/build.env.example && ok "prod build.env.example" || die "prod build.env.example"
  test -f evidence/manual-uat/signoff/CFG-027-PREPROD-TEMPLATE-REHEARSAL.md && ok "CFG-027 evidence" || die "CFG-027 evidence"
  test -f evidence/manual-uat/signoff/CFG-028-PROD-BUILD-ENV-ALIGNMENT.md && ok "CFG-028 evidence" || die "CFG-028 evidence"
  test -f evidence/manual-uat/signoff/CFG-002-SECRETS-REPOSITORY-SCAN.md && ok "CFG-002 evidence" || die "CFG-002 evidence"
  test -f evidence/manual-uat/signoff/CFG-001-SECRET-ISOLATION.md && ok "CFG-001 evidence" || die "CFG-001 evidence"
}

case "$BATCH" in
  B1) run_b1 ;;
  B2) run_b2 ;;
  B3) run_b3 ;;
  B4) run_b4 ;;
  "") run_b1; run_b2; run_b3; run_b4 ;;
  *) echo "Unknown batch: $BATCH"; exit 2 ;;
esac

if [[ "$BATCH" == "" || "$BATCH" == "B1" ]]; then
  API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}" bash scripts/smoke-ab-core-chain.sh >/dev/null 2>&1 && ok "smoke-ab-core-chain" || die "smoke-ab-core-chain"
fi

if [[ -z "$BATCH" ]]; then
  cfg_meta="$(python -c "
import json,sys
d=json.load(open('evidence/manual-uat/summary/config-drift-registry.json',encoding='utf-8'))
items=d.get('items',[])
open_n=sum(1 for x in items if x.get('status') not in ('CLOSED','VERIFIED'))
print(len(items), open_n, d.get('chapter_status',''), d.get('max_cfg_id',''))
")"
  read -r cfg_count cfg_open cfg_chapter cfg_max <<< "$cfg_meta"
  if [[ "$cfg_count" -gt 28 && "${TRAVELTRUST_CFG_REGISTRY_UNLOCK:-0}" != "1" ]]; then
    die "CFG registry has $cfg_count items (>28); set TRAVELTRUST_CFG_REGISTRY_UNLOCK=1 only when new configuration is introduced"
  fi
  if [[ "$cfg_open" == "0" ]]; then ok "CFG registry 100% CLOSED/VERIFIED"; else die "CFG registry OPEN=$cfg_open"; fi
  if [[ "$cfg_chapter" == "FROZEN" ]]; then
    ok "TT_CONFIGURATION_ZERO_DRIFT FROZEN"
  else
    warn "chapter_status not FROZEN (expected after 2026-06-30 graduation)"
  fi
  if [[ -f evidence/manual-uat/signoff/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md ]] && rg -q 'TT_CONFIGURATION_ZERO_DRIFT: FROZEN' evidence/manual-uat/signoff/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md 2>/dev/null; then
    ok "freeze signoff present"
  else
    die "missing TT-CONFIGURATION-ZERO-DRIFT-FROZEN signoff"
  fi
fi

python scripts/dev/generate-manual-uat-dashboard.py >/dev/null 2>&1 && ok "generate-manual-uat-dashboard" || die "dashboard generate"

if [[ -z "$BATCH" && "$fail" -eq 0 ]]; then
  echo "TT_CFG_ZERO_DRIFT_GATE: PASS"
  echo "TT_CONFIGURATION_ZERO_DRIFT: FROZEN"
  echo "TT_CONFIGURATION_ZERO_DRIFT_STATUS: FROZEN"
  echo "TT_CONFIGURATION_ZERO_DRIFT_FROZEN_DATE: 2026-06-30"
  echo "TT_PROJECT_MAINLINE: PRODUCT_VERIFICATION"
fi

echo "=== verify-cfg-drift-closure: exit $fail (warns=$warns) ==="
exit "$fail"
