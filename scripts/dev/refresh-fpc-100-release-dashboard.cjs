#!/usr/bin/env node
/**
 * Refresh FPC-100 Release Dashboard — single rollup for TT_FULL_PRODUCTION_CERTIFICATION.
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
const MATRIX = path.join(EVID, 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json');
const REGISTRY = path.join(EVID, 'FPC-100-REGISTRY-LATEST.json');
const OUT_JSON = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
const OUT_MD = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.md');

function readJson(p, fallback = null) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function pct(n, total) {
  if (!total) return 0;
  return Math.round((n / total) * 1000) / 10;
}

function row(label, done, total, verdict) {
  const display = total != null ? `${done} / ${total}` : done;
  return { label, done, total, display, verdict: verdict || 'NOT_STARTED' };
}

const matrix = readJson(MATRIX, { pages: [], coverage_summary: {} });
const registry = readJson(REGISTRY, { batches: [], four_layers: {} });
const total = matrix.coverage_summary?.pages_total || matrix.pages?.length || 202;

const uiDone = matrix.pages.filter((p) => p.layer2_l5_scores?.ui != null).length;
const uxDone = matrix.pages.filter((p) => p.layer2_l5_scores?.ux != null).length;
const l1Done = matrix.pages.filter(
  (p) =>
    p.layer1_surface_coverage?.page_tsx === 'PASS' ||
    p.certification_verdict === 'PASS'
).length;
const prodReady = matrix.coverage_summary?.production_ready_yes || 0;
const cxPass = matrix.pages.filter(
  (p) => p.layer2_5_customer_experience?.certification_verdict === 'PASS'
).length;
const truthPass = matrix.pages.filter(
  (p) => p.layer5_operations_truth_per_page?.truthfulness?.verdict === 'PASS'
).length;
const lineagePass = matrix.pages.filter(
  (p) => p.layer5_operations_truth_per_page?.data_lineage?.verdict === 'PASS'
).length;

function batchVerdict(id) {
  const b = (registry.batches || []).find((x) => x.id === id);
  return b?.verdict || 'NOT_STARTED';
}

const l5Domains = registry.l5_domains || {};
function domainVerdict(key) {
  return l5Domains[key]?.verdict || batchVerdict(key) || 'NOT_STARTED';
}

const rows = [
  row('Pages (L1 coverage)', l1Done, total, l1Done === total ? 'PASS' : 'IN_PROGRESS'),
  row('UI scored (L2)', uiDone, total, uiDone === total ? 'PASS' : 'NOT_STARTED'),
  row('UX scored (L2)', uxDone, total, uxDone === total ? 'PASS' : 'NOT_STARTED'),
  row('CX (L2.5)', cxPass, total, cxPass === total ? 'PASS' : 'NOT_STARTED'),
  row('Production Ready (L2)', prodReady, total, prodReady === total ? 'PASS' : 'NOT_STARTED'),
  row('API Contract', registry.l5_api_contract_pct ?? '0%', null, domainVerdict('api_contract')),
  row('RBAC', batchVerdict('B09'), null, batchVerdict('B09')),
  row('Data Lineage (L5)', lineagePass, total, lineagePass === total ? 'PASS' : 'NOT_STARTED'),
  row('Content Operations (L5)', domainVerdict('content_operations'), null, domainVerdict('content_operations')),
  row('Recovery (L5)', domainVerdict('recovery'), null, domainVerdict('recovery')),
  row('Truthfulness (L5)', truthPass, total, truthPass === total ? 'PASS' : 'NOT_STARTED'),
  row('Lifecycle (L5)', domainVerdict('lifecycle'), null, domainVerdict('lifecycle')),
  row('Operations (L5)', domainVerdict('operations'), null, domainVerdict('operations')),
  row('Mobile', batchVerdict('B15'), null, batchVerdict('B15')),
  row('A11Y', batchVerdict('B14'), null, batchVerdict('B14')),
  row('Performance', batchVerdict('B16'), null, batchVerdict('B16')),
  row('Security', batchVerdict('B17'), null, batchVerdict('B17')),
  row('Business Flows (L3)', registry.l3_business_flows?.verdict || 'NOT_STARTED', null, registry.l3_business_flows?.verdict),
  row('Environment Diff', batchVerdict('B00-staging'), null, batchVerdict('B00-staging')),
];

const blockers = rows.filter((r) => r.verdict === 'FAIL');
const allPass = rows.every((r) => r.verdict === 'PASS' || r.verdict === 'N/A');
const dashboard = {
  schema: 'traveltrust.fpc_100_release_dashboard.v1',
  machine_key: 'TT_FULL_PRODUCTION_CERTIFICATION',
  timestamp_utc: new Date().toISOString(),
  code_anchor_commit: registry.code_anchor_commit || 'e9df0a73f63b5ebccc7c17266f000c3bf867d872',
  verdict: allPass ? 'PASS' : 'NOT_STARTED',
  pass: allPass,
  rows,
  summary: {
    pages_total: total,
    open_p0_p1: registry.open_p0_p1 ?? 0,
    fpc_exit_eligible: registry.fpc_exit_eligible ?? false,
  },
  five_layers: registry.five_layers || registry.four_layers || {},
  l5_domains: registry.l5_domains || {},
};

fs.mkdirSync(EVID, { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(dashboard, null, 2) + '\n');

const md = [
  '# TravelTrust · Full Production Certification Dashboard',
  '',
  `**Machine key:** \`TT_FULL_PRODUCTION_CERTIFICATION\`  `,
  `**Verdict:** **${dashboard.verdict}**  `,
  `**Updated:** ${dashboard.timestamp_utc}`,
  '',
  '| 项 | 完成 | 判定 |',
  '|---|------|------|',
  ...rows.map((r) => `| ${r.label} | ${r.display} | ${r.verdict} |`),
  '',
  '---',
  '',
  `**TT_FULL_PRODUCTION_CERTIFICATION:** \`${dashboard.verdict}\``,
  '',
].join('\n');
fs.writeFileSync(OUT_MD, md);

console.log('TT_FULL_PRODUCTION_CERTIFICATION:', dashboard.verdict);
console.log('DASHBOARD_JSON:', OUT_JSON);
console.log('DASHBOARD_MD:', OUT_MD);
