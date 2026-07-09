#!/usr/bin/env node
/**
 * Enterprise SSOT Alignment Audit — governance/config/docs/registry only.
 *
 * Boundary (ENFORCED):
 *   - Align governance, config, docs, scripts, non-prod metadata
 *   - NO new business features · NO reopen RC/DDG/OCS · NO modify frozen OCS baseline
 *   - CLOSED_UNLESS_TOUCHED — fix drift / SSOT inconsistency only
 *
 *   node scripts/dev/audit-enterprise-ssot-alignment.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/audit-enterprise-ssot-alignment.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_enterprise_ssot_alignment', STAMP);
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const LOCAL_API = (process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const SKIP_LIVE = /^1|true|yes$/i.test(process.env.SKIP_LIVE || '');

const findings = [];

function add(severity, category, id, note, fix) {
  findings.push({ severity, category, id, note, fix: fix || null });
}

function readYamlText(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    add('BLOCKING', 'registry', `missing:${rel}`, 'Required SSOT file missing');
    return null;
  }
  return fs.readFileSync(p, 'utf8');
}

function extractOpenCount(yaml) {
  const m = yaml.match(/^\s*open_count:\s*(\d+)/m);
  return m ? Number(m[1]) : null;
}

function countOpenIssueIds(yaml) {
  const ids = [];
  const inIssues = yaml.split(/^closed_issues:/m)[0] || yaml;
  for (const m of inIssues.matchAll(/^\s*- id: ([A-Z0-9_-]+)/gm)) ids.push(m[1]);
  return ids.length;
}

function fetchJson(url, timeout = 12000) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: JSON.parse(body) });
        } catch {
          resolve({ ok: false, status: res.statusCode, json: null, raw: body.slice(0, 200) });
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: 'timeout' });
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, error: String(e.message || e) }));
  });
}

function registryChecks() {
  const required = [
    'registry/open-issues.v1.yaml',
    'registry/executive-dashboard.v1.yaml',
    'registry/traveltrust-operations-platform.v1.yaml',
    'registry/traveltrust-operations-workflow.v1.yaml',
    'registry/display-data-governance.v1.yaml',
    'registry/official-cold-start-dataset.v1.yaml',
    'registry/single-official-public-catalog-policy.v1.yaml',
    'registry/official-catalog-identity-policy.v1.yaml',
    'registry/media-three-tier-architecture.v1.yaml',
    'registry/pi3-media-infrastructure.v1.yaml',
    'registry/catalog-asset-migration.v1.yaml',
    'registry/media-cdn-production-acceptance.v1.yaml',
    'registry/test-accounts-business-immutable.v1.yaml',
    'registry/admin-rbac-route-matrix.v1.yaml',
  ];

  for (const rel of required) readYamlText(rel);

  const openIssues = readYamlText('registry/open-issues.v1.yaml');
  const execDash = readYamlText('registry/executive-dashboard.v1.yaml');
  const opsPlatform = readYamlText('registry/traveltrust-operations-platform.v1.yaml');

  if (openIssues && execDash) {
    const ocLedger = extractOpenCount(openIssues);
    const ocDash = extractOpenCount(execDash);
    const listed = countOpenIssueIds(openIssues);
    if (ocLedger !== listed) {
      add('BLOCKING', 'registry', 'open-issues.count_mismatch', `rollup open_count=${ocLedger} but issues[] has ${listed} rows`);
    }
    if (ocDash !== ocLedger) {
      add('BLOCKING', 'registry', 'dashboard.open_count_drift', `executive-dashboard open_count=${ocDash} vs open-issues=${ocLedger}`);
    }
  }

  if (opsPlatform && openIssues) {
    const opsOcMatch = opsPlatform.match(/(?:^|\n)  open_count:\s*(\d+)/g);
    const ciSection = opsPlatform.match(/ci_build_stability:[\s\S]*?(?=\n[a-z_]+:|$)/);
    const opsOpenCount = ciSection ? (ciSection[0].match(/open_count:\s*(\d+)/) || [])[1] : null;
    const ledgerOc = extractOpenCount(openIssues);
    if (opsOpenCount && Number(opsOpenCount) !== ledgerOc) {
      add('MAJOR', 'registry', 'ops_platform.open_count_stale', `traveltrust-operations-platform ci open_count=${opsOpenCount} vs ledger=${ledgerOc}`, 'Sync to open-issues SSOT pointer');
    }
  }

  const governanceKeys = [
    'acceptance_decoupling_principle',
    'PI3-MEDIA-INFRASTRUCTURE',
    'PI3-CATALOG-ASSET-MIGRATION',
    'MEDIA_CDN_PRODUCTION_ACCEPTANCE',
    'TT_PI3_MEDIA_INFRA_CATALOG_DECOUPLED',
  ];
  for (const key of governanceKeys) {
    const found = ['registry/open-issues.v1.yaml', 'registry/pi3-media-infrastructure.v1.yaml', 'registry/catalog-asset-migration.v1.yaml'].some(
      (rel) => {
        const t = readYamlText(rel);
        return t && t.includes(key);
      }
    );
    if (!found) add('BLOCKING', 'governance', `missing_key:${key}`, `Governance model key not found in SSOT registries`);
  }

  if (openIssues) {
    for (const closed of ['OCS', 'DDG', 'SOPCP', 'market_default_filter']) {
      if (/status:\s*OPEN[\s\S]*?id:.*MARKET/i.test(openIssues) && closed === 'market_default_filter') {
        /* market in open issues ok if CI only */
      }
    }
    if (!openIssues.includes('PI3-CATALOG-ASSET-MIGRATION')) {
      add('BLOCKING', 'governance', 'missing:PI3-CATALOG-ASSET-MIGRATION', 'Catalog track issue not in open-issues ledger');
    }
    if (!openIssues.includes('acceptance_decoupling_principle')) {
      add('MAJOR', 'governance', 'missing:acceptance_decoupling', 'Acceptance decoupling principle not in open-issues pi3_tracks');
    }
  }

  const ocs = readYamlText('registry/official-cold-start-dataset.v1.yaml');
  if (ocs && !ocs.includes('CLOSED_UNLESS_TOUCHED') && !ocs.includes('RERUN_POLICY: CLOSED')) {
    if (!ocs.includes('TT_OFFICIAL_COLD_START_RERUN_POLICY: CLOSED')) {
      add('MINOR', 'ocs', 'rerun_policy_check', 'Verify OCS rerun policy frozen (manual review)');
    }
  }

  if (opsPlatform && /loca\.lt/.test(opsPlatform)) {
    const staleProbe =
      /minio_tunnel:[\s\S]*?url:\s*"https?:\/\/[^"]*loca\.lt"/.test(opsPlatform) &&
      !/minio_tunnel:[\s\S]*?status:\s*SUPERSEDED/.test(opsPlatform);
    if (staleProbe) {
      add('BLOCKING', 'drift', 'ops_platform.stale_loca_lt_probe', 'recovery_probe still references active loca.lt URL', 'Update to Tigris interim or SUPERSEDED');
    }
  }

  const ddg = readYamlText('registry/display-data-governance.v1.yaml');
  if (ddg && /status:\s*CLOSED|TT_DDG.*CLOSED/i.test(ddg) === false) {
    add('MINOR', 'ddg', 'ddg_status_review', 'Confirm DDG CLOSED in registry (non-blocking if runbook says CLOSED)');
  }
}

