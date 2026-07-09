/**
 * CMS L5 Visual Asset Scan · read-only probes + queue bucketing (operational · not governance).
 */
const {
  request,
  parseInventoryItems,
  l5AutomatedGate,
  isExternalStockUrl,
  L5_MANUAL_CHECKS,
} = require('./cms-image-inventory.cjs');

const COUNTRY_WAVE = ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE', 'CN'];

const OPS_PRIORITY = {
  P0: {
    label: '首页第一印象 · Wave 1',
    description: 'Destination Ambient · 十国完成后首页质感明显提升',
    queues: ['destination_ambient'],
  },
  P1: {
    label: '业务展示 · CMS POI / Hotel / Transport',
    description: '定制旅行 · 行程详情直接受益',
    queues: ['poi', 'hotel', 'transport'],
  },
  P2: {
    label: '运营内容 · Market Listing Covers',
    description: '按来源分子队列 · 避免 Banner 混排',
    queues: ['provider_listing', 'acquisition_listing', 'guide_listing', 'discover_listing', 'video'],
  },
};

const CMS_QUEUES = [
  'destination_ambient',
  'poi',
  'hotel',
  'transport',
  'provider_listing',
  'acquisition_listing',
  'guide_listing',
  'discover_listing',
  'video',
];

const OPS_PRIORITY_BY_QUEUE = Object.fromEntries(
  Object.entries(OPS_PRIORITY).flatMap(([tier, cfg]) =>
    cfg.queues.map((q) => [q, tier]),
  ),
);

const WORKFLOW = ['upload', 'review', 'publish', 'verify', 'evidence', 'live'];

const L5_STATUS = ['PASS', 'REVIEW_REQUIRED', 'VERIFIED', 'LIVE'];

/** CMS Operation Wave 1 · 闭环队列（Guide/Discover 仅跟踪） */
const CMS_OPERATION_WAVE_1 = {
  id: 'wave_1',
  label: 'CMS Operation Wave 1',
  closed_loop_queues: [
    'destination_ambient',
    'poi',
    'hotel',
    'transport',
    'provider_listing',
    'acquisition_listing',
  ],
  tracking_only: [
    { queue: 'guide_listing', owner: 'OCS', note: '跟踪 · 不纳入 CMS 闭环' },
    { queue: 'discover_listing', owner: 'API', note: '跟踪 · 不纳入 CMS 闭环' },
  ],
  phases: [
    {
      priority: 'P0',
      queues: ['destination_ambient'],
      label: 'Destination Ambient · 10 国',
      next_step: '逐国完成 JP→KR→TH→SG→FR→US→AU→ES→AE→CN',
    },
    {
      priority: 'P1',
      queues: ['poi', 'hotel', 'transport'],
      label: 'POI · Hotel · Transport',
      next_step: '各家族完成 L5 替换',
    },
    {
      priority: 'P2',
      queues: ['provider_listing', 'acquisition_listing'],
      label: 'Provider · Acquisition Listing',
      next_step: '逐项替换',
    },
  ],
};

const WAVE_1_QUEUE_LABELS = {
  destination_ambient: 'Destination Ambient',
  poi: 'POI',
  hotel: 'Hotel',
  transport: 'Transport',
  provider_listing: 'Provider Listing',
  acquisition_listing: 'Acquisition Listing',
};

const WAVE_1_QUEUE_PRIORITY = {
  destination_ambient: 'P0',
  poi: 'P1',
  hotel: 'P1',
  transport: 'P1',
  provider_listing: 'P2',
  acquisition_listing: 'P2',
};

function catalogItems(json) {
  return json?.items || json?.orders || json?.guides || json?.media || [];
}

function parseOwnershipItems(text) {
  const section = text.split(/^categories:\s*$/m)[1]?.split(/^quick_lookup:/m)[0] || '';
  const items = [];
  const blocks = section.split(/\n      - id: /).slice(1);
  for (const block of blocks) {
    const id = block.match(/^([^\n]+)/)?.[1]?.trim();
    if (!id) continue;
    const get = (key) => {
      const m = block.match(new RegExp(`\\n        ${key}: "?([^"\\n]+)"?`));
      return m ? m[1].trim() : null;
    };
    items.push({
      id,
      category_id: null,
      page_module: get('page_module'),
      route: get('route'),
      business_domain: get('business_domain'),
      belongs_to: get('belongs_to'),
      owner: get('owner'),
      image_owner: get('image_owner'),
      modify_entry: get('modify_entry'),
      current_status: get('current_status'),
      business_criticality: get('business_criticality'),
      data_owner: get('data_owner'),
    });
  }
  for (const cat of section.split(/\n  - id: /).slice(1)) {
    const catId = cat.match(/^([^\n]+)/)?.[1]?.trim();
    if (!catId) continue;
    const sub = cat.split(/\n      - id: /).slice(1);
    for (const block of sub) {
      const id = block.match(/^([^\n]+)/)?.[1]?.trim();
      if (!id) continue;
      const existing = items.find((i) => i.id === id);
      if (existing) existing.category_id = catId;
    }
  }
  return items;
}

function isOcsExcluded(item) {
  const io = (item.image_owner || '').toLowerCase();
  const bt = (item.belongs_to || '').toLowerCase();
  const ow = (item.owner || '').toUpperCase();
  if (ow === 'OCS' || ow === 'OPS') return true;
  if (bt.includes('ocs') && !bt.includes('cms')) return true;
  if (/\bocs\b/i.test(io) && !/\bcms\b/i.test(io)) return true;
  if (/css gradient|css token|n\/a \(ui frozen\)|^n\/a$/i.test(io)) return true;
  return false;
}

function isVisualAssetRelevant(item) {
  const io = (item.image_owner || '').toLowerCase();
  if (!io || io === 'n/a') return false;
  if (/css gradient|css token|css backdrop|layout token|无全屏摄影/i.test(io)) return false;
  return true;
}

function mapCmsQueue(item, assetKind) {
  const id = item.id || '';
  const domain = (item.business_domain || '').toLowerCase();
  const io = (item.image_owner || '').toLowerCase();
  const kind = (assetKind || '').toLowerCase();

  if (kind === 'landing_ambient' || /destination ambient|landing_ambient/.test(domain + io)) {
    return 'destination_ambient';
  }
  if (kind === 'poi_hero' || /poi/.test(domain + io + id)) return 'poi';
  if (kind === 'hotel_tier_stock' || /hotel/.test(domain + io + id)) return 'hotel';
  if (kind === 'transport_stock' || /transport/.test(domain + io + id)) return 'transport';
  if (/video|poster|media platform/.test(domain + io + id)) return 'video';
  if (/provider/.test(id + domain)) return 'provider_listing';
  if (/acquisition/.test(id + domain)) return 'acquisition_listing';
  if (/guide/.test(id + domain)) return 'guide_listing';
  if (/discover|order.cover/.test(id + domain + io)) return 'discover_listing';
  if (item.owner === 'CMS') return 'destination_ambient';
  return null;
}

