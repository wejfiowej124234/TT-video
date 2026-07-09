#!/usr/bin/env node
/**
 * Validate G1 Gate — all go_gate:G1 OPEN BLOCKER gaps must be 0
 *
 *   node scripts/dev/validate-production-readiness-g1-gate.cjs --evidence-dir evidence/GO_production_readiness/wave-1-1-g1/<stamp>
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG_PATH = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

function parseArgs() {
  const args = { evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

function parseG1OpenBlockers(text) {
  const open = [];
  const parts = text.split(/\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const id = 'PRM-' + sec.split('\n')[0].replace(/:$/, '');
    const block = '  - id: PRM-' + sec;
    if (!block.includes('go_gate: G1')) continue;
    if (!block.includes('classification: BLOCKER')) continue;
    if (block.includes('status: OPEN')) open.push(id);
  }
  return open;
}

function main() {
  const { evidenceDir } = parseArgs();
  const reg = fs.readFileSync(REG_PATH, 'utf8');
  const open = parseG1OpenBlockers(reg);
  const pass = open.length === 0;
  const g1Key = reg.match(/TT_PRODUCTION_READINESS_G1_GATE: (\w+)/)?.[1] || 'UNKNOWN';

  const signoff = {
    wave: '1.1',
    go_gate: 'G1',
    stamp: process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z'),
    machine_keys: {
      TT_PRODUCTION_READINESS_G1_GATE: pass ? 'PASS' : g1Key,
      TT_PRODUCTION_GO: 'NO_GO',
    },
    open_g1_blockers: open,
    verdict: pass ? 'G1_PASS' : 'G1_IN_PROGRESS',
    domains: ['browser_uat', 'manual_validation', 'content_readiness'],
    honest_boundary:
      'G1 PASS = Matrix go_gate:G1 BLOCKER=0 · does not imply Production GO · PER may remain separate',
  };

  if (evidenceDir) {
    const dir = path.join(ROOT, evidenceDir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'g1-gate-signoff.json'), JSON.stringify(signoff, null, 2) + '\n');
  }

  console.log(`G1 Gate: ${signoff.verdict} · open_blockers=${open.length}`);
  if (open.length) {
    console.log('Open:', open.join(', '));
    process.exit(1);
  }
  console.log('TT_PRODUCTION_READINESS_G1_GATE: PASS');
}

main();
