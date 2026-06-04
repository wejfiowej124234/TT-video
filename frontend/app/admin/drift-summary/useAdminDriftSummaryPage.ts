import { useEffect, useState } from "react";

import {
  adminFetchErrorKind,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { getAdminDriftSummary, normalizeAdminDriftSummaryRead, type NormalizedAdminDriftSummary } from "@/lib/apiClient";

export function useAdminDriftSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [model, setModel] = useState<NormalizedAdminDriftSummary | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminDriftSummary()
      .then((raw) => setModel(normalizeAdminDriftSummaryRead(raw)))
      .catch((e: unknown) => {
        logAdminFetch("AdminDriftSummaryPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, error, model };
}
