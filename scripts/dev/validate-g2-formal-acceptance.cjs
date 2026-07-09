#!/usr/bin/env node
/**
 * G2 Formal Acceptance — release process sign-off (not platform development).
 *
 *   node scripts/dev/validate-g2-formal-acceptance.cjs --evidence-dir evidence/GO_production_readiness/wave-2-g2/<stamp>
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

const G2_BLOCKERS = ['PRM-SEC-B001', 'PRM-SEC-B002', 'PRM-PER-B001', 'PRM-MON-B001'];

const FORMAL_CHECKLIST = [
  { id: 'PRM-SEC-B001', wave: '2.1', label: 'Prod secrets / internal API hygiene' },
  { id: 'PRM-SEC-B002', wave: '2.1', label: 'Production Runtime Identity' },
  { id: 'PRM-PER-B001', wave: '2.2', label: 'Prod performance / SLO evidence' },
  { id: 'PRM-MON-B001', wave: '2.3', label: 'Prod synthetic monitoring / on-call' },
];

function parseArgs() {
  const args = { evidenceDir: '', verificationSignoff: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
    if (process.argv[i] === '--verification-signoff') args.verificationSignoff = process.argv[++i];
  }
  return args;
}

function machineKey(yaml, key) {
  const m = yaml.match(new RegExp(`${key}: ([A-Z_0-9]+)`));
  return m ? m[1] : null;
}

function parseG2OpenBlockers(yaml) {
  const open = [];
  const parts = yaml.split(/\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const id = `PRM-${sec.split('\n')[0].replace(/:$/, '')}`;
    const block = `  - id: PRM-${sec}`;
    if (!block.includes('go_gate: G2')) continue;
    if (!block.includes('classification: BLOCKER')) continue;
    if (block.includes('status: OPEN')) open.push(id);
  }
  return open;
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  const { evidenceDir, verificationSignoff } = parseArgs();
  if (!evidenceDir) {
    console.error('Usage: --evidence-dir evidence/GO_production_readiness/wave-2-g2/<stamp>');
    process.exit(1);
  }

  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const evidRel = path.relative(ROOT, base).replace(/\\/g, '/');
  const stamp = path.basename(base);
  const yaml = fs.readFileSync(REG_MATRIX, 'utf8');

  const preflight = {
    TT_PRODUCTION_READINESS_G1_GATE: machineKey(yaml, 'TT_PRODUCTION_READINESS_G1_GATE'),
    TT_G2_REALITY_VERIFICATION: machineKey(yaml, 'TT_G2_REALITY_VERIFICATION'),
    TT_EVIDENCE_INTEGRITY_AUDIT: machineKey(yaml, 'TT_EVIDENCE_INTEGRITY_AUDIT'),
    TT_WAVE2_FORMAL_ACCEPTANCE: machineKey(yaml, 'TT_WAVE2_FORMAL_ACCEPTANCE'),
    TT_PRODUCTION_GO: machineKey(yaml, 'TT_PRODUCTION_GO'),
  };

  const preflightPass =
    preflight.TT_PRODUCTION_READINESS_G1_GATE === 'PASS' &&
    preflight.TT_G2_REALITY_VERIFICATION === 'COMPLETE' &&
    preflight.TT_EVIDENCE_INTEGRITY_AUDIT === 'PASS' &&
    (preflight.TT_WAVE2_FORMAL_ACCEPTANCE === 'READY' || preflight.TT_WAVE2_FORMAL_ACCEPTANCE === 'COMPLETE');

  const integrityDir = path.join(ROOT, 'evidence/GO_production_readiness/evidence-integrity');
  let integrityAudit = readJson(path.join(base, 'evidence-integrity-audit.json'));
  if (!integrityAudit && fs.existsSync(integrityDir)) {
    const stamps = fs.readdirSync(integrityDir).filter((s) => s !== 'latest').sort();
    if (stamps.length) {
      integrityAudit = readJson(path.join(integrityDir, stamps[stamps.length - 1], 'evidence-integrity-audit.json'));
    }
  }

  const verifyPath =
    verificationSignoff ||
    (() => {
      const d = path.join(ROOT, 'evidence/GO_production_readiness/g2-reality-verification');
      if (!fs.existsSync(d)) return null;
      const stamps = fs
        .readdirSync(d)
        .filter((s) => fs.existsSync(path.join(d, s, 'g2-reality-verification-signoff.json')))
        .sort();
      return stamps.length
        ? `evidence/GO_production_readiness/g2-reality-verification/${stamps[stamps.length - 1]}/g2-reality-verification-signoff.json`
        : null;
    })();

  const verification = verifyPath ? readJson(path.join(ROOT, verifyPath)) : null;
  const openG2 = parseG2OpenBlockers(yaml);

  const checklist = FORMAL_CHECKLIST.map((item) => {
    const dir = path.join(base, item.id.toLowerCase().replace('prm-', '').replace(/-/g, '-'));
    const altDirs = {
      'PRM-SEC-B001': path.join(base, 'security-b001'),
      'PRM-SEC-B002': path.join(base, 'security-b002'),
      'PRM-PER-B001': path.join(base, 'performance-b001'),
      'PRM-MON-B001': path.join(base, 'monitoring-b001'),
    };
    const evDir = altDirs[item.id];
    const exists = fs.existsSync(evDir);
    const verified = verification?.findings?.find((f) => f.id === item.id)?.verdict === 'VERIFIED';
    return {
      ...item,
      evidence_dir: exists ? path.relative(ROOT, evDir).replace(/\\/g, '/') : null,
      evidence_present: exists,
      verification_verdict: verification?.findings?.find((f) => f.id === item.id)?.verdict || null,
      pass: exists && verified,
    };
  });

  const checklistPass = checklist.every((c) => c.pass);
  const integrityPass = integrityAudit?.pass === true || preflight.TT_EVIDENCE_INTEGRITY_AUDIT === 'PASS';
  const pass = preflightPass && openG2.length === 0 && checklistPass && integrityPass;

  const signoff = {
    review_id: 'G2-FORMAL-ACCEPTANCE',
    wave: '2',
    stamp,
    formal_acceptance: pass,
    release_process: true,
    platform_changes: false,
    owner: 'Sebastian Ward',
    attestation:
      'G2 Formal Acceptance — checklist · evidence · sign-off on prod hardening blockers. Not Production GO.',
    preflight,
    verification_baseline: verifyPath,
    integrity_audit: integrityAudit
      ? {
          stamp: integrityAudit.stamp,
          verdict: integrityAudit.verdict,
          path: `evidence/GO_production_readiness/evidence-integrity/${integrityAudit.stamp || ''}`,
        }
      : null,
    checklist,
    open_g2_blockers: openG2,
    machine_keys: {
      TT_WAVE2_FORMAL_ACCEPTANCE: pass ? 'COMPLETE' : 'READY',
      TT_PRODUCTION_READINESS_G2_GATE: 'IN_PROGRESS',
      TT_PRODUCTION_GO: 'NO_GO',
    },
    honest_boundary:
      'Formal Acceptance COMPLETE enables G2 Gate validate · G2 PASS ≠ Production GO · G3 cutover remains',
    verdict: pass ? 'FORMAL_COMPLETE' : 'FORMAL_INCOMPLETE',
  };

  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'g2-formal-acceptance-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);

  console.log('G2 Formal Acceptance');
  console.log('─'.repeat(60));
  console.log(`Preflight: ${preflightPass ? 'PASS' : 'FAIL'}`);
  for (const [k, v] of Object.entries(preflight)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log(`Open G2 blockers: ${openG2.length}`);
  for (const c of checklist) {
    console.log(`  ${c.pass ? 'PASS' : 'FAIL'} ${c.id} (${c.wave}) evidence=${c.evidence_present}`);
  }
  console.log(`TT_WAVE2_FORMAL_ACCEPTANCE: ${signoff.machine_keys.TT_WAVE2_FORMAL_ACCEPTANCE}`);
  console.log(`Evidence: ${evidRel}/g2-formal-acceptance-signoff.json`);

  process.exit(pass ? 0 : 1);
}

main();
