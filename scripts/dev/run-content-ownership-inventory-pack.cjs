#!/usr/bin/env node
/**
 * Content Ownership Inventory · read-only pack (not governance).
 *
 *   node scripts/dev/run-content-ownership-inventory-pack.cjs
 *   node scripts/dev/run-content-ownership-inventory-pack.cjs --stamp 20260705T031000Z
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const INVENTORY = path.join(ROOT, 'data/catalog/content-ownership-inventory.v1.yaml');
const POLICY = path.join(ROOT, 'docs/runbook/TT-CONTENT-OWNERSHIP-POLICY.md');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function parseItems(text) {
  const items = [];
  const blocks = text.split(/\n      - id: /).slice(1);
  for (const block of blocks) {
    const id = block.match(/^([^\n]+)/)?.[1]?.trim();
    if (!id) continue;
    const get = (key) => block.match(new RegExp(`\\n        ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    items.push({
      id,
      page_module: get('page_module'),
      route: get('route'),
      owner: get('owner'),
      modify_entry: get('modify_entry'),
      current_status: get('current_status'),
      business_criticality: get('business_criticality'),
      image_owner: get('image_owner'),
    });
  }
  return items;
}

function parsePerP0Ids(text) {
  const section = text.split('per_p0_pages:')[1]?.split('quick_lookup:')[0] || '';
  return [...section.matchAll(/\n  - ([a-z0-9-]+)/g)].map((m) => m[1]);
}

function parseQuickLookup(text) {
  const section = text.split('quick_lookup:')[1]?.split('per_p0_pages:')[0] || text.split('quick_lookup:')[1] || '';
  const rows = [];
  let cur = {};
  for (const line of section.split('\n')) {
    const q = line.match(/^  - question: (.+)/);
    if (q) {
      if (cur.question) rows.push(cur);
      cur = { question: q[1] };
      continue;
    }
    const o = line.match(/^    owner: (.+)/);
    const s = line.match(/^    current_status: (.+)/);
    const m = line.match(/^    modify_entry: (.+)/);
    const a = line.match(/^    answer: (.+)/);
    if (o) cur.owner = o[1];
    if (s) cur.current_status = s[1];
    if (m) cur.modify_entry = m[1];
    if (a) cur.answer = a[1];
  }
  if (cur.question) rows.push(cur);
  return rows;
}

function countCategories(text) {
  const catSection = text.split('categories:')[1]?.split('quick_lookup:')[0] || '';
  return (catSection.match(/\n  - id: /g) || []).length;
}

function countImagePoints(items) {
  return items.filter((i) => {
    const io = i.image_owner || '';
    return io && !/^N\/A/i.test(io) && !/layout/i.test(io);
  }).length;
}

function statusLabel(s) {
  const map = {
    live: 'Live',
    draft: 'Draft',
    frozen: 'Frozen',
    not_started: 'Not Started',
    ops_maintenance: 'Ops Maintenance',
    redirect: 'Redirect',
  };
  return map[s] || s;
}

function main() {
  const stamp =
    arg('--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  if (!fs.existsSync(INVENTORY)) {
    console.error('INVENTORY_MISSING: data/catalog/content-ownership-inventory.v1.yaml');
    process.exit(2);
  }

  const text = fs.readFileSync(INVENTORY, 'utf8');
  const items = parseItems(text);
  const perP0Ids = parsePerP0Ids(text);
  const quickLookup = parseQuickLookup(text);
  const categories = countCategories(text);
  const imagePoints = countImagePoints(items);

  const byCriticality = { P0: [], P1: [], P2: [] };
  const byStatus = {};
  for (const item of items) {
    if (item.business_criticality && byCriticality[item.business_criticality]) {
      byCriticality[item.business_criticality].push({
        id: item.id,
        page_module: item.page_module,
        route: item.route,
        owner: item.owner,
        current_status: item.current_status,
        modify_entry: item.modify_entry,
      });
    }
    const st = item.current_status || 'unknown';
    byStatus[st] = (byStatus[st] || 0) + 1;
  }

  const perP0Pages = items.filter((i) => perP0Ids.includes(i.id));

  const pass = items.length >= 30 && categories >= 8 && fs.existsSync(POLICY) && perP0Pages.length >= 10;

  const report = {
    schema: 'traveltrust.content_ownership_inventory_report.v2',
    stamp_utc: stamp,
    inventory_type: 'read_only',
    not_governance: true,
    inventory_path: 'data/catalog/content-ownership-inventory.v1.yaml',
    inventory_schema: 'traveltrust.content_ownership_inventory.v2',
    policy_ssot: 'docs/runbook/TT-CONTENT-OWNERSHIP-POLICY.md',
    execution_links: {
      per_business_closed_loop: {
        flow: ['inventory', 'p0_pages', 'evidence', 'signoff'],
        criticality_order: ['P0', 'P1', 'P2'],
        p0_entry_ids: perP0Ids,
      },
      cms_operation: {
        flow: ['inventory', 'owner', 'modify_entry', 'publish', 'verify', 'evidence', 'health_score'],
      },
      production_go: { requires: ['per_signoff', 'cms_ops_maturity'] },
    },
    summary: {
      categories_checked: categories,
      pages_modules_checked: items.length,
      image_consumption_points: imagePoints,
      by_current_status: byStatus,
      by_business_criticality: {
        P0: byCriticality.P0.length,
        P1: byCriticality.P1.length,
        P2: byCriticality.P2.length,
      },
    },
    per_p0_pages: perP0Pages.map((i) => ({
      id: i.id,
      page_module: i.page_module,
      route: i.route,
      owner: i.owner,
      current_status: i.current_status,
      current_status_label: statusLabel(i.current_status),
      modify_entry: i.modify_entry,
    })),
    items_by_criticality: byCriticality,
    quick_lookup: quickLookup,
    operator_summary_table: items.slice(0, 12).map((i) => ({
      page: i.page_module,
      owner: i.owner,
      current_status: statusLabel(i.current_status),
      criticality: i.business_criticality,
    })),
    completion_criterion:
      'Every entry: owner, modify_entry, current_status, business_criticality',
    TT_CONTENT_OWNERSHIP_INVENTORY: pass ? 'COMPLETE' : 'INCOMPLETE',
    honest_boundary:
      'Inventory = map for PER + CMS execution; not governance; phase ① basis',
  };

  const outDir = path.join(ROOT, 'evidence/GO_content_ownership_inventory', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'CONTENT-OWNERSHIP-INVENTORY.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  fs.writeFileSync(
    path.join(ROOT, 'evidence/GO_content_ownership_inventory/CONTENT-OWNERSHIP-INVENTORY-LATEST.json'),
    JSON.stringify(report, null, 2) + '\n',
  );

  console.log(`TT_CONTENT_OWNERSHIP_INVENTORY: ${report.TT_CONTENT_OWNERSHIP_INVENTORY}`);
  console.log(`TT_INVENTORY_PAGES_MODULES: ${items.length}`);
  console.log(`TT_INVENTORY_P0_PAGES: ${byCriticality.P0.length}`);
  console.log(`TT_INVENTORY_PER_P0_ENTRY: ${perP0Pages.length}`);
  console.log(`TT_INVENTORY_STATUS_LIVE: ${byStatus.live || 0}`);
  console.log(`TT_INVENTORY_STATUS_DRAFT: ${byStatus.draft || 0}`);
  console.log(`TT_INVENTORY_STATUS_FROZEN: ${byStatus.frozen || 0}`);
  console.log(`TT_INVENTORY_EVIDENCE: evidence/GO_content_ownership_inventory/${stamp}`);
  process.exit(pass ? 0 : 1);
}

main();
