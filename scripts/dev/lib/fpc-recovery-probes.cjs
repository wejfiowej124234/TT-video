/**
 * FPC B35 · L5 recovery / fault-tolerance probes (① local)
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
  const deps = checklist.depends_on_batches || ['B05', 'B21', 'B22'];
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
  const chain = checklist.l5_recovery_policy?.frozen_chain_batches || [];
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

function runCrossModuleRecoveryRegression(findings) {
  const checks = [];
  const corridors = [
    {
      id: 'B05_web3_itinerary',
      batch: 'B05',
      validate: (b) => isFrozenPass(b) && b.gate_pass === true,
    },
    {
      id: 'B21_payment_idempotency',
      batch: 'B21',
      validate: (b) =>
        isFrozenPass(b) &&
        (b.payment_live?.onboarding_webhook_idempotency?.pass === true ||
          b.live_probes?.onboarding_webhook_idempotency?.pass === true ||
          b.gate_pass === true),
    },
    {
      id: 'B22_infra_dr',
      batch: 'B22',
      validate: (b) => isFrozenPass(b) && b.gate_pass !== false,
    },
    {
      id: 'B34_entity_lifecycle',
      batch: 'B34',
      validate: (b) =>
        isFrozenPass(b) &&
        (b.entity_lifecycle_live?.site_entity_lifecycle?.pass_count >= 202 ||
          b.gate_pass === true),
    },
  ];

  for (const c of corridors) {
    const b = loadBatch(c.batch);
    const pass = c.validate(b);
    if (!pass) {
      findings.push({ id: `cross_module_${c.id}`, severity: 'P0', detail: c.batch });
    }
    checks.push({ ...c, pass, verdict: b?.verdict });
  }
  return { pass: checks.every((c) => c.pass), checks };
}

function runIdempotencyWiringCheck(findings) {
  const mainRs = fs.readFileSync(path.join(ROOT, 'crates/api/src/main.rs'), 'utf8');
  const idemOk = mainRs.includes('mod idempotency_http_contract_tests');
  if (!idemOk) {
    findings.push({
      id: 'unwired_idempotency_http_contract_tests',
      severity: 'P0',
      detail: 'crates/api/src/main.rs',
    });
  }
  return { pass: idemOk, id: 'wiring:idempotency_http_contract' };
}

function runRecoveryRunbookSsot(checklist, findings) {
  const items = [
    {
      id: 'ops_runbook',
      path: 'ops/RUNBOOK.md',
      must_contain: ['Runbook', 'Idempotency-Key', 'RPC 大面积不可用'],
    },
    {
      id: 'b454_degrade_runbook',
      path: 'docs/runbook/TT-B454-REVIEW-JSON-CONTRACT-DEGRADE-EVIDENCE-REPLAY-001.md',
      must_contain: ['B454', 'degrade', 'replay'],
    },
    {
      id: 'emergency_recovery_prep',
      path: 'docs/runbook/templates/mainnet-package/emergency-recovery/EMERGENCY-RECOVERY-PREP-V1.md',
      must_contain: ['Recovery', 'rollback'],
    },
    {
      id: 'registry_b35',
      path: 'registry/full-production-certification-checklist.v1.yaml',
      must_contain: ['id: B35', 'Recovery Certification'],
    },
  ];
  const results = [];
  for (const item of items) {
    const abs = path.join(ROOT, item.path);
    const pass =
      fs.existsSync(abs) &&
      item.must_contain.every((needle) =>
        fs.readFileSync(abs, 'utf8').toLowerCase().includes(needle.toLowerCase())
      );
    if (!pass) findings.push({ id: item.id, severity: 'P1', detail: item.path });
    results.push({ ...item, pass });
  }
  return { pass: results.every((r) => r.pass), checks: results };
}

function runRecoveryLiveEvidenceParity(findings) {
  const p = path.join(EVID, 'B35-recovery/recovery-live-probes-latest.json');
  if (!fs.existsSync(p)) {
    findings.push({ id: 'recovery_live_evidence_missing', severity: 'P0', detail: p });
    return { pass: false };
  }
  const report = JSON.parse(fs.readFileSync(p, 'utf8'));
  const pass = report.pass === true;
  if (!pass) {
    findings.push({
      id: 'recovery_live_evidence_fail',
      severity: 'P0',
      detail: (report.findings || []).map((f) => f.id).join(','),
    });
  }
  return { pass, probe_count: (report.probes || []).length, path: p };
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
  const hasB35 = registryRaw.includes('id: B35') && registryRaw.includes('Recovery');
  const nextOk = dash.burn_down?.next_required_batch === 'B35';
  if (!hasB35) findings.push({ id: 'registry_b35_missing', severity: 'P1', detail: 'B35 row' });
  if (!nextOk) {
    findings.push({
      id: 'dashboard_next_batch',
      severity: 'P1',
      detail: `expected B35 got ${dash.burn_down?.next_required_batch}`,
    });
  }
  return {
    pass: hasB35 && nextOk,
    checks: [
      { id: 'registry_b35', pass: hasB35 },
      { id: 'dashboard_next_b35', pass: nextOk, next: dash.burn_down?.next_required_batch },
    ],
    readiness_pct: dash.release_readiness?.pct ?? dash.burn_down?.release_readiness_pct,
    release_decision: dash.release_decision?.verdict || dash.executive_summary?.release_decision,
  };
}

function runStaticSsotChecks(checklist, findings) {
  const items = [
    {
      id: 'ops_plane_retry_marker',
      path: 'frontend/components/admin/ops/OpsPlaneFetchStates.tsx',
      must_contain: ['data-tt-ops-plane-retry', 'aria-live'],
    },
    {
      id: 'consumer_retry_marker',
      path: 'frontend/components/consumer/ConsumerSurfaceStatePanel.tsx',
      must_contain: ['data-tt-cold-start-retry'],
    },
    {
      id: 'api_error_alert',
      path: 'frontend/components/ApiErrorAlert.tsx',
      must_contain: ['api_error_retryShort'],
    },
    {
      id: 'chunk_recovery',
      path: 'frontend/public/tt-dev-chunk-recovery.js',
      must_contain: ['chunkloaderror', 'location.reload'],
    },
    {
      id: 'b480_fault_gate',
      path: 'config/b480_prod_fault_slo_gate.v1.json',
      must_contain: ['fault'],
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

function runSiteWideRecoveryChecks(checklist, findings) {
  if (!fs.existsSync(MATRIX_PATH)) {
    findings.push({ id: 'matrix_missing', severity: 'P0', detail: MATRIX_PATH });
    return { pass: false, pass_count: 0, total: 0 };
  }
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const pages = matrix.pages || [];
  const expected = checklist.l5_recovery_policy?.min_pages_certified || 202;
  const gaps = [];
  let passCount = 0;
  for (const page of pages) {
    const rec = page.layer5_operations_truth_per_page?.recovery || {};
    const ok = rec.verdict === 'PASS' || rec.verdict === 'N/A';
    if (ok) passCount += 1;
    else gaps.push(page.route);
  }
  const pass = pages.length === expected && passCount === expected && gaps.length === 0;
  if (!pass) {
    findings.push({
      id: 'recovery_matrix_gaps',
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
    b35_apply: matrix.b35_apply || null,
  };
}

module.exports = {
  runDependencyChecks,
  runFrozenChainAggregation,
  runGateAggregationParity,
  runCrossModuleRecoveryRegression,
  runIdempotencyWiringCheck,
  runRecoveryRunbookSsot,
  runRecoveryLiveEvidenceParity,
  runReleaseGateSsot,
  runDashboardParity,
  runStaticSsotChecks,
  runSiteWideRecoveryChecks,
};