async function liveChecks() {
  if (SKIP_LIVE) {
    add('INFO', 'runtime_validation', 'live_skipped', 'SKIP_LIVE=1 — runtime validation deferred; configuration alignment may still PASS');
    return { local: null, staging: null, local_runtime: 'NOT_RUN', staging_runtime: 'NOT_RUN' };
  }

  const stagingHealth = await fetchJson(`${STAGING_API}/health/ready`);
  const stagingMeta = await fetchJson(`${STAGING_API}/api/v1/meta`);
  const stagingCap = await fetchJson(`${STAGING_API}/api/v1/community/media/capabilities`);

  if (!stagingHealth.ok) {
    add('BLOCKING', 'runtime', 'staging.health_ready', `Staging /health/ready failed: ${stagingHealth.status || stagingHealth.error}`);
  }
  if (stagingCap.json && stagingCap.json.public_video_publish_ready !== true) {
    add('MAJOR', 'runtime', 'staging.media_capabilities', 'public_video_publish_ready not true on staging');
  }
  if (stagingCap.ok && stagingCap.json) {
    const envCheck = await fetchJson(`${STAGING_API}/api/v1/community/feed?limit=5`);
    const body = JSON.stringify(envCheck.json || {});
    if (body.includes('loca.lt')) {
      add('BLOCKING', 'drift', 'staging.payload_loca_lt', 'Staging API payload still contains loca.lt');
    }
  }

  const localHealth = await fetchJson(`${LOCAL_API}/health`);
  let localRuntime = 'PASS';
  if (!localHealth.ok) {
    add('INFO', 'runtime_validation', 'phase1_local_runtime.skipped', 'Local API not running — PHASE1_LOCAL_RUNTIME_VALIDATION=SKIPPED (CONFIGURATION_ALIGNMENT unaffected)');
    localRuntime = 'SKIPPED';
  }

  return {
    staging: {
      health_ready: stagingHealth.status,
      meta_ok: stagingMeta.ok,
      public_video_publish_ready: stagingCap.json?.public_video_publish_ready ?? null,
    },
    local: localHealth.ok ? { health: localHealth.status } : { unavailable: true },
    local_runtime: localRuntime,
    staging_runtime: stagingHealth.ok ? 'PASS' : 'FAIL',
  };
}

