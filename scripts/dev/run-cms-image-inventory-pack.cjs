#!/usr/bin/env node
/**
 * CMS Image Inventory pack · 全站非 OCS 图片 current_source + L5 门（operational）。
 *
 *   node scripts/dev/run-cms-image-inventory-pack.cjs
 *   node scripts/dev/run-cms-image-inventory-pack.cjs --skip-probe
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const INVENTORY = path.join(ROOT, 'data/catalog/cms-image-inventory.v1.yaml');
const DA_MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-IMAGE-INVENTORY-LATEST.json');

const { parseInventoryItems, probeInventoryItem, L5_MANUAL_CHECKS } = require('./lib/cms-image-inventory.cjs');

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

  if (!fs.existsSync(INVENTORY)) {
    console.error('INVENTORY_MISSING: data/catalog/cms-image-inventory.v1.yaml');
    process.exit(2);
  }

  const invText = fs.readFileSync(INVENTORY, 'utf8');
  const daText = fs.existsSync(DA_MATRIX) ? fs.readFileSync(DA_MATRIX, 'utf8') : '';
  const items = parseInventoryItems(invText);

  const probed = [];
  for (const item of items) {
    if (skipProbe) {
      probed.push({
        ...item,
        current_source: 'placeholder',
        l5_compliant: false,
        needs_cms_l5_workflow: item.owner === 'CMS',
        l5_manual_checks: Object.fromEntries(L5_MANUAL_CHECKS.map((k) => [k, 'pending'])),
        probe_detail: { probe_skipped: true },
      });
    } else {
      probed.push(await probeInventoryItem(item, API, daText));
    }
  }

  const cmsItems = probed.filter((i) => i.owner === 'CMS');
  const needsWorkflow = cmsItems.filter((i) => i.needs_cms_l5_workflow);
  const compliant = cmsItems.filter((i) => i.l5_compliant);
  const bySource = {};
  for (const i of cmsItems) {
    bySource[i.current_source] = (bySource[i.current_source] || 0) + 1;
  }

  const uploadQueue = needsWorkflow
    .filter((i) => i.in_cms_asset_matrix)
    .sort((a, b) => (a.execution_order || 999) - (b.execution_order || 999));

  const nextItem = uploadQueue[0] || null;

  const report = {
    schema: 'traveltrust.cms_image_inventory_report.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    role: 'operations_inventory',
    not_governance: true,
    inventory_path: 'data/catalog/cms-image-inventory.v1.yaml',
    probe_api: skipProbe ? null : API,
    probe_skipped: skipProbe,
    summary: {
      total_items: probed.length,
      cms_scope: cmsItems.length,
      needs_cms_l5_workflow: needsWorkflow.length,
      l5_compliant_partial: compliant.length,
      by_current_source: bySource,
      next_upload: nextItem
        ? {
            id: nextItem.id,
            matrix_id: nextItem.matrix_id,
            country_iso: nextItem.country_iso,
            admin_route: nextItem.admin_route,
            current_source: nextItem.current_source,
          }
        : null,
    },
    upload_queue: uploadQueue.map((i) => ({
      id: i.id,
      asset_type: i.asset_type,
      matrix_id: i.matrix_id,
      country_iso: i.country_iso,
      current_source: i.current_source,
      asset_lifecycle: i.asset_lifecycle,
      l5_automated: i.l5_automated,
      admin_route: i.admin_route,
      workflow: i.workflow_next,
    })),
    items: probed,
    correct_flow_reminder: [
      'one_by_one_upload',
      'no_batch_replace',
      'no_ocs_fallback',
      'manual_l5_all_checks_before_live',
    ],
    TT_CMS_IMAGE_INVENTORY: items.length >= 14 ? 'COMPLETE' : 'INCOMPLETE',
    honest_boundary: 'Inventory + automated source probe · manual L5 checklist per asset before Live · ② staging',
  };

  const outDir = path.join(ROOT, 'evidence/GO_cms_operation/image-inventory', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CMS-IMAGE-INVENTORY.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');

  console.log(`TT_CMS_IMAGE_INVENTORY: ${report.TT_CMS_IMAGE_INVENTORY}`);
  console.log(`TT_CMS_IMAGE_INVENTORY_CMS_SCOPE: ${cmsItems.length}`);
  console.log(`TT_CMS_IMAGE_INVENTORY_NEEDS_L5: ${needsWorkflow.length}`);
  console.log(`TT_CMS_IMAGE_INVENTORY_BY_SOURCE: ${JSON.stringify(bySource)}`);
  if (nextItem) {
    console.log(`TT_CMS_IMAGE_INVENTORY_NEXT: ${nextItem.matrix_id || nextItem.id} (${nextItem.current_source})`);
  }
  console.log(`TT_CMS_IMAGE_INVENTORY_EVIDENCE: evidence/GO_cms_operation/image-inventory/${stamp}`);
  process.exit(report.TT_CMS_IMAGE_INVENTORY === 'COMPLETE' ? 0 : 1);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