function classifyUrl(url, ctx = {}) {
  const flags = {
    is_unsplash: false,
    is_pexels: false,
    is_placeholder: false,
    is_old_external: false,
    region_review_required: false,
  };
  if (!url || typeof url !== 'string' || !url.trim()) {
    flags.is_placeholder = true;
    if (ctx.expected_country_iso && ctx.catalog_empty) {
      flags.region_review_required = true;
    }
    return { current_source: 'placeholder', flags };
  }
  const u = url.trim();
  flags.is_unsplash = /unsplash/i.test(u);
  flags.is_pexels = /pexels/i.test(u);
  flags.is_placeholder = /placeholder|via\.placeholder|dummyimage|placehold\.co/i.test(u);

  if (flags.is_unsplash || flags.is_pexels) {
    flags.is_old_external = true;
    flags.region_review_required = !!(ctx.expected_country_iso && ctx.catalog_empty);
    return {
      current_source: ctx.catalog_empty ? 'unsplash_fallback' : 'old_external',
      flags,
    };
  }
  if (flags.is_placeholder) {
    return { current_source: 'placeholder', flags };
  }
  if (ctx.source_type === 'upload' || u.startsWith('/api/v1/catalog/') || u.includes('/catalog/media/')) {
    return { current_source: 'catalog', flags };
  }
  if (u.startsWith('/media/') || u.startsWith('/public/')) {
    return { current_source: 'media_platform', flags };
  }
  if (/^https?:\/\//i.test(u)) {
    flags.is_old_external = !flags.is_unsplash && !flags.is_pexels;
    return { current_source: flags.is_old_external ? 'old_external' : 'catalog_partial', flags };
  }
  return { current_source: 'catalog_partial', flags };
}

function deriveL5Status(finding) {
  if (finding.asset_lifecycle === 'live') return 'LIVE';
  if (finding.asset_lifecycle === 'verified' || finding.verify_gate === 'PASS') return 'VERIFIED';
  if (finding.l5_compliant) return 'PASS';
  return 'REVIEW_REQUIRED';
}

function operationalAction(finding) {
  if (finding.flags?.region_review_required) return 'Region Review Required';
  if (finding.l5_status === 'LIVE') return 'Live · monitor only';
  if (finding.l5_status === 'VERIFIED') return 'Evidence → Live';
  if (finding.l5_status === 'PASS') return 'Manual L5 sign-off';
  return 'Upload → Review → Publish → Verify → Evidence → Live';
}

function buildFinding(base) {
  const l5Auto = l5AutomatedGate(base.current_source, base.asset_lifecycle || 'draft');
  const l5Compliant =
    base.current_source === 'catalog' &&
    !base.flags?.is_unsplash &&
    !base.flags?.is_pexels &&
    !base.flags?.is_placeholder &&
    l5Auto.gate === 'PASS_PARTIAL';
  const owner = base.owner || 'CMS';
  const needsWorkflow =
    owner === 'CMS' && !!base.cms_queue && (l5Auto.enter_workflow === true || !l5Compliant);

  const finding = {
    ...base,
    ops_priority: base.ops_priority || OPS_PRIORITY_BY_QUEUE[base.cms_queue] || null,
    target_source: base.target_source || 'catalog',
    l5_automated: l5Auto,
    l5_compliant: l5Compliant,
    needs_cms_l5_workflow: needsWorkflow,
    workflow: needsWorkflow ? WORKFLOW : [],
    l5_manual_checks: Object.fromEntries(L5_MANUAL_CHECKS.map((k) => [k, 'pending'])),
  };
  finding.l5_status = deriveL5Status(finding);
  finding.operational_action = operationalAction(finding);
  return finding;
}

function extractListingImage(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const pick = (raw) => {
    if (typeof raw !== 'string') return null;
    const u = raw.trim();
    if (!u) return null;
    if (u.startsWith('http') || u.startsWith('/api/')) return u;
    return null;
  };
  return (
    pick(payload.cover_url) ||
    pick(payload.coverUrl) ||
    (Array.isArray(payload.media_urls) ? payload.media_urls.map(pick).find(Boolean) : null) ||
    pick(payload.videoUrl) ||
    pick(payload.video_url)
  );
}

function ownershipById(items) {
  return Object.fromEntries(items.map((i) => [i.id, i]));
}

function inventoryByMatrixId(items) {
  const m = {};
  for (const i of items) {
    if (i.matrix_id) m[i.matrix_id] = i;
    m[i.id] = i;
  }
  return m;
}

function ambientFlagsWhenEmpty(iso) {
  return {
    is_placeholder: false,
    is_unsplash: true,
    is_pexels: false,
    is_old_external: true,
    region_review_required: true,
  };
}

async function probeDestinationAmbient(api, ownership, invByMatrix) {
  const findings = [];
  const own = ownership['home-destination-ambient'] || ownership['dest-ambient-all-countries'];
  for (const iso of COUNTRY_WAVE) {
    const matrixId = `DA-${iso}-HOME`;
    const inv = invByMatrix[matrixId];
    const r = await request(
      `${api}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${iso}`,
    );
    const items = catalogItems(r.json);
    const url = items[0]?.url || null;
    const catalogEmpty = items.length === 0;
    const classified = url
      ? classifyUrl(url, {
          expected_country_iso: iso,
          catalog_empty: catalogEmpty,
          source_type: items[0]?.source_type,
        })
      : { current_source: 'unsplash_fallback', flags: ambientFlagsWhenEmpty(iso) };

    findings.push(
      buildFinding({
        scan_id: `VIS-${matrixId}`,
        ownership_id: own?.id || 'dest-ambient-all-countries',
        inventory_id: inv?.id || `IMG-DA-${iso}-HOME`,
        matrix_id: matrixId,
        page_entry: {
          route: own?.route || '/',
          page_module: own?.page_module || 'Destination Ambient',
          modify_entry: inv?.admin_route || own?.modify_entry || '/admin/content/landing-ambient',
        },
        owner: 'CMS',
        cms_queue: 'destination_ambient',
        ops_priority: 'P0',
        asset_kind: 'landing_ambient',
        country_iso: iso,
        country_label: `${iso} Ambient`,
        url,
        probe: { http: r.status, catalog_items: items.length },
        ...classified,
        asset_lifecycle: inv?.asset_lifecycle || 'draft',
      }),
    );
  }
  return findings;
}

