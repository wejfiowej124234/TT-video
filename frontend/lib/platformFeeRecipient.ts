import { getAddress, isAddress } from "viem";

import { apiUrl, routes } from "./api";
import { fetchJsonWithApiStatusLog } from "./apiClient";
import { getFeeRouterAddress } from "./feeRouterEnv";

function parsePlatformFeeRecipientFromMetaPayload(j: unknown): `0x${string}` | null {
  const chain =
    typeof j === "object" && j !== null && "chain" in j
      ? (j as { chain?: unknown }).chain
      : undefined;
  const contracts =
    typeof chain === "object" && chain !== null && "contracts" in chain
      ? (chain as { contracts?: unknown }).contracts
      : undefined;
  if (!contracts || typeof contracts !== "object") return null;
  const c = contracts as Record<string, unknown>;
  const raw =
    (typeof c.escrow_platform_fee_recipient === "string" && c.escrow_platform_fee_recipient.trim()) ||
    (typeof c.fee_router_address === "string" && c.fee_router_address.trim()) ||
    null;
  if (!raw || !isAddress(raw)) return null;
  return getAddress(raw as `0x${string}`);
}

/** 从 GET /meta 解析推荐的 `platformFeeRecipient`（与 FeeRouter 同址）；失败或缺省时返回 null。 */
export async function fetchPlatformFeeRecipientFromMeta(
  signal?: AbortSignal
): Promise<`0x${string}` | null> {
  try {
    const { res, body } = await fetchJsonWithApiStatusLog<unknown>("fetchPlatformFeeRecipientFromMeta", apiUrl(routes.meta), {
      signal,
    });
    if (!res.ok) return null;
    return parsePlatformFeeRecipientFromMetaPayload(body);
  } catch {
    return null;
  }
}

/** 优先 `NEXT_PUBLIC_FEE_ROUTER_ADDRESS`，否则 `/meta`；不校验二者是否同时存在且一致。 */
export async function resolvePlatformFeeRecipient(
  signal?: AbortSignal
): Promise<`0x${string}` | null> {
  return getFeeRouterAddress() ?? (await fetchPlatformFeeRecipientFromMeta(signal));
}

/**
 * DApp 创建 Escrow 前须解析到明确地址；若 env 与 `/meta` 均给出且不一致则 fail-closed。
 */
export async function requirePlatformFeeRecipient(
  signal?: AbortSignal
): Promise<`0x${string}`> {
  const fromEnv = getFeeRouterAddress();
  const fromMeta = await fetchPlatformFeeRecipientFromMeta(signal);
  if (fromEnv && fromMeta && fromEnv !== fromMeta) {
    throw new Error(
      "platform_fee_recipient_mismatch: NEXT_PUBLIC_FEE_ROUTER_ADDRESS differs from GET /meta.chain.contracts.escrow_platform_fee_recipient (or fee_router_address)"
    );
  }
  const out = fromEnv ?? fromMeta;
  if (!out) {
    throw new Error(
      "platform_fee_recipient_unconfigured: set NEXT_PUBLIC_FEE_ROUTER_ADDRESS or configure API FEE_ROUTER_ADDRESS so /meta exposes escrow_platform_fee_recipient"
    );
  }
  return out;
}
