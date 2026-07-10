/**
 * FPC B25-C6 · admin_workspace cluster probes (① local)
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
const ADMIN_APP = path.join(ROOT, 'frontend/app/admin');

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

function countAdminPageTsx() {
  let n = 0;
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name === 'page.tsx') n += 1;
    }
  }
  if (fs.existsSync(ADMIN_APP)) walk(ADMIN_APP);
  return n;
}

function runClusterMatrixChecks(checklist, findings) {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const names = clusterNames(checklist);
  const pages = matrix.pages.filter((p) => names.includes(p.cluster));
  const routes =
    checklist.cluster_routes?.length > 0
      ? checklist.cluster_routes
      : pages.map((p) => p.route).sort();
  const expected = checklist.cluster_page_count || routes.length;
  const checks = [];

  const pageTsxCount = countAdminPageTsx();
  const tsxOk = pageTsxCount === expected;
  if (!tsxOk) {
    findings.push({
      id: 'admin_page_tsx_count_drift',
      severity: 'P1',
      detail: `page.tsx=${pageTsxCount} expected=${expected}`,
    });
  }
  checks.push({ id: 'admin_page_tsx_count', pass: tsxOk, actual: pageTsxCount, expected });

  const countOk = pages.length === expected;
  if (!countOk) {
    findings.push({
      id: 'cluster_page_count_drift',
      severity: 'P0',
      detail: `matrix=${pages.length} expected=${expected}`,
    });
  }
  checks.push({ id: 'cluster_page_count', pass: countOk, matrix: pages.length, expected });

  const routeSet = new Set(routes);
  const missingRoutes = routes.filter((r) => !pages.some((p) => p.route === r));
  const extraRoutes = pages.filter((p) => !routeSet.has(p.route)).map((p) => p.route);
  const routesOk =
    missingRoutes.length === 0 &&
    extraRoutes.length === 0 &&
    (checklist.cluster_routes?.length ? true : pages.length === expected);
  if (checklist.cluster_routes?.length && !routesOk) {
    findings.push({
      id: 'cluster_route_set_drift',
      severity: 'P0',
      detail: `missing=${missingRoutes.join(',')} extra=${extraRoutes.join(',')}`,
    });
  }
  checks.push({ id: 'cluster_route_set', pass: routesOk || !checklist.cluster_routes?.length, missingRoutes, extraRoutes });

  const l1Ok = pages.every((p) =>
    Object.values(p.layer1_surface_coverage || {}).every((v) => v === 'PASS' || v === 'N/A')
  );
  if (!l1Ok) {
    findings.push({ id: 'cluster_l1_incomplete', severity: 'P0', detail: 'admin_workspace L1 not PASS' });
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
      detail: 'Run apply-fpc-l2-admin-workspace-matrix after gates',
    });
  }
  checks.push({ id: 'cluster_l2_certified', pass: l2Ready, page_count: pages.length });

  const ownerOk = pages.every((p) => {
    const pagePath = p.owner_files?.page;
    return pagePath && fs.existsSync(path.join(ROOT, pagePath));
  });
  if (!ownerOk) {
    findings.push({ id: 'cluster_owner_file_missing', severity: 'P1', detail: 'page.tsx path drift' });
  }
  checks.push({ id: 'cluster_owner_files', pass: ownerOk });

  return { pass: checks.every((c) => c.pass), checks, pages, clusters: names, routes };
}

function runDashboardParity(checklist, findings) {
  const checks = [];
  const dash = readJson(checklist.dashboard_parity?.release_dashboard_json);
  const priorId = checklist.dashboard_parity?.prior_batch_id || 'B25-C5';
  const batchId = checklist.dashboard_parity?.registry_batch_id || 'B25-C6';
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
  const regHasBatch = registryRaw.includes('id: B25-C6') && registryRaw.includes('admin_workspace');
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
    { id: 'admin_readme', path: checklist.owner_ssot },
    { id: 'admin_closure', path: 'frontend/evidence/GO_local_admin_workspace_closure/README.md' },
    { id: 'admin_rbac_registry', path: 'registry/admin-rbac-route-matrix.v1.yaml' },
    { id: 'admin_perfect_closure', path: 'frontend/evidence/GO_local_admin_workspace_closure/ADMIN-L5-PERFECT-CLOSURE-REPORT.md' },
  ];
  for (const f of files) {
    const abs = path.join(ROOT, f.path);
    const pass = fs.existsSync(abs);
    if (!pass) findings.push({ id: `display_ssot_missing:${f.id}`, severity: 'P1', detail: f.path });
    checks.push({ id: f.id, pass, path: f.path });
  }
  return { pass: checks.every((c) => c.pass), checks };
}

function runSsotRows(rows, findings, { key, p0Ids = [] }) {
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
    if (row.id === 'test_accounts_not_public_catalog') {
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

function runAdminRbacSsot(checklist, findings) {
  return runSsotRows(checklist.admin_rbac_ssot || [], findings, {
    key: 'admin_rbac',
    p0Ids: ['require_admin_actor', 'rbac_route_deny_matrix'],
  });
}

function runCmsOpsSsot(checklist, findings) {
  return runSsotRows(checklist.cms_ops_ssot || [], findings, {
    key: 'cms_ops',
    p0Ids: ['content_publish_queue', 'test_accounts_not_public_catalog'],
  });
}

function runWorkflowSsot(checklist, findings) {
  return runSsotRows(checklist.workflow_ssot || [], findings, {
    key: 'workflow',
    p0Ids: ['admin_audit_page'],
  });
}

async function runCmsApiUnauthProbe(checklist, findings, apiBase) {
  const paths = checklist.cms_api_unauth_probe || [];
  const checks = [];
  let allPass = true;
  for (const p of paths) {
    let pass = false;
    let status = 0;
    try {
      const res = await fetch(`${apiBase}${p}`, { signal: AbortSignal.timeout(15000) });
      status = res.status;
      pass = status === 401 || status === 403;
    } catch (e) {
      findings.push({
        id: `cms_api_unauth_fail:${p}`,
        severity: 'P0',
        detail: String(e.message || e),
      });
      allPass = false;
    }
    if (!pass) {
      allPass = false;
      findings.push({
        id: `cms_api_unauth_leak:${p}`,
        severity: 'P0',
        detail: `unauth ${p} HTTP ${status} (want 401/403)`,
      });
    }
    checks.push({ id: p, pass, status });
  }
  return { pass: allPass, checks };
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
      if (!text.includes('id: B25-C6') || !text.includes('admin_workspace')) {
        pass = false;
        findings.push({ id: 'registry_b25_c6_drift', severity: 'P0', detail: rel });
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
  runAdminRbacSsot,
  runCmsOpsSsot,
  runWorkflowSsot,
  runCmsApiUnauthProbe,
  runDisplayChainSsot,
  runStaticSsotChecks,
  countAdminPageTsx,
  MATRIX_PATH,
};
