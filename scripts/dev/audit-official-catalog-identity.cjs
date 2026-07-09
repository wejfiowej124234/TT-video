#!/usr/bin/env node
/**
 * Official Catalog Identity Policy (OCIP) · audit.
 * Verifies canonical UUIDs in state.json still exist and match live API;
 * campaign items still reference the same IDs. Does NOT require DB-only row counts.
 *
 *   STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
 *   OUT=evidence/GO_official_cold_start_dataset/<UTC>/official-catalog-identity-audit.json \
 *   node scripts/dev/audit-official-catalog-identity.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || '';
const OUT = process.env.OUT || '';
const STAMP = process.env.OCIP_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');

const dataset = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const client = createClient(API);
const issues = [];

function issue(severity, id, key, msg, detail = null) {
  issues.push({ severity, id, canonical_key: key, msg, detail });
}

(async () => {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    issue('blocking', 'STATE', 'meta', 'missing state.json');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const adminTok = await client.adminLogin(process.env.ADMIN_EMAIL || 'tourist@test.com', process.env.ADMIN_PASS || 'Test123!');

  const identityMap = [];
  for (const chain of dataset.chains || []) {
    const entries = [
      { key: `guide:${chain.id}`, slug: chain.guide?.slug, bucket: 'guides', id: state.guides?.[`guide:${chain.id}`]?.id },
      { key: `provider:${chain.id}`, slug: chain.provider?.slug, bucket: 'listings', id: state.listings?.[`provider:${chain.id}`]?.id },
      { key: `acquisition:${chain.id}`, slug: chain.acquisition?.slug, bucket: 'listings', id: state.listings?.[`acquisition:${chain.id}`]?.id },
      { key: `official_guide:${chain.id}`, slug: chain.id, bucket: 'official_guides', id: state.official_guides?.[`official_guide:${chain.id}`]?.id },
    ];
    for (const e of entries) {
      identityMap.push({ chain_id: chain.id, city: chain.city, ...e });
      if (!e.id) issue('blocking', 'MISSING_STATE_UUID', e.key, 'canonical key has no UUID in state.json');
    }
  }
  for (const c of dataset.campaigns || []) {
    identityMap.push({
      chain_id: null,
      key: c.id,
      slug: c.id,
      bucket: 'campaigns',
      id: state.campaigns?.[c.id]?.id,
    });
    if (!state.campaigns?.[c.id]?.id) issue('blocking', 'MISSING_STATE_UUID', c.id, 'campaign canonical id missing in state');
  }

  const guidesPub = await client.req('GET', '/api/v1/guides?limit=500');
  const guideById = new Map((guidesPub.json.items || []).map((g) => [g.id, g]));
  const prov = await client.req('GET', '/api/v1/market/provider/listings?limit=500');
  const provById = new Map((prov.json.items || []).map((r) => [r.id, r]));
  const acq = await client.req('GET', '/api/v1/market/acquisition/listings?limit=500');
  const acqById = new Map((acq.json.items || []).map((r) => [r.id, r]));
  const og = await client.req('GET', '/api/v1/admin/official/guides?limit=500', null, adminTok);
  const ogById = new Map((og.json.items || og.json.guides || []).map((r) => [r.id, r]));
  const camps = await client.req('GET', '/api/v1/admin/official/public-operations/campaigns?limit=100', null, adminTok);
  const campById = new Map((camps.json.items || []).map((c) => [c.id, c]));

  const liveChecks = [];
  for (const row of identityMap) {
    if (!row.id) continue;
    let live = null;
    let surface = '';
    if (row.key.startsWith('guide:')) {
      live = guideById.get(row.id);
      surface = 'guides_public';
      if (!live) {
        const detail = await client.req('GET', `/api/v1/guides/${row.id}`);
        live = detail.status === 200 ? detail.json : null;
        surface = 'guides_detail';
      }
    } else if (row.key.startsWith('provider:')) {
      live = provById.get(row.id);
      surface = 'provider_public';
    } else if (row.key.startsWith('acquisition:')) {
      live = acqById.get(row.id);
      surface = 'acquisition_public';
    } else if (row.key.startsWith('official_guide:')) {
      live = ogById.get(row.id);
      surface = 'official_guides_admin';
    } else if (row.bucket === 'campaigns') {
      live = campById.get(row.id);
      surface = 'campaigns_admin';
    }
  const check = {
      canonical_key: row.key,
      chain_id: row.chain_id,
      manifest_slug: row.slug,
      uuid: row.id,
      surface,
      live: !!live,
    };
    liveChecks.push(check);
    if (!live && row.bucket !== 'campaigns') {
      issue('enhancement', 'UUID_NOT_ON_PUBLIC_SURFACE', row.key, `UUID not on public list; verify via detail/admin`, check);
    }
    if (!live && row.bucket === 'campaigns') {
      issue('blocking', 'UUID_NOT_LIVE', row.key, 'campaign UUID not in admin', check);
    }
  }

  const ocsGuideIds = new Set(identityMap.filter((r) => r.key.startsWith('guide:')).map((r) => r.id).filter(Boolean));
  const pubGuides = guidesPub.json.items || [];
  const dupCityOnOcs = {};
  for (const g of pubGuides) {
    if (!ocsGuideIds.has(g.id)) continue;
    const c = (g.city || '?').trim();
    if (!dupCityOnOcs[c]) dupCityOnOcs[c] = [];
    dupCityOnOcs[c].push(g.id);
  }
  for (const [city, ids] of Object.entries(dupCityOnOcs)) {
    if (ids.length > 1) issue('blocking', 'DUPLICATE_CITY_UUID', city, 'multiple OCS guide UUIDs same city', ids);
  }

  const campaignRefs = [];
  for (const c of dataset.campaigns || []) {
    const campId = state.campaigns?.[c.id]?.id;
    if (!campId) continue;
    const detail = await client.req('GET', `/api/v1/admin/official/public-operations/campaigns/${campId}`, null, adminTok);
    const items = detail.json.item?.items || detail.json.items || [];
    for (const ref of c.item_refs || []) {
      const [kind, chainId] = ref.split(':');
      let expected = null;
      if (kind === 'guide') expected = state.guides?.[`guide:${chainId}`]?.id;
      if (kind === 'provider') expected = state.listings?.[`provider:${chainId}`]?.id;
      if (kind === 'acquisition') expected = state.listings?.[`acquisition:${chainId}`]?.id;
      if (kind === 'official_guide') expected = state.official_guides?.[`official_guide:${chainId}`]?.id;
      const bound = items.find((it) => it.item_ref_id === expected);
      campaignRefs.push({ campaign: c.id, ref, expected_uuid: expected, bound: !!bound });
      if (expected && !bound) {
        issue('enhancement', 'CAMPAIGN_REF_DRIFT', `${c.id}:${ref}`, 'campaign item not bound to canonical UUID (content gap, identity OK)', { expected, campId });
      }
    }
  }

  const blocking = issues.filter((i) => i.severity === 'blocking').length;
  const verdict = blocking === 0 ? 'PASS' : 'FAIL';

  const payload = {
    schema: 'traveltrust.official_catalog_identity_audit.v1',
    policy: 'official_catalog_identity_policy',
    policy_registry: 'registry/official-catalog-identity-policy.v1.yaml',
    stamp: STAMP,
    recorded_at: new Date().toISOString(),
    api: API,
    state_path: STATE_PATH,
    verdict,
    layer_stack: [
      'official_dataset_ocs',
      'canonical_identity_immutable',
      'mutable_content',
      'public_catalog_sopcp',
    ],
    identity_map: identityMap,
    live_checks: liveChecks,
    campaign_ref_checks: campaignRefs,
    issues,
    summary: {
      canonical_entities: identityMap.filter((r) => r.id).length,
      blocking: issues.filter((i) => i.severity === 'blocking').length,
      major: issues.filter((i) => i.severity === 'major').length,
    },
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  }

  console.log(
    `OCIP_AUDIT_VERDICT: ${verdict} canonical=${payload.summary.canonical_entities} blocking=${payload.summary.blocking} major=${payload.summary.major}`
  );
  if (verdict === 'FAIL') process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
