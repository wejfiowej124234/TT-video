/**
 * FPC B25-C2 · market_commerce cluster probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const MATRIX_PATH = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json'
);
const REGISTRY_PATH = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

function readJson(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function runClusterMatrixChecks(checklist, findings) {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const routes = checklist.cluster_routes || [];
  const pages = matrix.pages.filter((p) => p.cluster === checklist.cluster);
  const checks = [];

  const countOk = pages.length === routes.length;
  if (!countOk) {
    findings.push({
      id: 'cluster_page_count_drift',
      severity: 'P0',
      detail: `matrix=${pages.length} checklist=${routes.length}`,
    });
  }
  checks.push({ id: 'cluster_page_count', pass: countOk, matrix: pages.length, expected: routes.length });

  const routeSet = new Set(routes);
  const missingRoutes = routes.filter((r) => !pages.some((p) => p.route === r));
  const extraRoutes = pages.filter((p) => !routeSet.has(p.route)).map((p) => p.route);
  const routesOk = missingRoutes.length === 0 && extraRoutes.length === 0;
  if (!routesOk) {
    findings.push({
      id: 'cluster_route_set_drift',
      severity: 'P0',
      detail: `missing=${missingRoutes.join(',')} extra=${extraRoutes.join(',')}`,
    });
  }
  checks.push({ id: 'cluster_route_set', pass: routesOk, missingRoutes, extraRoutes });

  const l1Ok = pages.every((p) =>
    Object.values(p.layer1_surface_coverage || {}).every((v) => v === 'PASS' || v === 'N/A')
  );
  if (!l1Ok) {
    findings.push({ id: 'cluster_l1_incomplete', severity: 'P0', detail: 'market_commerce L1 not PASS' });
  }
  checks.push({ id: 'cluster_l1_complete', pass: l1Ok });

  const policy = checklist.l2_score_policy || {};
  const l2Ready = pages.every((p) => {
    const s = p.layer2_l5_scores || {};
    const scoresOk =
      s.ui != null &&
      s.ux != null &&
      s.content != null &&
      s.function_flow != null &&
      s.ui >= (policy.min_ui || 8) &&
      s.function_flow >= (policy.min_function_flow || 8);
    const prOk = policy.production_ready_allowed?.includes(p.production_ready);
    return scoresOk && prOk && p.certification_verdict === 'PASS';
  });
  if (!l2Ready) {
    findings.push({
      id: 'cluster_l2_not_certified',
      severity: 'P0',
      detail: 'Run apply-fpc-l2-market-commerce-matrix after gates',
    });
  }
  checks.push({ id: 'cluster_l2_certified', pass: l2Ready, pages: pages.map((p) => p.route) });

  const ownerOk = pages.every((p) => {
    const pagePath = p.owner_files?.page;
    return pagePath && fs.existsSync(path.join(ROOT, pagePath));
  });
  if (!ownerOk) {
    findings.push({ id: 'cluster_owner_file_missing', severity: 'P1', detail: 'page.tsx path drift' });
  }
  checks.push({ id: 'cluster_owner_files', pass: ownerOk });

  return { pass: checks.every((c) => c.pass), checks, pages };
}

function runDashboardParity(checklist, findings) {
  const checks = [];
  const dash = readJson(checklist.dashboard_parity?.release_dashboard_json);
  const priorId = checklist.dashboard_parity?.prior_batch_id || 'B25-C1';
  const batchId = checklist.dashboard_parity?.registry_batch_id || 'B25-C2';
  const priorBatch = readJson(
    `docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-BATCH-${priorId}-LATEST.json`
  );

  const priorPassOk = !!(
    priorBatch?.gate_pass &&
    priorBatch?.certification_frozen &&
    (priorBatch?.verdict === 'PASS' || priorBatch?.dod?.gate_pass === true)
  );
  if (!priorPassOk) {
    findings.push({
      id: 'dashboard_prior_batch_not_pass',
      severity: 'P0',
      detail: `${priorId} gate_pass=${priorBatch?.gate_pass} verdict=${priorBatch?.verdict}`,
    });
  }
  checks.push({ id: 'prior_batch_pass', pass: priorPassOk, batch_id: priorId });

  const nextOk = dash?.burn_down?.next_required_batch === batchId;
  if (!nextOk) {
    findings.push({
      id: 'dashboard_next_batch_drift',
      severity: 'P0',
      detail: `dashboard=${dash?.burn_down?.next_required_batch} expected=${batchId}`,
    });
  }
  checks.push({
    id: 'dashboard_next_required_batch',
    pass: nextOk,
    expected: batchId,
    actual: dash?.burn_down?.next_required_batch,
  });

  const registryRaw = fs.existsSync(REGISTRY_PATH) ? fs.readFileSync(REGISTRY_PATH, 'utf8') : '';
  const regHasBatch =
    registryRaw.includes(`id: B25-C2`) && registryRaw.includes('market_commerce');
  if (!regHasBatch) {
    findings.push({ id: 'registry_batch_missing', severity: 'P0', detail: batchId });
  }
  checks.push({ id: 'registry_batch_ssot', pass: regHasBatch, batch_id: batchId });

  const listed = (dash?.ai_review_summary || []).some((r) => r.batch_id === priorId);
  if (!listed) {
    findings.push({ id: 'dashboard_batch_list_missing', severity: 'P1', detail: priorId });
  }
  checks.push({ id: 'dashboard_lists_prior_batch', pass: listed, batch_id: priorId });

  return { pass: checks.every((c) => c.pass), checks, dash_ts: dash?.timestamp_utc };
}

function runDisplayStateParity(checklist, findings) {
  const checks = [];
  const files = [
    { id: 'landing_market_ssot', path: checklist.owner_ssot },
    { id: 'five_main_freeze', path: 'frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md' },
    { id: 'acquisition_readme', path: 'frontend/app/market/acquisition/README.md' },
    { id: 'provider_readme', path: 'frontend/app/market/provider/README.md' },
    { id: 'market_hub_subnav', path: 'frontend/components/market/MarketHubSubNav.tsx' },
  ];
  for (const f of files) {
    const abs = path.join(ROOT, f.path);
    const pass = fs.existsSync(abs);
    if (!pass) findings.push({ id: `display_ssot_missing:${f.id}`, severity: 'P1', detail: f.path });
    checks.push({ id: f.id, pass, path: f.path });
  }

  const freezeText = fs.existsSync(path.join(ROOT, files[1].path))
    ? fs.readFileSync(path.join(ROOT, files[1].path), 'utf8')
    : '';
  const marketFrozen =
    freezeText.includes('/market') &&
    (/FROZEN|冻结|UI 已冻结/i.test(freezeText));
  if (!marketFrozen) {
    findings.push({ id: 'market_ui_freeze_missing', severity: 'P1', detail: 'FIVE-MAIN missing /market freeze' });
  }
  checks.push({ id: 'market_ui_freeze_doc', pass: marketFrozen });

  return { pass: checks.every((c) => c.pass), checks };
}

function runApiDataChainSsot(checklist, findings) {
  const rows = checklist.api_data_chain_ssot || [];
  const checks = [];
  for (const row of rows) {
    const abs = path.join(ROOT, row.path);
    let pass = fs.existsSync(abs);
    if (!pass) {
      findings.push({ id: `api_ssot_missing:${row.id}`, severity: 'P0', detail: row.path });
    } else {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of row.must_contain || []) {
        if (!text.includes(needle)) {
          pass = false;
          findings.push({
            id: `api_ssot_drift:${row.id}`,
            severity: 'P1',
            detail: `${row.path} missing ${needle}`,
          });
        }
      }
    }
    checks.push({ id: row.id, pass, path: row.path });
  }
  return { pass: checks.every((c) => c.pass), checks };
}

function runStaticSsotChecks(root, checklist, findings) {
  const checks = [];
  for (const rel of checklist.quality_gates || []) {
    const abs = path.join(root, rel);
    let pass = fs.existsSync(abs);
    if (!pass) {
      findings.push({ id: `static_missing:${path.basename(rel)}`, severity: 'P1', detail: rel });
    }
    if (pass && rel.endsWith('.yaml')) {
      const text = fs.readFileSync(abs, 'utf8');
      if (!text.includes('id: B25-C2') || !text.includes('market_commerce')) {
        pass = false;
        findings.push({ id: 'registry_b25_c2_drift', severity: 'P0', detail: rel });
      }
    }
    checks.push({ id: `static:${path.basename(rel)}`, pass, path: rel });
  }
  return checks;
}

module.exports = {
  loadChecklist,
  runClusterMatrixChecks,
  runDashboardParity,
  runDisplayStateParity,
  runApiDataChainSsot,
  runStaticSsotChecks,
  MATRIX_PATH,
};
