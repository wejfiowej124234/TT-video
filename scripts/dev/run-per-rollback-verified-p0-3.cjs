#!/usr/bin/env node
/**
 * PER P0-3 · Rollback Verified (② Staging · Admin Public Ops rollback loop).
 *
 *   node scripts/dev/run-per-rollback-verified-p0-3.cjs
 */
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const {
  API,
  WEB,
  arg,
  check,
  requirePreviousSigned,
  writeReport,
  sleep,
  request,
} = require('./lib/per-production-prep-shared.cjs');

const META = {
  dir: 'per-rollback-verified',
  file: 'PER-ROLLBACK-VERIFIED-P0-3.json',
  latestName: 'PER-ROLLBACK-VERIFIED-P0-3-LATEST.json',
  passKey: 'TT_PER_ROLLBACK_VERIFIED',
};

function feedIds(json) {
  return (json?.posts || []).map((p) => String(p.id || p.post_id || '')).filter(Boolean);
}

async function main() {
  const stamp =
    arg(process.argv, '--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const p0_2 = requirePreviousSigned('p0-2');
  const client = createClient(API);
  const adminTok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!',
  );

  const checks = [];

  checks.push(
    await check('prereq_p0_2_signed', 'PER P0-2 owner sign-off prerequisite', async () => ({
      expected_result: 'TT_PER_RECOVERY_VERIFIED=PASS · owner_sign_off=SIGNED',
      actual_result: `${p0_2.TT_PER_RECOVERY_VERIFIED} · ${p0_2.owner_sign_off.status}`,
      blockers: [],
      evidence_refs: ['evidence/GO_production_preparation/per-recovery-verified/PER-RECOVERY-VERIFIED-P0-2-LATEST.json'],
    })),
  );

  let postId = null;
  const feed = await client.req('GET', '/api/v1/community/feed?limit=50');
  if (feed.status === 200) {
    const ids = feedIds(feed.json);
    if (ids.length) postId = ids[0];
  }

  if (!postId) {
    checks.push(
      await check('rollback_baseline', 'Community feed baseline for rollback probe', async () => ({
        expected_result: 'public post available for unpublish/publish restore loop',
        actual_result: 'no feed posts',
        blockers: ['no community post for rollback probe'],
        evidence_refs: [`${API}/api/v1/community/feed`],
      })),
    );
  } else {
    const unp = await client.unpublishEntity(adminTok, 'community_posts', postId);
    await sleep(500);
    const feedAfter = await client.req('GET', '/api/v1/community/feed?limit=200');
    const hidden = !feedIds(feedAfter.json).includes(String(postId));
    const detail = await client.req('GET', `/api/v1/community/posts/${postId}`);
    const detailHidden = !detail.json?.post?.id;

    checks.push(
      await check('rollback_unpublish', 'Admin unpublish rollback path', async () => ({
        expected_result: 'unpublish 2xx · post hidden from feed + detail',
        actual_result: `unpub=${unp.status} feed_hidden=${hidden} detail_hidden=${detailHidden}`,
        blockers:
          unp.status >= 200 && unp.status < 300 && hidden && detailHidden
            ? []
            : ['unpublish rollback path failed'],
        evidence_refs: [`${API}/api/v1/admin/official/public-operations/entities/community_posts/${postId}/unpublish`],
      })),
    );

    const pub = await client.publishEntity(adminTok, 'community_posts', postId);
    await sleep(500);
    const feedRest = await client.req('GET', '/api/v1/community/feed?limit=200');
    const restored = feedIds(feedRest.json).includes(String(postId));

    checks.push(
      await check('rollback_restore', 'Admin publish restore after rollback', async () => ({
        expected_result: 'publish 2xx · post back in feed',
        actual_result: `pub=${pub.status} feed_restored=${restored}`,
        blockers: pub.status >= 200 && pub.status < 300 && restored ? [] : ['publish restore failed'],
        evidence_refs: [`${API}/api/v1/admin/official/public-operations/entities/community_posts/${postId}/publish`],
      })),
    );
  }

  checks.push(
    await check('discover_continuity', 'Discover continuity after rollback probe', async () => {
      const r = await request(`${API}/api/v1/discover/orders?limit=3`);
      const n = (r.json?.items || []).length;
      return {
        expected_result: 'discover/orders still non-empty',
        actual_result: `items=${n}`,
        blockers: n > 0 ? [] : ['discover empty after rollback probe'],
        evidence_refs: [`${API}/api/v1/discover/orders`],
      };
    }),
  );

  checks.push(
    await check('web_market', 'Web /market still 200', async () => {
      const r = await request(`${WEB}/market`, { timeoutMs: 25000 });
      return {
        expected_result: 'HTTP 200',
        actual_result: `http=${r.status}`,
        blockers: r.status === 200 ? [] : ['web /market not 200'],
        evidence_refs: [`${WEB}/market`],
      };
    }),
  );

  const failCount = checks.filter((c) => c.loop_result === 'FAIL').length;
  const passCount = checks.filter((c) => c.loop_result === 'PASS').length;
  const overall = failCount === 0 ? 'PASS' : 'FAIL';

  const report = {
    schema: 'traveltrust.per_rollback_verified_p0_3.v1',
    stamp_utc: stamp,
    phase: 'Production Preparation · PER Item 3 · Rollback Verified',
    environment: { api: API, web: WEB, phase_note: '② staging rollback loop · not ③ Production GO' },
    prerequisite: {
      p0_2_ref: 'evidence/GO_production_preparation/per-recovery-verified/PER-RECOVERY-VERIFIED-P0-2-LATEST.json',
      TT_PER_RECOVERY_VERIFIED: p0_2.TT_PER_RECOVERY_VERIFIED,
      TT_PER_P0_2_OWNER_SIGNOFF: p0_2.TT_PER_P0_2_OWNER_SIGNOFF || p0_2.owner_sign_off?.status,
    },
    per_track_item: 'rollback',
    verification: checks,
    summary: {
      total: checks.length,
      pass: passCount,
      fail: failCount,
      blocking_items: checks.filter((c) => c.loop_result === 'FAIL').flatMap((c) => c.blockers),
    },
    owner_sign_off: {
      status: overall === 'PASS' ? 'PENDING_OWNER' : 'BLOCKED',
      attestation: 'Sebastian Ward · Solo maintainer · PER P0-3 Rollback Verified evidence pack',
      signed_at_utc: null,
    },
    [META.passKey]: overall,
    honest_boundary: 'PASS = staging Admin unpublish/publish restore loop · ≠ Production GO',
  };

  writeReport({ dir: META.dir, file: META.file }, stamp, report);
  console.log(`${META.passKey}: ${overall}`);
  console.log(`TT_PER_P0_3_PASS: ${passCount} FAIL: ${failCount}`);
  console.log(`TT_PER_EVIDENCE: evidence/GO_production_preparation/${META.dir}/${stamp}`);
  process.exit(failCount === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
