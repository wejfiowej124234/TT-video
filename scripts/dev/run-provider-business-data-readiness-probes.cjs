#!/usr/bin/env node
/**
 * Provider Business Data Readiness · Day 2 Discovery（只 Evidence · 不修）
 *
 * Sprint B Step 1–3: Probe → PASS/WARN/FAIL → 归因 · 证明 BD-002 是否存在
 *
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-provider-business-data-readiness-probes.cjs
 */
const fs = require('fs');
const path = require('path');
const { request, head, absUrl } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const PROBE_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step2/probes');
const DAY_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step2');
const DAY_JSON = path.join(DAY_DIR, 'PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.json');
const DAY_MD = path.join(DAY_DIR, 'PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.md');

const READY_RULE = { max_fail: 0, max_warn_d: 0, max_warn_p: 0, warn_c_blocks: false, total_checks: 6 };
const WARN_CLASS_MAP = {
  missing_description: 'C',
  missing_category: 'C',
  partial_listings_missing_price: 'D',
  partial_listings_missing_cover: 'D',
};

const CHECKS = [
  { id: 'profile', label: 'Profile', ssot: 'Market API', probe: 'GET /api/v1/market/provider/listings payload' },
  { id: 'pricing', label: 'Pricing', ssot: 'Pricing API', probe: 'listing.payload.priceUsdc', candidate_issue: 'BD-002' },
  { id: 'images', label: 'Images', ssot: 'CMS', probe: 'HEAD cover_url' },
  { id: 'status', label: 'Status', ssot: 'API', probe: 'data_origin + listing id' },
  { id: 'listings', label: 'Listings', ssot: 'Market API', probe: 'GET list + GET :id detail' },
  { id: 'availability', label: 'Availability', ssot: 'Market', probe: 'bookable fields (title+price+cover)' },
];

function writeProbe(checkId, doc) {
  const p = path.join(PROBE_DIR, `provider_${checkId}_probe.json`);
  fs.mkdirSync(PROBE_DIR, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + '\n');
  return `evidence/GO_production_readiness/step2/probes/provider_${checkId}_probe.json`;
}

function pickListings(json) {
  return json?.items || (Array.isArray(json) ? json : []);
}

function classifyWarns(warnReasons) {
  const byClass = { C: [], D: [], P: [] };
  for (const w of warnReasons) {
    byClass[WARN_CLASS_MAP[w] || 'C'].push(w);
  }
  return byClass;
}

function resolveVerdict(fail, warn) {
  if (fail.length) return 'FAIL';
  const wc = classifyWarns(warn);
  if (wc.D.length) return 'WARN-D';
  if (wc.P.length) return 'WARN-P';
  if (wc.C.length) return 'WARN-C';
  return 'PASS';
}

function probeProfile(listings) {
  const fail = [];
  const warn = [];
  if (!listings.length) fail.push('no_provider_listings');
  const sample = listings[0]?.payload || listings[0];
  if (sample) {
    for (const f of ['title', 'city', 'kind']) {
      if (!sample[f]) fail.push(`missing_${f}`);
    }
    if (!sample.description) warn.push('missing_description');
    if (!sample.category) warn.push('missing_category');
  }
  return { fail, warn, sample_id: listings[0]?.id, count: listings.length };
}

function probePricing(listings) {
  const fail = [];
  const warn = [];
  if (!listings.length) fail.push('no_listings');
  else {
    const withPrice = listings.filter((x) => {
      const p = x.payload?.priceUsdc;
      return p != null && String(p).trim() !== '' && !Number.isNaN(Number(p)) && Number(p) > 0;
    });
    if (!withPrice.length) fail.push('no_price_usdc');
    else if (withPrice.length < listings.length) warn.push('partial_listings_missing_price');
  }
  return {
    fail,
    warn,
    count_with_price: listings.filter((x) => x.payload?.priceUsdc != null).length,
    count_valid: listings.filter((x) => Number(x.payload?.priceUsdc) > 0).length,
  };
}

async function probeImages(listing) {
  const fail = [];
  const warn = [];
  const url = absUrl(API, listing?.payload?.cover_url || listing?.payload?.videoUrl || listing?.cover_url);
  if (!url) fail.push('missing_cover_url');
  else {
    const h = await head(url);
    if (!h.ok) fail.push('head_fail_cover');
  }
  return { fail, warn, url };
}

