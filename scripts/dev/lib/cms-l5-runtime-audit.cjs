/**
 * CMS Runtime Visual Audit · Staging consumer pages
 * SSOT = final rendered DOM · not Matrix/Inventory/Registry
 *
 * Two independent gates (do not merge):
 *   · l5_compliant        — visual quality / placeholder / reachability / hero stock
 *   · cms_ownership_ok    — Runtime consumes CMS catalog publish path
 */
const http = require('http');
const https = require('https');

const { classifyUrl: classifyUrlLegacy } = require('./cms-l5-visual-scan.cjs');
const {
  loadAmbientRuntimeWiringSsot,
  applyAmbientSsotToRuntimeAssetRows,
  reconcileGapSummary,
  urlsMatchAudit,
} = require('./cms-l5-audit-ssot.cjs');

const WEB_DEFAULT = 'https://tt-web-staging.fly.dev';
const API_DEFAULT = 'https://tt-api-staging.fly.dev';

const L5_MIN_WIDTH = 640;
const L5_MIN_HEIGHT = 480;
const L5_MIN_BYTES = 16384;

/** destination_ambient Hero · Visual L5 tiers (3840×2160 track) */
const L5_HERO_PASS_WIDTH = 3840;
const L5_HERO_PASS_HEIGHT = 2160;
const L5_HERO_WARN_WIDTH = 1920;
const L5_HERO_WARN_HEIGHT = 1080;

/** Ops backlog · 8 families only */
const OPS_ASSET_FAMILIES = [
  'destination_ambient',
  'poi',
  'hotel',
  'transport',
  'provider_listing',
  'acquisition_listing',
  'banner',
  'video_poster',
];

const FAMILY_PRIORITY = {
  destination_ambient: 'P0',
  poi: 'P0',
  hotel: 'P1',
  transport: 'P1',
  provider_listing: 'P1',
  acquisition_listing: 'P1',
  banner: 'P2',
  video_poster: 'P2',
};

const COUNTRY_ZH_TO_ISO = {
  中国: 'CN',
  日本: 'JP',
  韩国: 'KR',
  新加坡: 'SG',
  泰国: 'TH',
  阿联酋: 'AE',
  美国: 'US',
  澳大利亚: 'AU',
  法国: 'FR',
  西班牙: 'ES',
};

function classifyRuntimeSource(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { current_source: 'placeholder', flags: { is_placeholder: true } };
  }
  const u = url.trim();
  if (/unsplash/i.test(u)) return { current_source: 'unsplash', flags: { is_unsplash: true } };
  if (/pexels/i.test(u)) return { current_source: 'pexels', flags: { is_pexels: true } };
  if (/placeholder|via\.placeholder|dummyimage|placehold\.co/i.test(u)) {
    return { current_source: 'placeholder', flags: { is_placeholder: true } };
  }
  if (u.includes('/api/v1/catalog/') || u.includes('/catalog/media/')) {
    return { current_source: 'catalog', flags: { is_catalog: true } };
  }
  if (u.includes('/media/traveltrust/') && /\.(svg|png|jpg|webp)$/i.test(u)) {
    return { current_source: 'external', flags: { is_static_asset: true } };
  }
  if (
    u.includes('/api/v1/uploads/community-posts/') ||
    u.includes('/api/v1/uploads/official') ||
    u.includes('official-cold-start') ||
    u.includes('/ocs-')
  ) {
    return { current_source: 'official', flags: { is_official: true } };
  }
  if (u.startsWith('/api/') || u.includes('tt-api-staging') || u.includes('tt-web-staging')) {
    const legacy = classifyUrlLegacy(u, { source_type: 'upload' });
    if (legacy.current_source === 'catalog') return { current_source: 'catalog', flags: { is_catalog: true } };
    return { current_source: 'official', flags: { is_official: true } };
  }
  if (/^https?:\/\//i.test(u)) return { current_source: 'external', flags: { is_external: true } };
  return { current_source: 'external', flags: { is_external: true } };
}

function resolveUrl(src, webBase, apiBase) {
  if (!src) return null;
  const s = src.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/api/')) return `${apiBase}${s}`;
  if (s.startsWith('/')) return `${webBase}${s}`;
  return s;
}

