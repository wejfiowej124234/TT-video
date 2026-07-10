/**
 * FPC-100 B40 · Deployment probes @ ② staging
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EVID, ROOT } = require('./fpc-batch-sequence.cjs');

const FREEZE_CHAIN = [
  'B21', 'B22', 'B23', 'B24', 'B25-C1', 'B25-C2', 'B25-C3', 'B25-C4', 'B25-C5', 'B25-C6',
  'B26', 'B30', 'B31', 'B32', 'B33', 'B34', 'B35', 'B36',
];

function sh(cmd, cwd = ROOT) {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function loadYamlAnchor() {
  const reg = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');
  const raw = fs.readFileSync(reg, 'utf8');
  const commit = raw.match(/^\s*commit:\s*([0-9a-f]{40})/m)?.[1] || null;
  const anchorB3036 = raw.match(/^\s*anchor_b30_b36:\s*([0-9a-f]{40})/m)?.[1] || null;
  return { commit, anchor_b30_b36: anchorB3036 };
}

function loadAuthoritativeSha() {
  const freezePath = path.join(EVID, 'FPC-100-LOCAL-FINAL-FREEZE-LATEST.json');
  let fromFreeze = null;
  if (fs.existsSync(freezePath)) {
    const j = JSON.parse(fs.readFileSync(freezePath, 'utf8'));
    fromFreeze = j.authoritative_immutable_head || null;
  }
  const reg = loadYamlAnchor();
  const sha = fromFreeze || reg.anchor_b30_b36 || reg.commit;
  return { sha, fromFreeze, registry: reg };
}

function verifyFrozenChainReadonly(findings) {
  const rows = [];
  for (const batchId of FREEZE_CHAIN) {
    const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
    if (!fs.existsSync(p)) {
      findings.push({
        id: 'frozen_chain_missing',
        severity: 'P0',
        classification: 'REAL_DEFECT',
        batch_id: batchId,
        detail: 'evidence missing',
      });
      rows.push({ batch_id: batchId, pass: false });
      continue;
    }
    const b = JSON.parse(fs.readFileSync(p, 'utf8'));
    const ok =
      b.certification_frozen === true &&
      (b.verdict === 'PASS' || b.verdict === 'PASS_WITH_WARN') &&
      b.gate_pass !== false;
    if (!ok) {
      findings.push({
        id: 'frozen_chain_break',
        severity: 'P0',
        classification: 'REAL_DEFECT',
        batch_id: batchId,
        detail: `frozen=${b.certification_frozen} verdict=${b.verdict}`,
      });
    }
    rows.push({
      batch_id: batchId,
      pass: ok,
      certification_frozen: b.certification_frozen,
      frozen_git_sha: b.frozen_git_sha,
    });
  }
  return {
    pass: rows.every((r) => r.pass),
    rows,
    pass_count: rows.filter((r) => r.pass).length,
    total: FREEZE_CHAIN.length,
  };
}

async function fetchJson(url, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    const text = await r.text();
    let body = {};
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    return { status: r.status, ok: r.ok, body };
  } finally {
    clearTimeout(t);
  }
}

async function probeRuntimeHealth(stagingApi, stagingWeb, findings) {
  const apiHealth = await fetchJson(`${stagingApi}/health`);
  const webRoot = await fetchJson(`${stagingWeb}/`);
  const apiPass = apiHealth.status === 200;
  const webPass = webRoot.status === 200 || webRoot.status === 304;
  if (!apiPass) {
    findings.push({
      id: 'staging_api_health',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail: `${stagingApi}/health → ${apiHealth.status}`,
    });
  }
  if (!webPass) {
    findings.push({
      id: 'staging_web_health',
      severity: 'P1',
      classification: 'CONFIG_ISSUE',
      detail: `${stagingWeb}/ → ${webRoot.status}`,
    });
  }
  return {
    pass: apiPass,
    api: { url: `${stagingApi}/health`, status: apiHealth.status, body: apiHealth.body },
    web: { url: `${stagingWeb}/`, status: webRoot.status },
  };
}

async function probeMetaSha(stagingApi, authoritativeSha, findings) {
  const meta = await fetchJson(`${stagingApi}/meta`);
  const stagingSha = meta.body?.build?.git_sha || meta.body?.git_sha || null;
  const profile = meta.body?.build?.deployment_profile || null;
  const pass = meta.status === 200 && stagingSha === authoritativeSha;
  if (meta.status !== 200) {
    findings.push({
      id: 'staging_meta_unreachable',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail: `meta status ${meta.status}`,
    });
  } else if (stagingSha !== authoritativeSha) {
    findings.push({
      id: 'meta_sha_mismatch',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail: `expected ${authoritativeSha} got ${stagingSha}`,
      expected_sha: authoritativeSha,
      staging_sha: stagingSha,
    });
  }
  return {
    pass,
    meta_status: meta.status,
    staging_git_sha: stagingSha,
    authoritative_sha: authoritativeSha,
    deployment_profile: profile,
    sha_match: stagingSha === authoritativeSha,
  };
}

async function probeEnvironmentDiff(stagingApi, stagingWeb, authoritativeSha, checklist, findings) {
  const paths = [
    '/api/v1/public/announcements?limit=3',
    '/api/v1/public/roadmap',
    '/api/v1/guides?limit=3',
  ];
  const localApi = process.env.LOCAL_API || 'http://127.0.0.1:8080';
  const localReachable = await fetchJson(`${localApi}/health`, 5000).catch(() => ({ status: 0 }));
  const stagingProbes = {};
  const localProbes = {};
  const drifts = [];

  for (const p of paths) {
    const s = await fetchJson(`${stagingApi}${p}`);
    stagingProbes[p] = { status: s.status, count: countItems(s.body) };
    if (localReachable.status === 200) {
      const l = await fetchJson(`${localApi}${p}`, 8000).catch(() => ({ status: 0, body: {} }));
      localProbes[p] = { status: l.status, count: countItems(l.body) };
      if (l.status === 200 && s.status === 200 && localProbes[p].count !== stagingProbes[p].count) {
        drifts.push({
          path: p,
          local: localProbes[p].count,
          staging: stagingProbes[p].count,
          classification: 'ENVIRONMENT_DRIFT',
        });
      }
    }
  }

  let webAlignPass = false;
  try {
    sh(`bash scripts/dev/check-staging-web-alignment.sh --web-base "${stagingWeb}" --api-base "${stagingApi}"`);
    webAlignPass = true;
  } catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`;
    findings.push({
      id: 'staging_web_alignment',
      severity: 'P1',
      classification: 'CONFIG_ISSUE',
      detail: out.slice(0, 1500),
    });
  }

  const expectedIds = (checklist.expected_environment_differences || []).map((e) => e.id);
  return {
    pass: drifts.length === 0 && webAlignPass,
    local_api_reachable: localReachable.status === 200,
    authoritative_sha: authoritativeSha,
    api_probes: { staging: stagingProbes, local: localProbes },
    count_drifts: drifts,
    expected_differences: expectedIds,
    staging_web_alignment: webAlignPass,
  };
}

function countItems(body) {
  if (!body || typeof body !== 'object') return null;
  return body.items?.length ?? body.announcements?.length ?? body.phases?.length ?? null;
}

function probeRegistryParity(authoritativeSha, metaProbe, findings) {
  const reg = loadYamlAnchor();
  const regSha = reg.anchor_b30_b36 || reg.commit;
  const pass = regSha === authoritativeSha && metaProbe.sha_match;
  if (regSha !== authoritativeSha) {
    findings.push({
      id: 'registry_anchor_drift',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: `registry ${regSha} != authoritative ${authoritativeSha}`,
    });
  }
  return {
    pass,
    registry_anchor: regSha,
    authoritative_sha: authoritativeSha,
    staging_meta_sha: metaProbe.staging_git_sha,
    parity: pass,
  };
}

function probeRollbackDocumentation(checklist, findings) {
  const missing = (checklist.rollback_ssot || []).filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
  const runbook = path.join(ROOT, 'ops/RUNBOOK.md');
  const hasRollback =
    fs.existsSync(runbook) &&
    /rollback|roll back|redeploy|previous release/i.test(fs.readFileSync(runbook, 'utf8'));
  if (missing.length) {
    findings.push({
      id: 'rollback_ssot_missing',
      severity: 'P1',
      classification: 'CONFIG_ISSUE',
      detail: missing.join(','),
    });
  }
  if (!hasRollback) {
    findings.push({
      id: 'rollback_runbook_anchor',
      severity: 'P1',
      classification: 'CONFIG_ISSUE',
      detail: 'ops/RUNBOOK.md missing rollback/redeploy guidance',
    });
  }
  return {
    pass: missing.length === 0 && hasRollback,
    ssot_present: (checklist.rollback_ssot || []).filter((rel) => fs.existsSync(path.join(ROOT, rel))),
    runbook_rollback_anchor: hasRollback,
    probe_note: 'Rollback drill = documented procedure + fly redeploy prior release image (② one-shot)',
  };
}

function runStagingInfraRecheck(stagingApi, findings) {
  const results = [];
  try {
    sh('bash scripts/gates/check-phase3-production-infrastructure-ssot.sh');
    results.push({ gate: 'check-phase3-production-infrastructure-ssot.sh', pass: true });
  } catch (e) {
    results.push({
      gate: 'check-phase3-production-infrastructure-ssot.sh',
      pass: false,
      detail: `${e.stdout || ''}${e.stderr || ''}`.slice(0, 1200),
    });
    findings.push({
      id: 'staging_recheck_b22',
      severity: 'P1',
      classification: 'CONFIG_ISSUE',
      detail: 'B22 infra SSOT gate fail on staging recheck path',
    });
  }

  try {
    sh(`curl -sS --max-time 20 "${stagingApi}/meta" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);process.exit(j.build&&j.build.git_sha?0:1)}catch{process.exit(1)}})"`);
    results.push({ gate: 'B00_meta_contract', pass: true, detail: 'meta.build.git_sha present' });
  } catch {
    results.push({ gate: 'B00_meta_contract', pass: false });
    findings.push({
      id: 'staging_recheck_b00',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail: 'staging /meta missing build.git_sha',
    });
  }

  return {
    pass: results.every((r) => r.pass),
    batches: ['B00', 'B01', 'B04', 'B21', 'B22'],
    results,
    note: 'Full corridor gates run @ ① frozen; staging recheck = health/meta/infra SSOT only',
  };
}

function classifyFindings(findings) {
  const buckets = { ENVIRONMENT_DRIFT: 0, CONFIG_ISSUE: 0, REAL_DEFECT: 0, UNCLASSIFIED: 0 };
  for (const f of findings) {
    const k = f.classification || 'UNCLASSIFIED';
    buckets[k] = (buckets[k] || 0) + 1;
  }
  return buckets;
}

module.exports = {
  loadAuthoritativeSha,
  verifyFrozenChainReadonly,
  probeRuntimeHealth,
  probeMetaSha,
  probeEnvironmentDiff,
  probeRegistryParity,
  probeRollbackDocumentation,
  runStagingInfraRecheck,
  classifyFindings,
  FREEZE_CHAIN,
};
