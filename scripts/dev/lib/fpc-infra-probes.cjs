/**
 * FPC B22 · DR / infra / fly deploy SSOT probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

function readYamlValue(text, key) {
  const m = text.match(new RegExp(`^\\s*${key}:\\s*['"]?([^'"\n#]+)`, 'm'));
  return m ? m[1].trim() : null;
}

function parseTomlApp(tomlText) {
  const m = tomlText.match(/^app\s*=\s*['"]([^'"]+)['"]/m);
  return m ? m[1] : null;
}

function parseTomlEnv(tomlText, key) {
  const block = tomlText.match(/\[env\][\s\S]*?(?=\n\[|$)/);
  if (!block) return null;
  const m = block[0].match(new RegExp(`^\\s*${key}\\s*=\\s*['"]([^'"]+)['"]`, 'm'));
  return m ? m[1] : null;
}

async function fetchJson(url, { method = 'GET' } = {}) {
  const res = await fetch(url, {
    method,
    signal: AbortSignal.timeout(45000),
  });
  let json = null;
  let text = '';
  try {
    text = await res.text();
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function probeMetaLocalProfile(apiBase, spec, findings) {
  const row = await fetchJson(`${apiBase}${spec.path}`);
  const profile = row.json?.build?.deployment_profile;
  const pass = row.status === 200 && profile === spec.require_deployment_profile;
  if (!pass) {
    findings.push({
      id: 'live_meta_local_profile',
      severity: 'P0',
      detail: `deployment_profile=${profile} expected=${spec.require_deployment_profile}`,
    });
  }
  return {
    id: 'live_meta_local_profile',
    domain: 'meta_local_deployment_profile',
    pass,
    deployment_profile: profile,
  };
}

async function probeHealthReady(apiBase, spec, findings) {
  const row = await fetchJson(`${apiBase}${spec.path}`);
  const pass = spec.allowed.includes(row.status);
  if (!pass) {
    findings.push({
      id: 'live_health_ready',
      severity: 'P0',
      detail: `GET ${spec.path} HTTP ${row.status}`,
    });
  }
  return { id: 'live_health_ready', domain: 'phase3_infra_registry_ssot', pass, http: row.status };
}

function collectStagingApiHosts(root) {
  const hosts = new Set();
  const files = [
    'registry/admin-platform-production-readiness.v1.yaml',
    'registry/display-data-governance.v1.yaml',
    'registry/staging-rc-baseline.v1.yaml',
    'registry/frontend-runtime-consistency-gate.v1.yaml',
  ];
  for (const rel of files) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    for (const m of text.matchAll(/https:\/\/tt-api-staging\.fly\.dev/g)) {
      hosts.add(m[0]);
    }
    for (const m of text.matchAll(/staging_api(?:_base)?:\s*(https:\/\/[^\n]+)/g)) {
      hosts.add(m[1].trim());
    }
    for (const m of text.matchAll(/api_default:\s*(https:\/\/[^\n]+)/g)) {
      hosts.add(m[1].trim());
    }
  }
  return [...hosts];
}

function runStaticSsotChecks(root, findings) {
  const checks = [];
  const phase3Path = path.join(root, 'registry/phase3-production-infrastructure.v1.yaml');
  const phase3 = fs.readFileSync(phase3Path, 'utf8');
  const interimApi = readYamlValue(phase3, 'api') || phase3.match(/interim_prod_hosts:[\s\S]*?api:\s*(https:\/\/[^\n]+)/)?.[1];
  const clusterId =
    phase3.match(/mpg_cluster_id:\s*(\w+)/)?.[1] ||
    phase3.match(/cluster[= ](q49ypo4e98pr17ln)/)?.[1];

  const prodToml = fs.readFileSync(path.join(root, 'deploy/fly/tt-api-prod/fly.toml'), 'utf8');
  const stagingToml = fs.readFileSync(path.join(root, 'deploy/fly/tt-api-staging/fly.toml'), 'utf8');
  const prodApp = parseTomlApp(prodToml);
  const stagingApp = parseTomlApp(stagingToml);

  const hostAppOk = interimApi && interimApi.includes(String(prodApp));
  if (!hostAppOk) {
    findings.push({
      id: 'static_interim_host_app',
      severity: 'P0',
      detail: `interim api ${interimApi} vs fly app ${prodApp}`,
    });
  }
  checks.push({
    id: 'ssot_interim_host_app',
    domain: 'fly_deploy_manifest_parity',
    pass: hostAppOk,
    interim_api: interimApi,
    prod_app: prodApp,
  });

  const stagingRc = fs.readFileSync(path.join(root, 'registry/staging-rc-baseline.v1.yaml'), 'utf8');
  const rcOk = stagingRc.includes(stagingApp);
  if (!rcOk) {
    findings.push({
      id: 'static_staging_rc_app',
      severity: 'P1',
      detail: `staging-rc missing ${stagingApp}`,
    });
  }
  checks.push({
    id: 'ssot_staging_rc_app',
    domain: 'fly_deploy_manifest_parity',
    pass: rcOk,
    staging_app: stagingApp,
  });

  const b475Path = path.join(root, 'evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json');
  let b475Ok = false;
  if (fs.existsSync(b475Path)) {
    const b475 = JSON.parse(fs.readFileSync(b475Path, 'utf8'));
    b475Ok =
      b475.status === 'PASS' &&
      String(b475.wal_archive_destination_desc || '').includes(clusterId || 'q49ypo4e98pr17ln');
    if (!b475Ok) {
      findings.push({
        id: 'static_b475_cluster',
        severity: 'P0',
        detail: 'b475 baseline cluster/status mismatch vs phase3 registry',
      });
    }
  } else {
    findings.push({ id: 'static_b475_missing', severity: 'P0', detail: b475Path });
  }
  checks.push({
    id: 'ssot_b475_baseline',
    domain: 'pg_backup_baseline_pitr',
    pass: b475Ok,
    path: 'evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json',
  });

  const timeoutStaging = parseTomlEnv(stagingToml, 'REQUEST_TIMEOUT_SECS');
  const timeoutProd = parseTomlEnv(prodToml, 'REQUEST_TIMEOUT_SECS');
  const timeoutOk = timeoutStaging === '120' && timeoutProd === '120';
  if (!timeoutOk) {
    findings.push({
      id: 'static_request_timeout_parity',
      severity: 'P1',
      detail: `staging=${timeoutStaging} prod=${timeoutProd} expected 120`,
    });
  }
  checks.push({
    id: 'ssot_request_timeout_parity',
    domain: 'request_timeout_parity',
    pass: timeoutOk,
    staging: timeoutStaging,
    prod: timeoutProd,
  });

  const adminPath = path.join(root, 'registry/admin-platform-production-readiness.v1.yaml');
  const adminText = fs.readFileSync(adminPath, 'utf8');
  const adminHosts = [...adminText.matchAll(/staging_api_base:\s*(https:\/\/[^\n]+)/g)].map((m) =>
    m[1].trim()
  );
  const adminDupOk = adminHosts.length >= 2 && new Set(adminHosts).size === 1;
  if (!adminDupOk) {
    findings.push({
      id: 'static_admin_staging_api_dup',
      severity: 'P0',
      detail: `admin-platform staging_api_base drift: ${adminHosts.join(' | ')}`,
    });
  }
  checks.push({
    id: 'ssot_admin_staging_api_consistent',
    domain: 'registry_api_host_drift',
    pass: adminDupOk,
    values: adminHosts,
  });

  const registryHosts = collectStagingApiHosts(root);
  const hostDriftOk =
    registryHosts.length > 0 &&
    registryHosts.every((h) => h === 'https://tt-api-staging.fly.dev');
  if (!hostDriftOk) {
    findings.push({
      id: 'static_registry_api_host_drift',
      severity: 'P0',
      detail: `staging API hosts drift: ${registryHosts.join(', ')}`,
    });
  }
  checks.push({
    id: 'ssot_registry_api_hosts',
    domain: 'registry_api_host_drift',
    pass: hostDriftOk,
    hosts: registryHosts,
  });

  const phase2Test = fs.readFileSync(
    path.join(root, 'frontend/lib/phase2/phase2StagingUiRealUserSprint.contract.test.ts'),
    'utf8'
  );
  const uiApiOk = phase2Test.includes('tt-api-staging');
  if (!uiApiOk) {
    findings.push({
      id: 'static_phase2_ui_api_ref',
      severity: 'P1',
      detail: 'phase2 staging UI contract missing tt-api-staging',
    });
  }
  checks.push({
    id: 'ssot_phase2_ui_api',
    domain: 'registry_api_host_drift',
    pass: uiApiOk,
    path: 'frontend/lib/phase2/phase2StagingUiRealUserSprint.contract.test.ts',
  });

  return checks;
}

async function runLiveProbes(apiBase, checklistPath, findings) {
  const checklist = loadChecklist(checklistPath);
  const lp = checklist.live_probes;
  const rows = [
    await probeMetaLocalProfile(apiBase, lp.meta_local_profile, findings),
    await probeHealthReady(apiBase, lp.health_ready, findings),
  ];
  return { pass: rows.every((r) => r.pass), api_base: apiBase, probes: rows };
}

module.exports = {
  loadChecklist,
  runLiveProbes,
  runStaticSsotChecks,
  collectStagingApiHosts,
};
