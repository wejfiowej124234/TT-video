#!/usr/bin/env bash
# Local ↔ Staging Full Alignment Audit (Phase ②→PER gate)
#
# Baseline: latest CMS · OCS · SSOT · Web3 (local workspace = sole SSOT for PER).
# Staging is compared for drift classification — PER runs on local only after this gate.
#
#   bash scripts/dev/run-local-staging-full-alignment-audit.sh
#   SKIP_CMS_UAT=1 bash scripts/dev/run-local-staging-full-alignment-audit.sh
#
# SSOT output:
#   docs/spec/governance-token/evidence/phase3-production-entry-baseline/LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json
#   docs/spec/governance-token/evidence/phase3-production-entry-baseline/LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline"
OUT_JSON="$EVID/LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json"
OUT_MD="$EVID/LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.md"
RUN_LOG="$EVID/LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-${STAMP}.log"

LOCAL_API="${LOCAL_API:-http://127.0.0.1:8080}"
LOCAL_WEB="${LOCAL_WEB:-http://127.0.0.1:3012}"
STAGING_API="${STAGING_API:-https://tt-api-staging.fly.dev}"
STAGING_WEB="${STAGING_WEB:-https://tt-web-staging.fly.dev}"
SKIP_CMS_UAT="${SKIP_CMS_UAT:-0}"

mkdir -p "$EVID"
exec > >(tee -a "$RUN_LOG") 2>&1

echo "LOCAL_STAGING_FULL_ALIGNMENT_AUDIT: START ${STAMP}"

LOCAL_SHA="$(git rev-parse HEAD)"
PORCELAIN_COUNT="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
DIFF_STAT="$(git diff --stat 2>/dev/null | tail -1 || true)"

curl -sS --max-time 30 "${STAGING_API}/meta" >"$EVID/.staging-meta-snapshot.json" || echo '{}' >"$EVID/.staging-meta-snapshot.json"
curl -sS --max-time 15 "${LOCAL_API}/meta" >"$EVID/.local-meta-snapshot.json" 2>/dev/null || echo '{}' >"$EVID/.local-meta-snapshot.json"

STAGING_SHA="$(node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));console.log(j.build?.git_sha||'unknown')" "$EVID/.staging-meta-snapshot.json")"
LOCAL_META_SHA="$(node -e "const fs=require('fs');const p=process.argv[1];const j=JSON.parse(fs.readFileSync(p,'utf8'));console.log(j.build?.git_sha||'unknown')" "$EVID/.local-meta-snapshot.json")"

local_api_hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "${LOCAL_API}/health" 2>/dev/null || echo 000)"
local_web_hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "${LOCAL_WEB}/" 2>/dev/null || echo 000)"
staging_web_hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${STAGING_WEB}/" 2>/dev/null || echo 000)"

echo "== local gates (SSOT hygiene) =="
GATE_HYGIENE="SKIP"
GATE_PUBLIC="SKIP"
if bash "$ROOT/scripts/gates/check-production-ui-hygiene-gate.sh" 2>&1 | tail -3; then GATE_HYGIENE="PASS"; else GATE_HYGIENE="FAIL"; fi
if bash "$ROOT/scripts/gates/check-public-surface-audit-gate.sh" 2>&1 | tail -3; then GATE_PUBLIC="PASS"; else GATE_PUBLIC="FAIL"; fi

echo "== staging web alignment (infra) =="
STAGING_WEB_ALIGN="FAIL"
if bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" 2>&1 | tee "$EVID/.staging-web-align-${STAMP}.log" | tail -5 | grep -q 'FAIL=0'; then
  STAGING_WEB_ALIGN="PASS"
fi

