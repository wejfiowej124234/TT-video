#!/usr/bin/env node
/**
 * PCP Phase 1 · Final Sign-off chain (after Batch 1 Market + Batch 2 Campaign):
 *   ① validate-pcp-phase1-market-batch-staging.cjs
 *   ② validate-pcp-phase1-campaign-batch-staging.cjs
 *   ③ validate-pcp-phase0-5-staging.cjs (Community regression)
 *   ④ audit-pcp-phase1-full-alignment.cjs
 *   ⑤ If 7/7 domains ALIGNED → stamp TT_PCP_PHASE_1: COMPLETE in registry + runbook
 *
 *   node scripts/dev/validate-pcp-phase1-final-signoff.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/validate-pcp-phase1-final-signoff.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);
const SKIP_STAGING = process.env.SKIP_STAGING === '1';

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
  return {
    script: rel,
    pass: r.status === 0,
    tail: (r.stdout || r.stderr || '').slice(-600),
  };
}

function readJson(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function stampRegistryComplete(evidence) {
  const regPath = path.join(ROOT, 'registry/public-content-platform.v1.yaml');
  const runbookPath = path.join(ROOT, 'docs/runbook/TT-PUBLIC-CONTENT-PLATFORM.md');
  let reg = fs.readFileSync(regPath, 'utf8');
  reg = reg.replace(/TT_PCP_PHASE_1: IN_PROGRESS/g, 'TT_PCP_PHASE_1: COMPLETE');
  reg = reg.replace(/updated_utc: "[^"]+"/, `updated_utc: "${STAMP.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')}"`);
  if (!reg.includes('TT_PCP_PHASE_1_FINAL_SIGNOFF: COMPLETE')) {
    reg = reg.replace(
      /TT_PCP_PHASE_1_BATCH_1: COMPLETE/,
      'TT_PCP_PHASE_1_BATCH_1: COMPLETE\n  TT_PCP_PHASE_1_BATCH_2: COMPLETE\n  TT_PCP_PHASE_1_FINAL_SIGNOFF: COMPLETE'
    );
  }
  fs.writeFileSync(regPath, reg);

  let rb = fs.readFileSync(runbookPath, 'utf8');
  rb = rb.replace(
    /## Phase 1 Architecture Alignment（\*\*IN_PROGRESS\*\*[^）]*）/,
    '## Phase 1 Architecture Alignment（**COMPLETE** · Final Sign-off）'
  );
  if (!rb.includes('TT_PCP_PHASE_1: COMPLETE')) {
    rb = rb.replace(
      '**Batch 1 签收',
      `**Phase 1 Final Sign-off（${STAMP}）：** \`TT_PCP_PHASE_1: COMPLETE\` · 7/7 domains ALIGNED\n\n**Batch 1 签收`
    );
  }
  fs.writeFileSync(runbookPath, rb);

  return { registry: regPath, runbook: runbookPath, evidence };
}

function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  console.log('\n=== PCP Phase 1 · Final Sign-off Chain ===\n');

  const steps = [];
  steps.push(runScript('scripts/dev/validate-pcp-phase1-market-batch-staging.cjs'));
  steps.push(runScript('scripts/dev/validate-pcp-phase1-campaign-batch-staging.cjs'));
  if (!SKIP_STAGING) {
    steps.push(runScript('scripts/dev/validate-pcp-phase0-5-staging.cjs'));
  }
  steps.push(runScript('scripts/dev/audit-pcp-phase1-full-alignment.cjs'));

  const phase1Report = readJson(`evidence/GO_public_content_platform/${STAMP}/pcp-phase1-full-alignment.json`);
  const domainsAligned = phase1Report?.summary?.domains_fully_aligned ?? 0;
  const domainCount = phase1Report?.summary?.domain_count ?? 7;
  const phase1Gaps = phase1Report?.summary?.phase1_gaps ?? 999;
  const blocking = phase1Report?.summary?.blocking ?? 999;
  const alignmentComplete = phase1Report?.verdict?.phase1_alignment === 'COMPLETE';
  const allStepsPass = steps.every((s) => s.pass);
  const signOffAllowed = allStepsPass && alignmentComplete && domainsAligned === domainCount && phase1Gaps === 0 && blocking === 0;

  let ssotStamp = null;
  if (signOffAllowed) {
    ssotStamp = stampRegistryComplete({
      phase1_full_alignment: `evidence/GO_public_content_platform/${STAMP}/pcp-phase1-full-alignment.json`,
      market_batch: `evidence/GO_public_content_platform/${STAMP}/phase1-market-batch-validation-chain.json`,
      campaign_batch: `evidence/GO_public_content_platform/${STAMP}/phase1-campaign-batch-validation-chain.json`,
    });
  }

  const report = {
    validation: 'PCP_PHASE_1_FINAL_SIGNOFF',
    stamp: STAMP,
    staging_api: STAGING_API,
    steps: steps.map((s) => ({ script: s.script, pass: s.pass })),
    phase1_alignment: phase1Report?.verdict?.phase1_alignment || 'UNKNOWN',
    domains_fully_aligned: `${domainsAligned}/${domainCount}`,
    phase1_gaps: phase1Gaps,
    blocking,
    overall: signOffAllowed ? 'PASS' : 'FAIL',
    TT_PCP_PHASE_1: signOffAllowed ? 'COMPLETE' : 'IN_PROGRESS',
    sign_off_allowed: signOffAllowed,
    sign_off_note: signOffAllowed
      ? 'All domains 7/7 ALIGNED — TT_PCP_PHASE_1 stamped COMPLETE in registry + runbook'
      : 'Do NOT stamp COMPLETE — fix gaps and re-run',
    ssot_stamp: ssotStamp,
  };

  const outPath = path.join(EVID_DIR, 'phase1-final-signoff.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`Steps:`);
  for (const s of steps) {
    console.log(`  [${s.pass ? 'PASS' : 'FAIL'}] ${s.script}`);
  }
  console.log(`\nPhase 1 alignment: ${report.phase1_alignment}`);
  console.log(`Domains fully aligned: ${report.domains_fully_aligned}`);
  console.log(`TT_PCP_PHASE_1: ${report.TT_PCP_PHASE_1}`);
  console.log(`\nEvidence: ${path.relative(ROOT, outPath)}`);
  console.log(`Sign-off: ${signOffAllowed ? 'ALLOWED' : 'BLOCKED'} (${report.sign_off_note})\n`);

  process.exit(signOffAllowed ? 0 : 1);
}

main();