function headImage(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    if (!url || !/^https?:\/\//i.test(url)) {
      resolve({ ok: false, status: 0, content_length: 0, content_type: '' });
      return;
    }
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request(
      { hostname: u.hostname, port: u.port || (url.startsWith('https') ? 443 : 80), path: u.pathname + u.search, method: 'HEAD' },
      (res) => {
        res.resume();
        resolve({
          ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400,
          status: res.statusCode || 0,
          content_length: Number(res.headers['content-length'] || 0),
          content_type: String(res.headers['content-type'] || ''),
        });
      },
    );
    req.on('error', () => resolve({ ok: false, status: 0, content_length: 0, content_type: '' }));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ ok: false, status: 0, content_length: 0, content_type: 'timeout' });
    });
    req.end();
  });
}

function fetchJson(url, timeoutMs = 15000) {
  return new Promise((resolve) => {
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
            resolve({ ok: false, status: res.statusCode, json: null });
          }
        });
      },
    );
    req.on('error', () => resolve({ ok: false, status: 0, json: null }));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ ok: false, status: 0, json: null });
    });
    req.end();
  });
}

function normalizeOpsFamily(raw, pagePath) {
  if (raw === 'food') return 'poi';
  if (raw === 'city') return 'poi';
  if (raw === 'unknown') {
    if (pagePath.startsWith('/community')) return 'banner';
    return 'banner';
  }
  return raw;
}

function inferAssetFamily(pagePath, el) {
  const ctx = `${el.context || ''} ${el.alt || ''} ${el.selector || ''}`.toLowerCase();
  if (pagePath === '/' || pagePath.startsWith('/?')) {
    if (/ambient|backdrop|ken|landing|destination/i.test(ctx) || el.role === 'ambient_backdrop') {
      return 'destination_ambient';
    }
    if (el.naturalWidth >= 900 && el.naturalHeight >= 400) return 'destination_ambient';
    if (/官方|社区|精选|规划|向导|灵感/i.test(ctx)) return 'banner';
  }
  if (pagePath.startsWith('/market/provider')) return 'provider_listing';
  if (pagePath.startsWith('/market/acquisition')) return 'acquisition_listing';
  if (pagePath === '/traveltrust' || pagePath.startsWith('/traveltrust')) return 'video_poster';
  if (pagePath.startsWith('/market')) {
    if (/hotel|酒店|tier|住宿/i.test(ctx)) return 'hotel';
    if (/transport|交通|airport|metro|train|flight/i.test(ctx)) return 'transport';
    if (/food|美食|restaurant|料理|寿司|拉面/i.test(ctx)) return 'poi';
    if (/city|城市|hero/i.test(ctx)) return 'poi';
    if (/poi|attraction|景点|景区/i.test(ctx)) return 'poi';
    if (/itinerary|行程|preview|media/i.test(ctx)) return 'poi';
    return 'poi';
  }
  if (pagePath.startsWith('/community')) return 'banner';
  if (/banner|campaign|hero/i.test(ctx)) return 'banner';
  return 'banner';
}

function countryIsoFromPagePath(pagePath) {
  const m = pagePath.match(/\/\?country=(.+)$/);
  if (!m) return null;
  return COUNTRY_ZH_TO_ISO[m[1]] || null;
}