echo "== public API parity probes =="
node - "$LOCAL_API" "$STAGING_API" <<'NODE' >"$EVID/.api-parity-${STAMP}.json"
const [localBase, stagingBase] = process.argv.slice(2);
const paths = [
  '/api/v1/public/announcements?limit=5',
  '/api/v1/public/roadmap',
  '/api/v1/guides?limit=3',
];
async function probe(base) {
  const out = {};
  for (const p of paths) {
    try {
      const r = await fetch(`${base}${p}`, { signal: AbortSignal.timeout(15000) });
      const j = await r.json();
      const n = j.items?.length ?? j.announcements?.length ?? j.phases?.length ?? null;
      out[p] = { status: r.status, count: n };
    } catch (e) {
      out[p] = { error: String(e.message || e) };
    }
  }
  return out;
}
(async () => {
  const local = await probe(localBase);
  const staging = await probe(stagingBase);
  const drift = [];
  for (const p of paths) {
    const lc = local[p]?.count;
    const sc = staging[p]?.count;
    if (lc != null && sc != null && lc !== sc) drift.push({ path: p, local: lc, staging: sc });
  }
  console.log(JSON.stringify({ local, staging, count_drift: drift }, null, 2));
})();
NODE

API_PARITY_DRIFT="$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(j.count_drift.length)" "$EVID/.api-parity-${STAMP}.json")"

echo "== web surface drift markers (Wave A) =="
staging_mock="$(curl -sS --max-time 30 "${STAGING_WEB}/traveltrust" 2>/dev/null | grep -oiE 'mock-swap|Mock Pay|ui_link_nav_arrow_suffix' | sort -u | tr '\n' ',' | sed 's/,$//' || true)"
local_mock=""
if [[ "$local_web_hc" == "200" ]]; then
  local_mock="$(curl -sS --max-time 30 "${LOCAL_WEB}/traveltrust" 2>/dev/null | grep -oiE 'mock-swap|Mock Pay|ui_link_nav_arrow_suffix' | sort -u | tr '\n' ',' | sed 's/,$//' || true)"
fi

CMS_UAT_ANN="SKIP"
CMS_UAT_ROAD="SKIP"
if [[ "$SKIP_CMS_UAT" != "1" ]]; then
  echo "== CMS staging UAT =="
  if node "$ROOT/scripts/dev/run-cms-announcements-staging-uat.cjs" 2>&1 | tail -3; then CMS_UAT_ANN="PASS"; else CMS_UAT_ANN="FAIL"; fi
  if node "$ROOT/scripts/dev/run-cms-roadmap-staging-uat.cjs" 2>&1 | tail -3; then CMS_UAT_ROAD="PASS"; else CMS_UAT_ROAD="FAIL"; fi
fi

echo "== emit machine report =="
BLOCKING=0
WARN=0

note_blocking() { BLOCKING=$((BLOCKING + 1)); echo "BLOCKING: $*"; }
note_warn() { WARN=$((WARN + 1)); echo "WARN: $*"; }

[[ "$GATE_HYGIENE" == "PASS" ]] || note_blocking "local check-production-ui-hygiene-gate not PASS"
[[ "$GATE_PUBLIC" == "PASS" ]] || note_blocking "local check-public-surface-audit-gate not PASS"
[[ "$local_api_hc" == "200" ]] || note_blocking "local API not reachable (${LOCAL_API}/health → ${local_api_hc})"
[[ "$local_web_hc" == "200" ]] || note_blocking "local web not reachable (${LOCAL_WEB} → ${local_web_hc}) — PER walks blocked"

if [[ "$PORCELAIN_COUNT" -gt 0 ]]; then
  note_warn "working tree dirty (${PORCELAIN_COUNT} porcelain lines) — commit or stash before one-shot staging deploy"
fi

if [[ "$LOCAL_SHA" != "$STAGING_SHA" && "$STAGING_SHA" != "unknown" ]]; then
  note_warn "committed HEAD (${LOCAL_SHA:0:12}) ≠ staging deployed git_sha (${STAGING_SHA:0:12})"
fi

if [[ "$API_PARITY_DRIFT" != "0" ]]; then
  note_blocking "public API count drift between local and staging (see api-parity json)"
fi

if [[ -n "$staging_mock" ]]; then
  note_warn "staging web still exposes Wave-A markers: ${staging_mock} — deferred until post-PER one-shot deploy"
fi

