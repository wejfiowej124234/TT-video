#!/usr/bin/env node
/**
 * CMS Master Registry V2 · Solo Founder · 每日总表
 *
 * 六列：模块 · 状态 · Business Critical · L5 · CMS · 下一步
 * 状态仅四种：Frozen · Pilot · Backlog · Registry
 * L5 仅：✅ POI 同级 / ❌ 未达（细节在 evidence 体系）
 *
 * 不维护 Owner / Release Gate / Sprint · 不是项目管理工具
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_JSON = path.join(EVIDENCE, 'CMS-MASTER-REGISTRY-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-MASTER-REGISTRY-LATEST.md');
const REGISTRY_YAML = path.join(ROOT, 'registry/cms-master-registry.v1.yaml');

function readJson(rel) {
  const p = path.join(EVIDENCE, rel);
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/** @typedef {'Frozen'|'Pilot'|'Backlog'|'Registry'} RegistryStatus */

/**
 * @param {object} r
 * @param {RegistryStatus} r.status
 * @param {'P0'|'P1'|'P2'|'—'} r.business_critical
 * @param {boolean} r.l5_pass
 * @param {'CMS'|'OCS'|'NON_CONTENT'} r.plane
 * @param {string} r.next
 */
function mod(r) {
  return {
    id: r.id,
    module: r.module,
    status: r.status,
    business_critical: r.business_critical,
    l5_pass: r.l5_pass,
    plane: r.plane,
    belongs_to_cms: r.plane === 'CMS',
    next: r.next,
  };
}

const MODULES = [
  mod({ id: 'poi_content_qa', module: 'POI Content QA', status: 'Frozen', business_critical: 'P0', l5_pass: true, plane: 'CMS', next: '无' }),
  mod({ id: 'destination_ambient', module: 'Destination Ambient', status: 'Frozen', business_critical: 'P0', l5_pass: true, plane: 'CMS', next: '无' }),
  mod({ id: 'destination_ambient_hero', module: 'Hero Assets', status: 'Frozen', business_critical: 'P0', l5_pass: true, plane: 'CMS', next: '无' }),
  mod({
    id: 'city_hero',
    module: 'City Hero',
    status: 'Pilot',
    business_critical: 'P1',
    l5_pass: false,
    plane: 'CMS',
    next: 'Pilot Architecture Validated · WP5 暂停 · 无 L5/Consumer/Ops 矩阵',
  }),
  mod({
    id: 'hotel',
    module: 'Hotel',
    status: 'Pilot',
    business_critical: 'P1',
    l5_pass: false,
    plane: 'CMS',
    next: 'Discovery Complete · Brief+Matrix+Boundary · 等待实现决策',
  }),
  mod({
    id: 'transport',
    module: 'Transport',
    status: 'Backlog',
    business_critical: 'P1',
    l5_pass: false,
    plane: 'CMS',
    next: 'P1 后续 · 按 Standard 规模化',
  }),
  mod({
    id: 'listings',
    module: 'Listings',
    status: 'Backlog',
    business_critical: 'P1',
    l5_pass: false,
    plane: 'CMS',
    next: 'P1 后续 · 按 Standard 规划结构',
  }),
  mod({ id: 'banner', module: 'Banner', status: 'Backlog', business_critical: 'P2', l5_pass: false, plane: 'CMS', next: '上线后' }),
  mod({ id: 'video_poster', module: 'Video Poster', status: 'Backlog', business_critical: 'P2', l5_pass: false, plane: 'CMS', next: '上线后' }),
  mod({ id: 'seo_metadata', module: 'SEO', status: 'Backlog', business_critical: 'P2', l5_pass: false, plane: 'CMS', next: '上线后' }),
  mod({ id: 'country_city_copy', module: 'i18n Copy', status: 'Backlog', business_critical: 'P2', l5_pass: false, plane: 'CMS', next: '上线后' }),
  mod({ id: 'official_guides', module: 'Official Guides', status: 'Registry', business_critical: '—', l5_pass: false, plane: 'OCS', next: '无' }),
  mod({ id: 'community_official', module: 'Community', status: 'Registry', business_critical: '—', l5_pass: false, plane: 'OCS', next: '无' }),
  mod({ id: 'governance_cms', module: 'Governance', status: 'Registry', business_critical: '—', l5_pass: false, plane: 'NON_CONTENT', next: '无' }),
];

