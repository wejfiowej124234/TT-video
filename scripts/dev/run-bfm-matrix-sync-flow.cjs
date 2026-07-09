#!/usr/bin/env node
/** Sync one BFM flow verdicts from Session evidence → business-flow-matrix.v1.yaml */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'registry/business-flow-matrix.v1.yaml');
const flowId = process.argv[2];
const evidencePath = process.argv[3];

if (!flowId || !evidencePath) {
  console.error('Usage: node run-bfm-matrix-sync-flow.cjs <flow_id> <evidence-json>');
  process.exit(1);
}

const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, evidencePath), 'utf8'));
if (evidence.TT_BFM_PROVIDER_FLOW !== 'PASS' && evidence.TT_BFM_GUIDE_FLOW !== 'PASS' && evidence.TT_BFM_ACQUISITION_FLOW !== 'PASS') {
  const key = Object.keys(evidence).find((k) => k.startsWith('TT_BFM_'));
  if (!key || evidence[key] !== 'PASS') {
    console.error('Evidence not PASS — refusing matrix sync');
    process.exit(1);
  }
}

let yaml = fs.readFileSync(MATRIX, 'utf8');
const today = new Date().toISOString().slice(0, 10);

for (const { step_id, verdict } of evidence.steps) {
  if (verdict !== 'PASS') continue;
  const note = `BFM-${flowId} · ${step_id} · human 5-layer PASS · E: step3/bfm/steps/${flowId}-${step_id}-LATEST.json`;
  const re = new RegExp(
    `(\\s+- id: ${flowId}[\\s\\S]*?- \\{ id: ${step_id}, label: [^,]+, verdict: )pending`,
    'm',
  );
  if (!re.test(yaml)) {
    console.warn(`warn: could not find pending step ${flowId}.${step_id}`);
    continue;
  }
  yaml = yaml.replace(re, `$1pass, note: "${note.replace(/"/g, '\\"')}"`);
  // simpler replace if note field missing - use line-by-line
}

// Line-by-line reliable sync
const lines = fs.readFileSync(MATRIX, 'utf8').split(/\r?\n/);
let inFlow = false;
let flowStart = -1;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^  - id: (\w+)/);
  if (m) {
    inFlow = m[1] === flowId;
    if (inFlow) flowStart = i;
  }
  if (!inFlow) continue;
  for (const { step_id, verdict } of evidence.steps) {
    if (verdict !== 'PASS') continue;
    const sm = lines[i].match(new RegExp(`^      - \\{ id: ${step_id}, label:`));
    if (sm) {
      const note = `BFM-${flowId} · ${step_id} · human 5-layer PASS · E: step3/bfm/steps/${flowId}-${step_id}-LATEST.json`;
      lines[i] = `      - { id: ${step_id}, label: ${lines[i].match(/label: ([^,]+)/)?.[1] || step_id}, verdict: pass, note: "${note}" }`;
    }
  }
  if (inFlow && lines[i].match(/^  - id:/) && i > flowStart) break;
}

// flow verdict
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === `- id: ${flowId}`) {
    for (let j = i + 1; j < lines.length && j < i + 6; j++) {
      if (lines[j].includes('verdict: not_started') || lines[j].includes('verdict: in_progress')) {
        lines[j] = lines[j].replace(/verdict: (not_started|in_progress|fail)/, 'verdict: pass');
      }
    }
    break;
  }
}

yaml = lines.join('\n');
yaml = yaml.replace(/^version: \d+/m, `version: ${parseInt(yaml.match(/^version: (\d+)/m)?.[1] || '2', 10) + 1}`);
yaml = yaml.replace(/^effective_utc: "[^"]+"/m, `effective_utc: "${today}"`);

fs.writeFileSync(MATRIX, yaml.endsWith('\n') ? yaml : yaml + '\n');
console.log(`synced BFM flow ${flowId} from ${evidencePath}`);
