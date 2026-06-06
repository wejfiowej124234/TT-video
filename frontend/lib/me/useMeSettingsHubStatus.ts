"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import { getMeSessions, getWalletVerificationStatus } from "@/lib/apiClient";

import { usePageVisibleReload } from "@/lib/me/usePageVisibleReload";



type MeSessionRow = { revoked_at?: string | null };



export function useMeSettingsHubStatus(enabled: boolean) {

  const [activeSessionCount, setActiveSessionCount] = useState<number | null>(null);

  const [walletVerified, setWalletVerified] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);

  const [failed, setFailed] = useState(false);

  const loadSeq = useRef(0);



  const load = useCallback(async (opts?: { force?: boolean }) => {

    if (!enabled && !opts?.force) return;

    const seq = ++loadSeq.current;

    setLoading(true);

    setFailed(false);

    try {

      const [sessRaw, wallet] = await Promise.all([getMeSessions(), getWalletVerificationStatus()]);

      if (seq !== loadSeq.current) return;

      const items = ((sessRaw as { items?: MeSessionRow[] })?.items ?? []) as MeSessionRow[];

      setActiveSessionCount(items.filter((s) => !s.revoked_at).length);

      setWalletVerified(Boolean(wallet.verified));

    } catch {

      if (seq !== loadSeq.current) return;

      setActiveSessionCount(null);

      setWalletVerified(null);

      setFailed(true);

    } finally {

      if (seq === loadSeq.current) setLoading(false);

    }

  }, [enabled]);



  useEffect(() => {

    void load();

  }, [load]);



  usePageVisibleReload(() => {

    void load();

  }, enabled);



  const reload = useCallback((opts?: { force?: boolean }) => load(opts), [load]);

  return { activeSessionCount, walletVerified, loading, failed, reload };

}

