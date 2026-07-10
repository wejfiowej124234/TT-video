/**
 * FPC B23 · L1 full page coverage probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const APP = path.join(ROOT, 'frontend/app');
const MATRIX_PATH = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json'
);

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

function walkPages(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPages(p, acc);
    else if (ent.name === 'page.tsx') acc.push(p);
  }
  return acc;
}

function l1Complete(l1) {
  return Object.values(l1 || {}).every((v) => v === 'PASS' || v === 'N/A');
}

function runMatrixCoverageChecks(checklist, findings) {
  const targets = checklist.matrix_targets || { pages_total: 202, l1_coverage_pct: 100 };
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const pages = matrix.pages || [];
  const routes = pages.map((p) => p.route);
  const dupes = routes.filter((r, i) => routes.indexOf(r) !== i);
  const uniqueDupes = [...new Set(dupes)];

  const diskCount = walkPages(APP).length;
  const l1Done = pages.filter((p) => l1Complete(p.layer1_surface_coverage)).length;
  const pct = matrix.coverage_summary?.coverage_pct ?? 0;

  const checks = [];

  const countOk = pages.length === targets.pages_total && diskCount === targets.pages_total;
  if (!countOk) {
    findings.push({
      id: 'matrix_page_count_drift',
      severity: 'P0',
      detail: `matrix=${pages.length} disk=${diskCount} target=${targets.pages_total}`,
    });
  }
  checks.push({
    id: 'matrix_page_count',
    domain: 'page_matrix_202_enumeration',
    pass: countOk,
    matrix: pages.length,
    disk: diskCount,
  });

  const dupOk = uniqueDupes.length === 0;
  if (!dupOk) {
    findings.push({
      id: 'matrix_duplicate_routes',
      severity: 'P0',
      detail: uniqueDupes.join(', '),
    });
  }
  checks.push({
    id: 'matrix_no_duplicate_routes',
    domain: 'duplicate_route_drift',
    pass: dupOk,
    duplicates: uniqueDupes,
  });

  const l1Ok = l1Done === targets.pages_total && pct >= targets.l1_coverage_pct;
  if (!l1Ok) {
    findings.push({
      id: 'matrix_l1_coverage',
      severity: 'P0',
      detail: `l1=${l1Done}/${pages.length} pct=${pct}`,
    });
  }
  checks.push({
    id: 'matrix_l1_coverage',
    domain: 'layer1_surface_coverage',
    pass: l1Ok,
    l1_complete: l1Done,
    coverage_pct: pct,
  });

  const gs = matrix.inventory?.global_surfaces || {};
  const globalOk = gs.not_found && gs.global_error && gs.root_layout;
  if (!globalOk) {
    findings.push({
      id: 'global_surfaces_missing',
      severity: 'P0',
      detail: JSON.stringify(gs),
    });
  }
  checks.push({
    id: 'global_surfaces',
    domain: 'global_not_found_error',
    pass: globalOk,
    surfaces: gs,
  });

  const b23Apply = matrix.b23_l1_apply;
  const applyOk = b23Apply?.l1_complete === targets.pages_total && b23Apply?.missing_routes_in_forensic === 0;
  if (!applyOk) {
    findings.push({
      id: 'b23_l1_apply_incomplete',
      severity: 'P0',
      detail: JSON.stringify(b23Apply || {}),
    });
  }
  checks.push({
    id: 'b23_l1_apply',
    domain: 'page_matrix_202_enumeration',
    pass: applyOk,
    apply: b23Apply,
  });

  return { pass: checks.every((c) => c.pass), checks, matrix_summary: matrix.coverage_summary };
}

function runForensicParity(forensicSummaryPath, findings) {
  if (!forensicSummaryPath || !fs.existsSync(forensicSummaryPath)) {
    findings.push({ id: 'forensic_summary_missing', severity: 'P0', detail: String(forensicSummaryPath) });
    return { pass: false };
  }
  const forensic = JSON.parse(fs.readFileSync(forensicSummaryPath, 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const matrixRoutes = new Set(matrix.pages.map((p) => p.route));
  const forensicRoutes = new Set(forensic.pages.map((p) => p.route));
  const onlyMatrix = [...matrixRoutes].filter((r) => !forensicRoutes.has(r));
  const onlyForensic = [...forensicRoutes].filter((r) => !matrixRoutes.has(r));
  const pass =
    onlyMatrix.length === 0 &&
    onlyForensic.length === 0 &&
    forensic.l1_complete === forensic.pages_total &&
    forensic.duplicate_routes?.length === 0;
  if (!pass) {
    findings.push({
      id: 'forensic_matrix_route_drift',
      severity: 'P0',
      detail: `onlyMatrix=${onlyMatrix.length} onlyForensic=${onlyForensic.length} dupes=${forensic.duplicate_routes?.length}`,
    });
  }
  return {
    pass,
    forensic_path: forensicSummaryPath,
    l1_coverage_pct: forensic.l1_coverage_pct,
    duplicate_routes: forensic.duplicate_routes || [],
  };
}

function runStaticSsotChecks(root, findings) {
  const checks = [
    {
      id: 'ssot_96_20_index',
      domain: 'route_registry_04_13_1_parity',
      path: 'docs/spec/96-20-前后端页面对齐与UI生产级审计报告.md',
      must_contain: ['page.tsx', '路由'],
    },
    {
      id: 'ssot_page_matrix_schema',
      domain: 'page_matrix_202_enumeration',
      path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
      must_contain: ['fpc_100_page_certification_matrix', 'layer1_surface_coverage'],
    },
    {
      id: 'ssot_fpc_registry_b23',
      domain: 'route_registry_04_13_1_parity',
      path: 'registry/full-production-certification-checklist.v1.yaml',
      must_contain: ['id: B23', 'check-04-frontend-routes-vs-app.py'],
    },
  ];
  const results = [];
  for (const c of checks) {
    const abs = path.join(root, c.path);
    let pass = fs.existsSync(abs);
    if (!pass) {
      findings.push({ id: `static_missing:${c.id}`, severity: 'P1', detail: c.path });
    } else {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of c.must_contain) {
        if (!text.includes(needle)) {
          pass = false;
          findings.push({
            id: `static_ssot:${c.id}`,
            severity: 'P1',
            detail: `${c.path} missing ${needle}`,
          });
        }
      }
    }
    results.push({ id: c.id, domain: c.domain, pass, path: c.path });
  }
  return results;
}

module.exports = {
  loadChecklist,
  runMatrixCoverageChecks,
  runForensicParity,
  runStaticSsotChecks,
  MATRIX_PATH,
};