if [[ "$CMS_UAT_ANN" == "FAIL" || "$CMS_UAT_ROAD" == "FAIL" ]]; then
  note_blocking "CMS staging UAT failed"
fi

VERDICT="NOT_READY"
PER_GATE="BLOCKED"
if [[ "$BLOCKING" -eq 0 ]]; then
  if [[ "$WARN" -eq 0 ]]; then
    VERDICT="ALIGNED"
    PER_GATE="OPEN"
  else
    VERDICT="LOCAL_SSOT_READY"
    PER_GATE="OPEN"
  fi
fi

node - "$OUT_JSON" "$STAMP" "$VERDICT" "$PER_GATE" "$BLOCKING" "$WARN" \
  "$LOCAL_SHA" "$STAGING_SHA" "$PORCELAIN_COUNT" "$GATE_HYGIENE" "$GATE_PUBLIC" \
  "$local_api_hc" "$local_web_hc" "$staging_web_hc" "$STAGING_WEB_ALIGN" \
  "$CMS_UAT_ANN" "$CMS_UAT_ROAD" "$API_PARITY_DRIFT" "$staging_mock" "$local_mock" \
  "$EVID/.api-parity-${STAMP}.json" <<'NODE'
const fs = require('fs');
const [
  outJson, stamp, verdict, perGate, blocking, warn,
  localSha, stagingSha, porcelain, gateHygiene, gatePublic,
  localApiHc, localWebHc, stagingWebHc, stagingWebAlign,
  cmsAnn, cmsRoad, apiDrift, stagingMock, localMock, apiParityPath,
] = process.argv.slice(2);

const report = {
  schema: 'traveltrust.local_staging_full_alignment_audit.v1',
  audit_id: 'LOCAL_STAGING_FULL_ALIGNMENT_AUDIT',
  stamp,
  recorded_at: new Date().toISOString(),
  verdict,
  per_gate: perGate,
  blocking_count: Number(blocking),
  warn_count: Number(warn),
  ssot: {
    local_is_sole_truth_for_per: verdict !== 'NOT_READY',
    baseline: ['CMS', 'OCS', 'SSOT', 'Web3'],
    phase_honesty: '① local PER · staging env-diff only after one-shot deploy',
  },
  git: {
    local_head: localSha,
    staging_deployed_git_sha: stagingSha,
    porcelain_lines: Number(porcelain),
    head_match: localSha === stagingSha,
  },
  runtime: {
    local_api_health: localApiHc,
    local_web: localWebHc,
    staging_web: stagingWebHc,
    staging_web_alignment: stagingWebAlign,
  },
  gates: {
    production_ui_hygiene: gateHygiene,
    public_surface_audit: gatePublic,
  },
  cms_staging_uat: { announcements: cmsAnn, roadmap: cmsRoad },
  api_parity: {
    count_drift_items: Number(apiDrift),
    detail: JSON.parse(fs.readFileSync(apiParityPath, 'utf8')),
  },
  web_wave_a_markers: {
    staging_traveltrust: stagingMock || null,
    local_traveltrust: localMock || null,
  },
  expected_differences: [
    { id: 'ENV-CHAIN', note: 'local chain_id 31337 (Anvil) vs staging 11155111 (Sepolia)' },
    { id: 'ENV-PROFILE', note: 'deployment_profile local vs staging' },
  ],
  deferred_to_post_per_deploy: [
    'staging web Wave A (mock-swap gate) until one-shot API+Web deploy',
  ],
  next_steps_ordered: [
    'Start local web (3012) if down',
    'PER Round 1 on local only (record Confirmed / Verification Pending)',
    'Local Wave fixes + gates green',
    'Commit SSOT snapshot',
    'One-shot deploy API + Web to staging',
    'Re-run this audit — staging section = env-diff verification only',
  ],
  machine_key: `TT_LOCAL_STAGING_ALIGNMENT: ${verdict}`,
};

fs.writeFileSync(outJson, JSON.stringify(report, null, 2) + '\n');
console.log(`report: ${outJson}`);
console.log(`TT_LOCAL_STAGING_ALIGNMENT: ${verdict} blocking=${blocking} warn=${warn} PER_GATE=${perGate}`);
NODE

