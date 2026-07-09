#!/usr/bin/env node
/**
 * PCP Platform Status — registry + latest authenticity evidence sign-off (read-only)
 *
 *   node scripts/dev/validate-pcp-platform-status.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG = path.join(ROOT, 'registry/public-content-platform.v1.yaml');
const STATUS_DOC = path.join(ROOT, 'docs/runbook/PCP-PLATFORM-STATUS.md');
const REQUIRED_KEYS = [
  'TT_PCP_PLATFORM: CLOSED',
  'TT_PCP_ARCHITECTURE: FROZEN',
  'TT_PCP_IMPLEMENTATION: COMPLETE',
  'TT_PCP_ALIGNMENT: VERIFIED',
  'TT_PCP_RUNTIME_STAGING: VERIFIED',
  'TT_PCP_ACTIVE_DEVELOPMENT: false',
];

function findLatestAuthenticityEvidence() {
  const base = path.join(ROOT, 'evidence', 'GO_public_content_platform');
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base)
    .filter((d) => fs.existsSync(path.join(base, d, 'pcp-phase12-alignment-final.json')))
    .sort()
    .reverse();
  if (!dirs.length) return null;
  try {
    const j = JSON.parse(fs.readFileSync(path.join(base, dirs[0], 'pcp-phase12-alignment-final.json'), 'utf8'));
    return { stamp: dirs[0], verdict: j.verdict?.overall, blockers: j.summary?.blocker_gaps };
  } catch {
    return null;
  }
}

function main() {
  const checks = [];
  const reg = fs.readFileSync(REG, 'utf8');
  for (const k of REQUIRED_KEYS) {
    checks.push({ id: k.split(':')[0], pass: reg.includes(k) });
  }
  checks.push({ id: 'PCP_PLATFORM_STATUS_DOC', pass: fs.existsSync(STATUS_DOC) });
  const evid = findLatestAuthenticityEvidence();
  checks.push({
    id: 'AUTHENTICITY_EVIDENCE',
    pass: evid && evid.verdict === 'ALIGNED' && evid.blockers === 0,
    detail: evid ? `${evid.stamp} · ${evid.verdict}` : 'missing',
  });

  console.log('PCP Platform Status validation');
  console.log('─'.repeat(50));
  for (const c of checks) {
    console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.id}${c.detail ? ` — ${c.detail}` : ''}`);
  }
  console.log('─'.repeat(50));
  console.log(
    'TT_PCP_PLATFORM: CLOSED · TT_PCP_ARCHITECTURE: FROZEN · TT_PCP_IMPLEMENTATION: COMPLETE · TT_PCP_ALIGNMENT: VERIFIED · TT_PCP_RUNTIME_STAGING: VERIFIED · TT_PCP_RUNTIME_LOCAL: SKIPPED'
  );

  if (!checks.every((c) => c.pass)) process.exit(1);
}

main();
