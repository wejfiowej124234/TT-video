"use client";

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { isAddress } from "viem";
import { postWalletVerifyChallenge, postWalletVerifyConfirm } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/apiClient/core";
import { writeGuideWalletVerifiedAddress } from "@/lib/constants/guideRegisterKeys";
import { normalizePersonalSignSignature } from "@/lib/wallet/normalizePersonalSignSignature";
import { resolveGuideRegisterWalletVerifyError } from "@/lib/wallet/resolveGuideRegisterWalletVerifyError";

export function useGuideRegisterWalletVerify(t: (k: string) => string, walletAddress: string) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [verifying, setVerifying] = useState(false);
  const [verifiedAddress, setVerifiedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runVerify = useCallback(async () => {
    const raw = walletAddress.trim();
    if (!isAddress(raw)) {
      setError(t("guideRegister_errorWallet"));
      return;
    }
    if (!isConnected || !connectedAddress) {
      setError(t("guideRegister_walletConnectFirst"));
      return;
    }
    if (raw.toLowerCase() !== connectedAddress.toLowerCase()) {
      setError(t("guideRegister_walletMustMatchConnected"));
      return;
    }
    const auth = getAuthHeaders();
    if (!auth.Authorization?.startsWith("Bearer ")) {
      setError(t("guideRegister_walletVerifyNeedSiteLogin"));
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      let challenge;
      try {
        challenge = await postWalletVerifyChallenge({ wallet_address: raw });
      } catch (e) {
        setError(resolveGuideRegisterWalletVerifyError(e, t, "challenge"));
        return;
      }
      if (!challenge.message?.trim()) {
        setError(t("guideRegister_walletVerifyChallengeFailed"));
        return;
      }
      let signature: string;
      try {
        signature = await signMessageAsync({
          message: challenge.message,
          account: connectedAddress,
        });
      } catch (e) {
        setError(resolveGuideRegisterWalletVerifyError(e, t, "sign"));
        return;
      }
      try {
        await postWalletVerifyConfirm({
          challenge_id: challenge.challenge_id,
          signature: normalizePersonalSignSignature(signature),
        });
      } catch (e) {
        setError(resolveGuideRegisterWalletVerifyError(e, t, "confirm"));
        return;
      }
      writeGuideWalletVerifiedAddress(raw);
      setVerifiedAddress(raw);
    } catch (e) {
      setError(resolveGuideRegisterWalletVerifyError(e, t, "confirm"));
    } finally {
      setVerifying(false);
    }
  }, [connectedAddress, isConnected, signMessageAsync, t, walletAddress]);

  const walletVerified =
    verifiedAddress != null &&
    walletAddress.trim().toLowerCase() === verifiedAddress.toLowerCase();

  return { verifying, error, walletVerified, runVerify, setVerifiedAddress };
}
