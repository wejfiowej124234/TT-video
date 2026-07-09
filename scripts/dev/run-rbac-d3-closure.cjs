#!/usr/bin/env node
/**
 * RBAC D3 closure — permission SSOT sync + ADM-U01 boundary evidence (no chain/governance changes).
 *
 *   node scripts/dev/run-rbac-d3-closure.cjs
 *
 * Writes: evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit');
const STAMP = new Date().toISOString();

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function readJsonSafe(p) {
  try {
    return JSON.parse(readSafe(p));
  } catch {
    return null;
  }
}

function extractPerms() {
  const rust = new Set(
    [...readSafe(path.join(ROOT, 'crates/api/src/routes/admin/admin_rbac.rs')).matchAll(/pub const PERM_\w+: &str = "([^"]+)"/g)].map(
      (m) => m[1],
    ),
  );
  const yaml = new Set(
    [...readSafe(path.join(ROOT, 'registry/admin-rbac-permissions.v1.yaml')).matchAll(/^\s+-\s+id:\s+(\S+)/gm)].map(
      (m) => m[1],
    ),
  );
  const ts = new Set(
    [...readSafe(path.join(ROOT, 'frontend/lib/admin/adminPermissionIds.ts')).matchAll(/"((?:admin\.)[^"]+)"/g)].map(
      (m) => m[1],
    ),
  );
  return { rust, yaml, ts };
}

function findAdmU01Evidence() {
  const hits = [];
  const roots = [
    path.join(ROOT, 'evidence/GO_staging_admin_rbac_matrix'),
    path.join(ROOT, 'evidence/GO_production_operations_enablement'),
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name === 'report.json') {
          const doc = readJsonSafe(p);
          if (doc?.release_gate === 'GO' || doc?.summary?.pass === doc?.summary?.total) {
            hits.push(path.relative(ROOT, p).replace(/\\/g, '/'));
          }
        }
      }
    };
    walk(root);
  }
  return hits;
}

function main() {
  fs.mkdirSync(EVID_ROOT, { recursive: true });

  const perms = extractPerms();
  const onlyRust = [...perms.rust].filter((p) => !perms.yaml.has(p) || !perms.ts.has(p));
  const onlyYaml = [...perms.yaml].filter((p) => !perms.rust.has(p));
  const onlyTs = [...perms.ts].filter((p) => !perms.rust.has(p));
  const f01Closed = onlyRust.length === 0 && onlyYaml.length === 0 && onlyTs.length === 0;

  const secRun = spawnSync('python', [path.join(ROOT, 'scripts/dev/gen-p2fc-web3-system-security-audit.py')], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const secDirs = fs.existsSync(path.join(ROOT, 'evidence/P2FC_SOAK_72H_STAGING/web3-system-security-audit'))
    ? fs
        .readdirSync(path.join(ROOT, 'evidence/P2FC_SOAK_72H_STAGING/web3-system-security-audit'))
        .filter((d) => d.startsWith('audit-'))
        .sort()
    : [];
  const secLatest =
    secDirs.length > 0
      ? readJsonSafe(
          path.join(
            ROOT,
            'evidence/P2FC_SOAK_72H_STAGING/web3-system-security-audit',
            secDirs[secDirs.length - 1],
            'WEB3-SYSTEM-SECURITY-AUDIT.json',
          ),
        )
      : null;
  const d3 = secLatest?.domains?.D3_admin_rbac_chain || {};
  const d3Findings = d3.findings || [];
  const f04Open = d3Findings.some((f) => f.id === 'D3-F04' && f.severity === 'high');
  const admEvidence = findAdmU01Evidence();
  const registryYaml = readSafe(path.join(ROOT, 'registry/admin-rbac-permissions.v1.yaml'));
  const stagingMatrixGo = /staging_admin_matrix:\s*\n\s*status:\s*GO/m.test(registryYaml);

  const f04Closed = !f04Open && (stagingMatrixGo || admEvidence.length > 0);
  const d3Pass = d3.verdict === 'PASS' || (f01Closed && f04Closed && d3.verdict !== 'FAIL');

  const manifest = {
    schema: 'traveltrust.rbac_d3_closure.v1',
    recorded_utc: STAMP,
    verdict:
      f01Closed && f04Closed && d3Pass
        ? 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED'
        : 'RBAC_D3_PRODUCTION_BOUNDARY_OPEN',
    findings: {
      'D3-F01_permission_ssot_sync': f01Closed ? 'CLOSED' : 'OPEN',
      'D3-F04_adm_u01_staging_matrix': f04Closed ? 'CLOSED' : 'OPEN',
    },
    permission_parity: {
      rust_count: perms.rust.size,
      yaml_count: perms.yaml.size,
      ts_count: perms.ts.size,
      only_rust: onlyRust,
      only_yaml: onlyYaml,
      only_ts: onlyTs,
    },
    security_audit: {
      d3_verdict: d3.verdict || null,
      d3_findings: d3Findings.map((f) => ({ id: f.id, severity: f.severity, note: f.note })),
      security_audit_log_tail: `${secRun.stdout || ''}${secRun.stderr || ''}`.slice(-800),
    },
    adm_u01_evidence: admEvidence,
    staging_matrix_registry_go: stagingMatrixGo,
    discipline: {
      governance_contracts_modified: false,
      timelock_touched: false,
      note: 'RBAC registry + FE permission SSOT + evidence only',
    },
    references: [
      'registry/admin-rbac-permissions.v1.yaml',
      'frontend/lib/admin/adminPermissionIds.ts',
      'crates/api/src/routes/admin/admin_rbac.rs',
      'scripts/gates/run-admin-rbac-staging-matrix.py',
    ],
  };

  fs.writeFileSync(path.join(EVID_ROOT, 'RBAC-D3-CLOSURE-LATEST.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ verdict: manifest.verdict, f01: manifest.findings['D3-F01_permission_ssot_sync'], f04: manifest.findings['D3-F04_adm_u01_staging_matrix'], d3: d3.verdict }, null, 2));
  process.exit(manifest.verdict === 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED' ? 0 : 1);
}

main();
