/**
 * CMS 分母锁定 · Content Ownership Inventory + staging catalog 探针（只读 · 今日 Step 1）
 */
const fs = require('fs');
const path = require('path');
const { request, classifyCatalogItems, L5_MANUAL_CHECKS } = require('./cms-image-inventory.cjs');
const {
  parseOwnershipItems,
  isOcsExcluded,
  isVisualAssetRelevant,
  COUNTRY_WAVE,
  classifyUrl,
  deriveL5Status,
} = require('./cms-l5-visual-scan.cjs');

const CMS_CATEGORIES = [
  'destination_ambient',
  'poi',
  'food',
  'city',
  'hotel',
  'transport',
  'provider_listing',
  'acquisition_listing',
  'banner',
  'video_poster',
];

/** After Ambient CLOSED · ops proceeds by asset family (not page). */
const ASSET_FAMILY_ORDER = [...CMS_CATEGORIES];

const POI_SCOPE_LOCK_LATEST = path.join(__dirname, '../../..', 'evidence/GO_cms_operation/CMS-POI-CATALOG-SCOPE-LOCK-LATEST.json');

function readPoiScopeLock() {
  try {
    if (!fs.existsSync(POI_SCOPE_LOCK_LATEST)) return null;
    const j = JSON.parse(fs.readFileSync(POI_SCOPE_LOCK_LATEST, 'utf8'));
    if (j.TT_CMS_POI_CATALOG_SCOPE_LOCK !== 'FROZEN') return null;
    return j;
  } catch {
    return null;
  }
}

function pickNextAction(cmsItems, summary) {
  const ambient = summary.by_category?.destination_ambient;
  const ambientClosed = ambient && ambient.total > 0 && ambient.live === ambient.total;
  const poiScope = readPoiScopeLock();

  if (ambientClosed) {
    for (const cat of ASSET_FAMILY_ORDER.slice(1)) {
      const row = summary.by_category[cat];
      if (!row || row.total === 0) {
        if (row?.catalog_empty) {
          if ((cat === 'poi' || cat === 'food') && !poiScope) {
            return {
              id: 'CMS-POI-SCOPE-LOCK',
              matrix_id: null,
              label: 'POI Catalog Scope Lock · define denominator before Upload',
              modify_entry: 'scripts/dev/run-cms-poi-catalog-scope-lock.cjs',
              step: 'Scope lock → Catalog ingest → re-lock → Review → Replace',
              category: 'poi',
              catalog_empty: true,
              poi_scope_locked: false,
            };
          }
          if ((cat === 'poi' || cat === 'food') && poiScope) {
            const pilot = poiScope.pilot_waves?.active_catalog_build;
            const cityLabel = pilot?.cities?.[0] || '东京';
            const countryIso = pilot?.country_iso || 'JP';
            return {
              id: 'CMS-POI-PILOT-CATALOG-BUILD',
              matrix_id: pilot?.first_poi?.matrix_id || poiScope.wave_1_pilot?.matrix_id || null,
              label: `POI Catalog Build · ${countryIso} · ${cityLabel} · acceptance = ${cityLabel} CLOSED`,
              modify_entry: '/admin/content/poi-images',
              step: 'City catalog build → per-POI Review → Live → City CLOSED',
              category: cat,
              catalog_empty: true,
              poi_scope_locked: true,
              poi_full_scope_total: poiScope.TT_CMS_POI_DENOMINATOR_TOTAL,
              acceptance_unit: 'city',
              acceptance_target: `${cityLabel} CLOSED`,
              advancement: 'Scope → Country → City → POI',
            };
          }
          return {
            id: `CMS-FAMILY-${cat}`,
            matrix_id: null,
            label: `${CATEGORY_LABELS[cat]} · catalog ingest`,
            modify_entry: categoryModifyEntry(cat),
            step: 'Catalog ingest → re-lock → first item Review',
            category: cat,
            catalog_empty: true,
          };
        }
        continue;
      }
      const pending = cmsItems.find((i) => i.category === cat && i.l5_status !== 'LIVE');
      if (pending) {
        return {
          id: pending.id,
          matrix_id: pending.matrix_id || null,
          label: pending.label,
          modify_entry: pending.modify_entry,
          step: 'Review → Replace → Publish',
          category: cat,
        };
      }
    }
    return null;
  }

  return (
    cmsItems.find((i) => i.matrix_id === 'DA-JP-HOME' && i.l5_status !== 'LIVE') ||
    cmsItems.find((i) => i.l5_status !== 'LIVE') ||
    null
  );
}

