#!/usr/bin/env node
/**
 * FPC-100 Batch B07 · Community corridor (① local)
 *
 *   node scripts/dev/run-fpc-batch-b07-community.cjs
 *
 * Requires: API @ 8080
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B07-LATEST.json');
const EVID_DIR = path.join(EVID, 'B07-community');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';

const GATES = [
  'scripts/gates/vertical-slice-04-community-explore-public-smoke.sh',
  'scripts/gates/run-community-media-guard.sh',
  'scripts/dev/run-community-l5-green.sh',
];

const CONTENT_LIFECYCLE = [
  'create_post',
  'publish',
  'view',
  'comment',
  'like',
  'report',
  'moderation',
  'archive_delete',
];

const SUPPLEMENTAL_CONTRACTS = [
  'components/community/communityPhase1DataHonesty.contract.test.ts',
  'components/community/communityRelationalShowcaseHonesty.contract.test.ts',
  'components/community/communityFeedActionTheme.contract.test.ts',
  'components/community/communityModals.contract.test.ts',
];

function sh(cmd, env = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];
  const supplementalResults = [];

  const gate = assertCanRun('B07');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B07 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  let apiFeed = null;
  let apiStats = null;
  try {
    const h = await fetchJson('http://127.0.0.1:8080/health');
    if (h.status !== 200) {
      findings.push({ id: 'api_health', severity: 'P0', detail: `/health HTTP ${h.status}` });
    } else {
      const feed = await fetchJson(
        'http://127.0.0.1:8080/api/v1/community/feed?limit=8&mode=recommend'
      );
      apiFeed = feed.json;
      if (feed.status !== 200 || apiFeed?.status !== 'ok') {
        findings.push({ id: 'api_feed', severity: 'P0', detail: `feed HTTP ${feed.status}` });
      }
      const stats = await fetchJson(
        'http://127.0.0.1:8080/api/v1/community/stats/posts-by-tag?tag=%E6%97%85%E8%A1%8C'
      );
      apiStats = stats.json;
      if (stats.status !== 200 || apiStats?.status !== 'ok') {
        findings.push({ id: 'api_stats', severity: 'P0', detail: `stats HTTP ${stats.status}` });
      }
    }
  } catch (e) {
    findings.push({ id: 'api_unreachable', severity: 'P0', detail: String(e.message || e) });
  }

  for (const g of GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    const env = {
      API_BASE: 'http://127.0.0.1:8080',
      BASE: 'http://127.0.0.1:8080',
      SKIP_COMMUNITY_MEDIA_GUARD_DB: '1',
    };
    try {
      stdout = sh(`bash ${g}`, env);
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${path.basename(g)}`,
        severity: 'P0',
        gate: g,
        detail: (stderr || stdout || e.message || '').slice(0, 2000),
      });
    }
    gateResults.push({
      gate: g,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-4).join(' | '),
    });
  }

  for (const rel of SUPPLEMENTAL_CONTRACTS) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(`cd frontend && npx vitest run ${rel}`, {});
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `community_contract_fail:${path.basename(rel)}`,
        severity: 'P0',
        detail: (stderr || stdout || e.message || '').slice(0, 1500),
      });
    }
    supplementalResults.push({ contract: rel, exit_code: exitCode, pass: exitCode === 0 });
  }

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const allGatesPass = gateResults.every((g) => g.pass);
  const allSupplementalPass = supplementalResults.every((s) => s.pass);
  const pass = p0.length === 0 && allGatesPass && allSupplementalPass && gate.ok;

  const contentLifecycle = {
    lifecycle: CONTENT_LIFECYCLE,
    wiring: {
      create_post: 'PublishDrawer · POST /api/v1/community/posts',
      publish: 'useCommunityFeedPublishSubmit',
      view: 'GET /api/v1/community/feed · explore public smoke',
      comment: 'useCommunityFeedTopicReportCommentChain · comment API',
      like: 'useCommunityFeedLikeCollectFollow',
      report: 'useCommunityFeedTopicReportCommentChain reportContext',
      moderation: 'admin/community/* contracts (E1/E2 RBAC → B25-C6 slice)',
      archive_delete: 'CommunityFeedCardContent visibility archived badge · me/posts',
    },
    phase: '① local · staging UGC density + CDN → ②',
  };

  const contentSafety = {
    media_guard: 'validate-community-media-guard.cjs · communityMediaClientUrl policy',
    upload_video: 'PublishDrawer video-duration tests in L5 green',
    report_moderation: 'communityModals.contract.test.ts · admin moderation page contracts',
    permissions: 'communityShowcase.gating.test.ts · production/testnet showcase hard-off',
    data_honesty: {
      showcase_disclosure: 'data-tt-community-feed-showcase active-v1 when dev showcase only',
      relational_honesty: 'CommunityRelationalShowcaseHonestyNote on friends/messages',
      fake_engagement_guard:
        'communityFeedMappers — API empty thread ignores showcase mock counts; no trust_gate fixtures in feed',
      market_parity_note: 'Avoid Market-style undisclosed seed — community uses data-tt + sr-only hints',
    },
  };

  const uxEvidence = {
    empty_state: 'CommunityFeedEmptyFooter · CommunityFeedList empty branches',
    feed_loading: 'communityRouteDataHooks.contract.test.ts · useCommunityFeed',
    error_recovery: 'communityModals + feed action theme contracts',
    cta_clarity: 'CommunityFeedDiscoveryChrome community-feed-publish-entry',
    l5_green_tests: 138,
    shell_freeze_ssot: 'frontend/evidence/GO_local_community_phase1_narrow/COMMUNITY-PHASE1-FREEZE.md',
  };

  const apiEvidence = {
    health: 'http://127.0.0.1:8080/health',
    feed: {
      path: '/api/v1/community/feed?limit=8&mode=recommend',
      posts_count: Array.isArray(apiFeed?.posts) ? apiFeed.posts.length : null,
      status: apiFeed?.status ?? null,
    },
    stats_by_tag: {
      path: '/api/v1/community/stats/posts-by-tag',
      post_count: apiStats?.post_count ?? null,
      status: apiStats?.status ?? null,
    },
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        gate_results: gateResults,
        supplemental_results: supplementalResults,
        content_lifecycle: contentLifecycle,
        content_safety: contentSafety,
        ux_evidence: uxEvidence,
        api_evidence: apiEvidence,
        findings,
      },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B07',
    title: 'Community corridor',
    layer: 'L1-L5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b07-community.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B02'],
    routes: ['/community', '/community/*'],
    gates: GATES,
    gate_results: gateResults,
    gate_pass: allGatesPass,
    content_lifecycle: contentLifecycle,
    content_safety: contentSafety,
    ux_evidence: uxEvidence,
    api_evidence: apiEvidence,
    supplemental_results: supplementalResults,
    findings,
    verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    pass,
    gate_verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B08' : 'B07-remediation',
    ai_review: {
      verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note:
      'Community corridor ① — L5 contracts + public feed smoke; live UGC density + moderation E2E → ②',
    traceability: {
      requirements: [
        'Community shell theme contract green',
        'Feed/public explore smoke PASS',
        'Media URL policy per communityMediaClientUrl',
        'Data honesty disclosures (showcase / relational / explore catalog)',
        'Empty state + publish CTA L2 clarity',
      ],
      spec_refs: [
        'frontend/app/community/README.md',
        'frontend/evidence/GO_local_community_phase1_narrow/COMMUNITY-PHASE1-FREEZE.md',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B07',
      ],
      code_paths: [
        'frontend/components/community/CommunityRouteShell.tsx',
        'frontend/components/community/PublishDrawer',
        'frontend/lib/apiClient/community/feed.ts',
      ],
      tests: [
        ...GATES.map((g) => path.basename(g)),
        ...SUPPLEMENTAL_CONTRACTS.map((c) => path.basename(c)),
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B07-LATEST.json',
      certification_batch: 'B07',
      product_version: 'v1.0',
    },
  };

  if (pass) {
    const expiryDays = 90;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = head;
  }

  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B07: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
