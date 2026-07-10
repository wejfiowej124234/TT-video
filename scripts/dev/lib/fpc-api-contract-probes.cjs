/**
 * FPC B32 · L5 API contract probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const MATRIX_PATH = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json'
);
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const DASHBOARD_PATH = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
const REGISTRY_PATH = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');
const B11_PATH = path.join(EVID, 'FPC-100-BATCH-B11-LATEST.json');

function runSiteWideApiContractChecks(checklist, findings) {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const pages = matrix.pages || [];
  const policy = checklist.l5_api_contract_policy || {};
  const gaps = [];
  const checks = [];

  for (const page of pages) {
    const v = page.layer4_enterprise?.api_data_chain;
    const ok = v === 'PASS' || v === 'N/A';
    if (!ok) gaps.push(`${page.route}:${v || 'null'}`);
    checks.push({ route: page.route, pass: ok, api_data_chain: v });
  }

  const passCount = checks.filter((c) => c.pass).length;
  const pass = passCount >= (policy.min_pages_certified ?? 202) && passCount === pages.length;
  if (!pass) {
    findings.push({
      id: 'site_wide_api_contract_incomplete',
      severity: 'P0',
      detail: `${passCount}/${pages.length} · gaps=${gaps.slice(0, 10).join('; ')}`,
    });
  }

  return {
    pass,
    pass_count: passCount,
    total: pages.length,
    gaps,
    b32_apply: matrix.b32_apply || null,
  };
}

function runB11CrossCheck(findings) {
  if (!fs.existsSync(B11_PATH)) {
    findings.push({ id: 'b11_missing', severity: 'P0', detail: B11_PATH });
    return { pass: false };
  }
  const b11 = JSON.parse(fs.readFileSync(B11_PATH, 'utf8'));
  const frozen = !!b11.certification_frozen && b11.verdict === 'PASS';
  const dims = b11.api_parity_certification?.dimensions || {};
  const contractOk = dims.api_contract?.pass !== false;
  const readOk = dims.api_read_model?.pass !== false;
  const writeOk = dims.api_write_model?.pass !== false;
  const stateOk = dims.api_state_parity?.pass !== false;
  const pass = frozen && contractOk && readOk && writeOk && stateOk;
  if (!pass) {
    findings.push({
      id: 'b11_cross_check_fail',
      severity: 'P0',
      detail: `frozen=${frozen} contract=${contractOk} read=${readOk} write=${writeOk} state=${stateOk}`,
    });
  }
  return {
    pass,
    frozen,
    dimensions: {
      api_contract: contractOk,
      api_read_model: readOk,
      api_write_model: writeOk,
      api_state_parity: stateOk,
    },
  };
}

function runReleaseGateSsot(checklist, findings) {
  const bundle = checklist.release_gate_bundle || [];
  const checks = [];
  for (const script of bundle) {
    const abs = path.join(ROOT, 'scripts/gates', script);
    const pass = fs.existsSync(abs);
    if (!pass) {
      findings.push({ id: 'release_gate_script_missing', severity: 'P1', detail: script });
    }
    checks.push({ script, pass });
  }
  const run04 = path.join(ROOT, 'scripts/gates/run-check-04-routes.sh');
  const raw = fs.existsSync(run04) ? fs.readFileSync(run04, 'utf8') : '';
  const wired = bundle.every((s) => raw.includes(s.replace('.py', '')) || raw.includes(s));
  if (!wired) {
    findings.push({
      id: 'release_gate_not_wired_04',
      severity: 'P1',
      detail: 'B453-B457 must run via run-check-04-routes.sh',
    });
  }
  checks.push({ id: 'release_gate_wired_04', pass: wired });
  return { pass: checks.every((c) => c.pass) && wired, checks };
}

function runDashboardParity(checklist, findings) {
  if (!fs.existsSync(DASHBOARD_PATH)) {
    findings.push({ id: 'dashboard_missing', severity: 'P0', detail: DASHBOARD_PATH });
    return { pass: false };
  }
  const dash = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
  const registryRaw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const hasB32 = registryRaw.includes('id: B32') && registryRaw.includes('API Contract');
  const nextOk = dash.burn_down?.next_required_batch === 'B32';
  if (!hasB32) findings.push({ id: 'registry_b32_missing', severity: 'P1', detail: 'B32 row' });
  if (!nextOk) {
    findings.push({
      id: 'dashboard_next_batch',
      severity: 'P1',
      detail: `expected B32 got ${dash.burn_down?.next_required_batch}`,
    });
  }
  return {
    pass: hasB32 && nextOk,
    checks: [
      { id: 'registry_b32', pass: hasB32 },
      { id: 'dashboard_next_b32', pass: nextOk, next: dash.burn_down?.next_required_batch },
    ],
    readiness_pct: dash.release_readiness?.pct ?? dash.burn_down?.release_readiness_pct,
  };
}

function runStaticSsotChecks(checklist, findings) {
  const items = [
    {
      id: 'fa_audit_registry',
      path: 'registry/frontend-api-consistency-audit.v1.yaml',
      must_contain: ['TT_FRONTEND_API_CONSISTENCY_AUDIT: ENFORCED', 'S01_MARKET_GUIDES'],
    },
    {
      id: 'api_routes_ts',
      path: 'frontend/lib/api/routes.ts',
      must_contain: ['publicAnnouncements:', '/api/v1/'],
    },
    {
      id: 'spec_04_api',
      path: 'docs/spec/04-后端与API.md',
      must_contain: ['§3.4', '/api/v1/'],
    },
  ];
  const results = [];
  for (const item of items) {
    const abs = path.join(ROOT, item.path);
    const pass =
      fs.existsSync(abs) &&
      item.must_contain.every((needle) => fs.readFileSync(abs, 'utf8').includes(needle));
    if (!pass) findings.push({ id: item.id, severity: 'P1', detail: item.path });
    results.push({ ...item, pass });
  }
  return results;
}

function runCargoApiTests(findings) {
  if (process.env.FPC_B32_SKIP_CARGO === '1') {
    return { pass: true, skipped: true };
  }
  try {
    const stdout = execSync('cargo test -p traveltrust-api', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 600_000,
    });
    const passed = [...stdout.matchAll(/(\d+) passed/g)].reduce((sum, m) => sum + Number(m[1]), 0);
    const pass = passed >= 100;
    if (!pass) {
      findings.push({ id: 'cargo_test_low', severity: 'P0', detail: `passed=${passed}` });
    }
    return { pass, tests_passed: passed, summary: stdout.split('\n').slice(-3).join(' | ') };
  } catch (e) {
    findings.push({
      id: 'cargo_test_fail',
      severity: 'P0',
      detail: ((e.stderr || e.stdout || e.message || '') + '').slice(0, 2000),
    });
    return { pass: false, exit_code: e.status || 1 };
  }
}

module.exports = {
  runSiteWideApiContractChecks,
  runB11CrossCheck,
  runReleaseGateSsot,
  runDashboardParity,
  runStaticSsotChecks,
  runCargoApiTests,
};
