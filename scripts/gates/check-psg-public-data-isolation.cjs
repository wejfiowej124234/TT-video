#!/usr/bin/env node
/** PSG P0⑤ · Public Data Governance — origin isolation + contract SSOT. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const API = (process.env.STAGING_API_BASE || process.env.API_BASE || '').replace(/\/$/, '');
function fail(m) { console.error('check-psg-public-data-isolation: FAIL', m); process.exit(2); }
function ok(m) { console.log('check-psg-public-data-isolation: OK', m); }
const foundation = path.join(ROOT, 'docs/runbook/TT-PSG-P0-5-PUBLIC-DATA-GOVERNANCE.md');
if (!fs.existsSync(foundation)) fail('missing TT-PSG-P0-5-PUBLIC-DATA-GOVERNANCE.md');
const body = fs.readFileSync(foundation, 'utf8');
for (const k of ['production', 'test', 'demo', 'historical', 'archived', 'data_origin', 'Contract FAIL', 'catalog_source']) {
  if (!body.includes(k)) fail('Public Data SSOT missing: ' + k);
}
ok('Public Data Foundation SSOT present');
const gc = path.join(ROOT, 'crates/api/src/chain_off/psg_guest_contract.rs');
if (!fs.existsSync(gc)) fail('missing psg_guest_contract.rs');
const gcs = fs.readFileSync(gc, 'utf8');
for (const k of ['lifecycle', 'visibility', 'publish_status', 'data_origin', 'catalog_source', 'country', 'language', 'asset_status', 'guest_contract_meta']) {
  if (!gcs.includes(k)) fail('guest contract missing ' + k);
}
ok('Guest contract Rust module declares required fields');
const mig = path.join(ROOT, 'crates/api/migrations/20260716120000_market_listings_canonical_key_lifecycle.sql');
if (!fs.existsSync(mig)) fail('missing canonical_key lifecycle migration');
const sql = fs.readFileSync(mig, 'utf8');
for (const k of ['production', 'test', 'demo', 'historical', 'canonical_key']) {
  if (!sql.includes(k)) fail('migration missing ' + k);
}
ok('migration declares production/test/demo/historical + canonical_key');
const filterSrc = path.join(ROOT, 'crates/api/src/chain_off/market_public_surface.rs');
if (fs.existsSync(filterSrc)) {
  const s = fs.readFileSync(filterSrc, 'utf8');
  if (!s.includes('is_non_production_market_listing') && !s.includes('non_production')) {
    fail('market_public_surface missing non-production filter helper');
  }
  ok('server-side non-production filter present');
}
if (!API) { console.log('TT_PSG_P0_5_PUBLIC_DATA: PASS_STRUCTURAL'); process.exit(0); }
async function fetchJson(path) {
  const maxAttempts = 6;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const r = await fetch(API + path, { headers: { Accept: 'application/json' } });
    if (r.status !== 429) {
      if (!r.ok) fail('HTTP ' + r.status + ' ' + path);
      return r.json();
    }
    let waitSec = 60;
    try {
      const j = await r.json();
      waitSec = Math.min(120, Math.max(1, Number(j.retry_after_seconds || 60)));
    } catch (_) {}
    console.warn('check-psg-public-data-isolation: HTTP 429 ' + path + ' — sleep ' + waitSec + 's');
    await new Promise((res) => setTimeout(res, waitSec * 1000));
  }
  fail('HTTP 429 exhausted retries ' + path);
}
(async () => {
  const paths = ['/api/v1/market/acquisition/listings?limit=50', '/api/v1/market/provider/listings?limit=50'];
  let bad = 0, n = 0, contractGaps = 0;
  for (const p of paths) {
    const j = await fetchJson(p);
    const items = j.items || j.data || j.listings || [];
    for (const it of items) {
      n++;
      const origin = String(it.data_origin || (it.payload && it.payload.data_origin) || '').toLowerCase();
      if (origin && origin !== 'production') { console.error('  NON_PRODUCTION_IN_GUEST', origin); bad++; }
      const hasLifecycle = !!(it.status || it.publish_status || (it.payload && (it.payload.status || it.payload.publish_status)));
      const hasOrigin = !!origin;
      const hasCatalog = !!(it.catalog_source || (it.payload && (it.payload.cover_source || it.payload.catalog_source)));
      if (!hasLifecycle || !hasOrigin || !hasCatalog) contractGaps++;
      const title = String(it.title || (it.payload && it.payload.title) || '');
      if (/@traveltrust\.test|smoke listing|\[demo\]/i.test(title)) { console.error('  SEEDISH_TITLE', title.slice(0, 60)); bad++; }
    }
  }
  if (bad > 0) fail(bad + ' Guest isolation violations (n=' + n + ')');
  ok('Guest sample n=' + n + ' no non-production/seedish titles');
  if (contractGaps > 0) console.log('TT_PSG_P0_5_CONTRACT_DTO: OPEN gaps≈' + contractGaps);
  else console.log('TT_PSG_P0_5_CONTRACT_DTO: PASS');
  console.log('TT_PSG_P0_5_PUBLIC_DATA: PASS_RUNTIME_SAMPLE');
  console.log('NOTE: CLOSED needs Guides/Community/Home + DTO contract');
})().catch((e) => fail(String(e && e.message || e)));
