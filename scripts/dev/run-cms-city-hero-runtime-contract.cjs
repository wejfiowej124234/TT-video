#!/usr/bin/env node
/**
 * City Hero Runtime Contract V1 · evidence only · no implementation
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const CONTRACT = path.join(ROOT, 'data/catalog/city-hero-runtime-contract.v1.yaml');
const EVIDENCE = path.join(ROOT, 'evidence/GO_cms_operation');
const OUT_JSON = path.join(EVIDENCE, 'CMS-CITY-HERO-RUNTIME-CONTRACT-LATEST.json');
const OUT_MD = path.join(EVIDENCE, 'CMS-CITY-HERO-RUNTIME-CONTRACT-LATEST.md');

function main() {
  const stamp = new Date().toISOString();
  const doc = {
    schema: 'traveltrust.cms_city_hero_runtime_contract_evidence.v1',
    recorded_at_utc: stamp,
    version: '1.0.0',
    status: 'CONTRACT_ONLY',
    TT_CMS_CITY_HERO_RUNTIME_CONTRACT: 'CONTRACT_ONLY',
    contract_yaml: 'data/catalog/city-hero-runtime-contract.v1.yaml',
    runbook: 'docs/runbook/TT-CMS-CITY-HERO-RUNTIME-CONTRACT-V1.md',
    upstream_readonly: [
      'docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md',
      'data/catalog/city-hero-brief.v1.yaml',
      'data/catalog/city-hero-matrix.v1.yaml',
    ],
    untouched: ['registry', 'ownership_matrix', 'p1_standard'],
    api_read: {
      method: 'GET',
      path: '/api/v1/catalog/media',
      query: { asset_kind: 'city_hero', country_iso: '{ISO}', city_slug: '{slug}' },
      implementation_status: 'PLANNED',
    },
    fallback_chain: ['city_hero', 'landing_ambient_country', 'ts_static'],
    consumers: { home: '/', travel: '/traveltrust' },
    verify_script_planned: 'scripts/dev/run-cms-content-l5-city-hero-verify.cjs',
    evidence_schema: 'traveltrust.cms_p1_family_verify.v1',
    wave1: {
      matrix_id: 'CH-JP-TOKYO-001',
      asset_key: 'city_hero_tokyo',
      fallback_key: 'hero_japan',
      complete_key: 'TT_CMS_CITY_HERO_WAVE1_TOKYO',
    },
    forbidden: [
      'admin',
      'api_implementation',
      'runtime_resolver',
      'frontend',
      'upload',
      'registry_update',
      'ownership_matrix_update',
    ],
  };

  const md = [
    '# City Hero Runtime Contract V1',
    '',
    '| | |',
    '|---|---|',
    '| **Status** | CONTRACT_ONLY |',
    '| **Runbook** | `docs/runbook/TT-CMS-CITY-HERO-RUNTIME-CONTRACT-V1.md` |',
    '',
    '## Summary',
    '',
    '- **API:** `GET /catalog/media?asset_kind=city_hero&country_iso&city_slug` (planned)',
    '- **Fallback:** city_hero → hero_{country} / landing_ambient → ts',
    '- **Consumers:** Home `/` · Travel `/traveltrust`',
    '- **Wave 1:** `CH-JP-TOKYO-001` · `city_hero_tokyo` · `hero_japan`',
    '',
    '## Untouched',
    '',
    'Registry · Ownership Matrix · P1 Standard · no implementation',
  ].join('\n');

  fs.mkdirSync(EVIDENCE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log('TT_CMS_CITY_HERO_RUNTIME_CONTRACT: CONTRACT_ONLY');
  console.log(`Runbook: docs/runbook/TT-CMS-CITY-HERO-RUNTIME-CONTRACT-V1.md`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main();
