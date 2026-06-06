"use client";

import { useCallback, useState } from "react";

export type MeSettingsL5ConfirmRequest = {
  titleKey: string;
  descKey: string;
  descVars?: Record<string, string | number>;
  /** 危险操作（登出、删会话等） */
  danger?: boolean;
  confirmLabelKey?: string;
  onConfirm: () => void | Promise<void>;
};

export function useMeSettingsL5Confirm() {
  const [pending, setPending] = useState<MeSettingsL5ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const request = useCallback((req: MeSettingsL5ConfirmRequest) => {
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
