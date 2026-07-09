/**
 * CMS L5 Content Audit · Catalog + Runtime SSOT
 * 不读 Matrix / Registry / Runbook / Evidence
 */
const http = require('http');
const https = require('https');

const {
  WEB_DEFAULT,
  API_DEFAULT,
  COUNTRY_ZH_TO_ISO,
  classifyRuntimeSource,
  resolveUrl,
  headImage,
  inferAssetFamily,
  evaluateVisualL5,
} = require('./cms-l5-runtime-audit.cjs');
const {
  urlsMatchAudit,
  overlayAmbientContentEval,
  loadAmbientRuntimeWiringSsot,
  buildAuditSsotBlock,
} = require('./cms-l5-audit-ssot.cjs');

const CONTENT_FAMILIES = [
  'destination_ambient',
  'city_hero',
  'poi',
  'food',
  'hotel',
  'transport',
  'provider_listing',
  'acquisition_listing',
  'banner',
  'video_poster',
];

const FAMILY_PRIORITY = {
  destination_ambient: 'P0',
  city_hero: 'P1',
  poi: 'P0',
  food: 'P0',
  hotel: 'P1',
  transport: 'P1',
  provider_listing: 'P1',
  acquisition_listing: 'P1',
  banner: 'P2',
  video_poster: 'P2',
};

const PRODUCT_COUNTRY_ISOS = ['CN', 'JP', 'KR', 'SG', 'TH', 'AE', 'US', 'AU', 'FR', 'ES'];

const COUNTRY_HINTS = {
  CN: ['china', 'beijing', 'shanghai', '中国', '北京', '上海'],
  JP: ['japan', 'tokyo', 'osaka', 'kyoto', '日本', '东京', '大阪', '京都'],
  KR: ['korea', 'seoul', 'busan', '韩国', '首尔'],
  SG: ['singapore', '新加坡'],
  TH: ['thailand', 'bangkok', '泰国', '曼谷'],
  AE: ['uae', 'dubai', 'abu', '阿联酋', '迪拜'],
  US: ['usa', 'america', 'new york', 'nyc', '美国', '纽约'],
  AU: ['australia', 'sydney', 'melbourne', '澳大利亚', '悉尼'],
  FR: ['france', 'paris', '法国', '巴黎'],
  ES: ['spain', 'barcelona', 'madrid', '西班牙', '巴塞罗那'],
};

function fetchJson(url, timeoutMs = 20000, retries = 3) {
  const attempt = (left) =>
    new Promise((resolve) => {
      const lib = url.startsWith('https') ? https : http;
      const u = new URL(url);
      const req = lib.request(
        { hostname: u.hostname, port: u.port || (url.startsWith('https') ? 443 : 80), path: u.pathname + u.search, method: 'GET', headers: { Accept: 'application/json' } },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            try {
              resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, json: JSON.parse(d) });
            } catch {
              resolve({ ok: false, status: res.statusCode, json: null, text: d.slice(0, 200) });
            }
          });
        },
      );
      req.on('error', async (e) => {
        if (left > 1) resolve(await attempt(left - 1));
        else resolve({ ok: false, status: 0, json: null, text: String(e) });
      });
      req.setTimeout(timeoutMs, async () => {
        req.destroy();
        if (left > 1) resolve(await attempt(left - 1));
        else resolve({ ok: false, status: 0, json: null, text: 'timeout' });
      });
      req.end();
    });
  return attempt(retries);
}

function classifyDetailedSource(url, pageContext = '') {
  const base = classifyRuntimeSource(url);
  let lane = base.current_source;
  if (lane === 'official') lane = 'ocs';
  if (lane === 'unsplash' && /landingAmbient|ts_unsplash|fallback/i.test(pageContext + url)) lane = 'ts_fallback';
  if (lane === 'unsplash') lane = 'unsplash';
  if (lane === 'external') lane = 'external';
  if (lane === 'catalog') lane = 'catalog';
  if (lane === 'pexels') lane = 'pexels';
  if (lane === 'placeholder') lane = 'placeholder';
  return { source_lane: lane, ...base };
}

