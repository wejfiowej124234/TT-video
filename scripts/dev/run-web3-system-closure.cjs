#!/usr/bin/env node
/**
 * WEB3-SYSTEM-CLOSURE — re-run Web3 System deep audit + record closure manifest.
 *
 *   node scripts/dev/run-web3-system-closure.cjs
 *
 * CLOSURE_PASS only when blockers_p0=0 AND blockers_p1=0 (honest boundary).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString();
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit');
const RUN_DIR = path.join(EVID_ROOT, `closure-${STAMP.replace(/[:.]/g, '-').slice(0, 19)}`);

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  mkdirp(RUN_DIR);

  // --- RBAC D3 closure (permission SSOT + ADM-U01 boundary) ---
  spawnSync(process.execPath, [path.join(__dirname, 'run-rbac-d3-closure.cjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  const auditRun = spawnSync(process.execPath, [path.join(__dirname, 'run-web3-system-deep-audit.cjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  fs.writeFileSync(path.join(RUN_DIR, 'audit-rerun.log'), `${auditRun.stdout || ''}${auditRun.stderr || ''}`, 'utf8');

  const masterMapRun = spawnSync(process.execPath, [path.join(__dirname, 'check-web3-system-master-map-parity.cjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  fs.writeFileSync(
    path.join(RUN_DIR, 'master-map-parity.log'),
    `${masterMapRun.stdout || ''}${masterMapRun.stderr || ''}`,
    'utf8',
  );
  const masterMapParity = readJson(path.join(EVID_ROOT, 'WEB3-MASTER-MAP-PARITY-LATEST.json')) || {};

  const postAudit = readJson(path.join(EVID_ROOT, 'WEB3-SYSTEM-DEEP-AUDIT-LATEST.json')) || {};
  const p0 = postAudit.summary?.blockers_p0 ?? 99;
  const p1 = postAudit.summary?.blockers_p1 ?? 99;
  const eligible = p0 === 0 && p1 === 0;

  const closureItems = [
    {
      id: 'STEP-0-MASTER-MAP-PARITY',
      title: 'Master Map → Registry → Contracts → /meta → Evidence parity',
      paths: [
        'registry/web3-system-master-map.v1.yaml',
        'docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md',
        'scripts/dev/check-web3-system-master-map-parity.cjs',
      ],
      status: masterMapParity.verdict === 'WEB3_MASTER_MAP_PARITY_PASS' ? 'CLOSED' : 'OPEN',
      evidence: 'evidence/GO_production_readiness/web3-system-audit/WEB3-MASTER-MAP-PARITY-LATEST.json',
      summary: masterMapParity.summary || null,
      note: 'Informational for closure eligibility · P0/P1 blockers still govern WEB3_SYSTEM_CLOSURE_PASS',
    },
    {
      id: 'STEP-1-GATE-LAYERING',
      title: 'Split TT_WEB3_PAYMENT_PRODUCTION_READY vs TT_WEB3_SYSTEM_PRODUCTION_READY',
      paths: [
        'registry/web3-gate-layering.v1.yaml',
        'registry/web3-system-production-gate.v1.yaml',
        'docs/runbook/WEB3-GATE-LAYERING.md',
        'registry/production-readiness-master-matrix.v1.yaml',
        'registry/production-go-four-gate-framework.v1.yaml',
      ],
      status: postAudit.dimensions?.D17_gate_layering_correction?.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
      evidence: 'evidence/GO_production_readiness/web3-system-audit/WEB3-GATE-LAYERING-CLOSURE-LATEST.json',
    },
    {
      id: 'STEP-2-RUNTIME-WIRING',
      title: 'Prod /meta 10/10 contract wiring',
      paths: ['docs/runbook/WEB3-SYSTEM-PRODUCTION-RUNTIME-WIRING.md', 'scripts/dev/check-web3-system-production-meta-contracts.cjs'],
      status: 'OPEN',
      note: 'Requires Fly secrets deploy — configuration only documented',
    },
    {
      id: 'STEP-3-G24-REGISTRY',
      title: 'G24 proxy registry restored + gate PASS',
      paths: ['registry/g24-p-upgrade-01-contract-posture.v1.yaml', 'scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh'],
      status: postAudit.dimensions?.D02_proxy_upgrade?.g24Pass ? 'CLOSED' : 'OPEN',
    },
    {
      id: 'STEP-4-TTG-CERT',
      title: 'TTG Cert evidence index',
      paths: ['scripts/dev/gen-ttg-cert-production-evidence-index.cjs', 'evidence/GO_ttg_cert/'],
      status: (postAudit.dimensions?.D20_ttg_cert_evidence?.signoffs || 0) >= 12 ? 'CLOSED' : 'PARTIAL',
    },
    {
      id: 'STEP-5-RBAC-D3',
      title: 'RBAC D3 closure manifest',
      paths: ['evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json'],
      status:
        readJson(path.join(EVID_ROOT, 'RBAC-D3-CLOSURE-LATEST.json'))?.verdict ===
        'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED'
          ? 'CLOSED'
          : 'PARTIAL',
    },
  ];

  const manifest = {
    schema: 'traveltrust.web3_system_closure.v1',
    recorded_utc: STAMP,
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    audit_verdict: postAudit.verdict,
    verdict: eligible ? 'WEB3_SYSTEM_CLOSURE_PASS' : 'WEB3_SYSTEM_CLOSURE_BLOCKED',
    summary: {
      blockers_p0: p0,
      blockers_p1: p1,
      blockers_p2: postAudit.summary?.blockers_p2 ?? null,
      payment_rail_subset_pass: postAudit.summary?.payment_rail_subset_pass,
      web3_system_ready: postAudit.summary?.web3_system_ready,
      closure_eligible: eligible,
    },
    honest_boundary: {
      payment_rail_g3_02:
        'G3-02 PAY-W01..W16 may PASS while full Web3 System (Governance/TTG/Staking/Primary Market) remains OPEN',
      gate2_registry_note:
        'TT_PRODUCTION_WEB3_READY=IN_PROGRESS until TT_WEB3_SYSTEM_PRODUCTION_READY=PASS (layering SSOT 2026-07-08)',
    },
    open_blockers: (postAudit.blockers || []).filter((b) => !String(b.status).startsWith('ACCEPTED')),
    closure_steps: closureItems,
    closure_prereqs_met: eligible,
    discipline: { business_code_modified: false, audit_only: true },
    master_map_parity: {
      verdict: masterMapParity.verdict || 'UNKNOWN',
      evidence: 'evidence/GO_production_readiness/web3-system-audit/WEB3-MASTER-MAP-PARITY-LATEST.json',
      failed_modules: masterMapParity.failed_modules || [],
    },
    references: {
      master_map_registry: 'registry/web3-system-master-map.v1.yaml',
      master_map_human: 'docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md',
      deep_audit_latest: 'evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-DEEP-AUDIT-LATEST.json',
      blockers_md: 'evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-BLOCKERS-LATEST.md',
      payment_rail_subset: 'evidence/GO_production_readiness/payment-deep-audit/PAYMENT-USDC-WEB3-DEEP-AUDIT-LATEST.json',
      g3_02: 'evidence/GO_production_readiness/G3-02/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json',
    },
  };

  fs.writeFileSync(path.join(RUN_DIR, 'WEB3-SYSTEM-CLOSURE.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-SYSTEM-CLOSURE-LATEST.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        verdict: manifest.verdict,
        p0,
        p1,
        payment_rail_pass: manifest.summary.payment_rail_subset_pass,
        run_dir: manifest.run_dir,
      },
      null,
      2,
    ),
  );
  process.exit(eligible ? 0 : 1);
}

main();
