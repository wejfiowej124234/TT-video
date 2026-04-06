"use client";

import { useCallback } from "react";
import { useAccount, useChainId, useSignTypedData } from "wagmi";
import { getAddress } from "viem";
import { postDisputeExecuteResolutionIntent, getIdempotencyKey } from "@/lib/apiClient";
import {
  buildExecuteResolutionSignPayload,
  serializeTypedDataForIntentApi,
} from "@/dapp/intents/orderIntentTypedData";

type ExecuteResolutionIntentBody = {
  chain_id: number;
  verifying_contract: string;
  signer: string;
  signature: `0x${string}`;
  typed_data: Record<string, unknown>;
  intent_ts_ms: number;
};

export function useDisputeExecuteResolutionIntentSigner(expectedChainId: number) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();

  const chainMismatch = isConnected && chainId !== expectedChainId;

  const submitExecuteResolutionIntent = useCallback(
    async (
      disputeId: string,
      orderId: string,
      escrowAddress: `0x${string}`
    ) => {
      if (!address) throw new Error("wallet_required");
      const vc = getAddress(escrowAddress);
      const { domain, types, primaryType, message } = buildExecuteResolutionSignPayload({
        disputeId,
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
      const body: ExecuteResolutionIntentBody = {
        chain_id: expectedChainId,
        verifying_contract: vc.toLowerCase(),
        signer: getAddress(address).toLowerCase(),
        signature,
        typed_data,
        intent_ts_ms: Date.now(),
      };
      return postDisputeExecuteResolutionIntent(
        disputeId,
        body as unknown as Record<string, unknown>,
        getIdempotencyKey()
      );
    },
    [address, expectedChainId, signTypedDataAsync]
  );

  return {
    address,
    isConnected,
    chainMismatch,
    isSigning,
    submitExecuteResolutionIntent,
  };
}
