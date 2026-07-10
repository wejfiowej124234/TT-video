/**
 * FPC B26 · site-wide L2.5 customer experience probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const MATRIX_PATH = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json'
);
const DASHBOARD_PATH = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-RELEASE-DASHBOARD-LATEST.json'
);
const REGISTRY_PATH = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

function runSiteWideCxChecks(checklist, findings) {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const pages = matrix.pages || [];
  const policy = checklist.l2_5_cx_policy || {};
  const minJourney = policy.min_user_journey_score ?? 7;
  const checks = [];
  const gaps = [];

  for (const page of pages) {
    const cx = page.layer2_5_customer_experience || {};
    const row = { route: page.route, cluster: page.cluster };
    let ok = true;

    if (!cx.user_goal) {
      ok = false;
      gaps.push(`${page.route}:missing_user_goal`);
    }
    if (!cx.primary_cta) {
      ok = false;
      gaps.push(`${page.route}:missing_primary_cta`);
    }
    if (cx.user_journey_score == null || cx.user_journey_score < minJourney) {
      ok = false;
      gaps.push(`${page.route}:journey_score`);
    }
    if (cx.core_action_clicks_lte_3 !== 'PASS') {
      ok = false;
      gaps.push(`${page.route}:core_action_clicks`);
    }
    if (cx.certification_verdict !== policy.require_certification_verdict) {
      ok = false;
      gaps.push(`${page.route}:cx_verdict=${cx.certification_verdict}`);
    }
    checks.push({ ...row, pass: ok });
  }

  const passCount = checks.filter((c) => c.pass).length;
  const pass = passCount === pages.length && pages.length === 202;
  if (!pass) {
    findings.push({
      id: 'site_wide_cx_incomplete',
      severity: 'P0',
      detail: `${passCount}/${pages.length} PASS · gaps=${gaps.slice(0, 12).join('; ')}${gaps.length > 12 ? '…' : ''}`,
    });
  }

  return {
    pass,
    checks,
    pass_count: passCount,
    total: pages.length,
    gaps,
    b26_apply: matrix.b26_apply || null,
  };
}

function runOtherConsumerClosure(checklist, findings) {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
  const routes = checklist.other_consumer_routes || [];
  const pages = matrix.pages.filter((p) => p.cluster === 'other_consumer');
  const checks = [];

  const countOk = pages.length === checklist.other_consumer_page_count;
  if (!countOk) {
    findings.push({
      id: 'other_consumer_count_drift',
      severity: 'P1',
      detail: `matrix=${pages.length} expected=${checklist.other_consumer_page_count}`,
    });
  }
  checks.push({ id: 'other_consumer_count', pass: countOk, matrix: pages.length });

  const routeSet = new Set(routes);
  const missingRoutes = routes.filter((r) => !pages.some((p) => p.route === r));
  const extraRoutes = pages.filter((p) => !routeSet.has(p.route)).map((p) => p.route);
  const routesOk = missingRoutes.length === 0 && extraRoutes.length === 0;
  if (!routesOk) {
    findings.push({
      id: 'other_consumer_route_drift',
      severity: 'P0',
      detail: `missing=${missingRoutes.join(',')} extra=${extraRoutes.join(',')}`,
    });
  }
  checks.push({ id: 'other_consumer_routes', pass: routesOk, missingRoutes, extraRoutes });

  const cxOk = pages.every(
    (p) =>
      p.layer2_5_customer_experience?.certification_verdict === 'PASS' &&
      p.layer2_l5_scores?.ui != null
  );
  if (!cxOk) {
    findings.push({
      id: 'other_consumer_cx_not_certified',
      severity: 'P0',
      detail: 'Run apply-fpc-l2-customer-experience-matrix for other_consumer gap',
    });
  }
  checks.push({ id: 'other_consumer_cx_certified', pass: cxOk });

  return { pass: checks.every((c) => c.pass), checks, pages };
}

function runDashboardParity(checklist, findings) {
  if (!fs.existsSync(DASHBOARD_PATH)) {
    findings.push({ id: 'dashboard_missing', severity: 'P0', detail: DASHBOARD_PATH });
    return { pass: false };
  }
  const dash = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));
  const registryRaw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const hasB26 = registryRaw.includes('id: B26') && registryRaw.includes('Customer Experience');
  const batchRow = (dash.batch_rows || dash.ai_review_summary || []).find((r) => r.batch_id === 'B26');
  const checks = [
    { id: 'registry_b26', pass: hasB26 },
    { id: 'dashboard_lists_b26', pass: !!batchRow || dash.burn_down?.next_required_batch === 'B26' },
  ];
  if (!hasB26) {
    findings.push({ id: 'registry_b26_missing', severity: 'P1', detail: 'B26 not in registry' });
  }
  return { pass: checks.every((c) => c.pass), checks, dashboard: dash.burn_down };
}

function runStaticSsotChecks(checklist, findings) {
  const items = [
    {
      id: 'quality_matrix_q3',
      path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
      must_contain: ['"id": "Q3"', 'B26'],
    },
    {
      id: 'page_matrix_b26_apply',
      path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
      must_contain: ['b26_apply', 'layer2_5_customer_experience'],
    },
  ];
  const results = [];
  for (const item of items) {
    const abs = path.join(ROOT, item.path);
    const pass =
      fs.existsSync(abs) &&
      item.must_contain.every((needle) => fs.readFileSync(abs, 'utf8').includes(needle));
    if (!pass) {
      findings.push({ id: item.id, severity: 'P1', detail: item.path });
    }
    results.push({ ...item, pass });
  }
  return results;
}

module.exports = {
  loadChecklist,
  runSiteWideCxChecks,
  runOtherConsumerClosure,
  runDashboardParity,
  runStaticSsotChecks,
};
