#!/usr/bin/env node
/**
 * Validate G1 staging persona matrix (C1–C4, E2 · E1 skipped per registry).
 *
 *   node scripts/dev/validate-staging-persona-matrix-g1.cjs --results path/to/browser-results.json [--evidence-dir DIR]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REQUIRED = ['C1', 'C2', 'C3', 'C4', 'E2'];

function parseArgs() {
  const args = { results: '', evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--results') args.results = process.argv[++i];
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

function main() {
  const { results, evidenceDir } = parseArgs();
  if (!results) {
    console.error('Usage: --results evidence/.../browser-results.json [--evidence-dir DIR]');
    process.exit(1);
  }

  const resultsPath = path.isAbsolute(results) ? results : path.join(ROOT, results);
  if (!fs.existsSync(resultsPath)) {
    console.error(`missing ${resultsPath}`);
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const persona = {};
  for (const p of REQUIRED) {
    const pr = rows.filter((r) => r.account === p);
    const uiFail = pr.filter((r) => r.ui === 'FAIL');
    const uiPass = pr.filter((r) => r.ui === 'PASS');
    persona[p] = {
      rows: pr.length,
      ui_pass: uiPass.length,
      ui_fail: uiFail.length,
      pass: pr.length > 0 && uiFail.length === 0 && uiPass.length > 0,
    };
  }

  const allPass = REQUIRED.every((p) => persona[p].pass);
  const summary = {
    schema: 'traveltrust.g1_staging_persona_matrix.v1',
    phase: '②-staging',
    personas_required: REQUIRED,
    personas_skipped: ['E1'],
    web_base: process.env.STAGING_WEB_BASE || 'https://tt-web-staging.fly.dev',
    api_base: process.env.STAGING_API_BASE || 'https://tt-api-staging.fly.dev',
    results_file: path.relative(ROOT, resultsPath).replace(/\\/g, '/'),
    persona,
    all_pass: allPass,
    verdict: allPass ? 'STAGING_PERSONA_MATRIX_PASS' : 'STAGING_PERSONA_MATRIX_FAIL',
    honest_boundary: '② staging persona corridors · not ③ Production GO',
  };

  if (evidenceDir) {
    const dir = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'staging-persona-matrix-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  }

  console.log(JSON.stringify(summary, null, 2));
  if (!allPass) {
    console.error('STAGING_PERSONA_MATRIX: FAIL');
    process.exit(1);
  }
  console.log('STAGING_PERSONA_MATRIX: PASS');
}

main();
