#!/usr/bin/env node
/**
 * PCP Phase 1 · Freeze / Regression Window
 *
 * Priority (do NOT start Phase 2 until this chain PASS + sign-off):
 *   1. Phase 1 Freeze gates
 *   2. Full-site regression (local + Staging)
 *   3. CI governed-view enforcement pre-check
 *   4. Evidence freeze sign-off → TT_PCP_PHASE_1_FREEZE: COMPLETE
 *
 * Phase 2 (SearchBuilder / RecommendationBuilder) remains NOT_STARTED until freeze sign-off.
 *
 *   node scripts/dev/validate-pcp-phase1-freeze-regression.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/validate-pcp-phase1-freeze-regression.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);
const SKIP_STAGING = process.env.SKIP_STAGING === '1';

const DOMAIN_ALIGNMENT = [
  'community',
  'market',
  'provider',
  'acquisition',
  'official_guide',
  'campaign',
  'admin_public_content_center',
];

const checks = [];

function record(id, label, status, detail, extra = {}) {
  checks.push({ id, label, status, detail, ...extra });
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function runScript(rel, extraEnv = {}) {
  const script = path.join(ROOT, rel);
  const r = spawnSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      AUDIT_STAMP: STAMP,
      STAGING_API,
      SKIP_STAGING: SKIP_STAGING ? '1' : '',
      ...extraEnv,
    },
  });
  return { script: rel, pass: r.status === 0, tail: (r.stdout || r.stderr || '').slice(-500) };
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function isoFromStamp(stamp) {
  return stamp.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z');
}

function runPhase1FreezeGates() {
  const reg = read('registry/public-content-platform.v1.yaml');
  const phase1Complete = /TT_PCP_PHASE_1: COMPLETE/.test(reg);
  record(
    'freeze_phase1_complete',
    'TT_PCP_PHASE_1: COMPLETE in registry',
    phase1Complete ? 'PASS' : 'FAIL',
    phase1Complete ? 'Phase 1 engineering complete' : 'Run validate-pcp-phase1-final-signoff.cjs first'
  );

  const buildersFrozen = [
    !exists('crates/api/src/pcp/search_builder.rs'),
    !exists('crates/api/src/pcp/recommendation_builder.rs'),
  ].every(Boolean);
  record(
    'freeze_no_phase2_builders',
    'Phase 1 freeze — SearchBuilder / RecommendationBuilder not started',
    buildersFrozen ? 'PASS' : 'FAIL',
    buildersFrozen ? 'No Phase 2 builder files in pcp/' : 'Remove or defer Phase 2 builders during freeze window'
  );

  const runbook = read('docs/runbook/TT-PUBLIC-CONTENT-PLATFORM.md');
  record(
    'freeze_runbook_phase1',
    'Runbook documents Phase 1 COMPLETE',
    /TT_PCP_PHASE_1: COMPLETE|Phase 1 Architecture Alignment（\*\*COMPLETE\*\*/.test(runbook) ? 'PASS' : 'WARN',
    'docs/runbook/TT-PUBLIC-CONTENT-PLATFORM.md'
  );

  return phase1Complete && buildersFrozen;
}