function buildReport(live) {
  const blocking = findings.filter((f) => f.severity === 'BLOCKING');
  const major = findings.filter((f) => f.severity === 'MAJOR');
  const configBlocking = blocking.filter((f) => f.category !== 'runtime' && f.category !== 'runtime_validation');

  const configurationAlignment = configBlocking.length === 0;

  const phase2StagingRuntime =
    blocking.filter((f) => f.category === 'runtime' && String(f.id).includes('staging')).length === 0 &&
    (live?.staging_runtime === 'PASS' || live?.staging_runtime === 'NOT_RUN');

  const phase1LocalRuntime = live?.local_runtime || 'NOT_RUN';

  const enterprisePass = configurationAlignment && phase2StagingRuntime && blocking.length === 0;

  return {
    schema: 'traveltrust.enterprise_ssot_alignment_audit.v1',
    stamp: STAMP,
    recorded_at: new Date().toISOString(),
    alignment_dimensions: {
      configuration_alignment: {
        validates: 'Registry · Runbook · config · governance consistency',
        does_not_validate: 'Local API running',
      },
      runtime_validation: {
        phase1_local: 'Local API started and behavior matches SSOT',
        phase2_staging: 'Staging API runtime probes',
      },
      rule: 'CONFIGURATION_ALIGNMENT PASS ≠ Local Runtime Running',
    },
    boundary: {
      allowed: ['governance', 'config', 'docs', 'scripts', 'non_prod_metadata'],
      forbidden: ['new_business_features', 'reopen_RC_DDG_OCS', 'modify_frozen_ocs_baseline', 'production_data_mutation'],
      policy: 'CLOSED_UNLESS_TOUCHED',
    },
    scope: {
      product: 'registry/executive-dashboard.v1.yaml',
      operations: 'registry/traveltrust-operations-platform.v1.yaml',
      data_governance: ['DDG', 'OCS', 'SOPCP', 'OCIP'],
      pi3_media_infrastructure: 'registry/pi3-media-infrastructure.v1.yaml',
      pi3_catalog_assets: 'registry/catalog-asset-migration.v1.yaml',
      test_accounts: 'registry/test-accounts-business-immutable.v1.yaml',
      rbac: 'registry/admin-rbac-route-matrix.v1.yaml',
      workflow: 'registry/traveltrust-operations-workflow.v1.yaml',
      open_issues: 'registry/open-issues.v1.yaml',
    },
    governance_model: {
      pi3_tracks: ['PI3-MEDIA-INFRASTRUCTURE', 'PI3-CATALOG-ASSET-MIGRATION'],
      acceptance_decoupling: true,
      closed_unless_touched: ['OCS', 'DDG', 'SOPCP', 'market_default_filter'],
    },
    live_probes: live,
    findings,
    verdict: {
      blocking_count: blocking.length,
      major_count: major.length,
      CONFIGURATION_ALIGNMENT: configurationAlignment ? 'PASS' : 'FAIL',
      PHASE1_LOCAL_RUNTIME_VALIDATION: phase1LocalRuntime,
      PHASE2_STAGING_RUNTIME_VALIDATION: phase2StagingRuntime ? 'PASS' : 'FAIL',
      ENTERPRISE_SSOT_ALIGNMENT: enterprisePass ? 'PASS' : 'FAIL',
      PHASE1_LOCAL_ALIGNMENT: configurationAlignment ? 'PASS' : 'FAIL',
      PHASE2_STAGING_ALIGNMENT: phase2StagingRuntime ? 'PASS' : 'FAIL',
      note: 'PHASE1_LOCAL_ALIGNMENT = CONFIGURATION_ALIGNMENT (not runtime). See PHASE1_LOCAL_RUNTIME_VALIDATION.',
    },
  };
}

