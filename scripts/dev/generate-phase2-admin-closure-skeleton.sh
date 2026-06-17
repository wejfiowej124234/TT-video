#!/usr/bin/env bash
# ① Phase ② Admin 证据目录骨架（release_gate NOT_MET · 非 TT_PHASE2_ADMIN_STAGING: PASS）
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$REPO_ROOT/evidence/GO_phase2_admin_staging_closure/skeleton_${STAMP}"
mkdir -p "$EVID"

cat >"$EVID/report.json" <<EOF
{
  "artifact": "phase2-admin-closure-skeleton",
  "phase": "②-prep",
  "release_gate": "NOT_MET",
  "generated_at": "${STAMP}",
  "note": "Skeleton only — run record-phase2-admin-adm-u01-then-u02.sh on Staging for GO",
  "phase2_checklist": [
    { "id": "ADM-UX-CI-02", "item": "record-phase2-admin-adm-u01-then-u02.sh", "status": "NOT_STARTED" },
    { "id": "ADM-UX-RBAC-05", "item": "ADM-U01 six-role shell Playwright on Staging", "status": "NOT_STARTED" },
    { "id": "ADM-UX-IA-06", "item": "Persistent six-role console perspective", "status": "NOT_STARTED" },
    { "id": "ADM-UX-ONB-04", "item": "Real Stripe webhook echo on Staging", "status": "NOT_STARTED" },
    { "id": "ADM-UX-RBAC-06", "item": "Production 2FA enforce + no ROLE_DIRECT", "status": "NOT_STARTED" },
    { "id": "ADM-UX-FIN-02", "item": "Finance seven-piece full depth + real PSP", "status": "NOT_STARTED" }
  ],
  "local_prep_commands": [
    "bash scripts/dev/run-admin-l5-green.sh",
    "bash scripts/dev/run-admin-remaining-local-prep.sh",
    "ADM_U01_DB_ROLE_PREP=1 bash scripts/dev/run-admin-adm-u01-db-role-local-prep.sh",
    "ADM_U02_UI_PREP=1 bash scripts/dev/run-admin-adm-u02-local-prep.sh"
  ]
}
EOF

cat >"$EVID/STATUS.txt" <<EOF
status: SKELETON
phase: ②-prep
release_gate: NOT_MET
mark_phase2_allowed: false
at: ${STAMP}
EOF

cat >"$EVID/README.md" <<EOF
# Phase ② Admin staging closure skeleton (${STAMP})

**NOT_MET** — do not treat as \`TT_PHASE2_ADMIN_STAGING: PASS\`.

Local prep (phase 01):

\`\`\`bash
bash scripts/dev/run-admin-remaining-local-prep.sh
\`\`\`

Staging GO entry:

\`\`\`bash
bash scripts/dev/record-phase2-admin-adm-u01-then-u02.sh
\`\`\`
EOF

echo "TT_ADMIN_PHASE2_CLOSURE_SKELETON: OK"
echo "evidence=$EVID/report.json"
