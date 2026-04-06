"use client";

import { useCallback } from "react";
import { useAccount, useChainId, useSignTypedData } from "wagmi";
import { getAddress, zeroHash } from "viem";
import {
  postOrderConfirmCompletionIntent,
  postOrderOpenDisputeIntent,
  getIdempotencyKey,
} from "@/lib/apiClient";
import {
  buildConfirmCompletionSignPayload,
  buildOpenDisputeSignPayload,
  serializeTypedDataForIntentApi,
} from "@/dapp/intents/orderIntentTypedData";

export type SignedIntentBody = {
  chain_id: number;
  verifying_contract: string;
  signer: string;
  signature: `0x${string}`;
  typed_data: Record<string, unknown>;
  intent_ts_ms: number;
};

/** 托管订单：EIP-712 签名 + POST intents（202 accepted → outbox，07 Phase 4 / 01 执行器路径） */
export function useOrderIntentSigner(expectedChainId: number) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();

  const chainMismatch = isConnected && chainId !== expectedChainId;

  const submitConfirmCompletionIntent = useCallback(
    async (orderId: string, escrowAddress: `0x${string}`) => {
      if (!address) throw new Error("wallet_required");
      const vc = getAddress(escrowAddress);
      const { domain, types, primaryType, message } = buildConfirmCompletionSignPayload({
        orderId,
        verifyingContract: vc,
        chainId: expectedChainId,
      });
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType,
        message,
        account: address,
      });
      const typed_data = serializeTypedDataForIntentApi(domain, types, primaryType, {
        ...message,
      });
      const body: SignedIntentBody = {
        chain_id: expectedChainId,
        verifying_contract: vc.toLowerCase(),
        signer: getAddress(address).toLowerCase(),
        signature,
        typed_data,
        intent_ts_ms: Date.now(),
      };
      return postOrderConfirmCompletionIntent(orderId, body as unknown as Record<string, unknown>, getIdempotencyKey());
    },
    [address, expectedChainId, signTypedDataAsync]
  );

  const submitOpenDisputeIntent = useCallback(
    async (orderId: string, escrowAddress: `0x${string}`, reasonHash?: `0x${string}`) => {
      if (!address) throw new Error("wallet_required");
      const vc = getAddress(escrowAddress);
      const rh = reasonHash ?? zeroHash;
      const { domain, types, primaryType, message } = buildOpenDisputeSignPayload({
        orderId,
        verifyingContract: vc,
        chainId: expectedChainId,
        reasonHash: rh,
      });
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType,
        message,
        account: address,
      });
      const typed_data = serializeTypedDataForIntentApi(domain, types, primaryType, {
        ...message,
      });
      const body: SignedIntentBody = {
        chain_id: expectedChainId,
        verifying_contract: vc.toLowerCase(),
        signer: getAddress(address).toLowerCase(),
        signature,
        typed_data,
        intent_ts_ms: Date.now(),
      };
      return postOrderOpenDisputeIntent(orderId, body as unknown as Record<string, unknown>, getIdempotencyKey());
    },
    [address, expectedChainId, signTypedDataAsync]
  );

  return {
    address,
    isConnected,
    chainMismatch,
    isSigning,
    submitConfirmCompletionIntent,
    submitOpenDisputeIntent,
  };
}
