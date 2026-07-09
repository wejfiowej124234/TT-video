#!/usr/bin/env node
/**
 * Phase ② parallel sub-track evidence — ②-A/②-B/②-C/②-E (Timelock wait window)
 *
 *   node scripts/dev/run-phase2-subtrack-evidence.cjs
 *
 * Writes signoffs only when machine checks pass. Dashboard entry via:
 *   node scripts/dev/dashboard.cjs --execute
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAGING_API = (process.env.STAGING_API_BASE || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAMP = new Date().toISOString();

const OUT = {
  phase2: path.join(ROOT, 'evidence/GO_production_readiness/phase2-production-validation'),
  ops: path.join(ROOT, 'evidence/GO_production_readiness/operations-dashboard'),
  eco: path.join(ROOT, 'evidence/GO_production_readiness/web3-protocol-grade-audit'),
};

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

function runNode(script, args = [], env = {}) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { ok: r.status === 0, status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function runBash(script, args = [], env = {}) {
  const r = spawnSync('bash', [path.join(__dirname, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { ok: r.status === 0, status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function writeJson(relPath, data) {
  mkdirp(path.dirname(relPath));
  fs.writeFileSync(relPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function findLatestOcsState() {
  const base = path.join(ROOT, 'evidence/GO_official_cold_start_dataset');
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(base, d.name, 'state.json'))
    .filter((p) => fs.existsSync(p))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return dirs[0] || null;
}

function findAdminMatrixGo() {
  const bases = [
    path.join(ROOT, 'evidence/GO_staging_admin_rbac_matrix'),
    path.join(ROOT, 'frontend/evidence/GO_staging_admin_rbac_matrix'),
  ];
  let best = null;
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name === 'report.json') {
          const doc = readJson(p);
          if (doc?.release_gate === 'GO' && doc?.summary?.fail === 0) {
            const rel = path.relative(ROOT, p).replace(/\\/g, '/');
            if (!best || doc.summary.pass > (readJson(path.join(ROOT, best))?.summary?.pass || 0)) best = rel;
          }
        }
      }
    };
    walk(base);
  }
  return best;
}

function main() {
  mkdirp(OUT.phase2);
  mkdirp(OUT.ops);

  const results = {
    schema: 'traveltrust.phase2_subtrack_evidence_run.v1',
    recorded_utc: STAMP,
    staging_api: STAGING_API,
    checks: {},
    signoffs: {},
  };

  // ②-E · RBAC D3
  const rbac = runNode('run-rbac-d3-closure.cjs');
  const rbacDoc = readJson(path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json'));
  results.checks.rbac_d3 = {
    ok: rbacDoc?.verdict === 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED',
    verdict: rbacDoc?.verdict,
  };

  // ②-C · Display data governance + full-site audit
  const ddg = runBash('run-display-data-governance.sh', [], {
    API_BASE: STAGING_API,
    STAGING_API_BASE: STAGING_API,
    ENV_LABEL: 'staging',
  });
  const ocsState = findLatestOcsState();
  if (ocsState) {
    const alignEnv = { API: STAGING_API, STAGING_RC_BASELINE_AUTHORIZED: '1', STATE: ocsState };
    for (const script of [
      'align-ocs-staging-guides-public-catalog.cjs',
      'align-ocs-staging-market-catalog.cjs',
      'align-ocs-staging-community-feed.cjs',
      'align-ocs-staging-official-guides.cjs',
    ]) {
      runNode(script, [], alignEnv);
    }
  }
  const fsDg = runNode('staging-full-site-display-governance-audit.cjs', [], {
    API: STAGING_API,
    FS_DG_JSON: path.join(OUT.ops, `fs-dg-audit-${STAMP.replace(/[:.]/g, '-').slice(0, 19)}.json`),
  });
  const fsDgPass = /FS_DG_AUDIT_VERDICT: PASS/.test(fsDg.stdout);
  results.checks.display_data_governance = { ok: ddg.ok, exit: ddg.status };
  results.checks.full_site_ddg_audit = { ok: fsDgPass };

  const g6 = runNode('run-ocs-g6-staging-public-uat-blind-review.cjs', [], { API: STAGING_API });
  results.checks.ocs_g6_blind_review = { ok: g6.ok, exit: g6.status };

  // ②-A · Business UAT probes
  const uat = runNode('business-manual-uat-probes.cjs', [], { API: STAGING_API, ENV_LABEL: 'staging' });
  results.checks.business_uat_probes = { ok: uat.ok, tail: (uat.stdout || uat.stderr).trim().slice(-200) };

  const layerA = readJson(path.join(ROOT, 'evidence/GO_production_readiness/escrow-bilateral-layer-a/ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json'));
  const layerAPass = layerA?.verdict === 'LAYER_A_EVIDENCE_PASS';

  // ②-B · Admin matrix (best-effort live; fallback GO evidence)
  const adminLive = runBash('../gates/smoke-admin-rbac-staging-matrix.sh', [], {
    STAGING_API_BASE: STAGING_API,
    ADM_U01_STRICT: '0',
  });
  const matrixGo = findAdminMatrixGo();
  results.checks.admin_rbac_matrix_live = { ok: adminLive.ok, exit: adminLive.status };
  results.checks.admin_rbac_matrix_evidence = { path: matrixGo, ok: !!matrixGo };

  // ECO-ARB source evidence (②-E / protocol-grade support)
  const ecoArb = runNode('gen-eco-arb-phase2-evidence.cjs');
  results.checks.eco_arb_evidence = { ok: ecoArb.ok };

  // Signoffs (honest gates)
  if (layerAPass && uat.ok) {
    const signoff = {
      schema: 'traveltrust.phase2_uat_signoff.v1',
      recorded_utc: STAMP,
      phase: '②-A',
      verdict: 'PHASE2_WEBSITE_PRODUCT_UAT_PASS',
      staging_api: STAGING_API,
      layer_a: layerA?.verdict,
      probes: 'business-manual-uat-probes.cjs PASS',
    };
    writeJson(path.join(OUT.phase2, 'UAT-SIGNOFF-LATEST.json'), signoff);
    results.signoffs['2A'] = signoff.verdict;
  } else {
    results.signoffs['2A'] = 'BLOCKED';
    results.signoffs['2A_blockers'] = [
      !layerAPass ? 'layer_a_not_pass' : null,
      !uat.ok ? 'staging_uat_probes_fail' : null,
    ].filter(Boolean);
  }

  const adminOk = results.checks.rbac_d3.ok && (adminLive.ok || matrixGo);
  if (adminOk) {
    const signoff = {
      schema: 'traveltrust.phase2_admin_uat_signoff.v1',
      recorded_utc: STAMP,
      phase: '②-B',
      verdict: 'PHASE2_ADMIN_OPS_UAT_PASS',
      rbac_d3: rbacDoc?.verdict,
      admin_matrix: adminLive.ok ? 'live_pass' : matrixGo,
    };
    writeJson(path.join(OUT.ops, 'ADMIN-UAT-SIGNOFF-LATEST.json'), signoff);
    results.signoffs['2B'] = signoff.verdict;
  } else {
    results.signoffs['2B'] = 'BLOCKED';
  }

  const cmsOk = ddg.ok && fsDgPass;
  if (cmsOk && g6.ok) {
    const signoff = {
      schema: 'traveltrust.phase2_cms_cos_validation.v1',
      recorded_utc: STAMP,
      phase: '②-C',
      verdict: 'PHASE2_CMS_COS_VALIDATION_PASS',
      display_data_governance: 'PASS',
      full_site_audit: 'PASS',
      ocs_g6: 'PASS',
    };
    writeJson(path.join(OUT.ops, 'CMS-COS-VALIDATION-LATEST.json'), signoff);
    results.signoffs['2C'] = signoff.verdict;
  } else if (cmsOk) {
    results.signoffs['2C'] = 'IN_PROGRESS';
    writeJson(path.join(OUT.ops, 'CMS-COS-VALIDATION-LATEST.json'), {
      schema: 'traveltrust.phase2_cms_cos_validation.v1',
      recorded_utc: STAMP,
      phase: '②-C',
      verdict: 'PHASE2_CMS_COS_DDG_PASS_G6_PENDING',
      display_data_governance: 'PASS',
      full_site_audit: 'PASS',
      ocs_g6: 'FAIL',
      note: 'DDG PASS — G6 OCS blind review still open',
    });
  } else {
    results.signoffs['2C'] = 'BLOCKED';
  }

  writeJson(path.join(OUT.phase2, 'PHASE2-SUBTRACK-EVIDENCE-RUN-LATEST.json'), results);

  console.log(JSON.stringify({ signoffs: results.signoffs, checks: results.checks }, null, 2));
  const blocked = results.signoffs['2A'] === 'BLOCKED' && results.signoffs['2B'] === 'BLOCKED' && results.signoffs['2C'] === 'BLOCKED';
  process.exit(blocked ? 1 : 0);
}

main();
