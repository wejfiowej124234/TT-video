#!/usr/bin/env node
/**
 * FPC-100 Batch B18 · Production build · DevTools · mock surfaces (① local)
 *
 *   node scripts/dev/run-fpc-batch-b18-production-build.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const FE = path.join(ROOT, 'frontend');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B18-LATEST.json');
const EVID_DIR = path.join(EVID, 'B18-production-build');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const CHECKLIST_PATH = path.join(
  EVID_DIR,
  'FPC-100-PRODUCTION-BUILD-CHECKLIST-BASELINE.v1.json'
);
const PROD_PORT = process.env.FPC_B18_PROD_PORT || '3014';
const PROD_BASE = `http://127.0.0.1:${PROD_PORT}`;

const REGISTRY_GATES = [
  { cmd: 'bash scripts/gates/check-production-ui-hygiene-gate.sh', label: 'check-production-ui-hygiene-gate.sh' },
  {
    cmd: 'bash scripts/gates/check-frontend-npm-build.sh',
    label: 'check-frontend-npm-build.sh',
    env: { STRICT_FRONTEND_BUILD: '1', FPC_GATE_TIMEOUT_MS: '900000' },
  },
];

const QUALITY_CHECKS = [
  {
    id: 'Q8_registry_batch',
    domain: 'Q8',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B18', 'check-production-ui-hygiene-gate.sh'],
  },
  {
    id: 'Q8_ui_guards_test',
    domain: 'Q8',
    path: 'frontend/lib/travelTrustUiGuards.test.ts',
    must_contain: ['allowChainOffMockPayUi'],
  },
  {
    id: 'Q16_per_wave_backlog',
    domain: 'Q16',
    path: 'registry/per-wave-backlog.v1.yaml',
    must_contain: ['mock-swap'],
  },
  {
    id: 'Q8_checklist_ssot',
    domain: 'Q8',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B18-production-build/FPC-100-PRODUCTION-BUILD-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_production_build_checklist'],
  },
];

const {
  loadChecklist,
  fetchHtml,
  scanProdHtml,
  waitForUrl,
  runStaticHygieneSsot,
} = require('./lib/fpc-production-build-probes.cjs');
const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateRuntimePreflight } = require('./lib/fpc-runtime-preflight.cjs');

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: env.FPC_GATE_TIMEOUT_MS ? Number(env.FPC_GATE_TIMEOUT_MS) : 900_000,
  });
}

function startProdServer() {
  if (process.env.FPC_B18_SKIP_PROD_START === '1') return null;
  const child = spawn('npx', ['next', 'start', '-p', PROD_PORT], {
    cwd: FE,
    stdio: 'ignore',
    detached: true,
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI: '0',
      NEXT_PUBLIC_TRAVELTRUST_ALLOW_TRAVELTRUST_SPACING_DEBUG: '0',
    },
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

function buildFourQuestions(businessVerdict, qualityVerdict, findings, recertPass) {
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const p2 = findings.filter((f) => f.severity === 'P2');
  return {
    business_correct: {
      answer: businessVerdict === 'PASS' || businessVerdict === 'PASS_WITH_WARN',
      verdict: businessVerdict,
      notes: 'UI hygiene gate + STRICT prod build + next start HTML scan (flags off)',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q8 maintainability SSOT · travelTrustUiGuards · Dockerfile defaults',
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
      notes: recertPass ? 'All P0/P1 remediated · gates + prod HTML PASS' : 'Pending fix + re-run',
    },
  };
}

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];
  let prodChild = null;
  const checklist = loadChecklist(CHECKLIST_PATH);

  const preflight = await evaluateRuntimePreflight({
    allowDirty: process.env.FPC_PREFLIGHT_ALLOW_DIRTY === '1',
  });
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

  const gate = assertCanRun('B18');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B18 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of REGISTRY_GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(g.cmd, ROOT, g.env || {});
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${g.label}`,
        severity: 'P0',
        gate: g.label,
        detail: (stderr || stdout || e.message || '').slice(0, 2500),
      });
    }
    gateResults.push({
      gate: g.label,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-2).join(' | '),
    });
  }

  let prodHtmlEvidence = { pass: false, skipped: true };
  if (process.env.FPC_B18_SKIP_PROD_START !== '1' && preflight.pass) {
    try {
      if (!fs.existsSync(path.join(FE, '.next/BUILD_ID'))) {
        sh('bash scripts/gates/check-frontend-npm-build.sh', ROOT, {
          STRICT_FRONTEND_BUILD: '1',
          FPC_GATE_TIMEOUT_MS: '900000',
        });
      }
      prodChild = startProdServer();
      await waitForUrl(`${PROD_BASE}/`);
      const pages = [];
      for (const route of checklist.prod_html_routes) {
        pages.push(await fetchHtml(PROD_BASE, route));
      }
      prodHtmlEvidence = scanProdHtml(pages, checklist, findings);
      prodHtmlEvidence.skipped = false;
      prodHtmlEvidence.production_server = PROD_BASE;
      prodHtmlEvidence.prod_env = checklist.prod_env_required;
    } catch (e) {
      findings.push({
        id: 'prod_html_scan_error',
        severity: 'P0',
        detail: String(e.message || e),
      });
      prodHtmlEvidence = { pass: false, skipped: false, error: String(e.message || e) };
    } finally {
      stopProdServer(prodChild);
    }
  }

  const staticSsot = runStaticHygieneSsot(ROOT, findings);
  const qualityCheckResults = runQualityChecks(findings);
  qualityCheckResults.push({
    id: 'Q8_prod_html_evidence',
    domain: 'Q8',
    pass: prodHtmlEvidence.pass === true,
    path: 'next start prod HTML scan',
    notes: prodHtmlEvidence.routes?.map((r) => `${r.route}:${r.pass}`) || [],
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) &&
    gate.ok &&
    preflight.pass &&
    prodHtmlEvidence.pass !== false;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    p0.length === 0 &&
    p1.length === 0;
  const businessVerdict = businessGatePass ? 'PASS' : 'FAIL';
  const qualityVerdict = qualityPass ? 'PASS' : businessGatePass ? 'IN_PROGRESS' : 'FAIL';
  const overallVerdict =
    businessVerdict === 'PASS' && qualityVerdict === 'PASS'
      ? 'PASS'
      : businessVerdict === 'FAIL' || qualityVerdict === 'FAIL'
        ? 'FAIL'
        : 'IN_PROGRESS';
  const pass = overallVerdict === 'PASS';
  const fourQuestions = buildFourQuestions(businessVerdict, qualityVerdict, findings, pass);

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        preflight,
        gate_results: gateResults,
        prod_html_evidence: prodHtmlEvidence,
        static_ssot: staticSsot,
        qualityCheckResults,
        findings,
        certification_four_questions: fourQuestions,
      },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B18',
    title: 'Production build · DevTools · mock surfaces',
    layer: 'L4',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b18-production-build.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B01', 'B17'],
    gates: REGISTRY_GATES.map((g) => g.label),
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    production_build_live_evidence: prodHtmlEvidence,
    production_build_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q8', 'Q16'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B19' : 'B18-remediation',
    ai_review: {
      verdict: pass ? 'PASS' : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note:
      'Production build ① — hygiene gate + strict build + next start HTML without mock/dev chrome; not ②③ GO',
    traceability: {
      requirements: [
        'check-production-ui-hygiene-gate.sh PASS',
        'STRICT_FRONTEND_BUILD=1 npm build PASS',
        'next start with mock/spacing flags off — no forbidden HTML on /traveltrust',
      ],
      spec_refs: [
        'registry/full-production-certification-checklist.v1.yaml',
        'frontend/lib/travelTrustUiGuards.ts',
        'FPC-100/B18-production-build/FPC-100-PRODUCTION-BUILD-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B18-LATEST.json',
      certification_batch: 'B18',
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
  console.log(`TT_FPC_100_BATCH_B18: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
