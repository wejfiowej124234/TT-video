#!/usr/bin/env node
/**
 * Dashboard 1 · Project Dashboard — status + real metrics (no percentages)
 *
 * Fixed entry: node scripts/dev/dashboard.cjs
 */
const { createDashboardContext } = require('./lib/dashboard-common.cjs');

const ctx = createDashboardContext(require('path').join(__dirname, '../..'));
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = require('path').join(ctx.ROOT, 'evidence/GO_production_readiness/phase-dashboard');

if (ctx.REFRESH) {
  ctx.runNode('gen-ttg-cert-production-evidence-index.cjs');
  ctx.runNode('run-phase2-production-validation.cjs');
  ctx.runNode('run-sepolia-full-web3-lifecycle-validation.cjs');
  ctx.runNode('run-phase2-exit-review.cjs');
  ctx.runNode('run-phase3-deployment-prerequisite-review.cjs');
}

const CONFIG = {
  default_owner: 'Junxi',
  default_timelock_eta: '2026-07-10',
  cert_tasks: {
    '8': { label: 'Cert #8 Treasury Spend Execute', mission: 'Governance Lifecycle', blocked_by: 'Timelock' },
    '9': { label: 'Cert #9 Unstake', mission: 'Identity Stake Lifecycle', blocked_by: null },
  },
  subtrack_tasks: {
    '2C': { label: 'G6 Cover/CDN — OCS provider/acquisition bindings', mission: 'Data Governance / CMS / COS' },
  },
};

const blockers = ctx.extractBlockers();
const phase1 = ctx.assessPhase1();
const phase2 = ctx.assessPhase2(blockers);
const prerequisite = ctx.assessPrerequisiteReview();
const phase3 = ctx.assessPhase3();
const metrics = ctx.buildRealMetrics(blockers);
const today = ctx.buildTodayFocus(phase2, blockers, CONFIG);

function readGovernanceFreeze() {
  return ctx.readJson('evidence/GO_production_readiness/governance-freeze/GOVERNANCE-FREEZE-MANIFEST-LATEST.json');
}

const governanceFreeze = readGovernanceFreeze();

const dashboard = {
  schema: 'traveltrust.project_dashboard.v3',
  title: 'TravelTrust Project Dashboard',
  recorded_utc: new Date().toISOString(),
  discipline: 'Status-only — no progress percentages. Update after each Cert/UAT/evidence item.',
  governance_freeze: governanceFreeze?.verdict === 'GOVERNANCE_FREEZE_ACTIVE'
    ? {
        verdict: governanceFreeze.verdict,
        scope: 'governance_layer_structure_only',
        model: 'structure_frozen_state_continues',
        governance_version: 'production_release_governance_v1',
        governance_lifecycle: 'COMPLETE',
        governance_status: 'FROZEN',
        governance_mode: 'OPERATE',
        governance_compatibility: 'PATCH_ONLY',
        governance_root: 'registry/production-governance-principles.v1.yaml',
        mode: 'operate',
        refresh: 'node scripts/dev/refresh-governance-status.cjs',
      }
    : null,
  layers: {
    layer_1_executive: {
      phase_1: phase1,
      phase_2: { id: phase2.id, name: phase2.name, status: phase2.status },
      phase_3_prerequisite_review: prerequisite,
      phase_3: phase3,
    },
    layer_2_sub_tracks: phase2.sub_tracks.map((t) => ({
      id: t.id,
      label: `②-${t.id.slice(1)} ${t.short}`,
      status: t.status,
      drag: t.id === phase2.drag_track.id,
    })),
    layer_3_today: today,
    layer_4_blockers: blockers,
    layer_5_real_metrics: metrics,
  },
  drag_track: `②-${phase2.drag_track.id.slice(1)} ${phase2.drag_track.short}`,
};

