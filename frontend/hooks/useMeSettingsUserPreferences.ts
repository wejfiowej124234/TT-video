"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMeSettingsPreferencesFromApi,
  putMeSettingsPreferencesToApi,
} from "@/lib/me/meSettingsPreferencesApi";
import {
  patchMeSettingsUserPreferences,
  readMeSettingsUserPreferences,
  type MeSettingsUserPreferences,
} from "@/lib/me/meSettingsPreferencesStorage";

export function useMeSettingsUserPreferences(userId: string | null | undefined) {
  const [prefs, setPrefs] = useState<MeSettingsUserPreferences | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncGen = useRef(0);

  useEffect(() => {
    if (!userId) {
      setPrefs(null);
      return;
    }
    let cancelled = false;
    const local = readMeSettingsUserPreferences(userId);
    setPrefs(local);
    void (async () => {
      const remote = await fetchMeSettingsPreferencesFromApi();
      if (cancelled || !remote) return;
      const merged = patchMeSettingsUserPreferences(userId, {
        notification: remote.notification,
        communityVisibility: remote.communityVisibility,
      });
      setPrefs(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!savedFlash) return;
    const timer = window.setTimeout(() => setSavedFlash(false), 2000);
    return () => window.clearTimeout(timer);
  }, [savedFlash]);

  const patch = useCallback(
    (patchIn: Parameters<typeof patchMeSettingsUserPreferences>[1]) => {
      if (!userId) return;
      const next = patchMeSettingsUserPreferences(userId, patchIn);
      setPrefs(next);
      setSavedFlash(true);
      setSyncError(null);
      const gen = ++syncGen.current;
      void putMeSettingsPreferencesToApi(next)
        .then(() => {
          if (syncGen.current === gen) setSyncError(null);
        })
        .catch(() => {
          if (syncGen.current === gen) setSyncError("sync_failed");
        });
    },
    [userId],
  );

  return {
    prefs,
    patch,
    savedFlash,
    syncError,
    ready: Boolean(userId?.trim()) && prefs != null,
  };
}
