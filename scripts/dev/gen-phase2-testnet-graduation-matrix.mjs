#!/usr/bin/env node
/**
 * TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD · graduation-matrix.v1.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
function arg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const evidDir = arg('--evid-dir', '.');
const stamp = arg('--stamp', new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z');
const api = arg('--api', 'https://tt-api-staging.fly.dev');
const openP0 = Number(arg('--open-p0', '0'));
const openP1 = Number(arg('--open-p1', '2'));
const readiness = Number(arg('--readiness', '97'));

const dimensions = [
  { id: 'A1', name: 'Happy Path' },
  { id: 'A2', name: 'Exception / degraded' },
  { id: 'A3', name: 'RBAC / permission boundary' },
  { id: 'A4', name: 'State migration' },
  { id: 'A5', name: 'Recovery chain' },
  { id: 'A6', name: 'Long soak (72h)' },
  { id: 'A7', name: 'Indexer / Reconcile' },
  { id: 'A8', name: 'Human / browser UAT' },
  { id: 'A9', name: 'Evidence chain' },
];

const domains = [
  { id: 'G01', name: 'Admin RBAC', tn: ['TN-P0-001', 'TN-P1-001'] },
  { id: 'G02', name: 'Six-role HAT', tn: ['TN-P1-007', 'TN-P1-008'] },
  { id: 'G03', name: 'Multi-identity', tn: ['TN-P1-007', 'TN-P1-008'] },
  { id: 'G04', name: 'Orders corridor', tn: ['P2Exec'] },
  { id: 'G05', name: 'Provider onboarding', tn: ['TN-P1-002'] },
  { id: 'G06', name: 'Escrow WEB3', tn: ['TN-P1-006'] },
  { id: 'G07', name: 'Acquisition PD-009', tn: ['TN-P1-003'] },
  { id: 'G08', name: 'Steward stake', tn: ['TN-P1-004'] },
  { id: 'G09', name: 'Governance', tn: ['Closing-Gap-C-GOV'] },
  { id: 'G10', name: 'Community C1-C12', tn: ['C1-C12'] },
  { id: 'G11', name: 'Stripe PSP', tn: ['TN-P1-005'] },
  { id: 'G12', name: 'Indexer Reconcile', tn: ['TN-P1-010'] },
];

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function evidenceGlob(prefix) {
  const base = path.join(process.cwd(), 'evidence/GO_phase2_testnet_perfect_validation');
  if (!fs.existsSync(base)) return null;
  const hits = fs
    .readdirSync(base)
    .filter((d) => d.startsWith(prefix))
    .sort()
    .reverse();
  return hits[0] ? path.join(base, hits[0]) : null;
}

function evalTnP010GraduationGate() {
  const r = spawnSync(
    'node',
    [
      path.join(process.cwd(), 'scripts/dev/lib/tn-p1-010-graduation-gate.mjs'),
      '--root',
      process.cwd(),
      '--status-only',
    ],
    { encoding: 'utf8' },
  );
  try {
    return JSON.parse((r.stdout || '').trim() || '{}');
  } catch {
    return { pass: false, state: 'no', note: 'tn-p1-010 graduation gate eval failed' };
  }
}

function cellStatus(domainId, dimId) {
  const closed = {
    G01: ['A1', 'A3', 'A8', 'A9'],
    G02: ['A1', 'A3', 'A8', 'A9'],
    G03: ['A1', 'A3', 'A8', 'A9'],
    G04: ['A1', 'A4', 'A9'],
    G05: ['A1', 'A9'],
    G06: ['A1', 'A4', 'A7', 'A9'],
    G07: ['A1', 'A4', 'A9'],
    G08: ['A1', 'A9'],
    G09: ['A1', 'A9'],
    G10: ['A1', 'A8', 'A9'],
    G11: ['A1', 'A9'],
    G12: ['A5', 'A7', 'A9'],
  };
  const partial = {
    G02: { A3: 'Publish Hub L5 not on staging FE' },
    G06: { A7: 'FeeRouter distribute deferred · TN-P1-010 OPEN' },
    G08: { A1: 'live Sepolia stake blocked · fork write PASS · DEFER live TTG approve' },
    G09: { A1: 'on-chain execute Owner-only · staging API PASS' },
    G07: { A1: 'mock bond + mock-pay · ≠ ③' },
  };
  const open = {
    // G12 A5/A7 resolved live via probe-indexer-reconcile.json in cell loop below
  };
  const defer = {
    G08: { A1: '③ mainnet stake / TTG redeploy' },
  };

  if (open[domainId]?.[dimId]) {
    return { status: 'OPEN', note: open[domainId][dimId], blocking: true };
  }
  if (domainId === 'G04' || domainId === 'G06' || domainId === 'G11') {
    if (dimId === 'A6') {
      const soak = readJson(path.join(evidDir, 'probe-p2fc-soak.json'));
      const done = soak?.completed === 1;
      return done
        ? { status: 'PASS', note: 'P2FC COMPLETED.json', blocking: false }
        : {
            status: 'OPEN',
            note: 'TN-P1-009 · 72h soak INFLIGHT/NOT STARTED',
            blocking: false,
          };
    }
  }
  if (partial[domainId]?.[dimId]) {
    const isDefer = defer[domainId]?.[dimId];
    return {
      status: isDefer ? 'DEFER_③' : 'PARTIAL',
      note: partial[domainId][dimId],
      blocking: !isDefer && domainId === 'G12',
    };
  }
  if ((closed[domainId] || []).includes(dimId)) {
    return { status: 'PASS', note: 'Burn-down evidence on file', blocking: false };
  }
  if (dimId === 'A2') {
    return { status: 'PARTIAL', note: 'Spot checks only · no full exception matrix', blocking: false };
  }
  if (dimId === 'A5' && domainId !== 'G12') {
    return { status: 'PARTIAL', note: 'Runbook referenced · not full reorg drill', blocking: false };
  }
  if (dimId === 'A6' && !['G04', 'G06', 'G11'].includes(domainId)) {
    return { status: 'PASS', note: 'N/A for domain', blocking: false };
  }
  if (dimId === 'A7' && domainId !== 'G12' && domainId !== 'G06') {
    return { status: 'PASS', note: 'N/A', blocking: false };
  }
  if (dimId === 'A8' && !['G01', 'G02', 'G03', 'G10'].includes(domainId)) {
    return { status: 'PARTIAL', note: 'API-only domains', blocking: false };
  }
  return { status: 'PARTIAL', note: '—', blocking: false };
}

const recon = readJson(path.join(evidDir, 'probe-indexer-reconcile.json'));
const tn010Graduation = evalTnP010GraduationGate();
const deepProbe = readJson(path.join(evidDir, 'probe-deep-closure.json'));
const compound = recon?.reconcile_compound_pass === true;
const missing = recon?.orders_projection_reconcile_gate?.breakdown?.missing_projection ?? null;
const tnP010GraduationPass = tn010Graduation.pass === true;

const missingCoverage = deepProbe?.summary?.missing_coverage ?? null;
const evidenceGap = deepProbe?.summary?.evidence_gap ?? null;
const deepTracks = deepProbe?.tracks ?? [];

const enterpriseCoveragePct = deepProbe?.summary?.enterprise_coverage_pct ?? deepProbe?.enterprise_closure?.coverage_pct ?? null;
const operationalReadinessPct =
  deepProbe?.summary?.operational_readiness_pct ?? deepProbe?.operational_readiness?.coverage_pct ?? null;
const fullClosureCoveragePct = deepProbe?.summary?.full_closure_coverage_pct ?? null;
const surfaceCoveragePct = deepProbe?.summary?.surface_coverage_pct ?? deepProbe?.full_surface_coverage?.surface_coverage_pct ?? null;
const untestedUi = deepProbe?.summary?.untested_ui_element ?? deepProbe?.full_surface_coverage?.untested_ui_element ?? null;
const untestedActions = deepProbe?.summary?.untested_user_action ?? deepProbe?.full_surface_coverage?.untested_user_action ?? null;
const governanceClosurePct = deepProbe?.summary?.governance_closure_pct ?? deepProbe?.governance_closure?.coverage_pct ?? null;

const cells = [];
for (const d of domains) {
  for (const a of dimensions) {
    let c = cellStatus(d.id, a.id);
    if (d.id === 'G12' && a.id === 'A7' && recon && !recon.error && !recon.skipped) {
      c = compound && missing === 0
        ? { status: 'PASS', note: 'live reconcile compound_pass', blocking: false }
        : { status: 'OPEN', note: `compound=${compound} missing=${missing}`, blocking: true };
    }
    if (d.id === 'G12' && a.id === 'A5' && recon && !recon.error && !recon.skipped) {
      c =
        compound && missing === 0
          ? { status: 'PASS', note: 'TN-P1-010 R1 backfill + replay/reconcile closed', blocking: false }
          : { status: 'OPEN', note: `recovery reconcile compound=${compound}`, blocking: true };
    }
    cells.push({
      domain: d.id,
      domain_name: d.name,
      dimension: a.id,
      dimension_name: a.name,
      status: c.status,
      note: c.note,
      blocking: c.blocking,
    });
  }
}

const blockingOpen = cells.filter((c) => c.blocking && c.status !== 'DEFER_③').length;
const soakProbe = readJson(path.join(evidDir, 'probe-p2fc-soak.json'));
const soakDone = soakProbe?.completed === 1;

function trackCountsForGraduation(track) {
  if (track.status === 'PASS') return true;
  if (!soakDone && track.soak_deferred) return true;
  return false;
}
const perfectValidationGo = openP0 === 0 && openP1 === 0 && readiness >= 100;

const gates = {
  open_testnet_p0: openP0,
  open_testnet_p1: openP1,
  tt_phase2_readiness: readiness,
  p2fc_soak_completed: soakDone,
  indexer_compound_pass: compound,
  tn_p1_010_graduation_pass: tnP010GraduationPass,
  missing_projection: missing,
  perfect_validation_go: perfectValidationGo,
  deep_closure_missing_coverage: missingCoverage,
  deep_closure_evidence_gap: evidenceGap,
  enterprise_coverage_pct: enterpriseCoveragePct,
  operational_readiness_pct: operationalReadinessPct,
  full_closure_coverage_pct: fullClosureCoveragePct,
  surface_coverage_pct: surfaceCoveragePct,
  untested_ui_element: untestedUi,
  untested_user_action: untestedActions,
  governance_closure_pct: governanceClosurePct,
};

const deepClosureReady =
  missingCoverage === 0 &&
  evidenceGap === 0 &&
  deepTracks.length === 24 &&
  deepTracks.every((t) => trackCountsForGraduation(t)) &&
  fullClosureCoveragePct === 100 &&
  surfaceCoveragePct === 100 &&
  untestedUi === 0 &&
  untestedActions === 0;

let graduationVerdict = 'OPEN';
if (
  openP0 === 0 &&
  openP1 === 0 &&
  readiness >= 100 &&
  blockingOpen === 0 &&
  soakDone &&
  compound &&
  missing === 0 &&
  tnP010GraduationPass &&
  deepClosureReady
) {
  graduationVerdict = 'CLOSED';
} else if (blockingOpen === 0 && openP1 <= 2 && missingCoverage !== null) {
  graduationVerdict = 'PARTIAL';
}

function ownerSignoffComplete(dir) {
  const p = path.join(dir, 'OWNER-SIGNOFF.md');
  if (!fs.existsSync(p)) return false;
  try {
    const text = fs.readFileSync(p, 'utf8');
    return /TT_TESTNET_GRADUATION:\s*CLOSED/.test(text);
  } catch {
    return false;
  }
}

const ownerSignoffDone = ownerSignoffComplete(evidDir);
const l5ForbiddenReasons = [];
if (openP0 !== 0) l5ForbiddenReasons.push('open_testnet_p0>0');
if (openP1 !== 0) l5ForbiddenReasons.push('open_testnet_p1>0');
if (readiness < 100) l5ForbiddenReasons.push('tt_phase2_readiness<100');
if (blockingOpen !== 0) l5ForbiddenReasons.push('blocking_open>0');
if (missingCoverage !== 0) l5ForbiddenReasons.push('missing_coverage>0');
if (evidenceGap !== 0) l5ForbiddenReasons.push('evidence_gap>0');
if (fullClosureCoveragePct !== 100) l5ForbiddenReasons.push('full_closure_coverage_pct<100');
if (surfaceCoveragePct !== 100) l5ForbiddenReasons.push('surface_coverage_pct<100');
if (untestedUi !== 0) l5ForbiddenReasons.push('untested_ui_element>0');
if (untestedActions !== 0) l5ForbiddenReasons.push('untested_user_action>0');
if (!compound) l5ForbiddenReasons.push('reconcile_compound_pass=false');
if (!tnP010GraduationPass) l5ForbiddenReasons.push('tn_p1_010_post_soak_graduation_gate');
if (missing !== 0) l5ForbiddenReasons.push('missing_projection>0');
if (!soakDone) l5ForbiddenReasons.push('p2fc_soak_72h_staging_not_completed');
if (!perfectValidationGo) l5ForbiddenReasons.push('tt_testnet_perfect_validation_go_not_go');
if (graduationVerdict !== 'CLOSED') l5ForbiddenReasons.push('tt_testnet_graduation_not_closed');
if (!ownerSignoffDone) l5ForbiddenReasons.push('owner_signoff_incomplete');
if (deepTracks.length !== 24 || !deepTracks.every((t) => trackCountsForGraduation(t))) {
  l5ForbiddenReasons.push('d1_d24_not_all_pass');
}

const l5CompositeScoreEligible = l5ForbiddenReasons.length === 0;
const l5CompositeScore = l5CompositeScoreEligible ? 10 : null;
const l5CompositeScoreGrep = l5CompositeScoreEligible
  ? 'TT_PHASE2_L5_COMPOSITE_SCORE: 10'
  : 'TT_PHASE2_L5_COMPOSITE_SCORE: NOT_ELIGIBLE';

const matrix = {
  schema: 'traveltrust.phase2_testnet_graduation_matrix.v1.4',
  standard: 'TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD',
  addendum: 'Deep + Enterprise + Operational + Governance + Full Surface v4',
  stamp,
  phase_scope: '② testnet',
  api,
  graduation_verdict: graduationVerdict,
  l5_composite_score: l5CompositeScore,
  l5_composite_score_eligible: l5CompositeScoreEligible,
  l5_composite_score_forbidden_reasons: l5ForbiddenReasons,
  l5_composite_score_grep: l5CompositeScoreGrep,
  owner_signoff_complete: ownerSignoffDone,
  gates,
  dimensions,
  domains,
  cells,
  deep_closure: deepProbe
    ? {
        execution_order: deepProbe.execution_order || 'D1→D24',
        tracks: deepTracks,
        enterprise_closure: deepProbe.enterprise_closure ?? null,
        operational_readiness: deepProbe.operational_readiness ?? null,
        governance_closure: deepProbe.governance_closure ?? null,
        full_surface_coverage: deepProbe.full_surface_coverage ?? null,
        summary: {
          pass: deepProbe.summary?.pass ?? 0,
          partial: deepProbe.summary?.partial ?? 0,
          open: deepProbe.summary?.open ?? 0,
          tracks_total: deepProbe.summary?.tracks_total ?? deepTracks.length,
          missing_coverage: missingCoverage,
          evidence_gap: evidenceGap,
          deep_blocking: deepProbe.summary?.deep_blocking ?? null,
          enterprise_coverage_pct: enterpriseCoveragePct,
          operational_readiness_pct: operationalReadinessPct,
          governance_closure_pct: governanceClosurePct,
          full_closure_coverage_pct: fullClosureCoveragePct,
          surface_coverage_pct: surfaceCoveragePct,
          untested_ui_element: untestedUi,
          untested_user_action: untestedActions,
          ready_for_owner_signoff:
            blockingOpen === 0 &&
            missingCoverage === 0 &&
            evidenceGap === 0 &&
            deepClosureReady &&
            fullClosureCoveragePct === 100 &&
            surfaceCoveragePct === 100 &&
            untestedUi === 0 &&
            untestedActions === 0,
        },
      }
    : {
        execution_order: 'D1→D24',
        tracks: [],
        enterprise_closure: null,
        operational_readiness: null,
        governance_closure: null,
        full_surface_coverage: null,
        summary: {
          pass: 0,
          partial: 0,
          open: 24,
          tracks_total: 24,
          missing_coverage: 24,
          evidence_gap: null,
          deep_blocking: 24,
          enterprise_coverage_pct: 0,
          operational_readiness_pct: 0,
          governance_closure_pct: 0,
          full_closure_coverage_pct: 0,
          surface_coverage_pct: 0,
          untested_ui_element: null,
          untested_user_action: null,
          ready_for_owner_signoff: false,
        },
      },
  summary: {
    cells_total: cells.length,
    pass: cells.filter((c) => c.status === 'PASS').length,
    partial: cells.filter((c) => c.status === 'PARTIAL').length,
    open: cells.filter((c) => c.status === 'OPEN').length,
    defer_3: cells.filter((c) => c.status === 'DEFER_③').length,
    blocking_open: blockingOpen,
    l5_composite_score: l5CompositeScore,
    l5_composite_score_eligible: l5CompositeScoreEligible,
  },
  evidence_anchors: {
    burn_down_report: 'docs/runbook/TESTNET-PERFECT-VALIDATION-REPORT.md',
    tn_p1_010: tnP010GraduationPass
      ? tn010Graduation.report_dir || evidenceGlob('tn-p1-010')
      : 'OPEN (post-soak @ freeze SHA required)',
    tn_p1_009_soak: 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json',
  },
};

fs.writeFileSync(path.join(evidDir, 'graduation-matrix.v1.json'), JSON.stringify(matrix, null, 2) + '\n');

const md = `# Phase ② Testnet Graduation Audit · ${stamp}

**Standard:** [TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md](../../docs/runbook/TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md)

| 项 | 值 |
|----|-----|
| **TT_TESTNET_GRADUATION** | **${graduationVerdict === 'CLOSED' ? 'CLOSED' : 'OPEN'}** |
| **blocking_open** | ${blockingOpen} |
| **missing_coverage** | ${missingCoverage ?? 'n/a'} |
| **evidence_gap** | ${evidenceGap ?? 'n/a'} |
| **enterprise_coverage_pct** | ${enterpriseCoveragePct ?? 'n/a'}% |
| **operational_readiness_pct** | ${operationalReadinessPct ?? 'n/a'}% |
| **full_closure_coverage_pct** | ${fullClosureCoveragePct ?? 'n/a'}% |
| **surface_coverage_pct** | ${surfaceCoveragePct ?? 'n/a'}% |
| **untested_ui_element** | ${untestedUi ?? 'n/a'} |
| **untested_user_action** | ${untestedActions ?? 'n/a'} |
| **Owner sign-off eligible** | ${matrix.deep_closure.summary.ready_for_owner_signoff ? 'YES (pending G-09)' : 'NO'} |
| **Open P0/P1** | ${openP0} / ${openP1} |
| **Readiness** | ${readiness}/100 |
| **P2FC soak** | ${soakDone ? 'COMPLETED' : 'OPEN'} |
| **Indexer compound** | ${compound} · missing=${missing} |
| **L5 composite (§14)** | ${l5CompositeScoreEligible ? '**10/10**' : '**NOT_ELIGIBLE**'} |
| **L5 forbidden reasons** | ${l5ForbiddenReasons.length ? l5ForbiddenReasons.join(' · ') : '—'} |

## Deep + Enterprise + Operational + Governance + Surface (D1→D24)

| 轨 | 状态 | gaps |
|----|------|------|
${deepTracks.map((t) => `| ${t.id} ${t.name} | ${t.status} | ${t.gaps?.length ? t.gaps.length : 0} |`).join('\n') || '| (probe missing) | OPEN | — |'}

**full_closure_coverage_pct:** ${fullClosureCoveragePct ?? 'n/a'}% · **surface_coverage_pct:** ${surfaceCoveragePct ?? 'n/a'}% · **untested_ui/action:** ${untestedUi ?? 'n/a'}/${untestedActions ?? 'n/a'}

## Gates

${Object.entries(gates)
  .map(([k, v]) => `- \`${k}\`: ${v}`)
  .join('\n')}

## Summary

- PASS: ${matrix.summary.pass} · PARTIAL: ${matrix.summary.partial} · OPEN: ${matrix.summary.open} · DEFER_③: ${matrix.summary.defer_3}

**诚实边界：** ② 审计 PASS **≠** ③ Production GO · **须** \`blocking_open=0\` · \`missing_coverage=0\` · \`evidence_gap=0\` **后** 方可 G-09 \`OWNER-SIGNOFF.md\`

${l5CompositeScoreGrep}

TT_PHASE2_TESTNET_CLOSURE_GOVERNANCE: MATRIX_${graduationVerdict}
`;

fs.writeFileSync(path.join(evidDir, 'GRADUATION-AUDIT-REPORT.md'), md);
console.log(`graduation-matrix: ${evidDir}/graduation-matrix.v1.json verdict=${graduationVerdict} blocking=${blockingOpen}`);
console.log(l5CompositeScoreGrep);
