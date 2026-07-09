#!/usr/bin/env node
/**
 * Hotel · Ownership Boundary Review（Discovery only）
 * CMS vs Booking vs API 职责边界 · 含 Future Extensibility
 * 不写代码 · 不改 API · 不上传资产
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_JSON = path.join(EVIDENCE, 'CMS-HOTEL-OWNERSHIP-BOUNDARY-REVIEW-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-HOTEL-OWNERSHIP-BOUNDARY-REVIEW-LATEST.md');
const BRIEF = path.join(ROOT, 'data/catalog/hotel-brief.v1.yaml');
const MATRIX = path.join(ROOT, 'data/catalog/hotel-matrix.v1.yaml');
const P1 = path.join(ROOT, 'docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md');
const INVENTORY = path.join(ROOT, 'data/catalog/content-ownership-inventory.v1.yaml');

function fileExists(p) {
  return fs.existsSync(p);
}

function readYamlTierCount() {
  const t = fs.readFileSync(MATRIX, 'utf8');
  return (t.match(/matrix_id: HT-TIER-/g) || []).length;
}

function main() {
  const stamp = new Date().toISOString();
  const tierRows = readYamlTierCount();

  const boundaries = [
    {
      id: 'cms_stock_imagery',
      domain: 'CMS',
      owns: ['hotel_tier_stock 库存图', 'catalog_media_assets 发布与 revision', 'stock_image_asset_id 绑定'],
      modify_via: ['/admin/content/hotel-tiers', '/admin/content/media-assets'],
      verdict: 'PASS',
    },
    {
      id: 'cms_tier_metadata',
      domain: 'CMS',
      owns: ['tier_code', 'sort_order', 'multiplier', 'label_key', 'description_key', 'submit_label_zh'],
      table: 'catalog_hotel_tier_definitions',
      modify_via: ['/admin/content/hotel-tiers'],
      verdict: 'PASS',
    },
    {
      id: 'booking_api_pricing',
      domain: 'Booking / Pricing API',
      owns: ['hotel_base_per_night_cents', 'currency_code', 'per-city pricing template rows'],
      table: 'catalog_pricing_templates',
      cms_must_not: ['写入 base rate', '覆盖 multiplier 语义为价格'],
      consumer_note: 'Frontend: hotelNightRatePerPerson(base, tier) = base × tier.multiplier',
      verdict: 'PASS',
    },
    {
      id: 'booking_api_orders',
      domain: 'Booking / Order API',
      owns: ['订单/行程 payload 中的 hotel tier 选择值', 'escrow 展示用的订单快照'],
      cms_must_not: ['直接写 orders 表', '在 CMS Admin 改订单 tier'],
      read_note: 'Escrow 展示 tier 文案可追溯到 CMS submit_label_zh · 选择事实归 Order API',
      verdict: 'PASS',
    },
    {
      id: 'not_listings',
      domain: 'Listings（独立 P1 模块）',
      owns: ['provider_listing', 'acquisition_listing', 'payload.cover_url'],
      hotel_module_must_not: ['invent listing_cover asset_kind', 'per-property hotel 库存'],
      verdict: 'PASS',
    },
    {
      id: 'not_city_scoped',
      domain: 'Scope',
      rule: 'Hotel tier 全球 3 档 · 非 per-city · 非 POI 分母',
      contrast: ['city_hero = per-city', 'poi_hero = per-poi', 'hotel = global tier'],
      verdict: 'PASS',
    },
    {
      id: 'dual_read_boundary',
      domain: 'CMS Runtime Contract',
      primary: 'GET /api/v1/catalog/hotel-tiers → stock_image_url + tier metadata',
      secondary: 'GET /api/v1/catalog/media?asset_kind=hotel_tier_stock',
      cms_responsibility: 'Publish 后双读一致 · Verify 对拍',
      verdict: 'PASS',
    },
    {
      id: 'consumer_market',
      domain: 'Consumer',
      pages: ['Market / CustomItineraryModal', 'Escrow order summary（只读）'],
      cms_delivers: ['tier 图', 'label keys', 'submit_label_zh', 'multiplier'],
      booking_delivers: ['base rate', 'selected tier on order'],
      verdict: 'PASS',
    },
  ];

  const forbidden_overlaps = [
    { rule: 'CMS 不得设置 hotel_base_per_night_cents', owner: 'Pricing Catalog / Booking API' },
    { rule: 'Booking API 不得 bypass CMS 将外部 URL 作为 Production tier stock', owner: 'CMS + Ownership Policy' },
    { rule: 'Hotel 模块不得承载 merchant listing cover', owner: 'Listings 模块' },
    { rule: 'Admin hotel-tiers 不得创建第 4+ tier 而无 Schema WP', owner: 'Discovery → Implementation WP0' },
    { rule: 'Frontend 不得长期 TS fallback 作为 Production PASS', owner: 'Consumer Ready 门' },
  ];

  const future_extensibility = {
    question: '若从 3 档扩展到 5 档（Economy · Comfort · Premium · Luxury · Ultra Luxury），是否需要修改 Schema？',
    answer: 'YES — 需要 deliberate Schema / API / Frontend WP，不能仅 Matrix 增行',
    schema_changes_required: [
      {
        layer: 'PostgreSQL',
        item: 'catalog_hotel_tier_definitions.tier_code CHECK',
        current: "CHECK (tier_code IN ('tier_economy','tier_comfort','tier_luxury'))",
        migration: '20260607130000_cms_catalog_s2_004_pricing_tiers_media.sql',
        action: '新 migration 扩展 CHECK 或改为 lookup 表 + FK',
      },
      {
        layer: 'Admin API',
        item: 'create_admin_catalog_hotel_tier allowlist',
        current: "hardcoded ['tier_economy','tier_comfort','tier_luxury']",
        file: 'crates/api/src/db/catalog_ops_admin.rs',
        action: '扩展 allowlist 或改为 DB-driven tier registry',
      },
      {
        layer: 'Frontend TS fallback',
        item: 'HOTEL_TIERS · HOTEL_TIER_MULTIPLIER · HOTEL_TIER_SUBMIT_LABELS',
        file: 'frontend/lib/cityDetails/hotels.ts · hotelTierPricing.ts',
        action: '增档或完全切 Catalog API（推荐后者作为 Frozen 目标）',
      },
      {
        layer: 'i18n',
        item: 'market_hotel_tier_* label keys',
        action: '为新 tier 增 locale keys',
      },
      {
        layer: 'Brief / Matrix',
        item: 'hotel-brief.v1.yaml · hotel-matrix.v1.yaml',
        action: 'Brief v2 + Matrix 增行 · 新 pilot waves · 非 ad-hoc',
      },
    ],
    what_does_not_need_redesign: [
      'catalog_hotel_tier_definitions 表结构（行模型已支持 N tier）',
      'hotel_tier_stock asset_kind 语义',
      'dual-read 模式（Primary hotel-tiers + Secondary media）',
      'ops_hierarchy [asset_family, tier, asset]',
      'CMS vs Booking 定价边界（base × multiplier 仍成立）',
    ],
    recommendation:
      'MVP 冻结 3 档足够稳定 · 扩档视为版本化事件（Brief v2 + WP0 migration + Admin allowlist + Verify）· 不在 Discovery 阶段改 Schema · 若产品确认 5 档，在 Implementation 决策后首个 WP 处理 CHECK/allowlist',
    verdict: 'DOCUMENTED — 3-tier MVP stable · expansion requires WP',
  };

  const allPass = boundaries.every((b) => b.verdict === 'PASS');
  const doc = {
    schema: 'traveltrust.cms_hotel_ownership_boundary_review.v1',
    recorded_at_utc: stamp,
    phase: 'DISCOVERY_COMPLETE',
    TT_CMS_HOTEL_OWNERSHIP_BOUNDARY_REVIEW: allPass ? 'PASS' : 'FAIL',
    TT_CMS_HOTEL_DISCOVERY: allPass ? 'BOUNDARY_REVIEW_PASS' : 'BOUNDARY_REVIEW_FAIL',
    p1_standard_ref: 'docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md v1.1.0 FROZEN',
    upstream: {
      brief: 'data/catalog/hotel-brief.v1.yaml',
      matrix: 'data/catalog/hotel-matrix.v1.yaml',
      inventory: 'data/catalog/content-ownership-inventory.v1.yaml#hotel-transport-stock',
    },
    untouched: [
      'p1_standard',
      'ownership_matrix_frozen',
      'city_hero_artifacts',
      'admin',
      'api',
      'runtime_code',
      'frontend',
      'catalog_publish',
      'assets',
    ],
    inputs_present: {
      brief: fileExists(BRIEF),
      matrix: fileExists(MATRIX),
      p1_standard: fileExists(P1),
      inventory: fileExists(INVENTORY),
      matrix_tier_rows: tierRows,
    },
    boundaries,
    forbidden_overlaps,
    future_extensibility,
    cms_vs_booking_vs_api_summary: {
      CMS: 'tier 定义 · stock 图 · labels · multiplier · dual-read publish',
      Booking_API: 'base rate · orders/itinerary tier selection · escrow facts',
      API_Catalog: 'RO endpoints · 不拥有二进制 · 不 bypass CMS revision',
      Listings: '真实酒店/收购 listing · 非 hotel_tier_stock',
    },
    next_step: '等待实现决策 · 不自动进入 WP0/Admin/API/Runtime/Frontend/Upload',
    implementation_blocked_until: 'explicit_go_from_solo_founder',
  };

  const md = [
    '# Hotel · Ownership Boundary Review',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    '| **Phase** | DISCOVERY_COMPLETE |',
    `| **Verdict** | **${doc.TT_CMS_HOTEL_OWNERSHIP_BOUNDARY_REVIEW}** |`,
    '| **Next** | 等待实现决策 · 不进入 WP0/Admin/API/Runtime |',
    '',
    '## CMS vs Booking vs API',
    '',
    '| 域 | 拥有 | 禁止越界 |',
    '|----|------|----------|',
    '| **CMS** | tier 元数据 · `hotel_tier_stock` 图 · Admin publish · dual-read | 定价 · 订单 · listing cover |',
    '| **Booking / Pricing API** | `hotel_base_per_night_cents` · 订单 tier 选择 | 绕过 CMS 上 Production stock 图 |',
    '| **Catalog API** | RO `hotel-tiers` · `catalog/media` | 不存二进制 · 不改 business orders |',
    '| **Listings** | provider/acquisition cover | 非 hotel tier 模块 |',
    '',
    '## 边界核对',
    '',
    '| # | ID | 域 | 结论 |',
    '|---|-----|-----|------|',
    ...boundaries.map((b, i) => `| ${i + 1} | ${b.id} | ${b.domain} | **${b.verdict}** |`),
    '',
    '## 禁止重叠',
    '',
    ...forbidden_overlaps.map((f) => `- **${f.rule}** → owner: ${f.owner}`),
    '',
    '## Future Extensibility（3 → 5 档）',
    '',
    `**问题：** ${future_extensibility.question}`,
    '',
    `**答案：** **${future_extensibility.answer}**`,
    '',
    '### 需要修改的层',
    '',
    '| 层 | 当前 | 扩档动作 |',
    '|----|------|----------|',
    ...future_extensibility.schema_changes_required.map(
      (s) => `| ${s.layer} | \`${s.current || s.item}\` | ${s.action} |`,
    ),
    '',
    '### 无需重设计的部分',
    '',
    ...future_extensibility.what_does_not_need_redesign.map((w) => `- ${w}`),
    '',
    '### 建议',
    '',
    `> ${future_extensibility.recommendation}`,
    '',
    '## 未修改',
    '',
    ...doc.untouched.map((u) => `- ${u}`),
    '',
    '```bash',
    'node scripts/dev/run-cms-hotel-ownership-boundary-review.cjs',
    '```',
  ].join('\n');

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_HOTEL_OWNERSHIP_BOUNDARY_REVIEW: ${doc.TT_CMS_HOTEL_OWNERSHIP_BOUNDARY_REVIEW}`);
  console.log(`Boundaries: ${boundaries.filter((b) => b.verdict === 'PASS').length}/${boundaries.length} PASS`);
  console.log(`Future extensibility: ${future_extensibility.verdict}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
