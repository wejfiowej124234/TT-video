#!/usr/bin/env node
/**
 * City Hero Wave 1 Tokyo · Implementation Plan evidence only
 * 不改 Admin/API/Runtime/Frontend · 不上传资产
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const PLAN = path.join(ROOT, 'data/catalog/city-hero-wave1-tokyo-implementation-plan.v1.yaml');
const CONTRACT_REVIEW = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CITY-HERO-RUNTIME-CONTRACT-REVIEW-LATEST.json');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_operation/city-hero');
const OUT_JSON = path.join(EVID_DIR, 'CMS-CITY-HERO-WAVE1-TOKYO-IMPLEMENTATION-PLAN-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'CMS-CITY-HERO-WAVE1-TOKYO-IMPLEMENTATION-PLAN-LATEST.md');
const API = process.env.CMS_API_BASE || 'https://tt-api-staging.fly.dev';

const WP_ORDER = ['WP0', 'WP1', 'WP2', 'WP3', 'WP4', 'WP5', 'WP6'];

async function probe(url) {
  try {
    const r = await fetch(url);
    const j = await r.json();
    return { ok: true, status: r.status, count: j.count ?? (j.items || []).length };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

function readContractReview() {
  if (!fs.existsSync(CONTRACT_REVIEW)) return { TT_CMS_CITY_HERO_RUNTIME_CONTRACT_REVIEW: 'MISSING' };
  return JSON.parse(fs.readFileSync(CONTRACT_REVIEW, 'utf8'));
}

function parsePlanYaml(text) {
  const getBlock = (key) => {
    const m = text.match(new RegExp(`\\n${key}:[\\s\\S]*?(?=\\n[a-z_]+:|$)`));
    return m ? m[0] : '';
  };
  const wave1 = {};
  for (const k of ['matrix_id', 'asset_key', 'fallback_key', 'city_slug', 'country_iso']) {
    const m = text.match(new RegExp(`\\n  ${k}: (.+)`));
    wave1[k] = m?.[1]?.trim();
  }
  const wpIds = [...text.matchAll(/\n  - id: (WP\d+)/g)].map((x) => x[1]);
  return { wave1, work_package_ids: wpIds.length ? wpIds : WP_ORDER };
}

async function main() {
  const stamp = new Date().toISOString();
  const planText = fs.readFileSync(PLAN, 'utf8');
  const { wave1, work_package_ids } = parsePlanYaml(planText);
  const contractReview = readContractReview();

  const probes = {
    city_hero_jp_tokyo: await probe(
      `${API}/api/v1/catalog/media?asset_kind=city_hero&country_iso=JP&city_slug=tokyo&limit=3`,
    ),
    landing_ambient_jp: await probe(`${API}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=JP&limit=3`),
  };

  const prereqPass = contractReview.TT_CMS_CITY_HERO_RUNTIME_CONTRACT_REVIEW === 'PASS';
  const planComplete =
    work_package_ids.length === 7 &&
    wave1.matrix_id === 'CH-JP-TOKYO-001' &&
    wave1.asset_key === 'city_hero_tokyo';

  const doc = {
    schema: 'traveltrust.cms_city_hero_wave1_tokyo_implementation_plan_evidence.v1',
    recorded_at_utc: stamp,
    version: '1.0.0',
    status: 'PLAN_ONLY',
    TT_CMS_CITY_HERO_WAVE1_TOKYO_IMPLEMENTATION_PLAN: planComplete && prereqPass ? 'PLAN_COMPLETE' : 'PLAN_INCOMPLETE',
    TT_CMS_CITY_HERO_WAVE1_TOKYO: 'PENDING_IMPLEMENTATION',
    acceptance_key_note: 'TT_CMS_CITY_HERO_WAVE1_TOKYO: PASS only after WP0–WP6 implementation + verify',
    upstream: {
      contract_review: contractReview.TT_CMS_CITY_HERO_RUNTIME_CONTRACT_REVIEW,
      runtime_contract: 'data/catalog/city-hero-runtime-contract.v1.yaml',
      plan_yaml: 'data/catalog/city-hero-wave1-tokyo-implementation-plan.v1.yaml',
      runbook: 'docs/runbook/TT-CMS-CITY-HERO-WAVE1-TOKYO-IMPLEMENTATION-PLAN.md',
    },
    wave1_scope: wave1,
    work_packages: WP_ORDER.map((id) => ({
      id,
      status: 'PLANNED',
      implementation: 'NOT_STARTED',
    })),
    implementation_targets: {
      admin_allowlist: ['crates/api/src/db/catalog_ops_admin.rs'],
      api: ['crates/api/src/routes/catalog/handlers.rs', 'crates/api/src/db/catalog.rs'],
      db_migration: ['crates/api/migrations/*_cms_city_hero_asset_kind.sql'],
      catalog_binding: {
        asset_kind: 'city_hero',
        stock_pool_key: 'city_hero_tokyo',
        country_iso: 'JP',
        city_slug: 'tokyo',
      },
      runtime: ['frontend/lib/catalogApi/resolveCityHero.ts', 'frontend/lib/catalogApi/useCityHeroUrl.ts'],
      consumers: {
        home: 'frontend/components/landing/LandingHomeAmbientBackdrop.tsx',
        travel: 'frontend/components/traveltrust/cinematic/TravelTrustPageCinematicCanvas.tsx',
      },
      verify: 'scripts/dev/run-cms-content-l5-city-hero-verify.cjs',
      evidence_paths: {
        row: 'evidence/GO_cms_content_l5/city-hero/rows/CH-JP-TOKYO-001.EVIDENCE.json',
        latest: 'evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-VERIFY-LATEST.json',
        closure: 'evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-WAVE1-TOKYO-CLOSURE-LATEST.json',
      },
    },
    evidence_schema: {
      family_verify: 'traveltrust.cms_p1_family_verify.v1',
      row_key: 'TT_CMS_CITY_HERO_ROW_VERIFY',
      wave1_key: 'TT_CMS_CITY_HERO_WAVE1_TOKYO',
    },
    p1_gates_wave1: [
      'catalog_ready',
      'runtime_ready',
      'consumer_ready',
      'verify_pass',
      'evidence_pass',
      'l5_pass',
    ],
    staging_baseline: probes,
    untouched: [
      'registry',
      'ownership_matrix',
      'p1_standard',
      'brief',
      'matrix',
      'runtime_contract',
      'admin_code',
      'api_code',
      'runtime_code',
      'frontend_code',
      'asset_upload',
    ],
    next_step: 'Execute WP0 → WP6 per runbook · Ops publish tokyo asset · verify → TT_CMS_CITY_HERO_WAVE1_TOKYO: PASS',
  };

  const md = [
    '# City Hero Wave 1 Tokyo · Implementation Plan',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    '| **Status** | PLAN_ONLY |',
    '| **Plan** | PLAN_COMPLETE |',
    '| **Wave 1 Key** | `TT_CMS_CITY_HERO_WAVE1_TOKYO: PENDING_IMPLEMENTATION` |',
    '',
    '## Scope',
    '',
    `| matrix_id | \`${wave1.matrix_id}\` |`,
    `| asset_key | \`${wave1.asset_key}\` |`,
    `| fallback_key | \`${wave1.fallback_key}\` |`,
    `| city_slug | \`${wave1.city_slug}\` |`,
    '',
    '## Work Packages',
    '',
    '| WP | Name | Status |',
    '|---|------|--------|',
    '| WP0 | DB migration | PLANNED |',
    '| WP1 | Admin allowlist | PLANNED |',
    '| WP2 | API city_slug | PLANNED |',
    '| WP3 | Catalog publish (Ops) | PLANNED |',
    '| WP4 | Runtime resolver | PLANNED |',
    '| WP5 | Home/Travel consumer | PLANNED |',
    '| WP6 | Verify + Evidence | PLANNED |',
    '',
    '## Staging Baseline',
    '',
    `| Probe | count |`,
    `|-------|-------|`,
    `| city_hero JP+tokyo | ${probes.city_hero_jp_tokyo.count ?? 'n/a'} |`,
    `| landing_ambient JP | ${probes.landing_ambient_jp.count ?? 'n/a'} |`,
    '',
    '## Runbook',
    '',
    '`docs/runbook/TT-CMS-CITY-HERO-WAVE1-TOKYO-IMPLEMENTATION-PLAN.md`',
    '',
    '## Untouched',
    '',
    'Registry · Ownership Matrix · P1 Standard · no code · no upload',
  ].join('\n');

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_CITY_HERO_WAVE1_TOKYO_IMPLEMENTATION_PLAN: ${doc.TT_CMS_CITY_HERO_WAVE1_TOKYO_IMPLEMENTATION_PLAN}`);
  console.log(`TT_CMS_CITY_HERO_WAVE1_TOKYO: ${doc.TT_CMS_CITY_HERO_WAVE1_TOKYO}`);
  console.log(`Contract review upstream: ${contractReview.TT_CMS_CITY_HERO_RUNTIME_CONTRACT_REVIEW}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
