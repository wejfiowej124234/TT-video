#!/usr/bin/env node
/**
 * OCS Post-Apply DDG Remediation · patch Official guide avatars to OCS upload URLs on Staging.
 *
 *   API=https://tt-api-staging.fly.dev \
 *   STATE=evidence/.../state.json \
 *   node scripts/dev/remediate-ocs-official-avatars-staging.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { resolveOcsMediaUrl, findLatestOcsStatePath } = require('./lib/smoke-data-heuristics.cjs');

const ROOT = path.join(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH =
  process.env.STATE ||
  process.env.OCS_STATE ||
  findLatestOcsStatePath(ROOT) ||
  '';
const OUT = process.env.OUT || '';
const OCS_PASS = process.env.TT_OCS_ACCOUNT_PASSWORD || 'OcsBaseline2026!';

const client = createClient(API);
const dataset = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

function ocsAvatarPath(chainId) {
  return `/api/v1/uploads/guides/ocs/${chainId}/v1-avatar.jpg`;
}

(async () => {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    throw new Error(`missing OCS state — set STATE= or run OCS Surface Expansion apply first (${STATE_PATH})`);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const results = [];

  for (const chain of dataset.chains || []) {
    const gKey = `guide:${chain.id}`;
    const mapped = state.guides?.[gKey];
    if (!mapped?.email) {
      results.push({ chain: chain.id, ok: false, detail: 'missing guide in state' });
      continue;
    }
    const manifestPath = chain.guide?.avatar_url?.includes('/api/v1/uploads/')
      ? chain.guide.avatar_url
      : ocsAvatarPath(chain.id);
    const avatarUrl = resolveOcsMediaUrl(API, manifestPath);
    const userTok = await client.userLogin(mapped.email, OCS_PASS);
    const patch = await client.req('PATCH', '/api/v1/me/guide-profile', { avatar_url: avatarUrl }, userTok);
    const gp = await client.req('GET', '/api/v1/me/guide-profile', null, userTok);
    const got = gp.json.profile?.avatar_url;
    const ok = patch.status < 400 && got === avatarUrl;
    results.push({
      chain: chain.id,
      guide_id: mapped.id,
      email: mapped.email,
      avatar_url: avatarUrl,
      ok,
      http: patch.status,
      got,
    });
    console.log(`ocs-ddg-avatar: ${chain.id} ${ok ? 'OK' : 'FAIL'} ${avatarUrl}`);
  }

  const report = {
    schema: 'traveltrust.ocs_post_apply_ddg.avatar_remediation.v1',
    api: API,
    manifest: 'data/official-cold-start/dataset.v1.json',
    state_path: STATE_PATH,
    recorded_at: new Date().toISOString(),
    patched: results.filter((r) => r.ok).length,
    total: results.length,
    results,
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  const fail = results.filter((r) => !r.ok);
  if (fail.length) {
    console.error(`OCS_AVATAR_REMEDIATION: FAIL ${fail.length}/${results.length}`);
    process.exit(1);
  }
  console.log(`OCS_AVATAR_REMEDIATION: OK ${results.length}/${results.length}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
