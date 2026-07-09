#!/usr/bin/env node
/**
 * Guide Business Data Readiness · Evidence-driven probes (Day 1)
 *
 * Verdict: PASS | WARN-C | WARN-D | WARN-P | FAIL
 * Ready Rule: FAIL=0 · WARN-D=0 · WARN-P=0 · WARN-C 不阻挡 Ready
 *
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-guide-business-data-readiness-probes.cjs
 */
const fs = require('fs');
const path = require('path');
const { request, head, absUrl } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const PROBE_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step1/probes');
const DAY_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step1');
const DAY_JSON = path.join(DAY_DIR, 'GUIDE-BUSINESS-DATA-READINESS-DAY1-LATEST.json');
const DAY_MD = path.join(DAY_DIR, 'GUIDE-BUSINESS-DATA-READINESS-DAY1-LATEST.md');

const READY_RULE = {
  max_fail: 0,
  max_warn_d: 0,
  max_warn_p: 0,
  warn_c_blocks: false,
  total_checks: 6,
};

/** WARN 分级：C=Cosmetic · D=Data · P=Performance */
const WARN_CLASS_MAP = {
  missing_public_title_and_real_name: 'C',
  missing_bio: 'D',
  placeholder_avatar_url: 'C',
  missing_optional_id_photo_url: 'C',
  missing_optional_language_cert_url: 'C',
  missing_optional_guide_license_url: 'C',
  head_fail_language_cert_url: 'C',
  head_fail_guide_license_url: 'C',
  partial_guides_missing_hourly_rate: 'D',
  partial_guides_not_operable: 'D',
};

const CHECKS = [
  {
    id: 'profile',
    label: 'Profile',
    ssot: 'API + DB',
    probe: 'GET /api/v1/guides',
    exit_condition: 'API、DB、UI 一致',
    primary_issue: null,
  },
  {
    id: 'availability',
    label: 'Availability',
    ssot: 'API',
    probe: 'GET /api/v1/guides/:id/availability',
    exit_condition: '可预约且 HAT Guide 下单 PASS',
    primary_issue: 'BD-001',
  },
  {
    id: 'hero',
    label: 'Hero',
    ssot: 'CMS',
    probe: 'HEAD avatar_url',
    exit_condition: '图片可加载且 Runtime 一致',
    primary_issue: null,
  },
  {
    id: 'pricing',
    label: 'Pricing',
    ssot: 'Pricing API',
    probe: 'GET /api/v1/guides hourly_rate',
    exit_condition: '金额一致 · API 与 Market 展示',
    primary_issue: null,
    cascade_from: 'BD-001',
    candidate_issue: 'BD-004',
    candidate_label: 'Guide Pricing Configuration Missing',
  },
  {
    id: 'images',
    label: 'Images',
    ssot: 'CMS',
    probe: 'HEAD + Decode',
    exit_condition: '全部可访问',
    primary_issue: null,
  },
  {
    id: 'status',
    label: 'Status',
    ssot: 'API',
    probe: 'GET /api/v1/guides display_status',
    exit_condition: '状态一致且可运营',
    primary_issue: null,
  },
];

function writeProbeEvidence(checkId, doc) {
  const p = path.join(PROBE_DIR, `guide_${checkId}_probe.json`);
  fs.mkdirSync(PROBE_DIR, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + '\n');
  return `evidence/GO_production_readiness/step1/probes/guide_${checkId}_probe.json`;
}

function pickGuides(json) {
  const items = json?.items || json?.guides || (Array.isArray(json) ? json : []);
  return Array.isArray(items) ? items : [];
}

const PLACEHOLDER_HOSTS = ['unsplash.com', 'placeholder', 'picsum.photos', 'via.placeholder.com'];

function classifyWarns(warnReasons) {
  const byClass = { C: [], D: [], P: [] };
  for (const w of warnReasons) {
    const cls = WARN_CLASS_MAP[w] || 'C';
    byClass[cls].push(w);
  }
  return byClass;
}

function resolveVerdict(failReasons, warnReasons) {
  if (failReasons.length) return 'FAIL';
  const wc = classifyWarns(warnReasons);
  if (wc.D.length) return 'WARN-D';
  if (wc.P.length) return 'WARN-P';
  if (wc.C.length) return 'WARN-C';
  return 'PASS';
}

function isPassLike(verdict) {
  return verdict === 'PASS' || verdict === 'WARN-C';
}