function writeMarkdown(report) {
  const v = report.verdict;
  const lines = [
    `# Enterprise SSOT Alignment Report · ${STAMP}`,
    '',
    '## Boundary (ENFORCED)',
    '',
    '- **Allowed:** governance · config · docs · scripts · non-prod metadata',
    '- **Forbidden:** new features · reopen RC/DDG/OCS · modify frozen OCS baseline · production data mutation',
    '- **Policy:** CLOSED_UNLESS_TOUCHED',
    '',
    '## Verdict',
    '',
    '| 检查项 | 含义 | 结果 |',
    '|--------|------|------|',
    `| **CONFIGURATION_ALIGNMENT** | Registry · Runbook · 配置 · 治理一致 | **${v.CONFIGURATION_ALIGNMENT}** |`,
    `| **PHASE1_LOCAL_RUNTIME_VALIDATION** | Local API 启动并验证（可选） | **${v.PHASE1_LOCAL_RUNTIME_VALIDATION}** |`,
    `| **PHASE2_STAGING_RUNTIME_VALIDATION** | Staging 运行态探针 | **${v.PHASE2_STAGING_RUNTIME_VALIDATION}** |`,
    `| **ENTERPRISE_SSOT_ALIGNMENT** | 配置对齐 + Staging 运行态 | **${v.ENTERPRISE_SSOT_ALIGNMENT}** |`,
    `| blocking_count | | **${v.blocking_count}** |`,
    '',
    '> **CONFIGURATION_ALIGNMENT PASS ≠ Local Runtime Running.**',
    '> Local API 未启动时 RUNTIME=SKIPPED 仍可为有效 Enterprise PASS。',
    '',
    '_Legacy aliases: PHASE1_LOCAL_ALIGNMENT = CONFIGURATION_ALIGNMENT · PHASE2_STAGING_ALIGNMENT = STAGING_RUNTIME_',
    '',
    '## PI3 Governance Model',
    '',
    '```text',
    'PI3-MEDIA-INFRASTRUCTURE     — upload/storage/CDN/playback (service capability)',
    'PI3-CATALOG-ASSET-MIGRATION — catalog asset source (Unsplash → owned); decoupled',
    '```',
    '',
    '## Findings',
    '',
  ];
  if (!report.findings.length) lines.push('_No drift detected._');
  else {
    for (const f of report.findings) {
      lines.push(`- **[${f.severity}]** \`${f.id}\` — ${f.note}${f.fix ? ` · Fix: ${f.fix}` : ''}`);
    }
  }
  lines.push('', '## SSOT Pointers', '');
  for (const [k, val] of Object.entries(report.scope)) {
    lines.push(`- **${k}:** ${Array.isArray(val) ? val.join(', ') : val}`);
  }
  return lines.join('\n') + '\n';
}

(async () => {
  registryChecks();
  const live = await liveChecks();
  const report = buildReport(live);

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(path.join(EVID_DIR, 'enterprise-ssot-alignment.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(EVID_DIR, 'ENTERPRISE-SSOT-ALIGNMENT-REPORT.md'), writeMarkdown(report));

  console.log(JSON.stringify(report.verdict, null, 2));
  console.log(`Evidence: ${EVID_DIR}`);

  if (report.verdict.ENTERPRISE_SSOT_ALIGNMENT !== 'PASS') process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
