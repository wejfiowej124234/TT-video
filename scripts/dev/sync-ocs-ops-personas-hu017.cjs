#!/usr/bin/env node
/**
 * HU-017 · Sync OCS ops_accounts nickname + avatar_url onto Staging users (PUT /me).
 * Does not recreate posts — persona only.
 *
 *   API_BASE=https://tt-api-staging.fly.dev node scripts/dev/sync-ocs-ops-personas-hu017.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const OCS_PASS = process.env.TT_OCS_ACCOUNT_PASSWORD || 'OcsBaseline2026!';

const client = createClient(API);
const dataset = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const domain = dataset.email_domain || 'ocs.traveltrust.app';

function okStatus(s) {
  return s >= 200 && s < 300;
}

async function main() {
  console.log(`HU-017 persona sync → ${API}`);
  for (const ops of dataset.ops_accounts || []) {
    const em = `${ops.slug}@${domain}`;
    if (!ops.nickname && !ops.avatar_url) {
      console.log(`skip ${ops.slug}: no persona fields`);
      continue;
    }
    try {
      const userTok = await client.userLogin(em, OCS_PASS);
      const body = {};
      if (ops.nickname) body.nickname = ops.nickname;
      if (ops.avatar_url) body.avatar_url = ops.avatar_url;
      const put = await client.req('PUT', '/api/v1/me', body, userTok);
      if (!okStatus(put.status)) {
        console.error(`FAIL ${em} HTTP ${put.status} ${JSON.stringify(put.json).slice(0, 200)}`);
        process.exitCode = 1;
        continue;
      }
      console.log(`OK ${ops.slug} → ${ops.nickname} · ${ops.avatar_url || ''}`);
    } catch (e) {
      console.error(`FAIL ${em}: ${e && e.message ? e.message : e}`);
      process.exitCode = 1;
    }
  }
}

main();