function parsePoiHeroLifecycle(poiHeroText, matrixId) {
  if (!poiHeroText || !matrixId) return null;
  const block = poiHeroText.split(/\n  - matrix_id:/).find((b) => b.startsWith(` ${matrixId}`));
  if (!block) return null;
  const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
  return {
    asset_lifecycle: get('asset_lifecycle'),
    matrix_row_status: get('matrix_row_status'),
    current_source: get('current_source'),
  };
}

function buildPoiMatrixLookup(poiHeroText) {
  const map = {};
  if (!poiHeroText) return map;
  for (const block of poiHeroText.split(/\n  - matrix_id:/).slice(1)) {
    const matrix_id = block.match(/^ ([^\n]+)/)?.[1]?.trim();
    const legacy = block.match(/\n    legacy_value: "?([^"\n]+)"?/)?.[1]?.trim();
    const city = block.match(/\n    city_zh: "?([^"\n]+)"?/)?.[1]?.trim();
    const lifecycle = block.match(/\n    asset_lifecycle: ([^\n]+)/)?.[1]?.trim();
    if (legacy && city && matrix_id) {
      map[`${city}::${legacy}`] = { matrix_id, asset_lifecycle: lifecycle };
    }
  }
  return map;
}

function buildHotelTransportWaveLookup(waveText) {
  const byTier = {};
  const byTransportIso = {};
  if (!waveText) return { byTier, byTransportIso };
  for (const block of waveText.split(/\n  - matrix_id:/).slice(1)) {
    const matrix_id = block.match(/^ ([^\n]+)/)?.[1]?.trim();
    const tier_code = block.match(/\n    tier_code: ([^\n]+)/)?.[1]?.trim();
    const country_iso = block.match(/\n    country_iso: ([^\n]+)/)?.[1]?.trim();
    const lifecycle = block.match(/\n    asset_lifecycle: ([^\n]+)/)?.[1]?.trim();
    const asset_family = block.match(/\n    asset_family: ([^\n]+)/)?.[1]?.trim();
    if (matrix_id && tier_code) byTier[tier_code] = { matrix_id, asset_lifecycle: lifecycle };
    if (matrix_id && country_iso && asset_family === 'transport') {
      byTransportIso[country_iso] = { matrix_id, asset_lifecycle: lifecycle };
    }
  }
  return { byTier, byTransportIso };
}

function buildListingsWaveLookup(waveText) {
  const byListingKey = {};
  const byCoverFile = {};
  if (!waveText) return { byListingKey, byCoverFile };
  for (const block of waveText.split(/\n  - matrix_id:/).slice(1)) {
    const matrix_id = block.match(/^ ([^\n]+)/)?.[1]?.trim();
    const variant = block.match(/\n    variant: ([^\n]+)/)?.[1]?.trim();
    const listing_id = block.match(/\n    listing_id: ([^\n]+)/)?.[1]?.trim();
    const cover_file = block.match(/\n    cover_file: ([^\n]+)/)?.[1]?.trim();
    const lifecycle = block.match(/\n    asset_lifecycle: ([^\n]+)/)?.[1]?.trim();
    const ref = { matrix_id, asset_lifecycle: lifecycle, variant, cover_file };
    if (matrix_id && variant && listing_id && listing_id !== 'null' && !listing_id.includes('pending')) {
      byListingKey[`${variant}:${listing_id}`] = ref;
    }
    if (matrix_id && variant && cover_file) {
      byCoverFile[`${variant}:${cover_file}`] = ref;
      byCoverFile[cover_file] = ref;
    }
  }
  return { byListingKey, byCoverFile };
}

function parseListingsWaveLifecycle(waveText, matrixId) {
  if (!waveText || !matrixId) return null;
  const block = waveText.split(/\n  - matrix_id:/).find((b) => b.startsWith(` ${matrixId}`));
  if (!block) return null;
  const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
  return {
    asset_lifecycle: get('asset_lifecycle'),
    matrix_row_status: get('matrix_row_status'),
    current_source: get('current_source'),
  };
}

function parseHotelTransportWaveLifecycle(waveText, matrixId) {
  if (!waveText || !matrixId) return null;
  const block = waveText.split(/\n  - matrix_id:/).find((b) => b.startsWith(` ${matrixId}`));
  if (!block) return null;
  const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
  return {
    asset_lifecycle: get('asset_lifecycle'),
    matrix_row_status: get('matrix_row_status'),
    current_source: get('current_source'),
  };
}

async function probePoiImages(api, ownership, poiMatrixLookup = {}) {
  const own = ownership['dest-poi-images'];
  const r = await request(`${api}/api/v1/catalog/poi-images`);
  const rows = catalogItems(r.json);
  const findings = [];
  const maxSample = 40;
  for (let i = 0; i < Math.min(rows.length, maxSample); i++) {
    const row = rows[i];
    const url = row.image_url || row.url;
    const classified = classifyUrl(url, {
      expected_country_iso: row.country_iso,
      source_type: ['published', 'payload'].includes(row.image_source) ? 'upload' : undefined,
    });
    const matrixKey = `${row.city_name_zh || row.city_zh || ''}::${row.legacy_value || row.name_zh || ''}`;
    const matrixRef = poiMatrixLookup[matrixKey] || null;
    findings.push(
      buildFinding({
        scan_id: `VIS-POI-${row.poi_id || i}`,
        matrix_id: matrixRef?.matrix_id || null,
        ownership_id: own?.id || 'dest-poi-images',
        inventory_id: row.poi_type === 'food' ? 'IMG-FAM-POI-FOOD' : 'IMG-FAM-POI-CITY',
        page_entry: {
          route: own?.route || '/ · /itinerary/new · /escrow/[id]',
          page_module: own?.page_module || 'POI 配图',
          modify_entry: own?.modify_entry || '/admin/content/poi-images',
        },
        owner: 'CMS',
        cms_queue: 'poi',
        ops_priority: 'P1',
        asset_kind: 'poi_hero',
        country_iso: row.country_iso,
        city_name_zh: row.city_name_zh,
        poi_type: row.poi_type,
        url,
        asset_lifecycle: matrixRef?.asset_lifecycle || 'draft',
        probe: { http: r.status, image_source: row.image_source },
        poi_total_in_api: rows.length,
        ...classified,
      }),
    );
  }
  if (rows.length === 0) {
    findings.push(
      buildFinding({
        scan_id: 'VIS-POI-FAMILY',
        ownership_id: own?.id || 'dest-poi-images',
        inventory_id: 'IMG-FAM-POI-CITY',
        page_entry: {
          route: own?.route || '/',
          page_module: 'POI family · no published images',
          modify_entry: '/admin/content/poi-images',
        },
        owner: 'CMS',
        cms_queue: 'poi',
        ops_priority: 'P1',
        asset_kind: 'poi_hero',
        url: null,
        current_source: 'placeholder',
        flags: {
          is_unsplash: false,
          is_pexels: false,
          is_placeholder: true,
          is_old_external: false,
          region_review_required: false,
        },
        probe: { http: r.status, catalog_items: 0 },
      }),
    );
  }
  return findings;
}

