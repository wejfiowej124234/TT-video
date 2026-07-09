#!/usr/bin/env node
/**
 * Phase 3 · BDR Day 4 · POI / CMS media readiness
 */
const fs = require('fs');
const path = require('path');
const { request, head, absUrl } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const PROBE_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step3/probes');
const DAY_JSON = path.join(ROOT, 'evidence/GO_production_readiness/step3/POI-BUSINESS-DATA-READINESS-DAY4-LATEST.json');

function resolveVerdict(fail) {
  return fail.length ? 'FAIL' : 'PASS';
}

function writeProbe(id, doc) {
  fs.mkdirSync(PROBE_DIR, { recursive: true });
  const rel = `evidence/GO_production_readiness/step3/probes/poi_${id}_probe.json`;
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(doc, null, 2) + '\n');
  return rel;
}

async function main() {
  const stamp = new Date().toISOString();
  const results = [];

  // poi_catalog
  {
    const r = await request(`${API}/api/v1/catalog/poi-images?limit=20`);
    const items = r.json?.items || r.json?.poi_images || [];
    const fail = r.status !== 200 ? ['http_not_200'] : items.length < 10 ? ['poi_catalog_under_10'] : [];
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'poi_catalog',
      label: 'POI Catalog',
      verdict,
      evidence: writeProbe('poi_catalog', { check_id: 'poi_catalog', verdict, count: items.length, http: r.status, recorded_at_utc: stamp }),
    });
  }

  // cms_media_catalog
  {
    const r = await request(`${API}/api/v1/catalog/media?limit=20`);
    const items = r.json?.items || r.json?.media || [];
    const fail = r.status !== 200 ? ['http_not_200'] : items.length < 5 ? ['media_catalog_under_5'] : [];
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'cms_media_catalog',
      label: 'CMS Media Catalog',
      verdict,
      evidence: writeProbe('cms_media_catalog', { check_id: 'cms_media_catalog', verdict, count: items.length, http: r.status, recorded_at_utc: stamp }),
    });
  }

  // guide_hero_images
  {
    const guides = await request(`${API}/api/v1/guides?limit=10`);
    const items = guides.json?.items || guides.json?.guides || [];
    const sample = items[0];
    const url = absUrl(API, sample?.avatar_url || sample?.hero_url || sample?.cover_url);
    let fail = guides.status !== 200 ? ['guides_http'] : !items.length ? ['no_guides'] : [];
    if (!fail.length && url) {
      const h = await head(url);
      if (!h.ok) fail.push('hero_head_fail');
    } else if (!fail.length && !url) {
      fail.push('missing_hero_url');
    }
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'guide_hero_images',
      label: 'Guide Hero Images',
      verdict,
      evidence: writeProbe('guide_hero_images', { check_id: 'guide_hero_images', verdict, sample_id: sample?.id, url, recorded_at_utc: stamp }),
    });
  }

  // poi_sample_head
  {
    const r = await request(`${API}/api/v1/catalog/poi-images?limit=5`);
    const items = r.json?.items || [];
    const sample = items[0];
    const url = absUrl(API, sample?.url || sample?.image_url || sample?.src);
    let fail = !items.length ? ['no_poi_sample'] : [];
    if (!fail.length && url) {
      const h = await head(url);
      if (!h.ok) fail.push('poi_image_head_fail');
    } else if (!fail.length) fail.push('missing_poi_url');
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'poi_sample_head',
      label: 'POI Sample HEAD',
      verdict,
      evidence: writeProbe('poi_sample_head', { check_id: 'poi_sample_head', verdict, url, recorded_at_utc: stamp }),
    });
  }

  // staging_health
  {
    const r = await request(`${API}/health`);
    const fail = r.status !== 200 ? ['health_not_200'] : [];
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'staging_health',
      label: 'Staging Health',
      verdict,
      evidence: writeProbe('staging_health', { check_id: 'staging_health', verdict, http: r.status, recorded_at_utc: stamp }),
    });
  }

  const pass = results.filter((r) => r.verdict === 'PASS').length;
  const fail = results.filter((r) => r.verdict === 'FAIL').length;
  const ready = fail === 0 ? 'YES' : 'NO';
  const dayDoc = {
    schema: 'traveltrust.poi_business_data_readiness_day4.v1',
    recorded_at_utc: stamp,
    domain: 'poi',
    step1_day: 4,
    mode: 'evidence_driven',
    checks_total: results.length,
    pass,
    fail,
    ready,
    TT_POI_BUSINESS_DATA_READINESS_DAY4: ready === 'YES' ? 'READY' : 'NOT_READY',
    results,
  };
  fs.mkdirSync(path.dirname(DAY_JSON), { recursive: true });
  fs.writeFileSync(DAY_JSON, JSON.stringify(dayDoc, null, 2) + '\n');
  console.log(`TT_POI_BUSINESS_DATA_READINESS_DAY4: ${dayDoc.TT_POI_BUSINESS_DATA_READINESS_DAY4}`);
  results.forEach((r) => console.log(`  ${r.id}: ${r.verdict}`));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
