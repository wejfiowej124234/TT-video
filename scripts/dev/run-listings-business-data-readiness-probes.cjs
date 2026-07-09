#!/usr/bin/env node
/**
 * Phase 3 · BDR Day 3 · Listings cross-surface catalog readiness
 */
const fs = require('fs');
const path = require('path');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const PROBE_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step3/probes');
const DAY_JSON = path.join(ROOT, 'evidence/GO_production_readiness/step3/LISTINGS-BUSINESS-DATA-READINESS-DAY3-LATEST.json');
const READY_RULE = { max_fail: 0, max_warn_d: 0, max_warn_p: 0, warn_c_blocks: false };

function pickItems(json) {
  return json?.items || json?.listings || [];
}

function resolveVerdict(fail, warn) {
  if (fail.length) return 'FAIL';
  if (warn.some((w) => w.startsWith('warn_d'))) return 'WARN-D';
  return 'PASS';
}

function writeProbe(id, doc) {
  fs.mkdirSync(PROBE_DIR, { recursive: true });
  const rel = `evidence/GO_production_readiness/step3/probes/listings_${id}_probe.json`;
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(doc, null, 2) + '\n');
  return rel;
}

async function main() {
  const stamp = new Date().toISOString();
  const provider = await request(`${API}/api/v1/market/provider/listings?limit=50`);
  const acquisition = await request(`${API}/api/v1/market/acquisition/listings?limit=50`);
  const discover = await request(`${API}/api/v1/discover/orders?limit=20`);
  const providerItems = pickItems(provider.json);
  const acqItems = pickItems(acquisition.json);
  const discoverItems = discover.json?.items || discover.json?.orders || [];

  const results = [];

  // provider_catalog_cover
  {
    const prod = providerItems.filter((x) => !x.data_origin || x.data_origin === 'production');
    const fail = provider.status !== 200 ? ['http_not_200'] : prod.length < 10 ? ['provider_catalog_under_10'] : [];
    const verdict = resolveVerdict(fail, []);
    const evidence = writeProbe('provider_catalog_cover', {
      schema: 'traveltrust.listings_business_data_probe.v1',
      check_id: 'provider_catalog_cover',
      recorded_at_utc: stamp,
      api: API,
      verdict,
      production_count: prod.length,
      total_count: providerItems.length,
    });
    results.push({ id: 'provider_catalog_cover', label: 'Provider Catalog Cover', verdict, evidence });
  }

  // acquisition_catalog_cover
  {
    const prod = acqItems.filter((x) => !x.data_origin || x.data_origin === 'production');
    const fail = acquisition.status !== 200 ? ['http_not_200'] : prod.length < 10 ? ['acquisition_catalog_under_10'] : [];
    const verdict = resolveVerdict(fail, []);
    const evidence = writeProbe('acquisition_catalog_cover', {
      schema: 'traveltrust.listings_business_data_probe.v1',
      check_id: 'acquisition_catalog_cover',
      recorded_at_utc: stamp,
      verdict,
      production_count: prod.length,
      total_count: acqItems.length,
    });
    results.push({ id: 'acquisition_catalog_cover', label: 'Acquisition Catalog Cover', verdict, evidence });
  }

  // provider_detail
  {
    const id = providerItems[0]?.id;
    const detail = id ? await request(`${API}/api/v1/market/provider/listings/${id}`) : { status: 0 };
    const fail = !id ? ['no_sample_id'] : detail.status !== 200 ? [`detail_http_${detail.status}`] : [];
    const verdict = resolveVerdict(fail, []);
    const evidence = writeProbe('provider_detail', {
      schema: 'traveltrust.listings_business_data_probe.v1',
      check_id: 'provider_detail',
      recorded_at_utc: stamp,
      verdict,
      sample_id: id,
      http: detail.status,
    });
    results.push({ id: 'provider_detail', label: 'Provider Detail', verdict, evidence });
  }

  // acquisition_detail
  {
    const id = acqItems[0]?.id;
    const detail = id ? await request(`${API}/api/v1/market/acquisition/listings/${id}`) : { status: 0 };
    const fail = !id ? ['no_sample_id'] : detail.status !== 200 ? [`detail_http_${detail.status}`] : [];
    const verdict = resolveVerdict(fail, []);
    const evidence = writeProbe('acquisition_detail', {
      schema: 'traveltrust.listings_business_data_probe.v1',
      check_id: 'acquisition_detail',
      recorded_at_utc: stamp,
      verdict,
      sample_id: id,
      http: detail.status,
    });
    results.push({ id: 'acquisition_detail', label: 'Acquisition Detail', verdict, evidence });
  }

  // discover_orders_cover
  {
    const fail = discover.status !== 200 ? ['http_not_200'] : discoverItems.length < 1 ? ['discover_orders_empty'] : [];
    const verdict = resolveVerdict(fail, []);
    const evidence = writeProbe('discover_orders_cover', {
      schema: 'traveltrust.listings_business_data_probe.v1',
      check_id: 'discover_orders_cover',
      recorded_at_utc: stamp,
      verdict,
      count: discoverItems.length,
    });
    results.push({ id: 'discover_orders_cover', label: 'Discover Orders Cover', verdict, evidence });
  }

  // cross_surface_integrity
  {
    const pIds = new Set(providerItems.map((x) => x.id));
    const overlap = acqItems.filter((x) => pIds.has(x.id)).length;
    const fail = overlap > 0 ? ['cross_surface_id_overlap'] : [];
    const verdict = resolveVerdict(fail, []);
    const evidence = writeProbe('cross_surface_integrity', {
      schema: 'traveltrust.listings_business_data_probe.v1',
      check_id: 'cross_surface_integrity',
      recorded_at_utc: stamp,
      verdict,
      overlap_count: overlap,
    });
    results.push({ id: 'cross_surface_integrity', label: 'Cross Surface Integrity', verdict, evidence });
  }

  const pass = results.filter((r) => r.verdict === 'PASS').length;
  const fail = results.filter((r) => r.verdict === 'FAIL').length;
  const ready = fail === 0 ? 'YES' : 'NO';
  const dayDoc = {
    schema: 'traveltrust.listings_business_data_readiness_day3.v1',
    recorded_at_utc: stamp,
    domain: 'listings',
    step1_day: 3,
    mode: 'evidence_driven',
    ready_rule: READY_RULE,
    checks_total: results.length,
    pass,
    fail,
    ready,
    TT_LISTINGS_BUSINESS_DATA_READINESS_DAY3: ready === 'YES' ? 'READY' : 'NOT_READY',
    bd003_note: 'Staging public catalog cover 10+10 · automation bloat non-blocking per BD-003 close',
    results,
  };
  fs.mkdirSync(path.dirname(DAY_JSON), { recursive: true });
  fs.writeFileSync(DAY_JSON, JSON.stringify(dayDoc, null, 2) + '\n');
  console.log(`TT_LISTINGS_BUSINESS_DATA_READINESS_DAY3: ${dayDoc.TT_LISTINGS_BUSINESS_DATA_READINESS_DAY3}`);
  results.forEach((r) => console.log(`  ${r.id}: ${r.verdict}`));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
