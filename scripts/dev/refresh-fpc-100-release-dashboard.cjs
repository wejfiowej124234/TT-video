#!/usr/bin/env node
/**
 * TravelTrust Release Dashboard — multi-pillar TT_FULL_PRODUCTION_CERTIFICATION rollup.
 *
 *   node scripts/dev/refresh-fpc-100-release-dashboard.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const REGISTRY_PATH = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');
const RISK_PATH = path.join(ROOT, 'registry/fpc-100-risk-register.v1.yaml');

const MATRIX = path.join(EVID, 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json');
const REGISTRY_ROLLUP = path.join(EVID, 'FPC-100-REGISTRY-LATEST.json');
const OUT_JSON = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
const OUT_MD = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.md');

function readJson(p, fb = null) {
  if (!fs.existsSync(p)) return fb;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadBatchVerdict(id) {
  const f = path.join(EVID, `FPC-100-BATCH-${id}-LATEST.json`);
  const b = readJson(f);
  if (!b) return { verdict: 'NOT_STARTED', pass: false, human_verified: false, release_blocker: 'NO' };
  return {
    verdict: b.verdict || 'NOT_STARTED',
    pass: !!b.pass,
    human_verified: !!b.human_verified,
    release_blocker: b.release_blocker || 'NO',
    expires_at_utc: b.expires_at_utc,
    certification_frozen: !!b.certification_frozen,
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

function parseSimpleYamlList(text, key) {
  const m = text.match(new RegExp(`${key}:\\s*\\n([\\s\\S]*?)(\\n\\w|$)`));
  return m ? m[1] : '';
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
  pages: { done: l1Done, target: targets.pages || totalPages, pct: targets.pages ? (l1Done / targets.pages) * 100 : 0 },
  api_contracts: { done: apiDone, target: targets.api_contracts, pct: targets.api_contracts ? (apiDone / targets.api_contracts) * 100 : 0 },
  business_corridors: { done: corridorsDone, target: targets.business_corridors, pct: targets.business_corridors ? (corridorsDone / targets.business_corridors) * 100 : 0 },
  rbac_probes: { done: rbacDone, target: targets.rbac_probes, pct: targets.rbac_probes ? (rbacDone / targets.rbac_probes) * 100 : 0 },
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

const expiredBatches = [];
for (const f of fs.readdirSync(EVID).filter((x) => /^FPC-100-BATCH-.+-LATEST\.json$/.test(x))) {
  const b = readJson(path.join(EVID, f));
  if (!b?.expires_at_utc) continue;
  if (Date.now() > Date.parse(b.expires_at_utc)) expiredBatches.push(b.batch_id);
}

const pillarValues = Object.values(pillars);
const allPillarsPass = pillarValues.every((v) => v === 'PASS');
const coverage100 = Object.values(coverage).every((c) => c.done >= c.target && c.target > 0);
const blockers = pillarValues.includes('FAIL') || pendingRisks.length > 0 || expiredBatches.length > 0;

const verdict = allPillarsPass && coverage100 && !blockers ? 'PASS' : pillarValues.some((v) => v === 'FAIL') ? 'FAIL' : 'NOT_STARTED';

const dashboard = {
  schema: 'traveltrust.fpc_100_release_dashboard.v2',
  framework: 'TravelTrust Full Production Certification Framework',
  machine_key: 'TT_FULL_PRODUCTION_CERTIFICATION',
  timestamp_utc: new Date().toISOString(),
  code_anchor_commit: registry.code_anchor_commit || 'e9df0a73f63b5ebccc7c17266f000c3bf867d872',
  verdict,
  pass: verdict === 'PASS',
  pillars,
  evidence_coverage: coverage,
  accepted_risks: acceptedRisks,
  pending_risks: pendingRisks,
  expired_batches: expiredBatches,
  certification_governance: {
    freeze_doc: 'FPC-CERTIFICATION-GOVERNANCE-v1.md',
    risk_register: 'registry/fpc-100-risk-register.v1.yaml',
  },
  detail_rows: [
    { label: 'Pages (L1)', display: `${l1Done} / ${totalPages}`, verdict: l1Done === totalPages ? 'PASS' : 'IN_PROGRESS' },
    { label: 'UI (L2)', display: `${uiDone} / ${totalPages}`, verdict: uiDone === totalPages ? 'PASS' : 'NOT_STARTED' },
    { label: 'CX (L2.5)', display: `${cxPass} / ${totalPages}`, verdict: cxPass === totalPages ? 'PASS' : 'NOT_STARTED' },
  ],
};

fs.mkdirSync(EVID, { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(dashboard, null, 2) + '\n');

const md = [
  '# TravelTrust · Release Dashboard',
  '',
  '**Framework:** TravelTrust Full Production Certification  ',
  `**Machine key:** \`TT_FULL_PRODUCTION_CERTIFICATION\`  `,
  `**Verdict:** **${verdict}**  `,
  `**Updated:** ${dashboard.timestamp_utc}`,
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
  ...Object.entries(coverage).map(([k, c]) => `| ${k} | ${c.done} / ${c.target} |`),
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
  ...(expiredBatches.length ? [`## Expired Batches (re-cert required)\n\n${expiredBatches.map((b) => `- ${b}`).join('\n')}\n`, ''] : []),
  '---',
  '',
  `**TT_FULL_PRODUCTION_CERTIFICATION:** \`${verdict}\``,
  '',
].join('\n');
fs.writeFileSync(OUT_MD, md);

console.log('TT_FULL_PRODUCTION_CERTIFICATION:', verdict);
console.log('DASHBOARD_JSON:', OUT_JSON);
