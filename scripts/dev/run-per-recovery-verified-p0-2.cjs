#!/usr/bin/env node
/**
 * PER P0-2 · Recovery Verified (② Staging · no business code changes).
 *
 * Prerequisite: PER P0-1 owner sign-off SIGNED
 *
 *   node scripts/dev/run-per-recovery-verified-p0-2.cjs
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../..');
const P0_1_LATEST = path.join(
  ROOT,
  'evidence/GO_production_preparation/per-business-closed-loop/PER-BUSINESS-CLOSED-LOOP-P0-LATEST.json',
);
const B475_BASELINE = path.join(ROOT, 'evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_preparation/per-recovery-verified');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function request(url, opts = {}) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (url.startsWith('https') ? 443 : 80),
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: opts.headers || {},
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(d);
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode || 0, json, text: d });
        });
      },
    );
    req.on('error', (e) => resolve({ status: 0, json: null, text: String(e) }));
    req.setTimeout(opts.timeoutMs || 20000, () => {
      req.destroy();
      resolve({ status: 0, json: null, text: 'timeout' });
    });
    req.end();
  });
}

function check(id, title, fn) {
  return fn().then((detail) => ({
    id,
    title,
    ...detail,
    loop_result: detail.blockers?.length ? 'FAIL' : 'PASS',
  }));
}

async function main() {
  const stamp =
    arg('--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  if (!fs.existsSync(P0_1_LATEST)) {
    console.error('PER P0-1 LATEST missing — run P0-1 first');
    process.exit(2);
  }
  const p0_1 = JSON.parse(fs.readFileSync(P0_1_LATEST, 'utf8'));
  if (p0_1.TT_PER_BUSINESS_CLOSED_LOOP !== 'PASS') {
    console.error('PER P0-1 not PASS');
    process.exit(2);
  }
  if (p0_1.owner_sign_off?.status !== 'SIGNED') {
    console.error('PER P0-1 owner sign-off not SIGNED');
    process.exit(2);
  }

  const checks = [];

  checks.push(
    await check('prereq_p0_1_signed', 'PER P0-1 owner sign-off prerequisite', async () => ({
      expected_result: 'TT_PER_BUSINESS_CLOSED_LOOP=PASS · owner_sign_off=SIGNED',
      actual_result: `${p0_1.TT_PER_BUSINESS_CLOSED_LOOP} · ${p0_1.owner_sign_off.status}`,
      blockers: [],
      evidence_refs: ['evidence/GO_production_preparation/per-business-closed-loop/PER-BUSINESS-CLOSED-LOOP-P0-LATEST.json'],
    })),
  );

  checks.push(
    await check('api_health', 'API liveness /health', async () => {
      const r = await request(`${API}/health`);
      const ok = r.status === 200;
      return {
        expected_result: 'HTTP 200',
        actual_result: `http=${r.status}`,
        blockers: ok ? [] : ['API /health not 200'],
        evidence_refs: [`${API}/health`],
      };
    }),
  );

  checks.push(
    await check('api_ready', 'API readiness /health/ready', async () => {
      const r = await request(`${API}/health/ready`);
      const ok = r.status === 200;
      return {
        expected_result: 'HTTP 200 · ready for traffic',
        actual_result: `http=${r.status}`,
        blockers: ok ? [] : ['API /health/ready not 200'],
        evidence_refs: [`${API}/health/ready`],
      };
    }),
  );

  checks.push(
    await check('meta_database', 'Meta database_connected', async () => {
      const r = await request(`${API}/meta`);
      const connected = r.json?.database_connected === true || r.json?.database?.connected === true;
      const ready = await request(`${API}/health/ready`);
      const readyDb = ready.json?.database === 'ok';
      const ok = r.status === 200 && connected && ready.status === 200 && readyDb;
      return {
        expected_result: 'GET /meta database_connected=true · /health/ready database=ok',
        actual_result: `meta=${r.status} connected=${connected} ready=${ready.status} ready_db=${ready.json?.database}`,
        blockers: ok ? [] : ['database recovery signal not ok on meta/ready'],
        evidence_refs: [`${API}/meta`, `${API}/health/ready`],
      };
    }),
  );

  checks.push(
    await check('business_continuity_discover', 'P0-1 discover continuity', async () => {
      const r = await request(`${API}/api/v1/discover/orders?limit=5`);
      const n = (r.json?.items || []).length;
      const ok = r.status === 200 && n > 0;
      return {
        expected_result: 'discover/orders non-empty after P0-1 restore',
        actual_result: `http=${r.status} items=${n}`,
        blockers: ok ? [] : ['discover/orders empty — business continuity broken'],
        evidence_refs: [`${API}/api/v1/discover/orders`],
      };
    }),
  );

  checks.push(
    await check('business_continuity_guides', 'Public guides catalog', async () => {
      const r = await request(`${API}/api/v1/guides?limit=5`);
      const n = (r.json?.items || []).length;
      const ok = r.status === 200 && n > 0;
      return {
        expected_result: 'guides list non-empty',
        actual_result: `http=${r.status} items=${n}`,
        blockers: ok ? [] : ['guides empty on staging'],
        evidence_refs: [`${API}/api/v1/guides`],
      };
    }),
  );

  checks.push(
    await check('business_continuity_community', 'Community feed', async () => {
      const r = await request(`${API}/api/v1/community/feed?limit=5`);
      const n = (r.json?.posts || []).length;
      const ok = r.status === 200 && n > 0;
      return {
        expected_result: 'community feed non-empty',
        actual_result: `http=${r.status} posts=${n}`,
        blockers: ok ? [] : ['community feed empty'],
        evidence_refs: [`${API}/api/v1/community/feed`],
      };
    }),
  );

  checks.push(
    await check('web_market', 'Web /market reachable', async () => {
      const r = await request(`${WEB}/market`, { timeoutMs: 25000 });
      const ok = r.status === 200;
      return {
        expected_result: 'tt-web-staging /market HTTP 200',
        actual_result: `http=${r.status}`,
        blockers: ok ? [] : ['web /market not 200'],
        evidence_refs: [`${WEB}/market`],
      };
    }),
  );

  checks.push(
    await check('restore_drill_baseline', 'B-475 restore drill baseline on file', async () => {
      if (!fs.existsSync(B475_BASELINE)) {
        return {
          expected_result: 'baseline_record.v1.json present with last_restore_drill_utc',
          actual_result: 'missing baseline file',
          blockers: ['b475 baseline missing'],
          evidence_refs: ['evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json'],
        };
      }
      const baseline = JSON.parse(fs.readFileSync(B475_BASELINE, 'utf8'));
      const drill = baseline.last_restore_drill_utc;
      const ok = Boolean(drill) && (baseline.status === 'PASS' || baseline.status === 'PLANNED');
      return {
        expected_result: 'restore drill UTC recorded · status PASS or PLANNED',
        actual_result: `status=${baseline.status} last_restore_drill_utc=${drill || 'none'}`,
        blockers: ok ? [] : ['restore drill baseline incomplete'],
        evidence_refs: ['evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json'],
      };
    }),
  );

  const failCount = checks.filter((c) => c.loop_result === 'FAIL').length;
  const passCount = checks.filter((c) => c.loop_result === 'PASS').length;
  const overall = failCount === 0 ? 'PASS' : 'FAIL';

  const report = {
    schema: 'traveltrust.per_recovery_verified_p0_2.v1',
    stamp_utc: stamp,
    phase: 'Production Preparation · PER Item 2 · Recovery Verified',
    environment: {
      api: API,
      web: WEB,
      phase_note: '② staging recovery continuity · not ③ Production GO',
    },
    prerequisite: {
      p0_1_ref: 'evidence/GO_production_preparation/per-business-closed-loop/PER-BUSINESS-CLOSED-LOOP-P0-LATEST.json',
      TT_PER_BUSINESS_CLOSED_LOOP: p0_1.TT_PER_BUSINESS_CLOSED_LOOP,
      TT_PER_P0_1_OWNER_SIGNOFF: p0_1.TT_PER_P0_1_OWNER_SIGNOFF || p0_1.owner_sign_off?.status,
    },
    per_track_item: 'recovery',
    verification: checks,
    summary: {
      total: checks.length,
      pass: passCount,
      fail: failCount,
      blocking_items: checks.filter((c) => c.loop_result === 'FAIL').flatMap((c) => c.blockers),
    },
    owner_sign_off: {
      status: overall === 'PASS' ? 'PENDING_OWNER' : 'BLOCKED',
      attestation: 'Sebastian Ward · Solo maintainer · PER P0-2 Recovery Verified evidence pack',
      signed_at_utc: null,
    },
    TT_PER_RECOVERY_VERIFIED: overall,
    honest_boundary: 'PASS = staging recovery continuity probes · ≠ full DR failover · ≠ Production GO',
  };

  const outDir = path.join(EVID_ROOT, stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'PER-RECOVERY-VERIFIED-P0-2.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(EVID_ROOT, 'PER-RECOVERY-VERIFIED-P0-2-LATEST.json'),
    JSON.stringify(report, null, 2) + '\n',
  );

  console.log(`TT_PER_RECOVERY_VERIFIED: ${overall}`);
  console.log(`TT_PER_P0_2_PASS: ${passCount} FAIL: ${failCount}`);
  console.log(`TT_PER_EVIDENCE: evidence/GO_production_preparation/per-recovery-verified/${stamp}`);
  process.exit(failCount === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
