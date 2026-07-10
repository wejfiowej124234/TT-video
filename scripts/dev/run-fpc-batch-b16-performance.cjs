#!/usr/bin/env node
/**
 * FPC-100 Batch B16 · Performance · build size · runtime budgets (① local)
 *
 * Four questions (Owner review) — B14/B15 template:
 *   1. Business correct?
 *   2. Quality meets standard?
 *   3. Findings identified?
 *   4. Re-certification passed?
 *
 *   node scripts/dev/run-fpc-batch-b16-performance.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const http = require('http');

const ROOT = path.resolve(__dirname, '../..');
const FE = path.join(ROOT, 'frontend');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B16-LATEST.json');
const EVID_DIR = path.join(EVID, 'B16-performance');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const BUDGETS_PATH = path.join(EVID_DIR, 'FPC-100-PERFORMANCE-BUDGETS-BASELINE.v1.json');
const BASELINE_PATH = path.join(EVID_DIR, 'FPC-100-PERFORMANCE-BASELINE-LATEST.json');
const SCAN_SUMMARY = path.join(FE, 'evidence/l5-performance-five-main-live-scan/scan-summary.json');
const SCAN_JSONL = path.join(FE, 'evidence/l5-performance-five-main-live-scan/scan-results.jsonl');
const PROD_PORT = process.env.FPC_B16_PROD_PORT || '3013';
const PROD_BASE = `http://127.0.0.1:${PROD_PORT}`;
const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8080';

const LIVE_SCAN_CMD =
  'npx playwright test e2e/l5-performance-five-main-live-scan.spec.ts --project=chromium';

const {
  loadBudgets,
  measureBuildArtifacts,
  probeApiLatencies,
  evaluateBundleBudgets,
  evaluateLiveScanEvidence,
  evaluateRegression,
  buildBaselineSnapshot,
} = require('./lib/fpc-performance-probes.cjs');

const QUALITY_CHECKS = [
  {
    id: 'Q4_spec_96_16_d7',
    domain: 'Q4',
    path: 'docs/spec/96-16-全页面UI-UX优化方案总册.md',
    must_contain: ['D7', '性能', 'Lighthouse'],
  },
  {
    id: 'Q4_prm_matrix',
    domain: 'Q4',
    path: 'registry/production-readiness-master-matrix.v1.yaml',
    must_contain: ['performance'],
  },
  {
    id: 'Q4_build_gate',
    domain: 'Q4',
    path: 'scripts/gates/check-frontend-npm-build.sh',
    must_contain: ['npm run build'],
  },
  {
    id: 'Q4_lazy_images_landing',
    domain: 'Q4',
    path: 'frontend/components/landing/ItineraryResultsSection.tsx',
    must_contain: ['loading="lazy"'],
  },
  {
    id: 'Q4_perf_live_spec',
    domain: 'Q4',
    path: 'frontend/e2e/l5-performance-five-main-live-scan.spec.ts',
    must_contain: ['initial_js_bytes', '/traveltrust'],
  },
  {
    id: 'Q17_budgets_ssot',
    domain: 'Q17',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B16-performance/FPC-100-PERFORMANCE-BUDGETS-BASELINE.v1.json',
    must_contain: ['fpc_100_performance_budgets', 'thresholds'],
  },
];

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: env.FPC_GATE_TIMEOUT_MS ? Number(env.FPC_GATE_TIMEOUT_MS) : 900_000,
  });
}

function waitForUrl(url, timeoutMs = 120_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) resolve(true);
          else retry();
        })
        .on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) reject(new Error(`timeout waiting for ${url}`));
      else setTimeout(tick, 500);
    };
    tick();
  });
}

function startProdServer() {
  if (process.env.FPC_B16_SKIP_PROD_START === '1') return null;
  const child = spawn('npx', ['next', 'start', '-p', PROD_PORT], {
    cwd: FE,
    stdio: 'ignore',
    detached: true,
    shell: process.platform === 'win32',
  });
  child.unref();
  return child;
}

function stopProdServer(child) {
  if (!child || !child.pid) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore', shell: true });
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
  } catch {
    /* best effort */
  }
}

