#!/usr/bin/env node
/**
 * CMS P1 Content Family Standard · Evidence generator
 * SSOT: registry/cms-p1-content-family-standard.v1.yaml
 * Runbook: docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const REGISTRY = path.join(ROOT, 'registry/cms-p1-content-family-standard.v1.yaml');
const OUT_JSON = path.join(EVIDENCE, 'CMS-P1-CONTENT-FAMILY-STANDARD-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-P1-CONTENT-FAMILY-STANDARD-LATEST.md');

function readYamlLite(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const modules = [];
  let current = null;
  let inModules = false;
  for (const line of raw.split('\n')) {
    if (/^modules:/.test(line)) {
      inModules = true;
      continue;
    }
    if (inModules && /^p0_frozen_reference:/.test(line)) break;
    if (!inModules) continue;
    if (/^  - id:/.test(line)) {
      if (current) modules.push(current);
      current = { id: line.split(':')[1].trim() };
    } else if (current && /^    [a-z_]+:/.test(line)) {
      const [k, ...rest] = line.trim().split(':');
      current[k] = rest.join(':').trim() || null;
    }
  }
  if (current) modules.push(current);
  return { modules };
}

function readMasterRegistry() {
  const p = path.join(ROOT, 'registry/cms-master-registry.v1.yaml');
  const raw = fs.readFileSync(p, 'utf8');
  const mods = [];
  let cur = null;
  for (const line of raw.split('\n')) {
    if (/^  - id:/.test(line)) {
      if (cur) mods.push(cur);
      cur = { id: line.split(':')[1].trim() };
    } else if (cur && /^    [a-z_]+:/.test(line)) {
      const [k, ...rest] = line.trim().split(':');
      let v = rest.join(':').trim();
      if (v === 'true') v = true;
      if (v === 'false') v = false;
      cur[k] = v;
    }
  }
  if (cur) mods.push(cur);
  return mods;
}

function formatMd(doc) {
  return [
    '# CMS P1 Content Family Standard',
    '',
    '| | |',
    '|---|---|',
    '| **Version** | 1.0.0 |',
    '| **Status** | FROZEN |',
    '| **Review** | PASS · v1.1.0 |',
    `| **Effective** | ${doc.effective_utc.slice(0, 10)} |`,
    '| **Runbook** | `docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md` |',
    '',
    '> P1 四模块共用模板 · **先 Standard · 再复制模块**',
    '',
    '## P1 路线图',
    '',
    '```',
    'P1 Standard → City Hero → Hotel → Transport → Listings',
    '```',
    '',
    '## 七段统一规范',
    '',
    '| # | 段 | SSOT |',
    '|---|-----|------|',
    '| 1 | asset_kind 命名 | snake_case · API 暴露后冻结 |',
    '| 2 | Catalog Schema | Brief + Matrix + revisions + media index |',
    '| 3 | Runtime Contract | API + resolver + consumer route |',
    '| 4 | Admin | Content Center · publish 写 revision |',
    '| 5 | Publish | Review→Replace→Publish→Verify→Evidence→Live |',
    '| 6 | Verify | 族专用 script + execution_gates |',
    '| 7 | L5 Exit | 8 条全满足才可 Registry Frozen |',
    '',
    '## P1 模块状态',
    '',
    '| 模块 | asset_kind | Registry | Catalog | 下一步 |',
    '|------|------------|----------|---------|--------|',
    ...doc.modules.map((m) => {
      let kind = m.asset_kind || '—';
      if (!m.asset_kind && m.content_families) {
        kind = String(m.content_families).replace(/^\[|\]$/g, '').replace(/"/g, '');
      }
      return `| ${m.product_name || m.id} | \`${kind}\` | ${m.registry_status || '—'} | ${m.catalog_status || '—'} | ${m.next_action || '—'} |`;
    }),
    '',
    '## P0 参考（已 Frozen · ≠ P1 未完成项）',
    '',
    ...doc.p0_frozen.map((p) => `- **${p.id}** · \`${p.asset_kind}\``),
    '',
    '## 刷新',
    '',
    '`node scripts/dev/run-cms-p1-content-family-standard.cjs`',
  ].join('\n');
}

function main() {
  const stamp = new Date().toISOString();
  const parsed = readYamlLite(REGISTRY);
  const master = readMasterRegistry();
  const p1Ids = ['city_hero', 'hotel', 'transport', 'listings'];

  const modules = parsed.modules.map((m) => {
    const reg = master.find((r) => r.id === m.registry_id);
    return {
      ...m,
      registry_status: reg?.status || '—',
      registry_l5: reg?.l5_pass ? '✅' : '❌',
      registry_next: reg?.next || '—',
    };
  });

  const doc = {
    schema: 'traveltrust.cms_p1_content_family_standard_evidence.v1',
    recorded_at_utc: stamp,
    effective_utc: stamp,
    status: 'FROZEN',
    version: '1.1.0',
    review: 'CMS-P1-STANDARD-REVIEW-LATEST.json',
    TT_CMS_P1_CONTENT_FAMILY_STANDARD: 'FROZEN',
    runbook: 'docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md',
    registry_yaml: 'registry/cms-p1-content-family-standard.v1.yaml',
    roadmap: ['P1 Standard', 'City Hero', 'Hotel', 'Transport', 'Listings'],
    standard_sections: [
      'asset_kind_naming',
      'catalog_schema',
      'runtime_contract',
      'admin_editing',
      'publish_flow',
      'verify_flow',
      'l5_exit_conditions',
    ],
    modules,
    p0_frozen: [
      { id: 'poi_content_qa', asset_kind: 'poi_hero', locked: '330/330' },
      { id: 'destination_ambient_hero', asset_kind: 'landing_ambient', locked: '10/10 hero' },
      { id: 'destination_ambient', asset_kind: 'landing_ambient', locked: '10/10 ambient' },
    ],
    master_registry_p1: master.filter((m) => p1Ids.includes(m.id)),
    city_hero_ssot: 'evidence/GO_cms_operation/CMS-CITY-HERO-SSOT-VERIFICATION-LATEST.json',
  };

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatMd(doc) + '\n');

  console.log('TT_CMS_P1_CONTENT_FAMILY_STANDARD: FROZEN (v1.1.0)');
  console.log(`Modules: ${modules.map((m) => m.id).join(' · ')}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