function categoryModifyEntry(cat) {
  const map = {
    poi: '/admin/content/poi-images',
    food: '/admin/content/poi-images',
    city: '/admin/content/poi-images',
    hotel: '/admin/content/hotel-tiers',
    transport: '/admin/content/transport-region-rules',
    provider_listing: '/admin/content',
    acquisition_listing: '/admin/content',
    banner: '/admin/content/media-assets',
    video_poster: '/admin/content/media-assets',
  };
  return map[cat] || '/admin/content';
}

const CATEGORY_LABELS = {
  destination_ambient: 'Destination Ambient',
  poi: 'POI',
  food: 'Food',
  city: 'City',
  hotel: 'Hotel',
  transport: 'Transport',
  provider_listing: 'Provider Listing Cover',
  acquisition_listing: 'Acquisition Listing Cover',
  banner: 'Banner',
  video_poster: 'Video Poster',
};

function catalogItems(json) {
  return json?.items || json?.orders || json?.guides || json?.media || [];
}

function fiveQuestions({ belongsCms, owner, l5Compliant, needsReplace, currentSource }) {
  return {
    who_manages_image: owner,
    belongs_to_cms: belongsCms,
    l5_compliant: l5Compliant,
    needs_replace: needsReplace,
    replace_completed_today: false,
    current_source: currentSource || null,
  };
}

function cmsItem(base) {
  const needsReplace = base.l5_status !== 'LIVE';
  return {
    ...base,
    owner: 'CMS',
    belongs_to_cms: true,
    l5_status: base.l5_status || 'REVIEW_REQUIRED',
    five_questions: fiveQuestions({
      belongsCms: true,
      owner: 'CMS',
      l5Compliant: base.l5_status === 'LIVE',
      needsReplace,
      currentSource: base.current_source,
    }),
    closure_pipeline: ['review', 'replace_if_needed', 'publish', 'verify', 'evidence', 'live'],
  };
}

function nonCmsEntry(item) {
  return {
    ownership_id: item.id,
    page_module: item.page_module,
    route: item.route,
    owner: item.owner,
    image_owner: item.image_owner,
    modify_entry: item.modify_entry,
    belongs_to_cms: false,
    action_today: 'register_only_do_not_modify',
    five_questions: fiveQuestions({
      belongsCms: false,
      owner: item.owner,
      l5Compliant: null,
      needsReplace: false,
    }),
  };
}

function extractListingImage(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const pick = (raw) => {
    if (typeof raw !== 'string') return null;
    const u = raw.trim();
    return u.startsWith('http') || u.startsWith('/api/') ? u : null;
  };
  return (
    pick(payload.cover_url) ||
    pick(payload.coverUrl) ||
    (Array.isArray(payload.media_urls) ? payload.media_urls.map(pick).find(Boolean) : null)
  );
}