function runQualityChecks(findings, budgets) {
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

  if (budgets.quality_ssot?.lazy_image_markers_min) {
    const landingDir = path.join(FE, 'components/landing');
    let lazyCount = 0;
    if (fs.existsSync(landingDir)) {
      for (const f of fs.readdirSync(landingDir)) {
        if (!f.endsWith('.tsx')) continue;
        const t = fs.readFileSync(path.join(landingDir, f), 'utf8');
        lazyCount += (t.match(/loading="lazy"/g) || []).length;
      }
    }
    const pass = lazyCount >= budgets.quality_ssot.lazy_image_markers_min;
    if (!pass) {
      findings.push({
        id: 'quality_lazy_images',
        severity: 'P1',
        detail: `landing lazy markers ${lazyCount} < ${budgets.quality_ssot.lazy_image_markers_min}`,
      });
    }
    results.push({
      id: 'Q4_lazy_image_count',
      domain: 'Q4',
      pass,
      path: 'frontend/components/landing/*.tsx',
      notes: [`lazy_count:${lazyCount}`],
    });
  }

  return results;
}

function buildFourQuestions(businessVerdict, qualityVerdict, findings, recertPass) {
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const p2 = findings.filter((f) => f.severity === 'P2');
  return {
    business_correct: {
      answer: businessVerdict === 'PASS' || businessVerdict === 'PASS_WITH_WARN',
      verdict: businessVerdict,
      notes: 'Production build + bundle disk budgets + API latency + five-main live perf scan',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q4 performance SSOT · lazy assets · budgets baseline · regression capture',
    },
    findings_identified: {
      answer: findings.length > 0,
      p0: p0.length,
      p1: p1.length,
      p2: p2.length,
      items: findings,
    },
    recertification_passed: {
      answer: recertPass,
      notes: recertPass
        ? 'All gates green after remediation (if any)'
        : 'Pending fix + re-run batch runner',
    },
  };
}

