#!/usr/bin/env node
/**
 * Write TTG Cert #10–#12 signoff JSON and refresh cert execution index.
 *
 *   node scripts/dev/record-cert-signoff.cjs \
 *     --out evidence/GO_ttg_cert/<stamp>/phase-b/emergency-pause/INCIDENT-TABLETOP-SIGNOFF.json \
 *     --cert 10 --signer "Owner Name" \
 *     --verdict TT_GOVERNANCE_CERT_10_EMERGENCY_PAUSE_PASS
 *
 * Cert #8–#9 use dedicated record-cert*.py/sh wrappers; this script serves #10–#12 finalize.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');

const CERT_META = {
  10: {
    acceptance_id: 'TT_GOVERNANCE_CERT_10_EMERGENCY_PAUSE',
    signoff_kind: 'DR-SIGNOFF',
    target_tier: 'DR_DONE',
    mtm_ids: ['CHK-DR-10', 'CHK-CORE-18', 'CHK-OPS-07'],
    default_verdict: 'TT_GOVERNANCE_CERT_10_EMERGENCY_PAUSE_PASS',
    honest_boundary:
      'Emergency pause drill — on-chain pause evidence + tabletop signoff; Phase B only',
  },
  11: {
    acceptance_id: 'TT_GOVERNANCE_CERT_11_EMERGENCY_UNPAUSE',
    signoff_kind: 'DR-SIGNOFF',
    target_tier: 'DR_DONE',
    mtm_ids: [
      'CHK-DR-01',
      'CHK-DR-02',
      'CHK-DR-03',
      'CHK-DR-04',
      'CHK-DR-05',
      'CHK-DR-06',
      'CHK-DR-07',
      'CHK-DR-08',
      'CHK-DR-09',
      'CHK-CORE-27',
      'CHK-CORE-28',
      'CHK-CORE-29',
      'CHK-UP-01',
      'CHK-UP-04',
      'CHK-DB-08',
    ],
    default_verdict: 'TT_GOVERNANCE_CERT_11_EMERGENCY_UNPAUSE_PASS',
    honest_boundary: 'DR drill — recovery / unpause evidence; Phase B only',
  },
  12: {
    acceptance_id: 'TT_GOVERNANCE_CERT_12_DR_REPLAY',
    signoff_kind: 'OPS-SIGNOFF',
    target_tier: 'OPS_DONE',
    mtm_ids: [
      'CHK-OPS-01',
      'CHK-OPS-04',
      'CHK-OPS-05',
      'CHK-OPS-06',
      'CHK-OPS-08',
      'CHK-OPS-09',
      'CHK-OPS-10',
      'CHK-CORE-30',
      'CHK-ID-08',
      'CHK-ID-11',
      'CHK-ID-12',
      'CHK-UP-05',
    ],
    default_verdict: 'TT_GOVERNANCE_CERT_12_DR_REPLAY_PASS',
    honest_boundary: 'GORP / indexer replay closure — Phase B terminal cert',
  },
};

function parseArgs(argv) {
  const out = {
    out: '',
    cert: 0,
    signer: '',
    verdict: '',
    skipRecordingCheck: false,
    refreshIndex: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') out.out = argv[++i];
    else if (a === '--cert') out.cert = Number(argv[++i]);
    else if (a === '--signer') out.signer = argv[++i];
    else if (a === '--verdict') out.verdict = argv[++i];
    else if (a === '--skip-recording-check') out.skipRecordingCheck = true;
    else if (a === '--no-refresh-index') out.refreshIndex = false;
    else {
      console.error(`record-cert-signoff: unknown arg ${a}`);
      process.exit(2);
    }
  }
  return out;
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();
}

function inferStamp(outRel) {
  const m = outRel.replace(/\\/g, '/').match(/evidence\/GO_ttg_cert\/([^/]+)\//);
  return m ? m[1] : '';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const meta = CERT_META[args.cert];
  if (!meta) {
    console.error('record-cert-signoff: --cert must be 10, 11, or 12');
    process.exit(2);
  }
  if (!args.out) {
    console.error('record-cert-signoff: --out required');
    process.exit(2);
  }
  if (!args.signer) {
    console.error('record-cert-signoff: --signer required');
    process.exit(2);
  }

  const outPath = path.isAbsolute(args.out) ? args.out : path.join(ROOT, args.out);
  const outDir = path.dirname(outPath);
  const outRel = path.relative(ROOT, outPath).replace(/\\/g, '/');
  const stamp = inferStamp(outRel);
  if (!stamp) {
    console.error(`record-cert-signoff: cannot infer stamp from --out (${outRel})`);
    process.exit(2);
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.join(outDir, 'recordings'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'screenshots'), { recursive: true });

  const recordings = listFiles(path.join(outDir, 'recordings'));
  const screenshots = listFiles(path.join(outDir, 'screenshots'));
  if (!args.skipRecordingCheck && recordings.length < 1) {
    console.error(
      'record-cert-signoff: FAIL — no recordings (use --skip-recording-check for chain-only finalize)',
    );
    process.exit(3);
  }

  const machineChecksPath = path.join(outDir, 'machine-checks', `CERT${args.cert}-MACHINE-CHECKS.json`);
  let machineChecks = null;
  if (fs.existsSync(machineChecksPath)) {
    try {
      machineChecks = JSON.parse(fs.readFileSync(machineChecksPath, 'utf8'));
    } catch {
      machineChecks = null;
    }
  }

  const verdictPass = args.verdict || meta.default_verdict;
  const doc = {
    acceptance_id: meta.acceptance_id,
    signoff_kind: meta.signoff_kind,
    cert: args.cert,
    stamp_utc: stamp,
    signer: args.signer,
    signed_at_utc: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    baseline_ssot: 'docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md',
    gorp_ssot: 'docs/runbook/GOVERNANCE-OPERATIONS-RECOVERY-PLAN-V1.md',
    mtm_ssot: 'registry/ttg-governance-cert-gates.v1.yaml',
    mtm_ids: meta.mtm_ids,
    target_tier: meta.target_tier,
    recordings,
    screenshots,
    machine_checks_verdict: machineChecks?.verdict ?? null,
    machine_checks_path: fs.existsSync(machineChecksPath)
      ? path.relative(ROOT, machineChecksPath).replace(/\\/g, '/')
      : null,
    verdict: 'PASS',
    verdict_machine: verdictPass,
    honest_boundary: meta.honest_boundary,
    evidence_path: outRel,
  };

  fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`TT_GOVERNANCE_CERT_${String(args.cert).padStart(2, '0')}_SIGNOFF: PASS → ${outRel}`);

  if (args.refreshIndex) {
    const idx = spawnSync(process.execPath, [path.join(__dirname, 'gen-ttg-cert-production-evidence-index.cjs')], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    if (idx.status !== 0) {
      console.error((idx.stderr || idx.stdout || '').trim());
      process.exit(idx.status || 1);
    }
    console.log((idx.stdout || '').trim());
  }
}

main();
