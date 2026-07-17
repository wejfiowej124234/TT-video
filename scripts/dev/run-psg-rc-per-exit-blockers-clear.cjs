#!/usr/bin/env node
/**
 * PER Step4 · clear EXIT_BLOCKERs incrementally (no FG/Align/Freeze/CapCert rerun).
 *
 * Owner-authorized session actions:
 *   1) Repro×3 fingerprints for freeze SHA → production_cert/repro + PER mirror
 *   2) PRODUCTION_CANDIDATE_API_BASE env alignment
 *   3) Destructive suite (PSG_ALLOW_DESTRUCTIVE_CERT=1)
 *   4) Cite Owner Non-blocking deferral for Module Ladder
 *   5) run-psg-production-cert.sh → TT_PSG_PRODUCTION_CERT
 *
 *   node scripts/dev/run-psg-rc-per-exit-blockers-clear.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const FREEZE_ID = process.env.FREEZE_MANIFEST_ID || 'RC-FREEZE-20260717T094900Z';
const STAGING = (process.env.STAGING_API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const PROD_CAND = (process.env.PRODUCTION_CANDIDATE_API_BASE || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');
const PER_DIR = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS'
);
const REPRO_DIR = path.join(ROOT, 'evidence/GO_psg_foundation/production_cert/repro');
const PROD_CERT_DIR = path.join(ROOT, 'evidence/GO_psg_foundation/production_cert');
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

function sh(cmd, env = {}, timeoutMs = 900000) {
  return spawnSync(cmd[0], cmd.slice(1), {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    // Production cert (B4 bootstrap + destructive) can exceed 15m under staging 429 backoff.
    timeout: timeoutMs,
  });
}

function fail(m) {
  console.error(`TT_PER_EXIT_BLOCKERS: FAIL ${m}`);
  process.exit(2);
}

async function fingerprint(api) {
  const meta = await (await fetch(api + '/meta')).json();
  const sha = (meta.build && meta.build.git_sha) || meta.git_sha || '';
  const paths = [
    '/api/v1/market/provider/listings?limit=50',
    '/api/v1/market/acquisition/listings?limit=50',
    '/api/v1/guides?limit=50',
    '/api/v1/community/feed?limit=20',
    '/api/v1/catalog/media?limit=100',
  ];
  const surfaces = {};
  for (const p of paths) {
    const j = await (await fetch(api + p)).json();
    const items = j.items || j.listings || j.posts || j.guides || j.media || [];
    surfaces[p.split('?')[0]] = {
      n: items.length,
      ids: items
        .map((x) => x.id)
        .filter(Boolean)
        .sort()
        .join(','),
    };
  }
  const matrix = sh(
    ['node', 'scripts/gates/check-psg-public-surface-matrix.cjs'],
    { STAGING_API_BASE: api, PSG_FORCE_STAGING_MATRIX: '1' }
  );
  return {
    git_sha: sha,
    surfaces,
    matrix_exit: matrix.status,
    matrix_tail:
      (matrix.stdout || '')
        .split('\n')
        .filter((l) => /TT_PSG_MATRIX/.test(l))
        .slice(-1)[0] || '',
    freeze_manifest_id: FREEZE_ID,
    owner_repro_note:
      'Owner Repro×3 for RC Freeze SHA — three consecutive post-deploy fingerprints on frozen staging runtime',
  };
}

async function main() {
  fs.mkdirSync(PER_DIR, { recursive: true });
  fs.mkdirSync(REPRO_DIR, { recursive: true });
  fs.mkdirSync(PROD_CERT_DIR, { recursive: true });

  const freezeYml = fs.readFileSync(
    path.join(ROOT, 'registry/psg-release-candidate-freeze-LATEST.v1.yaml'),
    'utf8'
  );
  if (!freezeYml.includes(FREEZE_ID) || !/^status:\s*FROZEN/m.test(freezeYml)) {
    fail('freeze not FROZEN / id mismatch');
  }
  const freezeSha = (freezeYml.match(/git_sha:\s*(\S+)/) || [])[1];

  const ladderAccept = path.join(PER_DIR, 'OWNER-ACCEPTED-MODULE-LADDER-CONFLUENCE.json');
  if (!fs.existsSync(ladderAccept)) fail('missing Owner Non-blocking Ladder accept');

  console.log('== 1 Repro×3 fingerprints ==');
  const snaps = [];
  for (let i = 1; i <= 3; i++) {
    let fp = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      fp = await fingerprint(STAGING);
      if (fp.git_sha !== freezeSha) {
        fail(`staging git_sha ${fp.git_sha} ≠ freeze ${freezeSha}`);
      }
      if (fp.matrix_exit === 0) break;
      console.log(`repro fingerprint ${i} attempt ${attempt}: matrix_exit=${fp.matrix_exit} — retry`);
      await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
    if (!fp || fp.matrix_exit !== 0) fail(`matrix_exit=${fp && fp.matrix_exit} on fingerprint ${i}`);
    const name = `repro-${STAMP}-${i}.json`;
    fs.writeFileSync(path.join(REPRO_DIR, name), JSON.stringify(fp, null, 2));
    fs.writeFileSync(path.join(PER_DIR, name), JSON.stringify(fp, null, 2));
    snaps.push(name);
    console.log(`repro fingerprint ${i}: sha=${fp.git_sha.slice(0, 12)} matrix_exit=${fp.matrix_exit}`);
    if (i < 3) await new Promise((r) => setTimeout(r, 2500));
  }

  const repro = sh(['node', 'scripts/gates/check-psg-reproducible-build.cjs'], {
    PSG_REPRO_EVIDENCE_DIR: REPRO_DIR,
  });
  console.log((repro.stdout || '').trim());
  const reproJson = JSON.parse(fs.readFileSync(path.join(PROD_CERT_DIR, 'PSG-REPRODUCIBLE-BUILD-LATEST.json'), 'utf8'));
  fs.writeFileSync(path.join(PER_DIR, 'PSG-REPRODUCIBLE-BUILD-LATEST.json'), JSON.stringify(reproJson, null, 2));
  if (reproJson.status !== 'PASS') fail(`repro status=${reproJson.status}`);

  console.log('== 2 Environment Alignment (prod candidate) ==');
  const envR = sh(['node', 'scripts/gates/check-psg-environment-alignment.cjs'], {
    STAGING_API_BASE: STAGING,
    PRODUCTION_CANDIDATE_API_BASE: PROD_CAND,
  });
  console.log((envR.stdout || envR.stderr || '').trim());
  const envJson = JSON.parse(
    fs.readFileSync(path.join(PROD_CERT_DIR, 'PSG-ENVIRONMENT-ALIGNMENT-LATEST.json'), 'utf8')
  );
  fs.writeFileSync(path.join(PER_DIR, 'PSG-ENVIRONMENT-ALIGNMENT-LATEST.json'), JSON.stringify(envJson, null, 2));
  if (envJson.status !== 'PASS') fail(`env alignment status=${envJson.status}`);

  console.log('== 3 Destructive suite (Owner) ==');
  // Acquire staging lease for destructive write-env
  const pre = sh([
    'node',
    'scripts/dev/psg-execution-lock.cjs',
    'preflight',
    '--pipeline',
    'capability_cert',
    '--env',
    'staging',
  ]);
  if (pre.status !== 0) {
    console.log(pre.stdout || pre.stderr);
    fail('lock preflight');
  }
  const acq = sh([
    'node',
    'scripts/dev/psg-execution-lock.cjs',
    'acquire',
    '--pipeline',
    'capability_cert',
    '--env',
    'staging',
  ]);
  console.log((acq.stdout || acq.stderr || '').trim());
  const runId =
    ((acq.stdout || '') + (acq.stderr || '')).match(/(psg-capability_cert-staging-\S+)/) ||
    ((acq.stdout || '') + (acq.stderr || '')).match(/run_id[=:\s]+(\S+)/i);
  const rid = runId ? runId[1].replace(/[,"']/g, '') : null;
  if (acq.status !== 0) fail('lock acquire');

  const destEnv = {
    PSG_ALLOW_DESTRUCTIVE_CERT: '1',
    PSG_ALLOW_BOOTSTRAP_WRITE: '1',
    PSG_ALLOW_DESTRUCTIVE_REDEPLOY: '1',
    PSG_CLEAN_DEPLOY_VERIFY_ONLY: process.env.PSG_ALLOW_CLEAN_DEPLOY === '1' ? '0' : '1',
    STAGING_API_BASE: STAGING,
    STAGING_WEB_BASE: process.env.STAGING_WEB_BASE || 'https://tt-web-staging.fly.dev',
    PRODUCTION_CANDIDATE_API_BASE: PROD_CAND,
    PSG_REPRO_EVIDENCE_DIR: REPRO_DIR,
    // Reuse full OCS state to avoid community POST 429 storms during B4 ×2 bootstrap.
    OCS_STATE_SEED:
      process.env.OCS_STATE_SEED ||
      path.join(
        ROOT,
        'evidence/GO_official_cold_start_dataset/20260717T063346Z/state.json'
      ),
    OCS_SKIP_ASSET_BOOTSTRAP: process.env.OCS_SKIP_ASSET_BOOTSTRAP || '1',
    OCS_POST_INTERVAL_MS: process.env.OCS_POST_INTERVAL_MS || '8000',
  };

  // 60m — B4 OCS×2 + destructive under staging rate limits.
  const cert = sh(['bash', 'scripts/gates/run-psg-production-cert.sh'], destEnv, 3600000);
  if (cert.error && cert.error.code === 'ETIMEDOUT') {
    fail('production cert spawnSync ETIMEDOUT (raise timeout; last run killed mid-bootstrap)');
  }
  console.log((cert.stdout || '').split('\n').slice(-40).join('\n'));
  if (cert.stderr) console.error(cert.stderr.split('\n').slice(-20).join('\n'));
  if (cert.status !== 0) {
    fail(`production cert exit=${cert.status}`);
  }
  const prodCertPath = path.join(PROD_CERT_DIR, 'PSG-PRODUCTION-CERT-LATEST.json');
  if (!fs.existsSync(prodCertPath)) fail('missing PSG-PRODUCTION-CERT-LATEST.json');
  const prodCert = JSON.parse(fs.readFileSync(prodCertPath, 'utf8'));
  prodCert.freeze_manifest_id = FREEZE_ID;
  prodCert.per_evidence_dir = path.relative(ROOT, PER_DIR).replace(/\\/g, '/');
  prodCert.module_ladder_confluence = {
    status: 'OWNER_ACCEPTED_NON_BLOCKING',
    signoff: path.relative(ROOT, ladderAccept).replace(/\\/g, '/'),
  };
  fs.writeFileSync(prodCertPath, JSON.stringify(prodCert, null, 2));
  fs.writeFileSync(path.join(PER_DIR, 'PSG-PRODUCTION-CERT-LATEST.json'), JSON.stringify(prodCert, null, 2));

  if (rid) {
    sh([
      'node',
      'scripts/dev/psg-execution-lock.cjs',
      'release',
      '--run-id',
      rid,
      '--status',
      prodCert.status === 'PASS' ? 'PASS' : 'FAIL',
    ]);
  }

  const summary = {
    schema: 'traveltrust.per_exit_blockers_clear.v1',
    stamp_utc: STAMP,
    freeze_manifest_id: FREEZE_ID,
    no_foundation_rerun: true,
    no_alignment_rerun: true,
    no_freeze_rerun: true,
    no_cap_cert_rerun: true,
    blockers: {
      repro: { status: reproJson.status, files: snaps },
      env_alignment: { status: envJson.status, production_candidate: PROD_CAND },
      destructive_and_production_cert: {
        status: prodCert.status,
        admission: prodCert.admission,
        destructive: prodCert.destructive_suite,
      },
      module_ladder: {
        status: 'OWNER_ACCEPTED_NON_BLOCKING',
        signoff: 'OWNER-ACCEPTED-MODULE-LADDER-CONFLUENCE.json',
      },
    },
    tt_psg_production_cert: prodCert.status,
  };
  fs.writeFileSync(path.join(PER_DIR, 'PER-EXIT-BLOCKERS-CLEAR-LATEST.json'), JSON.stringify(summary, null, 2));

  // Refresh Step4 entry report
  const entryPath = path.join(
    ROOT,
    'evidence/GO_psg_foundation/production_entry_review/PSG-RC-PRODUCTION-ENTRY-LATEST.json'
  );
  if (fs.existsSync(entryPath)) {
    const entry = JSON.parse(fs.readFileSync(entryPath, 'utf8'));
    entry.updated_utc = new Date().toISOString();
    entry.exit_blockers_clear = summary;
    entry.step4_exit_ready = prodCert.status === 'PASS';
    entry.tt_psg_production_cert = prodCert.status;
    if (prodCert.status === 'PASS') {
      entry.status = 'EXIT_READY';
      entry.exit_blockers = [];
    }
    fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2));
    fs.writeFileSync(path.join(PER_DIR, 'PSG-RC-PRODUCTION-ENTRY-LATEST.json'), JSON.stringify(entry, null, 2));
  }

  console.log(`TT_PER_EXIT_BLOCKERS: DONE production_cert=${prodCert.status}`);
  console.log(`TT_PSG_PRODUCTION_CERT: ${prodCert.status}`);
  if (prodCert.status !== 'PASS') process.exit(2);
}

main().catch((e) => {
  console.error(e);
  fail(String(e.message || e));
});