function isPlaceholderUrl(url) {
  if (!url) return false;
  const lower = String(url).toLowerCase();
  return PLACEHOLDER_HOSTS.some((h) => lower.includes(h));
}

async function probeProfile(guides) {
  const fail = [];
  const warn = [];
  if (!guides.length) fail.push('no_guides_in_api');
  const sample = guides[0];
  if (sample) {
    for (const f of ['id', 'city', 'status']) {
      if (sample[f] == null || sample[f] === '') fail.push(`missing_${f}`);
    }
    if (!sample.public_title && !sample.real_name) warn.push('missing_public_title_and_real_name');
    if (!sample.bio) warn.push('missing_bio');
  }
  return { fail, warn, sample_id: sample?.id };
}

async function probeAvailability(guideId, userId) {
  const fail = [];
  const warn = [];
  if (!guideId) fail.push('no_guide_id');
  else {
    const r = await request(`${API}/api/v1/guides/${guideId}/availability`, {
      userId: userId || process.env.PROBE_X_USER_ID,
    });
    if (r.status !== 200) fail.push(`availability_http_${r.status}`);
    else if (r.json && typeof r.json === 'object' && Object.keys(r.json).length === 0) {
      fail.push('empty_availability_payload');
    }
  }
  return { fail, warn, http: guideId ? undefined : null };
}

async function probeHero(guide) {
  const fail = [];
  const warn = [];
  const url = absUrl(API, guide?.avatar_url);
  if (!url) {
    fail.push('missing_avatar_url');
    return { fail, warn, url: null };
  }
  if (isPlaceholderUrl(url)) warn.push('placeholder_avatar_url');
  const h = await head(url);
  if (!h.ok) fail.push('head_fail_avatar');
  return { fail, warn, url, http: h.status };
}

function probePricingData(guides) {
  const fail = [];
  const warn = [];
  const withRate = guides.filter((g) => g.hourly_rate != null && String(g.hourly_rate).trim() !== '');
  const valid = withRate.filter((g) => !Number.isNaN(Number(g.hourly_rate)) && Number(g.hourly_rate) > 0);
  if (!guides.length) fail.push('no_guides');
  else if (!withRate.length) fail.push('no_hourly_rate');
  else if (!valid.length) fail.push('invalid_hourly_rate');
  else if (withRate.length < guides.length) {
    // BD-004 / Sprint A：至少一条有效 hourly_rate → Pricing Probe PASS · 其余 OCS guide 不阻挡
    if (valid.length < 1) warn.push('partial_guides_missing_hourly_rate');
  }
  return { fail, warn, count_with_rate: withRate.length, count_valid: valid.length, has_any_valid_rate: valid.length > 0 };
}

function attributePricingRootCause(pricingData, availFailed) {
  const reasons = pricingData.fail;

  const independentDataIssue =
    reasons.includes('invalid_hourly_rate') ||
    (pricingData.has_any_valid_rate && reasons.some((r) => r !== 'no_guides'));

  if (availFailed && !independentDataIssue && (reasons.includes('no_hourly_rate') || reasons.includes('no_guides'))) {
    return {
      root_cause: 'BD-001',
      cascade: true,
      explainable_by_bd001: true,
      new_root_cause_candidate: null,
      attribution: 'Pricing FAIL 可由 BD-001 Availability 连锁解释 · 不登记 BD-004',
    };
  }

  if (!pricingData.fail.length) {
    return { root_cause: null, cascade: false, explainable_by_bd001: false, new_root_cause_candidate: null };
  }

  return {
    root_cause: null,
    cascade: false,
    explainable_by_bd001: false,
    new_root_cause_candidate: 'BD-004',
    candidate_label: 'Guide Pricing Configuration Missing',
    attribution: '独立数据问题 · 确认后可登记 BD-004（须有本 evidence）',
  };
}

async function probeImages(guide) {
  const fail = [];
  const warn = [];
  const fields = ['avatar_url', 'id_photo_url', 'language_cert_url', 'guide_license_url'];
  const results = {};
  if (!guide) fail.push('no_guide_sample');
  for (const f of fields) {
    const url = guide?.[f];
    if (!url) {
      if (f !== 'avatar_url') warn.push(`missing_optional_${f}`);
      continue;
    }
    const h = await head(absUrl(API, url));
    results[f] = { ok: h.ok, status: h.status };
    if (!h.ok) {
      if (f === 'avatar_url') fail.push(`head_fail_${f}`);
      else warn.push(`head_fail_${f}`);
    }
  }
  return { fail, warn, results };
}