function renderMd(d) {
  const L = d.layers;
  return [
    '# TravelTrust Project Dashboard',
    '',
    `**Updated:** ${d.recorded_utc}`,
    '',
    '_Status only — no progress percentages (Timelock wait ≠ project idle)._',
    '',
    d.governance_freeze
      ? `- **${d.governance_freeze.governance_version}** · Lifecycle \`${d.governance_freeze.governance_lifecycle}\` · \`${d.governance_freeze.governance_status}\` · Mode \`${d.governance_freeze.governance_mode}\` · Patch only · \`${d.governance_freeze.refresh}\``
      : null,
    d.governance_freeze ? '' : null,
    '## Layer 1 · Executive',
    '',
    `- **Phase ① ${L.layer_1_executive.phase_1.name}** — \`${L.layer_1_executive.phase_1.status}\``,
    `- **Phase ② ${L.layer_1_executive.phase_2.name}** — \`${L.layer_1_executive.phase_2.status}\``,
    `- **${L.layer_1_executive.phase_3_prerequisite_review.name}** — \`${L.layer_1_executive.phase_3_prerequisite_review.status}\`${L.layer_1_executive.phase_3_prerequisite_review.reviews ? ` (${L.layer_1_executive.phase_3_prerequisite_review.reviews} reviews` : ''}${L.layer_1_executive.phase_3_prerequisite_review.sub_checks ? ` · ${L.layer_1_executive.phase_3_prerequisite_review.sub_checks}` : ''}${L.layer_1_executive.phase_3_prerequisite_review.reviews ? ')' : ''}${L.layer_1_executive.phase_3_prerequisite_review.r06 ? ` · R06 ${L.layer_1_executive.phase_3_prerequisite_review.r06}` : ''}${L.layer_1_executive.phase_3_prerequisite_review.note ? ` — _${L.layer_1_executive.phase_3_prerequisite_review.note}_` : ''}`,
    `- **Phase ③ ${L.layer_1_executive.phase_3.name}** — \`${L.layer_1_executive.phase_3.status}\``,
    '',
    '## Layer 2 · Sub-tracks',
    '',
    ...L.layer_2_sub_tracks.map((t) => `- **${t.label}** — \`${t.status}\`${t.drag ? ' ← **focus**' : ''}`),
    '',
    '## Layer 3 · TODAY',
    '',
    '| | |',
    '|---|---|',
    `| TODAY | ${L.layer_3_today.today} |`,
    `| Current Focus | ${L.layer_3_today.current_focus} |`,
    `| Mission | ${L.layer_3_today.mission} |`,
    `| Task | ${L.layer_3_today.task} |`,
    `| Blocked | ${L.layer_3_today.blocked_by || '—'} |`,
    `| Waiting Reason | ${L.layer_3_today.waiting_reason || '—'} |`,
    `| ETA | ${L.layer_3_today.eta || '—'} |`,
    `| Next | ${L.layer_3_today.next} |`,
    `| Owner | ${L.layer_3_today.owner} |`,
    '',
    '## Layer 4 · Blockers',
    '',
    `**P0 (${L.layer_4_blockers.P0.count})**`,
    ...(L.layer_4_blockers.P0.items.length ? L.layer_4_blockers.P0.items.map((b) => `- [ ] ${b.title}`) : ['- _(none)_']),
    '',
    `**P1 (${L.layer_4_blockers.P1.count})**`,
    ...L.layer_4_blockers.P1.items.map((b) => `- [ ] ${b.title}`),
    '',
    '## Layer 5 · Real Metrics',
    '',
    '| Metric | Count |',
    '|--------|-------|',
    `| Open P0 | ${L.layer_5_real_metrics.open_p0} |`,
    `| Open P1 | ${L.layer_5_real_metrics.open_p1} |`,
    `| Open Cert | ${L.layer_5_real_metrics.open_cert} |`,
    `| Open Evidence | ${L.layer_5_real_metrics.open_evidence} |`,
    '',
    '---',
    '**Fixed entry:** `node scripts/dev/dashboard.cjs`',
    'Web3: `node scripts/dev/run-web3-dashboard.cjs` · Ops: `node scripts/dev/run-operations-dashboard.cjs`',
  ].filter((line) => line !== null).join('\n');
}

const md = renderMd(dashboard);
ctx.writeArtifacts(EVID_ROOT, STAMP, { name: 'PROJECT-DASHBOARD-LATEST.json', data: dashboard }, { name: 'PROJECT-DASHBOARD-LATEST.md', content: md });
ctx.writeArtifacts(EVID_ROOT, STAMP, { name: 'PHASE-DASHBOARD-LATEST.json', data: dashboard }, { name: 'PHASE-DASHBOARD-LATEST.md', content: md });
console.log(md);
