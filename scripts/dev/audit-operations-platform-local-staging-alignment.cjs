#!/usr/bin/env node
/**
 * Local ↔ Staging Operations Platform Enterprise Alignment Audit (Phase ②)
 * NOT reopening RC / DDG / OCS.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const {
  isCanonicalGuideId,
  isSmokeContent,
  isNonProductionOrigin,
} = require('./lib/smoke-data-heuristics.cjs');

const ROOT = path.join(__dirname, '../..');
const LOCAL_API = (process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_REL = process.env.STATE || 'evidence/GO_official_cold_start_dataset/20260703T044855Z/state.json';
const OUT = process.env.OUT || '';
const STAMP = process.env.ALIGN_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');

const REGISTRY_FILES = [
  'registry/traveltrust-operations-platform.v1.yaml',
  'registry/traveltrust-operations-workflow.v1.yaml',
  'registry/single-official-public-catalog-policy.v1.yaml',
  'registry/official-catalog-identity-policy.v1.yaml',
  'registry/official-cold-start-dataset.v1.yaml',
  'registry/display-data-governance.v1.yaml',
];

const SIX_DOMAINS = [
  { id: 'content_operations', ui: '/admin/content/countries', routes: ['/api/v1/admin/content/countries?limit=1'] },
  { id: 'catalog_operations', ui: '/admin/official/public-operations', routes: ['/api/v1/admin/official/public-operations/publish-queue?limit=1'] },
  { id: 'campaign_operations', ui: '/admin/official/cold-start', routes: ['/api/v1/admin/official/public-operations/campaigns?limit=1'] },
  { id: 'moderation_operations', ui: '/admin/community/reports', routes: ['/api/v1/admin/community/reports?limit=1'] },
  { id: 'business_operations', ui: '/admin/disputes', routes: ['/api/v1/admin/disputes?limit=1', '/api/v1/admin/orders?limit=1'] },
  { id: 'analytics_growth', ui: '/admin/growth', routes: ['/api/v1/admin/growth/analytics/overview?window_days=7'] },
];

const differences = [];

function classify(cat, id, local, staging, classification, note, fix) {
  differences.push({ category: cat, id, local, staging, classification, note, fix });
}

function shaFile(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);
}

function loadState() {
  const p = path.isAbsolute(STATE_REL) ? path.normalize(STATE_REL) : path.join(ROOT, STATE_REL);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function ocsSets(state) {
  const guides = new Set(Object.values(state?.guides || {}).map((v) => v.id).filter(Boolean));
  const listings = new Set(
    Object.entries(state?.listings || {})
      .map(([, v]) => v.id)
      .filter(Boolean)
  );
  return { guides, listings };
}

async function probeEnv(label, apiBase, state) {
  const client = createClient(apiBase);
  const snap = { label, api: apiBase, ok: false, errors: [] };
  const ocs = ocsSets(state);

  try {
    const tok = await client.adminLogin(
      process.env.ADMIN_EMAIL || 'tourist@test.com',
      process.env.ADMIN_PASS || 'Test123!'
    );

    const meta = await client.req('GET', '/api/v1/meta');
    snap.meta = {
      status: meta.status,
      freeze_active: meta.json?.governance?.freeze_active ?? null,
      service: meta.json?.service,
      api_version: meta.json?.api_version,
      deployment_profile: meta.json?.governance?.deployment_profile || meta.json?.build?.profile || null,
      rbac_matrix_version: meta.json?.governance?.admin_rbac_matrix_version || meta.json?.admin?.rbac_matrix_version,
      strict_mode: meta.json?.strict_mode,
      database_connected: meta.json?.database_connected,
      chain_id: meta.json?.chain?.chain_id,
    };

    const guides = await client.req('GET', '/api/v1/guides?limit=500');
    const guideItems = guides.json.items || [];
    const pq = await client.req(
      'GET',
      '/api/v1/admin/official/public-operations/publish-queue?entity_type=guides&limit=500',
      null,
      tok
    );
    const pqGuides = pq.json.items || [];

    snap.public_catalog = {
      guides_public_count: guideItems.length,
      cities_public: [...new Set(guideItems.map((g) => g.city))].sort(),
      duplicate_cities_public: Object.entries(
        guideItems.reduce((m, g) => ({ ...m, [g.city]: (m[g.city] || 0) + 1 }), {})
      )
        .filter(([, c]) => c > 1)
        .map(([city, count]) => ({ city, count })),
      data_origin_breakdown: guideItems.reduce((m, g) => {
        const k = g.data_origin || 'unknown';
        m[k] = (m[k] || 0) + 1;
        return m;
      }, {}),
      ocs_on_public: guideItems.filter((g) => ocs.guides.has(g.id)).length,
      ocs_expected: ocs.guides.size,
      non_ocs_public: guideItems
        .filter((g) => !ocs.guides.has(g.id))
        .map((g) => ({
          id: g.id,
          city: g.city,
          data_origin: g.data_origin,
          kind: isCanonicalGuideId(g.id) ? 'canonical_showcase' : isSmokeContent(g) ? 'smoke' : isNonProductionOrigin(g.data_origin) ? 'test' : 'other',
        })),
      publish_queue_sample: pqGuides.slice(0, 3).map((g) => ({
        id: g.id,
        display_status: g.display_status,
        featured: g.featured,
        display_surfaces: g.display_surfaces,
      })),
    };

    const prov = await client.req('GET', '/api/v1/market/provider/listings?limit=500');
    const acq = await client.req('GET', '/api/v1/market/acquisition/listings?limit=500');
    const provItems = prov.json.items || [];
    const acqItems = acq.json.items || [];
    snap.public_catalog.provider_public_count = provItems.length;
    snap.public_catalog.acquisition_public_count = acqItems.length;
    snap.public_catalog.ocs_provider_on_public = provItems.filter((r) => ocs.listings.has(r.id)).length;
    snap.public_catalog.ocs_acquisition_on_public = acqItems.filter((r) => ocs.listings.has(r.id)).length;

    const policy = await client.req('GET', '/api/v1/admin/official/public-operations/policy', null, tok);
    snap.public_ops_policy = policy.json.item || policy.json.policy || policy.json;

    const camps = await client.req('GET', '/api/v1/admin/official/public-operations/campaigns?limit=50', null, tok);
    const campItems = camps.json.items || [];
    snap.campaigns = {
      total: campItems.length,
      deployed: campItems.filter((c) => c.status === 'deployed').length,
    };

    snap.six_domains = {};
    for (const dom of SIX_DOMAINS) {
      const routes = [];
      for (const route of dom.routes) {
        const r = await client.req('GET', route, null, tok);
        routes.push({ route, status: r.status, ok: r.status >= 200 && r.status < 300 });
      }
      snap.six_domains[dom.id] = { ui_route: dom.ui, verdict: routes.every((x) => x.ok) ? 'PASS' : 'FAIL', routes };
    }

    // OCIP spot-check: first 3 OCS guide UUIDs exist in publish queue or public
    snap.ocip = { checked: 0, found: 0, missing: [] };
    const ocsGuideIds = [...ocs.guides].slice(0, 5);
    const pqById = new Map(pqGuides.map((g) => [g.id, g]));
    const pubById = new Map(guideItems.map((g) => [g.id, g]));
    for (const id of ocsGuideIds) {
      snap.ocip.checked++;
      if (pqById.has(id) || pubById.has(id)) snap.ocip.found++;
      else snap.ocip.missing.push(id);
    }
    snap.ocip.verdict = snap.ocip.missing.length === 0 ? 'PASS' : 'FAIL';

    snap.sopcp = {
      verdict:
        snap.public_catalog.ocs_on_public === ocs.guides.size &&
        snap.public_catalog.non_ocs_public.length === 0 &&
        snap.public_catalog.duplicate_cities_public.length === 0
          ? 'PASS'
          : 'FAIL',
      ocs_on_public: snap.public_catalog.ocs_on_public,
      ocs_expected: ocs.guides.size,
      non_ocs_count: snap.public_catalog.non_ocs_public.length,
      duplicate_cities: snap.public_catalog.duplicate_cities_public,
    };

    // Workflow FSM behavior probes
    snap.workflow_fsm = {};
    const iso = (label === 'local' ? 'L' : 'S') + crypto.randomBytes(1).toString('hex').slice(0, 1).toUpperCase();
    const create = await client.req(
      'POST',
      '/api/v1/admin/content/countries',
      { iso3166: iso, name_zh: '对齐探测', name_en: 'Align Probe', sort_order: 996 },
      tok
    );
    if (create.status >= 200 && create.status < 300 && create.json.item?.id) {
      const cid = create.json.item.id;
      const ver = create.json.item.version || 1;
      const illegalPub = await client.req('POST', `/api/v1/admin/content/countries/${cid}/publish`, { version: ver }, tok);
      snap.workflow_fsm.content_draft_to_publish_blocked =
        illegalPub.status >= 400 || illegalPub.json?.error === 'invalid_status_transition';
      await client.req('POST', `/api/v1/admin/content/countries/${cid}/archive`, { version: ver }, tok);
    }

    const ocsGuide = [...ocs.guides][0];
    if (ocsGuide) {
      const base = `/api/v1/admin/official/public-operations/entities/guides/${ocsGuide}`;
      const row = pqById.get(ocsGuide) || pubById.get(ocsGuide);
      const wasPublished = row?.display_status === 'published';
      if (wasPublished) await client.req('POST', `${base}/unpublish`, {}, tok);
      const feat = await client.req('PATCH', `${base}/featured`, { featured: true }, tok);
      snap.workflow_fsm.catalog_hidden_featured_blocked =
        feat.status >= 400 || feat.json?.error === 'featured_requires_published';
      if (wasPublished) await client.req('POST', `${base}/publish`, {}, tok);
    }

    snap.workflow_fsm.verdict =
      snap.workflow_fsm.content_draft_to_publish_blocked && snap.workflow_fsm.catalog_hidden_featured_blocked
        ? 'PASS'
        : 'FAIL';

    snap.ok = true;
  } catch (e) {
    snap.errors.push(String(e.message || e));
  }
  return snap;
}

function registryBlock() {
  const files = {};
  for (const rel of REGISTRY_FILES) {
    files[rel] = { exists: fs.existsSync(path.join(ROOT, rel)), sha16: shaFile(rel) };
  }
  return {
    principle: 'Local and Staging share repo SSOT — registry identical by definition',
    files,
    operations_platform_version: 'v2',
    operations_workflow_version: 'v1',
    governance: {
      evidence_reuse_policy: 'ENFORCED',
      policy: 'CLOSED_UNLESS_TOUCHED',
      gates: {
        RC: { status: 'CLOSED', mode: 'Evidence Reused' },
        DDG: { status: 'CLOSED', mode: 'Evidence Reused' },
        OCS: { status: 'CLOSED', mode: 'Evidence Reused' },
      },
    },
    ocs_status: 'CLOSED',
  };
}

function evidenceBlock() {
  const read = (rel) => {
    const p = path.join(ROOT, rel);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  };
  const wf = read('evidence/GO_operations_workflow_validation/20260703T064100Z/workflow-validation.json');
  return {
    workflow_validation_staging: wf
      ? { stamp: '20260703T064100Z', verdict: wf.verdict, domains: Object.fromEntries(Object.entries(wf.domains || {}).map(([k, v]) => [k, v.verdict])) }
      : { verdict: 'missing' },
    ocs_state: fs.existsSync(path.join(ROOT, STATE_REL)) ? STATE_REL : 'missing',
    ocs_stamp: '20260703T044855Z',
  };
}

function compareEnvironments(local, staging) {
  // Model — registry is shared (documented in report, no diff expected)

  if (local.meta?.rbac_matrix_version !== staging.meta?.rbac_matrix_version) {
    classify(
      'runtime',
      'rbac_matrix_version',
      local.meta?.rbac_matrix_version,
      staging.meta?.rbac_matrix_version,
      local.meta?.rbac_matrix_version && staging.meta?.rbac_matrix_version ? 'Major' : 'Minor',
      'Admin RBAC matrix should match across envs',
      'Deploy same API build; verify meta.governance.admin_rbac_matrix_version'
    );
  }

  if (local.meta?.deployment_profile !== staging.meta?.deployment_profile) {
    classify(
      'runtime',
      'deployment_profile',
      local.meta?.deployment_profile,
      staging.meta?.deployment_profile,
      'Expected Difference',
      'local vs staging profile is intentional',
      null
    );
  }

  if (
    local.workflow_fsm?.content_draft_to_publish_blocked !== staging.workflow_fsm?.content_draft_to_publish_blocked &&
    (local.workflow_fsm?.content_draft_to_publish_blocked !== undefined ||
      staging.workflow_fsm?.content_draft_to_publish_blocked !== undefined)
  ) {
    classify(
      'behavior',
      'fsm_content_draft_publish',
      local.workflow_fsm?.content_draft_to_publish_blocked,
      staging.workflow_fsm?.content_draft_to_publish_blocked,
      'Blocking',
      'Content workflow must reject draft→published on both envs',
      'Restart local API with current traveltrust-api binary (post-FSM deploy)'
    );
  }

  if (local.workflow_fsm?.catalog_hidden_featured_blocked !== staging.workflow_fsm?.catalog_hidden_featured_blocked) {
    classify(
      'behavior',
      'fsm_catalog_featured',
      local.workflow_fsm?.catalog_hidden_featured_blocked,
      staging.workflow_fsm?.catalog_hidden_featured_blocked,
      'Blocking',
      'Catalog must reject featured on hidden',
      'Restart/rebuild local API'
    );
  }

  for (const dom of SIX_DOMAINS.map((d) => d.id)) {
    const l = local.six_domains?.[dom]?.verdict;
    const s = staging.six_domains?.[dom]?.verdict;
    if (l !== s) {
      const isAnalyticsFreeze =
        dom === 'analytics_growth' && l === 'PASS' && s === 'FAIL' && staging.meta?.freeze_active !== false;
      classify(
        'model',
        `six_domain_${dom}`,
        l,
        s,
        isAnalyticsFreeze ? 'Expected Difference' : 'Major',
        isAnalyticsFreeze
          ? 'Growth routes omitted on staging when complexity_convergence freeze is active'
          : 'Six-domain Admin API surface mismatch',
        isAnalyticsFreeze ? null : `Fix failing routes on ${l === 'FAIL' ? 'local' : 'staging'}`
      );
    }
  }

  if (local.sopcp?.verdict !== staging.sopcp?.verdict || local.sopcp?.ocs_on_public !== staging.sopcp?.ocs_on_public) {
    classify(
      'data',
      'sopcp_ocs_public_catalog',
      { verdict: local.sopcp?.verdict, ocs: local.sopcp?.ocs_on_public, non_ocs: local.sopcp?.non_ocs_count },
      { verdict: staging.sopcp?.verdict, ocs: staging.sopcp?.ocs_on_public, non_ocs: staging.sopcp?.non_ocs_count },
      local.sopcp?.verdict === 'FAIL' ? 'Blocking' : 'Major',
      'SOPCP: Public Catalog = OCS only (10 guides, no duplicates)',
      'Run scripts/dev/align-single-official-baseline-staging.cjs on local (API=http://127.0.0.1:8080) or re-apply OCS'
    );
  }

  if (local.public_catalog?.guides_public_count !== staging.public_catalog?.guides_public_count) {
    classify(
      'data',
      'public_guides_count',
      local.public_catalog?.guides_public_count,
      staging.public_catalog?.guides_public_count,
      local.sopcp?.verdict === 'FAIL' ? 'Blocking' : 'Minor',
      'Public guide count drift',
      'Align local to OCS baseline'
    );
  }

  if (local.public_ops_policy?.show_test_data !== staging.public_ops_policy?.show_test_data) {
    classify(
      'runtime',
      'public_ops_show_test_data',
      local.public_ops_policy?.show_test_data,
      staging.public_ops_policy?.show_test_data,
      'Major',
      'Public ops policy flag mismatch',
      'Sync ops_public_operations_policy row'
    );
  }

  if (local.campaigns?.deployed !== staging.campaigns?.deployed) {
    classify(
      'data',
      'campaigns_deployed',
      local.campaigns?.deployed,
      staging.campaigns?.deployed,
      'Minor',
      'Campaign deployment count may differ in dev',
      'Optional: deploy OCS campaigns on local'
    );
  }

  if (local.meta?.chain_id !== staging.meta?.chain_id) {
    classify(
      'runtime',
      'chain_id',
      local.meta?.chain_id,
      staging.meta?.chain_id,
      'Expected Difference',
      'Local anvil vs staging Sepolia',
      null
    );
  }
}

function finalVerdict(diffs, local, staging, evidence) {
  const blocking = diffs.filter((d) => d.classification === 'Blocking');
  const major = diffs.filter((d) => d.classification === 'Major');

  const stagingReady =
    staging.ok &&
    staging.sopcp?.verdict === 'PASS' &&
    staging.ocip?.verdict === 'PASS' &&
    (staging.workflow_fsm?.verdict === 'PASS' || evidence.workflow_validation_staging?.verdict === 'PASS');

  const aligned =
    blocking.length === 0 &&
    major.length === 0 &&
    local.ok &&
    staging.ok &&
    local.sopcp?.verdict === 'PASS' &&
    staging.sopcp?.verdict === 'PASS' &&
    local.ocip?.verdict === 'PASS' &&
    staging.ocip?.verdict === 'PASS' &&
    local.workflow_fsm?.verdict === 'PASS' &&
    staging.workflow_fsm?.verdict === 'PASS' &&
    local.six_domains &&
    Object.entries(local.six_domains).every(([id, d]) => d.verdict === 'PASS' || id === 'analytics_growth') &&
    staging.six_domains &&
    Object.entries(staging.six_domains).every(([id, d]) => d.verdict === 'PASS' || id === 'analytics_growth');

  return {
    phase2_staging_ops_baseline: stagingReady ? 'PASS' : 'FAIL',
    phase2_local_staging_alignment: aligned ? 'PASS' : 'FAIL',
    blocking_count: blocking.length,
    major_count: major.length,
    minor_count: diffs.filter((d) => d.classification === 'Minor').length,
    expected_count: diffs.filter((d) => d.classification === 'Expected Difference').length,
    staging_authoritative: true,
    note: aligned
      ? 'Local and Staging run the same operations model, workflow FSM, and OCS public baseline.'
      : blocking.length
        ? 'Blocking gaps prevent shared operations baseline — fix local before PI3.'
        : 'Staging meets Phase② ops baseline; local dev DB not yet aligned to OCS.',
  };
}

(async () => {
  const state = loadState();
  const [local, staging] = await Promise.all([
    probeEnv('local', LOCAL_API, state),
    probeEnv('staging', STAGING_API, state),
  ]);

  compareEnvironments(local, staging);
  const registry = registryBlock();
  const evidence = evidenceBlock();
  const verdict = finalVerdict(differences, local, staging, evidence);

  const report = {
    schema: 'traveltrust.operations_platform_alignment_audit.v2',
    stamp: STAMP,
    recorded_at: new Date().toISOString(),
    scope: {
      in: [
        'operations_platform_six_domains',
        'operations_workflow_fsm',
        'OCS_SOPCP_OCIP',
        'public_catalog_policy',
        'rbac_admin_public_ops',
        'registry_runbook_evidence',
      ],
      out_of_scope: [
        'RC_governance_rerun',
        'DDG_governance_rerun',
        'OCS_orchestrator_rerun',
        'production_ops_baseline_pi3',
      ],
    },
    apis: { local: LOCAL_API, staging: STAGING_API },
    sections: {
      model_alignment: {
        registry,
        six_domains_local: local.six_domains,
        six_domains_staging: staging.six_domains,
      },
      behavior_alignment: {
        workflow_fsm_local: local.workflow_fsm,
        workflow_fsm_staging: staging.workflow_fsm,
        workflow_validation_evidence: evidence.workflow_validation_staging,
      },
      data_alignment: {
        sopcp_local: local.sopcp,
        sopcp_staging: staging.sopcp,
        ocip_local: local.ocip,
        ocip_staging: staging.ocip,
        public_catalog_local: local.public_catalog,
        public_catalog_staging: staging.public_catalog,
      },
      runtime_alignment: {
        meta_local: local.meta,
        meta_staging: staging.meta,
        public_ops_policy_local: local.public_ops_policy,
        public_ops_policy_staging: staging.public_ops_policy,
        evidence,
      },
    },
    differences,
    verdict,
  };

  if (OUT) {
    const outPath = path.isAbsolute(OUT) ? OUT : path.join(ROOT, OUT);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(`PHASE2_STAGING_OPS_BASELINE: ${verdict.phase2_staging_ops_baseline}`);
  console.log(`PHASE2_LOCAL_STAGING_ALIGNMENT: ${verdict.phase2_local_staging_alignment}`);
  console.log(
    `differences blocking=${verdict.blocking_count} major=${verdict.major_count} minor=${verdict.minor_count} expected=${verdict.expected_count}`
  );
  if (verdict.blocking_count) {
    differences
      .filter((d) => d.classification === 'Blocking')
      .forEach((d) => console.log(`  [Blocking] ${d.id}: ${d.note}`));
  }

  if (verdict.phase2_local_staging_alignment !== 'PASS') process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
