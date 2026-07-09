#!/usr/bin/env bash
# Phase ③ · Production GO 准备审计编排（PI-3 + go-live 运维子集）
#
# 边界：③ 准备轨 · 可审计 staging 代理项 · 输出 GO/NO_GO 证据 JSON
# 禁止：用本脚本 exit 0 冒充 Production GO / M-00 签字
#
#   API_BASE=https://tt-api-staging.fly.dev \
#   WEB_BASE=https://tt-web-staging.fly.dev \
#     bash scripts/dev/run-phase3-production-go-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE3_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/go-audit-${STAMP}}"
API_BASE="${API_BASE:-${STAGING_API_BASE:-https://tt-api-staging.fly.dev}}"
WEB_BASE="${WEB_BASE:-${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}}"
API_BASE="${API_BASE%/}"
WEB_BASE="${WEB_BASE%/}"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/audit.log") 2>&1

fail_blockers=0
prod_only_blockers=0
warn_count=0
pass_count=0

record() {
  local id="$1" verdict="$2" detail="$3"
  echo "AUDIT ${id}: ${verdict} — ${detail}"
  case "$verdict" in
    PASS) pass_count=$((pass_count + 1)) ;;
    WARN) warn_count=$((warn_count + 1)) ;;
    BLOCKER|FAIL) fail_blockers=$((fail_blockers + 1)) ;;
  esac
}

# Production-exclusive documentary blockers — do not count toward convergence gate
record_prod_only() {
  local id="$1" detail="$2"
  echo "AUDIT ${id}: BLOCKER-PROD — ${detail}"
  prod_only_blockers=$((prod_only_blockers + 1))
}

echo "== phase3 production go audit · ${STAMP} =="
echo "SSOT: docs/runbook/PHASE3-PRODUCTION-PREPARATION.md"
echo "api=${API_BASE} web=${WEB_BASE}"

# --- 0 · 冻结闸 ---
if grep -q 'PHASE3_ENTRY_GATE: READY' \
  "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/PHASE3-OWNER-SIGNOFF-SEBASTIAN-WARD-20260607.md" 2>/dev/null; then
  record "P3-FREEZE" PASS "PHASE3_ENTRY_GATE READY · product freeze active"
else
  record "P3-FREEZE" BLOCKER "Owner sign-off / PHASE3_ENTRY_GATE missing"
fi

# --- 1 · Fly PG Backup (B-475) ---
BASELINE_JSON="$ROOT/evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json"
if python "$ROOT/scripts/gates/check-b475-pg-backup-pitr-baseline-record.py" 2>&1 | tee "$OUT/b475-check.log"; then
  b475_st="$(python -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8'))['status'])" "$BASELINE_JSON")"
  drill_utc="$(python -c "import json,sys;d=json.load(open(sys.argv[1],encoding='utf-8'));print(d.get('last_restore_drill_utc',''))" "$BASELINE_JSON")"
  if [[ "$b475_st" == "PASS" ]]; then
    record "P3-PG-BACKUP" PASS "B-475 status=PASS drill=${drill_utc}"
  elif [[ -n "$drill_utc" ]]; then
    record "P3-PG-BACKUP" WARN "B-475 status=${b475_st} · staging drill ${drill_utc} · prod WAL/backup rhythm OPEN"
  else
    record "P3-PG-BACKUP" BLOCKER "B-475 no restore drill recorded"
  fi
else
  record "P3-PG-BACKUP" BLOCKER "B-475 gate script failed"
fi

if command -v fly >/dev/null 2>&1 && fly auth whoami >/dev/null 2>&1; then
  # shellcheck source=scripts/dev/lib/fly-mpg-pg.sh
  source "$ROOT/scripts/dev/lib/fly-mpg-pg.sh" 2>/dev/null || true
  prod_pg="${FLY_PROD_PG_APP:-tt-traveltrust-prod}"
  prod_kind="$(fly_pg_backend_kind "$prod_pg" 2>/dev/null || echo missing)"
  if [[ "$prod_kind" == "mpg" ]]; then
    cid="$(fly_mpg_cluster_id_for_name "$prod_pg")"
    fly_mpg_backup_list "$cid" 2>&1 | tee "$OUT/fly-prod-mpg-backup-list.txt" || true
    if grep -qiE "completed|full|incr" "$OUT/fly-prod-mpg-backup-list.txt" 2>/dev/null; then
      record "P3-FLY-BACKUP-ENABLED" PASS "Fly MPG backups listed on ${prod_pg}"
    else
      record "P3-FLY-BACKUP-ENABLED" WARN "Fly MPG backup list empty on ${prod_pg}"
    fi
  else
    fly postgres backup list -a "${FLY_STAGING_PG_APP:-tt-traveltrust-staging}" 2>&1 | tee "$OUT/fly-backup-list.txt" || true
    if grep -qi "no backups\|not enabled\|unsupported" "$OUT/fly-backup-list.txt" 2>/dev/null; then
      record "P3-FLY-BACKUP-ENABLED" WARN "Fly managed backups not enabled on staging PG (prod must enable)"
    else
      record "P3-FLY-BACKUP-ENABLED" PASS "Fly backup list returned data"
    fi
  fi