function urlsMatch(a, b) {
  return urlsMatchAudit(a, b);
}

function hintCountryInText(text) {
  const t = (text || '').toLowerCase();
  const hits = [];
  for (const [iso, hints] of Object.entries(COUNTRY_HINTS)) {
    if (hints.some((h) => t.includes(h.toLowerCase()))) hits.push(iso);
  }
  return hits;
}

function detectCountryMismatch(expectedIso, runtimeUrl, contextText) {
  if (!expectedIso) return { country_error: false, reason: null };
  const url = (runtimeUrl || '').toLowerCase();
  const ctx = (contextText || '').toLowerCase();
  const urlHits = hintCountryInText(url);
  const ctxHits = hintCountryInText(ctx);
  if (urlHits.length && !urlHits.includes(expectedIso)) {
    return { country_error: true, reason: `URL 暗示 ${urlHits.join('/')} ≠ 页面国家 ${expectedIso}` };
  }
  if (ctxHits.length && !ctxHits.includes(expectedIso)) {
    return { country_error: true, reason: `文案国家 ${ctxHits.join('/')} ≠ 期望 ${expectedIso}` };
  }
  return { country_error: false, reason: null };
}

function detectCityMismatch(contextText, runtimeUrl) {
  const cityMatch = (contextText || '').match(/(东京|大阪|京都|曼谷|迪拜|纽约|悉尼|巴黎|巴塞罗那|首尔|新加坡)/);
  if (!cityMatch) return { city_error: false, reason: null };
  const city = cityMatch[1];
  const url = (runtimeUrl || '').toLowerCase();
  const cityHints = {
    东京: ['tokyo', 'tokyo', '东京'],
    大阪: ['osaka', '大阪'],
    曼谷: ['bangkok', '曼谷'],
    迪拜: ['dubai', '迪拜'],
    纽约: ['nyc', 'new-york', '纽约'],
    悉尼: ['sydney', '悉尼'],
    巴黎: ['paris', '巴黎'],
    巴塞罗那: ['barcelona', '巴塞罗那'],
    首尔: ['seoul', '首尔'],
    新加坡: ['singapore', '新加坡'],
  };
  const hints = cityHints[city] || [city];
  if (hints.some((h) => url.includes(h.toLowerCase()))) return { city_error: false, reason: null };
  if (/unsplash|pexels|placeholder|ocs-/i.test(url) && !hints.some((h) => url.includes(h.toLowerCase()))) {
    return { city_error: true, reason: `文案含「${city}」· 图片 URL 未体现该城市` };
  }
  return { city_error: false, reason: null };
}

function textImageMismatch(pageTitle, contextText, runtimeUrl, expectedIso) {
  const blob = `${pageTitle || ''} ${contextText || ''}`.trim();
  if (!blob) return { text_image_mismatch: false, reason: null };
  const titleHits = hintCountryInText(blob);
  const urlHits = hintCountryInText(runtimeUrl || '');
  if (titleHits.length === 1 && urlHits.length === 1 && titleHits[0] !== urlHits[0]) {
    return { text_image_mismatch: true, reason: `标题/文案 ${titleHits[0]} · 图片 URL ${urlHits[0]}` };
  }
  if (expectedIso && titleHits.length === 1 && titleHits[0] === expectedIso && /unsplash|pexels/i.test(runtimeUrl || '')) {
    return { text_image_mismatch: true, reason: '文案已锁定国家 · Runtime 仍为 stock 图' };
  }
  return { text_image_mismatch: false, reason: null };
}

