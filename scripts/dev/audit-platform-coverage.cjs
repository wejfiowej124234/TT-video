#!/usr/bin/env node
/**
 * Platform Coverage Audit
 *
 *   node scripts/dev/audit-platform-coverage.cjs
 *   node scripts/dev/audit-platform-coverage.cjs --evidence-dir evidence/GO_platform_capability/coverage-audit/<stamp>
 *   node scripts/dev/audit-platform-coverage.cjs --require-pass   # exit 1 if any capability below target
 */
const path = require('path');
const {
  runPlatformCoverageAudit,
  writeCoverageEvidence,
  printConsoleTable,
} = require('./lib/platform-coverage-audit.cjs');

function parseArgs() {
  const args = { evidenceDir: '', requirePass: false };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
    if (process.argv[i] === '--require-pass') args.requirePass = true;
  }
  return args;
}

function main() {
  const { evidenceDir, requirePass } = parseArgs();
  const stamp = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
  const summary = runPlatformCoverageAudit({ stamp });

  printConsoleTable(summary);

  const out =
    evidenceDir ||
    `evidence/GO_platform_capability/coverage-audit/${stamp}`;
  const written = writeCoverageEvidence(out, summary);
  console.log(`Evidence: ${path.relative(process.cwd(), written).replace(/\\/g, '/')}`);

  if (requirePass && !summary.all_pass) {
    process.exit(1);
  }
}

main();
