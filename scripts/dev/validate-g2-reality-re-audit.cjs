#!/usr/bin/env node
/**
 * G2 Reality Re-Audit — independent re-probe after Reality Fix; must all VERIFIED + no drift.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const G2_BLOCKERS = ['PRM-SEC-B001', 'PRM-SEC-B002', 'PRM-PER-B001', 'PRM-MON-B001'];

function parseArgs() {
  const args = { fixDir: '', evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--fix-dir') args.fixDir = process.argv[++i];
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

function gapBlock(reg, id) {
  const marker = `  - id: ${id}`;
  const start = reg.indexOf(marker);
  if (start < 0) return '';
  const tail = reg.slice(start + marker.length);
  const nextRel = tail.search(/\r?\n  - id: PRM-/);
  const end = nextRel >= 0 ? start + marker.length + nextRel : reg.length;
  return reg.slice(start, end);
}

function main() {
  const { fixDir, evidenceDir } = parseArgs();
  if (!fixDir || !evidenceDir) {
    console.error(
      'Usage: --fix-dir evidence/.../g2-reality-fix/<stamp> --evidence-dir evidence/.../g2-reality-re-audit/<stamp>'
    );
    process.exit(1);
  }

  const fixBase = path.isAbsolute(fixDir) ? fixDir : path.join(ROOT, fixDir);
  const evidBase = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const liveDir = path.join(evidBase, 'live-probes');
  fs.mkdirSync(liveDir, { recursive: true });

  execSync(`bash scripts/dev/run-g2-reality-fix-probes.sh "${liveDir.replace(/\\/g, '/')}"`, {
    cwd: ROOT,
    stdio: 'inherit',
  });

  const liveRel = path.relative(ROOT, liveDir).replace(/\\/g, '/');
  try {
    execSync(`node scripts/dev/validate-g2-reality-fix.cjs --evidence-dir "${liveRel}"`, {
      cwd: ROOT,
      stdio: 'pipe',
    });
  } catch {
    /* expected when not all VERIFIED */
  }

  const liveSignoff = JSON.parse(
    fs.readFileSync(path.join(liveDir, 'g2-reality-fix-signoff.json'), 'utf8')
  );
  const fixSignoff = JSON.parse(fs.readFileSync(path.join(fixBase, 'g2-reality-fix-signoff.json'), 'utf8'));
  const fixRel = path.relative(ROOT, path.join(fixBase, 'g2-reality-fix-signoff.json')).replace(/\\/g, '/');

  const reg = fs.readFileSync(path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml'), 'utf8');
  const drift = [];
  for (const id of G2_BLOCKERS) {
    const block = gapBlock(reg, id);
    const status = (block.match(/    status: ([A-Z_]+)/) || [])[1];
    const hasClosedEvidence = /closed_evidence:\s*\S/.test(block);
    const live = liveSignoff.findings.find((f) => f.id === id);
    if (status === 'CLOSED' && !hasClosedEvidence) drift.push({ id, issue: 'CLOSED without closed_evidence' });
    if (live?.verdict === 'VERIFIED' && status === 'OPEN') drift.push({ id, issue: 'VERIFIED live but Matrix OPEN' });
    if (live?.verdict !== 'VERIFIED' && status === 'CLOSED') drift.push({ id, issue: 'Matrix CLOSED but live not VERIFIED' });
  }

  const allVerified = liveSignoff.findings.every((f) => f.verdict === 'VERIFIED');
  const pass = allVerified && drift.length === 0;

  const signoff = {
    review_id: 'G2-REALITY-RE-AUDIT',
    stamp: path.basename(evidBase),
    fix_baseline: fixRel,
    machine_keys: {
      TT_G2_REALITY_RE_AUDIT: pass ? 'COMPLETE' : 'IN_PROGRESS',
      TT_G2_REALITY_FIX: fixSignoff.machine_keys?.TT_G2_REALITY_FIX || 'UNKNOWN',
      TT_PRODUCTION_READINESS_G2_GATE: 'IN_PROGRESS',
      TT_WAVE2_FORMAL_ACCEPTANCE: pass ? 'READY' : 'BLOCKED',
    },
    matrix_actions: {
      close: pass ? G2_BLOCKERS : [],
      verified: liveSignoff.findings.filter((f) => f.verdict === 'VERIFIED').map((f) => f.id),
    },
    live_findings: liveSignoff.findings,
    fix_findings: fixSignoff.findings,
    matrix_drift: drift,
    verdict: pass ? 'RE_AUDIT_PASS' : 'RE_AUDIT_INCOMPLETE',
    honest_boundary:
      'Re-Audit PASS enables Wave 2 Formal Acceptance · does not set G2 Gate PASS until formal signoff',
  };

  fs.writeFileSync(
    path.join(evidBase, 'g2-reality-re-audit-signoff.json'),
    `${JSON.stringify(signoff, null, 2)}\n`
  );

  console.log(`G2 Reality Re-Audit: ${signoff.verdict}`);
  console.log(`Drift items: ${drift.length}`);
  drift.forEach((d) => console.log(`  DRIFT ${d.id}: ${d.issue}`));
  console.log(`TT_WAVE2_FORMAL_ACCEPTANCE: ${signoff.machine_keys.TT_WAVE2_FORMAL_ACCEPTANCE}`);

  process.exit(pass ? 0 : 1);
}

main();