async function probeHotelTiers(api, ownership, hotelWaveLookup = {}) {
  const own = ownership['hotel-transport-stock'];
  const r = await request(`${api}/api/v1/catalog/hotel-tiers`);
  const rows = catalogItems(r.json);
  const findings = [];
  for (const row of rows) {
    const url = row.stock_image_url;
    const waveRef = hotelWaveLookup[row.tier_code] || null;
    const classified = classifyUrl(url, { source_type: url ? 'upload' : undefined });
    findings.push(
      buildFinding({
        scan_id: `VIS-HOTEL-${row.tier_code || row.id}`,
        matrix_id: waveRef?.matrix_id || null,
        ownership_id: own?.id || 'hotel-transport-stock',
        inventory_id: 'IMG-FAM-HOTEL',
        page_entry: {
          route: own?.route || 'market/itinerary/escrow adapters',
          page_module: `Hotel tier · ${row.tier_code || row.label_key || 'tier'}`,
          modify_entry: '/admin/content/hotel-tiers',
        },
        owner: 'CMS',
        cms_queue: 'hotel',
        ops_priority: 'P1',
        asset_kind: 'hotel_tier_stock',
        url,
        asset_lifecycle: waveRef?.asset_lifecycle || 'draft',
        probe: { http: r.status },
        ...classified,
      }),
    );
  }
  if (rows.length === 0) {
    findings.push(
      buildFinding({
        scan_id: 'VIS-HOTEL-FAMILY',
        ownership_id: own?.id || 'hotel-transport-stock',
        inventory_id: 'IMG-FAM-HOTEL',
        page_entry: {
          route: own?.route || 'market/itinerary/escrow',
          page_module: 'Hotel tier stock · empty',
          modify_entry: '/admin/content/hotel-tiers',
        },
        owner: 'CMS',
        cms_queue: 'hotel',
        ops_priority: 'P1',
        asset_kind: 'hotel_tier_stock',
        url: null,
        current_source: 'placeholder',
        flags: {
          is_unsplash: false,
          is_pexels: false,
          is_placeholder: true,
          is_old_external: false,
          region_review_required: false,
        },
        probe: { http: r.status, catalog_items: 0 },
      }),
    );
  }
  return findings;
}

async function probeTransportStock(api, ownership, transportWaveLookup = {}) {
  const own = ownership['hotel-transport-stock'];
  const r = await request(`${api}/api/v1/catalog/media?asset_kind=transport_stock`);
  const rows = catalogItems(r.json);
  const findings = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const waveRef = transportWaveLookup[row.country_iso] || null;
    const classified = classifyUrl(row.url, {
      source_type: ['upload', 'published', 'payload'].includes(row.source_type) ? 'upload' : row.source_type,
    });
    findings.push(
      buildFinding({
        scan_id: `VIS-TRANSPORT-${i}-${row.country_iso || 'global'}`,
        matrix_id: waveRef?.matrix_id || null,
        ownership_id: own?.id || 'hotel-transport-stock',
        inventory_id: 'IMG-FAM-TRANSPORT',
        page_entry: {
          route: own?.route || 'market/itinerary/escrow adapters',
          page_module: 'Transport stock',
          modify_entry: '/admin/content/transport',
        },
        owner: 'CMS',
        cms_queue: 'transport',
        ops_priority: 'P1',
        asset_kind: 'transport_stock',
        country_iso: row.country_iso,
        url: row.url,
        asset_lifecycle: waveRef?.asset_lifecycle || 'draft',
        probe: { http: r.status },
        ...classified,
      }),
    );
  }
  if (rows.length === 0) {
    findings.push(
      buildFinding({
        scan_id: 'VIS-TRANSPORT-FAMILY',
        ownership_id: own?.id || 'hotel-transport-stock',
        inventory_id: 'IMG-FAM-TRANSPORT',
        page_entry: {
          route: own?.route || 'market/itinerary/escrow',
          page_module: 'Transport stock · empty',
          modify_entry: '/admin/content/transport',
        },
        owner: 'CMS',
        cms_queue: 'transport',
        ops_priority: 'P1',
        asset_kind: 'transport_stock',
        url: null,
        current_source: 'placeholder',
        flags: {
          is_unsplash: false,
          is_pexels: false,
          is_placeholder: true,
          is_old_external: false,
          region_review_required: false,
        },
        probe: { http: r.status, catalog_items: 0 },
      }),
    );
  }
  return findings;
}

async function probeMarketListings(api, ownership, listingsWaveLookup = {}) {
  const findings = [];
  const segments = [
    {
      path: 'provider',
      queue: 'provider_listing',
      ownId: 'market-provider-listing',
      route: '/market/provider',
    },
    {
      path: 'acquisition',
      queue: 'acquisition_listing',
      ownId: 'market-acquisition-listing',
      route: '/market/acquisition',
    },
  ];
  for (const seg of segments) {
    const own = ownership[seg.ownId];
    const r = await request(`${api}/api/v1/market/${seg.path}/listings`);
    const rows = catalogItems(r.json).slice(0, 25);
    for (const row of rows) {
      const url = extractListingImage(row.payload);
      const coverFile = url?.split('/').pop();
      const waveRef =
        listingsWaveLookup.byListingKey?.[`${seg.path}:${row.id}`] ||
        listingsWaveLookup.byCoverFile?.[`${seg.path}:${coverFile}`] ||
        listingsWaveLookup.byCoverFile?.[coverFile] ||
        null;
      const payloadCatalogBound =
        row.payload?.cover_source === 'catalog' || Boolean(row.payload?.cover_catalog_asset_id);
      const classified = classifyUrl(url, {
        catalog_empty: !url,
        source_type:
          waveRef?.asset_lifecycle === 'live' || payloadCatalogBound ? 'upload' : undefined,
      });
      findings.push(
        buildFinding({
          scan_id: waveRef?.matrix_id ? `VIS-MKT-${seg.path}-${row.id}` : `VIS-MKT-${seg.path}-${row.id}`,
          matrix_id: waveRef?.matrix_id || null,
          ownership_id: own?.id || seg.ownId,
          inventory_id: null,
          page_entry: {
            route: own?.route || seg.route,
            page_module: own?.page_module || `Market ${seg.path} listing cover`,
            modify_entry: own?.modify_entry || '/admin/content',
          },
          owner: 'CMS',
          cms_queue: seg.queue,
          ops_priority: 'P2',
          asset_kind: 'listing_cover',
          listing_segment: seg.path,
          url,
          listing_id: row.id,
          asset_lifecycle: waveRef?.asset_lifecycle || 'draft',
          probe: {
            http: r.status,
            segment: seg.path,
            cover_catalog_asset_id: row.payload?.cover_catalog_asset_id || null,
            cover_source: row.payload?.cover_source || null,
          },
          ...classified,
        }),
      );
    }
  }
  return findings;
}