/** Visual L5 only — not CMS ownership */
function evaluateVisualL5({ current_source, head, el, asset_family }) {
  const issues = [];
  const checks = {
    reachable: true,
    image_quality: null,
    no_placeholder: true,
    hero_not_stock: null,
  };

  if (!el.src) {
    issues.push('无 runtime 图片 URL');
    checks.no_placeholder = false;
  }
  if (current_source === 'placeholder') {
    issues.push('占位图');
    checks.no_placeholder = false;
  }
  if (/\.svg(\?|$)/i.test(el.src || '')) {
    issues.push('SVG/矢量占位 · 非 L5 实拍 poster');
    checks.image_quality = false;
  }
  if (!head.ok) {
    issues.push(`URL 不可达 HTTP ${head.status}`);
    checks.reachable = false;
    checks.image_quality = false;
  } else {
    const w = el.naturalWidth || 0;
    const h = el.naturalHeight || 0;
    const minW = asset_family === 'destination_ambient' ? L5_HERO_WARN_WIDTH : L5_MIN_WIDTH;
    const minH = asset_family === 'destination_ambient' ? L5_HERO_WARN_HEIGHT : L5_MIN_HEIGHT;
    const passW = asset_family === 'destination_ambient' ? L5_HERO_PASS_WIDTH : L5_MIN_WIDTH;
    const passH = asset_family === 'destination_ambient' ? L5_HERO_PASS_HEIGHT : L5_MIN_HEIGHT;
    if (w > 0 && h > 0 && (w < minW || h < minH)) {
      const tierLabel =
        asset_family === 'destination_ambient'
          ? `Hero FAIL · 低于 ${L5_HERO_WARN_WIDTH}×${L5_HERO_WARN_HEIGHT}（含 OCS 640 卡片）`
          : `L5 ≥${L5_MIN_WIDTH}×${L5_MIN_HEIGHT}`;
      issues.push(`尺寸不足 ${w}×${h}（${tierLabel}）`);
      checks.image_quality = false;
      checks.hero_tier = 'FAIL';
    } else if (head.content_length > 0 && head.content_length < L5_MIN_BYTES) {
      issues.push(`文件过小 ${head.content_length} bytes（L5 min ${L5_MIN_BYTES}）`);
      checks.image_quality = false;
    } else {
      checks.image_quality = true;
      if (asset_family === 'destination_ambient' && w > 0 && h > 0) {
        checks.hero_tier = w >= passW && h >= passH ? 'PASS' : 'WARN';
        if (checks.hero_tier === 'WARN') {
          issues.push(`Hero WARN ${w}×${h} · 低于推荐 ${passW}×${passH} · 1080p 可接受`);
        }
      }
    }
  }

  if (asset_family === 'destination_ambient' && (current_source === 'unsplash' || current_source === 'pexels')) {
    issues.push('全屏氛围图为 Unsplash/Pexels stock · 国家/文化/品牌无法验收');
    checks.hero_not_stock = false;
  } else if (asset_family === 'destination_ambient') {
    checks.hero_not_stock = true;
  }

  return { l5_compliant: issues.length === 0, l5_issues: issues, l5_checks: checks };
}

/** CMS catalog consumption — independent from visual L5 */
function evaluateCmsOwnership({ current_source, asset_family, catalog_wiring_gap }) {
  const issues = [];
  if (current_source !== 'catalog') {
    issues.push(`Runtime 未消费 CMS catalog（current_source=${current_source}）`);
  }
  if (catalog_wiring_gap) {
    issues.push('Catalog API 已有 publish · Runtime 仍显示 fallback（接线断链）');
  }
  return {
    cms_ownership_ok: issues.length === 0,
    cms_ownership_issues: issues,
  };
}

function suggestedCmsAsset(asset_family) {
  const map = {
    destination_ambient: 'Destination Ambient · landing_ambient · 10 国 publish + Frontend catalog opt-in',
    poi: 'POI Hero · city × legacy_value · poi-images · 东京起步',
    hotel: 'Hotel Stock · hotel-tiers.stock_image_url',
    transport: 'Transport Stock · transport_stock + Consumer 接线',
    provider_listing: 'Provider Listing cover · governed market listing publish',
    acquisition_listing: 'Acquisition Listing cover · governed market listing publish',
    banner: 'Banner / campaign media · governed publish',
    video_poster: 'Video Poster · media-assets · ≥16KB JPG/WebP',
  };
  return map[asset_family] || map.banner;
}

async function catalogAmbientUrl(apiBase, countryIso) {
  const r = await fetchJson(
    `${apiBase}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${encodeURIComponent(countryIso)}`,
  );
  const item = r.json?.items?.[0];
  const url = item?.url || item?.public_url || item?.media_url || null;
  return { url: url ? resolveUrl(url, WEB_DEFAULT, apiBase) : null, count: r.json?.count || 0, http: r.status };
}