function stampFreezeSignOff(evidence) {
  const regPath = path.join(ROOT, 'registry/public-content-platform.v1.yaml');
  const runbookPath = path.join(ROOT, 'docs/runbook/TT-PUBLIC-CONTENT-PLATFORM.md');
  let reg = fs.readFileSync(regPath, 'utf8');

  if (!reg.includes('TT_PCP_PHASE_1_FREEZE:')) {
    reg = reg.replace(
      'TT_PCP_PHASE_1_FINAL_SIGNOFF: COMPLETE',
      'TT_PCP_PHASE_1_FINAL_SIGNOFF: COMPLETE\n  TT_PCP_PHASE_1_FREEZE: COMPLETE\n  TT_PCP_PHASE_2: NOT_STARTED'
    );
  } else {
    reg = reg.replace(/TT_PCP_PHASE_1_FREEZE: \w+/, 'TT_PCP_PHASE_1_FREEZE: COMPLETE');
    if (!reg.includes('TT_PCP_PHASE_2:')) {
      reg = reg.replace(/TT_PCP_PHASE_1_FREEZE: COMPLETE/, 'TT_PCP_PHASE_1_FREEZE: COMPLETE\n  TT_PCP_PHASE_2: NOT_STARTED');
    } else {
      reg = reg.replace(/TT_PCP_PHASE_2: \w+/, 'TT_PCP_PHASE_2: NOT_STARTED');
    }
  }
  reg = reg.replace(/updated_utc: "[^"]+"/, `updated_utc: "${isoFromStamp(STAMP)}"`);
  fs.writeFileSync(regPath, reg);

  let rb = fs.readFileSync(runbookPath, 'utf8');
  if (!rb.includes('Phase 1 Freeze / Regression Window')) {
    const insertAfter = '## Phase 1 Architecture Alignment（**COMPLETE** · Final Sign-off）';
    const freezeSection = `

---

## Phase 1 Freeze / Regression Window（**ACTIVE** · ${STAMP}）

**目的：** Phase 1 工程已 COMPLETE — 在开启 Phase 2 前，冻结 Builder 面扩展，执行全站回归 + CI governed-view 预审，确认 7/7 ALIGNED 在本地与 Staging 无漂移。

**冻结范围（写死）：** 禁止新增 \`SearchBuilder\` · \`RecommendationBuilder\` · 新 Governed View migration · 新 Public Builder plugin，直至 \`TT_PCP_PHASE_1_FREEZE: COMPLETE\`。

**命令：**

\`\`\`bash
node scripts/dev/validate-pcp-phase1-freeze-regression.cjs
node scripts/dev/audit-pcp-governed-view-ci-enforcement-precheck.cjs
\`\`\`

**Phase 2 开门条件：** \`TT_PCP_PHASE_1_FREEZE: COMPLETE\` + Owner 书面确认 Phase 2 范围。

`;
    if (rb.includes(insertAfter)) {
      rb = rb.replace(insertAfter, insertAfter + freezeSection);
    }
  }
  if (!rb.includes('TT_PCP_PHASE_1_FREEZE: COMPLETE')) {
    rb = rb.replace(
      '**Phase 1 Final Sign-off',
      `**Phase 1 Freeze Sign-off（${STAMP}）：** \`TT_PCP_PHASE_1_FREEZE: COMPLETE\` · 7/7 stable · Phase 2 NOT_STARTED\n\n**Phase 1 Final Sign-off`
    );
  }
  fs.writeFileSync(runbookPath, rb);

  return { registry: regPath, runbook: runbookPath, evidence };
}

