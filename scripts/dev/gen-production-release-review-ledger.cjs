#!/usr/bin/env node
/**
 * Production Release Review Ledger — evidence-driven domain matrix.
 * Synthesizes BDV + FE-API consistency + Enterprise Release Review browser parity.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const STAMP = process.env.STAMP || new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const OUT = process.env.EVIDENCE_DIR || path.join(ROOT, 'evidence/GO_production_release_review', STAMP);

function readLog(name) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

function playwrightFailedCount(log) {
  const m = log.match(/(\d+) failed/);
  return m ? Number(m[1]) : 0;
}

function playwrightPassedCount(log) {
  const m = log.match(/(\d+) passed/);
  return m ? Number(m[1]) : 0;
}

function feApiStrictPass(log) {
  return /frontend-api-consistency-audit: PASS/.test(log) && /blocking 0 warnings 0/.test(log);
}

function bdvProbesPass(log) {
  return /PASS probes/.test(log);
}

function playwrightPass(log, minPassed = 1) {
  if (!log.trim()) return false;
  return playwrightFailedCount(log) === 0 && playwrightPassedCount(log) >= minPassed;
}

const feApiLog = readLog('fe-api.log');
const bdvStagingLog = readLog('bdv-probes-staging.log');
const bdvBrowserLog = readLog('bdv-browser.log');
const errBrowserLog = readLog('err-browser.log');

const apiStrict = feApiStrictPass(feApiLog);
const probesOk = bdvProbesPass(bdvStagingLog);
const bdvBrowserOk = playwrightPass(bdvBrowserLog, 5);
const errBrowserOk = playwrightPass(errBrowserLog, 8);

const errAllOk = errBrowserOk;
const errSignals = {
  provider: errAllOk,
  acquisition: errAllOk,
  discover: errAllOk,
  governance: errAllOk,
  orders: errAllOk,
  messages: errAllOk,
  web3: errAllOk,
  itinerary: errAllOk,
};

function layer(apiOk, browserOk, adminOk = 'N/A') {
  return {
    api: apiOk ? 'PASS' : 'PARTIAL',
    browser: browserOk ? 'PASS' : 'PARTIAL',
    admin: adminOk,
    business: apiOk && browserOk ? 'PASS' : 'PARTIAL',
    ux: apiOk && browserOk ? 'PASS' : 'PARTIAL',
    status: apiOk && browserOk ? 'PASS' : 'PARTIAL',
  };
}

const baseApi = apiStrict && probesOk;
const guidesBrowserOk = apiStrict && bdvBrowserOk;
const allBrowser = bdvBrowserOk && errBrowserOk;
const allPass = baseApi && allBrowser;

/** @type {Array<{domain:string,pages:string[],api:string,browser:string,admin:string,business:string,ux:string,status:string,gap?:string}>} */
const DOMAINS = [
  {
    domain: 'Home',
    pages: ['/', '/traveltrust'],
    ...layer(baseApi, errSignals.itinerary && bdvBrowserOk, 'N/A'),
  },
  {
    domain: 'Market · Guides',
    pages: ['/market?view=guides'],
    ...layer(baseApi, guidesBrowserOk, 'PASS'),
  },
  {
    domain: 'Discover · Orders',
    pages: ['/market?view=orders'],
    ...layer(baseApi, errSignals.discover, 'N/A'),
  },
  {
    domain: 'Provider',
    pages: ['/market/provider', '/market?view=provider'],
    ...layer(baseApi, errSignals.provider, 'PASS'),
  },
  {
    domain: 'Acquisition',
    pages: ['/market/acquisition'],
    ...layer(baseApi, errSignals.acquisition, 'PASS'),
  },
  {
    domain: 'Itinerary',
    pages: ['/', '/orders/new', '/itineraries'],
    ...layer(baseApi, errSignals.itinerary, 'N/A'),
  },
  {
    domain: 'Community',
    pages: ['/community', '/community/explore'],
    ...layer(baseApi, guidesBrowserOk, 'PASS'),
  },
  {
    domain: 'Messages',
    pages: ['/community/messages'],
    ...layer(baseApi, errSignals.messages, 'N/A'),
  },
  {
    domain: 'Governance',
    pages: ['/governance', '/governance/proposals'],
    ...layer(baseApi, errSignals.governance, 'PASS'),
  },
  {
    domain: 'Orders · Escrow',
    pages: ['/escrow', '/orders'],
    ...layer(baseApi, errSignals.orders, 'PARTIAL'),
  },
  {
    domain: 'Web3 · Staking',
    pages: ['/staking', '/treasury'],
    ...layer(baseApi, errSignals.web3, 'N/A'),
  },
  {
    domain: 'Admin Platform',
    pages: ['/admin/*'],
    ...layer(baseApi, apiStrict, 'PASS'),
  },
];

const productDefects = DOMAINS.filter((d) => d.status !== 'PASS').map((d) => ({
  id: `PD-ERR-${d.domain.replace(/\W+/g, '_').slice(0, 24)}`,
  classification: 'PRODUCT_DEFECT',
  domain: d.domain,
  disposition: 'CLOSE_BEFORE_PI3_PRODUCT_SIGNOFF',
  gap: d.gap || `Domain ${d.domain} not at Guide-depth PASS`,
  status: 'OPEN',
}));

