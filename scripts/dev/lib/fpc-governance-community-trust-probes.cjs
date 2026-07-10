/**
 * FPC B25-C5 · governance_economics + community + trust_legal_help cluster probes (① local)
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

function clusterNames(checklist) {
  return checklist.clusters || (checklist.cluster ? [checklist.cluster] : []);
}

function runClusterMatrixChecks(checklist, findings) {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const routes = checklist.cluster_routes || [];
  const names = clusterNames(checklist);
  const pages = matrix.pages.filter((p) => names.includes(p.cluster));
  const checks = [];

  const countOk = pages.length === routes.length;
  if (!countOk) {
    findings.push({
      id: 'cluster_page_count_drift',
      severity: 'P0',
      detail: `matrix=${pages.length} checklist=${routes.length} clusters=${names.join('+')}`,
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
    findings.push({ id: 'cluster_l1_incomplete', severity: 'P0', detail: `${names.join('+')} L1 not PASS` });
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
      detail: 'Run apply-fpc-l2-governance-community-trust-matrix after gates',
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

  return { pass: checks.every((c) => c.pass), checks, pages, clusters: names };
}

function runDashboardParity(checklist, findings) {
  const checks = [];
  const dash = readJson(checklist.dashboard_parity?.release_dashboard_json);
  const priorId = checklist.dashboard_parity?.prior_batch_id || 'B25-C4';
  const batchId = checklist.dashboard_parity?.registry_batch_id || 'B25-C5';
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
    registryRaw.includes('id: B25-C5') &&
    (registryRaw.includes('governance_economics') || registryRaw.includes('trust_legal_help'));
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
    { id: 'community_freeze', path: checklist.owner_ssot },
    { id: 'governance_proposals_freeze', path: 'frontend/evidence/GO_local_identity_workspace/GOVERNANCE-PROPOSALS-L5-FREEZE.md' },
    { id: 'display_data_governance', path: 'registry/display-data-governance.v1.yaml' },
    { id: 'community_readme', path: 'frontend/app/community/README.md' },
    { id: 'governance_params_readme', path: 'frontend/app/governance/params/README.md' },
  ];
  for (const f of files) {
    const abs = path.join(ROOT, f.path);
    const pass = fs.existsSync(abs);
    if (!pass) findings.push({ id: `display_ssot_missing:${f.id}`, severity: 'P1', detail: f.path });
    checks.push({ id: f.id, pass, path: f.path });
  }

  for (const rel of [
    checklist.owner_ssot,
    'frontend/evidence/GO_local_identity_workspace/GOVERNANCE-PROPOSALS-L5-FREEZE.md',
  ]) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    const frozen = /冻结|FROZEN|UI 已锁|已冻结/i.test(text);
    if (!frozen) {
      findings.push({ id: `ui_freeze_doc_drift:${path.basename(rel)}`, severity: 'P1', detail: rel });
    }
    checks.push({ id: `freeze_doc:${path.basename(rel)}`, pass: frozen });
  }

  return { pass: checks.every((c) => c.pass), checks };
}

function runSsotRows(rows, checklist, findings, { key, p0Ids = [] }) {
  const checks = [];
  for (const row of rows) {
    const abs = path.join(ROOT, row.path);
    let pass = fs.existsSync(abs);
    if (!pass) {
      findings.push({ id: `${key}_missing:${row.id}`, severity: 'P0', detail: row.path });
      checks.push({ id: row.id, pass: false, path: row.path });
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    for (const needle of row.must_contain || []) {
      if (!text.includes(needle)) {
        pass = false;
        const sev = p0Ids.includes(row.id) ? 'P0' : 'P1';
        findings.push({
          id: `${key}_drift:${row.id}`,
          severity: sev,
          detail: `${row.path} missing ${needle}`,
        });
      }
    }
    if (row.id === 'immutable_test_accounts') {
      const pubMatch = text.match(/public_catalog:\s*\n(?:[^\n]*\n)*?\s*allowed:\s*(true|false)/);
      if (pubMatch && pubMatch[1] === 'true') {
        pass = false;
        findings.push({
          id: 'test_account_public_catalog_leak',
          severity: 'P0',
          detail: 'public_catalog must remain allowed: false',
        });
      }
    }
    checks.push({ id: row.id, pass, path: row.path });
  }
  return { pass: checks.every((c) => c.pass), checks };
}

function runDisplayGovernanceSsot(checklist, findings) {
  return runSsotRows(checklist.display_governance_ssot || [], checklist, findings, {
    key: 'display_governance',
    p0Ids: ['immutable_test_accounts', 'display_data_governance_registry'],
  });
}

function runContentLifecycleSsot(checklist, findings) {
  return runSsotRows(checklist.content_lifecycle_ssot || [], checklist, findings, {
    key: 'content_lifecycle',
    p0Ids: ['governance_proposals_api', 'community_posts_db'],
  });
}

function runDisplayChainSsot(checklist, findings) {
  const rows = checklist.display_chain_ssot || [];
  const checks = [];
  for (const row of rows) {
    const abs = path.join(ROOT, row.path);
    let pass = fs.existsSync(abs);
    if (!pass) {
      findings.push({ id: `display_chain_missing:${row.id}`, severity: 'P1', detail: row.path });
    } else {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of row.must_contain || []) {
        if (!text.includes(needle)) {
          pass = false;
          findings.push({
            id: `display_chain_drift:${row.id}`,
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
    if (pass && rel.endsWith('.yaml') && rel.includes('full-production-certification')) {
      const text = fs.readFileSync(abs, 'utf8');
      if (!text.includes('id: B25-C5') || !text.includes('governance_economics')) {
        pass = false;
        findings.push({ id: 'registry_b25_c5_drift', severity: 'P0', detail: rel });
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
  runDisplayGovernanceSsot,
  runContentLifecycleSsot,
  runDisplayChainSsot,
  runStaticSsotChecks,
  MATRIX_PATH,
};
