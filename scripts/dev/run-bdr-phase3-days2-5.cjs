#!/usr/bin/env node
/** Phase 3 · BDR Day2–5 orchestrator · evidence + registry sync hint */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const API = process.env.API || 'https://tt-api-staging.fly.dev';

function run(script) {
  console.log(`\n== ${script} ==`);
  try {
    execSync(`node scripts/dev/${script}`, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, API } });
    return 0;
  } catch {
    console.warn(`WARN: ${script} exited non-zero · continuing Phase 3 evidence collection`);
    return 1;
  }
}

const steps = [
  'run-provider-business-data-readiness-probes.cjs',
  'run-listings-business-data-readiness-probes.cjs',
  'run-poi-business-data-readiness-probes.cjs',
  'run-pricing-business-data-readiness-probes.cjs',
];

for (const s of steps) run(s);

try {
  execSync('node scripts/dev/run-bdr-sync-registry-from-evidence.cjs', { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  console.warn('registry sync skipped:', e.message);
}
execSync('node scripts/dev/run-production-readiness-master-checklist.cjs', { cwd: ROOT, stdio: 'inherit' });

const out = path.join(ROOT, 'evidence/GO_production_readiness/sprints/PHASE3-BDR-DAY2-5-EXECUTION-LATEST.json');
const domains = ['guide', 'provider', 'listings', 'poi', 'pricing'].map((d) => {
  const paths = {
    guide: 'step1/GUIDE-BUSINESS-DATA-READINESS-DAY1-LATEST.json',
    provider: 'step2/PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.json',
    listings: 'step3/LISTINGS-BUSINESS-DATA-READINESS-DAY3-LATEST.json',
    poi: 'step3/POI-BUSINESS-DATA-READINESS-DAY4-LATEST.json',
    pricing: 'step3/PRICING-BUSINESS-DATA-READINESS-DAY5-LATEST.json',
  };
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence/GO_production_readiness', paths[d]), 'utf8'));
  return { domain: d, ready: j.ready, signal: Object.keys(j).find((k) => k.startsWith('TT_')) };
});

fs.writeFileSync(
  out,
  JSON.stringify(
    {
      schema: 'traveltrust.phase3_bdr_day2_5_execution.v1',
      recorded_at_utc: new Date().toISOString(),
      mode: 'verify_and_closeout',
      domains,
      all_ready: domains.every((x) => x.ready === 'YES'),
      TT_SPRINT_B_ACTIVE: false,
    },
    null,
    2,
  ) + '\n',
);
console.log('\nPhase 3 BDR complete →', out);
