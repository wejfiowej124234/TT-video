#!/usr/bin/env node
/**
 * Production Readiness Book — final rollup after Phase ③ Prerequisite Review.
 * Not a separate Gate; auto-generated companion report for deploy day.
 *
 *   node scripts/dev/gen-production-readiness-book.cjs
 */
const fs = require('fs');
const path = require('path');
const { assessAllReviews, collectBlockers, gitHead } = require('./lib/phase3-prerequisite-review-lib.cjs');
const {
  buildRollups,
  renderExecutiveSummaryMd,
  renderExecutiveSummaryBookBlock,
  renderPrepSectionMd,
  renderMatrixMd,
  renderOwnerChecklistMd,
} = require('./lib/mainnet-deployment-readiness-rollups.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/production-readiness-book');
const RUN_DIR = path.join(EVID_ROOT, `book-${STAMP}`);

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function main() {
  fs.mkdirSync(RUN_DIR, { recursive: true });

  const prereq =
    readJson('evidence/GO_production_readiness/phase3-deployment-prerequisite-review/PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json')
    || { reviews: assessAllReviews(), verdict: 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_IN_PROGRESS' };

  const reviews = prereq.reviews || assessAllReviews();
  const blockers = prereq.blockers || collectBlockers(reviews);
  const allReviewsPass = reviews.every((r) => r.pass);
  const exitReview = readJson('evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json');
  const freeze = readJson('evidence/GO_production_readiness/web3-freeze/WEB3-FREEZE-MANIFEST-LATEST.json');
  const pkg = readJson('evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-LATEST.json');
  const mn = readJson('evidence/GO_production_readiness/web3-mainnet-audit/WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json');
  const cert = readJson('evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json');
  const commit = gitHead();

  const whyMainnet =
    allReviewsPass && exitReview?.verdict === 'PHASE2_EXIT_REVIEW_PASS'
      ? 'All 10 Prerequisite Reviews PASS; Phase ② Exit Review PASS; pre-freeze mainnet readiness criteria met.'
      : null;
  const whyNotMainnet = blockers.length
    ? blockers.slice(0, 12).map((b) => `${b.review_id} ${b.sub_check_id}: ${b.sub_check_name} — ${b.detail}`)
    : !allReviewsPass
      ? ['One or more Prerequisite Reviews not PASS — see review matrix below.']
      : exitReview?.verdict !== 'PHASE2_EXIT_REVIEW_PASS'
        ? [`Phase ② Exit Review: ${exitReview?.verdict || 'missing'}`]
        : ['Additional post-freeze gates pending (Web3 Freeze, Package, Shadow Launch).'];

  const evidenceIndex = [
    { id: 'prerequisite_review', path: 'evidence/GO_production_readiness/phase3-deployment-prerequisite-review/PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json' },
    { id: 'phase2_exit_review', path: 'evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json' },
    { id: 'sepolia_lifecycle', path: 'evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json' },
    { id: 'master_map_parity', path: 'evidence/GO_production_readiness/web3-system-audit/WEB3-MASTER-MAP-PARITY-LATEST.json' },
    { id: 'protocol_grade', path: 'evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json' },
    { id: 'mainnet_readiness', path: 'evidence/GO_production_readiness/web3-mainnet-audit/WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json' },
    { id: 'ttg_cert_index', path: 'evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json' },
    { id: 'web3_freeze', path: 'evidence/GO_production_readiness/web3-freeze/WEB3-FREEZE-MANIFEST-LATEST.json' },
    { id: 'deployment_package', path: 'evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-LATEST.json' },
    { id: 'registry_snapshot', path: 'registry/protocol-convergence-deployments.v1.yaml' },
    { id: 'executive_summary', path: 'evidence/GO_production_readiness/production-readiness-book/PRODUCTION-READINESS-EXECUTIVE-SUMMARY-LATEST.md' },
    { id: 'mainnet_prep', path: 'evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-PREP-LATEST.json' },
    { id: 'deployment_readiness_matrix', path: 'evidence/GO_production_readiness/production-readiness-book/DEPLOYMENT-READINESS-MATRIX-LATEST.md' },
    { id: 'owner_mainnet_checklist', path: 'evidence/GO_production_readiness/production-readiness-book/OWNER-MAINNET-DEPLOY-CHECKLIST-LATEST.md' },
    { id: 'shadow_launch', path: 'evidence/mainnet_shadow_launch/README.md' },
  ].map((e) => ({ ...e, present: exists(e.path) }));

  const book = {
    schema: 'traveltrust.production_readiness_book.v1',
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    title: 'TravelTrust Production Readiness Book',
    subtitle: 'Phase ③ Deployment Prerequisite Review — deploy-day rollup (not a separate Gate)',
    commit_hash: commit,
    prerequisite_review_verdict: prereq.verdict,
    all_reviews_pass: allReviewsPass,
    reviews: reviews.map((r) => ({
      id: r.id,
      name: r.name,
      machine_key: r.machine_key,
      verdict: r.verdict,
      pass: r.pass,
      summary: r.summary,
    })),
    review_matrix: reviews,
    blockers,
    blocker_count: blockers.length,
    why_mainnet_allowed: whyMainnet,
    why_mainnet_blocked: whyNotMainnet,
    deployment_manifest: {
      status: pkg?.verdict || 'NOT_GENERATED',
      path: pkg?.top_manifest || 'MANIFEST/manifest.json',
      present: exists('MANIFEST/manifest.json'),
      note: 'Generated after Web3 Freeze — pre-freeze shows NOT_GENERATED',
    },
    registry_snapshot: {
      path: 'registry/protocol-convergence-deployments.v1.yaml',
      present: exists('registry/protocol-convergence-deployments.v1.yaml'),
      web3_freeze: freeze?.verdict || 'NOT_FROZEN',
    },
    evidence_index: evidenceIndex,
    rollback_plan: {
      runbook: 'docs/runbook/MAINNET-DEPLOYMENT-PACKAGE-V1.md',
      mainnet_precheck: 'docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md',
      g6_no_rollback: 'evidence/mainnet_launch_gate/G6_no_rollback_ack.md',
      note: 'On-chain state is not reversible — pause / governance / reconcile only',
    },
    owner_signoff: {
      required: true,
      status: 'PENDING',
      refs: [
        'docs/runbook/ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md',
        'evidence/mainnet_shadow_launch/',
      ],
    },
    cert_chain: {
      signed: cert?.signed_count ?? 0,
      total: cert?.total_certs ?? 12,
    },
    mainnet_audit: {
      verdict: mn?.verdict || 'UNKNOWN',
      blockers_p0: mn?.summary?.blockers_p0 ?? null,
    },
    deploy_day_checklist: [
      'Open this book — verify commit_hash matches release tag',
      'Confirm Deployment Readiness Matrix — no unexpected blocking gates',
      'Owner Mainnet Deploy Checklist — tick READY items',
      'Confirm all Review machine_key verdicts end in _PASS',
      'Confirm deployment_manifest + registry_snapshot present post-Freeze',
      'Confirm Shadow Launch SL GO + G0–G6',
      'Owner sign-off recorded',
    ],
  };

  const rollups = buildRollups(ROOT, {
    allReviewsPass,
    exitReview,
    freeze,
    pkg,
    cert,
    reviews,
    blockerCount: blockers.length,
  });
  book.executive_summary = rollups.executive_summary;
  book.mainnet_prep = rollups.mainnet_prep;
  book.deployment_readiness_matrix = rollups.deployment_readiness_matrix;
  book.owner_mainnet_checklist = rollups.owner_mainnet_checklist;

  const md = renderBookMd(book);
  const json = `${JSON.stringify(book, null, 2)}\n`;

  fs.writeFileSync(path.join(RUN_DIR, 'PRODUCTION-READINESS-BOOK-LATEST.json'), json);
  fs.writeFileSync(path.join(EVID_ROOT, 'PRODUCTION-READINESS-BOOK-LATEST.json'), json);
  fs.writeFileSync(path.join(RUN_DIR, 'PRODUCTION-READINESS-BOOK-LATEST.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'PRODUCTION-READINESS-BOOK-LATEST.md'), md);

  const execMd = renderExecutiveSummaryMd(book.executive_summary);
  const matrixMd = renderMatrixMd(book.deployment_readiness_matrix);
  const checklistMd = renderOwnerChecklistMd(book.owner_mainnet_checklist);
  for (const dir of [RUN_DIR, EVID_ROOT]) {
    fs.writeFileSync(path.join(dir, 'PRODUCTION-READINESS-EXECUTIVE-SUMMARY-LATEST.md'), execMd);
    fs.writeFileSync(path.join(dir, 'DEPLOYMENT-READINESS-MATRIX-LATEST.md'), matrixMd);
    fs.writeFileSync(path.join(dir, 'OWNER-MAINNET-DEPLOY-CHECKLIST-LATEST.md'), checklistMd);
  }

  console.log(JSON.stringify({
    book: 'PRODUCTION-READINESS-BOOK-LATEST.md',
    executive_summary: 'PRODUCTION-READINESS-EXECUTIVE-SUMMARY-LATEST.md',
    deployment_readiness_matrix: 'DEPLOYMENT-READINESS-MATRIX-LATEST.md',
    owner_checklist: 'OWNER-MAINNET-DEPLOY-CHECKLIST-LATEST.md',
    production_go: book.executive_summary.production_go,
    current_phase: book.executive_summary.current_phase,
    mainnet_prep_status: book.mainnet_prep.status,
    all_reviews_pass: allReviewsPass,
    blockers: blockers.length,
    commit,
  }, null, 2));
}

function renderBookMd(book) {
  const lines = [
    '# TravelTrust Production Readiness Book',
    '',
    `**Generated:** ${book.recorded_utc}`,
    `**Commit:** \`${book.commit_hash || 'unknown'}\``,
    `**Prerequisite Review:** \`${book.prerequisite_review_verdict}\``,
    '',
    '> Deploy-day rollup — not a separate Gate. Open this file on broadcast day.',
    '',
    renderExecutiveSummaryBookBlock(book.executive_summary),
    '## Deployment Readiness Matrix',
    '',
    '### Four-Gate Framework (Production GO chain)',
    '',
    '| Gate | Machine Key | Status | Blocking | Notes |',
    '|------|-------------|--------|----------|-------|',
  ];

  for (const r of book.deployment_readiness_matrix.four_gate_rows) {
    lines.push(`| ${r.gate} | \`${r.machine_key}\` | **${r.status}** | ${r.blocking ? 'Yes' : 'No'} | ${r.note} |`);
  }

  lines.push(
    '',
    '### Mainnet Deployment Track',
    '',
    '| Gate | Machine Key | Status | Blocking | Notes |',
    '|------|-------------|--------|----------|-------|',
  );
  for (const r of book.deployment_readiness_matrix.mainnet_track_rows) {
    lines.push(`| ${r.gate} | \`${r.machine_key}\` | **${r.status}** | ${r.blocking ? 'Yes' : 'No'} | ${r.note} |`);
  }
  lines.push(
    '',
    '_Full matrix: `DEPLOYMENT-READINESS-MATRIX-LATEST.md` · Executive summary: `PRODUCTION-READINESS-EXECUTIVE-SUMMARY-LATEST.md`_',
    '',
    '## Owner Mainnet Deploy Checklist',
    '',
    '| Item | Status | Notes |',
    '|------|--------|-------|',
  );
  for (const it of book.owner_mainnet_checklist.items) {
    lines.push(`| ${it.item} | **${it.status}** | ${it.note} |`);
  }
  lines.push('', '_Full checklist also at `OWNER-MAINNET-DEPLOY-CHECKLIST-LATEST.md`_', '');

  lines.push(renderPrepSectionMd(book.mainnet_prep), '');

  lines.push(
    '## 1. All Reviews PASS?',
    '',
    book.all_reviews_pass ? '**Yes** — all 10 Reviews PASS (all sub-checks green).' : '**No** — see blockers below.',
    '',
    '| Review | Machine Verdict | Sub-checks |',
    '|--------|-----------------|------------|',
  );

  for (const r of book.review_matrix) {
    lines.push(`| ${r.id} ${r.name} | \`${r.verdict}\` | ${r.summary.pass}/${r.summary.total} |`);
  }

  lines.push('', '## 2. Open Blockers', '');
  if (book.blockers.length === 0) {
    lines.push('_None at sub-check level._');
  } else {
    for (const b of book.blockers) {
      lines.push(`- **${b.review_id}** · \`${b.sub_check_id}\` **${b.sub_check_name}** — ${b.detail}`);
    }
  }

  lines.push('', '## 3. Why Mainnet?', '');
  if (book.why_mainnet_allowed) {
    lines.push(`✅ ${book.why_mainnet_allowed}`);
  } else {
    lines.push('❌ Mainnet not yet authorized at prerequisite layer.');
    for (const w of book.why_mainnet_blocked || []) lines.push(`- ${w}`);
  }

  lines.push('', '## 4. Deployment Manifest', '');
  lines.push(`- **Status:** \`${book.deployment_manifest.status}\``);
  lines.push(`- **Path:** \`${book.deployment_manifest.path}\``);
  lines.push(`- **Present:** ${book.deployment_manifest.present ? 'yes' : 'no (post-Freeze)'}`);

  lines.push('', '## 5. Registry Snapshot', '');
  lines.push(`- **Path:** \`${book.registry_snapshot.path}\``);
  lines.push(`- **Web3 Freeze:** \`${book.registry_snapshot.web3_freeze}\``);

  lines.push('', '## 6. Evidence Index', '');
  for (const e of book.evidence_index) {
    lines.push(`- ${e.present ? '✅' : '⬜'} \`${e.path}\` (${e.id})`);
  }

  lines.push('', '## 7. Rollback Plan', '');
  lines.push(`- ${book.rollback_plan.note}`);
  lines.push(`- Runbook: \`${book.rollback_plan.runbook}\``);
  lines.push(`- Mainnet precheck: \`${book.rollback_plan.mainnet_precheck}\``);

  lines.push('', '## 8. Owner Sign-off', '');
  lines.push(`- **Status:** ${book.owner_signoff.status}`);
  for (const ref of book.owner_signoff.refs) lines.push(`- \`${ref}\``);

  lines.push('', '## 9. Sub-check Matrix (detail)', '');
  for (const r of book.review_matrix) {
    lines.push('', `### ${r.id} — ${r.name} (\`${r.verdict}\`)`, '');
    lines.push('| Sub-check | PASS | Detail |');
    lines.push('|-----------|------|--------|');
    for (const c of r.sub_checks || []) {
      lines.push(`| ${c.name} | ${c.pass ? '✅' : '⬜'} | ${c.detail} |`);
    }
  }

  lines.push('', '---', '', '_Auto-generated by `node scripts/dev/gen-production-readiness-book.cjs`_', '');
  return lines.join('\n');
}

main();
