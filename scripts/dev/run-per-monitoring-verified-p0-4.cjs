#!/usr/bin/env node
/**
 * PER P0-4 · Monitoring Verified (② Staging · read-only observability probes).
 *
 *   node scripts/dev/run-per-monitoring-verified-p0-4.cjs
 */
const {
  API,
  WEB,
  arg,
  check,
  requirePreviousSigned,
  writeReport,
  request,
} = require('./lib/per-production-prep-shared.cjs');

const META = {
  dir: 'per-monitoring-verified',
  file: 'PER-MONITORING-VERIFIED-P0-4.json',
  passKey: 'TT_PER_MONITORING_VERIFIED',
};

async function main() {
  const stamp =
    arg(process.argv, '--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const p0_3 = requirePreviousSigned('p0-3');
  const checks = [];

  checks.push(
    await check('prereq_p0_3_signed', 'PER P0-3 owner sign-off prerequisite', async () => ({
      expected_result: 'TT_PER_ROLLBACK_VERIFIED=PASS · owner_sign_off=SIGNED',
      actual_result: `${p0_3.TT_PER_ROLLBACK_VERIFIED} · ${p0_3.owner_sign_off.status}`,
      blockers: [],
      evidence_refs: ['evidence/GO_production_preparation/per-rollback-verified/PER-ROLLBACK-VERIFIED-P0-3-LATEST.json'],
    })),
  );

  checks.push(
    await check('metrics_endpoint', 'Prometheus /metrics', async () => {
      const r = await request(`${API}/metrics`);
      const ok =
        r.status === 200 &&
        r.text.includes('traveltrust_api_info') &&
        r.text.includes('http_requests_total');
      return {
        expected_result: 'HTTP 200 · traveltrust_api_info · http_requests_total',
        actual_result: `http=${r.status} bytes=${r.text.length}`,
        blockers: ok ? [] : ['/metrics missing expected series'],
        evidence_refs: [`${API}/metrics`],
      };
    }),
  );

  checks.push(
    await check('health_liveness', '/health liveness', async () => {
      const r = await request(`${API}/health`);
      return {
        expected_result: 'HTTP 200',
        actual_result: `http=${r.status}`,
        blockers: r.status === 200 ? [] : ['/health not 200'],
        evidence_refs: [`${API}/health`],
      };
    }),
  );

  checks.push(
    await check('health_ready', '/health/ready readiness', async () => {
      const r = await request(`${API}/health/ready`);
      const ok = r.status === 200 && (r.json?.database === 'ok' || r.json?.status === 'ok');
      return {
        expected_result: 'HTTP 200 · database ok',
        actual_result: `http=${r.status} database=${r.json?.database || 'n/a'}`,
        blockers: ok ? [] : ['/health/ready not ok'],
        evidence_refs: [`${API}/health/ready`],
      };
    }),
  );

  checks.push(
    await check('meta_observability', '/meta indexer + database signals', async () => {
      const r = await request(`${API}/meta`);
      const hasIndexer = Boolean(r.json?.indexer);
      const hasDb = r.json?.database_connected === true;
      const hasRateLimits = Boolean(r.json?.rate_limits);
      const ok = r.status === 200 && hasIndexer && hasDb && hasRateLimits;
      return {
        expected_result: 'meta has indexer · database_connected · rate_limits',
        actual_result: `indexer=${hasIndexer} db=${hasDb} rate_limits=${hasRateLimits}`,
        blockers: ok ? [] : ['meta observability sections incomplete'],
        evidence_refs: [`${API}/meta`],
      };
    }),
  );

  checks.push(
    await check('web_reachable', 'tt-web-staging /market', async () => {
      const r = await request(`${WEB}/market`, { timeoutMs: 25000 });
      return {
        expected_result: 'HTTP 200',
        actual_result: `http=${r.status}`,
        blockers: r.status === 200 ? [] : ['web not reachable'],
        evidence_refs: [`${WEB}/market`],
      };
    }),
  );

  const failCount = checks.filter((c) => c.loop_result === 'FAIL').length;
  const passCount = checks.filter((c) => c.loop_result === 'PASS').length;
  const overall = failCount === 0 ? 'PASS' : 'FAIL';

  const report = {
    schema: 'traveltrust.per_monitoring_verified_p0_4.v1',
    stamp_utc: stamp,
    phase: 'Production Preparation · PER Item 4 · Monitoring Verified',
    environment: { api: API, web: WEB, phase_note: '② staging observability · not ③ on-call GO' },
    prerequisite: {
      p0_3_ref: 'evidence/GO_production_preparation/per-rollback-verified/PER-ROLLBACK-VERIFIED-P0-3-LATEST.json',
      TT_PER_ROLLBACK_VERIFIED: p0_3.TT_PER_ROLLBACK_VERIFIED,
      TT_PER_P0_3_OWNER_SIGNOFF: p0_3.TT_PER_P0_3_OWNER_SIGNOFF || p0_3.owner_sign_off?.status,
    },
    per_track_item: 'monitoring',
    verification: checks,
    summary: { total: checks.length, pass: passCount, fail: failCount, blocking_items: [] },
    owner_sign_off: {
      status: overall === 'PASS' ? 'PENDING_OWNER' : 'BLOCKED',
      attestation: 'Sebastian Ward · Solo maintainer · PER P0-4 Monitoring Verified evidence pack',
      signed_at_utc: null,
    },
    [META.passKey]: overall,
    honest_boundary: 'PASS = staging metrics/health/meta probes · ≠ G3-04 Production on-call GO',
  };
  report.summary.blocking_items = checks.filter((c) => c.loop_result === 'FAIL').flatMap((c) => c.blockers);

  writeReport({ dir: META.dir, file: META.file }, stamp, report);
  console.log(`${META.passKey}: ${overall}`);
  console.log(`TT_PER_P0_4_PASS: ${passCount} FAIL: ${failCount}`);
  console.log(`TT_PER_EVIDENCE: evidence/GO_production_preparation/${META.dir}/${stamp}`);
  process.exit(failCount === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