else
  record "P3-FLY-BACKUP-ENABLED" WARN "fly CLI/auth unavailable — backup list skipped"
fi

# --- 2 · 域名与证书 ---
for host in "${API_BASE#https://}" "${WEB_BASE#https://}"; do
  host="${host%%/*}"
  hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "https://${host}/health" 2>/dev/null || echo 000)"
  if [[ "$hc" == "200" ]]; then
    record "P3-TLS-${host}" PASS "HTTPS /health 200"
    echo | openssl s_client -connect "${host}:443" -servername "$host" 2>/dev/null \
      | openssl x509 -noout -dates -subject 2>/dev/null | tee "$OUT/tls-${host}.txt" || true
  else
    record "P3-TLS-${host}" FAIL "HTTPS /health HTTP ${hc}"
  fi
done
if [[ "$WEB_BASE" == *".fly.dev"* ]]; then
  record_prod_only "P3-PROD-DOMAIN" "No dedicated production domain — *.fly.dev staging only"
else
  record "P3-PROD-DOMAIN" PASS "Custom production web host configured"
fi

# --- 3 · 监控告警验证 ---
if API_BASE="$API_BASE" bash "$ROOT/scripts/dev/smoke-community-c8-staging-monitoring.sh" 2>&1 | tee "$OUT/monitoring-smoke.log"; then
  record "P3-MONITORING-SMOKE" PASS "C8 monitoring smoke exit 0 (staging proxy)"
else
  record "P3-MONITORING-SMOKE" BLOCKER "monitoring smoke failed"
fi

if bash "$ROOT/scripts/gates/check-ops-monitoring-prometheus-examples.sh" 2>&1 | tee "$OUT/prometheus-rules.log"; then
  record "P3-PROM-RULES" PASS "Prometheus example rules check OK or promtool skip"
else
  record "P3-PROM-RULES" WARN "Prometheus rules check failed"
fi

# --- 4 · 生产环境配置审计（staging 代理 + 生产必达项清单）---
meta_json="$OUT/meta.json"
curl -sS --max-time 20 "${API_BASE}/meta" -o "$meta_json" || true
if [[ -s "$meta_json" ]]; then
  python - "$meta_json" <<'PY' | tee "$OUT/env-audit-meta.txt"
import json, sys
m = json.load(open(sys.argv[1], encoding="utf-8"))
chain_id = (m.get("chain") or {}).get("chain_id")
seed = m.get("seed_test_accounts")
strict = m.get("strict_mode") or {}
print(f"chain_id={chain_id}")
print(f"internal_api_secret_configured={strict.get('internal_api_secret_configured')}")
print(f"strict_ssot={strict.get('strict_ssot')}")
print(f"strict_session_gate={strict.get('strict_session_gate')}")
print(f"seed_test_accounts_present={seed is not None}")
PY
  chain_id="$(python -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('chain',{}).get('chain_id',''))" "$meta_json")"
  internal_cfg="$(python -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('strict_mode',{}).get('internal_api_secret_configured',False))" "$meta_json")"
  [[ "$chain_id" == "11155111" ]] && record "P3-CHAIN-STAGING" PASS "staging chain_id=11155111 (Sepolia)" || record "P3-CHAIN-STAGING" WARN "unexpected chain_id=${chain_id}"
  [[ "$internal_cfg" == "True" ]] && record "P3-INTERNAL-SECRET" PASS "INTERNAL_API_SECRET configured" || record "P3-INTERNAL-SECRET" BLOCKER "INTERNAL_API_SECRET not configured"
else
  record "P3-META" BLOCKER "GET /meta failed"
fi

internal_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 -X POST \
  "${API_BASE}/api/v1/internal/indexer-tick" -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo 000)"
if [[ "$internal_code" == "403" || "$internal_code" == "401" ]]; then
  record "P3-INTERNAL-EXPOSURE" PASS "internal indexer-tick without secret → ${internal_code} (not open)"
elif [[ "$internal_code" == "200" ]]; then
  record "P3-INTERNAL-EXPOSURE" BLOCKER "internal indexer-tick reachable without secret"
