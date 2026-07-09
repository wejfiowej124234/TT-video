#!/usr/bin/env node
/**
 * Scaffold FPC-100 Page Certification Matrix (202 routes + surface files).
 * Does NOT certify — initializes NOT_STARTED records for Layer 1 coverage tracking.
 *
 *   node scripts/dev/scaffold-fpc-100-page-certification-matrix.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const APP = path.join(ROOT, 'frontend/app');
const OUT = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json'
);

const NOT_STARTED = 'NOT_STARTED';
const VERDICT_PENDING = 'PENDING';

function routeFromPageFile(absPage) {
  let rel = path.relative(APP, absPage).replace(/\\/g, '/');
  rel = rel.replace(/\/page\.tsx$/, '');
  if (rel === '(home)') return '/';
  if (rel.startsWith('(home)/')) rel = rel.replace(/^\(home\)\//, '');
  rel = rel.replace(/\([^/]+\)\//g, '').replace(/\([^/]+\)/g, '');
  const segments = rel.split('/').filter(Boolean);
  const route = '/' + segments.map((s) => (s.startsWith('[') ? `[${s.slice(1, -1)}]` : s)).join('/');
  return route === '/' ? '/' : route.replace(/\/$/, '') || '/';
}

function clusterFromRoute(route) {
  if (route === '/' || route.startsWith('/traveltrust') || route === '/did-rank') return 'marketing_brand';
  if (route.startsWith('/market')) return 'market_commerce';
  if (route.startsWith('/community')) return 'community';
  if (route.startsWith('/governance') || route === '/staking') return 'governance_economics';
  if (route.startsWith('/auth') || route.startsWith('/me') || route.includes('/register')) return 'identity_onboarding';
  if (route.startsWith('/admin')) return 'admin_workspace';
  if (route.startsWith('/escrow') || route.startsWith('/orders') || route.startsWith('/pay')) return 'transaction_escrow';
  if (route.startsWith('/trust') || route.startsWith('/help') || route.startsWith('/terms') || route.startsWith('/privacy')) return 'trust_legal_help';
  return 'other_consumer';
}

function existsSibling(pageDir, name) {
  return fs.existsSync(path.join(pageDir, name));
}

function walkPages(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPages(p, acc);
    else if (ent.name === 'page.tsx') acc.push(p);
  }
  return acc;
}

function nearestLayout(pageDir) {
  const layouts = [];
  let d = pageDir;
  while (d.startsWith(APP)) {
    const lay = path.join(d, 'layout.tsx');
    if (fs.existsSync(lay)) layouts.push(path.relative(ROOT, lay).replace(/\\/g, '/'));
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
  return layouts;
}

const pages = walkPages(APP).sort();
const stamp = new Date().toISOString();
const anchor = process.env.FPC_CODE_ANCHOR || null;

const globalSurfaces = {
  not_found: fs.existsSync(path.join(APP, 'not-found.tsx')),
  global_error: fs.existsSync(path.join(APP, 'global-error.tsx')),
  root_layout: fs.existsSync(path.join(APP, 'layout.tsx')),
};

const records = pages.map((pageFile) => {
  const pageDir = path.dirname(pageFile);
  const route = routeFromPageFile(pageFile);
  const relPage = path.relative(ROOT, pageFile).replace(/\\/g, '/');
  const id = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '__').replace(/\[|\]/g, '');
  return {
    id: `page-${id || 'root'}`,
    route,
    cluster: clusterFromRoute(route),
    owner_files: {
      page: relPage,
      layouts: nearestLayout(pageDir),
      loading: existsSibling(pageDir, 'loading.tsx')
        ? path.relative(ROOT, path.join(pageDir, 'loading.tsx')).replace(/\\/g, '/')
        : null,
      error: existsSibling(pageDir, 'error.tsx')
        ? path.relative(ROOT, path.join(pageDir, 'error.tsx')).replace(/\\/g, '/')
        : null,
    },
    layer1_surface_coverage: {
      page_tsx: VERDICT_PENDING,
      layout_tsx: nearestLayout(pageDir).length ? VERDICT_PENDING : 'N/A',
      loading_tsx: existsSibling(pageDir, 'loading.tsx') ? VERDICT_PENDING : 'N/A',
      error_tsx: existsSibling(pageDir, 'error.tsx') ? VERDICT_PENDING : 'N/A',
      modals_drawers_dialogs: NOT_STARTED,
      empty_states: NOT_STARTED,
      forbidden_403_ui: NOT_STARTED,
    },
    layer2_l5_scores: {
      ui: null,
      ux: null,
      content: null,
      function_flow: null,
      scale: '0-10',
    },
    layer2_ux_states: {
      loading: NOT_STARTED,
      skeleton: NOT_STARTED,
      empty_state: NOT_STARTED,
      error_state: NOT_STARTED,
      retry: NOT_STARTED,
      toast: NOT_STARTED,
      confirm_dialog: NOT_STARTED,
      back_navigation: NOT_STARTED,
      breadcrumb: NOT_STARTED,
      shortcuts: NOT_STARTED,
    },
    layer2_ui_dimensions: {
      layout_spacing: NOT_STARTED,
      typography: NOT_STARTED,
      color_icon: NOT_STARTED,
      cta: NOT_STARTED,
      cards: NOT_STARTED,
      header_footer: NOT_STARTED,
      dark_mode: NOT_STARTED,
      responsive: NOT_STARTED,
    },
    layer2_content: {
      typos: NOT_STARTED,
      engineering_jargon: NOT_STARTED,
      mock_demo_labels: NOT_STARTED,
      internal_spec_refs: NOT_STARTED,
      copy_consistency: NOT_STARTED,
      i18n_pairity: NOT_STARTED,
    },
    layer2_5_customer_experience: {
      user_goal: null,
      primary_cta: null,
      time_to_complete: null,
      cognitive_load: null,
      user_journey_score: null,
      first_visit_next_step_clear: NOT_STARTED,
      single_primary_cta: NOT_STARTED,
      no_confusing_navigation: NOT_STARTED,
      core_action_clicks_lte_3: NOT_STARTED,
      loading_communicates_progress: NOT_STARTED,
      error_states_actionable: NOT_STARTED,
      certification_verdict: NOT_STARTED,
    },
    layer3_business_flow_refs: [],
    layer4_enterprise: {
      seo: NOT_STARTED,
      accessibility: NOT_STARTED,
      mobile_375: NOT_STARTED,
      i18n: NOT_STARTED,
      rbac: NOT_STARTED,
      api_data_chain: NOT_STARTED,
      security: NOT_STARTED,
      performance: NOT_STARTED,
      observability: NOT_STARTED,
    },
    layer5_operations_truth_per_page: {
      data_lineage: {
        chain_documented: NOT_STARTED,
        db: null,
        api: null,
        projection: null,
        frontend: null,
        ui_field_map: null,
        verdict: NOT_STARTED,
      },
      content_operations: {
        cms_assets_on_page: NOT_STARTED,
        publish_state_verified: NOT_STARTED,
        verdict: NOT_STARTED,
      },
      recovery: {
        api_500_graceful: NOT_STARTED,
        network_offline: NOT_STARTED,
        cdn_image_missing: NOT_STARTED,
        wallet_timeout: NOT_STARTED,
        verdict: NOT_STARTED,
      },
      truthfulness: {
        no_mock: NOT_STARTED,
        no_demo: NOT_STARTED,
        no_placeholder: NOT_STARTED,
        no_fake_data: NOT_STARTED,
        no_todo: NOT_STARTED,
        no_coming_soon: NOT_STARTED,
        truthfulness_pct: null,
        verdict: NOT_STARTED,
      },
    },
    ux_certification: {
      ia_information_architecture: NOT_STARTED,
      cta_unique_primary: NOT_STARTED,
      l5_visual_quality: NOT_STARTED,
      user_comprehension_cost: NOT_STARTED,
      industry_best_practice: NOT_STARTED,
      production_grade_product_feel: NOT_STARTED,
    },
    l5_dimensions_96_16: {
      D1_zone_finance: NOT_STARTED,
      D2_ia_navigation: NOT_STARTED,
      D3_responsive_touch: NOT_STARTED,
      D4_empty_load_error: NOT_STARTED,
      D5_i18n: NOT_STARTED,
      D6_a11y: NOT_STARTED,
      D7_performance: NOT_STARTED,
      D8_motion: NOT_STARTED,
      D9_tokens: NOT_STARTED,
      D10_wallet_chain: NOT_STARTED,
      D11_observability: NOT_STARTED,
      D12_legal_copy: NOT_STARTED,
    },
    production_ready: null,
    certification_verdict: NOT_STARTED,
    verified_by: null,
    verified_at_utc: null,
    evidence_path: null,
    fpc_batch: null,
    notes: null,
  };
});

const matrix = {
  schema: 'traveltrust.fpc_100_page_certification_matrix.v2',
  title: 'FPC-100 Page Certification Matrix',
  mode: 'certification_not_checklist',
  timestamp_utc: stamp,
  code_anchor_commit: anchor,
  inventory: {
    page_tsx_count: pages.length,
    layout_tsx_count: walkPages(APP).length, // wrong - need separate count
    global_surfaces: globalSurfaces,
  },
  coverage_summary: {
    pages_total: pages.length,
    pages_certified_pass: 0,
    pages_certified_fail: 0,
    pages_not_started: pages.length,
    coverage_pct: 0,
    production_ready_yes: 0,
    cx_certified_pass: 0,
    truthfulness_100_pct_pages: 0,
    data_lineage_documented: 0,
  },
  five_layers: {
    L1_page_coverage: '202/202 routes enumerated — per-page surface sub-items PENDING',
    L2_per_page_l5_ux_ui: 'NOT_STARTED — page card UI/UX/content/function',
    L2_5_customer_experience: 'NOT_STARTED — user goal · CTA · journey · cognitive load',
    L3_business_flows: 'registry/business-flow-matrix.v1.yaml — batch B10',
    L4_enterprise: 'batches B01–B24 cross-cutting gates',
    L5_operations_truth: 'B30–B37 global + per-page layer5_operations_truth_per_page',
  },
  pages: records,
};

// fix layout count
const countFiles = (name) => {
  let n = 0;
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name === name) n++;
    }
  };
  walk(APP);
  return n;
};
matrix.inventory.layout_tsx_count = countFiles('layout.tsx');
matrix.inventory.loading_tsx_count = countFiles('loading.tsx');
matrix.inventory.error_tsx_count = countFiles('error.tsx');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(matrix, null, 2) + '\n');
console.log('TT_FPC_100_PAGE_MATRIX: SCAFFOLDED');
console.log('pages:', pages.length);
console.log('OUT:', OUT);
