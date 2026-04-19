"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { buildTransparencyBundle, type TransparencyBundleV1 } from "@/lib/trust/buildTransparencyBundle";
import { fingerprintFromTransparencyBundle } from "@/lib/trust/transparencyFingerprint";

export type TransparencyTrustState = "pending" | "verified" | "failed";

const DEFAULT_POLL_MS = 90_000;

type RunMode = "initial" | "poll" | "manual";

/**
 * P-003：自动透明校验 + 持续信任状态 — 挂载与 `refreshKey` 变化时拉取锚点，并按间隔后台重验。
 */
export function useAutoTransparencyVerification(options: {
  t: (k: string) => string;
  /** 业务键变化时重新做一次完整校验（订单/提案/分配 id 等） */
  refreshKey: string;
  pollIntervalMs?: number;
  enabled?: boolean;
}) {
  const { t, refreshKey, pollIntervalMs = DEFAULT_POLL_MS, enabled = true } = options;

  const [trustState, setTrustState] = useState<TransparencyTrustState>("pending");
  const [bundle, setBundle] = useState<TransparencyBundleV1 | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [backgroundBusy, setBackgroundBusy] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const seqRef = useRef(0);

  const execute = useCallback(
    async (mode: RunMode) => {
      const mySeq = ++seqRef.current;
      setIsVerifying(true);
      if (mode === "poll") {
        setBackgroundBusy(true);
      } else if (mode === "manual") {
        setTrustState("pending");
        setError(null);
        setBundle(null);
        setFingerprint(null);
      } else {
        setTrustState("pending");
        setError(null);
        setBundle(null);
        setFingerprint(null);
      }

      try {
        const b = await buildTransparencyBundle();
        const fp = await fingerprintFromTransparencyBundle(b);
        if (mySeq !== seqRef.current) return;
        setBundle(b);
        setFingerprint(fp);
        setError(null);
        setTrustState("verified");
        setLastCheckedAt(new Date().toISOString());
      } catch (e) {
        if (mySeq !== seqRef.current) return;
        setError(mapApiReadError(e, t, "p002_inline_error"));
        setTrustState("failed");
        setBundle(null);
        setFingerprint(null);
      } finally {
        if (mySeq === seqRef.current) {
          setBackgroundBusy(false);
          setIsVerifying(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    if (!enabled) {
      setTrustState("pending");
      return;
    }
    void execute("initial");
  }, [refreshKey, enabled, execute]);

  useEffect(() => {
    if (!enabled || pollIntervalMs <= 0) return;
    const id = window.setInterval(() => {
      void execute("poll");
    }, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [enabled, pollIntervalMs, refreshKey, execute]);

  const refresh = useCallback(() => {
    void execute("manual");
  }, [execute]);

  return {
    trustState,
    bundle,
    fingerprint,
    error,
    lastCheckedAt,
    backgroundBusy,
    isVerifying,
    refresh,
  };
}
