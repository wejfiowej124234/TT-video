#!/usr/bin/env node
/** Sync registry/business-data-readiness.v1.yaml from latest day evidence */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG = path.join(ROOT, 'registry/business-data-readiness.v1.yaml');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence/GO_production_readiness', rel), 'utf8'));
}

const guide = readJson('step1/GUIDE-BUSINESS-DATA-READINESS-DAY1-LATEST.json');
const provider = readJson('step2/PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.json');
const listings = readJson('step3/LISTINGS-BUSINESS-DATA-READINESS-DAY3-LATEST.json');
const poi = readJson('step3/POI-BUSINESS-DATA-READINESS-DAY4-LATEST.json');
const pricing = readJson('step3/PRICING-BUSINESS-DATA-READINESS-DAY5-LATEST.json');

function mapVerdict(v) {
  if (v === 'PASS') return 'pass';
  if (String(v).startsWith('WARN')) return 'warn';
  return 'fail';
}

const today = new Date().toISOString().slice(0, 10);
const allReady =
  guide.ready === 'YES' &&
  provider.ready === 'YES' &&
  listings.ready === 'YES' &&
  poi.ready === 'YES' &&
  pricing.ready === 'YES';

function checksYaml(results, prefix) {
  return results
    .map(
      (r) =>
        `      - { id: ${r.id}, label: ${r.label.replace(/"/g, '\\"')}, verdict: ${mapVerdict(r.verdict)}, note: "${prefix}-${r.id} · E: ${r.evidence}" }`,
    )
    .join('\n');
}

const yaml = `# Business Data Readiness · Evidence-driven Step 1
# Phase 3 synced from day evidence · ${today}

schema: traveltrust.business_data_readiness.v1
version: 5
effective_utc: "${today}"
machine_key: TT_BUSINESS_DATA_READINESS
mode: evidence_driven
verdict_enum: [PASS, WARN, FAIL]

ready_rule:
  per_domain:
    max_fail: 0
    max_warn: 1
  overall: 五域均 READY → Business Data Gate READY

step1_schedule:
  days:
    - { day: 1, domain: guide, probe_script: scripts/dev/run-guide-business-data-readiness-probes.cjs }
    - { day: 2, domain: provider, probe_script: scripts/dev/run-provider-business-data-readiness-probes.cjs }
    - { day: 3, domain: listings, probe_script: scripts/dev/run-listings-business-data-readiness-probes.cjs }
    - { day: 4, domain: poi, probe_script: scripts/dev/run-poi-business-data-readiness-probes.cjs }
    - { day: 5, domain: pricing, probe_script: scripts/dev/run-pricing-business-data-readiness-probes.cjs }

domain_ready_rule: 该域全部 probe PASS → domain READY · 五域 READY → Business Data Gate READY → 可进入 HAT

modules:
  - id: guide
    label: Guide
    step1_day: 1
    ready: ${guide.ready === 'YES'}
    probe_script: scripts/dev/run-guide-business-data-readiness-probes.cjs
    day_evidence: evidence/GO_production_readiness/step1/GUIDE-BUSINESS-DATA-READINESS-DAY1-LATEST.json
    checks:
${guide.results.map((r) => `      - { id: ${r.id}, label: ${r.label}, verdict: ${mapVerdict(r.verdict)} }`).join('\n')}

  - id: provider
    label: Provider
    step1_day: 2
    ready: ${provider.ready === 'YES'}
    probe_script: scripts/dev/run-provider-business-data-readiness-probes.cjs
    day_evidence: evidence/GO_production_readiness/step2/PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.json
    checks:
${provider.results.map((r) => `      - { id: ${r.id}, label: ${r.label}, verdict: ${mapVerdict(r.verdict)} }`).join('\n')}

  - id: listings
    label: Listings
    step1_day: 3
    ready: ${listings.ready === 'YES'}
    probe_script: scripts/dev/run-listings-business-data-readiness-probes.cjs
    day_evidence: evidence/GO_production_readiness/step3/LISTINGS-BUSINESS-DATA-READINESS-DAY3-LATEST.json
    checks:
${checksYaml(listings.results, 'BDR-listings')}

  - id: poi
    label: POI
    step1_day: 4
    ready: ${poi.ready === 'YES'}
    probe_script: scripts/dev/run-poi-business-data-readiness-probes.cjs
    day_evidence: evidence/GO_production_readiness/step3/POI-BUSINESS-DATA-READINESS-DAY4-LATEST.json
    checks:
${checksYaml(poi.results, 'BDR-poi')}

  - id: pricing
    label: Pricing
    step1_day: 5
    ready: ${pricing.ready === 'YES'}
    probe_script: scripts/dev/run-pricing-business-data-readiness-probes.cjs
    day_evidence: evidence/GO_production_readiness/step3/PRICING-BUSINESS-DATA-READINESS-DAY5-LATEST.json
    checks:
${checksYaml(pricing.results, 'BDR-pricing')}

overall:
  guide: ${guide.ready === 'YES' ? 'READY' : 'NOT_READY'}
  provider: ${provider.ready === 'YES' ? 'READY' : 'NOT_READY'}
  listings: ${listings.ready === 'YES' ? 'READY' : 'NOT_READY'}
  poi: ${poi.ready === 'YES' ? 'READY' : 'NOT_READY'}
  pricing: ${pricing.ready === 'YES' ? 'READY' : 'NOT_READY'}
  business_data_readiness: ${allReady ? 'READY' : 'NOT_READY'}

evidence_script: scripts/dev/run-production-readiness-master-checklist.cjs
`;

fs.writeFileSync(REG, yaml);
console.log('synced registry business-data-readiness v5 · allReady=', allReady);