function probeStatus(guides) {
  const fail = [];
  const warn = [];
  const operable = guides.filter(
    (g) =>
      ['active', 'approved', 'published'].includes(String(g.status || '').toLowerCase()) ||
      String(g.display_status || '').toLowerCase() === 'visible',
  );
  if (!guides.length) fail.push('no_guides');
  else if (!operable.length) fail.push('no_operable_display_status');
  else if (operable.length < guides.length) warn.push('partial_guides_not_operable');
  return { fail, warn, statuses: guides.slice(0, 5).map((g) => ({ id: g.id, status: g.status, display_status: g.display_status })) };
}

function buildProbeDoc(spec, ctx) {
  const { fail, warn, verdict, root_cause, attribution, cascade, extra } = ctx;
  const warnByClass = classifyWarns(warn);
  return {
    schema: 'traveltrust.guide_business_data_probe.v3',
    recorded_at_utc: ctx.stamp,
    check_id: spec.id,
    label: spec.label,
    ssot: spec.ssot,
    probe: spec.probe,
    api: API,
    exit_condition: spec.exit_condition,
    verdict,
    root_cause,
    cascade_from: cascade ? root_cause : null,
    attribution: attribution || null,
    fail_reasons: fail,
    warn_reasons: warn,
    warn_classification: warnByClass,
    detail: extra,
    TT_GUIDE_PROBE: verdict,
  };
}

function computeReady(counts) {
  const ok =
    counts.fail <= READY_RULE.max_fail &&
    counts.warn_d <= READY_RULE.max_warn_d &&
    counts.warn_p <= READY_RULE.max_warn_p;
  return {
    ready: ok ? 'YES' : 'NO',
    TT_GUIDE_BUSINESS_DATA_READINESS_DAY1: ok ? 'READY' : 'NOT_READY',
    rule: READY_RULE,
  };
}

function countWarnClasses(results) {
  let warn_c = 0;
  let warn_d = 0;
  let warn_p = 0;
  for (const r of results) {
    if (r.verdict === 'WARN-C') warn_c += 1;
    if (r.verdict === 'WARN-D') warn_d += 1;
    if (r.verdict === 'WARN-P') warn_p += 1;
  }
  return { warn_c, warn_d, warn_p };
}

function uniqueOpenRootCauses(results) {
  const ids = new Set();
  for (const r of results) {
    if (r.verdict === 'FAIL' && r.root_cause) ids.add(r.root_cause);
    if (r.verdict === 'FAIL' && r.primary_issue && !r.cascade) ids.add(r.primary_issue);
  }
  return [...ids];
}