const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateRuntimePreflight } = require('./lib/fpc-runtime-preflight.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];
  const budgets = loadBudgets(BUDGETS_PATH);
  let prodChild = null;

  const preflight = await evaluateRuntimePreflight({ allowDirty: process.env.FPC_PREFLIGHT_ALLOW_DIRTY === '1' });
  if (!preflight.pass) {
    for (const b of preflight.blockers) {
      findings.push({
        id: `preflight:${b}`,
        severity: 'P0',
        type: 'Runtime Event',
        detail: JSON.stringify(preflight.items),
      });
    }
  }

  const gate = assertCanRun('B16');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B16 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  // 1 · Production build
  if (process.env.FPC_B16_SKIP_BUILD !== '1') {
    try {
      sh('bash scripts/gates/check-frontend-npm-build.sh', ROOT, {
        STRICT_FRONTEND_BUILD: '1',
        FPC_GATE_TIMEOUT_MS: '900000',
      });
      gateResults.push({
        gate: 'STRICT_FRONTEND_BUILD=1 check-frontend-npm-build.sh',
        exit_code: 0,
        pass: true,
        summary_line: 'check-frontend-npm-build: OK',
      });
    } catch (e) {
      findings.push({
        id: 'gate_fail:frontend_build',
        severity: 'P0',
        gate: 'check-frontend-npm-build.sh',
        detail: ((e.stderr || e.stdout || e.message || '') + '').slice(0, 2000),
      });
      gateResults.push({
        gate: 'STRICT_FRONTEND_BUILD=1 check-frontend-npm-build.sh',
        exit_code: e.status || 1,
        pass: false,
        summary_line: 'production build FAIL',
      });
    }
  }

  const artifacts = measureBuildArtifacts(FE);
  const bundleRows = evaluateBundleBudgets(artifacts, budgets, findings);
  gateResults.push({
    gate: 'measureBuildArtifacts',
    exit_code: artifacts.build_present ? 0 : 1,
    pass: bundleRows.every((r) => r.pass !== false),
    summary_line: `js_disk=${artifacts.js_total_bytes} css=${artifacts.css_total_bytes} largest_js=${artifacts.largest_js_chunk_bytes}`,
  });

  const apiRows = await probeApiLatencies(API_BASE, budgets, findings);
  gateResults.push({
    gate: 'probeApiLatencies',
    exit_code: apiRows.every((r) => r.pass !== false) ? 0 : 1,
    pass: apiRows.every((r) => r.pass !== false),
    summary_line: apiRows.map((r) => `${r.key}:${r.ms ?? r.connected}ms`).join(' '),
  });

  if (process.env.FPC_B16_SKIP_LIVE_SCAN !== '1') {
    try {
      if (fs.existsSync(SCAN_JSONL)) fs.unlinkSync(SCAN_JSONL);
      prodChild = startProdServer();
      await waitForUrl(`${PROD_BASE}/`);
      sh(LIVE_SCAN_CMD, FE, {
        PLAYWRIGHT_BASE_URL: PROD_BASE,
        FPC_GATE_TIMEOUT_MS: '900000',
      });
      gateResults.push({
        gate: LIVE_SCAN_CMD,
        exit_code: 0,
        pass: true,
        summary_line: `l5-performance-five-main-live-scan PASS @ ${PROD_BASE}`,
      });
    } catch (e) {
      findings.push({
        id: 'gate_fail:l5-performance-live-scan',
        severity: 'P0',
        gate: LIVE_SCAN_CMD,
        detail: ((e.stderr || e.stdout || e.message || '') + '').slice(0, 2500),
      });
      gateResults.push({
        gate: LIVE_SCAN_CMD,
        exit_code: e.status || 1,
        pass: false,
        summary_line: 'l5-performance-five-main-live-scan FAIL',
      });
    } finally {
      stopProdServer(prodChild);
    }
  }

  const liveScan = evaluateLiveScanEvidence(SCAN_SUMMARY, SCAN_JSONL, budgets, findings);
  const regression = evaluateRegression(
    {
      bundle_disk: { js_total_bytes: artifacts.js_total_bytes },
      routes: {
        avg_navigation_ms: liveScan.routes?.length
          ? liveScan.routes.reduce((s, r) => s + r.navigation_ms, 0) / liveScan.routes.length
          : null,
      },
    },
    BASELINE_PATH,
    budgets,
    findings
  );

  const qualityCheckResults = runQualityChecks(findings, budgets);
  qualityCheckResults.push({
    id: 'Q4_live_perf_evidence',
    domain: 'Q4',
    pass: liveScan.pass,
    path: 'frontend/evidence/l5-performance-five-main-live-scan/',
    notes: liveScan.notes,
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass && liveScan.pass;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) && regression.pass !== false && p0.length === 0;
  const businessVerdict = businessGatePass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL';
  const qualityVerdict = qualityPass
    ? p1.length
      ? 'PASS_WITH_WARN'
      : 'PASS'
    : businessGatePass
      ? 'IN_PROGRESS'
      : 'FAIL';
  const overallVerdict =
    businessVerdict === 'PASS' && qualityVerdict === 'PASS'
      ? 'PASS'
      : businessVerdict === 'FAIL' || qualityVerdict === 'FAIL'
        ? 'FAIL'
        : 'IN_PROGRESS';
  const pass = overallVerdict === 'PASS' || overallVerdict === 'PASS_WITH_WARN';
  const fourQuestions = buildFourQuestions(businessVerdict, qualityVerdict, findings, pass);

  const perfLiveEvidence = {
    budgets_path: path.relative(ROOT, BUDGETS_PATH),
    bundle_artifacts: artifacts,
    bundle_checks: bundleRows,
    api_latency: apiRows,
    live_scan: liveScan,
    regression,
    production_server: PROD_BASE,
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        preflight,
        gate_results: gateResults,
        perf_live_evidence: perfLiveEvidence,
        qualityCheckResults,
        findings,
        certification_four_questions: fourQuestions,
      },
      null,
      2
    ) + '\n'
  );

  if (pass) {
    const baseline = buildBaselineSnapshot({
      artifacts,
      apiRows,
      liveScan,
      bundleRows,
    });
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  }

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B16',
    title: 'Performance · build size · runtime budgets',
    layer: 'L4',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b16-performance.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B02', 'B15'],
    routes: ['/', '/traveltrust', '/market', '/did-rank', '/community'],
    gates: [
      'STRICT_FRONTEND_BUILD=1 scripts/gates/check-frontend-npm-build.sh',
      'measureBuildArtifacts',
      'probeApiLatencies',
      LIVE_SCAN_CMD,
    ],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    performance_live_evidence: perfLiveEvidence,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q4', 'Q17'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict === 'PASS_WITH_WARN' ? 'PASS_WITH_WARN' : overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B17' : 'B16-remediation',
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
      'Performance ① — prod build + bundle/API budgets + five-main live scan on next start; full prod CWV SLO deferred ②',
    traceability: {
      requirements: [
        'next build PASS (STRICT_FRONTEND_BUILD)',
        'JS/CSS disk budgets vs FPC-100-PERFORMANCE-BUDGETS-BASELINE.v1.json',
        'API /health /meta /discover latency ceilings',
        'Five-main navigation · initial JS · duplicate request · CLS budgets',
      ],
      spec_refs: [
        'registry/production-readiness-master-matrix.v1.yaml',
        'FPC-100-QUALITY-DOMAIN-MATRIX-v1.md',
        'FPC-100/B16-performance/FPC-100-PERFORMANCE-BUDGETS-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B16-LATEST.json',
      certification_batch: 'B16',
      product_version: 'v1.0',
    },
  };

  if (pass) {
    const expiryDays = 30;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = head;
  }

  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B16: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log('FOUR_Q:', JSON.stringify(fourQuestions, null, 0).slice(0, 420));
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
