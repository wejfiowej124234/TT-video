#!/usr/bin/env node
/**
 * CMS Content L5 · Destination Ambient row verify.
 *
 *   node scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs --matrix-id DA-JP-HOME
 *   node ... --hero-matrix-id DA-HERO-JP-HOME
 *   API=https://tt-api-staging.fly.dev node ... --matrix-id DA-JP-HOME
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const {
  HERO_MATRIX,
  parseHeroMatrixRow,
  fetchBuffer,
  verifyHeroAssetUrl,
  aspectRatioOk,
} = require('./lib/cms-destination-ambient-hero.cjs');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const EVID_ROWS = path.join(ROOT, 'evidence/GO_cms_content_l5/destination-ambient/rows');
const GATE_FIELDS = [
  'brief_review',
  'cms_review',
  'destination_authenticity',
  'brand_consistency',
  'catalog_publish',
  'verify',
  'evidence_complete',
  'hero_visual_l5',
];
const API = (process.env.API || process.env.API_BASE || '').replace(/\/$/, '');
const MIN_BYTES = 16 * 1024;
const LIVE_CYCLE = 'live';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function parseMatrixRow(text, matrixId) {
  const blocks = text.split(/\n  - matrix_id:/);
  for (const block of blocks.slice(1)) {
    if (!block.startsWith(` ${matrixId}`)) continue;
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    const getNull = (key) => {
      const m = block.match(new RegExp(`\\n    ${key}: (.+)`));
      if (!m) return null;
      const v = m[1].trim();
      if (v === 'null') return null;
      return v.replace(/^"|"$/g, '');
    };
    const revBlock = block.match(/\n    asset_version:[\s\S]*?(?=\n    catalog_|\n    public_|\n  - matrix_id:|\nfuture_)/);
    const gatesBlock = block.match(/\n    execution_gates:[\s\S]*?(?=\n    asset_version:)/);
    const execution_gates = {};
    for (const g of GATE_FIELDS) {
      const m = gatesBlock?.[0].match(new RegExp(`\\n      ${g}: (.+)`));
      execution_gates[g] = m ? m[1].trim().replace(/^"|"$/g, '') : null;
    }
    const revNum = revBlock?.[0].match(/\n      revision_number: (.+)/)?.[1]?.trim();
    const revLabel = revBlock?.[0].match(/\n      revision_label: "?([^"\n]+)"?/)?.[1]?.trim();
    const rollback = revBlock?.[0].match(/\n      rollback_target_revision: (.+)/)?.[1]?.trim();
    return {
      matrix_id: matrixId,
      execution_order: get('execution_order'),
      country_zh: get('country_zh'),
      country_iso: get('country_iso'),
      surface: get('surface'),
      scene: get('scene'),
      copy_label: get('copy_label'),
      current_source: get('current_source'),
      asset_lifecycle: get('asset_lifecycle'),
      matrix_row_status: get('matrix_row_status'),
      execution_gates,
      public_url: getNull('public_url'),
      catalog_asset_id: getNull('catalog_asset_id'),
      asset_version: {
        revision_number: revNum === 'null' ? null : revNum,
        revision_label: revLabel === 'null' ? null : revLabel,
        rollback_target_revision: rollback === 'null' ? null : rollback,
      },
    };
  }
  return null;
}

function headUrl(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve({ status: 0, len: 0, type: '' });
      return;
    }
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request(
      { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'HEAD' },
      (res) => {
        res.resume();
        resolve({
          status: res.statusCode || 0,
          len: Number(res.headers['content-length'] || 0),
          type: String(res.headers['content-type'] || ''),
        });
      },
    );
    req.on('error', () => resolve({ status: 0, len: 0, type: '' }));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ status: 0, len: 0, type: 'timeout' });
    });
    req.end();
  });
}

async function fetchCatalogAmbient(iso) {
  if (!API) return null;
  const url = `${API}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${encodeURIComponent(iso)}`;
  const lib = API.startsWith('https') ? https : http;
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = lib.request(
      { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET' },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(d);
            const item = (json.items || []).find((i) => i.url);
            resolve(item ? { url: item.url, source: 'catalog_api' } : null);
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on('error', () => resolve(null));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}

async function verifyHeroMatrixRow(heroMatrixId) {
  const matrixText = fs.readFileSync(HERO_MATRIX, 'utf8');
  const row = parseHeroMatrixRow(matrixText, heroMatrixId);
  if (!row) {
    console.error(`ROW_NOT_IN_HERO_MATRIX: ${heroMatrixId}`);
    process.exit(2);
  }

  const checks = [];
  let pass = true;
  const HERO_EVID = path.join(ROOT, 'evidence/GO_cms_content_l5/destination-ambient-hero/rows');

  checks.push({
    id: 'hero_lifecycle_live',
    pass: row.hero_lifecycle === LIVE_CYCLE,
    detail: row.hero_lifecycle,
  });
  checks.push({
    id: 'visual_l5_closed',
    pass: row.visual_l5_status === 'CLOSED',
    detail: row.visual_l5_status,
  });

  if (row.hero_lifecycle !== LIVE_CYCLE || row.visual_l5_status !== 'CLOSED') pass = false;

  let verifyUrl = row.public_url;
  if (API && row.country_iso && row.hero_lifecycle === LIVE_CYCLE) {
    const cat = await fetchCatalogAmbient(row.country_iso);
    if (cat?.url) {
      verifyUrl = cat.url;
      checks.push({ id: 'catalog_api_url', pass: true, detail: cat.url.slice(0, 120) });
      const filenameOk = row.hero_filename ? cat.url.includes(row.hero_filename) : true;
      checks.push({ id: 'catalog_hero_filename', pass: filenameOk, detail: row.hero_filename });
      if (!filenameOk) pass = false;
    } else {
      checks.push({ id: 'catalog_api_url', pass: false, detail: 'no catalog media for country_iso' });
      pass = false;
    }
  }

  if (verifyUrl && verifyUrl.startsWith('http') && row.hero_lifecycle === LIVE_CYCLE) {
    const head = await headUrl(verifyUrl);
    checks.push({ id: 'public_http_200', pass: head.status === 200, detail: String(head.status) });
    if (head.status !== 200) pass = false;

    try {
      const heroVerify = await verifyHeroAssetUrl(verifyUrl, 'PASS');
      checks.push({
        id: 'hero_decode_dimensions',
        pass: Boolean(heroVerify.dim),
        detail: heroVerify.dim ? `${heroVerify.dim.width}×${heroVerify.dim.height}` : 'undecodable',
      });
      checks.push({
        id: 'hero_tier_pass',
        pass: heroVerify.tier.tier === 'PASS',
        detail: `${heroVerify.tier.tier} (${heroVerify.tier.label || ''})`,
      });
      checks.push({
        id: 'hero_aspect_16_9',
        pass: heroVerify.aspectOk,
        detail: heroVerify.aspectOk ? '16:9 ±2%' : 'aspect mismatch',
      });
      checks.push({
        id: 'hero_min_bytes_16kb',
        pass: heroVerify.bytes >= MIN_BYTES,
        detail: `${heroVerify.bytes}B`,
      });
      if (!heroVerify.ok) pass = false;
      if (verifyUrl.includes('unsplash.com') || verifyUrl.includes('pexels.com')) {
        checks.push({ id: 'no_production_external_host', pass: false, detail: verifyUrl });
        pass = false;
      } else {
        checks.push({ id: 'no_production_external_host', pass: true, detail: 'owned hero url' });
      }
    } catch (e) {
      checks.push({ id: 'hero_decode_fetch', pass: false, detail: String(e.message || e) });
      pass = false;
    }
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  fs.mkdirSync(HERO_EVID, { recursive: true });
  const outPath = path.join(HERO_EVID, `${heroMatrixId}.VERIFY.json`);
  const evidenceCore = {
    schema: 'traveltrust.cms_destination_ambient_hero_row_verify.v1',
    stamp_utc: stamp,
    matrix_id: heroMatrixId,
    pipeline_matrix_id: row.pipeline_matrix_id,
    product_name: 'Destination Ambient Hero',
    row,
    checks,
    verify_tiers: { required: 'PASS', minimum: 'WARN', fail_below: '1920×1080' },
    TT_CMS_DESTINATION_AMBIENT_HERO_ROW_VERIFY: pass ? 'PASS' : 'FAIL',
  };

  if (fs.existsSync(path.join(HERO_EVID, `${heroMatrixId}.EVIDENCE.json`))) {
    const evidPath = path.join(HERO_EVID, `${heroMatrixId}.EVIDENCE.json`);
    const existing = JSON.parse(fs.readFileSync(evidPath, 'utf8'));
    existing.step_4_runtime_verify = {
      ...(existing.step_4_runtime_verify || {}),
      verify_script: 'scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs',
      gate_result: pass ? 'PASS' : 'FAIL',
      checks,
      verified_at_utc: new Date().toISOString(),
    };
    existing.TT_CMS_DESTINATION_AMBIENT_HERO_ROW = pass ? 'PASS' : 'FAIL';
    fs.writeFileSync(evidPath, JSON.stringify(existing, null, 2) + '\n');
  }
  fs.writeFileSync(outPath, JSON.stringify(evidenceCore, null, 2) + '\n');
  console.log(`TT_CMS_DESTINATION_AMBIENT_HERO_ROW_VERIFY: ${pass ? 'PASS' : 'FAIL'}`);
  console.log(`TT_CMS_HERO_LIFECYCLE: ${row.hero_lifecycle}`);
  console.log(`TT_CMS_EVIDENCE: ${outPath.replace(/\\/g, '/')}`);
  process.exit(pass ? 0 : 1);
}

async function main() {
  const heroMatrixId = arg('--hero-matrix-id');
  if (heroMatrixId) {
    if (!/^DA-HERO-[A-Z]{2}-HOME$/.test(heroMatrixId)) {
      console.error('usage: ... --hero-matrix-id DA-HERO-JP-HOME');
      process.exit(2);
    }
    return verifyHeroMatrixRow(heroMatrixId);
  }

  const matrixId = arg('--matrix-id');
  if (!matrixId || !/^DA-[A-Z]{2}-[A-Z_]+$/.test(matrixId)) {
    console.error('usage: node run-cms-content-l5-destination-ambient-verify.cjs --matrix-id DA-JP-HOME');
    console.error('   or: ... --hero-matrix-id DA-HERO-JP-HOME');
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const row = parseMatrixRow(matrixText, matrixId);
  if (!row) {
    console.error(`ROW_NOT_IN_MATRIX: ${matrixId}`);
    process.exit(2);
  }

  const checks = [];
  let pass = true;

  checks.push({
    id: 'asset_lifecycle_live',
    pass: row.asset_lifecycle === LIVE_CYCLE,
    detail: row.asset_lifecycle,
  });
  checks.push({
    id: 'matrix_row_status_pass',
    pass: row.matrix_row_status === 'pass',
    detail: row.matrix_row_status,
  });
  checks.push({
    id: 'consumer_not_ts_fallback',
    pass: row.current_source !== 'ts_unsplash_fallback',
    detail: row.current_source,
  });
  checks.push({
    id: 'asset_version_revision_number',
    pass: row.asset_version?.revision_number != null && row.asset_version.revision_number !== 'null',
    detail: row.asset_version?.revision_number,
  });
  checks.push({
    id: 'asset_version_rollback_target',
    pass:
      row.asset_lifecycle !== LIVE_CYCLE ||
      (row.asset_version?.rollback_target_revision != null && row.asset_version.rollback_target_revision !== 'null'),
    detail: row.asset_version?.rollback_target_revision,
  });

  if (row.asset_lifecycle !== LIVE_CYCLE || row.matrix_row_status !== 'pass') pass = false;
  if (row.current_source === 'ts_unsplash_fallback') pass = false;

  if (row.asset_lifecycle === LIVE_CYCLE && row.matrix_row_status === 'pass') {
    for (const g of ['brief_review', 'cms_review', 'destination_authenticity', 'brand_consistency', 'catalog_publish', 'verify']) {
      const ok = row.execution_gates?.[g] === 'PASS';
      checks.push({ id: `execution_gate_${g}`, pass: ok, detail: row.execution_gates?.[g] });
      if (!ok) pass = false;
    }
  }

  let verifyUrl = row.public_url;
  if (API && row.country_iso && row.asset_lifecycle === LIVE_CYCLE) {
    const cat = await fetchCatalogAmbient(row.country_iso);
    if (cat?.url) {
      verifyUrl = cat.url;
      checks.push({ id: 'catalog_api_url', pass: true, detail: cat.url.slice(0, 120) });
    } else {
      checks.push({ id: 'catalog_api_url', pass: false, detail: 'no catalog media for country_iso' });
      pass = false;
    }
  }

  if (verifyUrl && verifyUrl.startsWith('http') && row.asset_lifecycle === LIVE_CYCLE) {
    const head = await headUrl(verifyUrl);
    const httpOk = head.status === 200;
    const bytesOk = head.len === 0 || head.len > MIN_BYTES;
    const mimeOk = head.type.includes('jpeg') || head.type.includes('jpg') || head.type.includes('webp');
    checks.push({ id: 'public_http_200', pass: httpOk, detail: String(head.status) });
    checks.push({ id: 'public_min_bytes_16kb', pass: bytesOk, detail: `${head.len}B` });
    checks.push({ id: 'public_mime_image', pass: mimeOk || !httpOk, detail: head.type });
    if (!httpOk || (head.len > 0 && head.len <= MIN_BYTES)) pass = false;
    if (verifyUrl.includes('unsplash.com') || verifyUrl.includes('pexels.com')) {
      checks.push({ id: 'no_production_external_host', pass: false, detail: verifyUrl });
      pass = false;
    } else {
      checks.push({ id: 'no_production_external_host', pass: true, detail: 'owned or catalog url' });
    }
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  fs.mkdirSync(EVID_ROWS, { recursive: true });
  const evidenceCore = {
    schema: 'traveltrust.cms_content_l5_destination_ambient_row_verify.v2',
    stamp_utc: stamp,
    matrix_id: matrixId,
    product_name: 'Destination Ambient',
    template_runbook: 'docs/runbook/TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md',
    row,
    checks,
    TT_CMS_DESTINATION_AMBIENT_ROW_VERIFY: pass ? 'PASS' : 'FAIL',
    lifecycle_required: 'draft→review→approved→published→live→archived',
    gates_manual: {
      brand_consistency: 'required before approved',
      country_authenticity: 'required before approved',
      wcag_visual: 'required before approved',
    },
  };

  const evidPath = path.join(EVID_ROWS, `${matrixId}.EVIDENCE.json`);
  let outPath = path.join(EVID_ROWS, `${matrixId}.REVIEW.json`);
  if (fs.existsSync(evidPath)) {
    const existing = JSON.parse(fs.readFileSync(evidPath, 'utf8'));
    existing.step_5_verify = {
      status: pass ? 'COMPLETE' : 'FAIL',
      asset_lifecycle_out: 'live',
      gate: 'verify',
      gate_result: pass ? 'PASS' : 'FAIL',
      script: 'scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs',
      api_base: API || null,
      checks,
      verified_at_utc: new Date().toISOString(),
    };
    existing.matrix_snapshot = { ...existing.matrix_snapshot, ...row };
    existing.TT_CMS_DESTINATION_AMBIENT_ROW_VERIFY = evidenceCore.TT_CMS_DESTINATION_AMBIENT_ROW_VERIFY;
    existing.definition_of_done = {
      ...(existing.definition_of_done || {}),
      verify_pass: pass && row.execution_gates?.verify === 'PASS',
      matrix_row_pass: row.matrix_row_status === 'pass',
      asset_lifecycle_live: row.asset_lifecycle === LIVE_CYCLE,
    };
    fs.writeFileSync(evidPath, JSON.stringify(existing, null, 2) + '\n');
    outPath = evidPath;
  } else {
    fs.writeFileSync(outPath, JSON.stringify(evidenceCore, null, 2) + '\n');
  }
  console.log(`TT_CMS_DESTINATION_AMBIENT_ROW_VERIFY: ${pass ? 'PASS' : 'FAIL'}`);
  console.log(`TT_CMS_ASSET_LIFECYCLE: ${row.asset_lifecycle}`);
  console.log(`TT_CMS_EVIDENCE: ${outPath.replace(/\\/g, '/')}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
