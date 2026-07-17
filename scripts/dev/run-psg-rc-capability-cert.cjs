#!/usr/bin/env node
/**
 * PSG RC Step 3 · Capability Certification (under Freeze Manifest)
 *
 * Incremental discipline:
 *   - Cite freeze_manifest_id only (default RC-FREEZE-20260717T094900Z)
 *   - Read existing Foundation Gate / Alignment / Freeze — DO NOT re-run them
 *   - Run Cap Cert domain probes once; fix only NEW Cap Cert Blocking
 *   - Do NOT start Production GO
 *
 *   FREEZE_MANIFEST_ID=RC-FREEZE-20260717T094900Z \
 *     node scripts/dev/run-psg-rc-capability-cert.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const EXPECTED_FREEZE = process.env.FREEZE_MANIFEST_ID || 'RC-FREEZE-20260717T094900Z';
const FREEZE_YML = path.join(ROOT, 'registry/psg-release-candidate-freeze-LATEST.v1.yaml');
const FOUNDATION_YML = path.join(ROOT, 'registry/psg-foundation-gate-LATEST.v1.yaml');
const ALIGN_JSON = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json'
);
const SEQUENCE = path.join(ROOT, 'registry/psg-release-candidate-sequence.v1.yaml');
const OUT_DIR = path.join(ROOT, 'evidence/GO_psg_foundation/capability_cert');
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

function sh(cmd, opts = {}) {
  return spawnSync(cmd[0], cmd.slice(1), {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...opts.env },
    timeout: opts.timeout || 600000,
  });
}

function fail(msg) {
  console.error(`TT_PSG_RC_CAPABILITY_CERT: FAIL ${msg}`);
  process.exit(2);
}

function readFreezeId(text) {
  const m = text.match(/freeze_manifest_id:\s*(\S+)/);
  return m ? m[1].replace(/['"]/g, '') : null;
}

function runGate(name, cmd, env = {}) {
  console.log(`=== CapCert probe: ${name} ===`);
  const r = sh(cmd, { env });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  const tail = out.split(/\r?\n/).slice(-5).join(' | ');
  const pass = r.status === 0;
  console.log(pass ? `PASS ${name}` : `FAIL ${name} exit=${r.status}`);
  if (tail) console.log(tail);
  return { name, pass, exit_code: r.status ?? 1, tail };
}

function moduleLadderConfluence() {
  // Honest read from cockpit — do not invent PASS.
  const cockpit = path.join(ROOT, 'docs/runbook/TT-MODULE-RELEASE-COCKPIT-LATEST.md');
  const text = fs.existsSync(cockpit) ? fs.readFileSync(cockpit, 'utf8') : '';
  const hasBlocked = /Real Device[\s\S]{0,40}BLOCKED/.test(text) || /\|\s*Wallet\s*\|[^\n]*BLOCKED/.test(text);
  const status = hasBlocked ? 'BLOCKED' : /WAITING/.test(text) ? 'WAITING' : 'WAITING';
  return {
    status,
    source: 'docs/runbook/TT-MODULE-RELEASE-COCKPIT-LATEST.md',
    note: 'P1 Real Device Batch not PASS — confluence recorded honestly (not ignored)',
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── Preflight: existing artifacts only (no re-run) ──
  if (!fs.existsSync(FREEZE_YML)) fail('missing freeze LATEST');
  const freezeText = fs.readFileSync(FREEZE_YML, 'utf8');
  if (!/^status:\s*FROZEN/m.test(freezeText)) fail('freeze status must be FROZEN');
  const freezeId = readFreezeId(freezeText);
  if (freezeId !== EXPECTED_FREEZE) {
    fail(`freeze_manifest_id=${freezeId} ≠ expected ${EXPECTED_FREEZE}`);
  }
  const freezeGit = (freezeText.match(/git_sha:\s*(\S+)/) || [])[1];
  const head = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  if (freezeGit && freezeGit !== head) {
    fail(`working tree HEAD ${head.slice(0, 12)} ≠ freeze git_sha ${freezeGit.slice(0, 12)} (mid-stream churn)`);
  }

  const fg = fs.readFileSync(FOUNDATION_YML, 'utf8');
  if (!/foundation_gate:\s*\n\s*status:\s*PASS/.test(fg)) {
    fail('foundation_gate.status must be PASS (read existing — do not re-run Foundation Gate)');
  }
  const fgStamp = (fg.match(/stamp_utc:\s*"?([^"\n]+)"?/) || [])[1];

  const align = JSON.parse(fs.readFileSync(ALIGN_JSON, 'utf8'));
  if (Number(align.blocking_count) !== 0) fail(`alignment blocking_count=${align.blocking_count}`);
  if (!['LOCAL_SSOT_READY', 'ALIGNED'].includes(align.verdict)) {
    fail(`alignment verdict=${align.verdict}`);
  }

  console.log(`preflight: freeze=${freezeId} foundation=${fgStamp} alignment=${align.stamp} · no FG/Align/Freeze rerun`);

  // ── Lock (staging lease · Cap Cert default env; readonly probes, no destructive) ──
  const lockEnv = process.env.PSG_CAP_CERT_ENV || 'staging';
  const pre = sh([
    'node',
    'scripts/dev/psg-execution-lock.cjs',
    'preflight',
    '--pipeline',
    'capability_cert',
    '--env',
    lockEnv,
  ]);
  console.log((pre.stdout || pre.stderr || '').trim());
  if (pre.status !== 0) fail('execution lock preflight');
  const acq = sh([
    'node',
    'scripts/dev/psg-execution-lock.cjs',
    'acquire',
    '--pipeline',
    'capability_cert',
    '--env',
    lockEnv,
  ]);
  const acqOut = `${acq.stdout || ''}${acq.stderr || ''}`;
  console.log(acqOut.trim());
  const runIdMatch = acqOut.match(/run_id[=:\s]+(\S+)/i) || acqOut.match(/(psg-capability_cert-\S+)/);
  const runId = runIdMatch ? runIdMatch[1].replace(/[,"']/g, '') : null;
  if (acq.status !== 0) fail('execution lock acquire');

  // ── Cap Cert domain probes (once · under freeze) ──
  const probes = [];
  probes.push(runGate('SSOT_DRIFT', ['node', 'scripts/gates/check-psg-ssot-drift.cjs']));
  probes.push(runGate('B1_PUBLIC_DATA', ['node', 'scripts/gates/check-psg-public-data-isolation.cjs']));
  probes.push(runGate('B2_CMS', ['node', 'scripts/gates/check-psg-cms-lifecycle.cjs']));
  probes.push(
    runGate('B3_COS', ['node', 'scripts/gates/check-psg-cos-reference-integrity.cjs'], {
      TT_PSG_P0_4_STRICT_MIN_PROBE: '1',
    })
  );
  probes.push(
    runGate('B5_PUBLIC_SURFACE', ['node', 'scripts/gates/check-psg-public-surface-matrix.cjs'], {
      PSG_FORCE_STAGING_MATRIX: '1',
      STAGING_API_BASE: process.env.STAGING_API_BASE || 'https://tt-api-staging.fly.dev',
    })
  );
  // B4 readonly runtime (no destructive)
  probes.push(
    runGate('B4_RUNTIME_READONLY', ['bash', 'scripts/gates/run-psg-runtime-certification.sh'], {
      PSG_SKIP_BOOTSTRAP: '1',
      PSG_FORCE_STAGING_MATRIX: '1',
      STAGING_API_BASE: process.env.STAGING_API_BASE || 'https://tt-api-staging.fly.dev',
    })
  );

  const newBlocking = probes.filter((p) => !p.pass).map((p) => p.name);
  const ladder = moduleLadderConfluence();

  // Existing admission / production cert evidence (cite only — do not claim PASS)
  let prodCert = null;
  const prodPath = path.join(ROOT, 'evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json');
  if (fs.existsSync(prodPath)) {
    try {
      prodCert = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
    } catch {
      prodCert = null;
    }
  }

  const domainsPass = newBlocking.length === 0;
  // Cap Cert Step 3 PASS = freeze-bound domain probes green + existing FG/Align cited.
  // Full TT_PSG_PRODUCTION_CERT (destructive + repro×3 + prod candidate) remains Step 4 admission.
  const verdict = domainsPass ? 'PASS' : 'FAIL';
  const report = {
    schema: 'traveltrust.psg_rc_capability_cert.v1',
    machine_key: 'TT_PSG_RC_CAPABILITY_CERT',
    stamp_utc: STAMP,
    freeze_manifest_id: freezeId,
    git_sha: head,
    status: verdict,
    production_go: 'NO_GO',
    discipline: {
      no_foundation_gate_rerun: true,
      no_alignment_audit_rerun: true,
      no_rc_freeze_rerun: true,
      cite_existing_evidence_only_for_steps_1_2_2_5: true,
    },
    cited_existing: {
      foundation_gate_stamp: fgStamp,
      foundation_gate_status: 'PASS',
      alignment_audit_stamp: align.stamp,
      alignment_verdict: align.verdict,
      alignment_blocking_count: align.blocking_count,
      freeze_manifest_id: freezeId,
      freeze_status: 'FROZEN',
    },
    probes,
    new_blocking: newBlocking,
    module_release_ladder_confluence: ladder,
    production_cert_prior: prodCert
      ? {
          status: prodCert.status,
          admission: prodCert.admission || null,
          destructive: prodCert.destructive_suite?.status || null,
          note: 'Prior PRODUCTION_CERT cited; Cap Cert does not re-run destructive suite',
        }
      : null,
    next:
      verdict === 'PASS'
        ? 'Step 4 Production Entry Review (requires TT_PSG_PRODUCTION_CERT=PASS for exit)'
        : 'Fix Cap Cert new_blocking only · re-run this script (not FG/Align/Freeze)',
    honest_boundary:
      'Cap Cert PASS ≠ TT_PSG_PRODUCTION_CERT=PASS ≠ Production GO · PF-GAP-004/007 remain Owner/staging waves',
  };

  const stampDir = path.join(OUT_DIR, STAMP);
  fs.mkdirSync(stampDir, { recursive: true });
  fs.writeFileSync(path.join(stampDir, 'CAPABILITY-CERT.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'PSG-RC-CAPABILITY-CERT-LATEST.json'), JSON.stringify(report, null, 2));

  // Advance sequence pointer only on PASS
  if (verdict === 'PASS') {
    let seq = fs.readFileSync(SEQUENCE, 'utf8');
    seq = seq.replace(/^  step:\s*[0-9.]+/m, '  step: 3');
    seq = seq.replace(/^  step_id:\s*\S+/m, '  step_id: capability_certification');
    seq = seq.replace(
      /^  note:\s*>[\s\S]*?(?=\n# ── Anti-patterns)/m,
      `  note: >
    Step 3 Capability Certification PASS under freeze ${freezeId}.
    Domains B1–B5 + SSOT probes green. Next = Step 4 Production Entry Review
    (exit still requires TT_PSG_PRODUCTION_CERT=PASS). Cap Cert ≠ Production GO.

`
    );
    fs.writeFileSync(SEQUENCE, seq, 'utf8');
  }

  if (runId) {
    sh(['node', 'scripts/dev/psg-execution-lock.cjs', 'release', '--run-id', runId, '--status', verdict === 'PASS' ? 'PASS' : 'FAIL']);
  }

  console.log(`TT_PSG_RC_CAPABILITY_CERT: ${verdict} freeze_manifest_id=${freezeId} blocking=${newBlocking.length}`);
  console.log(`evidence: evidence/GO_psg_foundation/capability_cert/PSG-RC-CAPABILITY-CERT-LATEST.json`);
  if (verdict !== 'PASS') process.exit(2);
}

main();
