/**
 * FPC B34 · L5 entity/data lifecycle probes (① local)
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
  const deps = checklist.depends_on_batches || ['B10', 'B31', 'B33'];
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
  const chain = checklist.l5_entity_lifecycle_policy?.frozen_chain_batches || [];
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
    completed: report.burn_down?.completed,
    total: report.burn_down?.total,
  };
}

function runCrossModuleLifecycleRegression(findings) {
  const checks = [];
  const corridors = [
    {
      id: 'B07_community',
      batch: 'B07',
      field: 'content_lifecycle',
      min_states: 4,
    },
    {
      id: 'B10_business_flows',
      batch: 'B10',
      field: 'business_flow_matrix',
      min_flows: 3,
    },
    {
      id: 'B33_operations_workflow',
      batch: 'B33',
      field: 'operations_live.workflow_validation',
      min_domains: 4,
    },
  ];

  for (const c of corridors) {
    const b = loadBatch(c.batch);
    let pass = isFrozenPass(b);
    if (c.batch === 'B07' && b?.content_lifecycle) {
      const states = b.content_lifecycle.lifecycle || b.content_lifecycle;
      const n = Array.isArray(states) ? states.length : 0;
      pass = pass && n >= c.min_states;
    }
    if (c.batch === 'B10' && b?.business_flow_matrix) {
      pass = pass && (b.business_flow_matrix.flow_count || 0) >= c.min_flows;
    }
    if (c.batch === 'B33' && b?.operations_live?.workflow_validation) {
      const domains = b.operations_live.workflow_validation.domains || {};
      pass = pass && Object.keys(domains).length >= c.min_domains;
    }
    if (!pass) {
      findings.push({ id: `cross_module_${c.id}`, severity: 'P0', detail: c.batch });
    }
    checks.push({ ...c, pass });
  }
  return { pass: checks.every((c) => c.pass), checks };
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
  const run04 = path.join(ROOT, 'scripts/gates/run-check-04-routes.sh');
  const raw = fs.existsSync(run04) ? fs.readFileSync(run04, 'utf8') : '';
  const wired = bundle.every((s) => raw.includes(s.replace('.py', '')) || raw.includes(s));
  if (!wired) {
    findings.push({ id: 'release_gate_not_wired_04', severity: 'P1', detail: 'B453-B457' });
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
  const hasB34 = registryRaw.includes('id: B34') && registryRaw.includes('Data Lifecycle');
  const nextOk = dash.burn_down?.next_required_batch === 'B34';
  if (!hasB34) findings.push({ id: 'registry_b34_missing', severity: 'P1', detail: 'B34 row' });
  if (!nextOk) {
    findings.push({
      id: 'dashboard_next_batch',
      severity: 'P1',
      detail: `expected B34 got ${dash.burn_down?.next_required_batch}`,
    });
  }
  return {
    pass: hasB34 && nextOk,
    checks: [
      { id: 'registry_b34', pass: hasB34 },
      { id: 'dashboard_next_b34', pass: nextOk, next: dash.burn_down?.next_required_batch },
    ],
    readiness_pct: dash.release_readiness?.pct ?? dash.burn_down?.release_readiness_pct,
    release_decision: dash.release_decision?.verdict || dash.executive_summary?.release_decision,
  };
}

function runStaticSsotChecks(checklist, findings) {
  const items = [
    {
      id: 'ddg_registry',
      path: 'registry/display-data-governance.v1.yaml',
      must_contain: ['TT_DISPLAY_DATA_GOVERNANCE: ENFORCED', 'public_catalog_boundary:'],
    },
    {
      id: 'ops_workflow_registry',
      path: 'registry/traveltrust-operations-workflow.v1.yaml',
      must_contain: ['TT_OPERATIONS_WORKFLOW: ENFORCED', 'content_operations'],
    },
    {
      id: 'business_flow_matrix',
      path: 'registry/business-flow-matrix.v1.yaml',
      must_contain: ['guide', 'provider'],
    },
    {
      id: 'ddg_runbook',
      path: 'docs/runbook/TT-DISPLAY-DATA-GOVERNANCE.md',
      must_contain: ['Display Data Governance', 'public_catalog'],
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

function runSiteWideEntityLifecycleChecks(checklist, findings) {
  if (!fs.existsSync(MATRIX_PATH)) {
    findings.push({ id: 'matrix_missing', severity: 'P0', detail: MATRIX_PATH });
    return { pass: false, pass_count: 0, total: 0 };
  }
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const pages = matrix.pages || [];
  const expected = checklist.l5_entity_lifecycle_policy?.min_pages_certified || 202;
  const gaps = [];
  let passCount = 0;
  for (const page of pages) {
    const el = page.layer5_operations_truth_per_page?.entity_lifecycle || {};
    const ok = el.verdict === 'PASS' || el.verdict === 'N/A';
    if (ok) passCount += 1;
    else gaps.push(page.route);
  }
  const pass = pages.length === expected && passCount === expected && gaps.length === 0;
  if (!pass) {
    findings.push({
      id: 'entity_lifecycle_matrix_gaps',
      severity: 'P0',
      detail: `certified=${passCount}/${expected} gaps=${gaps.slice(0, 5).join(',')}`,
    });
  }
  return {
    pass,
    pass_count: passCount,
    total: expected,
    page_count: pages.length,
    gaps: gaps.slice(0, 20),
    b34_apply: matrix.b34_apply || null,
  };
}

function runWorkflowEvidenceParity(findings) {
  const base = path.join(ROOT, 'evidence/GO_operations_workflow_validation');
  if (!fs.existsSync(base)) {
    findings.push({ id: 'workflow_evidence_missing', severity: 'P0', detail: base });
    return { pass: false };
  }
  let latest = null;
  for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const p = path.join(base, ent.name, 'workflow-validation.json');
    if (!fs.existsSync(p)) continue;
    const m = fs.statSync(p).mtimeMs;
    if (!latest || m > latest.mtime) latest = { path: p, mtime: m };
  }
  if (!latest) {
    findings.push({ id: 'workflow_evidence_missing', severity: 'P0', detail: base });
    return { pass: false };
  }
  const report = JSON.parse(fs.readFileSync(latest.path, 'utf8'));
  const pass = report.verdict === 'PASS' || report.verdict === 'PASS_WITH_WARN';
  const domainFails = Object.entries(report.domains || {}).filter(([, v]) => v.verdict === 'FAIL');
  if (!pass || domainFails.length) {
    findings.push({
      id: 'workflow_lifecycle_fail',
      severity: 'P0',
      detail: `${report.verdict} domains=${domainFails.map(([k]) => k).join(',')}`,
    });
  }
  return {
    pass: pass && domainFails.length === 0,
    verdict: report.verdict,
    path: latest.path,
    domains: Object.fromEntries(Object.entries(report.domains || {}).map(([k, v]) => [k, v.verdict])),
  };
}

module.exports = {
  runDependencyChecks,
  runFrozenChainAggregation,
  runGateAggregationParity,
  runCrossModuleLifecycleRegression,
  runReleaseGateSsot,
  runDashboardParity,
  runStaticSsotChecks,
  runSiteWideEntityLifecycleChecks,
  runWorkflowEvidenceParity,
};
