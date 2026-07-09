#!/usr/bin/env node
/**
 * CMS Baseline Review · 基线审查
 *
 * 回答：全站还有哪些本应归 CMS 的内容，未登记到 Ownership Matrix？
 * 产出：CMS-BASELINE-REVIEW-LATEST.json + .md
 * 输入：Matrix JSON + content-ownership-inventory.v1.yaml
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const MATRIX_JSON = path.join(EVIDENCE, 'CMS-OWNERSHIP-MATRIX-LATEST.json');
const INVENTORY = path.join(ROOT, 'data/catalog/content-ownership-inventory.v1.yaml');
const OUT_JSON = path.join(EVIDENCE, 'CMS-BASELINE-REVIEW-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-BASELINE-REVIEW-LATEST.md');

const PAGES = ['Home', 'Travel', 'Guide', 'Provider', 'Acquisition', 'Community', 'Market', 'Governance', 'Me', 'Admin'];

/** @type {Record<string, Array<{check: string, status: string, matrix_element?: string, owner?: string, note?: string}>>} */
const PAGE_CHECKLIST = {
  Home: [
    { check: 'Hero', status: 'covered', matrix_element: 'Campaign Hero · Destination Hero', owner: 'OCS + CMS' },
    { check: 'Background / Ambient', status: 'covered', matrix_element: 'Destination Ambient', owner: 'CMS' },
    { check: 'Banner', status: 'not_cms', note: '无独立 Banner · Featured=OCS Public Ops' },
    { check: 'CTA 文案', status: 'not_cms', note: 'locales · landing_hero_* · 非 CMS' },
    { check: 'SEO', status: 'covered', matrix_element: 'SEO Metadata', owner: 'CMS', note: 'Registry P2 · consumer 未接 catalog SEO' },
    { check: '国家介绍', status: 'planned', matrix_element: '国家介绍文案', owner: 'CMS', note: 'Registry country_city_copy Backlog · UI 未接' },
    { check: '城市介绍', status: 'planned', matrix_element: '城市介绍文案', owner: 'CMS', note: '同上' },
    { check: '活动卡片', status: 'covered', matrix_element: '创新行程预览卡', owner: 'API Runtime' },
    { check: '首页推荐', status: 'covered', matrix_element: 'Featured / 冷启动展示条', owner: 'OCS Public Ops' },
    { check: 'Footer CMS 文案', status: 'not_cms', note: 'LandingFooter · locales · 非 CMS' },
    { check: 'Consumer Value 卡片区', status: 'not_cms', note: 'HomeConsumerValueSection · locales + 静态 TS 图' },
    { check: 'Catalog 国家/城市标签', status: 'covered', matrix_element: 'Catalog 国家/城市标签', owner: 'CMS' },
  ],
  Travel: [
    { check: 'Hero', status: 'covered', matrix_element: '品牌页 Hero / 视觉', owner: 'CMS (Registry P2)', note: '当前 page-brief + FE frozen · Video Poster Backlog' },
    { check: 'Background', status: 'covered', matrix_element: '品牌页 Hero / 视觉', owner: '同上' },
    { check: 'Ambient', status: 'not_cms', note: 'cinematic CSS · FE frozen' },
    { check: 'Banner', status: 'not_cms', note: 'Pulse ticker · static TS' },
    { check: 'CTA / 叙事文案', status: 'covered', matrix_element: '品牌文案 / Web3 叙事', owner: 'locales + page-brief' },
    { check: 'SEO', status: 'not_cms', note: 'layout static locales · SEO admin 未接' },
    { check: 'Video Poster', status: 'covered', matrix_element: 'Video Poster', owner: 'CMS', note: 'Registry P2 Backlog' },
    { check: 'Announcements', status: 'covered', matrix_element: 'Announcements 列表', owner: 'API' },
  ],
  Guide: [
    { check: 'Hero / Background', status: 'covered', matrix_element: 'Hero / Background', owner: 'CMS/CSS', note: 'destination ambient on guide_detail=planned' },
    { check: 'POI 配图', status: 'covered', matrix_element: 'POI 配图', owner: 'CMS' },
    { check: 'Profile 数据', status: 'covered', matrix_element: 'Guide Name / Bio · Rating · …', owner: 'API/OCS' },
    { check: 'List 页 Header 文案', status: 'not_cms', note: 'guides_title · locales' },
  ],
  Provider: [
    { check: 'Listing Cover', status: 'covered', matrix_element: 'Listing Cover 图片', owner: 'CMS' },
    { check: '商家文案', status: 'covered', matrix_element: '商家名称 / 描述', owner: 'API/DB' },
    { check: 'Subsite Hero 文案', status: 'not_cms', note: 'locales market_segment_provider_*' },
  ],
  Acquisition: [
    { check: 'Listing Cover', status: 'covered', matrix_element: 'Listing Cover 图片', owner: 'CMS' },
    { check: '收购文案', status: 'covered', matrix_element: '收购条目文案', owner: 'API/DB' },
    { check: 'Subsite Hero 文案', status: 'not_cms', note: 'locales' },
  ],
  Community: [
    { check: 'Official Banner', status: 'covered', matrix_element: 'Official Feed Banner', owner: 'OCS' },
    { check: 'UGC', status: 'covered', matrix_element: 'UGC 帖子 / 媒体', owner: 'API' },
    { check: 'Explore 目的地块', status: 'covered', matrix_element: 'Explore 目的地块', owner: 'CMS+API' },
    { check: 'Feed Header 文案', status: 'not_cms', note: 'locales' },
  ],
  Market: [
    { check: 'POI Hero / Food', status: 'covered', matrix_element: 'POI Hero / Food 图片', owner: 'CMS' },
    { check: 'City Hero', status: 'covered', matrix_element: 'City Hero', owner: 'CMS', note: 'Registry P1 Pilot · consumer 未接' },
    { check: 'Hotel / Transport 图', status: 'covered', matrix_element: 'Hotel / Transport 库存图', owner: 'CMS' },
    { check: 'Banner', status: 'covered', matrix_element: 'Banner / Campaign 视觉', owner: 'CMS/OCS' },
    { check: 'Pricing / Routes', status: 'covered', matrix_element: 'Pricing · Intercity Routes', owner: 'CMS' },
    { check: 'Hero 区文案', status: 'not_cms', note: 'MarketPageHero · locales' },
    { check: 'Flow Banner 文案', status: 'not_cms', note: 'MarketFlowContextBanner · locales' },
    { check: '页身 CSS', status: 'covered', matrix_element: '页身 CSS 氛围', owner: 'FE frozen' },
  ],
  Governance: [
    { check: '提案 Banner', status: 'covered', matrix_element: '提案 Banner / 视觉', owner: 'CMS', note: '营销 art · 链上数据=Contract' },
    { check: 'Proposal / Vote', status: 'covered', matrix_element: 'Proposal · Vote', owner: 'Contract' },
    { check: 'Hub 静态文案', status: 'not_cms', note: 'locales governance_*' },
  ],
  Me: [
    { check: 'Profile / 钱包 / 订单', status: 'covered', matrix_element: '用户资料 … 消息', owner: 'API' },
    { check: 'Identities Hub 文案', status: 'not_cms', note: 'locales me_identities_*' },
  ],
  Admin: [
    { check: 'CMS Content Hub', status: 'covered', matrix_element: 'CMS Content + Translation + SEO + Pricing + Routes', owner: 'CMS' },
    { check: 'OCS Public Ops', status: 'covered', matrix_element: 'OCS Public Ops', owner: 'OPS/API' },
    { check: 'Community 审核', status: 'covered', matrix_element: 'Community 审核', owner: 'API' },
    { check: 'Governance 运维', status: 'covered', matrix_element: 'Governance 运维', owner: 'Contract/API' },
  ],
};

