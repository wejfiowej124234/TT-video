#!/usr/bin/env node
/**
 * CMS Ownership Matrix V1.1 · Ownership + Edit Policy
 *
 * 回答两个问题：
 *   1. 归谁管？（Owner）
 *   2. 改完走什么流程？（Edit Policy）
 *
 * Edit Policy: Direct · Verify · L5 QA · Immutable
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_JSON = path.join(EVIDENCE, 'CMS-OWNERSHIP-MATRIX-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-OWNERSHIP-MATRIX-LATEST.md');
const OUT_YAML = path.join(ROOT, 'registry/cms-ownership-matrix.v1.yaml');

/** @typedef {'Direct'|'Verify'|'L5 QA'|'Immutable'} EditPolicy */

const EDIT_POLICY_LEGEND = {
  Direct: '改完即可 Publish · 无需 L5 全链',
  Verify: '改完必须 Runtime Verify · 无需 Exit Check',
  'L5 QA': '改完必须 Replace → Publish → Verify → Exit Check（+ Country Runtime 如适用）',
  Immutable: 'CMS 不可改 · 走 API / DB / Contract',
};

/**
 * @param {object} r
 * @param {EditPolicy} r.edit_policy
 */
function cell(r) {
  const owner = r.cms
    ? 'CMS'
    : r.contract
      ? 'Contract'
      : r.api
        ? 'API'
        : r.db
          ? 'DB'
          : r.runtime
            ? 'Runtime'
            : '—';
  return {
    page: r.page,
    element: r.element,
    cms: r.cms,
    api: r.api,
    db: r.db,
    contract: r.contract,
    runtime: Boolean(r.runtime),
    category: r.category,
    primary_owner: owner,
    edit_policy: r.edit_policy,
    notes: r.notes || '',
  };
}

const Y = true;
const N = false;
const D = 'Direct';
const V = 'Verify';
const L = 'L5 QA';
const I = 'Immutable';