else
  record "P3-INTERNAL-EXPOSURE" WARN "internal probe HTTP ${internal_code}"
fi

is_prod_target=false
[[ "$API_BASE" == *"-prod"* || "$API_BASE" == *"tt-api-prod"* ]] && is_prod_target=true

# Production-only blockers (documentary when not yet on prod host)
if [[ "$is_prod_target" == true ]]; then
  seed_env=""
  if command -v fly >/dev/null 2>&1 && fly auth whoami >/dev/null 2>&1; then
    seed_env="$(fly ssh console -a tt-api-prod -C 'printenv SEED_TEST_ACCOUNTS' 2>/dev/null | tr -d '\r' | head -1 || true)"
  fi
  if [[ "$seed_env" == "0" ]]; then
    record "P3-PROD-SEED-OFF" PASS "Production SEED_TEST_ACCOUNTS=0 (fly env)"
  else
    record_prod_only "P3-PROD-SEED-OFF" "Production must set SEED_TEST_ACCOUNTS=0 (fly env=${seed_env:-unset})"
  fi
  p3_off="$(python -c "import json,sys; m=json.load(open(sys.argv[1],encoding='utf-8')); ch=m.get('chain') or {}; print(ch.get('p3_chain_off'))" "$meta_json" 2>/dev/null || echo unknown)"
  if [[ "$p3_off" == "False" || "$p3_off" == "None" || -z "$p3_off" ]]; then
    record "P3-PROD-P3-CHAIN-OFF" PASS "Production P3_CHAIN_OFF unset/false (meta)"
  else
    record_prod_only "P3-PROD-P3-CHAIN-OFF" "Production must unset P3_CHAIN_OFF / mock-pay"
  fi
else
  record_prod_only "P3-PROD-SEED-OFF" "Production must set SEED_TEST_ACCOUNTS=0 (staging may keep seed)"
  record_prod_only "P3-PROD-P3-CHAIN-OFF" "Production must unset P3_CHAIN_OFF / mock-pay"
fi

record_prod_only "P3-STRIPE-LIVE" "Stripe live / PSP production instance not configured (PI3-003 WAITING_OWNER_STRIPE until sk_live_*)"
record_prod_only "P3-MAINNET-G0-G6" "Mainnet G0–G6+SL not GO — PI3-005 scope decision pending"
record_prod_only "P3-PI3-005-006" "PI3-005 Mainnet scope + PI3-006 Go-Live cutover not executed"

latest_r003="$(ls -d "$ROOT/evidence/pi3_004_production_readiness_verification"/r003-production-* 2>/dev/null | sort | tail -1 || true)"
if [[ -n "$latest_r003" && -f "${latest_r003}/report.json" ]]; then
  prg="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('release_gate',''))" "${latest_r003}/report.json")"
  if [[ "$prg" == "GO" ]]; then
    record "P3-FULL-93-R002" PASS "R-003 production report.json release_gate=GO"
  elif [[ "$prg" == "PARTIAL_GO" && "$is_prod_target" == true ]]; then
    record "P3-FULL-93-R002" WARN "R-003 production PARTIAL_GO (interim infra · B-domain data OPEN)"
  else
    record_prod_only "P3-FULL-93-R002" "Full-site R-002 report.json GO not evidenced for production (last=${prg})"
  fi
else
  record_prod_only "P3-FULL-93-R002" "Full-site R-002 report.json GO not evidenced for production"
fi
record_prod_only "P3-PROD-CDN-HLS" "Production CDN/HLS (P3-COM-1) NOT STARTED"

# --- SSOT convergence (non-prod gate) ---
PREP_MD="$ROOT/docs/runbook/PHASE3-PRODUCTION-PREPARATION.md"
CANON_SIGNOFF="$ROOT/evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260701T002252Z.md"
if grep -q 'PHASE3_PRODUCTION_CONVERGENCE: CLOSED' "$PREP_MD" \
  && grep -q 'PHASE3_OPS_VALIDATION: CLOSED' "$PREP_MD" \
  && grep -q 'TT_TESTNET_SIGNOFF: CLOSED' "$PREP_MD"; then
  record "P3-SSOT-RUNBOOK" PASS "PHASE3-PRODUCTION-PREPARATION keys aligned"
else
  record "P3-SSOT-RUNBOOK" BLOCKER "Runbook machine keys stale vs SSOT"
fi
if [[ -f "$CANON_SIGNOFF" ]] && grep -q 'TT_TESTNET_SIGNOFF: CLOSED' "$CANON_SIGNOFF"; then
  record "P3-SSOT-SIGNOFF" PASS "Canonical testnet sign-off CLOSED"
