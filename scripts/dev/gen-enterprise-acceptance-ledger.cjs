#!/usr/bin/env node
/**
 * Enterprise Final Acceptance Ledger — single capstone table + issue list.
 * Synthesizes SSOT evidence only; classifies per TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const STAMP = process.env.STAMP || new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const OUT = process.env.EVIDENCE_DIR || path.join(ROOT, 'evidence/GO_enterprise_final_acceptance', STAMP);

const PI3_BLOCKERS = [
  { id: 'PB-PI3-001', item: 'Production Database / Backup', classification: 'PRODUCTION_BLOCKER' },
  { id: 'PB-PI3-002', item: 'Domain / TLS / CDN', classification: 'PRODUCTION_BLOCKER' },
  { id: 'PB-PI3-003', item: 'Optional Fiat Onboarding (Stripe)', classification: 'OPTIONAL_FIAT_ONRAMP' },
  { id: 'PB-G3-02', item: 'Web3 USDC Escrow Payment Production Verification', classification: 'PRODUCTION_BLOCKER' },
  { id: 'PB-PI3-004', item: 'Production Validation', classification: 'PRODUCTION_BLOCKER' },
  { id: 'PB-PI3-005', item: 'Mainnet', classification: 'PRODUCTION_BLOCKER' },
  { id: 'PB-PI3-006', item: 'Go-Live Checklist', classification: 'PRODUCTION_BLOCKER' },
];

function readLog(name) {
  const p = path.join(OUT, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function readJson(name) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function failedCount(log) {
  const m = log.match(/(\d+) failed/);
  return m ? Number(m[1]) : 0;
}

function passedCount(log) {
  const m = log.match(/(\d+) passed/);
  return m ? Number(m[1]) : 0;
}

function playwrightOk(log, minPassed) {
  return log.trim().length > 0 && failedCount(log) === 0 && passedCount(log) >= minPassed;
}

const feApiLog = readLog('fe-api.log');
const feApiJson = readJson('fe-api-audit.json');
const bdvProbes = readLog('bdv-probes-staging.log');
const feBrowser = readLog('fe-api-browser.log');
const bdvBrowser = readLog('bdv-browser.log');
const errBrowser = readLog('err-browser.log');

const apiStrict =
  /frontend-api-consistency-audit: PASS/.test(feApiLog) &&
  /blocking 0 warnings 0/.test(feApiLog);
const probesOk = /PASS probes/.test(bdvProbes);
const feBrowserOk = playwrightOk(feBrowser, 4);
const bdvBrowserOk = playwrightOk(bdvBrowser, 5);
const errBrowserOk = playwrightOk(errBrowser, 8);

const allMachinePass = apiStrict && probesOk && feBrowserOk && bdvBrowserOk && errBrowserOk;

/** @type {Array<{domain:string,pages:string[],api:string,browser:string,admin:string,db:string,status:string}>} */
const DOMAINS = [
  { domain: 'Guide · Market', pages: ['/market?view=guides'], key: 'guide' },
  { domain: 'Provider', pages: ['/market/provider'], key: 'provider' },
  { domain: 'Acquisition', pages: ['/market/acquisition'], key: 'acquisition' },
  { domain: 'Discover · Orders', pages: ['/market?view=orders'], key: 'discover' },
  { domain: 'Itinerary', pages: ['/', '/orders/new'], key: 'itinerary' },
  { domain: 'Orders · Escrow', pages: ['/orders', '/escrow'], key: 'orders' },
  { domain: 'Community', pages: ['/community'], key: 'community' },
  { domain: 'Messages', pages: ['/community/messages'], key: 'messages' },
  { domain: 'Governance', pages: ['/governance/proposals'], key: 'governance' },
  { domain: 'Web3 · Staking', pages: ['/staking'], key: 'web3' },
  { domain: 'Admin Platform', pages: ['/admin'], key: 'admin' },
  { domain: 'Home · Official', pages: ['/', '/traveltrust'], key: 'home' },
];

function domainPass(key) {
  if (!allMachinePass) return false;
  if (key === 'admin') return apiStrict; // admin 40/40 prior evidence; API layer clean
  if (key === 'community' || key === 'home') return feBrowserOk && apiStrict;
  return errBrowserOk && apiStrict;
}

