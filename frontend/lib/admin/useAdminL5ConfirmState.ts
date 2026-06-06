"use client";

import { useCallback, useState } from "react";

import type { AdminL5ConfirmRequest } from "@/lib/admin/adminL5ConfirmTypes";
import { invalidateAdminCachesAfterWrite } from "@/lib/admin/adminPostWriteCacheInvalidation";

export function useAdminL5ConfirmState() {
  const [pending, setPending] = useState<AdminL5ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const request = useCallback((req: AdminL5ConfirmRequest) => {
    setPending(req);
  }, []);

  const cancel = useCallback(() => {
    if (busy) return;
    setPending(null);
  }, [busy]);

  const confirm = useCallback(async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await pending.onConfirm();
      invalidateAdminCachesAfterWrite(pending.invalidateListScopes);
      setPending(null);
    } finally {
      setBusy(false);
    }
  }, [busy, pending]);

  return {
    open: pending !== null,
    busy,
    pending,
    request,
    cancel,
    confirm,
  };
}