async function fetchCatalogInventory(apiBase) {
  const inv = {};
  const countries = await fetchJson(`${apiBase}/api/v1/catalog/countries`);
  inv.countries = countries.json?.items || [];

  const kinds = [
    ['destination_ambient', 'landing_ambient'],
    ['city_hero', 'city_hero'],
    ['transport', 'transport_stock'],
    ['banner', 'banner'],
    ['video_poster', 'video_poster'],
  ];
  for (const [key, kind] of kinds) {
    const r = await fetchJson(`${apiBase}/api/v1/catalog/media?asset_kind=${kind}&limit=100`);
    inv[key] = r.json?.items || [];
  }

  const poi = await fetchJson(`${apiBase}/api/v1/catalog/poi-images?limit=500`);
  inv.poi_images = poi.json?.items || [];

  const hotel = await fetchJson(`${apiBase}/api/v1/catalog/hotel-tiers`);
  inv.hotel_tiers = hotel.json?.items || [];

  const provider = await fetchJson(`${apiBase}/api/v1/market/provider/listings?limit=100`);
  inv.provider_listings = provider.json?.items || [];

  const acquisition = await fetchJson(`${apiBase}/api/v1/market/acquisition/listings?limit=100`);
  inv.acquisition_listings = acquisition.json?.items || [];

  return inv;
}

function catalogAmbientByIso(inv, iso) {
  const media = (inv.destination_ambient || []).find((i) => i.country_iso === iso);
  const country = (inv.countries || []).find((c) => c.iso3166 === iso);
  const payloadUrl = country?.payload?.landing_ambient?.image_url || country?.payload?.landing_ambient?.url;
  const url = media?.url || payloadUrl || null;
  return {
    catalog_has_data: Boolean(url),
    catalog_published: Boolean(url),
    catalog_url: url ? resolveUrl(url, WEB_DEFAULT, API_DEFAULT) : null,
    version: media?.version || country?.version || null,
  };
}

function buildListingContentSlots(inv, variant, apiBase) {
  const list = variant === 'provider' ? inv.provider_listings : inv.acquisition_listings;
  const family = variant === 'provider' ? 'provider_listing' : 'acquisition_listing';
  return (list || []).map((item) => {
    const cover = resolveUrl(item.payload?.cover_url, WEB_DEFAULT, apiBase);
    const isOcs = /ocs-|community-posts/i.test(cover || '');
    return {
      asset_family: family,
      slot_id: `${family}-${item.id}`,
      page_path: variant === 'provider' ? '/market/provider' : '/market/acquisition',
      country_iso: item.payload?.countryIso || null,
      context_text: `${item.payload?.title || ''} ${item.payload?.city || ''} ${item.payload?.description || ''}`.trim(),
      catalog: {
        catalog_has_data: Boolean(cover),
        catalog_published: Boolean(cover) && !isOcs,
        catalog_url: cover,
        listing_id: item.id,
        data_origin: item.data_origin,
      },
      runtime_url: null,
    };
  });
}

function mergeRuntimeIntoSlots(slots, runtimeRows, matchFn) {
  for (const slot of slots) {
    const rt = runtimeRows.find(matchFn.bind(null, slot));
    if (rt) {
      slot.runtime_url = rt.runtime_image_url;
      slot.natural_width = rt.runtime_probe?.natural_width;
      slot.natural_height = rt.runtime_probe?.natural_height;
      slot.runtime_page_path = rt.page_path;
    }
  }
  return slots;
}

function buildDestinationAmbientSlots(inv, runtimeRows, apiBase) {
  const slots = [];
  for (const iso of PRODUCT_COUNTRY_ISOS) {
    const zh = Object.entries(COUNTRY_ZH_TO_ISO).find(([, v]) => v === iso)?.[0];
    const pagePath = zh ? `/?country=${zh}` : '/';
    const cat = catalogAmbientByIso(inv, iso);
    const runtime = runtimeRows.find(
      (r) =>
        r.asset_family === 'destination_ambient' &&
        (r.page_path === pagePath || (iso === 'CN' && r.page_path === '/')),
    );
    slots.push({
      asset_family: 'destination_ambient',
      slot_id: `ambient-${iso}`,
      page_path: pagePath,
      country_iso: iso,
      country_zh: zh,
      context_text: runtime?.asset_label || `${zh || iso} 国家背景`,
      catalog: cat,
      runtime_url: runtime?.runtime_image_url || null,
      runtime_source: runtime ? classifyDetailedSource(runtime.runtime_image_url).source_lane : 'none',
    });
  }
  return slots;
}

