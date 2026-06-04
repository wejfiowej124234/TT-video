import { useCallback, useState } from "react";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

/** 写表单 / Modal 统一 `{ kind, message }` 状态（HON-03）。 */
export function useAdminFormErrorState() {
  const [message, setMessage] = useState<string | null>(null);
  const [kind, setKind] = useState<AdminFetchErrorKind | null>(null);

  const setError = useCallback((errorKind: AdminFetchErrorKind, errorMessage: string) => {
    setKind(errorKind);
    setMessage(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setKind(null);
    setMessage(null);
  }, []);

  return { message, kind, setError, clearError };
}