function probeStatus(listings) {
  const fail = [];
  const warn = [];
  if (!listings.length) fail.push('no_listings');
  for (const x of listings) {
    if (!x.id) fail.push('missing_listing_id');
    if (x.data_origin && x.data_origin !== 'production') warn.push('non_production_origin');
  }
  return { fail, warn };
}

async function probeListings(listings) {
  const fail = [];
  const warn = [];
  if (!listings.length) fail.push('empty_list');
  else {
    const sampleId = listings[0].id;
    const detail = await request(`${API}/api/v1/market/provider/listings/${sampleId}`);
    if (detail.status !== 200) fail.push(`detail_http_${detail.status}`);
    else if (!detail.json?.listing?.id) fail.push('detail_missing_listing');
  }
  return { fail, warn, list_count: listings.length };
}

function probeAvailability(listings) {
  const fail = [];
  const warn = [];
  if (!listings.length) fail.push('no_listings');
  else {
    const bookable = listings.filter((x) => {
      const p = x.payload || x;
      return p.title && p.priceUsdc != null && Number(p.priceUsdc) > 0 && p.cover_url;
    });
    if (!bookable.length) fail.push('no_bookable_listings');
    else if (bookable.length < listings.length) warn.push('partial_not_bookable');
  }
  return { fail, warn, bookable_count: listings.filter((x) => x.payload?.title).length };
}

function attributeBd002(pricingResult, allResults) {
  const pricing = allResults.find((r) => r.id === 'pricing');
  const listings = allResults.find((r) => r.id === 'listings');
  if (pricing?.verdict === 'FAIL') {
    return {
      candidate: 'BD-002',
      status: 'CONFIRMED_CANDIDATE',
      reason: 'Provider Pricing Probe FAIL · API/Market 一致失败',
      layers: { api: 'market/provider/listings priceUsdc', market: 'public catalog' },
    };
  }
  if (pricing?.verdict === 'PASS') {
    const otherFails = allResults.filter((r) => r.verdict === 'FAIL' && r.id !== 'pricing');
    if (otherFails.length) {
      return {
        candidate: 'BD-002',
        status: 'REJECTED',
        reason: 'Pricing PASS · BD-002 不成立 · 真正 FAIL 在其它检查',
        true_failures: otherFails.map((r) => r.id),
        redefine: '考虑 BD-003 Listings 或其它 Root Cause',
      };
    }
    return {
      candidate: 'BD-002',
      status: 'REJECTED',
      reason: 'Provider Day2 全 Probe 无 FAIL · BD-002（Provider Pricing 不完整）在 staging 不成立',
      note: '可能为本地假设或未覆盖的 Provider 子集 · 需 HAT Provider 或 DB 子集再验证',
    };
  }
  return { candidate: 'BD-002', status: 'PENDING', reason: 'Pricing WARN · 待人工归因' };
}

function buildProbeDoc(spec, ctx) {
  return {
    schema: 'traveltrust.provider_business_data_probe.v1',
    recorded_at_utc: ctx.stamp,
    mode: 'discovery_only',
    check_id: spec.id,
    label: spec.label,
    ssot: spec.ssot,
    probe: spec.probe,
    api: API,
    verdict: ctx.verdict,
    root_cause: ctx.root_cause,
    candidate_issue: spec.candidate_issue || null,
    fail_reasons: ctx.fail,
    warn_reasons: ctx.warn,
    warn_classification: classifyWarns(ctx.warn),
    detail: ctx.extra,
    TT_PROVIDER_PROBE: ctx.verdict,
  };
}

