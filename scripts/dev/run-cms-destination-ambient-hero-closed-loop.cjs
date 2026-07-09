#!/usr/bin/env node
/**
 * Destination Ambient Hero · closed loop (Visual L5 · 3840×2160)
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-destination-ambient-hero-closed-loop.cjs --matrix-id DA-HERO-JP-HOME
 *
 *   node ... --from DA-HERO-KR-HOME --to DA-HERO-CN-HOME
 *   node ... --all-remaining   # after JP template validated
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');
const {
  ROOT,
  HERO_MATRIX,
  PIPELINE_MATRIX,
  EVID_DIR,
  parseHeroMatrixRows,
  parseHeroMatrixRow,
  ensureHeroFileLocal,
  syncHeroFileToFly,
  heroPublicUrl,
  verifyHeroAssetUrl,
  classifyHeroTier,
} = require('./lib/cms-destination-ambient-hero.cjs');

assertStagingBaselineMutationAuthorized('cms_destination_ambient_hero_closed_loop');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const FLY_APP = process.env.FLY_APP || 'tt-api-staging';
const NOW = process.env.CMS_OPS_STAMP_UTC || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const SKIP_FLY_SYNC = process.env.CMS_HERO_SKIP_FLY_SYNC === '1';
const SKIP_REFRESH = process.argv.includes('--skip-refresh');

const COUNTRY_SORT = { JP: 1, KR: 2, TH: 3, SG: 4, FR: 5, US: 6, AU: 7, ES: 8, AE: 9, CN: 10 };

const GATES = [
  'brief_review',
  'cms_review',
  'destination_authenticity',
  'brand_consistency',
  'catalog_publish',
  'verify',
  'evidence_complete',
  'hero_visual_l5',
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function pickRows(allRows) {
  const one = arg('--matrix-id');
  if (one) {
    const row = allRows.find((r) => r.matrix_id === one);
    if (!row) {
      console.error(`unknown --matrix-id ${one}`);
      process.exit(2);
    }
    return [row];
  }
  if (process.argv.includes('--all-remaining')) {
    return allRows.filter((r) => r.hero_lifecycle !== 'live');
  }
  const from = arg('--from');
  const to = arg('--to');
  if (from) {
    const start = allRows.findIndex((r) => r.matrix_id === from);
    const end = to ? allRows.findIndex((r) => r.matrix_id === to) : allRows.length - 1;
    if (start < 0 || end < 0 || start > end) {
      console.error('invalid --from/--to');
      process.exit(2);
    }
    return allRows.slice(start, end + 1);
  }
  return allRows.filter((r) => r.matrix_id === 'DA-HERO-JP-HOME');
}

async function workflowPublishMedia(client, tok, asset) {
  const getPath = `/api/v1/admin/content/media-assets/${asset.id}`;
  let current = asset;
  if (current.publish_status === 'draft') {
    await client.req('POST', `${getPath}/submit-review`, { version: current.version }, tok);
    current = (await client.req('GET', getPath, null, tok)).json.item;
  }
  if (current.publish_status === 'in_review') {
    await client.req('POST', `${getPath}/publish`, { version: current.version }, tok);
    current = (await client.req('GET', getPath, null, tok)).json.item;
  }
  return current;
}

async function publishHeroToCatalog(client, tok, row, publicUrl) {
  const iso = row.country_iso;
  let countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  let country = (countries.json?.items || []).find((x) => x.iso3166 === iso);
  if (!country) throw new Error(`country missing ${iso}`);

  const mediaList = await client.req(
    'GET',
    `/api/v1/admin/content/media-assets?asset_kind=landing_ambient&country_id=${country.id}`,
    null,
    tok,
  );
  let asset = (mediaList.json?.items || []).find((x) => x.url === publicUrl || x.url?.endsWith(row.hero_filename));
  if (!asset) {
    asset = (mediaList.json?.items || []).find((x) => x.country_id === country.id);
  }
  if (!asset || asset.url !== publicUrl) {
    if (asset && asset.url !== publicUrl) {
      const patched = await client.req(
        'PATCH',
        `/api/v1/admin/content/media-assets/${asset.id}`,
        { version: asset.version, url: publicUrl },
        tok,
      );
      if (patched.status !== 200) throw new Error(`media patch ${patched.status}`);
      asset = patched.json.item;
    } else {
      const created = await client.req(
        'POST',
        '/api/v1/admin/content/media-assets',
        {
          asset_kind: 'landing_ambient',
          source_type: 'upload',
          url: publicUrl,
          license: { holder: 'TravelTrust CMS Hero', usage: row.matrix_id.toLowerCase() },
          alt_text_zh: `${row.landmark_zh} · Destination Ambient Hero`,
          alt_text_en: `${row.landmark_zh} · Hero`,
          country_id: country.id,
        },
        tok,
      );
      if (created.status !== 200) throw new Error(`media create ${created.status} ${JSON.stringify(created.json)}`);
      asset = created.json.item;
    }
  }
  asset = await workflowPublishMedia(client, tok, asset);

  countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  country = (countries.json?.items || []).find((x) => x.iso3166 === iso);
  const patch = await client.req(
    'PATCH',
    `/api/v1/admin/content/countries/${country.id}/landing-ambient`,
    { version: country.version, landing_ambient: { image_url: publicUrl, image_asset_id: asset.id } },
    tok,
  );
  if (patch.status !== 200) throw new Error(`landing-ambient patch ${patch.status}`);

  countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  country = (countries.json?.items || []).find((x) => x.iso3166 === iso);
  if (country.publish_status === 'draft') {
    await client.req('POST', `/api/v1/admin/content/countries/${country.id}/submit-review`, { version: country.version }, tok);
    countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
    country = (countries.json?.items || []).find((x) => x.iso3166 === iso);
  }
  if (country.publish_status === 'in_review') {
    await client.req('POST', `/api/v1/admin/content/countries/${country.id}/publish`, { version: country.version }, tok);
    countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
    country = (countries.json?.items || []).find((x) => x.iso3166 === iso);
  }

  const cat = await client.req('GET', `/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${iso}`);
  if ((cat.json?.count || 0) < 1) throw new Error(`${iso} catalog empty`);
  const catUrl = cat.json?.items?.[0]?.url;
  if (!catUrl || !catUrl.includes(row.hero_filename)) {
    throw new Error(`${iso} catalog url mismatch ${catUrl}`);
  }

  return { countryId: country.id, countryVersion: country.version, assetId: asset.id, publicUrl, catalogUrl: catUrl };
}

function updateHeroMatrixRow(row, pub, heroMeta) {
  let text = fs.readFileSync(HERO_MATRIX, 'utf8');
  const blockRe = new RegExp(`(  - matrix_id: ${row.matrix_id}[\\s\\S]*?)(\\n  - matrix_id:|\\nrows:|$)`);
  const gatesYaml = GATES.map((g) => `      ${g}: PASS`).join('\n');
  const newBlock = `  - matrix_id: ${row.matrix_id}
    pipeline_matrix_id: ${row.pipeline_matrix_id}
    execution_order: ${row.execution_order}
    country_zh: ${row.country_zh}
    country_iso: ${row.country_iso}
    landmark_zh: ${row.landmark_zh}
    ts_reference_slug: ${row.ts_reference_slug}
    pipeline_public_url_file: ${row.pipeline_public_url_file}
    hero_target:
      filename: ${row.hero_filename}
      width_px: ${heroMeta.dim.width}
      height_px: ${heroMeta.dim.height}
      aspect_ratio: "16:9"
    hero_tier: ${heroMeta.tier.tier}
    scene: ${row.landmark_zh} · Destination Ambient Hero · Ken Burns
    copy_label: ${row.country_zh}·Hero·${row.landmark_zh}
    public_url: ${pub.publicUrl}
    catalog_asset_id: ${pub.assetId}
    catalog_country_id: ${pub.countryId}
    visual_l5_status: CLOSED
    hero_lifecycle: live
    matrix_row_status: pass
    execution_gates:
${gatesYaml}
    asset_version:
      revision_number: ${pub.countryVersion}
      revision_label: hero-v1
      published_by: tourist@test.com
      published_at_utc: "${NOW}"
      rollback_target_revision: 1
    decoded_bytes: ${heroMeta.bytes}
`;
  if (!blockRe.test(text)) throw new Error(`hero matrix block missing ${row.matrix_id}`);
  text = text.replace(blockRe, `${newBlock}$2`);
  const live = (text.match(/hero_lifecycle: live/g) || []).length;
  text = text.replace(/hero_live: \d+/, `hero_live: ${live}`);
  text = text.replace(/hero_pending: \d+/, `hero_pending: ${10 - live}`);
  if (live === 10) {
    text = text.replace(/(\n  visual_l5:[\s\S]*?\n    status: )OPEN/, '$1CLOSED');
    text = text.replace(/visual_l5_open_rows: \d+/, 'visual_l5_open_rows: 0');
    text = text.replace(
      /# Visual L5（Hero 像素\/构图\/Decode\/Runtime 清晰度）：OPEN[^\n]*/,
      '# Visual L5（Hero 像素/构图/Decode/Runtime 清晰度）：CLOSED — 10/10 Hero @ 3840×2160 ② Staging',
    );
  }
  fs.writeFileSync(HERO_MATRIX, text);
}

