#!/usr/bin/env node
/**
 * Release Train · Platform Coverage Gate — fail when capability coverage below SSOT target.
 *
 *   node scripts/dev/validate-platform-coverage-gate.cjs --signoff evidence/.../platform-coverage-audit.json [--gate G2]
 */
const fs = require('fs');
const path = require('path');
const { runPlatformCoverageAudit } = require('./lib/platform-coverage-audit.cjs');

const ROOT = path.join(__dirname, '../..');

function parseArgs() {
  const args = { signoff: '', gate: 'G2', inline: false };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--signoff') args.signoff = process.argv[++i];
    else if (process.argv[i] === '--gate') args.gate = process.argv[++i];
    else if (process.argv[i] === '--inline') args.inline = true;
  }
  return args;
}

function loadSummary(args) {
  if (args.inline || !args.signoff) {
    return runPlatformCoverageAudit();
  }
  const sp = path.isAbsolute(args.signoff) ? args.signoff : path.join(ROOT, args.signoff);
  return JSON.parse(fs.readFileSync(sp, 'utf8'));
}

function gateThresholds(gate) {
  const full = { runtime_identity: 100, configuration_truth: 100, platform_adoption: 100 };
  if (gate === 'G3' || gate === 'G2') return full;
  return full;
}

function main() {
  const args = parseArgs();
  const summary = loadSummary(args);
  const thresholds = gateThresholds(args.gate);

  const byId = Object.fromEntries((summary.details || summary.capabilities || []).map((c) => [c.id, c]));
  const ri = byId.runtime_identity || summary.capabilities?.find((c) => c.id === 'runtime_identity');
  const ct = byId.configuration_truth || summary.capabilities?.find((c) => c.id === 'configuration_truth');
  const adoption = summary.platform_adoption?.adoption_pct ?? 0;

  const riPct = ri?.coverage_pct ?? 0;
  const ctPct = ct?.coverage_pct ?? 0;
  const unmigratedTotal =
    (ri?.unmigrated_modules?.length ?? 0) + (ct?.unmigrated_modules?.length ?? 0);

  const checks = {
    runtime_identity: riPct >= thresholds.runtime_identity,
    configuration_truth: ctPct >= thresholds.configuration_truth,
    platform_capabilities: summary.all_pass === true,
    zero_unmigrated_modules: unmigratedTotal === 0,
  };

  if (args.gate === 'G3') {
    checks.platform_adoption = adoption >= thresholds.platform_adoption;
  }

  const pass = Object.values(checks).every(Boolean);
  const gateSignoff = {
    review_id: 'PLATFORM-COVERAGE-GATE',
    gate: args.gate,
    machine_key: 'TT_PLATFORM_COVERAGE_AUDIT',
    pass,
    thresholds,
    actual: {
      runtime_identity_pct: riPct,
      configuration_truth_pct: ctPct,
      platform_adoption_pct: adoption,
    },
    checks,
    unmigrated: {
      runtime_identity: ri?.unmigrated_modules || [],
      configuration_truth: ct?.unmigrated_modules || [],
    },
    verdict: pass ? 'PASS' : 'FAIL',
    blocks_formal: !pass,
  };

  if (args.signoff) {
    const dir = path.dirname(path.isAbsolute(args.signoff) ? args.signoff : path.join(ROOT, args.signoff));
    fs.writeFileSync(path.join(dir, 'platform-coverage-gate.json'), `${JSON.stringify(gateSignoff, null, 2)}\n`);
  }

  console.log(`Platform Coverage Gate (${args.gate})`);
  console.log('─'.repeat(60));
  console.log(
    `RuntimeIdentity     ${riPct}% / ${thresholds.runtime_identity}%  ${checks.runtime_identity ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `ConfigurationTruth  ${ctPct}% / ${thresholds.configuration_truth}%  ${checks.configuration_truth ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `Unmigrated modules   ${unmigratedTotal} (required 0)  ${checks.zero_unmigrated_modules ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `Platform Adoption   ${adoption}% (aggregate · target 100% for Production GO)`
  );
  console.log(`TT_PLATFORM_COVERAGE_AUDIT: ${pass ? 'PASS' : 'FAIL'}`);

  process.exit(pass ? 0 : 1);
}

main();