async function auditExtractedImages({ page_path, images, webBase, apiBase }) {
  const rows = [];
  for (const el of images) {
    const runtime_url = resolveUrl(el.src, webBase, apiBase);
    const classified = classifyRuntimeSource(runtime_url);
    const rawFamily = inferAssetFamily(page_path, { ...el, src: runtime_url });
    const asset_family = normalizeOpsFamily(rawFamily, page_path);
    const head = await headImage(runtime_url);

    let catalog_wiring_gap = false;
    let catalog_published_url = null;
    if (asset_family === 'destination_ambient') {
      const iso = countryIsoFromPagePath(page_path) || 'CN';
      const cat = await catalogAmbientUrl(apiBase, iso);
      catalog_published_url = cat.url;
      if (cat.count > 0 && cat.url && runtime_url && !urlsMatchAudit(cat.url, runtime_url)) {
        catalog_wiring_gap = true;
      }
    }

    const visual = evaluateVisualL5({
      current_source: classified.current_source,
      head,
      el: { ...el, src: runtime_url },
      asset_family,
    });
    const ownership = evaluateCmsOwnership({
      current_source: classified.current_source,
      asset_family,
      catalog_wiring_gap,
    });

    const allIssues = [...visual.l5_issues, ...ownership.cms_ownership_issues];

    rows.push({
      page_path,
      asset_family,
      asset_label: el.alt || el.context || el.selector || asset_family,
      runtime_image_url: runtime_url,
      current_source: classified.current_source,
      l5_compliant: visual.l5_compliant,
      cms_ownership_ok: ownership.cms_ownership_ok,
      l5_issues: visual.l5_issues,
      cms_ownership_issues: ownership.cms_ownership_issues,
      issues: allIssues,
      l5_checks: visual.l5_checks,
      catalog_wiring_gap,
      catalog_published_url,
      suggested_cms_asset: suggestedCmsAsset(asset_family),
      affects_production: ['destination_ambient', 'poi', 'hotel', 'transport', 'provider_listing', 'acquisition_listing'].includes(asset_family),
      priority: FAMILY_PRIORITY[asset_family] || 'P2',
      runtime_probe: {
        natural_width: el.naturalWidth,
        natural_height: el.naturalHeight,
        display_width: el.width,
        display_height: el.height,
        http: head.status,
        bytes: head.content_length,
        kind: el.kind || 'img',
      },
    });
  }
  return rows;
}

function familyProgressBar(pct) {
  const filled = Math.round(pct / 10);
  return `${'█'.repeat(filled)}${'□'.repeat(10 - filled)}`;
}

function summarizeGapReport(allRows) {
  const ambientSsot = loadAmbientRuntimeWiringSsot();
  const rows = applyAmbientSsotToRuntimeAssetRows(allRows, ambientSsot);
  const opsRows = rows.filter((r) => OPS_ASSET_FAMILIES.includes(r.asset_family));
  const familyBoard = {};

  for (const fam of OPS_ASSET_FAMILIES) {
    const rows = opsRows.filter((r) => r.asset_family === fam);
    const seen = rows.length > 0;
    const l5Open = seen && rows.some((r) => !r.l5_compliant);
    const cmsOpen = seen && rows.some((r) => !r.cms_ownership_ok);
    const wiringOpen = seen && rows.some((r) => r.catalog_wiring_gap);

    let progress_pct = 0;
    if (fam === 'destination_ambient') {
      const countries = Object.keys(COUNTRY_ZH_TO_ISO);
      let wired = 0;
      for (const zh of countries) {
        const path = `/?country=${zh}`;
        const ambient = rows.filter((r) => r.page_path === path || (path === '/?country=中国' && r.page_path === '/'));
        const row = ambient.find((r) => r.l5_checks?.hero_not_stock !== undefined) || ambient[0];
        if (row && row.cms_ownership_ok && !row.catalog_wiring_gap) wired += 1;
      }
      progress_pct = Math.round((wired / countries.length) * 100);
    } else if (seen) {
      const l5Pass = rows.filter((r) => r.l5_compliant).length;
      const cmsPass = rows.filter((r) => r.cms_ownership_ok).length;
      progress_pct = Math.round(((l5Pass + cmsPass) / (rows.length * 2)) * 100);
    }

    familyBoard[fam] = {
      priority: FAMILY_PRIORITY[fam],
      runtime_seen: seen,
      l5: l5Open ? 'OPEN' : seen ? 'CLOSED' : 'NOT_SEEN',
      cms_ownership: cmsOpen ? 'OPEN' : seen ? 'CLOSED' : 'NOT_SEEN',
      catalog_wiring_gap: wiringOpen,
      progress_pct,
      progress_bar: familyProgressBar(progress_pct),
      blocker:
        !seen
          ? 'Consumer 面无 Runtime 图或未审计到'
          : wiringOpen
            ? 'Catalog publish 存在 · Frontend 未消费（P0 接线）'
            : cmsOpen
              ? 'Ownership：替换为 CMS catalog Live'
              : l5Open
                ? 'L5：视觉质量/氛围 stock'
                : '—',
    };
  }

  const l5Gaps = opsRows.filter((r) => !r.l5_compliant);
  const cmsGaps = opsRows.filter((r) => !r.cms_ownership_ok);
  const wiringGaps = opsRows.filter((r) => r.catalog_wiring_gap);

  const baseSummary = {
    acceptance_standard:
      'Runtime 为唯一验收标准 · L5（视觉质量）与 CMS Ownership（归属）分列判定 · Destination Ambient Runtime/Live 以 CMS-AMBIENT-RUNTIME-WIRING-LATEST.json 为唯一真源',
    ops_asset_families: OPS_ASSET_FAMILIES,
    family_board: familyBoard,
    l5_gaps_open: l5Gaps.length > 0,
    cms_ownership_gaps_open: cmsGaps.length > 0,
    catalog_wiring_gaps_open: wiringGaps.length > 0,
    p0_blocker: familyBoard.destination_ambient.catalog_wiring_gap
      ? 'Destination Ambient：Catalog API 有 publish · Runtime 仍 Unsplash（Frontend catalog opt-in 未接）'
      : null,
    l5_gap_families: [...new Set(l5Gaps.map((r) => r.asset_family))],
    cms_gap_families: [...new Set(cmsGaps.map((r) => r.asset_family))],
  };

  return reconcileGapSummary(baseSummary, rows, ambientSsot);
}

