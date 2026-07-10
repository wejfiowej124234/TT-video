#!/usr/bin/env node
/**
 * FPC-100 Batch B14 · a11y · keyboard · axe (Round 2 depth) (① local)
 *
 * Four questions (Owner review):
 *   1. Business correct?
 *   2. Quality meets standard?
 *   3. Findings identified?
 *   4. Re-certification passed?
 *
 *   node scripts/dev/run-fpc-batch-b14-a11y.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const FE = path.join(ROOT, 'frontend');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B14-LATEST.json');
const EVID_DIR = path.join(EVID, 'B14-a11y');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const SCAN_SUMMARY = path.join(FE, 'evidence/l5-a11y-live-scan/scan-summary.json');
const SCAN_JSONL = path.join(FE, 'evidence/l5-a11y-live-scan/scan-results.jsonl');

const BUSINESS_GATES = [
  { cmd: 'bash scripts/dev/l5-pe-accessibility-audit.sh', cwd: ROOT },
  { cmd: 'npx vitest run lib/auth/authErrorA11y.contract.test.ts', cwd: FE },
  { cmd: 'npx vitest run lib/admin/adminTableA11y.contract.test.ts', cwd: FE },
  { cmd: 'npx vitest run lib/admin/adminModalA11yL5.contract.test.ts', cwd: FE },
  {
    cmd: 'npx vitest run lib/l5/l5ProductExcellence.contract.test.ts -t accessibility',
    cwd: FE,
  },
];

const LIVE_SCAN_CMD =
  'PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/l5-a11y-live-scan.spec.ts --project=chromium';

const QUALITY_CHECKS = [
  {
    id: 'Q3_spec_96_13',
    domain: 'Q3',
    path: 'docs/spec/96-13-UI-UX-i18n-a11y-性能走查.md',
    must_contain: ['a11y', '键盘', '13.6'],
  },
  {
    id: 'Q3_focus_ring_ssot',
    domain: 'Q3',
    path: 'frontend/lib/travelLinkFocus.ts',
    must_contain: ['travelFocusRingCoreClasses', 'focus-visible:ring'],
  },
  {
    id: 'Q3_consumer_aria',
    domain: 'Q3',
    path: 'frontend/components/consumer/ConsumerSurfaceStatePanel.tsx',
    must_contain: ['aria-label'],
  },
  {
    id: 'Q13_auth_error_live_region',
    domain: 'Q13',
    path: 'frontend/components/auth/AuthL5FormError.tsx',
    must_contain: ['role="alert"', 'aria-live="assertive"'],
  },
  {
    id: 'Q3_a11y_live_spec',
    domain: 'Q3',
    path: 'frontend/e2e/l5-a11y-live-scan.spec.ts',
    must_contain: ['data-tt-l5-a11y-live-scan', '/market'],
  },
];

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: env.FPC_GATE_TIMEOUT_MS ? Number(env.FPC_GATE_TIMEOUT_MS) : 600_000,
  });
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

function validateLiveScanEvidence(findings) {
  let pass = fs.existsSync(SCAN_SUMMARY) && fs.existsSync(SCAN_JSONL);
  const notes = [];
  if (!pass) {
    findings.push({
      id: 'quality_a11y_live_scan_missing',
      severity: 'P0',
      detail: 'frontend/evidence/l5-a11y-live-scan/* missing',
    });
    return { id: 'Q3_a11y_live_evidence', domain: 'Q3', pass: false, path: 'frontend/evidence/l5-a11y-live-scan/', notes };
  }
  try {
    const summary = JSON.parse(fs.readFileSync(SCAN_SUMMARY, 'utf8'));
    const routes = summary.routesScanned || 0;
    if (routes < 5) {
      pass = false;
      findings.push({
        id: 'quality_a11y_routes_insufficient',
        severity: 'P1',
        detail: `routesScanned=${routes} need >=5`,
      });
      notes.push(`routesScanned:${routes}`);
    }
    const lines = fs.readFileSync(SCAN_JSONL, 'utf8').trim().split('\n').filter(Boolean);
    if (lines.length < 5) {
      pass = false;
      findings.push({
        id: 'quality_a11y_jsonl_insufficient',
        severity: 'P1',
        detail: `scan lines=${lines.length} need >=5`,
      });
    }
  } catch (e) {
    pass = false;
    findings.push({
      id: 'quality_a11y_parse_error',
      severity: 'P0',
      detail: String(e.message || e),
    });
  }
  return {
    id: 'Q3_a11y_live_evidence',
    domain: 'Q3',
    pass,
    path: 'frontend/evidence/l5-a11y-live-scan/',
    notes,
  };
}

function buildFourQuestions(businessVerdict, qualityVerdict, findings, recertPass) {
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const p2 = findings.filter((f) => f.severity === 'P2');
  return {
    business_correct: {
      answer: businessVerdict === 'PASS' || businessVerdict === 'PASS_WITH_WARN',
      verdict: businessVerdict,
      notes: 'L5 PE accessibility audit + a11y contract vitests + public corridor live scan',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q3 keyboard/focus/live scan · Q13 auth error live regions · 96-13 SSOT',
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

  const gate = assertCanRun('B14');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B14 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of BUSINESS_GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(g.cmd, g.cwd);
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${path.basename(g.cmd.split(' ')[0])}`,
        severity: 'P0',
        gate: g.cmd,
        detail: (stderr || stdout || e.message || '').slice(0, 1500),
      });
    }
    gateResults.push({
      gate: g.cmd,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-5).join(' | '),
    });
  }

  // Public corridor live scan (96-13 · VP-03) — refresh evidence each batch run
  if (process.env.FPC_B14_SKIP_LIVE_SCAN !== '1') {
    try {
      if (fs.existsSync(SCAN_JSONL)) fs.unlinkSync(SCAN_JSONL);
      sh(LIVE_SCAN_CMD, FE, { PLAYWRIGHT_FULL_STACK: '1', FPC_GATE_TIMEOUT_MS: '900000' });
      gateResults.push({
        gate: LIVE_SCAN_CMD,
        exit_code: 0,
        pass: true,
        summary_line: 'l5-a11y-live-scan playwright PASS',
      });
    } catch (e) {
      const exitCode = e.status || 1;
      findings.push({
        id: 'gate_fail:l5-a11y-live-scan',
        severity: 'P0',
        gate: LIVE_SCAN_CMD,
        detail: ((e.stderr || e.stdout || e.message || '') + '').slice(0, 2000),
      });
      gateResults.push({
        gate: LIVE_SCAN_CMD,
        exit_code: exitCode,
        pass: false,
        summary_line: 'l5-a11y-live-scan FAIL',
      });
    }
  }

  const qualityCheckResults = runQualityChecks(findings);
  qualityCheckResults.push(validateLiveScanEvidence(findings));

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) && p0.length === 0;
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

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        preflight,
        gate_results: gateResults,
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
    batch_id: 'B14',
    title: 'a11y · keyboard · axe (Round 2 depth)',
    layer: 'L4',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b14-a11y.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B02', 'B13'],
    routes: ['/', '/market', '/community', '/guide', '/provider/register'],
    gates: [...BUSINESS_GATES.map((g) => g.cmd), LIVE_SCAN_CMD],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q3', 'Q13'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict === 'PASS_WITH_WARN' ? 'PASS_WITH_WARN' : overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B15' : 'B14-remediation',
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
      'a11y ① — 96-13 checklist · L5 PE accessibility · admin/auth contracts · 5-route live scan; full axe CI deferred ②',
    traceability: {
      requirements: [
        'Public corridor keyboard/focus SSOT (travelLinkFocus)',
        'Auth error assertive live regions',
        'Admin table scope=col + modal a11y contracts',
        'Five public routes lang + main landmark live scan',
      ],
      spec_refs: [
        'docs/spec/96-13-UI-UX-i18n-a11y-性能走查.md',
        'frontend/e2e/l5-a11y-live-scan.spec.ts',
        'FPC-100-QUALITY-DOMAIN-MATRIX-v1.md',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B14-LATEST.json',
      certification_batch: 'B14',
      product_version: 'v1.0',
    },
  };

  if (pass) {
    const expiryDays = 60;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = head;
  }

  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B14: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log('FOUR_Q:', JSON.stringify(fourQuestions, null, 0).slice(0, 400));
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
