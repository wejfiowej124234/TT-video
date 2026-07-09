#!/usr/bin/env node
/**
 * Validate G2 Retrospective signoff — release process only.
 *
 *   node scripts/dev/validate-g2-retrospective.cjs --evidence-dir evidence/GO_production_readiness/g2-retrospective/<stamp>
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

function parseArgs() {
  const args = { evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

function main() {
  const { evidenceDir } = parseArgs();
  if (!evidenceDir) {
    console.error('Usage: --evidence-dir evidence/GO_production_readiness/g2-retrospective/<stamp>');
    process.exit(1);
  }

  const dir = path.join(ROOT, evidenceDir);
  const signoffPath = path.join(dir, 'g2-retrospective-signoff.json');
  if (!fs.existsSync(signoffPath)) {
    console.error('Missing g2-retrospective-signoff.json');
    process.exit(1);
  }

  const signoff = JSON.parse(fs.readFileSync(signoffPath, 'utf8'));
  const required = [
    'g2-evidence-index.json',
    'g2-machine-keys-snapshot.yaml',
    'g2-master-matrix-snapshot.yaml',
    'lessons-learned.json',
    'lessons-learned.md',
    'g3-entry-checklist.json',
  ];

  const checks = [];
  for (const f of required) {
    const ok = fs.existsSync(path.join(dir, f));
    checks.push({ file: f, pass: ok });
    console.log(`${ok ? 'PASS' : 'FAIL'} artifact ${f}`);
  }

  const matrix = fs.readFileSync(REG_MATRIX, 'utf8');
  const liveG2 = matrix.match(/TT_PRODUCTION_READINESS_G2_GATE: (\w+)/)?.[1];
  const snapG2 = signoff.machine_keys?.TT_PRODUCTION_READINESS_G2_GATE;
  const g2Match = liveG2 === snapG2 && liveG2 === 'PASS';
  checks.push({ file: 'live_matrix_g2_gate', pass: g2Match });
  console.log(`${g2Match ? 'PASS' : 'FAIL'} live matrix G2_GATE matches snapshot (${liveG2} vs ${snapG2})`);

  const blockersOk = (signoff.g2_blockers || []).every((b) => b.status === 'CLOSED' && b.exists);
  checks.push({ file: 'g2_blockers_evidence', pass: blockersOk });
  console.log(`${blockersOk ? 'PASS' : 'FAIL'} G2 blockers CLOSED with repo evidence`);

  const g3Entry = JSON.parse(fs.readFileSync(path.join(dir, 'g3-entry-checklist.json'), 'utf8'));
  checks.push({ file: 'g3_entry_checklist', pass: !!g3Entry.g3_scope_production_only?.length });
  console.log(`${g3Entry.g3_scope_production_only?.length ? 'PASS' : 'FAIL'} G3 entry checklist scope defined`);

  const allPass = checks.every((c) => c.pass) && signoff.verdict === 'G2_RETROSPECTIVE_COMPLETE';
  if (!allPass) {
    console.log(`TT_G2_RETROSPECTIVE: ${signoff.machine_keys?.TT_G2_RETROSPECTIVE || 'IN_PROGRESS'}`);
    process.exit(1);
  }

  console.log('TT_G2_RETROSPECTIVE: COMPLETE');
  console.log(`G2 baseline frozen · formal=${signoff.formal_baseline}`);
  console.log(`G3 entry: ${g3Entry.g3_release_train}`);
}

main();
