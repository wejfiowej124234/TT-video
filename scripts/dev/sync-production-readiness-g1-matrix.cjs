#!/usr/bin/env node
/**
 * Sync G1 Master Matrix gaps from Manual UAT + staging persona + G1 PER evidence.
 *
 *   node scripts/dev/sync-production-readiness-g1-matrix.cjs --session-dir evidence/manual-uat/sessions/latest
 *   node scripts/dev/sync-production-readiness-g1-matrix.cjs --staging-summary evidence/.../staging-persona-matrix-summary.json
 *   node scripts/dev/sync-production-readiness-g1-matrix.cjs --per-signoff evidence/.../g1-per-signoff.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG_PATH = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

function parseArgs() {
  const args = { sessionDir: '', evidenceDir: '', stagingSummary: '', perSignoff: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--session-dir') args.sessionDir = process.argv[++i];
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
    if (process.argv[i] === '--staging-summary') args.stagingSummary = process.argv[++i];
    if (process.argv[i] === '--per-signoff') args.perSignoff = process.argv[++i];
  }
  return args;
}

function readSummary(sessionDir) {
  const p = path.join(ROOT, sessionDir, 'SUMMARY.json');
  if (!fs.existsSync(p)) throw new Error(`missing ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function countPersonaPass(items, persona) {
  const rows = items.filter((it) => it.persona === persona);
  const pass = rows.filter((it) => it.ui_status === 'PASS').length;
  return { pass, total: rows.length };
}

function closeGapInYaml(yaml, gapId, evidencePath) {
  const re = new RegExp(`(  - id: ${gapId}[\\s\\S]*?    status: )OPEN`, 'm');
  if (!re.test(yaml)) return yaml;
  const closedUtc = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  let out = yaml.replace(re, `$1CLOSED`);
  if (!out.includes(`  - id: ${gapId}`)) return out;
  const gapBlock = out.match(new RegExp(`  - id: ${gapId}[\\s\\S]*?(?=\\n  - id: PRM-|\\nforbidden_until)`, 'm'));
  if (gapBlock && !gapBlock[0].includes('closed_utc:')) {
    out = out.replace(
      new RegExp(`(  - id: ${gapId}\\n[\\s\\S]*?    status: CLOSED)`, 'm'),
      `$1\n    closed_utc: "${closedUtc}"`
    );
  }
  if (out.match(new RegExp(`(  - id: ${gapId}[\\s\\S]*?)    closed_evidence:`, 'm'))) {
    return out.replace(
      new RegExp(`(  - id: ${gapId}[\\s\\S]*?    closed_evidence: )[^\\n]+`, 'm'),
      `$1${evidencePath}`
    );
  }
  return out.replace(
    new RegExp(`(  - id: ${gapId}[\\s\\S]*?)(    closure: [^\\n]+)`, 'm'),
    `$1    closed_evidence: ${evidencePath}\n$2`
  );
}

function recomputeDomainBlocking(yaml, domainId) {
  let count = 0;
  const gapSections = yaml.split(/\n  - id: PRM-/);
  for (const sec of gapSections.slice(1)) {
    const block = '  - id: PRM-' + sec;
    if (!block.includes(`domain: ${domainId}`)) continue;
    if (!block.includes('classification: BLOCKER')) continue;
    if (!block.includes('go_gate: G1')) continue;
    if (block.includes('status: OPEN')) count++;
  }
  const domRe = new RegExp(`(  - id: ${domainId}\\n[\\s\\S]*?    blocking_count: )\\d+`, 'm');
  return yaml
    .replace(domRe, `$1${count}`)
    .replace(new RegExp(`(  - id: ${domainId}\\n[\\s\\S]*?    status: )YELLOW`, 'm'), count === 0 ? `$1GREEN` : `$1YELLOW`);
}

function recomputeG1Gate(yaml) {
  let openG1 = 0;
  const parts = yaml.split(/\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const block = '  - id: PRM-' + sec;
    if (!block.includes('go_gate: G1')) continue;
    if (!block.includes('classification: BLOCKER')) continue;
    if (block.includes('status: OPEN')) openG1++;
  }
  const status = openG1 === 0 ? 'PASS' : 'IN_PROGRESS';
  yaml = yaml.replace(/TT_PRODUCTION_READINESS_G1_GATE: \w+/, `TT_PRODUCTION_READINESS_G1_GATE: ${status}`);
  yaml = yaml.replace(/(  G1:[\s\S]*?    status: )\w+/, `$1${status}`);
  yaml = yaml.replace(/(    open_blockers: )\d+/, `$1${openG1}`);
  return yaml;
}

function main() {
  const { sessionDir, evidenceDir, stagingSummary, perSignoff } = parseArgs();
  if (!sessionDir && !stagingSummary && !perSignoff) {
    console.error('Usage: --session-dir ... [--staging-summary ...] [--per-signoff ...]');
    process.exit(1);
  }

  let yaml = fs.readFileSync(REG_PATH, 'utf8');
  const report = { sync: 'G1_MATRIX_SYNC', closed: [] };

  if (sessionDir) {
    const summary = readSummary(sessionDir);
    const items = summary.checklist_items || [];
    const mt = summary.manual_test || {};
    const allPass = mt.pass === mt.total && mt.total === 27 && (mt.fail || 0) === 0;
    const evidRel = sessionDir.replace(/\\/g, '/');
    report.session = evidRel;
    report.manual_test = mt;
    report.all_pass = allPass;
    report.persona = Object.fromEntries(
      ['C1', 'C2', 'C3', 'C4', 'E1', 'E2'].map((p) => [p, countPersonaPass(items, p)])
    );

    if (allPass) {
      yaml = closeGapInYaml(yaml, 'PRM-UAT-B001', `${evidRel}/SUMMARY.json`);
      yaml = closeGapInYaml(yaml, 'PRM-MVAL-B001', `${evidRel}/SUMMARY.json`);
      report.closed.push('PRM-UAT-B001', 'PRM-MVAL-B001');
    }

    const c1 = countPersonaPass(items, 'C1');
    if (c1.pass === c1.total && c1.total > 0) {
      yaml = closeGapInYaml(yaml, 'PRM-UAT-B002', `${evidRel}/SUMMARY.json`);
      report.closed.push('PRM-UAT-B002');
    }

    const c2 = countPersonaPass(items, 'C2');
    const c4 = countPersonaPass(items, 'C4');
    if (c2.pass === c2.total && c4.pass === c4.total && c2.total > 0 && c4.total > 0) {
      yaml = closeGapInYaml(yaml, 'PRM-UAT-B003', `${evidRel}/SUMMARY.json`);
      report.closed.push('PRM-UAT-B003');
    }

    // PRM-UAT-B004 = ② staging persona matrix only — never close from local session
    if ((mt.fail || 0) === 0 && allPass) {
      yaml = closeGapInYaml(yaml, 'PRM-UAT-B005', `${evidRel}/SUMMARY.json`);
      yaml = closeGapInYaml(yaml, 'PRM-MVAL-B002', `${evidRel}/SUMMARY.json`);
      report.closed.push('PRM-UAT-B005', 'PRM-MVAL-B002');
    }
  }

  if (stagingSummary) {
    const sp = path.isAbsolute(stagingSummary) ? stagingSummary : path.join(ROOT, stagingSummary);
    const staging = JSON.parse(fs.readFileSync(sp, 'utf8'));
    report.staging = staging;
    if (staging.all_pass) {
      const evidRel = path.relative(ROOT, sp).replace(/\\/g, '/');
      yaml = closeGapInYaml(yaml, 'PRM-UAT-B004', evidRel);
      report.closed.push('PRM-UAT-B004');
    }
  }

  if (perSignoff) {
    const pp = path.isAbsolute(perSignoff) ? perSignoff : path.join(ROOT, perSignoff);
    const per = JSON.parse(fs.readFileSync(pp, 'utf8'));
    report.g1_per = per;
    if (per.status === 'PASS' && per.verdicts?.g1_per === 'PASS') {
      const evidRel = path.relative(ROOT, pp).replace(/\\/g, '/');
      yaml = closeGapInYaml(yaml, 'PRM-MVAL-B003', evidRel);
      report.closed.push('PRM-MVAL-B003');
    }
  }

  yaml = recomputeDomainBlocking(yaml, 'browser_uat');
  yaml = recomputeDomainBlocking(yaml, 'manual_validation');
  yaml = recomputeG1Gate(yaml);
  yaml = yaml.replace(/updated_utc: "[^"]+"/, `updated_utc: "${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}"`);

  fs.writeFileSync(REG_PATH, yaml);

  if (evidenceDir) {
    fs.mkdirSync(path.join(ROOT, evidenceDir), { recursive: true });
    fs.writeFileSync(path.join(ROOT, evidenceDir, 'matrix-sync.json'), JSON.stringify(report, null, 2) + '\n');
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
