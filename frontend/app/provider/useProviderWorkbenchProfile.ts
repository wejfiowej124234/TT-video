"use client";

import { useCallback, useEffect, useState } from "react";
import { getMeMerchantProfile, type MeMerchantProfile } from "@/lib/apiClient/meMerchantProfile";
import { mapApiReadError } from "@/lib/mapApiReadError";

export function useProviderWorkbenchProfile(enabled: boolean, t: (key: string) => string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<MeMerchantProfile | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setProfile(null);
      setError(null);
      setProfileMissing(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await getMeMerchantProfile();
      const p = body.profile ?? null;
      setProfile(p);
      setProfileMissing(p == null);
    } catch (e) {
      setProfile(null);
      setProfileMissing(false);
      setError(mapApiReadError(e, t, "provider_workbench_profile_load_fail"));
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, profileMissing, loading, error, retry: load };
}