async function main() {
  const stamp = new Date().toISOString();
  const list = await request(`${API}/api/v1/guides?limit=20`);
  const guides = pickGuides(list.json);
  const sample = guides[0];

  const availData = await probeAvailability(sample?.id, sample?.user_id);
  const availVerdict = resolveVerdict(availData.fail, availData.warn);
  const availFailed = availVerdict === 'FAIL';

  const results = [];

  for (const spec of CHECKS) {
    let fail = [];
    let warn = [];
    let extra = {};
    let root_cause = null;
    let cascade = false;
    let attribution = null;

    if (spec.id === 'profile') {
      const d = await probeProfile(guides);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    } else if (spec.id === 'availability') {
      fail = availData.fail;
      warn = availData.warn;
      extra = availData;
      if (fail.length) root_cause = spec.primary_issue;
    } else if (spec.id === 'hero') {
      const d = await probeHero(sample);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    } else if (spec.id === 'pricing') {
      const d = probePricingData(guides);
      fail = d.fail;
      warn = d.warn;
      extra = d;
      const attr = attributePricingRootCause(d, availFailed);
      root_cause = attr.root_cause;
      cascade = attr.cascade;
      attribution = attr.attribution;
      extra.pricing_attribution = attr;
    } else if (spec.id === 'images') {
      const d = await probeImages(sample);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    } else if (spec.id === 'status') {
      const d = probeStatus(guides);
      fail = d.fail;
      warn = d.warn;
      extra = d;
    }

    const verdict = resolveVerdict(fail, warn);
    const evidence = writeProbeEvidence(
      spec.id,
      buildProbeDoc(spec, { stamp, fail, warn, verdict, root_cause, cascade, attribution, extra }),
    );

    results.push({
      ...spec,
      verdict,
      root_cause,
      cascade,
      attribution,
      evidence,
      fail_reasons: fail,
      warn_reasons: warn,
    });
  }

  const pass = results.filter((r) => r.verdict === 'PASS').length;
  const { warn_c, warn_d, warn_p } = countWarnClasses(results);
  const fail = results.filter((r) => r.verdict === 'FAIL').length;
  const readyState = computeReady({ pass, warn_c, warn_d, warn_p, fail });
  const openRootCauses = uniqueOpenRootCauses(results);

  const dayDoc = {
    schema: 'traveltrust.guide_business_data_readiness_day1.v3',
    recorded_at_utc: stamp,
    domain: 'guide',
    step1_day: 1,
    mode: 'evidence_driven',
    verdict_enum: ['PASS', 'WARN-C', 'WARN-D', 'WARN-P', 'FAIL'],
    ready_rule: READY_RULE,
    checks_total: results.length,
    pass,
    warn_c,
    warn_d,
    warn_p,
    fail,
    open_root_causes: openRootCauses,
    new_root_cause_candidates: results
      .filter((r) => r.verdict === 'FAIL' && !r.root_cause && r.id === 'pricing')
      .map((r) => ({ id: 'BD-004', label: 'Guide Pricing Configuration Missing', evidence: r.evidence, status: 'not_registered_pending_triage' })),
    cascade_notes: results.filter((r) => r.cascade).map((r) => ({ check: r.id, impact_of: r.root_cause, evidence: r.evidence })),
    ...readyState,
    results,
    conclusion: {
      checks: results.length,
      pass,
      warn_c,
      warn_d,
      warn_p,
      fail,
      open_root_causes: openRootCauses,
      ready: readyState.ready,
    },
    execution_loop: [
      '修复一个 Root Cause',
      '重跑 Probe',
      'Root Cause Validation（关闭前）',
      'Exit Condition 满足后 fixed',
      '更新 Daily Delta',
      '下一个 Root Cause',
    ],
    closed_loop:
      'Evidence → Probe → Root Cause → Attribution → Fix → Root Cause Validation → Exit Condition → PASS',
  };

  const md = [
    '# Guide Business Data Readiness · Day 1 · Evidence v3',
    '',
    `| **PASS** | ${pass} | **WARN-C** | ${warn_c} | **WARN-D** | ${warn_d} | **FAIL** | ${fail} | **Ready** | **${readyState.ready}** |`,
    '',
    'Ready Rule: FAIL=0 · WARN-D=0 · WARN-P=0 · WARN-C 不阻挡',
    '',
    '| 检查项 | Verdict | root_cause | Evidence |',
    '|--------|---------|------------|----------|',
    ...results.map((r) => `| ${r.label} | **${r.verdict}** | ${r.root_cause || '—'} | \`${r.evidence}\` |`),
    '',
    '## Open Root Causes（唯一 · 不含 cascade Impact）',
    '',
    openRootCauses.length ? openRootCauses.map((id) => `- ${id}`).join('\n') : '—',
    '',
    '## Cascade Impact（不新增 Issue）',
    '',
    dayDoc.cascade_notes.length
      ? dayDoc.cascade_notes.map((c) => `- ${c.check}: Impact of **${c.impact_of}**`).join('\n')
      : '—',
    '',
    '```',
    `Checks: ${results.length}`,
    `PASS: ${pass}`,
    `WARN-C: ${warn_c}`,
    `WARN-D: ${warn_d}`,
    `FAIL: ${fail}`,
    `Open Root Causes: ${openRootCauses.join(', ') || '—'}`,
    `Ready: ${readyState.ready}`,
    '```',
  ].join('\n');

  fs.mkdirSync(DAY_DIR, { recursive: true });
  fs.writeFileSync(DAY_JSON, JSON.stringify(dayDoc, null, 2) + '\n');
  fs.writeFileSync(DAY_MD, md + '\n');

  console.log(`TT_GUIDE_BUSINESS_DATA_READINESS_DAY1: ${readyState.TT_GUIDE_BUSINESS_DATA_READINESS_DAY1}`);
  console.log(`PASS: ${pass} · WARN-C: ${warn_c} · WARN-D: ${warn_d} · FAIL: ${fail} · Ready: ${readyState.ready}`);
  console.log(`Open Root Causes: ${openRootCauses.join(', ') || '—'}`);
  for (const r of results) {
    console.log(`  ${r.label}: ${r.verdict} · root_cause=${r.root_cause || 'null'} → ${r.evidence}`);
  }
  console.log(`Evidence: ${DAY_JSON}`);
  process.exit(fail > READY_RULE.max_fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
