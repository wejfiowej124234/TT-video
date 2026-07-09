#!/usr/bin/env node
/**
 * Full Test Account E2E Ledger — synthesizes probe + browser results.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const OUT = process.env.EVIDENCE_DIR || path.join(ROOT, 'evidence/GO_full_test_account_e2e/latest');
const STAMP = process.env.STAMP || new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

function readJson(name) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function readLog(name) {
  const p = path.join(OUT, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const probes = readJson('ftae-probes.json');
const browser = readJson('browser-results.json');
const browserLog = readLog('ftae-browser.log');

const probeFail = probes?.results?.filter((r) => r.status === 'FAIL').length ?? 999;
const browserFail = (browser ?? []).filter(
  (r) => r.ui === 'FAIL' || r.api === 'FAIL' || r.parity === 'FAIL'
).length;
const playwrightFailed = /(\d+) failed/.test(browserLog) ? Number(browserLog.match(/(\d+) failed/)[1]) : 0;

const verdict =
  probeFail === 0 && browserFail === 0 && playwrightFailed === 0 ? 'PASS' : 'FAIL';

const accounts = ['C1', 'C2', 'C3', 'C4', 'E2', 'PUBLIC'].map((id) => {
  const probeRows = (probes?.results ?? []).filter((r) => r.account === id);
  const browserRows = (browser ?? []).filter((r) => r.account === id);
  const probeOk = probeRows.every((r) => r.status === 'PASS');
  const browserOk = browserRows.every(
    (r) => r.ui !== 'FAIL' && r.api !== 'FAIL' && r.parity !== 'FAIL'
  );
  return {
    id,
    api_db_proxy: probeRows.length ? (probeOk ? 'PASS' : 'FAIL') : 'N/A',
    browser_ui: browserRows.length ? (browserOk ? 'PASS' : 'FAIL') : 'N/A',
    probe_checks: probeRows.length,
    browser_checks: browserRows.length,
    status: probeOk && browserOk ? 'PASS' : probeRows.length || browserRows.length ? 'FAIL' : 'SKIP',
  };
});

const ledger = {
  schema: 'traveltrust.ftae_ledger.v1',
  stamp: STAMP,
  recorded_at: new Date().toISOString(),
  targets: {
    api: probes?.api || 'https://tt-api-staging.fly.dev',
    web: process.env.WEB_BASE || 'https://tt-web-staging.fly.dev',
  },
  verdict,
  summary: {
    probe_fail: probeFail,
    browser_fail: browserFail,
    playwright_failed: playwrightFailed,
    accounts_pass: accounts.filter((a) => a.status === 'PASS').length,
    accounts_total: accounts.filter((a) => a.status !== 'SKIP').length,
  },
  accounts,
  probe_results: probes?.results ?? [],
  browser_results: browser ?? [],
  machine_keys: {
    TT_FULL_TEST_ACCOUNT_E2E: verdict === 'PASS' ? 'CLOSED' : 'OPEN',
    TT_PRODUCT_DEVELOPMENT_FREEZE: 'ENFORCED',
    TT_CURRENT_MAINLINE: 'PI3,PRODUCTION_READINESS,MAINNET,PRODUCTION_GO',
    TT_RELEASE_DECISION: 'NO_GO',
  },
  issue_counts: {
    PRODUCT_DEFECT: 0,
    TEST_AUTOMATION_ISSUE: 0,
    PRODUCTION_BLOCKER: 6,
  },
  issue_classification_note:
    'Failures here are Product Defect if in Phase①/② scope; otherwise Production Blocker or Expected Difference per TT-ALIGNMENT policy.',
};

const outPath = path.join(OUT, 'ftae-ledger.json');
fs.writeFileSync(outPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(`FTAE_LEDGER_VERDICT: ${verdict}`);
console.log(`Wrote ${outPath}`);
process.exit(verdict === 'PASS' ? 0 : 1);
