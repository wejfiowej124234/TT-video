"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { isAddress } from "viem";
import {
  clearGetMeCache,
  getWalletVerificationStatus,
  postWalletVerifyChallenge,
  postWalletVerifyConfirm,
  putMe,
} from "@/lib/apiClient";
import type { WalletVerificationStatus } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";

function formatWalletPreview(addr: string): string {
  const a = addr.trim();
  if (a.length < 12) return a;
  return `${a.slice(0, 10)}…${a.slice(-8)}`;
}

export function useMeWalletVerify(t: (k: string) => string) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [walletInput, setWalletInput] = useState("");
  const [status, setStatus] = useState<WalletVerificationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const s = await getWalletVerificationStatus();
      setStatus(s);
    } catch (e) {
      setError(mapApiReadError(e, t, "me_security_wallet_load_failed"));
    } finally {
      setLoadingStatus(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (connectedAddress && !walletInput.trim()) {
      setWalletInput(connectedAddress);
    }
  }, [connectedAddress, walletInput]);

  const applyConnectedWallet = useCallback(() => {
    if (connectedAddress) setWalletInput(connectedAddress);
  }, [connectedAddress]);

  const runVerify = useCallback(async () => {
    const raw = walletInput.trim();
    if (!isAddress(raw)) {
      setError(t("me_security_wallet_address_invalid"));
      return;
    }
    if (!isConnected || !connectedAddress) {
      setError(t("me_security_wallet_connect_hint"));
      return;
    }
    if (raw.toLowerCase() !== connectedAddress.toLowerCase()) {
      setError(t("me_security_wallet_must_match_connected"));
      return;
    }

    setVerifying(true);
    setError(null);
    setSuccess(null);
    try {
      const challenge = await postWalletVerifyChallenge({ wallet_address: raw });
      const signature = await signMessageAsync({ message: challenge.message });
      await postWalletVerifyConfirm({
        challenge_id: challenge.challenge_id,
        signature,
      });
      await putMe({ default_wallet_address: raw });
      clearGetMeCache();
      await loadStatus();
      setSuccess(t("me_security_wallet_verify_success"));
    } catch (e) {
      setError(mapApiReadError(e, t, "me_security_wallet_verify_failed"));
    } finally {
      setVerifying(false);
    }
  }, [connectedAddress, isConnected, loadStatus, signMessageAsync, t, walletInput]);

  const verified = status?.verified === true;
  const verifiedWallet = status?.wallet_address?.trim() ?? "";

  return {
    walletInput,
    setWalletInput,
    connectedAddress,
    isConnected,
    verified,
    verifiedWallet,
    verifiedWalletPreview: verifiedWallet ? formatWalletPreview(verifiedWallet) : "",
    verificationAgeSeconds: status?.verification_age_seconds,
    verificationTtlSeconds: status?.verification_ttl_seconds,
    loadingStatus,
    verifying,
    error,
    success,
    applyConnectedWallet,
    runVerify,
    reloadStatus: loadStatus,
  };
}

export type MeWalletVerifyViewModel = ReturnType<typeof useMeWalletVerify>;
