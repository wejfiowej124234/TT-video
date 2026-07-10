/**
 * FPC B33 · L5 operations probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const MATRIX_PATH = path.join(EVID, 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json');
const DASHBOARD_PATH = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
const REGISTRY_PATH = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');

function runDependencyChecks(findings) {
  const deps = [
    { id: 'B09', path: path.join(EVID, 'FPC-100-BATCH-B09-LATEST.json') },
    { id: 'B25-C6', path: path.join(EVID, 'FPC-100-BATCH-B25-C6-LATEST.json') },
  ];
  const checks = [];
  for (const d of deps) {
    if (!fs.existsSync(d.path)) {
      findings.push({ id: `${d.id}_missing`, severity: 'P0', detail: d.path });
      checks.push({ ...d, pass: false });
      continue;
    }
    const b = JSON.parse(fs.readFileSync(d.path, 'utf8'));
    const pass = !!b.certification_frozen && b.verdict === 'PASS' && b.gate_pass !== false;
    if (!pass) {
      findings.push({
        id: `${d.id}_not_frozen_pass`,
        severity: 'P0',
        detail: `${d.id} verdict=${b.verdict} frozen=${b.certification_frozen}`,
      });
    }
    checks.push({ ...d, pass, verdict: b.verdict });
  }
  return { pass: checks.every((c) => c.pass), checks };
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
  const hasB33 = registryRaw.includes('id: B33') && registryRaw.includes('Operations');
  const nextOk = dash.burn_down?.next_required_batch === 'B33';
  if (!hasB33) findings.push({ id: 'registry_b33_missing', severity: 'P1', detail: 'B33 row' });
  if (!nextOk) {
    findings.push({
      id: 'dashboard_next_batch',
      severity: 'P1',
      detail: `expected B33 got ${dash.burn_down?.next_required_batch}`,
    });
  }
  return {
    pass: hasB33 && nextOk,
    checks: [
      { id: 'registry_b33', pass: hasB33 },
      { id: 'dashboard_next_b33', pass: nextOk, next: dash.burn_down?.next_required_batch },
    ],
    readiness_pct: dash.release_readiness?.pct ?? dash.burn_down?.release_readiness_pct,
  };
}

function runStaticSsotChecks(checklist, findings) {
  const items = [
    {
      id: 'ops_workflow_registry',
      path: 'registry/traveltrust-operations-workflow.v1.yaml',
      must_contain: ['TT_OPERATIONS_WORKFLOW: ENFORCED', 'content_operations'],
    },
    {
      id: 'ops_platform_registry',
      path: 'registry/traveltrust-operations-platform.v1.yaml',
      must_contain: ['TT_OPERATIONS_PLATFORM', 'catalog_operations'],
    },
    {
      id: 'ops_workflow_runbook',
      path: 'docs/runbook/TT-TRAVELTRUST-OPERATIONS-WORKFLOW.md',
      must_contain: ['Operations Workflow (TTOW)', 'traveltrust-operations-workflow.v1.yaml'],
    },
    {
      id: 'public_ops_ssot_gate',
      path: 'scripts/gates/check-official-ops-public-operations-ssot.sh',
      must_contain: ['public-operations'],
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

function runSiteWideOperationsChecks(checklist, findings) {
  if (!fs.existsSync(MATRIX_PATH)) {
    findings.push({ id: 'matrix_missing', severity: 'P0', detail: MATRIX_PATH });
    return { pass: false, pass_count: 0, total: 0 };
  }
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const adminPages = matrix.pages.filter((p) => p.cluster === 'admin_workspace');
  const expected = checklist.l5_operations_policy?.min_admin_workspace_pages_certified || 114;
  const gaps = [];
  let passCount = 0;
  for (const page of adminPages) {
    const co = page.layer5_operations_truth_per_page?.content_operations || {};
    const ok = co.verdict === 'PASS' && co.publish_state_verified === 'PASS';
    if (ok) passCount += 1;
    else gaps.push(page.route);
  }
  const pass = adminPages.length === expected && passCount === expected && gaps.length === 0;
  if (!pass) {
    findings.push({
      id: 'admin_ops_matrix_gaps',
      severity: 'P0',
      detail: `certified=${passCount}/${expected} gaps=${gaps.slice(0, 5).join(',')}`,
    });
  }
  const applyPath = path.join(EVID, 'B33-operations/b33-apply-latest.json');
  let b33Apply = null;
  if (fs.existsSync(applyPath)) {
    b33Apply = JSON.parse(fs.readFileSync(applyPath, 'utf8'));
  }
  return {
    pass,
    pass_count: passCount,
    total: expected,
    admin_pages: adminPages.length,
    gaps: gaps.slice(0, 20),
    b33_apply: b33Apply,
  };
}

function findLatestWorkflowEvidence() {
  const base = path.join(ROOT, 'evidence/GO_operations_workflow_validation');
  if (!fs.existsSync(base)) return null;
  let latest = null;
  for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const p = path.join(base, ent.name, 'workflow-validation.json');
    if (!fs.existsSync(p)) continue;
    const m = fs.statSync(p).mtimeMs;
    if (!latest || m > latest.mtime) latest = { path: p, mtime: m };
  }
  return latest?.path || null;
}

function runWorkflowEvidenceParity(findings) {
  const wfPath = findLatestWorkflowEvidence();
  if (!wfPath) {
    findings.push({ id: 'workflow_evidence_missing', severity: 'P0', detail: 'GO_operations_workflow_validation' });
    return { pass: false };
  }
  const report = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
  const allowWarn = true;
  const pass =
    report.verdict === 'PASS' || (allowWarn && report.verdict === 'PASS_WITH_WARN');
  if (!pass) {
    findings.push({
      id: 'workflow_verdict_fail',
      severity: 'P0',
      detail: report.verdict,
    });
  }
  const domains = report.domains || {};
  const domainFails = Object.entries(domains).filter(([, v]) => v.verdict === 'FAIL');
  if (domainFails.length) {
    findings.push({
      id: 'workflow_domain_fail',
      severity: 'P0',
      detail: domainFails.map(([k]) => k).join(','),
    });
  }
  return {
    pass: pass && domainFails.length === 0,
    verdict: report.verdict,
    path: wfPath,
    summary: report.summary,
    domains: Object.fromEntries(Object.entries(domains).map(([k, v]) => [k, v.verdict])),
  };
}

module.exports = {
  runDependencyChecks,
  runReleaseGateSsot,
  runDashboardParity,
  runStaticSsotChecks,
  runSiteWideOperationsChecks,
  runWorkflowEvidenceParity,
};
