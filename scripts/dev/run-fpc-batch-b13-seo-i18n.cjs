#!/usr/bin/env node
/**
 * FPC-100 Batch B13 · SEO · metadata · canonical · OG · i18n (① local)
 *
 *   node scripts/dev/run-fpc-batch-b13-seo-i18n.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B13-LATEST.json');
const EVID_DIR = path.join(EVID, 'B13-seo-i18n');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';

const BUSINESS_GATES = [
  { cmd: 'bash scripts/gates/check-home-public-disclosure-alignment-gate.sh', cwd: ROOT },
  { cmd: 'npx vitest run lib/siteMetadataBase.test.ts', cwd: path.join(ROOT, 'frontend') },
];

const QUALITY_CHECKS = [
  {
    id: 'Q16_site_metadata_base',
    domain: 'Q16',
    path: 'frontend/lib/siteMetadataBase.ts',
    must_contain: ['export', 'canonical'],
  },
  {
    id: 'Q16_metadata_tests',
    domain: 'Q16',
    path: 'frontend/lib/siteMetadataBase.test.ts',
    must_contain: ['siteMetadataBase'],
  },
  {
    id: 'Q13_locale_zh',
    domain: 'Q13',
    path: 'frontend/locales/zh.ts',
    must_contain: ['export'],
  },
  {
    id: 'Q13_locale_en',
    domain: 'Q13',
    path: 'frontend/locales/en.ts',
    must_contain: ['export'],
  },
  {
    id: 'Q16_public_disclosure_registry',
    domain: 'Q16',
    path: 'registry/traveltrust-public-disclosure.v1.yaml',
    must_contain: ['HOME_PUBLIC_DISCLOSURE_ALIGNED'],
  },
];

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
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
    if (pass && q.path.endsWith('siteMetadataBase.ts')) {
      const text = fs.readFileSync(abs, 'utf8');
      if (/localhost/i.test(text)) {
        pass = false;
        findings.push({
          id: 'quality_localhost_in_metadata',
          severity: 'P0',
          detail: 'localhost found in siteMetadataBase.ts',
        });
      }
    }
    results.push({ id: q.id, domain: q.domain, pass, path: q.path, notes });
  }
  return results;
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

  const gate = assertCanRun('B13');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B13 before ${gate.missing_prerequisites?.join(', ')}`,
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
        id: `gate_fail:${path.basename(g.cmd)}`,
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

  const qualityCheckResults = runQualityChecks(findings);

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass;
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
      { timestamp_utc: stamp, preflight, gate_results: gateResults, qualityCheckResults, findings },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B13',
    title: 'SEO · metadata · canonical · OG · i18n',
    layer: 'L4',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b13-seo-i18n.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B01', 'B12'],
    routes: ['Public marketing · home · metadata · locales'],
    gates: BUSINESS_GATES.map((g) => g.cmd),
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q13', 'Q16'],
      checks: qualityCheckResults,
    },
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict === 'PASS_WITH_WARN' ? 'PASS_WITH_WARN' : overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B14' : 'B13-remediation',
    ai_review: {
      verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note: 'SEO/i18n ① — public disclosure alignment + siteMetadataBase vitest; VP-02 en sweep deferred ②',
    traceability: {
      requirements: [
        'No localhost in canonical/OG on public routes',
        'zh/en locale SSOT present',
        'HOME_PUBLIC_DISCLOSURE_ALIGNED registry',
      ],
      spec_refs: [
        'frontend/lib/siteMetadataBase.ts',
        'registry/traveltrust-public-disclosure.v1.yaml',
        'FPC-100-QUALITY-DOMAIN-MATRIX-v1.md',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B13-LATEST.json',
      certification_batch: 'B13',
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
  console.log(`TT_FPC_100_BATCH_B13: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