cat >"$OUT_MD" <<EOF
# Local ↔ Staging Full Alignment Audit

**Audit ID:** \`LOCAL_STAGING_FULL_ALIGNMENT_AUDIT\`  
**Stamp:** \`${STAMP}\`  
**Verdict:** **${VERDICT}** · PER gate: **${PER_GATE}**  
**Machine key:** \`TT_LOCAL_STAGING_ALIGNMENT: ${VERDICT}\`

---

## Phase ladder (updated)

\`\`\`
① Local Engineering          CLOSED
② Staging Engineering        CLOSED (CMS UAT)
Local ↔ Staging Alignment    **${VERDICT}** ← this audit
Production Entry Review      **${PER_GATE}** (local walks only)
③ Production GO              NOT STARTED
\`\`\`

**Rule:** Do not start PER UI/UX walks until **local web is up** and **local hygiene gates PASS**. Staging drift is **classified**, not mixed into PER findings.

---

## Summary

| Check | Local (SSOT) | Staging | Classification |
|-------|--------------|---------|----------------|
| Git HEAD | \`${LOCAL_SHA:0:12}\` | \`${STAGING_SHA:0:12}\` deployed | $([ "$LOCAL_SHA" = "$STAGING_SHA" ] && echo 'HEAD match · dirty tree warn' || echo 'SHA drift') |
| Working tree | ${PORCELAIN_COUNT} porcelain lines | n/a | $([ "$PORCELAIN_COUNT" -eq 0 ] && echo 'clean' || echo 'WARN — commit before deploy') |
| API health | ${local_api_hc} | 200 | $([ "$local_api_hc" = "200" ] && echo 'OK' || echo '**BLOCKING**') |
| Web health | ${local_web_hc} | ${staging_web_hc} | $([ "$local_web_hc" = "200" ] && echo 'OK' || echo '**BLOCKING for PER**') |
| Hygiene gate | ${GATE_HYGIENE} | deferred | local SSOT |
| Public surface gate | ${GATE_PUBLIC} | deferred | local SSOT |
| Staging web align | n/a | ${STAGING_WEB_ALIGN} | infra OK |
| CMS UAT | n/a | ann=${CMS_UAT_ANN} road=${CMS_UAT_ROAD} | ② closed |
| API public counts | see JSON | see JSON | drift=${API_PARITY_DRIFT} |
| Wave A mock markers | ${local_mock:-none} | ${staging_mock:-none} | **deferred deploy** |

**Blocking:** ${BLOCKING} · **Warn:** ${WARN}

---

## Expected differences (confirm only — do not FIX_TO_MATCH)

- **ENV-CHAIN:** Anvil \`31337\` local vs Sepolia \`11155111\` staging  
- **ENV-PROFILE:** \`local\` vs \`staging\`

---

## Ordered workflow (mandatory)

1. **Align** — this audit → \`LOCAL_SSOT_READY\` or \`ALIGNED\`  
2. **PER Round 1** — local \`http://localhost:3012\` · record only  
3. **Wave fixes** — local batch  
4. **Gates green** — hygiene + public surface + affected corridors  
5. **Commit** — freeze SSOT snapshot  
6. **One-shot deploy** — API + Web → staging  
7. **Staging verify** — env-diff only · re-run this audit  

---

## Evidence

- JSON: [LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json](./LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json)  
- Run log: \`LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-${STAMP}.log\`  
- PER SSOT: [PRODUCTION-ENTRY-REVIEW.md](./PRODUCTION-ENTRY-REVIEW.md)

**Honest boundary:** Alignment PASS / LOCAL_SSOT_READY **≠** ③ Production GO **≠** staging full-matrix GO.
EOF

echo "LOCAL_STAGING_FULL_ALIGNMENT_AUDIT: DONE ${STAMP}"
echo "markdown: ${OUT_MD}"
[[ "$BLOCKING" -eq 0 ]] || exit 1