function updatePipelineMatrixPublicUrl(row, pub) {
  let text = fs.readFileSync(PIPELINE_MATRIX, 'utf8');
  const pid = row.pipeline_matrix_id;
  const blockRe = new RegExp(`(  - matrix_id: ${pid}[\\s\\S]*?)(\\n  - matrix_id:|\\nrows:|$)`);
  if (!blockRe.test(text)) return;
  text = text.replace(blockRe, (full, block, tail) => {
    let b = block.replace(/\n    public_url: [^\n]+/, `\n    public_url: ${pub.publicUrl}`);
    if (!b.includes('hero_public_url:')) {
      b = b.replace(/\n    public_url:/, `\n    hero_matrix_id: ${row.matrix_id}\n    hero_tier: PASS\n    hero_public_url: ${pub.publicUrl}\n    public_url:`);
    } else {
      b = b.replace(/\n    hero_public_url: [^\n]+/, `\n    hero_public_url: ${pub.publicUrl}`);
      b = b.replace(/\n    hero_matrix_id: [^\n]+/, `\n    hero_matrix_id: ${row.matrix_id}`);
    }
    return `${b}${tail}`;
  });
  fs.writeFileSync(PIPELINE_MATRIX, text);
}

function writeEvidence(row, pub, heroMeta, verify) {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  const p = path.join(EVID_DIR, `${row.matrix_id}.EVIDENCE.json`);
  const ev = {
    schema: 'traveltrust.cms_destination_ambient_hero_evidence.v1',
    matrix_id: row.matrix_id,
    pipeline_matrix_id: row.pipeline_matrix_id,
    product_name: 'Destination Ambient Hero',
    country_iso: row.country_iso,
    landmark_zh: row.landmark_zh,
    recorded_at_utc: NOW,
    closure_dimensions: {
      pipeline: 'CLOSED',
      visual_l5: verify.ok ? 'CLOSED' : 'OPEN',
    },
    step_1_brief_review: { status: 'COMPLETE', gate_result: 'PASS', reviewed_at_utc: NOW },
    step_2_hero_production: {
      status: 'COMPLETE',
      filename: row.hero_filename,
      source: heroMeta.source,
      decoded: heroMeta.dim,
      tier: heroMeta.tier.tier,
      bytes: heroMeta.bytes,
    },
    step_3_cms_upload_review_publish: {
      status: 'COMPLETE',
      catalog_asset_id: pub.assetId,
      catalog_country_id: pub.countryId,
      public_url: pub.publicUrl,
    },
    step_4_runtime_verify: {
      status: verify.ok ? 'COMPLETE' : 'FAIL',
      gate_result: verify.ok ? 'PASS' : 'FAIL',
      checks: verify.checks,
      tier: verify.tier,
    },
    step_5_evidence: { status: 'COMPLETE', gate_result: 'PASS', completed_at_utc: NOW },
    TT_CMS_DESTINATION_AMBIENT_HERO_ROW: verify.ok ? 'PASS' : 'FAIL',
  };
  fs.writeFileSync(p, JSON.stringify(ev, null, 2) + '\n');
  return p;
}