function formatGapReportMarkdown(report) {
  const s = report.summary;
  const lines = [
    '# CMS Runtime Visual Gap Report',
    '',
    report.summary.acceptance_standard,
    '',
    `**Phase:** ② Staging · **SSOT:** Runtime DOM · \`${report.web_base}\``,
    `**Generated:** ${report.stamp_utc}`,
    '',
  ];

  if (s.p0_blocker) {
    lines.push('## P0 Blocker', '', s.p0_blocker, '');
  }

  lines.push('## Asset Family Board（运营视图 · 8 类）', '');
  lines.push('| Family | Priority | L5 | CMS Ownership | Progress | Blocker |');
  lines.push('|--------|----------|-----|---------------|----------|---------|');
  for (const fam of OPS_ASSET_FAMILIES) {
    const b = s.family_board[fam];
    lines.push(
      `| ${fam} | ${b.priority} | ${b.l5} | ${b.cms_ownership} | ${b.progress_bar} ${b.progress_pct}% | ${b.blocker} |`,
    );
  }

  lines.push('', '## 接线断链（Catalog publish ≠ Runtime）', '');
  const wiring = report.assets.filter((a) => a.catalog_wiring_gap);
  if (!wiring.length) {
    lines.push('_本轮未检测到 catalog wiring gap_');
  } else {
    for (const w of wiring.slice(0, 12)) {
      lines.push(`- **${w.page_path}** · Runtime: ${w.runtime_image_url}`);
      lines.push(`  · Catalog publish: ${w.catalog_published_url}`);
    }
  }

  lines.push('', '## 分列 Gap 样例（L5 ≠ Ownership）', '');
  lines.push('| Page | Family | L5 | CMS | Source |');
  lines.push('|------|--------|----|-----|--------|');
  const sample = report.assets
    .filter((a) => OPS_ASSET_FAMILIES.includes(a.asset_family))
    .slice(0, 20);
  for (const a of sample) {
    lines.push(
      `| ${a.page_path} | ${a.asset_family} | ${a.l5_compliant ? '✅' : '❌'} | ${a.cms_ownership_ok ? '✅' : '❌'} | ${a.current_source} |`,
    );
  }

  lines.push('', '---', '', '*Matrix / Inventory / Registry 不参与判定。*');
  return lines.join('\n');
}

module.exports = {
  WEB_DEFAULT,
  API_DEFAULT,
  COUNTRY_ZH_TO_ISO,
  OPS_ASSET_FAMILIES,
  auditExtractedImages,
  summarizeGapReport,
  formatGapReportMarkdown,
  inferAssetFamily,
  evaluateVisualL5,
  evaluateCmsOwnership,
  resolveUrl,
  classifyRuntimeSource,
  headImage,
};
