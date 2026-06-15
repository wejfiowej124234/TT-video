/**
 * Playwright：GET /meta 链契约门禁（防「链关 / 无 ChainConfig 却误以为全链路通过」）。
 *
 * - 默认（未设 `PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`）：759 十键 + ① 核心协议地址
 *   （`guide_staking_address` / `staking_provider_address` / `fee_router_address` / `governance_token_address`）。
 * - `PLAYWRIGHT_REQUIRE_GOVERNANCE_STACK=1`：额外要求 `governor_address` + `timelock_address`（② 治理栈）。
 * - CI 链关烟测：`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`，仅校验 `/meta` 200 + JSON。
 * - 可选：`PLAYWRIGHT_EXPECT_CHAIN_ID` 与 `meta.chain.chain_id` 字符串对拍（如 `31337` / `11155111`）。
 */

import { chainIdFromMeta, parseChainIdFromMetaValue } from "../../lib/governanceChainMeta";
import { assertMetaChainContracts759Strict } from "../../lib/metaChainContracts759";

export type MetaJson = Record<string, unknown>;

function isRecord(x: unknown): x is MetaJson {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

export function assertEvmAddress(label: string, v: unknown): asserts v is string {
  if (typeof v !== "string" || !ADDR_RE.test(v)) {
    throw new Error(`${label}: expected 0x + 40 hex, got ${JSON.stringify(v)}`);
  }
}

/** 供非 Playwright 调用方；Playwright 用例优先用 `request.get(\`\${API_BASE}/meta\`)` 以便统一超时与错误包装。 */
export async function fetchMetaJson(apiBase: string): Promise<MetaJson> {
  const url = `${apiBase.replace(/\/$/, "")}/meta`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { accept: "application/json" } });
  } catch (e) {
    const code =
      typeof e === "object" && e !== null && "cause" in e
        ? (e as { cause?: { code?: string } }).cause?.code
        : undefined;
    if (code === "ECONNREFUSED") {
      throw new Error(
        `GET /meta: nothing listening at ${url} (ECONNREFUSED). Start traveltrust-api on this port or run with PLAYWRIGHT_FULL_STACK=1 so Playwright spawns the API.`,
      );
    }
    throw e;
  }
  if (!res.ok) {
    throw new Error(`GET /meta failed: HTTP ${res.status} (${url})`);
  }
  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw new Error("GET /meta: body is not a JSON object");
  }
  return body;
}

/** 严格：链配置挂载且 759 十键 + ① 核心协议地址齐全。 */
export function assertMetaChainContractsStrict(meta: MetaJson): void {
  const chain = meta.chain;
  if (!isRecord(chain)) {
    throw new Error("GET /meta: missing chain object");
  }
  const contracts = chain.contracts;
  if (!isRecord(contracts)) {
    throw new Error(
      "GET /meta: chain.contracts missing or null — ChainConfig 未挂载（假全链路 / 链下烟测）；根 .env 需 CHAIN_RPC_URL + 合约地址，或 CI 设 PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1",
    );
  }
  assertMetaChainContracts759Strict(contracts);

  const expectId = process.env.PLAYWRIGHT_EXPECT_CHAIN_ID?.trim();
  if (expectId) {
    const got = chainIdFromMeta(meta) ?? parseChainIdFromMetaValue(chain.chain_id);
    if (got == null || String(got) !== expectId) {
      throw new Error(`chain.chain_id: expected ${expectId}, got ${JSON.stringify(chain.chain_id)}`);
    }
  }
}

/** 放宽：仅保证 /meta 可解析（供 P3_CHAIN_OFF / 无 RPC 的 CI 烟测）。 */
export function assertMetaJsonMinimal(meta: MetaJson): void {
  if (typeof meta.service !== "string" || !meta.service) {
    throw new Error("GET /meta: expected root.service string");
  }
}
