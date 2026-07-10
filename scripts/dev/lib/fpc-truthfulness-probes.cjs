/**
 * FPC B36 · L5 truthfulness probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const MATRIX_PATH = path.join(EVID, 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json');
const DASHBOARD_PATH = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
const REGISTRY_PATH = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');
const NO_SKIP_PATH = path.join(EVID, 'FPC-100-NO-BATCH-SKIP-LATEST.json');
const SCAN_PATH = path.join(EVID, 'B36-truthfulness/truthfulness-consumer-scan-latest.json');

function loadBatch(batchId) {
  const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function isFrozenPass(b) {
  if (!b) return false;
  const verdictOk = b.verdict === 'PASS' || b.verdict === 'PASS_WITH_WARN';
  return !!b.certification_frozen && b.gate_pass !== false && verdictOk;
}

function runDependencyChecks(checklist, findings) {
  const deps = checklist.depends_on_batches || ['B01', 'B31', 'B34'];
  const checks = [];
  for (const id of deps) {
    const b = loadBatch(id);
    const pass = isFrozenPass(b);
    if (!pass) {
      findings.push({
        id: `${id}_not_frozen_pass`,
        severity: 'P0',
        detail: `${id} frozen=${b?.certification_frozen} verdict=${b?.verdict}`,
      });
    }
    checks.push({ batch_id: id, pass, verdict: b?.verdict, frozen: b?.certification_frozen });
  }
  return { pass: checks.every((c) => c.pass), checks };
}

function runFrozenChainAggregation(checklist, findings) {
  const chain = checklist.l5_truthfulness_policy?.frozen_chain_batches || [];
  const checks = [];
  for (const id of chain) {
    const b = loadBatch(id);
    const pass = isFrozenPass(b);
    if (!pass) {
      findings.push({
        id: `frozen_chain_${id}`,
        severity: 'P0',
        detail: `${id} not frozen PASS in evidence chain`,
      });
    }
    checks.push({ batch_id: id, pass, verdict: b?.verdict });
  }
  return { pass: checks.every((c) => c.pass), checks, chain_length: chain.length };
}

function runGateAggregationParity(findings) {
  if (!fs.existsSync(NO_SKIP_PATH)) {
    findings.push({ id: 'no_batch_skip_evidence_missing', severity: 'P0', detail: NO_SKIP_PATH });
    return { pass: false };
  }
  const report = JSON.parse(fs.readFileSync(NO_SKIP_PATH, 'utf8'));
  const pass = report.sequence_ok === true && (report.skip_violations || []).length === 0;
  if (!pass) {
    findings.push({
      id: 'no_batch_skip_violation',
      severity: 'P0',
      detail: (report.skip_violations || []).join(','),
    });
  }
  return {
    pass,
    sequence_ok: report.sequence_ok,
    release_readiness_pct: report.burn_down?.release_readiness_pct,
    next_required_batch: report.burn_down?.next_required_batch,
  };
}

function runCrossModuleTruthfulnessRegression(findings) {
  const checks = [];
  const corridors = [
    {
      id: 'B01_foundation',
      batch: 'B01',
      validate: (b) => isFrozenPass(b),
    },
    {
      id: 'B31_data_lineage',
      batch: 'B31',
      validate: (b) => isFrozenPass(b) && b.gate_pass !== false,
    },
    {
      id: 'B34_entity_lifecycle',
      batch: 'B34',
      validate: (b) => isFrozenPass(b),
    },
    {
      id: 'B35_recovery',
      batch: 'B35',
      validate: (b) => isFrozenPass(b),
    },
  ];
  for (const c of corridors) {
    const b = loadBatch(c.batch);
    const pass = c.validate(b);
    if (!pass) findings.push({ id: `cross_module_${c.id}`, severity: 'P0', detail: c.batch });
    checks.push({ ...c, pass, verdict: b?.verdict });
  }
  return { pass: checks.every((c) => c.pass), checks };
}

function runConsumerScanEvidenceParity(findings) {
  if (!fs.existsSync(SCAN_PATH)) {
    findings.push({ id: 'truthfulness_scan_missing', severity: 'P0', detail: SCAN_PATH });
    return { pass: false };
  }
  const report = JSON.parse(fs.readFileSync(SCAN_PATH, 'utf8'));
  const pass = report.pass === true && (report.locale_violations || []).length === 0;
  if (!pass) {
    findings.push({
      id: 'truthfulness_scan_fail',
      severity: 'P0',
      detail: (report.findings || []).map((f) => f.id).join(','),
    });
  }
  return {
    pass,
    locale_violations: (report.locale_violations || []).length,
    mock_isolation: report.mock_isolation,
    path: SCAN_PATH,
  };
}

function runReleaseGateSsot(checklist, findings) {
  const bundle = checklist.release_gate_bundle || [];
  const checks = [];
  for (const script of bundle) {
    const abs = path.join(ROOT, 'scripts/gates', script);
    const pass = fs.existsSync(abs);
    if (!pass) findings.push({ id: 'release_gate_script_missing', severity: 'P1', detail: script });
    checks.push({ script, pass });
  }
  return { pass: checks.every((c) => c.pass), checks };
}

function runDashboardParity(checklist, findings) {
  if (!fs.existsSync(DASHBOARD_PATH)) {
    findings.push({ id: 'dashboard_missing', severity: 'P0', detail: DASHBOARD_PATH });
    return { pass: false };
  }
  const dash = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
  const registryRaw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const hasB36 = registryRaw.includes('id: B36') && registryRaw.includes('Truthfulness');
  const nextOk = dash.burn_down?.next_required_batch === 'B36';
  if (!hasB36) findings.push({ id: 'registry_b36_missing', severity: 'P1', detail: 'B36 row' });
  if (!nextOk) {
    findings.push({
      id: 'dashboard_next_batch',
      severity: 'P1',
      detail: `expected B36 got ${dash.burn_down?.next_required_batch}`,
    });
  }
  return {
    pass: hasB36 && nextOk,
    checks: [
      { id: 'registry_b36', pass: hasB36 },
      { id: 'dashboard_next_b36', pass: nextOk, next: dash.burn_down?.next_required_batch },
    ],
    readiness_pct: dash.release_readiness?.pct ?? dash.burn_down?.release_readiness_pct,
  };
}

function runStaticSsotChecks(checklist, findings) {
  const items = [
    {
      id: 'public_chrome_hygiene',
      path: 'frontend/lib/publicChromeHygiene.ts',
      must_contain: ['publicChromeDisplayName', 'isDevCatalogEmail'],
    },
    {
      id: 'ddg_registry',
      path: 'registry/display-data-governance.v1.yaml',
      must_contain: ['TT_DISPLAY_DATA_GOVERNANCE: ENFORCED'],
    },
    {
      id: 'ui_hygiene_gate',
      path: 'scripts/gates/check-production-ui-hygiene-gate.sh',
      must_contain: ['PRODUCTION_UI_HYGIENE_WAVE_A'],
    },
    {
      id: 'edge_case_open_p0_p1',
      path: 'frontend/lib/l5/l5EdgeCaseExceptionAuditModel.ts',
      must_contain: ['L5_EDGE_CASE_OPEN_P0', 'L5_EDGE_CASE_OPEN_P1'],
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
  const modelPath = path.join(ROOT, 'frontend/lib/l5/l5EdgeCaseExceptionAuditModel.ts');
  const modelSrc = fs.readFileSync(modelPath, 'utf8');
  const p0p1Zero =
    modelSrc.includes('export const L5_EDGE_CASE_OPEN_P0 = L5_EDGE_CASE_FINDINGS.filter') &&
    modelSrc.includes('export const L5_EDGE_CASE_OPEN_P1 = L5_EDGE_CASE_FINDINGS.filter');
  results.push({ id: 'edge_case_model_exports', pass: p0p1Zero });
  if (!p0p1Zero) findings.push({ id: 'edge_case_model', severity: 'P1', detail: modelPath });
  return results;
}

function runSiteWideTruthfulnessChecks(checklist, findings) {
  if (!fs.existsSync(MATRIX_PATH)) {
    findings.push({ id: 'matrix_missing', severity: 'P0', detail: MATRIX_PATH });
    return { pass: false, pass_count: 0, total: 0, consumer_pct: 0 };
  }
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const pages = matrix.pages || [];
  const expected = checklist.l5_truthfulness_policy?.min_pages_certified || 202;
  const gaps = [];
  let passCount = 0;
  let consumerPass = 0;
  let consumerTotal = 0;
  for (const page of pages) {
    const truth = page.layer5_operations_truth_per_page?.truthfulness || {};
    const ok = truth.verdict === 'PASS' || truth.verdict === 'N/A';
    if (ok) passCount += 1;
    else gaps.push(page.route);
    if (page.cluster !== 'admin_workspace') {
      consumerTotal += 1;
      if (truth.verdict === 'PASS' && truth.truthfulness_pct === 100) consumerPass += 1;
    }
  }
  const pass =
    pages.length === expected &&
    passCount === expected &&
    gaps.length === 0 &&
    consumerPass === consumerTotal;
  if (!pass) {
    findings.push({
      id: 'truthfulness_matrix_gaps',
      severity: 'P0',
      detail: `certified=${passCount}/${expected} consumer_100=${consumerPass}/${consumerTotal}`,
    });
  }
  return {
    pass,
    pass_count: passCount,
    total: expected,
    consumer_pass: consumerPass,
    consumer_total: consumerTotal,
    consumer_truthfulness_pct:
      consumerTotal > 0 ? Math.round((consumerPass / consumerTotal) * 1000) / 10 : 0,
    gaps: gaps.slice(0, 20),
    b36_apply: matrix.b36_apply || null,
  };
}

module.exports = {
  runDependencyChecks,
  runFrozenChainAggregation,
  runGateAggregationParity,
  runCrossModuleTruthfulnessRegression,
  runConsumerScanEvidenceParity,
  runReleaseGateSsot,
  runDashboardParity,
  runStaticSsotChecks,
  runSiteWideTruthfulnessChecks,
};
