#!/usr/bin/env node
/**
 * Phase ③ Production Deployment Prerequisite Review (V1)
 *
 * Review → Sub Checks → Evidence → PASS (per-review machine_key)
 *
 *   node scripts/dev/run-phase3-deployment-prerequisite-review.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  assessAllReviews,
  collectBlockers,
  gitHead,
} = require('./lib/phase3-prerequisite-review-lib.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/phase3-deployment-prerequisite-review');
const RUN_DIR = path.join(EVID_ROOT, `review-${STAMP}`);

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function runNode(script, args = []) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return { ok: r.status === 0, status: r.status, log: `${r.stdout || ''}${r.stderr || ''}`.slice(-1200) };
}

function renderReviewMd(reviews, verdict, blockers) {
  const lines = [
    '# Phase ③ Production Deployment Prerequisite Review',
    '',
    `**Verdict:** \`${verdict}\``,
    `**Commit:** \`${gitHead() || 'unknown'}\``,
    '',
    '## Review Matrix',
    '',
    '| Review | Machine Verdict | Sub-checks | PASS |',
    '|--------|-----------------|------------|------|',
  ];
  for (const r of reviews) {
    lines.push(`| ${r.id} | \`${r.verdict}\` | ${r.summary.pass}/${r.summary.total} | ${r.pass ? '✅' : '⬜'} |`);
  }

  lines.push('', '## Sub-check Detail', '');
  for (const r of reviews) {
    lines.push(`### ${r.id} — ${r.name}`, '', '| ID | Check | PASS | Detail |', '|----|-------|------|--------|');
    for (const c of r.sub_checks) {
      lines.push(`| ${c.id} | ${c.name} | ${c.pass ? '✅' : '⬜'} | ${c.detail} |`);
    }
    lines.push('');
  }

  if (blockers.length) {
    lines.push('## Open Blockers', '');
    for (const b of blockers) {
      lines.push(`- \`${b.sub_check_id}\` **${b.sub_check_name}** (${b.review_id}): ${b.detail}`);
    }
    lines.push('');
  }

  lines.push('## On PASS', '', '`node scripts/dev/run-web3-freeze.cjs`', '');
  lines.push('## Production Readiness Book', '', '`evidence/GO_production_readiness/production-readiness-book/PRODUCTION-READINESS-BOOK-LATEST.md`', '');
  return lines.join('\n');
}

function main() {
  mkdirp(RUN_DIR);

  const exitReview = readJson('evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json');
  const exitOk = exitReview?.verdict === 'PHASE2_EXIT_REVIEW_PASS';
  const skipRefresh = process.argv.includes('--skip-evidence-refresh');

  const steps = [];
  if (!skipRefresh) {
    const refreshScripts = [
      'run-sepolia-full-web3-lifecycle-validation.cjs',
      'run-web3-protocol-grade-audit.cjs',
      'check-web3-system-master-map-parity.cjs',
      'run-rbac-d3-closure.cjs',
      'run-escrow-settlement-authorization-audit.cjs',
      'run-escrow-bilateral-layer-a-evidence.cjs',
      'run-escrow-bilateral-layer-b-evidence.cjs',
      'gen-eco-arb-phase2-evidence.cjs',
      'gen-ttg-cert-production-evidence-index.cjs',
      'run-web3-mainnet-production-readiness-audit.cjs',
      'run-phase2-subtrack-evidence.cjs',
      'run-phase2-production-validation.cjs',
      'run-phase2-exit-review.cjs',
    ];
    for (const script of refreshScripts) {
      steps.push(runNode(script));
    }
  } else if (exitOk) {
    steps.push(runNode('run-web3-protocol-grade-audit.cjs'));
    steps.push(runNode('check-web3-system-master-map-parity.cjs'));
    steps.push(runNode('run-rbac-d3-closure.cjs'));
    steps.push(runNode('run-escrow-settlement-authorization-audit.cjs'));
    steps.push(runNode('run-web3-mainnet-production-readiness-audit.cjs'));
  }

  const reviews = assessAllReviews({ exitReview });
  const blockers = collectBlockers(reviews);
  const passCount = reviews.filter((r) => r.pass).length;
  const subPass = reviews.reduce((n, r) => n + r.summary.pass, 0);
  const subTotal = reviews.reduce((n, r) => n + r.summary.total, 0);
  const allPass = exitOk && reviews.every((r) => r.pass);

  let verdict = 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_IN_PROGRESS';
  if (!exitOk) verdict = 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_BLOCKED';
  else if (allPass) verdict = 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_PASS';
  else if (passCount === 0) verdict = 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_BLOCKED';

  const report = {
    schema: 'traveltrust.phase3_deployment_prerequisite_review_report.v2',
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    commit_hash: gitHead(),
    display_name: 'Phase ③ Production Deployment Prerequisite Review',
    registry: 'registry/phase3-deployment-prerequisite-review.v1.yaml',
    runbook: 'docs/runbook/PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-V1.md',
    verdict,
    completion_model: 'Review → Sub Checks → Evidence → PASS',
    purpose: 'Final system gate before Web3 Freeze and Mainnet Deployment',
    prerequisite: { phase2_exit_review: exitReview?.verdict || 'missing', exit_review_required: 'PHASE2_EXIT_REVIEW_PASS' },
    reviews,
    blockers,
    summary: {
      reviews_pass: passCount,
      reviews_total: reviews.length,
      sub_checks_pass: subPass,
      sub_checks_total: subTotal,
    },
    orchestrator_steps: steps.map((s, i) => ({ step: i + 1, ok: s.ok, status: s.status, log_tail: (s.log || '').slice(-200) })),
    evidence_refresh: !skipRefresh,
    production_readiness_book: 'evidence/GO_production_readiness/production-readiness-book/PRODUCTION-READINESS-BOOK-LATEST.md',
    next_on_pass: 'node scripts/dev/run-web3-freeze.cjs → generate-mainnet-deployment-package.cjs',
    forbidden: 'Do NOT broadcast mainnet without this gate + Freeze + Package (RULE-DEPLOY-001)',
  };

  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(path.join(RUN_DIR, 'PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json'), json);
  fs.writeFileSync(path.join(EVID_ROOT, 'PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json'), json);

  const md = renderReviewMd(reviews, verdict, blockers);
  fs.writeFileSync(path.join(RUN_DIR, 'PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.md'), md);

  runNode('gen-production-readiness-book.cjs');

  console.log(JSON.stringify({
    verdict,
    reviews: `${passCount}/${reviews.length}`,
    sub_checks: `${subPass}/${subTotal}`,
    blockers: blockers.length,
    r06: reviews.find((r) => r.id === 'REVIEW-06')?.verdict,
  }, null, 2));
  process.exit(verdict === 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_PASS' ? 0 : 1);
}

main();