async function probeAmbientSlots(api, daText) {
  const items = [];
  for (const iso of COUNTRY_WAVE) {
    const matrixId = `DA-${iso}-HOME`;
    const r = await request(
      `${api}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${iso}`,
    );
    const rows = catalogItems(r.json);
    const url = rows[0]?.url || null;
    const catalogEmpty = rows.length === 0;
    const classified = url
      ? classifyUrl(url, { expected_country_iso: iso, catalog_empty: catalogEmpty, source_type: rows[0]?.source_type })
      : { current_source: 'unsplash_fallback', flags: { region_review_required: true } };
    let assetLifecycle = 'draft';
    if (daText) {
      const block = daText.split(/\n  - matrix_id:/).find((b) => b.startsWith(` ${matrixId}`));
      assetLifecycle = block?.match(/\n    asset_lifecycle: ([^\n]+)/)?.[1]?.trim() || 'draft';
    }
    const l5Status = deriveL5Status({ ...classified, asset_lifecycle: assetLifecycle });
    items.push(
      cmsItem({
        id: `CMS-DA-${iso}`,
        category: 'destination_ambient',
        matrix_id: matrixId,
        country_iso: iso,
        label: `${iso} Ambient`,
        page_routes: ['/'],
        modify_entry: '/admin/content/landing-ambient',
        url,
        current_source: classified.current_source,
        asset_lifecycle: assetLifecycle,
        l5_status: l5Status,
        probe: { http: r.status, catalog_rows: rows.length },
      }),
    );
  }
  return items;
}

async function probePoiByType(api, poiType, category) {
  const r = await request(`${api}/api/v1/catalog/poi-images?type=${encodeURIComponent(poiType)}`);
  const rows = catalogItems(r.json);
  return rows.map((row, i) => {
    const url = row.image_url || row.url;
    const classified = classifyUrl(url, {
      expected_country_iso: row.country_iso,
      source_type: url && String(url).includes('/uploads/community-posts/') ? 'upload' : undefined,
    });
    const catalogPublished = ['published', 'payload'].includes(String(row.image_source || ''));
    const l5Status = deriveL5Status({
      ...classified,
      asset_lifecycle: catalogPublished && classified.current_source === 'catalog' ? 'live' : 'draft',
    });
    return cmsItem({
      id: `CMS-${category.toUpperCase()}-${row.poi_id || i}`,
      category,
      poi_id: row.poi_id,
      country_iso: row.country_iso,
      city_name_zh: row.city_name_zh,
      label: `${row.city_name_zh || row.country_iso || category} · ${row.legacy_value || row.poi_type || poiType}`,
      page_routes: ['/', '/itinerary/new', '/escrow/[id]'],
      modify_entry: '/admin/content/poi-images',
      url,
      current_source: classified.current_source,
      l5_status: l5Status,
      probe: { http: r.status, poi_type: row.poi_type },
    });
  });
}

async function probeHotel(api) {
  const r = await request(`${api}/api/v1/catalog/hotel-tiers`);
  const rows = catalogItems(r.json);
  return rows.map((row) => {
    const url = row.stock_image_url;
    const classified = classifyUrl(url, {});
    const l5Status = deriveL5Status({ ...classified, asset_lifecycle: url ? 'published' : 'draft' });
    return cmsItem({
      id: `CMS-HOTEL-${row.tier_code || row.id}`,
      category: 'hotel',
      label: `Hotel tier · ${row.tier_code || row.label_key}`,
      page_routes: ['market/itinerary/escrow adapters'],
      modify_entry: '/admin/content/hotel-tiers',
      url,
      current_source: classified.current_source,
      l5_status: l5Status,
      probe: { http: r.status },
    });
  });
}

async function probeTransport(api) {
  const r = await request(`${api}/api/v1/catalog/media?asset_kind=transport_stock`);
  const rows = catalogItems(r.json);
  return rows.map((row, i) => {
    const classified = classifyUrl(row.url, { source_type: row.source_type });
    const l5Status = deriveL5Status({ ...classified, asset_lifecycle: 'published' });
    return cmsItem({
      id: `CMS-TRANSPORT-${i}-${row.country_iso || 'global'}`,
      category: 'transport',
      country_iso: row.country_iso,
      label: `Transport stock · ${row.country_iso || 'global'}`,
      page_routes: ['market/itinerary/escrow adapters'],
      modify_entry: '/admin/content/transport',
      url: row.url,
      current_source: classified.current_source,
      l5_status: l5Status,
      probe: { http: r.status },
    });
  });
}