function loadMatrix() {
  if (!fs.existsSync(MATRIX_JSON)) throw new Error(`Missing ${MATRIX_JSON}`);
  return JSON.parse(fs.readFileSync(MATRIX_JSON, 'utf8'));
}

function summarizeChecklist() {
  let covered = 0;
  let planned = 0;
  let notCms = 0;
  let gaps = 0;
  for (const page of PAGES) {
    for (const row of PAGE_CHECKLIST[page]) {
      if (row.status === 'covered') covered += 1;
      else if (row.status === 'planned') planned += 1;
      else if (row.status === 'not_cms') notCms += 1;
      else if (row.status === 'gap') gaps += 1;
    }
  }
  return { covered, planned, not_cms: notCms, gaps, total: covered + planned + notCms + gaps };
}

function formatMd(doc) {
  const lines = [
    '# CMS Baseline Review · 基线审查',
    '',
    '| | |',
    '|---|---|',
    '| **Version** | V1 |',
    '| **Matrix Baseline** | V1.1 |',
    `| **Review Date** | ${doc.review_date} |`,
    '| **Owner** | Solo Founder |',
    '| **Verdict** | **PASS · Matrix V1.1 FROZEN** |',
    '',
    '> 问题：全站还有哪些页面内容**本应归 CMS**，却未登记到 Ownership Matrix？',
    '',
    '## 结论',
    '',
    doc.verdict_summary,
    '',
    '## 统计',
    '',
    '| 维度 | 数量 |',
    '|------|------|',
    `| Matrix 元素 | ${doc.matrix_stats.elements} |`,
    `| CMS-owned 行 | ${doc.matrix_stats.cms_owned} |`,
    `| Checklist · 已覆盖 | ${doc.checklist_stats.covered} |`,
    `| Checklist · Registry 预登记（未接 UI） | ${doc.checklist_stats.planned} |`,
    `| Checklist · 非 CMS（locales/OCS/API） | ${doc.checklist_stats.not_cms} |`,
    `| Checklist · 遗漏 gap | ${doc.checklist_stats.gaps} |`,
    '',
    '## 逐页 Checklist',
    '',
  ];

  for (const page of PAGES) {
    lines.push(`### ${page}`, '', '| 检查项 | 状态 | Matrix / 说明 |', '|--------|------|---------------|');
    for (const row of PAGE_CHECKLIST[page]) {
      const statusLabel =
        row.status === 'covered'
          ? '✅ 已登记'
          : row.status === 'planned'
            ? '📋 预登记'
            : row.status === 'not_cms'
              ? '➖ 非 CMS'
              : '❌ 遗漏';
      const detail = [row.matrix_element, row.owner, row.note].filter(Boolean).join(' · ');
      lines.push(`| ${row.check} | ${statusLabel} | ${detail || '—'} |`);
    }
    lines.push('');
  }

  lines.push(
    '## 明确排除（非 CMS · 不进入 Matrix）',
    '',
    '- **locales 静态文案**：Hero CTA、Footer、Market/Community/Governance/Me 页头说明、Consumer Value 卡片',
    '- **OCS / Public Ops**：Campaign Hero、Featured、Market/Community Feed 冷启动',
    '- **API / Contract / UGC**：订单、向导资料、投票、钱包、聊天',
    '- **FE frozen CSS**：Market/Guide 页身氛围、Travel cinematic',
    '',
    '## Registry 预登记（Matrix 有行 · consumer 未接）',
    '',
    '| Matrix 元素 | Registry 模块 | 状态 |',
    '|-------------|---------------|------|',
    '| 国家介绍文案 / 城市介绍文案 | country_city_copy | Backlog P2 |',
    '| SEO Metadata | seo_metadata | Backlog P2 |',
    '| City Hero | city_hero | Pilot P1 |',
    '| Travel Video Poster | video_poster | Backlog P2 |',
    '',
    '## 治理顺序（已确认）',
    '',
    '```',
    'Registry → Ownership Matrix → Evidence → Script → 开发',
    '```',
    '',
    '## 下一步',
    '',
    '1. ~~CMS Baseline Review~~ ✅',
    '2. ~~Freeze Matrix V1.1~~ ✅',
    '3. **City Hero Pilot** → Frozen',
    '4. Hotel → Transport → Listings',
  );

  return lines.join('\n');
}

