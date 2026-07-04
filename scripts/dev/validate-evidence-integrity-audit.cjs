#!/usr/bin/env node
/**
 * Evidence Integrity Audit — Matrix ↔ Evidence ↔ Sign-off (pre-Formal).
 *
 *   node scripts/dev/validate-evidence-integrity-audit.cjs --gate G2
 *   node scripts/dev/validate-evidence-integrity-audit.cjs --gate G2 --evidence-dir evidence/GO_production_readiness/evidence-integrity/<stamp>
 */
const path = require('path');
const {
  runEvidenceIntegrityAudit,
  writeEvidenceIntegrityEvidence,
} = require('./lib/evidence-integrity-audit.cjs');

function parseArgs() {
  const args = { gate: 'G2', evidenceDir: '', signoff: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--gate') args.gate = process.argv[++i];
    else if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
    else if (process.argv[i] === '--verification-signoff') args.signoff = process.argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs();
  const stamp = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
  const outDir =
    args.evidenceDir ||
    `evidence/GO_production_readiness/evidence-integrity/${stamp}`;

  const summary = runEvidenceIntegrityAudit({
    gate: args.gate,
    stamp,
    verificationSignoffRel: args.signoff
      ? args.signoff.replace(/\/g2-reality-verification-signoff\.json$/, '/g2-reality-verification-signoff.json')
      : undefined,
  });

  if (args.signoff && !summary.verification_signoff) {
    summary.verification_signoff = args.signoff.replace(/\/g2-reality-verification-signoff\.json$/, '');
  }

  writeEvidenceIntegrityEvidence(outDir, summary);

  console.log(`Evidence Integrity Audit (${args.gate})`);
  console.log('─'.repeat(60));
  for (const f of summary.findings.filter((x) => x.severity !== 'INFO')) {
    console.log(`${f.severity.padEnd(5)} ${f.id} — ${f.kind}: ${f.detail}`);
  }
  for (const f of summary.findings.filter((x) => x.severity === 'INFO')) {
    console.log(`INFO  ${f.detail}`);
  }
  console.log('─'.repeat(60));
  console.log(`TT_EVIDENCE_INTEGRITY_AUDIT: ${summary.verdict}`);
  console.log(`Evidence: ${outDir}/evidence-integrity-audit.json`);
  console.log(`blocks_formal: ${summary.blocks_formal}`);

  process.exit(summary.pass ? 0 : 1);
}

main();
