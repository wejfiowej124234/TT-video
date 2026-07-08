#!/usr/bin/env node
/** Sync one manual validation check verdict from evidence */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG = path.join(ROOT, 'registry/manual-validation-checklist.v1.yaml');
const checkId = process.argv[2];
const evidenceRel = process.argv[3];

if (!checkId || !evidenceRel) {
  console.error('Usage: node run-manual-matrix-sync-check.cjs <check_id> <evidence-json-rel-path>');
  process.exit(1);
}

const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, evidenceRel), 'utf8'));
if (evidence.verdict !== 'PASS') {
  console.error(`Evidence verdict ${evidence.verdict} — refusing manual sync`);
  process.exit(1);
}

let yaml = fs.readFileSync(REG, 'utf8');
const today = new Date().toISOString().slice(0, 10);
const note = `Manual-${checkId} · UAT PASS · E: ${evidenceRel.replace(/^evidence\//, 'step4/../').replace('GO_production_readiness/step4/manual/steps/', 'step4/manual/steps/')}`;

const simpleNote = `Manual-${checkId} · UAT PASS · E: ${evidenceRel}`;
const re = new RegExp(
  `(\\{ id: ${checkId}, label: [^,]+, verdict: )pending(\\s*\\})`,
);
if (!re.test(yaml)) {
  console.error(`Could not find pending check ${checkId}`);
  process.exit(1);
}
yaml = yaml.replace(re, `$1pass, note: "${simpleNote}" }`);
yaml = yaml.replace(/^version: \d+/m, (m) => {
  const v = parseInt(m.split(':')[1].trim(), 10);
  return `version: ${v + 1}`;
});
yaml = yaml.replace(/^effective_utc: "[^"]+"/m, `effective_utc: "${today}"`);

fs.writeFileSync(REG, yaml.endsWith('\n') ? yaml : yaml + '\n');
console.log(`synced manual check ${checkId} → pass`);