const ROWS = [
  // Home
  cell({ page: 'Home', element: 'Campaign Hero（OCS 冷启动）', cms: N, api: Y, db: N, contract: N, category: 'api_only', edit_policy: I, notes: 'OCS · 非 CMS' }),
  cell({ page: 'Home', element: 'Destination Hero（十国）', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: L, notes: 'Frozen P0' }),
  cell({ page: 'Home', element: 'Destination Ambient', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: V }),
  cell({ page: 'Home', element: '国家介绍文案', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: D, notes: 'Registry country_city_copy P2 · UI 未接' }),
  cell({ page: 'Home', element: '城市介绍文案', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: D, notes: 'Registry country_city_copy P2 · UI 未接' }),
  cell({ page: 'Home', element: 'Catalog 国家/城市标签', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: D, notes: 'countries/cities admin · 选择器标签' }),
  cell({ page: 'Home', element: '热门国家排序', cms: N, api: Y, db: N, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Home', element: '创新行程预览卡', cms: N, api: Y, db: N, contract: N, runtime: Y, category: 'api_only', edit_policy: I }),
  cell({ page: 'Home', element: 'Featured / 冷启动展示条', cms: N, api: Y, db: N, contract: N, category: 'api_only', edit_policy: I, notes: 'Public Ops' }),
  cell({ page: 'Home', element: 'SEO Metadata', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: D, notes: 'Registry P2 Backlog' }),

  // Travel
  cell({ page: 'Travel', element: '品牌页 Hero / 视觉', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: V }),
  cell({ page: 'Travel', element: '品牌文案 / Web3 叙事', cms: Y, api: N, db: N, contract: N, category: 'cms_api', edit_policy: D, notes: 'locales + API brief' }),
  cell({ page: 'Travel', element: 'Video Poster', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: V }),
  cell({ page: 'Travel', element: 'Announcements 列表', cms: N, api: Y, db: N, contract: N, category: 'api_only', edit_policy: I }),

  // Guide
  cell({ page: 'Guide', element: 'Hero / Background', cms: Y, api: N, db: N, contract: N, category: 'cms_api', edit_policy: L }),
  cell({ page: 'Guide', element: 'POI 配图', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: L }),
  cell({ page: 'Guide', element: 'Guide Name / Bio', cms: N, api: Y, db: Y, contract: N, category: 'cms_api', edit_policy: I }),
  cell({ page: 'Guide', element: 'Rating / Reviews', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Guide', element: 'Followers / Follow', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Guide', element: 'Wallet / Trust Score', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Guide', element: 'Available Time / 订单', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Guide', element: 'Services / 定价', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),

  // Provider
  cell({ page: 'Provider', element: 'Listing Cover 图片', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: L }),
  cell({ page: 'Provider', element: '商家名称 / 描述', cms: N, api: Y, db: Y, contract: N, category: 'cms_api', edit_policy: I }),
  cell({ page: 'Provider', element: 'KYC / 入驻资料', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Provider', element: '商品 / 库存价格', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),

  // Acquisition
  cell({ page: 'Acquisition', element: 'Listing Cover 图片', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: L }),
  cell({ page: 'Acquisition', element: '收购条目文案', cms: N, api: Y, db: Y, contract: N, category: 'cms_api', edit_policy: I }),
  cell({ page: 'Acquisition', element: '交易状态 / 报价', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),

  // Community
  cell({ page: 'Community', element: 'Official Feed Banner', cms: N, api: Y, db: N, contract: N, category: 'api_only', edit_policy: I, notes: 'OCS' }),
  cell({ page: 'Community', element: 'UGC 帖子 / 媒体', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Community', element: '用户 Profile / 头像', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Community', element: 'Explore 目的地块', cms: Y, api: Y, db: N, contract: N, category: 'cms_api', edit_policy: V, notes: 'CMS 块 Verify · API feed Immutable' }),

  // Market
  cell({ page: 'Market', element: 'POI Hero / Food 图片', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: L, notes: '含 Country Runtime' }),
  cell({ page: 'Market', element: 'City Hero', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: L, notes: 'Pilot P1' }),
  cell({ page: 'Market', element: 'Hotel / Transport 库存图', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: L, notes: 'Backlog P1' }),
  cell({ page: 'Market', element: 'Banner / Campaign 视觉', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: D, notes: 'Registry P2' }),
  cell({ page: 'Market', element: 'Pricing · Intercity Routes', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: D, notes: '/admin/content/pricing · intercity-routes' }),
  cell({ page: 'Market', element: '订单卡封面 / Discover', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Market', element: '向导卡头像', cms: N, api: Y, db: N, contract: N, category: 'api_only', edit_policy: I, notes: 'OCS' }),
  cell({ page: 'Market', element: '商品价格 / 库存', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Market', element: 'Market Feed 冷启动', cms: N, api: Y, db: N, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Market', element: '页身 CSS 氛围', cms: N, api: N, db: N, contract: N, runtime: Y, category: 'api_only', edit_policy: I, notes: 'FE frozen' }),

  // Governance
  cell({ page: 'Governance', element: '提案 Banner / 视觉', cms: Y, api: N, db: N, contract: N, category: 'contract_only', edit_policy: D }),
  cell({ page: 'Governance', element: 'Proposal 数据', cms: N, api: N, db: N, contract: Y, category: 'contract_only', edit_policy: I }),
  cell({ page: 'Governance', element: 'Vote / 投票结果', cms: N, api: N, db: N, contract: Y, category: 'contract_only', edit_policy: I }),
  cell({ page: 'Governance', element: 'Stake / Seat / Claim', cms: N, api: N, db: N, contract: Y, category: 'contract_only', edit_policy: I }),
  cell({ page: 'Governance', element: 'Treasury 余额', cms: N, api: N, db: N, contract: Y, category: 'contract_only', edit_policy: I }),

  // Me
  cell({ page: 'Me', element: '用户资料 / 头像', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Me', element: '钱包 / DID', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Me', element: '订单 / Escrow', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Me', element: '关注 / 收藏', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Me', element: '消息 / 聊天', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),

  // Admin
  cell({ page: 'Admin', element: 'CMS Content (/admin/content)', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: L, notes: 'countries · cities · pois · media · publish-queue · …' }),
  cell({ page: 'Admin', element: 'Translation · SEO Admin', cms: Y, api: N, db: N, contract: N, category: 'cms_only', edit_policy: D, notes: 'translation · seo · Registry Backlog P2' }),
  cell({ page: 'Admin', element: 'OCS Public Ops', cms: N, api: Y, db: N, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Admin', element: 'Community 审核', cms: N, api: Y, db: Y, contract: N, category: 'api_only', edit_policy: I }),
  cell({ page: 'Admin', element: 'Governance 运维', cms: N, api: Y, db: N, contract: Y, category: 'contract_only', edit_policy: I }),
];

const CATEGORIES = {
  cms_only: { label: '第一类 · 100% CMS', rule: '运营通过 CMS 改 · 看 Edit Policy' },
  cms_api: { label: '第二类 · CMS + API 混合', rule: '只改 CMS 行 · API 行 Immutable' },
  api_only: { label: '第三类 · 100% API / DB', rule: 'Edit Policy = Immutable' },
  contract_only: { label: '第四类 · 合约（CMS 仅 Banner）', rule: 'Banner=Direct · 链上=Immutable' },
};

function formatMd(doc) {
  const lines = [
    '# TravelTrust CMS Ownership Matrix',
    '',
    '| | |',
    '|---|---|',
    '| **Version** | V1.1 |',
    '| **Status** | FROZEN |',
    '| **Baseline** | Ten Country CMS Content QA |',
    `| **Last Updated** | ${doc.last_updated} |`,
    '| **Owner** | Solo Founder |',
    '',
    '> **Ownership + Edit Policy** · 不仅知道归谁管，还知道改完走什么流程',
    '',
    '## Edit Policy（四种）',
    '',
    '| Policy | 含义 |',
    '|--------|------|',
    ...Object.entries(EDIT_POLICY_LEGEND).map(([k, v]) => `| **${k}** | ${v} |`),
    '',
    '## 决策流程',
    '',
    '```',
    '收到需求',
    '    ↓',
    '查 Ownership Matrix',
    '    ↓',
    '确认 Owner（CMS / API / Contract）',
    '    ↓',
    '确认 Edit Policy（Direct / Verify / L5 QA / Immutable）',
    '    ↓',
    '决定走 CMS / API / Contract 流程',
    '```',
    '',
    '## Master Matrix',
    '',
    '| 页面 | 元素 | Owner | Edit Policy | CMS | API | DB | Contract |',
    '|------|------|-------|-------------|-----|-----|-----|----------|',
    ...doc.rows.map(
      (r) =>
        `| ${r.page} | ${r.element} | ${r.primary_owner} | **${r.edit_policy}** | ${r.cms ? '✅' : '❌'} | ${r.api ? '✅' : '❌'} | ${r.db ? '✅' : '❌'} | ${r.contract ? '✅' : '❌'} |`,
    ),
    '',
    '## 示例',
    '',
    '| 场景 | Owner | Edit Policy | 意思 |',
    '|------|-------|-------------|------|',
    '| POI Hero 改图 | CMS | L5 QA | 必须 Replace→Publish→Verify→Exit Check |',
    '| Ambient 改图 | CMS | Verify | Runtime Verify 即可 |',
    '| Banner 上线 | CMS | Direct | 直接 Publish |',
    '| 钱包余额 | API | Immutable | CMS 无权限 |',
    '| 投票结果 | Contract | Immutable | 链上不可改 |',
    '',
    '## 按 Edit Policy 分组',
    '',
  ];

  for (const policy of ['L5 QA', 'Verify', 'Direct', 'Immutable']) {
    const items = doc.rows.filter((r) => r.edit_policy === policy);
    lines.push(`### ${policy}（${items.length}）`, '');
    for (const r of items.slice(0, 8)) {
      lines.push(`- ${r.page} · ${r.element}`);
    }
    if (items.length > 8) lines.push(`- … +${items.length - 8} more`);
    lines.push('');
  }

  lines.push(
    '## 治理配套',
    '',
    '| 文档 | 回答 |',
    '|------|------|',
    '| Registry | 模块什么状态？ |',
    '| **Matrix** | 归谁管 + 怎么改？ |',
    '| Evidence | 为什么？ |',
    '| Script | `node scripts/dev/run-cms-ownership-matrix.cjs` |',
  );

  return lines.join('\n');
}

function main() {
  const stamp = new Date().toISOString();
  const pages = [...new Set(ROWS.map((r) => r.page))];

  const doc = {
    schema: 'traveltrust.cms_ownership_matrix.v1.1',
    version: 'V1.1',
    status: 'FROZEN',
    baseline: 'Ten Country CMS Content QA',
    baseline_review: 'CMS-BASELINE-REVIEW-LATEST.json',
    frozen_at_utc: stamp,
    owner: 'Solo Founder',
    recorded_at_utc: stamp,
    last_updated: stamp.slice(0, 10),
    TT_CMS_OWNERSHIP_MATRIX: 'FROZEN',
    governance_order: ['Registry', 'Ownership Matrix', 'Evidence', 'Script', 'Development'],
    columns: ['page', 'element', 'owner', 'edit_policy', 'cms', 'api', 'db', 'contract'],
    edit_policy_enum: ['Direct', 'Verify', 'L5 QA', 'Immutable'],
    edit_policy_legend: EDIT_POLICY_LEGEND,
    categories: CATEGORIES,
    stats: {
      pages: pages.length,
      elements: ROWS.length,
      by_edit_policy: {
        Direct: ROWS.filter((r) => r.edit_policy === D).length,
        Verify: ROWS.filter((r) => r.edit_policy === V).length,
        'L5 QA': ROWS.filter((r) => r.edit_policy === L).length,
        Immutable: ROWS.filter((r) => r.edit_policy === I).length,
      },
    },
    rows: ROWS,
  };

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_YAML), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatMd(doc) + '\n');
  fs.writeFileSync(
    OUT_YAML,
    [
      '# TravelTrust CMS Ownership Matrix V1.1 · FROZEN',
      'schema: traveltrust.cms_ownership_matrix.v1.1',
      'status: FROZEN',
      `frozen_at_utc: "${stamp.slice(0, 10)}"`,
      'baseline_review: CMS-BASELINE-REVIEW-LATEST.json',
      'columns: [page, element, owner, edit_policy, cms, api, db, contract]',
      'edit_policy: [Direct, Verify, "L5 QA", Immutable]',
      'governance_order: [Registry, Ownership Matrix, Evidence, Script, Development]',
    ].join('\n') + '\n',
  );

  console.log('TT_CMS_OWNERSHIP_MATRIX: FROZEN (v1.1 + Edit Policy + Baseline Review)');
  console.log(`L5 QA: ${doc.stats.by_edit_policy['L5 QA']} · Verify: ${doc.stats.by_edit_policy.Verify} · Direct: ${doc.stats.by_edit_policy.Direct} · Immutable: ${doc.stats.by_edit_policy.Immutable}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
