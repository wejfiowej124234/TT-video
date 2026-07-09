#!/usr/bin/env node
/**
 * Phase 3 · BDR Day 5 · Cross-domain Pricing readiness
 */
const fs = require('fs');
const path = require('path');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const PROBE_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step3/probes');
const DAY_JSON = path.join(ROOT, 'evidence/GO_production_readiness/step3/PRICING-BUSINESS-DATA-READINESS-DAY5-LATEST.json');

function resolveVerdict(fail) {
  return fail.length ? 'FAIL' : 'PASS';
}

function writeProbe(id, doc) {
  fs.mkdirSync(PROBE_DIR, { recursive: true });
  const rel = `evidence/GO_production_readiness/step3/probes/pricing_${id}_probe.json`;
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(doc, null, 2) + '\n');
  return rel;
}

function validPrice(v) {
  const n = Number(v);
  return v != null && String(v).trim() !== '' && !Number.isNaN(n) && n > 0;
}

async function main() {
  const stamp = new Date().toISOString();
  const results = [];

  const guidesR = await request(`${API}/api/v1/guides?limit=20`);
  const guides = guidesR.json?.items || guidesR.json?.guides || [];
  const providerR = await request(`${API}/api/v1/market/provider/listings?limit=20`);
  const providers = providerR.json?.items || providerR.json?.listings || [];
  const acqR = await request(`${API}/api/v1/market/acquisition/listings?limit=20`);
  const acq = acqR.json?.items || acqR.json?.listings || [];

  // guide_pricing
  {
    const withRate = guides.filter((g) => validPrice(g.hourly_rate ?? g.payload?.hourly_rate));
    const fail = guidesR.status !== 200 ? ['http_not_200'] : !withRate.length ? ['no_guide_hourly_rate'] : [];
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'guide_pricing',
      label: 'Guide Pricing',
      verdict,
      evidence: writeProbe('guide_pricing', { verdict, count_with_rate: withRate.length, total: guides.length, recorded_at_utc: stamp }),
    });
  }

  // provider_pricing
  {
    const withPrice = providers.filter((x) => validPrice(x.payload?.priceUsdc));
    const fail = providerR.status !== 200 ? ['http_not_200'] : !withPrice.length ? ['no_provider_price_usdc'] : [];
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'provider_pricing',
      label: 'Provider Pricing',
      verdict,
      evidence: writeProbe('provider_pricing', { verdict, count_with_price: withPrice.length, total: providers.length, recorded_at_utc: stamp }),
    });
  }

  // acquisition_bounty
  {
    const withBounty = acq.filter((x) => {
      const p = x.payload || x;
      return validPrice(p.bountyMinUsdc) && validPrice(p.bountyMaxUsdc);
    });
    const fail = acqR.status !== 200 ? ['http_not_200'] : !withBounty.length ? ['no_acquisition_bounty'] : [];
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'acquisition_bounty',
      label: 'Acquisition Bounty',
      verdict,
      evidence: writeProbe('acquisition_bounty', { verdict, count_with_bounty: withBounty.length, total: acq.length, recorded_at_utc: stamp }),
    });
  }

  // pricing_consistency_sample
  {
    const g = guides.find((x) => validPrice(x.hourly_rate));
    const p = providers.find((x) => validPrice(x.payload?.priceUsdc));
    const a = acq.find((x) => validPrice((x.payload || x).bountyMaxUsdc));
    const fail = !g || !p || !a ? ['missing_domain_sample'] : [];
    const verdict = resolveVerdict(fail);
    results.push({
      id: 'pricing_consistency_sample',
      label: 'Pricing Consistency Sample',
      verdict,
      evidence: writeProbe('pricing_consistency_sample', {
        verdict,
        guide_sample: g?.hourly_rate,
        provider_sample: p?.payload?.priceUsdc,
        acquisition_sample: (a?.payload || a)?.bountyMaxUsdc,
        recorded_at_utc: stamp,
      }),
    });
  }

  // bd001_attribution
  {
    const guidePricing = results.find((r) => r.id === 'guide_pricing');
    const verdict = guidePricing?.verdict === 'PASS' ? 'PASS' : 'FAIL';
    const fail = verdict === 'FAIL' ? ['guide_pricing_not_pass'] : [];
    results.push({
      id: 'bd001_cascade_clear',
      label: 'BD-001 Cascade Clear',
      verdict: resolveVerdict(fail),
      evidence: writeProbe('bd001_cascade_clear', {
        verdict: resolveVerdict(fail),
        note: 'Guide pricing PASS → no BD-004 cascade for pricing gate',
        recorded_at_utc: stamp,
      }),
    });
  }

  const pass = results.filter((r) => r.verdict === 'PASS').length;
  const fail = results.filter((r) => r.verdict === 'FAIL').length;
  const ready = fail === 0 ? 'YES' : 'NO';
  const dayDoc = {
    schema: 'traveltrust.pricing_business_data_readiness_day5.v1',
    recorded_at_utc: stamp,
    domain: 'pricing',
    step1_day: 5,
    mode: 'evidence_driven',
    checks_total: results.length,
    pass,
    fail,
    ready,
    TT_PRICING_BUSINESS_DATA_READINESS_DAY5: ready === 'YES' ? 'READY' : 'NOT_READY',
    results,
  };
  fs.mkdirSync(path.dirname(DAY_JSON), { recursive: true });
  fs.writeFileSync(DAY_JSON, JSON.stringify(dayDoc, null, 2) + '\n');
  console.log(`TT_PRICING_BUSINESS_DATA_READINESS_DAY5: ${dayDoc.TT_PRICING_BUSINESS_DATA_READINESS_DAY5}`);
  results.forEach((r) => console.log(`  ${r.id}: ${r.verdict}`));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
