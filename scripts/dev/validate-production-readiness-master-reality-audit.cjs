#!/usr/bin/env node
/**
 * Validate Production Readiness Master Reality Audit signoff.
 *
 *   node scripts/dev/validate-production-readiness-master-reality-audit.cjs \
 *     --evidence-dir evidence/GO_production_readiness/master-reality-audit/<stamp>
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
    console.error('Usage: --evidence-dir evidence/GO_production_readiness/master-reality-audit/<stamp>');
    process.exit(1);
  }

  const dir = path.join(ROOT, evidenceDir);
  const reportPath = path.join(dir, 'master-reality-audit.json');
  if (!fs.existsSync(reportPath)) {
    console.error('Missing master-reality-audit.json');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const required = ['master-reality-audit.json', 'master-reality-audit.md'];
  for (const f of required) {
    if (!fs.existsSync(path.join(dir, f))) {
      console.error('Missing', f);
      process.exit(1);
    }
  }

  console.log(`VERIFIED: ${report.gate.verified_count}`);
  console.log(`PLANNED: ${report.gate.planned_count}`);
  console.log(`DRIFT: ${report.gate.drift_count}`);

  if (report.gate.drift_count > 0) {
    console.log('DRIFT items (must clear before G3-01):');
    for (const f of report.by_verdict.DRIFT.slice(0, 15)) {
      console.log(`  - ${f.id}: ${f.detail}`);
    }
    if (report.by_verdict.DRIFT.length > 15) {
      console.log(`  ... +${report.by_verdict.DRIFT.length - 15} more`);
    }
  }

  if (!report.gate.g3_entry_allowed) {
    console.log('TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT: FAIL');
    console.log('G3-01 entry: BLOCKED');
    process.exit(1);
  }

  const yaml = fs.readFileSync(REG_MATRIX, 'utf8');
  if (!/TT_G2_RETROSPECTIVE: COMPLETE/.test(yaml)) {
    console.log('FAIL prerequisite TT_G2_RETROSPECTIVE not COMPLETE');
    process.exit(1);
  }

  console.log('TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT: PASS');
  console.log('G3-01 Production Network entry: ALLOWED');
}

main();
