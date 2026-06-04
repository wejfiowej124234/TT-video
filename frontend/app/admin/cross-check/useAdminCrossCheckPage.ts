import { useEffect, useState } from "react";

import {
  adminFetchErrorKind,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { getAdminCrossCheck, normalizeAdminCrossCheckRead, type NormalizedAdminCrossCheck } from "@/lib/apiClient";

export function useAdminCrossCheckPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [model, setModel] = useState<NormalizedAdminCrossCheck | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminCrossCheck()
      .then((raw) => setModel(normalizeAdminCrossCheckRead(raw)))
      .catch((e: unknown) => {
        logAdminFetch("AdminCrossCheckPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, error, model };
}