async function probeGuideListings(api, ownership) {
  const own = ownership['market-guide-avatar'] || ownership['guides-list-avatar'];
  const r = await request(`${api}/api/v1/guides?limit=15`);
  const rows = catalogItems(r.json).slice(0, 15);
  const findings = [];
  for (const row of rows) {
    const url = row.avatar_url || row.avatarUrl;
    const classified = classifyUrl(url, {});
    findings.push(
      buildFinding({
        scan_id: `VIS-GUIDE-${row.id || row.guide_id}`,
        ownership_id: own?.id || 'market-guide-avatar',
        page_entry: {
          route: own?.route || '/market · /guides',
          page_module: own?.page_module || 'Guide listing avatar/cover',
          modify_entry: own?.modify_entry || '/admin/official/guides',
        },
        owner: 'OCS',
        cms_queue: 'guide_listing',
        ops_priority: 'P2',
        asset_kind: 'guide_listing_cover',
        url,
        probe: { http: r.status },
        needs_cms_l5_workflow: false,
        ...classified,
      }),
    );
  }
  return findings;
}

async function probeDiscoverListings(api, ownership) {
  const own = ownership['market-order-cover'];
  const r = await request(`${api}/api/v1/discover/orders?limit=15`);
  const rows = catalogItems(r.json).slice(0, 15);
  const findings = [];
  for (const row of rows) {
    const url = row.cover_image || row.image || row.coverImage;
    const classified = classifyUrl(url, {});
    findings.push(
      buildFinding({
        scan_id: `VIS-DISCOVER-${row.id || row.order_id}`,
        ownership_id: own?.id || 'market-order-cover',
        page_entry: {
          route: own?.route || '/market',
          page_module: own?.page_module || 'Discover order card cover',
          modify_entry: own?.modify_entry || 'Backend discover seed',
        },
        owner: 'API',
        cms_queue: 'discover_listing',
        ops_priority: 'P2',
        asset_kind: 'discover_listing_cover',
        url,
        probe: { http: r.status },
        needs_cms_l5_workflow: false,
        ...classified,
      }),
    );
  }
  return findings;
}

async function probeTraveltrustMedia(api, ownership) {
  const own = ownership['traveltrust-video'];
  const r = await request(`${api}/api/v1/traveltrust/page-brief`);
  const media = r.json?.media || {};
  const staticPaths = [
    media.default_role_media_prefix,
    ...(media.role_video_env_keys || []).map((k) => `${k}=env`),
  ].filter(Boolean);
  return [
    buildFinding({
      scan_id: 'VIS-TT-VIDEO-FAMILY',
      ownership_id: own?.id || 'traveltrust-video',
      inventory_id: null,
      page_entry: {
        route: own?.route || '/ · /traveltrust',
        page_module: own?.page_module || '品牌视频 / Poster',
        modify_entry: own?.modify_entry || 'public/media · Media Platform',
      },
      owner: 'Media',
      cms_queue: 'video',
      ops_priority: 'P2',
      asset_kind: 'brand_video',
      url: media.default_role_media_prefix || null,
      current_source: 'media_platform',
      flags: {
        is_unsplash: false,
        is_pexels: false,
        is_placeholder: false,
        is_old_external: false,
        region_review_required: false,
      },
      probe: { http: r.status, static_refs: staticPaths },
      needs_cms_l5_workflow: false,
      l5_compliant: false,
      workflow: [],
    }),
  ];
}

function buildReferenceFindings(ownershipItems) {
  const refs = [];
  const refIds = [
    'market-order-cover',
    'market-main',
    'itinerary-new',
    'did-rank-boards',
    'traveltrust-page',
    'home-itinerary-preview',
  ];
  const byId = ownershipById(ownershipItems);
  for (const id of refIds) {
    const o = byId[id];
    if (!o || isOcsExcluded(o)) continue;
    refs.push({
      ownership_id: id,
      page_entry: {
        route: o.route,
        page_module: o.page_module,
        modify_entry: o.modify_entry,
      },
      owner: o.owner,
      image_owner: o.image_owner,
      scan_note: 'API/runtime reference · tracked in P2 subqueues where applicable',
      excluded_from_cms_queue: true,
    });
  }
  return refs;
}

function buildExcludedOcs(ownershipItems) {
  return ownershipItems
    .filter((o) => isOcsExcluded(o) && isVisualAssetRelevant(o))
    .map((o) => ({
      ownership_id: o.id,
      page_module: o.page_module,
      route: o.route,
      owner: o.owner,
      image_owner: o.image_owner,
      modify_entry: o.modify_entry,
      note: 'OCS/OPS/CSS-frozen · scan records ownership only · no CMS queue',
    }));
}

function bucketQueues(findings) {
  const queues = Object.fromEntries(CMS_QUEUES.map((q) => [q, []]));
  for (const f of findings) {
    if (!f.cms_queue) continue;
    const entry = {
      scan_id: f.scan_id,
      ownership_id: f.ownership_id,
      inventory_id: f.inventory_id,
      matrix_id: f.matrix_id,
      ops_priority: f.ops_priority,
      page_entry: f.page_entry,
      owner: f.owner,
      current_source: f.current_source,
      target_source: f.target_source,
      l5_status: f.l5_status,
      operational_action: f.operational_action,
      url: f.url,
      flags: f.flags,
      workflow: f.workflow,
      needs_cms_l5_workflow: f.needs_cms_l5_workflow,
    };
    queues[f.cms_queue].push(entry);
  }
  for (const q of CMS_QUEUES) {
    queues[q].sort((a, b) => String(a.scan_id).localeCompare(String(b.scan_id)));
  }
  return queues;
}

function parseDaLifecycle(daText, matrixId) {
  if (!daText || !matrixId) return null;
  const block = daText.split(/\n  - matrix_id:/).find((b) => b.startsWith(` ${matrixId}`));
  if (!block) return null;
  const lc = block.match(/\n    asset_lifecycle: ([^\n]+)/)?.[1]?.trim();
  return { asset_lifecycle: lc || 'draft' };
}

function formatCompletion(live, total) {
  const pct = total ? Math.round((live / total) * 100) : 0;
  return { live, total, pending: total - live, rate_pct: pct, display: `${live}/${total} (${pct}%)` };
}

