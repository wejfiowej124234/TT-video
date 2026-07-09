#!/usr/bin/env node
/**
 * Validate Production Retrospective — after TT_PRODUCTION_GO: GO only.
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
    console.error('Usage: --evidence-dir evidence/GO_production_readiness/production-retrospective/<stamp>');
    process.exit(1);
  }

  const dir = path.join(ROOT, evidenceDir);
  const signoffPath = path.join(dir, 'production-retrospective-signoff.json');
  if (!fs.existsSync(signoffPath)) {
    console.error('Missing production-retrospective-signoff.json');
    process.exit(1);
  }

  const required = [
    'production-evidence-index.json',
    'production-machine-keys-snapshot.yaml',
    'final-master-matrix-snapshot.yaml',
    'launch-timeline.json',
    'lessons-learned.json',
    'production-baseline.json',
  ];

  for (const f of required) {
    const ok = fs.existsSync(path.join(dir, f));
    console.log(`${ok ? 'PASS' : 'FAIL'} artifact ${f}`);
    if (!ok) process.exit(1);
  }

  const signoff = JSON.parse(fs.readFileSync(signoffPath, 'utf8'));
  const matrix = fs.readFileSync(REG_MATRIX, 'utf8');
  const goLive = matrix.match(/TT_PRODUCTION_GO: (\w+)/)?.[1] === 'GO';
  console.log(`${goLive ? 'PASS' : 'FAIL'} live TT_PRODUCTION_GO: GO`);

  if (signoff.verdict !== 'PRODUCTION_RETROSPECTIVE_COMPLETE' || !goLive) {
    console.log('TT_PRODUCTION_RETROSPECTIVE: IN_PROGRESS');
    process.exit(1);
  }

  console.log('TT_PRODUCTION_RETROSPECTIVE: COMPLETE');
  console.log('V1 launch baseline frozen');
}

main();
