"use client";

import { useCallback, useEffect, useState } from "react";
import { clearGetMeCache, getMe } from "@/lib/apiClient";
import { getMeGuideProfile, type MeGuideProfile } from "@/lib/apiClient/meGuideProfile";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { UserShape } from "@/components/me/constants";
import { meGuideWorkspaceUnlocked } from "@/lib/me/meIdentitySlotVisibility";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";
import { userFromGetMePayload, parseMeTrustFromMeResponse, type MeTrustSummary } from "@/lib/meTrust";
import { isMeEmailVerified } from "@/lib/me/meSettingsUser";
import {
  resolveMeSettingsTrustProgress,
  type MeSettingsTrustProgressView,
} from "@/lib/me/meSettingsTrustProgressModel";

export function useMeSettingsTrustPage(t: (key: string) => string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserShape | null>(null);
  const [trust, setTrust] = useState<MeTrustSummary | null>(null);
  const [guideProfile, setGuideProfile] = useState<MeGuideProfile | null>(null);
  const { ready: slotsReady, slotById } = useMeIdentitySlots();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getMe()
      .then(async (data) => {
        const u = userFromGetMePayload(data);
        setUser(u);
        setTrust(u ? parseMeTrustFromMeResponse(data, u) : null);
        if (!u) {
          setGuideProfile(null);
          return;
        }
        const guideUnlocked = meGuideWorkspaceUnlocked({
          userRole: u.role ?? null,
          guideSlotState: slotsReady ? slotById("guide")?.state ?? null : null,
        });
        if (!guideUnlocked) {
          setGuideProfile(null);
          return;
        }
        try {
          const gp = await getMeGuideProfile();
          setGuideProfile(gp.profile ?? null);
        } catch {
          setGuideProfile(null);
        }
      })
      .catch((err) => {
        setError(mapApiReadError(err, t, "common_errorMessage"));
        setUser(null);
        setTrust(null);
        setGuideProfile(null);
      })
      .finally(() => setLoading(false));
  }, [t, slotsReady, slotById]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onAuthChange = () => {
      clearGetMeCache();
      load();
    };
    window.addEventListener("traveltrust:auth-change", onAuthChange);
    return () => window.removeEventListener("traveltrust:auth-change", onAuthChange);
  }, [load]);

  const emailOk = user != null && isMeEmailVerified(user);
  const guideOperator =
    user != null &&
    slotsReady &&
    meGuideWorkspaceUnlocked({
      userRole: user.role ?? null,
      guideSlotState: slotById("guide")?.state ?? null,
    });
  const progress: MeSettingsTrustProgressView | null =
    user != null && trust != null
      ? resolveMeSettingsTrustProgress({
          emailVerified: emailOk,
          trust,
          t,
          guideOperator,
          guideProfile,
        })
      : null;
  const needsLogin = !loading && !error && user == null;

  return { loading, error, reload: load, user, trust, emailOk, progress, needsLogin, guideOperator };
}