async function main() {
  const stamp = new Date().toISOString();
  const list = await request(`${API}/api/v1/market/provider/listings?limit=20`);
  const listings = pickListings(list.json);
  const sample =
    listings.find((x) => x.payload?.cover_url || x.payload?.videoUrl || x.cover_url) || listings[0];

  const results = [];
  for (const spec of CHECKS) {
    let fail = [];
    let warn = [];
    let extra = {};
    if (spec.id === 'profile') {
      const d = probeProfile(listings);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    } else if (spec.id === 'pricing') {
      const d = probePricing(listings);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    } else if (spec.id === 'images') {
      const d = await probeImages(sample);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    } else if (spec.id === 'status') {
      const d = probeStatus(listings);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    } else if (spec.id === 'listings') {
      const d = await probeListings(listings);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    } else if (spec.id === 'availability') {
      const d = probeAvailability(listings);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    }

    const verdict = resolveVerdict(fail, warn);
    const evidence = writeProbe(
      spec.id,
      buildProbeDoc(spec, {
        stamp,
        fail,
        warn,
        verdict,
        root_cause: spec.candidate_issue && verdict === 'FAIL' ? spec.candidate_issue : null,
        extra,
      }),
    );
    results.push({ ...spec, verdict, evidence, fail_reasons: fail, warn_reasons: warn });
  }

  const pass = results.filter((r) => r.verdict === 'PASS').length;
  let warn_c = 0;
  let warn_d = 0;
  let warn_p = 0;
  for (const r of results) {
    if (r.verdict === 'WARN-C') warn_c++;
    if (r.verdict === 'WARN-D') warn_d++;
    if (r.verdict === 'WARN-P') warn_p++;
  }
  const fail = results.filter((r) => r.verdict === 'FAIL').length;
  const ready = fail === 0 && warn_d === 0 && warn_p === 0 ? 'YES' : 'NO';
  const bd002Attribution = attributeBd002(null, results);

  const discovery = {
    sprint: 'B',
    phase: 'Discovery',
    evidence_ready: true,
    root_cause_confirmed: bd002Attribution.status === 'CONFIRMED_CANDIDATE',
    TT_SPRINT_B: bd002Attribution.status === 'CONFIRMED_CANDIDATE' ? 'READY_FOR_ACTIVE' : 'READY',
    TT_SPRINT_B_ACTIVE: false,
    entry_rule: 'Evidence READY AND Root Cause CONFIRMED → TT_SPRINT_B ACTIVE',
    bd002_attribution: bd002Attribution,
  };

  const dayDoc = {
    schema: 'traveltrust.provider_business_data_readiness_day2.v1',
    recorded_at_utc: stamp,
    domain: 'provider',
    step1_day: 2,
    mode: 'discovery_only',
    policy: '不修 Provider · 只 Evidence · 证明 BD-002 是否存在',
    verdict_enum: ['PASS', 'WARN-C', 'WARN-D', 'WARN-P', 'FAIL'],
    ready_rule: READY_RULE,
    checks_total: results.length,
    pass,
    warn_c,
    warn_d,
    warn_p,
    fail,
    ready,
    TT_PROVIDER_BUSINESS_DATA_READINESS_DAY2: ready === 'YES' ? 'READY' : 'NOT_READY',
    discovery,
    results,
    workflow: ['Discovery', 'Evidence', 'Root Cause', 'Sprint ACTIVE', 'Fix', 'Validation', 'Close'],
  };

  fs.mkdirSync(DAY_DIR, { recursive: true });
  fs.writeFileSync(DAY_JSON, JSON.stringify(dayDoc, null, 2) + '\n');
  fs.writeFileSync(
    DAY_MD,
    [
      '# Provider Day 2 · Discovery',
      '',
      `**Ready:** ${ready} · PASS ${pass} · FAIL ${fail}`,
      `**BD-002:** ${bd002Attribution.status} — ${bd002Attribution.reason}`,
      '',
      '| Check | Verdict |',
      '|-------|---------|',
      ...results.map((r) => `| ${r.label} | ${r.verdict} |`),
    ].join('\n') + '\n',
  );

  console.log(`TT_PROVIDER_BUSINESS_DATA_READINESS_DAY2: ${dayDoc.TT_PROVIDER_BUSINESS_DATA_READINESS_DAY2}`);
  console.log(`PASS: ${pass} · WARN-C: ${warn_c} · WARN-D: ${warn_d} · FAIL: ${fail}`);
  console.log(`BD-002 attribution: ${bd002Attribution.status} — ${bd002Attribution.reason}`);
  console.log(`TT_SPRINT_B: ${discovery.TT_SPRINT_B} (ACTIVE=false)`);
  results.forEach((r) => console.log(`  ${r.label}: ${r.verdict} → ${r.evidence}`));
  console.log(`Evidence: ${DAY_JSON}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
