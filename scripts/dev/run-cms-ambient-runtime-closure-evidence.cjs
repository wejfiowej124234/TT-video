#!/usr/bin/env node
/**
 * Destination Ambient Runtime Closure Evidence · ② staging
 *
 * Prereq: CMS-AMBIENT-RUNTIME-WIRING-LATEST.json · TT_CMS_AMBIENT_RUNTIME_WIRING === PASS · 10/10
 *
 *   node scripts/dev/run-cms-ambient-runtime-closure-evidence.cjs
 *   node scripts/dev/run-cms-ambient-runtime-closure-evidence.cjs --refresh-audit
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  AMBIENT_WIRING_EVIDENCE_REL,
  AMBIENT_RUNTIME_PASS_COUNT,
  loadAmbientRuntimeWiringSsot,
} = require('./lib/cms-l5-audit-ssot.cjs');

const ROOT = path.join(__dirname, '../..');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-DESTINATION-AMBIENT-RUNTIME-CLOSURE-LATEST.json');
const POI_KICKOFF = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-WAVE-KICKOFF-LATEST.json');
const FAMILY_STATUS = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ASSET-FAMILY-STATUS-LATEST.json');
const WAVE1_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-AMBIENT-WAVE1-CLOSURE-LATEST.json');

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  if (process.argv.includes('--refresh-audit')) {
    execSync('node scripts/dev/run-cms-ambient-runtime-wiring-audit.cjs', {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    });
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const ambientSsot = loadAmbientRuntimeWiringSsot(ROOT);

  if (!ambientSsot.loaded || !ambientSsot.is_closed) {
    console.error(
      `TT_CMS_DESTINATION_AMBIENT_RUNTIME: NOT_CLOSED · wiring=${ambientSsot.verdict || 'MISSING'} · ${ambientSsot.pass_count}/${ambientSsot.total}`,
    );
    console.error(`Run: node scripts/dev/run-cms-ambient-runtime-wiring-audit.cjs`);
    process.exit(1);
  }

  const wave1 = readJsonIfExists(WAVE1_CLOSURE);
  const closure = {
    schema: 'traveltrust.cms_destination_ambient_runtime_closure.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    not_governance: true,
    phase: '② staging',
    destination_ambient_runtime: {
      status: 'CLOSED',
      pass_count: ambientSsot.pass_count,
      total: ambientSsot.total,
      display: `${ambientSsot.pass_count}/${ambientSsot.total} (100%)`,
      unsplash_count: ambientSsot.unsplash_count ?? 0,
    },
    acceptance: {
      criterion:
        'Runtime URL === Catalog publish URL · Unsplash/TS fallback = 0 · l5_compliant per country row',
      wiring_verdict: ambientSsot.verdict,
      web_base: ambientSsot.rows?.[0] ? undefined : undefined,
    },
    closure_keys: {
      TT_CMS_DESTINATION_AMBIENT_RUNTIME: 'CLOSED',
      TT_CMS_AMBIENT_RUNTIME_WIRING: ambientSsot.verdict,
      TT_CMS_AMBIENT_RUNTIME: `${ambientSsot.pass_count}/${ambientSsot.total}`,
      TT_CMS_AMBIENT_UNSplash: String(ambientSsot.unsplash_count ?? 0),
    },
    pipeline_wave1_closure: wave1
      ? {
          status: wave1.ambient_wave_closure?.status || wave1.asset_family_status || 'CLOSED',
          evidence: 'evidence/GO_cms_operation/CMS-AMBIENT-WAVE1-CLOSURE-LATEST.json',
          note: 'Hero/Publish wave closed · Runtime closure is separate SSOT layer',
        }
      : null,
    next_asset_family: 'POI',
    poi_upload_pause_lifted: true,
    evidence_refs: [
      AMBIENT_WIRING_EVIDENCE_REL,
      'scripts/dev/run-cms-ambient-runtime-wiring-audit.cjs',
      'scripts/dev/lib/cms-l5-audit-ssot.cjs',
    ],
    wiring_ssot: {
      path: AMBIENT_WIRING_EVIDENCE_REL,
      stamp_utc: ambientSsot.stamp_utc,
      producer: 'scripts/dev/run-cms-ambient-runtime-wiring-audit.cjs',
    },
    frozen: true,
    do_not_modify: 'Ambient runtime closed · CN visual outstanding only (process LIVE)',
    TT_CMS_DESTINATION_AMBIENT_RUNTIME: 'CLOSED',
  };

  const wiringDoc = readJsonIfExists(path.join(ROOT, AMBIENT_WIRING_EVIDENCE_REL));
  if (wiringDoc) {
    closure.acceptance.web_base = wiringDoc.web_base;
    closure.acceptance.api_base = wiringDoc.api_base;
  }

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(closure, null, 2) + '\n');
  const stamped = path.join(
    ROOT,
    'evidence/GO_cms_operation/destination-ambient-runtime',
    stamp,
    'CMS-DESTINATION-AMBIENT-RUNTIME-CLOSURE.json',
  );
  fs.mkdirSync(path.dirname(stamped), { recursive: true });
  fs.writeFileSync(stamped, JSON.stringify(closure, null, 2) + '\n');

  const familyStatus = readJsonIfExists(FAMILY_STATUS);
  if (familyStatus?.families) {
    familyStatus.stamp_utc = stamp;
    familyStatus.families = familyStatus.families.map((f) => {
      if (f.id !== 'destination_ambient') return f;
      return {
        ...f,
        status: 'CLOSED',
        runtime_closure_evidence: 'evidence/GO_cms_operation/CMS-DESTINATION-AMBIENT-RUNTIME-CLOSURE-LATEST.json',
        runtime_status: 'CLOSED',
      };
    });
    fs.writeFileSync(FAMILY_STATUS, JSON.stringify(familyStatus, null, 2) + '\n');
  }

  const kickoff = readJsonIfExists(POI_KICKOFF);
  if (kickoff) {
    kickoff.stamp_utc = stamp;
    kickoff.upload_paused = false;
    kickoff.status = 'CATALOG_BUILD_ACTIVE';
    kickoff.next_stage = 'CATALOG_BUILD';
    kickoff.not_started_items = false;
    kickoff.ambient_runtime_closure = {
      status: 'CLOSED',
      evidence: 'evidence/GO_cms_operation/CMS-DESTINATION-AMBIENT-RUNTIME-CLOSURE-LATEST.json',
    };
    kickoff.TT_CMS_POI_WAVE = 'CATALOG_BUILD_ACTIVE';
    kickoff.TT_CMS_POI_UPLOAD_PAUSED = false;
    fs.writeFileSync(POI_KICKOFF, JSON.stringify(kickoff, null, 2) + '\n');
  }

  console.log(`TT_CMS_DESTINATION_AMBIENT_RUNTIME: CLOSED`);
  console.log(`TT_CMS_AMBIENT_RUNTIME_WIRING: ${ambientSsot.verdict}`);
  console.log(`TT_CMS_AMBIENT_RUNTIME: ${ambientSsot.pass_count}/${AMBIENT_RUNTIME_PASS_COUNT}`);
  console.log(`TT_CMS_POI_UPLOAD_PAUSED: false`);
  console.log(`Evidence: ${OUT_LATEST.replace(/\\/g, '/')}`);
}

main();
