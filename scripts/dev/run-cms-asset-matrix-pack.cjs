#!/usr/bin/env node
/**
 * CMS Asset Matrix · operations workbench pack (not governance).
 *
 *   node scripts/dev/run-cms-asset-matrix-pack.cjs
 *   node scripts/dev/run-cms-asset-matrix-pack.cjs --skip-probe
 *   node scripts/dev/run-cms-asset-matrix-pack.cjs --stamp 20260705T020000Z
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/cms-asset-matrix.v1.yaml');
const DA_MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const DA_EVID_DIR = path.join(ROOT, 'evidence/GO_cms_content_l5/destination-ambient/rows');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ASSET-MATRIX-LATEST.json');
const DAILY_DIR = path.join(ROOT, 'evidence/GO_cms_operation/daily');

const {
  computeDestinationAmbientOps,
  computeDailyOpsBoard,
  deriveContentHealthScore,
  utcDateKey,
  previousUtcDateKey,
  loadDailySnapshot,
  saveDailySnapshot,
  LIFECYCLE_PIPELINE,
  WAVE_ORDER,
} = require('./lib/cms-destination-ambient-ops.cjs');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');

const PHASE1_COUNTRIES = ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE', 'CN'];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

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

function parseRows(text) {
  const section = text.split(/^rows:\s*$/m)[1] || '';
  const rows = [];
  const blocks = section.split(/\n  - id: /).slice(1);
  for (const block of blocks) {
    const id = block.match(/^([^\n]+)/)?.[1]?.trim();
    if (!id) continue;
    const get = (key) => {
      const m = block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`));
      return m ? m[1].trim() : null;
    };
    const cmsOperable = block.match(/\n    cms_operable: (true|false)/)?.[1];
    rows.push({
      id,
      page_module: get('page_module'),
      owner: get('owner'),
      modify_entry: get('modify_entry'),
      cms_operable: cmsOperable === 'true',
      asset_kind: get('asset_kind'),
      asset_family: get('asset_family'),
      wave: get('wave') ? Number(get('wave')) : null,
      matrix_ref: get('matrix_ref'),
      current_source: get('current_source'),
      target_source: get('target_source'),
      probe: get('probe'),
    });
  }
  return rows;
}

function catalogItems(json) {
  return json?.items || json?.media || [];
}

function hasLiveCatalogItem(items) {
  return items.some((i) => i.url || i.public_url || i.media_url);
}

async function probeCatalogByCountry(assetKind) {
  let live = 0;
  const byCountry = {};
  for (const iso of PHASE1_COUNTRIES) {
    const r = await request(
      `${API}/api/v1/catalog/media?asset_kind=${encodeURIComponent(assetKind)}&country_iso=${iso}`,
    );
    const items = catalogItems(r.json);
    const ok = r.status === 200 && hasLiveCatalogItem(items);
    byCountry[iso] = { http: r.status, live: ok, items: items.length };
    if (ok) live += 1;
  }
  let source = 'unsplash_fallback';
  if (live === PHASE1_COUNTRIES.length) source = 'catalog';
  else if (live > 0) source = 'catalog_partial';
  return { source, live_countries: live, total_countries: PHASE1_COUNTRIES.length, by_country: byCountry };
}

async function probeCatalogGlobal(assetKind) {
  const r = await request(`${API}/api/v1/catalog/media?asset_kind=${encodeURIComponent(assetKind)}&limit=5`);
  const items = catalogItems(r.json);
  const live = r.status === 200 && hasLiveCatalogItem(items);
  return {
    source: live ? 'catalog' : 'placeholder',
    http: r.status,
    items: items.length,
  };
}

async function probeOcsSurface(surface) {
  const r = await request(`${API}/api/v1/official/cold-start/surfaces/${surface}`);
  const ok = r.status === 200 && r.json?.status === 'ok';
  return { source: ok ? 'official_cold_start' : 'placeholder', http: r.status, status: r.json?.status };
}

async function probeOcsGuides() {
  const r = await request(`${API}/api/v1/guides?limit=5`);
  const items = r.json?.items || [];
  const ok = r.status === 200 && items.length > 0;
  return {
    source: ok ? 'official_cold_start' : 'placeholder',
    http: r.status,
    guides: items.length,
  };
}

async function probeOcsCommunityFeed() {
  const r = await request(`${API}/api/v1/community/feed?limit=5`);
  const posts = r.json?.posts || [];
  const ok = r.status === 200 && posts.length > 0;
  return {
    source: ok ? 'official_cold_start' : 'placeholder',
    http: r.status,
    posts: posts.length,
  };
}

async function probeRow(row) {
  const probe = row.probe || 'none';
  if (probe === 'none') {
    return { live_current_source: row.current_source, probe_skipped: true };
  }
  if (probe === 'catalog_media_by_country') {
    const p = await probeCatalogByCountry(row.asset_kind || 'landing_ambient');
    return {
      live_current_source: p.source,
      probe_detail: p,
      wave_1_jp: p.by_country?.JP || null,
    };
  }
  if (probe === 'catalog_media_global') {
    const p = await probeCatalogGlobal(row.asset_kind);
    return { live_current_source: p.source, probe_detail: p };
  }
  if (probe === 'ocs_surface_home_hero') {
    const p = await probeOcsSurface('home_hero');
    return { live_current_source: p.source, probe_detail: p };
  }
  if (probe === 'ocs_guides_list') {
    const p = await probeOcsGuides();
    return { live_current_source: p.source, probe_detail: p };
  }
  if (probe === 'ocs_community_feed') {
    const p = await probeOcsCommunityFeed();
    return { live_current_source: p.source, probe_detail: p };
  }
  return { live_current_source: row.current_source, probe_unknown: probe };
}

function pct(num, den) {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function modifyEntryLabel(entry) {
  if (entry === 'do_not_modify') return '不修改';
  if (entry === 'later') return '后续';
  return entry;
}

function sourceAligned(current, target, row, probeResult) {
  if (current === target) return true;
  if (row?.id === 'home_destination_ambient' && target === 'catalog') {
    return current === 'catalog' || probeResult?.wave_1_jp?.live === true;
  }
  if (target === 'catalog' && current === 'catalog') return true;
  return false;
}

async function main() {
  const stamp =
    arg('--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const skipProbe = hasFlag('--skip-probe');

  if (!fs.existsSync(MATRIX)) {
    console.error('MATRIX_MISSING: data/catalog/cms-asset-matrix.v1.yaml');
    process.exit(2);
  }

  const text = fs.readFileSync(MATRIX, 'utf8');
  const rows = parseRows(text);
  const required = rows.length >= 8 && rows.every((r) => r.page_module && r.owner && r.current_source && r.target_source);

  const probed = [];
  for (const row of rows) {
    const probeResult = skipProbe
      ? { live_current_source: row.current_source, probe_skipped: true }
      : await probeRow(row);
    const liveSource = probeResult.live_current_source || row.current_source;
    probed.push({
      id: row.id,
      page_module: row.page_module,
      owner: row.owner,
      modify_entry: row.modify_entry,
      modify_entry_label: modifyEntryLabel(row.modify_entry),
      cms_operable: row.cms_operable,
      current_source: liveSource,
      declared_current_source: row.current_source,
      target_source: row.target_source,
      source_aligned: sourceAligned(liveSource, row.target_source, row, probeResult),
      asset_kind: row.asset_kind,
      wave: row.wave,
      matrix_ref: row.matrix_ref,
      probe: row.probe,
      ...probeResult,
    });
  }

  const cmsRows = probed.filter((r) => r.cms_operable);
  const ocsRows = probed.filter((r) => !r.cms_operable && r.owner !== 'Media');
  const catalogLive = probed.filter((r) => r.current_source === 'catalog').length;
  const catalogPartial = probed.filter((r) => r.current_source === 'catalog_partial').length;
  const unsplashFallback = probed.filter((r) => r.current_source === 'unsplash_fallback').length;
  const officialColdStart = probed.filter((r) => r.current_source === 'official_cold_start').length;
  const placeholder = probed.filter((r) => r.current_source === 'placeholder').length;
  const sourceAlignedCount = probed.filter((r) => r.source_aligned).length;
  const totalRows = probed.length;
  const sourceAlignmentPct = pct(sourceAlignedCount, totalRows);
  const sourceAlignment = {
    label: 'Source Alignment',
    aligned: sourceAlignedCount,
    total: totalRows,
    display: `${sourceAlignedCount} / ${totalRows}`,
    pct: sourceAlignmentPct,
  };
  const jpAmbient = probed.find((r) => r.id === 'home_destination_ambient');

  const contentHealthScore = deriveContentHealthScore(sourceAlignment);
  const destinationAmbient = computeDestinationAmbientOps(DA_MATRIX, DA_EVID_DIR);
  const todayDateKey = utcDateKey();
  const yesterdayDateKey = previousUtcDateKey(todayDateKey);
  const yesterdaySnapshot = loadDailySnapshot(DAILY_DIR, yesterdayDateKey);
  const dailyOpsBoard = computeDailyOpsBoard({
    destinationAmbient,
    sourceAlignment,
    yesterdaySnapshot,
  });
  saveDailySnapshot(DAILY_DIR, todayDateKey, dailyOpsBoard.daily_metrics, stamp);

  const pass = required && probed.length === 8;

  const report = {
    schema: 'traveltrust.cms_asset_matrix_report.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    role: 'operations_workbench',
    not_governance: true,
    matrix_path: 'data/catalog/cms-asset-matrix.v1.yaml',
    matrix_schema: 'traveltrust.cms_asset_matrix.v1',
    probe_api: skipProbe ? null : API,
    probe_skipped: skipProbe,
    source_alignment: sourceAlignment,
    content_health_score: contentHealthScore,
    destination_ambient: destinationAmbient,
    daily_ops_board: dailyOpsBoard,
    daily_report: dailyOpsBoard.daily_report,
    todays_tasks: dailyOpsBoard.todays_tasks,
    ssot_hierarchy: {
      ssot: 'asset_matrix_pack',
      projections: ['health_score', 'daily_ops_board'],
      rule: 'update asset matrix only · projections follow automatically',
    },
    operations_kpi: {
      source_alignment: sourceAlignment,
      content_health_score: contentHealthScore,
    },
    operational_pipeline: {
      mode: 'operations_not_engineering',
      asset_lifecycle: LIFECYCLE_PIPELINE,
      loop: ['upload', 'publish', 'verify', 'evidence', 'asset_matrix_pack', 'health_score'],
      phases: {
        phase_1: { country: 'JP', matrix_id: 'DA-JP-HOME', goal: 'Source Alignment 3/8 → 4/8' },
        phase_2: { country: 'KR', matrix_id: 'DA-KR-HOME', goal: 'replicate pipeline' },
        phase_3: { countries: WAVE_ORDER.slice(2), goal: 'same loop no process change' },
        phase_4: { assets: ['poi', 'hotel', 'transport', 'video'], goal: 'same loop' },
      },
      active_phase: destinationAmbient?.active_phase ?? dailyOpsBoard.active_phase,
    },
    operator_table: probed.map((r) => ({
      page_module: r.page_module,
      current_source: r.current_source,
      target_source: r.target_source,
      owner: r.owner,
      modify_entry: r.modify_entry_label,
    })),
    summary: {
      rows: probed.length,
      cms_operable: cmsRows.length,
      ocs_frozen: ocsRows.length,
      source_aligned: sourceAlignedCount,
      source_alignment: sourceAlignment,
      by_current_source: {
        catalog: catalogLive,
        catalog_partial: catalogPartial,
        unsplash_fallback: unsplashFallback,
        official_cold_start: officialColdStart,
        placeholder,
      },
      wave_1_jp_ambient: jpAmbient
        ? {
            matrix_id: jpAmbient.matrix_ref,
            current_source: jpAmbient.wave_1_jp?.live ? 'catalog' : 'unsplash_fallback',
            row_current_source: jpAmbient.current_source,
            target_source: jpAmbient.target_source,
            jp_catalog_live: jpAmbient.wave_1_jp?.live === true,
            countries_catalog_live: jpAmbient.probe_detail?.live_countries ?? null,
          }
        : null,
    },
    rows: probed,
    wave_1: {
      matrix_id: 'DA-JP-HOME',
      status: 'READY_TO_START',
      operational_loop: ['upload', 'publish', 'verify', 'evidence', 'asset_matrix_pack', 'health_score'],
    },
    cms_operation: {
      phase: 'CMS_OPERATION',
      mode: 'operations_pipeline',
      priority_1: 'destination_ambient_10_countries',
      country_wave_order: WAVE_ORDER,
      priority_2: ['poi', 'hotel', 'transport', 'video'],
      operational_loop: ['upload', 'publish', 'verify', 'evidence', 'asset_matrix_pack', 'health_score'],
      refresh_script: 'scripts/dev/run-cms-ops-refresh.cjs',
      daily_board_script: 'scripts/dev/run-cms-daily-ops-board.cjs',
      forbidden: ['new_registry', 'new_runbook', 'new_review', 'new_matrix', 'new_policy'],
    },
    wave_1_next_action:
      jpAmbient && !jpAmbient.wave_1_jp?.live
        ? 'DA-JP-HOME: Upload → Publish → Verify → Evidence → Asset Matrix → Health Score'
        : null,
    related_ssot: {
      destination_ambient_matrix: fs.existsSync(DA_MATRIX)
        ? 'data/catalog/destination-ambient-matrix.v1.yaml'
        : null,
      health_score_script: 'scripts/dev/run-cms-content-health-score.cjs',
      health_score_role: 'passthrough_from_this_pack',
      phase1_dod_script: 'scripts/dev/run-cms-phase1-single-asset-dod.cjs --matrix-id DA-JP-HOME',
    },
    TT_CMS_ASSET_MATRIX: pass ? 'COMPLETE' : 'INCOMPLETE',
    TT_CMS_SOURCE_ALIGNMENT: sourceAlignment.display,
    TT_CMS_SOURCE_ALIGNMENT_PCT: sourceAlignmentPct,
    TT_CMS_CONTENT_HEALTH_SCORE: contentHealthScore.label,
    TT_CMS_CONTENT_HEALTH_STATUS: contentHealthScore.status,
    TT_CMS_DAILY_NEW_LIVE: dailyOpsBoard.daily_questions.new_live_assets_today,
    TT_CMS_VERIFY_FAILURES: dailyOpsBoard.daily_questions.verify_failure_count,
    TT_CMS_ROLLBACK_NEEDED: dailyOpsBoard.daily_questions.rollback_needed_count,
    TT_CMS_PIPELINE_PHASE: destinationAmbient?.active_phase?.id || 'phase_1',
    TT_CMS_WAVE_1: jpAmbient && !jpAmbient.wave_1_jp?.live ? 'READY_TO_START' : 'IN_PROGRESS_OR_DONE',
    honest_boundary:
      'Ops workbench only · ② staging probe ≠ ③ Production GO · OCS rows intentionally do_not_modify',
  };

  const outDir = path.join(ROOT, 'evidence/GO_cms_operation', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CMS-ASSET-MATRIX.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');

  console.log(`TT_CMS_ASSET_MATRIX: ${report.TT_CMS_ASSET_MATRIX}`);
  console.log(`TT_CMS_ASSET_MATRIX_ROWS: ${probed.length}`);
  console.log(`TT_CMS_SOURCE_ALIGNMENT: ${sourceAlignment.display} (${sourceAlignmentPct}%)`);
  console.log(`TT_CMS_CONTENT_HEALTH_SCORE: ${contentHealthScore.label}`);
  console.log(`TT_CMS_DAILY_NEW_LIVE: ${dailyOpsBoard.daily_questions.new_live_assets_today}`);
  console.log(`TT_CMS_VERIFY_FAILURES: ${dailyOpsBoard.daily_questions.verify_failure_count}`);
  console.log(`TT_CMS_ROLLBACK_NEEDED: ${dailyOpsBoard.daily_questions.rollback_needed_count}`);
  console.log(`TT_CMS_PIPELINE_PHASE: ${destinationAmbient?.active_phase?.id || 'phase_1'}`);
  console.log(`TT_CMS_ASSET_MATRIX_JP_AMBIENT: ${jpAmbient?.wave_1_jp?.live ? 'catalog' : 'unsplash_fallback'}`);
  console.log(`TT_CMS_WAVE_1: ${report.TT_CMS_WAVE_1}`);
  console.log(`TT_CMS_ASSET_MATRIX_EVIDENCE: evidence/GO_cms_operation/${stamp}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
