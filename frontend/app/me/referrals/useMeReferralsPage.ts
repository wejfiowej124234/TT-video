"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { getMeReferrals, type MeReferralsSummary } from "@/lib/apiClient";

export function useMeReferralsPage() {
  const { t } = useTranslation();
  const titleId = useId();
  const [data, setData] = useState<MeReferralsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsLogin(false);
    try {
      const res = await getMeReferrals();
      setData(res.referrals ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      if (msg === "login_required") {
        setNeedsLogin(true);
        setData(null);
        return;
      }
      setError("me_referrals_load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const referralLink = useMemo(() => {
    if (!data?.referral_link_path || typeof window === "undefined") return "";
    return `${window.location.origin}${data.referral_link_path}`;
  }, [data?.referral_link_path]);

  const copyText = useCallback(
    async (text: string, hintKey: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopyHint(hintKey);
        window.setTimeout(() => setCopyHint(null), 2000);
      } catch {
        setCopyHint("me_referrals_copy_failed");
        window.setTimeout(() => setCopyHint(null), 2500);
      }
    },
    [],
  );

  return {
    t,
    titleId,
    data,
    loading,
    error,
    copyHint,
    referralLink,
    reload,
    copyText,
    needsLogin,
  };
}