function buildQueueCompletion(cmsFindings) {
  const out = {};
  for (const queue of CMS_OPERATION_WAVE_1.closed_loop_queues) {
    const items = cmsFindings.filter((f) => f.cms_queue === queue);
    const live = items.filter((f) => f.l5_status === 'LIVE').length;
    out[queue] = {
      label: WAVE_1_QUEUE_LABELS[queue],
      priority: WAVE_1_QUEUE_PRIORITY[queue],
      ...formatCompletion(live, items.length),
    };
  }
  return out;
}

function nextAmbientTarget(cmsFindings) {
  for (const iso of COUNTRY_WAVE) {
    const matrixId = `DA-${iso}-HOME`;
    const f = cmsFindings.find((x) => x.matrix_id === matrixId);
    if (!f || f.l5_status !== 'LIVE') {
      return { matrix_id: matrixId, country_iso: iso, finding: f || null };
    }
  }
  return null;
}

function deriveWave1Phase(queueCompletion, cmsFindings) {
  const p0 = queueCompletion.destination_ambient;
  if (p0 && p0.live < p0.total) {
    const next = nextAmbientTarget(cmsFindings);
    return {
      priority: 'P0',
      label: CMS_OPERATION_WAVE_1.phases[0].label,
      next_step: CMS_OPERATION_WAVE_1.phases[0].next_step,
      next_asset: next
        ? {
            matrix_id: next.matrix_id,
            country_iso: next.country_iso,
            modify_entry: next.finding?.page_entry?.modify_entry,
          }
        : null,
      complete: false,
    };
  }
  for (const queue of ['poi', 'hotel', 'transport']) {
    const q = queueCompletion[queue];
    if (q && q.live < q.total) {
      const pending = cmsFindings.find((f) => f.cms_queue === queue && f.l5_status !== 'LIVE');
      return {
        priority: 'P1',
        label: CMS_OPERATION_WAVE_1.phases[1].label,
        next_step: CMS_OPERATION_WAVE_1.phases[1].next_step,
        next_asset: pending
          ? { scan_id: pending.scan_id, cms_queue: queue, modify_entry: pending.page_entry?.modify_entry }
          : null,
        complete: false,
      };
    }
  }
  for (const queue of ['provider_listing', 'acquisition_listing']) {
    const q = queueCompletion[queue];
    if (q && q.live < q.total) {
      const pending = cmsFindings.find((f) => f.cms_queue === queue && f.l5_status !== 'LIVE');
      return {
        priority: 'P2',
        label: CMS_OPERATION_WAVE_1.phases[2].label,
        next_step: CMS_OPERATION_WAVE_1.phases[2].next_step,
        next_asset: pending
          ? { scan_id: pending.scan_id, cms_queue: queue, modify_entry: pending.page_entry?.modify_entry }
          : null,
        complete: false,
      };
    }
  }
  return { priority: null, label: 'Wave 1 complete', next_step: '启动下一波（更多 POI/酒店/交通/视频）', complete: true };
}

function buildWave1WorkPlan(queueCompletion) {
  return CMS_OPERATION_WAVE_1.phases.flatMap((phase) =>
    phase.queues.map((queue) => ({
      priority: phase.priority,
      queue,
      label: WAVE_1_QUEUE_LABELS[queue],
      count: queueCompletion[queue]?.total ?? 0,
      completion: queueCompletion[queue]?.display ?? '0/0 (0%)',
      next_step: phase.next_step,
    })),
  );
}

function lifecycleToWaitingLabel(stage) {
  const map = {
    draft: 'Waiting Upload',
    review: 'Waiting Review',
    approved: 'Waiting Publish',
    published: 'Waiting Verify',
    verified: 'Waiting Evidence',
  };
  return map[stage] || 'Waiting Upload';
}

function listingWaitingLabel(finding) {
  if (finding.l5_status === 'LIVE') return null;
  if (finding.current_source === 'catalog') return 'Waiting Verify';
  if (finding.current_source === 'catalog_partial') return 'Waiting Review';
  return 'Waiting Upload';
}

function getCountryPipelineStage(destinationAmbient, iso) {
  if (!destinationAmbient?.pipeline?.by_stage || !iso) return 'draft';
  for (const stage of ['live', 'verified', 'published', 'approved', 'review', 'draft']) {
    if (destinationAmbient.pipeline.by_stage[stage]?.some((r) => r.country_iso === iso)) {
      return stage;
    }
  }
  return 'draft';
}

function formatNextLabel(nextAsset) {
  if (!nextAsset) return '—';
  if (nextAsset.country_iso) return `${nextAsset.country_iso} Ambient`;
  if (nextAsset.cms_queue && WAVE_1_QUEUE_LABELS[nextAsset.cms_queue]) {
    return WAVE_1_QUEUE_LABELS[nextAsset.cms_queue];
  }
  return nextAsset.matrix_id || nextAsset.scan_id || '—';
}

function blockedSortRank(item) {
  const pri = { P0: 0, P1: 1, P2: 2 }[item.ops_priority] ?? 9;
  const inProgress = item.waiting !== 'Waiting Upload' ? 0 : 1;
  let countryOrder = 99;
  const iso = item.label?.split(' ')[0];
  const idx = COUNTRY_WAVE.indexOf(iso);
  if (idx >= 0) countryOrder = idx;
  return pri * 10000 + inProgress * 1000 + countryOrder;
}

function buildWave1Blocked({ cmsFindings = [], destinationAmbient = null }) {
  const blocked = [];
  const cms = cmsFindings.filter((f) => f.owner === 'CMS');

  if (destinationAmbient?.pipeline?.by_stage) {
    for (const stage of ['review', 'approved', 'published', 'verified', 'draft']) {
      for (const row of destinationAmbient.pipeline.by_stage[stage] || []) {
        blocked.push({
          label: `${row.country_iso} Ambient`,
          matrix_id: row.matrix_id,
          ops_priority: 'P0',
          pipeline_stage: stage,
          waiting: lifecycleToWaitingLabel(stage),
        });
      }
    }
  } else {
    for (const f of cms.filter((x) => x.cms_queue === 'destination_ambient' && x.l5_status !== 'LIVE')) {
      blocked.push({
        label: f.country_label || `${f.country_iso} Ambient`,
        matrix_id: f.matrix_id,
        ops_priority: 'P0',
        pipeline_stage: f.asset_lifecycle || 'draft',
        waiting: lifecycleToWaitingLabel(f.asset_lifecycle || 'draft'),
      });
    }
  }

  for (const queue of ['poi', 'hotel', 'transport']) {
    const f = cms.find((x) => x.cms_queue === queue && x.l5_status !== 'LIVE');
    if (!f) continue;
    blocked.push({
      label: WAVE_1_QUEUE_LABELS[queue],
      scan_id: f.scan_id,
      ops_priority: 'P1',
      waiting: listingWaitingLabel(f) || 'Waiting Upload',
    });
  }

  let providerIdx = 0;
  let acquisitionIdx = 0;
  for (const f of cms.filter(
    (x) => ['provider_listing', 'acquisition_listing'].includes(x.cms_queue) && x.l5_status !== 'LIVE',
  )) {
    const idx = f.cms_queue === 'provider_listing' ? ++providerIdx : ++acquisitionIdx;
    const prefix =
      f.cms_queue === 'provider_listing' ? 'Provider Listing' : 'Acquisition Listing';
    blocked.push({
      label: `${prefix} #${idx}`,
      scan_id: f.scan_id,
      listing_id: f.listing_id,
      ops_priority: 'P2',
      waiting: listingWaitingLabel(f) || 'Waiting Upload',
    });
  }

  blocked.sort((a, b) => blockedSortRank(a) - blockedSortRank(b));
  return blocked;
}