async function probeListings(api, segment, category) {
  const r = await request(`${api}/api/v1/market/${segment}/listings`);
  const rows = catalogItems(r.json);
  return rows.map((row, idx) => {
    const url = extractListingImage(row.payload);
    const classified = classifyUrl(url, { catalog_empty: !url });
    const l5Status = deriveL5Status({ ...classified, asset_lifecycle: 'draft' });
    return cmsItem({
      id: `CMS-${segment.toUpperCase()}-${row.id}`,
      category,
      listing_id: row.id,
      label: `${CATEGORY_LABELS[category]} #${idx + 1}`,
      page_routes: [`/market/${segment}`],
      modify_entry: '/admin/content',
      url,
      current_source: classified.current_source,
      l5_status: l5Status,
      probe: { http: r.status, segment },
    });
  });
}

async function probeCityFromCatalog(api) {
  const r = await request(`${api}/api/v1/catalog/media?asset_kind=poi_hero&limit=200`);
  const rows = catalogItems(r.json);
  return rows
    .filter((row) => row.scope === 'city' || row.asset_scope === 'city')
    .map((row, i) => {
      const classified = classifyUrl(row.url, { source_type: row.source_type });
      return cmsItem({
        id: `CMS-CITY-${row.id || i}`,
        category: 'city',
        label: `City · ${row.country_iso || i}`,
        page_routes: ['global adapters'],
        modify_entry: '/admin/content',
        url: row.url,
        current_source: classified.current_source,
        l5_status: deriveL5Status({ ...classified, asset_lifecycle: 'draft' }),
      });
    });
}

function inventoryBannerSlots(ownershipItems) {
  return ownershipItems
    .filter(
      (o) =>
        o.owner === 'CMS' &&
        isVisualAssetRelevant(o) &&
        /banner|campaign|public operations/i.test(`${o.page_module} ${o.business_domain} ${o.image_owner}`),
    )
    .map((o) =>
      cmsItem({
        id: `CMS-BANNER-${o.id}`,
        category: 'banner',
        ownership_id: o.id,
        label: o.page_module,
        page_routes: [o.route],
        modify_entry: o.modify_entry,
        url: null,
        current_source: 'placeholder',
        l5_status: 'REVIEW_REQUIRED',
        inventory_only: true,
        note: 'catalog probe TBD · locked from ownership inventory module',
      }),
    );
}

function inventoryVideoPoster(ownershipItems) {
  const v = ownershipItems.find((o) => o.id === 'traveltrust-video');
  if (!v) return [];
  return [
    cmsItem({
      id: 'CMS-VIDEO-POSTER-FAMILY',
      category: 'video_poster',
      ownership_id: v.id,
      label: v.page_module,
      page_routes: (v.route || '/traveltrust').split(' · ').map((s) => s.trim()),
      modify_entry: v.modify_entry,
      url: null,
      current_source: 'media_platform',
      l5_status: 'REVIEW_REQUIRED',
      owner_note: 'Media Platform · CMS track when in scope',
    }),
  ];
}

function buildPageWalkthrough(ownershipItems) {
  const pages = {};
  for (const item of ownershipItems) {
    if (!isVisualAssetRelevant(item)) continue;
    const route = item.route || 'unknown';
    if (!pages[route]) pages[route] = { route, modules: [] };
    pages[route].modules.push({
      ownership_id: item.id,
      page_module: item.page_module,
      owner: item.owner,
      belongs_to_cms: item.owner === 'CMS',
      modify_entry: item.modify_entry,
      in_cms_denominator: item.owner === 'CMS',
    });
  }
  return Object.values(pages).sort((a, b) => String(a.route).localeCompare(String(b.route)));
}

function summarizeCategories(allCmsItems) {
  const byCategory = {};
  for (const cat of CMS_CATEGORIES) {
    const items = allCmsItems.filter((i) => i.category === cat);
    const live = items.filter((i) => i.l5_status === 'LIVE').length;
    byCategory[cat] = {
      label: CATEGORY_LABELS[cat],
      total: items.length,
      live,
      pending: items.length - live,
      completion: items.length ? `${live}/${items.length} (${Math.round((live / items.length) * 100)}%)` : '0/0 (catalog_empty)',
      catalog_empty: items.length === 0,
      target: items.length ? '100% Live' : 're_lock_after_catalog_ingest',
    };
  }
  const total = allCmsItems.length;
  const live = allCmsItems.filter((i) => i.l5_status === 'LIVE').length;
  return {
    by_category: byCategory,
    total,
    live,
    pending: total - live,
    completion: total ? `${live}/${total} (${Math.round((live / total) * 100)}%)` : '0/0',
  };
}

