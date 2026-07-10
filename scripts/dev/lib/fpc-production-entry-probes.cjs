/**
 * FPC-100 B41 · Production Entry Review probes @ ② staging
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ROOT, EVID } = require('./fpc-batch-sequence.cjs');
const {
  loadAuthoritativeSha,
  verifyFrozenChainReadonly,
  probeRuntimeHealth,
  probeMetaSha,
  probeEnvironmentDiff,
  probeRegistryParity,
  runStagingInfraRecheck,
  classifyFindings,
} = require('./fpc-deployment-probes.cjs');

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: 900_000,
  }).trim();
}

async function fetchText(url, timeoutMs = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    const text = await r.text();
    return { status: r.status, ok: r.ok, text: text.slice(0, 200_000) };
  } finally {
    clearTimeout(t);
  }
}

function verifyB40DeployAnchor(findings) {
  const manifestPath = path.join(
    EVID,
    'B40-deployment/FPC-100-B40-DEPLOY-MANIFEST-LATEST.json'
  );
  const b40Path = path.join(EVID, 'FPC-100-BATCH-B40-LATEST.json');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(b40Path)) {
    findings.push({
      id: 'b40_evidence_missing',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: 'B40 deploy evidence missing',
    });
    return { pass: false };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const b40 = JSON.parse(fs.readFileSync(b40Path, 'utf8'));
  const pass =
    manifest.sha_match === true &&
    b40.pass === true &&
    (b40.verdict === 'PASS' || b40.overall_verdict === 'PASS');
  if (!pass) {
    findings.push({
      id: 'b40_not_pass',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail: `manifest.sha_match=${manifest.sha_match} b40.pass=${b40.pass}`,
    });
  }
  return { pass, manifest, b40_batch: { verdict: b40.verdict, pass: b40.pass } };
}

async function probeBusinessLegalPages(stagingWeb, checklist, findings) {
  const routes = checklist.business_readiness_routes || [];
  const forbidden = checklist.forbidden_body_patterns || [];
  const rows = [];
  for (const route of routes) {
    const url = `${stagingWeb}${route.path}`;
    const res = await fetchText(url);
    const statusOk = res.status === route.min_status || res.status === 304;
    const hits = forbidden.filter((p) => res.text.includes(p));
    const row = {
      id: route.id,
      path: route.path,
      url,
      status: res.status,
      pass: statusOk && hits.length === 0,
      forbidden_hits: hits,
    };
    rows.push(row);
    if (!statusOk) {
      findings.push({
        id: `business_page_${route.id}`,
        severity: route.id === 'terms' || route.id === 'privacy' ? 'P0' : 'P1',
        classification: 'CONFIG_ISSUE',
        detail: `${url} → ${res.status}`,
      });
    }
    if (hits.length) {
      findings.push({
        id: `business_page_${route.id}_placeholder`,
        severity: 'P1',
        classification: 'ENVIRONMENT_DRIFT',
        detail: `${route.path} contains ${hits.join(',')}`,
      });
    }
  }
  return {
    pass: rows.every((r) => r.pass),
    routes: rows,
  };
}

async function probeSeoDiscovery(stagingWeb, checklist, findings) {
  const items = checklist.seo_discovery || [];
  const rows = [];
  for (const item of items) {
    const url = `${stagingWeb}${item.path}`;
    const res = await fetchText(url);
    const pass = res.status === item.min_status || res.status === 304;
    rows.push({ id: item.id, path: item.path, status: res.status, pass, bytes: res.text.length });
    if (!pass) {
      findings.push({
        id: `seo_${item.id}`,
        severity: 'P1',
        classification: 'CONFIG_ISSUE',
        detail: `${url} → ${res.status}`,
      });
    }
  }
  return { pass: rows.every((r) => r.pass), items: rows };
}

function probeProductionEntryReviewSsot(checklist, findings) {
  const missing = (checklist.per_ssot || []).filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
  if (missing.length) {
    findings.push({
      id: 'per_ssot_missing',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: missing.join(','),
    });
  }
  return { pass: missing.length === 0, present: (checklist.per_ssot || []).filter((rel) => fs.existsSync(path.join(ROOT, rel))) };
}

function verifyAnchorBusinessCodeUnchanged(authoritativeSha, findings) {
  if (!authoritativeSha || !/^[0-9a-f]{40}$/.test(authoritativeSha)) {
    findings.push({
      id: 'anchor_freeze_no_sha',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: 'authoritative_immutable_head missing',
    });
    return { pass: false };
  }
  let changed = [];
  try {
    changed = sh(`git diff --name-only ${authoritativeSha}..HEAD`)
      .split('\n')
      .filter(Boolean)
      .map((f) => f.replace(/\\/g, '/'));
  } catch (e) {
    findings.push({
      id: 'anchor_freeze_git_diff',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: String(e.message || e),
    });
    return { pass: false };
  }

  const allowedPrefixes = [
    'docs/spec/governance-token/evidence/',
    'docs/runbook/FPC-',
    'docs/runbook/TT-FPC-',
    'registry/fpc-100-',
    'registry/full-production-certification-checklist.v1.yaml',
    'scripts/dev/run-fpc-',
    'scripts/dev/sign-fpc-',
    'scripts/dev/lib/fpc-',
    'scripts/dev/check-fpc-',
    'scripts/dev/refresh-fpc-',
    'scripts/dev/apply-fpc-',
    'scripts/dev/run-fpc-b40-',
    'scripts/dev/audit-fpc-',
  ];
  const businessPrefixes = ['crates/', 'frontend/app/', 'frontend/components/', 'frontend/lib/', 'contracts/'];

  const disallowed = changed.filter((f) => {
    if (allowedPrefixes.some((pre) => f.startsWith(pre))) return false;
    if (f.startsWith('frontend/evidence/')) return false;
    return businessPrefixes.some((pre) => f.startsWith(pre));
  });

  if (disallowed.length) {
    findings.push({
      id: 'anchor_business_code_drift',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: `Changes since ${authoritativeSha.slice(0, 12)}: ${disallowed.slice(0, 8).join(', ')}`,
      files: disallowed,
    });
  }

  return {
    pass: disallowed.length === 0,
    authoritative_sha: authoritativeSha,
    head: sh('git rev-parse HEAD'),
    changed_count: changed.length,
    disallowed_count: disallowed.length,
    policy: 'Governance/evidence/FPC ops only after Local Final Freeze anchor',
  };
}

function runReleaseGates(checklist, findings) {
  const results = [];
  for (const rel of checklist.release_gates || []) {
    const script = path.join(ROOT, rel);
    let pass = false;
    let detail = '';
    try {
      sh(`node "${script}"`, ROOT);
      pass = true;
    } catch (e) {
      detail = `${e.stdout || ''}${e.stderr || ''}`.slice(0, 1500);
      findings.push({
        id: `release_gate_${path.basename(rel, '.cjs')}`,
        severity: 'P0',
        classification: 'REAL_DEFECT',
        detail,
      });
    }
    results.push({ script: rel, pass, detail: detail || null });
  }
  return { pass: results.every((r) => r.pass), gates: results };
}

function runHygieneGates(checklist, findings) {
  const results = [];
  for (const rel of checklist.hygiene_gates || []) {
    const script = path.join(ROOT, rel);
    if (!fs.existsSync(script)) {
      results.push({ script: rel, pass: false, skipped: true });
      continue;
    }
    let pass = false;
    let detail = '';
    try {
      sh(`bash "${script}"`, ROOT);
      pass = true;
    } catch (e) {
      detail = `${e.stdout || ''}${e.stderr || ''}`.slice(0, 1500);
      findings.push({
        id: `hygiene_${path.basename(rel, '.sh')}`,
        severity: 'P1',
        classification: 'CONFIG_ISSUE',
        detail,
      });
    }
    results.push({ script: rel, pass, detail: detail || null });
  }
  const pass = results.every((r) => r.pass || r.skipped);
  return { pass, gates: results };
}

function verifyPriorBatchesPass(checklist, findings) {
  const required = checklist.staging_recheck_batches || [];
  const rows = [];
  for (const batchId of required) {
    const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
    if (!fs.existsSync(p)) {
      rows.push({ batch_id: batchId, pass: false, reason: 'missing' });
      findings.push({
        id: `prior_batch_${batchId}`,
        severity: 'P0',
        classification: 'REAL_DEFECT',
        detail: `${batchId} evidence missing`,
      });
      continue;
    }
    const b = JSON.parse(fs.readFileSync(p, 'utf8'));
    const ok = b.pass === true && (b.verdict === 'PASS' || b.overall_verdict === 'PASS');
    rows.push({ batch_id: batchId, pass: ok, verdict: b.verdict });
    if (!ok) {
      findings.push({
        id: `prior_batch_${batchId}_not_pass`,
        severity: 'P0',
        classification: 'REAL_DEFECT',
        detail: `${batchId} verdict=${b.verdict}`,
      });
    }
  }
  return { pass: rows.every((r) => r.pass), batches: rows };
}

function resolveHumanVerification(checklist) {
  const humanOk = process.env.TRAVELTRUST_FPC_B41_HUMAN_VERIFIED_OK === '1';
  const ownerOk = process.env.TRAVELTRUST_FPC_B41_OWNER_SIGNOFF_OK === '1';
  const signer = process.env.FPC_B41_HUMAN_VERIFIER || 'Sebastian Ward';
  return {
    human_verified: humanOk && ownerOk,
    human_verifier: humanOk && ownerOk ? signer : null,
    owner_sign_off:
      ownerOk && humanOk
        ? {
            status: 'SIGNED',
            signed_at_utc: new Date().toISOString(),
            signer,
            attestation:
              'Production Entry Review @ ② staging · human corridor walk · not ③ Production GO',
            env: checklist.owner_signoff_env,
          }
        : { status: 'PENDING', env: checklist.owner_signoff_env },
  };
}

module.exports = {
  loadAuthoritativeSha,
  verifyFrozenChainReadonly,
  probeRuntimeHealth,
  probeMetaSha,
  probeEnvironmentDiff,
  probeRegistryParity,
  runStagingInfraRecheck,
  classifyFindings,
  verifyB40DeployAnchor,
  probeBusinessLegalPages,
  probeSeoDiscovery,
  probeProductionEntryReviewSsot,
  runReleaseGates,
  runHygieneGates,
  verifyPriorBatchesPass,
  verifyAnchorBusinessCodeUnchanged,
  resolveHumanVerification,
  sh,
};