function buildWave1Milestone(queueCompletion, waveProgress) {
  const rows = CMS_OPERATION_WAVE_1.closed_loop_queues.map((queue) => ({
    priority: WAVE_1_QUEUE_PRIORITY[queue],
    queue,
    label: WAVE_1_QUEUE_LABELS[queue],
    total: queueCompletion[queue]?.total ?? 0,
    live: queueCompletion[queue]?.live ?? 0,
    completion: queueCompletion[queue]?.display ?? '0/0 (0%)',
  }));
  return {
    label: 'CMS Operation Wave 1',
    subtitle: '33 项里程碑 · Wave 1 全部完成后启动下一波',
    item_total: waveProgress.total,
    rows,
    totals: {
      label: 'CMS Wave 1',
      ...waveProgress,
    },
  };
}

function buildWave1DailyHeadline(w1, prevWaveLive) {
  const live = w1.wave_progress?.live ?? 0;
  const delta = prevWaveLive != null ? live - prevWaveLive : 0;
  return {
    overall: w1.wave_progress?.display ?? '0/33 (0%)',
    p0_ambient: w1.queue_completion?.destination_ambient?.display ?? '0/10 (0%)',
    todays_completed: delta > 0 ? `+${delta}` : '+0',
    todays_completed_n: delta,
    next: formatNextLabel(w1.current_phase?.next_asset),
  };
}

function buildCmsOperationWave1(cmsFindings, destinationAmbient = null) {
  const queue_completion = buildQueueCompletion(cmsFindings);
  const liveTotal = CMS_OPERATION_WAVE_1.closed_loop_queues.reduce(
    (n, q) => n + (queue_completion[q]?.live || 0),
    0,
  );
  const assetTotal = CMS_OPERATION_WAVE_1.closed_loop_queues.reduce(
    (n, q) => n + (queue_completion[q]?.total || 0),
    0,
  );
  const wave_progress = formatCompletion(liveTotal, assetTotal);
  const current = deriveWave1Phase(queue_completion, cmsFindings);
  const wave1 = {
    ...CMS_OPERATION_WAVE_1,
    current_phase: current,
    queue_completion,
    work_plan: buildWave1WorkPlan(queue_completion),
    wave_progress,
    milestone: buildWave1Milestone(queue_completion, wave_progress),
    blocked: buildWave1Blocked({ cmsFindings, destinationAmbient }),
    daily_headline: {
      overall: wave_progress.display,
      p0_ambient: queue_completion.destination_ambient?.display ?? '0/10 (0%)',
      next: formatNextLabel(current.next_asset),
    },
    tracking_only_note: 'Guide Listing (OCS) · Discover Listing (API) — 跟踪即可，不纳入 CMS 闭环',
  };
  return wave1;
}

function buildTodaysReview(findings) {
  return findings
    .filter((f) => f.flags?.region_review_required)
    .map((f) => ({
      scan_id: f.scan_id,
      matrix_id: f.matrix_id,
      country_iso: f.country_iso,
      label: f.country_label || (f.country_iso ? `${f.country_iso} Ambient` : f.scan_id),
      operational_action: 'Region Review Required',
      ops_priority: f.ops_priority,
      modify_entry: f.page_entry?.modify_entry,
    }))
    .sort((a, b) => {
      const ai = COUNTRY_WAVE.indexOf(a.country_iso || '');
      const bi = COUNTRY_WAVE.indexOf(b.country_iso || '');
      if (ai >= 0 && bi >= 0) return ai - bi;
      return String(a.label).localeCompare(String(b.label));
    });
}

function buildPriorityTiers(allFindings, cmsFindings) {
  const tiers = {};
  for (const [tier, cfg] of Object.entries(OPS_PRIORITY)) {
    const inTierAll = allFindings.filter((f) => f.ops_priority === tier);
    const inTierCms = cmsFindings.filter((f) => f.ops_priority === tier);
    const pending = inTierCms.filter((f) => f.needs_cms_l5_workflow);
    const subqueues = {};
    for (const q of cfg.queues) {
      const qAll = inTierAll.filter((f) => f.cms_queue === q);
      if (!qAll.length) continue;
      const qCms = qAll.filter((f) => f.owner === 'CMS');
      subqueues[q] = {
        total: qAll.length,
        cms_total: qCms.length,
        pending: qCms.filter((f) => f.needs_cms_l5_workflow).length,
        owners: [...new Set(qAll.map((f) => f.owner))],
      };
    }
    tiers[tier] = {
      label: cfg.label,
      description: cfg.description,
      total: inTierCms.length,
      pending: pending.length,
      tracked_total: inTierAll.length,
      wave_order: tier === 'P0' ? COUNTRY_WAVE : undefined,
      subqueues,
    };
  }
  return tiers;
}

