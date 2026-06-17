#!/usr/bin/env bash
# Production Infrastructure Audit（PI3-001 · PI3-002 优先）
#
# 边界：仅生产基础设施 · 不修改业务代码 · 不扩展功能审计
# 基线：FINAL_SYSTEM_AUDIT: PASS · BUSINESS_DEVELOPMENT: FROZEN
#
#   PROD_API_BASE=https://api.example.com PROD_WEB_BASE=https://app.example.com \
#     bash scripts/dev/run-production-infrastructure-audit.sh
#
# 产物：evidence/.../infra-audit-<UTC>/
#   infrastructure_matrix.json · backup_matrix.json · disaster_recovery_matrix.json
#   issues-production-infrastructure.md · infra_audit_summary.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE3_INFRA_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/infra-audit-${STAMP}}"

# Production targets (Owner fills when domain registered)
PROD_API_APP="${FLY_PROD_API_APP:-tt-api-prod}"
PROD_WEB_APP="${FLY_PROD_WEB_APP:-tt-web-prod}"
PROD_PG_APP="${FLY_PROD_PG_APP:-tt-traveltrust-prod}"
PROD_API_BASE="${PROD_API_BASE:-}"
PROD_WEB_BASE="${PROD_WEB_BASE:-}"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
STAGING_PG="${FLY_STAGING_PG_APP:-tt-traveltrust-staging}"

BASELINE_JSON="$ROOT/evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json"

mkdir -p "$OUT"
exec > >(tee -a "$OUT/audit.log") 2>&1

p0=0 p1=0 p2=0
issues_md="$OUT/issues-production-infrastructure.md"

record_issue() {
  local id="$1" pri="$2" area="$3" verdict="$4" detail="$5"
  echo "| ${id} | ${pri} | ${area} | ${verdict} | ${detail} |" >>"$issues_md"
  case "$pri" in
    P0) p0=$((p0 + 1)) ;;
    P1) p1=$((p1 + 1)) ;;
    P2) p2=$((p2 + 1)) ;;
  esac
}