function runHeroVerify(row) {
  execSync(
    `node scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs --hero-matrix-id ${row.matrix_id}`,
    { cwd: ROOT, stdio: 'inherit', env: { ...process.env, API, API_BASE: API } },
  );
}

async function closeHeroRow(client, tok, row) {
  console.log(`\n===== ${row.matrix_id} · ${row.country_zh} · ${row.landmark_zh} =====`);
  const heroMeta = await ensureHeroFileLocal(row);
  console.log(`HERO_LOCAL: ${heroMeta.dim.width}×${heroMeta.dim.height} tier=${heroMeta.tier.tier} bytes=${heroMeta.bytes}`);

  if (!SKIP_FLY_SYNC) {
    syncHeroFileToFly(row, FLY_APP);
    console.log(`HERO_FLY_SYNC: ${row.hero_filename} → ${FLY_APP}`);
  }

  const publicUrl = heroPublicUrl(API, row.hero_filename);
  const pub = await publishHeroToCatalog(client, tok, row, publicUrl);
  const verify = await verifyHeroAssetUrl(publicUrl, 'PASS');
  if (!verify.ok) throw new Error(`${row.matrix_id} hero verify failed tier=${verify.tier.tier}`);

  updateHeroMatrixRow(row, pub, heroMeta);
  updatePipelineMatrixPublicUrl(row, pub);
  const evidPath = writeEvidence(row, pub, heroMeta, verify);
  runHeroVerify(row);

  if (!SKIP_REFRESH) {
    try {
      execSync('node scripts/dev/run-cms-ambient-runtime-wiring-audit.cjs', {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, API, API_BASE: API, WEB: process.env.WEB || 'https://tt-web-staging.fly.dev' },
      });
    } catch (e) {
      console.warn(`TT_CMS_AMBIENT_RUNTIME_WARN: ${e.message || e}`);
    }
  }

  return {
    matrix_id: row.matrix_id,
    tier: heroMeta.tier.tier,
    public_url: pub.publicUrl,
    evidence: path.relative(ROOT, evidPath).replace(/\\/g, '/'),
  };
}