else
  record "P3-SSOT-SIGNOFF" BLOCKER "Canonical testnet sign-off missing or OPEN"
fi
stale_ok=0
for stale in \
  "$ROOT/evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260630T154900Z.md" \
  "$ROOT/evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260630T163100Z.md"; do
  [[ -f "$stale" ]] || continue
  grep -qi 'SUPERSEDED BY' "$stale" && stale_ok=$((stale_ok + 1)) || true
done
if [[ "$stale_ok" -ge 2 ]] || [[ ! -f "$ROOT/evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260630T154900Z.md" ]]; then
  record "P3-SSOT-STALE-SIGNOFF" PASS "Historical sign-offs SUPERSEDED or absent"
else
  record "P3-SSOT-STALE-SIGNOFF" BLOCKER "Stale sign-offs missing SUPERSEDED BY header"
fi

# --- 5 · P0 prep chain (merchant / rollback) ---
p0_status="$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/STATUS.txt"
if [[ -f "$p0_status" ]] && grep -q 'TT_PHASE3_PRODUCTION_PREP_P0: OK' "$p0_status"; then
  record "P3-P0-CHAIN" PASS "Merchant+DB drill+rollback P0 chain OK ($(grep '^at=' "$p0_status" | cut -d= -f2))"
else
  record "P3-P0-CHAIN" WARN "P0 prep chain not latest OK — run run-phase3-production-prep-p0.sh"
fi

# --- Verdict ---
total_blockers=$((fail_blockers + prod_only_blockers))
if [[ "$fail_blockers" -eq 0 && "$prod_only_blockers" -eq 0 ]]; then
  verdict="GO"
  verdict_reason="All audited checks PASS — still requires M-00 / go-live §0–§11 human sign-off"
elif [[ "$fail_blockers" -eq 0 ]]; then
  verdict="NO_GO"
  verdict_reason="0 non-prod BLOCKER · ${prod_only_blockers} production-only BLOCKER(s) · ${warn_count} WARN · ${pass_count} PASS"
else
  verdict="NO_GO"
  verdict_reason="${fail_blockers} non-prod BLOCKER(s) · ${prod_only_blockers} production-only · ${warn_count} WARN · ${pass_count} PASS"
fi

if [[ "$fail_blockers" -eq 0 ]]; then
  convergence_gate="PASS"
else
  convergence_gate="FAIL"
fi

cat > "$OUT/go_no_go.json" <<EOF
{
  "schema": "phase3_production_go_audit.v1",
  "at": "${STAMP}",
  "phase": "③",
  "scope": "production_go_preparation_audit",
  "api_base": "${API_BASE}",
  "web_base": "${WEB_BASE}",
  "counts": {
    "pass": ${pass_count},
    "warn": ${warn_count},
    "blocker_non_production": ${fail_blockers},
    "blocker_production_only": ${prod_only_blockers},
    "blocker_total": ${total_blockers}
  },
  "convergence_gate": "${convergence_gate}",
  "non_production_blockers": ${fail_blockers},
  "production_only_blockers": ${prod_only_blockers},
  "verdict": "${verdict}",
  "verdict_reason": "${verdict_reason}",
  "honest_boundary": "staging proxy checks ≠ Production GO · PI-3 P0 must close · M-00 unsigned · production_only blockers expected until prod cutover",
  "ssot": [
    "docs/runbook/PHASE3-PRODUCTION-PREPARATION.md",
    "docs/go-live-checklist.md",
    "evidence/GO_phase2_testnet_20260526/phase3-production-prep/issues-phase3-production.md",
    "evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260701T002252Z.md"
  ]
}
EOF

cat > "$OUT/STATUS.txt" <<EOF
TT_PHASE3_PRODUCTION_GO_AUDIT: ${verdict}
TT_PHASE3_CONVERGENCE_GATE: ${convergence_gate}
at=${STAMP}
pass=${pass_count}
warn=${warn_count}
blocker_non_production=${fail_blockers}
blocker_production_only=${prod_only_blockers}
reason=${verdict_reason}
EOF

echo ""
echo "TT_PHASE3_PRODUCTION_GO_AUDIT: ${verdict}"
echo "TT_PHASE3_CONVERGENCE_GATE: ${convergence_gate} (non_production_blockers=${fail_blockers})"
echo "Evidence: ${OUT}"
if [[ "$verdict" == "GO" ]]; then
  exit 0
elif [[ "$convergence_gate" == "PASS" && "${PHASE3_CONVERGENCE_RERUN:-0}" == "1" ]]; then
  exit 0
else
  exit 2
fi
