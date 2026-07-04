#!/usr/bin/env node
/**
 * Sync TT_PLATFORM_ADOPTION from latest coverage audit into Master Matrix.
 *
 *   node scripts/dev/sync-platform-adoption-matrix.cjs --signoff evidence/.../platform-coverage-audit.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

function parseArgs() {
  const args = { signoff: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--signoff') args.signoff = process.argv[++i];
  }
  return args;
}

function upsertMachineKey(yaml, key, value) {
  const re = new RegExp(`(${key}: )[^\n]+`);
  if (re.test(yaml)) return yaml.replace(re, `$1${value}`);
  return yaml.replace(/(machine_keys:\r?\n)/, `$1  ${key}: ${value}\n`);
}

function upsertAdoptionBlock(yaml, pct) {
  const re = /(  P2_platform_adoption:[\s\S]*?    aggregate: TT_PLATFORM_ADOPTION\r?\n)(    note:)/;
  if (re.test(yaml)) {
    return yaml.replace(re, `$1    last_adoption_pct: ${pct}\n$2`);
  }
  return yaml;
}

function main() {
  const { signoff } = parseArgs();
  if (!signoff) {
    console.error('Usage: --signoff evidence/GO_platform_capability/coverage-audit/<stamp>/platform-coverage-audit.json');
    process.exit(1);
  }
  const sp = path.isAbsolute(signoff) ? signoff : path.join(ROOT, signoff);
  const audit = JSON.parse(fs.readFileSync(sp, 'utf8'));
  const pct = audit.platform_adoption?.adoption_pct ?? 0;
  const status = pct >= 95 ? 'PASS' : 'IN_PROGRESS';

  let yaml = fs.readFileSync(REG_MATRIX, 'utf8');
  yaml = upsertMachineKey(yaml, 'TT_PLATFORM_ADOPTION', `${status}_${pct}pct`);
  yaml = upsertAdoptionBlock(yaml, pct);
  yaml = yaml.replace(/updated_utc: "[^"]+"/, `updated_utc: "${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}"`);
  fs.writeFileSync(REG_MATRIX, yaml);

  console.log(`TT_PLATFORM_ADOPTION: ${status}_${pct}pct`);
}

main();
