/**
 * FPC B20 · Web3 deep live + static probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

function parseMetricsGauge(body, name) {
  const re = new RegExp(`^${name}\\s+(\\d+(?:\\.\\d+)?)\\s*$`, 'm');
  const m = body.match(re);
  return m ? Number(m[1]) : null;
}

async function fetchJson(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(45000),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
  return { status: res.status, text: await res.text() };
}

async function probeMetaChainIndexer(apiBase, spec, findings) {
  const row = await fetchJson(`${apiBase}${spec.path}`);
  const idx = row.json?.indexer;
  const src = idx?.checkpoint?.source;
  const srcOk = spec.checkpoint_sources.includes(src);
  const fnRoot = row.json?.finality_n;
  const fnIdx = idx?.finality_n;
  const fnOk = !spec.finality_n_match_indexer || fnRoot === fnIdx;
  const keysOk = spec.required_keys.every((k) => row.json?.[k] !== undefined);
  const pass = row.status === 200 && keysOk && srcOk && fnOk;
  if (!pass) {
    findings.push({
      id: 'live_meta_chain_indexer',
      severity: 'P0',
      detail: `meta chain/indexer invalid status=${row.status} src=${src} finality match=${fnOk}`,
    });
  }
  return {
    id: 'live_meta_chain_indexer',
    domain: 'api_meta_chain_ssot',
    pass,
    chain_id: row.json?.chain?.chain_id,
    checkpoint: idx?.checkpoint,
    finality_n: fnRoot,
  };
}

async function probeMetricsParity(apiBase, metaSnapshot, spec, findings) {
  const row = await fetchText(`${apiBase}${spec.path}`);
  const blockGauge = parseMetricsGauge(row.text, 'traveltrust_indexer_checkpoint_block');
  const logGauge = parseMetricsGauge(row.text, 'traveltrust_indexer_checkpoint_log_index');
  const chainLoaded = parseMetricsGauge(row.text, 'traveltrust_chain_config_loaded');
  const metaBlock = metaSnapshot?.checkpoint?.block_number;
  const metaLog = metaSnapshot?.checkpoint?.log_index;
  const hasContracts = Boolean(metaSnapshot?.chain_id && metaSnapshot?.chain_id !== 'null');
  const blockOk = blockGauge === metaBlock;
  const logOk = logGauge === metaLog;
  const chainOk = chainLoaded === 1 || chainLoaded === 0;
  const pass = row.status === 200 && blockOk && logOk && chainOk;
  if (!pass) {
    findings.push({
      id: 'live_metrics_indexer_parity',
      severity: 'P0',
      detail: `metrics vs meta block ${blockGauge}!=${metaBlock} log ${logGauge}!=${metaLog}`,
    });
  }
  return {
    id: 'live_metrics_indexer_parity',
    domain: 'indexer_checkpoint_parity',
    pass,
    gauges: { block: blockGauge, log: logGauge, chain_config_loaded: chainLoaded },
    meta: { block: metaBlock, log: metaLog },
  };
}

async function createOrderForChainSync(apiBase) {
  const stamp = Date.now();
  const email = `fpc-b20-${stamp}@example.com`;
  const password = 'Test123!';
  const reg = await fetchJson(`${apiBase}/auth/register`, {
    method: 'POST',
    body: { email, password, nickname: 'FPC B20 Web3' },
  });
  if (![200, 201].includes(reg.status) || !reg.json?.token) {
    throw new Error(`register failed HTTP ${reg.status}`);
  }
  const token = reg.json.token;
  const create = await fetchJson(`${apiBase}/api/v1/itineraries`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      destination: '中国',
      city: '上海',
      travel_date: '2026-08-01',
      days: 1,
      cities: ['上海'],
      hotel_type: '标准',
      food_preference: '当地特色',
      budget_min: 1600,
      budget_max: 2000,
      notes: 'FPC B20 chain_sync probe',
    },
  });
  if (![200, 201].includes(create.status) || !create.json?.order_id) {
    throw new Error(`POST /itineraries failed HTTP ${create.status}`);
  }
  return { orderId: create.json.order_id, token };
}

async function probeChainSyncParity(apiBase, metaCheckpoint, spec, findings) {
  let orderId;
  let token;
  try {
    ({ orderId, token } = await createOrderForChainSync(apiBase));
  } catch (e) {
    findings.push({
      id: 'live_chain_sync_setup',
      severity: 'P0',
      detail: String(e.message || e),
    });
    return { id: 'live_chain_sync_checkpoint_parity', domain: 'event_log_projection', pass: false };
  }
  const path = spec.chain_sync_path_template.replace('{order_id}', orderId);
  const row = await fetchJson(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const cs = row.json?.chain_sync;
  const keysOk = spec.required_chain_sync_keys.every((k) => cs?.[k] !== undefined);
  const envOk = row.json?.status === 'ok';
  let parityOk = true;
  if (
    spec.checkpoint_must_match_meta_when_runtime &&
    metaCheckpoint?.source === 'runtime' &&
    cs?.checkpoint
  ) {
    parityOk =
      cs.checkpoint.block_number === metaCheckpoint.block_number &&
      cs.checkpoint.log_index === metaCheckpoint.log_index &&
      cs.checkpoint.source === metaCheckpoint.source;
  }
  const pass = row.status === 200 && keysOk && envOk && parityOk;
  if (!pass) {
    findings.push({
      id: 'live_chain_sync_checkpoint_parity',
      severity: 'P0',
      detail: `chain-sync HTTP ${row.status} parity=${parityOk} keys=${keysOk} order=${orderId}`,
    });
  }
  return {
    id: 'live_chain_sync_checkpoint_parity',
    domain: 'indexer_checkpoint_parity',
    pass,
    order_id: orderId,
    chain_sync_status: cs?.status,
    checkpoint: cs?.checkpoint,
    meta_checkpoint: metaCheckpoint,
  };
}

async function probeEscrowOrderState(apiBase, spec, findings) {
  let orderId;
  let token;
  try {
    ({ orderId, token } = await createOrderForChainSync(apiBase));
  } catch (e) {
    findings.push({ id: 'live_escrow_setup', severity: 'P0', detail: String(e.message || e) });
    return { id: 'live_escrow_order_state', domain: 'escrow_state_machine', pass: false };
  }
  const row = await fetchJson(`${apiBase}/api/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const state = row.json?.order?.state;
  const sync = await fetchJson(`${apiBase}/api/v1/orders/${orderId}/chain-sync-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const csStatus = sync.json?.chain_sync?.status;
  const stateOk = spec.allowed_states_after_create.includes(state);
  const csOk = spec.chain_sync_status_allowed.includes(csStatus);
  const pass = row.status === 200 && stateOk && csOk;
  if (!pass) {
    findings.push({
      id: 'live_escrow_order_state',
      severity: 'P1',
      detail: `order state=${state} chain_sync.status=${csStatus}`,
    });
  }
  return {
    id: 'live_escrow_order_state',
    domain: 'escrow_state_machine',
    pass,
    order_id: orderId,
    order_state: state,
    chain_sync_status: csStatus,
  };
}

function runStaticSsotChecks(root, findings) {
  const checks = [
    {
      id: 'ssot_protocol_registry',
      domain: 'contract_registry_abi',
      path: 'registry/protocol-convergence-deployments.v1.yaml',
      must_contain: ['gov_freeze_v2_clean_baseline', 'GOVERNANCE_TREASURY_P4CAP_ADDRESS'],
    },
    {
      id: 'ssot_master_matrix',
      domain: 'contract_registry_abi',
      path: 'registry/traveltrust-web3-protocol-master-matrix.v1.yaml',
      must_contain: ['web3_protocol_version', 'governor'],
    },
    {
      id: 'ssot_chain_sync_handler',
      domain: 'event_log_projection',
      path: 'crates/api/src/routes/orders/chain_sync_status.rs',
      must_contain: ['chain-sync-status', 'chain_sync'],
    },
    {
      id: 'ssot_order_detail_chain_ssot',
      domain: 'escrow_state_machine',
      path: 'crates/api/src/routes/orders/order_detail_chain_ssot.rs',
      must_contain: ['escrow'],
    },
    {
      id: 'ssot_frontend_chain_env',
      domain: 'frontend_chain_env',
      path: 'frontend/lib/chainEnv.ts',
      must_contain: ['NEXT_PUBLIC_CHAIN_ID', 'getExpectedChainId'],
    },
    {
      id: 'ssot_spec_14_ref',
      domain: 'contract_registry_abi',
      path: 'docs/spec/14-合约-API-ABI-前后端对齐.md',
      must_contain: ['ABI'],
    },
  ];
  const results = [];
  for (const c of checks) {
    const abs = path.join(root, c.path);
    let pass = fs.existsSync(abs);
    const notes = [];
    if (!pass) {
      findings.push({ id: `static_missing:${c.id}`, severity: 'P1', detail: c.path });
    } else {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of c.must_contain) {
        if (!text.includes(needle)) {
          pass = false;
          notes.push(`missing:${needle}`);
          findings.push({
            id: `static_ssot:${c.id}`,
            severity: 'P1',
            detail: `${c.path} missing ${needle}`,
          });
        }
      }
    }
    results.push({ id: c.id, domain: c.domain, pass, path: c.path, notes });
  }
  return results;
}

function resolveRpcEnv(checklist, root) {
  const envFile = path.join(root, checklist.rpc_env?.fallback_env_file || '');
  let rpc = process.env.CHAIN_RPC_URL || checklist.rpc_env?.preferred || '';
  if (!rpc && fs.existsSync(envFile)) {
    const text = fs.readFileSync(envFile, 'utf8');
    const m = text.match(/^CHAIN_RPC_URL=(.+)$/m);
    if (m) rpc = m[1].trim().replace(/\r$/, '');
  }
  return rpc || checklist.rpc_env?.preferred || 'https://ethereum-sepolia-rpc.publicnode.com';
}

async function runLiveProbes(apiBase, checklistPath, findings) {
  const checklist = loadChecklist(checklistPath);
  const lp = checklist.live_probes;
  const metaProbe = await probeMetaChainIndexer(apiBase, lp.meta_chain_indexer, findings);
  const metricsProbe = await probeMetricsParity(
    apiBase,
    {
      checkpoint: metaProbe.checkpoint,
      chain_id: metaProbe.chain_id,
    },
    lp.metrics_indexer_parity,
    findings
  );
  const chainSyncProbe = await probeChainSyncParity(
    apiBase,
    metaProbe.checkpoint,
    lp.chain_sync_checkpoint_parity,
    findings
  );
  const escrowProbe = await probeEscrowOrderState(apiBase, lp.escrow_order_state, findings);
  const rows = [metaProbe, metricsProbe, chainSyncProbe, escrowProbe];
  const chainId = String(metaProbe.chain_id || '');
  const allowed = lp.registry_chain_id_note?.local_chain_ids_allowed || [];
  const chainNote = {
    id: 'live_chain_id_phase_boundary',
    domain: 'chain_id_network_config',
    pass: allowed.includes(chainId),
    chain_id: chainId,
    note: lp.registry_chain_id_note?.sepolia_verified_by_gate,
  };
  if (!chainNote.pass) {
    findings.push({
      id: 'live_chain_id_unexpected',
      severity: 'P1',
      detail: `meta.chain.chain_id=${chainId} not in allowed ① set ${allowed.join(',')}`,
    });
  }
  rows.push(chainNote);
  return { pass: rows.every((r) => r.pass), api_base: apiBase, probes: rows };
}

module.exports = {
  loadChecklist,
  runLiveProbes,
  runStaticSsotChecks,
  resolveRpcEnv,
};
