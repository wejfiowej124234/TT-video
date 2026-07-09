#!/usr/bin/env node
/**
 * CMS L5 全站视觉资产只读扫描（Content Ownership Inventory + CMS Asset Matrix）
 *
 *   node scripts/dev/run-cms-l5-visual-asset-scan.cjs
 *   node scripts/dev/run-cms-l5-visual-asset-scan.cjs --skip-probe
 *
 * 禁止：批量无审核替换 · OCS 回流 · 业务代码/DB Schema 变更
 * 流程：不符合 L5 的 CMS 项 → 队列 → Upload → Review → Publish → Verify → Evidence → Live（逐张）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const OWNERSHIP = path.join(ROOT, 'data/catalog/content-ownership-inventory.v1.yaml');
const INVENTORY = path.join(ROOT, 'data/catalog/cms-image-inventory.v1.yaml');
const DA_MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const POI_HERO_MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const HT_WAVE_MATRIX = path.join(ROOT, 'data/catalog/hotel-transport-wave1-matrix.v1.yaml');
const LISTINGS_WAVE_MATRIX = path.join(ROOT, 'data/catalog/listings-wave1-matrix.v1.yaml');
const MATRIX = path.join(ROOT, 'data/catalog/cms-asset-matrix.v1.yaml');
const INV_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-IMAGE-INVENTORY-LATEST.json');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-VISUAL-SCAN-LATEST.json');
const DENOM_LOCK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json');

const { runVisualScan, CMS_QUEUES, WORKFLOW, OPS_PRIORITY } = require('./lib/cms-l5-visual-scan.cjs');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function main() {
  const stamp =
    arg('--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const skipProbe = hasFlag('--skip-probe');

  for (const p of [OWNERSHIP, INVENTORY, MATRIX]) {
    if (!fs.existsSync(p)) {
      console.error(`MISSING_SSOT: ${path.relative(ROOT, p)}`);
      process.exit(2);
    }
  }

  const ownershipText = fs.readFileSync(OWNERSHIP, 'utf8');
  const inventoryText = fs.readFileSync(INVENTORY, 'utf8');
  const daText = fs.existsSync(DA_MATRIX) ? fs.readFileSync(DA_MATRIX, 'utf8') : '';
  const poiHeroText = fs.existsSync(POI_HERO_MATRIX) ? fs.readFileSync(POI_HERO_MATRIX, 'utf8') : '';
  const hotelTransportWaveText = fs.existsSync(HT_WAVE_MATRIX) ? fs.readFileSync(HT_WAVE_MATRIX, 'utf8') : '';
  const listingsWaveText = fs.existsSync(LISTINGS_WAVE_MATRIX) ? fs.readFileSync(LISTINGS_WAVE_MATRIX, 'utf8') : '';
  let imageInventoryLatest = null;
  if (fs.existsSync(INV_LATEST)) {
    try {
      imageInventoryLatest = JSON.parse(fs.readFileSync(INV_LATEST, 'utf8'));
    } catch {
      imageInventoryLatest = null;
    }
  }

  let scan;
  if (skipProbe) {
    scan = {
      ownership_modules: [],
      visual_findings: [],
      queues: Object.fromEntries(CMS_QUEUES.map((q) => [q, []])),
      excluded_ocs: [],
      reference_non_cms: [],
      summary: {
        ownership_modules_scanned: 0,
        visual_findings_total: 0,
        cms_scope: 0,
        needs_cms_l5_workflow: 0,
        l5_compliant_partial: 0,
        probe_skipped: true,
        next_single_asset: { scan_id: 'DA-JP-HOME', matrix_id: 'DA-JP-HOME', current_source: 'unsplash_fallback', cms_queue: 'destination_ambient' },
      },
    };
  } else {
    scan = await runVisualScan({
      api: API,
      ownershipText,
      inventoryText,
      imageInventoryLatest,
      daText,
      poiHeroText,
      hotelTransportWaveText,
      listingsWaveText,
    });
  }

  const queuePending = CMS_QUEUES.reduce((n, q) => n + (scan.queues[q]?.length || 0), 0);
  const queuePendingCms = CMS_QUEUES.reduce(
    (n, q) => n + (scan.queues[q]?.filter((i) => i.needs_cms_l5_workflow)?.length || 0),
    0,
  );

  const report = {
    schema: 'traveltrust.cms_l5_visual_scan.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    role: 'read_only_visual_scan',
    not_governance: true,
    scan_mode: 'read_only',
    ssot_inputs: {
      content_ownership_inventory: 'data/catalog/content-ownership-inventory.v1.yaml',
      cms_asset_matrix: 'data/catalog/cms-asset-matrix.v1.yaml',
      cms_image_inventory: 'data/catalog/cms-image-inventory.v1.yaml',
      image_inventory_latest: fs.existsSync(INV_LATEST)
        ? 'evidence/GO_cms_operation/CMS-IMAGE-INVENTORY-LATEST.json'
        : null,
    },
    probe_api: skipProbe ? null : API,
    probe_skipped: skipProbe,
    ops_priority_wave:
      'P0 Destination Ambient (JP→KR→TH→SG→FR→US→AU→ES→AE→CN) · P1 POI/Hotel/Transport · P2 listing covers split by source',
    pages_in_scope: [
      '/',
      '/market',
      '/market/provider',
      '/market/acquisition',
      '/itinerary/new',
      '/traveltrust',
      'POI adapters',
      'hotel/transport stock',
      'did-rank (reference only)',
    ],
    forbidden: [
      'batch_replace_without_l5',
      'route_back_to_ocs',
      'business_code_changes',
      'db_schema_changes',
    ],
    workflow: WORKFLOW,
    cms_queues: CMS_QUEUES,
    summary: scan.summary,
    ops_priority: scan.ops_priority || OPS_PRIORITY,
    queue_pending_total: queuePending,
    cms_queue_pending_total: queuePendingCms,
    queues: scan.queues,
    todays_review: scan.summary.todays_review,
    cms_operation_wave_1: scan.cms_operation_wave_1 || scan.summary.cms_operation_wave_1,
    ownership_modules: scan.ownership_modules,
    visual_findings: scan.visual_findings,
    excluded_ocs: scan.excluded_ocs,
    reference_non_cms: scan.reference_non_cms,
    audit_ssot: scan.audit_ssot || null,
    correct_flow_reminder: [
      'one_by_one_upload',
      'no_batch_replace',
      'no_ocs_fallback',
      'manual_l5_all_checks_before_live',
    ],
    TT_CMS_L5_VISUAL_SCAN: skipProbe ? 'SKIPPED' : 'COMPLETE',
    TT_CMS_L5_VISUAL_NEEDS: scan.summary.needs_cms_l5_workflow,
    TT_CMS_L5_VISUAL_CMS_SCOPE: scan.summary.cms_scope,
    honest_boundary:
      'Read-only staging probe + ownership cross-ref · manual L5 per asset before Live · ② staging ≠ ③ Production GO',
  };

  if (fs.existsSync(DENOM_LOCK)) {
    try {
      const lock = JSON.parse(fs.readFileSync(DENOM_LOCK, 'utf8'));
      const d = lock.cms_denominator;
      if (d?.total != null) {
        report.denominator_lock_alignment = {
          stamp_utc: lock.stamp_utc,
          ssot: 'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json',
          cms_total: d.total,
          cms_live: d.live,
          review_required: d.review_required,
          completion: d.completion,
          destination_ambient: d.by_category?.destination_ambient || null,
          ambient_wave_closure: lock.ambient_wave_closure || null,
          by_l5_status: {
            LIVE: d.live,
            REVIEW_REQUIRED: d.review_required,
            PASS: 0,
            VERIFIED: 0,
          },
          note: 'Ops SSOT when lock refreshed · raw scan findings may include catalog_empty POI/Hotel/Transport',
        };
        report.TT_CMS_L5_STATUS = report.denominator_lock_alignment.by_l5_status;
      }
    } catch {
      report.TT_CMS_L5_STATUS = scan.summary.by_l5_status || {};
    }
  } else {
    report.TT_CMS_L5_STATUS = scan.summary.by_l5_status || {};
  }

  const outDir = path.join(ROOT, 'evidence/GO_cms_operation/l5-visual-scan', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CMS-L5-VISUAL-SCAN.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');

  console.log(`TT_CMS_L5_VISUAL_SCAN: ${report.TT_CMS_L5_VISUAL_SCAN}`);
  console.log(`TT_CMS_L5_VISUAL_CMS_SCOPE: ${scan.summary.cms_scope}`);
  console.log(`TT_CMS_L5_VISUAL_NEEDS: ${scan.summary.needs_cms_l5_workflow}`);
  console.log(`TT_CMS_L5_VISUAL_QUEUE_PENDING: ${queuePendingCms}`);
  console.log(`TT_CMS_L5_STATUS: ${JSON.stringify(report.TT_CMS_L5_STATUS || {})}`);
  if (report.denominator_lock_alignment) {
    console.log(
      `TT_CMS_L5_STATUS_LOCK_ALIGNED: LIVE=${report.denominator_lock_alignment.cms_live} REVIEW_REQUIRED=${report.denominator_lock_alignment.review_required} total=${report.denominator_lock_alignment.cms_total}`,
    );
  }
  console.log(`TT_CMS_L5_STATUS_RAW_SCAN: ${JSON.stringify(scan.summary.by_l5_status || {})}`);
  const w1 = scan.cms_operation_wave_1 || scan.summary.cms_operation_wave_1;
  if (w1?.wave_progress) {
    console.log(`TT_CMS_WAVE1_PROGRESS: ${w1.wave_progress.display}`);
  }
  if (w1?.current_phase) {
    console.log(
      `TT_CMS_WAVE1_PHASE: ${w1.current_phase.priority || 'DONE'} · next=${w1.current_phase.next_asset?.matrix_id || w1.current_phase.next_asset?.scan_id || '—'}`,
    );
  }
  console.log(`TT_CMS_L5_OPS_PRIORITY: P0=${scan.summary.ops_priority_tiers?.P0?.pending ?? '—'} P1=${scan.summary.ops_priority_tiers?.P1?.pending ?? '—'} P2=${scan.summary.ops_priority_tiers?.P2?.pending ?? '—'}`);
  console.log(`TT_CMS_L5_REGION_REVIEW: ${scan.summary.flag_counts?.region_review_required ?? 0}`);
  console.log(`TT_CMS_L5_VISUAL_BY_SOURCE: ${JSON.stringify(scan.summary.by_current_source || {})}`);
  console.log(`TT_CMS_L5_VISUAL_BY_QUEUE: ${JSON.stringify(scan.summary.by_cms_queue || {})}`);
  if (scan.summary.next_single_asset) {
    const n = scan.summary.next_single_asset;
    console.log(
      `TT_CMS_L5_VISUAL_NEXT: ${n.matrix_id || n.scan_id} (${n.current_source}) · queue=${n.cms_queue}`,
    );
  }
  console.log(`TT_CMS_L5_VISUAL_EVIDENCE: evidence/GO_cms_operation/l5-visual-scan/${stamp}`);
  process.exit(report.TT_CMS_L5_VISUAL_SCAN === 'COMPLETE' || report.TT_CMS_L5_VISUAL_SCAN === 'SKIPPED' ? 0 : 1);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
