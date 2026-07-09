/**
 * CMS Image Inventory · probes + L5 gate (operational · not governance).
 */
const fs = require('fs');
const http = require('http');
const https = require('https');

const L5_MANUAL_CHECKS = [
  'country_correct',
  'city_correct',
  'copy_correct',
  'scene_correct',
  'image_quality',
  'no_watermark_logo_copyright_risk',
  'not_old_unsplash_pexels_external',
  'not_placeholder',
  'page_renders_catalog_not_fallback',
];

function request(url, opts = {}) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (url.startsWith('https') ? 443 : 80),
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: opts.headers || {},
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(d);
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode || 0, json, text: d });
        });
      },
    );
    req.on('error', (e) => resolve({ status: 0, json: null, text: String(e) }));
    req.setTimeout(opts.timeoutMs || 20000, () => {
      req.destroy();
      resolve({ status: 0, json: null, text: 'timeout' });
    });
    req.end();
  });
}

function catalogItems(json) {
  return json?.items || json?.media || [];
}

function isExternalStockUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /unsplash|pexels|images\.unsplash|images\.pexels/i.test(url);
}

function classifyCatalogItems(items, hasCountryProbe) {
  const live = items.filter((i) => i.url || i.public_url || i.media_url);
  if (live.length === 0) {
    return hasCountryProbe ? 'unsplash_fallback' : 'placeholder';
  }
  const urls = live.map((i) => i.url || i.public_url || i.media_url);
  const uploaded = live.some((i) => i.source_type === 'upload' || i.source_type === 'catalog');
  const external = urls.some(isExternalStockUrl);
  if (uploaded && !external) return 'catalog';
  if (external) return 'old_external';
  return 'catalog_partial';
}

function l5AutomatedGate(currentSource, assetLifecycle) {
  if (currentSource === 'catalog' && assetLifecycle === 'live') {
    return { gate: 'PASS_PARTIAL', note: 'catalog live · manual L5 checklist still required' };
  }
  if (currentSource === 'catalog') {
    return { gate: 'PENDING_PIPELINE', note: 'catalog present · complete Upload→Live + manual L5' };
  }
  return {
    gate: 'FAIL',
    note: 'non-catalog source · enter CMS L5 workflow one-by-one',
    enter_workflow: true,
  };
}

function pendingManualChecks() {
  return Object.fromEntries(L5_MANUAL_CHECKS.map((k) => [k, 'pending']));
}

function parseInventoryItems(text) {
  const section = text.split(/^items:\s*$/m)[1]?.split(/^excluded_reference:/m)[0] || '';
  const items = [];
  const blocks = section.split(/\n  - id: /).slice(1);
  for (const block of blocks) {
    const id = block.match(/^([^\n]+)/)?.[1]?.trim();
    if (!id) continue;
    const get = (key) => {
      const m = block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`));
      return m ? m[1].trim() : null;
    };
    const order = block.match(/\n    execution_order: (\d+)/)?.[1];
    items.push({
      id,
      asset_type: get('asset_type'),
      owner: get('owner'),
      matrix_id: get('matrix_id'),
      country_iso: get('country_iso'),
      country_zh: get('country_zh'),
      execution_order: order ? Number(order) : null,
      asset_kind: get('asset_kind'),
      admin_route: get('admin_route'),
      scope: get('scope'),
      target_source: get('target_source') || 'catalog',
      in_cms_asset_matrix: block.includes('in_cms_asset_matrix: true'),
      asset_matrix_row: get('asset_matrix_row'),
      probe: get('probe') || 'none',
    });
  }
  return items;
}

function parseDaLifecycle(daText, matrixId) {
  const block = daText.split(/\n  - matrix_id:/).find((b) => b.startsWith(` ${matrixId}`));
  if (!block) return { asset_lifecycle: 'draft', scene: null };
  const lc = block.match(/\n    asset_lifecycle: ([^\n]+)/)?.[1]?.trim();
  const scene = block.match(/\n    scene: ([^\n]+)/)?.[1]?.trim();
  return { asset_lifecycle: lc || 'draft', scene };
}

async function probeInventoryItem(item, api, daText) {
  const probe = item.probe || 'none';
  let currentSource = 'placeholder';
  let probeDetail = { probe_skipped: true };

  if (probe === 'catalog_media_by_country' && item.country_iso && item.asset_kind) {
    const r = await request(
      `${api}/api/v1/catalog/media?asset_kind=${encodeURIComponent(item.asset_kind)}&country_iso=${item.country_iso}`,
    );
    const items = catalogItems(r.json);
    currentSource = classifyCatalogItems(items, true);
    probeDetail = { http: r.status, items: items.length, urls: items.slice(0, 2).map((i) => i.url) };
  } else if (probe === 'catalog_media_global' && item.asset_kind) {
    const r = await request(
      `${api}/api/v1/catalog/media?asset_kind=${encodeURIComponent(item.asset_kind)}&limit=20`,
    );
    const items = catalogItems(r.json);
    currentSource = classifyCatalogItems(items, false);
    probeDetail = { http: r.status, items: items.length };
  }

  const da = item.matrix_id && daText ? parseDaLifecycle(daText, item.matrix_id) : null;
  const assetLifecycle = da?.asset_lifecycle || 'draft';
  const l5Auto = l5AutomatedGate(currentSource, assetLifecycle);
  const l5Compliant = l5Auto.gate === 'PASS_PARTIAL';
  const needsWorkflow =
    l5Auto.enter_workflow === true ||
    (currentSource !== 'catalog' && currentSource !== 'official_cold_start');

  return {
    ...item,
    scene: da?.scene,
    asset_lifecycle: assetLifecycle,
    current_source: currentSource,
    target_source: item.target_source,
    l5_automated: l5Auto,
    l5_compliant: l5Compliant,
    l5_manual_checks: pendingManualChecks(),
    needs_cms_l5_workflow: needsWorkflow && item.owner === 'CMS',
    workflow_next:
      needsWorkflow && item.owner === 'CMS'
        ? ['upload', 'review', 'publish', 'verify', 'evidence', 'live']
        : [],
    probe_detail: probeDetail,
  };
}

module.exports = {
  L5_MANUAL_CHECKS,
  request,
  parseInventoryItems,
  probeInventoryItem,
  l5AutomatedGate,
  classifyCatalogItems,
  isExternalStockUrl,
};