async function evaluateContentSlot(slot, apiBase) {
  const runtimeUrl = slot.runtime_url;
  const catalogUrl = slot.catalog?.catalog_url;
  const src = classifyDetailedSource(runtimeUrl, slot.context_text);
  const head = runtimeUrl ? await headImage(runtimeUrl) : { ok: false, status: 0, content_length: 0 };
  const visual = runtimeUrl
    ? evaluateVisualL5({
        current_source: src.source_lane === 'catalog' ? 'catalog' : src.source_lane === 'ocs' ? 'official' : src.source_lane,
        head,
        el: { src: runtimeUrl, naturalWidth: slot.natural_width || 0, naturalHeight: slot.natural_height || 0 },
        asset_family: slot.asset_family,
      })
    : { l5_compliant: false, l5_issues: ['Runtime 未渲染该资产位'] };

  const countryCheck = detectCountryMismatch(slot.country_iso, runtimeUrl, slot.context_text);
  const cityCheck = detectCityMismatch(slot.context_text, runtimeUrl);
  const textCheck = textImageMismatch(slot.page_title, slot.context_text, runtimeUrl, slot.country_iso);

  const runtime_reads_catalog =
    Boolean(runtimeUrl && catalogUrl && urlsMatch(runtimeUrl, catalogUrl)) || src.source_lane === 'catalog';
  const runtime_cms_mismatch =
    slot.catalog?.catalog_published && runtimeUrl && catalogUrl && !urlsMatch(runtimeUrl, catalogUrl);
  const legacy_unmigrated = runtimeUrl
    ? ['ocs', 'unsplash', 'pexels', 'placeholder', 'ts_fallback', 'external'].includes(src.source_lane)
    : false;

  const l5Issues = [...(visual.l5_issues || [])];
  if (countryCheck.country_error) l5Issues.push(countryCheck.reason);
  if (cityCheck.city_error) l5Issues.push(cityCheck.reason);
  if (textCheck.text_image_mismatch) l5Issues.push(textCheck.reason);
  if (runtime_cms_mismatch) l5Issues.push('Catalog publish 与 Runtime URL 不一致（接线断链）');

  const l5_pass = l5Issues.length === 0;
  const cms_managed = true;
  const suggest_replace = !l5_pass || !runtime_reads_catalog || legacy_unmigrated;

  return {
    ...slot,
    cms_jurisdiction: cms_managed,
    catalog_has_data: slot.catalog?.catalog_has_data || false,
    catalog_published: slot.catalog?.catalog_published || false,
    catalog_url: catalogUrl,
    runtime_url: runtimeUrl,
    runtime_source_lane: runtimeUrl ? src.source_lane : 'none',
    runtime_reads_cms_catalog: runtime_reads_catalog,
    still_ocs: src.source_lane === 'ocs',
    still_unsplash: src.source_lane === 'unsplash' || src.source_lane === 'ts_fallback',
    still_pexels: src.source_lane === 'pexels',
    still_placeholder: src.source_lane === 'placeholder',
    still_ts_fallback: src.source_lane === 'ts_fallback' || (src.source_lane === 'unsplash' && slot.asset_family === 'destination_ambient'),
    still_external: src.source_lane === 'external',
    legacy_unmigrated,
    runtime_cms_mismatch,
    l5_compliant: l5_pass,
    l5_issues: l5Issues,
    country_error: countryCheck.country_error,
    city_error: cityCheck.city_error,
    text_image_mismatch: textCheck.text_image_mismatch,
    suggest_replace,
    priority: FAMILY_PRIORITY[slot.asset_family] || 'P2',
    suggested_action: suggestReplaceAction(slot.asset_family, {
      runtime_reads_catalog,
      catalog_published: slot.catalog?.catalog_published,
      runtime_cms_mismatch,
      legacy_unmigrated,
    }),
  };
}

