#!/usr/bin/env node
/**
 * FPC-100 Batch B12 · Data governance · CMS runtime · Official ops (① local)
 * Benchmark batch: Business + Quality Certification → Overall PASS
 *
 *   node scripts/dev/run-fpc-batch-b12-data-governance.cjs
 *
 * Requires: API @ 8080 with public-operations admin routes (rebuilt traveltrust-api)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B12-LATEST.json');
const EVID_DIR = path.join(EVID, 'B12-data-governance');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8080';

const BUSINESS_GATES = [
  'scripts/gates/check-display-data-governance-ssot.sh',
  'scripts/gates/check-official-ops-public-operations-ssot.sh',
  'scripts/gates/check-cms-announcements-gate.sh',
  'scripts/dev/run-display-data-governance.sh',
];

const QUALITY_CHECKS = [
  {
    id: 'Q9_ddg_registry',
    domain: 'Q9',
    path: 'registry/display-data-governance.v1.yaml',
    must_contain: ['surfaces:', 'public_surfaces:'],
  },
  {
    id: 'Q9_official_catalog_policy',
    domain: 'Q9',
    path: 'registry/single-official-public-catalog-policy.v1.yaml',
    must_contain: ['official_catalog_identity_policy:'],
  },
  {
    id: 'Q7_official_ops_domain',
    domain: 'Q7',
    path: 'registry/official-ops-domain.v1.yaml',
    must_contain: ['domain: official_ops', 'status: STABLE'],
  },
  {
    id: 'Q7_cms_asset_matrix',
    domain: 'Q7',
    path: 'data/catalog/cms-asset-matrix.v1.yaml',
    must_contain: ['production_preparation:'],
  },
  {
    id: 'Q9_ddg_runbook',
    domain: 'Q9',
    path: 'docs/runbook/TT-DISPLAY-DATA-GOVERNANCE.md',
    must_contain: ['Display Data Governance'],
  },
];

function sh(cmd, env = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

async function probePublicOpsStats(findings) {
  try {
    await fetch(`${API_BASE}/auth/seed-test-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promote_admin_email: 'tourist@test.com' }),
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tourist@test.com', password: 'Test123!' }),
      signal: AbortSignal.timeout(15000),
    });
    const login = await loginRes.json();
    const token = login.token;
    if (!token) {
      findings.push({ id: 'quality_public_ops_login', severity: 'P0', detail: 'admin login missing token' });
      return { pass: false };
    }
    const statsRes = await fetch(`${API_BASE}/api/v1/admin/official/public-operations/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    const statsText = await statsRes.text();
    if (!statsText.trim()) {
      findings.push({
        id: 'quality_public_ops_stats_empty',
        severity: 'P0',
        detail: 'stats endpoint empty — rebuild/restart traveltrust-api with public-operations routes',
      });
      return { pass: false };
    }
    const stats = JSON.parse(statsText);
    if (stats.status !== 'ok') {
      findings.push({ id: 'quality_public_ops_stats', severity: 'P0', detail: statsText.slice(0, 300) });
      return { pass: false };
    }
    return { pass: true, data_origin_counts: stats.data_origin_counts };
  } catch (e) {
    findings.push({ id: 'quality_public_ops_probe', severity: 'P0', detail: String(e.message || e).slice(0, 500) });
    return { pass: false };
  }
}

function runQualityChecks(findings) {
  const results = [];
  for (const q of QUALITY_CHECKS) {
    const abs = path.join(ROOT, q.path);
    let pass = fs.existsSync(abs);
    const notes = [];
    if (!pass) {
      findings.push({ id: `quality_missing:${q.id}`, severity: 'P0', detail: q.path });
    } else if (q.must_contain) {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of q.must_contain) {
        if (!text.includes(needle)) {
          pass = false;
          findings.push({
            id: `quality_ssot:${q.id}`,
            severity: 'P1',
            detail: `${q.path} missing ${needle}`,
          });
          notes.push(`missing:${needle}`);
        }
      }
    }
    results.push({ id: q.id, domain: q.domain, pass, path: q.path, notes });
  }
  return results;
}

const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B12');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B12 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of BUSINESS_GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(`bash ${g}`, { API_BASE, BASE: API_BASE });
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${path.basename(g)}`,
        severity: 'P0',
        gate: g,
        detail: (stderr || stdout || e.message || '').slice(0, 1500),
      });
    }
    gateResults.push({
      gate: g,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-5).join(' | '),
    });
  }

  const qualityCheckResults = runQualityChecks(findings);
  const publicOpsProbe = await probePublicOpsStats(findings);
  qualityCheckResults.push({
    id: 'Q9_public_ops_stats_runtime',
    domain: 'Q9',
    pass: publicOpsProbe.pass,
    path: '/api/v1/admin/official/public-operations/stats',
    notes: publicOpsProbe.data_origin_counts ? ['runtime_ok'] : ['runtime_fail'],
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass = gateResults.every((g) => g.pass) && gate.ok;
  const qualityPass = qualityCheckResults.every((q) => q.pass) && p0.length === 0;
  const businessVerdict = businessGatePass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL';
  const qualityVerdict = qualityPass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : businessGatePass ? 'IN_PROGRESS' : 'FAIL';
  const overallVerdict =
    businessVerdict === 'PASS' && qualityVerdict === 'PASS'
      ? 'PASS'
      : businessVerdict === 'FAIL' || qualityVerdict === 'FAIL'
        ? 'FAIL'
        : 'IN_PROGRESS';
  const pass = overallVerdict === 'PASS' || overallVerdict === 'PASS_WITH_WARN';

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      { timestamp_utc: stamp, gate_results: gateResults, qualityCheckResults, publicOpsProbe, findings },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B12',
    title: 'Data governance · CMS runtime consumer · official ops',
    layer: 'L5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b12-data-governance.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B04', 'B11'],
    routes: ['DDG · OCS · CMS consumer · /api/v1/admin/official/public-operations/*'],
    gates: BUSINESS_GATES,
    gate_results: gateResults,
    gate_pass: businessGatePass,
    business_certification: {
      verdict: businessVerdict,
      gate_pass: businessGatePass,
      frozen_at_utc: businessGatePass ? stamp : null,
    },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q9', 'Q7'],
      checks: qualityCheckResults,
      benchmark_batch: true,
      note: 'First batch with Business + Quality together per Quality Domain Matrix v1.0.4',
    },
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict === 'PASS_WITH_WARN' ? 'PASS_WITH_WARN' : overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B13' : 'B12-remediation',
    ai_review: {
      verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note:
      'B12 benchmark — DDG + Official Ops SSOT + CMS announcements + display-data-governance runtime; Quality Q9/Q7 SSOT + public-ops stats probe',
    traceability: {
      requirements: [
        'DDG surfaces PASS',
        'Homepage/market read catalog not fallback where Live',
        'OCS official entities separated from business API data',
        'Quality Q9 data governance SSOT + runtime probe',
        'Quality Q7 CMS/official ops registry alignment',
      ],
      spec_refs: [
        'registry/display-data-governance.v1.yaml',
        'registry/single-official-public-catalog-policy.v1.yaml',
        'docs/runbook/TT-DISPLAY-DATA-GOVERNANCE.md',
        'FPC-100-QUALITY-DOMAIN-MATRIX-v1.md §0.3',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B12',
      ],
      code_paths: [
        'scripts/dev/display-data-governance-run.cjs',
        'scripts/dev/run-display-data-governance.sh',
        'crates/api/src/routes/admin/admin_official_public_operations_http.rs',
      ],
      tests: BUSINESS_GATES.map((g) => path.basename(g)),
      evidence_path: 'FPC-100/FPC-100-BATCH-B12-LATEST.json',
      certification_batch: 'B12',
      product_version: 'v1.0',
    },
  };

  if (pass) {
    const expiryDays = 90;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = head;
  }

  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B12: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