async function runDenominatorLock({ api, ownershipText, daText = '' }) {
  const ownershipItems = parseOwnershipItems(ownershipText);
  const alsoNonCms = ownershipItems
    .filter((o) => isVisualAssetRelevant(o) && o.owner !== 'CMS')
    .map(nonCmsEntry);

  const cmsItems = [];
  cmsItems.push(...(await probeAmbientSlots(api, daText)));
  cmsItems.push(...(await probePoiByType(api, 'attraction', 'poi')));
  cmsItems.push(...(await probePoiByType(api, 'food', 'food')));
  cmsItems.push(...(await probeCityFromCatalog(api)));
  cmsItems.push(...(await probeHotel(api)));
  cmsItems.push(...(await probeTransport(api)));
  cmsItems.push(...(await probeListings(api, 'provider', 'provider_listing')));
  cmsItems.push(...(await probeListings(api, 'acquisition', 'acquisition_listing')));
  cmsItems.push(...inventoryBannerSlots(ownershipItems));
  cmsItems.push(...inventoryVideoPoster(ownershipItems));

  const summary = summarizeCategories(cmsItems);
  const reviewRequired = cmsItems.filter((i) => i.l5_status !== 'LIVE').length;

  const next = pickNextAction(cmsItems, summary);

  const ambientCat = summary.by_category?.destination_ambient;
  const ambientWaveClosure =
    ambientCat && ambientCat.total > 0 && ambientCat.live === ambientCat.total
      ? {
          status: 'COMPLETE',
          live: ambientCat.live,
          total: ambientCat.total,
          display: ambientCat.completion,
          next_asset_family: 'POI',
        }
      : { status: 'IN_PROGRESS', live: ambientCat?.live ?? 0, total: ambientCat?.total ?? 10 };

  return {
    status: 'FROZEN',
    cms_denominator: {
      ...summary,
      items: cmsItems,
      review_required: reviewRequired,
    },
    non_cms_registry: {
      total: alsoNonCms.length,
      items: alsoNonCms,
      rule: 'owner + modify_entry 明确 · 今天不改',
    },
    page_walkthrough: buildPageWalkthrough(ownershipItems),
    today_execution_order: [
      '1_lock_denominator_frozen',
      '2_non_cms_register_only',
      '3_cms_review_replace_publish_verify_evidence_live_per_item',
      '4_refresh_after_each_item',
      '5_final_source_alignment_8_8_review_required_0',
    ],
    end_of_day_acceptance: {
      cms_scope: {
        every_category_live_over_denominator_100pct: true,
        every_item_verify_pass: true,
        every_item_evidence: true,
        source_alignment: '8/8 (100%)',
        review_required: 0,
      },
      non_cms_scope: {
        all_owner_clear: true,
        all_modify_entry_clear: true,
        no_unknown_owner: true,
      },
    },
    next_action: next
      ? {
          id: next.id,
          matrix_id: next.matrix_id,
          label: next.label,
          modify_entry: next.modify_entry,
          step: next.step || (ambientWaveClosure.status === 'COMPLETE' ? 'Review → Replace → Publish' : 'Upload'),
          category: next.category,
          catalog_empty: next.catalog_empty || false,
        }
      : null,
    ambient_wave_closure: ambientWaveClosure,
    honest_boundary:
      'Frozen denominator from ownership + staging catalog · re-run lock after major catalog ingest · ② staging ≠ ③ Production GO',
  };
}

module.exports = {
  CMS_CATEGORIES,
  CATEGORY_LABELS,
  runDenominatorLock,
  summarizeCategories,
};
