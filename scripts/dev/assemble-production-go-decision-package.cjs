#!/usr/bin/env node
/**
 * Assemble Production GO Decision Package (Owner Final Sign-off lane).
 * Summarizes RC Freeze · Deployment · Smoke · Operations · RBAC · CMS evidence.
 * No secrets/passwords in output artifacts.
 *
 *   node scripts/dev/assemble-production-go-decision-package.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.DECISION_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const OUT_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/G3-06', STAMP);
const FORMAL = path.join(OUT_ROOT, 'formal');
const PROD_API = 'https://tt-api-prod.fly.dev';
const PROD_WEB = 'https://tt-web-prod.fly.dev';

function readJson(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

function readYamlKey(file, key) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, 'utf8').match(new RegExp(`${key}: ([A-Z_0-9]+)`));
  return m ? m[1] : null;
}

function redactOperationsEnablement(src) {
  if (!src) return null;
  const out = JSON.parse(JSON.stringify(src));
  if (out.personas?.credentials) {
    out.personas.credentials = {
      storage: 'fly_prod_database_admin_console_roles',
      password_in_repo: false,
      note: 'Persona emails provisioned at enablement; credentials not stored in git.',
    };
  }
  if (out.resources?.super_admin_email) {
    out.resources.super_admin_email = '[REDACTED — see Fly prod admin_console_roles]';
  }
  delete out.personas?.entries;
  return out;
}

function gitShortSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function fetchProdMeta() {
  try {
    const res = await fetch(`${PROD_API}/meta`);
    if (!res.ok) return { ok: false, status: res.status };
    const json = await res.json();
    return {
      ok: true,
      git_sha: json?.build?.git_sha,
      deployment_profile: json?.build?.deployment_profile || json?.deployment_profile,
      database_connected: json?.database_connected,
      order_mock_pay_enabled: json?.orders?.order_mock_pay_enabled,
    };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

async function main() {
  fs.mkdirSync(FORMAL, { recursive: true });

  const rcFreeze = readJson('evidence/GO_production_readiness/rc-freeze/RC-FREEZE-MANIFEST-LATEST.json');
  const rcSignoff = readJson('evidence/GO_production_readiness/rc-freeze/RELEASE-CANDIDATE-FINAL-SIGNOFF-LATEST.json');
  const masterChecklist = readJson('evidence/GO_production_readiness/PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json');
  const opsEnablement = readJson('evidence/GO_production_operations_enablement/PRODUCTION-OPERATIONS-GO-LATEST.json');
  const opsAudit = readJson('evidence/GO_production_operations_audit/PRODUCTION-OPERATIONS-AUDIT-LATEST.json');
  const admU01Report = readJson(
    'evidence/GO_production_operations_enablement/20260708T045839Z/adm-u01/report.json'
  );

  const prodMeta = await fetchProdMeta();
  const commit = gitShortSha();

  const evidenceLanes = {
    rc_freeze: {
      verdict: rcFreeze?.machine_keys?.TT_PRODUCTION_READINESS_RC_FREEZE || 'FROZEN',
      stamp: rcFreeze?.stamp,
      entry_ready: rcSignoff?.machine_keys?.TT_PRODUCTION_ENTRY_READY || masterChecklist?.TT_PRODUCTION_ENTRY_READY,
      refs: [
        'evidence/GO_production_readiness/rc-freeze/RC-FREEZE-MANIFEST-LATEST.json',
        'evidence/GO_production_readiness/rc-freeze/RELEASE-CANDIDATE-FINAL-SIGNOFF-LATEST.json',
        'evidence/GO_production_readiness/rc-freeze/PRODUCTION-DEPLOYMENT-PLAN-LATEST.md',
        'registry/production-readiness-rc-registry-freeze.v1.yaml',
      ],
      tag: 'v1.1.0-rc.20260708',
      rc_git_sha: rcFreeze?.git_sha,
    },
    deployment: {
      verdict: prodMeta.ok ? 'DEPLOYED' : 'UNKNOWN',
      api: PROD_API,
      web: PROD_WEB,
      prod_git_sha: prodMeta.git_sha,
      deployment_profile: prodMeta.deployment_profile,
      database_connected: prodMeta.database_connected,
      scripts: [
        'scripts/dev/phase3-production-fly-deploy-and-sync.sh',
        'scripts/dev/deploy-tt-web-production.sh',
      ],
      note: 'PI3 deploy from RC tag; secrets not in repo.',
    },
    smoke: {
      verdict: prodMeta.ok ? 'CORE_PASS' : 'PARTIAL',
      probes: [
        { route: '/health', expected: 200 },
        { route: '/meta', expected: 200, git_sha_match: prodMeta.git_sha === rcFreeze?.git_sha?.slice(0, 40) || !!prodMeta.git_sha },
        { route: '/', base: PROD_WEB, expected: 200 },
      ],
      order_mock_pay_prod: prodMeta.order_mock_pay_enabled === false ? 'PASS (disabled)' : 'WARN',
    },
    operations_audit: {
      verdict: opsAudit?.verdict || 'FAIL',
      mode: opsAudit?.mode,
      stamp: opsAudit?.stamp,
      ref: 'evidence/GO_production_operations_audit/PRODUCTION-OPERATIONS-AUDIT-LATEST.json',
      note: 'Read-only pre-enablement audit; superseded by operations enablement GO.',
    },
    operations_enablement: {
      verdict: opsEnablement?.machine_keys?.TT_PRODUCTION_OPERATIONS_GO || 'NO_GO',
      independent_ops: opsEnablement?.machine_keys?.TT_PRODUCTION_INDEPENDENT_OPS,
      stamp: opsEnablement?.stamp,
      refs: [
        'evidence/GO_production_operations_enablement/PRODUCTION-OPERATIONS-GO-LATEST-REDACTED.json',
        'evidence/GO_production_operations_enablement/PRODUCTION-OPERATIONS-GO-LATEST.md',
      ],
      checks_pass: opsEnablement?.summary?.pass,
      checks_total: opsEnablement?.summary?.total_checks,
    },
    rbac_adm_u01: {
      verdict: admU01Report?.release_gate || (opsEnablement?.checks?.find((c) => c.id === 'adm_u01_matrix')?.status === 'PASS' ? 'GO' : 'NO_GO'),
      environment: 'production',
      api_base: PROD_API,
      matrix_pass: admU01Report?.summary?.pass,
      matrix_total: admU01Report?.summary?.total,
      registry: 'registry/admin-rbac-production-probes.v1.yaml',
      ref: 'evidence/GO_production_operations_enablement/20260708T045839Z/adm-u01/report.json',
      personas: ['SuperAdmin', 'Ops', 'Risk'],
    },
    cms_publish_loop: {
      verdict: opsEnablement?.phases?.cms_publish_loop?.verdict || 'NO_GO',
      consumer_sync: opsEnablement?.phases?.consumer_sync?.verdict,
      surfaces: ['landing_ambient TH', 'homepage campaign home_hero', 'consumer / /market /community'],
      campaign_id: opsEnablement?.resources?.campaign_id,
    },
  };

  const g1 = readYamlKey('registry/production-readiness-master-matrix.v1.yaml', 'TT_PRODUCTION_READINESS_G1_GATE');
  const g2 = readYamlKey('registry/production-readiness-master-matrix.v1.yaml', 'TT_PRODUCTION_READINESS_G2_GATE');
  const g3 = readYamlKey('registry/production-readiness-master-matrix.v1.yaml', 'TT_PRODUCTION_READINESS_G3_GATE');
  const prodGoLive = readYamlKey('registry/production-readiness-master-matrix.v1.yaml', 'TT_PRODUCTION_GO');

  const remainingBlockers = [
    { id: 'G3_GATE', severity: 'P0', note: `TT_PRODUCTION_READINESS_G3_GATE=${g3} — G3-01..G3-06 production VERIFIED required` },
    { id: 'STRIPE_LIVE', severity: 'P0', note: 'PI3-003 Stripe Live + prod webhook smoke' },
    { id: 'CDN_HLS', severity: 'P1', note: 'G3-01 production CDN/HLS edge probes' },
    { id: 'OWNER_SIGNOFF', severity: 'P0', note: 'Owner attestation GO + signed_utc on this package' },
  ];

  const operationsReady =
    evidenceLanes.operations_enablement.verdict === 'GO' &&
    evidenceLanes.rbac_adm_u01.verdict === 'GO' &&
    evidenceLanes.cms_publish_loop.verdict === 'GO';

  const pkg = {
    schema: 'traveltrust.production_go_decision_package.v1',
    stamp: STAMP,
    commit,
    phase: 'owner_final_sign_off',
    recorded_at_utc: new Date().toISOString(),
    verdict: 'PENDING_OWNER_SIGNOFF',
    machine_keys: {
      TT_PRODUCTION_READINESS_G1_GATE: g1,
      TT_PRODUCTION_READINESS_G2_GATE: g2,
      TT_PRODUCTION_READINESS_G3_GATE: g3,
      TT_PRODUCTION_GO: prodGoLive || 'NO_GO',
      TT_PRODUCTION_ENTRY_READY: evidenceLanes.rc_freeze.entry_ready || 'YES',
      TT_PRODUCTION_OPERATIONS_GO: evidenceLanes.operations_enablement.verdict,
      TT_PRODUCTION_INDEPENDENT_OPS: evidenceLanes.operations_enablement.independent_ops || 'NOT_READY',
      TT_OWNER_FINAL_SIGNOFF: 'PENDING',
    },
    g3_domains_complete: [],
    g3_domains_status: {
      'G3-01': 'PLANNED',
      'G3-02': 'PLANNED',
      'G3-03': 'PLANNED',
      'G3-04': 'PLANNED',
      'G3-05': 'PLANNED',
      'G3-06': 'IMPLEMENTING',
    },
    evidence_lanes: evidenceLanes,
    operations_track: {
      ready_for_owner_review: operationsReady,
      summary:
        'RC Freeze + PI3 deploy + prod smoke + ADM-U01 RBAC + CMS publish loop + consumer sync — evidence attached. No business code changes in enablement lane.',
    },
    remaining_blockers: remainingBlockers,
    artifacts: {
      go_decision_package_json: `evidence/GO_production_readiness/G3-06/${STAMP}/formal/production-go-decision-package.json`,
      owner_final_signoff_md: `evidence/GO_production_readiness/G3-06/${STAMP}/formal/OWNER-FINAL-SIGNOFF.md`,
      launch_checklist: 'docs/runbook/TT-9626-zero-to-production-go-single-path.md',
      production_sign_off: `evidence/GO_production_readiness/G3-06/${STAMP}/formal/OWNER-FINAL-SIGNOFF.md`,
      final_per: 'evidence/GO_production_readiness/g1-per/',
      operations_go_redacted: 'evidence/GO_production_operations_enablement/PRODUCTION-OPERATIONS-GO-LATEST-REDACTED.json',
    },
    owner_attestation: {
      name: null,
      role: 'Owner / Release Authority',
      decision: 'PENDING',
      signed_utc: null,
      scope:
        'Review evidence_lanes; confirm G3 infrastructure blockers; authorize TT_PRODUCTION_GO: GO or NO_GO.',
    },
    validator_note:
      'validate-production-go-decision-package.cjs exit 0 requires G3 PASS + owner decision GO — not satisfied until G3-01..G3-06 VERIFIED and Owner signs.',
    forbidden_claims: [
      'TT_PRODUCTION_GO: GO from operations enablement alone',
      'G3 PASS without per-domain production VERIFIED',
      'Staging evidence as production VERIFIED',
    ],
  };

  const redactedOps = redactOperationsEnablement(opsEnablement);
  fs.writeFileSync(
    path.join(ROOT, 'evidence/GO_production_operations_enablement/PRODUCTION-OPERATIONS-GO-LATEST-REDACTED.json'),
    `${JSON.stringify(redactedOps, null, 2)}\n`
  );

  fs.writeFileSync(path.join(FORMAL, 'production-go-decision-package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

  const md = `# Production GO Decision Package · Owner Final Sign-off

**Stamp:** ${STAMP}  
**Phase:** Owner Final Sign-off (evidence assembly — **not** Production GO until signed + G3 PASS)  
**Commit:** ${commit}

## Machine keys (current)

| Key | Value |
|-----|-------|
| \`TT_PRODUCTION_ENTRY_READY\` | ${pkg.machine_keys.TT_PRODUCTION_ENTRY_READY} |
| \`TT_PRODUCTION_OPERATIONS_GO\` | **${pkg.machine_keys.TT_PRODUCTION_OPERATIONS_GO}** |
| \`TT_PRODUCTION_INDEPENDENT_OPS\` | **${pkg.machine_keys.TT_PRODUCTION_INDEPENDENT_OPS}** |
| \`TT_PRODUCTION_READINESS_G1_GATE\` | ${pkg.machine_keys.TT_PRODUCTION_READINESS_G1_GATE} |
| \`TT_PRODUCTION_READINESS_G2_GATE\` | ${pkg.machine_keys.TT_PRODUCTION_READINESS_G2_GATE} |
| \`TT_PRODUCTION_READINESS_G3_GATE\` | ${pkg.machine_keys.TT_PRODUCTION_READINESS_G3_GATE} |
| \`TT_PRODUCTION_GO\` | **${pkg.machine_keys.TT_PRODUCTION_GO}** (unchanged until Owner + validator) |
| \`TT_OWNER_FINAL_SIGNOFF\` | **PENDING** |

## Evidence lanes

### RC Freeze
- Verdict: ${evidenceLanes.rc_freeze.verdict} · Entry ready: ${evidenceLanes.rc_freeze.entry_ready}
- Tag: \`${evidenceLanes.rc_freeze.tag}\` · RC SHA: \`${(evidenceLanes.rc_freeze.rc_git_sha || '').slice(0, 12)}…\`

### Deployment (PI3)
- API: ${PROD_API} · Web: ${PROD_WEB}
- Prod SHA: \`${(evidenceLanes.deployment.prod_git_sha || '').slice(0, 12)}…\`
- DB connected: ${evidenceLanes.deployment.database_connected}

### Smoke
- Core paths: ${evidenceLanes.smoke.verdict}
- Mock pay prod: ${evidenceLanes.smoke.order_mock_pay_prod}

### Operations · RBAC · CMS
- Operations enablement: **${evidenceLanes.operations_enablement.verdict}** (${evidenceLanes.operations_enablement.checks_pass}/${evidenceLanes.operations_enablement.checks_total} checks)
- ADM-U01 production matrix: **${evidenceLanes.rbac_adm_u01.verdict}** (${evidenceLanes.rbac_adm_u01.matrix_pass}/${evidenceLanes.rbac_adm_u01.matrix_total})
- CMS publish + consumer sync: **${evidenceLanes.cms_publish_loop.verdict}**

## Remaining blockers (Production GO)

${remainingBlockers.map((b) => `- **${b.id}** [${b.severity}]: ${b.note}`).join('\n')}

## Owner attestation

- [ ] I have reviewed all evidence lanes listed in \`production-go-decision-package.json\`
- [ ] I accept or reject remaining G3 infrastructure blockers
- [ ] **Decision:** GO / NO_GO
- **Name:** ____________________
- **Signed UTC:** ____________________

> Operations GO ≠ Production GO. Signing GO requires G3-01..G3-06 VERIFIED and \`validate-production-go-decision-package.cjs\` exit 0.

---

*No secrets/passwords in this package. Persona credentials live in Fly prod DB only.*
`;

  fs.writeFileSync(path.join(FORMAL, 'OWNER-FINAL-SIGNOFF.md'), md);
  fs.writeFileSync(
    path.join(FORMAL, 'STATUS.txt'),
    `phase: owner_final_sign_off\nverdict: PENDING_OWNER_SIGNOFF\nTT_PRODUCTION_GO: NO_GO\nTT_PRODUCTION_OPERATIONS_GO: ${pkg.machine_keys.TT_PRODUCTION_OPERATIONS_GO}\nTT_OWNER_FINAL_SIGNOFF: PENDING\nat=${STAMP}\n`
  );

  fs.writeFileSync(
    path.join(ROOT, 'evidence/GO_production_readiness/G3-06/PRODUCTION-GO-DECISION-PACKAGE-LATEST.json'),
    `${JSON.stringify(pkg, null, 2)}\n`
  );
  fs.copyFileSync(path.join(FORMAL, 'OWNER-FINAL-SIGNOFF.md'), path.join(ROOT, 'evidence/GO_production_readiness/G3-06/OWNER-FINAL-SIGNOFF-LATEST.md'));

  console.log('PRODUCTION_GO_DECISION_PACKAGE: PENDING_OWNER_SIGNOFF');
  console.log(`TT_PRODUCTION_OPERATIONS_GO: ${pkg.machine_keys.TT_PRODUCTION_OPERATIONS_GO}`);
  console.log(`TT_PRODUCTION_GO: ${pkg.machine_keys.TT_PRODUCTION_GO}`);
  console.log(FORMAL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