const domainMatrix = DOMAINS.map((d) => {
  const pass = domainPass(d.key);
  return {
    domain: d.domain,
    pages: d.pages,
    api: apiStrict ? 'PASS' : 'FAIL',
    browser: pass ? 'PASS' : allMachinePass ? 'PARTIAL' : 'FAIL',
    admin: d.key === 'admin' ? 'PASS' : 'N/A',
    database: apiStrict ? 'PASS' : 'FAIL',
    business_flow: pass ? 'PASS' : 'PARTIAL',
    ux: pass ? 'PASS' : 'PARTIAL',
    status: pass ? 'PASS' : 'PARTIAL',
  };
});

const issues = [];

if (!apiStrict && feApiJson) {
  for (const b of feApiJson.blocking || []) {
    issues.push({
      id: `PD-API-${b.surface}-${b.code}`,
      classification: 'PRODUCT_DEFECT',
      domain: b.surface,
      summary: b.msg,
      disposition: 'FIX',
      fix_recommendation: `Resolve API audit blocking: ${b.code} on ${b.surface}`,
    });
  }
  for (const w of feApiJson.warnings || []) {
    issues.push({
      id: w.id || `PW-${w.surface}`,
      classification: 'PRODUCT_DEFECT',
      domain: w.surface,
      summary: w.msg,
      disposition: 'FIX',
      fix_recommendation: `Resolve strict warning: ${w.code}`,
    });
  }
}

if (!apiStrict && !feApiJson) {
  issues.push({
    id: 'PD-FE-API-STRICT',
    classification: 'PRODUCT_DEFECT',
    domain: 'API',
    summary: 'Frontend-API strict audit did not pass',
    disposition: 'FIX',
    fix_recommendation: 'Re-run frontend-api-consistency-audit with STRICT_WARNINGS=1 on staging',
  });
}

if (!feBrowserOk) {
  issues.push({
    id: 'PD-FE-BROWSER-VISUAL',
    classification: 'PRODUCT_DEFECT',
    domain: 'Market · Community · Governance visual',
    summary: 'Guide-depth visual consistency browser suite failed',
    disposition: 'FIX',
    fix_recommendation: 'Fix failures in frontend/e2e/frontend-api-consistency-audit.spec.ts',
  });
}

if (!errBrowserOk) {
  issues.push({
    id: 'PD-ERR-BROWSER',
    classification: 'PRODUCT_DEFECT',
    domain: 'Multi-domain parity',
    summary: 'Enterprise Release Review browser parity failed',
    disposition: 'FIX',
    fix_recommendation: 'Fix failures in frontend/e2e/enterprise-release-review.spec.ts',
  });
}

for (const pb of PI3_BLOCKERS) {
  issues.push({
    id: pb.id,
    classification: 'PRODUCTION_BLOCKER',
    domain: 'PI3',
    summary: pb.item,
    disposition: 'PI3_MAINLINE',
    fix_recommendation: `Complete ${pb.id} per docs/runbook/PHASE3-PRODUCTION-PREPARATION.md`,
  });
}

issues.push({
  id: 'ED-SEPOLIA-VS-MAINNET',
  classification: 'EXPECTED_DIFFERENCE',
  domain: 'Web3',
  summary: 'Staging/testnet uses Sepolia (chain_id 11155111); production mainnet addresses differ by design',
  disposition: 'CONFIRM_DESIGN',
  fix_recommendation: 'No product fix; complete PI3-005 Mainnet for production GO',
});

issues.push({
  id: 'ENH-POST-GO-OPS',
  classification: 'ENHANCEMENT',
  domain: 'Official Ops',
  summary: 'CDN/HLS · Admin SSO · button-by-button ops polish deferred to Post-GO Official Ops 1.1',
  disposition: 'DEFER_POST_GO',
  fix_recommendation: 'Track in Post-GO roadmap; not blocking Product Enterprise Complete',
});

const productDefects = issues.filter((i) => i.classification === 'PRODUCT_DEFECT');
const productionBlockers = issues.filter((i) => i.classification === 'PRODUCTION_BLOCKER');
const expectedDiff = issues.filter((i) => i.classification === 'EXPECTED_DIFFERENCE');
const enhancements = issues.filter((i) => i.classification === 'ENHANCEMENT');

const domainsPass = domainMatrix.filter((d) => d.status === 'PASS').length;
const productDefectsOpen = allMachinePass ? 0 : productDefects.length;
const enterpriseComplete =
  allMachinePass && productDefectsOpen === 0 && domainsPass === domainMatrix.length;

