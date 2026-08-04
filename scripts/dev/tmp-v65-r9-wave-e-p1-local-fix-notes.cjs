#!/usr/bin/env node
/* V65-PROD-003 R9: Wave E P1 local fix_notes (G076/G084/G086–G089) — status stays OPEN until runtime */
const fs = require('fs');
const path = require('path');

const STAMP = '20260804T023500Z';
const TIP = '2738a68dc8161722a4ca5cebd2027c143b82ca45';
const UPDATED = '2026-08-04T02:35:00Z';
const EVID =
  'evidence/GO_v65_prod_003_wave_e_p1_local_verify/20260804T023500Z';
const ROOT = process.cwd();

const invPath = path.join(
  ROOT,
  'docs/runbook/TT-V65-PROD-003-DISCOVERY-WORKBENCH-GAP-INVENTORY-LATEST.json',
);
const invMdPath = path.join(
  ROOT,
  'docs/runbook/TT-V65-PROD-003-DISCOVERY-WORKBENCH-GAP-INVENTORY-LATEST.md',
);

const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));

const NOTES = {
  'V65-PROD-003-G076':
    `R9 ${STAMP} LOCAL_BE_CONTRACT: AdminUsersListQuery / list JSON omit kyc_status (mod.rs live path + query_types + admin_users_http). Internal UserRow.kyc_status mapping retained (not list contract). Local verify PASS_LOCAL · status=OPEN until runtime · evidence=${EVID} · TT_PRODUCTION_GO=NO_GO.`,
  'V65-PROD-003-G084':
    `R9 ${STAMP} LOCAL_FE_BOUNDED: AdminCommunityRelatedLinks KEEP_AND_PRODUCTIONIZE — 举报/申诉/风控/内容/用户行为/Moderator日志/RBAC links + data-tt-admin-community-related + data-tt-admin-community-bounded-honesty. No standalone risk platform. Local verify PASS_LOCAL · status=OPEN until runtime · NO_GO.`,
  'V65-PROD-003-G086':
    `R9 ${STAMP} LOCAL_FE: error.tsx via AdminRouteErrorShell on guide-applications / provider-applications / steward-applications / inbox / content / backup. Local verify PASS_LOCAL · status=OPEN until runtime · NO_GO.`,
  'V65-PROD-003-G087':
    `R9 ${STAMP} LOCAL_FE_BOUNDED: paired with G084 — Moderator ops log + user-behavior surfaces linked in AdminCommunityRelatedLinks honesty strip (bounded; not a new risk platform). Local verify PASS_LOCAL · status=OPEN until runtime · NO_GO.`,
  'V65-PROD-003-G088':
    `R9 ${STAMP} LOCAL_FE_REMOVE: StewardWorkbenchBTrackCompleteStrip amountLabel removed; data-tt-steward-workbench-b-track-fee-removed=1; StewardRegionWorkbenchMain no longer passes amountLabel. Local verify PASS_LOCAL · status=OPEN until runtime · NO_GO.`,
  'V65-PROD-003-G089':
    `R9 ${STAMP} LOCAL_BE_FE: admin_onboarding_queue_list_limit (default 100 / max 500) + applied_filters.truncated; FE appendAdminOnboardingQueueListLimit + truncation hint data-tt-admin-onboarding-queue-truncated. Local verify PASS_LOCAL · status=OPEN until runtime · NO_GO.`,
};

const WAVE_E_IDS = Object.keys(NOTES);

for (const g of inv.gaps || []) {
  const note = NOTES[g.id];
  if (!note) continue;
  g.fix_note = note;
  g.local_fix_stamp = STAMP;
  g.tip_sha = TIP;
  g.updated_at = UPDATED;
  g.local_verify_evidence = EVID;
  g.local_verify_verdict = 'PASS_LOCAL';
  // Keep OPEN until runtime evidence — no false CLOSED / RUNTIME_VERIFIED
  if (g.status !== 'RUNTIME_VERIFIED' && g.status !== 'DEFERRED_OPTIONAL_WITH_G016') {
    g.status = 'OPEN';
  }
  g.runtime = g.runtime || 'NOT_STARTED';
}

inv.wave_e_status = 'SCOPE_FROZEN';
inv.lifecycle_status =
  'WAVE_D_RUNTIME_VERIFIED__WAVE_E_SCOPE_FROZEN_P1_LOCAL_VERIFY_PASS';