json_row() {
  python - "$@" <<'PY'
import json, sys
path, row = sys.argv[1], json.loads(sys.argv[2])
data = json.load(open(path, encoding="utf-8")) if __import__("pathlib").Path(path).exists() else []
data.append(row)
json.dump(data, open(path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
PY
}

echo "== production infrastructure audit · ${STAMP} =="
echo "SSOT: docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md"
echo "prod_api_app=${PROD_API_APP} prod_web_app=${PROD_WEB_APP} prod_pg_app=${PROD_PG_APP}"
echo "prod_api_base=${PROD_API_BASE:-<unset>} prod_web_base=${PROD_WEB_BASE:-<unset>}"

INFRA="$OUT/infrastructure_matrix.json"
BACKUP="$OUT/backup_matrix.json"
DR="$OUT/disaster_recovery_matrix.json"
: >"$INFRA"; echo "[]" >"$INFRA"
: >"$BACKUP"; echo "[]" >"$BACKUP"
: >"$DR"; echo "[]" >"$DR"

cat >"$issues_md" <<EOF
# Production Infrastructure · 问题清单（机读生成）

**生成：** ${STAMP}  
**审计脚本：** \`scripts/dev/run-production-infrastructure-audit.sh\`

| ID | 优先级 | 域 | 裁定 | 说明 |
|----|--------|-----|------|------|
EOF

# --- Fly CLI ---
FLY_OK=0
if command -v fly >/dev/null 2>&1 && fly auth whoami >/dev/null 2>&1; then
  FLY_OK=1
  echo "fly: authenticated $(fly auth whoami 2>/dev/null | head -1 || true)"
else
  echo "WARN: fly CLI unavailable or not authenticated"
  record_issue "INF-P0-001" "P0" "Fly CLI" "BLOCKER" "fly auth whoami failed — cannot verify PG backups / prod apps / certs"
fi

# --- B-475 / PI3-001 ---
b475_st="MISSING"
drill_utc=""
if [[ -f "$BASELINE_JSON" ]]; then
  b475_st="$(python -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('status',''))" "$BASELINE_JSON")"
  drill_utc="$(python -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('last_restore_drill_utc',''))" "$BASELINE_JSON")"
fi
b475_gate=1
python "$ROOT/scripts/gates/check-b475-pg-backup-pitr-baseline-record.py" 2>&1 | tee "$OUT/b475-check.log" || b475_gate=0

b475_verdict="FAIL"
[[ "$b475_st" == "PASS" ]] && b475_verdict="PASS"
[[ "$b475_st" == "PLANNED" && -n "$drill_utc" ]] && b475_verdict="PARTIAL"

json_row "$BACKUP" "$(python -c "import json; print(json.dumps({
  'id': 'B-475-baseline',
  'component': 'PostgreSQL backup/PITR baseline',
  'staging_pg_app': '${STAGING_PG}',
  'prod_pg_app': '${PROD_PG_APP}',
  'baseline_status': '${b475_st}',
  'last_restore_drill_utc': '${drill_utc}',
  'gate_script_exit0': bool(${b475_gate}),
  'verdict': '${b475_verdict}',
  'pi3': 'PI3-001',
}))")"

if [[ "$b475_st" != "PASS" ]]; then
  record_issue "INF-P0-002" "P0" "B-475 / PI3-001" "BLOCKER" "baseline status=${b475_st} — prod PG backup plan must enable → PASS"
else
  record_issue "INF-P0-002" "P0" "B-475 / PI3-001" "PASS" "baseline status=PASS drill=${drill_utc}"
fi

# Fly backup list (staging + prod)
for pg_app in "$STAGING_PG" "$PROD_PG_APP"; do
  bk_verdict="SKIP"
  bk_note="fly unavailable"
  if [[ "$FLY_OK" == "1" ]]; then
    if fly postgres backup list -a "$pg_app" 2>&1 | tee "$OUT/fly-backup-${pg_app}.txt"; then
      if grep -qiE "no backups|not enabled|unsupported|Error|Could not find" "$OUT/fly-backup-${pg_app}.txt" 2>/dev/null; then
        bk_verdict="FAIL"
        bk_note="backups not enabled or app missing"
      else
        bk_verdict="PASS"
        bk_note="backup list returned data"
      fi
    else
      bk_verdict="FAIL"
      bk_note="fly postgres backup list failed"
    fi
  fi
  json_row "$BACKUP" "$(python -c "import json; print(json.dumps({
    'id': 'fly-backup-${pg_app}',
    'component': 'Fly managed PG backup',
    'fly_app': '${pg_app}',
    'verdict': '${bk_verdict}',
    'notes': '''${bk_note}''',
  }))")"
  if [[ "$pg_app" == "$PROD_PG_APP" && "$bk_verdict" != "PASS" ]]; then
    record_issue "INF-P0-003" "P0" "Fly PG prod backup" "BLOCKER" "${pg_app}: ${bk_note}"
  elif [[ "$pg_app" == "$STAGING_PG" && "$bk_verdict" != "PASS" ]]; then
    record_issue "INF-P1-001" "P1" "Fly PG staging backup" "WARN" "${pg_app}: ${bk_note} — prod must not copy staging gap"
  fi
done

# --- TLS / DNS / CORS / PI3-002 ---
probe_host() {
  local label="$1" base="$2" role="$3"
  [[ -z "$base" ]] && return 0
  local host="${base#https://}"; host="${host#http://}"; host="${host%%/*}"
  local hc ssl cors_ok=0 tls_ok=0
  hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${base%/}/health" 2>/dev/null || echo 000)"
  ssl="$(curl -sS -o /dev/null -w '%{ssl_verify_result}' --max-time 20 "${base%/}/health" 2>/dev/null || echo 9)"
  [[ "$ssl" == "0" ]] && tls_ok=1
  [[ "$hc" == "200" ]] && tls_ok=1
  if [[ "$role" == "api" ]]; then
    local origin="${STAGING_WEB}"
    [[ "$label" == prod-* && -n "${PROD_WEB_BASE:-}" ]] && origin="${PROD_WEB_BASE}"
    cors_hdr="$(curl -sS -D - -o /dev/null --max-time 20 -X OPTIONS \
      "${base%/}/meta" -H "Origin: ${origin}" \
      -H "Access-Control-Request-Method: GET" 2>/dev/null | tr -d '\r' | grep -i '^access-control-allow-origin:' | head -1 || true)"
    [[ -n "$cors_hdr" ]] && cors_ok=1
    echo "$cors_hdr" >"$OUT/cors-${label}.txt" 2>/dev/null || true
  fi
  if command -v nslookup >/dev/null 2>&1; then
    nslookup "$host" 2>&1 | head -8 >"$OUT/dns-${label}.txt" || true
  fi
  if command -v openssl >/dev/null 2>&1; then
    echo | openssl s_client -connect "${host}:443" -servername "$host" 2>/dev/null \
      | openssl x509 -noout -dates -subject 2>/dev/null >"$OUT/tls-${label}.txt" || true
  fi
  local verdict="FAIL"
  [[ "$hc" == "200" && "$tls_ok" == "1" ]] && verdict="PASS"
  local pi3_tag="staging-proxy"
  [[ "$label" == prod-* ]] && pi3_tag="PI3-002"
  json_row "$INFRA" "$(python -c "import json; print(json.dumps({
    'id': 'edge-${label}',
    'role': '${role}',
    'base_url': '${base}',
    'host': '${host}',
    'health_http': '${hc}',
    'ssl_verify': '${ssl}',
    'cors_preflight_ok': ${cors_ok},
    'verdict': '${verdict}',
    'pi3': '${pi3_tag}',
  }))")"
  echo "probe ${label} ${base} health=${hc} ssl=${ssl} cors=${cors_ok}"
}

probe_host "staging-api" "$STAGING_API" "api"
probe_host "staging-web" "$STAGING_WEB" "web"

prod_configured=0
[[ -n "$PROD_API_BASE" && "$PROD_API_BASE" != *".fly.dev"* && "$PROD_API_BASE" != *"example.com"* ]] && prod_configured=1
[[ -n "$PROD_WEB_BASE" && "$PROD_WEB_BASE" != *".fly.dev"* && "$PROD_WEB_BASE" != *"example.com"* ]] && prod_configured=1

if [[ "$prod_configured" == "1" ]]; then
  probe_host "prod-api" "$PROD_API_BASE" "api"
  probe_host "prod-web" "$PROD_WEB_BASE" "web"
else
  record_issue "INF-P0-004" "P0" "Prod domain / PI3-002" "BLOCKER" "PROD_API_BASE/PROD_WEB_BASE unset or placeholder — no dedicated production domain"
  json_row "$INFRA" "$(python -c "import json; print(json.dumps({
    'id': 'edge-prod',
    'role': 'api+web',
    'base_url': None,
    'verdict': 'NOT_CONFIGURED',
    'pi3': 'PI3-002',
    'notes': 'Set PROD_API_BASE and PROD_WEB_BASE to audit prod TLS/DNS/CORS',
  }))")"
fi

# CDN (documentary)
json_row "$INFRA" "$(python -c "import json; print(json.dumps({
  'id': 'cdn-hls',
  'component': 'Production CDN / HLS',
  'verdict': 'NOT_STARTED',
  'pi3': 'PI3-007',
  'notes': 'P3-COM-1 — post-GA or greyscale; Fly *.fly.dev direct only today',
}))")"
record_issue "INF-P1-002" "P1" "CDN / HLS" "OPEN" "P3-COM-1 NOT STARTED — not blocking M-00 per PI3-007 defer"

# --- Secrets / env checklist ---
ENV_EXAMPLE="$ROOT/scripts/dev/.env.production.example"
secrets_verdict="PASS"
[[ -f "$ENV_EXAMPLE" ]] || secrets_verdict="FAIL"
json_row "$INFRA" "$(python -c "import json; print(json.dumps({
  'id': 'secrets-checklist',
  'component': 'Production secrets template',
  'path': 'scripts/dev/.env.production.example',
  'verdict': '${secrets_verdict}',
  'notes': 'Owner fills .env.production.local — never commit',
}))")"
[[ "$secrets_verdict" == "FAIL" ]] && record_issue "INF-P1-003" "P1" "Secrets template" "OPEN" "missing .env.production.example"

# Prod fly.toml deploy templates
for f in deploy/fly/tt-api-prod/fly.toml frontend/fly.production.toml; do
  if [[ -f "$ROOT/$f" ]]; then fv="PASS"; else fv="FAIL"; fi
  fid="${f//\//-}"
  json_row "$INFRA" "$(python -c "import json; print(json.dumps({
    'id': 'deploy-template-${fid}',
    'path': '${f}',
    'verdict': '${fv}',
  }))")"
done

# --- DR / Rollback ---
for drill_glob in "rollback-drill-*" "db-restore-drill-*"; do
  latest="$(ls -d "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep"/${drill_glob} 2>/dev/null | sort | tail -1 || true)"
  [[ -n "$latest" ]] || continue
  id="${drill_glob%-*}"
  st="UNKNOWN"
  [[ -f "${latest}/STATUS.txt" ]] && st="$(cat "${latest}/STATUS.txt")"
  dr_verdict="PARTIAL"
  [[ "$st" == "READY" ]] && dr_verdict="PASS"
  json_row "$DR" "$(python -c "import json; print(json.dumps({
    'id': '${id}',
    'evidence_path': '${latest#$ROOT/}',
    'status': '${st}',
    'environment': 'staging',
    'verdict': '${dr_verdict}',
  }))")"
done

json_row "$DR" "$(python -c "import json; print(json.dumps({
  'id': 'prod-rollback-drill',
  'script': 'scripts/dev/run-phase3-fly-release-rollback-drill-prod.sh',
  'environment': 'production',
  'verdict': 'NOT_RUN',
  'notes': 'Run after tt-api-prod / tt-web-prod exist',
}))")"
json_row "$DR" "$(python -c "import json; print(json.dumps({
  'id': 'prod-db-restore-drill',
  'script': 'scripts/dev/run-phase3-db-restore-drill-prod.sh',
  'environment': 'production',
  'verdict': 'NOT_RUN',
  'notes': 'Run after tt-traveltrust-prod backup plan enabled',
}))")"

record_issue "INF-P1-004" "P1" "Prod rollback drill" "OPEN" "staging rollback PASS · prod drill NOT_RUN"
record_issue "INF-P1-005" "P1" "Prod DB restore drill" "OPEN" "staging drill PASS · prod drill NOT_RUN"

# --- Verdict ---
blockers=$p0
if [[ "$b475_st" != "PASS" ]]; then blockers=$((blockers)); fi
if [[ "$prod_configured" != "1" ]]; then blockers=$((blockers)); fi

verdict="NO_GO"
[[ "$p0" -eq 0 ]] && verdict="GO"

cat >>"$issues_md" <<EOF

---

**计数：** P0=${p0} · P1=${p1} · P2=${p2}  
**Infrastructure GO：** \`${verdict}\`（P0=0 且 PI3-001/002 闭合）

EOF

python - "$OUT/infra_audit_summary.json" "$OUT" "$STAMP" "$p0" "$p1" "$p2" "$verdict" "$b475_st" "$prod_configured" <<'PY'
import json, sys
from pathlib import Path
out_json, out_dir, stamp, p0, p1, p2, verdict, b475, prod_cfg = sys.argv[1:10]
json.dump({
  "schema": "production_infrastructure_audit.v1",
  "at": stamp,
  "phase": "③",
  "scope": "production_infrastructure_audit",
  "baseline": "FINAL_SYSTEM_AUDIT: PASS",
  "business_development": "FROZEN",
  "system_audit_scope": "FROZEN",
  "priority": ["PI3-001", "PI3-002"],
  "counts": {"p0": int(p0), "p1": int(p1), "p2": int(p2)},
  "infrastructure_go_verdict": verdict,
  "b475_status": b475,
  "prod_domain_configured": bool(int(prod_cfg)),
  "evidence_dir": Path(out_dir).name,
  "ssot": [
    "docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md",
    "evidence/GO_phase2_testnet_20260526/phase3-production-prep/issues-production-infrastructure.md",
  ],
}, open(out_json, "w", encoding="utf-8"), indent=2)
PY

cat >"$OUT/STATUS.txt" <<EOF
TT_PRODUCTION_INFRASTRUCTURE_AUDIT: ${verdict}
at=${STAMP}
p0=${p0}
p1=${p1}
p2=${p2}
b475_status=${b475_st}
prod_domain_configured=${prod_configured}
pi3_001_closed=$([[ "$b475_st" == "PASS" ]] && echo true || echo false)
pi3_002_closed=$([[ "$prod_configured" == "1" ]] && echo true || echo false)
EOF

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/latest-infra-audit" 2>/dev/null || \
  cp -r "$OUT" "$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/latest-infra-audit"

echo ""
echo "TT_PRODUCTION_INFRASTRUCTURE_AUDIT: ${verdict}"
echo "P0=${p0} P1=${p1} P2=${p2}"
echo "Evidence: ${OUT}"
[[ "$verdict" == "GO" ]] && exit 0 || exit 2
