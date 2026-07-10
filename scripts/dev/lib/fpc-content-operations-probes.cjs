/**
 * FPC B30 · L5 content operations probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const CMS_MATRIX_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ASSET-MATRIX-LATEST.json');
const CMS_DAILY_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/daily/CMS-DAILY-REPORT-LATEST.json');
const CMS_HEALTH_LATEST = path.join(ROOT, 'evidence/GO_cms_content_l5/CMS-CONTENT-HEALTH-SCORE-LATEST.json');
const DASHBOARD_PATH = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
const REGISTRY_PATH = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

function runCmsEvidenceChecks(checklist, findings) {
  const policy = checklist.l5_content_ops_policy || {};
  const checks = [];
  const required = [
    { id: 'cms_asset_matrix_latest', path: CMS_MATRIX_LATEST },
    { id: 'cms_daily_report_latest', path: CMS_DAILY_LATEST },
    { id: 'cms_health_score_latest', path: CMS_HEALTH_LATEST },
  ];

  for (const r of required) {
    const pass = fs.existsSync(r.path);
    if (!pass) {
      findings.push({ id: r.id, severity: 'P0', detail: r.path });
    }
    checks.push({ ...r, pass });
  }

  let matrix = null;
  if (fs.existsSync(CMS_MATRIX_LATEST)) {
    matrix = JSON.parse(fs.readFileSync(CMS_MATRIX_LATEST, 'utf8'));
    const schemaOk = matrix.schema === 'traveltrust.cms_asset_matrix_report.v1';
    if (!schemaOk) {
      findings.push({ id: 'cms_matrix_schema', severity: 'P0', detail: matrix.schema });
    }
    checks.push({ id: 'cms_matrix_schema', pass: schemaOk, schema: matrix.schema });

    const rows = matrix.rows || [];
    const aligned = rows.filter((row) => row.source_aligned === true).length;
    const minAligned = policy.min_source_aligned_rows ?? 1;
    const alignOk = aligned >= minAligned;
    if (!alignOk) {
      findings.push({
        id: 'cms_source_alignment_zero',
        severity: 'P0',
        detail: `aligned=${aligned} min=${minAligned}`,
      });
    }
    checks.push({
      id: 'cms_source_alignment',
      pass: alignOk,
      aligned,
      total: rows.length,
      pct: matrix.source_alignment?.pct,
    });

    const hasConsumerRow = rows.some(
      (row) =>
        row.page_module?.includes('首页') ||
        row.asset_kind === 'landing_ambient' ||
        row.id === 'home_destination_ambient'
    );
    checks.push({ id: 'cms_consumer_surface_row', pass: hasConsumerRow, rows: rows.length });
  }

  return { pass: checks.every((c) => c.pass), checks, matrix };
}

function runB12Dependency(findings) {
  const b12Path = path.join(EVID, 'FPC-100-BATCH-B12-LATEST.json');
  if (!fs.existsSync(b12Path)) {
    findings.push({ id: 'b12_missing', severity: 'P0', detail: b12Path });
    return { pass: false };
  }
  const b12 = JSON.parse(fs.readFileSync(b12Path, 'utf8'));
  const pass =
    b12.verdict === 'PASS' &&
    !!b12.certification_frozen &&
    b12.gate_pass !== false;
  if (!pass) {
    findings.push({ id: 'b12_not_frozen_pass', severity: 'P0', detail: b12.verdict });
  }
  return { pass, verdict: b12.verdict, frozen: b12.certification_frozen };
}

function runDashboardParity(checklist, findings) {
  if (!fs.existsSync(DASHBOARD_PATH)) {
    findings.push({ id: 'dashboard_missing', severity: 'P0', detail: DASHBOARD_PATH });
    return { pass: false };
  }
  const dash = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
  const registryRaw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const hasB30 = registryRaw.includes('id: B30') && registryRaw.includes('Content Operations');
  const nextOk = dash.burn_down?.next_required_batch === 'B30';
  if (!hasB30) {
    findings.push({ id: 'registry_b30_missing', severity: 'P1', detail: 'B30 registry row' });
  }
  return {
    pass: hasB30 && nextOk,
    checks: [
      { id: 'registry_b30', pass: hasB30 },
      { id: 'dashboard_next_b30', pass: nextOk, next: dash.burn_down?.next_required_batch },
    ],
    readiness_pct: dash.release_readiness?.pct ?? dash.burn_down?.release_readiness_pct,
  };
}

function runStaticSsotChecks(checklist, findings) {
  const items = [
    {
      id: 'cms_asset_matrix_yaml',
      path: 'data/catalog/cms-asset-matrix.v1.yaml',
      must_contain: ['production_preparation:', 'ops_refresh_script:', 'asset_lifecycle_pipeline:'],
    },
    {
      id: 'quality_matrix_b30',
      path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
      must_contain: ['B30', 'L5'],
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
  runCmsEvidenceChecks,
  runB12Dependency,
  runDashboardParity,
  runStaticSsotChecks,
};
