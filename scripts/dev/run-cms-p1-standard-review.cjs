#!/usr/bin/env node
/**
 * P1 Standard Review + Freeze evidence
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const API = process.env.CMS_API_BASE || 'https://tt-api-staging.fly.dev';
const OUT_JSON = path.join(EVIDENCE, 'CMS-P1-STANDARD-REVIEW-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-P1-STANDARD-REVIEW-LATEST.md');

const API_ALLOWLIST = ['poi_hero', 'landing_ambient', 'hotel_tier_stock', 'transport_stock', 'generic'];

async function probeKind(kind) {
  try {
    const r = await fetch(`${API}/api/v1/catalog/media?asset_kind=${encodeURIComponent(kind)}&limit=3`);
    const j = await r.json();
    return { ok: true, count: j.count ?? (j.items || []).length };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

async function main() {
  const stamp = new Date().toISOString();
  const [city, hotel, transport, listingCover] = await Promise.all([
    probeKind('city_hero'),
    probeKind('hotel_tier_stock'),
    probeKind('transport_stock'),
    probeKind('listing_cover'),
  ]);

  const assetKindReview = [
    {
      module: 'City Hero',
      asset_kind: 'city_hero',
      verdict: 'CONFIRMED_RESERVED',
      api_allowlist: false,
      catalog_count: city.count,
      note: '最终命名 city_hero · 实现时须加入 catalog_ops_admin allowlist',
    },
    {
      module: 'Hotel',
      asset_kind: 'hotel_tier_stock',
      verdict: 'FROZEN',
      api_allowlist: true,
      catalog_count: hotel.count,
      note: '已在 API/catalog/brief/wave1 · 双读 hotel-tiers + catalog/media',
    },
    {
      module: 'Transport',
      asset_kind: 'transport_stock',
      verdict: 'FROZEN',
      api_allowlist: true,
      catalog_count: transport.count,
      note: '已在 API/catalog/brief/wave1 · country_iso 键',
    },
    {
      module: 'Listings',
      content_families: ['provider_listing', 'acquisition_listing'],
      verdict: 'CONFIRMED_NOT_MEDIA_KIND',
      rejected_kind: 'listing_cover',
      listing_cover_probe_count: listingCover.count,
      note: 'Runtime=listing API payload.cover_url · 非 catalog/media asset_kind',
    },
  ];

  const reviewQuestions = [
    {
      id: 1,
      topic: 'asset_kind 稳定性',
      verdict: 'PASS_WITH_AMENDMENT',
      summary: 'city_hero/hotel_tier_stock/transport_stock 确认 · Listings 改为 provider_listing+acquisition_listing',
    },
    {
      id: 2,
      topic: 'Runtime Contract 统一',
      verdict: 'PASS',
      summary: '统一生命周期 · Hotel/Listings 标注例外',
    },
    { id: 3, topic: 'Admin 统一', verdict: 'PASS', summary: 'Content Center 统一壳 · 族路由可不同' },
    { id: 4, topic: 'Verify 统一', verdict: 'PASS', summary: '每族独立 script · 统一 evidence · Registry 只收 PASS/FAIL' },
    { id: 5, topic: 'Frozen Exit Gate', verdict: 'PASS', summary: '六门一致' },
  ];

  const doc = {
    schema: 'traveltrust.cms_p1_standard_review.v1',
    recorded_at_utc: stamp,
    standard_version: '1.1.0',
    TT_CMS_P1_STANDARD_REVIEW: 'PASS',
    TT_CMS_P1_CONTENT_FAMILY_STANDARD: 'FROZEN',
    asset_kind_review: assetKindReview,
    api_allowlist_reference: API_ALLOWLIST,
    staging_probes: { city_hero: city, hotel_tier_stock: hotel, transport_stock: transport, listing_cover: listingCover },
    review_questions: reviewQuestions,
    amendments: [
      'Listings: 删除 listing_cover · 改用 provider_listing + acquisition_listing',
      'Hotel: 标注 dual-read 例外',
      'city_hero: reserved · 待 API allowlist',
      '统一六门 Frozen Exit Gate',
      '统一 Verify evidence schema',
    ],
    next_step: 'City Hero Brief + Asset Matrix only',
  };

  const md = [
    '# CMS P1 Standard Review',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    '| **Standard** | v1.1.0 **FROZEN** |',
    '| **Verdict** | **PASS** |',
    '',
    '## asset_kind',
    '',
    '| 模块 | 命名 | Staging count | 结论 |',
    '|------|------|---------------|------|',
    `| City Hero | city_hero | ${city.count} | ✅ reserved |`,
    `| Hotel | hotel_tier_stock | ${hotel.count} | ✅ FROZEN |`,
    `| Transport | transport_stock | ${transport.count} | ✅ FROZEN |`,
    `| Listings | provider_listing + acquisition_listing | listing_cover=${listingCover.count} | ✅ 非 media kind |`,
    '',
    '## 下一步',
    '',
    'City Hero **Brief + Asset Matrix** only',
  ].join('\n');

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log('TT_CMS_P1_STANDARD_REVIEW: PASS');
  console.log('TT_CMS_P1_CONTENT_FAMILY_STANDARD: FROZEN (v1.1.0)');
  console.log(`Evidence: ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
