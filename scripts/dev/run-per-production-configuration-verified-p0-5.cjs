#!/usr/bin/env node
/**
 * PER P0-5 · Production Configuration Verified (② Staging · read-only config probes).
 *
 *   node scripts/dev/run-per-production-configuration-verified-p0-5.cjs
 */
const fs = require('fs');
const path = require('path');
const {
  ROOT,
  API,
  WEB,
  arg,
  check,
  requirePreviousSigned,
  writeReport,
  request,
} = require('./lib/per-production-prep-shared.cjs');

const META = {
  dir: 'per-production-configuration-verified',
  file: 'PER-PRODUCTION-CONFIGURATION-VERIFIED-P0-5.json',
  passKey: 'TT_PER_PRODUCTION_CONFIGURATION_VERIFIED',
};

function readRegistryExpected() {
  const example = path.join(ROOT, 'deploy/fly/tt-web-staging/build.env.example');
  if (!fs.existsSync(example)) return null;
  const line = fs
    .readFileSync(example, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('NEXT_PUBLIC_REGISTRY_ADDRESS='));
  if (!line) return null;
  return line.split('=').slice(1).join('=').trim().toLowerCase();
}

async function main() {
  const stamp =
    arg(process.argv, '--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const p0_4 = requirePreviousSigned('p0-4');
  const checks = [];
  const expectedRegistry = readRegistryExpected();

  checks.push(
    await check('prereq_p0_4_signed', 'PER P0-4 owner sign-off prerequisite', async () => ({
      expected_result: 'TT_PER_MONITORING_VERIFIED=PASS · owner_sign_off=SIGNED',
      actual_result: `${p0_4.TT_PER_MONITORING_VERIFIED} · ${p0_4.owner_sign_off.status}`,
      blockers: [],
      evidence_refs: ['evidence/GO_production_preparation/per-monitoring-verified/PER-MONITORING-VERIFIED-P0-4-LATEST.json'],
    })),
  );

  checks.push(
    await check('deployment_profile', 'Staging deployment_profile', async () => {
      const build = await request(`${API}/meta/build`);
      const meta = await request(`${API}/meta`);
      const profile = build.json?.deployment_profile || meta.json?.build?.deployment_profile;
      const ok = profile === 'staging';
      return {
        expected_result: 'deployment_profile=staging',
        actual_result: `profile=${profile || 'null'}`,
        blockers: ok ? [] : ['deployment_profile not staging'],
        evidence_refs: [`${API}/meta/build`, `${API}/meta`],
      };
    }),
  );

  checks.push(
    await check('registry_address_parity', 'Registry address vs build.env.example', async () => {
      const meta = await request(`${API}/meta`);
      const got = String(meta.json?.chain?.contracts?.registry_address || '').toLowerCase();
      const ok = Boolean(expectedRegistry) && got === expectedRegistry;
      return {
        expected_result: 'meta.chain.contracts.registry_address matches staging build.env.example',
        actual_result: `got=${got || 'empty'} expected=${expectedRegistry || 'missing file'}`,
        blockers: ok ? [] : ['registry address parity failed'],
        evidence_refs: [`${API}/meta`, 'deploy/fly/tt-web-staging/build.env.example'],
      };
    }),
  );

  checks.push(
    await check('internal_api_secret', 'internal_api_secret_configured', async () => {
      const meta = await request(`${API}/meta`);
      const ok = meta.json?.strict_mode?.internal_api_secret_configured === true;
      return {
        expected_result: 'strict_mode.internal_api_secret_configured=true',
        actual_result: `configured=${meta.json?.strict_mode?.internal_api_secret_configured}`,
        blockers: ok ? [] : ['internal API secret not configured on staging'],
        evidence_refs: [`${API}/meta`],
      };
    }),
  );

  checks.push(
    await check('fly_manifests', 'Staging fly.toml manifests on disk', async () => {
      const apiToml = path.join(ROOT, 'deploy/fly/tt-api-staging/fly.toml');
      const webToml = path.join(ROOT, 'deploy/fly/tt-web-staging/fly.toml');
      const ok = fs.existsSync(apiToml) && fs.existsSync(webToml);
      return {
        expected_result: 'tt-api-staging + tt-web-staging fly.toml present',
        actual_result: `api=${fs.existsSync(apiToml)} web=${fs.existsSync(webToml)}`,
        blockers: ok ? [] : ['staging fly manifests missing'],
        evidence_refs: ['deploy/fly/tt-api-staging/fly.toml', 'deploy/fly/tt-web-staging/fly.toml'],
      };
    }),
  );

  checks.push(
    await check('business_surface_config', 'Public surfaces still serving after config probe', async () => {
      const [disc, guides, hero] = await Promise.all([
        request(`${API}/api/v1/discover/orders?limit=3`),
        request(`${API}/api/v1/guides?limit=3`),
        request(`${API}/api/v1/official/cold-start/surfaces/home_hero`),
      ]);
      const ok =
        disc.status === 200 &&
        (disc.json?.items || []).length > 0 &&
        guides.status === 200 &&
        (guides.json?.items || []).length > 0 &&
        hero.status === 200 &&
        hero.json?.status === 'ok';
      return {
        expected_result: 'discover + guides + home_hero ok',
        actual_result: `orders=${(disc.json?.items || []).length} guides=${(guides.json?.items || []).length} hero=${hero.json?.status}`,
        blockers: ok ? [] : ['public surfaces degraded after config probe'],
        evidence_refs: [`${API}/api/v1/discover/orders`, `${API}/api/v1/guides`],
      };
    }),
  );

  const failCount = checks.filter((c) => c.loop_result === 'FAIL').length;
  const passCount = checks.filter((c) => c.loop_result === 'PASS').length;
  const overall = failCount === 0 ? 'PASS' : 'FAIL';

  const report = {
    schema: 'traveltrust.per_production_configuration_verified_p0_5.v1',
    stamp_utc: stamp,
    phase: 'Production Preparation · PER Item 5 · Production Configuration Verified',
    environment: { api: API, web: WEB, phase_note: '② staging config parity · not ③ Production cutover' },
    prerequisite: {
      p0_4_ref: 'evidence/GO_production_preparation/per-monitoring-verified/PER-MONITORING-VERIFIED-P0-4-LATEST.json',
      TT_PER_MONITORING_VERIFIED: p0_4.TT_PER_MONITORING_VERIFIED,
      TT_PER_P0_4_OWNER_SIGNOFF: p0_4.TT_PER_P0_4_OWNER_SIGNOFF || p0_4.owner_sign_off?.status,
    },
    per_track_item: 'production_configuration',
    verification: checks,
    summary: {
      total: checks.length,
      pass: passCount,
      fail: failCount,
      blocking_items: checks.filter((c) => c.loop_result === 'FAIL').flatMap((c) => c.blockers),
    },
    owner_sign_off: {
      status: overall === 'PASS' ? 'PENDING_OWNER' : 'BLOCKED',
      attestation: 'Sebastian Ward · Solo maintainer · PER P0-5 Production Configuration Verified evidence pack',
      signed_at_utc: null,
    },
    [META.passKey]: overall,
    honest_boundary: 'PASS = staging config/runtime parity probes · ≠ ③ Production GO · ≠ CMS Wave1',
  };

  writeReport({ dir: META.dir, file: META.file }, stamp, report);
  console.log(`${META.passKey}: ${overall}`);
  console.log(`TT_PER_P0_5_PASS: ${passCount} FAIL: ${failCount}`);
  console.log(`TT_PER_EVIDENCE: evidence/GO_production_preparation/${META.dir}/${stamp}`);
  process.exit(failCount === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