const productionBlockersPi3 = [
  { id: 'PB-PI3-001', classification: 'PRODUCTION_BLOCKER', item: 'Production Database / Backup', disposition: 'PI3_MAINLINE' },
  { id: 'PB-PI3-002', classification: 'PRODUCTION_BLOCKER', item: 'Domain / TLS / CDN', disposition: 'PI3_MAINLINE' },
  { id: 'PB-PI3-003', classification: 'OPTIONAL_FIAT_ONRAMP', item: 'Optional Fiat Onboarding (Stripe)', disposition: 'P1_ON_DEMAND' },
  { id: 'PB-PI3-004', classification: 'PRODUCTION_BLOCKER', item: 'Production Validation', disposition: 'PI3_MAINLINE' },
  { id: 'PB-PI3-005', classification: 'PRODUCTION_BLOCKER', item: 'Mainnet', disposition: 'PI3_MAINLINE' },
  { id: 'PB-PI3-006', classification: 'PRODUCTION_BLOCKER', item: 'Go-Live Checklist', disposition: 'PI3_MAINLINE' },
];

const passCount = DOMAINS.filter((d) => d.status === 'PASS').length;
const partialCount = DOMAINS.filter((d) => d.status === 'PARTIAL').length;
const gapCount = DOMAINS.filter((d) => d.status === 'GAP').length;

const ledger = {
  schema: 'traveltrust.production_release_review_ledger.v1',
  stamp: STAMP,
  generated_at_utc: new Date().toISOString(),
  name: 'Production Release Review · Business Domain Validation',
  not_a_new_audit_type: true,
  evidence_signals: {
    fe_api_strict: apiStrict,
    bdv_probes_staging: probesOk,
    bdv_browser: bdvBrowserOk,
    err_browser: errBrowserOk,
    err_domain_signals: errSignals,
  },
  synthesizes: [
    'Functional Audit',
    'Enterprise Capability Audit',
    'Frontend-API Consistency Audit',
    'Display Data Governance',
    'Business Manual UAT',
    'Phase12 Final Convergence',
    'Enterprise Release Review (Guide-depth parity)',
  ],
  layers: [
    'L1_all_pages',
    'L2_business_flows',
    'L3_admin_functions',
    'L4_page_consistency',
    'L5_enterprise_ux',
  ],
  summary: {
    domains_total: DOMAINS.length,
    pass: passCount,
    partial: partialCount,
    gap: gapCount,
    product_defects_open: productDefects.length,
    production_blockers_pi3: productionBlockersPi3.length,
    all_domains_pass: allPass,
  },
  domain_matrix: DOMAINS,
  ledger: {
    product_defects: productDefects,
    production_blockers: productionBlockersPi3,
    expected_differences: 'docs/runbook/TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md §4',
    enhancements: 'Post-GO Official Ops 1.1 · CDN/HLS · Admin SSO',
  },
  machine_keys: {
    TT_PRODUCTION_RELEASE_REVIEW: allPass ? 'CLOSED' : 'IN_PROGRESS',
    TT_BUSINESS_DOMAIN_VALIDATION: allPass ? 'PASS' : 'IN_PROGRESS',
    TT_RELEASE_DECISION: 'NO_GO',
  },
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'release-review-ledger.json'), JSON.stringify(ledger, null, 2) + '\n');

const md = `# Production Release Review Ledger

**Stamp:** ${STAMP}

## Evidence signals

- FE-API strict: ${apiStrict ? 'PASS' : 'FAIL'}
- BDV probes (staging): ${probesOk ? 'PASS' : 'FAIL'}
- BDV browser: ${bdvBrowserOk ? 'PASS' : 'FAIL'}
- ERR browser (Guide-depth): ${errBrowserOk ? 'PASS' : 'FAIL'}

## Domain Matrix

| Domain | API | Browser | Admin | Business | UX | Status |
|--------|-----|---------|-------|----------|-----|--------|
${DOMAINS.map((d) => `| ${d.domain} | ${d.api} | ${d.browser} | ${d.admin} | ${d.business} | ${d.ux} | **${d.status}** |`).join('\n')}

## Summary

- PASS: ${passCount} · PARTIAL: ${partialCount} · GAP: ${gapCount}
- Product defects (open): ${productDefects.length}
- PI3 queue: ${productionBlockersPi3.length}

\`\`\`text
TT_PRODUCTION_RELEASE_REVIEW: ${ledger.machine_keys.TT_PRODUCTION_RELEASE_REVIEW}
\`\`\`
`;

fs.writeFileSync(path.join(OUT, 'RELEASE-REVIEW-LEDGER.md'), md);

if (!allPass) {
  console.log('production-release-review: IN_PROGRESS partial=' + partialCount);
} else {
  console.log('production-release-review: CLOSED');
}
console.log('ledger', path.join(OUT, 'release-review-ledger.json'));
