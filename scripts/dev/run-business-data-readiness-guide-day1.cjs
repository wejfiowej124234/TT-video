#!/usr/bin/env node
/** @deprecated wrapper · use run-guide-business-data-readiness-probes.cjs */
require('child_process').execSync('node scripts/dev/run-guide-business-data-readiness-probes.cjs', {
  cwd: require('path').join(__dirname, '../..'),
  stdio: 'inherit',
  env: process.env,
});