const ledger = {
  schema: 'traveltrust.enterprise_acceptance_ledger.v1',
  stamp: STAMP,
  generated_at_utc: new Date().toISOString(),
  name: 'Enterprise Final Acceptance Audit · Capstone Ledger',
  not_a_new_recurring_audit: true,
  product_development_freeze: 'TT_PRODUCT_DEVELOPMENT_FREEZE: ENFORCED',
  synthesizes: [
    'Phase12 Final Convergence',
    'Production Release Review',
    'Frontend-API Consistency Audit',
    'Business Domain Validation',
    'Enterprise Release Review browser',
  ],
  prior_evidence: {
    production_release_review: 'evidence/GO_production_release_review/20260702T084419Z/',
    phase12_convergence: 'evidence/GO_phase12_final_convergence/20260702T023014Z/',
    product_freeze: 'evidence/manual-uat/signoff/PRODUCT-DEVELOPMENT-FREEZE-20260702.md',
  },
  machine_signals: {
    api_strict: apiStrict,
    bdv_probes_staging: probesOk,
    fe_api_browser: feBrowserOk,
    bdv_browser: bdvBrowserOk,
    err_browser: errBrowserOk,
    all_machine_pass: allMachinePass,
  },
  summary: {
    domains_total: domainMatrix.length,
    domains_pass: domainsPass,
    product_defects_open: productDefectsOpen,
    production_blockers_open: productionBlockers.length,
    expected_differences: expectedDiff.length,
    enhancements_deferred: enhancements.length,
    enterprise_complete: enterpriseComplete,
  },
  issue_counts: {
    PRODUCT_DEFECT: productDefects.length,
    PRODUCTION_BLOCKER: productionBlockers.length,
    EXPECTED_DIFFERENCE: expectedDiff.length,
    ENHANCEMENT: enhancements.length,
  },
  domain_matrix: domainMatrix,
  issue_list: issues,
  machine_keys: {
    TT_ENTERPRISE_FINAL_ACCEPTANCE: enterpriseComplete ? 'CLOSED' : 'IN_PROGRESS',
    TT_PRODUCT_CAPABILITY:
      enterpriseComplete ? 'ENTERPRISE_COMPLETE' : 'ENTERPRISE_COMPLETE_PENDING_VERIFICATION',
    TT_RELEASE_DECISION: 'NO_GO',
  },
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'enterprise-acceptance-ledger.json'), JSON.stringify(ledger, null, 2) + '\n');

const md = `# Enterprise Acceptance Ledger

**Stamp:** ${STAMP}

## Machine keys

\`\`\`text
TT_ENTERPRISE_FINAL_ACCEPTANCE: ${ledger.machine_keys.TT_ENTERPRISE_FINAL_ACCEPTANCE}
TT_PRODUCT_CAPABILITY: ${ledger.machine_keys.TT_PRODUCT_CAPABILITY}
\`\`\`

## Signals

| Signal | Result |
|--------|--------|
| API strict | ${apiStrict ? 'PASS' : 'FAIL'} |
| BDV probes | ${probesOk ? 'PASS' : 'FAIL'} |
| FE-API browser | ${feBrowserOk ? 'PASS' : 'FAIL'} |
| BDV browser | ${bdvBrowserOk ? 'PASS' : 'FAIL'} |
| ERR browser | ${errBrowserOk ? 'PASS' : 'FAIL'} |

## Domain matrix

| Domain | API | Browser | DB | Status |
|--------|-----|---------|-----|--------|
${domainMatrix.map((d) => `| ${d.domain} | ${d.api} | ${d.browser} | ${d.database} | **${d.status}** |`).join('\n')}

## Issue list summary

- Product Defects: ${productDefects.length} (open: ${productDefectsOpen})
- Production Blockers: ${productionBlockers.length}
- Expected Differences: ${expectedDiff.length}
- Enhancements: ${enhancements.length}

## Enterprise Complete

**${enterpriseComplete ? 'YES' : 'NO'}** — Product Defects and machine verification must be zero before \`TT_PRODUCT_CAPABILITY: ENTERPRISE_COMPLETE\` confirmation.
`;

fs.writeFileSync(path.join(OUT, 'ENTERPRISE-ACCEPTANCE-LEDGER.md'), md);

console.log(
  enterpriseComplete
    ? 'enterprise-final-acceptance: CLOSED · ENTERPRISE_COMPLETE'
    : 'enterprise-final-acceptance: IN_PROGRESS'
);
console.log('ledger', path.join(OUT, 'enterprise-acceptance-ledger.json'));