function summarize(findings, ownershipItems, excludedOcs, referenceNonCms) {
  const cmsFindings = findings.filter((f) => f.owner === 'CMS');
  const needs = cmsFindings.filter((f) => f.needs_cms_l5_workflow);
  const bySource = {};
  const byQueue = {};
  const byL5Status = { PASS: 0, REVIEW_REQUIRED: 0, VERIFIED: 0, LIVE: 0 };
  for (const f of cmsFindings) {
    bySource[f.current_source] = (bySource[f.current_source] || 0) + 1;
    if (f.cms_queue) byQueue[f.cms_queue] = (byQueue[f.cms_queue] || 0) + 1;
    const st = f.l5_status || 'REVIEW_REQUIRED';
    byL5Status[st] = (byL5Status[st] || 0) + 1;
  }
  const flagCounts = {
    unsplash: cmsFindings.filter((f) => f.flags?.is_unsplash).length,
    pexels: cmsFindings.filter((f) => f.flags?.is_pexels).length,
    placeholder: cmsFindings.filter((f) => f.flags?.is_placeholder).length,
    old_external: cmsFindings.filter((f) => f.flags?.is_old_external).length,
    region_review_required: cmsFindings.filter((f) => f.flags?.region_review_required).length,
  };
  const next =
    needs.find((f) => f.matrix_id === 'DA-JP-HOME') ||
    needs.sort((a, b) => String(a.scan_id).localeCompare(String(b.scan_id)))[0] ||
    null;

  return {
    ownership_modules_scanned: ownershipItems.filter((o) => isVisualAssetRelevant(o)).length,
    visual_findings_total: findings.length,
    cms_scope: cmsFindings.length,
    needs_cms_l5_workflow: needs.length,
    l5_compliant_partial: cmsFindings.filter((f) => f.l5_compliant).length,
    excluded_ocs_count: excludedOcs.length,
    reference_non_cms_count: referenceNonCms.length,
    by_current_source: bySource,
    by_cms_queue: byQueue,
    by_l5_status: byL5Status,
    flag_counts: flagCounts,
    ops_priority_tiers: buildPriorityTiers(findings, cmsFindings),
    todays_review: buildTodaysReview(findings),
    cms_operation_wave_1: buildCmsOperationWave1(cmsFindings),
    next_single_asset: next
      ? {
          scan_id: next.scan_id,
          matrix_id: next.matrix_id,
          current_source: next.current_source,
          cms_queue: next.cms_queue,
          ops_priority: next.ops_priority,
          l5_status: next.l5_status,
          modify_entry: next.page_entry?.modify_entry,
        }
      : null,
  };
}

async function runVisualScan({
  api,
  ownershipText,
  inventoryText,
  imageInventoryLatest = null,
  daText = null,
  poiHeroText = null,
  hotelTransportWaveText = null,
  listingsWaveText = null,
}) {
  const ownershipItems = parseOwnershipItems(ownershipText);
  const ownership = ownershipById(ownershipItems);
  const invItems = inventoryText ? parseInventoryItems(inventoryText) : [];
  const invByMatrix = inventoryByMatrixId(invItems);
  const poiMatrixLookup = buildPoiMatrixLookup(poiHeroText);
  const { byTier: hotelWaveLookup, byTransportIso: transportWaveLookup } =
    buildHotelTransportWaveLookup(hotelTransportWaveText);
  const listingsWaveLookup = buildListingsWaveLookup(listingsWaveText);

  if (imageInventoryLatest?.items) {
    for (const row of imageInventoryLatest.items) {
      if (row.matrix_id) {
        invByMatrix[row.matrix_id] = { ...invByMatrix[row.matrix_id], ...row };
      }
    }
  }

  const findings = [];
  findings.push(...(await probeDestinationAmbient(api, ownership, invByMatrix)));
  findings.push(...(await probePoiImages(api, ownership, poiMatrixLookup)));
  findings.push(...(await probeHotelTiers(api, ownership, hotelWaveLookup)));
  findings.push(...(await probeTransportStock(api, ownership, transportWaveLookup)));
  findings.push(...(await probeMarketListings(api, ownership, listingsWaveLookup)));
  findings.push(...(await probeGuideListings(api, ownership)));
  findings.push(...(await probeDiscoverListings(api, ownership)));
  findings.push(...(await probeTraveltrustMedia(api, ownership)));

  const { loadAmbientRuntimeWiringSsot, applyAmbientSsotToVisualFindings, buildAuditSsotBlock } = require('./cms-l5-audit-ssot.cjs');
  const ambientSsot = loadAmbientRuntimeWiringSsot();
  const alignedFindings = applyAmbientSsotToVisualFindings(findings, ambientSsot);

  for (const f of alignedFindings) {
    if (f.matrix_id) {
      const inv = invByMatrix[f.matrix_id];
      const da = daText ? parseDaLifecycle(daText, f.matrix_id) : null;
      const poiHero = poiHeroText ? parsePoiHeroLifecycle(poiHeroText, f.matrix_id) : null;
      const htWave = hotelTransportWaveText ? parseHotelTransportWaveLifecycle(hotelTransportWaveText, f.matrix_id) : null;
      const lstWave = listingsWaveText ? parseListingsWaveLifecycle(listingsWaveText, f.matrix_id) : null;
      f.asset_lifecycle =
        inv?.asset_lifecycle ||
        da?.asset_lifecycle ||
        poiHero?.asset_lifecycle ||
        htWave?.asset_lifecycle ||
        lstWave?.asset_lifecycle ||
        f.asset_lifecycle;
      f.l5_status = deriveL5Status(f);
      f.operational_action = operationalAction(f);
      if (f.l5_status === 'LIVE') f.needs_cms_l5_workflow = false;
    }
  }

  const excludedOcs = buildExcludedOcs(ownershipItems);
  const referenceNonCms = buildReferenceFindings(ownershipItems);
  const queues = bucketQueues(alignedFindings);
  const summary = summarize(alignedFindings, ownershipItems, excludedOcs, referenceNonCms);

  const ownershipModules = ownershipItems
    .filter((o) => isVisualAssetRelevant(o) && !isOcsExcluded(o))
    .map((o) => ({
      ownership_id: o.id,
      page_module: o.page_module,
      route: o.route,
      owner: o.owner,
      image_owner: o.image_owner,
      modify_entry: o.modify_entry,
      current_status: o.current_status,
      business_criticality: o.business_criticality,
      cms_queue_hint: mapCmsQueue(o),
      ops_priority: OPS_PRIORITY_BY_QUEUE[mapCmsQueue(o)] || null,
    }));

  return {
    ownership_modules: ownershipModules,
    visual_findings: alignedFindings,
    queues,
    excluded_ocs: excludedOcs,
    reference_non_cms: referenceNonCms,
    summary,
    cms_operation_wave_1: summary.cms_operation_wave_1,
    ops_priority: OPS_PRIORITY,
    audit_ssot: buildAuditSsotBlock(ambientSsot),
  };
}

module.exports = {
  CMS_QUEUES,
  CMS_OPERATION_WAVE_1,
  OPS_PRIORITY,
  OPS_PRIORITY_BY_QUEUE,
  COUNTRY_WAVE,
  WORKFLOW,
  L5_STATUS,
  buildQueueCompletion,
  buildCmsOperationWave1,
  buildWave1Blocked,
  buildWave1DailyHeadline,
  lifecycleToWaitingLabel,
  parseOwnershipItems,
  isOcsExcluded,
  isVisualAssetRelevant,
  mapCmsQueue,
  classifyUrl,
  deriveL5Status,
  runVisualScan,
  isExternalStockUrl,
};
