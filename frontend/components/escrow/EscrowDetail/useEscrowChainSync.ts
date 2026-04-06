"use client";

/**
 * 35 §3.3：托管实例链上事件 → 拉取 API 订单；辅以可见性内轻量轮询（索引器滞后时兜底）。
 */
import { useCallback, useEffect, useRef } from "react";
import { useWatchContractEvent } from "wagmi";
import escrowAbiJson from "@/dapp/abis/Escrow.json";

const ESCROW_ABI = escrowAbiJson as readonly unknown[];

const POLL_MS = 30_000;
const EVENT_DEBOUNCE_MS = 450;

export function useEscrowChainSync(
  escrowAddress: `0x${string}` | undefined,
  enabled: boolean,
  refreshOrder: () => void
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onLogs = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = undefined;
      refreshOrder();
    }, EVENT_DEBOUNCE_MS);
  }, [refreshOrder]);

  const watchEnabled = Boolean(enabled && escrowAddress);

  useWatchContractEvent({
    address: escrowAddress,
    abi: ESCROW_ABI,
    eventName: "Deposited",
    enabled: watchEnabled,
    onLogs,
  });
  useWatchContractEvent({
    address: escrowAddress,
    abi: ESCROW_ABI,
    eventName: "Released",
    enabled: watchEnabled,
    onLogs,
  });
  useWatchContractEvent({
    address: escrowAddress,
    abi: ESCROW_ABI,
    eventName: "Refunded",
    enabled: watchEnabled,
    onLogs,
  });
  useWatchContractEvent({
    address: escrowAddress,
    abi: ESCROW_ABI,
    eventName: "DisputeOpened",
    enabled: watchEnabled,
    onLogs,
  });
  useWatchContractEvent({
    address: escrowAddress,
    abi: ESCROW_ABI,
    eventName: "ResolutionExecuted",
    enabled: watchEnabled,
    onLogs,
  });

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      refreshOrder();
    };
    const id = setInterval(tick, POLL_MS);
    const onVis = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") tick();
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
    }
    return () => {
      clearInterval(id);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis);
      }
    };
  }, [enabled, refreshOrder]);
}