const STATUS_LABEL = {
  Frozen: '✅ Frozen',
  Pilot: '⏳ Pilot',
  Backlog: '📋 Backlog',
  Registry: 'Registry',
};

function l5Cell(m) {
  if (m.status === 'Registry') return '—';
  return m.l5_pass ? '✅' : '❌';
}

function computeStats(modules) {
  const cmsModules = modules.filter((m) => m.belongs_to_cms);
  const l5Scope = modules.filter((m) => m.status !== 'Registry');
  return {
    cms_modules_total: modules.length,
    frozen_p0: modules.filter((m) => m.status === 'Frozen' && m.business_critical === 'P0').length,
    pilot_p1: modules.filter((m) => m.status === 'Pilot' && m.business_critical === 'P1').length,
    backlog: modules.filter((m) => m.status === 'Backlog').length,
    registry_only: modules.filter((m) => m.status === 'Registry').length,
    l5_ready: l5Scope.filter((m) => m.l5_pass).length,
    l5_scope: l5Scope.length,
    cms_track_count: cmsModules.length,
  };
}

function todayFocus(modules) {
  const hotel = modules.find((m) => m.id === 'hotel' && m.status === 'Pilot');
  if (hotel?.next?.includes('Discovery Complete')) {
    return { module: hotel.module, next: 'Discovery Complete · 等待实现决策 · 不进入 WP0/Admin/API' };
  }
  if (hotel) return { module: hotel.module, next: hotel.next };
  const pilot = modules.find((m) => m.status === 'Pilot');
  if (pilot) return { module: pilot.module, next: pilot.next };
  const backlog = modules.find((m) => m.status === 'Backlog' && m.business_critical === 'P1');
  if (backlog) return { module: backlog.module, next: backlog.next };
  return { module: '—', next: '—' };
}

function formatMd(doc) {
  const s = doc.stats;
  return [
    '# TravelTrust CMS Master Registry',
    '',
    '| | |',
    '|---|---|',
    '| **Version** | V2 |',
    '| **Status** | ACTIVE |',
    '| **Baseline** | Ten Country CMS Content QA |',
    `| **Last Updated** | ${doc.recorded_at_utc.slice(0, 10)} |`,
    '| **Owner** | Solo Founder |',
    '',
    '> **当前唯一有效版本。** Registry = 总账 · 不替代 Evidence · 不是项目管理工具',
    '',
    '## 治理三层',
    '',
    '```',
    'CMS Master Registry  →  现在是什么状态？',
    '        ↓',
    '   今天做什么（下一步）',
    '        ↓',
    'Evidence             →  为什么是这个状态？',
    '        ↓',
    'Script               →  怎么重新生成？',
    '```',
    '',
    '| 层 | 职责 | 示例 |',
    '|----|------|------|',
    '| **① Registry** | 现在是什么状态？ | POI → Frozen · City Hero → Pilot |',
    '| **② Evidence** | 为什么是这个状态？ | TT_CMS_CN_COUNTRY PASS · 330/330 LOCK · Exit PASS |',
    '| **③ Script** | 怎么重新生成？ | `node scripts/dev/run-cms-master-registry.cjs` |',
    '',
    '## 统计（5 秒一眼）',
    '',
    '```',
    `CMS Modules:     ${s.cms_modules_total}`,
    `Frozen (P0):     ${s.frozen_p0}`,
    `Pilot (P1):      ${s.pilot_p1}`,
    `Backlog:         ${s.backlog}`,
    `Registry Only:   ${s.registry_only}`,
    `L5 Ready:        ${s.l5_ready}/${s.l5_scope}`,
    '```',
    '',
    `**今日焦点：** ${doc.today_focus.module} → ${doc.today_focus.next}`,
    '',
    '> Frozen = 基线冻结，除非 Bug 不改 · Registry = 登记归属，不走 CMS L5',
    '',
    '## Master Table',
    '',
    '| 模块 | 状态 | Business Critical | L5 | CMS | 下一步 |',
    '|------|------|-------------------|-----|-----|--------|',
    ...doc.modules.map(
      (m) =>
        `| ${m.module} | ${STATUS_LABEL[m.status]} | ${m.business_critical} | ${l5Cell(m)} | ${m.plane} | ${m.next} |`,
    ),
    '',
    '## 状态（仅四种）',
    '',
    '| 状态 | 含义 |',
    '|------|------|',
    '| ✅ Frozen | 已完成并冻结 |',
    '| ⏳ Pilot | 正在验证 |',
    '| 📋 Backlog | 计划中 |',
    '| Registry | 仅登记，不属于 CMS |',
    '',
    '## 四个问题',
    '',
    '1. 有哪些 CMS 模块？ → 上表',
    '2. 哪些已冻结？ → POI · Ambient · Hero',
    '3. 哪些还没做？ → Pilot + Backlog',
    '4. 下一步做什么？ → **Hotel → Discovery Complete · 等待实现决策**（City Hero Pilot Architecture Validated · WP5 暂停）',
    '',
    '**P1 Standard：** FROZEN v1.1.0 · [TT-CMS-P1-CONTENT-FAMILY-STANDARD.md](../../docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md)',
    '',
    'Execution / Runtime / Exit Check / Country Runtime → `evidence/GO_cms_operation/`',
    '',
    '## 重新生成 Registry',
    '',
    '```bash',
    'node scripts/dev/run-cms-master-registry.cjs',
    '```',
    '',
    '## P1 路线图',
    '',
    '```',
    'P1 Standard  →  City Hero (Pilot Arch ✅ · 暂停)  →  Hotel (Discovery ✅)  →  Transport  →  Listings',
    '   ✅                    Pilot                         Pilot · 等待实现        Backlog       Backlog',
    '```',
    '',
    '目标：POI + Ambient + Hero + City Hero + Hotel + Transport + Listings = 第一套完整 CMS 能力体系',
  ].join('\n');
}

