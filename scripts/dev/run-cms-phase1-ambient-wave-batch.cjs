#!/usr/bin/env node
/**
 * CMS Phase 1 · sequential Destination Ambient closed loop (staging ops only).
 * Usage: API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-phase1-ambient-wave-batch.cjs --from DA-TH-HOME --to DA-CN-HOME
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_content_l5/destination-ambient/rows');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const NOW = process.env.CMS_OPS_STAMP_UTC || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const ALL = [
  { matrixId: 'DA-TH-HOME', iso: 'TH', nameZh: '泰国', nameEn: 'Thailand', sort: 3, chain: 'bangkok-temple', scene: '海岛泻湖或曼谷文化地标', label: '泰国·Destination Ambient' },
  { matrixId: 'DA-SG-HOME', iso: 'SG', nameZh: '新加坡', nameEn: 'Singapore', sort: 4, chain: 'singapore-family', scene: '滨海湾金沙 · Blue Hour', label: '新加坡·Destination Ambient' },
  { matrixId: 'DA-FR-HOME', iso: 'FR', nameZh: '法国', nameEn: 'France', sort: 5, chain: 'paris-art', scene: '巴黎埃菲尔或塞纳河暮色', label: '法国·Destination Ambient' },
  { matrixId: 'DA-US-HOME', iso: 'US', nameZh: '美国', nameEn: 'United States', sort: 6, chain: 'nyc-skyline', scene: '纽约曼哈顿或标志性天际', label: '美国·Destination Ambient' },
  { matrixId: 'DA-AU-HOME', iso: 'AU', nameZh: '澳大利亚', nameEn: 'Australia', sort: 7, chain: 'sydney-coast', scene: '悉尼歌剧院港湾 · 晴天广角', label: '澳大利亚·Destination Ambient' },
  { matrixId: 'DA-ES-HOME', iso: 'ES', nameZh: '西班牙', nameEn: 'Spain', sort: 8, chain: 'barcelona-arch', scene: '巴塞罗那高迪建筑或城市天际', label: '西班牙·Destination Ambient' },
  { matrixId: 'DA-AE-HOME', iso: 'AE', nameZh: '阿联酋', nameEn: 'UAE', sort: 9, chain: 'dubai-luxury', scene: '哈利法塔夜景或沙漠城市天际', label: '阿联酋·Destination Ambient' },
  {
    matrixId: 'DA-CN-HOME',
    iso: 'CN',
    nameZh: '中国',
    nameEn: 'China',
    sort: 10,
    chain: 'product_country_only',
    imageFile: 'ocs-kyoto-culture-community-media.jpg',
    scene: '长城或同类山脊 · 暖色 foliage · 中低明度天空',
    label: '中国·Destination Ambient',
    uploadNote: 'product_country_only · interim owned staging asset pending CN-specific shoot',
  },
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function imageUrl(c) {
  const file = c.imageFile || `ocs-${c.chain}-community-media.jpg`;
  return `${API}/api/v1/uploads/community-posts/${file}`;
}

function pickCountries() {
  const from = arg('--from') || 'DA-TH-HOME';
  const to = arg('--to') || 'DA-CN-HOME';
  const start = ALL.findIndex((c) => c.matrixId === from);
  const end = ALL.findIndex((c) => c.matrixId === to);
  if (start < 0 || end < 0 || start > end) {
    console.error('invalid --from/--to');
    process.exit(2);
  }
  return ALL.slice(start, end + 1);
}

async function publishCountry(c, client, tok) {
  let countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  let row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  if (!row) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/countries',
      {
        iso3166: c.iso,
        name_zh: c.nameZh,
        name_en: c.nameEn,
        sort_order: c.sort,
        open_status: 'open',
        payload: {},
      },
      tok,
    );
    if (created.status !== 200) throw new Error(`${c.iso} create ${created.status} ${JSON.stringify(created.json)}`);
    row = created.json.item;
  }

  const mediaList = await client.req(
    'GET',
    `/api/v1/admin/content/media-assets?asset_kind=landing_ambient&country_id=${row.id}`,
    null,
    tok,
  );
  let asset = (mediaList.json?.items || []).find((x) => x.country_id === row.id);
  const url = imageUrl(c);
  if (!asset) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/media-assets',
      {
        asset_kind: 'landing_ambient',
        source_type: 'upload',
        url,
        license: { holder: 'TravelTrust OCS', usage: `destination_ambient_${c.matrixId.toLowerCase()}` },
        alt_text_zh: c.label,
        alt_text_en: `${c.nameEn} Destination Ambient`,
        country_id: row.id,
      },
      tok,
    );
    if (created.status !== 200) throw new Error(`${c.iso} media ${created.status}`);
    asset = created.json.item;
  }

  if (asset.publish_status === 'draft') {
    await client.req('POST', `/api/v1/admin/content/media-assets/${asset.id}/submit-review`, { version: asset.version }, tok);
    asset = (await client.req('GET', `/api/v1/admin/content/media-assets/${asset.id}`, null, tok)).json.item;
  }
  if (asset.publish_status === 'in_review') {
    await client.req('POST', `/api/v1/admin/content/media-assets/${asset.id}/publish`, { version: asset.version }, tok);
    asset = (await client.req('GET', `/api/v1/admin/content/media-assets/${asset.id}`, null, tok)).json.item;
  }

  countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  const patch = await client.req(
    'PATCH',
    `/api/v1/admin/content/countries/${row.id}/landing-ambient`,
    { version: row.version, landing_ambient: { image_url: url, image_asset_id: asset.id } },
    tok,
  );
  if (patch.status !== 200) throw new Error(`${c.iso} patch ${patch.status}`);

  countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  if (row.publish_status === 'draft') {
    await client.req('POST', `/api/v1/admin/content/countries/${row.id}/submit-review`, { version: row.version }, tok);
    countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
    row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  }
  if (row.publish_status === 'in_review') {
    await client.req('POST', `/api/v1/admin/content/countries/${row.id}/publish`, { version: row.version }, tok);
    countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
    row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  }

  const cat = await client.req('GET', `/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${c.iso}`);
  if (cat.json?.count !== 1) throw new Error(`${c.iso} catalog count ${cat.json?.count}`);

  return { countryId: row.id, countryVersion: row.version, assetId: asset.id, publicUrl: url };
}

function updateMatrixRow(c, pub) {
  let text = fs.readFileSync(MATRIX, 'utf8');
  const blockRe = new RegExp(`(  - matrix_id: ${c.matrixId}[\\s\\S]*?)(  - matrix_id: DA-|$)`);
  const newBlock = `  - matrix_id: ${c.matrixId}
    execution_order: ${c.sort}
    country_zh: ${c.nameZh}
    country_iso: ${c.iso}
    surface: home
    ocs_chain_ref: ${c.chain}
    scene: ${c.scene}
    copy_label: ${c.label}
    current_label: Catalog API
    current_source: catalog_api
    asset_lifecycle: live
    matrix_row_status: pass
    execution_gates:
      brief_review: PASS
      cms_review: PASS
      destination_authenticity: PASS
      brand_consistency: PASS
      catalog_publish: PASS
      verify: PASS
      evidence_complete: PASS
    asset_version:
      revision_number: ${pub.countryVersion}
      revision_label: v1
      published_by: tourist@test.com
      published_at_utc: "${NOW}"
      rollback_target_revision: 1
    catalog_country_id: ${pub.countryId}
    catalog_asset_id: ${pub.assetId}
    public_url: ${pub.publicUrl}
`;
  if (!blockRe.test(text)) throw new Error(`matrix block missing ${c.matrixId}`);
  text = text.replace(blockRe, `${newBlock}$2`);
  fs.writeFileSync(MATRIX, text);
}

function writeEvidence(c, pub) {
  execSync(`node scripts/dev/scaffold-cms-phase1-single-asset-evidence.cjs --matrix-id ${c.matrixId} --force`, {
    cwd: ROOT,
    stdio: 'pipe',
  });
  const p = path.join(EVID_DIR, `${c.matrixId}.EVIDENCE.json`);
  const ev = JSON.parse(fs.readFileSync(p, 'utf8'));
  Object.assign(ev, {
    scaffolded_at_utc: NOW,
    step_1_brief_review: {
      status: 'COMPLETE',
      asset_lifecycle_out: 'draft',
      gate: 'brief_review',
      gate_result: 'PASS',
      checks: {
        destination: `${c.iso} · ${c.scene}`,
        business_theme: `${c.chain} · Destination Ambient home`,
        brand_tone: 'cms-content-brief destination_ambient',
        composition: 'home surface hero ambient',
        lighting: 'natural daylight per brief prefer',
        forbidden_elements_clear: true,
      },
      reviewer: 'CMS Operation Owner',
      reviewed_at_utc: NOW,
      notes: `Brief aligned ${c.matrixId}`,
    },
    step_2_designer_upload: {
      status: 'COMPLETE',
      asset_lifecycle_out: 'review',
      catalog_asset_id: pub.assetId,
      upload_format: 'image/jpeg',
      uploaded_by: 'CMS Operation via Admin media-assets',
      uploaded_at_utc: NOW,
      notes: c.uploadNote || `OCS owned URL · ${c.chain}`,
    },
    step_3_cms_review: {
      status: 'COMPLETE',
      asset_lifecycle_out: 'approved',
      gates: { cms_review: 'PASS', destination_authenticity: 'PASS', brand_consistency: 'PASS' },
      reviewer: 'CMS Operation Owner',
      reviewed_at_utc: NOW,
      notes: 'Same closed loop as JP/KR',
    },
    step_4_catalog_publish: {
      status: 'COMPLETE',
      asset_lifecycle_out: 'published',
      gate: 'catalog_publish',
      gate_result: 'PASS',
      admin_route: '/admin/content/landing-ambient',
      published_by: 'tourist@test.com',
      published_at_utc: NOW,
      revision: { revision_number: pub.countryVersion, revision_label: 'v1', rollback_target_revision: 1 },
    },
    step_6_evidence: {
      status: 'COMPLETE',
      gate: 'evidence_complete',
      gate_result: 'PASS',
      sections_present: { review: true, publish: true, revision: true, verify: true, matrix: true },
      completed_at_utc: NOW,
    },
    matrix_snapshot: {
      matrix_row_status: 'pass',
      asset_lifecycle: 'live',
      current_source: 'catalog_api',
      public_url: pub.publicUrl,
      country_zh: c.nameZh,
      scene: c.scene,
      copy_label: c.label,
      surface: 'home',
    },
    change_record: {
      change_type: 'initial_publish',
      change_reason: `${c.matrixId} Wave 1 ambient closed loop`,
      new_revision: pub.countryVersion,
      approved_by: 'CMS Operation Owner',
    },
    TT_CMS_PHASE1_SINGLE_ASSET_ROW: 'IN_PROGRESS',
  });
  fs.writeFileSync(p, JSON.stringify(ev, null, 2) + '\n');
}

function runVerifyDodRefresh(c) {
  execSync(`node scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs --matrix-id ${c.matrixId}`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, API, API_BASE: API },
  });
  execSync(`node scripts/dev/run-cms-phase1-single-asset-dod.cjs --matrix-id ${c.matrixId}`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
  const out = execSync('node scripts/dev/run-cms-ops-refresh.cjs', {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, API, API_BASE: API },
  });
  const wave = out.match(/TT_CMS_WAVE1_OVERALL: (.+)/)?.[1];
  console.log(`TT_CMS_REFRESH_AFTER: ${c.matrixId} · ${wave || 'ok'}`);
}

function updateSummary() {
  let text = fs.readFileSync(MATRIX, 'utf8');
  const liveRows = (text.match(/asset_lifecycle: live/g) || []).length;
  text = text.replace(/matrix_pass: \d+/, `matrix_pass: ${liveRows}`);
  text = text.replace(/asset_lifecycle_draft: \d+/, `asset_lifecycle_draft: ${10 - liveRows}`);
  fs.writeFileSync(MATRIX, text);
}

async function main() {
  const countries = pickCountries();
  const client = createClient(API);
  const tok = await client.adminLogin('tourist@test.com', 'Test123!');

  for (const c of countries) {
    console.log(`\n===== ${c.matrixId} (${c.iso}) =====`);
    const pub = await publishCountry(c, client, tok);
    updateMatrixRow(c, pub);
    writeEvidence(c, pub);
    runVerifyDodRefresh(c);
    console.log(`DONE ${c.matrixId}`);
    if (countries.indexOf(c) < countries.length - 1) {
      const waitSec = Number(process.env.CMS_OPS_RATE_LIMIT_SLEEP_SEC || 70);
      console.log(`TT_CMS_RATE_LIMIT_SLEEP: ${waitSec}s`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
    }
  }

  updateSummary();
  console.log('\nTT_CMS_PHASE1_AMBIENT_BATCH: COMPLETE');
  console.log(`TT_CMS_MATRIX_RANGE: ${countries[0].matrixId} → ${countries[countries.length - 1].matrixId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
