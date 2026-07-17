#!/usr/bin/env node
/**
 * PER EXIT_BLOCKER · B3 COS under_probe remediation
 *
 * Official-guide covers exist on Tigris but Guest campaign DTOs still resolve
 * ephemeral /api/v1/uploads/community-posts/* URLs (excluded from permanent
 * probe ceiling). Patch → Tigris public URL, then deploy one campaign that
 * exposes all 10 covers on a Guest surface.
 *
 *   node docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS/rebind-official-guide-covers-cos.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../../../..');
const { createClient } = require(path.join(ROOT, 'scripts/dev/lib/official-cold-start-admin-client.cjs'));
const API = (process.env.STAGING_API_BASE || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(
  /\/$/,
  '',
);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';
const PUBLIC_BASE =
  process.env.COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL ||
  'https://traveltrust-community-media.fly.storage.tigris.dev';
const PREFIX = 'official-cold-start/v1';
const OUT = path.join(__dirname, 'OFFICIAL-GUIDE-COS-REBIND-LATEST.json');
const client = createClient(API);

const CHAINS = [
  'bangkok-temple',
  'barcelona-arch',
  'dubai-luxury',
  'kyoto-culture',
  'nyc-skyline',
  'paris-art',
  'seoul-food',
  'singapore-family',
  'sydney-coast',
  'tokyo-photo',
];

function tigrisCover(chainId) {
  return `${PUBLIC_BASE.replace(/\/$/, '')}/${PREFIX}/ocs-${chainId}-official-guide-cover.jpg`;
}

(async () => {
  const token = await client.adminLogin(ADMIN_EMAIL, ADMIN_PASS);
  const list = await client.req('GET', '/api/v1/admin/official/guides?limit=100', null, token);
  const items = list.json.items || list.json.guides || list.json.data || [];
  console.log('official_guides_listed', items.length);

  const patched = [];
  const byDest = new Map();
  for (const it of items) {
    const title = String(it.title || '');
    const cover = String(it.cover_url || '');
    const id = it.id;
    // Match chain by filename stem or destination heuristics
    let chainId = null;
    for (const c of CHAINS) {
      if (cover.includes(`ocs-${c}-`) || title.toLowerCase().includes(c.split('-')[0])) {
        chainId = c;
        break;
      }
    }
    if (!chainId) {
      // fall back: destination city map
      const dest = String(it.destination || '');
      const map = {
        东京: 'tokyo-photo',
        京都: 'kyoto-culture',
        首尔: 'seoul-food',
        曼谷: 'bangkok-temple',
        新加坡: 'singapore-family',
        巴黎: 'paris-art',
        纽约: 'nyc-skyline',
        悉尼: 'sydney-coast',
        巴塞罗那: 'barcelona-arch',
        迪拜: 'dubai-luxury',
      };
      chainId = map[dest] || null;
    }
    if (!chainId || !id) {
      patched.push({ id, title, status: 'SKIP_NO_CHAIN', cover });
      continue;
    }
    const next = tigrisCover(chainId);
    if (cover === next || cover.includes('tigris.dev') && cover.includes(`ocs-${chainId}-official-guide`)) {
      byDest.set(chainId, id);
      patched.push({ id, chainId, status: 'ALREADY_TIGRIS', cover });
      continue;
    }
    const pr = await client.req('PATCH', `/api/v1/admin/official/guides/${id}`, { cover_url: next }, token);
    byDest.set(chainId, id);
    patched.push({
      id,
      chainId,
      status: pr.status >= 200 && pr.status < 300 ? 'PATCHED' : 'PATCH_FAIL',
      http: pr.status,
      from: cover.slice(0, 120),
      to: next,
      err: pr.status >= 300 ? JSON.stringify(pr.json).slice(0, 200) : undefined,
    });
    console.log(patched[patched.length - 1].status, chainId, id);
  }

  // Deploy a Guest campaign exposing all patched guide_posts
  const guideIds = CHAINS.map((c) => byDest.get(c)).filter(Boolean);
  let campaign = null;
  if (guideIds.length >= 8) {
    const cr = await client.req(
      'POST',
      '/api/v1/admin/official/public-operations/campaigns',
      {
        name: 'PER COS · Official Guide Covers',
        campaign_kind: 'homepage',
        surfaces: ['home_hero', 'community_feed', 'landing_promo'],
      },
      token,
    );
    const campaignId = cr.json.item?.id || cr.json.id;
    if (!campaignId) {
      console.error('create campaign failed', cr.status, JSON.stringify(cr.json).slice(0, 300));
    } else {
      let order = 0;
      for (const gid of guideIds) {
        await client.req(
          'POST',
          `/api/v1/admin/official/public-operations/campaigns/${campaignId}/items`,
          { item_type: 'guide_post', item_ref_id: gid, sort_order: order++ },
          token,
        );
      }
      await client.req(
        'POST',
        `/api/v1/admin/official/public-operations/campaigns/${campaignId}/submit-review`,
        {},
        token,
      );
      const dep = await client.req(
        'POST',
        `/api/v1/admin/official/public-operations/campaigns/${campaignId}/deploy`,
        {},
        token,
      );
      campaign = {
        id: campaignId,
        guide_ids: guideIds.length,
        deploy_http: dep.status,
      };
      console.log('campaign deployed', campaign);
    }
  }

  const report = {
    schema: 'traveltrust.per_exit_blocker.official_guide_cos_rebind.v1',
    stamp_utc: new Date().toISOString(),
    api: API,
    patched,
    campaign,
    production_go: 'NO_GO',
    note: 'B3 under_probe remediation · permanent Tigris cover_url + Guest campaign surface',
  };
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('TT_PER_OFFICIAL_GUIDE_COS_REBIND: DONE', OUT);
  const fails = patched.filter((p) => p.status === 'PATCH_FAIL').length;
  process.exit(fails ? 2 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
