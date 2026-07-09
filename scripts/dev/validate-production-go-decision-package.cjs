#!/usr/bin/env node
/**
 * Production GO Decision Package — sole authority for TT_PRODUCTION_GO: GO
 *
 *   node scripts/dev/validate-production-go-decision-package.cjs \
 *     --package evidence/GO_production_readiness/production-go-decision/<stamp>/production-go-decision-package.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const REG_G3 = path.join(ROOT, 'registry/g3-production-domains.v1.json');
const REQUIRED_GATES = [
  'TT_PRODUCTION_READINESS_G1_GATE',
  'TT_PRODUCTION_READINESS_G2_GATE',
  'TT_PRODUCTION_READINESS_G3_GATE',
];

function parseArgs() {
  const args = { packagePath: '', writeMatrix: false };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--package') args.packagePath = process.argv[++i];
    if (process.argv[i] === '--write-matrix') args.writeMatrix = true;
  }
  return args;
}

function machineKey(yaml, key) {
  const m = yaml.match(new RegExp(`${key}: ([A-Z_0-9]+)`));
  return m ? m[1] : null;
}

function main() {
  const { packagePath, writeMatrix } = parseArgs();
  if (!packagePath) {
    console.error('Usage: --package evidence/.../production-go-decision-package.json [--write-matrix]');
    process.exit(1);
  }

  const pkgAbs = path.isAbsolute(packagePath) ? packagePath : path.join(ROOT, packagePath);
  if (!fs.existsSync(pkgAbs)) {
    console.error('Missing decision package:', packagePath);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgAbs, 'utf8'));
  const matrixYaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const g3Reg = JSON.parse(fs.readFileSync(REG_G3, 'utf8'));
  const expectedDomains = g3Reg.domains.map((d) => d.id);

  const checks = [];

  for (const gate of REQUIRED_GATES) {
    const live = machineKey(matrixYaml, gate);
    const pkgVal = pkg.machine_keys?.[gate];
    const pass = live === 'PASS' && pkgVal === 'PASS';
    checks.push({ id: gate, pass, live, pkg: pkgVal });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${gate} live=${live} package=${pkgVal}`);
  }

  const g3Complete = Array.isArray(pkg.g3_domains_complete)
    ? expectedDomains.every((id) => pkg.g3_domains_complete.includes(id))
    : false;
  checks.push({ id: 'g3_domains_complete', pass: g3Complete });
  console.log(`${g3Complete ? 'PASS' : 'FAIL'} g3_domains_complete (${expectedDomains.join(', ')})`);

  const ownerOk =
    pkg.owner_attestation?.decision === 'GO' &&
    !!pkg.owner_attestation?.signed_utc &&
    !!pkg.owner_attestation?.name;
  checks.push({ id: 'owner_attestation', pass: ownerOk });
  console.log(`${ownerOk ? 'PASS' : 'FAIL'} owner_attestation GO + signed_utc`);

  const verdictGo = pkg.verdict === 'GO' && pkg.machine_keys?.TT_PRODUCTION_GO === 'GO';
  checks.push({ id: 'verdict', pass: verdictGo });
  console.log(`${verdictGo ? 'PASS' : 'FAIL'} verdict GO`);

  const allPass = checks.every((c) => c.pass);
  if (!allPass) {
    console.log('TT_PRODUCTION_GO: NO_GO (decision package incomplete or gates not PASS)');
    process.exit(1);
  }

  if (writeMatrix) {
    let yaml = matrixYaml;
    yaml = yaml.replace(/TT_PRODUCTION_GO: \w+/, 'TT_PRODUCTION_GO: GO');
    yaml = yaml.replace(/updated_utc: "[^"]+"/, `updated_utc: "${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}"`);
    fs.writeFileSync(REG_MATRIX, yaml);
    console.log('Matrix updated: TT_PRODUCTION_GO: GO');
  }

  console.log('TT_PRODUCTION_GO_DECISION_PACKAGE: VALID');
  console.log('TT_PRODUCTION_GO: GO (sole criterion satisfied — G1 + G2 + G3 PASS)');
}

main();
