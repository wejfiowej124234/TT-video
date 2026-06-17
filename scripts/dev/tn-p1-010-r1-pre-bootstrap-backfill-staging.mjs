#!/usr/bin/env node
/**
 * TN-P1-010 R1 · pre-bootstrap event_log backfill (eth_getLogs → SQL).
 *
 *   node scripts/dev/tn-p1-010-r1-pre-bootstrap-backfill-staging.mjs \
 *     --rpc https://sepolia.drpc.org \
 *     --from-block 11027290 --to-block 11027450 \
 *     --sql-out evidence/.../r1-backfill.sql
 *
 * Writes summary JSON to stdout; SQL to --sql-out (INSERT … ON CONFLICT DO NOTHING).
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function arg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const root = path.resolve(arg('--root', process.cwd()));
const rpc = arg('--rpc', process.env.CHAIN_RPC_URL || process.env.P2B407_RPC_URL || '');
const fromBlock = Number(arg('--from-block', '11027290'));
const toBlock = Number(arg('--to-block', '11027450'));
const sqlOut = arg('--sql-out', '');
const chainId = Number(arg('--chain-id', process.env.CHAIN_ID || '11155111'));
const finalityN = Number(arg('--finality-n', process.env.FINALITY_N || '12'));
const maxSpan = Number(arg('--max-span', '9999'));

if (!rpc) {
  console.error('FAIL: --rpc or CHAIN_RPC_URL required');
  process.exit(2);
}
if (!Number.isFinite(fromBlock) || !Number.isFinite(toBlock) || fromBlock > toBlock) {
  console.error('FAIL: invalid block range');
  process.exit(2);
}
if (!sqlOut) {
  console.error('FAIL: --sql-out required');
  process.exit(2);
}

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[t.slice(0, eq).trim()] = val;
  }
  return env;
}

const merged = {
  ...loadEnvFile(path.join(root, '.env')),
  ...loadEnvFile(path.join(root, 'scripts/dev/.env.staging-onboarding.local')),
  ...process.env,
};

function pick(key, fallback = '') {
  return String(merged[key] || fallback).trim();
}

const watchAddresses = [
  pick('ESCROW_FACTORY_ADDRESS'),
  pick('FEE_ROUTER_ADDRESS'),
  pick('GOVERNOR_ADDRESS', pick('GOV_FREEZE_V1_GOVERNOR_ADDRESS')),
  pick('REGION_VAULT_ADDRESS'),
  pick('COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS', pick('COUNTRY_POOL_LEDGER_ADDRESS')),
]
  .filter(Boolean)
  .map((a) => a.toLowerCase());

if (watchAddresses.length === 0) {
  console.error('FAIL: no indexer watch addresses in env (ESCROW_FACTORY_ADDRESS, …)');
  process.exit(2);
}

async function rpcCall(method, params) {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

function chunkRanges(from, to, span) {
  const out = [];
  let start = from;
  while (start <= to) {
    const end = Math.min(start + span - 1, to);
    out.push([start, end]);
    start = end + 1;
  }
  return out;
}

function hexToPgBytea(hex) {
  const h = hex.replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]*$/.test(h) || h.length % 2 !== 0) return "''::bytea";
  return `'\\x${h}'::bytea`;
}

function eventTypeFromLog(log) {
  const t0 = log.topics?.[0] || 'unknown';
  if (t0.length > 200) return `topic0:${t0.slice(0, 200)}`;
  return t0;
}

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

const allLogs = [];
for (const addr of watchAddresses) {
  for (const [fb, tb] of chunkRanges(fromBlock, toBlock, maxSpan)) {
    const hexFrom = `0x${fb.toString(16)}`;
    const hexTo = `0x${tb.toString(16)}`;
    const logs = await rpcCall('eth_getLogs', [
      { address: addr, fromBlock: hexFrom, toBlock: hexTo },
    ]);
    for (const log of logs || []) {
      allLogs.push(log);
    }
  }
}

allLogs.sort((a, b) => {
  const bn = Number(BigInt(a.blockNumber)) - Number(BigInt(b.blockNumber));
  if (bn !== 0) return bn;
  return Number(a.logIndex) - Number(b.logIndex);
});

const lines = [
  '-- TN-P1-010 R1 pre-bootstrap backfill',
  `-- generated: ${new Date().toISOString()}`,
  `-- blocks: ${fromBlock}..${toBlock} chain_id=${chainId}`,
  `-- watch_addresses: ${watchAddresses.join(', ')}`,
  'BEGIN;',
];

for (const log of allLogs) {
  const blockNumber = Number(BigInt(log.blockNumber));
  const logIndex = Number(log.logIndex);
  const payload = JSON.stringify({
    topics: log.topics || [],
    topic0: log.topics?.[0] || '',
    data: log.data || '0x',
    backfill: 'tn_p1_010_r1_pre_bootstrap',
  });
  const eventType = eventTypeFromLog(log);
  lines.push(`
INSERT INTO event_log (
  chain_id, block_number, block_hash, tx_hash, log_index, event_type, payload, finality_n_used
) VALUES (
  ${chainId},
  ${blockNumber},
  ${hexToPgBytea(log.blockHash || '0x')},
  ${hexToPgBytea(log.transactionHash || '0x')},
  ${logIndex},
  '${sqlEscape(eventType)}',
  '${sqlEscape(payload)}'::jsonb,
  ${finalityN}
) ON CONFLICT (chain_id, block_number, log_index) DO NOTHING;`.trim());
}

lines.push('COMMIT;', '');

fs.mkdirSync(path.dirname(path.resolve(sqlOut)), { recursive: true });
fs.writeFileSync(path.resolve(sqlOut), `${lines.join('\n')}\n`);

const summary = {
  schema: 'tn_p1_010_r1_pre_bootstrap_backfill.v1',
  from_block: fromBlock,
  to_block: toBlock,
  chain_id: chainId,
  watch_addresses: watchAddresses,
  logs_fetched: allLogs.length,
  sql_out: path.resolve(sqlOut),
  rpc_host: rpc.replace(/\/\/[^@/]+@/, '//***@').split('?')[0],
  honest_boundary: 'Targeted legacy block-range backfill · replay/reconcile required after apply',
};
console.log(JSON.stringify(summary, null, 2));
process.exit(0);
