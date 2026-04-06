import type { TypedDataDomain } from "viem";

/** 与后端 outbox / 执行器约定的 EIP-712 类型名（04 intents 扩展） */
export const ORDER_COMPLETION_PRIMARY = "OrderCompletionIntent" as const;
export const ORDER_OPEN_DISPUTE_PRIMARY = "OrderOpenDisputeIntent" as const;
export const EXECUTE_RESOLUTION_PRIMARY = "ExecuteResolutionIntent" as const;

const completionTypes = {
  [ORDER_COMPLETION_PRIMARY]: [
    { name: "orderId", type: "string" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const disputeTypes = {
  [ORDER_OPEN_DISPUTE_PRIMARY]: [
    { name: "orderId", type: "string" },
    { name: "reasonHash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const executeResolutionTypes = {
  [EXECUTE_RESOLUTION_PRIMARY]: [
    { name: "disputeId", type: "string" },
    { name: "orderId", type: "string" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export function buildOrderIntentDomain(
  chainId: number,
  verifyingContract: `0x${string}`
): TypedDataDomain {
  return {
    name: "TravelTrust",
    version: "1",
    chainId: BigInt(chainId),
    verifyingContract,
  };
}

export function buildConfirmCompletionSignPayload(params: {
  orderId: string;
  verifyingContract: `0x${string}`;
  chainId: number;
  nonce?: bigint;
  deadlineUnixSec?: bigint;
}) {
  const nonce = params.nonce ?? BigInt(Date.now());
  const deadlineUnixSec =
    params.deadlineUnixSec ?? BigInt(Math.floor(Date.now() / 1000) + 48 * 3600);
  const domain = buildOrderIntentDomain(params.chainId, params.verifyingContract);
  return {
    domain,
    types: completionTypes,
    primaryType: ORDER_COMPLETION_PRIMARY,
    message: {
      orderId: params.orderId,
      nonce,
      deadline: deadlineUnixSec,
    },
  } as const;
}

export function buildOpenDisputeSignPayload(params: {
  orderId: string;
  verifyingContract: `0x${string}`;
  chainId: number;
  reasonHash: `0x${string}`;
  nonce?: bigint;
  deadlineUnixSec?: bigint;
}) {
  const nonce = params.nonce ?? BigInt(Date.now());
  const deadlineUnixSec =
    params.deadlineUnixSec ?? BigInt(Math.floor(Date.now() / 1000) + 48 * 3600);
  const domain = buildOrderIntentDomain(params.chainId, params.verifyingContract);
  return {
    domain,
    types: disputeTypes,
    primaryType: ORDER_OPEN_DISPUTE_PRIMARY,
    message: {
      orderId: params.orderId,
      reasonHash: params.reasonHash,
      nonce,
      deadline: deadlineUnixSec,
    },
  } as const;
}

/** 争议裁决后：执行器代发链上 executeResolution（07 Phase 3/4、intents.rs） */
export function buildExecuteResolutionSignPayload(params: {
  disputeId: string;
  orderId: string;
  verifyingContract: `0x${string}`;
  chainId: number;
  nonce?: bigint;
  deadlineUnixSec?: bigint;
}) {
  const nonce = params.nonce ?? BigInt(Date.now());
  const deadlineUnixSec =
    params.deadlineUnixSec ?? BigInt(Math.floor(Date.now() / 1000) + 48 * 3600);
  const domain = buildOrderIntentDomain(params.chainId, params.verifyingContract);
  return {
    domain,
    types: executeResolutionTypes,
    primaryType: EXECUTE_RESOLUTION_PRIMARY,
    message: {
      disputeId: params.disputeId,
      orderId: params.orderId,
      nonce,
      deadline: deadlineUnixSec,
    },
  } as const;
}

/** 存入 API `typed_data` 字段：无 bigint，便于 JSON 与后端 serde */
export function serializeTypedDataForIntentApi(
  domain: TypedDataDomain,
  types: Record<string, readonly { name: string; type: string }[]>,
  primaryType: string,
  message: Record<string, bigint | string>
): Record<string, unknown> {
  const chainId = domain.chainId;
  return {
    domain: {
      name: domain.name,
      version: domain.version,
      chainId: chainId != null ? Number(chainId) : undefined,
      verifyingContract: domain.verifyingContract,
    },
    types: Object.fromEntries(Object.entries(types).map(([k, v]) => [k, [...v]])),
    primaryType,
    message: Object.fromEntries(
      Object.entries(message).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v])
    ),
  };
}