function suggestReplaceAction(family, ctx) {
  if (ctx.runtime_cms_mismatch) return 'P0 · 开启 Frontend catalog opt-in · 验证 Runtime URL = Catalog publish';
  if (family === 'destination_ambient' && !ctx.runtime_reads_catalog) return 'P0 · landing_ambient publish 已有 · 接 Runtime catalog 消费';
  if (!ctx.catalog_published) return `Upload → Review → Publish · ${family}`;
  if (ctx.legacy_unmigrated) return `替换旧来源为 CMS catalog Live · ${family}`;
  return 'Manual L5 sign-off';
}

function normalizeRuntimeFamily(raw, pagePath) {
  if (raw === 'unknown') return pagePath.startsWith('/community') ? 'banner' : 'banner';
  return raw;
}

async function buildRuntimeContentRows(runtimeAssets, inv, apiBase) {
  const rows = [];
  for (const a of runtimeAssets) {
    const family = normalizeRuntimeFamily(a.asset_family, a.page_path);
    if (!CONTENT_FAMILIES.includes(family)) continue;

    let catalog = { catalog_has_data: false, catalog_published: false, catalog_url: null };
    if (family === 'provider_listing' || family === 'acquisition_listing') {
      const list = family === 'provider_listing' ? inv.provider_listings : inv.acquisition_listings;
      const match = list.find((i) => urlsMatch(resolveUrl(i.payload?.cover_url, WEB_DEFAULT, apiBase), a.runtime_image_url));
      catalog = {
        catalog_has_data: Boolean(match),
        catalog_published: Boolean(match && match.payload?.cover_url),
        catalog_url: match ? resolveUrl(match.payload.cover_url, WEB_DEFAULT, apiBase) : null,
        listing_title: match?.payload?.title,
        country_iso: match?.payload?.countryIso,
      };
    } else if (family === 'poi' || family === 'food') {
      const type = family === 'food' ? 'food' : undefined;
      const imgs = inv.poi_images.filter((p) => !type || p.poi_type === type);
      catalog = {
        catalog_has_data: imgs.length > 0,
        catalog_published: imgs.length > 0,
        catalog_url: imgs[0]?.image_url ? resolveUrl(imgs[0].image_url, WEB_DEFAULT, apiBase) : null,
      };
    } else if (family === 'hotel') {
      catalog = {
        catalog_has_data: inv.hotel_tiers.some((t) => t.stock_image_url),
        catalog_published: inv.hotel_tiers.some((t) => t.stock_image_url),
        catalog_url: inv.hotel_tiers.find((t) => t.stock_image_url)?.stock_image_url || null,
      };
    } else if (family === 'transport') {
      const items = inv.transport || [];
      catalog = {
        catalog_has_data: items.length > 0,
        catalog_published: items.length > 0,
        catalog_url: items[0]?.url || null,
      };
    } else if (family === 'city_hero') {
      const items = inv.city_hero || [];
      catalog = {
        catalog_has_data: items.length > 0,
        catalog_published: items.length > 0,
        catalog_url: items[0]?.url || null,
      };
    } else if (family === 'banner') {
      catalog = {
        catalog_has_data: (inv.banner || []).length > 0,
        catalog_published: (inv.banner || []).length > 0,
        catalog_url: inv.banner?.[0]?.url || null,
      };
    } else if (family === 'video_poster') {
      catalog = {
        catalog_has_data: (inv.video_poster || []).length > 0,
        catalog_published: (inv.video_poster || []).length > 0,
        catalog_url: inv.video_poster?.[0]?.url || null,
      };
    }

    rows.push(
      await evaluateContentSlot(
        {
          asset_family: family,
          slot_id: `${family}-${a.page_path}-${(a.runtime_image_url || '').slice(-24)}`,
          page_path: a.page_path,
          country_iso: a.country_iso || null,
          context_text: a.asset_label || '',
          catalog,
          runtime_url: a.runtime_image_url,
          natural_width: a.runtime_probe?.natural_width,
          natural_height: a.runtime_probe?.natural_height,
        },
        apiBase,
      ),
    );
  }
  return rows;
}

