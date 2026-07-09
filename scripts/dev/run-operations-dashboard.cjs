#!/usr/bin/env node
/**
 * Dashboard 3 · Operations Dashboard — user journeys (status only)
 */
const path = require('path');
const { createDashboardContext } = require('./lib/dashboard-common.cjs');
const { buildOperationsJourneys } = require('./lib/operations-journeys.cjs');

const ctx = createDashboardContext(path.join(__dirname, '../..'));
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ctx.ROOT, 'evidence/GO_production_readiness/operations-dashboard');

if (ctx.REFRESH) {
  ctx.runNode('run-phase2-production-validation.cjs');
}

const journeys = buildOperationsJourneys(ctx);
const blockers = ctx.extractBlockers();
const metrics = ctx.buildRealMetrics(blockers);

const areaStatus = [
  { name: 'Website', status: ctx.assess2A().status },
  { name: 'Admin', status: ctx.assess2B().status },
  { name: 'CMS', status: ctx.assess2C().status },
  { name: 'Security', status: ctx.assess2E().status },
];

const dashboard = {
  schema: 'traveltrust.operations_dashboard.v2',
  title: 'TravelTrust Operations Dashboard',
  recorded_utc: new Date().toISOString(),
  areas: areaStatus,
  journeys,
  open_evidence: metrics.open_evidence,
};

const md = [
  '# TravelTrust Operations Dashboard',
  '',
  `**Updated:** ${dashboard.recorded_utc}`,
  '',
  '## Areas',
  '',
  ...areaStatus.map((a) => `- **${a.name}** — \`${a.status}\``),
  '',
  ...journeys.flatMap((j) => [
    `## ${j.name}`,
    '',
    ...j.steps.map((s) => `- **${s.step}** — \`${s.status}\``),
    '',
  ]),
  '_UAT = run journeys step-by-step on Sepolia staging._',
].join('\n');

ctx.writeArtifacts(EVID_ROOT, STAMP, { name: 'OPERATIONS-DASHBOARD-LATEST.json', data: dashboard }, { name: 'OPERATIONS-DASHBOARD-LATEST.md', content: md });
console.log(md);
