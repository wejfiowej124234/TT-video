"use client";

import { useCallback, useEffect, useState } from "react";
import { getMeGuideProfile, type MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { mapApiReadError } from "@/lib/mapApiReadError";

export function usePublishHubGuideRail(enabled: boolean, t: (key: string) => string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<MeGuideProfile | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await getMeGuideProfile();
      setProfile(body.profile ?? null);
    } catch (e) {
      setProfile(null);
      setError(mapApiReadError(e, t, "publish_hub_guide_load_fail"));
    } finally {
      setLoading(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, loading, error, retry: load, hasListing: Boolean(profile?.guide_id?.trim()) };
}