function aggregateFamilyReports(allEvaluated) {
  const reports = {};
  for (const fam of CONTENT_FAMILIES) {
    const rows = allEvaluated.filter((r) => r.asset_family === fam);
    const total = rows.length;
    const cmsTaken = rows.filter((r) => r.catalog_published).length;
    const runtimeEffective = rows.filter((r) => r.runtime_reads_cms_catalog).length;
    const l5Pass = rows.filter((r) => r.l5_compliant).length;
    const unmigrated = rows.filter((r) => r.legacy_unmigrated).length;
    const textMismatch = rows.filter((r) => r.text_image_mismatch).length;
    const countryErr = rows.filter((r) => r.country_error).length;
    const cityErr = rows.filter((r) => r.city_error).length;
    const suggest = rows.filter((r) => r.suggest_replace).length;

    reports[fam] = {
      priority: FAMILY_PRIORITY[fam],
      total_assets: total,
      cms_taken_over: cmsTaken,
      runtime_cms_effective: runtimeEffective,
      l5_pass: l5Pass,
      unmigrated: unmigrated,
      text_image_mismatch: textMismatch,
      country_errors: countryErr,
      city_errors: cityErr,
      suggest_replace: suggest,
      cms_takeover_pct: total ? Math.round((cmsTaken / total) * 100) : 0,
      runtime_cms_pct: total ? Math.round((runtimeEffective / total) * 100) : 0,
      l5_pass_pct: total ? Math.round((l5Pass / total) * 100) : 0,
      text_consistency_pct: total ? Math.round(((total - textMismatch) / total) * 100) : 0,
      geo_consistency_pct: total ? Math.round(((total - countryErr - cityErr) / total) * 100) : 0,
      status: total === 0 ? 'NOT_SEEN' : l5Pass === total && runtimeEffective === total && cmsTaken === total ? 'CLOSED' : 'OPEN',
    };
  }
  return reports;
}

function buildRemediationList(allEvaluated) {
  const items = allEvaluated.filter((r) => r.suggest_replace);
  const score = (r) => {
    if (r.priority === 'P0') return 0;
    if (r.priority === 'P1') return 1;
    return 2;
  };
  items.sort((a, b) => score(a) - score(b));
  const buckets = { P0: [], P1: [], P2: [] };
  for (const r of items) {
    const bucket = r.country_error || r.runtime_cms_mismatch || (r.asset_family === 'destination_ambient' && !r.runtime_reads_cms_catalog)
      ? 'P0'
      : r.priority;
    buckets[bucket].push({
      family: r.asset_family,
      page: r.page_path,
      slot: r.slot_id,
      runtime_source: r.runtime_source_lane,
      catalog_published: r.catalog_published,
      runtime_reads_catalog: r.runtime_reads_cms_catalog,
      issues: r.l5_issues,
      action: r.suggested_action,
    });
  }
  return buckets;
}

