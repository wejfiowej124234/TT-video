"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import type { UserShape } from "@/components/me/constants";

export function useMeSettingsSummary(t: (key: string) => string) {
  const [user, setUser] = useState<UserShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getMe()
      .then((data) => {
        const u = (data as { user?: UserShape })?.user;
        setUser(u ?? null);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("useMeSettingsSummary:", err);
        }
        setError(mapApiReadError(err, t, "common_errorMessage"));
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return { user, loading, error, reload: load };
}
