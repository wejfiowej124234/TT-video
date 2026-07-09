#!/usr/bin/env node
/**
 * TravelTrust Release Dashboard — v3: Release Health · Version History · Release Decision.
 *
 *   node scripts/dev/refresh-fpc-100-release-dashboard.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const REGISTRY_PATH = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');
const RISK_PATH = path.join(ROOT, 'registry/fpc-100-risk-register.v1.yaml');
const VERSION_REG_PATH = path.join(ROOT, 'registry/fpc-100-version-registry.v1.yaml');
const { computeBurnDown, parseExecutionSequence } = require('./lib/fpc-batch-sequence.cjs');

const MATRIX = path.join(EVID, 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json');
const REGISTRY_ROLLUP = path.join(EVID, 'FPC-100-REGISTRY-LATEST.json');
const OUT_JSON = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
const OUT_MD = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.md');
const VERSION_OUT = path.join(EVID, 'FPC-100-VERSION-CERTIFICATION-LATEST.json');

function readJson(p, fb = null) {
  if (!fs.existsSync(p)) return fb;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadBatch(id) {
  const f = path.join(EVID, `FPC-100-BATCH-${id}-LATEST.json`);
  return readJson(f);
}

function loadBatchVerdict(id) {
  const b = loadBatch(id);
  if (!b) {
    return {
      verdict: 'NOT_STARTED',
      pass: false,
      human_verified: false,
      release_blocker: 'NO',
      ai_review: null,
    };
  }
  return {
    verdict: b.verdict || 'NOT_STARTED',
    pass: !!b.pass,
    human_verified: !!b.human_verified,
    release_blocker: b.release_blocker || 'NO',
    expires_at_utc: b.expires_at_utc,
    certification_frozen: !!b.certification_frozen,
    ai_review: b.ai_review || null,
    product_version: b.product_version || null,
  };
}

function pillarFromBatches(batchIds) {
  const states = batchIds.map((id) => loadBatchVerdict(id));
  if (states.some((s) => s.verdict === 'FAIL' || s.verdict === 'INVALIDATED' || s.release_blocker === 'YES')) {
    return 'FAIL';
  }
  if (states.some((s) => s.verdict === 'EXPIRED')) return 'EXPIRED';
  if (states.every((s) => s.pass || s.verdict === 'PASS' || s.verdict === 'PASS_WITH_WARN')) return 'PASS';
  if (states.some((s) => s.verdict !== 'NOT_STARTED')) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

function parseCoverageTargets() {
  const t = fs.existsSync(REGISTRY_PATH) ? fs.readFileSync(REGISTRY_PATH, 'utf8') : '';
  const g = (k) => {
    const m = t.match(new RegExp(`${k}:\\s*(\\d+)`));
    return m ? parseInt(m[1], 10) : 0;
  };
  return {
    pages: g('pages'),
    api_contracts: g('api_contracts'),
    business_corridors: g('business_corridors'),
    rbac_probes: g('rbac_probes'),
  };
}

function parseRisks() {
  if (!fs.existsSync(RISK_PATH)) return [];
  const raw = fs.readFileSync(RISK_PATH, 'utf8');
  const risks = [];
  const blocks = raw.split(/\n  - id:/).slice(1);
  for (const block of blocks) {
    const id = block.match(/^ FPC-RISK-[^\n]+/)?.[0]?.trim();
    const title = block.match(/title: ([^\n]+)/)?.[1];
    const level = block.match(/level: (\w+)/)?.[1];
    const status = block.match(/status: (\w+)/)?.[1];
    if (id) risks.push({ id: id.replace(/^ /, ''), title, level, status });
  }
  return risks;
}

function parseVersionRegistry() {
  if (!fs.existsSync(VERSION_REG_PATH)) {
    return { current_product_version: 'v1.0', release_history: [] };
  }
  const raw = fs.readFileSync(VERSION_REG_PATH, 'utf8');
  const current = raw.match(/current_product_version:\s*(\S+)/)?.[1] || 'v1.0';
  const history = [];
  const histStart = raw.indexOf('release_history:');
  if (histStart >= 0) {
    const tail = raw.slice(histStart);
    const endIdx = tail.search(/\n# Template|\nversion_certification_flow:/);
    const histBlock = endIdx >= 0 ? tail.slice(0, endIdx) : tail;
    const entries = histBlock.split(/\n  - product_version:/).slice(1);
    for (const e of entries) {
      const pv = e.match(/^ (\S+)/)?.[1];
      const status = e.match(/status: (\S+)/)?.[1];
      const fpc = e.match(/fpc_verdict: (\S+)/)?.[1];
      const decision = e.match(/tt_release_decision: (\S+)/)?.[1];
      if (pv) history.push({ product_version: pv, status, fpc_verdict: fpc, tt_release_decision: decision });
    }
  }
  return { current_product_version: current, release_history: history };
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 1000) / 10;
}

function countRegistryBatches() {
  if (!fs.existsSync(REGISTRY_PATH)) return 41;
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return (raw.match(/^  - id: B/gm) || []).length || 41;
}

function computeReleaseDecision(pillars, coverage, pendingRisks, acceptedRisks, expiredBatches, fpcVerdict) {
  const pillarVals = Object.values(pillars);
  if (pillarVals.includes('FAIL') || expiredBatches.length > 0) return 'NO_GO';
  if (pendingRisks.length > 0) return 'NO_GO';
  if (fpcVerdict === 'PASS' && pillarVals.every((v) => v === 'PASS')) {
    const covOk = Object.values(coverage).every((c) => c.done >= c.target && c.target > 0);
    if (covOk) return 'GO';
  }
  if (acceptedRisks.length > 0 && fpcVerdict !== 'FAIL' && !pillarVals.includes('FAIL')) {
    return 'CONDITIONAL_GO';
  }
  return 'NOT_STARTED';
}

const matrix = readJson(MATRIX, { pages: [], coverage_summary: {} });
const registry = readJson(REGISTRY_ROLLUP, { batches: [], l5_domains: {} });
const targets = parseCoverageTargets();
const totalPages = matrix.coverage_summary?.pages_total || matrix.pages?.length || targets.pages || 202;

const l1Done = matrix.pages.filter((p) => p.layer1_surface_coverage?.page_tsx === 'PASS').length;
const uiDone = matrix.pages.filter((p) => p.layer2_l5_scores?.ui != null).length;
const cxPass = matrix.pages.filter(
  (p) => p.layer2_5_customer_experience?.certification_verdict === 'PASS'
).length;
const apiDone = parseInt(String(registry.l5_api_contract_pct || '0').replace('%', ''), 10) || 0;
const rbacDone = registry.rbac_probes_certified || 0;
const corridorsDone = registry.business_corridors_certified || 0;

const coverage = {
  pages: { done: l1Done, target: targets.pages || totalPages, pct: pct(l1Done, targets.pages || totalPages) },
  api_contracts: { done: apiDone, target: targets.api_contracts, pct: pct(apiDone, targets.api_contracts) },
  business_corridors: { done: corridorsDone, target: targets.business_corridors, pct: pct(corridorsDone, targets.business_corridors) },
  rbac_probes: { done: rbacDone, target: targets.rbac_probes, pct: pct(rbacDone, targets.rbac_probes) },
};

const pillars = {
  technical: pillarFromBatches(['B00', 'B11', 'B23', 'B24', 'B32']),
  product: pillarFromBatches(['B25-C1', 'B26']),
  operations: pillarFromBatches(['B33', 'B09']),
  content: pillarFromBatches(['B30', 'B12']),
  business: pillarFromBatches(['B41']),
  security: pillarFromBatches(['B17']),
  performance: pillarFromBatches(['B16']),
  truthfulness: pillarFromBatches(['B36', 'B01']),
  deployment: pillarFromBatches(['B40']),
};

const humanRequired = ['B26', 'B10', 'B33', 'B35', 'B40', 'B41'];
const humanStates = humanRequired.map((id) => loadBatchVerdict(id));
const humanPass = humanStates.every((s) => s.human_verified) && humanStates.some((s) => s.pass || s.verdict === 'PASS');
pillars.human_verification = humanPass ? 'PASS' : humanStates.some((s) => s.human_verified) ? 'IN_PROGRESS' : 'NOT_STARTED';

const risks = parseRisks();
const pendingRisks = risks.filter((r) => r.status === 'PENDING');
const acceptedRisks = risks.filter((r) => r.status === 'ACCEPTED');

const batchFiles = fs.readdirSync(EVID).filter((x) => /^FPC-100-BATCH-.+-LATEST\.json$/.test(x));
const allBatches = batchFiles.map((f) => readJson(path.join(EVID, f))).filter(Boolean);

const expiredBatches = [];
const blockedBatches = [];
const aiReviewRows = [];
let humanVerifiedCount = 0;
let humanRequiredDone = 0;
let aiReviewPassCount = 0;
let certifiedPassCount = 0;

for (const b of allBatches) {
  if (b.expires_at_utc && Date.now() > Date.parse(b.expires_at_utc)) expiredBatches.push(b.batch_id);
  if (b.release_blocker === 'YES') blockedBatches.push(b.batch_id);
  if (b.pass) certifiedPassCount += 1;
  if (b.human_verified) humanVerifiedCount += 1;
  if (humanRequired.includes(b.batch_id)) {
    if (b.human_verified) humanRequiredDone += 1;
  }
  if (b.ai_review?.verdict === 'PASS') aiReviewPassCount += 1;
  const ar = b.ai_review || { verdict: 'NOT_STARTED' };
  aiReviewRows.push({
    batch_id: b.batch_id,
    ai_review: ar,
    ai_display: ar.ai_reviewer || ar.review_type || 'NOT_STARTED',
    human_verified: !!b.human_verified,
    human_verifier: b.human_verifier || null,
  });
}

const totalBatchesTracked = countRegistryBatches();
const coveragePct =
  Object.values(coverage).reduce((s, c) => s + (c.target ? c.done / c.target : 0), 0) /
  Math.max(Object.keys(coverage).length, 1);

const releaseHealth = {
  certified_pct: pct(certifiedPassCount, totalBatchesTracked),
  expired_count: expiredBatches.length,
  blocked_count: blockedBatches.length,
  accepted_risks_count: acceptedRisks.length,
  coverage_pct: pct(coveragePct * 100, 100),
  human_verified_pct: pct(humanVerifiedCount, allBatches.length || 1),
  human_required_verified_pct: pct(humanRequiredDone, humanRequired.length),
  ai_review_pct: pct(aiReviewPassCount, allBatches.length || 1),
};

const changeImpact = readJson(path.join(EVID, 'FPC-100-CHANGE-IMPACT-LATEST.json'), null);
const versionReg = parseVersionRegistry();
const burnDown = computeBurnDown(parseExecutionSequence());

const pillarValues = Object.values(pillars);
const allPillarsPass = pillarValues.every((v) => v === 'PASS');
const coverage100 = Object.values(coverage).every((c) => c.done >= c.target && c.target > 0);
const blockers = pillarValues.includes('FAIL') || pendingRisks.length > 0 || expiredBatches.length > 0;

const fpcVerdict = allPillarsPass && coverage100 && !blockers ? 'PASS' : pillarValues.some((v) => v === 'FAIL') ? 'FAIL' : 'NOT_STARTED';

const ttReleaseDecision = computeReleaseDecision(
  pillars,
  coverage,
  pendingRisks,
  acceptedRisks,
  expiredBatches,
  fpcVerdict
);

const executiveSummary = {
  title: 'TravelTrust Release Summary',
  release_readiness_pct: burnDown.release_readiness_pct,
  release_readiness_key: 'TT_RELEASE_READINESS',
  product_version: versionReg.current_product_version,
  evidence_coverage_pct: releaseHealth.coverage_pct,
  batches: `${burnDown.contiguous_completed} / ${burnDown.total}`,
  batches_pass: burnDown.contiguous_completed,
  batches_total: burnDown.total,
  blockers: blockedBatches.length,
  pending_risks: pendingRisks.length,
  accepted_risks: acceptedRisks.length,
  next_required_batch: burnDown.next_required_batch,
  fpc_verdict: fpcVerdict,
  release_decision: ttReleaseDecision,
  governance: 'FROZEN @ v5',
  execution: 'ACTIVE · B00–B41 · No Batch Skip',
};

const dashboard = {
  schema: 'traveltrust.fpc_100_release_dashboard.v3',
  executive_summary: executiveSummary,
  framework: 'TravelTrust Full Production Certification Framework',
  framework_registry_version: 5,
  machine_key: 'TT_FULL_PRODUCTION_CERTIFICATION',
  release_decision_key: 'TT_RELEASE_DECISION',
  product_version: versionReg.current_product_version,
  timestamp_utc: new Date().toISOString(),
  code_anchor_commit: registry.code_anchor_commit || 'e9df0a73f63b5ebccc7c17266f000c3bf867d872',
  verdict: fpcVerdict,
  pass: fpcVerdict === 'PASS',
  tt_release_decision: ttReleaseDecision,
  release_readiness: {
    machine_key: 'TT_RELEASE_READINESS',
    pct: burnDown.release_readiness_pct,
    contiguous_completed: burnDown.contiguous_completed,
    total: burnDown.total,
  },
  burn_down: {
    completed: burnDown.completed,
    remaining: burnDown.remaining,
    total: burnDown.total,
    coverage_pct: burnDown.coverage_pct,
    next_required_batch: burnDown.next_required_batch,
    no_batch_skip_ok: burnDown.sequence_ok,
    skip_violations: burnDown.skip_violations,
  },
  pillars,
  release_health: releaseHealth,
  release_history: versionReg.release_history,
  evidence_coverage: coverage,
  accepted_risks: acceptedRisks,
  pending_risks: pendingRisks,
  expired_batches: expiredBatches,
  blocked_batches: blockedBatches,
  change_impact: changeImpact
    ? {
        any_invalidated: changeImpact.any_invalidated,
        invalidated: (changeImpact.batches || []).filter((b) => b.status === 'INVALIDATED').map((b) => b.batch_id),
      }
    : null,
  ai_review_summary: aiReviewRows,
  certification_governance: {
    freeze_doc: 'FPC-CERTIFICATION-GOVERNANCE-v1.md',
    risk_register: 'registry/fpc-100-risk-register.v1.yaml',
    version_registry: 'registry/fpc-100-version-registry.v1.yaml',
    change_impact_map: 'registry/fpc-100-change-impact-map.v1.json',
  },
  traceability_chain: ['requirement', 'spec', 'code', 'test', 'evidence', 'certification', 'release'],
  detail_rows: [
    { label: 'Pages (L1)', display: `${l1Done} / ${totalPages}`, verdict: l1Done === totalPages ? 'PASS' : 'IN_PROGRESS' },
    { label: 'UI (L2)', display: `${uiDone} / ${totalPages}`, verdict: uiDone === totalPages ? 'PASS' : 'NOT_STARTED' },
    { label: 'CX (L2.5)', display: `${cxPass} / ${totalPages}`, verdict: cxPass === totalPages ? 'PASS' : 'NOT_STARTED' },
  ],
};

const versionCert = {
  schema: 'traveltrust.fpc_100_version_certification.v1',
  timestamp_utc: dashboard.timestamp_utc,
  current_product_version: versionReg.current_product_version,
  code_anchor_commit: dashboard.code_anchor_commit,
  fpc_verdict: fpcVerdict,
  tt_release_decision: ttReleaseDecision,
  release_history: versionReg.release_history.map((row) => ({
    version: row.product_version,
    result: row.fpc_verdict || 'NOT_STARTED',
    release_decision: row.tt_release_decision || 'NOT_STARTED',
    status: row.status,
  })),
  note: 'Each product_version gets independent FPC run; history rows append on version close.',
};

fs.mkdirSync(EVID, { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(dashboard, null, 2) + '\n');
fs.writeFileSync(VERSION_OUT, JSON.stringify(versionCert, null, 2) + '\n');

const md = [
  '# TravelTrust · Release Dashboard',
  '',
  '## Executive Summary',
  '',
  `## Release Readiness · **${executiveSummary.release_readiness_pct}%**`,
  '',
  `_Owner daily metric · \`TT_RELEASE_READINESS\`_`,
  '',
  '| | |',
  '|---|---|',
  `| **Release Readiness** | **${executiveSummary.release_readiness_pct}%** |`,
  `| **Version** | ${executiveSummary.product_version} |`,
  `| **Next Batch** | ${executiveSummary.next_required_batch || '—'} |`,
  `| **Blockers** | ${executiveSummary.blockers} |`,
  `| **Accepted Risks** | ${executiveSummary.accepted_risks} |`,
  `| **Release Decision** | **${executiveSummary.release_decision}** |`,
  '',
  '## Burn-down',
  '',
  '| Metric | Value |',
  '|--------|-------|',
  `| Batches Completed | ${burnDown.contiguous_completed} / ${burnDown.total} |`,
  `| Remaining | ${burnDown.total - burnDown.contiguous_completed} |`,
  `| Batch Coverage | ${burnDown.coverage_pct}% |`,
  `| Evidence Coverage (pages/API/…) | ${releaseHealth.coverage_pct}% |`,
  '',
  '_Governance FROZEN @ v5 · Execution ACTIVE — CEO / Owner / Investor view_',
  '',
  '**Framework:** TravelTrust Full Production Certification (v5 · Governance Frozen)  ',
  `**Product version:** \`${versionReg.current_product_version}\`  `,
  `**Machine key:** \`TT_FULL_PRODUCTION_CERTIFICATION\`  `,
  `**FPC verdict:** **${fpcVerdict}**  `,
  `**Release decision:** \`TT_RELEASE_DECISION\` = **${ttReleaseDecision}**  `,
  `**Updated:** ${dashboard.timestamp_utc}`,
  '',
  '## Release Health',
  '',
  '| Metric | Value |',
  '|--------|-------|',
  `| Certified | ${releaseHealth.certified_pct}% |`,
  `| Expired | ${releaseHealth.expired_count} |`,
  `| Blocked | ${releaseHealth.blocked_count} |`,
  `| Accepted Risks | ${releaseHealth.accepted_risks_count} |`,
  `| Coverage | ${releaseHealth.coverage_pct}% |`,
  `| Human Verified | ${releaseHealth.human_verified_pct}% |`,
  `| AI Review PASS | ${releaseHealth.ai_review_pct}% |`,
  '',
  '## Release History (Version Certification)',
  '',
  '| Version | FPC Result | Release Decision |',
  '|---------|------------|------------------|',
  ...versionCert.release_history.map(
    (r) => `| ${r.version} | ${r.result} | ${r.release_decision} |`
  ),
  '',
  '## Pillars',
  '',
  '| Pillar | Verdict |',
  '|--------|---------|',
  ...Object.entries(pillars).map(([k, v]) => `| ${k.replace(/_/g, ' ')} | ${v} |`),
  '',
  '## Evidence Coverage',
  '',
  '| Dimension | Coverage |',
  '|-----------|----------|',
  ...Object.entries(coverage).map(([k, c]) => `| ${k} | ${c.done} / ${c.target} (${c.pct}%) |`),
  '',
  '## AI Review · Human Verification',
  '',
  '| Batch | AI | Human |',
  '|-------|----|-------|',
  ...aiReviewRows.map(
    (r) =>
      `| ${r.batch_id} | ${r.ai_review?.verdict || 'NOT_STARTED'} (${r.ai_display}) | ${r.human_verified ? 'PASS' : '—'} |`
  ),
  '',
  '## Accepted Risks',
  '',
  ...(acceptedRisks.length
    ? acceptedRisks.map((r) => `- **${r.id}** (${r.level}) · ${r.title} · ${r.status}`)
    : ['- _(none)_']),
  '',
  '## Pending Risks',
  '',
  ...(pendingRisks.length
    ? pendingRisks.map((r) => `- **${r.id}** (${r.level}) · ${r.title}`)
    : ['- _(none)_']),
  '',
  ...(changeImpact?.any_invalidated
    ? [
        '## Change Impact (invalidated batches)',
        '',
        ...(changeImpact.batches || [])
          .filter((b) => b.status === 'INVALIDATED')
          .map((b) => `- **${b.batch_id}** · ${(b.impacted_by_files || []).slice(0, 3).join(', ')}`),
        '',
      ]
    : []),
  ...(expiredBatches.length ? [`## Expired Batches\n\n${expiredBatches.map((b) => `- ${b}`).join('\n')}\n`, ''] : []),
  '---',
  '',
  `**TT_FULL_PRODUCTION_CERTIFICATION:** \`${fpcVerdict}\``,
  '',
  `**TT_RELEASE_DECISION:** \`${ttReleaseDecision}\``,
  '',
].join('\n');
fs.writeFileSync(OUT_MD, md);

console.log('TT_FULL_PRODUCTION_CERTIFICATION:', fpcVerdict);
console.log('TT_RELEASE_DECISION:', ttReleaseDecision);
console.log('TT_RELEASE_READINESS:', `${burnDown.release_readiness_pct}%`);
console.log('NEXT_BATCH:', burnDown.next_required_batch || 'ALL_DONE');
console.log('DASHBOARD_JSON:', OUT_JSON);
console.log('VERSION_CERT:', VERSION_OUT);