function formatContentGapMarkdown(report) {
  const lines = [
    '# CMS L5 Content Gap Report',
    '',
    '**SSOT:** Staging Runtime DOM + Catalog API + Market Catalog API',
    '**Phase:** ② Staging · **不含** Matrix / Registry / Runbook / Evidence',
    '',
    `**Generated:** ${report.stamp_utc}`,
    '',
    '## 目标（100%）',
    '',
    '| 指标 | 当前 |',
    '|------|------|',
    `| CMS 接管率 | ${report.summary.cms_takeover_pct}% |`,
    `| Runtime 使用 CMS | ${report.summary.runtime_cms_pct}% |`,
    `| L5 合格率 | ${report.summary.l5_pass_pct}% |`,
    `| 图文一致性 | ${report.summary.text_consistency_pct}% |`,
    `| 国家/城市/文化一致性 | ${report.summary.geo_consistency_pct}% |`,
    '',
    '## Asset Family 汇总',
    '',
    '| Family | Total | CMS已接管 | Runtime生效 | L5合格 | 未迁移 | 图文不一致 | 国家错误 | 城市错误 | 建议替换 |',
    '|--------|-------|-----------|-------------|--------|--------|------------|----------|----------|----------|',
  ];

  for (const fam of CONTENT_FAMILIES) {
    const f = report.family_reports[fam];
    lines.push(
      `| ${fam} | ${f.total_assets} | ${f.cms_taken_over} | ${f.runtime_cms_effective} | ${f.l5_pass} | ${f.unmigrated} | ${f.text_image_mismatch} | ${f.country_errors} | ${f.city_errors} | ${f.suggest_replace} |`,
    );
  }

  lines.push('', '## P0 整改', '');
  for (const x of report.remediation.P0.slice(0, 25)) {
    lines.push(`- **${x.family}** · ${x.page} · ${x.action}`);
    lines.push(`  · issues: ${x.issues.join(' · ')}`);
  }
  lines.push('', '## P1 整改', '');
  for (const x of report.remediation.P1.slice(0, 15)) {
    lines.push(`- **${x.family}** · ${x.page} · ${x.action}`);
  }
  lines.push('', '## P2 整改', '');
  for (const x of report.remediation.P2.slice(0, 15)) {
    lines.push(`- **${x.family}** · ${x.page} · ${x.action}`);
  }

  return lines.join('\n');
}

function summarizeContentReport(familyReports) {
  let total = 0;
  let cms = 0;
  let runtime = 0;
  let l5 = 0;
  let textBad = 0;
  let geoBad = 0;
  for (const f of Object.values(familyReports)) {
    total += f.total_assets;
    cms += f.cms_taken_over;
    runtime += f.runtime_cms_effective;
    l5 += f.l5_pass;
    textBad += f.text_image_mismatch;
    geoBad += f.country_errors + f.city_errors;
  }
  return {
    cms_takeover_pct: total ? Math.round((cms / total) * 100) : 0,
    runtime_cms_pct: total ? Math.round((runtime / total) * 100) : 0,
    l5_pass_pct: total ? Math.round((l5 / total) * 100) : 0,
    text_consistency_pct: total ? Math.round(((total - textBad) / total) * 100) : 0,
    geo_consistency_pct: total ? Math.round(((total - geoBad) / total) * 100) : 0,
  };
}

function applyContentAuditSsot(allEvaluated) {
  const ambientSsot = loadAmbientRuntimeWiringSsot();
  const aligned = allEvaluated.map((r) => overlayAmbientContentEval(r, ambientSsot));
  const familyReports = aggregateFamilyReports(aligned);
  const remediation = buildRemediationList(aligned);
  const summary = summarizeContentReport(familyReports);
  return {
    allEvaluated: aligned,
    familyReports,
    remediation,
    summary,
    audit_ssot: buildAuditSsotBlock(ambientSsot),
    destination_ambient_ssot_closed: Boolean(ambientSsot.is_closed),
  };
}

module.exports = {
  CONTENT_FAMILIES,
  fetchCatalogInventory,
  buildDestinationAmbientSlots,
  buildListingContentSlots,
  mergeRuntimeIntoSlots,
  buildRuntimeContentRows,
  evaluateContentSlot,
  aggregateFamilyReports,
  buildRemediationList,
  formatContentGapMarkdown,
  summarizeContentReport,
  applyContentAuditSsot,
  PRODUCT_COUNTRY_ISOS,
};
