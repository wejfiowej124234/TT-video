#!/usr/bin/env node
/**
 * Index TTG Cert #1-12 signoff evidence (recursive under evidence/GO_ttg_cert).
 *
 *   node scripts/dev/gen-ttg-cert-production-evidence-index.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const CERT_ROOT = path.join(ROOT, 'evidence/GO_ttg_cert');
const REGISTRY = path.join(ROOT, 'registry/ttg-governance-cert-gates.v1.yaml');
const OUT = path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/TTG-CERT-EVIDENCE-INDEX-LATEST.json');

const EXPECTED_SIGNOFFS = {
  1: 'HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json',
  2: 'MULTI-IDENTITY-WALKTHROUGH-SIGNOFF.json',
  3: 'ADMIN-WALKTHROUGH-SIGNOFF.json',
  4: 'SAFE-WALKTHROUGH-SIGNOFF.json',
  5: 'FINANCE-WALKTHROUGH-SIGNOFF.json',
  6: 'PHASE-B-UNPAUSE-SIGNOFF.json',
  7: 'PHASE-B-EXECUTE-SIGNOFF.json',
  8: 'PHASE-B-TREASURY-SPEND-SIGNOFF.json',
  9: 'PHASE-B-UNSTAKE-SIGNOFF.json',
  10: 'INCIDENT-TABLETOP-SIGNOFF.json',
  11: 'DR-DRILL-SIGNOFF.json',
  12: 'GORP-SIGNOFF.json',
};

function walkSignoffs(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSignoffs(p, acc);
    else if (ent.name.endsWith('-SIGNOFF.json') || ent.name.endsWith('-SIGNOFF-LINK.json')) {
      acc.push(path.relative(CERT_ROOT, p).replace(/\\/g, '/'));
    }
  }
  return acc;
}

function main() {
  const all = walkSignoffs(CERT_ROOT);
  const certs = [];
  for (const [id, file] of Object.entries(EXPECTED_SIGNOFFS)) {
    const hit = all.find((p) => p.endsWith(file));
    certs.push({ cert: Number(id), expected_file: file, found: !!hit, path: hit || null });
  }
  const signed = certs.filter((c) => c.found).length;
  const manifest = {
    schema: 'traveltrust.ttg_cert_production_evidence_index.v1',
    recorded_utc: new Date().toISOString(),
    cert_root: 'evidence/GO_ttg_cert',
    registry: 'registry/ttg-governance-cert-gates.v1.yaml',
    signed_count: signed,
    total_certs: 12,
    verdict: signed === 12 ? 'TTG_CERT_EVIDENCE_COMPLETE' : signed >= 7 ? 'TTG_CERT_EVIDENCE_PARTIAL' : 'TTG_CERT_EVIDENCE_INSUFFICIENT',
    certs,
    all_signoff_paths: all,
    note: 'Phase ② Sepolia cert session 20260616T100918Z has 7/12 signoffs; certs 7-12 require execution on chain-enabled staging',
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);

  const certIndex = {
    schema: 'traveltrust.ttg_cert_execution_index.v1',
    recorded_utc: manifest.recorded_utc,
    cert_root: manifest.cert_root,
    signed_count: signed,
    total_certs: 12,
    active_cert: signed < 12 ? signed + 1 : null,
    verdict: manifest.verdict,
    certs: manifest.certs,
  };
  const certIndexPath = path.join(CERT_ROOT, 'CERT-EXECUTION-INDEX-LATEST.json');
  fs.writeFileSync(certIndexPath, `${JSON.stringify(certIndex, null, 2)}\n`);

  const cert8 = manifest.certs.find((c) => c.cert === 8);
  const cert8QueuedPath = path.join(CERT_ROOT, 'cert-08-queued.json');
  if (signed < 8 && !cert8?.found) {
    const hatQueue = path.join(ROOT, 'evidence/GO_hat_r1_sepolia');
    let queued = false;
    let etaUnix = null;
    try {
      for (const ent of fs.readdirSync(hatQueue, { withFileTypes: true })) {
        if (!ent.isDirectory()) continue;
        const etaFile = path.join(hatQueue, ent.name, 'step-09-treasury-queue/timelock-eta.json');
        const execFile = path.join(hatQueue, ent.name, 'step-10-treasury-execute/tx-execute.json');
        if (fs.existsSync(etaFile) && !fs.existsSync(execFile)) {
          queued = true;
          const eta = JSON.parse(fs.readFileSync(etaFile, 'utf8'));
          etaUnix = eta.treasury_execute_earliest_unix ?? eta.execute_earliest_unix ?? null;
          break;
        }
      }
    } catch {
      queued = false;
    }
    if (queued) {
      fs.writeFileSync(
        cert8QueuedPath,
        `${JSON.stringify({ schema: 'traveltrust.cert8_queued.v1', recorded_utc: manifest.recorded_utc, cert: 8, timelock_eta_unix: etaUnix, note: 'Treasury spend queued — waiting 2nd Timelock execute' }, null, 2)}\n`,
      );
    } else if (fs.existsSync(cert8QueuedPath)) {
      fs.unlinkSync(cert8QueuedPath);
    }
  } else if (fs.existsSync(cert8QueuedPath)) {
    fs.unlinkSync(cert8QueuedPath);
  }

  console.log(JSON.stringify({ verdict: manifest.verdict, signed: `${signed}/12` }, null, 2));
}

main();