function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  console.log('\n=== PCP Phase 1 · Freeze / Regression Window ===\n');

  console.log('① Phase 1 Freeze gates…');
  const freezeOk = runPhase1FreezeGates();

  console.log('② Full-site regression (local + Staging)…');
  const regressionSteps = [
    runScript('scripts/dev/validate-pcp-phase1-final-signoff.cjs'),
    runScript('scripts/dev/audit-pcp-full-pipeline-alignment.cjs'),
    runScript('scripts/dev/audit-enterprise-ssot-alignment.cjs'),
  ];
  for (const s of regressionSteps) {
    record(
      `regression_${path.basename(s.script, '.cjs')}`,
      s.script,
      s.pass ? 'PASS' : 'FAIL',
      s.pass ? 'exit 0' : s.tail
    );
  }

  console.log('③ CI governed-view enforcement pre-check…');
  const ciPrecheck = runScript('scripts/dev/audit-pcp-governed-view-ci-enforcement-precheck.cjs');
  record(
    'ci_enforcement_precheck',
    'audit-pcp-governed-view-ci-enforcement-precheck.cjs',
    ciPrecheck.pass ? 'PASS' : 'FAIL',
    ciPrecheck.pass ? 'Static pre-check PASS (CI workflow wiring = Phase 2)' : ciPrecheck.tail
  );

  const phase1Report = readJson(`evidence/GO_public_content_platform/${STAMP}/pcp-phase1-full-alignment.json`);
  const domainsAligned = phase1Report?.summary?.domains_fully_aligned ?? 0;
  const domainCount = phase1Report?.summary?.domain_count ?? 7;
  const alignmentComplete = phase1Report?.verdict?.phase1_alignment === 'COMPLETE';
  const blockingGaps = phase1Report?.summary?.blocking ?? 999;
  const phase1Gaps = phase1Report?.summary?.phase1_gaps ?? 999;

  for (const domain of DOMAIN_ALIGNMENT) {
    const score = phase1Report?.domain_scores?.find((d) => d.domain === domain);
    const aligned = score?.pct === 100;
    record(
      `domain_${domain}`,
      `Domain ${domain} ALIGNED`,
      aligned ? 'PASS' : 'FAIL',
      aligned ? `${score.aligned}/${score.total} layers` : score ? `${score.pct}%` : 'missing from report'
    );
  }

  const regressionPass = regressionSteps.every((s) => s.pass) && ciPrecheck.pass;
  const stabilityPass =
    freezeOk &&
    regressionPass &&
    alignmentComplete &&
    domainsAligned === domainCount &&
    phase1Gaps === 0 &&
    blockingGaps === 0;

  let ssotStamp = null;
  if (stabilityPass) {
    ssotStamp = stampFreezeSignOff({
      freeze_regression: `evidence/GO_public_content_platform/${STAMP}/phase1-freeze-regression-signoff.json`,
      phase1_alignment: `evidence/GO_public_content_platform/${STAMP}/pcp-phase1-full-alignment.json`,
      ci_precheck: `evidence/GO_public_content_platform/${STAMP}/pcp-governed-view-ci-enforcement-precheck.json`,
      final_signoff: `evidence/GO_public_content_platform/${STAMP}/phase1-final-signoff.json`,
    });
  }

  const report = {
    validation: 'PCP_PHASE_1_FREEZE_REGRESSION',
    stamp: STAMP,
    staging_api: STAGING_API,
    sequence: [
      'phase_1_freeze_gates',
      'full_site_regression',
      'ci_governed_view_precheck',
      'evidence_freeze_signoff',
    ],
    domain_alignment: DOMAIN_ALIGNMENT.map((d) => ({
      domain: d,
      status: phase1Report?.domain_scores?.find((x) => x.domain === d)?.status || 'UNKNOWN',
      pct: phase1Report?.domain_scores?.find((x) => x.domain === d)?.pct,
    })),
    phase1_alignment: phase1Report?.verdict?.phase1_alignment || 'UNKNOWN',
    domains_fully_aligned: `${domainsAligned}/${domainCount}`,
    overall: stabilityPass ? 'PASS' : 'FAIL',
    TT_PCP_PHASE_1: 'COMPLETE',
    TT_PCP_PHASE_1_FREEZE: stabilityPass ? 'COMPLETE' : 'IN_PROGRESS',
    TT_PCP_PHASE_2: 'NOT_STARTED',
    phase_2_blocked_until: 'TT_PCP_PHASE_1_FREEZE: COMPLETE',
    phase_2_deferred: ['SearchBuilder', 'RecommendationBuilder', 'CI governed-view workflow wiring'],
    freeze_sign_off_allowed: stabilityPass,
    freeze_sign_off_note: stabilityPass
      ? '7/7 ALIGNED stable on local + Staging — Phase 2 may be planned (not auto-started)'
      : 'Fix regression failures before Phase 2',
    checks,
    ssot_stamp: ssotStamp,
  };

  const outPath = path.join(EVID_DIR, 'phase1-freeze-regression-signoff.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log('\n=== Phase 1 Freeze / Regression · Summary ===\n');
  console.log(`  Phase 1 alignment: ${report.phase1_alignment}`);
  console.log(`  Domains: ${report.domains_fully_aligned}`);
  console.log(`  TT_PCP_PHASE_1_FREEZE: ${report.TT_PCP_PHASE_1_FREEZE}`);
  console.log(`  TT_PCP_PHASE_2: ${report.TT_PCP_PHASE_2}`);
  console.log(`  Sign-off: ${stabilityPass ? 'ALLOWED' : 'BLOCKED'}`);
  console.log(`\nEvidence: ${path.relative(ROOT, outPath)}\n`);

  process.exit(stabilityPass ? 0 : 1);
}

main();