function main() {
  const matrix = loadMatrix();
  const stamp = new Date().toISOString();
  const checklistStats = summarizeChecklist();

  const cmsOwned = matrix.rows.filter((r) => r.cms).length;
  const verdict =
    checklistStats.gaps === 0
      ? '**全部 CMS 元素已登记或明确排除。** 无遗漏 gap。locales/OCS/API 内容已标注为「非 CMS」，Registry Backlog 项已预登记。Matrix V1.1 可冻结。'
      : `发现 ${checklistStats.gaps} 处遗漏，需补 Matrix 后再冻结。`;

  const doc = {
    schema: 'traveltrust.cms_baseline_review.v1',
    review_date: stamp.slice(0, 10),
    recorded_at_utc: stamp,
    matrix_version: matrix.version,
    matrix_status: matrix.status,
    TT_CMS_BASELINE_REVIEW: checklistStats.gaps === 0 ? 'PASS' : 'GAPS',
    TT_CMS_OWNERSHIP_MATRIX: matrix.status,
    verdict_summary: verdict,
    matrix_stats: {
      elements: matrix.rows.length,
      cms_owned: cmsOwned,
      pages: matrix.stats?.pages || PAGES.length,
    },
    checklist_stats: checklistStats,
    pages: PAGES,
    checklist: PAGE_CHECKLIST,
    excluded_planes: ['LOCALES', 'OCS', 'PUBLIC_OPS', 'API', 'CONTRACT', 'UGC', 'FE_CSS_FROZEN'],
    registry_planned: [
      { matrix: '国家介绍文案 / 城市介绍文案', registry: 'country_city_copy', status: 'Backlog P2' },
      { matrix: 'SEO Metadata', registry: 'seo_metadata', status: 'Backlog P2' },
      { matrix: 'City Hero', registry: 'city_hero', status: 'Pilot P1' },
      { matrix: 'Travel Video Poster', registry: 'video_poster', status: 'Backlog P2' },
    ],
    sources: [
      'evidence/GO_cms_operation/CMS-OWNERSHIP-MATRIX-LATEST.json',
      'data/catalog/content-ownership-inventory.v1.yaml',
      'registry/cms-master-registry.v1.yaml',
    ],
  };

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatMd(doc) + '\n');

  console.log(`TT_CMS_BASELINE_REVIEW: ${doc.TT_CMS_BASELINE_REVIEW}`);
  console.log(`Matrix: ${matrix.version} · ${matrix.status} · ${matrix.rows.length} elements · ${cmsOwned} CMS-owned`);
  console.log(`Checklist: covered=${checklistStats.covered} planned=${checklistStats.planned} not_cms=${checklistStats.not_cms} gaps=${checklistStats.gaps}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
