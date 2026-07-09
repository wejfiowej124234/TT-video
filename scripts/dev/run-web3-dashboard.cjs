#!/usr/bin/env node
/**
 * Dashboard 2 · Web3 Dashboard — modules + lifecycle view (status only)
 */
const path = require('path');
const { createDashboardContext } = require('./lib/dashboard-common.cjs');
const { buildWeb3LifecycleView } = require('./lib/web3-lifecycle-view.cjs');

const ctx = createDashboardContext(path.join(__dirname, '../..'));
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ctx.ROOT, 'evidence/GO_production_readiness/web3-dashboard');

if (ctx.REFRESH) {
  ctx.runNode('run-sepolia-full-web3-lifecycle-validation.cjs');
  ctx.runNode('run-web3-protocol-grade-audit.cjs');
}

const lifecycle = ctx.readLifecycle();
const pg = ctx.readProtocolGrade();
const cert = ctx.readCert();
const mainnet = ctx.readJson('evidence/GO_production_readiness/web3-mainnet-audit/WEB3-MAINNET-PRODUCTION-READINESS-AUDIT-LATEST.json');
const lifecycleView = buildWeb3LifecycleView(ctx);

function modStatus(domainIds) {
  const domains = lifecycle?.domains || [];
  const matched = domains.filter((d) => domainIds.includes(d.id));
  if (!matched.length) return ctx.STATUS.NOT_STARTED;
  if (matched.every((d) => d.validation_pass || d.sepolia_e2e_evidence)) return ctx.STATUS.PASS;
  if (matched.some((d) => d.validation_pass || d.sepolia_e2e_evidence)) return ctx.STATUS.IN_PROGRESS;
  return ctx.STATUS.IN_PROGRESS;
}

const modules = [
  { name: 'TTG', status: modStatus(['DOM-TTG-GOV']) },
  { name: 'Governance', status: modStatus(['DOM-TTG-GOV', 'DOM-GOV-OPS']) },
  { name: 'Treasury', status: modStatus(['DOM-TTG-GOV', 'DOM-FUND-FLOWS']) },
  { name: 'Escrow', status: modStatus(['DOM-ESCROW-V2']) },
  { name: 'FeeRouter', status: modStatus(['DOM-FUND-FLOWS']) },
  { name: 'CountryPool', status: modStatus(['DOM-FUND-FLOWS']) },
  { name: 'Region Steward', status: modStatus(['DOM-IDENTITY-STAKE', 'DOM-SEAT-JURISDICTION']) },
  { name: 'Identity Stake', status: modStatus(['DOM-IDENTITY-STAKE']) },
  { name: 'Primary Market', status: modStatus(['DOM-TTG-GOV']) },
  { name: 'Settlement', status: modStatus(['DOM-ESCROW-V2', 'DOM-FUND-FLOWS']) },
  { name: 'Ledger', status: modStatus(['DOM-FUND-FLOWS', 'DOM-FOUR-LAYER']) },
  { name: 'Protocol Audit', status: (pg?.summary?.blockers_p0 ?? 99) === 0 && (pg?.summary?.blockers_p1 ?? 1) === 0 ? ctx.STATUS.PASS : ctx.STATUS.IN_PROGRESS },
  { name: 'Mainnet Readiness', status: mainnet?.verdict === 'WEB3_MAINNET_PRODUCTION_PASS' ? ctx.STATUS.PASS : ctx.STATUS.NOT_STARTED },
];

const today = ctx.buildTodayFocus(ctx.assessPhase2(ctx.extractBlockers()), ctx.extractBlockers(), {
  default_owner: 'Junxi',
  cert_tasks: { '8': { label: 'Cert #8 Treasury Spend Execute', mission: 'Governance Lifecycle', blocked_by: 'Timelock' } },
});

const dashboard = {
  schema: 'traveltrust.web3_dashboard.v2',
  title: 'TravelTrust Web3 Dashboard',
  recorded_utc: new Date().toISOString(),
  cert: `${cert?.signed_count ?? 0}/12`,
  modules,
  lifecycle_view: lifecycleView,
  protocol_grade: pg?.verdict,
  sepolia_lifecycle: lifecycle?.verdict,
  today,
};

const md = [
  '# TravelTrust Web3 Dashboard',
  '',
  `**Updated:** ${dashboard.recorded_utc} · **Cert:** ${dashboard.cert}`,
  '',
  '## Modules (status)',
  '',
  ...modules.map((m) => `- **${m.name}** — \`${m.status}\``),
  '',
  '## Lifecycle View',
  '',
  '```text',
  ...lifecycleView.nodes.map((n, i) => `${i > 0 ? '↓\n' : ''}${n.label}  [${n.status}]${n.label === lifecycleView.current_node ? '  ← current' : ''}`),
  '```',
  '',
  '## TODAY',
  '',
  `- **Focus:** ${today.current_focus} · **Task:** ${today.task}`,
  `- **Blocked:** ${today.blocked_by || '—'} · **Next:** ${today.next}`,
  '',
  `Protocol: ${dashboard.protocol_grade} · Lifecycle: ${dashboard.sepolia_lifecycle}`,
].join('\n');

ctx.writeArtifacts(EVID_ROOT, STAMP, { name: 'WEB3-DASHBOARD-LATEST.json', data: dashboard }, { name: 'WEB3-DASHBOARD-LATEST.md', content: md });
console.log(md);
