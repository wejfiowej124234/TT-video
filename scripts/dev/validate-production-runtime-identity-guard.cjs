#!/usr/bin/env node
/**
 * Production Runtime Identity Guard validator.
 *
 *   node scripts/dev/validate-production-runtime-identity-guard.cjs \
 *     --evidence-dir evidence/.../production-runtime-identity/<stamp> [--profile production]
 */
const path = require('path');
const {
  evaluateProductionRuntimeIdentity,
  writeIdentityEvidence,
  ROOT,
} = require('./lib/production-runtime-identity-guard.cjs');

function parseArgs() {
  const args = { evidenceDir: '', profile: 'production' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
    if (process.argv[i] === '--profile') args.profile = process.argv[++i];
  }
  return args;
}

function main() {
  const { evidenceDir, profile } = parseArgs();
  if (!evidenceDir) {
    console.error('Usage: --evidence-dir <dir> [--profile production|staging|local]');
    process.exit(1);
  }

  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const evaluation = evaluateProductionRuntimeIdentity(base, { profile });
  const stamp = path.basename(base);
  writeIdentityEvidence(base, evaluation, { stamp, profile });

  console.log('Production Runtime Identity Guard');
  console.log('─'.repeat(70));
  console.log(`Profile: ${profile}`);
  console.log(`deployment_profile (meta): ${evaluation.meta_deployment_profile ?? 'null'}`);
  for (const [k, v] of Object.entries(evaluation.checks || {})) {
    if (k.endsWith('_value')) continue;
    console.log(`  ${String(v).padEnd(5)} ${k}`);
  }
  console.log('─'.repeat(70));
  console.log(`TT_PRODUCTION_RUNTIME_IDENTITY: ${evaluation.verdict}`);
  if (evaluation.configuration_truth) {
    console.log(`TT_CONFIGURATION_TRUTH: ${evaluation.configuration_truth.verdict}`);
    if (evaluation.configuration_truth.drifts?.length) {
      console.log(`  drift: ${evaluation.configuration_truth.drifts[0].detail || evaluation.configuration_truth.drifts[0].kind}`);
    }
  }
  console.log(evaluation.reason);
  console.log(`Evidence: ${path.relative(ROOT, base).replace(/\\/g, '/')}`);

  process.exit(evaluation.pass ? 0 : 1);
}

main();