inv.tt_production_go = 'NO_GO';
inv.tip_sha = TIP;

if (inv.wave_e) {
  inv.wave_e.status = 'SCOPE_FROZEN';
  inv.wave_e.scope_frozen = true;
  inv.wave_e.r9_note = `R9 ${STAMP}: G076/G084/G086–G089 local product + PASS_LOCAL verify; statuses remain OPEN until runtime; NO_GO; no fragment ship; evidence=${EVID}`;
  inv.wave_e.p1_local_progress = {
    stamp: STAMP,
    tip_sha: TIP,
    local_verify_verdict: 'PASS_LOCAL',
    evidence: EVID,
    gaps_noted: WAVE_E_IDS,
    batch_closed: false,
    runtime_verified: false,
  };
}

inv.owner_r9 = {
  stamp: STAMP,
  tip_sha: TIP,
  scope_frozen: true,
  p1_local_notes: true,
  local_verify_verdict: 'PASS_LOCAL',
  evidence: EVID,
  statuses_remain_open_until_runtime: true,
  tt_production_go: 'NO_GO',
  no_fragment_ship: true,
  ladder_blocked_on: 'Owner commit/bake Wave E before Single Cut',
};

inv.notes =
  (inv.notes || '') +
  ` | R9 ${STAMP}: Wave E P1 local fix_notes + PASS_LOCAL · status OPEN until runtime · NO_GO · no fragment ship · evidence=${EVID}`;

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n');

const we = inv.wave_e || {};
const md = `# TT-V65-PROD-003 Discovery Workbench Gap Inventory (LATEST)

**Stamp:** ${STAMP} · **Tip:** \`${TIP}\`  
**wave_e_status:** **SCOPE_FROZEN** · **tt_production_go:** **NO_GO**  
**gap_count:** ${inv.gap_count} · **open_wave_e:** ${inv.open_wave_e}  
**Local verify:** **PASS_LOCAL (①)** · evidence \`${EVID}\`

## Honesty

SCOPE_FROZEN ≠ CLOSED ≠ Production GO · ①绿 ≠ ③GO · PASS_LOCAL ≠ RUNTIME_VERIFIED · no fragment ship

## Owner locks (Wave E)

| Decision | Value |
|----------|-------|
| KYC | DELETE |
| Entry fee | REMOVE |
| Onboarding queues | PRODUCTION_WRITABLE |
| Config hub | 配置中心 |
| Appeals/moderation | IN_SCOPE |
| Content siblings | KEEP_AND_PRODUCTIONIZE |
| G084 community residual | KEEP_AND_PRODUCTIONIZE (bounded) |
| No new batch after freeze | true |

## R9 Wave E P1 local progress (status still OPEN)

| Gap | fix_note summary |
|-----|------------------|
| G076 | BE Admin users list/query: no kyc_status |
| G084 | Community residual bounded productionize |
| G086 | Critical Admin leaves error.tsx |
| G087 | Moderator ops log + user behavior (bounded w/ G084) |
| G088 | Entry-fee UI residual removed (B-track strip) |
| G089 | Onboarding queue limit + truncated honesty |

## Open P0

${(we.open_p0 || []).map((id) => `- \`${id}\``).join('\n')}

## Open P1 (count ${(we.open_p1 || []).length})

${(we.open_p1 || []).map((id) => `- \`${id}\``).join('\n')}

## Open P2

${(we.open_p2 || []).map((id) => `- \`${id}\``).join('\n')}

## Post-freeze ladder

${(we.post_freeze_ladder || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Next Owner gate

1. Commit / bake Wave E (uncommitted working tree ≠ Cut tip)
2. Single Cut → Runtime Evidence → PRV-3b
3. Update V65 Runtime Truth SSOT + Final Truth Baseline
4. Keep **TT_PRODUCTION_GO=NO_GO**

## SSOT

- JSON: \`docs/runbook/TT-V65-PROD-003-DISCOVERY-WORKBENCH-GAP-INVENTORY-LATEST.json\`
- Evidence R9: \`${EVID}/\`
`;

fs.writeFileSync(invMdPath, md);
console.log('R9 inventory sync OK', {
  stamp: STAMP,
  wave_e_status: inv.wave_e_status,
  go: inv.tt_production_go,
  gaps: WAVE_E_IDS,
});
