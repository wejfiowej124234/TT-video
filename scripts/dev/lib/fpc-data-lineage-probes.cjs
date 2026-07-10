/**
 * FPC B31 · L5 data lineage probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

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

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

function runSiteWideLineageChecks(checklist, findings) {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const pages = matrix.pages || [];
  const policy = checklist.l5_lineage_policy || {};
  const required = policy.required_fields || ['db', 'api', 'projection', 'frontend', 'ui_field_map'];
  const gaps = [];
  const checks = [];

  for (const page of pages) {
    const dl = page.layer5_operations_truth_per_page?.data_lineage || {};
    let ok = true;
    if (dl.chain_documented !== policy.require_chain_documented) {
      ok = false;
      gaps.push(`${page.route}:chain_documented`);
    }
    if (dl.verdict !== policy.require_verdict) {
      ok = false;
      gaps.push(`${page.route}:verdict`);
    }
    for (const f of required) {
      if (!dl[f]) {
        ok = false;
        gaps.push(`${page.route}:missing_${f}`);
      }
    }
    checks.push({ route: page.route, cluster: page.cluster, pass: ok });
  }

  const passCount = checks.filter((c) => c.pass).length;
  const pass = passCount === pages.length && pages.length >= (policy.min_pages_documented ?? 202);
  if (!pass) {
    findings.push({
      id: 'site_wide_lineage_incomplete',
      severity: 'P0',
      detail: `${passCount}/${pages.length} PASS · gaps=${gaps.slice(0, 12).join('; ')}${gaps.length > 12 ? '…' : ''}`,
    });
  }

  return {
    pass,
    checks,
    pass_count: passCount,
    total: pages.length,
    gaps,
    b31_apply: matrix.b31_apply || null,
  };
}

function runDependencyChecks(findings) {
  const rows = [];
  for (const batchId of ['B04', 'B11']) {
    const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
    if (!fs.existsSync(p)) {
      findings.push({ id: `${batchId}_missing`, severity: 'P0', detail: p });
      rows.push({ batch_id: batchId, pass: false });
      continue;
    }
    const b = JSON.parse(fs.readFileSync(p, 'utf8'));
    const pass = b.verdict === 'PASS' && !!b.certification_frozen && b.gate_pass !== false;
    if (!pass) {
      findings.push({ id: `${batchId}_not_frozen_pass`, severity: 'P0', detail: b.verdict });
    }
    rows.push({ batch_id: batchId, pass, verdict: b.verdict, frozen: b.certification_frozen });
  }
  return { pass: rows.every((r) => r.pass), rows };
}

function runDashboardParity(checklist, findings) {
  if (!fs.existsSync(DASHBOARD_PATH)) {
    findings.push({ id: 'dashboard_missing', severity: 'P0', detail: DASHBOARD_PATH });
    return { pass: false };
  }
  const dash = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
  const registryRaw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const hasB31 = registryRaw.includes('id: B31') && registryRaw.includes('Data Lineage');
  const nextOk = dash.burn_down?.next_required_batch === 'B31';
  if (!hasB31) {
    findings.push({ id: 'registry_b31_missing', severity: 'P1', detail: 'B31 registry row' });
  }
  if (!nextOk) {
    findings.push({
      id: 'dashboard_next_batch',
      severity: 'P1',
      detail: `expected B31 got ${dash.burn_down?.next_required_batch}`,
    });
  }
  return {
    pass: hasB31 && nextOk,
    checks: [
      { id: 'registry_b31', pass: hasB31 },
      { id: 'dashboard_next_b31', pass: nextOk, next: dash.burn_down?.next_required_batch },
    ],
    readiness_pct: dash.release_readiness?.pct ?? dash.burn_down?.release_readiness_pct,
  };
}

function runStaticSsotChecks(checklist, findings) {
  const items = [
    {
      id: 'ddg_registry',
      path: 'registry/display-data-governance.v1.yaml',
      must_contain: ['TT_DISPLAY_DATA_GOVERNANCE: ENFORCED', 'surfaces:'],
    },
    {
      id: 'ddg_runbook',
      path: 'docs/runbook/TT-DISPLAY-DATA-GOVERNANCE.md',
      must_contain: ['Display Data Governance', 'run-display-data-governance.sh'],
    },
    {
      id: 'page_matrix_b31',
      path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
      must_contain: ['b31_apply', 'data_lineage'],
    },
  ];
  const results = [];
  for (const item of items) {
    const abs = path.join(ROOT, item.path);
    const pass =
      fs.existsSync(abs) &&
      item.must_contain.every((needle) => fs.readFileSync(abs, 'utf8').includes(needle));
    if (!pass) {
      findings.push({ id: item.id, severity: 'P1', detail: item.path });
    }
    results.push({ ...item, pass });
  }
  return results;
}

module.exports = {
  loadChecklist,
  runSiteWideLineageChecks,
  runDependencyChecks,
  runDashboardParity,
  runStaticSsotChecks,
};