function main() {
  const stamp = new Date().toISOString();
  const ten = readJson('CMS-TEN-COUNTRY-FINAL-CLOSURE-REPORT-LATEST.json');
  const stats = computeStats(MODULES);

  const doc = {
    schema: 'traveltrust.cms_master_registry.v2',
    variant: 'solo_founder',
    version: 'V2',
    status: 'ACTIVE',
    baseline: 'Ten Country CMS Content QA',
    owner: 'Solo Founder',
    recorded_at_utc: stamp,
    last_updated: stamp.slice(0, 10),
    TT_CMS_MASTER_REGISTRY: 'ACTIVE',
    governance_layers: {
      registry: { role: '现在是什么状态？', path: 'CMS-MASTER-REGISTRY-LATEST.json' },
      evidence: { role: '为什么是这个状态？', path: 'evidence/GO_cms_operation/' },
      script: { role: '怎么重新生成？', command: 'node scripts/dev/run-cms-master-registry.cjs' },
    },
    columns: ['module', 'status', 'business_critical', 'l5', 'cms', 'next'],
    status_enum: ['Frozen', 'Pilot', 'Backlog', 'Registry'],
    stats,
    today_focus: todayFocus(MODULES),
    p1_standard: {
      status: 'FROZEN',
      version: '1.1.0',
      runbook: 'docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md',
      review: 'CMS-P1-STANDARD-REVIEW-LATEST.json',
      evidence: 'CMS-P1-CONTENT-FAMILY-STANDARD-LATEST.json',
    },
    poi_track_frozen: {
      TT_CMS_TEN_COUNTRY_FINAL_CLOSURE: ten?.TT_CMS_TEN_COUNTRY_FINAL_CLOSURE || 'CLOSED',
      total_poi_locked: ten?.summary?.total_poi_locked || 330,
      production_go: 'BLOCKED',
    },
    modules: MODULES,
  };

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.mkdirSync(path.dirname(REGISTRY_YAML), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatMd(doc) + '\n');

  const yaml = [
    '# TravelTrust CMS Master Registry · Solo Founder v2',
    'schema: traveltrust.cms_master_registry.v2',
    `effective_utc: "${stamp.slice(0, 10)}"`,
    'columns: [module, status, business_critical, l5, cms, next]',
    'modules:',
    ...MODULES.flatMap((m) => [
      `  - id: ${m.id}`,
      `    module: "${m.module}"`,
      `    status: ${m.status}`,
      `    business_critical: "${m.business_critical}"`,
      `    l5_pass: ${m.l5_pass}`,
      `    plane: ${m.plane}`,
      `    next: "${m.next}"`,
    ]),
  ].join('\n');
  fs.writeFileSync(REGISTRY_YAML, yaml + '\n');

  console.log('TT_CMS_MASTER_REGISTRY: ACTIVE (solo v2)');
  console.log(`CMS Modules: ${stats.cms_modules_total} · L5 Ready: ${stats.l5_ready}/${stats.l5_scope}`);
  console.log(`Today: ${doc.today_focus.module} → ${doc.today_focus.next}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
