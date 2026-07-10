#!/usr/bin/env node
/**
 * FPC-100 Batch B41 · Production Entry Review @ ② staging
 *
 *   TRAVELTRUST_FPC_B41_STAGING_OK=1 node scripts/dev/run-fpc-batch-b41-production-entry-review.cjs
 *
 * Human + Owner (after machine PASS):
 *   TRAVELTRUST_FPC_B41_HUMAN_VERIFIED_OK=1 TRAVELTRUST_FPC_B41_OWNER_SIGNOFF_OK=1 \
 *     node scripts/dev/sign-fpc-b41-owner-production-entry-review.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B41-LATEST.json');
const EVID_DIR = path.join(EVID, 'B41-production-entry-review');
const CHECKLIST_PATH = path.join(
  EVID_DIR,
  'FPC-100-PRODUCTION-ENTRY-REVIEW-CHECKLIST-BASELINE.v1.json'
);

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const STAGING_API = process.env.STAGING_API || checklist.staging_endpoints?.api || 'https://tt-api-staging.fly.dev';
const STAGING_WEB = process.env.STAGING_WEB || checklist.staging_endpoints?.web || 'https://tt-web-staging.fly.dev';

const {
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
} = require('./lib/fpc-production-entry-probes.cjs');
const { assertCanRun, computeBurnDown, parseExecutionSequence } = require('./lib/fpc-batch-sequence.cjs');

function verifyOwnerAuth(findings) {
  const ok = process.env.TRAVELTRUST_FPC_B41_STAGING_OK === '1';
  if (!ok) {
    findings.push({
      id: 'owner_auth_missing',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail: 'Set TRAVELTRUST_FPC_B41_STAGING_OK=1',
    });
  }
  return { pass: ok, env: checklist.owner_auth_env };
}

function verifyLocalFinalFreeze(findings) {
  const p = path.join(EVID, 'FPC-100-LOCAL-FINAL-FREEZE-LATEST.json');
  if (!fs.existsSync(p)) {
    findings.push({
      id: 'local_final_freeze_missing',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: p,
    });
    return { pass: false };
  }
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const pass = j.pass === true && j.verdict === 'PASS';
  if (!pass) {
    findings.push({
      id: 'local_final_freeze_not_pass',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: j.verdict,
    });
  }
  return { pass, authoritative_immutable_head: j.authoritative_immutable_head };
}

(async () => {
  const stamp = new Date().toISOString();
  const governanceHead = sh('git rev-parse HEAD');
  const findings = [];

  const gate = assertCanRun('B41');
  if (!gate.ok) {
    findings.push({
      id: 'batch_sequence_blocked',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: gate.reason || gate.missing_prerequisites?.join(','),
    });
  }

  const ownerAuth = verifyOwnerAuth(findings);
  const localFreeze = verifyLocalFinalFreeze(findings);
  const anchor = loadAuthoritativeSha();
  if (!anchor.sha || !/^[0-9a-f]{40}$/.test(anchor.sha)) {
    findings.push({
      id: 'authoritative_sha_missing',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: 'Could not load authoritative_immutable_head',
    });
  }

  const frozenChain = verifyFrozenChainReadonly(findings);
  const b40Anchor = verifyB40DeployAnchor(findings);
  const priorBatches = verifyPriorBatchesPass(checklist, findings);
  const perSsot = probeProductionEntryReviewSsot(checklist, findings);
  const releaseGates = runReleaseGates(checklist, findings);
  const anchorFreeze = verifyAnchorBusinessCodeUnchanged(anchor.sha, findings);
  const hygieneGates = runHygieneGates(checklist, findings);

  const health = await probeRuntimeHealth(STAGING_API, STAGING_WEB, findings);
  const meta = await probeMetaSha(STAGING_API, anchor.sha, findings);
  const envDiff = await probeEnvironmentDiff(STAGING_API, STAGING_WEB, anchor.sha, checklist, findings);
  const registryParity = probeRegistryParity(anchor.sha, meta, findings);
  const stagingRecheck = runStagingInfraRecheck(STAGING_API, findings);
  const businessPages = await probeBusinessLegalPages(STAGING_WEB, checklist, findings);
  const seo = await probeSeoDiscovery(STAGING_WEB, checklist, findings);

  let webAlignment = { pass: false };
  try {
    sh(`bash scripts/dev/check-staging-web-alignment.sh --web-base "${STAGING_WEB}" --api-base "${STAGING_API}"`);
    webAlignment = { pass: true };
  } catch (e) {
    const detail = `${e.stdout || ''}${e.stderr || ''}`.slice(0, 2000);
    findings.push({
      id: 'staging_full_chain_alignment',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail,
    });
    webAlignment = { pass: false, detail };
  }

  const human = resolveHumanVerification(checklist);
  const classification = classifyFindings(findings);
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');

  const machineGatePass =
    gate.ok &&
    ownerAuth.pass &&
    localFreeze.pass &&
    frozenChain.pass &&
    b40Anchor.pass &&
    priorBatches.pass &&
    perSsot.pass &&
    releaseGates.pass &&
    anchorFreeze.pass &&
    health.pass &&
    meta.pass &&
    meta.sha_match &&
    registryParity.pass &&
    stagingRecheck.pass &&
    businessPages.pass &&
    seo.pass &&
    webAlignment.pass;

  const qualityPass = hygieneGates.pass && envDiff.pass && p0.length === 0;
  const businessVerdict = machineGatePass ? 'PASS' : 'FAIL';
  const qualityVerdict = qualityPass ? 'PASS' : machineGatePass ? 'IN_PROGRESS' : 'FAIL';
  const overallVerdict =
    machineGatePass && qualityPass && human.human_verified
      ? 'PASS'
      : businessVerdict === 'FAIL' || qualityVerdict === 'FAIL'
        ? 'FAIL'
        : 'IN_PROGRESS';

  const pass = overallVerdict === 'PASS';
  const burn = computeBurnDown(parseExecutionSequence());

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        phase: '② staging',
        authoritative_sha: anchor.sha,
        governance_head: governanceHead,
        probes: {
          b40Anchor,
          priorBatches,
          perSsot,
          releaseGates,
          anchorFreeze,
          hygieneGates,
          health,
          meta,
          envDiff,
          registryParity,
          stagingRecheck,
          businessPages,
          seo,
          webAlignment,
          human,
        },
        findings,
      },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B41',
    title: 'Production Entry Review · Business Readiness (② staging)',
    layer: 'business',
    phase: '② staging',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b41-production-entry-review.cjs',
    product_version: 'v1.0',
    code_anchor_commit: anchor.sha,
    authoritative_immutable_head: anchor.sha,
    git: { head: governanceHead, branch: sh('git branch --show-current') },
    depends_on: ['B00', 'B01', 'B40'],
    owner_authorization: {
      env: checklist.owner_auth_env,
      authorized: ownerAuth.pass,
    },
    local_final_freeze_ref: 'FPC-100-LOCAL-FINAL-FREEZE-LATEST.json',
    frozen_chain_readonly: frozenChain,
    staging_endpoints: { api: STAGING_API, web: STAGING_WEB },
    b40_deploy_anchor: b40Anchor,
    prior_batches: priorBatches,
    production_entry_review_ssot: perSsot,
    release_gates: releaseGates,
    anchor_business_code_freeze: anchorFreeze,
    hygiene_gates: hygieneGates,
    runtime_health: health,
    meta_sha: meta,
    environment_diff: envDiff,
    registry_parity: registryParity,
    fpc_staging_recheck: stagingRecheck,
    business_readiness: businessPages,
    seo_discovery: seo,
    staging_full_chain_alignment: webAlignment,
    finding_classification: classification,
    gate_pass: machineGatePass,
    business_certification: { verdict: businessVerdict, gate_pass: machineGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q12', 'Q16'],
    },
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? null : 'B41',
    phase_honesty: '② Production Entry Review PASS ≠ ③ Production GO',
    ai_review: {
      verdict: machineGatePass && qualityPass ? 'PASS' : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: human.human_verified,
    human_verifier: human.human_verifier,
    owner_sign_off: human.owner_sign_off,
    human_note:
      'Run sign-fpc-b41-owner-production-entry-review.cjs after machine PASS for human verification rollup',
    traceability: {
      requirements: [
        'B40 API anchor unchanged · meta SHA match',
        'Staging full-chain alignment (CORS · Sepolia · legal · SEO)',
        'Release gates + PER SSOT + prior batch PASS chain',
        'Human verification + Owner sign-off for final FPC rollup',
      ],
      spec_refs: [
        'FPC-100/B41-production-entry-review/FPC-100-PRODUCTION-ENTRY-REVIEW-CHECKLIST-BASELINE.v1.json',
        'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PRODUCTION-ENTRY-REVIEW.md',
        'registry/full-production-certification-checklist.v1.yaml',
        'docs/go-live-checklist.md',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B41-LATEST.json',
      certification_batch: 'B41',
      product_version: 'v1.0',
    },
    burn_down: burn,
  };

  if (pass) {
    const expiryDays = 30;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = anchor.sha;
  }

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B41: ${report.verdict}`);
  console.log(`anchor: ${anchor.sha}`);
  console.log(`staging_meta_sha: ${meta.staging_git_sha} match=${meta.sha_match}`);
  console.log(`machine_gate: ${machineGatePass} quality: ${qualityPass} human: ${human.human_verified}`);
  console.log(`classifications: ${JSON.stringify(classification)}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);

  if (pass) {
    try {
      sh('node scripts/dev/refresh-fpc-100-release-dashboard.cjs', ROOT);
    } catch {
      /* best-effort */
    }
  }

  process.exit(pass ? 0 : machineGatePass && qualityPass ? 3 : 1);
})();
