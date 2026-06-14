import { useChainId, useBytecode } from "wagmi";

import { getExpectedChainId } from "@/lib/chainEnv";
import { getGuideStakingAddress } from "@/lib/stakingEnv";

export type StakingDeploymentStatus = "idle" | "loading" | "missing" | "ready";

/** viem `readContract` 在地址无字节码时的典型报错 */
export function isViemNoContractDataError(message: string | undefined | null): boolean {
  if (!message) return false;
  return (
    /returned no data/i.test(message) ||
    /address is not a contract/i.test(message) ||
    /contract function .* returned no data/i.test(message)
  );
}

export function stakingReadsEnabled(
  baseEnabled: boolean,
  deploymentStatus: StakingDeploymentStatus,
): boolean {
  return baseEnabled && deploymentStatus === "ready";
}

/** 质押/Registry 面板：先探测链上是否有合约字节码，避免对空地址狂打 `token()` */
export function useStakingContractDeployment(
  address: `0x${string}` | null | undefined,
  chainOk: boolean,
): {
  status: StakingDeploymentStatus;
  chainId: number;
  expectedChainId: number;
} {
  const chainId = useChainId();
  const expectedChainId = getExpectedChainId();
  const probeEnabled = Boolean(address && chainOk);

  const bytecode = useBytecode({
    address: address ?? undefined,
    query: { enabled: probeEnabled },
  });

  let status: StakingDeploymentStatus = "idle";
  if (!probeEnabled) {
    status = "idle";
  } else if (bytecode.isLoading) {
    status = "loading";
  } else if (!bytecode.data || bytecode.data === "0x") {
    status = "missing";
  } else {
    status = "ready";
  }

  return { status, chainId, expectedChainId };
}

/** 向导池在本链无字节码（用于隐藏重复质押/解押面板） */
export function useGuidePoolDeploymentMissing(): boolean {
  const chainId = useChainId();
  const expectedChainId = getExpectedChainId();
  const stakingAddress = getGuideStakingAddress();
  const chainOk = chainId === expectedChainId;
  const { status } = useStakingContractDeployment(stakingAddress, chainOk);
  return status === "missing";
}
