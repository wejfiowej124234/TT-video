import { useEffect, useMemo, useState } from "react";
import { formatUnits, getAddress, isAddress, zeroAddress } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSimulateContract,
} from "wagmi";

import { useTranslation } from "@/components/LocaleProvider";
import { useInvestorDistributionClaimWrite } from "@/dapp/hooks/useInvestorDistributionClaimWrite";
import { getExpectedChainId } from "@/lib/chainEnv";
import { parseDistributionIdForClaim } from "@/lib/distributionClaimBytes32";
import { getInvestorDistributionClaimAddress } from "@/lib/investorDistributionClaimEnv";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";
import { erc20TokenAbi } from "@/lib/stakingAbi";
import {
  asReadonlyBigint,
  CLAIM_WRITE_ERROR_OPTS,
  READ_ABI,
  simulateErrToMessage,
} from "./governanceDistributionClaimPageModel";

export function useGovernanceDistributionClaimPage() {
  const { t } = useTranslation();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const expectedChainId = getExpectedChainId();
  const chainOk = chainId === expectedChainId;

  const claimAddress = useMemo(() => getInvestorDistributionClaimAddress(), []);

  const [distInput, setDistInput] = useState("");
  const [maxStr, setMaxStr] = useState("");

  const parsedBytes32 = useMemo(() => parseDistributionIdForClaim(distInput), [distInput]);

  const readsEnabled = Boolean(claimAddress && parsedBytes32 && chainOk);

  const tokenRead = useReadContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "distributionToken",
    args: parsedBytes32 ? [parsedBytes32] : undefined,
    query: { enabled: readsEnabled },
  });

  const tz = tokenRead.data as `0x${string}` | undefined;
  const token =
    tz && isAddress(tz) && getAddress(tz) !== getAddress(zeroAddress) ? (getAddress(tz) as `0x${string}`) : undefined;
  const unknownDistribution = Boolean(
    readsEnabled && tokenRead.isSuccess && tz && isAddress(tz) && getAddress(tz) === getAddress(zeroAddress)
  );

  const decimalsRead = useReadContract({
    address: token,
    abi: erc20TokenAbi,
    functionName: "decimals",
    query: { enabled: Boolean(token) },
  });
  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;

  const claimableRead = useReadContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "claimable",
    args: parsedBytes32 && address ? [parsedBytes32, address] : undefined,
    query: { enabled: Boolean(readsEnabled && address && parsedBytes32) },
  });

  const entitledRead = useReadContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "entitled",
    args: parsedBytes32 && address ? [parsedBytes32, address] : undefined,
    query: { enabled: Boolean(readsEnabled && address && parsedBytes32) },
  });

  const claimedRead = useReadContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "claimed",
    args: parsedBytes32 && address ? [parsedBytes32, address] : undefined,
    query: { enabled: Boolean(readsEnabled && address && parsedBytes32) },
  });

  const claimable = asReadonlyBigint(claimableRead.data);
  const entitled = entitledRead.data;
  const claimed = claimedRead.data;

  const parsedMax = useMemo(() => {
    const s = maxStr.trim();
    if (!s) return undefined;
    try {
      return BigInt(s);
    } catch {
      return undefined;
    }
  }, [maxStr]);

  const effectiveMax = useMemo(() => {
    if (parsedMax !== undefined && parsedMax > 0n) return parsedMax;
    if (claimable !== undefined && claimable > 0n) return claimable;
    return undefined;
  }, [parsedMax, claimable]);

  const simEnabled = Boolean(
    isConnected &&
      chainOk &&
      claimAddress &&
      parsedBytes32 &&
      token &&
      address &&
      effectiveMax !== undefined &&
      effectiveMax > 0n
  );

  const {
    data: simData,
    error: simError,
    isFetching: simFetching,
    refetch: refetchSim,
  } = useSimulateContract({
    address: claimAddress,
    abi: READ_ABI,
    functionName: "claim",
    args: parsedBytes32 && effectiveMax ? [parsedBytes32, effectiveMax] : undefined,
    query: { enabled: simEnabled },
  });

  const {
    claim,
    withdrawDividend,
    isPending: writePending,
    isSuccess: writeSuccess,
    error: writeErr,
    hash,
    reset: resetWrite,
  } = useInvestorDistributionClaimWrite(claimAddress, parsedBytes32 ?? undefined, effectiveMax);

  useEffect(() => {
    if (writeSuccess) {
      void claimableRead.refetch?.();
      void claimedRead.refetch?.();
      void entitledRead.refetch?.();
      void refetchSim?.();
      setMaxStr("");
    }
  }, [writeSuccess, claimableRead, claimedRead, entitledRead, refetchSim]);

  useEffect(() => {
    resetWrite();
  }, [distInput, resetWrite]);

  const writeMsg = mapWalletWriteError(writeErr ?? undefined, t, CLAIM_WRITE_ERROR_OPTS);
  const simMsg =
    simError && "message" in simError && typeof simError.message === "string"
      ? simulateErrToMessage(simError.message, t)
      : simError
        ? simulateErrToMessage(String(simError), t)
        : null;

  const claimableFormatted =
    claimable !== undefined && decimals !== undefined && decimals <= 36
      ? formatUnits(claimable, decimals)
      : null;

  const yieldGrowPayload = useMemo(
    () => ({ claimable_gt_zero: claimable !== undefined && claimable > 0n }),
    [claimable]
  );

  const distInvalid = distInput.trim() !== "" && !parsedBytes32;

  return {
    t,
    address,
    isConnected,
    chainOk,
    claimAddress,
    distInput,
    setDistInput,
    maxStr,
    setMaxStr,
    parsedBytes32,
    readsEnabled,
    tokenRead,
    token,
    unknownDistribution,
    claimableRead,
    entitledRead,
    claimedRead,
    claimable,
    entitled,
    claimed,
    simEnabled,
    simData,
    simFetching,
    simError,
    simMsg,
    claim,
    withdrawDividend,
    writePending,
    writeSuccess,
    writeMsg,
    hash,
    claimableFormatted,
    yieldGrowPayload,
    distInvalid,
    effectiveMax,
  };
}