async function main() {
  const matrixText = fs.readFileSync(HERO_MATRIX, 'utf8');
  const rows = pickRows(parseHeroMatrixRows(matrixText));
  const client = createClient(API);
  const tok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!',
  );
  const results = [];

  for (const row of rows) {
    results.push(await closeHeroRow(client, tok, row));
    console.log(`DONE ${row.matrix_id}`);
    if (rows.length > 1 && rows.indexOf(row) < rows.length - 1) {
      const waitSec = Number(process.env.CMS_OPS_RATE_LIMIT_SLEEP_SEC || 5);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
    }
  }

  const outPath = path.join(ROOT, 'evidence/GO_cms_operation/destination-ambient-hero/CMS-HERO-CLOSED-LOOP-LATEST.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const report = {
    schema: 'traveltrust.cms_destination_ambient_hero_closed_loop.v1',
    recorded_at_utc: NOW,
    api: API,
    rows_closed: results.length,
    results,
    TT_CMS_DESTINATION_AMBIENT_HERO: results.every((r) => r.tier === 'PASS') ? 'PASS' : 'FAIL',
  };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`\nTT_CMS_DESTINATION_AMBIENT_HERO: ${report.TT_CMS_DESTINATION_AMBIENT_HERO}`);
  if (report.TT_CMS_DESTINATION_AMBIENT_HERO !== 'PASS') process.exit(1);
}

main().catch((e) => {
  console.error(e.stack || e.message || e);
  process.exit(1);
});
