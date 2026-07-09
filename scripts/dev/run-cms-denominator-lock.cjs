#!/usr/bin/env node
/**
 * CMS 分母锁定 · 今日 Step 1（只读 · 不 Publish · 不改 DB）
 *
 *   node scripts/dev/run-cms-denominator-lock.cjs
 *
 * 锁完再逐项闭环 · 禁止未锁分母直接冲 33/33
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const OWNERSHIP = path.join(ROOT, 'data/catalog/content-ownership-inventory.v1.yaml');
const DA_MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json');

const { runDenominatorLock, CMS_CATEGORIES, CATEGORY_LABELS } = require('./lib/cms-denominator-lock.cjs');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');

async function main() {
  if (!fs.existsSync(OWNERSHIP)) {
    console.error('MISSING: data/catalog/content-ownership-inventory.v1.yaml');
    process.exit(2);
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const ownershipText = fs.readFileSync(OWNERSHIP, 'utf8');
  const daText = fs.existsSync(DA_MATRIX) ? fs.readFileSync(DA_MATRIX, 'utf8') : '';

  const lock = await runDenominatorLock({ api: API, ownershipText, daText });

  const report = {
    schema: 'traveltrust.cms_denominator_lock.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    role: 'denominator_lock_frozen',
    not_governance: true,
    probe_api: API,
    ssot: 'data/catalog/content-ownership-inventory.v1.yaml',
    categories: CMS_CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })),
    ...lock,
    TT_CMS_DENOMINATOR_LOCK: 'FROZEN',
    TT_CMS_DENOMINATOR_TOTAL: lock.cms_denominator.total,
    TT_CMS_DENOMINATOR_LIVE: lock.cms_denominator.live,
    TT_CMS_DENOMINATOR_REVIEW_REQUIRED: lock.cms_denominator.review_required,
  };

  const outDir = path.join(ROOT, 'evidence/GO_cms_operation/denominator-lock', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CMS-DENOMINATOR-LOCK.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');

  console.log(`TT_CMS_DENOMINATOR_LOCK: ${report.TT_CMS_DENOMINATOR_LOCK}`);
  console.log(`TT_CMS_DENOMINATOR_TOTAL: ${report.TT_CMS_DENOMINATOR_TOTAL}`);
  console.log(`TT_CMS_DENOMINATOR_LIVE: ${report.TT_CMS_DENOMINATOR_LIVE}`);
  console.log(`TT_CMS_DENOMINATOR_REVIEW_REQUIRED: ${report.TT_CMS_DENOMINATOR_REVIEW_REQUIRED}`);
  console.log('TT_CMS_DENOMINATOR_BY_CATEGORY:');
  for (const cat of CMS_CATEGORIES) {
    const row = lock.cms_denominator.by_category[cat];
    if (!row) continue;
    console.log(`  ${row.label}: ${row.completion}${row.catalog_empty ? ' · catalog_empty' : ''}`);
  }
  console.log(`TT_CMS_NON_CMS_REGISTRY: ${lock.non_cms_registry.total} modules (register only)`);
  if (lock.next_action) {
    console.log(`TT_CMS_DENOMINATOR_NEXT: ${lock.next_action.label} · ${lock.next_action.step}`);
  }
  console.log(`TT_CMS_DENOMINATOR_EVIDENCE: evidence/GO_cms_operation/denominator-lock/${stamp}`);
  if (lock.ambient_wave_closure?.status === 'COMPLETE') {
    console.log(`TT_CMS_AMBIENT_WAVE_CLOSURE: COMPLETE · ${lock.ambient_wave_closure.display}`);
    console.log(`TT_CMS_DENOMINATOR_NEXT_FAMILY: ${lock.next_action?.category || 'POI'} · ${lock.next_action?.label || '—'}`);
  } else if (lock.next_action) {
    console.log(`TT_CMS_DENOMINATOR_NEXT: ${lock.next_action.label} · ${lock.next_action.step}`);
  }
  console.log('');
  console.log('分母已锁 · 逐项闭环后 refresh · Ambient 10/10 后下一族 POI');
  process.exit(0);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
